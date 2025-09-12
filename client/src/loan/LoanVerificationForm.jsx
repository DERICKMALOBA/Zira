// src/components/LoanVerificationForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const LoanVerificationForm = ({ loanId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loan, setLoan] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [guarantors, setGuarantors] = useState([]);
  const [nextOfKin, setNextOfKin] = useState([]);
  const [formData, setFormData] = useState({
    customerVerified: false,
    guarantorsVerified: [],
    nextOfKinVerified: [],
    suggestedAmount: '',
    serviceFee: 0,
    decision: '',
    comments: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLoanDetails();
  }, [loanId]);

  const fetchLoanDetails = async () => {
    try {
      // Fetch loan details
      const { data: loanData } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single();

      if (loanData) {
        setLoan(loanData);
        
        // Fetch customer details
        const { data: customerData } = await supabase
          .from('customer')
          .select('*')
          .eq('id', loanData.customer_id)
          .single();
        
        setCustomer(customerData);
        console.log("customer data ",customerData);

        // Fetch guarantors
        const { data: guarantorsData } = await supabase
          .from('guarantors')
          .select('*')
          .eq('customer_id', loanData.customer_id);
        
        setGuarantors(guarantorsData || []);
        setFormData(prev => ({
          ...prev,
          guarantorsVerified: Array(guarantorsData?.length || 0).fill(false)
        }));

        // Fetch next of kin
        const { data: nextOfKinData } = await supabase
          .from('next_of_kin')
          .select('*')
          .eq('customer_id', loanData.customer_id);
        
        setNextOfKin(nextOfKinData || []);
        setFormData(prev => ({
          ...prev,
          nextOfKinVerified: Array(nextOfKinData?.length || 0).fill(false)
        }));
      }
    } catch (error) {
      console.error('Error fetching loan details:', error);
    }
  };

  const calculateServiceFee = (amount) => {
    // 2% service fee with minimum of 100 KES
    return Math.max(amount * 0.02, 100);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-calculate service fee when suggested amount changes
    if (name === 'suggestedAmount') {
      const amount = parseFloat(value) || 0;
      setFormData(prev => ({
        ...prev,
        serviceFee: calculateServiceFee(amount)
      }));
    }
  };

  const handleGuarantorVerification = (index, verified) => {
    const newGuarantorsVerified = [...formData.guarantorsVerified];
    newGuarantorsVerified[index] = verified;
    setFormData(prev => ({
      ...prev,
      guarantorsVerified: newGuarantorsVerified
    }));
  };

  const handleNextOfKinVerification = (index, verified) => {
    const newNextOfKinVerified = [...formData.nextOfKinVerified];
    newNextOfKinVerified[index] = verified;
    setFormData(prev => ({
      ...prev,
      nextOfKinVerified: newNextOfKinVerified
    }));
  };

  const nextStep = () => {
    // Validation before proceeding
    if (step === 1 && !formData.customerVerified) {
      alert('Please verify customer details before proceeding');
      return;
    }
    
    if (step === 2 && formData.guarantorsVerified.some(verified => !verified)) {
      alert('Please verify all guarantors before proceeding');
      return;
    }
    
    if (step === 3 && formData.nextOfKinVerified.some(verified => !verified)) {
      alert('Please verify all next of kin before proceeding');
      return;
    }
    
    if (step === 4 && (!formData.suggestedAmount || formData.suggestedAmount <= 0)) {
      alert('Please enter a valid suggested loan amount');
      return;
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!formData.decision) {
      alert('Please make a final decision');
      return;
    }

    setLoading(true);
    try {
      // Insert into LoanProcessing table
      const { error: processingError } = await supabase
        .from('loan_processing')
        .insert({
          loan_id: loanId,
          customer_verified: formData.customerVerified,
          guarantors_verified: formData.guarantorsVerified.every(v => v),
          next_of_kin_verified: formData.nextOfKinVerified.every(v => v),
          suggested_amount: parseFloat(formData.suggestedAmount),
          service_fee: formData.serviceFee,
          decision: formData.decision,
          comments: formData.comments,
          processed_by: (await supabase.auth.getUser()).data.user.id
        });

      if (processingError) throw processingError;

      // Update loan status
      const { error: loanError } = await supabase
        .from('loans')
        .update({ 
          status: formData.decision,
          approved_amount: formData.decision === 'approved' ? parseFloat(formData.suggestedAmount) : null
        })
        .eq('id', loanId);

      if (loanError) throw loanError;

      // If approved, create loan assignment
      if (formData.decision === 'approved') {
        const { error: assignmentError } = await supabase
          .from('loan_assignments')
          .insert({
            loan_id: loanId,
            assigned_to: null, // Will be assigned by admin
            status: 'unassigned'
          });

        if (assignmentError) throw assignmentError;
      }

      alert('Loan processing completed successfully!');
      onComplete();
    } catch (error) {
      console.error('Error processing loan:', error);
      alert('Error processing loan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!loan || !customer) {
    return <div>Loading loan details th...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Loan Verification Process</h2>
      
      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4, 5].map((stepNum) => (
          <div key={stepNum} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === stepNum ? 'bg-blue-600 text-white' : 
              step > stepNum ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {stepNum}
            </div>
            <span className="text-sm mt-1">
              {['Customer', 'Guarantors', 'Next of Kin', 'Assessment', 'Decision'][stepNum - 1]}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mb-6">
        {step === 1 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Customer Verification</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p><strong>Name:</strong> {customer.prefix} {customer.Firstname} {customer.Middlename} {customer.Surname}</p>
                <p><strong>ID Number:</strong> {customer.id_number}</p>
                <p><strong>Mobile:</strong> {customer.mobile}</p>
              </div>
              <div>
                <p><strong>Date of Birth:</strong> {customer.date_of_birth}</p>
                <p><strong>Gender:</strong> {customer.gender}</p>
                <p><strong>Marital Status:</strong> {customer.marital_status}</p>
              </div>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="customerVerified"
                checked={formData.customerVerified}
                onChange={handleInputChange}
                className="mr-2"
              />
              I verify that the customer details are correct
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Guarantor Verification</h3>
            {guarantors.map((guarantor, index) => (
              <div key={guarantor.id} className="mb-4 p-4 border rounded">
                <h4 className="font-semibold">Guarantor {index + 1}</h4>
                <p><strong>Name:</strong> {guarantor.Firstname} {guarantor.Middlename} {guarantor.Surname}</p>
                <p><strong>Mobile:</strong> {guarantor.mobile}</p>
                <p><strong>ID Number:</strong> {guarantor.id_number}</p>
                <p><strong>Relationship:</strong> {guarantor.relationship}</p>
                
                <div className="mt-2">
                  <label className="block mb-2">Verification Status:</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`guarantor-${index}`}
                        checked={formData.guarantorsVerified[index] === true}
                        onChange={() => handleGuarantorVerification(index, true)}
                        className="mr-2"
                      />
                      Verified
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`guarantor-${index}`}
                        checked={formData.guarantorsVerified[index] === false}
                        onChange={() => handleGuarantorVerification(index, false)}
                        className="mr-2"
                      />
                      Not Verified
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Next of Kin Verification</h3>
            {nextOfKin.map((kin, index) => (
              <div key={kin.id} className="mb-4 p-4 border rounded">
                <h4 className="font-semibold">Next of Kin {index + 1}</h4>
                <p><strong>Name:</strong> {kin.Firstname} {kin.Middlename} {kin.Surname}</p>
                <p><strong>Mobile:</strong> {kin.mobile}</p>
                <p><strong>ID Number:</strong> {kin.id_number}</p>
                <p><strong>Relationship:</strong> {kin.relationship}</p>
                
                <div className="mt-2">
                  <label className="block mb-2">Verification Status:</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`kin-${index}`}
                        checked={formData.nextOfKinVerified[index] === true}
                        onChange={() => handleNextOfKinVerification(index, true)}
                        className="mr-2"
                      />
                      Verified
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`kin-${index}`}
                        checked={formData.nextOfKinVerified[index] === false}
                        onChange={() => handleNextOfKinVerification(index, false)}
                        className="mr-2"
                      />
                      Not Verified
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Loan Assessment</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2">Suggested Loan Amount (KES)</label>
                <input
                  type="number"
                  name="suggestedAmount"
                  value={formData.suggestedAmount}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block mb-2">Service Fee (KES)</label>
                <input
                  type="text"
                  value={formData.serviceFee.toLocaleString()}
                  readOnly
                  className="w-full p-2 border rounded bg-gray-100"
                />
                <p className="text-sm text-gray-600 mt-1">2% of loan amount (minimum 100 KES)</p>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Final Decision</h3>
            <div className="mb-4">
              <label className="block mb-2">Decision</label>
              <select
                name="decision"
                value={formData.decision}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select decision</option>
                <option value="approved">Approve</option>
                <option value="pending">Pending</option>
                <option value="rejected">Reject</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2">Comments</label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows="4"
                placeholder="Enter comments about your decision"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className={`px-4 py-2 rounded ${step === 1 ? 'bg-gray-300' : 'bg-gray-500 text-white'}`}
        >
          Previous
        </button>
        
        {step < 5 ? (
          <button
            onClick={nextStep}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {loading ? 'Processing...' : 'Submit Decision'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LoanVerificationForm;