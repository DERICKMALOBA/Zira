// src/components/LoanBookingForm.jsx
import  { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import {
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

const LoanBookingForm = ({ amendment, onComplete }) => {
  const [loan, setLoan] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [duration, setDuration] = useState(4);
  const [calculated, setCalculated] = useState({});
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

    const handleClose = () => {
    onComplete();
  };

  useEffect(() => {
    if (amendment) {
      fetchVerificationAndCustomer();
    }
  }, [amendment]);

  useEffect(() => {
    if (loan) {
      calculateLoan();
    }
  }, [loan, duration, isNewCustomer]);

  const fetchVerificationAndCustomer = async () => {
    try {
      // Check if customer has previous loans to determine if they're new
      const { data: previousLoans, error: loansError } = await supabase
        .from("loans")
        .select("id")
        .eq("customer_id", amendment.customer_id);

      if (loansError) throw loansError;
      
      // Customer is new if they have no previous loans
      setIsNewCustomer(!previousLoans || previousLoans.length === 0);

      const { data, error } = await supabase
        .from("customer_verifications")
        .select("loan_scored_amount, customer_id, customers(*)")
        .eq("customer_id", amendment.customer_id)
        .single();

      if (error) throw error;

      if (data) {
        setLoan({ approved_amount: data.loan_scored_amount });
        setCustomer(data.customers);
      }
    } catch (error) {
      console.error("Error fetching verification/customer:", error);
    }
  };

  const calculateLoan = () => {
    const principal = Number(amendment.loan_scored_amount) || 0;
    let processingFee = principal <= 10000 ? 500 : principal * 0.05;
    let registrationFee = isNewCustomer ? 300 : 0;

    const weeklyRate = 6.25;
    const interestRate = weeklyRate * duration;
    const totalInterest = (principal * interestRate) / 100;

    const totalPayable = principal + totalInterest + processingFee + registrationFee;
    const weeklyPayment = totalPayable / duration;

    let product = "";
    let productName = "";
    
    if (principal >= 3000 && principal <= 5000) {
      product = "Inuka";
      productName = "Inuka (3K-5K)";
    } else if (principal >= 6000 && principal <= 10000) {
      product = "Kuza";
      productName = "Kuza (6K-10K)";
    } else if (principal >= 11000) {
      product = "Fadhili";
      productName = "Fadhili (11K+)";
    }

    setCalculated({
      principal,
      processingFee,
      registrationFee,
      interestRate,
      totalInterest,
      totalPayable,
      weeklyPayment,
      product,
      productName,
    });

    // Generate repayment schedule
    const schedule = [];
    const today = new Date();
    
    for (let week = 1; week <= duration; week++) {
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + (week * 7));
      
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

  const handleBookLoan = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("loans").insert([
        {
          customer_id: amendment.customer_id,
          product: calculated.product,
          product_name: calculated.productName,
          prequalified_amount: amendment.loan_prequalified_amount || 0,
          scored_amount: calculated.principal,
          duration_weeks: duration,
          processing_fee: calculated.processingFee,
          registration_fee: calculated.registrationFee,
          interest_rate: calculated.interestRate,
          total_interest: calculated.totalInterest,
          total_payable: calculated.totalPayable,
          weekly_payment: calculated.weeklyPayment,
          status: "booked",
          booked_at: new Date().toISOString(),
          is_new_customer: isNewCustomer,
        },
      ]);

      if (error) throw error;

      console.log("Would send notification to customer:", customer.mobile);
      alert("Loan successfully booked!");
      onComplete();
    } catch (error) {
      console.error("Error booking loan:", error);
      alert("Error booking loan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!loan || !customer) {
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
       <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleClose}
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                Loan Booking Confirmation
              </h1>
              <p className="text-gray-600 mt-2">
                Review and confirm loan disbursement details
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg border border-emerald-200">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Ready to Book</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
          {/* Customer and Loan Overview */}
          <div className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50 border-b border-indigo-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customer Details */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
                <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                  <UserIcon className="h-6 w-6 text-indigo-600 mr-3" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Name:</span>
                    <span className="text-gray-900 font-semibold">
                      {customer.Firstname} {customer.Surname}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Customer ID:</span>
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
                    <span className="text-gray-600 font-medium">Customer Type:</span>
                    <span className={`font-semibold ${isNewCustomer ? 'text-green-600' : 'text-blue-600'}`}>
                      {isNewCustomer ? 'New Customer' : 'Returning Customer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loan Summary */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
                <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                  <CurrencyDollarIcon className="h-6 w-6 text-emerald-600 mr-3" />
                  Loan Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Product:</span>
                    <span className="text-indigo-600 font-semibold">
                      {calculated.productName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Principal Amount:</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      KES {calculated.principal?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Interest Rate:</span>
                    <span className="text-gray-900 font-semibold">{calculated.interestRate}% ({duration} weeks)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Processing Fee:</span>
                    <span className="text-gray-900 font-semibold">
                      KES {calculated.processingFee?.toLocaleString() || '0'}
                    </span>
                  </div>
                  {isNewCustomer && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Registration Fee:</span>
                      <span className="text-gray-900 font-semibold">
                        KES {calculated.registrationFee?.toLocaleString() || '0'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600 font-medium">Total Repayment:</span>
                    <span className="text-lg font-bold text-indigo-600">
                      KES {(repaymentSchedule.reduce((sum, payment) => sum + payment.total, 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Repayment Terms Configuration */}
          <div className="p-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center mb-6">
                <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
                Repayment Configuration
              </h3>
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Loan Duration (weeks)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                >
                  {[4, 5, 6, 7, 8].map(weeks => (
                    <option key={weeks} value={weeks}>
                      {weeks} weeks - {6.25 * weeks}% interest
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Repayment Schedule */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center mb-6">
                <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-3" />
                Repayment Schedule
              </h3>
              
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                        <th className="px-6 py-4 text-left font-semibold">Week</th>
                        <th className="px-6 py-4 text-left font-semibold">Due Date</th>
                        <th className="px-6 py-4 text-right font-semibold">Principal</th>
                        <th className="px-6 py-4 text-right font-semibold">Interest</th>
                        <th className="px-6 py-4 text-right font-semibold">Fees</th>
                        <th className="px-6 py-4 text-right font-semibold">Total Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {repaymentSchedule.map((payment, index) => (
                        <tr 
                          key={index} 
                          className={`${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          } hover:bg-indigo-50 transition-colors`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 font-semibold text-sm">
                                  {payment.week}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-gray-900">
                              <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                              {new Date(payment.due_date).toLocaleDateString('en-GB')}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">
                            KES {payment.principal.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-orange-600">
                            KES {payment.interest.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-amber-600">
                            KES {(payment.processing_fee + payment.registration_fee).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-indigo-600">
                            KES {payment.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Totals Row */}
                      <tr className="bg-gradient-to-r from-indigo-100 to-blue-100 border-t-2 border-indigo-200">
                        <td className="px-6 py-4 font-bold text-gray-900" colSpan="2">
                          TOTAL
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          KES {loan.approved_amount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-orange-600">
                          KES {(repaymentSchedule.reduce((sum, payment) => sum + payment.interest, 0)).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-amber-600">
                          KES {(repaymentSchedule.reduce((sum, payment) => sum + payment.processing_fee + payment.registration_fee, 0)).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-indigo-600 text-lg">
                          KES {(repaymentSchedule.reduce((sum, payment) => sum + payment.total, 0)).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Loan Product Information */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 mb-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center mb-6">
                <TagIcon className="h-6 w-6 text-purple-600 mr-3" />
                Loan Product Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <h4 className="font-semibold text-purple-700 mb-2">Inuka</h4>
                  <p className="text-sm text-gray-600">KES 3,000 - 5,000</p>
                  <p className="text-xs text-gray-500 mt-2">4-8 weeks duration</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <h4 className="font-semibold text-blue-700 mb-2">Kuza</h4>
                  <p className="text-sm text-gray-600">KES 6,000 - 10,000</p>
                  <p className="text-xs text-gray-500 mt-2">4-8 weeks duration</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <h4 className="font-semibold text-green-700 mb-2">Fadhili</h4>
                  <p className="text-sm text-gray-600">KES 11,000 and above</p>
                  <p className="text-xs text-gray-500 mt-2">4-8 weeks duration</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p><span className="font-semibold">Processing Fee:</span> KES 500 for loans up to 10K, 5% of principal for loans above 10K</p>
                <p><span className="font-semibold">Registration Fee:</span> KES 300 (one-time payment for new customers only)</p>
                <p><span className="font-semibold">Interest Rate:</span> 25% over 4 weeks (6.25% per week)</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-8 border-t border-gray-200">
              <button
                onClick={handleBookLoan}
                disabled={loading}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Processing Booking...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-6 w-6" />
                    Confirm Loan Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanBookingForm;