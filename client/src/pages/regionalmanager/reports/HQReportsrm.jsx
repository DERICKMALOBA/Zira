import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, Filter, TrendingUp, Users, DollarSign, AlertCircle, FileText } from 'lucide-react';

// Mock Supabase client - Replace with your actual Supabase client
const createClient = () => ({
  from: (table) => ({
    select: (query) => ({
      eq: (col, val) => Promise.resolve({ data: [], error: null }),
      gte: (col, val) => Promise.resolve({ data: [], error: null }),
      lte: (col, val) => Promise.resolve({ data: [], error: null }),
      then: (cb) => cb({ data: [], error: null })
    })
  }),
  rpc: (fn, params) => Promise.resolve({ data: null, error: null })
});

const supabase = createClient();

// Color palette
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Utility function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(amount);
};

// Utility function to format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Report Card Component
const ReportCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => (
  <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-2">{value}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className="p-3 rounded-full bg-opacity-10" style={{ backgroundColor: color }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      )}
    </div>
    {trend && (
      <div className={`mt-4 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
      </div>
    )}
  </div>
);

// Date Range Picker Component
const DateRangePicker = ({ startDate, endDate, onStartChange, onEndChange }) => (
  <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow">
    <Calendar className="w-5 h-5 text-gray-500" />
    <div className="flex gap-2 items-center">
      <label className="text-sm font-medium text-gray-700">From:</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      />
    </div>
    <div className="flex gap-2 items-center">
      <label className="text-sm font-medium text-gray-700">To:</label>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      />
    </div>
  </div>
);

// Export utility functions
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  let csv = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header];
      
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      
      return value;
    });
    
    csv += values.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToPDF = (data, title, filename) => {
  alert('PDF export would be implemented with jsPDF library. For now, use CSV export.');
};

// Export Button Component
const ExportButton = ({ onExport, loading }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {loading ? 'Exporting...' : 'Export Report'}
      </button>
      
      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <button
              onClick={() => {
                onExport('csv');
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Export as CSV
            </button>
            <button
              onClick={() => {
                onExport('excel');
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Export as Excel
            </button>
            <button
              onClick={() => {
                onExport('pdf');
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Export as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Active Loans Report
const ActiveLoansReport = ({ startDate, endDate, onExport }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveLoans();
  }, [startDate, endDate]);

  const fetchActiveLoans = async () => {
    const mockData = [
      { id: 1, customer_name: 'John Doe', loan_amount: 500000, balance: 350000, status: 'Active', progress: 30, disbursement_date: '2025-01-15' },
      { id: 2, customer_name: 'Jane Smith', loan_amount: 750000, balance: 450000, status: 'Active', progress: 40, disbursement_date: '2025-02-10' },
      { id: 3, customer_name: 'Bob Johnson', loan_amount: 300000, balance: 180000, status: 'Active', progress: 40, disbursement_date: '2025-03-05' },
    ];
    setLoans(mockData);
    setLoading(false);
  };

  const prepareExportData = () => {
    return loans.map(loan => ({
      'Customer Name': loan.customer_name,
      'Loan Amount': loan.loan_amount,
      'Outstanding Balance': loan.balance,
      'Repayment Progress (%)': loan.progress,
      'Status': loan.status,
      'Disbursement Date': loan.disbursement_date
    }));
  };

  useEffect(() => {
    onExport(() => prepareExportData());
  }, [loans]);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Active Loans</h3>
        <p className="text-sm text-gray-600 mt-1">All ongoing loans with repayment progress</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loans.map((loan) => (
              <tr key={loan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{loan.customer_name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(loan.loan_amount)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(loan.balance)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${loan.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{loan.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {loan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Overdue Loans Report
const OverdueLoansReport = ({ startDate, endDate, onExport }) => {
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [parData, setParData] = useState([]);

  useEffect(() => {
    fetchOverdueLoans();
  }, [startDate, endDate]);

  const fetchOverdueLoans = async () => {
    const mockOverdue = [
      { id: 1, customer_name: 'Alice Brown', loan_amount: 400000, overdue_amount: 50000, days_overdue: 45, contact: '0712345678', branch: 'Nairobi HQ' },
      { id: 2, customer_name: 'Chris Wilson', loan_amount: 600000, overdue_amount: 120000, days_overdue: 75, contact: '0723456789', branch: 'Mombasa' },
    ];
    
    const mockPAR = [
      { name: '1-30 Days', value: 15, amount: 2500000 },
      { name: '31-60 Days', value: 8, amount: 1800000 },
      { name: '61-90 Days', value: 5, amount: 1200000 },
      { name: '90+ Days', value: 3, amount: 800000 },
    ];

    setOverdueLoans(mockOverdue);
    setParData(mockPAR);
  };

  const prepareExportData = () => {
    return overdueLoans.map(loan => ({
      'Customer Name': loan.customer_name,
      'Loan Amount': loan.loan_amount,
      'Overdue Amount': loan.overdue_amount,
      'Days Overdue': loan.days_overdue,
      'Contact': loan.contact,
      'Branch': loan.branch
    }));
  };

  useEffect(() => {
    onExport(() => prepareExportData());
  }, [overdueLoans]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Portfolio at Risk (PAR)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={parData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.name}: ${entry.value}%`}
              >
                {parData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Overdue Amount by Period</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={parData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Overdue Loans Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overdue Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Overdue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {overdueLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{loan.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(loan.loan_amount)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-red-600">{formatCurrency(loan.overdue_amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      loan.days_overdue > 60 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {loan.days_overdue} days
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{loan.contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Defaulted Loans Report
const DefaultedLoansReport = ({ startDate, endDate, onExport }) => {
  const [defaultedLoans, setDefaultedLoans] = useState([]);
  const [summaryStats, setSummaryStats] = useState({});

  useEffect(() => {
    fetchDefaultedLoans();
  }, [startDate, endDate]);

  const fetchDefaultedLoans = async () => {
    const mockDefaulted = [
      { id: 1, customer_name: 'David Miller', loan_amount: 800000, outstanding: 600000, days_defaulted: 120, last_payment: '2024-12-10', officer: 'John Kamau', branch: 'Nairobi HQ' },
      { id: 2, customer_name: 'Sarah Connor', loan_amount: 450000, outstanding: 380000, days_defaulted: 95, last_payment: '2025-01-05', officer: 'Mary Wanjiku', branch: 'Mombasa' },
      { id: 3, customer_name: 'Michael Ross', loan_amount: 1000000, outstanding: 850000, days_defaulted: 150, last_payment: '2024-11-20', officer: 'Peter Omondi', branch: 'Kisumu' },
    ];

    const stats = {
      total_count: 12,
      total_amount: 8500000,
      avg_days_defaulted: 115,
      recovery_rate: 15
    };

    setDefaultedLoans(mockDefaulted);
    setSummaryStats(stats);
  };

  const prepareExportData = () => {
    return defaultedLoans.map(loan => ({
      'Customer Name': loan.customer_name,
      'Loan Amount': loan.loan_amount,
      'Outstanding Amount': loan.outstanding,
      'Days Defaulted': loan.days_defaulted,
      'Last Payment Date': loan.last_payment,
      'Relationship Officer': loan.officer,
      'Branch': loan.branch
    }));
  };

  useEffect(() => {
    onExport(() => prepareExportData());
  }, [defaultedLoans]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ReportCard
          title="Defaulted Loans"
          value={summaryStats.total_count}
          subtitle="Total count"
          icon={AlertCircle}
          color="#ef4444"
        />
        <ReportCard
          title="Outstanding Amount"
          value={formatCurrency(summaryStats.total_amount)}
          icon={DollarSign}
          color="#dc2626"
        />
        <ReportCard
          title="Avg Days Defaulted"
          value={`${summaryStats.avg_days_defaulted} days`}
          icon={Calendar}
          color="#f59e0b"
        />
        <ReportCard
          title="Recovery Rate"
          value={`${summaryStats.recovery_rate}%`}
          subtitle="Last 6 months"
          icon={TrendingUp}
          color="#10b981"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b bg-red-50">
          <h3 className="text-lg font-semibold text-red-900">Defaulted Loans - Requires Action</h3>
          <p className="text-sm text-red-700 mt-1">Loans that have been written off or require legal action</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Defaulted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Officer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {defaultedLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{loan.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(loan.loan_amount)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-red-600">{formatCurrency(loan.outstanding)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {loan.days_defaulted} days
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(loan.last_payment)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{loan.officer}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{loan.branch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Loan Performance Report
const LoanPerformanceReport = ({ startDate, endDate, onExport }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    fetchPerformanceData();
  }, [period, startDate, endDate]);

  const fetchPerformanceData = async () => {
    const mockData = [
      { period: 'Jan 2025', disbursed: 15000000, repaid: 12000000, interest: 1500000 },
      { period: 'Feb 2025', disbursed: 18000000, repaid: 14000000, interest: 1800000 },
      { period: 'Mar 2025', disbursed: 20000000, repaid: 16000000, interest: 2000000 },
      { period: 'Apr 2025', disbursed: 22000000, repaid: 18000000, interest: 2200000 },
      { period: 'May 2025', disbursed: 25000000, repaid: 20000000, interest: 2500000 },
    ];
    setPerformanceData(mockData);
  };

  const totalDisbursed = performanceData.reduce((sum, item) => sum + item.disbursed, 0);
  const totalRepaid = performanceData.reduce((sum, item) => sum + item.repaid, 0);
  const totalInterest = performanceData.reduce((sum, item) => sum + item.interest, 0);

  const prepareExportData = () => {
    return performanceData.map(item => ({
      'Period': item.period,
      'Disbursed Amount': item.disbursed,
      'Repaid Amount': item.repaid,
      'Interest Income': item.interest,
      'Net Recovery (%)': ((item.repaid / item.disbursed) * 100).toFixed(2)
    }));
  };

  useEffect(() => {
    onExport(() => prepareExportData());
  }, [performanceData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {['monthly', 'quarterly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg capitalize ${
                period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard
          title="Total Disbursed"
          value={formatCurrency(totalDisbursed)}
          icon={DollarSign}
          color="#3b82f6"
          trend={12}
        />
        <ReportCard
          title="Total Repaid"
          value={formatCurrency(totalRepaid)}
          icon={TrendingUp}
          color="#10b981"
          trend={8}
        />
        <ReportCard
          title="Interest Income"
          value={formatCurrency(totalInterest)}
          icon={DollarSign}
          color="#8b5cf6"
          trend={15}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Disbursement vs Repayment Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="disbursed" stroke="#3b82f6" strokeWidth={2} name="Disbursed" />
            <Line type="monotone" dataKey="repaid" stroke="#10b981" strokeWidth={2} name="Repaid" />
            <Line type="monotone" dataKey="interest" stroke="#8b5cf6" strokeWidth={2} name="Interest" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
// Branch Performance Report (continued)
const BranchPerformanceReport = ({ startDate, endDate, onExport }) => {
  const [branchData, setBranchData] = useState([]);

  useEffect(() => {
    fetchBranchData();
  }, [startDate, endDate]);

  const fetchBranchData = async () => {
    const mockData = [
      { branch: 'Nairobi HQ', loans: 45, disbursed: 35000000, collected: 28000000, default_rate: 2.5, officers: 8 },
      { branch: 'Mombasa', loans: 32, disbursed: 24000000, collected: 19000000, default_rate: 3.8, officers: 5 },
      { branch: 'Kisumu', loans: 28, disbursed: 18000000, collected: 14500000, default_rate: 4.2, officers: 4 },
      { branch: 'Eldoret', loans: 22, disbursed: 15000000, collected: 12000000, default_rate: 3.1, officers: 3 },
    ];
    setBranchData(mockData);
  };

  const prepareExportData = () => {
    return branchData.map(branch => ({
      'Branch Name': branch.branch,
      'Total Loans': branch.loans,
      'Disbursed Amount': branch.disbursed,
      'Collected Amount': branch.collected,
      'Collection Rate (%)': ((branch.collected / branch.disbursed) * 100).toFixed(2),
      'Default Rate (%)': branch.default_rate,
      'Number of Officers': branch.officers
    }));
  };

  useEffect(() => {
    onExport(() => prepareExportData());
  }, [branchData]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Branch Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={branchData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="branch" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="disbursed" fill="#3b82f6" name="Disbursed" />
            <Bar dataKey="collected" fill="#10b981" name="Collected" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Branch Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Loans</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disbursed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Officers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {branchData.map((branch, index) => (
                <tr key={branch.branch} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{branch.branch}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{branch.loans}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(branch.disbursed)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(branch.collected)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="font-medium text-green-600">
                      {((branch.collected / branch.disbursed) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className={`font-medium ${branch.default_rate > 3.5 ? 'text-red-600' : 'text-green-600'}`}>
                      {branch.default_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{branch.officers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Main Reporting Dashboard Component
const HQReportsrm = () => {
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-03-31');
  const [activeReport, setActiveReport] = useState('performance');
  const [exportData, setExportData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const reportTypes = [
    { id: 'performance', name: 'Loan Performance', icon: TrendingUp },
    { id: 'active', name: 'Active Loans', icon: Users },
    { id: 'overdue', name: 'Overdue Loans', icon: AlertCircle },
    { id: 'defaulted', name: 'Defaulted Loans', icon: FileText },
    { id: 'branch', name: 'Branch Performance', icon: TrendingUp },
  ];

  const handleExport = (format) => {
    if (!exportData) {
      alert('No data available for export');
      return;
    }

    setExportLoading(true);
    
    try {
      const data = exportData();
      const filename = `${reportTypes.find(r => r.id === activeReport)?.name || 'Report'}_${startDate}_to_${endDate}`;
      
      switch (format) {
        case 'csv':
          exportToCSV(data, `${filename}.csv`);
          break;
        case 'excel':
          exportToCSV(data, `${filename}.xlsx`);
          break;
        case 'pdf':
          exportToPDF(data, reportTypes.find(r => r.id === activeReport)?.name, `${filename}.pdf`);
          break;
        default:
          exportToCSV(data, `${filename}.csv`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportDataSetup = (exportFunction) => {
    setExportData(() => exportFunction);
  };

  const renderReport = () => {
    const commonProps = {
      startDate,
      endDate,
      onExport: handleExportDataSetup
    };

    switch (activeReport) {
      case 'performance':
        return <LoanPerformanceReport {...commonProps} />;
      case 'active':
        return <ActiveLoansReport {...commonProps} />;
      case 'overdue':
        return <OverdueLoansReport {...commonProps} />;
      case 'defaulted':
        return <DefaultedLoansReport {...commonProps} />;
      case 'branch':
        return <BranchPerformanceReport {...commonProps} />;
      default:
        return <LoanPerformanceReport {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Loan Portfolio Reports</h1>
          <p className="text-gray-600 mt-2">Comprehensive analysis of your loan portfolio performance</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
            />
          </div>
          <div className="flex justify-end">
            <ExportButton onExport={handleExport} loading={exportLoading} />
          </div>
        </div>

        {/* Report Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex overflow-x-auto">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeReport === report.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {report.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Content */}
        <div className="mb-8">
          {renderReport()}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportCard
            title="Total Portfolio"
            value={formatCurrency(125000000)}
            subtitle="Active loans"
            icon={DollarSign}
            color="#3b82f6"
            trend={8}
          />
          <ReportCard
            title="Active Loans"
            value="1,245"
            subtitle="Customers"
            icon={Users}
            color="#10b981"
            trend={5}
          />
          <ReportCard
            title="Portfolio at Risk"
            value="3.2%"
            subtitle=">30 days overdue"
            icon={AlertCircle}
            color="#f59e0b"
            trend={-2}
          />
          <ReportCard
            title="Recovery Rate"
            value="94.8%"
            subtitle="Last 30 days"
            icon={TrendingUp}
            color="#8b5cf6"
            trend={1}
          />
        </div>
      </div>
    </div>
  );
};

export default HQReportsrm;