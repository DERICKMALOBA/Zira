import React, { useState, useEffect } from 'react';
import { supabase } from "../.../../../../supabaseClient";
import {
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  IdentificationIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

const LoanPendingDisbursementcs = () => {
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loanDetails, setLoanDetails] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);
  const [approvalTrail, setApprovalTrail] = useState([]);

  useEffect(() => {
    fetchPendingDisbursementLoans();
  }, []);

  useEffect(() => {
    if (selectedLoan) {
      fetchLoanFullDetails(selectedLoan.id);
    }
  }, [selectedLoan]);

  const fetchPendingDisbursementLoans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("loans")
        .select(`
          *,
          customers (*)
        `)
        .eq('status', 'ca_review')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLoans(data || []);
    } catch (error) {
      console.error("Error fetching pending disbursement loans:", error);
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanFullDetails = async (loanId) => {
    try {
      // Fetch loan with customer details
      const { data: loanData, error: loanError } = await supabase
        .from("loans")
        .select(`
          *,
          customers (*)
        `)
        .eq('id', loanId)
        .single();

      if (loanError) throw loanError;

      // Fetch users involved in approval trail
      const userIds = [
        loanData.booked_by,
        loanData.bm_id,
        loanData.rm_id,
        loanData.ca_id
      ].filter(id => id);

      let usersData = {};
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("*")
          .in('id', userIds);

        if (!usersError && users) {
          users.forEach(user => {
            usersData[user.id] = user;
          });
        }
      }

      setLoanDetails(loanData);
      setCustomer(loanData.customers);
      
      // Build approval trail
      const trail = [];
      
      // RO who booked the loan
      if (loanData.booked_by && usersData[loanData.booked_by]) {
        trail.push({
          role: 'Relationship Officer',
          name: usersData[loanData.booked_by].full_name,
          branch: usersData[loanData.booked_by].branch || 'N/A',
          action: 'Booked Loan',
          timestamp: loanData.created_at,
          comment: 'Loan application submitted'
        });
      }

      // BM review
      if (loanData.bm_reviewed_at) {
        trail.push({
          role: 'Branch Manager',
          name: loanData.bm_id && usersData[loanData.bm_id] ? usersData[loanData.bm_id].full_name : 'N/A',
          decision: loanData.bm_decision,
          comment: loanData.bm_comment,
          timestamp: loanData.bm_reviewed_at,
          action: 'BM Review'
        });
      }

      // RM review (if new loan)
      if (loanData.rm_reviewed_at && loanData.is_new_loan) {
        trail.push({
          role: 'Regional Manager',
          name: loanData.rm_id && usersData[loanData.rm_id] ? usersData[loanData.rm_id].full_name : 'N/A',
          decision: loanData.rm_decision,
          comment: loanData.rm_comment,
          timestamp: loanData.rm_reviewed_at,
          action: 'RM Review'
        });
      }

      // CA review
      if (loanData.ca_reviewed_at) {
        trail.push({
          role: 'Credit Analyst',
          name: loanData.ca_id && usersData[loanData.ca_id] ? usersData[loanData.ca_id].full_name : 'N/A',
          decision: loanData.ca_decision,
          comment: loanData.ca_comment,
          timestamp: loanData.ca_reviewed_at,
          action: 'CA Review'
        });
      }

      setApprovalTrail(trail);
      generateRepaymentSchedule(loanData);

    } catch (error) {
      console.error("Error fetching loan details:", error);
      toast.error("Failed to load loan details");
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

  const handleDisbursement = async (loanId) => {
    try {
      const { error } = await supabase
        .from("loans")
        .update({
          status: 'disbursed',
          disbursed_at: new Date().toISOString()
        })
        .eq("id", loanId);

      if (error) throw error;

      toast.success("Loan disbursed successfully!");
      fetchPendingDisbursementLoans();
      setSelectedLoan(null);
    } catch (error) {
      console.error("Error disbursing loan:", error);
      toast.error("Failed to disburse loan");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading pending disbursements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                Loans Pending Disbursement
              </h1>
              <p className="text-gray-600 mt-2">
                Loans approved and ready for disbursement (Status: CA Review)
              </p>
            </div>
            <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-semibold">
              {loans.length} Loans Pending
            </div>
          </div>
        </div>

        {loans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Disbursements</h3>
            <p className="text-gray-600">All loans have been disbursed. Great work!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Loans List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-indigo-100">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-t-2xl">
                  <h2 className="text-xl font-bold flex items-center">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 mr-2" />
                    Pending Loans
                  </h2>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loans.map((loan) => (
                    <div
                      key={loan.id}
                      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-indigo-50 transition-colors ${
                        selectedLoan?.id === loan.id ? 'bg-indigo-100 border-l-4 border-l-indigo-500' : ''
                      }`}
                      onClick={() => setSelectedLoan(loan)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-900">Loan #{loan.id}</span>
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Ready
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {loan.customers?.Firstname} {loan.customers?.Surname}
                      </p>
                      <p className="text-sm text-gray-600">ID: {loan.customers?.id_number}</p>
                      
                       <p className="text-sm text-gray-600">PHONE: {loan.customers?.mobile}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-indigo-600 font-bold">
                          KES {loan.scored_amount?.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {loan.duration_weeks} weeks
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div className="lg:col-span-2">
              {selectedLoan ? (
                <div className="space-y-6">
                  {/* Loan Summary Info */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                      <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-3" />
                      Loan Summary Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Loan ID:</span>
                          <span className="text-indigo-600 font-mono font-semibold">
                            #{loanDetails?.id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Customer Name:</span>
                          <span className="text-gray-900 font-semibold">
                            {customer?.Firstname} {customer?.Surname}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">ID Number:</span>
                          <span className="text-gray-900 font-semibold">
                            {customer?.id_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Product Type:</span>
                          <span className="text-purple-600 font-semibold">
                            {loanDetails?.product_name}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Approved Amount:</span>
                          <span className="text-emerald-600 font-bold text-lg">
                            KES {loanDetails?.scored_amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Duration:</span>
                          <span className="text-gray-900 font-semibold">
                            {loanDetails?.duration_weeks} weeks
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Weekly Repayment:</span>
                          <span className="text-blue-600 font-semibold">
                            KES {loanDetails?.weekly_payment?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600 font-medium">Total Payable:</span>
                          <span className="text-indigo-600 font-bold">
                            KES {loanDetails?.total_payable?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Trail */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
                    <h3 className="text-xl  text-gray-900 flex items-center mb-4">
                      <IdentificationIcon className="h-6 w-6 text-blue-600 mr-3" />
                      Approval  Audit
                    </h3>
                    <div className="space-y-4">
                      {approvalTrail.map((step, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full mt-2 ${
                            step.decision === 'approved' ? 'bg-green-500' : 
                            step.decision === 'rejected' ? 'bg-red-500' : 'bg-blue-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-900">{step.role}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(step.timestamp).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                            <p className="text-gray-700">{step.name}</p>
                            {step.branch && <p className="text-sm text-gray-600">Branch: {step.branch}</p>}
                            {step.decision && (
                              <p className={`text-sm font-medium ${
                                step.decision === 'approved' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Decision: {step.decision.toUpperCase()}
                              </p>
                            )}
                            {step.comment && (
                              <p className="text-sm text-gray-600 mt-1">Comment: {step.comment}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Repayment Schedule */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                      <CalendarIcon className="h-6 w-6 text-green-600 mr-3" />
                      Repayment Schedule Preview
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Week</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Principal</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Interest</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Fees</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {repaymentSchedule.map((payment, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.week}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {new Date(payment.due_date).toLocaleDateString('en-GB')}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                KES {payment.principal.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                                KES {payment.interest.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-amber-600">
                                KES {(payment.processing_fee + payment.registration_fee).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-bold text-indigo-600">
                                KES {payment.total.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Disbursement Action */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                      <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
                      Ready for Disbursement
                    </h3>
                    <p className="text-gray-700 mb-4">
                      This loan has been fully approved and is ready for disbursement. 
                      Click the button below to mark it as disbursed.
                    </p>
                    <button
                      onClick={() => handleDisbursement(selectedLoan.id)}
                      className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold"
                    >
                      <CurrencyDollarIcon className="h-5 w-5" />
                      Confirm Disbursement
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Loan</h3>
                  <p className="text-gray-600">Choose a loan from the list to view details and process disbursement</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanPendingDisbursementcs;