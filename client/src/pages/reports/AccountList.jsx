import { useState, useEffect } from "react";
import {  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Eye } from "lucide-react";
import { supabase } from "../../supabaseClient";

const CustomerStatementModal = ({ customerId, customerName, onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);



  // Fetch transaction data

  useEffect(() => {
  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // 🟢 1. Fetch C2B Transactions (Processing & Joining Fees)
      const { data: c2bData, error: c2bError } = await supabase
        .from("mpesa_c2b_transactions")
        .select(`
          id,
          transaction_time,
          transaction_id,
          amount,
          payment_type,
          loan_id,
          installment_id,
          loan:loan_id(customer_id)
        `)
        .eq("loan.customer_id", customerId)
        .order("transaction_time", { ascending: true });

      if (c2bError) throw c2bError;

      // 🟢 2. Fetch B2C Transactions (Loan Disbursements)
      const { data: b2cData, error: b2cError } = await supabase
        .from("mpesa_b2c_transactions")
        .select(`
          id,
          transaction_time,
          transaction_id,
          amount,
          loan_id,
          customer_id
        `)
        .eq("customer_id", customerId)
        .order("transaction_time", { ascending: true });

      if (b2cError) throw b2cError;

      // 🟢 3. Fetch Installment Repayments (Principal & Interest)
      const { data: installmentData, error: installmentError } = await supabase
        .from("loan_installments")
        .select(`
          id,
          loan_id,
          updated_at,
          paid_amount,
          principal_amount,
          interest_amount,
          loan:loan_id(customer_id)
        `)
        .eq("loan.customer_id", customerId)
        .order("updated_at", { ascending: true });

      if (installmentError) throw installmentError;

      // 🧩 Combine All Data
      let combined = [];

      // 🟣 C2B — Processing or Joining Fees
      combined.push(
        ...(c2bData || []).map((t) => {
          let description = "Customer Payment";
          if (t.payment_type === "processing") description = "Processing Fee";
          else if (t.payment_type === "registration") description = "Joining Fee";
          else if (t.payment_type === "repayment") description = "Loan Repayment";

          return {
            id: t.id,
            date: t.transaction_time,
            time: new Date(t.transaction_time).toLocaleTimeString("en-KE"),
            description,
            reference: t.transaction_id || "N/A",
            debit: Number(t.amount) || 0,
            credit: 0,
          };
        })
      );

      // 🟢 B2C — Loan Disbursement
      combined.push(
        ...(b2cData || []).map((t) => ({
          id: t.id,
          date: t.transaction_time,
          time: new Date(t.transaction_time).toLocaleTimeString("en-KE"),
          description: "Loan Disbursement",
          reference: t.transaction_id || "N/A",
          debit: 0,
          credit: Number(t.amount) || 0,
        }))
      );

      // 🟠 Loan Installments — Split Principal & Interest
      combined.push(
        ...(installmentData || []).flatMap((t) => {
          const transactions = [];

          if (t.principal_amount > 0) {
            transactions.push({
              id: `${t.id}-principal`,
              date: t.updated_at,
              time: new Date(t.updated_at).toLocaleTimeString("en-KE"),
              description: "Principal Repayment",
              reference: `Loan-${t.loan_id}`,
              debit: Number(t.principal_amount) || 0,
              credit: 0,
            });
          }

          if (t.interest_amount > 0) {
            transactions.push({
              id: `${t.id}-interest`,
              date: t.updated_at,
              time: new Date(t.updated_at).toLocaleTimeString("en-KE"),
              description: "Interest Repayment",
              reference: `Loan-${t.loan_id}`,
              debit: Number(t.interest_amount) || 0,
              credit: 0,
            });
          }

          return transactions;
        })
      );

      // 🧮 Sort Chronologically
      combined.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // 💰 Running Balance
      let runningBalance = 0;
      combined = combined.map((t) => {
        runningBalance += t.credit - t.debit;
        return { ...t, balance: runningBalance };
      });

      // ✅ Update State
      setTransactions(combined.reverse());
      setFilteredTransactions(combined.reverse());
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching transactions:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (customerId) fetchTransactions();
}, [customerId]);




  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const formatCurrency = (num) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(num || 0);


  const SortableHeader = ({ label, sortKey }) => (
    <th
      onClick={() => handleSort(sortKey)}
      className="px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors text-left"
    >
      <div className="flex items-center gap-2">
        {label}
        {sortConfig.key === sortKey && (
          sortConfig.direction === "asc" ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        )}
      </div>
    </th>
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentData = filteredTransactions.slice(startIdx, endIdx);

  const totalDebits = filteredTransactions.reduce((sum, t) => sum + (t.debit || 0), 0);
  const totalCredits = filteredTransactions.reduce((sum, t) => sum + (t.credit || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Account Statement</h2>
            <p className="text-sm text-gray-600">{customerName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
       
          {/* Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No transactions found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <SortableHeader label="Date" sortKey="date" />
                        <SortableHeader label="Time" sortKey="time" />
                        <SortableHeader label="Description" sortKey="description" />
                        <SortableHeader label="M-Pess Reference" sortKey="mpessRef" />
                        <SortableHeader label="Debit" sortKey="debit" />
                        <SortableHeader label="Credit" sortKey="credit" />
                        <SortableHeader label="Balance" sortKey="balance" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentData.map((trans) => (
                        <tr key={trans.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-900 font-medium text-sm">
                            {new Date(trans.date).toLocaleDateString("en-KE")}
                          </td>
                          <td className="px-6 py-4 text-gray-700 text-sm">{trans.time}</td>
                          <td className="px-6 py-4 text-gray-900 font-medium text-sm">
                            {trans.description}
                          </td>
                          <td className="px-6 py-4 text-gray-700 text-sm font-mono">
                            {trans.mpessRef}
                          </td>
                          <td className="px-6 py-4 text-right text-red-700 font-semibold text-sm">
                            {trans.debit > 0 ? formatCurrency(trans.debit) : "-"}
                          </td>
                          <td className="px-6 py-4 text-right text-green-700 font-semibold text-sm">
                            {trans.credit > 0 ? formatCurrency(trans.credit) : "-"}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-900 font-bold text-sm">
                            {formatCurrency(trans.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-semibold">{startIdx + 1}</span> to{' '}
                      <span className="font-semibold">{Math.min(endIdx, filteredTransactions.length)}</span> of{' '}
                      <span className="font-semibold">{filteredTransactions.length}</span> transactions
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
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerStatementModal;