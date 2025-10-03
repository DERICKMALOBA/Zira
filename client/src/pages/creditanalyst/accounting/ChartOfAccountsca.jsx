// components/ChartOfAccounts.jsx
import  { useState } from 'react';
import { Edit, PowerOff, CheckCircle, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const ChartOfAccounts = () => {
  const [activeTab, setActiveTab] = useState('ASSET');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accounts, setAccounts] = useState([
    // Sample data for demonstration
    {
      id: '1',
      accountName: 'Cash',
      accountType: 'Current Asset',
      accountCategory: 'ASSET',
      code: '1001',
      status: 'active',
      isSubAccount: false,
      description: 'Primary cash account'
    },
    {
      id: '2',
      accountName: 'Accounts Payable',
      accountType: 'Current Liability',
      accountCategory: 'LIABILITY',
      code: '2001',
      status: 'active',
      isSubAccount: false,
      description: 'Money owed to vendors'
    }
  ]);
  const [newAccount, setNewAccount] = useState({
    accountCategory: 'ASSET',
    accountName: '',
    accountCode: '',
    isSubAccount: false,
    description: '',
    status: true,
  });

  const tabs = [
    { key: 'ASSET', label: 'Asset' },
    { key: 'LIABILITY', label: 'Liability' },
    { key: 'EQUITY', label: 'Equity' },
    { key: 'INCOME', label: 'Income' },
    { key: 'EXPENSE', label: 'Expense' },
  ];

  const filteredAccounts = accounts.filter(account => 
    account.accountCategory === activeTab
  );

  const handleInputChange = (field, value) => {
    setNewAccount(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditInputChange = (field, value) => {
    if (editingAccount) {
      setEditingAccount(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleAddAccount = () => {
    const account = {
      id: Date.now().toString(),
      accountName: newAccount.accountName,
      accountType: newAccount.accountCategory,
      accountCategory: newAccount.accountCategory,
      code: newAccount.accountCode,
      status: newAccount.status ? 'active' : 'inactive',
      isSubAccount: newAccount.isSubAccount,
      description: newAccount.description,
    };

    setAccounts(prev => [...prev, account]);
    setShowAddModal(false);
    resetForm();
  };

  const handleUpdateAccount = () => {
    if (editingAccount) {
      setAccounts(prev =>
        prev.map(account =>
          account.id === editingAccount.id ? editingAccount : account
        )
      );
      setShowEditModal(false);
      setEditingAccount(null);
    }
  };

  const resetForm = () => {
    setNewAccount({
      accountCategory: 'ASSET',
      accountName: '',
      accountCode: '',
      isSubAccount: false,
      description: '',
      status: true,
    });
  };

  const handleEdit = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setEditingAccount(account);
      setShowEditModal(true);
    }
  };

  const handleDeactivate = (accountId) => {
    setAccounts(prev =>
      prev.map(account =>
        account.id === accountId
          ? { ...account, status: account.status === 'active' ? 'inactive' : 'active' }
          : account
      )
    );
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingAccount(null);
    resetForm();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-gray-800/30">Chart of Accounts</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-xs text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus/>
          Add New Account
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-xs ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Accounts Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAccounts.map(account => (
              <tr key={account.id}>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                  {account.accountName}
                  {account.isSubAccount && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Sub-account
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {account.accountType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {account.accountCategory}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {account.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                      account.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {account.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(account.id)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeactivate(account.id)}
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                    title={account.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    <PowerOff size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-xs text-gray-500">
                  No accounts found for this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <HorizontalModal
          title="Add New Account"
          onClose={closeModals}
          onSave={handleAddAccount}
          saveButtonText="Add Account"
          saveDisabled={!newAccount.accountName || !newAccount.accountCode}
        >
          <HorizontalAccountForm
            formData={newAccount}
            onChange={handleInputChange}
          />
        </HorizontalModal>
      )}

      {/* Edit Account Modal */}
      {showEditModal && editingAccount && (
        <HorizontalModal
          title="Edit Account"
          onClose={closeModals}
          onSave={handleUpdateAccount}
          saveButtonText="Update Account"
          saveDisabled={!editingAccount.accountName || !editingAccount.code}
        >
          <HorizontalEditAccountForm
            account={editingAccount}
            onChange={handleEditInputChange}
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
  children 
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
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saveDisabled}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <CheckCircle size={16} />
            {saveButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Horizontal Add Account Form Component
const HorizontalAccountForm = ({ formData, onChange }) => {
  return (
    <>
      {/* Left Column - Basic Information */}
      <div className="flex-1 space-y-4 border-r border-gray-200 pr-6">
        <h3 className="text-md font-semibold text-gray-800 mb-4">Basic Information</h3>
        
        {/* Account Category Dropdown */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Account Category *
          </label>
          <select
            value={formData.accountCategory}
            onChange={(e) => onChange('accountCategory', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ASSET">Asset</option>
            <option value="LIABILITY">Liability</option>
            <option value="EQUITY">Equity</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="LOANS">Loans</option>
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

        {/* Account Code */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Account Code *
          </label>
          <input
            type="text"
            value={formData.accountCode}
            onChange={(e) => onChange('accountCode', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter account code"
          />
        </div>

        {/* Sub Account Checkbox */}
        <div className="flex items-center pt-2">
          <input
            type="checkbox"
            checked={formData.isSubAccount}
            onChange={(e) => onChange('isSubAccount', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-xs text-gray-700">
            Make this a sub account
          </label>
        </div>
      </div>

      {/* Right Column - Additional Information */}
      <div className="flex-1 space-y-4">
        <h3 className="text-md font-semibold text-gray-800 mb-4">Additional Information</h3>

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
            placeholder="Enter account description"
          />
        </div>

        {/* Status Toggle */}
        <div className="pt-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Account Status
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {formData.status ? 'Account is active and can be used in transactions' : 'Account is inactive and cannot be used'}
              </p>
            </div>
            <div className="flex items-center">
              <span className="mr-3 text-xs font-medium text-gray-600">
                {formData.status ? 'Active' : 'Inactive'}
              </span>
              <button
                type="button"
                onClick={() => onChange('status', !formData.status)}
                className={`${
                  formData.status ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    formData.status ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Required fields note */}
        <div className="text-xs text-gray-500 pt-4">
          <p>* Required fields</p>
        </div>
      </div>
    </>
  );
};

// Horizontal Edit Account Form Component
const HorizontalEditAccountForm = ({ account, onChange }) => {
  return (
    <>
      {/* Left Column - Basic Information */}
      <div className="flex-1 space-y-4 border-r border-gray-200 pr-6">
        <h3 className="text-md font-semibold text-gray-800 mb-4">Basic Information</h3>
        
        {/* Account Category Dropdown */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Account Category *
          </label>
          <select
            value={account.accountCategory}
            onChange={(e) => onChange('accountCategory', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ASSET">Asset</option>
            <option value="LIABILITY">Liability</option>
            <option value="EQUITY">Equity</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="LOANS">Loans</option>
          </select>
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Account Name *
          </label>
          <input
            type="text"
            value={account.accountName}
            onChange={(e) => onChange('accountName', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter account name"
          />
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Account Type
          </label>
          <input
            type="text"
            value={account.accountType}
            onChange={(e) => onChange('accountType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter account type"
          />
        </div>

        {/* Account Code */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Account Code *
          </label>
          <input
            type="text"
            value={account.code}
            onChange={(e) => onChange('code', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter account code"
          />
        </div>

        {/* Sub Account Checkbox */}
        <div className="flex items-center pt-2">
          <input
            type="checkbox"
            checked={account.isSubAccount}
            onChange={(e) => onChange('isSubAccount', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-xs text-gray-700">
            Make this a sub account
          </label>
        </div>
      </div>

      {/* Right Column - Additional Information */}
      <div className="flex-1 space-y-4">
        <h3 className="text-md font-semibold text-gray-800 mb-4">Additional Information</h3>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={account.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter account description"
          />
        </div>

        {/* Status Toggle */}
        <div className="pt-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Account Status
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {account.status === 'active' ? 'Account is active and can be used in transactions' : 'Account is inactive and cannot be used'}
              </p>
            </div>
            <div className="flex items-center">
              <span className="mr-3 text-xs font-medium text-gray-600">
                {account.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <button
                type="button"
                onClick={() => onChange('status', account.status === 'active' ? 'inactive' : 'active')}
                className={`${
                  account.status === 'active' ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    account.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Required fields note */}
        <div className="text-xs text-gray-500 pt-4">
          <p>* Required fields</p>
        </div>
      </div>
    </>
  );
};

export default ChartOfAccounts;