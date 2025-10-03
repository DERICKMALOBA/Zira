// components/Transactions.jsx
import React, { useState } from 'react';
import { Search, Archive, RefreshCw, Eye, Download, Filter, MoreVertical, ChevronDown, Calendar } from 'lucide-react';

// Main Component
const Transactionsca = () => {
  const [activeMainTab, setActiveMainTab] = useState('payments');
  const [activePaymentTab, setActivePaymentTab] = useState('suspense');
  const [activePaymentType, setActivePaymentType] = useState('mobile');
  const [activeDisbursementTab, setActiveDisbursementTab] = useState('mobile');

  // Sample data for payments
  const paymentTransactions = [
    {
      id: '1',
      firstName: 'John',
      billReference: 'INV-2024-001',
      amount: 1500.00,
      mpesaCode: 'MPE23456789',
      status: 'suspense',
      createdDate: '2024-01-15 10:30:00'
    },
    {
      id: '2',
      firstName: 'Jane',
      billReference: 'INV-2024-002',
      amount: 2500.00,
      mpesaCode: 'MPE23456790',
      status: 'successful',
      createdDate: '2024-01-16 14:45:00'
    },
    {
      id: '3',
      firstName: 'Mike',
      billReference: 'INV-2024-003',
      amount: 1800.00,
      mpesaCode: 'MPE23456791',
      status: 'suspense',
      createdDate: '2024-01-17 09:15:00'
    }
  ];

  // Sample data for disbursements
  const disbursementTransactions = [
    {
      id: '1',
      customerName: 'ABC Corporation',
      accountNumber: '1234567890',
      branch: 'Nairobi CBD',
      appliedAmount: 50000.00,
      disbursedAmount: 50000.00,
      result: 'Success',
      mpesaCode: 'MPD23456789',
      creditParty: 'Safaricom',
      createdBy: 'Admin User',
      status: 'successful',
      createdDate: '2024-01-15 11:30:00'
    },
    {
      id: '2',
      customerName: 'XYZ Ltd',
      accountNumber: '0987654321',
      branch: 'Westlands',
      appliedAmount: 75000.00,
      disbursedAmount: 75000.00,
      result: 'Success',
      mpesaCode: 'MPD23456790',
      creditParty: 'Airtel',
      createdBy: 'Finance Manager',
      status: 'suspense',
      createdDate: '2024-01-16 15:45:00'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'successful':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'suspense':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleReconcile = (id) => {
    console.log('Reconcile transaction:', id);
  };

  const handleArchive = (id) => {
    console.log('Archive transaction:', id);
  };

  const filteredPayments = paymentTransactions.filter(
    transaction => transaction.status === activePaymentTab
  );

  const filteredDisbursements = disbursementTransactions.filter(
    transaction => activeDisbursementTab === 'mobile' 
      ? transaction.creditParty.includes('Safaricom') || transaction.creditParty.includes('Airtel') || transaction.creditParty.includes('Telkom')
      : !transaction.creditParty.includes('Safaricom') && !transaction.creditParty.includes('Airtel') && !transaction.creditParty.includes('Telkom')
  );

  const paymentTypes = [
    { key: 'mobile', label: 'Mobile Money Payments' },
    { key: 'bank', label: 'Bank Payments' },
    { key: 'embedded', label: 'Embedded Payments' }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-gray-900/30">Transactions</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar size={16} />
              Date Range
              <ChevronDown size={14} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={16} />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Main Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveMainTab('payments')}
              className={`px-6 py-4 font-medium text-xs border-b-2 transition-colors ${
                activeMainTab === 'payments'
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => setActiveMainTab('disbursements')}
              className={`px-6 py-4 font-medium text-xs border-b-2 transition-colors ${
                activeMainTab === 'disbursements'
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Disbursements
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Payments Section */}
          {activeMainTab === 'payments' && (
            <div className="space-y-6">
              {/* Payment Type Tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                {paymentTypes.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setActivePaymentType(type.key)}
                    className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                      activePaymentType === type.key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Status Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActivePaymentTab('suspense')}
                  className={`px-4 py-2 text-xs font-medium rounded-full border transition-colors ${
                    activePaymentTab === 'suspense'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Suspense
                </button>
                <button
                  onClick={() => setActivePaymentTab('successful')}
                  className={`px-4 py-2 text-xs font-medium rounded-full border transition-colors ${
                    activePaymentTab === 'successful'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Successful
                </button>
              </div>

              {/* Payments Table */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        First Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Bill Reference
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Mpesa Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                          {transaction.firstName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {transaction.billReference}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-900">
                          KES {transaction.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 font-mono">
                          {transaction.mpesaCode}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(transaction.status)}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {transaction.createdDate}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleReconcile(transaction.id)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Reconcile"
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              onClick={() => handleArchive(transaction.id)}
                              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                              title="Archive"
                            >
                              <Archive size={14} />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                              title="More options"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-500">
                          No {activePaymentTab} transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disbursements Section */}
          {activeMainTab === 'disbursements' && (
            <div className="space-y-6">
              {/* Disbursement Type Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveDisbursementTab('mobile')}
                  className={`px-4 py-2 text-xs font-medium rounded-full border transition-colors ${
                    activeDisbursementTab === 'mobile'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Mobile Money Disbursements
                </button>
                <button
                  onClick={() => setActiveDisbursementTab('bank')}
                  className={`px-4 py-2 text-xs font-medium rounded-full border transition-colors ${
                    activeDisbursementTab === 'bank'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Bank Disbursements
                </button>
              </div>

              {/* Disbursements Table */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amounts
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Result
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDisbursements.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-xs font-medium text-gray-900">{transaction.customerName}</div>
                            <div className="text-xs text-gray-500">{transaction.creditParty}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900 font-mono">{transaction.accountNumber}</div>
                          <div className="text-xs text-gray-500">By {transaction.createdBy}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {transaction.branch}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs font-semibold text-gray-900">
                            KES {transaction.disbursedAmount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Applied: KES {transaction.appliedAmount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{transaction.result}</div>
                          <div className="text-xs text-gray-500 font-mono">{transaction.mpesaCode}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(transaction.status)}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {transaction.createdDate}
                        </td>
                      </tr>
                    ))}
                    {filteredDisbursements.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-500">
                          No {activeDisbursementTab} disbursements found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Showing <span className="font-semibold">1-{filteredPayments.length}</span> of{' '}
              <span className="font-semibold">{paymentTransactions.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <button className="px-3 py-1.5 text-xs text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                1
              </button>
              <button className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                2
              </button>
              <button className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactionsca;