import { useEffect, useState } from "react";
import { Download, Filter, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "../../supabaseClient";

const LoanDueReport = () => {
  const [loans, setLoans] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filters, setFilters] = useState({
    customerQuery: "",
    officer: "",
    branch: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  // ✅ Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name");

      if (error) console.error("Error fetching branches:", error.message);
      else setBranches(data || []);
    };

    fetchBranches();
  }, []);

  // ✅ Fetch loans with branch relation
  useEffect(() => {
    const fetchDueLoans = async () => {
      try {
        setLoading(true);

        const { data: loansData, error } = await supabase
          .from("loans")
          .select(
            `
            id,
            scored_amount,
            total_payable,
            product_name,
            product_type,
            disbursed_date,
            disbursed_by,
            branch_id,
            branch:branch_id(name),
            customer:customer_id(
              id,
              "Firstname",
              "Middlename",
              "Surname",
              mobile,
              id_number
            ),
            loan_officer:disbursed_by(full_name),
            installments:loan_installments(
              due_date,
              due_amount,
              paid_amount,
              status,
              days_overdue
            )
          `
          )
          .eq("status", "disbursed")
          .order("disbursed_date", { ascending: false });

        if (error) throw error;

        const now = new Date();

        // ✅ Process due loans
        const dueLoans = loansData
          .map((loan) => {
            const cust = loan.customer || {};
            const fullName = [cust.Firstname, cust.Middlename, cust.Surname]
              .filter(Boolean)
              .join(" ");

            const installments = loan.installments || [];

            const relevantInst = installments.filter((inst) => {
              const dueDate = new Date(inst.due_date);
              const isUnpaid = (inst.paid_amount || 0) < (inst.due_amount || 0);
              const isOverdue = dueDate < now && isUnpaid;
              const isUpcoming = dueDate >= now && isUnpaid;
              return isOverdue || isUpcoming;
            });

            if (relevantInst.length === 0) return null;

            const totalPaid = installments.reduce(
              (sum, i) => sum + (i.paid_amount || 0),
              0
            );
            const unpaidAmount = (loan.total_payable || 0) - totalPaid;

            if (unpaidAmount <= 0) return null;

            relevantInst.sort(
              (a, b) => new Date(a.due_date) - new Date(b.due_date)
            );
            const expectedDate = relevantInst[0]?.due_date;

            return {
              id: loan.id,
              customerName: fullName || "N/A",
              mobile: cust.mobile || "N/A",
              idNumber: cust.id_number || "N/A",
              loanOfficer: loan.loan_officer?.full_name || "N/A",
              productType: loan.product_type || loan.product_name || "N/A",
              numInstallments: installments.length,
              disbursedAmount: loan.scored_amount || 0,
              totalAmountDue: loan.total_payable || 0,
              amountPaid: totalPaid,
              unpaidAmount,
              expectedDate,
              disbursementDate: loan.disbursed_date
                ? loan.disbursed_date.split("T")[0]
                : "N/A",
              branch: loan.branch?.name || "N/A",
              dueStatus: new Date(expectedDate) < now ? "Overdue" : "Upcoming",
            };
          })
          .filter(Boolean);

        setLoans(dueLoans);
        setFilteredData(dueLoans);
        
        // Extract unique officers
        const uniqueOfficers = [...new Set(dueLoans.map(l => l.loanOfficer).filter(o => o !== "N/A"))];
        setOfficers(uniqueOfficers);
      } catch (err) {
        console.error("Error fetching due loans:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDueLoans();
  }, []);

  // ✅ Filtering logic
  useEffect(() => {
    let result = [...loans];
    const { customerQuery, officer, branch, startDate, endDate, status } = filters;

    if (customerQuery) {
      const q = customerQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.customerName.toLowerCase().includes(q) ||
          item.mobile.includes(q) ||
          item.idNumber.includes(q)
      );
    }

    if (officer)
      result = result.filter(
        (item) => item.loanOfficer === officer
      );

    if (branch)
      result = result.filter(
        (item) => item.branch === branch
      );

    if (status)
      result = result.filter(
        (item) => item.dueStatus === status
      );

    if (startDate)
      result = result.filter(
        (item) => new Date(item.disbursementDate) >= new Date(startDate)
      );

    if (endDate)
      result = result.filter(
        (item) => new Date(item.disbursementDate) <= new Date(endDate)
      );

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(result);
    setCurrentPage(1);
  }, [filters, loans, sortConfig]);

  // ✅ Sorting
  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const SortableHeader = ({ label, sortKey }) => (
    <th
      onClick={() => handleSort(sortKey)}
      className="px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap text-left"
    >
      <div className="flex items-center gap-2">
        {label}
        {sortConfig.key === sortKey && (
          sortConfig.direction === "asc" ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  // ✅ CSV Export
  const exportToCSV = (data, filename) => {
    if (!data.length) return alert("No data to export");

    const headers = [
      "#",
      "Customer Name",
      "Mobile",
      "ID",
      "Loan Officer",
      "Branch",
      "Product Type",
      "Installments",
      "Disbursed Amount",
      "Total Amount Due",
      "Amount Paid",
      "Unpaid Amount",
      "Expected Date",
      "Disbursement Date",
      "Status",
    ];

    const rows = data.map((item, i) => [
      i + 1,
      `"${item.customerName}"`,
      item.mobile,
      item.idNumber,
      item.loanOfficer,
      item.branch,
      item.productType,
      item.numInstallments,
      item.disbursedAmount,
      item.totalAmountDue,
      item.amountPaid,
      item.unpaidAmount,
      item.expectedDate,
      item.disbursementDate,
      item.dueStatus,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(num || 0);

  const clearFilters = () =>
    setFilters({
      customerQuery: "",
      officer: "",
      branch: "",
      startDate: "",
      endDate: "",
      status: "",
    });

  // ✅ Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentData = filteredData.slice(startIdx, endIdx);

  // ✅ Totals
  const totals = {
    unpaidAmount: filteredData.reduce((sum, i) => sum + i.unpaidAmount, 0),
    amountPaid: filteredData.reduce((sum, i) => sum + i.amountPaid, 0),
    totalAmountDue: filteredData.reduce((sum, i) => sum + i.totalAmountDue, 0),
  };

  const overdueCount = filteredData.filter(i => i.dueStatus === "Overdue").length;
  const upcomingCount = filteredData.filter(i => i.dueStatus === "Upcoming").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Loan Due Report</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium ${
              showFilters ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>

          <button
            onClick={() =>
              exportToCSV(filteredData, `loan_due_report_${Date.now()}.csv`)
            }
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Filter Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by name, mobile, or ID..."
              value={filters.customerQuery}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  customerQuery: e.target.value,
                }))
              }
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.officer}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  officer: e.target.value,
                }))
              }
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Officers</option>
              {officers.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>

            <select
              value={filters.branch}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, branch: e.target.value }))
              }
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Overdue">Overdue</option>
              <option value="Upcoming">Upcoming</option>
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(filters.customerQuery || filters.officer || filters.branch || filters.startDate || filters.endDate || filters.status) && (
            <button 
              onClick={clearFilters} 
              className="text-red-600 text-sm font-medium flex items-center gap-1 mt-2 hover:text-red-700"
            >
              <X className="w-4 h-4" /> Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Data Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Unpaid</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totals.unpaidAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Upcoming</p>
          <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading due loans...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700 text-left whitespace-nowrap">#</th>
                    <SortableHeader label="Customer Name" sortKey="customerName" />
                    <SortableHeader label="Mobile" sortKey="mobile" />
                    <SortableHeader label="ID" sortKey="idNumber" />
                    <SortableHeader label="Loan Officer" sortKey="loanOfficer" />
                    <SortableHeader label="Branch" sortKey="branch" />
                    <SortableHeader label="Product Type" sortKey="productType" />
                    <SortableHeader label="Installments" sortKey="numInstallments" />
                    <SortableHeader label="Disbursed Amount" sortKey="disbursedAmount" />
                    <SortableHeader label="Total Due" sortKey="totalAmountDue" />
                    <SortableHeader label="Paid" sortKey="amountPaid" />
                    <SortableHeader label="Unpaid" sortKey="unpaidAmount" />
                    <SortableHeader label="Expected Date" sortKey="expectedDate" />
                    <SortableHeader label="Disbursement Date" sortKey="disbursementDate" />
                    <SortableHeader label="Status" sortKey="dueStatus" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentData.map((loan, i) => (
                    <tr
                      key={i}
                      className={`hover:bg-gray-50 transition-colors ${
                        loan.dueStatus === "Overdue" ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{startIdx + i + 1}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{loan.customerName}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.mobile}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.idNumber}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.loanOfficer}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.branch}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.productType}</td>
                      <td className="px-6 py-4 text-center text-gray-700 whitespace-nowrap">
                        {loan.numInstallments}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 font-medium whitespace-nowrap">
                        {formatCurrency(loan.disbursedAmount)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 font-medium whitespace-nowrap">
                        {formatCurrency(loan.totalAmountDue)}
                      </td>
                      <td className="px-6 py-4 text-right text-green-700 font-semibold whitespace-nowrap">
                        {formatCurrency(loan.amountPaid)}
                      </td>
                      <td className="px-6 py-4 text-right text-red-700 font-semibold whitespace-nowrap">
                        {formatCurrency(loan.unpaidAmount)}
                      </td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.expectedDate}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.disbursementDate}</td>
                      <td
                        className={`px-6 py-4 font-semibold whitespace-nowrap ${
                          loan.dueStatus === "Overdue"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {loan.dueStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{startIdx + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(endIdx, filteredData.length)}</span> of{' '}
                <span className="font-semibold">{filteredData.length}</span> records
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoanDueReport;