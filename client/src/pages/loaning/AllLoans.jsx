// src/components/AllLoans.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import {
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  EyeIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const AllLoans = ({ onLoanSelect }) => {
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLoans();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [loans, statusFilter, searchTerm]);

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select(
          `
          *,
          customers (
            Firstname,
            Surname,
            mobile,
            id_number
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterLoans = () => {
    let filtered = loans;

    if (statusFilter !== "all") {
      filtered = filtered.filter((loan) => loan.status === statusFilter);
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
      case "pending_branch_manager":
        return <ClockIcon className="h-5 w-5 text-orange-600" />;
      case "pending_regional_manager":
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      case "pending_disbursement":
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
      pending_branch_manager: "bg-orange-100 text-orange-800 border-orange-200",
      pending_regional_manager: "bg-blue-100 text-blue-800 border-blue-200",
      pending_disbursement: "bg-purple-100 text-purple-800 border-purple-200",
      disbursed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };

    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const statusCounts = {
    all: loans.length,
    booked: loans.filter((l) => l.status === "booked").length,
    pending_branch_manager: loans.filter(
      (l) => l.status === "pending_branch_manager"
    ).length,
    pending_regional_manager: loans.filter(
      (l) => l.status === "pending_regional_manager"
    ).length,
    pending_disbursement: loans.filter(
      (l) => l.status === "pending_disbursement"
    ).length,
    disbursed: loans.filter((l) => l.status === "disbursed").length,
    rejected: loans.filter((l) => l.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
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
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                All Loans
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive view of all loan applications and their statuses
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-200">
              <CurrencyDollarIcon className="h-5 w-5 text-indigo-600" />
              <span className="font-medium text-indigo-700">
                {filteredLoans.length} Loans
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-indigo-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by customer name, mobile, or loan ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status ({statusCounts.all})</option>
                <option value="booked">Booked ({statusCounts.booked})</option>
                <option value="pending_branch_manager">
                  Pending Branch Manager ({statusCounts.pending_branch_manager})
                </option>
                <option value="pending_regional_manager">
                  Pending Regional Manager ({statusCounts.pending_regional_manager})
                </option>
                <option value="pending_disbursement">
                  Pending Disbursement ({statusCounts.pending_disbursement})
                </option>
                <option value="disbursed">Disbursed ({statusCounts.disbursed})</option>
                <option value="rejected">Rejected ({statusCounts.rejected})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <th className="px-6 py-4 text-left font-semibold">Loan ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Customer</th>
                  <th className="px-6 py-4 text-left font-semibold">Product</th>
                  <th className="px-6 py-4 text-right font-semibold">Amount</th>
                  <th className="px-6 py-4 text-center font-semibold">Duration</th>
                  <th className="px-6 py-4 text-center font-semibold">Status</th>
                  <th className="px-6 py-4 text-center font-semibold">Date</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLoans.map((loan, index) => (
                  <tr
                    key={loan.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-indigo-50 transition-colors`}
                  >
                    <td className="px-6 py-4">{loan.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {loan.customers?.Firstname} {loan.customers?.Surname}
                      </div>
                      <div className="text-sm text-gray-500">
                        {loan.customers?.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4">{loan.product_name || loan.product}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-emerald-600">
                        KES {loan.scored_amount?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total: KES {loan.total_payable?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {loan.duration_weeks} weeks
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(
                          loan.status
                        )}`}
                      >
                        {getStatusIcon(loan.status)}
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(loan.created_at).toLocaleDateString("en-GB")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onLoanSelect && onLoanSelect(loan)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-md hover:shadow-lg font-semibold"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLoans.length === 0 && (
            <div className="text-center py-12">
              <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No loans found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters or search criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllLoans;
