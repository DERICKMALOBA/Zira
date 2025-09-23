import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  EyeIcon,
  PhoneIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const CallbacksPendingca = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedCallback, setSelectedCallback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Sample pending callbacks data
  const pendingCallbacks = [
    {
      id: 1,
      callbackId: 'CB-2024-001',
      customerName: 'John Doe',
      customerId: 'CUST-001',
      phoneNumber: '+254712345678',
      reason: 'Loan application follow-up',
      notes: 'Customer interested in business loan, needs more information about rates',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Agent Sarah',
      createdDate: '2024-01-15',
      scheduledDate: '2024-01-16',
      callbackType: 'outbound',
      previousAttempts: 2,
      lastContact: '2024-01-14'
    },
    {
      id: 2,
      callbackId: 'CB-2024-002',
      customerName: 'Jane Smith',
      customerId: 'CUST-002',
      phoneNumber: '+254723456789',
      reason: 'Document submission reminder',
      notes: 'Customer needs to submit missing ID documents for verification',
      priority: 'medium',
      status: 'scheduled',
      assignedTo: 'Agent Mike',
      createdDate: '2024-01-14',
      scheduledDate: '2024-01-17',
      callbackType: 'outbound',
      previousAttempts: 1,
      lastContact: '2024-01-13'
    },
    {
      id: 3,
      callbackId: 'CB-2024-003',
      customerName: 'Michael Johnson',
      customerId: 'CUST-003',
      phoneNumber: '+254734567890',
      reason: 'Payment reminder',
      notes: 'Gentle reminder about upcoming loan payment due on 2024-01-20',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Agent Lisa',
      createdDate: '2024-01-13',
      scheduledDate: '2024-01-15',
      callbackType: 'outbound',
      previousAttempts: 0,
      lastContact: '2024-01-10'
    },
    {
      id: 4,
      callbackId: 'CB-2024-004',
      customerName: 'Sarah Wilson',
      customerId: 'CUST-004',
      phoneNumber: '+254745678901',
      reason: 'Customer requested callback',
      notes: 'Customer called asking about loan restructuring options',
      priority: 'medium',
      status: 'completed',
      assignedTo: 'Agent David',
      createdDate: '2024-01-12',
      scheduledDate: '2024-01-12',
      callbackType: 'inbound',
      previousAttempts: 0,
      lastContact: '2024-01-12'
    }
  ];

  const statusTypes = {
    pending: 'Pending',
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  const callbackTypeColors = {
    inbound: 'bg-green-100 text-green-800',
    outbound: 'bg-blue-100 text-blue-800'
  };

  const filteredCallbacks = pendingCallbacks.filter(callback => {
    const matchesSearch = callback.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         callback.callbackId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         callback.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         callback.phoneNumber.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || callback.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || callback.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const viewCallbackDetails = (callback) => {
    setSelectedCallback(callback);
    setShowModal(true);
  };

  const scheduleCallback = (callback) => {
    setSelectedCallback(callback);
    setShowScheduleModal(true);
  };

  const markAsCompleted = (callbackId) => {
    console.log('Marking callback as completed:', callbackId);
    // Add completion logic here
  };

  const cancelCallback = (callbackId) => {
    console.log('Cancelling callback:', callbackId);
    // Add cancellation logic here
  };

  const makeCall = (phoneNumber) => {
    console.log('Calling:', phoneNumber);
    // Add call initiation logic here
    window.open(`tel:${phoneNumber}`, '_self');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Callbacks Pending</h1>
          <p className="text-sm text-gray-600 mt-1">Manage customer callback requests and schedules</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
            {pendingCallbacks.filter(cb => cb.status === 'pending' || cb.status === 'scheduled').length} Active Callbacks
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Callbacks</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by customer name, callback ID, phone, or customer ID..."
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
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
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

      {/* Callbacks Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Callback ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCallbacks.map((callback) => (
                <tr key={callback.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{callback.callbackId}</div>
                    <div className="text-xs text-gray-500">
                      <span className={`px-1 inline-flex text-xs leading-5 font-semibold rounded-full ${callbackTypeColors[callback.callbackType]}`}>
                        {callback.callbackType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{callback.customerName}</div>
                    <div className="text-sm text-gray-500">ID: {callback.customerId}</div>
                    <div className="text-xs text-gray-400">Assigned to: {callback.assignedTo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{callback.phoneNumber}</div>
                    <div className="text-xs text-gray-500">
                      Attempts: {callback.previousAttempts}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{callback.reason}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{callback.notes}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[callback.status]}`}>
                      {statusTypes[callback.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[callback.priority]}`}>
                      {callback.priority.charAt(0).toUpperCase() + callback.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(callback.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewCallbackDetails(callback)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => makeCall(callback.phoneNumber)}
                        className="text-green-600 hover:text-green-900"
                        title="Make Call"
                      >
                        <PhoneIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => scheduleCallback(callback)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Schedule"
                      >
                        <CalendarIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => markAsCompleted(callback.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Mark Completed"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCallbacks.length === 0 && (
          <div className="text-center py-12">
            <PhoneIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-500">No pending callbacks found.</div>
            <div className="text-sm text-gray-400 mt-1">All callbacks have been processed.</div>
          </div>
        )}
      </div>

      {/* Callback Details Modal */}
      {showModal && selectedCallback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <h3 className="text-xl font-semibold text-gray-900">Callback Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Customer Information
                  </h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
                      <dd className="text-sm text-gray-900">{selectedCallback.customerName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                      <dd className="text-sm text-gray-900">{selectedCallback.customerId}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                      <dd className="text-sm text-gray-900">{selectedCallback.assignedTo}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <PhoneIcon className="h-5 w-5 mr-2" />
                    Contact Information
                  </h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                      <dd className="text-sm text-gray-900">{selectedCallback.phoneNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Previous Attempts</dt>
                      <dd className="text-sm text-gray-900">{selectedCallback.previousAttempts}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Contact</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedCallback.lastContact).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                    Callback Details
                  </h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Callback ID</dt>
                      <dd className="text-sm text-gray-900">{selectedCallback.callbackId}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Reason</dt>
                      <dd className="text-sm text-gray-900">{selectedCallback.reason}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Notes</dt>
                      <dd className="text-sm text-gray-900 p-2 bg-gray-50 rounded-md">
                        {selectedCallback.notes}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${callbackTypeColors[selectedCallback.callbackType]}`}>
                          {selectedCallback.callbackType.charAt(0).toUpperCase() + selectedCallback.callbackType.slice(1)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    Timing Information
                  </h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedCallback.createdDate).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Scheduled Date</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedCallback.scheduledDate).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    Status & Priority
                  </h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[selectedCallback.status]}`}>
                          {statusTypes[selectedCallback.status]}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Priority</dt>
                      <dd className="text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[selectedCallback.priority]}`}>
                          {selectedCallback.priority.charAt(0).toUpperCase() + selectedCallback.priority.slice(1)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => makeCall(selectedCallback.phoneNumber)}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  Make Call
                </button>
                <button
                  onClick={() => scheduleCallback(selectedCallback)}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Reschedule
                </button>
                <button
                  onClick={() => markAsCompleted(selectedCallback.id)}
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Mark Completed
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

export default CallbacksPendingca;