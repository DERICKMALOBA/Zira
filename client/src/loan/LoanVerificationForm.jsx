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
  CurrencyDollarIcon,
  BuildingOffice2Icon,
  PhotoIcon,  DevicePhoneMobileIcon,PhoneIcon,  PencilSquareIcon
} from '@heroicons/react/24/outline';

const LoanVerificationForm = ({ customerId, onClose }) => {
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState(null);
  const [guarantors, setGuarantors] = useState([]);
  const [securityItems, setSecurityItems] = useState([]);
  const [guarantorSecurityItems, setGuarantorSecurityItems] = useState([]);
  const [loanDetails, setLoanDetails] = useState(null);
  const [businessImages, setBusinessImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
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
    business: {
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

      // Fetch business images
      const { data: businessData, error: businessError } = await supabase
        .from('business_images')
        .select('*')
        .eq('customer_id', customerId);
      
      if (!businessError) setBusinessImages(businessData || []);

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

// Fetch borrower security items and their images
const { data: securityItemsData, error: securityItemsError } = await supabase
  .from("security_items")
  .select("*")
  .eq("customer_id", customerId);

if (!securityItemsError && securityItemsData) {
  const { data: securityImagesData, error: securityImagesError } = await supabase
    .from("security_item_images")
    .select("*")
    .in("security_item_id", securityItemsData.map((s) => s.id));

  if (!securityImagesError) {
    const securityWithImages = securityItemsData.map((item) => {
      const images = (securityImagesData || [])
        .filter((img) => img.security_item_id === item.id)
        .map((img) =>
          img.image_url
            ? supabase.storage.from("customers").getPublicUrl(img.image_url).data.publicUrl
            : null
        );
      return { ...item, images };
    });

    setSecurityItems(securityWithImages);
    console.log("✅ Borrower security with images:", securityWithImages);
  }
}

// Fetch guarantor security items and their images
if (guarantorsData && guarantorsData.length > 0) {
  const guarantorIds = guarantorsData.map((g) => g.id);

  const { data: gSecurityData, error: gSecurityError } = await supabase
    .from("guarantor_security")
    .select("*")
    .in("guarantor_id", guarantorIds);

  if (!gSecurityError && gSecurityData) {
    const { data: gSecurityImagesData, error: gSecurityImagesError } = await supabase
      .from("guarantor_security_images")
      .select("*")
      .in("guarantor_security_id", gSecurityData.map((gs) => gs.id));

    if (!gSecurityImagesError) {
      const gSecurityWithImages = gSecurityData.map((item) => {
        const images = (gSecurityImagesData || [])
          .filter((img) => img.guarantor_security_id === item.id)
          .map((img) =>
            img.image_url
              ? supabase.storage.from("guarantors").getPublicUrl(img.image_url).data.publicUrl
              : null
          );
        return { ...item, images };
      });

      setGuarantorSecurityItems(gSecurityWithImages);
      console.log("✅ Guarantor security with images:", gSecurityWithImages);
    }
  }
}

  } catch (error) {
    console.error("❌ Error fetching customer details:", error);
    toast.error("Error loading customer details");
  } finally {
    setLoading(false);
  }
};

 
  

const handleVerificationChange = (field, value, section = 'customer', index = null) => {
  setVerificationData(prev => {
    // Handle finalDecision as a top-level field
      if (field === 'finalDecision' || field === 'overallComment') {
      return {
        ...prev,
        [field]: value
      };
    }
    
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
    } else if (section === 'security' || section === 'guarantorSecurity' || section === 'loan' || section === 'business') {
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
    } else {
      // Handle other top-level fields like overallComment
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
    
    

    // Insert verification record with the new structure
    const { data, error } = await supabase
      .from('loan_verifications')
      .insert({
        customer_id: customerId,
       
        
        // Customer Verification
        customer_id_verified: verificationData.customer.idVerified,
        customer_phone_verified: verificationData.customer.phoneVerified,
        customer_comment: verificationData.customer.comment,
        
        // Business Verification
        business_verified: verificationData.business.verified,
        business_comment: verificationData.business.comment,
        
        // Security Verification
        borrower_security_verified: verificationData.security.verified,
        borrower_security_comment: verificationData.security.comment,
        guarantor_security_verified: verificationData.guarantorSecurity.verified,
        guarantor_security_comment: verificationData.guarantorSecurity.comment,
        
        // Loan Assessment
        loan_scored_amount: verificationData.loan.scoredAmount,
        loan_comment: verificationData.loan.comment,
        
        // Final Decision
        final_decision: verificationData.finalDecision,
        overall_comment: verificationData.overallComment
      })
      .select()
      .single();

    if (error) throw error;

    // Update loan with scored amount if approved
    if (verificationData.finalDecision === 'approved') {
      const { error: loanError } = await supabase
        .from('loans')
        .update({ 
          scored_amount: verificationData.loan.scoredAmount,
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', customerId);

      if (loanError) throw loanError;
    }

    // Update customer verification status
    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        verification_status: verificationData.finalDecision,
        last_verification_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (updateError) throw updateError;

    toast.success('Verification submitted successfully!');
    
    // Optional: Add a delay before closing to show success message
    setTimeout(() => {
      onClose();
    }, 1500);
    
  } catch (error) {
    console.error('Error submitting verification:', error);
    toast.error(`Error submitting verification: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const ToggleSwitch = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className={`relative w-14 h-7 bg-gray-300 rounded-full transition-colors duration-200 ${checked ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'hover:bg-gray-400'}`}>
        <div className={`absolute top-0.5 left-0.5 bg-white border rounded-full w-6 h-6 transition-transform duration-200 shadow-md ${checked ? 'transform translate-x-7 shadow-emerald-200' : 'shadow-gray-300'}`}>
          {checked && <CheckCircleIcon className="h-4 w-4 text-emerald-500 m-0.5" />}
        </div>
      </div>
      <span className={`ml-3 text-sm font-medium transition-colors ${checked ? 'text-emerald-700' : 'text-gray-700 group-hover:text-gray-900'}`}>
        {checked ? 'Verified' : label}
      </span>
    </label>
  );

  const DocumentCard = ({ title, imageUrl, placeholder, icon: Icon }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">
      <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
          <Icon className="h-4 w-4 text-indigo-600 mr-2" />
          {title}
        </h4>
      </div>
     <div className="p-4">
  {imageUrl ? (
    <div
      className="relative group cursor-pointer"
      onClick={() => setSelectedImage({ url: imageUrl, title })}
    >
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-48 object-contain rounded-lg bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform duration-200"
      />
      {/* Overlay only for icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="bg-white bg-opacity-95 rounded-full p-3 shadow-lg border border-indigo-100">
          <DocumentMagnifyingGlassIcon className="h-6 w-6 text-indigo-600" />
        </div>
      </div>
    </div>
  ) : (
    <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
      <Icon className="h-12 w-12 text-gray-400 mb-2" />
      <span className="text-sm text-gray-500 font-medium">{placeholder}</span>
    </div>
  )}
</div>

    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading verification details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <DocumentMagnifyingGlassIcon className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Not Found</h3>
          <p className="text-gray-600">The requested customer details could not be loaded.</p>
        </div>
      </div>
    );
  }


  const DetailRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-sm font-medium text-gray-600">{label}:</span>
    <span className="text-sm font-semibold text-gray-900">
      {value || "Not provided"}
    </span>
  </div>
);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                Loan Application Verification
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive verification of customer documents and information</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
            >
              <XCircleIcon className="h-8 w-8" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-indigo-100">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Customer', icon: UserCircleIcon },
              { num: 2, label: 'Business', icon: BuildingOffice2Icon },
              { num: 3, label: 'Guarantors', icon: UserGroupIcon },
              { num: 4, label: 'Security', icon: ShieldCheckIcon },
              { num: 5, label: 'Loan', icon: CurrencyDollarIcon },
              { num: 6, label: 'Decision', icon: ClipboardDocumentCheckIcon }
            ].map(({ num, label, icon: Icon }) => (
              <div key={num} className="flex flex-col items-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    step === num
                      ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-200 scale-110'
                      : step > num
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                      : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className={`text-sm mt-3 font-medium transition-colors ${
                  step === num ? 'text-indigo-700' : step > num ? 'text-emerald-700' : 'text-gray-600'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 mb-8 overflow-hidden">
          {/* Step 1: Customer Information & Documents */}
          {step === 1 && (
           <div className="p-8">
  <div className="border-b border-gray-200 pb-6 mb-8">
    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
      <UserCircleIcon className="h-8 w-8 text-indigo-600 mr-3" />
      Customer Verification
    </h2>
    <p className="text-gray-600 mt-2">
      Verify customer identity and contact information
    </p>
  </div>

 {/* Customer Profile Header */}
<div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8 mb-8 border border-indigo-100">
  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
    
    {/* Profile Photo + Basic Info */}
    <div className="flex flex-col items-center">
      <div
        className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl cursor-pointer group transition-all duration-200 hover:shadow-2xl hover:scale-105 relative"
        onClick={() =>
          customer.passport_url &&
          setSelectedImage({
            url: customer.passport_url,
            title: "Customer Profile Photo",
          })
        }
      >
        {customer.passport_url ? (
          <img
            src={customer.passport_url}
            alt="Profile"
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <UserCircleIcon className="h-20 w-20 text-gray-400" />
          </div>
        )}
        {customer.passport_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white bg-opacity-95 rounded-full p-2 shadow-lg border border-indigo-100">
              <DocumentMagnifyingGlassIcon className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        )}
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mt-4 text-center">
        {customer.prefix} {customer.Firstname} {customer.Middlename} {customer.Surname}
      </h3>
      <p className="text-indigo-600 font-semibold">Primary Applicant</p>
    </div>

    {/* Personal Info Container */}
    <div className="flex-1">
      
      {/* Highlighted ID + Mobile above personal details */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <p className="flex-1 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold shadow-sm">
          <IdentificationIcon className="h-5 w-5 text-indigo-600" />
          ID Number: {customer.id_number || "Not provided"}
        </p>
        <p className="flex-1 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold shadow-sm">
          <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
          Mobile: {customer.mobile || "Not provided"}
        </p>
      </div>

      {/* Personal Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">First Name:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.Firstname || "Not provided"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Surname:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.Surname || "Not provided"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Marital Status:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.marital_status || "Not provided"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Residence Status:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.residence_status || "Not provided"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Postal Address:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.postal_address || "Not provided"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Postal Code:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.code || "Not provided"}
            </span>
          </div>
        </div>

        {/* Right column */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Town:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.town || "Not provided"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Gender:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.gender || "Not provided"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">County:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.county || "Not provided"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Alternative Mobile:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.alternative_mobile || "Not provided"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Occupation:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.occupation || "Not provided"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
            <span className="text-sm font-semibold text-gray-900">
              {customer.date_of_birth || "Not provided"}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>


  {/* Documents Grid */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <DocumentCard
      title="ID Front"
      imageUrl={customer.id_front_url}
      placeholder="No ID front available"
      icon={IdentificationIcon}
    />
    <DocumentCard
      title="ID Back"
      imageUrl={customer.id_back_url}
      placeholder="No ID back available"
      icon={IdentificationIcon}
    />
    <DocumentCard
      title="Residence"
      imageUrl={customer.house_image_url}
      placeholder="No residence image available"
      icon={HomeIcon}
    />
  </div>

  {/* Verification Controls */}
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">
      Verification Status
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <IdentificationIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <span className="font-medium text-gray-900">ID Verification</span>
          </div>
          <ToggleSwitch
            checked={verificationData.customer.idVerified}
            onChange={(e) =>
              handleVerificationChange(
                "idVerified",
                e.target.checked,
                "customer"
              )
            }
            label="Verify ID"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
  <p className="inline-block bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold shadow-sm flex items-center justify-center">
    <PhoneIcon className="h-5 w-5 text-green-600" />
  </p>
  <span className="font-medium text-gray-900">Phone Verification</span>
</div>

          <ToggleSwitch
            checked={verificationData.customer.phoneVerified}
            onChange={(e) =>
              handleVerificationChange(
                "phoneVerified",
                e.target.checked,
                "customer"
              )
            }
            label="Verify Phone"
          />
        </div>
      </div>
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-3">
        Manager Comments (for Relationship Officer)
      </label>
      <textarea
        value={verificationData.customer.comment}
        onChange={(e) =>
          handleVerificationChange("comment", e.target.value, "customer")
        }
        placeholder="Add instructions for the relationship officer (e.g., 'Please verify phone number', 'Update customer address', etc.)"
        className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
        rows={4}
      />
    </div>
  </div>
</div>

          )}

          {/* Step 2: Business Information */}
          {step === 2 && (
           <div className="p-8">
  <div className="border-b border-gray-200 pb-6 mb-8">
    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
      <BuildingOffice2Icon className="h-8 w-8 text-indigo-600 mr-3" />
      Business Verification
    </h2>
    <p className="text-gray-600 mt-2">Verify business operations and location</p>
  </div>

  {/* Business Details */}
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
      Business Details
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-sm text-gray-500">Business Name</p>
        <p className="font-semibold text-gray-900">{customer.business_name || "Not provided"}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Business Type</p>
        <p className="font-semibold text-gray-900">{customer.business_type || "Not provided"}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Location</p>
        <p className="font-semibold text-gray-900">{customer.business_location || "Not provided"}</p>
      </div>
     <div>
  <p className="text-sm text-gray-500">Year Established</p>
  <p className="font-semibold text-gray-900">
    {customer.year_established
      ? new Date(customer.year_established).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "Not provided"}
  </p>
</div>

      <div>
        <p className="text-sm text-gray-500">Road</p>
        <p className="font-semibold text-gray-900">{customer.road || "Not provided"}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Landmark</p>
        <p className="font-semibold text-gray-900">{customer.landmark || "Not provided"}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Daily Sales</p>
        <p className="font-semibold text-gray-900">{customer.daily_Sales || "Not provided"}</p>
      </div>
    </div>
  </div>

  {/* Existing Business Images Section */}
  {businessImages.length === 0 ? (
    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
      <BuildingOffice2Icon className="mx-auto h-20 w-20 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Business Images</h3>
      <p className="text-gray-600">This customer has not provided business images.</p>
    </div>
  ) : (
    <div className="space-y-8">
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {businessImages.map((image, index) => (
    <div
      key={index}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
    >
      <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
          <PhotoIcon className="h-4 w-4 text-indigo-600 mr-2" />
          Business Image {index + 1}
        </h4>
      </div>
      <div className="p-4">
        <div
          className="relative group cursor-pointer"
          onClick={() =>
            setSelectedImage({
              url: image.image_url,
              title: `Business Image ${index + 1}`,
            })
          }
        >
          <img
            src={image.image_url}
            alt={`Business ${index + 1}`}
            className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
          />

          {/* Icon overlay only */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white bg-opacity-95 rounded-full p-3 shadow-lg border border-indigo-100">
                <DocumentMagnifyingGlassIcon className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {image.description && (
          <p className="mt-3 text-sm text-gray-600">{image.description}</p>
        )}
      </div>
    </div>
  ))}
</div>

    </div>
  )}

  {/* Business Verification Controls */}
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 mt-8">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">Business Verification Status</h3>
      <ToggleSwitch
        checked={verificationData.business.verified}
        onChange={(e) => handleVerificationChange("verified", e.target.checked, "business")}
        label="Verify Business"
      />
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-3">
        Business Verification Comments
      </label>
      <textarea
        value={verificationData.business.comment}
        onChange={(e) => handleVerificationChange("comment", e.target.value, "business")}
        placeholder="Add comments about business verification, location accuracy, operations, etc."
        className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
        rows={4}
      />
    </div>
  </div>
</div>

          )}

          {/* Step 3: Guarantors */}
          {step === 3 && (
            <div className="p-8">
  <div className="border-b border-gray-200 pb-6 mb-8">
    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
      <UserGroupIcon className="h-8 w-8 text-indigo-600 mr-3" />
      Guarantor Verification
    </h2>
    <p className="text-gray-600 mt-2">
      Verify guarantor identity and contact information
    </p>
  </div>

  {guarantors.length === 0 ? (
    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
      <UserGroupIcon className="mx-auto h-20 w-20 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Guarantors</h3>
      <p className="text-gray-600">This customer has no guarantors listed.</p>
    </div>
  ) : (
    <div className="space-y-12">
      {guarantors.map((guarantor, index) => (
        <div
          key={guarantor.id}
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <UserGroupIcon className="h-6 w-6 text-indigo-600 mr-3" />
              Guarantor {index + 1}
            </h3>
            <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              {guarantor.relationship || "Relationship Unknown"}
            </span>
          </div>

          
          {/* Profile */}
<div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8 mb-8 border border-indigo-100">
  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
    {/* Profile Photo */}
    <div className="flex flex-col items-center">
      <div
        className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl cursor-pointer group transition-all duration-200 hover:shadow-2xl hover:scale-105 relative"
        onClick={() =>
          guarantor.passport_url &&
          setSelectedImage({
            url: guarantor.passport_url,
            title: `Guarantor ${index + 1} Profile Photo`,
          })
        }
      >
        {guarantor.passport_url ? (
          <img
            src={guarantor.passport_url}
            alt="Guarantor"
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <UserCircleIcon className="h-20 w-20 text-gray-400" />
          </div>
        )}
        {guarantor.passport_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white bg-opacity-95 rounded-full p-2 shadow-lg border border-indigo-100">
              <DocumentMagnifyingGlassIcon className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        )}
      </div>

      <h4 className="text-2xl font-bold text-gray-900 mt-4 text-center">
        {guarantor.Firstname} {guarantor.Middlename} {guarantor.Surname}
      </h4>
    </div>

    {/* Highlighted Info */}
    <div className="flex-1">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <p className="flex-1 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold shadow-sm">
          <IdentificationIcon className="h-5 w-5 text-indigo-600" />
          ID Number: {guarantor.id_number || "Not provided"}
        </p>
        <p className="flex-1 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold shadow-sm">
          <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
          Mobile: {guarantor.mobile || "Not provided"}
        </p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
          <DetailRow label="First Name" value={guarantor.Firstname} />
          <DetailRow label="Middlename" value={guarantor.Middlename} />
          <DetailRow label="Surname" value={guarantor.Surname} />
          <DetailRow label="Gender" value={guarantor.gender} />
          <DetailRow label="Marital Status" value={guarantor.marital_status} />
          <DetailRow label="Occupation" value={guarantor.occupation} />
        </div>

        {/* Column 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
          <DetailRow label="City/Town" value={guarantor.city_town} />
          <DetailRow label="County" value={guarantor.county} />
          <DetailRow label="Residential Status" value={guarantor.residence_status} />
          <DetailRow label="Postal Code" value={guarantor.postal_address} />
          <DetailRow label="Code" value={guarantor.code} />
          <DetailRow label="Relationship" value={guarantor.relationship} />
        </div>
      </div>
    </div>
  </div>
</div>


          {/* Documents */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <DocumentCard
              title="Passport Photo"
              imageUrl={guarantor.passport_url}
              placeholder="No passport photo available"
              icon={UserCircleIcon}
            />
            <DocumentCard
              title="ID Front"
              imageUrl={guarantor.id_front_url}
              placeholder="No ID front available"
              icon={IdentificationIcon}
            />
            <DocumentCard
              title="ID Back"
              imageUrl={guarantor.id_back_url}
              placeholder="No ID back available"
              icon={IdentificationIcon}
            />
          </div>

          {/* Verification Controls */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Verification Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <IdentificationIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    <span className="font-medium text-gray-900">
                      ID Verification
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={verificationData.guarantors[index]?.idVerified}
                    onChange={(e) =>
                      handleVerificationChange(
                        "idVerified",
                        e.target.checked,
                        "guarantors",
                        index
                      )
                    }
                    label="Verify ID"
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <p className="inline-block bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold shadow-sm flex items-center justify-center">
                      <PhoneIcon className="h-5 w-5 text-green-600" />
                    </p>
                    <span className="font-medium text-gray-900">
                      Phone Verification
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={verificationData.guarantors[index]?.phoneVerified}
                    onChange={(e) =>
                      handleVerificationChange(
                        "phoneVerified",
                        e.target.checked,
                        "guarantors",
                        index
                      )
                    }
                    label="Verify Phone"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Guarantor Verification Comments
              </label>
              <textarea
                value={verificationData.guarantors[index]?.comment || ""}
                onChange={(e) =>
                  handleVerificationChange(
                    "comment",
                    e.target.value,
                    "guarantors",
                    index
                  )
                }
                placeholder="Add comments about this guarantor's verification, document quality, or issues found..."
                className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

          )}

          {/* Step 4: Security Items */}
          {step === 4 && (
            
           <div className="p-8">
  <div className="border-b border-gray-200 pb-6 mb-8">
    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
      <ShieldCheckIcon className="h-8 w-8 text-indigo-600 mr-3" />
      Security Verification
    </h2>
    <p className="text-gray-600 mt-2">Verify customer and guarantor security items</p>
  </div>

  {/* Customer Security */}
  <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm">
    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
      <ShieldCheckIcon className="h-6 w-6 text-indigo-600 mr-3" />
      Customer Security Items
    </h3>

    {securityItems.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <ShieldCheckIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h4 className="text-lg font-semibold text-gray-700 mb-2">No Security Items</h4>
        <p className="text-gray-600">Customer has not provided security items</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {securityItems.map((item, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200"
          >
            {/* Item Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                  <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{item.item || "Security Item"}</h4>
                  <p className="text-sm text-gray-600">Item {index + 1}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                KES {item.value?.toLocaleString() || "N/A"}
              </span>
            </div>

{/* Item Image(s) */}
{item.images && item.images.length > 0 && (
  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
    {item.images.map((imgUrl, i) => (
      <img
        key={i}
        src={imgUrl}
        alt={`${item.item || "Security Item"} - Image ${i + 1}`}
        className="w-full h-40 object-cover rounded-lg shadow-sm hover:scale-105 transition-transform duration-200"
        onError={(e) => (e.currentTarget.style.display = "none")} // hides broken images
      />
    ))}
  </div>
)}




            {/* Item Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Identification:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {item.identification || "N/A"}
                </span>
              </div>
              {item.description && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Description:</span>
                  <p className="text-sm text-gray-900 mt-1">{item.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Verification */}
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Customer Security Verification</h4>
        <ToggleSwitch
          checked={verificationData.security.verified}
          onChange={(e) => handleVerificationChange("verified", e.target.checked, "security")}
          label="Verify Security"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">Security Comments</label>
        <textarea
          value={verificationData.security.comment}
          onChange={(e) => handleVerificationChange("comment", e.target.value, "security")}
          placeholder="Add comments about security items adequacy, valuation, verification status..."
          className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
          rows={3}
        />
      </div>
    </div>
  </div>

  {/* Guarantor Security */}
  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
      <ShieldCheckIcon className="h-6 w-6 text-indigo-600 mr-3" />
      Guarantor Security Items
    </h3>

    {guarantorSecurityItems.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <ShieldCheckIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h4 className="text-lg font-semibold text-gray-700 mb-2">No Guarantor Security Items</h4>
        <p className="text-gray-600">Guarantors have not provided security items</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {guarantorSecurityItems.map((item, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200"
          >
            {/* Item Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{item.item || "Security Item"}</h4>
                  <p className="text-sm text-gray-600">Guarantor Item {index + 1}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                KES {item.estimated_market_value?.toLocaleString() || "N/A"}
              </span>
            </div>
{item.images?.length > 0 && (
  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
    {item.images.map((imgUrl, i) => (
      <img
        key={i}
        src={imgUrl}
        alt={`${item.item || `Guarantor Security ${index + 1}`} - Image ${i + 1}`}
        className="w-full h-40 object-cover rounded-lg shadow-sm hover:scale-105 transition-transform duration-200"
        onError={(e) => (e.currentTarget.style.display = "none")} // hide if broken
      />
    ))}
  </div>
)}





            {/* Item Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Identification:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {item.identification || "N/A"}
                </span>
              </div>
              {item.description && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Description:</span>
                  <p className="text-sm text-gray-900 mt-1">{item.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Verification */}
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Guarantor Security Verification</h4>
        <ToggleSwitch
          checked={verificationData.guarantorSecurity.verified}
          onChange={(e) => handleVerificationChange("verified", e.target.checked, "guarantorSecurity")}
          label="Verify Security"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">Guarantor Security Comments</label>
        <textarea
          value={verificationData.guarantorSecurity.comment}
          onChange={(e) => handleVerificationChange("comment", e.target.value, "guarantorSecurity")}
          placeholder="Add comments about guarantor security items adequacy, valuation, verification status..."
          className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
          rows={3}
        />
      </div>
    </div>
  </div>
</div>



          )}

          {/* Step 5: Loan Information */}
          {step === 5 && (
            <div className="p-8">
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  Loan Assessment
                </h2>
                <p className="text-gray-600 mt-2">Review and adjust loan amount based on verification</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-indigo-600 mr-3" />
                  Loan Details & Scoring
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-blue-900">Prequalified Amount</h4>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">₹</span>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-700 mb-2">
                      KES {verificationData.loan.prequalifiedAmount?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-blue-600">Initial assessment amount</p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-emerald-900">Final Scored Amount</h4>
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      <span className="text-3xl font-bold text-emerald-700 mr-3">KES</span>
                      <input
                        type="number"
                        value={verificationData.loan.scoredAmount || ''}
                        onChange={(e) => handleVerificationChange('scoredAmount', parseFloat(e.target.value) || 0, 'loan')}
                        className="text-3xl font-bold text-emerald-700 bg-transparent border-b-2 border-emerald-300 focus:outline-none focus:border-emerald-500 w-full"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-sm text-emerald-600">Post-verification amount</p>
                  </div>
                </div>

                {loanDetails && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 mb-6">
                    <h4 className="font-semibold text-amber-900 mb-4">Loan Application Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-amber-700">Application Date</p>
                        <p className="text-lg font-semibold text-amber-900">
                          {new Date(loanDetails.application_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-amber-700">Status</p>
                        <p className="text-lg font-semibold text-amber-900 capitalize">{loanDetails.status}</p>
                      </div>
                      {loanDetails.interest_rate && (
                        <div className="text-center">
                          <p className="text-sm font-medium text-amber-700">Interest Rate</p>
                          <p className="text-lg font-semibold text-amber-900">{loanDetails.interest_rate}%</p>
                        </div>
                      )}
                      {loanDetails.term && (
                        <div className="text-center">
                          <p className="text-sm font-medium text-amber-700">Term</p>
                          <p className="text-lg font-semibold text-amber-900">{loanDetails.term} months</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Loan Assessment Comments</h4>
                  <textarea
                    value={verificationData.loan.comment}
                    onChange={(e) => handleVerificationChange('comment', e.target.value, 'loan')}
                    placeholder="Add detailed comments about loan assessment, amount justification, risk factors, repayment capacity analysis..."
                    className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                    rows={5}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Final Decision */}
          {step === 6 && (
            <div className="p-8">
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <ClipboardDocumentCheckIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  Final Decision
                </h2>
                <p className="text-gray-600 mt-2">Make final verification decision and provide comprehensive feedback</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  {/* Decision Selection */}
                 <div className="lg:col-span-1">
  <label className="block text-lg font-semibold text-gray-900 mb-4">
    Verification Decision
  </label>
  <div className="space-y-3">
    {[
      { value: "approved", label: "Approve", color: "emerald", icon: CheckCircleIcon },
      { value: "rejected", label: "Reject", color: "red", icon: XCircleIcon },
      { value: "pending", label: "Request More Information", color: "amber", icon: DocumentMagnifyingGlassIcon },
      { value: "referred", label: "Refer to Senior Manager", color: "purple", icon: UserGroupIcon },
      { value: "edit", label: "Edit Personal Details", color: "blue", icon: PencilSquareIcon },
    ].map(({ value, label, color, icon: Icon }) => {
      const isSelected = verificationData.finalDecision === value;

      // Color mapping
      const colorClasses = {
        emerald: {
          bg: "bg-emerald-50",
          border: "border-emerald-500",
          text: "text-emerald-700",
          icon: "text-emerald-600",
          hover: "hover:bg-emerald-100"
        },
        red: {
          bg: "bg-red-50",
          border: "border-red-500",
          text: "text-red-700",
          icon: "text-red-600",
          hover: "hover:bg-red-100"
        },
        amber: {
          bg: "bg-amber-50",
          border: "border-amber-500",
          text: "text-amber-700",
          icon: "text-amber-600",
          hover: "hover:bg-amber-100"
        },
        purple: {
          bg: "bg-purple-50",
          border: "border-purple-500",
          text: "text-purple-700",
          icon: "text-purple-600",
          hover: "hover:bg-purple-100"
        },
        blue: { 
        bg: "bg-blue-50",
        border: "border-blue-500",
        text: "text-blue-700",
        icon: "text-blue-600",
        hover: "hover:bg-blue-100"
      }
      };

      const currentColor = colorClasses[color];

      return (
        <button
          key={value}
          type="button"
          className={`flex items-center w-full p-4 rounded-xl border-2 cursor-pointer transition-all ${
            isSelected 
              ? `${currentColor.bg} ${currentColor.border} ${currentColor.text}`
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
          }`}
          onClick={() => handleVerificationChange("finalDecision", value)}
        >
          <Icon
            className={`h-6 w-6 mr-3 ${
              isSelected ? currentColor.icon : "text-gray-400"
            }`}
          />
          <span className="font-medium">
            {label}
          </span>
        </button>
      );
    })}
  </div>
</div>

                  {/* Amount and Summary */}
                  <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200 mb-6">
                      <h4 className="text-lg font-semibold text-indigo-900 mb-4">Recommended Loan Amount</h4>
                      <div className="flex items-center justify-center">
                        <span className="text-4xl font-bold text-indigo-700 mr-4">KES</span>
                        <input
                          type="number"
                          value={verificationData.loan.scoredAmount || ''}
                          onChange={(e) => handleVerificationChange('scoredAmount', parseFloat(e.target.value) || 0, 'loan')}
                          className="text-4xl font-bold text-indigo-700 bg-transparent border-b-4 border-indigo-300 focus:outline-none focus:border-indigo-500 text-center w-64"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Verification Summary */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">Verification Summary</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Customer ID', verified: verificationData.customer.idVerified },
                          { label: 'Customer Phone', verified: verificationData.customer.phoneVerified },
                          { label: 'Business', verified: verificationData.business.verified },
                          { label: 'Customer Security', verified: verificationData.security.verified },
                          { label: 'Guarantor Security', verified: verificationData.guarantorSecurity.verified },
                          { label: 'Guarantors', verified: verificationData.guarantors.every(g => g.idVerified && g.phoneVerified) }
                        ].map(({ label, verified }) => (
                          <div key={label} className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <span className="text-sm font-medium text-gray-700">{label}:</span>
                            <span className={`flex items-center text-sm font-semibold ${
                              verified ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {verified ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />}
                              {verified ? 'Verified' : 'Not Verified'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overall Comments */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-gray-200">
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    Overall Comments & Recommendations
                  </label>
                  <textarea
                    value={verificationData.overallComment}
                    onChange={(e) => handleVerificationChange('overallComment', e.target.value)}
                    placeholder="Provide comprehensive final comments, recommendations for the relationship officer, risk assessment, and any special instructions..."
                    className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                    rows={6}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex justify-between border border-indigo-100">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
              step === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
            }`}
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Previous
          </button>
          
          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Next
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={submitVerification}
              disabled={loading || !verificationData.finalDecision}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                !verificationData.finalDecision || loading 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-md hover:shadow-lg'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Verification'
              )}
            </button>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full bg-white rounded-2xl overflow-hidden shadow-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedImage.title}</h3>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                  >
                    <XCircleIcon className="h-8 w-8" />
                  </button>
                </div>
              </div>
              
              {/* Modal Image */}
              <div className="p-4 bg-gray-50">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">Click outside the image or the X button to close</p>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanVerificationForm;