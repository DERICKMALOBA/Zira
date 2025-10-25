import { useEffect, useState } from "react";
import { Download, Filter, X, ChevronUp, ChevronDown } from "lucide-react";
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
    dateRange: "all",
    startDate: "",
    endDate: "",
  });

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase.from("branches").select("id, name");
      if (error) console.error(error);
      else setBranches(data || []);
    };
    fetchBranches();
  }, []);

  // Fetch due loans
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        const { data: loansData, error } = await supabase
          .from("loans")
          .select(`
            id,
            scored_amount,
            total_payable,
            product_name,
            product_type,
            disbursed_at,
            branch_id,
            branch:branch_id(name),
            customer:customer_id(id, "Firstname", "Middlename", "Surname", mobile, id_number),
            loan_officer:booked_by(full_name),
            installments:loan_installments(
              due_date,
              due_amount,
              paid_amount,
              status,
              principal_due,
              interest_due,
              principal_paid,
              interest_paid,
              principal_amount,
              interest_amount
            )
          `)
          .eq("status", "disbursed")
          .order("disbursed_at", { ascending: false });

        if (error) throw error;
const now = new Date();
const todayStr = now.toISOString().split("T")[0]; // e.g., "2025-10-24"

const processed = loansData
  .map((loan) => {
    const cust = loan.customer || {};
    const fullName = [cust.Firstname, cust.Middlename, cust.Surname].filter(Boolean).join(" ");
    const installments = loan.installments || [];

    // Identify due today installments
    const dueToday = installments.filter(
      (i) => i.due_date?.split("T")[0] === todayStr && ["pending", "partial"].includes(i.status)
    );

    // Identify overdue installments
    const overdue = installments.filter(
      (i) => new Date(i.due_date) < now && ["pending", "partial"].includes(i.status)
    );

    // Total due amount today
    const dueTodayAmount = dueToday.reduce((sum, i) => sum + (i.due_amount || 0), 0);

    // Total overdue amount
    const overdueAmount = overdue.reduce((sum, i) => sum + (i.due_amount || 0), 0);

    // General totals
    const totalPaid = installments.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
    const unpaidAmount = (loan.total_payable || 0) - totalPaid;
    if (unpaidAmount <= 0) return null;

    // Next expected installment date
    const unpaidInstallments = installments.filter((i) =>
      ["pending", "partial", "overdue"].includes(i.status)
    );
    unpaidInstallments.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    const expectedDate = unpaidInstallments[0]?.due_date;

    return {
      id: loan.id,
      customerName: fullName || "N/A",
      mobile: cust.mobile || "N/A",
      idNumber: cust.id_number || "N/A",
      loanOfficer: loan.loan_officer?.full_name || "N/A",
      productType: loan.product_type || loan.product_name || "N/A",
      numInstallments: installments.length,
      unpaidInstallmentsCount: unpaidInstallments.length,
      disbursedAmount: loan.scored_amount || 0,
      totalAmountDue: loan.total_payable || 0,
      amountPaid: totalPaid,
      unpaidAmount,
      dueTodayAmount,
      overdueAmount,
      expectedDate,
      disbursementDate: loan.disbursed_at ? loan.disbursed_at.split("T")[0] : "N/A",
      branch: loan.branch?.name || "N/A",
      dueStatus:
        dueTodayAmount > 0
          ? "Due Today"
          : overdueAmount > 0
          ? "Overdue"
          : "Upcoming",
    };
  })
  .filter(Boolean);

        setLoans(processed);
        setFilteredData(processed);
        const uniqueOfficers = [...new Set(processed.map((l) => l.loanOfficer).filter(Boolean))];
        setOfficers(uniqueOfficers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  // Filtering
  useEffect(() => {
    let result = [...loans];
    const { customerQuery, officer, branch, dateRange, startDate, endDate } = filters;
    const now = new Date();
    let start, end;

    switch (dateRange) {
      case "today":
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date();
        break;
      case "week":
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        end = new Date();
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date();
        break;
      case "quarter":
        start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        end = new Date();
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date();
        break;
      case "custom":
        start = startDate ? new Date(startDate) : null;
        end = endDate ? new Date(endDate) : null;
        break;
      default:
        start = null;
        end = null;
    }

    if (customerQuery) {
      const q = customerQuery.toLowerCase();
      result = result.filter(
        (loan) =>
          loan.customerName.toLowerCase().includes(q) ||
          loan.mobile.includes(q) ||
          loan.idNumber.includes(q)
      );
    }

    if (officer) result = result.filter((loan) => loan.loanOfficer === officer);
    if (branch) result = result.filter((loan) => loan.branch === branch);

    if (start && end)
      result = result.filter((loan) => {
        const d = new Date(loan.disbursementDate);
        return d >= start && d <= end;
      });

    setFilteredData(result);
    setCurrentPage(1);
  }, [filters, loans]);

  const formatCurrency = (num) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(num || 0);

  const clearFilters = () =>
    setFilters({ customerQuery: "", officer: "", branch: "", dateRange: "all", startDate: "", endDate: "" });

  const SortableHeader = ({ label, sortKey }) => (
    <th
      onClick={() =>
        setSortConfig((prev) => ({
          key: sortKey,
          direction: prev.key === sortKey && prev.direction === "asc" ? "desc" : "asc",
        }))
      }
      className="px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap text-left"
    >
      <div className="flex items-center gap-2">
        {label}
        {sortConfig.key === sortKey && (sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
      </div>
    </th>
  );

  const groupedData = filteredData.reduce((groups, loan) => {
    if (!groups[loan.branch]) groups[loan.branch] = { branch: loan.branch, totalUnpaidAmount: 0, loans: [] };
    groups[loan.branch].totalUnpaidAmount += loan.unpaidAmount;
    groups[loan.branch].loans.push(loan);
    return groups;
  }, {});

  const getCurrentPageData = () => {
    const allRows = [];
    let globalIndex = 0;
    let branchNumber = 1;

    Object.values(groupedData).forEach((group) => {
      group.loans.forEach((loan, idx) => {
        globalIndex++;
        if (globalIndex > (currentPage - 1) * itemsPerPage && globalIndex <= currentPage * itemsPerPage) {
          allRows.push({
            ...loan,
            branchNumber: idx === 0 ? branchNumber : "",
            isFirstInBranch: idx === 0,
            branchTotalUnpaidAmount: group.totalUnpaidAmount,
            rowNumber: globalIndex,
          });
        }
      });
      branchNumber++;
    });

    return allRows;
  };

  const currentData = getCurrentPageData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-900">Loan Due Report</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium ${
              showFilters ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Filter Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by name, mobile, or ID..."
              value={filters.customerQuery}
              onChange={(e) => setFilters((p) => ({ ...p, customerQuery: e.target.value }))}
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.officer}
              onChange={(e) => setFilters((p) => ({ ...p, officer: e.target.value }))}
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Officers</option>
              {officers.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <select
              value={filters.branch}
              onChange={(e) => setFilters((p) => ({ ...p, branch: e.target.value }))}
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {(filters.customerQuery || filters.officer || filters.branch) && (
            <button
              onClick={clearFilters}
              className="text-red-600 text-sm font-medium flex items-center gap-1 mt-2 hover:text-red-700"
            >
              <X className="w-4 h-4" /> Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading due loans...</div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">No.</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Branch</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Total Due</th>
                  <SortableHeader label="Customer Name" sortKey="customerName" />
                  <SortableHeader label="Mobile" sortKey="mobile" />
                  <SortableHeader label="ID" sortKey="idNumber" />
                  <SortableHeader label="Loan Officer" sortKey="loanOfficer" />
                  <SortableHeader label="Product Type" sortKey="productType" />
                  <SortableHeader label="Installments" sortKey="unpaidInstallmentsCount" />
                  <SortableHeader label="Disbursed Amount" sortKey="disbursedAmount" />
                  <SortableHeader label="Principal Due" sortKey="principalDue" />
                  <SortableHeader label="Interest Due" sortKey="interestDue" />
                  <SortableHeader label="Total Paid" sortKey="amountPaid" />
                  <SortableHeader label="Total Unpaid" sortKey="unpaidAmount" />
                  <SortableHeader label="Expected Date" sortKey="expectedDate" />
                  <SortableHeader label="Disbursement Date" sortKey="disbursementDate" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentData.map((loan) => (
                  <tr key={loan.id} className={`hover:bg-gray-50 ${loan.dueStatus === "Overdue" ? "bg-red-50" : ""}`}>
                    <td className="px-6 py-4 text-center">{loan.branchNumber}</td>
                    <td className="px-6 py-4 font-semibold">{loan.isFirstInBranch ? loan.branch : ""}</td>
                    <td className="px-6 py-4 text-right text-red-700 font-semibold">
                      {loan.isFirstInBranch ? formatCurrency(loan.branchTotalUnpaidAmount) : ""}
                    </td>
                    <td className="px-6 py-4">{loan.customerName}</td>
                    <td className="px-6 py-4">{loan.mobile}</td>
                    <td className="px-6 py-4">{loan.idNumber}</td>
                    <td className="px-6 py-4">{loan.loanOfficer}</td>
                    <td className="px-6 py-4">{loan.productType}</td>
                    <td className="px-6 py-4 text-center">
                      {loan.unpaidInstallmentsCount}/{loan.numInstallments}
                    </td>
                    <td className="px-6 py-4 text-right">{formatCurrency(loan.disbursedAmount)}</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">{formatCurrency(loan.principalDue)}</td>
                    <td className="px-6 py-4 text-right text-yellow-600 font-medium">{formatCurrency(loan.interestDue)}</td>
                    <td className="px-6 py-4 text-right text-green-700 font-semibold">{formatCurrency(loan.amountPaid)}</td>
                    <td className="px-6 py-4 text-right text-red-700 font-semibold">{formatCurrency(loan.unpaidAmount)}</td>
                    <td className="px-6 py-4">{loan.expectedDate}</td>
                    <td className="px-6 py-4">{loan.disbursementDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanDueReport;
