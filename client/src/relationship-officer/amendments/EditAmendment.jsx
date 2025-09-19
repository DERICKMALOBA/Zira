import { useState, useEffect } from "react";
import { 
  UserCircleIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  IdentificationIcon,
  DocumentTextIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  CameraIcon,
  XMarkIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  DevicePhoneMobileIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

import { Upload, Camera, XIcon } from "lucide-react";

import { supabase } from "../../supabaseClient";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function EditAmendment({ customerId, onClose }) {
  const [activeSection, setActiveSection] = useState("personal");
  const [securityItems, setSecurityItems] = useState([]);
  const [guarantorSecurityItems, setGuarantorSecurityItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    console.log("EditAmendment component mounted with customerId:", customerId);
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

const fetchCustomerData = async () => {
  console.log("🔍 Starting to fetch customer data for ID:", customerId);
  setLoading(true);

  try {
    // Fetch customer details
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (customerError) {
      console.error("❌ Customer fetch error:", customerError);
      throw customerError;
    }
    console.log("✅ Customer data fetched:", customer);

    // First fetch: guarantor, nextOfKin, securityItems, loan, businessImages
    console.log("📋 Fetching related data...");
    const [
      { data: guarantor, error: guarantorError },
      { data: nextOfKin, error: nextOfKinError },
      { data: securityItemsData, error: securityError },
      { data: loanData, error: loanError },
      { data: businessImagesData, error: businessImagesError },
         { data: documentsData, error: documentsError }
    ] = await Promise.all([
      supabase.from("guarantors").select("*").eq("customer_id", customerId).single(),
      supabase.from("next_of_kin").select("*").eq("customer_id", customerId).single(),
      supabase.from("security_items").select("*, security_item_images(image_url)").eq("customer_id", customerId),
      supabase.from("loans").select("*").eq("customer_id", customerId).single(),
      supabase.from("business_images").select("*").eq("customer_id", customerId),
 supabase.from("documents").select("id, document_type, image_url").eq("customer_id", customerId) 
    ]);

    // Then fetch guarantor security if guarantor exists
    let guarantorSecurityData = [];
    let guarantorSecurityError = null;
    if (guarantor?.id) {
      const { data, error } = await supabase
        .from("guarantor_security")
        .select("*, guarantor_security_images(image_url)")
        .eq("guarantor_id", guarantor.id);

      guarantorSecurityData = data || [];
      guarantorSecurityError = error;
    }

    // Log results
    console.log("👤 Guarantor data:", guarantor, guarantorError ? "Error:" + guarantorError.message : "✅");
    console.log("👨‍👩‍👧‍👦 Next of Kin data:", nextOfKin, nextOfKinError ? "Error:" + nextOfKinError.message : "✅");
    console.log("🔒 Security items data:", securityItemsData, securityError ? "Error:" + securityError.message : "✅");
    console.log("🔐 Guarantor security data:", guarantorSecurityData, guarantorSecurityError ? "Error:" + guarantorSecurityError.message : "✅");
    console.log("💰 Loan data:", loanData, loanError ? "Error:" + loanError.message : "✅");
    console.log("🏢 Business images data:", businessImagesData, businessImagesError ? "Error:" + businessImagesError.message : "✅");
        console.log("📄 Documents data:", documentsData, documentsError ? "Error:" + documentsError.message : "✅");


    // Build form data
    const updatedFormData = {
      prefix: customer?.prefix || "",
      Firstname: customer?.Firstname || "",
      Middlename: customer?.Middlename || "",
      Surname: customer?.Surname || "",
      maritalStatus: customer?.marital_status || "",
      residenceStatus: customer?.residence_status || "",
      mobile: customer?.mobile || "",
      alternativeMobile: customer?.alternative_mobile || "",
      occupation: customer?.occupation || "",
      dateOfBirth: customer?.date_of_birth || "",
      gender: customer?.gender || "",
      idNumber: customer?.id_number || "",
      postalAddress: customer?.postal_address || "",
      code: customer?.code || "",
      town: customer?.town || "",
      county: customer?.county || "",
      businessName: customer?.business_name || "",
      businessType: customer?.business_type || "",
      yearEstablished: customer?.year_established || "",
      businessLocation: customer?.business_location || "",
      daily_Sales: customer?.daily_Sales || "",
      road: customer?.road || "",
      landmark: customer?.landmark || "",
      hasLocalAuthorityLicense: customer?.has_local_authority_license ? "Yes" : "No",

      guarantor: guarantor ? {
        prefix: guarantor.prefix || "",
        Firstname: guarantor.Firstname || "",
        Surname: guarantor.Surname || "",
        idNumber: guarantor.id_number || "",
        maritalStatus: guarantor.marital_status || "",
        Middlename: guarantor.Middlename || "",
        dateOfBirth: guarantor.date_of_birth || "",
        residenceStatus: guarantor.residence_status || "",
        gender: guarantor.gender || "",
        mobile: guarantor.mobile || "",
        postalAddress: guarantor.postal_address || "",
        code: guarantor.code || "",
        occupation: guarantor.occupation || "",
        relationship: guarantor.relationship || "",
        county: guarantor.county || "",
        cityTown: guarantor.city_town || "",
      } : {
        prefix: "",
        Firstname: "",
        Surname: "",
        idNumber: "",
        maritalStatus: "",
        Middlename: "",
        dateOfBirth: "",
        residenceStatus: "",
        gender: "",
        mobile: "",
        postalAddress: "",
        code: "",
        occupation: "",
        relationship: "",
        county: "",
        cityTown: "",
      },

      nextOfKin: nextOfKin ? {
        Firstname: nextOfKin.Firstname || "",
        Surname: nextOfKin.Surname || "",
        Middlename: nextOfKin.Middlename || "",
        idNumber: nextOfKin.id_number || "",
        relationship: nextOfKin.relationship || "",
        mobile: nextOfKin.mobile || "",
        alternativeNumber: nextOfKin.alternative_number || "",
        employmentStatus: nextOfKin.employment_status || "",
        county: nextOfKin.county || "",
        cityTown: nextOfKin.city_town || "",
      } : {
        Firstname: "",
        Surname: "",
        Middlename: "",
        idNumber: "",
        relationship: "",
        mobile: "",
        alternativeNumber: "",
        employmentStatus: "",
        county: "",
        cityTown: "",
      },

      loan: loanData ? { prequalifiedAmount: loanData.prequalified_amount || "" } : { prequalifiedAmount: "" },
      
documents: documentsData?.length > 0 
  ? documentsData.map(doc => ({
      id: doc.id,
      type: doc.document_type || "",
      url: doc.image_url || ""  // Change from doc.url to doc.image_url
    }))
  : [
      officerClientImage1 ? { type: "officer_client1", url: officerClientImage1 } : null,
      officerClientImage2 ? { type: "officer_client2", url: officerClientImage2 } : null,
      bothOfficersImage ? { type: "both_officers", url: bothOfficersImage } : null,
    ].filter(Boolean) 

   
    };
    

    
    


    setFormData(updatedFormData);
    console.log("✅ Form data set:", updatedFormData);

    // Security items
    if (securityItemsData && securityItemsData.length > 0) {
      console.log("🔒 Processing security items...");
      const processedSecurityItems = securityItemsData.map(item => ({
        id: item.id,
        item: item.item || "",
        description: item.description || "",
        identification: item.identification || "",
        value: item.value || ""
      }));
      setSecurityItems(processedSecurityItems);

      const securityImages = securityItemsData.map(item =>
        item.security_item_images ? item.security_item_images.map(img => img.image_url) : []
      );
      setSecurityItemImages(securityImages);
    } else {
      console.log("ℹ️ No security items found");
      setSecurityItems([]);
      setSecurityItemImages([]);
    }

    // Guarantor security
    if (guarantorSecurityData && guarantorSecurityData.length > 0) {
      console.log("🔐 Processing guarantor security items...");
      const processedGuarantorSecurity = guarantorSecurityData.map(item => ({
        id: item.id,
        item: item.item || "",
        description: item.description || "",
        identification: item.identification || "",
        value: item.estimated_market_value || ""
      }));
      setGuarantorSecurityItems(processedGuarantorSecurity);

      const guarantorSecurityImages = guarantorSecurityData.map(item =>
        item.guarantor_security_images ? item.guarantor_security_images.map(img => img.image_url) : []
      );
      setGuarantorSecurityImages(guarantorSecurityImages);
    } else {
      console.log("ℹ️ No guarantor security items found");
      setGuarantorSecurityItems([]);
      setGuarantorSecurityImages([]);
    }

    // Existing images
    const imageData = {
      passport: customer?.passport_url || null,
      idFront: customer?.id_front_url || null,
      idBack: customer?.id_back_url || null,
      house: customer?.house_image_url || null,
      business: businessImagesData ? businessImagesData.map(img => img.image_url) : [],
      security: securityItemsData ? securityItemsData.flatMap(item =>
        item.security_item_images ? item.security_item_images.map(img => img.image_url) : []
      ) : [],
      guarantorPassport: guarantor?.passport_url || null,
      guarantorIdFront: guarantor?.id_front_url || null,
      guarantorIdBack: guarantor?.id_back_url || null,
      guarantorSecurity: guarantorSecurityData ? guarantorSecurityData.flatMap(item =>
        item.guarantor_security_images ? item.guarantor_security_images.map(img => img.image_url) : []
      ) : [],
        officerClient1: documentsData?.find(doc => doc.document_type === "First Officer and Client Image")?.image_url || null,
  officerClient2: documentsData?.find(doc => doc.document_type === "Second Officer and Client Image")?.image_url || null,
  bothOfficers: documentsData?.find(doc => doc.document_type === "Both Officers Image")?.image_url || null,
    };

    setExistingImages(imageData);
    console.log("🖼️ Existing images set:", imageData);

    // Clear any errors
    setErrors({});
    console.log("✅ Customer data fetch completed successfully");

  } catch (error) {
    console.error("❌ Error fetching customer data:", error);
    toast.error("Failed to load customer data: " + error.message);
    setErrors({ fetch: error.message });
  } finally {
    setLoading(false);
    console.log("🏁 Fetch customer data process completed");
  }
};

   const [formData, setFormData] = useState({
    prefix: "",
    Firstname: "",
    Middlename: "",
    Surname: "",
    maritalStatus: "",
    residenceStatus: "",
    mobile: "",
    alternativeMobile: "",
    occupation: "",
    dateOfBirth: "",
    gender: "",
    idNumber: "",
    postalAddress: "",
    code: "",
    town: "",
    county: "",
    businessName: "",
    businessType: "",
    yearEstablished: "",
    businessLocation: "",
    daily_Sales: "",
    road: "",
    landmark: "",
    hasLocalAuthorityLicense: "",
    prequalifiedAmount: "",
    
    guarantor: {
      prefix: "",
      Firstname: "",
      Surname: "",
      idNumber: "",
      maritalStatus: "",
      Middlename: "",
      dateOfBirth: "",
      residenceStatus: "",
      gender: "",
      mobile: "",
      postalAddress: "",
      code: "",
      occupation: "",
      relationship: "",
      county: "",
      cityTown: "",
    },
    nextOfKin: {
      Firstname: "",
      Surname: "",
      Middlename: "",
      idNumber: "",
      relationship: "",
      mobile: "",
      alternativeNumber: "",
      employmentStatus: "",
      county: "",
      cityTown: "",
    },
   
  });

  
// File upload state
  const [passportFile, setPassportFile] = useState(null);
  const [idFrontFile, setIdFrontFile] = useState(null);
  const [idBackFile, setIdBackFile] = useState(null);
  const [houseImageFile, setHouseImageFile] = useState(null);
  const [businessImages, setBusinessImages] = useState([]);
  const [securityItemImages, setSecurityItemImages] = useState([]);
  const [guarantorPassportFile, setGuarantorPassportFile] = useState(null);
  const [guarantorIdFrontFile, setGuarantorIdFrontFile] = useState(null);
  const [guarantorIdBackFile, setGuarantorIdBackFile] = useState(null);
  const [guarantorSecurityImages, setGuarantorSecurityImages] = useState([]);
  const [previews, setPreviews] = useState({});

  // Document verification states
  const [officerClientImage1, setOfficerClientImage1] = useState(null);
  const [officerClientImage2, setOfficerClientImage2] = useState(null);
  const [bothOfficersImage, setBothOfficersImage] = useState(null);
  const [existingImages, setExistingImages] = useState({
    passport: null,
    idFront: null,
    idBack: null,
    house: null,
    business: [],
    security: [],
    guarantorPassport: null,
    guarantorIdFront: null,
    guarantorIdBack: null,
    guarantorSecurity: [],
    // Document verification images
    officerClient1: null,
    officerClient2: null,
    bothOfficers: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleNestedChange = (e, section) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [name]: value }
    }));
    if (errors[`${section}.${name}`]) {
      setErrors(prev => ({ ...prev, [`${section}.${name}`]: null }));
    }
  };

  const handleSecurityChange = (e, index) => {
    const { name, value } = e.target;
    const newItems = [...securityItems];
    newItems[index][name] = value;
    setSecurityItems(newItems);
  };

  const addSecurityItem = () => {
    const newItem = { item: "", description: "", identification: "", value: "" };
    setSecurityItems(prev => [...prev, newItem]);
    setSecurityItemImages(prev => [...prev, []]);
  };

  const removeSecurityItem = (index) => {
    setSecurityItems(prev => prev.filter((_, i) => i !== index));
    setSecurityItemImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e, setter, key) => {
    const file = e.target.files[0];
    if (!file) return;
    setter(file);
    const previewUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [key]: previewUrl }));
  };

 const handleRemoveFile = (key, setter) => {
  // 1) Clear the "file" (the File object state), if a setter was passed
  if (typeof setter === "function") {
    setter(null);
  }

  // 2) Safely revoke and clear the preview URL using functional state update
  setPreviews(prev => {
    const url = prev?.[key];
    // Only revoke blob/object URLs (they start with "blob:")
    if (url && typeof url === "string" && url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn("Failed to revoke object URL", err);
      }
    }
    // clear preview for this key
    return { ...prev, [key]: null };
  });

  // 3) Remove any existing/server image so the UI no longer shows it
  // (make sure setExistingImages exists in your component)
  setExistingImages(prev => ({ ...(prev || {}), [key]: null }));
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mock submission
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading customer data...</p>
        </div>
      </div>
    );
  }

  // Navigation sections
  const sections = [
    { id: "personal", label: "Personal Info", icon: UserCircleIcon },
    { id: "business", label: "Business Info", icon: BuildingOffice2Icon },
    { id: "borrowerSecurity", label: "Borrower Security", icon: ShieldCheckIcon },
    { id: "loan", label: "Loan Details", icon: CurrencyDollarIcon },
    { id: "guarantor", label: "Guarantor", icon: UserGroupIcon },
    { id: "guarantorSecurity", label: "Guarantor Security", icon: ShieldCheckIcon },
    { id: "nextOfKin", label: "Next of Kin", icon: UserGroupIcon },
    { id: "documents", label: "Documents", icon: DocumentTextIcon }
  ];

  const DocumentUpload = ({ title, file, setFile, preview, existing, fileKey, icon: Icon, accept = "image/*" }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">
      <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
          <Icon className="h-4 w-4 text-indigo-600 mr-2" />
          {title}
        </h4>
      </div>
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <label className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors flex-1">
            < ArrowUpTrayIcon className="h-4 w-4" />
            Upload
            <input
              type="file"
              accept={accept}
              onChange={(e) => handleFileUpload(e, setFile, fileKey)}
              className="hidden"
            />
          </label>
          <label className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors flex-1">
            <CameraIcon className="h-4 w-4" />
            Camera
            <input
              type="file"
              accept={accept}
              capture="environment"
              onChange={(e) => handleFileUpload(e, setFile, fileKey)}
              className="hidden"
            />
          </label>
        </div>
        
        {(preview || existing) && (
          <div className="relative">
            <img
              src={preview || existing}
              alt={title}
              className="w-full h-40 object-cover rounded-lg border border-gray-100"
            />
            <button
              type="button"
              onClick={() => handleRemoveFile(fileKey, setFile)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-lg"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {!preview && !existing && (
          <div className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50">
            <Icon className="h-12 w-12 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500 font-medium">No file uploaded</span>
          </div>
        )}
      </div>
    </div>
  );

  const FormField = ({ label, name, value, onChange, required = false, type = "text", options = null, placeholder = "", section = null, className = "" }) => (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select
          name={name}
          value={value}
          onChange={section ? (e) => handleNestedChange(e, section) : onChange}
          className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors[name] ? 'border-red-500' : ''}`}
          required={required}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={section ? (e) => handleNestedChange(e, section) : onChange}
          placeholder={placeholder}
          className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors[name] ? 'border-red-500' : ''}`}
          required={required}
          disabled={name === 'mobile' || name === 'idNumber'}
        />
      )}
      {errors[name] && <span className="text-red-500 text-xs mt-1">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                Edit Customer Information
              </h1>
              <p className="text-gray-600 mt-2">Update and modify customer application details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
              disabled={isSubmitting}
            >
              <XCircleIcon className="h-8 w-8" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-indigo-100">
          <div className="flex flex-wrap gap-2">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeSection === id
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            
            {/* Personal Information */}
            {activeSection === "personal" && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <UserCircleIcon className="h-8 w-8 text-indigo-600 mr-3" />
                    Personal Information
                  </h2>
                  <p className="text-gray-600 mt-2">Update personal details and contact information</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    label="Prefix"
                    name="prefix"
                    value={formData.prefix}
                    onChange={handleChange}
                    options={["Mr", "Mrs", "Ms", "Dr"]}
                  />
                  <FormField
                    label="First Name"
                    name="Firstname"
                    value={formData.Firstname}
                    onChange={handleChange}
                    required
                  />
                  <FormField
                    label="Middle Name"
                    name="Middlename"
                    value={formData.Middlename}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Surname"
                    name="Surname"
                    value={formData.Surname}
                    onChange={handleChange}
                    required
                  />
                  <FormField
                    label="Mobile Number"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="Cannot be changed"
                    className="opacity-60"
                  />
                  <FormField
                    label="Alternative Mobile"
                    name="alternativeMobile"
                    value={formData.alternativeMobile}
                    onChange={handleChange}
                    className="opacity-60"
                    placeholder="Cannot be changed"
                  />
                  <FormField
                    label="ID Number"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    className="opacity-60"
                    placeholder="Cannot be changed"
                  />
                  <FormField
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    options={["Male", "Female"]}
                  />
                  <FormField
                    label="Marital Status"
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    options={["Single", "Married", "Separated/Divorced", "Other"]}
                  />
                  <FormField
                    label="Residence Status"
                    name="residenceStatus"
                    value={formData.residenceStatus}
                    onChange={handleChange}
                    options={["Own", "Rent", "Family", "Other"]}
                  />
                  <FormField
                    label="Occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Postal Address"
                    name="postalAddress"
                    value={formData.postalAddress}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Postal Code"
                    name="code"
                    type="number"
                    value={formData.code}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Town/City"
                    name="town"
                    value={formData.town}
                    onChange={handleChange}
                  />
                  <FormField
                    label="County"
                    name="county"
                    value={formData.county}
                    onChange={handleChange}
                  />
                </div>

                
              {/* Document Uploads */}
<div className="mt-8">
  <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Documents</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[
      {
        key: "passport",
        label: "Passport Photo",
        handler: setPassportFile,
        preview: previews.passport,
        existing: existingImages.passport,
      },
      {
        key: "idFront",
        label: "ID Front",
        handler: setIdFrontFile,
        preview: previews.idFront,
        existing: existingImages.idFront,
      },
      {
        key: "idBack",
        label: "ID Back",
        handler: setIdBackFile,
        preview: previews.idBack,
        existing: existingImages.idBack,
      },
      {
        key: "house",
        label: "House Image",
        handler: setHouseImageFile,
        preview: previews.house,
        existing: existingImages.house,
      },
    ].map((file) => (
      <div
        key={file.key}
        className="flex flex-col items-start p-4 border border-blue-200 rounded-xl bg-white shadow-sm hover:shadow-md transition"
      >
        {/* Label */}
        <label className="block text-sm font-medium text-blue-800 mb-3">
          {file.label}
        </label>

        {/* Upload / Camera buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <label className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg shadow-sm cursor-pointer hover:bg-blue-200 transition">
            <ArrowUpTrayIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Upload</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, file.handler, file.key)}
              className="hidden"
            />
          </label>

          <label className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm cursor-pointer hover:bg-blue-700 transition">
            <CameraIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Camera</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileUpload(e, file.handler, file.key)}
              className="hidden"
            />
          </label>
        </div>

        {/* Preview */}
        {(file.preview || file.existing) && (
          <div className="mt-4 relative w-full">
            <img
              src={file.preview || file.existing}
              alt={file.label}
              className="w-full h-40 object-cover rounded-lg border border-green-200 shadow-sm"
            />
            <button
              type="button"
              onClick={() => handleRemoveFile(file.key, file.handler)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
</div>

              </div>
            )}

            {/* Business Information */}
            {activeSection === "business" && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <BuildingOffice2Icon className="h-8 w-8 text-indigo-600 mr-3" />
                    Business Information
                  </h2>
                  <p className="text-gray-600 mt-2">Update business details and operations</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    label="Business Name"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Business Type"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    placeholder="e.g. Retail, Wholesale"
                  />
                  <FormField
                    label="Year Established"
                    name="yearEstablished"
                    type="date"
                    value={formData.yearEstablished}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Daily Sales (KES)"
                    name="daily_Sales"
                    type="number"
                    value={formData.daily_Sales}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Business Location"
                    name="businessLocation"
                    value={formData.businessLocation}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Road"
                    name="road"
                    value={formData.road}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Landmark"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="e.g. Near KCB Bank"
                  />
                  <FormField
                    label="Local Authority License"
                    name="hasLocalAuthorityLicense"
                    value={formData.hasLocalAuthorityLicense}
                    onChange={handleChange}
                    options={["Yes", "No"]}
                  />
                </div>

      
                {/* Business Images */}
<div className="mt-8">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-lg font-semibold text-gray-900">Business Images</h3>
    <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
      <PlusIcon className="h-4 w-4" />
      Add Images
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files);
          setBusinessImages((prev) => [...prev, ...files]);
        }}
        className="hidden"
      />
    </label>
  </div>

  {/* Existing Business Images */}
  {existingImages.business?.length > 0 && (
    <div className="mb-6">
      <h5 className="text-sm font-medium mb-2 text-gray-700">
        Existing Images:
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {existingImages.business.map((img, index) => (
          <div key={index} className="relative">
            <img
              src={img}
              alt={`Existing Business ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() =>
                setExistingImages((prev) => ({
                  ...prev,
                  business: prev.business.filter((_, i) => i !== index),
                }))
              }
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* New Business Images */}
  {businessImages.length > 0 && (
    <div>
      <h5 className="text-sm font-medium mb-2 text-gray-700">New Images:</h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {businessImages.map((img, index) => {
          const objectUrl = URL.createObjectURL(img);
          return (
            <div key={index} className="relative">
              <img
                src={objectUrl}
                alt={`New Business ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => {
                  // revoke blob URL before removing
                  URL.revokeObjectURL(objectUrl);
                  setBusinessImages((prev) =>
                    prev.filter((_, i) => i !== index)
                  );
                }}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  )}
</div>

              </div>
            )}

            {/* Borrower Security */}
            {activeSection === "borrowerSecurity" && (
             <div className="space-y-8">
  <div className="border-b border-gray-200 pb-6">
    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
      <ShieldCheckIcon className="h-8 w-8 text-indigo-600 mr-3" />
      Borrower Security Items
    </h2>
    <p className="text-gray-600 mt-2">Manage security items and collateral</p>
  </div>

  <div className="space-y-6">
    {securityItems.map((item, index) => (
      <div
        key={index}
        className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-indigo-600 mr-2" />
            Security Item {index + 1}
          </h3>
          {securityItems.length > 1 && (
            <button
              type="button"
              onClick={() => removeSecurityItem(index)}
              className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Item"
            name="item"
            value={item.item}
            onChange={(e) => handleSecurityChange(e, index)}
          />
          <FormField
            label="Description"
            name="description"
            value={item.description}
            onChange={(e) => handleSecurityChange(e, index)}
          />
          <FormField
            label="Identification"
            name="identification"
            value={item.identification}
            onChange={(e) => handleSecurityChange(e, index)}
            placeholder="e.g. Serial No."
          />
          <FormField
            label="Est. Market Value (KES)"
            name="value"
            type="number"
            value={item.value}
            onChange={(e) => handleSecurityChange(e, index)}
          />
        </div>

        {/* Security Item Images */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2 text-gray-800">
            Item Images
          </label>
          <div className="flex gap-3 mb-3">
            {/* Upload */}
            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-200 transition">
              <Upload className="w-5 h-5" />
              Upload
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  const newImages = [
                    ...(securityItemImages[index] || []),
                    ...files,
                  ];
                  const updated = [...securityItemImages];
                  updated[index] = newImages;
                  setSecurityItemImages(updated);
                }}
                className="hidden"
              />
            </label>

            {/* Camera */}
            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition">
              <Camera className="w-5 h-5" />
              Camera
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  const newImages = [
                    ...(securityItemImages[index] || []),
                    ...files,
                  ];
                  const updated = [...securityItemImages];
                  updated[index] = newImages;
                  setSecurityItemImages(updated);
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Preview */}
          {securityItemImages[index] &&
            securityItemImages[index].length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {securityItemImages[index].map((img, imgIndex) => (
                  <div key={imgIndex} className="relative">
                    <img
                      src={
                        typeof img === "string"
                          ? img
                          : URL.createObjectURL(img)
                      }
                      alt={`Security ${index + 1} - Image ${imgIndex + 1}`}
                      className="w-full h-28 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...securityItemImages];
                        updated[index] = updated[index].filter(
                          (_, i) => i !== imgIndex
                        );
                        setSecurityItemImages(updated);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    ))}

    <button
      type="button"
      onClick={addSecurityItem}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
    >
      <PlusIcon className="h-5 w-5" />
      Add Security Item
    </button>
  </div>
</div>

            )}

            {/* Loan Details */}
            {activeSection === "loan" && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-indigo-600 mr-3" />
                    Loan Information
                  </h2>
                  <p className="text-gray-600 mt-2">Update loan amount and terms</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-8 border border-emerald-200">
                  <div className="max-w-md mx-auto">
                    <FormField
                      label="Pre-qualified Amount (KES)"
                      name="prequalifiedAmount"
                      type="number"
                      value={formData.prequalifiedAmount}
                      onChange={handleChange}
                      className="text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Guarantor Details */}
            {activeSection === "guarantor" && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <UserGroupIcon className="h-8 w-8 text-indigo-600 mr-3" />
                    Guarantor Information
                  </h2>
                  <p className="text-gray-600 mt-2">Update guarantor personal details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    label="Prefix"
                    name="prefix"
                    value={formData.guarantor.prefix}
                    section="guarantor"
                    options={["Mr", "Mrs", "Ms", "Dr"]}
                  />
                  <FormField
                    label="First Name"
                    name="Firstname"
                    value={formData.guarantor.Firstname}
                    section="guarantor"
                  />
                  <FormField
                    label="Middle Name"
                    name="Middlename"
                    value={formData.guarantor.Middlename}
                    section="guarantor"
                  />
                  <FormField
                    label="Surname"
                    name="Surname"
                    value={formData.guarantor.Surname}
                    section="guarantor"
                  />
                  <FormField
                    label="ID Number"
                    name="idNumber"
                    value={formData.guarantor.idNumber}
                    section="guarantor"
                  />
                  <FormField
                    label="Mobile Number"
                    name="mobile"
                    value={formData.guarantor.mobile}
                    section="guarantor"
                  />
                  <FormField
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.guarantor.dateOfBirth}
                    section="guarantor"
                  />
                  <FormField
                    label="Gender"
                    name="gender"
                    value={formData.guarantor.gender}
                    section="guarantor"
                    options={["Male", "Female"]}
                  />
                  <FormField
                    label="Marital Status"
                    name="maritalStatus"
                    value={formData.guarantor.maritalStatus}
                    section="guarantor"
                    options={["Single", "Married", "Separated/Divorced", "Other"]}
                  />
                  <FormField
                    label="Residence Status"
                    name="residenceStatus"
                    value={formData.guarantor.residenceStatus}
                    section="guarantor"
                    options={["Own", "Rent", "Family", "Other"]}
                  />
                  <FormField
                    label="Occupation"
                    name="occupation"
                    value={formData.guarantor.occupation}
                    section="guarantor"
                  />
                  <FormField
                    label="Relationship"
                    name="relationship"
                    value={formData.guarantor.relationship}
                    section="guarantor"
                    placeholder="e.g. Spouse, Friend"
                  />
                  <FormField
                    label="Postal Address"
                    name="postalAddress"
                    value={formData.guarantor.postalAddress}
                    section="guarantor"
                  />
                  <FormField
                    label="Postal Code"
                    name="code"
                    type="number"
                    value={formData.guarantor.code}
                    section="guarantor"
                  />
                  <FormField
                    label="County"
                    name="county"
                    value={formData.guarantor.county}
                    section="guarantor"
                  />
                  <FormField
                    label="City/Town"
                    name="cityTown"
                    value={formData.guarantor.cityTown}
                    section="guarantor"
                  />
                </div>

                {/* Guarantor Documents */}
               {/* Guarantor Documents */}
<div className="mt-8">
  <h3 className="text-lg font-semibold text-gray-900 mb-6">
    Guarantor Documents
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[
      {
        key: "guarantorPassport",
        label: "Guarantor Passport",
        handler: setGuarantorPassportFile,
        preview: previews.guarantorPassport,
        existing: existingImages.guarantorPassport,
        icon: UserCircleIcon,
      },
      {
        key: "guarantorIdFront",
        label: "Guarantor ID Front",
        handler: setGuarantorIdFrontFile,
        preview: previews.guarantorIdFront,
        existing: existingImages.guarantorIdFront,
        icon: IdentificationIcon,
      },
      {
        key: "guarantorIdBack",
        label: "Guarantor ID Back",
        handler: setGuarantorIdBackFile,
        preview: previews.guarantorIdBack,
        existing: existingImages.guarantorIdBack,
        icon: IdentificationIcon,
      },
    ].map((file) => (
      <div
        key={file.key}
        className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <file.icon className="h-6 w-6 text-indigo-600" />
          <h4 className="text-md font-medium text-gray-900">
            {file.label}
          </h4>
        </div>

        <div className="flex gap-2 mb-3">
          {/* Upload button */}
          <label className="flex items-center justify-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded cursor-pointer hover:bg-indigo-200">
            <Upload size={16} />
            Upload
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleFileUpload(e, file.handler, file.key)
              }
              className="hidden"
            />
          </label>

          {/* Camera button */}
          <label className="flex items-center justify-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded cursor-pointer hover:bg-indigo-700">
            <Camera size={16} />
            Camera
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) =>
                handleFileUpload(e, file.handler, file.key)
              }
              className="hidden"
            />
          </label>
        </div>

        {/* Preview Section */}
        {(file.preview || file.existing) && (
          <div className="relative">
            <img
              src={file.preview || file.existing}
              alt={file.label}
              className="w-full h-32 object-contain border rounded"
            />
            <button
              type="button"
              onClick={() => handleRemoveFile(file.key, file.handler)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow"
            >
              <XIcon size={16} />
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
</div>

              </div>
            )}

            {/* Guarantor Security */}
            {activeSection === "guarantorSecurity" && (
              <div className="space-y-8">
  <div className="border-b border-gray-200 pb-6">
    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
      <ShieldCheckIcon className="h-8 w-8 text-indigo-600 mr-3" />
      Guarantor Security Items
    </h2>
    <p className="text-gray-600 mt-2">Manage guarantor security and collateral</p>
  </div>

  <div className="space-y-6">
    {guarantorSecurityItems.map((item, index) => (
      <div
        key={index}
        className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-purple-600 mr-2" />
            Guarantor Security Item {index + 1}
          </h3>
          {guarantorSecurityItems.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setGuarantorSecurityItems((prev) =>
                  prev.filter((_, i) => i !== index)
                )
              }
              className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Item"
            name="item"
            value={item.item}
            onChange={(e) => {
              const newItems = [...guarantorSecurityItems];
              newItems[index][e.target.name] = e.target.value;
              setGuarantorSecurityItems(newItems);
            }}
          />
          <FormField
            label="Description"
            name="description"
            value={item.description}
            onChange={(e) => {
              const newItems = [...guarantorSecurityItems];
              newItems[index][e.target.name] = e.target.value;
              setGuarantorSecurityItems(newItems);
            }}
          />
          <FormField
            label="Identification"
            name="identification"
            value={item.identification}
            onChange={(e) => {
              const newItems = [...guarantorSecurityItems];
              newItems[index][e.target.name] = e.target.value;
              setGuarantorSecurityItems(newItems);
            }}
            placeholder="e.g. Serial No."
          />
          <FormField
            label="Est. Market Value (KES)"
            name="value"
            type="number"
            value={item.value}
            onChange={(e) => {
              const newItems = [...guarantorSecurityItems];
              newItems[index][e.target.name] = e.target.value;
              setGuarantorSecurityItems(newItems);
            }}
          />
        </div>

        {/* Guarantor Security Item Images */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-3">
            Item Images
          </label>
          <div className="flex gap-2 mb-3">
            {/* Upload Button */}
            <label className="flex items-center justify-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded cursor-pointer hover:bg-indigo-200">
              <Upload size={16} />
              Upload
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  const newImages = [
                    ...(guarantorSecurityImages[index] || []),
                    ...files,
                  ];
                  const updated = [...guarantorSecurityImages];
                  updated[index] = newImages;
                  setGuarantorSecurityImages(updated);
                  console.log(
                    `Added ${files.length} images to guarantor security item ${index}`
                  );
                }}
                className="hidden"
              />
            </label>

            {/* Camera Button */}
            <label className="flex items-center justify-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded cursor-pointer hover:bg-indigo-700">
              <Camera size={16} />
              Camera
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  const newImages = [
                    ...(guarantorSecurityImages[index] || []),
                    ...files,
                  ];
                  const updated = [...guarantorSecurityImages];
                  updated[index] = newImages;
                  setGuarantorSecurityImages(updated);
                  console.log(
                    `Added ${files.length} camera images to guarantor security item ${index}`
                  );
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Image Previews */}
          {guarantorSecurityImages[index] &&
            guarantorSecurityImages[index].length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {guarantorSecurityImages[index].map((img, imgIndex) => (
                  <div key={imgIndex} className="relative">
                    <img
                      src={
                        typeof img === "string"
                          ? img
                          : URL.createObjectURL(img)
                      }
                      alt={`Guarantor Security ${index + 1} - Image ${
                        imgIndex + 1
                      }`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...guarantorSecurityImages];
                        updated[index] = updated[index].filter(
                          (_, i) => i !== imgIndex
                        );
                        setGuarantorSecurityImages(updated);
                        console.log(
                          `Removed image ${imgIndex} from guarantor security item ${index}`
                        );
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    ))}

    {/* Add New Guarantor Security Item */}
    <button
      type="button"
      onClick={() => {
        const newItem = {
          item: "",
          description: "",
          identification: "",
          value: "",
        };
        setGuarantorSecurityItems((prev) => [...prev, newItem]);
        setGuarantorSecurityImages((prev) => [...prev, []]);
      }}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
    >
      <PlusIcon className="h-5 w-5" />
      Add Guarantor Security Item
    </button>
  </div>
</div>
            )}

            {/* Next of Kin */}
            {activeSection === "nextOfKin" && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <UserGroupIcon className="h-8 w-8 text-indigo-600 mr-3" />
                    Next of Kin Information
                  </h2>
                  <p className="text-gray-600 mt-2">Update next of kin details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    label="First Name"
                    name="Firstname"
                    value={formData.nextOfKin.Firstname}
                    section="nextOfKin"
                  />
                  <FormField
                    label="Middle Name"
                    name="Middlename"
                    value={formData.nextOfKin.Middlename}
                    section="nextOfKin"
                  />
                  <FormField
                    label="Surname"
                    name="Surname"
                    value={formData.nextOfKin.Surname}
                    section="nextOfKin"
                  />
                  <FormField
                    label="ID Number"
                    name="idNumber"
                    value={formData.nextOfKin.idNumber}
                    section="nextOfKin"
                  />
                  <FormField
                    label="Relationship"
                    name="relationship"
                    value={formData.nextOfKin.relationship}
                    section="nextOfKin"
                    placeholder="e.g. Brother, Sister"
                  />
                  <FormField
                    label="Mobile Number"
                    name="mobile"
                    value={formData.nextOfKin.mobile}
                    section="nextOfKin"
                  />
                  <FormField
                    label="Alternative Number"
                    name="alternativeNumber"
                    value={formData.nextOfKin.alternativeNumber}
                    section="nextOfKin"
                  />
                  <FormField
                    label="Employment Status"
                    name="employmentStatus"
                    value={formData.nextOfKin.employmentStatus}
                    section="nextOfKin"
                    options={["Employed", "Self Employed", "Unemployed", "Student", "Retired"]}
                  />
                  <FormField
                    label="County"
                    name="county"
                    value={formData.nextOfKin.county}
                    section="nextOfKin"
                  />
                  <FormField
                    label="City/Town"
                    name="cityTown"
                    value={formData.nextOfKin.cityTown}
                    section="nextOfKin"
                  />
                </div>
              </div>
            )}

            {/* Documents Verification */}
            {activeSection === "documents" && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-8 w-8 text-indigo-600 mr-3" />
                    Document Verification
                  </h2>
                  <p className="text-gray-600 mt-2">Upload verification and officer images</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DocumentUpload
                    title="First Officer & Client"
                    file={officerClientImage1}
                    setFile={setOfficerClientImage1}
                    preview={previews.officerClient1}
                    fileKey="officerClient1"
                    icon={UserGroupIcon}
                  />
                  <DocumentUpload
                    title="Second Officer & Client"
                    file={officerClientImage2}
                    setFile={setOfficerClientImage2}
                    preview={previews.officerClient2}
                    fileKey="officerClient2"
                    icon={UserGroupIcon}
                  />
                  <DocumentUpload
                    title="Both Officers"
                    file={bothOfficersImage}
                    setFile={setBothOfficersImage}
                    preview={previews.bothOfficers}
                    fileKey="bothOfficers"
                    icon={UserGroupIcon}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
              <div className="flex gap-4">
                {sections.map(({ id }, index) => {
                  if (index === 0) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveSection(sections[index - 1].id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        activeSection === id ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Previous
                    </button>
                  );
                })}
                {sections.map(({ id }, index) => {
                  if (index === sections.length - 1) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveSection(sections[index + 1].id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        activeSection === id ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving Changes...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditAmendment;