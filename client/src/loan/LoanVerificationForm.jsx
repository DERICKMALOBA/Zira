// src/components/LoanVerificationForm.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentMagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  IdentificationIcon,
  HomeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const LoanVerificationForm = ({ customerId, onClose }) => {
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState(null);
  const [guarantors, setGuarantors] = useState([]);
  const [securityItems, setSecurityItems] = useState([]);
  const [guarantorSecurityItems, setGuarantorSecurityItems] = useState([]);
  const [loanDetails, setLoanDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationData, setVerificationData] = useState({
    customer: {
      idVerified: false,
      phoneVerified: false,
      comment: ''
    },
    guarantors: [],
    security: {
      verified: false,
      comment: ''
    },
    guarantorSecurity: {
      verified: false,
      comment: ''
    },
    loan: {
      prequalifiedAmount: 0,
      scoredAmount: 0,
      comment: ''
    },
    finalDecision: '',
    overallComment: ''
  });

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch customer with images
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch loan details
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('customer_id', customerId)
        .single();
      
      if (!loanError && loanData) {
        setLoanDetails(loanData);
        setVerificationData(prev => ({
          ...prev,
          loan: {
            ...prev.loan,
            prequalifiedAmount: loanData.prequalified_amount || 0,
            scoredAmount: loanData.prequalified_amount || 0
          }
        }));
      }

      // Fetch guarantors with their images
      const { data: guarantorsData, error: guarantorsError } = await supabase
        .from('guarantors')
        .select('*')
        .eq('customer_id', customerId);
      
      if (!guarantorsError && guarantorsData) {
        setGuarantors(guarantorsData);
        setVerificationData(prev => ({
          ...prev,
          guarantors: guarantorsData.map(() => ({
            idVerified: false,
            phoneVerified: false,
            comment: ''
          }))
        }));
      }

      // Fetch security items
      const { data: securityData, error: securityError } = await supabase
        .from('security_items')
        .select('*')
        .eq('customer_id', customerId);
      
      if (!securityError) setSecurityItems(securityData || []);

      // Fetch guarantor security items
      if (guarantorsData && guarantorsData.length > 0) {
        const guarantorIds = guarantorsData.map(g => g.id);
        const { data: gSecurityData, error: gSecurityError } = await supabase
          .from('guarantor_security')
          .select('*')
          .in('guarantor_id', guarantorIds);
        
        if (!gSecurityError) setGuarantorSecurityItems(gSecurityData || []);
      }

    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error('Error loading customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationChange = (field, value, section = 'customer', index = null) => {
    setVerificationData(prev => {
      if (section === 'customer') {
        return {
          ...prev,
          customer: {
            ...prev.customer,
            [field]: value
          }
        };
      } else if (section === 'guarantors' && index !== null) {
        const updatedGuarantors = [...prev.guarantors];
        updatedGuarantors[index] = {
          ...updatedGuarantors[index],
          [field]: value
        };
        return {
          ...prev,
          guarantors: updatedGuarantors
        };
      } else if (section === 'security' || section === 'guarantorSecurity' || section === 'loan') {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      } else {
        return {
          ...prev,
          [field]: value
        };
      }
    });
  };

  const submitVerification = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('loan_verifications')
        .insert({
          customer_id: customerId,
          verification_data: verificationData,
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          status: verificationData.finalDecision
        });

      if (error) throw error;

      // Update loan with scored amount if approved
      if (verificationData.finalDecision === 'approved') {
        const { error: loanError } = await supabase
          .from('loans')
          .update({ 
            scored_amount: verificationData.loan.scoredAmount,
            status: 'approved'
          })
          .eq('customer_id', customerId);

        if (loanError) throw loanError;
      }

      // Update customer verification status
      const { error: updateError } = await supabase
        .from('customers')
        .update({ 
          verification_status: verificationData.finalDecision,
          last_verification_date: new Date().toISOString()
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      toast.success('Verification submitted successfully!');
      onClose();
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('Error submitting verification');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Customer not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested customer details could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Loan Application Verification</h1>
              <p className="text-sm text-gray-600">Comprehensive verification of customer documents and information</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
              <div key={stepNumber} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    step === stepNumber
                      ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                      : step > stepNumber
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {stepNumber}
                </div>
                <span className="text-xs mt-2 font-medium text-gray-700">
                  {['Customer', 'Guarantors', 'Security', 'Loan', 'Assessment', 'Decision'][stepNumber - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          {/* Step 1: Customer Information & Documents */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">Customer Verification</h2>
                
                {/* Customer Profile Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Passport Photo */}
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
                        {customer.passport_url ? (
                          <img
                            src={customer.passport_url}
                            alt="Passport"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <UserCircleIcon className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mt-3">
                        {customer.Firstname} {customer.Middlename} {customer.Surname}
                      </h3>
                      <p className="text-sm text-gray-600">Customer</p>
                    </div>

                    {/* Personal Information */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <IdentificationIcon className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">ID Number</p>
                            <p className="text-lg font-bold text-gray-900">{customer.id_number || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-600">Phone: </span>
                          <span className="text-sm text-gray-900 ml-2">{customer.mobile}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                          <p className="text-sm text-gray-900">{customer.date_of_birth || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Occupation</p>
                          <p className="text-sm text-gray-900">{customer.occupation || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ID Documents Section */}
                <div className="bg-white border rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <IdentificationIcon className="h-6 w-6 text-blue-600 mr-2" />
                      ID Document Verification
                    </h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700">Reference ID: </span>
                      <span className="text-lg font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-md">
                        {customer.id_number || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ID Images */}
                    <div className="space-y-6">
                      <div className="text-center">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">ID Front</h4>
                        {customer.id_front_url ? (
                          <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-md bg-gray-50">
                            <img
                              src={customer.id_front_url}
                              alt="ID Front"
                              className="w-full h-64 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex flex-col items-center justify-center bg-gray-50">
                            <IdentificationIcon className="h-12 w-12 text-gray-400 mb-2" />
                            <span className="text-gray-500">No ID front image available</span>
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">ID Back</h4>
                        {customer.id_back_url ? (
                          <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-md bg-gray-50">
                            <img
                              src={customer.id_back_url}
                              alt="ID Back"
                              className="w-full h-64 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex flex-col items-center justify-center bg-gray-50">
                            <IdentificationIcon className="h-12 w-12 text-gray-400 mb-2" />
                            <span className="text-gray-500">No ID back image available</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Controls */}
                    <div className="space-y-6">
                      <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-blue-900">ID Verification</h4>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={verificationData.customer.idVerified}
                              onChange={(e) => handleVerificationChange('idVerified', e.target.checked, 'customer')}
                              className="sr-only"
                            />
                            <div className={`relative w-12 h-6 bg-gray-300 rounded-full transition-colors ${verificationData.customer.idVerified ? 'bg-green-500' : ''}`}>
                              <div className={`absolute top-0.5 left-0.5 bg-white border rounded-full w-5 h-5 transition-transform ${verificationData.customer.idVerified ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-700">
                              {verificationData.customer.idVerified ? 'Verified' : 'Verify'}
                            </span>
                          </label>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ID Verification Comment
                          </label>
                          <textarea
                            value={verificationData.customer.comment}
                            onChange={(e) => handleVerificationChange('comment', e.target.value, 'customer')}
                            placeholder="Add comments about ID verification, document quality, or issues found..."
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Documents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Passport Photo */}
                  <div className="bg-white border rounded-xl p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Passport Photo</h3>
                    <div className="flex flex-col items-center">
                      <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-100 shadow-md mb-4">
                        {customer.passport_url ? (
                          <img
                            src={customer.passport_url}
                            alt="Passport"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <UserCircleIcon className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Residence Verification */}
                  <div className="bg-white border rounded-xl p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Residence Verification</h3>
                    <div className="flex flex-col items-center">
                      {customer.house_image_url ? (
                        <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200 shadow-md">
                          <img
                            src={customer.house_image_url}
                            alt="House"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50">
                          <HomeIcon className="h-12 w-12 text-gray-400 mb-2" />
                          <span className="text-gray-500">No house image available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phone Verification */}
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Phone Verification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-700">Mobile Number</p>
                        <p className="text-2xl font-bold text-blue-700">{customer.mobile}</p>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={verificationData.customer.phoneVerified}
                          onChange={(e) => handleVerificationChange('phoneVerified', e.target.checked, 'customer')}
                          className="sr-only"
                        />
                        <div className={`relative w-12 h-6 bg-gray-300 rounded-full transition-colors ${verificationData.customer.phoneVerified ? 'bg-green-500' : ''}`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white border rounded-full w-5 h-5 transition-transform ${verificationData.customer.phoneVerified ? 'transform translate-x-6' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {verificationData.customer.phoneVerified ? 'Verified' : 'Verify'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Guarantors */}
          {step === 2 && (
            <div className="space-y-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">Guarantor Verification</h2>
              
              {guarantors.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <UserGroupIcon className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Guarantors</h3>
                  <p className="mt-2 text-sm text-gray-600">This customer has no guarantors listed.</p>
                </div>
              ) : (
                guarantors.map((guarantor, index) => (
                  <div key={guarantor.id} className="bg-white border rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
                      Guarantor {index + 1}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="text-gray-900">{guarantor.Firstname} {guarantor.Middlename} {guarantor.Surname}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
  <span className="font-medium text-gray-700">ID Number:</span>
  <span className="text-gray-900">{guarantor.id_number || 'N/A'}</span>
</div>
<div className="flex justify-between items-center py-2 border-b">
  <span className="font-medium text-gray-700">Phone:</span>
  <span className="text-gray-900">{guarantor.mobile}</span>
</div>
</div>

<div className="space-y-3">
  <div className="flex justify-between items-center py-2 border-b">
    <span className="font-medium text-gray-700">Relationship:</span>
    <span className="text-gray-900">{guarantor.relationship || 'N/A'}</span>
  </div>
  <div className="flex justify-between items-center py-2 border-b">
    <span className="font-medium text-gray-700">Occupation:</span>
    <span className="text-gray-900">{guarantor.occupation || 'N/A'}</span>
  </div>
</div>
</div>

{/* Guarantor Documents */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  {guarantor.passport_url && (
    <div className="text-center">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Passport Photo</h4>
      <img
        src={guarantor.passport_url}
        alt="Guarantor Passport"
        className="w-full h-48 object-cover rounded-lg border border-gray-200"
      />
    </div>
  )}
  {guarantor.id_front_url && (
    <div className="text-center">
      <h4 className="text-sm font-medium text-gray-700 mb-2">ID Front</h4>
      <img
        src={guarantor.id_front_url}
        alt="Guarantor ID Front"
        className="w-full h-48 object-cover rounded-lg border border-gray-200"
      />
    </div>
  )}
  {guarantor.id_back_url && (
    <div className="text-center">
      <h4 className="text-sm font-medium text-gray-700 mb-2">ID Back</h4>
      <img
        src={guarantor.id_back_url}
        alt="Guarantor ID Back"
        className="w-full h-48 object-cover rounded-lg border border-gray-200"
      />
    </div>
  )}
</div>

<div className="bg-gray-50 p-5 rounded-lg">
  <div className="flex items-center justify-between mb-4">
    <h4 className="font-medium text-gray-900">Guarantor Verification</h4>
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={verificationData.guarantors[index]?.idVerified || false}
        onChange={(e) => handleVerificationChange('idVerified', e.target.checked, 'guarantors', index)}
        className="sr-only"
      />
      <div className={`relative w-12 h-6 bg-gray-300 rounded-full transition-colors ${verificationData.guarantors[index]?.idVerified ? 'bg-green-500' : ''}`}>
        <div className={`absolute top-0.5 left-0.5 bg-white border rounded-full w-5 h-5 transition-transform ${verificationData.guarantors[index]?.idVerified ? 'transform translate-x-6' : ''}`}></div>
      </div>
      <span className="ml-3 text-sm font-medium text-gray-700">
        {verificationData.guarantors[index]?.idVerified ? 'Verified' : 'Verify'}
      </span>
    </label>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Verification Comment
    </label>
    <textarea
      value={verificationData.guarantors[index]?.comment || ''}
      onChange={(e) => handleVerificationChange('comment', e.target.value, 'guarantors', index)}
      placeholder="Add comments about this guarantor's verification..."
      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      rows={3}
    />
  </div>
</div>
</div>
))
)}
</div>
)}

{/* Step 3: Security Items */}
{step === 3 && (
<div className="space-y-8">
  <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">Security Verification</h2>
  
  {/* Customer Security */}
  <div className="bg-white border rounded-xl p-6 mb-8">
    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
      <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
      Customer Security Items
    </h3>

    {securityItems.length === 0 ? (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">No security items provided by customer</p>
      </div>
    ) : (
      <div className="space-y-4">
        {securityItems.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Item</p>
                <p className="text-gray-900">{item.item || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Value</p>
                <p className="text-gray-900">KES {item.value || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Identification</p>
                <p className="text-gray-900">{item.identification || 'N/A'}</p>
              </div>
            </div>
            {item.description && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="text-gray-900 text-sm">{item.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    )}

    <div className="mt-6 bg-blue-50 p-5 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-blue-900">Security Verification</h4>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={verificationData.security.verified}
            onChange={(e) => handleVerificationChange('verified', e.target.checked, 'security')}
            className="sr-only"
          />
          <div className={`relative w-12 h-6 bg-gray-300 rounded-full transition-colors ${verificationData.security.verified ? 'bg-green-500' : ''}`}>
            <div className={`absolute top-0.5 left-0.5 bg-white border rounded-full w-5 h-5 transition-transform ${verificationData.security.verified ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <span className="ml-3 text-sm font-medium text-gray-700">
            {verificationData.security.verified ? 'Verified' : 'Verify'}
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Security Comment
        </label>
        <textarea
          value={verificationData.security.comment}
          onChange={(e) => handleVerificationChange('comment', e.target.value, 'security')}
          placeholder="Add comments about the security items..."
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          rows={3}
        />
      </div>
    </div>
  </div>

  {/* Guarantor Security */}
  <div className="bg-white border rounded-xl p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
      <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
      Guarantor Security Items
    </h3>

    {guarantorSecurityItems.length === 0 ? (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">No security items provided by guarantors</p>
      </div>
    ) : (
      <div className="space-y-4">
        {guarantorSecurityItems.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Item</p>
                <p className="text-gray-900">{item.item || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Value</p>
                <p className="text-gray-900">KES {item.estimated_market_value || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Identification</p>
                <p className="text-gray-900">{item.identification || 'N/A'}</p>
              </div>
            </div>
            {item.description && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="text-gray-900 text-sm">{item.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    )}

    <div className="mt-6 bg-blue-50 p-5 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-blue-900">Guarantor Security Verification</h4>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={verificationData.guarantorSecurity.verified}
            onChange={(e) => handleVerificationChange('verified', e.target.checked, 'guarantorSecurity')}
            className="sr-only"
          />
          <div className={`relative w-12 h-6 bg-gray-300 rounded-full transition-colors ${verificationData.guarantorSecurity.verified ? 'bg-green-500' : ''}`}>
            <div className={`absolute top-0.5 left-0.5 bg-white border rounded-full w-5 h-5 transition-transform ${verificationData.guarantorSecurity.verified ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <span className="ml-3 text-sm font-medium text-gray-700">
            {verificationData.guarantorSecurity.verified ? 'Verified' : 'Verify'}
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Guarantor Security Comment
        </label>
        <textarea
          value={verificationData.guarantorSecurity.comment}
          onChange={(e) => handleVerificationChange('comment', e.target.value, 'guarantorSecurity')}
          placeholder="Add comments about the guarantor security items..."
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          rows={3}
        />
      </div>
    </div>
  </div>
</div>
)}

{/* Step 4: Loan Information */}
{step === 4 && (
<div className="space-y-8">
  <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">Loan Information</h2>
  
  <div className="bg-white border rounded-xl p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
      <CurrencyDollarIcon className="h-5 w-5 text-blue-600 mr-2" />
      Loan Details
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Prequalified Amount</h4>
        <p className="text-2xl font-bold text-blue-700">
          KES {verificationData.loan.prequalifiedAmount?.toLocaleString() || '0'}
        </p>
        <p className="text-sm text-gray-600 mt-1">Amount determined during initial assessment</p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">Scored Amount</h4>
        <div className="flex items-center">
          <span className="text-2xl font-bold text-green-700 mr-2">KES</span>
          <input
            type="number"
            value={verificationData.loan.scoredAmount}
            onChange={(e) => handleVerificationChange('scoredAmount', parseFloat(e.target.value) || 0, 'loan')}
            className="text-2xl font-bold text-green-700 bg-transparent border-b-2 border-green-300 focus:outline-none focus:border-green-500 w-full"
            placeholder="Enter scored amount"
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">Final amount after verification</p>
      </div>
    </div>

    <div className="bg-gray-50 p-5 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-3">Loan Assessment Comments</h4>
      <textarea
        value={verificationData.loan.comment}
        onChange={(e) => handleVerificationChange('comment', e.target.value, 'loan')}
        placeholder="Add comments about the loan assessment, amount justification, or any adjustments..."
        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        rows={4}
      />
    </div>

    {loanDetails && (
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">Loan Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Application Date:</span>
            <span className="ml-2">{new Date(loanDetails.application_date).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="font-medium">Status:</span>
            <span className="ml-2 capitalize">{loanDetails.status}</span>
          </div>
          {loanDetails.interest_rate && (
            <div>
              <span className="font-medium">Interest Rate:</span>
              <span className="ml-2">{loanDetails.interest_rate}%</span>
            </div>
          )}
          {loanDetails.term && (
            <div>
              <span className="font-medium">Term:</span>
              <span className="ml-2">{loanDetails.term} months</span>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
</div>
)}

{/* Step 5: Assessment */}
{step === 5 && (
<div className="space-y-8">
  <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">Risk Assessment</h2>
  
  <div className="bg-white border rounded-xl p-6 mb-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
      <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
      Overall Assessment
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">Verification Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Customer ID:</span>
            <span className={`text-sm font-medium ${verificationData.customer.idVerified ? 'text-green-600' : 'text-red-600'}`}>
              {verificationData.customer.idVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Customer Phone:</span>
            <span className={`text-sm font-medium ${verificationData.customer.phoneVerified ? 'text-green-600' : 'text-red-600'}`}>
              {verificationData.customer.phoneVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Guarantors:</span>
            <span className={`text-sm font-medium ${verificationData.guarantors.every(g => g.idVerified) ? 'text-green-600' : 'text-red-600'}`}>
              {verificationData.guarantors.every(g => g.idVerified) ? 'All Verified' : 'Needs Attention'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Security Items:</span>
            <span className={`text-sm font-medium ${verificationData.security.verified ? 'text-green-600' : 'text-red-600'}`}>
              {verificationData.security.verified ? 'Adequate' : 'Inadequate'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-3">Risk Rating</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Documentation:</span>
            <span className="text-sm font-medium text-yellow-600">Moderate</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Collateral:</span>
            <span className="text-sm font-medium text-green-600">Good</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Customer History:</span>
            <span className="text-sm font-medium text-gray-600">New Customer</span>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-gray-50 p-5 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-3">Assessment Notes</h4>
      <textarea
        placeholder="Add your overall assessment notes and observations..."
        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        rows={5}
      />
    </div>
  </div>
</div>
)}

{/* Step 6: Final Decision */}
{step === 6 && (
<div className="space-y-8">
  <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">Final Decision</h2>
  
  <div className="bg-white border rounded-xl p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Outcome</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Final Decision
        </label>
        <select
          value={verificationData.finalDecision}
          onChange={(e) => handleVerificationChange('finalDecision', e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select decision</option>
          <option value="approved">Approve</option>
          <option value="rejected">Reject</option>
          <option value="pending">Request More Information</option>
          <option value="referred">Refer to Senior Manager</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recommended Amount
        </label>
        <div className="flex items-center">
          <span className="text-2xl font-bold text-gray-700 mr-2">KES</span>
          <input
            type="number"
            value={verificationData.loan.scoredAmount}
            onChange={(e) => handleVerificationChange('scoredAmount', parseFloat(e.target.value) || 0, 'loan')}
            className="text-2xl font-bold text-gray-700 bg-transparent border-b-2 border-gray-300 focus:outline-none focus:border-blue-500 w-full"
            placeholder="Enter amount"
          />
        </div>
      </div>
    </div>

    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Overall Comments
      </label>
      <textarea
        value={verificationData.overallComment}
        onChange={(e) => handleVerificationChange('overallComment', e.target.value)}
        placeholder="Provide final comments and notes for the relationship officer..."
        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        rows={6}
      />
    </div>

    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <h4 className="font-medium text-yellow-800 mb-2">Verification Summary</h4>
      <ul className="text-sm text-yellow-700 space-y-1">
        <li className="flex items-center">
          {verificationData.customer.idVerified ? 
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" /> : 
            <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
          }
          Customer ID: {verificationData.customer.idVerified ? 'Verified' : 'Not Verified'}
        </li>
        <li className="flex items-center">
          {verificationData.customer.phoneVerified ? 
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" /> : 
            <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
          }
          Customer Phone: {verificationData.customer.phoneVerified ? 'Verified' : 'Not Verified'}
        </li>
        <li className="flex items-center">
          {verificationData.security.verified ? 
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" /> : 
            <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
          }
          Security: {verificationData.security.verified ? 'Adequate' : 'Inadequate'}
        </li>
      </ul>
    </div>
  </div>
</div>
)}
</div>

{/* Navigation Buttons */}
<div className="bg-white rounded-xl shadow-md p-6 flex justify-between">
  <button
    onClick={() => setStep(step - 1)}
    disabled={step === 1}
    className={`flex items-center px-5 py-2.5 rounded-lg transition-colors ${step === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
  >
    <ChevronLeftIcon className="h-5 w-5 mr-2" />
    Previous
  </button>
  
  {step < 6 ? (
    <button
      onClick={() => setStep(step + 1)}
      className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Next
      <ChevronRightIcon className="h-5 w-5 ml-2" />
    </button>
  ) : (
    <button
      onClick={submitVerification}
      disabled={loading || !verificationData.finalDecision}
      className={`px-5 py-2.5 rounded-lg transition-colors ${!verificationData.finalDecision || loading ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
    >
      {loading ? 'Submitting...' : 'Submit Verification'}
    </button>
  )}
</div>
</div>
</div>
);
};

export default LoanVerificationForm;