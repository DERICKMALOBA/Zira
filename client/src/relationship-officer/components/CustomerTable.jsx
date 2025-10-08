import { useState } from "react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import AddCustomer from "./AddCustomer";
import CustomerDetailsModal from "./CustomerDetailsModal.jsx";

function CustomersTable({ customers, loading, profile }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const handleView = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortedCustomers = (customersList) => {
    if (!sortConfig.key) return customersList;
    return [...customersList].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
  };

  const filteredCustomers = customers?.filter(
    (c) => {
      const matchesSearch = 
        c.Firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.Surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mobile?.toString().includes(searchTerm) ||
        c.id_number?.toString().includes(searchTerm) ||
        c.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.town?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !selectedStatus || c.status === selectedStatus;

      return matchesSearch && matchesStatus;
    }
  ) || [];

  const sortedCustomers = getSortedCustomers(filteredCustomers);

  // Get unique statuses from customers
  const uniqueStatuses = [...new Set(customers?.map(c => c.status).filter(Boolean) || [])];

  if (loading) return (
    <div className="p-6">
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading customers...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col gap-4">
          {/* First Row - Search and Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Customers
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, mobile, ID, business, or location..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end space-x-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 border rounded-md transition-colors ${
                  showFilters 
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
                {selectedStatus && (
                  <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                    1
                  </span>
                )}
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Customer
              </button>
            </div>
          </div>

          {/* Second Row - Advanced Filters (Collapsible) */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    {uniqueStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Active Filters Display */}
              {selectedStatus && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Status: {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                    <button
                      onClick={() => setSelectedStatus("")}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {customers && customers.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {sortedCustomers.length} of {customers.length} customers
            {(searchTerm || selectedStatus) && " (filtered)"}
          </p>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  <button
                    onClick={() => handleSort("prefix")}
                    className="flex items-center hover:text-gray-700"
                  >
                    Prefix
                    {sortConfig.key === "prefix" && (
                      sortConfig.direction === "asc" ? 
                        <ArrowUpIcon className="h-3 w-3 ml-1" /> : 
                        <ArrowDownIcon className="h-3 w-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  <button
                    onClick={() => handleSort("Firstname")}
                    className="flex items-center hover:text-gray-700"
                  >
                    First Name
                    {sortConfig.key === "Firstname" && (
                      sortConfig.direction === "asc" ? 
                        <ArrowUpIcon className="h-3 w-3 ml-1" /> : 
                        <ArrowDownIcon className="h-3 w-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  <button
                    onClick={() => handleSort("Surname")}
                    className="flex items-center hover:text-gray-700"
                  >
                    Surname
                    {sortConfig.key === "Surname" && (
                      sortConfig.direction === "asc" ? 
                        <ArrowUpIcon className="h-3 w-3 ml-1" /> : 
                        <ArrowDownIcon className="h-3 w-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  <button
                    onClick={() => handleSort("mobile")}
                    className="flex items-center hover:text-gray-700"
                  >
                    Mobile
                    {sortConfig.key === "mobile" && (
                      sortConfig.direction === "asc" ? 
                        <ArrowUpIcon className="h-3 w-3 ml-1" /> : 
                        <ArrowDownIcon className="h-3 w-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  <button
                    onClick={() => handleSort("id_number")}
                    className="flex items-center hover:text-gray-700"
                  >
                    ID Number
                    {sortConfig.key === "id_number" && (
                      sortConfig.direction === "asc" ? 
                        <ArrowUpIcon className="h-3 w-3 ml-1" /> : 
                        <ArrowDownIcon className="h-3 w-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  <button
                    onClick={() => handleSort("business_name")}
                    className="flex items-center hover:text-gray-700"
                  >
                    Business
                    {sortConfig.key === "business_name" && (
                      sortConfig.direction === "asc" ? 
                        <ArrowUpIcon className="h-3 w-3 ml-1" /> : 
                        <ArrowDownIcon className="h-3 w-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  <button
                    onClick={() => handleSort("town")}
                    className="flex items-center hover:text-gray-700"
                  >
                    Location
                    {sortConfig.key === "town" && (
                      sortConfig.direction === "asc" ? 
                        <ArrowUpIcon className="h-3 w-3 ml-1" /> : 
                        <ArrowDownIcon className="h-3 w-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.length > 0 ? (
                sortedCustomers.map((customer, i) => (
                  <tr key={customer.id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.prefix || "Mr./Ms."}>
                      {customer.prefix || "Mr./Ms."}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.Firstname || "N/A"}>
                      {customer.Firstname || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.Surname || "N/A"}>
                      {customer.Surname || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.mobile || "N/A"}>
                      {customer.mobile || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 font-mono truncate" title={customer.id_number || "N/A"}>
                      {customer.id_number || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.business_name || "N/A"}>
                      {customer.business_name || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.town || "N/A"}>
                      {customer.town || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium">
                      <button
                        onClick={() => handleView(customer)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 hover:text-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        title="View Customer Details"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-500">
                        {searchTerm || selectedStatus
                          ? "No customers found matching your filters."
                          : "No customers found."}
                      </p>
                      {(searchTerm || selectedStatus) && (
                        <p className="mt-1 text-sm text-gray-400">
                          Try adjusting your search terms or filters.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render AddCustomer modal if showForm is true */}
      {showForm && <AddCustomer profile={profile} onClose={() => setShowForm(false)} />}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

export default CustomersTable;