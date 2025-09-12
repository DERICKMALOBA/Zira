// src/components/LoanBookingForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const LoanBookingForm = ({ loanId, onComplete }) => {
  const [loan, setLoan] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [duration, setDuration] = useState(4);
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLoanDetails();
  }, [loanId]);

  useEffect(() => {
    if (loan) {
      calculateRepaymentSchedule();
    }
  }, [loan, duration]);

  const fetchLoanDetails = async () => {
    try {
      const { data: loanData } = await supabase
        .from('loans')
        .select('*, customers(*)')
        .eq('id', loanId)
        .single();

      if (loanData) {
        setLoan(loanData);
        setCustomer(loanData.customers);
      }
    } catch (error) {
      console.error('Error fetching loan details:', error);
    }
  };

  const calculateRepaymentSchedule = () => {
    if (!loan) return;

    const principal = loan.approved_amount;
    const weeklyInterestRate = 0.0625; // 6.25% per week
    const weeklyPayment = principal * weeklyInterestRate;
    const totalPayment = principal + (weeklyPayment * duration);
    
    const schedule = [];
    const today = new Date();
    
    for (let week = 1; week <= duration; week++) {
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + (week * 7));
      
      schedule.push({
        week,
        due_date: dueDate.toISOString().split('T')[0],
        principal: week === duration ? principal : 0,
        interest: weeklyPayment,
        total: week === duration ? principal + weeklyPayment : weeklyPayment
      });
    }
    
    setRepaymentSchedule(schedule);
  };

  const handleBookLoan = async () => {
    setLoading(true);
    try {
      // Update loan with disbursement date and repayment schedule
      const { error: loanError } = await supabase
        .from('loans')
        .update({
          disbursement_date: new Date().toISOString(),
          repayment_schedule: repaymentSchedule,
          booking_status: 'booked',
          status: 'disbursed'
        })
        .eq('id', loanId);

      if (loanError) throw loanError;

      // Update loan assignment status
      const { error: assignmentError } = await supabase
        .from('loan_assignments')
        .update({
          status: 'booked',
          booked_at: new Date().toISOString()
        })
        .eq('loan_id', loanId);

      if (assignmentError) throw assignmentError;

      // TODO: Send notification to customer
      console.log('Would send notification to customer:', customer.mobile);

      alert('Loan successfully booked!');
      onComplete();
    } catch (error) {
      console.error('Error booking loan:', error);
      alert('Error booking loan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!loan || !customer) {
    return <div>Loading loan details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Loan Booking</h2>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Loan Details</h3>
          <p><strong>Loan ID:</strong> {loan.id}</p>
          <p><strong>Customer:</strong> {customer.Firstname} {customer.Surname}</p>
          <p><strong>Approved Amount:</strong> KES {loan.approved_amount?.toLocaleString()}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Repayment Terms</h3>
          <div className="mb-4">
            <label className="block mb-2">Loan Duration (weeks)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
            >
              {[4, 5, 6, 7, 8].map(weeks => (
                <option key={weeks} value={weeks}>{weeks} weeks</option>
              ))}
            </select>
          </div>
          <p><strong>Interest Rate:</strong> 6.25% per week</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Repayment Schedule</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Week</th>
                <th className="px-4 py-2">Due Date</th>
                <th className="px-4 py-2">Principal</th>
                <th className="px-4 py-2">Interest</th>
                <th className="px-4 py-2">Total Payment</th>
              </tr>
            </thead>
            <tbody>
              {repaymentSchedule.map((payment, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-2 text-center">{payment.week}</td>
                  <td className="px-4 py-2">{payment.due_date}</td>
                  <td className="px-4 py-2 text-right">KES {payment.principal.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">KES {payment.interest.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">KES {payment.total.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-4 py-2" colSpan="2">Total</td>
                <td className="px-4 py-2 text-right">KES {loan.approved_amount?.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  KES {(repaymentSchedule.reduce((sum, payment) => sum + payment.interest, 0)).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right">
                  KES {(repaymentSchedule.reduce((sum, payment) => sum + payment.total, 0)).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleBookLoan}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {loading ? 'Processing...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
};

export default LoanBookingForm;