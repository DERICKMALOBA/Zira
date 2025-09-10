// src/pages/registry/Customers.jsx
import React, { useState } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Sample customer data
  const customers = [
    {
      id: 1,
      customerId: 'CUST-001',
      fullName: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+254712345678',
      idNumber: '12345678',
      status: 'active',
      loanBalance: 150000,
      lastActivity: '2024-01-15',
      registrationDate: '2023-05-10'
    },
    {
      id: 2,
      customerId: 'CUST-002',
      fullName: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+254723456789',
      idNumber: '87654321',
      status: 'pending',
      loanBalance: 0,
      lastActivity: '2024-01-10',
      registrationDate: '2024-01-05'
    },
    {
      id: 3,
      customerId: 'CUST-003',
      fullName: 'Michael Johnson',
      email: 'michael.j@email.com',
      phone: '+254734567890',
      idNumber: '11223344',
      status: 'inactive',
      loanBalance: 75000,
      lastActivity: '2023-12-20',
      registrationDate: '2022-11-15'
    }
  ];

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-red-100 text-red-800',
    blocked: 'bg-gray-100 text-gray-800'
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.idNumber.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Customer
        </button>
      </div>

      {/* Filters and Search */}
     <div className="bg-white p-4 rounded-lg shadow mb-6">
  <div className="flex flex-col md:flex-row md:items-end gap-4">
    {/* Search Input */}
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">Search Customers</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, email, phone, or ID..."
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
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="inactive">Inactive</option>
        <option value="blocked">Blocked</option>
      </select>
    </div>

    {/* Action Buttons */}
    <div className="flex items-end space-x-2">
      <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
        <FunnelIcon className="h-5 w-5 mr-2" />
        More Filters
      </button>
      <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
        Export
      </button>
    </div>
  </div>
</div>

      {/* Customers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personal Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Balance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.customerId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                    <div className="text-sm text-gray-500">ID: {customer.idNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[customer.status]}`}>
                      {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.loanBalance > 0 ? `KES ${customer.loanBalance.toLocaleString()}` : 'No active loans'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.lastActivity).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewCustomerDetails(customer)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button className="text-yellow-600 hover:text-yellow-900" title="Edit">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-900" title="Delete">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400">No customers found matching your criteria.</div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <h3 className="text-xl font-semibold text-gray-900">Customer Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Personal Information</h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="text-sm text-gray-900">{selectedCustomer.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                      <dd className="text-sm text-gray-900">{selectedCustomer.customerId}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ID Number</dt>
                      <dd className="text-sm text-gray-900">{selectedCustomer.idNumber}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Contact Information</h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{selectedCustomer.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900">{selectedCustomer.phone}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Account Information</h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[selectedCustomer.status]}`}>
                          {selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedCustomer.registrationDate).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Activity</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedCustomer.lastActivity).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Financial Information</h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Current Loan Balance</dt>
                      <dd className="text-sm text-gray-900">
                        KES {selectedCustomer.loanBalance.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Loans Taken</dt>
                      <dd className="text-sm text-gray-900">3</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Credit Score</dt>
                      <dd className="text-sm text-gray-900">Good (750)</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Edit Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;