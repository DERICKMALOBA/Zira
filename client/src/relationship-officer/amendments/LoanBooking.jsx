import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function LoanBookingForm({ amendment, onClose, onBooked }) {
  const [duration, setDuration] = useState(4);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [calculated, setCalculated] = useState({});

  // Loan calculation logic
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
    if (principal >= 3000 && principal <= 5000) product = "Inuka";
    else if (principal >= 6000 && principal <= 10000) product = "Kuza";
    else if (principal >= 11000) product = "Fadhili";

    setCalculated({
      principal,
      processingFee,
      registrationFee,
      interestRate,
      totalInterest,
      totalPayable,
      weeklyPayment,
      product,
    });
  };

  useEffect(() => {
    calculateLoan();
  }, [duration, isNewCustomer]);

const handleConfirm = async () => {
  const { error } = await supabase.from("loans").insert([
    {
      customer_id: amendment.customer_id,
      product: calculated.product,
      prequalified_amount: amendment.loan_prequalified_amount || 0, // if available
      scored_amount: calculated.principal, // principal → mapped to scored_amount
      duration_weeks: duration,
      processing_fee: calculated.processingFee,
      registration_fee: calculated.registrationFee,
      interest_rate: calculated.interestRate,
      total_interest: calculated.totalInterest,
      total_payable: calculated.totalPayable,
      weekly_payment: calculated.weeklyPayment,
      status: "booked",
      booked_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("❌ Error booking loan:", error.message);
    toast.error(`❌ Failed to book loan: ${error.message}`, {
      position: "top-right",
      autoClose: 4000,
      theme: "colored",
    });
  } else {
    toast.success("✅ Loan booked successfully!", {
      position: "top-right",
      autoClose: 3000,
      theme: "colored",
    });
    onBooked();
    onClose();
  }
};

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full md:w-[600px] md:h-auto md:rounded-2xl shadow-lg p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Loan Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Customer Info */}
        <div className="mb-6 space-y-1">
          <p className="text-gray-700">
            <span className="font-medium">Customer:</span>{" "}
            {amendment.customers?.Firstname} {amendment.customers?.Surname}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Loan Amount:</span>{" "}
            Ksh{" "}
            {amendment.loan_scored_amount
              ? Number(amendment.loan_scored_amount).toLocaleString()
              : "0"}
          </p>
        </div>

        {/* Form Fields */}
        <div className="mb-6">
          <label className="block mb-2 text-gray-700 font-medium">
            Loan Duration (weeks)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {[4, 5, 6, 7, 8].map((d) => (
              <option key={d} value={d}>
                {d} weeks
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="flex items-center text-gray-700">
            <input
              type="checkbox"
              checked={isNewCustomer}
              onChange={(e) => setIsNewCustomer(e.target.checked)}
              className="mr-2 accent-green-600"
            />
            New Customer? (Joining Fee applies)
          </label>
        </div>

        {/* Calculations */}
        {calculated && (
          <div className="bg-gray-50 p-5 rounded-xl space-y-2 border border-gray-200">
            <p className="text-gray-700">
              <span className="font-medium">Product:</span>{" "}
              {calculated.product || "N/A"}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Processing Fee:</span> Ksh{" "}
              {calculated.processingFee?.toLocaleString() || "0"}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Registration Fee:</span> Ksh{" "}
              {calculated.registrationFee?.toLocaleString() || "0"}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Interest Rate:</span>{" "}
              {calculated.interestRate || 0}%
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Total Interest:</span> Ksh{" "}
              {calculated.totalInterest?.toLocaleString() || "0"}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Total Payable:</span> Ksh{" "}
              {calculated.totalPayable?.toLocaleString() || "0"}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Weekly Payment:</span> Ksh{" "}
              {calculated.weeklyPayment
                ? calculated.weeklyPayment.toFixed(2)
                : "0.00"}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoanBookingForm;
