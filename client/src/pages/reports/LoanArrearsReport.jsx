import React, { useState, useEffect } from "react";
import { Download, Filter, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search } from "lucide-react";
import { supabase } from "../../supabaseClient";

const LoanArrearsReport = () => {
  const [arrears, setArrears] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [branches, setBranches] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filters, setFilters] = useState({
    search: "",
    branch: "",
    officer: "",
    minDays: "",
  });

  useEffect(() => {
    fetchArrears();
  }, []);

  const fetchArrears = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("loan_installments")
        .select(`
          id,
          loan_id,
          installment_number,
          due_date,
          due_amount,
          principal_amount,
          interest_amount,
          paid_amount,
          status,
          days_overdue,
          loan:loan_id (
            id,
            disbursed_date,
            duration_weeks,
            product_name,
            total_payable,
            total_interest,
            scored_amount,
            disbursed_by,
            disbursed_at,
            branch:branch_id(name),
            customer:customer_id(
              Firstname,
              Middlename,
              Surname,
              mobile,
              id_number
            ),
            created_at
          )
        `)
        .in("status", ["overdue", "partial"])
        .order("due_date", { ascending: false });

      if (error) throw error;

      const today = new Date();
      const arrearsWithCalc = data.map((inst) => {
        const {
          loan,
          due_date,
          principal_amount,
          interest_amount,
          paid_amount,
          days_overdue,
        } = inst;

        const totalDue = Number(principal_amount) + Number(interest_amount);
        const arrearsAmount = totalDue - Number(paid_amount || 0);
        const overdueDays =
          days_overdue ||
          Math.max(0, Math.floor((today - new Date(due_date)) / (1000 * 60 * 60 * 24)));

        return {
          id: inst.id,
          customer_name: [
            loan?.customer?.Firstname,
            loan?.customer?.Middlename,
            loan?.customer?.Surname,
          ]
            .filter(Boolean)
            .join(" "),
          mobile: loan?.customer?.mobile || "N/A",
          id_number: loan?.customer?.id_number || "N/A",
          branch_name: loan?.branch?.name || "N/A",
          loan_officer: loan?.disbursed_by || "N/A",
          loan_product: loan?.product_name || "N/A",
          disbursed_amount: loan?.scored_amount || 0,
          amount_due: totalDue,
          interest_due: interest_amount,
          total_loan_amount: loan?.total_payable || 0,
          total_outstanding: loan?.total_payable - (loan?.paid_amount || 0),
          arrears_amount: arrearsAmount,
          current_due_date: due_date,
          total_paid: paid_amount || 0,
          overdue_days: overdueDays,
          installment_number: inst.installment_number,
          loan_start_date: loan?.disbursed_date || loan?.created_at,
          loan_end_date: loan?.duration_weeks
            ? new Date(
                new Date(loan?.disbursed_date).getTime() +
                  loan?.duration_weeks * 7 * 24 * 60 * 60 * 1000
              ).toISOString()
            : "N/A",
        };
      });

      setArrears(arrearsWithCalc);
      setFiltered(arrearsWithCalc);

      const uniqueBranches = [...new Set(arrearsWithCalc.map(r => r.branch_name).filter(b => b !== "N/A"))];
      setBranches(uniqueBranches);

      const uniqueOfficers = [...new Set(arrearsWithCalc.map(r => r.loan_officer).filter(o => o !== "N/A"))];
      setOfficers(uniqueOfficers);
    } catch (err) {
      console.error("Error fetching arrears report:", err.message);
      setErrorMsg("Failed to load Loan Arrears Report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filters and sorting
  useEffect(() => {
    let result = [...arrears];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((r) =>
        r.customer_name.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.id_number.includes(q)
      );
    }

    if (filters.branch) {
      result = result.filter((r) => r.branch_name === filters.branch);
    }

    if (filters.officer) {
      result = result.filter((r) => r.loan_officer === filters.officer);
    }

    if (filters.minDays) {
      result = result.filter((r) => r.overdue_days >= Number(filters.minDays));
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFiltered(result);
    setCurrentPage(1);
  }, [filters, arrears, sortConfig]);

  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const SortableHeader = ({ label, sortKey }) => (
    <th
      onClick={() => handleSort(sortKey)}
      className="px-4 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap text-left text-sm"
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

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilters = () =>
    setFilters({ search: "", branch: "", officer: "", minDays: "" });

  const formatCurrency = (num) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(num || 0);

  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert("No data to export");
      return;
    }

    const csv = [
      [
        "No",
        "Customer Name",
        "Mobile",
        "ID Number",
        "Branch",
        "Loan Officer",
        "Loan Product",
        "Disbursed Amount",
        "Amount Due",
        "Interest Due",
        "Total Loan Amount",
        "Outstanding Balance",
        "Arrears Amount",
        "Current Due Date",
        "Total Paid",
        "Overdue Days",
        "Installment #",
        "Loan Start Date",
        "Loan End Date",
      ],
      ...filtered.map((r, i) => [
        i + 1,
        `"${r.customer_name}"`,
        r.mobile,
        r.id_number,
        r.branch_name,
        r.loan_officer,
        r.loan_product,
        r.disbursed_amount.toFixed(2),
        r.amount_due.toFixed(2),
        r.interest_due.toFixed(2),
        r.total_loan_amount.toFixed(2),
        r.total_outstanding.toFixed(2),
        r.arrears_amount.toFixed(2),
        new Date(r.current_due_date).toLocaleDateString(),
        r.total_paid.toFixed(2),
        r.overdue_days,
        r.installment_number,
        new Date(r.loan_start_date).toLocaleDateString(),
        r.loan_end_date !== "N/A" ? new Date(r.loan_end_date).toLocaleDateString() : "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loan_arrears_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentData = filtered.slice(startIdx, endIdx);

  // Totals
  const totals = {
    arrearsAmount: filtered.reduce((sum, r) => sum + r.arrears_amount, 0),
    totalDue: filtered.reduce((sum, r) => sum + r.amount_due, 0),
    severeArrears: filtered.filter(r => r.overdue_days > 30).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Loan Arrears Report</h2>
          <p className="text-gray-600 text-sm mt-1">Track and manage overdue and partial payment installments</p>
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
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Filter Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by customer, ID, or mobile..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filters.branch}
              onChange={(e) => handleFilterChange("branch", e.target.value)}
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={filters.officer}
              onChange={(e) => handleFilterChange("officer", e.target.value)}
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Officers</option>
              {officers.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>

            <select
              value={filters.minDays}
              onChange={(e) => handleFilterChange("minDays", e.target.value)}
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Overdue Days</option>
              <option value="1">1+ Days</option>
              <option value="7">7+ Days</option>
              <option value="14">14+ Days</option>
              <option value="30">30+ Days</option>
              <option value="60">60+ Days</option>
            </select>
          </div>
          {(filters.search || filters.branch || filters.officer || filters.minDays) && (
            <button
              onClick={clearFilters}
              className="text-red-600 text-sm font-medium flex items-center gap-1 mt-2 hover:text-red-700"
            >
              <X className="w-4 h-4" /> Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Data Summary */}
      {!loading && !errorMsg && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Total Arrears Records</p>
            <p className="text-2xl font-bold text-red-600">{filtered.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Total Arrears Amount</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totals.arrearsAmount)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Severe Arrears (30+ Days)</p>
            <p className="text-2xl font-bold text-red-700">{totals.severeArrears}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Total Amount Due</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalDue)}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading arrears data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No arrears found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-4 font-semibold text-gray-700 text-left whitespace-nowrap">#</th>
                    <SortableHeader label="Customer Name" sortKey="customer_name" />
                    <SortableHeader label="Mobile" sortKey="mobile" />
                    <SortableHeader label="ID Number" sortKey="id_number" />
                    <SortableHeader label="Branch" sortKey="branch_name" />
                    <SortableHeader label="Loan Officer" sortKey="loan_officer" />
                    <SortableHeader label="Product" sortKey="loan_product" />
                    <SortableHeader label="Disbursed Amount" sortKey="disbursed_amount" />
                    <SortableHeader label="Amount Due" sortKey="amount_due" />
                    <SortableHeader label="Interest Due" sortKey="interest_due" />
                    <SortableHeader label="Total Loan" sortKey="total_loan_amount" />
                    <SortableHeader label="Outstanding" sortKey="total_outstanding" />
                    <SortableHeader label="Arrears Amount" sortKey="arrears_amount" />
                    <SortableHeader label="Due Date" sortKey="current_due_date" />
                    <SortableHeader label="Total Paid" sortKey="total_paid" />
                    <SortableHeader label="Overdue Days" sortKey="overdue_days" />
                    <SortableHeader label="Installment #" sortKey="installment_number" />
                    <SortableHeader label="Loan Start" sortKey="loan_start_date" />
                    <SortableHeader label="Loan End" sortKey="loan_end_date" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentData.map((row, i) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-gray-900 font-medium whitespace-nowrap">{startIdx + i + 1}</td>
                      <td className="px-4 py-4 text-gray-900 font-medium whitespace-nowrap">{row.customer_name}</td>
                      <td className="px-4 py-4 text-gray-700 whitespace-nowrap">{row.mobile}</td>
                      <td className="px-4 py-4 text-gray-700 whitespace-nowrap">{row.id_number}</td>
                      <td className="px-4 py-4 text-gray-700 whitespace-nowrap">{row.branch_name}</td>
                      <td className="px-4 py-4 text-gray-700 whitespace-nowrap">{row.loan_officer}</td>
                      <td className="px-4 py-4 text-gray-700 whitespace-nowrap">{row.loan_product}</td>
                      <td className="px-4 py-4 text-right text-gray-900 whitespace-nowrap">{formatCurrency(row.disbursed_amount)}</td>
                      <td className="px-4 py-4 text-right text-gray-900 whitespace-nowrap">{formatCurrency(row.amount_due)}</td>
                      <td className="px-4 py-4 text-right text-gray-900 whitespace-nowrap">{formatCurrency(row.interest_due)}</td>
                      <td className="px-4 py-4 text-right text-gray-900 whitespace-nowrap">{formatCurrency(row.total_loan_amount)}</td>
                      <td className="px-4 py-4 text-right text-gray-900 whitespace-nowrap">{formatCurrency(row.total_outstanding)}</td>
                      <td className="px-4 py-4 text-right text-red-700 font-semibold whitespace-nowrap">{formatCurrency(row.arrears_amount)}</td>
                      <td className="px-4 py-4 text-gray-700 whitespace-nowrap">{new Date(row.current_due_date).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-right text-green-700 font-semibold whitespace-nowrap">{formatCurrency(row.total_paid)}</td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          row.overdue_days <= 7 ? 'bg-yellow-100 text-yellow-800' :
                          row.overdue_days <= 30 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.overdue_days}d
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 whitespace-nowrap">{row.installment_number}</td>
                      <td className="px-4 py-4 text-gray-700 whitespace-nowrap">{new Date(row.loan_start_date).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-gray-700 whitespace-nowrap">
                        {row.loan_end_date !== "N/A" ? new Date(row.loan_end_date).toLocaleDateString() : "N/A"}
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
                <span className="font-semibold">{Math.min(endIdx, filtered.length)}</span> of{' '}
                <span className="font-semibold">{filtered.length}</span> records
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

export default LoanArrearsReport;