// components/DebitComponent.jsx
import React, { useState } from 'react';
import { Search, Plus, Eye, X, CheckCircle, Calendar, User, FileText, DollarSign, BookOpen } from 'lucide-react';

// Main Component
const Journalca = () => {
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [debitEntries, setDebitEntries] = useState([
    {
      id: '1',
      journalType: 'Debit G/L Account',
      customerName: 'John Doe',
      amount: 1500.00,
      description: 'Office supplies purchase including stationery, printer ink, and other office necessities for the administrative department.',
      status: 'Approved',
      createdBy: 'Admin User',
      createdAt: '2024-01-15 10:30:00'
    },
    {
      id: '2',
      journalType: 'Charge Customer',
      customerName: 'ABC Corporation',
      amount: 2500.00,
      description: 'Service charge for Q1 maintenance and support services rendered to the client.',
      status: 'Pending',
      createdBy: 'Finance Manager',
      createdAt: '2024-01-16 14:45:00'
    },
    {
      id: '3',
      journalType: 'Debit Customer Account',
      customerName: 'Jane Smith',
      amount: 1800.00,
      description: 'Product invoice payment for order #INV-2024-001',
      status: 'Approved',
      createdBy: 'Sales Executive',
      createdAt: '2024-01-17 09:15:00'
    }
  ]);

  const [newEntryForm, setNewEntryForm] = useState({
    type: '',
    accountName: '',
    accountType: '',
    searchAccount: '',
    amount: '',
    description: ''
  });

  const journalTypes = [
    'Debit G/L Account',
    'Credit Customer Account',
    'Charge Customer',
    'Debit Customer Account'
  ];

  const accountTypes = [
    'G/L Account',
    'Customer Account'
  ];

  const handleInputChange = (field, value) => {
    setNewEntryForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddNewEntry = () => {
    const newEntry = {
      id: Date.now().toString(),
      journalType: newEntryForm.type,
      customerName: newEntryForm.accountName,
      amount: parseFloat(newEntryForm.amount),
      description: newEntryForm.description,
      status: 'Pending',
      createdBy: 'Current User', // This would typically come from auth context
      createdAt: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };

    setDebitEntries(prev => [newEntry, ...prev]);
    setShowNewEntryModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewEntryForm({
      type: '',
      accountName: '',
      accountType: '',
      searchAccount: '',
      amount: '',
      description: ''
    });
  };

  const handleView = (entryId) => {
    const entry = debitEntries.find(entry => entry.id === entryId);
    if (entry) {
      setSelectedEntry(entry);
      setShowViewModal(true);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedEntry(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Pending':
        return <div className="h-2 w-2 bg-yellow-600 rounded-full" />;
      case 'Rejected':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-2 w-2 bg-gray-600 rounded-full" />;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-gray-800/30">Journal</h1>
        <button
          onClick={() => setShowNewEntryModal(true)}
          className="bg-blue-600 text-xs text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus />
          New Entry
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Journal Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {debitEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                  {entry.journalType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {entry.customerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-semibold">
                  ${entry.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                  {entry.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}
                  >
                    {getStatusIcon(entry.status)}
                    <span className="ml-1">{entry.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {entry.createdBy}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {entry.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                  <button
                    onClick={() => handleView(entry.id)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {debitEntries.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-xs text-gray-500">
                  No debit entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Entry Modal */}
      {showNewEntryModal && (
        <HorizontalModal
          title="Journal Voucher"
          onClose={() => {
            setShowNewEntryModal(false);
            resetForm();
          }}
          onSave={handleAddNewEntry}
          saveButtonText="Create Entry"
          saveDisabled={!newEntryForm.type || !newEntryForm.accountName || !newEntryForm.accountType || !newEntryForm.amount}
        >
          <HorizontalNewEntryForm
            formData={newEntryForm}
            onChange={handleInputChange}
            journalTypes={journalTypes}
            accountTypes={accountTypes}
          />
        </HorizontalModal>
      )}

      {/* View Entry Modal */}
      {showViewModal && selectedEntry && (
        <HorizontalModal
          title="Entry Details"
          onClose={closeViewModal}
          onSave={closeViewModal}
          saveButtonText="Close"
          saveDisabled={false}
          hideSaveButton={true}
        >
          <HorizontalViewEntryForm
            entry={selectedEntry}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </HorizontalModal>
      )}
    </div>
  );
};

// Horizontal Modal Component
const HorizontalModal = ({ 
  title, 
  onClose, 
  onSave, 
  saveButtonText, 
  saveDisabled, 
  children,
  hideSaveButton = false
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-hidden">
          <div className="flex gap-6 min-h-[400px]">
            {children}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors border border-gray-300 rounded-md"
          >
            {hideSaveButton ? 'Close' : 'Cancel'}
          </button>
          {!hideSaveButton && (
            <button
              onClick={onSave}
              disabled={saveDisabled}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <CheckCircle size={16} />
              {saveButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Horizontal New Entry Form Component
const HorizontalNewEntryForm = ({ 
  formData, 
  onChange, 
  journalTypes, 
  accountTypes 
}) => {
  return (
    <>
      {/* Left Column - Basic Information */}
      <div className="flex-1 space-y-4 border-r border-gray-200 pr-6">
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen size={16} />
          Basic Information
        </h3>
        
        {/* Type Dropdown */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => onChange('type', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            {journalTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Account Name *
          </label>
          <input
            type="text"
            value={formData.accountName}
            onChange={(e) => onChange('accountName', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter account name"
          />
        </div>

        {/* Account Type Dropdown */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Account Type *
          </label>
          <select
            value={formData.accountType}
            onChange={(e) => onChange('accountType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Account Type</option>
            {accountTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Column - Journal Details */}
      <div className="flex-1 space-y-4">
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={16} />
          Journal Details
        </h3>

        {/* Search Account */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Search Account
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.searchAccount}
              onChange={(e) => onChange('searchAccount', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search for account..."
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => onChange('amount', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter description for this entry..."
          />
        </div>

        {/* Required fields note */}
        <div className="text-xs text-gray-500 pt-4">
          <p>* Required fields</p>
        </div>
      </div>
    </>
  );
};

// Horizontal View Entry Form Component
const HorizontalViewEntryForm = ({ 
  entry, 
  getStatusColor, 
  getStatusIcon 
}) => {
  return (
    <>
      {/* Left Column - Entry Details */}
      <div className="flex-1 space-y-6 border-r border-gray-200 pr-6">
        <h3 className="text-md font-semibold text-gray-800 mb-4">Entry Details</h3>
        
        {/* Journal Type */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">
            Journal Type
          </label>
          <div className="flex items-center text-xs text-gray-900 p-3 bg-gray-50 rounded-lg">
            <FileText className="h-4 w-4 mr-3 text-gray-400" />
            {entry.journalType}
          </div>
        </div>

        {/* Customer Name */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">
            Customer Name
          </label>
          <div className="flex items-center text-xs text-gray-900 p-3 bg-gray-50 rounded-lg">
            <User className="h-4 w-4 mr-3 text-gray-400" />
            {entry.customerName}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">
            Amount
          </label>
          <div className="flex items-center text-lg font-semibold text-gray-900 p-3 bg-gray-50 rounded-lg">
            <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
            ${entry.amount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Right Column - Additional Information */}
      <div className="flex-1 space-y-6">
        <h3 className="text-md font-semibold text-gray-800 mb-4">Additional Information</h3>

        {/* Status */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">
            Status
          </label>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span
              className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}
            >
              {getStatusIcon(entry.status)}
              <span className="ml-2">{entry.status}</span>
            </span>
          </div>
        </div>

        {/* Created By */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">
            Created By
          </label>
          <div className="flex items-center text-xs text-gray-900 p-3 bg-gray-50 rounded-lg">
            <User className="h-4 w-4 mr-3 text-gray-400" />
            {entry.createdBy}
          </div>
        </div>

        {/* Created At */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">
            Created At
          </label>
          <div className="flex items-center text-xs text-gray-900 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-4 w-4 mr-3 text-gray-400" />
            {entry.createdAt}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">
            Description
          </label>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-700 leading-relaxed">
              {entry.description}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Journalca;