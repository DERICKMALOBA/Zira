import { useAuth } from "../../hooks/userAuth";
import { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
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
  ExclamationTriangleIcon,
  BanknotesIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import PromiseToPayForm from "../ptp/PromiseToPayForm";

const DisbursedLoans = () => {
  const { profile, loading: authLoading } = useAuth();
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loanDetails, setLoanDetails] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);
  const [approvalTrail, setApprovalTrail] = useState([]);
  const [repaymentHistory, setRepaymentHistory] = useState([]);
  const [showPTPForm, setShowPTPForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is branch manager
  const isBranchManager = profile?.role === "branch_manager";

  useEffect(() => {
    if (profile) {
      fetchDisbursedLoans();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedLoan) {
      fetchLoanFullDetails(selectedLoan.id);
    }
  }, [selectedLoan]);

  const fetchDisbursedLoans = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("loans")
        .select(`
          *,
          customers (
            *,
            branches (
              id,
              name,
              region_id
            )
          )
        `)
        .eq("status", "disbursed")
        .order("disbursed_at", { ascending: false });

      // Filter by branch for branch managers
      if (isBranchManager && profile?.branch_id) {
        query = query.eq('branch_id', profile.branch_id);
      }
      // Filter by region for regional level roles
      else if (profile?.region_id && !isBranchManager) {
        const { data: branchesInRegion } = await supabase
          .from("branches")
          .select("id")
          .eq("region_id", profile.region_id);
        
        const branchIds = branchesInRegion?.map(b => b.id) || [];
        if (branchIds.length > 0) {
          query = query.in("branch_id", branchIds);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setLoans(data || []);
    } catch (error) {
      console.error("Error fetching disbursed loans:", error);
      toast.error("Failed to load disbursed loans");
    } finally {
      setLoading(false);
    }
  };


 // Filter loans based on search term
const filteredLoans = loans.filter((loan) => {
  if (!searchTerm) return true;

  const search = searchTerm.toLowerCase();

  const loanId = loan.id?.toString().toLowerCase() || "";
  const firstName = loan.customers?.Firstname?.toString().toLowerCase() || "";
  const surname = loan.customers?.Surname?.toString().toLowerCase() || "";
  const fullName = `${firstName} ${surname}`;
  const idNumber = loan.customers?.id_number
    ? loan.customers.id_number.toString().toLowerCase()
    : "";
  const mobile = loan.customers?.mobile
    ? loan.customers.mobile.toString().toLowerCase()
    : "";
  const branch = loan.customers?.branches?.name?.toString().toLowerCase() || "";

  return (
    loanId.includes(search) ||
    firstName.includes(search) ||
    surname.includes(search) ||
    fullName.includes(search) ||
    idNumber.includes(search) ||
    mobile.includes(search) ||
    branch.includes(search)
  );
});


  const fetchLoanFullDetails = async (loanId) => {
    try {
      // Fetch loan with customer details
      const { data: loanData, error: loanError } = await supabase
        .from("loans")
        .select(`
          *,
          customers (
            *,
            branches (
              id,
              name,
              region_id
            )
          )
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

      // Fetch repayment history
      const { data: repayments, error: repaymentError } = await supabase
        .from("repayments")
        .select("*")
        .eq('loan_id', loanId)
        .order('due_date', { ascending: true });

      if (!repaymentError) {
        setRepaymentHistory(repayments || []);
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

      // Disbursement
      if (loanData.disbursed_at) {
        trail.push({
          role: 'System',
          name: 'Auto Disbursed',
          action: 'Funds Disbursed',
          timestamp: loanData.disbursed_at,
          comment: 'Loan amount disbursed to customer'
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
    const startDate = new Date(loan.disbursed_at || loan.created_at);
    const weeklyPayment = loan.weekly_payment || 0;
    const totalInterest = loan.total_interest || 0;
    const processingFee = loan.processing_fee || 0;
    const registrationFee = loan.registration_fee || 0;
    const principal = loan.scored_amount || 0;
    const duration = loan.duration_weeks || 0;

    for (let week = 1; week <= duration; week++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + (week * 7));
      
      // Check if this payment has been made
      const paymentRecord = repaymentHistory.find(repayment => 
        new Date(repayment.due_date).toDateString() === dueDate.toDateString()
      );

      schedule.push({
        week,
        due_date: dueDate.toISOString().split('T')[0],
        principal: week === duration ? principal : 0,
        interest: totalInterest / duration,
        processing_fee: week === 1 ? processingFee : 0,
        registration_fee: week === 1 ? registrationFee : 0,
        total: weeklyPayment,
        status: paymentRecord ? paymentRecord.status : 'pending',
        paid_amount: paymentRecord ? paymentRecord.amount_paid : 0,
        paid_date: paymentRecord ? paymentRecord.payment_date : null
      });
    }
    
    setRepaymentSchedule(schedule);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'disbursed': { color: 'bg-blue-100 text-blue-800', text: 'Active' },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Completed' },
      'defaulted': { color: 'bg-red-100 text-red-800', text: 'Defaulted' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' }
    };

    const config = statusConfig[status] || statusConfig['disbursed'];
    return (
      <span className={`${config.color} px-2 py-1 rounded-full text-xs font-semibold`}>
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      'paid': { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      'partial': { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      'pending': { color: 'bg-gray-100 text-gray-800', icon: ClockIcon },
      'overdue': { color: 'bg-red-100 text-red-800', icon: XCircleIcon }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    const IconComponent = config.icon;

    return (
      <span className={`${config.color} px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 justify-center`}>
        <IconComponent className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const calculateLoanPerformance = () => {
    if (!repaymentSchedule.length) return { paid: 0, pending: 0, overdue: 0 };

    const paid = repaymentSchedule.filter(p => p.status === 'paid').length;
    const pending = repaymentSchedule.filter(p => p.status === 'pending').length;
    const overdue = repaymentSchedule.filter(p => p.status === 'overdue').length;

    return { paid, pending, overdue, total: repaymentSchedule.length };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading disbursed loans...</p>
        </div>
      </div>
    );
  }

  const performance = calculateLoanPerformance();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className=" mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-800 text-base font-semibold">
                Disbursed Loans
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Active loan portfolio ({filteredLoans.length})
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
              <BanknotesIcon className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">
                {filteredLoans.length} Active
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by loan ID, customer name, ID number, mobile, or branch..."
              className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredLoans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <BanknotesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? "No loans found" : "No Disbursed Loans"}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? "No loans match your search criteria."
                : isBranchManager 
                  ? "No loans have been disbursed in your branch yet."
                  : "No loans have been disbursed in your region yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Loans List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-600 text-gray-200 p-6">
                  <h2 className="text-lg font-bold flex items-center">
                    <BanknotesIcon className="h-5 w-5 mr-2" />
                    Active Loans
                  </h2>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedLoan?.id === loan.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
                      }`}
                      onClick={() => setSelectedLoan(loan)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-sm font-semibold text-indigo-600">#{loan.id}</span>
                        {getStatusBadge(loan.status)}
                      </div>
                      <p className="text-gray-900 font-medium text-sm">
                        {loan.customers?.Firstname} {loan.customers?.Surname}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">ID: {loan.customers?.id_number}</p>
                      <p className="text-xs text-gray-600">Mobile: {loan.customers?.mobile}</p>
                      <p className="text-xs text-gray-600">Branch: {loan.customers?.branches?.name || 'N/A'}</p>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                        <span className="text-indigo-600 font-bold text-sm">
                          KES {loan.scored_amount?.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(loan.disbursed_at).toLocaleDateString('en-GB')}
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
                  {/* Loan Performance Summary */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                      <ChartBarIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      Loan Performance
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{performance.paid}</div>
                        <div className="text-xs text-green-800 font-medium mt-1">Paid</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-600">{performance.pending}</div>
                        <div className="text-xs text-yellow-800 font-medium mt-1">Pending</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{performance.overdue}</div>
                        <div className="text-xs text-red-800 font-medium mt-1">Overdue</div>
                      </div>
                    </div>
                  </div>

                  {/* Loan Summary Info */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                      <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      Loan Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 font-medium">Loan ID:</span>
                          <span className="text-indigo-600 font-mono font-semibold">
                            #{loanDetails?.id}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 font-medium">Customer:</span>
                          <span className="text-gray-900 font-semibold">
                            {customer?.Firstname} {customer?.Surname}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 font-medium">ID Number:</span>
                          <span className="text-gray-900 font-semibold">
                            {customer?.id_number}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 font-medium">Product:</span>
                          <span className="text-purple-600 font-semibold">
                            {loanDetails?.product_name}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 font-medium">Branch:</span>
                          <span className="text-gray-900 font-semibold">
                            {customer?.branches?.name || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 font-medium">Amount:</span>
                          <span className="text-emerald-600 font-bold">
                            KES {loanDetails?.scored_amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 font-medium">Duration:</span>
                          <span className="text-gray-900 font-semibold">
                            {loanDetails?.duration_weeks} weeks
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 font-medium">Weekly Payment:</span>
                          <span className="text-blue-600 font-semibold">
                            KES {loanDetails?.weekly_payment?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-2">
                          <span className="text-gray-600 font-medium">Disbursed:</span>
                          <span className="text-indigo-600 font-semibold">
                            {new Date(loanDetails?.disbursed_at).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Repayment Schedule */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <CalendarIcon className="h-5 w-5 text-green-600 mr-2" />
                        Repayment Schedule
                      </h3>
                      <button
                        onClick={() => setShowPTPForm(true)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all"
                      >
                        + Add Promise to Pay
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Week</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Due Date</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">Amount Due</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">Paid</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {repaymentSchedule.map((payment, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 text-xs font-medium text-gray-900">{payment.week}</td>
                              <td className="px-4 py-3 text-xs text-gray-900">
                                {new Date(payment.due_date).toLocaleDateString('en-GB')}
                              </td>
                              <td className="px-4 py-3 text-xs text-right font-semibold text-gray-900">
                                KES {payment.total.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-xs text-right font-semibold text-green-600">
                                {payment.paid_amount > 0 ? `KES ${payment.paid_amount.toLocaleString()}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-xs text-center">
                                {getPaymentStatusBadge(payment.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Loan History */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                      <IdentificationIcon className="h-5 w-5 text-blue-600 mr-2" />
                      Audit Trail
                    </h3>
                    <div className="space-y-3">
                      {approvalTrail.map((step, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            step.decision === 'approved' ? 'bg-green-500' : 
                            step.decision === 'rejected' ? 'bg-red-500' : 
                            step.action === 'Funds Disbursed' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-900">{step.role}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(step.timestamp).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 mt-1">{step.name}</p>
                            {step.branch && <p className="text-xs text-gray-600">Branch: {step.branch}</p>}
                            {step.decision && (
                              <p className={`text-xs font-medium mt-1 ${
                                step.decision === 'approved' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {step.decision.toUpperCase()}
                              </p>
                            )}
                            {step.comment && (
                              <p className="text-xs text-gray-600 mt-1">{step.comment}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Loan</h3>
                  <p className="text-gray-600">Choose a loan from the list to view details and repayment status</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {showPTPForm && selectedLoan && (
        <PromiseToPayForm 
          loan={selectedLoan} 
          customer={customer} 
          createdBy={profile?.id}
          onClose={() => setShowPTPForm(false)}
        />
      )}
    </div>
  );
};

const ChartBarIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export default DisbursedLoans;