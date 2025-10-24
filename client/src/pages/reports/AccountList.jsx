import { useState, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X, Download, Search, Share2,  Printer,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const CustomerStatementModal = ({
  customerId,
  customerName,
  customerInfo,
  onClose,
}) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState("csv");
  const [reportTimestamp, setReportTimestamp] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Summary state
  const [statementSummary, setStatementSummary] = useState({
    totalLoanAmount: 0,
    principal: 0,
    interest: 0,
    totalPaid: 0,
    outstandingBalance: 0
  });

  // Statement period state
  const [statementPeriod, setStatementPeriod] = useState({
    startDate: "",
    endDate: "",
    period: ""
  });

  // Set report timestamp when component mounts
  useEffect(() => {
    const now = new Date();
    setReportTimestamp(
      now.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    );
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        // 1️ Fetch customer creation date
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("id, created_at")
          .eq("id", customerId)
          .single();

        if (customerError) throw customerError;

        // 2️ Fetch customer loans
        const { data: loans, error: loansError } = await supabase
          .from("loans")
          .select(
            "id, customer_id, processing_fee, registration_fee, total_payable, scored_amount, total_interest, created_at, status"
          )
          .eq("customer_id", customerId);

        if (loansError) throw loansError;

        // Summary calculations
        let totalLoanAmount = 0;
        let totalPrincipal = 0;
        let totalInterest = 0;
        let totalPaid = 0;
      



        if (loans?.length) {
          loans.forEach((loan) => {
            totalLoanAmount += Number(loan.total_payable) || 0;
            totalPrincipal += Number(loan.scored_amount) || 0;
            totalInterest += Number(loan.total_interest) || 0;
          });
        }


        // Calculate statement period (last 4 months)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 4);
        
        setStatementPeriod({
          startDate: startDate.toLocaleDateString('en-GB'),
          endDate: endDate.toLocaleDateString('en-GB'),
          period: "four-month"
        });

        const loanIds = loans?.map((l) => l.id) || [];

        // 3️ Fetch related data
        let installments = [];
        let c2b = [];
        let b2c = [];

        if (loanIds.length > 0) {
          const [
            { data: installmentsData },
            { data: c2bData },
            { data: b2cData },
          ] = await Promise.all([
            supabase
              .from("loan_installments")
              .select("*")
              .in("loan_id", loanIds)
              .order("created_at", { ascending: true }),
            supabase
              .from("mpesa_c2b_transactions")
              .select("*")
              .in("loan_id", loanIds)
              .eq("status", "applied")
              .not("transaction_time", "is", null)
              .order("transaction_time", { ascending: true }),
            supabase
              .from("mpesa_b2c_transactions")
              .select("*")
              .in("loan_id", loanIds)
              .eq("status", "success")
              .not("created_at", "is", null)
              .order("created_at", { ascending: true }),
          ]);

          installments = installmentsData || [];
          c2b = c2bData || [];
          b2c = b2cData || [];
        }

        // 4️ Start building transaction events
        let allEvents = [];
        let runningBalance = 0;

        // (1) JOINING FEE — debit at time customer was created
        if (customer?.created_at) {
          const joiningFee = 300; // default joining fee
          runningBalance -= joiningFee;

          allEvents.push({
            id: `joining-fee-${customer.id}`,
            date: new Date(customer.created_at),
            description: "JOINING FEE",
            reference: "-",
            debit: -Math.abs(Number(joiningFee)),
            credit: 0,
            balance: runningBalance,
            sequence: 1,
          });
        }

        // (2) Registration / Processing fee deposits (C2B)
        c2b
          .filter(
            (tx) =>
              tx.payment_type === "registration" ||
              tx.payment_type === "processing"
          )
          .forEach((tx) => {
            runningBalance += Number(tx.amount);
            allEvents.push({
              id: `deposit-${tx.id}`,
              date: new Date(tx.transaction_time),
              description: "Mobile Money Deposit",
              reference: `Mpesa Deposit - ${tx.transaction_id || tx.reference || "-"}`,
              debit: 0,
              credit: Number(tx.amount),
              balance: runningBalance,
              sequence: 2,
            });
          });

        // (3) Loan Disbursement (B2C)
        b2c.forEach((disb) => {
          const loan = loans.find((l) => l.id === disb.loan_id);
          if (!loan) return;
          const disbDate = new Date(disb.created_at);

          // (a) Credit Loan amount
          runningBalance += Number(loan.scored_amount);
          allEvents.push({
            id: `loan-disbursement-${disb.id}`,
            date: disbDate,
            description: "Loan Disbursement",
            reference: disb.transaction_id || `Loan-${loan.id}`,
            debit: 0,
            credit: Number(loan.scored_amount),
            balance: runningBalance,
            sequence: 3,
          });

          // (b) Debit Loan processing fee
          if (loan.processing_fee > 0) {
            runningBalance -= Number(loan.processing_fee);
            allEvents.push({
              id: `processing-fee-${disb.id}`,
              date: disbDate,
              description: "LOAN PROCESSING FEE",
              reference: "-",
              debit: -Math.abs(Number(loan.processing_fee)),
              credit: 0,
              balance: runningBalance,
              sequence: 4,
            });
          }

          // (c) Debit actual mobile disbursement
          runningBalance -= Number(disb.amount);
          allEvents.push({
            id: `mobile-disbursement-${disb.id}`,
            date: disbDate,
            description: "Mobile Money Disbursement",
            reference: "-",
            debit: -Math.abs(Number(disb.amount)),
            credit: 0,
            balance: runningBalance,
            sequence: 5,
          });
        });

        // (4) Loan Repayments (C2B)
        c2b
          .filter((tx) => tx.payment_type === "repayment")
          .forEach((tx) => {
            const payDate = new Date(tx.transaction_time);
            const ref = tx.transaction_id || tx.reference || "-";
            const relatedInstallments = installments
              .filter((i) => i.loan_id === tx.loan_id)
              .sort((a, b) => a.installment_number - b.installment_number);

            // (a) Credit repayment amount
            runningBalance += Number(tx.amount);
            allEvents.push({
              id: `repayment-credit-${tx.id}`,
              date: payDate,
              description: "Mobile Money Deposit",
              reference: `Mpesa Deposit - ${ref}`,
              debit: 0,
              credit: Number(tx.amount),
              balance: runningBalance,
              sequence: 6,
            });

            // (b) Alternate: Interest then Principal per installment
            for (const inst of relatedInstallments) {
              const instInterestPaid = Number(inst.interest_paid) || 0;
              const instPrincipalPaid = Number(inst.principal_paid) || 0;

              // Interest first
              if (instInterestPaid > 0) {
                runningBalance -= instInterestPaid;
                allEvents.push({
                  id: `interest-repayment-${tx.id}-${inst.installment_number}`,
                  date: payDate,
                  description: `Interest Repayment`,
                  reference: ref,
                  debit: -Math.abs(instInterestPaid),
                  credit: 0,
                  balance: runningBalance,
                  sequence: 7 + inst.installment_number * 2,
                });
              }

              // Then principal
              if (instPrincipalPaid > 0) {
                runningBalance -= instPrincipalPaid;
                allEvents.push({
                  id: `principal-repayment-${tx.id}-${inst.installment_number}`,
                  date: payDate,
                  description: `Principal Repayment`,
                  reference: ref,
                  debit: -Math.abs(instPrincipalPaid),
                  credit: 0,
                  balance: runningBalance,
                  sequence: 8 + inst.installment_number * 2,
                });
              }
            }
          });
                  // Calculate total repayments from C2B transactions
const totalRepayments = c2b
  .filter((tx) => tx.payment_type === "repayment")
  .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        totalPaid = totalRepayments;


setStatementSummary({
  totalLoanAmount,
  principal: totalPrincipal,
  interest: totalInterest,
  totalPaid,
  outstandingBalance: totalLoanAmount - totalPaid,
});


        // (5) Sort by date & sequence
        allEvents.sort((a, b) => {
          const dateDiff = new Date(a.date) - new Date(b.date);
          return dateDiff !== 0 ? dateDiff : a.sequence - b.sequence;
        });

        allEvents.reverse();

        // (6) Add Balance B/F
        const balanceBF = {
          id: "balance-bf",
          date: new Date(),
          description: "Balance B/F",
          reference: "-",
          debit: 0,
          credit: 0,
          balance: 0,
          isBalanceBF: true,
        };
        const finalList = [balanceBF, ...allEvents];
        setTransactions(finalList);
        applyFilters(finalList, "all");
      } catch (err) {
        console.error("Error fetching transactions:", err);
        alert("Failed to load transactions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (customerId) fetchTransactions();
  }, [customerId]);



  // Enhanced Filtering & Sorting Helpers
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
        const currentQuarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), currentQuarter * 3, 1);
        end = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 0);
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
    const balanceBF = data.find((t) => t.isBalanceBF);
    const other = data.filter((t) => !t.isBalanceBF);

    let filtered = other;
    if (filter !== "all") {
      const range = getDateRange(filter);
      if (range) {
        filtered = other.filter((t) => {
          const txDate = new Date(t.date);
          return txDate >= range.start && txDate <= range.end;
        });
      }
    }

    setFilteredTransactions(balanceBF ? [balanceBF, ...filtered] : filtered);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    applyFilters(transactions, filter);
  };

  const handleCustomDateApply = () => {
    applyFilters(transactions, "custom");
  };

  const handleSort = (key) => {
    if (key === "balance") return;
    const newDir =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction: newDir });

    const balanceBF = filteredTransactions.find((t) => t.isBalanceBF);
    const other = filteredTransactions.filter((t) => !t.isBalanceBF);

    const sorted = [...other].sort((a, b) => {
      let aVal = a[key],
        bVal = b[key];
      if (key === "date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      const comp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return newDir === "asc" ? comp : -comp;
    });

    setFilteredTransactions(balanceBF ? [balanceBF, ...sorted] : sorted);
  };

  // Export Functions
  const getExportData = () => {
    return dateFilter === "all" ? transactions : filteredTransactions;
  };

  const getExportFileName = (ext) => {
    const name = (customerInfo?.name || customerName || "Customer")
      .replace(/\s+/g, " ")
      .trim();
    return `${name} Account Statement.${ext}`;
  };

  const exportToCSV = () => {
    const data = getExportData();
    const headers = [
      "Date/Time",
      "Description",
      "Reference",
      "Debit",
      "Credit",
      "Balance",
    ];

    const csvContent = [
      headers.join(","),
      ...data.map((t) =>
        [
          `"${new Date(t.date).toLocaleString("en-KE")}"`,
          `"${t.description}"`,
          `"${t.reference}"`,
          `"${formatAmount(t.debit)}"`,
          `"${formatAmount(t.credit)}"`,
          `"${formatAmount(t.balance)}"`,
        ].join(",")
      ),
    ].join("\n");

    downloadFile(csvContent, getExportFileName("csv"), "text/csv");
  };

  const exportToWord = () => {
    const data = getExportData();
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="UTF-8">
          <title>${customerInfo?.name || customerName} Account Statement</title>
          <style>
            @page {
              size: A4;
              margin: 1in;
            }
            body { font-family: Arial, sans-serif; font-size: 10pt; margin: 0; padding: 0; }
            .header { text-align: center; margin-bottom: 10px; }
            .header h1 { font-size: 16pt; margin-bottom: 4px; }
            .header h2 { font-size: 13pt; margin-bottom: 6px; }
            .header p { margin: 2px 0; font-size: 10pt; }
            .summary { margin: 10px 0; padding: 8px; background: #f9f9f9; border: 1px solid #ddd; }
            .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            .summary-table td { border: 1px solid #ddd; padding: 6px; text-align: center; }
            table { border-collapse: collapse; width: 98%; margin: 0 auto; }
            th, td { border: 1px solid #999; padding: 6px 8px; font-size: 9pt; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MULAR CREDIT LTD</h1>
            <h2>${customerInfo?.name || customerName} Account Statement</h2>
            <p><strong>Mobile:</strong> ${customerInfo?.mobile || customerInfo?.phone || "N/A"}</p>
            <p><strong>Report Generated:</strong> ${reportTimestamp}</p>
          </div>

          <div class="summary">
            <table class="summary-table">
              <tr>
                <td><strong>Total Loan Amount</strong></td>
                <td><strong>Principal</strong></td>
                <td><strong>Interest</strong></td>
                <td><strong>Total Paid</strong></td>
                <td><strong>Outstanding Balance</strong></td>
              </tr>
              <tr>
                <td>${formatAmount(statementSummary.totalLoanAmount)}</td>
                <td>${formatAmount(statementSummary.principal)}</td>
                <td>${formatAmount(statementSummary.interest)}</td>
                <td>${formatAmount(statementSummary.totalPaid)}</td>
                <td>${formatAmount(statementSummary.outstandingBalance)}</td>
              </tr>
            </table>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Debit (Ksh)</th>
                <th>Credit (Ksh)</th>
                <th>Balance (Ksh)</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((t) => `
                <tr>
                  <td>${new Date(t.date).toLocaleString("en-KE")}</td>
                  <td>${t.description}</td>
                  <td>${t.reference}</td>
                  <td>${formatAmount(t.debit)}</td>
                  <td>${formatAmount(t.credit)}</td>
                  <td>${formatAmount(t.balance)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="margin-top: 20px; font-style: italic; text-align: center; font-size: 9pt;">
            <p>Generated automatically by MULAR CREDIT LTD System.</p>
          </div>
        </body>
      </html>
    `;

    downloadFile(htmlContent, getExportFileName("doc"), "application/msword");
  };

  const exportToExcel = async () => {
    const XLSX = await import("xlsx");
    const data = getExportData();

    const worksheetData = [
      ["MULAR CREDIT LTD"],
      [`${customerInfo?.name || customerName} Account Statement`],
      [`Report Generated: ${reportTimestamp}`],
      [],
      ["Total Loan Amount", "Principal", "Interest", "Total Paid", "Outstanding Balance"],
      [
        formatAmount(statementSummary.totalLoanAmount),
        formatAmount(statementSummary.principal),
        formatAmount(statementSummary.interest),
        formatAmount(statementSummary.totalPaid),
        formatAmount(statementSummary.outstandingBalance)
      ],
      [],
      ["Date/Time", "Description", "Reference", "Debit (Ksh)", "Credit (Ksh)", "Balance (Ksh)"],
      ...data.map((t) => [
        new Date(t.date).toLocaleString("en-KE"),
        t.description,
        t.reference,
        formatAmount(t.debit),
        formatAmount(t.credit),
        formatAmount(t.balance),
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Account Statement");

    const colWidths = [
      { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    worksheet["!cols"] = colWidths;

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getExportFileName("xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF("p", "mm", "a4");

    const data = getExportData().map((t) => [
      new Date(t.date).toLocaleString("en-KE"),
      t.description,
      t.reference,
      formatAmount(t.debit),
      formatAmount(t.credit),
      formatAmount(t.balance),
    ]);

    // Header
    doc.setFontSize(14);
    doc.text("MULAR CREDIT LTD", 105, 15, { align: "center" });
    doc.setFontSize(11);
    doc.text(
      `${customerInfo?.name || customerName} Account Statement`,
      105,
      22,
      { align: "center" }
    );
    doc.text(`Report Generated: ${reportTimestamp}`, 105, 29, {
      align: "center",
    });

    // Summary Table
    autoTable(doc, {
      head: [["Total Loan Amount", "Principal", "Interest", "Total Paid", "Outstanding Balance"]],
      body: [[
        formatAmount(statementSummary.totalLoanAmount),
        formatAmount(statementSummary.principal),
        formatAmount(statementSummary.interest),
        formatAmount(statementSummary.totalPaid),
        formatAmount(statementSummary.outstandingBalance)
      ]],
      startY: 40,
      styles: { fontSize: 9, cellPadding: 3 },
      theme: "grid",
    });

    // Main Table
    autoTable(doc, {
      head: [["Date/Time", "Description", "Reference", "Debit", "Credit", "Balance"]],
      body: data,
      startY: 60,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 45 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        textColor: [0, 0, 0],
      },
      theme: "grid",
    });

    doc.save(getExportFileName("pdf"));
  };

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    switch (exportFormat) {
      case "csv":
        exportToCSV();
        break;
      case "excel":
        exportToExcel();
        break;
      case "word":
        exportToWord();
        break;
      case "pdf":
        exportToPDF();
        break;
      default:
        exportToCSV();
    }
  };

  const formatAmount = (amt) => {
    if (amt === 0) return "0.00";
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amt);
  };

  const SortableHeader = ({ label, sortKey }) => {
    const isActive = sortConfig.key === sortKey;
    const isAsc = sortConfig.direction === "asc";
    return (
      <th
        onClick={() => handleSort(sortKey)}
        className="px-6 py-3 text-left text-sm font-semibold cursor-pointer text-white hover:bg-blue-700"
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive &&
            (isAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </div>
      </th>
    );
  };

  // Enhanced Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentData = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      pages.push(1);
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };
const handleFindTransaction = () => {
  if (!searchTerm.trim()) {
    alert("Please enter a transaction ID to search.");
    return;
  }

  const found = transactions.find(
    (tx) =>
      tx.reference?.includes(searchTerm) ||
      tx.description?.includes(searchTerm)
  );

  if (found) {
    alert(`Transaction found: ${found.description} on ${new Date(found.date).toLocaleDateString()}`);
    setFilteredData([found]); // show only that transaction
  } else {
    alert("Transaction not found.");
  }
};

//  Share Report via Email (as PDF)
const handleShareReport = async () => {
  try {
    const response = await fetch("/api/send-statement-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        customerName,
        statementPeriod,
      }),
    });

    if (!response.ok) throw new Error("Failed to send email");
    alert("Report shared successfully via email!");
  } catch (err) {
    console.error(err);
    alert("Error sharing report. Please try again.");
  }
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
      
       {/* Header Section */}
<div className="sticky top-0 bg-white border-b px-6 py-5 text-center">
  {/* Customer Name + Title */}
  <h2 className="text-2xl font-bold text-gray-800">
    {customerName || "Customer Name"}
  </h2>
  <p className="text-lg font-semibold text-gray-600 mt-1">
    Customer Account Statement
  </p>

  {/* Dynamic Statement Period */}
  <div className="mt-3  py-2 ">
    <p className="text-sm text-gray-700">
      This report is for the{" "}
      <span className="font-medium text-blue-800">
        {statementPeriod.period}
      </span>{" "}
      period, starting on{" "}
      <span className="font-medium text-blue-800">
        {statementPeriod.startDate}
      </span>{" "}
      and ending on{" "}
      <span className="font-medium text-blue-800">
        {statementPeriod.endDate}
      </span>.
    </p>
  </div>

  {/* Close Button (top-right) */}
  <button
    onClick={onClose}
    className="absolute right-6 top-5 p-2 rounded-lg hover:bg-gray-100"
  >
    <X className="w-5 h-5 text-gray-600" />
  </button>
</div>


        {/* Filters and Export - Top Section */}
       <div className="p-6 border-b bg-gray-50">
  <div className="flex flex-wrap gap-4 items-center justify-between">
    {/* Left Filters Section */}
    <div className="flex flex-wrap gap-4 items-center">
      {/* Date Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Filter by:</label>
        <select
          value={dateFilter}
          onChange={(e) => handleDateFilterChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {/* Custom Date Range */}
      {dateFilter === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span>to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCustomDateApply}
            className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      )}

      {/* Items Per Page */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Show:</label>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>

    {/* Right Action Buttons */}
    <div className="flex items-center gap-2">
      {/* Find Transaction */}
      <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 bg-white">
        <Search size={16} className="text-gray-600" />
        <input
          type="text"
          placeholder="Find by M-Pesa Txn ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm focus:outline-none w-44"
        />
        <button
          onClick={handleFindTransaction}
          className="text-sm text-blue-600 hover:underline"
        >
          Find
        </button>
      </div>

      {/* Export Options */}
      <select
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="csv">CSV</option>
        <option value="pdf">PDF</option>
        <option value="excel">Excel</option>
        <option value="word">Word</option>
      </select>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
      >
        <Download size={16} />
        Export
      </button>

      {/* Share Report */}
      <button
        onClick={handleShareReport}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
      >
        <Share2 size={16} />
        Share
      </button>
    </div>
  </div>
</div>


        {/* Summary Table - Positioned just above the transactions table */}
        <div className="px-6 py-4 border-b">
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border">Total Loan Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border">Principal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border">Interest</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border">Total Paid</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 border text-right font-medium text-blue-600">
                    {formatAmount(statementSummary.totalLoanAmount)}
                  </td>
                  <td className="px-4 py-3 border text-right font-medium text-green-600">
                    {formatAmount(statementSummary.principal)}
                  </td>
                  <td className="px-4 py-3 border text-right font-medium text-yellow-600">
                    {formatAmount(statementSummary.interest)}
                  </td>
                  <td className="px-4 py-3 border text-right font-medium text-purple-600">
                    {formatAmount(statementSummary.totalPaid)}
                  </td>
                  <td className="px-4 py-3 border text-right font-medium text-red-600">
                    {formatAmount(statementSummary.outstandingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-10">
              Loading transactions...
            </p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              No transactions found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <SortableHeader label="Date" sortKey="date" />
                    <SortableHeader label="Description" sortKey="description" />
                    <SortableHeader label="Reference" sortKey="reference" />
                    <th className="px-6 py-3 text-left font-semibold">Debit</th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Credit
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((t) => (
                    <tr
                      key={t.id}
                      className={`border-b ${
                        t.isBalanceBF
                          ? "bg-gray-100 font-semibold"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-3">
                        {new Date(t.date).toLocaleString("en-KE")}
                      </td>
                      <td className="px-6 py-3">{t.description}</td>
                      <td className="px-6 py-3">{t.reference}</td>
                      <td className="px-6 py-3 text-right">
                        {t.debit !== 0 ? formatAmount(t.debit) : "-"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {t.credit > 0 ? formatAmount(t.credit) : "-"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {formatAmount(t.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Enhanced Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredTransactions.length
                )}{" "}
                of {filteredTransactions.length} entries
              </div>

              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200"
                >
                  <ChevronsLeft size={16} />
                </button>

                {/* Previous Page */}
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200"
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1 mx-2">
                  {generatePageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        typeof page === "number" && setCurrentPage(page)
                      }
                      disabled={page === "..."}
                      className={`px-3 py-2 rounded min-w-[40px] ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : page === "..."
                          ? "bg-transparent cursor-default"
                          : "bg-gray-100 hover:bg-gray-200"
                      } disabled:opacity-50`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next Page */}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200"
                >
                  Next <ChevronRight size={16} />
                </button>

                {/* Last Page */}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Report Date and Time - Bottom */}
        <div className="px-6 py-3 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Report generated on: {reportTimestamp}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerStatementModal;