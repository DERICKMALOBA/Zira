import React, { useState, useEffect } from 'react';
import { supabase } from "../../../supabaseClient";
import {
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../hooks/userAuth"; // ✅ corrected import

// helper function for approvals
const approveLoan = async (loanId, approved, comment, profile) => {
  let updateData = {};

  console.log("🔍 DEBUG - approveLoan called with:", {
    loanId,
    approved,
    comment,
    profile
  });

  if (profile.role === "branch_manager") {
    updateData = approved
      ? {
          approved_by_bm: profile?.id,
          approved_by_bm_at: new Date().toISOString(),
          bm_comment: comment,
          status: "pending_regional_manager",
        }
      : {
          rejected_by_bm: profile?.id,
          bm_rejected_at: new Date().toISOString(),
          bm_comment: comment,
          status: "rejected",
        };
  } else if (profile.role === "regional_manager") {
    updateData = approved
      ? {
          approved_by_rm: profile?.id,
          approved_by_rm_at: new Date().toISOString(),
          rm_comment: comment,
          status: "approved",
        }
      : {
          rejected_by_rm: profile?.id,
          rm_rejected_at: new Date().toISOString(),
          rm_comment: comment,
          status: "rejected",
        };
  } else {
    console.error("❌ Unknown role:", profile.role);
    throw new Error(`Unknown role: ${profile.role}`);
  }

  console.log("📝 DEBUG - Update data:", updateData);

  const { data, error } = await supabase
    .from("loans")
    .update(updateData)
    .eq("id", loanId);

  if (error) {
    console.error("❌ Approval error:", error);
    throw error;
  }

  console.log("✅ Loan updated successfully");
  return data;
};

const ApproveLoancs = ({ loan, onComplete }) => {
  const { role, profile, user } = useAuth(); // ✅ hook used correctly
  const [loanDetails, setLoanDetails] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loan) fetchLoanDetails();
  }, [loan]);

  const fetchLoanDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select(`
          *,
          customers (*)
        `)
        .eq('id', loan.id)
        .single();

      if (error) throw error;

      setLoanDetails(data);
      setCustomer(data.customers);
      console.log("📋 DEBUG - Current loan status:", data.status);
    } catch (error) {
      console.error("Error fetching loan details:", error);
    }
  };

  const handleApprovalDecision = async (approved) => {
    if (!comment.trim()) {
      alert('Please provide a comment for your decision');
      return;
    }

    if (!profile?.id) {
      alert('Error: User profile ID not found. Please check your authentication.');
      return;
    }

    console.log("🔄 DEBUG - Starting approval process...");

    setLoading(true);
    try {
      await approveLoan(loan.id, approved, comment, profile);
      alert(`Loan ${approved ? "approved" : "rejected"} successfully!`);
      onComplete();
    } catch (error) {
      console.error("❌ Error updating loan:", error);
      alert("Error processing loan decision. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserRole = () => {
    if (role) return role;
    return profile?.role || user?.user_metadata?.role || "unknown";
  };

  const currentRole = getCurrentUserRole();

  if (!loanDetails || !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading loan details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Debug Info - Remove in production */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="text-sm text-yellow-800">
            <strong>Debug Info:</strong> Role: {currentRole || 'Not detected'}, 
            Profile ID: {profile?.id || 'Not found'}, 
            User ID: {user?.id || 'Not found'}
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                Loan Approval Review
                <span className="block text-sm font-normal text-gray-600 mt-1">
                  ({currentRole ? `Logged in as ${currentRole.replace('_', ' ')}` : 'Role not detected'})
                </span>
              </h1>
              <p className="text-gray-600 mt-2">
                Review loan application details and make approval decision
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">
                Loan #{loanDetails.id}
              </div>
              <div className="text-sm text-gray-500">
                Status: <span className="font-semibold">{loanDetails.status}</span>
              </div>
              <div className="text-sm text-gray-500">
                Applied: {new Date(loanDetails.created_at).toLocaleDateString('en-GB')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center mb-6">
              <UserIcon className="h-6 w-6 text-indigo-600 mr-3" />
              Customer Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Full Name:</span>
                <span className="text-gray-900 font-semibold">
                  {customer.Firstname} {customer.Surname}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">ID Number:</span>
                <span className="text-indigo-600 font-mono font-semibold">
                  {customer.id_number || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Mobile:</span>
                <span className="text-gray-900 font-semibold">
                  {customer.mobile}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-gray-900 font-semibold">
                  {customer.email || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Customer Type:</span>
                <span className={`font-semibold ${loanDetails.is_new_customer ? 'text-green-600' : 'text-blue-600'}`}>
                  {loanDetails.is_new_customer ? 'New Customer' : 'Returning Customer'}
                </span>
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center mb-6">
              <CurrencyDollarIcon className="h-6 w-6 text-emerald-600 mr-3" />
              Loan Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Product:</span>
                <span className="text-purple-600 font-semibold">
                  {loanDetails.product_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Principal Amount:</span>
                <span className="text-emerald-600 font-bold text-lg">
                  KES {loanDetails.scored_amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Duration:</span>
                <span className="text-gray-900 font-semibold">
                  {loanDetails.duration_weeks} weeks
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Processing Fee:</span>
                <span className="text-gray-900 font-semibold">
                  KES {loanDetails.processing_fee?.toLocaleString()}
                </span>
              </div>
              {loanDetails.registration_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Registration Fee:</span>
                  <span className="text-gray-900 font-semibold">
                    KES {loanDetails.registration_fee?.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="text-gray-600 font-medium">Total Repayment:</span>
                <span className="text-indigo-600 font-bold text-xl">
                  KES {loanDetails.total_payable?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Manager Decision Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8 border border-indigo-100">
          <h3 className="text-xl font-bold text-gray-900 flex items-center mb-6">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 mr-3" />
            Manager Decision
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Comments / Notes
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Provide your comments and reasoning for the approval/rejection decision..."
                required
              />
            </div>

            <div className="flex gap-4 justify-end">
              <button
                onClick={() => handleApprovalDecision(false)}
                disabled={loading || !comment.trim()}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <XCircleIcon className="h-5 w-5" />
                )}
                Reject Loan
              </button>
              
              <button
                onClick={() => handleApprovalDecision(true)}
                disabled={loading || !comment.trim()}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <CheckCircleIcon className="h-5 w-5" />
                )}
                Approve Loan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveLoancs;