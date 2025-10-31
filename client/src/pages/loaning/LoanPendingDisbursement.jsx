import { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../hooks/userAuth";
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
  LockClosedIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  EyeIcon,
  ChevronUpDownIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

const LoanPendingDisbursement = () => {
  const { profile, loading: authLoading } = useAuth();
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loanDetails, setLoanDetails] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);
  const [approvalTrail, setApprovalTrail] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [walletInfo, setWalletInfo] = useState({
    balance: 0,
    registration_fee_paid: false,
    processing_fee_paid: false,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Check if user is credit analyst officer
  const isCreditAnalyst = profile?.role === "credit_analyst_officer";

  useEffect(() => {
    if (profile) {
      fetchPendingDisbursementLoans();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedLoan) {
      fetchLoanFullDetails(selectedLoan.id);
    }
  }, [selectedLoan]);

  const fetchPendingDisbursementLoans = async () => {
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
        .eq('status', 'ca_review')
        .order('created_at', { ascending: false });

      // Filter by branch for branch managers
      if (profile?.role === "branch_manager" && profile?.branch_id) {
        query = query.eq('branch_id', profile.branch_id);
      }
      // Filter by region for regional level roles
      else if (profile?.region_id && profile?.role !== "branch_manager") {
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
      console.error("Error fetching pending disbursement loans:", error);
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletAndFeeStatus = async (loanData) => {
    try {
      // Fetch wallet transactions
      const { data: walletTxns, error } = await supabase
        .from("customer_wallets")
        .select("amount, type")
        .eq("customer_id", loanData.customer_id);

      if (error) throw error;

      // Calculate wallet balance
      const balance = walletTxns?.reduce(
        (sum, t) => sum + (t.type === "credit" ? t.amount : -t.amount),
        0
      ) || 0;

      setWalletInfo({
        balance,
        registration_fee_paid: loanData.registration_fee_paid || false,
        processing_fee_paid: loanData.processing_fee_paid || false,
      });
    } catch (error) {
      console.error("Error fetching wallet info:", error);
    }
  };

  // Check if all required fees are paid
  const areFeesFullyPaid = () => {
    if (!loanDetails) return false;
    
    // For new loans: both registration and processing fees must be paid
    if (loanDetails.is_new_loan) {
      return walletInfo.registration_fee_paid && walletInfo.processing_fee_paid;
    }
    
    // For repeat loans: only processing fee must be paid
    return walletInfo.processing_fee_paid;
  };

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

      // Fetch wallet info
      await fetchWalletAndFeeStatus(loanData);

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
          role: 'Credit Analyst Officer',
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
          status: 'ready_for_disbursement',
          disbursed_at: new Date().toISOString()
        })
        .eq("id", loanId);

      if (error) throw error;

      toast.success("Disbursement confirmed Successfully!");
      fetchPendingDisbursementLoans();
      setSelectedLoan(null);
    } catch (error) {
      console.error("Error disbursing loan:", error);
      toast.error("Failed to disburse loan");
    }
  };

  // Filter loans based on search term - MOVE THIS BEFORE IT'S USED
  const filteredLoans = loans.filter((loan) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const loanId = loan.id?.toString().toLowerCase() || "";
    const firstName = loan.customers?.Firstname?.toLowerCase() || "";
    const surname = loan.customers?.Surname?.toLowerCase() || "";
    const fullName = `${firstName} ${surname}`;
    const idNumber = loan.customers?.id_number?.toLowerCase() || "";
    const mobile = loan.customers?.mobile?.toLowerCase() || "";
    
    return (
      loanId.includes(search) ||
      firstName.includes(search) ||
      surname.includes(search) ||
      fullName.includes(search) ||
      idNumber.includes(search) ||
      mobile.includes(search)
    );
  });

  // Sort loans - MOVE THIS AFTER filteredLoans IS DEFINED
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedLoans = [...filteredLoans].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading pending disbursements...</p>
        </div>
      </div>
    );
  }

  const feesPaid = areFeesFullyPaid();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Loans Pending Disbursement
              </h1>
              <p className="text-gray-600 mt-1">
                Review and process approved loans ready for disbursement
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-200">
              <ClockIcon className="h-4 w-4 text-indigo-600" />
              <span className="font-medium text-indigo-700">
                {filteredLoans.length} Pending
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
              placeholder="Search by loan ID, customer name, ID number, or mobile..."
              className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredLoans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? "No loans found" : "No Pending Disbursements"}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? "No loans match your search criteria."
                : isCreditAnalyst 
                  ? "All loans have been disbursed. Great work!"
                  : "There are no loans pending disbursement in your area."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Loans Table - Full Height */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
                <div className="bg-gray-600 text-gray-200 p-6">
                  <h2 className="text-xl font-bold flex items-center">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 mr-2" />
                    Pending Loans
                  </h2>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('id')}
                        >
                          <div className="flex items-center gap-1">
                            Loan ID
                            <ChevronUpDownIcon className="h-4 w-4" />
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th 
                          scope="col" 
                          className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('scored_amount')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Amount
                            <ChevronUpDownIcon className="h-4 w-4" />
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedLoans.map((loan) => (
                        <tr 
                          key={loan.id}
                          className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedLoan?.id === loan.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
                          }`}
                        >
                          <td 
                            className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                            onClick={() => setSelectedLoan(loan)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono">#{loan.id}</span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ready
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {loan.customers?.branches?.name || 'N/A'}
                            </div>
                          </td>
                          <td 
                            className="px-4 py-4 text-sm text-gray-900"
                            onClick={() => setSelectedLoan(loan)}
                          >
                            <div className="font-medium">
                              {loan.customers?.Firstname} {loan.customers?.Surname}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {loan.customers?.id_number}
                            </div>
                            <div className="text-xs text-gray-500">
                              {loan.customers?.mobile}
                            </div>
                          </td>
                          <td 
                            className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900"
                            onClick={() => setSelectedLoan(loan)}
                          >
                            <div className="font-bold text-indigo-600">
                              KES {loan.scored_amount?.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {loan.duration_weeks} weeks
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setSelectedLoan(loan)}
                              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium ml-auto"
                            >
                              <EyeIcon className="h-4 w-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Table Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    Showing {sortedLoans.length} of {loans.length} loans
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div className="xl:col-span-3">
              {selectedLoan ? (
                <div className="space-y-6">
                  {/* Loan Summary Info */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
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
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Branch:</span>
                          <span className="text-gray-900 font-semibold">
                            {customer?.branches?.name || 'N/A'}
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

                  {/* Wallet & Fee Status Section */}
                  <div className={`rounded-2xl shadow-lg p-6 border ${
                    feesPaid 
                      ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200' 
                      : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300'
                  }`}>
                    <h3 className="text-xl font-bold text-gray-600 flex items-center mb-6">
                      <BanknotesIcon className="h-6 w-6 text-emerald-600 mr-3" />
                      Wallet & Fee Payment Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-xl p-5 shadow-sm">
                        <div className="text-sm text-gray-600 mb-2">Wallet Balance</div>
                        <div className="text-2xl font-bold text-indigo-600">
                          KES {walletInfo.balance.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-5 shadow-sm">
                        <div className="text-sm text-gray-600 mb-2">Processing Fee</div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-gray-900">
                            KES {loanDetails?.processing_fee?.toLocaleString()}
                          </span>
                          {walletInfo.processing_fee_paid ? (
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="h-6 w-6 text-green-500" />
                              <span className="text-sm font-semibold text-green-600">Paid</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
                              <span className="text-sm font-semibold text-amber-600">Unpaid</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {loanDetails?.is_new_loan && (
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                          <div className="text-sm text-gray-600 mb-2">Registration Fee</div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">
                              KES {loanDetails?.registration_fee?.toLocaleString()}
                            </span>
                            {walletInfo.registration_fee_paid ? (
                              <div className="flex items-center gap-2">
                                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                                <span className="text-sm font-semibold text-green-600">Paid</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
                                <span className="text-sm font-semibold text-amber-600">Unpaid</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approval Trail */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                      <IdentificationIcon className="h-6 w-6 text-blue-600 mr-3" />
                      Approval Audit Trail
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
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
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
                  <div className={`rounded-2xl p-6 border ${
                    isCreditAnalyst 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                      : 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200'
                  }`}>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                      {isCreditAnalyst ? (
                        <>
                          <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
                          Ready for Disbursement
                        </>
                      ) : (
                        <>
                          <LockClosedIcon className="h-6 w-6 text-gray-600 mr-3" />
                          View Only Mode
                        </>
                      )}
                    </h3>
                    <p className="text-gray-700 mb-4">
                      {isCreditAnalyst 
                        ? "This loan has been fully approved and is ready for disbursement. Click the button below to mark it as disbursed."
                        : "You can view loan details but only Credit Analyst Officers can process disbursements."}
                    </p>
                    {isCreditAnalyst ? (
                      <button
                        onClick={() => handleDisbursement(selectedLoan.id)}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold"
                      >
                        <CurrencyDollarIcon className="h-5 w-5" />
                        Confirm Disbursement
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center gap-3 px-6 py-3 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed font-semibold"
                      >
                        <LockClosedIcon className="h-5 w-5" />
                        Disbursement Restricted
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Loan</h3>
                  <p className="text-gray-600">Choose a loan from the list to view details{isCreditAnalyst ? ' and process disbursement' : ''}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanPendingDisbursement;