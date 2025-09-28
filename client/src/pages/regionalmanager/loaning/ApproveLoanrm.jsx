import React, { useState, useEffect } from 'react';
import { supabase } from "../.../../../../supabaseClient";
import {
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  BanknotesIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useAuth } from "../../../hooks/userAuth"; // ✅ corrected import

const ApproveLoanrm = ({ loan, onComplete }) => {
  const { profile } = useAuth(); // hook used correctly
  const [loanDetails, setLoanDetails] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookedByUser, setBookedByUser] = useState(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);

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

      // Fetch the user who created the loan
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq('id', data.booked_by)
        .single();

      if (userError) {
        console.warn("Error fetching user details:", userError);
      }

      setLoanDetails(data);
      setCustomer(data.customers);
      setBookedByUser(userData || null);
      
      if (data) {
        generateRepaymentSchedule(data);
      }
      
      console.log("DEBUG - Current loan status:", data.status);
    } catch (error) {
      console.error("Error fetching loan details:", error);
    }
  };
const approveLoan = async (loanId, approved, comment, profile, isNewLoan) => {
  
  let newStatus = "rejected"; 

  if (approved) {
    if (isNewLoan) {
      newStatus = "ca_review";  
    } else {
      newStatus = "rejected";
    }
  }

  const { error } = await supabase
    .from("loans")
    .update({
      status: newStatus,
      rm_comment: comment,
      rm_id: profile?.id || null,
      rm_reviewed_at: new Date().toISOString(),
    })
    .eq("id", loanId);

  if (error) {
    console.error(" Supabase error while approving loan:", {
      loanId,
      attemptedStatus: newStatus,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      errorCode: error.code,
    });
    throw error; 
  }

 
};


// ===================
const handleApprovalDecision = async (approved) => {
  if (!comment.trim()) {
    toast.error("Please provide a comment for your decision");
    return;
  }

  if (!profile?.id) {
    toast.error("User profile ID not found. Please log in again.");
    return;
  }

  

  setLoading(true);
  try {
    await approveLoan(loan.id, approved, comment, profile, loan.is_new_loan);

    toast.success(
      ` Loan ${approved ? "approved & forwarded" : "rejected"} successfully!`
    );

    onComplete?.(); // safely call refresh/close
  } catch (error) {
    console.error("Error updating loan in handler:", error);
    toast.error("Error processing loan decision. Please try again.");
  } finally {
    setLoading(false);
  }
};


  const generateRepaymentSchedule = (loan) => {
    const schedule = [];
    const startDate = new Date(loan.created_at);
    const weeklyPayment = loan.weekly_payment || 0;
    const totalInterest = loan.total_interest || 0;
    const processingFee = loan.processing_fee || 0;
    const registrationFee = loan.registration_fee || 0;
    const principal = loan.scored_amount || 0;
    const duration = loan.duration_weeks || 0;

    for (let week = 1; week <= duration; week++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + (week * 7));
      
      schedule.push({
        week,
        due_date: dueDate.toISOString().split('T')[0],
        principal: week === duration ? principal : 0,
        interest: totalInterest / duration,
        processing_fee: week === 1 ? processingFee : 0,
        registration_fee: week === 1 ? registrationFee : 0,
        total: weeklyPayment
      });
    }
    
    setRepaymentSchedule(schedule);
  };
  
  

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
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                Loan Approval Review 
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
                <span className="text-gray-600 font-medium">Loan Type:</span>
                <span className={`font-semibold ${loanDetails.is_new_loan ? 'text-green-600' : 'text-blue-600'}`}>
                  {loanDetails.is_new_loan ? 'New Loan' : 'Repeat'}
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

        {/* Booked By Information */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 mt-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
            <IdentificationIcon className="h-6 w-6 text-purple-600 mr-3" />
            Booked By
          </h3>
          {bookedByUser ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Name:</span>
                <span className="text-gray-900 font-semibold">
                  {bookedByUser.full_name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-gray-900 font-semibold text-right text-sm">
                  {bookedByUser.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Role:</span>
                <span className="text-purple-600 font-semibold">
                  {bookedByUser.role || 'Staff'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">User information not available</p>
            </div>
          )}
        </div>

                  {/* Repayment Schedule */}
                  {repaymentSchedule.length > 0 && (
                    <div className="   bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4">
                        <h3 className="text-xl font-bold flex items-center">
                          <DocumentTextIcon className="h-6 w-6 mr-3" />
                          Repayment Schedule
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Week</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
                              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Principal</th>
                              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Interest</th>
                              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Fees</th>
                              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Installments</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">

                            {repaymentSchedule.map((payment, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 text-sm">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                      <span className="text-indigo-600 font-semibold text-sm">{payment.week}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {new Date(payment.due_date).toLocaleDateString('en-GB')}
                                </td>
                                <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                                  KES {payment.principal.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-right font-semibold text-blue-600">
                                  KES {payment.interest.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-right font-semibold text-amber-600">
                                  KES {(payment.processing_fee + payment.registration_fee).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-right font-bold text-indigo-600">
                                  KES {payment.total.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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



export default ApproveLoanrm;