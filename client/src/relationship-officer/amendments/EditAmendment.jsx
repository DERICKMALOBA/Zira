import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { toast } from "react-toastify";
import { Upload, Camera, XIcon } from "lucide-react";

function EditAmendment({ customerId, onClose }) {
  const [activeSection, setActiveSection] = useState("personal");
  const [securityItems, setSecurityItems] = useState([]);
  const [guarantorSecurityItems, setGuarantorSecurityItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    console.log("EditAmendment component mounted with customerId:", customerId);
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  // Add logging for state changes
  useEffect(() => {
    console.log("FormData updated:", formData);
  }, [formData]);

  useEffect(() => {
    console.log("Security items updated:", securityItems);
  }, [securityItems]);

  useEffect(() => {
    console.log("Guarantor security items updated:", guarantorSecurityItems);
  }, [guarantorSecurityItems]);

  useEffect(() => {
    console.log("Existing images updated:", existingImages);
  }, [existingImages]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Form field changed: ${name} = ${value}`);
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear related errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleNestedChange = (e, section) => {
    const { name, value } = e.target;
    console.log(`📝 Nested form field changed: ${section}.${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [name]: value }
    }));
    
    // Clear related errors
    if (errors[`${section}.${name}`]) {
      setErrors(prev => ({ ...prev, [`${section}.${name}`]: null }));
    }
  };

  const handleSecurityChange = (e, index) => {
    const { name, value } = e.target;
    console.log(`🔒 Security item ${index} changed: ${name} = ${value}`);
    const newItems = [...securityItems];
    newItems[index][name] = value;
    setSecurityItems(newItems);
  };

  const handleGuarantorSecurityChange = (e, index) => {
    const { name, value } = e.target;
    console.log(`🔐 Guarantor security item ${index} changed: ${name} = ${value}`);
    const newItems = [...guarantorSecurityItems];
    newItems[index][name] = value;
    setGuarantorSecurityItems(newItems);
  };

  const handleLoanChange = (e) => {
    const { name, value } = e.target;
    console.log(`💰 Loan field changed: ${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      loan: { ...prev.loan, [name]: value }
    }));
  };

  const addSecurityItem = () => {
    console.log("➕ Adding new security item");
    const newItem = { item: "", description: "", identification: "", value: "" };
    setSecurityItems(prev => [...prev, newItem]);
    setSecurityItemImages(prev => [...prev, []]);
  };

  const removeSecurityItem = (index) => {
    console.log(`🗑️ Removing security item at index ${index}`);
    setSecurityItems(prev => prev.filter((_, i) => i !== index));
    setSecurityItemImages(prev => prev.filter((_, i) => i !== index));
  };

  const addGuarantorSecurityItem = () => {
    console.log("➕ Adding new guarantor security item");
    const newItem = { item: "", description: "", identification: "", value: "" };
    setGuarantorSecurityItems(prev => [...prev, newItem]);
    setGuarantorSecurityImages(prev => [...prev, []]);
  };

  const removeGuarantorSecurityItem = (index) => {
    console.log(`🗑️ Removing guarantor security item at index ${index}`);
    setGuarantorSecurityItems(prev => prev.filter((_, i) => i !== index));
    setGuarantorSecurityImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e, setter, key) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log(`📎 File selected for ${key}:`, file.name, file.size);
    setter(file);
    
    const previewUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [key]: previewUrl }));
    console.log(`🖼️ Preview created for ${key}`);
  };
// const handleDocumentUpload = (e, index) => {
//   const file = e.target.files[0];
//   if (!file) return;
//   const updatedDocs = [...documents];
//   updatedDocs[index] = file;
//   setDocuments(updatedDocs);
//   console.log(`Uploaded document for ${index}`);
// };

// const removeDocument = (index) => {
//   const updatedDocs = [...documents];
//   updatedDocs[index] = null;
//   setDocuments(updatedDocs);
//   console.log(`Removed document ${index}`);
// };
  const handleRemoveFile = (key, setter) => {
    console.log(`🗑️ Removing file for ${key}`);
    if (setter) setter(null);
    setPreviews(prev => ({ ...prev, [key]: null }));
    if (previews[key]) {
      URL.revokeObjectURL(previews[key]);
      console.log(`🧹 Cleaned up preview URL for ${key}`);
    }
  };

  const handleMultipleFiles = (e, setter) => {
    const files = Array.from(e.target.files);
    console.log(`📎 Multiple files selected:`, files.length);
    setter(prev => {
      const newFiles = [...prev, ...files];
      console.log(`📁 Total files now:`, newFiles.length);
      return newFiles;
    });
  };

  const handleRemoveBusinessImage = (index) => {
    console.log(`🗑️ Removing business image at index ${index}`);
    setBusinessImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file, path, bucket = "customers") => {
    console.log(`☁️ Uploading file: ${file.name} to ${bucket}/${path}`);
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (error) {
        console.error(`❌ Upload failed for ${file.name}:`, error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log(`✅ File uploaded successfully: ${urlData.publicUrl}`);
      return urlData.publicUrl;
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      toast.error(`Failed to upload file: ${error.message}`);
      return null;
    }
  };

  const validateForm = () => {
    console.log("🔍 Validating form...");
    const newErrors = {};
    
    // Basic required fields
    if (!formData.Firstname?.trim()) newErrors.Firstname = "First name is required";
    if (!formData.Surname?.trim()) newErrors.Surname = "Surname is required";
    if (!formData.idNumber?.trim()) newErrors.idNumber = "ID number is required";
    
    // Validate security items
    securityItems.forEach((item, index) => {
      if (item.item && !item.value) {
        newErrors[`security_${index}_value`] = "Value is required when item is specified";
      }
      if (item.value && isNaN(parseFloat(item.value))) {
        newErrors[`security_${index}_value`] = "Value must be a valid number";
      }
    });
    
    // Validate guarantor security items
    guarantorSecurityItems.forEach((item, index) => {
      if (item.item && !item.value) {
        newErrors[`guarantor_security_${index}_value`] = "Value is required when item is specified";
      }
      if (item.value && isNaN(parseFloat(item.value))) {
        newErrors[`guarantor_security_${index}_value`] = "Value must be a valid number";
      }
    });

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log(`📋 Form validation result: ${isValid ? "✅ Valid" : "❌ Invalid"}`, newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Starting form submission...");
    
    if (!validateForm()) {
      console.log("❌ Form validation failed, aborting submission");
      toast.error("Please fix the validation errors before submitting");
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log("☁️ Starting file uploads...");
      
      // Upload new files and get URLs
      const passportUrl = passportFile ? await uploadFile(passportFile, `personal/${Date.now()}_passport_${passportFile.name}`) : existingImages.passport;
      const idFrontUrl = idFrontFile ? await uploadFile(idFrontFile, `personal/${Date.now()}_id_front_${idFrontFile.name}`) : existingImages.idFront;
      const idBackUrl = idBackFile ? await uploadFile(idBackFile, `personal/${Date.now()}_id_back_${idBackFile.name}`) : existingImages.idBack;
      const houseImageUrl = houseImageFile ? await uploadFile(houseImageFile, `personal/${Date.now()}_house_${houseImageFile.name}`) : existingImages.house;

      // Upload document verification images
      // const officerClient1Url = officerClientImage1 ? await uploadFile(officerClientImage1, `documents/${Date.now()}_officer_client_1_${officerClientImage1.name}`) : existingImages.officerClient1;
      // const officerClient2Url = officerClientImage2 ? await uploadFile(officerClientImage2, `documents/${Date.now()}_officer_client_2_${officerClientImage2.name}`) : existingImages.officerClient2;
      // const bothOfficersUrl = bothOfficersImage ? await uploadFile(bothOfficersImage, `documents/${Date.now()}_both_officers_${bothOfficersImage.name}`) : existingImages.bothOfficers;

      console.log("📋 Updating customer record...");
      
      // Update customer
      const customerUpdateData = {
        prefix: formData.prefix || null,
        Firstname: formData.Firstname || null,
        Surname: formData.Surname || null,
        Middlename: formData.Middlename || null,
        marital_status: formData.maritalStatus || null,
        residence_status: formData.residenceStatus || null,
        alternative_mobile: formData.alternativeMobile || null,
        occupation: formData.occupation || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        id_number: formData.idNumber ? parseInt(formData.idNumber) : null,
        postal_address: formData.postalAddress || null,
        code: formData.code ? parseInt(formData.code) : null,
        town: formData.town || null,
        county: formData.county || null,
        business_name: formData.businessName || null,
        business_type: formData.businessType || null,
        daily_Sales: formData.daily_Sales ? parseFloat(formData.daily_Sales) : null,
        year_established: formData.yearEstablished ? parseInt(formData.yearEstablished) : null,
        business_location: formData.businessLocation || null,
        road: formData.road || null,
        landmark: formData.landmark || null,
        has_local_authority_license: formData.hasLocalAuthorityLicense === "Yes",
        passport_url: passportUrl,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        house_image_url: houseImageUrl,
      };

      console.log("📤 Customer update data:", customerUpdateData);

      const { error: customerError } = await supabase
        .from("customers")
        .update(customerUpdateData)
        .eq("id", customerId);

      if (customerError) {
        console.error("❌ Customer update failed:", customerError);
        throw customerError;
      }
      console.log("✅ Customer updated successfully");

      // Update or create guarantor
      if (formData.guarantor && (formData.guarantor.Firstname || formData.guarantor.Surname)) {
        console.log("👤 Processing guarantor...");
        
        const guarantorPassportUrl = guarantorPassportFile 
          ? await uploadFile(guarantorPassportFile, `guarantor/${Date.now()}_passport_${guarantorPassportFile.name}`) 
          : existingImages.guarantorPassport;
        
        const guarantorIdFrontUrl = guarantorIdFrontFile 
          ? await uploadFile(guarantorIdFrontFile, `guarantor/${Date.now()}_id_front_${guarantorIdFrontFile.name}`) 
          : existingImages.guarantorIdFront;
        
        const guarantorIdBackUrl = guarantorIdBackFile 
          ? await uploadFile(guarantorIdBackFile, `guarantor/${Date.now()}_id_back_${guarantorIdBackFile.name}`) 
          : existingImages.guarantorIdBack;

        // Check if guarantor already exists
        const { data: existingGuarantor, error: guarantorCheckError } = await supabase
          .from("guarantors")
          .select("id")
          .eq("customer_id", customerId)
          .single();

        if (guarantorCheckError && guarantorCheckError.code !== 'PGRST116') {
          console.error("❌ Error checking existing guarantor:", guarantorCheckError);
          throw guarantorCheckError;
        }

        const guarantorData = {
          prefix: formData.guarantor.prefix || null,
          Firstname: formData.guarantor.Firstname || null,
          Surname: formData.guarantor.Surname || null,
          Middlename: formData.guarantor.Middlename || null,
          id_number: formData.guarantor.idNumber || null,
          marital_status: formData.guarantor.maritalStatus || null,
          gender: formData.guarantor.gender || null,
          mobile: formData.guarantor.mobile || null,
          residence_status: formData.guarantor.residenceStatus || null,
          postal_address: formData.guarantor.postalAddress || null,
          code: formData.guarantor.code ? parseInt(formData.guarantor.code) : null,
          occupation: formData.guarantor.occupation || null,
          relationship: formData.guarantor.relationship || null,
          date_of_birth: formData.guarantor.dateOfBirth || null,
          county: formData.guarantor.county || null,
          city_town: formData.guarantor.cityTown || null,
          passport_url: guarantorPassportUrl,
          id_front_url: guarantorIdFrontUrl,
          id_back_url: guarantorIdBackUrl,
        };

        if (existingGuarantor) {
          console.log("🔄 Updating existing guarantor:", existingGuarantor.id);
          const { error: guarantorError } = await supabase
            .from("guarantors")
            .update(guarantorData)
            .eq("id", existingGuarantor.id);

          if (guarantorError) throw guarantorError;
          console.log("✅ Guarantor updated successfully");
        } else {
          console.log("➕ Creating new guarantor");
          const { error: guarantorError } = await supabase
            .from("guarantors")
            .insert({ ...guarantorData, customer_id: customerId });

          if (guarantorError) throw guarantorError;
          console.log("✅ Guarantor created successfully");
        }
      }

      // Update or create next of kin
      if (formData.nextOfKin && (formData.nextOfKin.Firstname || formData.nextOfKin.Surname)) {
        console.log("👨‍👩‍👧‍👦 Processing next of kin...");
        
        // Check if next of kin already exists
        const { data: existingNextOfKin, error: nextOfKinCheckError } = await supabase
          .from("next_of_kin")
          .select("id")
          .eq("customer_id", customerId)
          .single();

        if (nextOfKinCheckError && nextOfKinCheckError.code !== 'PGRST116') {
          console.error("❌ Error checking existing next of kin:", nextOfKinCheckError);
          throw nextOfKinCheckError;
        }

        const nextOfKinData = {
          Firstname: formData.nextOfKin.Firstname || null,
          Surname: formData.nextOfKin.Surname || null,
          Middlename: formData.nextOfKin.Middlename || null,
          id_number: formData.nextOfKin.idNumber || null,
          relationship: formData.nextOfKin.relationship || null,
          mobile: formData.nextOfKin.mobile || null,
          alternative_number: formData.nextOfKin.alternativeNumber || null,
          employment_status: formData.nextOfKin.employmentStatus || null,
          county: formData.nextOfKin.county || null,
          city_town: formData.nextOfKin.cityTown || null,
        };

        if (existingNextOfKin) {
          console.log("🔄 Updating existing next of kin:", existingNextOfKin.id);
          const { error: nextOfKinError } = await supabase
            .from("next_of_kin")
            .update(nextOfKinData)
            .eq("id", existingNextOfKin.id);

          if (nextOfKinError) throw nextOfKinError;
          console.log("✅ Next of kin updated successfully");
        } else {
          console.log("➕ Creating new next of kin");
          const { error: nextOfKinError } = await supabase
            .from("next_of_kin")
            .insert({ ...nextOfKinData, customer_id: customerId });

          if (nextOfKinError) throw nextOfKinError;
          console.log("✅ Next of kin created successfully");
        }
      }

      // Update or create loan information
      if (formData.loan && formData.loan.prequalifiedAmount) {
        console.log("💰 Processing loan information...");
        
        // Check if loan already exists
        const { data: existingLoan, error: loanCheckError } = await supabase
          .from("loans")
          .select("id")
          .eq("customer_id", customerId)
          .single();

        if (loanCheckError && loanCheckError.code !== 'PGRST116') {
          console.error("❌ Error checking existing loan:", loanCheckError);
          throw loanCheckError;
        }

        const loanData = {
          prequalified_amount: parseFloat(formData.loan.prequalifiedAmount) || null,
        };

        if (existingLoan) {
          console.log("🔄 Updating existing loan:", existingLoan.id);
          const { error: loanError } = await supabase
            .from("loans")
            .update(loanData)
            .eq("id", existingLoan.id);

          if (loanError) throw loanError;
          console.log("✅ Loan updated successfully");
        } else {
          console.log("➕ Creating new loan");
          const { error: loanError } = await supabase
            .from("loans")
            .insert({ ...loanData, customer_id: customerId });

          if (loanError) throw loanError;
          console.log("✅ Loan created successfully");
        }
      }

      // Handle security items
      if (securityItems.length > 0) {
        console.log("🔒 Processing security items...");
        
        // First, delete existing security items and their images
        const { error: deleteSecurityError } = await supabase
          .from("security_items")
          .delete()
          .eq("customer_id", customerId);

        if (deleteSecurityError) {
          console.error("❌ Error deleting existing security items:", deleteSecurityError);
          throw deleteSecurityError;
        }
        console.log("🗑️ Existing security items deleted");

        // Insert updated security items
        const securityItemsToInsert = securityItems
          .filter(item => item.item || item.description || item.identification || item.value)
          .map(item => ({
            customer_id: customerId,
            item: item.item || null,
            description: item.description || null,
            identification: item.identification || null,
            value: item.value ? parseFloat(item.value) : null,
          }));

        if (securityItemsToInsert.length > 0) {
          console.log("➕ Inserting security items:", securityItemsToInsert.length);
          const { data: insertedSecurityItems, error: securityError } = await supabase
            .from("security_items")
            .insert(securityItemsToInsert)
            .select("id");

          if (securityError) {
            console.error("❌ Error inserting security items:", securityError);
            throw securityError;
          }
          console.log("✅ Security items inserted:", insertedSecurityItems);

          // Handle security item images if any
          for (let i = 0; i < securityItemImages.length; i++) {
            if (insertedSecurityItems[i] && securityItemImages[i] && securityItemImages[i].length > 0) {
              console.log(`🖼️ Processing images for security item ${i}:`, securityItemImages[i].length);
              
              const securityId = insertedSecurityItems[i].id;
              const files = securityItemImages[i];
              const urls = [];
              
              for (const file of files) {
                const url = await uploadFile(file, `borrower_security/${Date.now()}_${file.name}`);
                if (url) urls.push(url);
              }
              
              if (urls.length > 0) {
                const { error: secImgError } = await supabase
                  .from("security_item_images")
                  .insert(urls.map(url => ({ security_item_id: securityId, image_url: url })));
                
                if (secImgError) {
                  console.error("❌ Error inserting security item images:", secImgError);
                  throw secImgError;
                }
                console.log(`✅ ${urls.length} images uploaded for security item ${i}`);
              }
            }
          }
        }
      } else {
        console.log("🗑️ Removing all existing security items (none provided)");
        const { error: deleteSecurityError } = await supabase
          .from("security_items")
          .delete()
          .eq("customer_id", customerId);

        if (deleteSecurityError) console.error("❌ Error deleting security items:", deleteSecurityError);
      }

      // Handle guarantor security items
      if (guarantorSecurityItems.length > 0) {
        console.log("🔐 Processing guarantor security items...");
        
        // Get guarantor ID
        const { data: guarantorData, error: guarantorFetchError } = await supabase
          .from("guarantors")
          .select("id")
          .eq("customer_id", customerId)
          .single();

        if (guarantorFetchError) {
          console.error("❌ Error fetching guarantor ID:", guarantorFetchError);
          throw guarantorFetchError;
        }

        if (guarantorData) {
          console.log("👤 Found guarantor ID:", guarantorData.id);
          
          // First, delete existing guarantor security items
          const { error: deleteGuarantorSecurityError } = await supabase
            .from("guarantor_security")
            .delete()
            .eq("guarantor_id", guarantorData.id);

          if (deleteGuarantorSecurityError) {
            console.error("❌ Error deleting guarantor security:", deleteGuarantorSecurityError);
            throw deleteGuarantorSecurityError;
          }
          console.log("🗑️ Existing guarantor security items deleted");

          // Insert updated guarantor security items
          const guarantorSecurityItemsToInsert = guarantorSecurityItems
            .filter(item => item.item || item.description || item.identification || item.value)
            .map(item => ({
              guarantor_id: guarantorData.id,
              item: item.item || null,
              description: item.description || null,
              identification: item.identification || null,
              estimated_market_value: item.value ? parseFloat(item.value) : null,
            }));

          if (guarantorSecurityItemsToInsert.length > 0) {
            console.log("➕ Inserting guarantor security items:", guarantorSecurityItemsToInsert.length);
            const { data: insertedGuarantorSecurityItems, error: guarantorSecurityError } = await supabase
              .from("guarantor_security")
              .insert(guarantorSecurityItemsToInsert)
              .select("id");

            if (guarantorSecurityError) {
              console.error("❌ Error inserting guarantor security:", guarantorSecurityError);
              throw guarantorSecurityError;
            }
            console.log("✅ Guarantor security items inserted:", insertedGuarantorSecurityItems);

            // Handle guarantor security item images if any
            for (let i = 0; i < guarantorSecurityImages.length; i++) {
              if (insertedGuarantorSecurityItems[i] && guarantorSecurityImages[i] && guarantorSecurityImages[i].length > 0) {
                console.log(`🖼️ Processing images for guarantor security item ${i}:`, guarantorSecurityImages[i].length);
                
                const securityId = insertedGuarantorSecurityItems[i].id;
                const files = guarantorSecurityImages[i];
                const urls = [];
                
                for (const file of files) {
                  const url = await uploadFile(file, `guarantor_security/${Date.now()}_${file.name}`);
                  if (url) urls.push(url);
                }
                
                if (urls.length > 0) {
                  const { error: gSecImgError } = await supabase
                    .from("guarantor_security_images")
                    .insert(urls.map(url => ({ guarantor_security_id: securityId, image_url: url })));
                  
                  if (gSecImgError) {
                    console.error("❌ Error inserting guarantor security images:", gSecImgError);
                    throw gSecImgError;
                  }
                  console.log(`✅ ${urls.length} images uploaded for guarantor security item ${i}`);
                }
              }
            }
          }
        }
      }

      // Handle business images
      if (businessImages.length > 0) {
        console.log("🏢 Processing business images...");
        
        // First, delete existing business images
        const { error: deleteBusinessImagesError } = await supabase
          .from("business_images")
          .delete()
          .eq("customer_id", customerId);

        if (deleteBusinessImagesError) {
          console.error("❌ Error deleting business images:", deleteBusinessImagesError);
          throw deleteBusinessImagesError;
        }
        console.log("🗑️ Existing business images deleted");

        // Upload and insert new business images
        const businessImageUrls = [];
        for (const image of businessImages) {
          const url = await uploadFile(image, `business/${Date.now()}_${image.name}`);
          if (url) businessImageUrls.push(url);
        }
        
        if (businessImageUrls.length > 0) {
          const { error: businessImageError } = await supabase
            .from("business_images")
            .insert(businessImageUrls.map(url => ({ customer_id: customerId, image_url: url })));
          
          if (businessImageError) {
            console.error("❌ Error inserting business images:", businessImageError);
            throw businessImageError;
          }
          console.log(`✅ ${businessImageUrls.length} business images uploaded`);
        }
      }

      console.log("🎉 All updates completed successfully!");
      toast.success("Customer information updated successfully!");
      onClose();
      
    } catch (error) {
      console.error("❌ Error updating customer:", error);
      toast.error(`Failed to update customer information: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      console.log("🏁 Form submission process completed");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            <span className="ml-3 text-lg">Loading customer data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Navigation tabs
  const navItems = [
    { id: "personal", label: "Personal Info" },
    { id: "business", label: "Business Info" },
    { id: "borrowerSecurity", label: "Borrower Security" },
    { id: "loan", label: "Loan Details" },
    { id: "guarantor", label: "Guarantor" },
    { id: "guarantorSecurity", label: "Guarantor Security" },
    { id: "nextOfKin", label: "Next of Kin" },
    { id: "documents", label: "Documents" },
  ];

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 z-50">
    <div className="bg-white w-full h-full rounded-none shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-green-600">Edit Customer Information</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 text-xl font-bold"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* Show validation errors */}
        {Object.keys(errors).length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
            <ul className="text-red-600 text-sm space-y-1">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>• {message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto p-4 border-b">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`px-4 py-2 mr-2 rounded-lg font-medium whitespace-nowrap ${
                activeSection === item.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form className="p-6 max-h-96 overflow-y-auto">
          {/* PERSONAL DETAILS */}
          {activeSection === "personal" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Personal Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prefix */}
                <div>
                  <label className="block text-sm font-medium mb-1">Prefix</label>
                  <select
                    name="prefix"
                    value={formData.prefix}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select Prefix</option>
                    <option>Mr</option>
                    <option>Mrs</option>
                    <option>Ms</option>
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    name="Firstname"
                    value={formData.Firstname}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.Firstname ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.Firstname && <span className="text-red-500 text-xs">{errors.Firstname}</span>}
                </div>

                {/* Middle Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Middle Name</label>
                  <input
                    type="text"
                    name="Middlename"
                    value={formData.Middlename}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Surname */}
                <div>
                  <label className="block text-sm font-medium mb-1">Surname *</label>
                  <input
                    type="text"
                    name="Surname"
                    value={formData.Surname}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.Surname ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.Surname && <span className="text-red-500 text-xs">{errors.Surname}</span>}
                </div>

                {/* Mobile Number (read-only) */}
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    className="w-full p-2 border rounded-md bg-gray-100"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
                </div>

                {/* Alternative Mobile */}
                <div>
                  <label className="block text-sm font-medium mb-1">Alternative Mobile</label>
                  <input
                    type="text"
                    name="alternativeMobile"
                    value={formData.alternativeMobile}
                    onChange={handleChange}
                   className="w-full p-2 border rounded-md bg-gray-100"
                   readOnly
                    disabled
                  />
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">ID Number *</label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
            
className="w-full p-2 border rounded-md bg-gray-100"                    readOnly
                    disabled
                  />
                  {errors.idNumber && <span className="text-red-500 text-xs">{errors.idNumber}</span>}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select Marital Status</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Separated/Divorced</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Residence Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Residence Status</label>
                  <select
                    name="residenceStatus"
                    value={formData.residenceStatus}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Residence Status</option>
                    <option>Own</option>
                    <option>Rent</option>
                    <option>Family</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium mb-1">Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Postal Address */}
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Address</label>
                  <input
                    type="text"
                    name="postalAddress"
                    value={formData.postalAddress}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input
                    type="number"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Town */}
                <div>
                  <label className="block text-sm font-medium mb-1">Town / City</label>
                  <input
                    type="text"
                    name="town"
                    value={formData.town}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* County */}
                <div>
                  <label className="block text-sm font-medium mb-1">County</label>
                  <input
                    type="text"
                    name="county"
                    value={formData.county}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Upload Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "passport", label: "Passport Photo", handler: setPassportFile, preview: previews.passport, existing: existingImages.passport },
                    { key: "idFront", label: "ID Front", handler: setIdFrontFile, preview: previews.idFront, existing: existingImages.idFront },
                    { key: "idBack", label: "ID Back", handler: setIdBackFile, preview: previews.idBack, existing: existingImages.idBack },
                    { key: "house", label: "House Image", handler: setHouseImageFile, preview: previews.house, existing: existingImages.house },
                  ].map((file) => (
                    <div key={file.key} className="border p-3 rounded-md">
                      <label className="block text-sm font-medium mb-2">{file.label}</label>
                      <div className="flex gap-2 mb-2">
                        <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded cursor-pointer">
                          <Upload size={16} />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, file.handler, file.key)}
                            className="hidden"
                          />
                        </label>
                        <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-600 text-white rounded cursor-pointer">
                          <Camera size={16} />
                          Camera
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleFileUpload(e, file.handler, file.key)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {(file.preview || file.existing) && (
                        <div className="mt-2 relative">
                          <img
                            src={file.preview || file.existing}
                            alt={file.label}
                            className="w-full h-32 object-contain border rounded"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.key, file.handler)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                          >
                            <XIcon size={16} />
                          </button>
                        </div>
                      )}

          {/* DOCUMENTS */}
          {activeSection === "documents" && (
            <section className="bg-green-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2 border-b border-green-200 pb-3">
                <span className="w-1 h-5 bg-green-600 rounded-full"></span>
                Document Verification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: "First Officer and Client Image", handler: setOfficerClientImage1, state: officerClientImage1, existing: existingImages.officerClient1 },
                  { label: "Second Officer and Client Image", handler: setOfficerClientImage2, state: officerClientImage2, existing: existingImages.officerClient2 },
                  { label: "Both Officers Image", handler: setBothOfficersImage, state: bothOfficersImage, existing: existingImages.bothOfficers },
                ].map((file, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition"
                  >
                    <label className="block text-sm font-medium text-green-800 mb-3">
                      {file.label}
                    </label>

                    {/* Upload / Camera Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-row lg:justify-between">
                      {/* Upload */}
                      <label className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg shadow-sm cursor-pointer hover:bg-green-200 transition">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm font-medium">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const selectedFile = e.target.files[0];
                            if (selectedFile) {
                              console.log(`📎 Document file selected: ${file.label}`, selectedFile.name);
                              file.handler(selectedFile);
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {/* Camera */}
                      <label className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm cursor-pointer hover:bg-green-700 transition">
                        <Camera className="w-5 h-5" />
                        <span className="text-sm font-medium">Camera</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const selectedFile = e.target.files[0];
                            if (selectedFile) {
                              console.log(`📷 Document captured: ${file.label}`, selectedFile.name);
                              file.handler(selectedFile);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Preview - Show new file or existing image */}
                    {(file.state || file.existing) && (
                      <div className="mt-4 relative w-full">
                        <img
                          src={file.state ? URL.createObjectURL(file.state) : file.existing}
                          alt={`${file.label} Preview`}
                          className="w-full h-40 object-cover rounded-lg border border-green-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            console.log(`🗑️ Removing document: ${file.label}`);
                            file.handler(null);
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Show status */}
                    <div className="mt-2 text-xs text-gray-600">
                      {file.state ? 
                        <span className="text-blue-600">New file selected</span> : 
                        file.existing ? 
                        <span className="text-green-600">Existing image</span> : 
                        <span className="text-gray-400">No image uploaded</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BUSINESS INFORMATION */}
          {activeSection === "business" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Business Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Business Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Business Type</label>
                  <input
                    type="text"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. Retail, Wholesale"
                  />
                </div>

                {/* Year Established */}
                <div>
                  <label className="block text-sm font-medium mb-1">Year Established</label>
                  <input
                    type="date"
                    name="yearEstablished"
                    value={formData.yearEstablished}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Daily Sales */}
                <div>
                  <label className="block text-sm font-medium mb-1">Daily Sales (KES)</label>
                  <input
                    type="number"
                    name="daily_Sales"
                    value={formData.daily_Sales}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Business Location */}
                <div>
                  <label className="block text-sm font-medium mb-1">Business Location</label>
                  <input
                    type="text"
                    name="businessLocation"
                    value={formData.businessLocation}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Road */}
                <div>
                  <label className="block text-sm font-medium mb-1">Road</label>
                  <input
                    type="text"
                    name="road"
                    value={formData.road}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Landmark */}
                <div>
                  <label className="block text-sm font-medium mb-1">Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. Mosque"
                  />
                </div>

                {/* Local Authority License */}
                <div>
                  <label className="block text-sm font-medium mb-1">Local Authority License</label>
                  <select
                    name="hasLocalAuthorityLicense"
                    value={formData.hasLocalAuthorityLicense}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Have Local Authority Licence?</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Business Images Upload */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Business Images</h4>
                <div className="border p-3 rounded-md">
                  <div className="flex gap-2 mb-2">
                    <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded cursor-pointer">
                      <Upload size={16} />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleMultipleFiles(e, setBusinessImages)}
                        className="hidden"
                      />
                    </label>
                    <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-600 text-white rounded cursor-pointer">
                      <Camera size={16} />
                      Camera
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={(e) => handleMultipleFiles(e, setBusinessImages)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {/* Existing Business Images */}
                  {existingImages.business.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">Existing Images:</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {existingImages.business.map((img, index) => (
                          <div key={index} className="relative">
                            <img src={img} alt={`Business ${index + 1}`} className="w-full h-24 object-cover rounded border" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* New Business Images */}
                  {businessImages.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">New Images:</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {businessImages.map((img, index) => (
                          <div key={index} className="relative">
                            <img src={URL.createObjectURL(img)} alt={`New Business ${index + 1}`} className="w-full h-24 object-cover rounded border" />
                            <button
                              type="button"
                              onClick={() => handleRemoveBusinessImage(index)}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                            >
                              <XIcon size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BORROWER SECURITY */}
          {activeSection === "borrowerSecurity" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Borrower Security</h3>
              
              {securityItems.map((item, index) => (
                <div key={index} className="border p-4 rounded-md">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Security Item {index + 1}</h4>
                    {securityItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSecurityItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Item</label>
                      <input
                        type="text"
                        name="item"
                        value={item.item}
                        onChange={(e) => handleSecurityChange(e, index)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <input
                        type="text"
                        name="description"
                        value={item.description}
                        onChange={(e) => handleSecurityChange(e, index)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Identification</label>
                      <input
                        type="text"
                        name="identification"
                        value={item.identification}
                        onChange={(e) => handleSecurityChange(e, index)}
                        className="w-full p-2 border rounded-md"
                        placeholder="e.g. Serial No."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Est. Market Value (KES)</label>
                      <input
                        type="number"
                        name="value"
                        value={item.value}
                        onChange={(e) => handleSecurityChange(e, index)}
                        className={`w-full p-2 border rounded-md ${errors[`security_${index}_value`] ? 'border-red-500' : ''}`}
                        min="0"
                        step="0.01"
                      />
                      {errors[`security_${index}_value`] && (
                        <span className="text-red-500 text-xs">{errors[`security_${index}_value`]}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Security Item Images */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Item Images</label>
                    <div className="flex gap-2 mb-2">
                      <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded cursor-pointer">
                        <Upload size={16} />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            const newImages = [...(securityItemImages[index] || []), ...files];
                            const updatedImages = [...securityItemImages];
                            updatedImages[index] = newImages;
                            setSecurityItemImages(updatedImages);
                            console.log(`Added ${files.length} images to security item ${index}`);
                          }}
                          className="hidden"
                        />
                      </label>
                      <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-600 text-white rounded cursor-pointer">
                        <Camera size={16} />
                        Camera
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            const newImages = [...(securityItemImages[index] || []), ...files];
                            const updatedImages = [...securityItemImages];
                            updatedImages[index] = newImages;
                            setSecurityItemImages(updatedImages);
                            console.log(`Added ${files.length} camera images to security item ${index}`);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    {/* Security Item Images Preview */}
                    {securityItemImages[index] && securityItemImages[index].length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {securityItemImages[index].map((img, imgIndex) => (
                          <div key={imgIndex} className="relative">
                            <img 
                              src={typeof img === 'string' ? img : URL.createObjectURL(img)} 
                              alt={`Security ${index + 1} - Image ${imgIndex + 1}`} 
                              className="w-full h-24 object-cover rounded border" 
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...securityItemImages];
                                updated[index] = updated[index].filter((_, i) => i !== imgIndex);
                                setSecurityItemImages(updated);
                                console.log(`Removed image ${imgIndex} from security item ${index}`);
                              }}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
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
              
              <button
                type="button"
                onClick={addSecurityItem}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                + Add Security Item
              </button>
            </div>
          )}

          {/* LOAN INFORMATION */}
          {activeSection === "loan" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Loan Information</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pre-qualified Amount (KES)</label>
                  <input
                    type="number"
                    name="prequalifiedAmount"
                    value={formData.prequalifiedAmount}
                    onChange={handleLoanChange}
                    className="w-full p-2 border rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GUARANTOR DETAILS */}
          {activeSection === "guarantor" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Guarantor Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guarantor Prefix */}
                <div>
                  <label className="block text-sm font-medium mb-1">Prefix</label>
                  <select
                    name="prefix"
                    value={formData.guarantor.prefix}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select Prefix</option>
                    <option>Mr</option>
                    <option>Mrs</option>
                    <option>Ms</option>
                  </select>
                </div>

                {/* Guarantor First Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    name="Firstname"
                    value={formData.guarantor.Firstname}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Guarantor Middle Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Middle Name</label>
                  <input
                    type="text"
                    name="Middlename"
                    value={formData.guarantor.Middlename}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Guarantor Surname */}
                <div>
                  <label className="block text-sm font-medium mb-1">Surname</label>
                  <input
                    type="text"
                    name="Surname"
                    value={formData.guarantor.Surname}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Guarantor ID Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">ID Number</label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.guarantor.idNumber}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Guarantor Mobile */}
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile Number</label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.guarantor.mobile}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Guarantor Date of Birth */}
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.guarantor.dateOfBirth}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Guarantor Gender */}
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.guarantor.gender}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>

                {/* Guarantor Marital Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={formData.guarantor.maritalStatus}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select Marital Status</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Separated/Divorced</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Guarantor Residence Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Residence Status</label>
                  <select
                    name="residenceStatus"
                    value={formData.guarantor.residenceStatus}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Residence Status</option>
                    <option>Own</option>
                    <option>Rent</option>
                    <option>Family</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Guarantor Occupation */}
                <div>
                  <label className="block text-sm font-medium mb-1">Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.guarantor.occupation}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Guarantor Relationship */}
                <div>
                  <label className="block text-sm font-medium mb-1">Relationship</label>
                  <input
                    type="text"
                    name="relationship"
                    value={formData.guarantor.relationship}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. Spouse, Friend"
                  />
                </div>

                {/* Guarantor Postal Address */}
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Address</label>
                  <input
                    type="text"
                    name="postalAddress"
                    value={formData.guarantor.postalAddress}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Guarantor Code */}
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input
                    type="number"
                    name="code"
                    value={formData.guarantor.code}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Guarantor County */}
                <div>
                  <label className="block text-sm font-medium mb-1">County</label>
                  <input
                    type="text"
                    name="county"
                    value={formData.guarantor.county}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Guarantor City/Town */}
                <div>
                  <label className="block text-sm font-medium mb-1">City/Town</label>
                  <input
                    type="text"
                    name="cityTown"
                    value={formData.guarantor.cityTown}
                    onChange={(e) => handleNestedChange(e, "guarantor")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              {/* Guarantor File Uploads */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Guarantor Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "guarantorPassport", label: "Guarantor Passport", handler: setGuarantorPassportFile, preview: previews.guarantorPassport, existing: existingImages.guarantorPassport },
                    { key: "guarantorIdFront", label: "Guarantor ID Front", handler: setGuarantorIdFrontFile, preview: previews.guarantorIdFront, existing: existingImages.guarantorIdFront },
                    { key: "guarantorIdBack", label: "Guarantor ID Back", handler: setGuarantorIdBackFile, preview: previews.guarantorIdBack, existing: existingImages.guarantorIdBack },
                  ].map((file) => (
                    <div key={file.key} className="border p-3 rounded-md">
                      <label className="block text-sm font-medium mb-2">{file.label}</label>
                      <div className="flex gap-2 mb-2">
                        <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded cursor-pointer">
                          <Upload size={16} />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, file.handler, file.key)}
                            className="hidden"
                          />
                        </label>
                        <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-600 text-white rounded cursor-pointer">
                          <Camera size={16} />
                          Camera
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleFileUpload(e, file.handler, file.key)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {(file.preview || file.existing) && (
                        <div className="mt-2 relative">
                          <img
                            src={file.preview || file.existing}
                            alt={file.label}
                            className="w-full h-32 object-contain border rounded"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.key, file.handler)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
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

          {/* GUARANTOR SECURITY */}
          {activeSection === "guarantorSecurity" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Guarantor Security</h3>
              
              {guarantorSecurityItems.map((item, index) => (
                <div key={index} className="border p-4 rounded-md">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Guarantor Security Item {index + 1}</h4>
                    {guarantorSecurityItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGuarantorSecurityItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Item</label>
                      <input
                        type="text"
                        name="item"
                        value={item.item}
                        onChange={(e) => handleGuarantorSecurityChange(e, index)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <input
                        type="text"
                        name="description"
                        value={item.description}
                        onChange={(e) => handleGuarantorSecurityChange(e, index)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Identification</label>
                      <input
                        type="text"
                        name="identification"
                        value={item.identification}
                        onChange={(e) => handleGuarantorSecurityChange(e, index)}
                        className="w-full p-2 border rounded-md"
                        placeholder="e.g. Serial No."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Est. Market Value (KES)</label>
                      <input
                        type="number"
                        name="value"
                        value={item.value}
                        onChange={(e) => handleGuarantorSecurityChange(e, index)}
                        className={`w-full p-2 border rounded-md ${errors[`guarantor_security_${index}_value`] ? 'border-red-500' : ''}`}
                        min="0"
                        step="0.01"
                      />
                      {errors[`guarantor_security_${index}_value`] && (
                        <span className="text-red-500 text-xs">{errors[`guarantor_security_${index}_value`]}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Guarantor Security Item Images */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Item Images</label>
                    <div className="flex gap-2 mb-2">
                      <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded cursor-pointer">
                        <Upload size={16} />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            const newImages = [...(guarantorSecurityImages[index] || []), ...files];
                            const updatedImages = [...guarantorSecurityImages];
                            updatedImages[index] = newImages;
                            setGuarantorSecurityImages(updatedImages);
                            console.log(`Added ${files.length} images to guarantor security item ${index}`);
                          }}
                          className="hidden"
                        />
                      </label>
                      <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-600 text-white rounded cursor-pointer">
                        <Camera size={16} />
                        Camera
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            const newImages = [...(guarantorSecurityImages[index] || []), ...files];
                            const updatedImages = [...guarantorSecurityImages];
                            updatedImages[index] = newImages;
                            setGuarantorSecurityImages(updatedImages);
                            console.log(`Added ${files.length} camera images to guarantor security item ${index}`);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    {/* Guarantor Security Item Images Preview */}
                    {guarantorSecurityImages[index] && guarantorSecurityImages[index].length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {guarantorSecurityImages[index].map((img, imgIndex) => (
                          <div key={imgIndex} className="relative">
                            <img 
                              src={typeof img === 'string' ? img : URL.createObjectURL(img)} 
                              alt={`Guarantor Security ${index + 1} - Image ${imgIndex + 1}`} 
                              className="w-full h-24 object-cover rounded border" 
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...guarantorSecurityImages];
                                updated[index] = updated[index].filter((_, i) => i !== imgIndex);
                                setGuarantorSecurityImages(updated);
                                console.log(`Removed image ${imgIndex} from guarantor security item ${index}`);
                              }}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
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
              
              <button
                type="button"
                onClick={addGuarantorSecurityItem}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                + Add Guarantor Security Item
              </button>
            </div>
          )}

          {/* NEXT OF KIN */}
          {activeSection === "nextOfKin" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Next of Kin Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Next of Kin First Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    name="Firstname"
                    value={formData.nextOfKin.Firstname}
                    onChange={(e) => handleNestedChange(e, "nextOfKin")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Next of Kin Middle Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Middle Name</label>
                  <input
                    type="text"
                    name="Middlename"
                    value={formData.nextOfKin.Middlename}
                    onChange={(e) => handleNestedChange(e, "nextOfKin")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Next of Kin Surname */}
                <div>
                  <label className="block text-sm font-medium mb-1">Surname</label>
                  <input
                    type="text"
                    name="Surname"
                    value={formData.nextOfKin.Surname}
                    onChange={(e) => handleNestedChange(e, "nextOfKin")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Next of Kin ID Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">ID Number</label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.nextOfKin.idNumber}
                    onChange={(e) => handleNestedChange(e, "nextOfKin")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Next of Kin Relationship */}
                <div>
                  <label className="block text-sm font-medium mb-1">Relationship</label>
                  <input
                    type="text"
                    name="relationship"
                    value={formData.nextOfKin.relationship}
                    onChange={(e) => handleNestedChange(e, "nextOfKin")}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. Brother, Sister"
                  />
                </div>

                {/* Next of Kin Mobile */}
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile Number</label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.nextOfKin.mobile}
                    onChange={(e) => handleNestedChange(e, "nextOfKin")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Next of Kin Alternative Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">Alternative Number</label>
                  <input
                    type="text"
                    name="alternativeNumber"
                    value={formData.nextOfKin.alternativeNumber}
                    onChange={(e) => handleNestedChange(e, "nextOfKin")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Next of Kin Employment Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Employment Status</label>
                  <select
                    name="employmentStatus"
                    value={formData.nextOfKin.employmentStatus}
                    onChange={(e) => handleNestedChange(e, "nextOfKin")}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select Employment Status</option>
                    <option>Employed</option>
                    <option>Self Employed</option>
                    <option>Unemployed</option>
                    <option>Student</option>
                    <option>Retired</option>
                  </select>
                </div>

                {/* Next of Kin County */}
                <div>
                  <label className="block text-sm font-medium mb-1">County</label>
                  <input
                    type="text"
                    name="county"
                    value={formData.nextOfKin.county}
                    onChange={(e) => handleNestedChange(e, "nextOfKin")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Next of Kin City/Town */}
                <div>
                  <label className="block text-sm font-medium mb-1">City/Town</label>
                  <input
                    type="text"
                    name="cityTown"
                    value={formData.nextOfKin.cityTown}
                    onChange={(e) => handleNestedChange(e, "nextOfKin")}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
            </div>
          )}



{/* DOCUMENTS */}
{activeSection === "documents" && (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold mb-4">Document Verification</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { 
          key: "officerClient1", 
          label: "First Officer & Client", 
          documentType: "First Officer and Client Image",
          handler: setOfficerClientImage1, 
          preview: previews.officerClient1, 
          existing: existingImages.officerClient1 
        },
        { 
          key: "officerClient2", 
          label: "Second Officer & Client", 
          documentType: "Second Officer and Client Image",
          handler: setOfficerClientImage2, 
          preview: previews.officerClient2, 
          existing: existingImages.officerClient2 
        },
        { 
          key: "bothOfficers", 
          label: "Both Officers", 
          documentType: "Both Officers Image",
          handler: setBothOfficersImage, 
          preview: previews.bothOfficers, 
          existing: existingImages.bothOfficers 
        },
      ].map((file) => {
        // Find the document data for this type
        const documentData = formData.documents?.find(doc => 
          doc.type === file.documentType
        );
        
        return (
          <div key={file.key} className="border p-3 rounded-md">
            <label className="block text-sm font-medium mb-2">{file.label}</label>
            <div className="flex gap-2 mb-2">
              <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded cursor-pointer">
                <Upload size={16} />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, file.handler, file.key)}
                  className="hidden"
                />
              </label>
              <label className="flex items-center justify-center gap-1 px-3 py-1 bg-green-600 text-white rounded cursor-pointer">
                <Camera size={16} />
                Camera
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileUpload(e, file.handler, file.key)}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Show existing image if available */}
            {(file.existing || documentData?.url) && !file.preview && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Existing Image:</p>
                <div className="relative">
                  <img
                    src={file.existing || documentData.url}
                    alt={file.label}
                    className="w-full h-32 object-contain border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // You might want to implement a delete function for existing images
                      console.log(`Remove existing image for ${file.key}`);
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Show new preview if uploaded */}
            {file.preview && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">New Image:</p>
                <div className="relative">
                  <img
                    src={file.preview}
                    alt={file.label}
                    className="w-full h-32 object-contain border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.key, file.handler)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Show message if no image exists */}
            {!file.existing && !documentData?.url && !file.preview && (
              <div className="mt-4 text-center text-gray-500 text-sm">
                No image uploaded yet
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}


          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditAmendment;