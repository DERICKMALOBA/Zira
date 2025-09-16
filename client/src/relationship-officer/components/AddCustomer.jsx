import { useState } from "react";
import { supabase } from "../../supabaseClient";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { Upload, Camera, XIcon } from "lucide-react";

const AddCustomer = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState("personal");
  const [securityItems, setSecurityItems] = useState([
    { item: "", description: "", identification: "", value: "" },
  ]);
  const [guarantorSecurityItems, setGuarantorSecurityItems] = useState([
    { item: "", description: "", identification: "", value: "" },
  ]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      loan: { prequalifiedAmount: ""}, 

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
  const [officerClientImage1, setOfficerClientImage1] = useState(null);
  const [officerClientImage2, setOfficerClientImage2] = useState(null);
  const [bothOfficersImage, setBothOfficersImage] = useState(null);
  const [files, setFiles] = useState({});
const [previews, setPreviews] = useState({});

const validatePersonalDetails = async () => {
  const newErrors = {};

  if (!formData.Firstname) newErrors.Firstname = "First name is required";
  if (!formData.Surname) newErrors.Surname = "Surname is required";
  if (!formData.mobile) newErrors.mobile = "Mobile number is required";
  if (!formData.idNumber) newErrors.idNumber = "ID number is required";

  if (
    formData.mobile &&
    !/^[0-9]{10,15}$/.test(formData.mobile.replace(/\D/g, ""))
  ) {
    newErrors.mobile = "Please enter a valid mobile number";
  }

  if (formData.idNumber && !/^[0-9]{6,12}$/.test(formData.idNumber)) {
    newErrors.idNumber = "Please enter a valid ID number";
  }

  if (formData.dateOfBirth && !isAtLeast18YearsOld(formData.dateOfBirth)) {
    newErrors.dateOfBirth = "Customer must be at least 18 years old";
  }

  // Check uniqueness for ID and mobile only at this stage
  if (formData.mobile && !newErrors.mobile) {
    const isMobileUnique = await checkUniqueValue(
      ["customers", "guarantors", "next_of_kin"],
      "mobile",
      formData.mobile
    );
    if (!isMobileUnique) {
      newErrors.mobile = "Mobile number already exists in our system";
    }
  }

  if (formData.idNumber && !newErrors.idNumber) {
    const isIdUnique = await checkUniqueValue(
      ["customers", "guarantors", "next_of_kin"],
      "id_number",
      formData.idNumber
    );
    if (!isIdUnique) {
      newErrors.idNumber = "ID number already exists in our system";
    }
  }

  setErrors(newErrors);

  // ✅ Return boolean for handleNext
  return Object.keys(newErrors).length === 0;
};

const validateBusinessDetails = () => {
  let errorsFound = {};

  // Business Name
  if (!formData.businessName) {
    errorsFound.businessName = "Business name is required";
  }

  // Business Type
  if (!formData.businessType) {
    errorsFound.businessType = "Business type is required";
  }

  // Year Established (>= 6 months)
  if (!formData.yearEstablished) {
    errorsFound.yearEstablished = "Year established is required";
  } else {
    const establishedDate = new Date(formData.yearEstablished);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (establishedDate > sixMonthsAgo) {
      errorsFound.yearEstablished = "Business must be at least 6 months old";
    }
  }

  // Business Location
  if (!formData.businessLocation) {
    errorsFound.businessLocation = "Business location is required";
  }

  // Road
  if (!formData.road) {
    errorsFound.road = "Road is required";
  }

  // Landmark
  if (!formData.landmark) {
    errorsFound.landmark = "Landmark is required";
  }

  // Daily Sales
  if (!formData.daily_Sales) {
    errorsFound.daily_Sales = "Daily sales estimate is required";
  }

  // // Local Authority License
  // if (formData.hasLocalAuthorityLicense === "" || formData.hasLocalAuthorityLicense == null) {
  //   errorsFound.hasLocalAuthorityLicense = "License status must be selected";
  // }

  // // Business Images
  // if (!files.businessImages || files.businessImages.length === 0) {
  //   errorsFound.businessImages = "At least one business image is required";
  // }

  setErrors(errorsFound);

  const isValid = Object.keys(errorsFound).length === 0;
  console.log("Business validation result:", isValid, errorsFound); // 👈 check here
  return isValid;
};


const validateBorrowerSecurity = () => {
  let errorsFound = {};
  let isValid = true;

  if (securityItems.length === 0) {
    toast.error("Please add at least one security item.");
    return false;
  }

  securityItems.forEach((item, index) => {
    // Item name
    if (!item.item) {
      errorsFound[`securityItem_${index}`] = "Item name is required";
      isValid = false;
    }

    // Description
    if (!item.description) {
      errorsFound[`securityDescription_${index}`] = "Description is required";
      isValid = false;
    }

    // Identification
    if (!item.identification) {
      errorsFound[`securityIdentification_${index}`] = "Identification is required";
      isValid = false;
    }

    // Value
    if (!item.value || parseFloat(item.value) <= 0) {
      errorsFound[`securityValue_${index}`] = "Estimated value must be greater than 0";
      isValid = false;
    }

    // Images
    if (!securityItemImages[index] || securityItemImages[index].length === 0) {
      toast.error(`Please upload at least one image for item #${index + 1}`);
      isValid = false;
    }
  });

  setErrors(errorsFound);
  return isValid;
};

const validateLoanDetails = () => {
  let errorsFound = {};
  let isValid = true;

  // Principal / Pre-qualified Amount
  if (!formData.loan.prequalifiedAmount || parseFloat(formData.loan.prequalifiedAmount) <= 0) {
    errorsFound.loanPrequalifiedamount = "Please enter a valid loan amount greater than 0";
    isValid = false;
  }

  // (Optional) Add other validations like interestRate, duration, processingFee if present

  setErrors(errorsFound);
  return isValid;
};

const validateGuarantorDetails = () => {
  let errorsFound = {};
  let isValid = true;

  const guarantor = formData.guarantor;

  // Firstname
  if (!guarantor.Firstname || guarantor.Firstname.trim() === "") {
    errorsFound.guarantorFirstname = "First Name is required";
    isValid = false;
  }

  // Surname
  if (!guarantor.Surname || guarantor.Surname.trim() === "") {
    errorsFound.guarantorSurname = "Surname is required";
    isValid = false;
  }

  // ID Number
  if (!guarantor.idNumber || guarantor.idNumber.trim() === "") {
    errorsFound.guarantorIdNumber = "ID Number is required";
    isValid = false;
  }

  // Phone
  if (!guarantor.phone || guarantor.phone.trim() === "") {
    errorsFound.guarantorPhone = "Phone Number is required";
    isValid = false;
  }

  // Gender
  if (!guarantor.gender || guarantor.gender.trim() === "") {
    errorsFound.guarantorGender = "Gender is required";
    isValid = false;
  }

  setErrors(errorsFound);
    console.log("Guarantor validation result:", isValid, errorsFound); // 👈 check here

  return isValid;
};

const validateGuarantorSecurity = () => {
  let isValid = true;
  let errorsFound = {};

  guarantorSecurityItems.forEach((item, index) => {
    if (!item.item || item.item.trim() === "") {
      errorsFound[`guarantorSecurityItem_${index}`] = "Item is required";
      isValid = false;
    }
    if (!item.description || item.description.trim() === "") {
      errorsFound[`guarantorSecurityDescription_${index}`] = "Description is required";
      isValid = false;
    }
    if (!item.identification || item.identification.trim() === "") {
      errorsFound[`guarantorSecurityIdentification_${index}`] = "Identification is required";
      isValid = false;
    }
    if (item.value === "" || item.value === null || isNaN(item.value) || Number(item.value) <= 0) {
      errorsFound[`guarantorSecurityValue_${index}`] = "Valid Value is required";
      isValid = false;
    }
  });

  setErrors(errorsFound);
  return isValid;
};

const validateNextOfKinDetails = () => {
  let isValid = true;
  let errorsFound = {};

  const nextOfKin = formData.nextOfKin;

  // Validate First Name
  if (!nextOfKin.Firstname || nextOfKin.Firstname.trim() === "") {
    errorsFound.nextOfKinFirstname = "First Name is required";
    isValid = false;
  }

  // Validate Surname
  if (!nextOfKin.Surname || nextOfKin.Surname.trim() === "") {
    errorsFound.nextOfKinSurname = "Surname is required";
    isValid = false;
  }

  // Validate ID Number
  if (!nextOfKin.idNumber || nextOfKin.idNumber.trim() === "") {
    errorsFound.nextOfKinIdNumber = "ID Number is required";
    isValid = false;
  }

  // Validate Mobile Number
  if (!nextOfKin.mobile || nextOfKin.mobile.trim() === "") {
    errorsFound.nextOfKinMobile = "Mobile Number is required";
    isValid = false;
  }

  setErrors(errorsFound);
  return isValid;
};

const validateDocuments = () => {
  let isValid = true;
  let errorsFound = {};

  if (!officerClientImage1) {
    errorsFound.officerClientImage1 = "First Officer and Client Image is required";
    isValid = false;
  }

  if (!officerClientImage2) {
    errorsFound.officerClientImage2 = "Second Officer and Client Image is required";
    isValid = false;
  }

  if (!bothOfficersImage) {
    errorsFound.bothOfficersImage = "Both Officers Image is required";
    isValid = false;
  }

  setErrors(errorsFound);
  return isValid;
};


const handleNext = async () => {
  let isValid = false;

  switch (activeSection) {
    case "personal":
      isValid = await validatePersonalDetails();
      break;
    case "business":
      isValid = validateBusinessDetails();
      break;
    case "borrowerSecurity":
      isValid = validateBorrowerSecurity();
      break;
    case "loan":
      isValid = validateLoanDetails();
      break;
    case "guarantor":
      isValid = validateGuarantorDetails();
      break;
    case "guarantorSecurity":
      isValid = validateGuarantorSecurity();
      break;
    case "nextOfKin":
      isValid = validateNextOfKinDetails();
      break;
    case "documents":
      isValid = validateDocuments();
      break;
    default:
      break;
  }

  if (isValid) {
    const nextIndex = navItems.findIndex((item) => item.id === activeSection) + 1;
    if (nextIndex < navItems.length) {
      setActiveSection(navItems[nextIndex].id);
    }
  } else {
    toast.error("Please fix the highlighted errors before continuing.");
  }
};



  // Check if a value is unique in the database across multiple tables
  const checkUniqueValue = async (tables, field, value) => {
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select(field)
        .eq(field, value);

      if (error) {
        console.error(`Error checking unique ${field} in ${table}:`, error);
        return false;
      }

      if (data && data.length > 0) {
        return false; // Value exists in this table
      }
    }

    return true; // Value is unique across all tables
  };

  // Validate date is at least 18 years old
  const isAtLeast18YearsOld = (dateString) => {
    if (!dateString) return true; // Skip validation if empty

    const birthDate = new Date(dateString);
    const today = new Date();
    const eighteenYearsAgo = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );

    return birthDate <= eighteenYearsAgo;
  };

  // Validate business establishment date (at least 6 months ago)
  const isAtLeast6MonthsOld = (dateString) => {
    if (!dateString) return true;

    const establishedDate = new Date(dateString);
    const today = new Date();
    const sixMonthsAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 6,
      today.getDate()
    );

    return establishedDate <= sixMonthsAgo;
  };

  // Validation function
  const validateForm = async () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.Firstname) newErrors.Firstname = "First name is required";
    if (!formData.Surname) newErrors.Surname = "Surname is required";
    if (!formData.mobile) newErrors.mobile = "Mobile number is required";
    if (!formData.idNumber) newErrors.idNumber = "ID number is required";

    // Mobile number format validation
    if (
      formData.mobile &&
      !/^[0-9]{10,15}$/.test(formData.mobile.replace(/\D/g, ""))
    ) {
      newErrors.mobile = "Please enter a valid mobile number";
    }

    // ID number validation
    if (formData.idNumber && !/^[0-9]{6,12}$/.test(formData.idNumber)) {
      newErrors.idNumber = "Please enter a valid ID number";
    }

    // Date of birth validation - must be at least 18 years old
    if (formData.dateOfBirth && !isAtLeast18YearsOld(formData.dateOfBirth)) {
      newErrors.dateOfBirth = "Customer must be at least 18 years old";
    }

    // Business establishment date validation
    if (formData.yearEstablished && !isAtLeast6MonthsOld(formData.yearEstablished)) {
      newErrors.yearEstablished = "Business must be established at least 6 months ago";
    }

    // Guarantor date of birth validation
    if (
      formData.guarantor.dateOfBirth &&
      !isAtLeast18YearsOld(formData.guarantor.dateOfBirth)
    ) {
      newErrors.guarantorDateOfBirth = "Guarantor must be at least 18 years old";
    }

    // Validate security items
    securityItems.forEach((item, index) => {
      if (item.value && isNaN(parseFloat(item.value))) {
        newErrors[`securityValue_${index}`] = "Value must be a number";
      }
    });

    // Validate guarantor security items
    guarantorSecurityItems.forEach((item, index) => {
      if (item.value && isNaN(parseFloat(item.value))) {
        newErrors[`guarantorSecurityValue_${index}`] = "Value must be a number";
      }
    });

    // Check for unique mobile number across all relevant tables
    if (formData.mobile && !newErrors.mobile) {
      const isMobileUnique = await checkUniqueValue(
        ["customers", "guarantors", "next_of_kin"],
        "mobile",
        formData.mobile
      );
      if (!isMobileUnique) {
        newErrors.mobile = "Mobile number already exists in our system";
      }
    }

    // Check for unique ID number across all relevant tables
    if (formData.idNumber && !newErrors.idNumber) {
      const isIdUnique = await checkUniqueValue(
        ["customers", "guarantors", "next_of_kin"],
        "id_number",
        formData.idNumber
      );
      if (!isIdUnique) {
        newErrors.idNumber = "ID number already exists in our system";
      }
    }

    // Check for unique guarantor mobile number if provided
    if (formData.guarantor.mobile) {
      const isGuarantorMobileUnique = await checkUniqueValue(
        ["customers", "guarantors", "next_of_kin"],
        "mobile",
        formData.guarantor.mobile
      );
      if (!isGuarantorMobileUnique) {
        newErrors.guarantorMobile =
          "Guarantor mobile number already exists in our system";
      }
    }

    // Check for unique guarantor ID number if provided
    if (formData.guarantor.idNumber) {
      const isGuarantorIdUnique = await checkUniqueValue(
        ["customers", "guarantors", "next_of_kin"],
        "id_number",
        formData.guarantor.idNumber
      );
      if (!isGuarantorIdUnique) {
        newErrors.guarantorIdNumber =
          "Guarantor ID number already exists in our system";
      }
    }

    // Check for unique next of kin mobile number if provided
    if (formData.nextOfKin.mobile) {
      const isNextOfKinMobileUnique = await checkUniqueValue(
        ["customers", "guarantors", "next_of_kin"],
        "mobile",
        formData.nextOfKin.mobile
      );
      if (!isNextOfKinMobileUnique) {
        newErrors.nextOfKinMobile =
          "Next of kin mobile number already exists in our system";
      }
    }

    // Check for unique next of kin ID number if provided
    if (formData.nextOfKin.idNumber) {
      const isNextOfKinIdUnique = await checkUniqueValue(
        ["customers", "guarantors", "next_of_kin"],
        "id_number",
        formData.nextOfKin.idNumber
      );
      if (!isNextOfKinIdUnique) {
        newErrors.nextOfKinIdNumber =
          "Next of kin ID number already exists in our system";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle top-level form changes
 const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "yearEstablished") {
    const selectedDate = new Date(value);
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    if (selectedDate > sixMonthsAgo) {
      setErrors((prev) => ({
        ...prev,
        yearEstablished: "Business must be at least 6 months old.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, yearEstablished: "" }));
    }
  }

  setFormData((prev) => ({ ...prev, [name]: value }));
};


  const handleGuarantorSecurityChange = (e, index) => {
    const { name, value } = e.target;
    const newItems = [...guarantorSecurityItems];
    newItems[index][name] = value;
    setGuarantorSecurityItems(newItems);

    // Clear error when field is edited
    const errorKey = `guarantorSecurityValue_${index}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const addGuarantorSecurityItem = () => {
    setGuarantorSecurityItems([
      ...guarantorSecurityItems,
      { item: "", description: "", identification: "", value: "" },
    ]);
  };

  // Handle nested objects (guarantor, nextOfKin)
const handleNestedChange = (e, section) => {
  if (!e || !e.target) return; // ✅ prevent crash

  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [section]: { ...prev[section], [name]: value },
  }));

  const errorKey = `${section}${name}`;
  if (errors[errorKey]) {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  }
};



  // Handle security items
  const handleSecurityChange = (e, index) => {
    const { name, value } = e.target;
    const newItems = [...securityItems];
    newItems[index][name] = value;
    setSecurityItems(newItems);

    // Clear error when field is edited
    const errorKey = `securityValue_${index}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const addSecurityItem = () => {
    setSecurityItems([
      ...securityItems,
      { item: "", description: "", identification: "", value: "" },
    ]);
  };

 

 const handleLoanChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    loan: {
      ...prev.loan,
      [name]: value
    }
  }));
};




  const handleMultipleFiles = (e, setter) => {
    const files = Array.from(e.target.files);
    setter((prev) => [...prev, ...files]); // append new images
  };

  const handleRemoveBusinessImage = (index) => {
    setBusinessImages((prev) => prev.filter((_, i) => i !== index));
  };

  

// Upload file to Supabase Storage
const uploadFile = async (file, path, bucket = "customers") => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: urlData, error: urlError } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (urlError) throw urlError;

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    toast.error(`Failed to upload file: ${error.message}`);
    return null;
  }
};


const handleFileUpload = async (e, setter, key) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // Save file for upload using the individual setter
    setter(file);

    // Save preview URL
    setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
    
    console.log(`✅ File saved for ${key}:`, file.name);
  } catch (err) {
    console.error(err);
    toast.error("Unexpected error during file selection.");
  }
};
const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("🚀 Submit button clicked");

  const isValid = await validateForm();
  if (!isValid) {
    toast.error("Please fix the errors in the form before submitting.");
    return;
  }

  setIsSubmitting(true);

  const logError = (section, error) => {
    console.group(`❌ Error in ${section} section`);
    console.error(error.message, error);
    console.groupEnd();
    toast.error(`Error in ${section}: ${error.message}`);
  };

  try {
    console.log("📁 Starting file uploads...");
    
    // ========= 1. Upload customer personal images to /personal folder =========
    let passportUrl = null;
    let idFrontUrl = null;
    let idBackUrl = null;
    let houseImageUrl = null;

    // Debug: Log file states
    console.log("📄 File states:", {
      passportFile: !!passportFile,
      idFrontFile: !!idFrontFile, 
      idBackFile: !!idBackFile,
      houseImageFile: !!houseImageFile
    });

    // Upload customer personal images using the file states directly
    if (passportFile) {
      console.log("⬆️ Uploading passport to personal folder...");
      passportUrl = await uploadFile(
        passportFile, 
        `personal/${Date.now()}_passport_${passportFile.name}`,
        "customers"
      );
      if (!passportUrl) throw new Error("Failed to upload passport image");
      console.log("✅ Passport URL:", passportUrl);
    }

    if (idFrontFile) {
      console.log("⬆️ Uploading ID front to personal folder...");
      idFrontUrl = await uploadFile(
        idFrontFile, 
        `personal/${Date.now()}_id_front_${idFrontFile.name}`,
        "customers"
      );
      if (!idFrontUrl) throw new Error("Failed to upload ID front image");
      console.log("✅ ID Front URL:", idFrontUrl);
    }

    if (idBackFile) {
      console.log("⬆️ Uploading ID back to personal folder...");
      idBackUrl = await uploadFile(
        idBackFile, 
        `personal/${Date.now()}_id_back_${idBackFile.name}`,
        "customers"
      );
      if (!idBackUrl) throw new Error("Failed to upload ID back image");
      console.log("✅ ID Back URL:", idBackUrl);
    }

    if (houseImageFile) {
      console.log("⬆️ Uploading house image to personal folder...");
      houseImageUrl = await uploadFile(
        houseImageFile, 
        `personal/${Date.now()}_house_${houseImageFile.name}`,
        "customers"
      );
      if (!houseImageUrl) throw new Error("Failed to upload house image");
      console.log("✅ House Image URL:", houseImageUrl);
    }

    // ========= 2. Insert customer =========
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .insert([{
        prefix: formData.prefix || null,
        Firstname: formData.Firstname || null,
        Surname: formData.Surname || null,
        Middlename: formData.Middlename || null,
        marital_status: formData.maritalStatus || null,
        residence_status: formData.residenceStatus || null,
        mobile: formData.mobile || null,
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
      }])
      .select("id")
      .single();

    if (customerError) {
      logError("Customer", customerError);
      setIsSubmitting(false);
      return;
    }

    const customerId = customerData.id;

    // ========= 3. Upload business images =========
    if (businessImages.length > 0) {
      const businessImageUrls = [];
      for (const image of businessImages) {
        const url = await uploadFile(image, `business/${Date.now()}_${image.name}`, "customers");
        if (url) businessImageUrls.push(url);
      }
      if (businessImageUrls.length > 0) {
        const { error: businessImageError } = await supabase
          .from("business_images")
          .insert(businessImageUrls.map((url) => ({ customer_id: customerId, image_url: url })));
        if (businessImageError) logError("Business Images", businessImageError);
      }
    }

    // ========= 4. Next of Kin =========
    const nextOfKin = formData.nextOfKin || {};
    const nextOfKinFilled = Object.values(nextOfKin).some((val) => val != null && String(val).trim() !== "");
    if (nextOfKinFilled) {
      const { error: nextOfKinError } = await supabase.from("next_of_kin").insert([{
        customer_id: customerId,
        Firstname: nextOfKin.Firstname || null,
        Surname: nextOfKin.Surname || null,
        Middlename: nextOfKin.Middlename || null,
        id_number: nextOfKin.idNumber || null,
        relationship: nextOfKin.relationship || null,
        mobile: nextOfKin.mobile || null,
        alternative_number: nextOfKin.alternativeNumber || null,
        employment_status: nextOfKin.employmentStatus || null,
        county: nextOfKin.county || null,
        city_town: nextOfKin.cityTown || null,
      }]);
      if (nextOfKinError) logError("Next of Kin", nextOfKinError);
    }

    // ========= 5. Guarantor =========
    const guarantor = formData.guarantor || {};
    const guarantorFilled = Object.values(guarantor).some((val) => val != null && String(val).trim() !== "");
    let guarantorId = null;

    if (guarantorFilled) {
      console.log("📁 Uploading guarantor images...");
      
      // Debug: Log guarantor file states
      console.log("📄 Guarantor file states:", {
        guarantorPassportFile: !!guarantorPassportFile,
        guarantorIdFrontFile: !!guarantorIdFrontFile, 
        guarantorIdBackFile: !!guarantorIdBackFile
      });
      
      // Upload guarantor images to /guarantor folder
      let guarantorPassportUrl = null;
      let guarantorIdFrontUrl = null;
      let guarantorIdBackUrl = null;

      if (guarantorPassportFile) {
        console.log("⬆️ Uploading guarantor passport to guarantor folder...");
        guarantorPassportUrl = await uploadFile(
          guarantorPassportFile, 
          `guarantor/${Date.now()}_passport_${guarantorPassportFile.name}`,
          "customers"
        );
        if (!guarantorPassportUrl) throw new Error("Failed to upload guarantor passport image");
        console.log("✅ Guarantor Passport URL:", guarantorPassportUrl);
      }

      if (guarantorIdFrontFile) {
        console.log("⬆️ Uploading guarantor ID front to guarantor folder...");
        guarantorIdFrontUrl = await uploadFile(
          guarantorIdFrontFile, 
          `guarantor/${Date.now()}_id_front_${guarantorIdFrontFile.name}`,
          "customers"
        );
        if (!guarantorIdFrontUrl) throw new Error("Failed to upload guarantor ID front image");
        console.log("✅ Guarantor ID Front URL:", guarantorIdFrontUrl);
      }

      if (guarantorIdBackFile) {
        console.log("⬆️ Uploading guarantor ID back to guarantor folder...");
        guarantorIdBackUrl = await uploadFile(
          guarantorIdBackFile, 
          `guarantor/${Date.now()}_id_back_${guarantorIdBackFile.name}`,
          "customers"
        );
        if (!guarantorIdBackUrl) throw new Error("Failed to upload guarantor ID back image");
        console.log("✅ Guarantor ID Back URL:", guarantorIdBackUrl);
      }

      const { data: guarantorData, error: guarantorError } = await supabase
        .from("guarantors")
        .insert([{
          customer_id: customerId,
          Firstname: guarantor.Firstname || null,
          Surname: guarantor.Surname || null,
          Middlename: guarantor.Middlename || null,
          id_number: guarantor.idNumber || null,
          marital_status: guarantor.maritalStatus || null,
          gender: guarantor.gender || null,
          mobile: guarantor.mobile || null,
          residence_status: guarantor.residenceStatus || null,
          postal_address: guarantor.postalAddress || null,
          code: guarantor.code ? parseInt(guarantor.code) : null,
          occupation: guarantor.occupation || null,
          relationship: guarantor.relationship || null,
          date_of_birth: guarantor.dateOfBirth || null,
          county: guarantor.county || null,
          city_town: guarantor.cityTown || null,
          passport_url: guarantorPassportUrl,
          id_front_url: guarantorIdFrontUrl,
          id_back_url: guarantorIdBackUrl,
        }])
        .select("id")
        .single();

      if (guarantorError) logError("Guarantor", guarantorError);
      else guarantorId = guarantorData.id;
    }

    // ========= 6. Guarantor Security =========
    if (guarantorId && guarantorSecurityItems.length > 0) {
      const itemsToInsert = guarantorSecurityItems.map((s) => ({
        guarantor_id: guarantorId,
        item: s.item || null,
        description: s.description || null,
        identification: s.identification || null,
        estimated_market_value: s.value ? parseFloat(s.value) : null,
      }));

      const { data: insertedItems, error: gSecError } = await supabase
        .from("guarantor_security")
        .insert(itemsToInsert)
        .select("id");

      if (gSecError) logError("Guarantor Security", gSecError);
      else {
        for (let i = 0; i < insertedItems.length; i++) {
          const securityId = insertedItems[i].id;
          const files = guarantorSecurityImages[i] || [];
          const urls = [];
          for (const file of files) {
            const url = await uploadFile(file, `guarantor_security/${Date.now()}_${file.name}`, "customers");
            if (url) urls.push(url);
          }
          if (urls.length > 0) {
            const { error: gSecImgError } = await supabase.from("guarantor_security_images").insert(
              urls.map((url) => ({ guarantor_security_id: securityId, image_url: url }))
            );
            if (gSecImgError) logError("Guarantor Security Images", gSecImgError);
          }
        }
      }
    }

    // ========= 7. Borrower Security =========
    if (securityItems.length > 0) {
      const itemsToInsert = securityItems.map((s) => ({
        customer_id: customerId,
        item: s.item || null,
        description: s.description || null,
        identification: s.identification || null,
        value: s.value ? parseFloat(s.value) : null,
      }));

      const { data: insertedItems, error: secError } = await supabase
        .from("security_items")
        .insert(itemsToInsert)
        .select("id");

      if (secError) logError("Borrower Security", secError);
      else {
        for (let i = 0; i < insertedItems.length; i++) {
          const securityId = insertedItems[i].id;
          const files = securityItemImages[i] || [];
          const urls = [];
          for (const file of files) {
            const url = await uploadFile(file, `borrower_security/${Date.now()}_${file.name}`, "customers");
            if (url) urls.push(url);
          }
          if (urls.length > 0) {
            const { error: secImgError } = await supabase.from("security_item_images").insert(
              urls.map((url) => ({ security_item_id: securityId, image_url: url }))
            );
            if (secImgError) logError("Borrower Security Images", secImgError);
          }
        }
      }
    }

    // ========= 8. Loan =========
    if (formData.loan?.prequalifiedAmount) {
      const { error: loanError } = await supabase.from("loans").insert([{
        customer_id: customerId,
        prequalified_amount: parseFloat(formData.loan.prequalifiedAmount),
      }]);
      if (loanError) logError("Loan", loanError);
    }

    // ========= 9. Documents =========
    const documentsToUpload = [
      { file: officerClientImage1, type: "First Officer and Client Image" },
      { file: officerClientImage2, type: "Second Officer and Client Image" },
      { file: bothOfficersImage, type: "Both Officers Image" },
    ];

    const uploadedDocs = [];
    for (const doc of documentsToUpload) {
      if (doc.file) {
        const url = await uploadFile(doc.file, `documents/${Date.now()}_${doc.file.name}`, "customers");
        if (url) uploadedDocs.push({ customer_id: customerId, document_type: doc.type, document_url: url });
      }
    }

    if (uploadedDocs.length > 0) {
      const { error: docError } = await supabase.from("documents").insert(uploadedDocs);
      if (docError) logError("Documents", docError);
    }

    // ========= ✅ Success =========
    toast.success("Customer & all related details saved successfully!", {
      position: "top-right",
      autoClose: 4000,
      theme: "colored",
    });
    onClose();

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    toast.error(error.message || "Unexpected error occurred. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};



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



const handleRemoveFile = (key, setter) => {
  console.log(`🗑️ Removing file for ${key}`);
  
  // Reset the file state
  if (setter) {
    setter(null); // For individual setters
  } else {
    setFiles(prev => ({ ...prev, [key]: null })); // For single files state
  }
  
  // Remove preview
  setPreviews(prev => ({ ...prev, [key]: null }));
  
  // Revoke object URL to prevent memory leaks
  if (previews[key]) {
    URL.revokeObjectURL(previews[key]);
  }
};



  return (
   <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
  <div className="bg-white w-full max-w-6xl h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-6">
    {/* Header */}
    <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
      <h2 className="text-2xl text-center font-bold text-green-600">
         Customer Application
      </h2>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-red-600 text-xl font-bold transition-colors"
        disabled={isSubmitting}
      >
        ✕
      </button>
    </div>

    {/* Navigation Tabs */}
    <div className="flex overflow-x-auto mb-6 pb-2 border-b border-gray-200">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveSection(item.id)}
          className={`px-4 py-2 mr-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeSection === item.id
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>

    <form className="space-y-8">
      {/* PERSONAL DETAILS */}
      {activeSection === "personal" && (
  <section className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-lg border border-green-200">
  <h3 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2 border-b border-green-200 pb-3">
    <span className="w-1 h-5 bg-green-600 rounded-full"></span>
    Personal Details
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Prefix */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Prefix</label>
      <select
        name="prefix"
        value={formData.prefix}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      >
        <option value="">Select Prefix</option>
        <option>Mr</option>
        <option>Mrs</option>
        <option>Ms</option>
      </select>
    </div>

    {/* First Name */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">First Name *</label>
      <input
        type="text"
        name="Firstname"
        placeholder="First Name"
        value={formData.Firstname}
        onChange={handleChange}
        className={`border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
          errors.Firstname ? "border-red-500" : "border-green-200"
        }`}
        required
      />
      {errors.Firstname && <p className="text-red-500 text-xs mt-1">{errors.Firstname}</p>}
    </div>

    {/* Surname */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Surname *</label>
      <input
        type="text"
        name="Surname"
        placeholder="Surname"
        value={formData.Surname}
        onChange={handleChange}
        className={`border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
          errors.Surname ? "border-red-500" : "border-green-200"
        }`}
        required
      />
      {errors.Surname && <p className="text-red-500 text-xs mt-1">{errors.Surname}</p>}
    </div>

    {/* Middle Name */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Middle Name</label>
      <input
        type="text"
        name="Middlename"
        placeholder="Middle Name"
        value={formData.Middlename}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>

    {/* Marital Status */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Marital Status</label>
      <select
        name="maritalStatus"
        value={formData.maritalStatus}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
      <label className="block text-sm font-medium text-green-800 mb-1">Residence Status</label>
      <select
        name="residenceStatus"
        value={formData.residenceStatus}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      >
        <option value="">Residence Status</option>
        <option>Own</option>
        <option>Rent</option>
        <option>Family</option>
        <option>Other</option>
      </select>
    </div>

    {/* Mobile Number */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Mobile Number *</label>
      <input
        type="text"
        name="mobile"
        placeholder="Mobile Number"
        onChange={handleChange}
        value={formData.mobile}
        className={`border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
          errors.mobile ? "border-red-500" : "border-green-200"
        }`}
        required
      />
      {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
    </div>

    {/* Alternative Mobile */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Alternative Mobile Number</label>
      <input
        type="text"
        name="alternativeMobile"
        placeholder="Alternative Mobile Number"
        value={formData.alternativeMobile}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>

    {/* Occupation */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Occupation</label>
      <input
        type="text"
        name="occupation"
        placeholder="Occupation"
        value={formData.occupation}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>

    {/* Date of Birth */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Date of Birth</label>
      <input
        type="date"
        name="dateOfBirth"
        value={formData.dateOfBirth}
        onChange={handleChange}
        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
        className={`border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
          errors.dateOfBirth ? "border-red-500" : "border-green-200"
        }`}
      />
      {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
    </div>

    {/* Gender */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Gender</label>
      <select
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      >
        <option value="">Select Gender</option>
        <option>Male</option>
        <option>Female</option>
      </select>
    </div>

    {/* ID Number */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">ID Number *</label>
      <input
        type="text"
        name="idNumber"
        placeholder="ID Number"
        value={formData.idNumber}
        onChange={handleChange}
        className={`border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
          errors.idNumber ? "border-red-500" : "border-green-200"
        }`}
        required
      />
      {errors.idNumber && <p className="text-red-500 text-xs mt-1">{errors.idNumber}</p>}
    </div>

    {/* Postal Address */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Postal Address</label>
      <input
        type="text"
        name="postalAddress"
        placeholder="Postal Address"
        value={formData.postalAddress}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>

    {/* Code */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Code</label>
      <input
        type="number"
        name="code"
        placeholder="Code"
        value={formData.code}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>

    {/* Town */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Town / City</label>
      <input
        type="text"
        name="town"
        placeholder="Town / City"
        value={formData.town}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>

    {/* County */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">County</label>
      <input
        type="text"
        name="county"
        placeholder="County"
        value={formData.county}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>

    
   {/* File Uploads */}
<div className="md:col-span-2 lg:col-span-3 mt-6">
  <h4 className="text-lg font-semibold text-green-800 mb-4">
    Upload Documents
  </h4>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[
      { key: "passport", label: "Passport Photo", handler: (f) => setPassportFile(f) },
      { key: "idFront", label: "ID Front", handler: (f) => setIdFrontFile(f) },
      { key: "idBack", label: "ID Back", handler: (f) => setIdBackFile(f) },
      { key: "house", label: "House Image", handler: (f) => setHouseImageFile(f) },
    ].map((file, idx) => (
      <div
        key={idx}
        className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition"
      >
        <label className="block text-sm font-medium text-green-800 mb-3">
          {file.label}
        </label>

        
       {/* Action buttons */}
<div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-row lg:justify-between">
  {/* Upload */}
  <label className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg shadow-sm cursor-pointer hover:bg-green-200 transition">
    <Upload className="w-5 h-5" />
    <span className="text-sm font-medium">Upload</span>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => handleFileUpload(e, file.handler, file.key)}
      className="hidden"
    />
  </label>

  {/* Camera */}
  <label className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm cursor-pointer hover:bg-green-700 transition">
    <Camera className="w-5 h-5" />
    <input
      type="file"
      accept="image/*"
      capture={file.key === "passport" ? "user" : "environment"}
      onChange={(e) => handleFileUpload(e, file.handler, file.key)}
      className="hidden"
    />
  </label>
</div>


        {/* Preview with delete */}
       {previews[file.key] && (
  <div className="mt-4 w-full relative">
    <img
      src={previews[file.key]}
      alt={`${file.label} preview`}
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
</section>



      )}

      {/* BUSINESS INFORMATION */}
      {activeSection === "business" && (
  <section className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-lg border border-green-200">
  <h3 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2 border-b border-green-200 pb-3">
    <span className="w-1 h-5 bg-green-600 rounded-full"></span>
    Business Information
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Business Name */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">
        Business Name
      </label>
      <input
        type="text"
        name="businessName"
        placeholder="Business Name"
        value={formData.businessName}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Business Type */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">
        Business Type
      </label>
      <input
        type="text"
        name="businessType"
        placeholder="Business Type (e.g. Retail, Wholesale)"
        value={formData.businessType}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Year Established */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">
        Year Established *
      </label>
      <input
        type="date"
        name="yearEstablished"
        placeholder="Year Established"
        value={formData.yearEstablished}
        onChange={handleChange}
        className={`border p-3 rounded-xl w-full  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
          errors.yearEstablished ? "border-red-500" : "border-green-200"
        }`}
        max={new Date().toISOString().split("T")[0]}
      />
      {errors.yearEstablished && (
        <p className="text-red-500 text-xs mt-1">{errors.yearEstablished}</p>
      )}
    </div>

    {/* Daily Sales */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">
        Daily Sales (KES)
      </label>
      <input
        type="number"
        name="daily_Sales"
        placeholder="Daily Sales (KES)"
        value={formData.daily_Sales}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Business Location */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">
        Business Location
      </label>
      <input
        type="text"
        name="businessLocation"
        placeholder="Business Location"
        value={formData.businessLocation}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Road */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">
        Road
      </label>
      <input
        type="text"
        name="road"
        placeholder="Road"
        value={formData.road}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Landmark */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">
        Landmark
      </label>
      <input
        type="text"
        name="landmark"
        placeholder="Landmark (e.g. Mosque)"
        value={formData.landmark}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Local Authority License */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">
        Local Authority License
      </label>
      <select
        name="hasLocalAuthorityLicense"
        value={formData.hasLocalAuthorityLicense}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      >
        <option value="">Have Local Authority Licence?</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
    </div>

    {/* Upload Business Images - styled like Personal Details uploads */}
   <div className="md:col-span-2 mt-6">
 
{/* File Upload for Security Item */}
<div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
  <label className="block text-sm font-medium text-green-800 mb-3">
    Upload Business Images <span className="text-red-500">*</span>
  </label>

  {/* Action buttons (Upload + Camera) */}
  <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-row lg:justify-between">
    {/* Upload */}
    <label className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg shadow-sm cursor-pointer hover:bg-green-200 transition">
      <Upload className="w-5 h-5" />
      <span className="text-sm font-medium">Upload</span>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleMultipleFiles(e, setBusinessImages)}
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
        multiple
        onChange={(e) => handleMultipleFiles(e, setBusinessImages)}
        className="hidden"
      />
    </label>
  </div>

  {/* Preview grid */}
  {businessImages.length > 0 && (
    <div className="mt-4 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {businessImages.map((img, idx) => (
          <div key={idx} className="relative group">
            <img
              src={URL.createObjectURL(img)}
              alt={`Business ${idx + 1}`}
              className="w-full h-32 object-cover rounded-lg border border-green-200 shadow-sm"
            />
            <button
              type="button"
              onClick={() => handleRemoveBusinessImage(idx)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md opacity-90 group-hover:opacity-100"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Another Image */}
      <div className="mt-4 flex justify-center">
        <label className="flex items-center justify-center gap-2 px-5 py-2 bg-green-100 text-green-700 rounded-lg shadow-sm cursor-pointer hover:bg-green-200 transition">
          <Upload className="w-5 h-5" />
          <span className="text-sm font-medium">Add Another Image</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleMultipleFiles(e, setBusinessImages)}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )}
</div>




</div>

  </div>
</section>


      )}

      {/* BORROWER SECURITY */}
      {activeSection === "borrowerSecurity" && (
       <section className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-lg border border-green-200">
   <h3 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2 border-b border-green-200 pb-3">
    <span className="w-1 h-5 bg-green-600 rounded-full"></span>
    Borrower Security
  </h3>

  {securityItems.map((item, index) => (
    <div
      key={index}
      className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-green-200"
    >
      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Item */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-1">
            Item
          </label>
          <input
            type="text"
            name="item"
            placeholder="Item"
            value={item.item}
            onChange={(e) => handleSecurityChange(e, index)}
            className="border border-green-200 p-3 rounded-xl w-full 
             focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-1">
            Description
          </label>
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={item.description}
            onChange={(e) => handleSecurityChange(e, index)}
            className="border border-green-200 p-3 rounded-xl w-full 
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
          />
        </div>

        {/* Identification */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-1">
            Identification
          </label>
          <input
            type="text"
            name="identification"
            placeholder="Identification (e.g. Serial No.)"
            value={item.identification}
            onChange={(e) => handleSecurityChange(e, index)}
            className="border border-green-200 p-3 rounded-xl w-full 
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
          />
        </div>

        {/* Value */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-1">
            Est. Market Value (KES)
          </label>
          <input
            type="number"
            name="value"
            placeholder="Est. Market Value (KES)"
            value={item.value}
            onChange={(e) => handleSecurityChange(e, index)}
            className={`border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm ${
              errors[`securityValue_${index}`]
                ? "border-red-500"
                : "border-green-200"
            }`}
            min="0"
            step="0.01"
          />
          {errors[`securityValue_${index}`] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[`securityValue_${index}`]}
            </p>
          )}
        </div>
      </div>

      
      {/* File Upload */}
<div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
  <label className="block text-sm font-medium text-green-800 mb-3">
    Upload Images for Security Item
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
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files);
          const newImages = [...(securityItemImages[index] || []), ...files];
          const updatedImages = [...securityItemImages];
          updatedImages[index] = newImages;
          setSecurityItemImages(updatedImages);
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
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files);
          const newImages = [...(securityItemImages[index] || []), ...files];
          const updatedImages = [...securityItemImages];
          updatedImages[index] = newImages;
          setSecurityItemImages(updatedImages);
        }}
        className="hidden"
      />
    </label>
  </div>

  {/* Preview Grid */}
  {securityItemImages[index] && securityItemImages[index].length > 0 && (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
      {securityItemImages[index].map((img, imgIdx) => (
        <div key={imgIdx} className="relative">
          <img
            src={URL.createObjectURL(img)}
            alt={`Security ${index + 1} - Image ${imgIdx + 1}`}
            className="w-full h-32 object-cover rounded-lg border border-green-200 shadow-sm"
          />
          <button
            type="button"
            onClick={() => {
              const updated = [...securityItemImages];
              updated[index] = updated[index].filter((_, i) => i !== imgIdx);
              setSecurityItemImages(updated);
            }}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md"
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

  {/* Add Security Item Button */}
  <button
    type="button"
    onClick={addSecurityItem}
    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-semibold shadow-sm transition"
    disabled={isSubmitting}
  >
    + Add Security Item
  </button>
</section>

      )}

      {/* LOAN INFORMATION */}
      {activeSection === "loan" && (
      <section className="bg-green-50 p-6 rounded-xl">
  <h3 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2 border-b border-green-200 pb-3">
    <span className="w-1 h-5 bg-green-600 rounded-full"></span>
    Loan Information
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
      <label className="block text-sm font-medium text-green-800 mb-2">
        Pre-qualified Amount *
      </label>
      <input
        type="number"
        name="prequalifiedAmount"
        placeholder="Principal Amount"
        value={formData.loan.prequalifiedAmount}
        onChange={handleLoanChange} // ✅ correct
        className="block w-full text-sm text-gray-600 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
      />
    </div>

  
  </div>
</section>

      )}

      {/* GUARANTOR DETAILS */}
      {activeSection === "guarantor" && (
 <section className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-lg border border-green-200">
  <h3 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2 border-b border-green-200 pb-3">
    <span className="w-1 h-5 bg-green-600 rounded-full"></span>
    Guarantor Details
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Prefix */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Prefix</label>
      <select
        name="prefix"
        value={formData.guarantor.prefix}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      >
        <option value="">Select Prefix</option>
        <option>Mr</option>
        <option>Mrs</option>
        <option>Ms</option>
      </select>
    </div>

    {/* First Name */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">First Name</label>
      <input
        type="text"
        name="Firstname"
        placeholder="First Name"
        value={formData.guarantor.Firstname}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Middle Name */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Middle Name</label>
      <input
        type="text"
        name="Middlename"
        placeholder="Middle Name"
        value={formData.guarantor.Middlename}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Surname */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Surname</label>
      <input
        type="text"
        name="Surname"
        placeholder="Surname"
        value={formData.guarantor.Surname}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    
   {/* Gender */}
<div>
  <label className="block text-sm font-medium text-green-800 mb-1">Gender</label>
  <select
    name="gender"
    value={formData.guarantor.gender}
    onChange={(e) => handleNestedChange(e, "guarantor")}  // ✅ fixed
    className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
  >
    <option value="">Select Gender</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
  </select>
</div>


    {/* Date of Birth */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Date of Birth</label>
      <input
        type="date"
        name="dateOfBirth"
        value={formData.guarantor.dateOfBirth}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* ID Number */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">ID Number</label>
      <input
        type="text"
        name="idNumber"
        placeholder="National ID Number"
        value={formData.guarantor.idNumber}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Phone Number */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Phone Number</label>
      <input
        type="tel"
        name="phone"
        placeholder="07 "
        value={formData.guarantor.phone}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Alt Phone */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Alt Phone</label>
      <input
        type="tel"
        name="altPhone"
        placeholder="07XX XXX XXX"
        value={formData.guarantor.altPhone}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Marital Status */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Marital Status</label>
      <select
        name="maritalStatus"
        value={formData.guarantor.maritalStatus}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      >
        <option value="">Select Status</option>
        <option>Single</option>
        <option>Married</option>
        <option>Divorced</option>
        <option>Widowed</option>
      </select>
    </div>

    {/* Residence */}
   <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Residence Status</label>
      <select
        name="residenceStatus"
        value={formData.guarantor.residence}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      >
        <option value="">Residence Status</option>
        <option>Own</option>
        <option>Rent</option>
        <option>Family</option>
        <option>Other</option>
      </select>
    </div>

  

    {/* Relationship with Borrower */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Relationship with Borrower</label>
      <input
        type="text"
        name="relationship"
        placeholder="e.g. Brother, Friend"
        value={formData.guarantor.relationship}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Occupation */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Occupation</label>
      <input
        type="text"
        name="occupation"
        placeholder="Occupation"
        value={formData.guarantor.occupation}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

 

    {/* Address */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Address</label>
      <input
        type="text"
        name="address"
        placeholder="Postal  Address"
        value={formData.guarantor.address}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      />
    </div>

    {/* Code */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Code</label>
      <input
        type="number"
        name="code"
        placeholder="Code"
        value={formData.guarantor.code}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>

    {/* Town */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Town / City</label>
      <input
        type="text"
        name="town"
        placeholder="Town / City"
        value={formData.guarantor.town}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>

    
   {/* County */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">County</label>
      <input
        type="text"
        name="county"
        placeholder="County"
        value={formData.guarantor.county}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="border border-green-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>



  </div>

  

{/* Guarantor File Uploads */}
<div className="md:col-span-2 lg:col-span-3 mt-6">
  <h4 className="text-lg font-semibold text-green-800 mb-4">
    Upload Guarantor Documents
  </h4>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[
      { key: "guarantorPassport", label: "Upload Guarantor Passport", handler: setGuarantorPassportFile },
      { key: "guarantorIdFront", label: "Upload Guarantor ID Front", handler: setGuarantorIdFrontFile },
      { key: "guarantorIdBack", label: "Upload Guarantor ID Back", handler: setGuarantorIdBackFile },
    ].map((file, idx) => (
      <div
        key={idx}
        className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition"
      >
        <label className="block text-sm font-medium text-green-800 mb-2">
          {file.label} <span className="text-red-500">*</span>
        </label>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap w-full sm:flex-row lg:flex-row lg:justify-between">
          {/* Upload button */}
          <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg shadow-sm cursor-pointer hover:bg-green-200 transition">
            <Upload className="w-5 h-5" />
            <span className="text-sm font-medium">Upload</span>
            <input
              key={files[file.key] ? files[file.key] : `${file.key}-empty`} // resets input when preview cleared
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, file.handler, file.key)}
              className="hidden"
            />
          </label>

          {/* Camera button */}
          <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm cursor-pointer hover:bg-green-700 transition">
            <Camera className="w-5 h-5" />
            <span className="text-sm font-medium">Camera</span>
            <input
              key={`cam-${files[file.key] ? files[file.key] : `${file.key}-empty`}`} // also resettable
              type="file"
              accept="image/*"
              capture={file.key === "guarantorPassport" ? "user" : "environment"}
              onChange={(e) => handleFileUpload(e, file.handler, file.key)}
              className="hidden"
            />
          </label>
        </div>

      {/* Preview with delete */}
{previews[file.key] && (
  <div className="mt-4 w-full relative">
    <img
      src={previews[file.key]}   // ✅ use previews, not files
      alt={`${file.label} preview`}
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


</section>



      )}

      {/* GUARANTOR SECURITY */}
      {activeSection === "guarantorSecurity" && (
<section className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-lg border border-green-200">
  <h3 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2 border-b border-green-200 pb-3">
    <span className="w-1 h-5 bg-green-600 rounded-full"></span>
    Guarantor Security
  </h3>

  {guarantorSecurityItems.map((item, index) => (
    <div
      key={index}
      className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-green-200"
    >
      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Item */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-1">
            Item
          </label>
          <input
            type="text"
            name="item"
            placeholder="Item"
            value={item.item}
            onChange={(e) => handleGuarantorSecurityChange(e, index)}
            className="border border-green-200 p-3 rounded-xl w-full 
             focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-1">
            Description
          </label>
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={item.description}
            onChange={(e) => handleGuarantorSecurityChange(e, index)}
            className="border border-green-200 p-3 rounded-xl w-full 
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
          />
        </div>

        {/* Identification */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-1">
            Identification
          </label>
          <input
            type="text"
            name="identification"
            placeholder="Identification (e.g. Serial No.)"
            value={item.identification}
            onChange={(e) => handleGuarantorSecurityChange(e, index)}
            className="border border-green-200 p-3 rounded-xl w-full 
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
          />
        </div>

        {/* Value */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-1">
            Est. Market Value (KES)
          </label>
          <input
            type="number"
            name="value"
            placeholder="Est. Market Value (KES)"
            value={item.value}
            onChange={(e) => handleGuarantorSecurityChange(e, index)}
            className={`border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm ${
              errors[`guarantorSecurityValue_${index}`]
                ? "border-red-500"
                : "border-green-200"
            }`}
            min="0"
            step="0.01"
          />
          {errors[`guarantorSecurityValue_${index}`] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[`guarantorSecurityValue_${index}`]}
            </p>
          )}
        </div>
      </div>

      {/* File Upload for Guarantor Security Item */}
      <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
        <label className="block text-sm font-medium text-green-800 mb-3">
          Upload Images for Guarantor Security Item
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
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                const newImages = [
                  ...(guarantorSecurityImages[index] || []),
                  ...files,
                ];
                const updatedImages = [...guarantorSecurityImages];
                updatedImages[index] = newImages;
                setGuarantorSecurityImages(updatedImages);
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
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                const newImages = [
                  ...(guarantorSecurityImages[index] || []),
                  ...files,
                ];
                const updatedImages = [...guarantorSecurityImages];
                updatedImages[index] = newImages;
                setGuarantorSecurityImages(updatedImages);
              }}
              className="hidden"
            />
          </label>
        </div>

        {/* Preview Grid */}
        {guarantorSecurityImages[index] &&
          guarantorSecurityImages[index].length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              {guarantorSecurityImages[index].map((img, imgIdx) => (
                <div key={imgIdx} className="relative">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Guarantor Security ${index + 1} - Image ${imgIdx + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-green-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...guarantorSecurityImages];
                      updated[index] = updated[index].filter(
                        (_, i) => i !== imgIdx
                      );
                      setGuarantorSecurityImages(updated);
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md"
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

  {/* Add Security Item Button */}
  <button
    type="button"
    onClick={addGuarantorSecurityItem}
    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-semibold shadow-sm transition"
    disabled={isSubmitting}
  >
    + Add Guarantor Security Item
  </button>
</section>




      )}

      {/* NEXT OF KIN */}
      {activeSection === "nextOfKin" && (
       <section className="bg-green-50 p-6 rounded-xl">
 <h3 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2 border-b border-green-200 pb-3">
    <span className="w-1 h-5 bg-green-600 rounded-full"></span>
    Next of Kin Details
  </h3>

  <div className="p-6 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      {/* First Name */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">
          First Name
        </label>
        <input
          type="text"
          name="Firstname"
          placeholder="First Name"
          value={formData.nextOfKin.Firstname}
          onChange={(e) => handleNestedChange(e, "nextOfKin")}
          className="border border-gray-300 p-3 rounded-lg w-full 
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Middle Name */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">
          Middle Name
        </label>
        <input
          type="text"
          name="Middlename"
          placeholder="Middle Name"
          value={formData.nextOfKin.Middlename}
          onChange={(e) => handleNestedChange(e, "nextOfKin")}
          className="border border-gray-300 p-3 rounded-lg w-full 
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Surname */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">
          Surname
        </label>
        <input
          type="text"
          name="Surname"
          placeholder="Surname"
          value={formData.nextOfKin.Surname}
          onChange={(e) => handleNestedChange(e, "nextOfKin")}
          className="border border-gray-300 p-3 rounded-lg w-full 
                     focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* ID Number */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">
          ID Number
        </label>
        <input
          type="text"
          name="idNumber"
          placeholder="ID Number"
          value={formData.nextOfKin.idNumber}
          onChange={(e) => handleNestedChange(e, "nextOfKin")}
          className={`border p-3 rounded-lg w-full focus:outline-none focus:ring-2
                     focus:ring-green-500 focus:border-green-500 ${
                       errors.nextOfKinIdNumber ? "border-red-500" : "border-gray-300"
                     }`}
        />
        {errors.nextOfKinIdNumber && (
          <p className="text-red-500 text-xs mt-1">{errors.nextOfKinIdNumber}</p>
        )}
      </div>

      {/* Relationship */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">
          Relationship
        </label>
        <input
          type="text"
          name="relationship"
          placeholder="Relationship"
          value={formData.nextOfKin.relationship}
          onChange={(e) => handleNestedChange(e, "nextOfKin")}
          className="border border-gray-300 p-3 rounded-lg w-full 
                   focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Mobile Number */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">
          Mobile Number
        </label>
        <input
          type="text"
          name="mobile"
          placeholder="Mobile Number"
          value={formData.nextOfKin.mobile}
          onChange={(e) => handleNestedChange(e, "nextOfKin")}
          className={`border p-3 rounded-lg w-full focus:outline-none focus:ring-2
                     focus:ring-green-500 focus:border-green-500 ${
                       errors.nextOfKinMobile ? "border-red-500" : "border-gray-300"
                     }`}
        />
        {errors.nextOfKinMobile && (
          <p className="text-red-500 text-xs mt-1">{errors.nextOfKinMobile}</p>
        )}
      </div>

      {/* Alternative Number */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">
          Alternative Number
        </label>
        <input
          type="text"
          name="alternativeNumber"
          placeholder="Alternative Number"
          value={formData.nextOfKin.alternativeNumber}
          onChange={(e) => handleNestedChange(e, "nextOfKin")}
          className="border border-gray-300 p-3 rounded-lg w-full 
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Employment Status */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">
          Employment Status
        </label>
        <select
          name="employmentStatus"
          value={formData.nextOfKin.employmentStatus}
          onChange={(e) => handleNestedChange(e, "nextOfKin")}
          className="border border-gray-300 p-3 rounded-lg w-full 
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="">Select Employment Status</option>
          <option>Employed</option>
          <option>Self-Employed</option>
          <option>Unemployed</option>
          <option>Student</option>
          <option>Retired</option>
        </select>
      </div>

      {/* County */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">
          County
        </label>
        <input
          type="text"
          name="county"
          placeholder="County"
          value={formData.nextOfKin.county}
          onChange={(e) => handleNestedChange(e, "nextOfKin")}
          className="border border-gray-300 p-3 rounded-lg w-full 
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* City/Town */}
      <div>
        <label className="block text-sm font-medium text-green-800 mb-2">
          City/Town
        </label>
        <input
          type="text"
          name="cityTown"
          placeholder="City/Town"
          value={formData.nextOfKin.cityTown}
          onChange={(e) => handleNestedChange(e, "nextOfKin")}
          className="border border-gray-300 p-3 rounded-lg w-full 
                     focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>
    </div>
  </div>
</section>

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
      { label: "First Officer and Client Image", handler: setOfficerClientImage1, state: officerClientImage1 },
      { label: "Second Officer and Client Image", handler: setOfficerClientImage2, state: officerClientImage2 },
      { label: "Both Officers Image", handler: setBothOfficersImage, state: bothOfficersImage },
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
              onChange={(e) => file.handler(e.target.files[0])}
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
              onChange={(e) => file.handler(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>

        {/* Preview */}
        {file.state && (
          <div className="mt-4 relative w-full">
            <img
              src={URL.createObjectURL(file.state)}
              alt={`${file.label} Preview`}
              className="w-full h-40 object-cover rounded-lg border border-green-200 shadow-sm"
            />
            <button
              type="button"
              onClick={() => file.handler(null)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
</section>


      )}

     {/* Navigation buttons */}
<div className="flex justify-between mt-8">
  <button
    type="button"
    onClick={() => {
      const currentIndex = navItems.findIndex(item => item.id === activeSection);
      if (currentIndex > 0) {
        setActiveSection(navItems[currentIndex - 1].id);
      }
    }}
    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
    disabled={activeSection === "personal"}
  >
    Previous
  </button>

  <button
    type="button"
    onClick={handleNext}
    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
  >
    Next
  </button>
</div>


      {/* SUBMIT BUTTON */}
      {activeSection === "documents" && (
        <div className="flex justify-end mt-8">
          <button
          type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      )}
    </form>
  </div>
</div>
  );
};

export default AddCustomer;