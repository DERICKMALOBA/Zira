// src/components/AllLoansAdmin.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../hooks/userAuth";
import {
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  XCircleIcon,
  BanknotesIcon,
  EyeIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const AllLoans = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [branches, setBranches] = useState([]);
  const [regions, setRegions] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Determine user access level
  const isBranchManager = profile?.role === "branch_manager";
  const isRegionalManager = profile?.role === "regional_manager";
  const isGlobalRole = ["credit_analyst_officer", "customer_service_officer"].includes(profile?.role);
  const isSuperAdmin = profile?.role === "super_admin";

  useEffect(() => {
    if (profile) {
      fetchRegions();
      fetchBranches();
      fetchLoans();
    }
  }, [profile]);

  useEffect(() => {
    filterLoans();
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [loans, statusFilter, branchFilter, regionFilter, searchTerm]);

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLoans = filteredLoans.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);

  // Pagination functions
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // In the middle
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const fetchRegions = async () => {
    try {
      // Global roles see all regions
      if (isGlobalRole || isSuperAdmin) {
        const { data, error } = await supabase
          .from("regions")
          .select("id, name")
          .order("name");
        if (error) throw error;
        setRegions(data || []);
      }
      // Regional manager sees only their region
      else if (isRegionalManager && profile?.region_id) {
        const { data, error } = await supabase
          .from("regions")
          .select("id, name")
          .eq("id", profile.region_id);
        if (error) throw error;
        setRegions(data || []);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      let query = supabase
        .from("branches")
        .select("id, name, region_id")
        .order("name");

      // Branch Manager: only their branch
      if (isBranchManager && profile?.branch_id) {
        query = query.eq("id", profile.branch_id);
      }
      // Regional Manager: only branches in their region
      else if (isRegionalManager && profile?.region_id) {
        query = query.eq("region_id", profile.region_id);
      }
      // Global roles: all branches

      const { data, error } = await query;
      if (error) throw error;
      setAllBranches(data || []);
      setBranches(data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchLoans = async () => {
    try {
      let query = supabase
        .from("loans")
        .select(
          `
          *,
          customers (
            Firstname,
            Surname,
            mobile,
            id_number,
            branches (
              id,
              name,
              region_id,
              regions (
                id,
                name
              )
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      // Branch Manager: only loans from their branch
      if (isBranchManager && profile?.branch_id) {
        query = query.eq("branch_id", profile.branch_id);
      }
      // Regional Manager: only loans from their region
      else if (isRegionalManager && profile?.region_id) {
        const { data: branchesInRegion } = await supabase
          .from("branches")
          .select("id")
          .eq("region_id", profile.region_id);

        const branchIds = branchesInRegion?.map((b) => b.id) || [];
        if (branchIds.length > 0) {
          query = query.in("branch_id", branchIds);
        }
      }
      // Global roles: see all loans

      const { data, error } = await query;
      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle region change - filter branches
  const handleRegionChange = (regionId) => {
    setRegionFilter(regionId);
    setBranchFilter("all"); // Clear branch selection

    if (regionId && regionId !== "all") {
      // Filter branches by selected region
      const filteredBranches = allBranches.filter(
        (branch) => branch.region_id?.toString() === regionId
      );
      setBranches(filteredBranches);
    } else {
      // Reset to all branches
      setBranches(allBranches);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setRegionFilter("all");
    setBranchFilter("all");
    setSearchTerm("");
    setCurrentPage(1); // Reset to first page

    // Reset branches to all
    setBranches(allBranches);
  };

  const filterLoans = () => {
    let filtered = loans;

    if (statusFilter !== "all") {
      filtered = filtered.filter((loan) => loan.status === statusFilter);
    }

    // Region filter
    if (regionFilter !== "all") {
      filtered = filtered.filter(
        (loan) => loan.customers?.branches?.region_id?.toString() === regionFilter
      );
    }

    // Branch filter
    if (branchFilter !== "all") {
      filtered = filtered.filter(
        (loan) => loan.customers?.branches?.id?.toString() === branchFilter
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (loan) =>
          loan.customers?.Firstname?.toLowerCase().includes(
            searchTerm.toLowerCase()
          ) ||
          loan.customers?.Surname?.toLowerCase().includes(
            searchTerm.toLowerCase()
          ) ||
          loan.customers?.mobile?.includes(searchTerm) ||
          loan.id?.toString().includes(searchTerm)
      );
    }

    setFilteredLoans(filtered);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "booked":
        return <ClockIcon className="h-5 w-5 text-amber-600" />;
      case "bm_review":
        return <ClockIcon className="h-5 w-5 text-orange-600" />;
      case "rm_review":
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      case "ca_review":
        return <ClockIcon className="h-5 w-5 text-purple-600" />;
      case "disbursed":
        return <BanknotesIcon className="h-5 w-5 text-emerald-600" />;
      case "rejected":
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      booked: "bg-amber-100 text-amber-800 border-amber-200",
      bm_review: "bg-orange-100 text-orange-800 border-orange-200",
      rm_review: "bg-blue-100 text-blue-800 border-blue-200",
      ca_review: "bg-purple-100 text-purple-800 border-purple-200",
      disbursed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const statusCounts = {
    all: loans.length,
    booked: loans.filter((l) => l.status === "booked").length,
    bm_review: loans.filter((l) => l.status === "bm_review").length,
    rm_review: loans.filter((l) => l.status === "rm_review").length,
    ca_review: loans.filter((l) => l.status === "ca_review").length,
    disbursed: loans.filter((l) => l.status === "disbursed").length,
    rejected: loans.filter((l) => l.status === "rejected").length,
  };

  const handleViewLoan = (loanId) => {
    navigate(`/loans/${loanId}`);
  };

  const handleAddInteraction = (loanId) => {
    navigate(`/loans/${loanId}/interactions`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
       

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-indigo-100">
          <div className="flex flex-col gap-4">
            {/* First Row - Search and Action Buttons */}
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Loans
                </label>
                <input
                  type="text"
                  placeholder="Search by customer name, mobile, or loan ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-end space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center px-4 py-3 border rounded-lg transition-colors ${
                    showFilters
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filters
                  {(statusFilter !== "all" ||
                    regionFilter !== "all" ||
                    branchFilter !== "all") && (
                    <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                      {[
                        statusFilter !== "all",
                        regionFilter !== "all",
                        branchFilter !== "all",
                      ].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Second Row - Advanced Filters (Collapsible) */}
            {showFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Region Filter - Only for global roles */}
                  {(isGlobalRole || isSuperAdmin) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Filter by Region
                      </label>
                      <select
                        value={regionFilter}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="all">All Regions</option>
                        {regions.map((region) => (
                          <option key={region.id} value={region.id.toString()}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Branch Filter - For global and regional roles */}
                  {!isBranchManager && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Filter by Branch
                      </label>
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                        <select
                          value={branchFilter}
                          onChange={(e) => setBranchFilter(e.target.value)}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="all">All Branches</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id.toString()}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Status Filter - Available for all roles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">All Status ({statusCounts.all})</option>
                      <option value="booked">
                        Booked ({statusCounts.booked})
                      </option>
                      <option value="bm_review">
                        Pending Branch Manager ({statusCounts.bm_review})
                      </option>
                      <option value="rm_review">
                        Pending Regional Manager ({statusCounts.rm_review})
                      </option>
                      <option value="ca_review">
                        Pending Disbursement ({statusCounts.ca_review})
                      </option>
                      <option value="disbursed">
                        Disbursed ({statusCounts.disbursed})
                      </option>
                      <option value="rejected">
                        Rejected ({statusCounts.rejected})
                      </option>
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="flex items-center px-4 py-3 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Clear Filters
                    </button>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(statusFilter !== "all" ||
                  regionFilter !== "all" ||
                  branchFilter !== "all") && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    {regionFilter !== "all" && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Region:{" "}
                        {regions.find((r) => r.id.toString() === regionFilter)
                          ?.name}
                        <button
                          onClick={() => handleRegionChange("all")}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {branchFilter !== "all" && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Branch:{" "}
                        {branches.find((b) => b.id.toString() === branchFilter)
                          ?.name}
                        <button
                          onClick={() => setBranchFilter("all")}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {statusFilter !== "all" && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Status:{" "}
                        {statusFilter
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                        <button
                          onClick={() => setStatusFilter("all")}
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
        {loans.length > 0 && (
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredLoans.length)} of {filteredLoans.length} loans
              {(searchTerm ||
                statusFilter !== "all" ||
                regionFilter !== "all" ||
                branchFilter !== "all") &&
                " (filtered)"}
            </p>
            <p className="text-sm font-medium text-gray-900">
              Total Records: <span className="text-indigo-600">{loans.length}</span>
            </p>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-x-auto">
          <table className="w-full border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-gradient-to-r from-blue-100 to-blue-100 text-slate-700 text-sm">
                <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                  Customer
                </th>
                <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                  ID Number
                </th>
                <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                  Phone
                </th>
                {(isGlobalRole || isSuperAdmin || isRegionalManager) && (
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                    Region
                  </th>
                )}
                <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                  Branch
                </th>
                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                  Product
                </th>
                <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">
                  Amount
                </th>
                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                  Weeks
                </th>
                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                  Date
                </th>
                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 text-sm">
              {currentLoans.map((loan, index) => (
                <tr
                  key={loan.id}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-indigo-50 transition-colors`}
                >
                  <td className="px-3 py-3 whitespace-nowrap">
                    {loan.customers?.Firstname} {loan.customers?.Surname}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {loan.customers?.id_number}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {loan.customers?.mobile}
                  </td>
                  {(isGlobalRole || isSuperAdmin || isRegionalManager) && (
                    <td className="px-3 py-3 whitespace-nowrap">
                      {loan.customers?.branches?.regions?.name || "N/A"}
                    </td>
                  )}
                  <td className="px-3 py-3 whitespace-nowrap">
                    {loan.customers?.branches?.name}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    {loan.product_name || loan.product}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                    KES {loan.scored_amount?.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {loan.duration_weeks}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                        loan.status
                      )}`}
                    >
                      {getStatusIcon(loan.status)}
                      <span className="whitespace-nowrap">
                        {loan.status.replace(/_/g, " ")}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(loan.created_at).toLocaleDateString("en-GB")}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewLoan(loan.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-emerald-400 text-white rounded-lg hover:from-emerald-500 hover:to-emerald-500 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
                        title="View Loan Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                        view
                      </button>
                      <button
                        onClick={() => handleAddInteraction(loan.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-200 to-blue-200 text-slate-600 rounded-lg hover:from-blue-500 hover:to-blue-500 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
                        title="Add Interaction"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        log
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLoans.length === 0 && (
            <div className="text-center py-12">
              <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">
                No loans found
              </h3>
              <p className="text-gray-600">
                {searchTerm ||
                statusFilter !== "all" ||
                regionFilter !== "all" ||
                branchFilter !== "all"
                  ? "Try adjusting your filters or search criteria."
                  : "No loans available."}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredLoans.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-lg p-4 border border-indigo-100">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border ${
                  currentPage === 1
                    ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                    : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex space-x-1">
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && goToPage(page)}
                    className={`min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg border ${
                      page === currentPage
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : page === '...'
                        ? "text-gray-500 border-transparent cursor-default"
                        : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                    disabled={page === '...'}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border ${
                  currentPage === totalPages
                    ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                    : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>

            <div className="text-sm text-gray-500">
              {itemsPerPage} per page
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllLoans;