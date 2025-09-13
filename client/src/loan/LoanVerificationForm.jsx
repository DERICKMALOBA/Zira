// src/components/LoanVerificationForm.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoanVerificationForm = ({ customerId, loanId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loan, setLoan] = useState(null);
  const [securityItems, setSecurityItems] = useState([]);
  const [guarantorSecurityItems, setGuarantorSecurityItems] = useState([]);
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
  const [hasLoan, setHasLoan] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
      if (loanId) {
        fetchLoanDetails();
      } else {
        setHasLoan(false);
      }
    }
  }, [customerId, loanId]);

  const fetchCustomerDetails = async () => {
    try {
      // Fetch customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (customerError) {
        console.error('Error fetching customer:', customerError);
        toast.error('Error loading customer details');
        return;
      }
      
      setCustomer(customerData || {});
      console.log('Customer data loaded:', customerData);

      // Fetch guarantors
      const { data: guarantorsData, error: guarantorsError } = await supabase
        .from('guarantors')
        .select('*')
        .eq('customer_id', customerId);
      
      if (guarantorsError) {
        console.error('Error fetching guarantors:', guarantorsError);
        toast.error('Error loading guarantor details');
      } else {
        setGuarantors(guarantorsData || []);
        setFormData(prev => ({
          ...prev,
          guarantorsVerified: Array(guarantorsData?.length || 0).fill(false)
        }));
        console.log('Guarantors data loaded:', guarantorsData);

        // Fetch guarantor security for each guarantor
        if (guarantorsData && guarantorsData.length > 0) {
          const guarantorIds = guarantorsData.map(g => g.id);
          const { data: gSecurity, error: gSecurityError } = await supabase
            .from('guarantor_security')
            .select('*')
            .in('guarantor_id', guarantorIds);

          if (!gSecurityError && gSecurity) {
            setGuarantorSecurityItems(gSecurity);
            console.log('Guarantor security loaded:', gSecurity);
          }
        }
      }

      // Fetch next of kin
      const { data: nextOfKinData, error: nextOfKinError } = await supabase
        .from('next_of_kin')
        .select('*')
        .eq('customer_id', customerId);
      
      if (nextOfKinError) {
        console.error('Error fetching next of kin:', nextOfKinError);
        toast.error('Error loading next of kin details');
      } else {
        setNextOfKin(nextOfKinData || []);
        setFormData(prev => ({
          ...prev,
          nextOfKinVerified: Array(nextOfKinData?.length || 0).fill(false)
        }));
        console.log('Next of kin data loaded:', nextOfKinData);
      }

      // Fetch borrower security
      const { data: securityData, error: securityError } = await supabase
        .from('security_items')
        .select('*')
        .eq('customer_id', customerId);

      if (securityError) {
        console.error('Error fetching security items:', securityError);
      } else {
        setSecurityItems(securityData || []);
        console.log('Security items loaded:', securityData);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error('Error loading customer details');
    }
  };

  const fetchLoanDetails = async () => {
    try {
      // Fetch loan details
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single();

      if (loanError) {
        console.error('Error fetching loan:', loanError);
        setHasLoan(false);
        toast.error('Error loading loan details');
        return;
      }

      if (loanData) {
        setLoan(loanData);
        console.log('Loan data loaded:', loanData);
        // Pre-fill suggested amount with principal amount if available
        if (loanData.principal) {
          setFormData(prev => ({
            ...prev,
            suggestedAmount: loanData.principal,
            serviceFee: calculateServiceFee(loanData.principal)
          }));
        }
      } else {
        setHasLoan(false);
        console.log('No loan found with ID:', loanId);
      }
    } catch (error) {
      console.error('Error fetching loan details:', error);
      setHasLoan(false);
      toast.error('Error loading loan details');
    }
  };

const calculateServiceFee = (amount) => {
  if (amount <= 10000) {
    return 500; // Flat fee for loans <= 10k
  }
  return amount * 0.05; // 5% for loans above 10k
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



  const nextStep = () => {
    // Validation before proceeding
    if (step === 1 && !formData.customerVerified) {
      toast.error('Please verify customer details before proceeding');
      return;
    }
    
    if (step === 2 && guarantors.length > 0 && formData.guarantorsVerified.some(verified => !verified)) {
      toast.error('Please verify all guarantors before proceeding');
      return;
    }
    
    if (step === 3 && nextOfKin.length > 0 && formData.nextOfKinVerified.some(verified => !verified)) {
      toast.error('Please verify all next of kin before proceeding');
      return;
    }
    
    if (step === 4 && (!formData.suggestedAmount || formData.suggestedAmount <= 0)) {
      toast.error('Please enter a valid suggested loan amount');
      return;
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!formData.decision) {
      toast.error('Please make a final decision');
      return;
    }

    setLoading(true);
    try {
      // If there's no loan but we have a customer, we might need to create a loan first
      let actualLoanId = loanId;
      
      if (!hasLoan && customerId) {
        // Create a new loan record
        const { data: newLoan, error: loanError } = await supabase
          .from('loans')
          .insert({
            customer_id: customerId,
            principal: parseFloat(formData.suggestedAmount),
            status: 'pending',
            application_date: new Date().toISOString()
          })
          .select()
          .single();
          
        if (loanError) {
          console.error('Error creating loan:', loanError);
          throw loanError;
        }
        
        actualLoanId = newLoan.id;
        setLoan(newLoan);
        setHasLoan(true);
        console.log('New loan created:', newLoan);
      }

      // Insert into LoanProcessing table
      const { data: processingData, error: processingError } = await supabase
        .from('loan_processing')
        .insert({
          loan_id: actualLoanId,
          customer_verified: formData.customerVerified,
          guarantors_verified: guarantors.length > 0 ? formData.guarantorsVerified.every(v => v) : null,
          next_of_kin_verified: nextOfKin.length > 0 ? formData.nextOfKinVerified.every(v => v) : null,
          suggested_amount: parseFloat(formData.suggestedAmount),
          service_fee: formData.serviceFee,
          decision: formData.decision,
          comments: formData.comments,
          processed_by: (await supabase.auth.getUser()).data.user.id
        })
        .select();

      if (processingError) {
        console.error('Error inserting into loan_processing:', processingError);
        throw processingError;
      }

      console.log('Loan processing record created:', processingData);

      // Update loan status
      const { data: updatedLoan, error: loanError } = await supabase
        .from('loans')
        .update({ 
          status: formData.decision,
          approved_amount: formData.decision === 'approved' ? parseFloat(formData.suggestedAmount) : null
        })
        .eq('id', actualLoanId)
        .select();

      if (loanError) {
        console.error('Error updating loan:', loanError);
        throw loanError;
      }

      console.log('Loan updated:', updatedLoan);

      // If approved, create loan assignment
      if (formData.decision === 'approved') {
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('loan_assignments')
          .insert({
            loan_id: actualLoanId,
            assigned_to: null, // Will be assigned by admin
            status: 'unassigned'
          })
          .select();

        if (assignmentError) {
          console.error('Error creating loan assignment:', assignmentError);
          throw assignmentError;
        }

        console.log('Loan assignment created:', assignmentData);
      }

      toast.success('Loan processing completed successfully!');
      console.log('Loan verification process completed successfully');
      onComplete();
    } catch (error) {
      console.error('Error processing loan:', error);
      toast.error('Error processing loan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Loan Verification Process</h2>
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  return (
 <div className="max-w-5xl mx-auto p-8 bg-white rounded-xl shadow-lg">
  {/* Title */}
  <h2 className="text-3xl font-bold text-center text-blue-700 mb-10 tracking-wide">
    Loan Verification Process
  </h2>

  {/* Progress Steps */}
  <div className="flex justify-between mb-10">
    {[1, 2, 3, 4, 5].map((stepNum) => (
      <div key={stepNum} className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold shadow-md transition ${
            step === stepNum
              ? "bg-blue-600 text-white ring-4 ring-blue-200"
              : step > stepNum
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {stepNum}
        </div>
        <span className="text-sm mt-2 font-medium text-gray-700">
          {["Customer", "Guarantors", "Next of Kin", "Assessment", "Decision"][stepNum - 1]}
        </span>
      </div>
    ))}
  </div>

  {/* Step Content */}
  <div className="mb-8">
    {/* Step 1: Customer */}
    {step === 1 && (
      <div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
          Customer Verification
        </h3>

        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-6 text-gray-700">
          <div className="space-y-3">
            <p><span className="font-medium">Name:</span> {customer.prefix} {customer.Firstname} {customer.Middlename} {customer.Surname}</p>
            <p><span className="font-medium">ID Number:</span> {customer.id_number || "N/A"}</p>
            <p><span className="font-medium">Mobile:</span> {customer.mobile || "N/A"}</p>
            <p><span className="font-medium">Date of Birth:</span> {customer.date_of_birth || "N/A"}</p>
                        <p><span className="font-medium">Gender:</span> {customer.gender || "N/A"}</p>

          </div>
          <div className="space-y-3">
            <p><span className="font-medium">Marital Status:</span> {customer.marital_status || "N/A"}</p>
            <p><span className="font-medium">Residence Status:</span> {customer.residence_status || "N/A"}</p>
            <p><span className="font-medium">Postal Address:</span> {customer.postal_address || "N/A"}</p>
                        <p><span className="font-medium">Town/City:</span> {customer.town || "N/A"}</p>
                                    <p><span className="font-medium">county:</span> {customer.county || "N/A"}</p>


          </div>
        </div>

        {/* Business Info */}
        <div className="mt-8">
          <h4 className="text-xl font-semibold text-gray-800 mb-4">Business Information</h4>
          <div className="grid grid-cols-2 gap-6 text-gray-700">
            <div className="space-y-2">
              <p><span className="font-medium">Business Name:</span> {customer.business_name || "N/A"}</p>
              <p><span className="font-medium">Year Established:</span> {customer.year_established || "N/A"}</p>
              <p><span className="font-medium">Business Location:</span> {customer.business_location || "N/A"}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Road:</span> {customer.road || "N/A"}</p>
              <p><span className="font-medium">Landmark:</span> {customer.landmark || "N/A"}</p>
              <p><span className="font-medium">Local Authority License:</span> {customer.has_local_authority_license ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* Security Items */}
        {securityItems.length > 0 && (
          <div className="mt-8">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">Security Items</h4>
            <table className="w-full text-sm border rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 border text-left">#</th>
                  <th className="px-4 py-2 border text-left">Item</th>
                  <th className="px-4 py-2 border text-left">Description</th>
                  <th className="px-4 py-2 border text-left">Identification</th>
                  <th className="px-4 py-2 border text-left">Value (KES)</th>
                </tr>
              </thead>
              <tbody>
                {securityItems.map((item, index) => (
                  <tr key={index} className="odd:bg-white even:bg-gray-50">
                    <td className="px-4 py-2 border">{index + 1}</td>
                    <td className="px-4 py-2 border">{item.item || "N/A"}</td>
                    <td className="px-4 py-2 border">{item.description || "N/A"}</td>
                    <td className="px-4 py-2 border">{item.identification || "N/A"}</td>
                    <td className="px-4 py-2 border">{item.value ? `KES ${item.value}` : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <label className="flex items-center mt-6 text-gray-700">
          <input
            type="checkbox"
            name="customerVerified"
            checked={formData.customerVerified}
            onChange={handleInputChange}
            className="mr-2 w-5 h-5 text-blue-600 focus:ring focus:ring-blue-300"
          />
          <span className="font-medium">I verify that the customer details are correct</span>
        </label>
      </div>
    )}

  
  {/* Step 2: Guarantors */}
{step === 2 && (
  <div>
    <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
      Guarantor Verification
    </h3>

    {guarantors.length > 0 ? (
      guarantors.map((guarantor, index) => {
        const guarantorSecurity = guarantorSecurityItems.filter(
          (item) => item.guarantor_id === guarantor.id
        );

        return (
          <div key={guarantor.id} className="mb-6 p-6 border rounded-lg bg-gray-50">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">
              Guarantor {index + 1}
            </h4>

            {/* Personal Info Grid */}
            <div className="grid grid-cols-2 gap-6 text-gray-700 mb-4">
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {guarantor.prefix} {guarantor.Firstname} {guarantor.Middlename} {guarantor.Surname}</p>
                <p><span className="font-medium">Mobile:</span> {guarantor.mobile || "N/A"}</p>
                <p><span className="font-medium">ID Number:</span> {guarantor.id_number || "N/A"}</p>
                                <p><span className="font-medium">Gender:</span> {guarantor.gender || "N/A"}</p>
                                                <p><span className="font-medium">Relationship:</span> {guarantor.relationship || "N/A"}</p>


              </div>
              <div className="space-y-2">
                <p><span className="font-medium">Occupation:</span> {guarantor.occupation || "N/A"}</p>
                <p><span className="font-medium">Postal Address:</span> {guarantor.postal_address || "N/A"}</p>
                                <p><span className="font-medium">Code:</span> {guarantor.code || "N/A"}</p>

                                <p><span className="font-medium">Town/City:</span> {guarantor.town || "N/A"}</p>
                                                <p><span className="font-medium">County:</span> {guarantor.county|| "N/A"}</p>

              </div>
            </div>

            {/* Security Table */}
            {guarantorSecurity.length > 0 && (
              <div className="mt-6">
                <h5 className="text-lg font-semibold text-gray-800 mb-3">
                  Security Provided
                </h5>
                <table className="w-full text-sm border rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-4 py-2 border text-left">#</th>
                      <th className="px-4 py-2 border text-left">Item</th>
                      <th className="px-4 py-2 border text-left">Description</th>
                      <th className="px-4 py-2 border text-left">Identification</th>
                      <th className="px-4 py-2 border text-left">Value (KES)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guarantorSecurity.map((item, idx) => (
                      <tr key={idx} className="odd:bg-white even:bg-gray-50">
                        <td className="px-4 py-2 border">{idx + 1}</td>
                        <td className="px-4 py-2 border">{item.item || "N/A"}</td>
                        <td className="px-4 py-2 border">{item.description || "N/A"}</td>
                        <td className="px-4 py-2 border">{item.identification || "N/A"}</td>
                        <td className="px-4 py-2 border">{item.estimated_market_value ? `KES ${item.estimated_market_value}` : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}


              {/* Verify Checkbox */}
            <label className="flex items-center mt-4 text-gray-700">
              <input
                type="checkbox"
                checked={formData.guarantorsVerified[index] || false}
                onChange={(e) => {
                  const updated = [...formData.guarantorsVerified];
                  updated[index] = e.target.checked;
                  setFormData((prev) => ({ ...prev, guarantorsVerified: updated }));
                }}
                className="mr-2 w-5 h-5 text-blue-600 focus:ring focus:ring-blue-300"
              />
              <span className="font-medium">
                I verify that this guarantor’s details are correct
              </span>
            </label>
          </div>
          
        );
      })
    ) : (
      <p className="text-gray-500 text-center py-4">
        No guarantors found for this customer.
      </p>
    )}

  
  </div>
)}


  {/* Step 3: Next of Kin */}
{step === 3 && (
  <div>
    <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
      Next of Kin Verification
    </h3>

    {nextOfKin.length > 0 ? (
      nextOfKin.map((kin, index) => (
        <div key={kin.id} className="mb-6 p-6 border rounded-lg bg-gray-50">
          <h4 className="text-xl font-semibold text-gray-800 mb-4">
            Next of Kin {index + 1}
          </h4>

          {/* Personal Info Grid */}
          <div className="grid grid-cols-2 gap-6 text-gray-700">
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {kin.Firstname} {kin.Middlename} {kin.Surname}</p>
              <p><span className="font-medium">Mobile:</span> {kin.mobile || "N/A"}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">ID Number:</span> {kin.id_number || "N/A"}</p>
              <p><span className="font-medium">Relationship:</span> {kin.relationship || "N/A"}</p>
            </div>
          </div>
             {/* Verify Checkbox */}
          <label className="flex items-center mt-4 text-gray-700">
            <input
              type="checkbox"
              checked={formData.nextOfKinVerified[index] || false}
              onChange={(e) => {
                const updated = [...formData.nextOfKinVerified];
                updated[index] = e.target.checked;
                setFormData((prev) => ({ ...prev, nextOfKinVerified: updated }));
              }}
              className="mr-2 w-5 h-5 text-blue-600 focus:ring focus:ring-blue-300"
            />
            <span className="font-medium">
              I verify that this next of kin’s details are correct
            </span>
          </label>
        </div>
      ))
    ) : (
      <p className="text-gray-500 text-center py-4">
        No next of kin found for this customer.
      </p>
    )}
    
  </div>
)}


    {/* Step 4: Loan Assessment */}
    {step === 4 && (
      <div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
          Loan Assessment
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Suggested Loan Amount (KES)</label>
            <input
              type="number"
              name="suggestedAmount"
              value={formData.suggestedAmount}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-200"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Service Fee (KES)</label>
            <input
              type="text"
              value={formData.serviceFee.toLocaleString()}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-100"
            />
          </div>
        </div>
      </div>
    )}

    {/* Step 5: Final Decision */}
    {step === 5 && (
      <div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
          Final Decision
        </h3>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Decision</label>
          <select
            name="decision"
            value={formData.decision}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-200"
          >
            <option value="">Select decision</option>
            <option value="approved">Approve</option>
            <option value="pending">Pending</option>
            <option value="rejected">Reject</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Comments</label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-200"
            rows="4"
            placeholder="Enter comments about your decision"
          />
        </div>
      </div>
    )}
  </div>

  {/* Navigation Buttons */}
  <div className="flex justify-between items-center mt-8">
    <button
      onClick={prevStep}
      disabled={step === 1}
      className={`px-6 py-2 rounded-lg font-medium shadow-sm transition ${
        step === 1
          ? "bg-gray-300 cursor-not-allowed text-gray-600"
          : "bg-gray-500 text-white hover:bg-gray-600"
      }`}
    >
      Previous
    </button>

    {step < 5 ? (
      <button
        onClick={nextStep}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition"
      >
        Next
      </button>
    ) : (
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`px-6 py-2 rounded-lg font-medium shadow-sm transition ${
          loading
            ? "bg-gray-400 cursor-not-allowed text-gray-100"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {loading ? "Processing..." : "Submit Decision"}
      </button>
    )}
  </div>
</div>


  );
};

export default LoanVerificationForm;