// src/pages/registry/Customers.jsx
import { useState, useEffect } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../../supabaseClient.js";
import CustomerDetailsModal from "../../../relationship-officer/components/CustomerDetailsModal.jsx.jsx";
import CustomerVerificationForm from "./CustomerVerificationrm.jsx";
import ViewCustomer from "./ViewCustomerrm.jsx";
import { useAuth } from "../../../hooks/userAuth";

const Customersrm = () => {
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { profile } = useAuth();

  // Fetch branches for the region
  const fetchBranches = async () => {
    try {
      if (!profile?.region_id) return;

      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("region_id", profile.region_id)
        .order("name");

      if (error) {
        console.error("Error fetching branches:", error);
        return;
      }

      setBranches(data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  // Fetch customers for Region Manager
  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // Check if profile and region_id exist before making the API call
      if (!profile?.region_id) {
        console.error("No region_id found for this RM profile");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("customers")
        .select(`
          *,
          branches (
            id,
            name
          )
        `)
        .eq("region_id", profile.region_id)  // filter customers by RM's region
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching customers:", error);
        return;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch customers when profile and region_id are available
  useEffect(() => {
    if (profile?.region_id) {
      fetchCustomers();
      fetchBranches();
      console.log("region in the customers table", profile.region_id);
    }
  }, [profile?.region_id]);

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBranch("");
    setSelectedStatus("");
  };

  // Filter customers by name, phone, id, branch, and status
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = 
      (c.Firstname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Surname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Middlename || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.mobile || "").toString().includes(searchTerm) ||
      (c.id_number || "").toString().includes(searchTerm);

    const matchesBranch = !selectedBranch || c.branches?.id?.toString() === selectedBranch;
    
    const matchesStatus = !selectedStatus || c.verification_status === selectedStatus;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  // Get unique statuses from customers
  const uniqueStatuses = [...new Set(customers.map(c => c.verification_status).filter(Boolean))];

  // Show loading state while profile is loading or customers are being fetched
  if (!profile || loading) {
    return (
      <div className="p-6">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!profile ? "Loading profile..." : "Loading customers..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if profile exists but no region_id
  if (profile && !profile.region_id) {
    return (
      <div className="p-6">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-red-600">
            Error: No region assigned to your profile. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

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
                  placeholder="Search by name, mobile, or ID..."
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
                {(selectedBranch || selectedStatus) && (
                  <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                    {[selectedBranch, selectedStatus].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Second Row - Advanced Filters (Collapsible) */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Branch Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Branch
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

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
              {(selectedBranch || selectedStatus) && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {selectedBranch && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Branch: {branches.find(b => b.id.toString() === selectedBranch)?.name}
                      <button
                        onClick={() => setSelectedBranch("")}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedStatus && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Status: {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                      <button
                        onClick={() => setSelectedStatus("")}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {customers.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredCustomers.length} of {customers.length} customers
            {(searchTerm || selectedBranch || selectedStatus) && " (filtered)"}
          </p>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  First Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Surname
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Contact
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  ID Number
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Prequalified Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Branch
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.Firstname || "N/A"}>
                    {customer.Firstname || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.Surname || "N/A"}>
                    {customer.Surname || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.mobile || "N/A"}>
                    {customer.mobile || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.id_number || "N/A"}>
                    {customer.id_number || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 truncate" title={
                    customer.prequalifiedAmount
                      ? customer.prequalifiedAmount.toLocaleString("en-KE", {
                          style: "currency",
                          currency: "KES",
                        })
                      : "N/A"
                  }>
                    {customer.prequalifiedAmount
                      ? `KES ${customer.prequalifiedAmount.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm truncate" title={customer.status || "N/A"}>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.status === 'verified' 
                        ? 'bg-green-100 text-green-800'
                        : customer.status === 'bm_review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : customer.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.status || "N/A"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.branches?.name || "N/A"}>
                    {customer.branches?.name || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm font-medium">
                    <button
                      onClick={() => handleViewCustomer(customer)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 hover:text-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      title="View Customer Details"
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <p className="text-lg font-medium text-gray-500">
                {searchTerm || selectedBranch || selectedStatus
                  ? "No customers found matching your filters."
                  : "No customers found."}
              </p>
              {(searchTerm || selectedBranch || selectedStatus) && (
                <p className="mt-1 text-sm text-gray-400">
                  Try adjusting your search terms or filters.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Customer Verification Form Modal */}
      {showForm && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full relative rounded-none shadow-xl">
            {/* Close button */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-bold z-10"
            >
              ✕
            </button>

            {/* View customer takes the whole screen */}
            <div className="p-6 h-full overflow-y-auto">
              <ViewCustomer
                customer={selectedCustomer}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customersrm;