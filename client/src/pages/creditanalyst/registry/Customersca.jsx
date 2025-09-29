// src/pages/registry/Customers.jsx
import { useState, useEffect } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../../supabaseClient.js";
import CustomerDetailsModal from "../../../relationship-officer/components/CustomerDetailsModal.jsx.jsx";
import CustomerVerificationForm from "./CustomerVerificationca.jsx";
import ViewCustomer from "./ViewCustomerca.jsx";

const Customersca = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [branches, setBranches] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch customers from Supabase with branch information
  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("customers")
        .select(`
          *,
          branches:branch_id (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching customers:", error);
        return;
      }

      // Map the data to include branch name directly
      const customersWithBranch = (data || []).map(customer => ({
        ...customer,
        branchName: customer.branches?.name || null
      }));

      setCustomers(customersWithBranch);
      
      // Extract unique branches and statuses for filters
      const uniqueBranches = [...new Set(customersWithBranch.map(c => c.branchName).filter(Boolean))];
      const uniqueStatuses = [...new Set(customersWithBranch.map(c => c.status).filter(Boolean))];
      setBranches(uniqueBranches);
      setStatuses(uniqueStatuses);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  // Export to CSV function
  const handleExport = () => {
    if (filteredCustomers.length === 0) {
      alert("No customers to export");
      return;
    }

    // Define CSV headers
    const headers = [
      "First Name",
      "Surname",
      "Middle Name",
      "Contact",
      "ID Number",
      "Prequalified Amount",
      "Status",
      "Branch",
      "Created At"
    ];

    // Convert customers data to CSV rows
    const csvRows = filteredCustomers.map(customer => [
      customer.Firstname || "",
      customer.Surname || "",
      customer.Middlename || "",
      customer.mobile || "",
      customer.id_number || "",
      customer.prequalifiedAmount || "",
      customer.status || "",
      customer.branchName || "",
      customer.created_at ? new Date(customer.created_at).toLocaleDateString() : ""
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter customers by name, phone, id, branch, and status
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      (c.Firstname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Surname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Middlename || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.mobile || "").toString().includes(searchTerm) ||
      (c.id_number || "").toString().includes(searchTerm);

    const matchesBranch = !selectedBranch || c.branchName === selectedBranch;
    const matchesStatus = !selectedStatus || c.status === selectedStatus;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedBranch("");
    setSelectedStatus("");
    setSearchTerm("");
  };

  return (
    <div className="p-6">
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
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
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              More Filters
              {(selectedBranch || selectedStatus) && (
                <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                  {[selectedBranch, selectedStatus].filter(Boolean).length}
                </span>
              )}
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
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
                    <option key={branch} value={branch}>
                      {branch}
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
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedBranch || selectedStatus) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedBranch && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                    Branch: {selectedBranch}
                    <button
                      onClick={() => setSelectedBranch("")}
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedStatus && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                    Status: {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus("")}
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      )}

      {/* Customers Table */}
      {!loading && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    First Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Surname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Middle Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prequalified Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{customer.Firstname || "N/A"}</td>
                    <td className="px-6 py-4">{customer.Surname || "N/A"}</td>
                    <td className="px-6 py-4">
                      {customer.Middlename || "N/A"}
                    </td>
                    <td className="px-6 py-4">{customer.mobile || "N/A"}</td>
                    <td className="px-6 py-4">{customer.id_number || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.prequalifiedAmount
                        ? customer.prequalifiedAmount.toLocaleString("en-KE", {
                            style: "currency",
                            currency: "KES",
                          })
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.status === "Active" 
                          ? "bg-green-100 text-green-800"
                          : customer.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {customer.status || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{customer.branchName || "N/A"}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="text-green-600 hover:text-green-900 px-2 py-1 border border-green-600 rounded"
                          title="View Customer"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              {searchTerm || selectedBranch || selectedStatus
                ? "No customers found matching your filters."
                : "No customers found."}
            </div>
          )}
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* customer Verification Form Modal */}
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

            {/* Loan form takes the whole screen */}
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

export default Customersca;