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
  
  

  // Statement period state
  const [statementPeriod, setStatementPeriod] = useState({
    startDate: "",
    endDate: "",
    period: ""
  });

  // Set report timestamp on component mount
  useEffect(() => {
    setReportTimestamp(new Date().toLocaleString("en-KE"));
    
    // Set initial statement period
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStatementPeriod({
      startDate: firstDayOfMonth.toLocaleDateString("en-KE"),
      endDate: lastDayOfMonth.toLocaleDateString("en-KE"),
      period: "Monthly"
    });
  }, []);

useEffect(() => {
  const fetchTransactions = async () => {
    if (!customerId) return;
    setLoading(true);

    try {
      const events = [];
      let runningBalance = 0;

      // 1️⃣ Customer Info
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id, created_at, mobile")
        .eq("id", customerId)
        .single();

      if (customerError || !customer) {
        console.error("❌ Customer not found:", customerError?.message);
        setLoading(false);
        return;
      }

      // 2️⃣ Loans
      const { data: loans = [] } = await supabase
        .from("loans")
        .select("id, scored_amount, processing_fee, registration_fee, disbursed_at, disbursed_date, created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true });

      // 3️⃣ Loan Payments (fetch first to know which M-Pesa codes are payments)
      const { data: loanPayments = [], error: loanPaymentsError } = await supabase
        .from("loan_payments")
        .select(`
          id,
          loan_id,
          installment_id,
          paid_amount,
          balanceBefore,
          balance_after,
          mpesa_receipt,
          phone_number,
          paid_at,
          payment_type
        `)
        .in("loan_id", loans.map(l => l.id))
        .order("paid_at", { ascending: true });

      if (loanPaymentsError) {
        console.error("❌ Loan payments fetch failed:", loanPaymentsError.message);
      }

      // Create a set of M-Pesa codes that are loan payments (to exclude from deposits)
      const loanPaymentMpesaCodes = new Set(
        loanPayments.map(p => p.mpesa_receipt).filter(Boolean)
      );

      // 4️⃣ C2B Payments (excluding those already in loan_payments)
      const normalizedMobile = customer.mobile?.replace(/^\+?254|^0/, "254");

      const { data: c2b = [], error: c2bError } = await supabase
        .from("mpesa_c2b_transactions")
        .select("id, amount, transaction_time, transaction_id, loan_id, phone_number, status, payment_type, reference, billref")
        .eq("status", "applied")
        .in("phone_number", [customer.mobile, normalizedMobile])
        .order("transaction_time", { ascending: true });

      if (c2bError) console.error("❌ C2B fetch error:", c2bError.message);

      // 5️⃣ B2C Disbursements
      const { data: b2c = [] } = await supabase
        .from("mpesa_b2c_transactions")
        .select("id, amount, transaction_id, loan_id, created_at")
        .eq("status", "success")
        .order("created_at", { ascending: true });

      // 6️⃣ Wallet credits with M-Pesa code
      const { data: walletCreditsData = [], error: walletError } = await supabase
        .from("customer_wallets")
        .select(`
          id,
          amount,
          created_at,
          mpesa_c2b_transactions (
            transaction_id
          )
        `)
        .eq("customer_id", customerId)
        .eq("type", "credit")
        .not("transaction_id", "is", null);

      if (walletError) console.error("❌ Wallet fetch failed:", walletError.message);

      // Track processed transaction IDs to prevent duplicates
      const processedTransactionIds = new Set();

      // ========================================
      // 📋 STEP 1: JOINING FEE (Customer Creation)
      // ========================================
      const regFee = loans[0]?.registration_fee || 0;
      
      if (regFee > 0) {
        runningBalance -= regFee;
        events.push({
          id: `reg-fee-${customer.id}`,
          date: new Date(customer.created_at),
          description: "Joining Fee",
          reference: "-",
          debit: regFee,
          credit: 0,
          balance: runningBalance,
          sequence: 0,
          timestamp: new Date(customer.created_at).getTime(),
        });
      }

      // ========================================
      // 📋 STEP 2: MOBILE MONEY DEPOSITS (excluding loan payments)
      // ========================================
      // Combine wallet and C2B deposits
      const walletDeposits = walletCreditsData.map(w => ({
        id: w.id,
        amount: w.amount,
        date: new Date(w.created_at),
        mpesaCode: w.mpesa_c2b_transactions?.transaction_id || "-",
        type: "wallet",
      }));

      // Filter out C2B transactions that are loan payments
      const c2bDeposits = c2b
        .filter(c => !loanPaymentMpesaCodes.has(c.transaction_id))
        .map(c => ({ 
          id: c.id,
          amount: c.amount, 
          type: "c2b", 
          date: new Date(c.transaction_time),
          mpesaCode: c.transaction_id 
        }));

      const allDeposits = [...walletDeposits, ...c2bDeposits]
        .sort((a, b) => a.date - b.date);

      // Process deposits
      allDeposits.forEach(d => {
        const transactionKey = `deposit-${d.mpesaCode}`;
        
        // Skip if already processed
        if (processedTransactionIds.has(transactionKey)) {
          console.log(`⚠️ Skipping duplicate deposit: ${transactionKey}`);
          return;
        }
        
        processedTransactionIds.add(transactionKey);

        const depositAmount = Number(d.amount);
        runningBalance += depositAmount;

        events.push({
          id: `${d.type}-${d.id}`,
          date: d.date,
          description: "Mobile Money Deposit",
          reference: d.mpesaCode,
          debit: 0,
          credit: depositAmount,
          balance: runningBalance,
          sequence: 1,
          timestamp: d.date.getTime(),
        });
      });

      // ========================================
      // 📋 STEP 3: LOAN DISBURSEMENTS
      // ========================================
      loans.forEach(loan => {
        const disb = b2c.find(b => b.loan_id === loan.id);
        if (!disb) return;

        const loanDate = new Date(disb.created_at);
        const baseTimestamp = loanDate.getTime();

        // 3a. Credit: Mobile Money Disbursement (loan amount coming in)
        const disbAmount = Number(disb.amount);
        runningBalance += disbAmount;
        
        events.push({
          id: `b2c-credit-${disb.id}`,
          date: loanDate,
          description: "Mobile Money Disbursement",
          reference: disb.transaction_id,
          debit: 0,
          credit: disbAmount,
          balance: runningBalance,
          sequence: 2,
          timestamp: baseTimestamp + 1,
        });

        // 3b. Debit: Processing Fee
        if (loan.processing_fee > 0) {
          const procFee = Number(loan.processing_fee);
          runningBalance -= procFee;
          
          events.push({
            id: `proc-fee-${loan.id}`,
            date: loanDate,
            description: "Processing Fee",
            reference: "-",
            debit: procFee,
            credit: 0,
            balance: runningBalance,
            sequence: 3,
            timestamp: baseTimestamp + 2,
          });
        }

        // 3c. Debit: Loan Disbursement (actual loan given out)
        runningBalance -= disbAmount;
        
        events.push({
          id: `loan-disb-${loan.id}`,
          date: loanDate,
          description: "Loan Disbursement",
          reference: "-",
          debit: disbAmount,
          credit: 0,
          balance: runningBalance,
          sequence: 4,
          timestamp: baseTimestamp + 3,
        });
      });

    
// 📋 STEP 4: LOAN PAYMENTS (Grouped per M-Pesa code)
// ========================================
if (loanPayments.length > 0) {
  // Group payments by mpesa_receipt
  const groupedPayments = loanPayments.reduce((acc, payment) => {
    const ref = payment.mpesa_receipt || "MPESA";
    if (!acc[ref]) acc[ref] = [];
    acc[ref].push(payment);
    return acc;
  }, {});

  // Process each grouped transaction
  for (const [ref, payments] of Object.entries(groupedPayments)) {
    const paymentDate = new Date(payments[0].paid_at);
    const baseTimestamp = paymentDate.getTime();
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

    // Skip duplicate credit by checking transaction reference
    const transactionKey = `loanpayment-${ref}`;
    if (processedTransactionIds.has(transactionKey)) continue;
    processedTransactionIds.add(transactionKey);

    // ✅ 4a. Credit once: Mobile Money Deposit
    runningBalance += totalPaid;
    events.push({
      id: `payment-credit-${ref}`,
      date: paymentDate,
      description: "Mobile Money Deposit",
      reference: ref,
      debit: 0,
      credit: totalPaid,
      balance: runningBalance,
      sequence: 5,
      timestamp: baseTimestamp,
    });

    // ✅ 4b. Debit for each payment type (principal, interest, etc.)
    payments.forEach((p, idx) => {
      const amt = Number(p.paid_amount || 0);
      if (!amt) return;

      runningBalance -= amt;

      let desc = "Loan Repayment";
      if (p.payment_type === "principal") desc = "Principal Repayment";
      else if (p.payment_type === "interest") desc = "Interest Repayment";

      events.push({
        id: `payment-debit-${p.id}`,
        date: paymentDate,
        description: desc,
        reference: ref,
        debit: amt,
        credit: 0,
        balance: runningBalance,
        sequence: 6 + idx,
        timestamp: baseTimestamp + (idx + 1),
      });
    });
  }
}


      // ========================================
      // 📋 STEP 5: SORT & ADD BALANCE B/F
      // ========================================
      // Sort chronologically (oldest first)
      events.sort((a, b) => a.timestamp - b.timestamp);

      // Add Balance B/F at the top (current date, showing final balance)
      const balanceBF = {
        id: "balance-bf",
        date: new Date(),
        description: "Balance B/F",
        reference: "-",
        debit: 0,
        credit: 0,
        balance: runningBalance,
        sequence: 0,
        timestamp: new Date().getTime(),
        isBalanceBF: true
      };

      // Reverse to show newest first (Balance B/F on top)
      const sortedEvents = [balanceBF, ...events.reverse()];

      // Update statement period
      if (events.length > 0) {
        const transactionDates = events.map(t => new Date(t.date));
        const minDate = new Date(Math.min(...transactionDates));
        const maxDate = new Date(Math.max(...transactionDates));
        
        setStatementPeriod(prev => ({
          ...prev,
          startDate: minDate.toLocaleDateString("en-KE"),
          endDate: maxDate.toLocaleDateString("en-KE")
        }));
      }

      // Calculate summary
      const totalDebit = events.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = events.reduce((sum, e) => sum + e.credit, 0);
      const totalLoanAmount = loans.reduce((sum, loan) => sum + (loan.scored_amount || 0), 0);
      const totalProcessingFees = loans.reduce((sum, loan) => sum + (loan.processing_fee || 0), 0);
      const totalRegistrationFees = loans.reduce((sum, loan) => sum + (loan.registration_fee || 0), 0);

      setStatementSummary({
        totalLoanAmount,
        principal: totalLoanAmount,
        interest: totalProcessingFees + totalRegistrationFees,
        totalPaid: totalCredit,
        outstandingBalance: runningBalance,
        totalDebit,
        totalCredit,
        closingBalance: runningBalance
      });

      setTransactions(sortedEvents);
      setFilteredTransactions(sortedEvents);

    } catch (err) {
      console.error("❌ Statement generation failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchTransactions();
}, [customerId]);
  // Enhanced Filtering & Sorting Helpers
  
  
  // Summary state
  const [statementSummary, setStatementSummary] = useState({
    totalLoanAmount: 0,
    principal: 0,
    interest: 0,
    totalPaid: 0,
    outstandingBalance: 0
  });
  
  
  
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
      setFilteredTransactions([found]); // show only that transaction
    } else {
      alert("Transaction not found.");
      // Reset to show all transactions if not found
      applyFilters(transactions, dateFilter);
    }
  };

  // Reset search and show all transactions
  const handleResetSearch = () => {
    setSearchTerm("");
    applyFilters(transactions, dateFilter);
  };

  // Share Report via Email (as PDF)
  const handleShareReport = async () => {
    try {
      const response = await fetch("/api/send-statement-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerName,
          statementPeriod,
          reportTimestamp,
          statementSummary
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
          <h2 className="text-2xl font-bold text-gray-800">
            {customerName || "Customer Name"}
          </h2>
          <p className="text-lg font-semibold text-gray-600 mt-1">
            Customer Account Statement 
          </p>

          {/* Dynamic Statement Period */}
          <div className="mt-3 py-2">
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

          {/* Close Button */}
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
                {searchTerm && (
                  <button
                    onClick={handleResetSearch}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Reset
                  </button>
                )}
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

        {/* Summary Table */}
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