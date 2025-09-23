// src/components/LoanPendingRm.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../supabaseClient";
import {
  ClockIcon,
  UserIcon,
  EyeIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import ApproveLoan from "./ApproveLoancs";

const LoanPendingRmcs = () => {
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);

  useEffect(() => {
    fetchPendingLoans();
  }, []);

  const fetchPendingLoans = async () => {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select(`
          *,
          customers (
            Firstname,
            Surname,
            mobile,
            id_number
          )
        `)
        .eq('status', 'pending_regional_manager')
        .order('approved_by_bm_at', { ascending: true });

      if (error) throw error;
      setPendingLoans(data || []);
    } catch (error) {
      console.error("Error fetching pending loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setSelectedLoan(null);
    fetchPendingLoans();
  };

  if (selectedLoan) {
    return <ApproveLoan loan={selectedLoan} onComplete={handleComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading pending loans...</p>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Loans Pending Regional Manager Approval
              </h1>
              <p className="text-gray-600 mt-2">
                Final approval required for loans approved by branch managers
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200">
              <ClockIcon className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-700">
                {pendingLoans.length} Pending
              </span>
            </div>
          </div>
        </div>

    {/* Pending Loans Table */}
<div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead>
        <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <th className="px-6 py-4 text-left font-semibold">Customer Details</th>
          <th className="px-6 py-4 text-left font-semibold">Product</th>
          <th className="px-6 py-4 text-right font-semibold">Amount</th>
          <th className="px-6 py-4 text-center font-semibold">Duration</th>
          <th className="px-6 py-4 text-center font-semibold">BM Approved</th>
          <th className="px-6 py-4 text-center font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {pendingLoans.map((loan, index) => (
          <tr
            key={loan.id}
            className={`${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            } hover:bg-blue-50 transition-colors`}
          >
            <td className="px-6 py-4">
              <div className="space-y-1">
                <div className="font-semibold text-gray-900 text-lg">
                  {loan.customers?.Firstname} {loan.customers?.Surname}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">ID:</span> {loan.customers?.id_number}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Phone:</span> {loan.customers?.mobile}
                </div>
                <div className="text-xs text-blue-600 font-mono mt-1">
                  Loan #: {loan.id}
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="font-semibold text-purple-600 text-lg">
                {loan.product_name || loan.product}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="space-y-1">
                <div className="font-bold text-emerald-600 text-lg">
                  KES {loan.scored_amount?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  Total: KES {loan.total_payable?.toLocaleString()}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-center">
              <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-lg font-medium">
                {loan.duration_weeks} weeks
              </span>
            </td>
            <td className="px-6 py-4 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center text-green-600">
                  <CheckCircleIcon className="h-5 w-5 mr-1" />
                  <span className="font-medium">Approved</span>
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(loan.bm_approved_at).toLocaleDateString('en-GB')}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-center">
              <button 
                onClick={() => setSelectedLoan(loan)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-semibold"
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

  {pendingLoans.length === 0 && (
    <div className="text-center py-12">
      <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending approvals</h3>
      <p className="text-gray-600">
        All approved loans have been reviewed by the regional manager.
      </p>
    </div>
  )}
</div>
      </div>
    </div>
  );
};

export default LoanPendingRmcs;