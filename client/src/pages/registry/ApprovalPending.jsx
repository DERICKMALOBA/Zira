import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const ApprovalPending = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Sample loan applications pending approval
  const pendingApplications = [
    {
      id: 1,
      applicationId: 'APP-2024-001',
      customerName: 'John Doe',
      customerId: 'CUST-001',
      loanAmount: 500000,
      loanPurpose: 'Business Expansion',
      loanTerm: '36 months',
      interestRate: '12.5%',
      appliedDate: '2024-01-15',
      status: 'credit_approval',
      riskRating: 'Medium',
      priority: 'high',
      creditScore: 720,
      monthlyIncome: 150000,
      existingLoans: 1,
      collateral: 'Property Title Deed'
    },
    {
      id: 2,
      applicationId: 'APP-2024-002',
      customerName: 'Jane Smith',
      customerId: 'CUST-002',
      loanAmount: 250000,
      loanPurpose: 'Education Fees',
      loanTerm: '24 months',
      interestRate: '10.8%',
      appliedDate: '2024-01-14',
      status: 'final_approval',
      riskRating: 'Low',
      priority: 'medium',
      creditScore: 780,
      monthlyIncome: 80000,
      existingLoans: 0,
      collateral: 'Guarantor'
    },
    {
      id: 3,
      applicationId: 'APP-2024-003',
      customerName: 'Michael Johnson',
      customerId: 'CUST-003',
      loanAmount: 1000000,
      loanPurpose: 'Home Renovation',
      loanTerm: '60 months',
      interestRate: '13.2%',
      appliedDate: '2024-01-13',
      status: 'document_verification',
      riskRating: 'High',
      priority: 'high',
      creditScore: 650,
      monthlyIncome: 200000,
      existingLoans: 2,
      collateral: 'Vehicle Logbook'
    },
    {
      id: 4,
      applicationId: 'APP-2024-004',
      customerName: 'Sarah Wilson',
      customerId: 'CUST-004',
      loanAmount: 300000,
      loanPurpose: 'Medical Expenses',
      loanTerm: '12 months',
      interestRate: '9.5%',
      appliedDate: '2024-01-12',
      status: 'credit_approval',
      riskRating: 'Medium',
      priority: 'low',
      creditScore: 690,
      monthlyIncome: 120000,
      existingLoans: 1,
      collateral: 'Salary Deduction'
    }
  ];

  const statusTypes = {
    document_verification: 'Document Verification',
    credit_approval: 'Credit Approval',
    final_approval: 'Final Approval',
    rejected: 'Rejected',
    approved: 'Approved'
  };

  const statusColors = {
    document_verification: 'bg-blue-100 text-blue-800',
    credit_approval: 'bg-yellow-100 text-yellow-800',
    final_approval: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  const riskColors = {
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-green-100 text-green-800'
  };

  const filteredApplications = pendingApplications.filter(application => {
    const matchesSearch = application.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.customerId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || application.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const viewApplicationDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const approveApplication = (applicationId) => {
    console.log('Approving application:', applicationId);
    // Add approval logic here
  };

  const rejectApplication = (applicationId) => {
    console.log('Rejecting application:', applicationId);
    // Add rejection logic here
  };

  const requestMoreInfo = (applicationId) => {
    console.log('Requesting more info for application:', applicationId);
    // Add request info logic here
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals Pending</h1>
          <p className="text-sm text-gray-600 mt-1">Review and process pending loan applications</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
            {pendingApplications.length} Applications Pending
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Applications</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by customer name, application ID, or customer ID..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="document_verification">Document Verification</option>
              <option value="credit_approval">Credit Approval</option>
              <option value="final_approval">Final Approval</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{application.applicationId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{application.customerName}</div>
                    <div className="text-sm text-gray-500">ID: {application.customerId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      KES {application.loanAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">{application.loanPurpose}</div>
                    <div className="text-xs text-gray-400">{application.loanTerm}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[application.status]}`}>
                      {statusTypes[application.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${riskColors[application.riskRating]}`}>
                      {application.riskRating}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[application.priority]}`}>
                      {application.priority.charAt(0).toUpperCase() + application.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(application.appliedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewApplicationDetails(application)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => approveApplication(application.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Approve"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => rejectApplication(application.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Reject"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-500">No pending applications found.</div>
            <div className="text-sm text-gray-400 mt-1">All applications have been processed.</div>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <h3 className="text-xl font-semibold text-gray-900">Loan Application Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Customer Information
                  </h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
                      <dd className="text-sm text-gray-900">{selectedApplication.customerName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                      <dd className="text-sm text-gray-900">{selectedApplication.customerId}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Monthly Income</dt>
                      <dd className="text-sm text-gray-900">KES {selectedApplication.monthlyIncome.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Credit Score</dt>
                      <dd className="text-sm text-gray-900">{selectedApplication.creditScore}</dd>
                    </div>
                  </dl>
                </div>
                
                {/* Loan Information */}
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                    Loan Information
                  </h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Application ID</dt>
                      <dd className="text-sm text-gray-900">{selectedApplication.applicationId}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Loan Amount</dt>
                      <dd className="text-sm text-gray-900">KES {selectedApplication.loanAmount.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Interest Rate</dt>
                      <dd className="text-sm text-gray-900">{selectedApplication.interestRate}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Loan Term</dt>
                      <dd className="text-sm text-gray-900">{selectedApplication.loanTerm}</dd>
                    </div>
                  </dl>
                </div>
                
                {/* Risk Assessment */}
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                    Risk Assessment
                  </h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Risk Rating</dt>
                      <dd className="text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${riskColors[selectedApplication.riskRating]}`}>
                          {selectedApplication.riskRating}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Existing Loans</dt>
                      <dd className="text-sm text-gray-900">{selectedApplication.existingLoans}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Collateral</dt>
                      <dd className="text-sm text-gray-900">{selectedApplication.collateral}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Priority</dt>
                      <dd className="text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[selectedApplication.priority]}`}>
                          {selectedApplication.priority.charAt(0).toUpperCase() + selectedApplication.priority.slice(1)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {/* Application Details */}
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Application Details
                  </h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Loan Purpose</dt>
                      <dd className="text-sm text-gray-900">{selectedApplication.loanPurpose}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Applied Date</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedApplication.appliedDate).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[selectedApplication.status]}`}>
                          {statusTypes[selectedApplication.status]}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => approveApplication(selectedApplication.id)}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Approve Application
                </button>
                <button
                  onClick={() => requestMoreInfo(selectedApplication.id)}
                  className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors flex items-center justify-center"
                >
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Request More Info
                </button>
                <button
                  onClick={() => rejectApplication(selectedApplication.id)}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Reject Application
                </button>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalPending;