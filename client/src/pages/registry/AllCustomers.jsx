// src/pages/registry/Customers.jsx
import { useState, useEffect } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
  HandRaisedIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../supabaseClient.js";
import CustomerDetailsModal from "../../relationship-officer/components/CustomerDetailsModal.jsx.jsx";
import { useAuth } from "../../hooks/userAuth.js";
import CustomerInteractions from "./CustomerInteractions.jsx";
import PromiseToPay from "./PromiseToPay.jsx";
import LoanDetails from "./LoanDetails.jsx";

import { useNavigate } from "react-router-dom";

const AllCustomers = () => {
   const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickSearchTerm, setQuickSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInteractions, setShowInteractions] = useState(false);
  const [showLoanDetails, setShowLoanDetails] = useState(false);
  const [showPromiseToPay, setShowPromiseToPay] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { profile } = useAuth();

  const handleOpenInteractions = (customer) => {
    setSelectedCustomer(customer);
    setShowInteractions(true);
  };

  const handleOpenLoanDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowLoanDetails(true);
  };

  const handleOpenPromiseToPay = (customer) => {
    setSelectedCustomer(customer);
    setShowPromiseToPay(true);
  };

 const handleOpen360View = (customer) => {
    navigate(`/customer/${customer.id}/360`);
    setQuickSearchTerm(""); // Clear search when opening
  };

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
        .eq("region_id", profile.region_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching customers:", error);
        return;
      }

      if (data && data.length > 0) {
        const customersWithLoanStatus = await Promise.all(
          data.map(async (c) => {
            const { data: loan, error: loanError } = await supabase
              .from("loans")
              .select("id, status, repayment_state")
              .eq("customer_id", c.id)
              .eq("status", "disbursed")
              .maybeSingle();

            return {
              ...c,
              hasDisbursedLoan: !!loan && !loanError,
              loanRepaymentState: loan?.repayment_state || null,
            };
          })
        );
        setCustomers(customersWithLoanStatus);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

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
    setCurrentPage(1);
  };
const filteredCustomers = customers.filter((c) => {
  const matchesSearch =
    (c.Firstname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.Surname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.Middlename || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.mobile || "").toString().includes(searchTerm) ||
    (c.id_number || "").toString().includes(searchTerm);

  const matchesBranch =
    !selectedBranch ||
    c.branch_id?.toString() === selectedBranch ||
    c.branches?.id?.toString() === selectedBranch;

  const matchesStatus =
    !selectedStatus ||
    c.status === selectedStatus ||
    c.verification_status === selectedStatus;

  return matchesSearch && matchesBranch && matchesStatus;
});


  // Quick search filter (separate from main search)
  const quickSearchResults = customers.filter((c) => {
    if (!quickSearchTerm) return false;
    return (
      (c.Firstname || "").toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      (c.Surname || "").toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      (c.mobile || "").toString().includes(quickSearchTerm) ||
      (c.id_number || "").toString().includes(quickSearchTerm)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPage = (page) => setCurrentPage(page);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBranch, selectedStatus]);

  // Get unique statuses from customers
  const uniqueStatuses = [...new Set(customers.map((c) => c.verification_status).filter(Boolean))];

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
    <div className="p-2">
      {/* Page Header with 360 View Search */}
      <div className="mb-6 items-right ">
       
        
        {/* 360 View Quick Search */}
        <div className="relative w-96">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            360° Customer View
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search customer for 360° view..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              value={quickSearchTerm}
              onChange={(e) => setQuickSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Quick Search Results Dropdown */}
          {quickSearchTerm && quickSearchResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
              {quickSearchResults.slice(0, 10).map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleOpen360View(customer)}
                  className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.Firstname} {customer.Surname}
                      </p>
                      <p className="text-sm text-gray-600">{customer.mobile}</p>
                      <p className="text-xs text-gray-500">ID: {customer.id_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-indigo-600">
                        {customer.prequalifiedAmount
                          ? `KES ${customer.prequalifiedAmount.toLocaleString()}`
                          : "N/A"}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
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
                    </div>
                  </div>
                </div>
              ))}
              {quickSearchResults.length > 10 && (
                <div className="p-2 text-center text-sm text-gray-500 bg-gray-50 border-t">
                  Showing 10 of {quickSearchResults.length} results
                </div>
              )}
            </div>
          )}
          
          {quickSearchTerm && quickSearchResults.length === 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl p-4 text-center text-gray-500">
              No customers found
            </div>
          )}
        </div>
      </div>

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
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
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
                      Branch: {branches.find((b) => b.id.toString() === selectedBranch)?.name}
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
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customers
            {(searchTerm || selectedBranch || selectedStatus) && " (filtered)"}
          </p>
          <p className="text-sm font-medium text-gray-900">
            Total Records: <span className="text-indigo-600">{customers.length}</span>
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
              {currentCustomers.map((customer) => (
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
                  <td
                    className="px-3 py-2 text-sm text-gray-700 truncate"
                    title={
                      customer.prequalifiedAmount
                        ? customer.prequalifiedAmount.toLocaleString("en-KE", {
                            style: "currency",
                            currency: "KES",
                          })
                        : "N/A"
                    }
                  >
                    {customer.prequalifiedAmount
                      ? `KES ${customer.prequalifiedAmount.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm truncate" title={customer.status || "N/A"}>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.status === "verified"
                          ? "bg-green-100 text-green-800"
                          : customer.status === "bm_review"
                          ? "bg-yellow-100 text-yellow-800"
                          : customer.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {customer.status || "N/A"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 truncate" title={customer.branches?.name || "N/A"}>
                    {customer.branches?.name || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm font-medium space-x-1 flex items-center">
                    {/* View Customer */}
                    <button
                      onClick={() => handleViewCustomer(customer)}
                      className="p-1.5 rounded-md bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700 transition"
                      title="View Customer"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>

                    {/* Interactions */}
                    <button
                      onClick={() => handleOpenInteractions(customer)}
                      className="p-1.5 rounded-md bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition"
                      title="Customer Interactions"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    </button>

                    {/* Loan Details (only if disbursed) */}
                    {customer.hasDisbursedLoan && (
                      <button
                        onClick={() => handleOpenLoanDetails(customer)}
                        className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700 transition"
                        title="Loan Details"
                      >
                        <BanknotesIcon className="h-4 w-4" />
                      </button>
                    )}

                    {/* Promise to Pay (only if disbursed AND repayment_state is ongoing or partial) */}
                    {customer.hasDisbursedLoan &&
                      ["ongoing", "partial"].includes(customer.loanRepaymentState) && (
                        <button
                          onClick={() => handleOpenPromiseToPay(customer)}
                          className="p-1.5 rounded-md bg-purple-50 border border-purple-200 text-purple-600 hover:bg-purple-100 hover:text-purple-700 transition"
                          title="Promise to Pay"
                        >
                          <HandRaisedIcon className="h-4 w-4" />
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="flex flex-col items-center">
              <svg
                className="h-12 w-12 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
              <p className="text-lg font-medium text-gray-500">
                {searchTerm || selectedBranch || selectedStatus
                  ? "No customers found matching your filters."
                  : "No customers found."}
              </p>
              {(searchTerm || selectedBranch || selectedStatus) && (
                <p className="mt-1 text-sm text-gray-400">Try adjusting your search terms or filters.</p>
              )}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredCustomers.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(endIndex, filteredCustomers.length)}</span> of{" "}
                  <span className="font-medium">{filteredCustomers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {/* First Page Button */}
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="First Page"
                  >
                    <ChevronDoubleLeftIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Previous Page Button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}

                  {/* Next Page Button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>

                  {/* Last Page Button */}
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Last Page"
                  >
                    <ChevronDoubleRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total Records Footer */}
      <div className="mt-4 bg-white shadow rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{customers.length}</span> total customers in your region
          </div>
          {filteredCustomers.length !== customers.length && (
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{filteredCustomers.length}</span> matching current filters
            </div>
          )}
        </div>
      </div>


      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <CustomerDetailsModal customer={selectedCustomer} onClose={() => setShowDetailsModal(false)} />
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
              <CustomerDetailsModal customer={selectedCustomer} onClose={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Customer Interactions Modal */}
      {showInteractions && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full relative rounded-none shadow-xl">
            <button
              onClick={() => setShowInteractions(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-bold z-10"
            >
              ✕
            </button>
            <div className="p-6 h-full overflow-y-auto">
              <CustomerInteractions customer={selectedCustomer} />
            </div>
          </div>
        </div>
      )}

      {/* Loan Details Modal */}
      {showLoanDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full relative rounded-none shadow-xl">
            <button
              onClick={() => setShowLoanDetails(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-bold z-10"
            >
              ✕
            </button>
            <div className="p-6 h-full overflow-y-auto">
              <LoanDetails customer={selectedCustomer} />
            </div>
          </div>
        </div>
      )}

      {/* Promise to Pay Modal */}
      {showPromiseToPay && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full relative rounded-none shadow-xl">
            <button
              onClick={() => setShowPromiseToPay(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-bold z-10"
            >
              ✕
            </button>
            <div className="p-6 h-full overflow-y-auto">
              <PromiseToPay customer={selectedCustomer} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCustomers;