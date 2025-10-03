// components/BankReconciliations.jsx
import React, { useState } from 'react';
import { Search, Filter, Download, MoreVertical, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

// Main Component
const BankReconciliationsca = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sample data
  const reconciliations = [
    {
      id: '1',
      name: 'John Kamau',
      mobileNumber: '+254712345678',
      amount: 1500.00,
      mpesaReference: 'MPE23456789',
      bankReference: 'BNK98765432',
      status: 'matched',
      date: '2024-01-15 10:30:00'
    },
    {
      id: '2',
      name: 'Jane Wanjiku',
      mobileNumber: '+254723456789',
      amount: 2500.00,
      mpesaReference: 'MPE23456790',
      bankReference: 'BNK98765433',
      status: 'unmatched',
      date: '2024-01-16 14:45:00'
    },
    {
      id: '3',
      name: 'Mike Ochieng',
      mobileNumber: '+254734567890',
      amount: 1800.00,
      mpesaReference: 'MPE23456791',
      bankReference: 'BNK98765434',
      status: 'pending',
      date: '2024-01-17 09:15:00'
    },
    {
      id: '4',
      name: 'Sarah Auma',
      mobileNumber: '+254745678901',
      amount: 3200.00,
      mpesaReference: 'MPE23456792',
      bankReference: 'BNK98765435',
      status: 'disputed',
      date: '2024-01-18 16:20:00'
    },
    {
      id: '5',
      name: 'David Mwangi',
      mobileNumber: '+254756789012',
      amount: 2750.00,
      mpesaReference: 'MPE23456793',
      bankReference: 'BNK98765436',
      status: 'matched',
      date: '2024-01-19 11:30:00'
    },
    {
      id: '6',
      name: 'Grace Wambui',
      mobileNumber: '+254767890123',
      amount: 4200.00,
      mpesaReference: 'MPE23456794',
      bankReference: 'BNK98765437',
      status: 'unmatched',
      date: '2024-01-20 13:45:00'
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'matched', label: 'Matched' },
    { value: 'unmatched', label: 'Unmatched' },
    { value: 'pending', label: 'Pending' },
    { value: 'disputed', label: 'Disputed' }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'matched':
        return <CheckCircle className="h-4 w-4" />;
      case 'unmatched':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'disputed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'matched':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'unmatched':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'disputed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'matched':
        return 'Matched';
      case 'unmatched':
        return 'Unmatched';
      case 'pending':
        return 'Pending';
      case 'disputed':
        return 'Disputed';
      default:
        return status;
    }
  };

  const filteredReconciliations = reconciliations.filter(rec => {
    const matchesSearch = 
      rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.mobileNumber.includes(searchTerm) ||
      rec.mpesaReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.bankReference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleReconcile = (id) => {
    console.log('Reconcile transaction:', id);
    // Implement reconcile logic
  };

  const handleViewDetails = (id) => {
    console.log('View details:', id);
    // Implement view details logic
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-xs">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-gray-900/30">Bank Reconciliations</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex text-xs items-center gap-2 px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <RefreshCw size={16} />
              Run Reconciliation
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{reconciliations.length}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-600">Matched</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {reconciliations.filter(r => r.status === 'matched').length}
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-600">Unmatched</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {reconciliations.filter(r => r.status === 'unmatched').length}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {reconciliations.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, mobile, reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-initial justify-center">
              <Filter size={16} />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-initial justify-center">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Table with horizontal scroll */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                  Mobile Number
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                  Mpesa Reference
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                  Bank Reference
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReconciliations.map((reconciliation) => (
                <tr key={reconciliation.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{reconciliation.name}</div>
                    <div className="text-gray-500">{reconciliation.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono">
                    {reconciliation.mobileNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">
                      KES {reconciliation.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono">
                    {reconciliation.mpesaReference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono">
                    {reconciliation.bankReference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-full border ${getStatusColor(reconciliation.status)}`}
                    >
                      {getStatusIcon(reconciliation.status)}
                      {getStatusText(reconciliation.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {reconciliation.status === 'unmatched' && (
                        <button
                          onClick={() => handleReconcile(reconciliation.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          Reconcile
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetails(reconciliation.id)}
                        className="text-gray-600 hover:text-gray-800 font-medium px-3 py-1.5 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        View
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded transition-colors">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReconciliations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No reconciliations found</p>
                      <p className="mt-1">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-gray-600">
              Showing <span className="font-semibold">1-{filteredReconciliations.length}</span> of{' '}
              <span className="font-semibold">{filteredReconciliations.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <button className="px-3 py-1.5 text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                1
              </button>
              <button className="px-3 py-1.5 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankReconciliationsca;