import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const PendingAmendments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedAmendment, setSelectedAmendment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Sample pending amendments data
  const pendingAmendments = [
    {
      id: 1,
      amendmentId: 'AMND-001',
      customerName: 'John Doe',
      customerId: 'CUST-001',
      amendmentType: 'personal_info',
      amendmentDetails: 'Address change from Nairobi to Mombasa',
      submittedDate: '2024-01-15',
      status: 'pending_review',
      submittedBy: 'Customer (Self)',
      priority: 'medium'
    },
    {
      id: 2,
      amendmentId: 'AMND-002',
      customerName: 'Jane Smith',
      customerId: 'CUST-002',
      amendmentType: 'contact_info',
      amendmentDetails: 'Phone number update',
      submittedDate: '2024-01-14',
      status: 'pending_verification',
      submittedBy: 'Customer Service Agent',
      priority: 'high'
    },
    {
      id: 3,
      amendmentId: 'AMND-003',
      customerName: 'Michael Johnson',
      customerId: 'CUST-003',
      amendmentType: 'financial_info',
      amendmentDetails: 'Income documentation update',
      submittedDate: '2024-01-13',
      status: 'pending_approval',
      submittedBy: 'Customer (Self)',
      priority: 'low'
    },
    {
      id: 4,
      amendmentId: 'AMND-004',
      customerName: 'Sarah Wilson',
      customerId: 'CUST-004',
      amendmentType: 'document_upload',
      amendmentDetails: 'ID document replacement',
      submittedDate: '2024-01-12',
      status: 'pending_review',
      submittedBy: 'Branch Manager',
      priority: 'medium'
    }
  ];

  const amendmentTypes = {
    personal_info: 'Personal Information',
    contact_info: 'Contact Information',
    financial_info: 'Financial Information',
    document_upload: 'Document Upload',
    other: 'Other'
  };

  const statusColors = {
    pending_review: 'bg-blue-100 text-blue-800',
    pending_verification: 'bg-yellow-100 text-yellow-800',
    pending_approval: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  const filteredAmendments = pendingAmendments.filter(amendment => {
    const matchesSearch = amendment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         amendment.amendmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         amendment.customerId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || amendment.amendmentType === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const viewAmendmentDetails = (amendment) => {
    setSelectedAmendment(amendment);
    setShowModal(true);
  };

  const approveAmendment = (amendmentId) => {
    console.log('Approving amendment:', amendmentId);
    // Add approval logic here
  };

  const rejectAmendment = (amendmentId) => {
    console.log('Rejecting amendment:', amendmentId);
    // Add rejection logic here
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Amendments</h1>
          <p className="text-sm text-gray-600 mt-1">Manage customer information change requests</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
            {pendingAmendments.length} Pending
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Amendments</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by customer name, amendment ID, or customer ID..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Type Filter */}
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Amendment Type</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="personal_info">Personal Information</option>
              <option value="contact_info">Contact Information</option>
              <option value="financial_info">Financial Information</option>
              <option value="document_upload">Document Upload</option>
              <option value="other">Other</option>
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

      {/* Amendments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amendment ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAmendments.map((amendment) => (
                <tr key={amendment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{amendment.amendmentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{amendment.customerName}</div>
                    <div className="text-sm text-gray-500">ID: {amendment.customerId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{amendmentTypes[amendment.amendmentType]}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 line-clamp-2">{amendment.amendmentDetails}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[amendment.status]}`}>
                      {amendment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[amendment.priority]}`}>
                      {amendment.priority.charAt(0).toUpperCase() + amendment.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(amendment.submittedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewAmendmentDetails(amendment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => approveAmendment(amendment.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Approve"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => rejectAmendment(amendment.id)}
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
        
        {filteredAmendments.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-500">No pending amendments found.</div>
            <div className="text-sm text-gray-400 mt-1">All amendment requests have been processed.</div>
          </div>
        )}
      </div>

      {/* Amendment Details Modal */}
      {showModal && selectedAmendment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <h3 className="text-xl font-semibold text-gray-900">Amendment Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Customer Information</h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
                      <dd className="text-sm text-gray-900">{selectedAmendment.customerName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                      <dd className="text-sm text-gray-900">{selectedAmendment.customerId}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Amendment Information</h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Amendment ID</dt>
                      <dd className="text-sm text-gray-900">{selectedAmendment.amendmentId}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="text-sm text-gray-900">{amendmentTypes[selectedAmendment.amendmentType]}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Priority</dt>
                      <dd className="text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[selectedAmendment.priority]}`}>
                          {selectedAmendment.priority.charAt(0).toUpperCase() + selectedAmendment.priority.slice(1)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-900">Amendment Details</h4>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900">{selectedAmendment.amendmentDetails}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Submission Details</h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Submitted Date</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedAmendment.submittedDate).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Submitted By</dt>
                      <dd className="text-sm text-gray-900">{selectedAmendment.submittedBy}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[selectedAmendment.status]}`}>
                          {selectedAmendment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Review Actions</h4>
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => approveAmendment(selectedAmendment.id)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Approve Amendment
                    </button>
                    <button
                      onClick={() => rejectAmendment(selectedAmendment.id)}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <XMarkIcon className="h-5 w-5 mr-2" />
                      Reject Amendment
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
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

export default PendingAmendments;