import { useState, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
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

  // Set report timestamp when component mounts
  useEffect(() => {
    setReportTimestamp(
      new Date().toLocaleString("en-US", {
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

        //  Fetch loans
        const { data: loans, error: loansError } = await supabase
          .from("loans")
          .select(
            "id, customer_id, processing_fee, registration_fee, total_payable, scored_amount, total_interest, created_at"
          )
          .eq("customer_id", customerId);

        if (loansError) throw loansError;
        if (!loans?.length) {
          setTransactions([]);
          setFilteredTransactions([]);
          return;
        }

        const loanIds = loans.map((l) => l.id);

        //  Fetch related data
        const [{ data: installments }, { data: c2b }, { data: b2c }] =
          await Promise.all([
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

        let allEvents = [];

        //  Joining + Processing Fees
        c2b
          .filter(
            (tx) =>
              tx.payment_type === "registration" ||
              tx.payment_type === "processing"
          )
          .forEach((tx) => {
            allEvents.push({
              date: new Date(tx.transaction_time),
              description:
                tx.payment_type === "registration"
                  ? "Joining Fee Payment"
                  : "Processing Fee Payment",
              reference: tx.transaction_id || tx.reference || "-",
              credit: Number(tx.amount),
              debit: 0,
              sequence: 1,
            });
          });

        // Disbursements
        b2c.forEach((disb) => {
          const loan = loans.find((l) => l.id === disb.loan_id);
          if (!loan) return;
          const disbDate = new Date(disb.created_at);

          if (loan.registration_fee > 0)
            allEvents.push({
              date: disbDate,
              description: "Joining Fee",
              reference: "-",
              debit: Number(loan.registration_fee),
              credit: 0,
              sequence: 2,
            });

          if (loan.processing_fee > 0)
            allEvents.push({
              date: disbDate,
              description: "Processing Fee",
              reference: "-",
              debit: Number(loan.processing_fee),
              credit: 0,
              sequence: 3,
            });

          allEvents.push({
            date: disbDate,
            description: "Loan Disbursement",
            reference: disb.transaction_id || `Loan-${loan.id}`,
            credit: Number(loan.total_payable),
            debit: 0,
            sequence: 4,
          });

          allEvents.push({
            date: disbDate,
            description: "Mobile Money Disbursement",
            reference: disb.transaction_id || "-",
            credit: Number(disb.amount),
            debit: 0,
            sequence: 5,
            displayOnly: true,
          });
        });

        //  Repayments (synchronized with deposit)
        c2b
          .filter((tx) => tx.payment_type === "repayment")
          .forEach((tx) => {
            const payDate = new Date(tx.transaction_time);
            const ref = tx.transaction_id || tx.reference || "-";

            // Fetch all installments for the same loan that have been paid
            const relatedInstallments = installments.filter(
              (i) =>
                i.loan_id === tx.loan_id &&
                (i.interest_paid > 0 || i.principal_paid > 0)
            );

            //  Record the mobile money deposit
            allEvents.push({
              date: payDate,
              description: "Mobile Money Deposit",
              reference: ref,
              credit: Number(tx.amount),
              debit: 0,
              sequence: 6,
              displayOnly: true,
            });

            //  Record interest and principal repayments (same timestamp)
            relatedInstallments.forEach((inst) => {
              if (inst.interest_paid > 0) {
                allEvents.push({
                  date: payDate,
                  description: `Interest Repayment `,
                  reference: ref,
                  debit: Number(inst.interest_paid),
                  credit: 0,
                  sequence: 7,
                });
              }

              if (inst.principal_paid > 0) {
                allEvents.push({
                  date: payDate,
                  description: `Principal Repayment `,
                  reference: ref,
                  debit: Number(inst.principal_paid),
                  credit: 0,
                  sequence: 8,
                });
              }
            });
          });

        //  Sort and Calculate Balance
        allEvents.sort((a, b) => {
          const dateDiff = a.date - b.date;
          return dateDiff !== 0 ? dateDiff : a.sequence - b.sequence;
        });

        let runningBalance = 0;
        allEvents = allEvents.map((ev, idx) => {
          if (!ev.displayOnly) runningBalance += ev.credit - ev.debit;
          return { ...ev, balance: runningBalance, id: `event-${idx}` };
        });

        const balanceBF = {
          id: "balance-bf",
          date: new Date(),
          description: "Balance B/F",
          reference: "-",
          debit: 0,
          credit: 0,
          balance: runningBalance,
          isBalanceBF: true,
        };

        const finalList = [balanceBF, ...[...allEvents].reverse()];
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

  //  Export Functions (Final Improved)
  const getExportData = () => {
    // If filter is "all", export all transactions; otherwise, export only filtered ones
    return dateFilter === "all" ? transactions : filteredTransactions;
  };

  // Dynamic filename e.g. "Derick Maloba Account Statement.pdf"
  const getExportFileName = (ext) => {
    const name = (customerInfo?.name || customerName || "Customer")
      .replace(/\s+/g, " ")
      .trim();
    return `${name} Account Statement.${ext}`;
  };

  //  CSV Export
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
          /* ✅ Define equal printable margins */
          @page {
            size: A4;
            margin-left: 1in;
            margin-right: 1in;
            margin-top: 1in;
            margin-bottom: 1in;
          }

          body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            color: #000;
            margin: 0; /* Word handles page margins already */
            padding: 0;
          }

          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 16pt;
            margin-bottom: 4px;
          }
          .header h2 {
            font-size: 13pt;
            margin-bottom: 6px;
          }
          .header p {
            margin: 2px 0;
            font-size: 10pt;
          }

          /* ✅ Perfectly centered table between margins */
          table {
            border-collapse: collapse;
            width: 98%; /* Slightly smaller than 100% to balance both sides */
            margin-left: auto;
            margin-right: auto;
            table-layout: fixed;
            word-wrap: break-word;
          }

          th, td {
            border: 1px solid #999;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
            font-size: 9pt;
          }

          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }

          /* ✅ Adjust column widths proportionally */
          th:nth-child(1), td:nth-child(1) { width: 15%; } /* Date/Time */
          th:nth-child(2), td:nth-child(2) { width: 26%; } /* Description */
          th:nth-child(3), td:nth-child(3) { width: 14%; } /* Reference */
          th:nth-child(4), td:nth-child(4) { width: 15%; } /* Debit */
          th:nth-child(5), td:nth-child(5) { width: 15%; } /* Credit */
          th:nth-child(6), td:nth-child(6) { width: 15%; } /* Balance */

          td {
            word-break: break-word;
            overflow-wrap: break-word;
          }

          .footer {
            margin-top: 20px;
            font-style: italic;
            text-align: center;
            font-size: 9pt;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MULAR CREDIT LTD</h1>
          <h2>${customerInfo?.name || customerName} Account Statement</h2>
          <p><strong>Mobile:</strong> ${customerInfo?.mobile || customerInfo?.phone || "N/A"}</p>
          <p><strong>Report Generated:</strong> ${reportTimestamp}</p>
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

        <div class="footer">
          <p>Generated automatically by MULAR CREDIT LTD System.</p>
        </div>
      </body>
    </html>
  `;

  downloadFile(htmlContent, getExportFileName("doc"), "application/msword");
};

const exportToExcel = async () => {
  // Dynamically import the XLSX library
  const XLSX = await import("xlsx");

  const data = getExportData();

  // Prepare header and rows
  const worksheetData = [
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

  // Create worksheet and workbook
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Account Statement");

  // Adjust column widths (auto-fit style)
  const colWidths = [
    { wch: 22 }, // Date/Time
    { wch: 30 }, // Description
    { wch: 18 }, // Reference
    { wch: 15 }, // Debit
    { wch: 15 }, // Credit
    { wch: 15 }, // Balance
  ];
  worksheet["!cols"] = colWidths;

  // Generate Excel buffer
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  // Convert to Blob for download
  const blob = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  // Create a downloadable link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getExportFileName("xlsx");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  // PDF Export
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

    //  Header text
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

    //  Table
    autoTable(doc, {
      head: [
        ["Date/Time", "Description", "Reference", "Debit", "Credit", "Balance"],
      ],
      body: data,
      startY: 35,
      styles: {
        fontSize: 9,
        cellPadding: 2,
        overflow: "linebreak",
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
      //  Black text, no fill
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      bodyStyles: {
        textColor: [0, 0, 0],
      },
      theme: "grid",
    });

    // Save PDF
    doc.save(getExportFileName("pdf"));
  };

  //  Helper to trigger download
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

  //  Main Export Handler
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

  const formatAmount = (amt) =>
    new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amt || 0);

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

  const company = customerInfo || {
    name: customerName || "Customer",
    location: "-",
    email: "-",
    mobile: "-",
    phone: "-",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              MULAR CREDIT LTD
            </h2>
            <p className="text-gray-700 font-medium">Account Statement</p>
            <p className="text-sm text-gray-600 mt-1">
              Customer: {company.name} | Mobile:{" "}
              {company.mobile || company.phone} | {company.email}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Report Generated: {reportTimestamp}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Export */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Filter by:
                </label>
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
                <label className="text-sm font-medium text-gray-700">
                  Show:
                </label>
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

            {/* Export Options */}
            <div className="flex items-center gap-2">
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
            </div>
          </div>
        </div>

        {/* Table */}
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
                        {formatAmount(t.debit)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {formatAmount(t.credit)}
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
      </div>
    </div>
  );
};

export default CustomerStatementModal;
