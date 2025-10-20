import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { supabase } from "../../supabaseClient";

const CustomerStatementModal = ({ customerId, customerName, onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        //  Fetch confirmed C2B payments (customer payments)
        const { data: c2bData, error: c2bError } = await supabase
          .from("mpesa_c2b_transactions")
          .select(`
            id, transaction_time, transaction_id, amount, payment_type, status,
            loan_id, loan:loan_id(customer_id)
          `)
          .eq("loan.customer_id", customerId)
          .eq("status", "applied")
          .not("transaction_time", "is", null)
          .order("transaction_time", { ascending: true });
        if (c2bError) throw c2bError;

        // Fetch successful B2C disbursements
        const { data: b2cData, error: b2cError } = await supabase
          .from("mpesa_b2c_transactions")
          .select(`id, created_at, transaction_id, amount, status, loan_id, customer_id`)
          .eq("customer_id", customerId)
          .eq("status", "success")
          .not("created_at", "is", null)
          .order("created_at", { ascending: true });
        if (b2cError) throw b2cError;

        // Fetch paid installments
        const { data: installmentData, error: installmentError } = await supabase
          .from("loan_installments")
          .select(`
            id, loan_id, updated_at, paid_amount, principal_amount, interest_amount, status,
            loan:loan_id(customer_id)
          `)
          .eq("loan.customer_id", customerId)
          .in("status", ["paid", "completed"])
          .not("updated_at", "is", null)
          .order("updated_at", { ascending: true });
        if (installmentError) throw installmentError;

        //  Fetch loans for fee details
        const { data: loans, error: loansError } = await supabase
          .from("loans")
          .select(
            "id, booked_at, processing_fee, registration_fee, processing_fee_paid, registration_fee_paid, status"
          )
          .eq("customer_id", customerId);
        if (loansError) throw loansError;

        //  BUILD TRANSACTIONS WITH PROPER DEBIT/CREDIT LOGIC
        let combined = [];

        /* 
         * DISBURSEMENT FLOW:
         * 1. Credit: Gross loan amount (e.g., KES 10,000)
         * 2. Debit: Processing fee (e.g., -KES 500) → Balance: 9,500
         * 3. Debit: Joining fee (e.g., -KES 300) → Balance: 9,200
         * Result: Customer receives net amount (KES 9,200)
         * All happen at the SAME TIME - same timestamp
         */
        (b2cData || []).forEach((b2c) => {
          const loan = loans.find((l) => l.id === b2c.loan_id);
          const disburseTime = new Date(b2c.created_at);

          // Step 1: Credit the gross loan amount
          combined.push({
            id: `${b2c.id}-disb`,
            date: disburseTime,
            description: "Loan Disbursement (Gross)",
            reference: b2c.transaction_id,
            debit: 0,
            credit: Number(b2c.amount),
            sequence: 1, // For ordering when timestamps are identical
          });

          // Step 2: Deduct processing fee at the SAME TIME
          if (loan?.processing_fee > 0) {
            combined.push({
              id: `${loan.id}-proc-fee-deduct`,
              date: disburseTime, // Same exact time
              description: "Processing Fee (Deducted)",
              reference: `Loan-${loan.id}`,
              debit: Number(loan.processing_fee),
              credit: 0,
              sequence: 2,
            });
          }

          // Step 3: Deduct joining fee at the SAME TIME
          if (loan?.registration_fee > 0) {
            combined.push({
              id: `${loan.id}-join-fee-deduct`,
              date: disburseTime, // Same exact time
              description: "Joining Fee (Deducted)",
              reference: `Loan-${loan.id}`,
              debit: Number(loan.registration_fee),
              credit: 0,
              sequence: 3,
            });
          }
        });

        /* 
         * FEE PAYMENTS (Made before or separately):
         * These are credits because customer pays money to the system
         */
        (c2bData || []).forEach((t) => {
          const txDate = new Date(t.transaction_time);
          const paymentType = (t.payment_type || "").toLowerCase();
          
          // Check for processing fee keywords
          if (paymentType.includes("processing") || paymentType.includes("process")) {
            combined.push({
              id: `${t.id}-proc-pay`,
              date: txDate,
              description: "Processing Fee Payment",
              reference: t.transaction_id,
              debit: 0,
              credit: Number(t.amount),
              sequence: 0,
            });
          } 
          // Check for joining/registration fee keywords
          else if (
            paymentType.includes("joining") || 
            paymentType.includes("registration") || 
            paymentType.includes("register") ||
            paymentType.includes("join")
          ) {
            combined.push({
              id: `${t.id}-join-pay`,
              date: txDate,
              description: "Joining Fee Payment",
              reference: t.transaction_id,
              debit: 0,
              credit: Number(t.amount),
              sequence: 0,
            });
          } 
          // Normal loan repayment (Credit - money coming in)
          else {
            combined.push({
              id: `${t.id}-repay`,
              date: txDate,
              description: "Loan Repayment",
              reference: t.transaction_id,
              debit: 0,
              credit: Number(t.amount),
              sequence: 0,
            });
          }
        });

        /* 
         * INSTALLMENT DUES:
         * Principal and Interest are debits (amounts owed/charged)
         */
        (installmentData || []).forEach((inst) => {
          const instDate = new Date(inst.updated_at);
          
          if (inst.principal_amount > 0) {
            combined.push({
              id: `${inst.id}-principal`,
              date: instDate,
              description: "Principal Due",
              reference: `Installment-${inst.id}`,
              debit: Number(inst.principal_amount),
              credit: 0,
              sequence: 0,
            });
          }

          if (inst.interest_amount > 0) {
            combined.push({
              id: `${inst.id}-interest`,
              date: instDate, // Same time as principal
              description: "Interest Due",
              reference: `Installment-${inst.id}`,
              debit: Number(inst.interest_amount),
              credit: 0,
              sequence: 0,
            });
          }
        });

        // --- SORT CHRONOLOGICALLY WITH SEQUENCE FOR SAME TIMESTAMPS ---
        combined.sort((a, b) => {
          const dateCompare = new Date(a.date) - new Date(b.date);
          if (dateCompare !== 0) return dateCompare;
          // If dates are identical, use sequence to maintain order
          return (a.sequence || 0) - (b.sequence || 0);
        });

        let runningBalance = 0;
        combined = combined.map((t) => {
          // Balance = Previous Balance + Credits - Debits
          runningBalance += t.credit - t.debit;
          return { ...t, balance: runningBalance };
        });

        // Reverse to show most recent first
        setTransactions([...combined].reverse());
        applyFilters([...combined].reverse(), "all");
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) fetchTransactions();
  }, [customerId]);

  const getDateRange = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start, end;

    switch (filter) {
      case "today":
        start = new Date(today);
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        start = new Date(today);
        start.setDate(start.getDate() - start.getDay());
        end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "quarter":
        const q = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), q * 3, 1);
        end = new Date(today.getFullYear(), q * 3 + 3, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "year":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      case "custom":
        start = customStartDate ? new Date(customStartDate) : new Date(0);
        end = customEndDate ? new Date(customEndDate) : new Date();
        end.setHours(23, 59, 59, 999);
        break;
      default:
        return null;
    }

    return { start, end };
  };

  const applyFilters = (data, filter) => {
    let filtered = [...data];

    if (filter !== "all") {
      const range = getDateRange(filter);
      if (range) {
        filtered = filtered.filter((t) => {
          const txDate = new Date(t.date);
          return txDate >= range.start && txDate <= range.end;
        });
      }
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (e) => {
    const value = e.target.value;
    setDateFilter(value);
    applyFilters(transactions, value);
  };

  const handleCustomDateChange = () => {
    applyFilters(transactions, "custom");
  };

  const handleSort = (key) => {
    const newDirection = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction: newDirection });

    const sorted = [...filteredTransactions].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      if (key === "date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return newDirection === "asc" ? comparison : -comparison;
    });

    setFilteredTransactions(sorted);
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);

  const formatDebit = (amount) => {
    if (!amount || amount === 0) return "0.00";
    return `-${new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const formatCredit = (amount) => {
    if (!amount || amount === 0) return "0.00";
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Description", "Reference", "Debit", "Credit", "Balance"];
    const rows = filteredTransactions.map((t) => [
      new Date(t.date).toLocaleString("en-KE"),
      t.description,
      t.reference || "-",
      formatDebit(t.debit),
      formatCredit(t.credit),
      formatCurrency(t.balance).replace("KES", "").trim(),
    ]);

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    downloadFile(csv, `statement-${customerName}.csv`, "text/csv");
  };

  const exportToExcel = () => {
    const headers = ["Date", "Description", "Reference", "Debit", "Credit", "Balance"];
    const rows = filteredTransactions.map((t) => [
      new Date(t.date).toLocaleString("en-KE"),
      t.description,
      t.reference || "-",
      formatDebit(t.debit),
      formatCredit(t.credit),
      formatCurrency(t.balance).replace("KES", "").trim(),
    ]);

    let html = '<table border="1"><thead><tr>' + headers.map((h) => `<th>${h}</th>`).join("") + "</tr></thead><tbody>";
    html += rows.map((r) => "<tr>" + r.map((v) => `<td>${v}</td>`).join("") + "</tr>").join("");
    html += "</tbody></table>";

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    downloadFile(blob, `statement-${customerName}.xls`, "application/vnd.ms-excel");
  };

  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await import("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js");

      const doc = new jsPDF.jsPDF();

      doc.setFontSize(16);
      doc.text("Account Statement", 20, 20);
      doc.setFontSize(10);
      doc.text(`Customer: ${customerName}`, 20, 30);
      doc.text(`Generated: ${new Date().toLocaleString("en-KE")}`, 20, 38);

      const headers = ["Date", "Description", "Ref", "Debit", "Credit", "Balance"];
      const rows = filteredTransactions.map((t) => [
        new Date(t.date).toLocaleDateString("en-KE"),
        t.description.substring(0, 20),
        (t.reference || "-").substring(0, 12),
        formatDebit(t.debit),
        formatCredit(t.credit),
        formatCurrency(t.balance).replace("KES", "").trim(),
      ]);

      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 45,
        theme: "grid",
        styles: { fontSize: 8 },
      });

      doc.save(`statement-${customerName}.pdf`);
    } catch (err) {
      console.error("Error exporting to PDF:", err);
      alert("Failed to export PDF");
    }
  };

  const downloadFile = (content, filename, type) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const SortableHeader = ({ label, sortKey }) => {
    const isActive = sortConfig.key === sortKey;
    const isAscending = sortConfig.direction === "asc";
    
    return (
      <th
        onClick={() => handleSort(sortKey)}
        className="px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {label}
          {isActive && (isAscending ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
        </div>
      </th>
    );
  };

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentData = filteredTransactions.slice(startIdx, endIdx);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Account Statement</h2>
            <p className="text-sm text-gray-600">{customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Export */}
        <div className="border-b px-6 py-4 bg-gray-50 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Period</label>
              <select
                value={dateFilter}
                onChange={handleDateFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {dateFilter === "custom" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleCustomDateChange}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply
                </button>
              </>
            )}

            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={exportToExcel}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={exportToPDF}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-10">Loading transactions...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No transactions found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <SortableHeader label="Date" sortKey="date" />
                      <SortableHeader label="Description" sortKey="description" />
                      <SortableHeader label="Reference" sortKey="reference" />
                      <SortableHeader label="Debit " sortKey="debit" />
                      <SortableHeader label="Credit " sortKey="credit" />
                      <SortableHeader label="Balance" sortKey="balance" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentData.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{new Date(t.date).toLocaleString("en-KE")}</td>
                        <td className="px-6 py-3">{t.description}</td>
                        <td className="px-6 py-3 font-mono text-sm">{t.reference || "-"}</td>
                        <td className="px-6 py-3 text-right text-red-600 font-mono">
                          {formatDebit(t.debit)}
                        </td>
                        <td className="px-6 py-3 text-right text-green-600 font-mono">
                          {formatCredit(t.credit)}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">{formatCurrency(t.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{startIdx + 1}</span> to{" "}
                  <span className="font-semibold">{Math.min(endIdx, filteredTransactions.length)}</span> of{" "}
                  <span className="font-semibold">{filteredTransactions.length}</span> transactions
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      const isCurrentPage = currentPage === pageNum;
                      const buttonClass = isCurrentPage
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50";
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg ${buttonClass}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && <span className="px-2">...</span>}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Last
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Items per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerStatementModal;