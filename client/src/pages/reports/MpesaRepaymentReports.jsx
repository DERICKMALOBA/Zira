import React, { useState, useEffect } from "react";
import { Download, Filter, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search } from "lucide-react";
import { supabase } from "../../supabaseClient";

const MpesaRepaymentReports = () => {
  const [repayments, setRepayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filters, setFilters] = useState({
    search: "",
    branch: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase.from("branches").select("id, name");
      if (!error) setBranches(data);
    };
    fetchBranches();
  }, []);

  // Fetch repayment data
  useEffect(() => {
    const fetchRepayments = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("loan_payments")
          .select(`
            id,
            paid_amount,
            phone_number,
            paid_at,
            mpesa_receipt,
            loan_id,
            loans!inner(
              id,
              customer:customer_id(
                id,
                "Firstname",
                "Middlename",
                "Surname",
                id_number,
                branch:branch_id(name)
              )
            )
          `)
          .order("paid_at", { ascending: false });

        if (error) throw error;

        const formatted = data.map((item) => {
          const customer = item.loans?.customer || {};
          const fullName = [customer.Firstname, customer.Middlename, customer.Surname]
            .filter(Boolean)
            .join(" ");
          return {
            id: item.id,
            customerName: fullName || "N/A",
            idNumber: customer.id_number || "N/A",
            mobile: item.phone_number || "N/A",
            branch: customer.branch?.name || "N/A",
            transactionId: item.mpesa_receipt || "N/A",
            amountPaid: item.paid_amount || 0,
            status: "applied",
            paymentDate: item.paid_at
              ? new Date(item.paid_at).toLocaleDateString()
              : "N/A",
          };
        });

        setRepayments(formatted);
        setFiltered(formatted);
      } catch (err) {
        console.error("Error fetching repayments:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRepayments();
  }, []);

  // Filtering and sorting
  useEffect(() => {
    let result = [...repayments];

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.mobile.includes(q) ||
          r.idNumber.includes(q) ||
          r.transactionId.toLowerCase().includes(q)
      );
    }

    if (filters.branch)
      result = result.filter((r) => r.branch === filters.branch);

    if (filters.status)
      result = result.filter(
        (r) => r.status.toLowerCase() === filters.status.toLowerCase()
      );

    if (filters.startDate)
      result = result.filter(
        (r) => new Date(r.paymentDate) >= new Date(filters.startDate)
      );

    if (filters.endDate)
      result = result.filter(
        (r) => new Date(r.paymentDate) <= new Date(filters.endDate)
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

    setFiltered(result);
    setCurrentPage(1);
  }, [filters, repayments, sortConfig]);

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

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilters = () =>
    setFilters({ search: "", branch: "", status: "", startDate: "", endDate: "" });

  // Format currency
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  // Export CSV
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
        "Transaction ID",
        "Amount Paid",
        "Status",
        "Payment Date",
      ],
      ...filtered.map((r, i) => [
        i + 1,
        `"${r.customerName}"`,
        r.mobile,
        r.idNumber,
        r.branch,
        r.transactionId,
        r.amountPaid,
        r.status,
        r.paymentDate,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mpesa_repayment_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentData = filtered.slice(startIdx, endIdx);

  // Totals
  const totals = {
    amountPaid: filtered.reduce((sum, r) => sum + r.amountPaid, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-gray-900">M-Pesa  Repayment Reports</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, ID, mobile, or transaction..."
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
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="applied">Applied</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
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
          </div>
          {(filters.search || filters.branch || filters.status || filters.startDate || filters.endDate) && (
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
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Amount Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.amountPaid)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Average Payment</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(filtered.length > 0 ? totals.amountPaid / filtered.length : 0)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading repayments...</p>
          </div>
        ) : filtered.length === 0 ? (
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
                    <SortableHeader label="ID Number" sortKey="idNumber" />
                    <SortableHeader label="Branch" sortKey="branch" />
                    <SortableHeader label="Transaction ID" sortKey="transactionId" />
                    <SortableHeader label="Amount Paid" sortKey="amountPaid" />
                    <SortableHeader label="Status" sortKey="status" />
                    <SortableHeader label="Payment Date" sortKey="paymentDate" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentData.map((r, i) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{startIdx + i + 1}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{r.customerName}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{r.mobile}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{r.idNumber}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{r.branch}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap font-mono text-sm">{r.transactionId}</td>
                      <td className="px-6 py-4 text-right text-gray-900 font-semibold whitespace-nowrap">
                        {formatCurrency(r.amountPaid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{r.paymentDate}</td>
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
                <span className="font-semibold">{filtered.length}</span> repayments
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

export default MpesaRepaymentReports;