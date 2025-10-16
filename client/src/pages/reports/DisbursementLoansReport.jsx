import { useState, useEffect } from "react";
import { Download, Printer, Filter, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "../../supabaseClient";

const DisbursementLoansReport = () => {
  const [disbursedLoans, setDisbursedLoans] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    branch: "",
    officer: "",
    ro: "",
    startDate: "",
    endDate: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // ✅ Fetch disbursed loans
  useEffect(() => {
    const fetchDisbursedLoans = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("loans")
          .select(`
            id,
            scored_amount,
            total_interest,
            total_payable,
            product_name,
            product_type,
            disbursed_date,
            repayment_state,
            status,
            branch:branch_id(name),
            loan_officer:users!loans_disbursed_by_fkey(full_name),
            customer:customer_id(
              id,
              "Firstname",
              "Middlename",
              "Surname",
              mobile,
              id_number,
              business_name,
              business_type,
              ro:users!customers_created_by_fkey(full_name)
            ),
            mpesa:mpesa_b2c_transactions(transaction_id),
            installments:loan_installments(
              due_date,
              status
            )
          `)
          .in("status", ["disbursed"])
          .order("disbursed_date", { ascending: false });

        if (error) throw error;

        const formatted = data.map((loan) => {
          const customer = loan.customer || {};
          const fullName = [customer.Firstname, customer.Middlename, customer.Surname]
            .filter(Boolean)
            .join(" ");
          const relationshipOfficer = customer.ro?.full_name || "N/A";

          const nextPayment =
            loan.installments?.find((i) => i.status === "pending")?.due_date || "N/A";

          return {
            id: loan.id,
            loanNumber: `LN${String(loan.id).padStart(3, "0")}`,
            branch: loan.branch?.name || "N/A",
            loanOfficer: loan.loan_officer?.full_name || "N/A",
            relationshipOfficer,
            customerName: fullName || "N/A",
            idNumber: customer.id_number || "N/A",
            mobile: customer.mobile || "N/A",
            businessDescription: `${customer.business_name || ""} - ${customer.business_type || ""}`,
            productName: loan.product_name || "N/A",
            productType: loan.product_type || "N/A",
            mpesaTransaction: loan.mpesa?.[0]?.transaction_id || "N/A",
            appliedAmount: loan.scored_amount || 0,
            disbursedAmount: loan.total_payable || 0,
            interestAmount: loan.total_interest || 0,
            repaymentStatus: loan.repayment_state || "N/A",
            disbursedDate: loan.disbursed_date || "N/A",
            nextPayment,
          };
        });

        setDisbursedLoans(formatted);
        setFilteredData(formatted);
      } catch (err) {
        console.error("Error fetching disbursed loans:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDisbursedLoans();
  }, []);

  // ✅ Filter logic
  useEffect(() => {
    let result = [...disbursedLoans];
    const q = filters.search.toLowerCase();

    if (filters.search) {
      result = result.filter(
        (i) =>
          i.customerName.toLowerCase().includes(q) ||
          i.loanNumber.toLowerCase().includes(q) ||
          i.mobile.includes(q)
      );
    }

    if (filters.branch) result = result.filter((i) => i.branch === filters.branch);
    if (filters.officer) result = result.filter((i) => i.loanOfficer === filters.officer);
    if (filters.ro) result = result.filter((i) => i.relationshipOfficer === filters.ro);
    if (filters.status) result = result.filter((i) => i.repaymentStatus === filters.status);

    if (filters.startDate)
      result = result.filter(
        (i) => new Date(i.disbursedDate) >= new Date(filters.startDate)
      );
    if (filters.endDate)
      result = result.filter(
        (i) => new Date(i.disbursedDate) <= new Date(filters.endDate)
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
  }, [filters, disbursedLoans, sortConfig]);

  // ✅ Utility Functions
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const SortableHeader = ({ label, sortKey }) => (
    <th
      onClick={() => handleSort(sortKey)}
      className="px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
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

  const exportToCSV = (data, filename) => {
    if (data.length === 0) return alert("No data to export");
    const headers = [
      "No.",
      "Loan Number",
      "Branch",
      "Loan Officer",
      "RO",
      "Customer",
      "ID",
      "Mobile",
      "Product",
      "Applied",
      "Disbursed",
      "Mpesa Transaction",
      "Interest",
      "Repayment Status",
      "Next Payment",
      "Disbursed Date",
    ];

    const csv = [
      headers.join(","),
      ...data.map((item, index) =>
        [
          index + 1,
          item.loanNumber,
          item.branch,
          item.loanOfficer,
          item.relationshipOfficer,
          `"${item.customerName}"`,
          item.idNumber,
          item.mobile,
          item.productType,
          item.appliedAmount,
          item.disbursedAmount,
          item.mpesaTransaction,
          item.interestAmount,
          item.repaymentStatus,
          item.nextPayment,
          item.disbursedDate,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    exportToCSV(filteredData, `loan-disbursement-report-${timestamp}.csv`);
  };

  const handlePrint = () => window.print();
  const handleFilterChange = (key, value) => setFilters((p) => ({ ...p, [key]: value }));
  const clearFilters = () =>
    setFilters({
      search: "",
      branch: "",
      officer: "",
      ro: "",
      startDate: "",
      endDate: "",
      status: "",
    });

  // ✅ Dropdown options
  const branches = [...new Set(disbursedLoans.map((i) => i.branch).filter(b => b !== "N/A"))];
  const officers = [...new Set(disbursedLoans.map((i) => i.loanOfficer).filter(o => o !== "N/A"))];
  const ros = [...new Set(disbursedLoans.map((i) => i.relationshipOfficer).filter(r => r !== "N/A"))];
  const statuses = [...new Set(disbursedLoans.map((i) => i.repaymentStatus).filter(s => s !== "N/A"))];

  // ✅ Totals for filtered data
  const totals = {
    disbursedAmount: filteredData.reduce((sum, i) => sum + i.disbursedAmount, 0),
    interestAmount: filteredData.reduce((sum, i) => sum + i.interestAmount, 0),
    appliedAmount: filteredData.reduce((sum, i) => sum + i.appliedAmount, 0),
  };

  // ✅ Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentData = filteredData.slice(startIdx, endIdx);

  if (loading)
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Fetching disbursed loans...</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Disbursement Loans Report</h2>
          {/* <p className="text-gray-600 text-sm mt-1">View and manage all disbursed loans</p> */}
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
            onClick={handlePrint} 
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button 
            onClick={handleExport} 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* FILTER SECTION */}
      {showFilters && (
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Filter Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search name, loan #, or phone"
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select 
              value={filters.branch} 
              onChange={(e) => handleFilterChange("branch", e.target.value)} 
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select 
              value={filters.officer} 
              onChange={(e) => handleFilterChange("officer", e.target.value)} 
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Officers</option>
              {officers.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <select 
              value={filters.ro} 
              onChange={(e) => handleFilterChange("ro", e.target.value)} 
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All ROs</option>
              {ros.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input 
              type="date" 
              value={filters.startDate} 
              onChange={(e) => handleFilterChange("startDate", e.target.value)} 
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input 
              type="date" 
              value={filters.endDate} 
              onChange={(e) => handleFilterChange("endDate", e.target.value)} 
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange("status", e.target.value)} 
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {(filters.search || filters.branch || filters.officer || filters.ro || filters.startDate || filters.endDate || filters.status) && (
            <button 
              onClick={clearFilters} 
              className="text-red-600 text-sm font-medium flex items-center gap-1 mt-2 hover:text-red-700"
            >
              <X className="w-4 h-4" /> Clear Filters
            </button>
          )}
        </div>
      )}

      {/* DATA SUMMARY */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Applied</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.appliedAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Disbursed</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.disbursedAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Interest</p>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(totals.interestAmount)}</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {filteredData.length === 0 ? (
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
                    <SortableHeader label="Loan No" sortKey="loanNumber" />
                    <SortableHeader label="Branch" sortKey="branch" />
                    <SortableHeader label="Loan Officer" sortKey="loanOfficer" />
                    <SortableHeader label="RO" sortKey="relationshipOfficer" />
                    <SortableHeader label="Customer" sortKey="customerName" />
                    <SortableHeader label="ID" sortKey="idNumber" />
                    <SortableHeader label="Mobile" sortKey="mobile" />
                    <SortableHeader label="Product" sortKey="productType" />
                    <SortableHeader label="Applied" sortKey="appliedAmount" />
                    <SortableHeader label="Disbursed" sortKey="disbursedAmount" />
                    <SortableHeader label="Mpesa Txn" sortKey="mpesaTransaction" />
                    <SortableHeader label="Interest" sortKey="interestAmount" />
                    <SortableHeader label="Repayment Status" sortKey="repaymentStatus" />
                    <SortableHeader label="Next Payment" sortKey="nextPayment" />
                    <SortableHeader label="Disbursed Date" sortKey="disbursedDate" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentData.map((loan, index) => (
                    <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{startIdx + index + 1}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{loan.loanNumber}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.branch}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.loanOfficer}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.relationshipOfficer}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{loan.customerName}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.idNumber}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.mobile}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.productType}</td>
                      <td className="px-6 py-4 text-right text-gray-900 font-medium whitespace-nowrap">{formatCurrency(loan.appliedAmount)}</td>
                      <td className="px-6 py-4 text-right text-gray-900 font-semibold whitespace-nowrap">{formatCurrency(loan.disbursedAmount)}</td>
                      <td className="px-6 py-4 text-center text-gray-700 whitespace-nowrap text-sm">{loan.mpesaTransaction}</td>
                      <td className="px-6 py-4 text-right text-gray-900 font-medium whitespace-nowrap">{formatCurrency(loan.interestAmount)}</td>
                      <td className={`px-6 py-4 font-medium whitespace-nowrap ${
                        loan.repaymentStatus === "Fully Paid"
                          ? "text-green-600"
                          : loan.repaymentStatus === "Partially Paid"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}>
                        {loan.repaymentStatus}
                      </td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.nextPayment}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{loan.disbursedDate}</td>
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

export default DisbursementLoansReport;