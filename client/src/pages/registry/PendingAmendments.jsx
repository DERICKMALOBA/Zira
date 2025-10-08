import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  PhoneIcon,
  CalendarIcon,
  PencilSquareIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../hooks/userAuth";
import ViewCustomer from "./ViewCustomer";
import CustomerVerification from "./CustomerVerification";
import Verification from "./Verification";

// Role configuration mapping
const ROLE_CONFIG = {
  branch_manager: {
    title: "Branch Manager",
    idField: "branch_id",
    profileField: "branch_id",
    status: "bm_review_amend",
    useVerificationComponent: false,
  },
  credit_analyst_officer: {
    title: "Credit Analyst Officer",
    idField: "region_id",
    profileField: "region_id",
    status: "ca_review_amend",
    useVerificationComponent: false,
  },
  customer_service_officer: {
    title: "Customer Service Officer",
    idField: "region_id",
    profileField: "region_id",
    status: "cso_review_amend",
    useVerificationComponent: true,
  },
};

const PendingAmendments = () => {
  const { profile, loading: authLoading } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Get role from profile
  const userRole = profile?.role;
  const config = userRole ? ROLE_CONFIG[userRole] : null;

  const fetchAmendmentCustomers = async () => {
    if (authLoading) return;

    // Validate we have necessary data
    if (!profile || !userRole || !config) {
      console.error("Missing profile, role, or config:", { profile, userRole, config });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get the location ID based on the role's profile field
      const userLocationId = profile[config.profileField];
      
      if (!userLocationId) {
        console.error(`Missing ${config.profileField} for user`);
        setLoading(false);
        return;
      }

      // Fetch customers with the appropriate filters
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq(config.idField, userLocationId)
        .eq("status", config.status)
        .order("edited_at", { ascending: false });

      if (error) {
        console.error("Error fetching amendment customers:", error.message);
      } else {
        // Keep only amended customers (edited_at > created_at)
        const amendedCustomers = (data || []).filter((customer) => {
          if (!customer.edited_at || !customer.created_at) return false;
          return new Date(customer.edited_at) > new Date(customer.created_at);
        });

        setCustomers(amendedCustomers);
        setFilteredCustomers(amendedCustomers);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmendmentCustomers();
  }, [profile, authLoading, userRole]);

  useEffect(() => {
    // Only set up real-time subscription if we have valid config
    if (!config) return;

    const subscription = supabase
      .channel("pending-amendments")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "customers" },
        (payload) => {
          console.log("Customer updated:", payload);
          fetchAmendmentCustomers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [config]);

  // Search filter
  useEffect(() => {
    if (!customers || customers.length === 0) {
      setFilteredCustomers([]);
      return;
    }

    const filtered = customers.filter(
      (customer) =>
        (customer.Firstname?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (customer.Surname?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (customer.id_number?.toString() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (customer.mobile || "").includes(searchTerm) ||
        (customer.business_type?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (customer.business_name?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        )
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleApproveAmendment = (customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleViewChanges = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <span className="text-gray-500 text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  // Show error if role is not configured
  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <DocumentTextIcon className="w-16 h-16 text-red-300 mb-4 mx-auto" />
          <h3 className="text-xl font-medium text-gray-900 mb-2 text-center">
            Access Error
          </h3>
          <p className="text-gray-500 text-center">
            Your role ({userRole || "unknown"}) does not have access to this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
             
              <p className="text-gray-600 mt-2">
                Recently updated customer records requiring review
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Role: {config.title}
              </p>
            </div>
            <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-medium">
              {filteredCustomers.length} Pending
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID number, phone, or business..."
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-6 py-5 text-left text-sm font-semibold text-indigo-800 uppercase tracking-wider whitespace-nowrap">
                    First Name
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-semibold text-indigo-800 uppercase tracking-wider whitespace-nowrap">
                    Surname
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-semibold text-indigo-800 uppercase tracking-wider whitespace-nowrap">
                    ID Number
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-semibold text-indigo-800 uppercase tracking-wider whitespace-nowrap">
                    Contact Info
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-semibold text-indigo-800 uppercase tracking-wider whitespace-nowrap">
                    Last Updated
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-semibold text-indigo-800 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                        <span className="text-gray-500 text-lg">
                          Loading amendments...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-indigo-50/50 transition-colors"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.Firstname || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.Surname || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <IdentificationIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {customer.id_number || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <PhoneIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {customer.mobile || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-2 text-indigo-400 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {customer.edited_at
                                ? new Date(customer.edited_at).toLocaleDateString()
                                : "N/A"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {customer.edited_at
                                ? new Date(customer.edited_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewChanges(customer)}
                            className="flex items-center justify-center p-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors shadow-sm"
                            title="View Changes"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleApproveAmendment(customer)}
                            className="flex items-center justify-center p-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors shadow-sm"
                            title="Approve Changes"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <DocumentTextIcon className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                          No pending amendments
                        </h3>
                        <p className="text-gray-500 max-w-md">
                          {searchTerm
                            ? "No customers match your search criteria."
                            : "All customer information changes have been reviewed."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-none shadow-2xl w-full h-full overflow-y-auto relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-50"
            >
              ✕
            </button>
            <div className="p-6">
              <ViewCustomer
                customer={selectedCustomer}
                onClose={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Approval Form Modal - Conditionally render based on role */}
      {showForm && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full relative rounded-none shadow-xl">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-bold z-50"
            >
              ✕
            </button>
            <div className="p-6 h-full overflow-y-auto">
              {config.useVerificationComponent ? (
                // Customer Service Officer uses Verification component
                <Verification
                  customerId={selectedCustomer?.id}
                  onClose={() => {
                    setShowForm(false);
                    fetchAmendmentCustomers();
                  }}
                />
              ) : (
                // Branch Manager and Credit Analyst use CustomerVerification component
                <CustomerVerification
                  customerId={selectedCustomer?.id}
                  onClose={() => {
                    setShowForm(false);
                    fetchAmendmentCustomers();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingAmendments;