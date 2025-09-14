import { useState } from "react";
import { supabase } from "../../supabaseClient";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

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
    residentialStatus: "",
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
      residentialStatus: "",
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
    loan: {
      product: "",
      principal: "",
      durationWeeks: "",
      processingFee: "",
      registrationFee: "",
      interestRate: "",
      totalPayable: "",
      status: "pending",
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
  const [officerClientImage1, setOfficerClientImage1] = useState(null);
  const [officerClientImage2, setOfficerClientImage2] = useState(null);
  const [bothOfficersImage, setBothOfficersImage] = useState(null);

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
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [name]: value },
    }));

    // Clear error when field is edited
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

  // Loan calculation functions
  const calculateProcessingFee = (principal) => {
    if (!principal) return 0;
    return principal <= 10000 ? 500 : principal * 0.05;
  };

  const calculateRegistrationFee = (isNewCustomer) => {
    return isNewCustomer ? 300 : 0;
  };

  const calculateInterestRate = (weeks) => {
    if (!weeks) return 0;
    const weeklyRate = 25 / 4; // 6.25% per week
    return weeks * weeklyRate;
  };

  const calculateTotalPayable = ({ principal, interestRate }) => {
    if (!principal || !interestRate) return 0;
    const interestAmount = (principal * interestRate) / 100;
    return principal + interestAmount;
  };

  // Whenever loan fields change, auto-calculate fees and total
  const handleLoanChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updatedLoan = { ...prev.loan, [name]: value };

      // Calculate values based on changes
      const principal = parseFloat(updatedLoan.principal) || 0;
      const duration = parseInt(updatedLoan.durationWeeks) || 0;

      // Only recalculate if relevant fields change
      if (name === 'principal' || name === 'durationWeeks') {
        updatedLoan.processingFee = calculateProcessingFee(principal);
        updatedLoan.registrationFee = calculateRegistrationFee(true);
        updatedLoan.interestRate = calculateInterestRate(duration);
        updatedLoan.totalPayable = calculateTotalPayable({
          principal,
          interestRate: updatedLoan.interestRate,
        });
      }

      return { ...prev, loan: updatedLoan };
    });
  };

  // Handle file uploads
  const handleFileUpload = (e, setFileFunction) => {
    const file = e.target.files[0];
    if (file) {
      setFileFunction(file);
    }
  };

  const handleMultipleFiles = (e, setFilesFunction) => {
    const files = Array.from(e.target.files);
    setFilesFunction(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      toast.error("Please fix the errors in the form before submitting.", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Insert into customers
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert([
          {
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
            daily_Sales: formData.daily_Sales
              ? parseFloat(formData.daily_Sales)
              : null,
            year_established: formData.yearEstablished
              ? parseInt(formData.yearEstablished)
              : null,
            business_location: formData.businessLocation || null,
            road: formData.road || null,
            landmark: formData.landmark || null,
            has_local_authority_license:
              formData.hasLocalAuthorityLicense === "Yes",
          },
        ])
        .select("id")
        .single();

      if (customerError) {
        toast.error("Error saving customer: " + customerError.message, {
          position: "top-right",
          autoClose: 4000,
          theme: "colored",
        });
        setIsSubmitting(false);
        return;
      }

      const customerId = customerData.id;

      // 2. Insert loan record (AFTER customerId is defined)
      if (formData.loan.product) {
        const { error: loanError } = await supabase.from("loans").insert([
          {
            customer_id: customerId,
            product: formData.loan.product,
            duration_weeks: formData.loan.durationWeeks
              ? parseInt(formData.loan.durationWeeks)
              : null,
            processing_fee: formData.loan.processingFee
              ? parseFloat(formData.loan.processingFee)
              : null,
            principal: formData.loan.principal
              ? parseFloat(formData.loan.principal)
              : null,
            total_payable: formData.loan.totalPayable,
            registration_fee: formData.loan.registrationFee
              ? parseFloat(formData.loan.registrationFee)
              : 0,
            interest_rate: formData.loan.interestRate
              ? parseFloat(formData.loan.interestRate)
              : null,
            status: formData.loan.status || "pending",
          },
        ]);

        if (loanError) {
          console.error("Error saving loan:", loanError.message);
          toast.error("Failed to save loan info.");
        }
      }

      // 3. Insert next of kin (only if at least one field is provided)
      const nextOfKinFieldsFilled = Object.values(formData.nextOfKin).some(
        (val) => val && val.trim() !== ""
      );

      if (nextOfKinFieldsFilled) {
        const { error: nextOfKinError } = await supabase
          .from("next_of_kin")
          .insert([
            {
              customer_id: customerId,
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
            },
          ]);

        if (nextOfKinError) {
          console.error("Error saving next of kin:", nextOfKinError.message);
          toast.error("Failed to save next of kin: " + nextOfKinError.message);
        }
      }

      // 4. Insert guarantor (only if at least one field is provided)
      const guarantorFieldsFilled = Object.values(formData.guarantor).some(
        (val) => val && val.trim() !== ""
      );

      let guarantorId = null;
      if (guarantorFieldsFilled) {
        const { data: guarantorData, error: guarantorError } = await supabase
          .from("guarantors")
          .insert([
            {
              customer_id: customerId,
              prefix: formData.guarantor.prefix || null,
              Firstname: formData.guarantor.Firstname || null,
              Surname: formData.guarantor.Surname || null,
              id_number: formData.guarantor.idNumber || null,
              marital_status: formData.guarantor.maritalStatus || null,
              gender: formData.guarantor.gender || null,
              mobile: formData.guarantor.mobile || null,
              residence_status: formData.guarantor.residenceStatus || null,
              postal_address: formData.guarantor.postalAddress || null,
              code: formData.guarantor.code
                ? parseInt(formData.guarantor.code)
                : null,
              occupation: formData.guarantor.occupation || null,
              relationship: formData.guarantor.relationship || null,
              date_of_birth: formData.guarantor.dateOfBirth || null,
              Middlename: formData.guarantor.Middlename || null,
              county: formData.guarantor.county || null,
              city_town: formData.guarantor.cityTown || null,
            },
          ])
          .select("id")
          .single();

        if (guarantorError) {
          console.error("Error saving guarantor:", guarantorError.message);
          toast.error("Error saving guarantor", {
            position: "top-right",
            autoClose: 4000,
            theme: "colored",
          });
        } else {
          guarantorId = guarantorData.id;

          // Save guarantor security if provided
          const gItemsToInsert = guarantorSecurityItems
            .filter(
              (item) =>
                item.item ||
                item.description ||
                item.identification ||
                item.value
            )
            .map((s) => ({
              guarantor_id: guarantorId,
              item: s.item || null,
              description: s.description || null,
              identification: s.identification || null,
              estimated_market_value: s.value ? parseFloat(s.value) : null,
            }));

          if (gItemsToInsert.length > 0) {
            const { error: guarantorSecurityError } = await supabase
              .from("guarantor_security")
              .insert(gItemsToInsert);

            if (guarantorSecurityError) {
              console.error(
                "Error saving guarantor security:",
                guarantorSecurityError.message
              );
              toast.error("Error saving guarantor security.", {
                position: "top-right",
                autoClose: 4000,
                theme: "colored",
              });
            }
          }
        }
      }

      // 5. Insert borrower security items (only items with some data)
      const itemsToInsert = securityItems
        .filter(
          (item) =>
            item.item || item.description || item.identification || item.value
        )
        .map((s) => ({
          customer_id: customerId,
          item: s.item || null,
          description: s.description || null,
          identification: s.identification || null,
          value: s.value ? parseFloat(s.value) : null,
        }));

      if (itemsToInsert.length > 0) {
        const { error: securityError } = await supabase
          .from("security_items")
          .insert(itemsToInsert);

        if (securityError) {
          console.error("Error saving security items:", securityError.message);
          toast.error("Error saving security items.", {
            position: "top-right",
            autoClose: 4000,
            theme: "colored",
          });
        }
      }

      // 6. Upload files (you would need to implement this part based on your storage setup)
     
      toast.success("Customer & all related details saved successfully!", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });

      onClose();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred. Please try again.");
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
        className={`border p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
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
        className={`border p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>

    {/* Marital Status */}
    <div>
      <label className="block text-sm font-medium text-green-800 mb-1">Marital Status</label>
      <select
        name="maritalStatus"
        value={formData.maritalStatus}
        onChange={handleChange}
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
        className={`border p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
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
        className={`border p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
        className={`border p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white"
      />
    </div>

    {/* File Uploads */}
    <div className="md:col-span-2 lg:col-span-3 mt-6">
      <h4 className="text-lg font-semibold text-green-800 mb-4">Upload Documents</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Upload Passport Photo", handler: setPassportFile },
          { label: "Upload ID Front", handler: setIdFrontFile },
          { label: "Upload ID Back", handler: setIdBackFile },
          { label: "Upload House Image", handler: setHouseImageFile },
        ].map((file, idx) => (
          <div
            key={idx}
            className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition"
          >
            <label className="block text-sm font-medium text-green-800 mb-2">{file.label}</label>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, file.handler)}
              className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-green-100 file:text-green-700
                hover:file:bg-green-200
                cursor-pointer"
            />
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
        className={`border p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm bg-white ${
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
        className="border border-green-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
      >
        <option value="">Have Local Authority Licence?</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
    </div>

    {/* Upload Business Images - styled like Personal Details uploads */}
   <div className="md:col-span-2 mt-6">
 
  <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
    <label className="block text-sm font-medium text-green-800 mb-2">
      Upload Business Images
    </label>
    <input
      type="file"
      onChange={(e) => handleMultipleFiles(e, setBusinessImages)}
      className="block w-full text-sm text-gray-600
        file:mr-4 file:py-2 file:px-4
        file:rounded-lg file:border-0
        file:text-sm file:font-semibold
        file:bg-green-100 file:text-green-700
        hover:file:bg-green-200
        cursor-pointer"
    />
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
              focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
              focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
              focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
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
            className={`border p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm ${
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
        <label className="block text-sm font-medium text-green-800 mb-2">
          Upload Image for Security Item
        </label>
        <input
          type="file"
          onChange={(e) => {
            const newImages = [...securityItemImages];
            newImages[index] = e.target.files[0];
            setSecurityItemImages(newImages);
          }}
          className="block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-green-100 file:text-green-700
            hover:file:bg-green-200
            cursor-pointer"
        />
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
        name="principal"
        placeholder="Principal Amount"
        value={formData.loan.principal}
        onChange={handleLoanChange}
        className="block w-full text-sm text-gray-600
          border border-gray-300 p-2 rounded-lg
          focus:ring-2 focus:ring-green-500 focus:border-green-500
          placeholder-gray-400"
        required
      />
    </div>

  
  </div>
</section>

      )}

      {/* GUARANTOR DETAILS */}
      {activeSection === "guarantor" && (
      <section className="bg-green-50 p-6 rounded-xl">
  <h3 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2 border-b border-green-200 pb-3">
    <span className="w-1 h-5 bg-green-600 rounded-full"></span>
    Guarantor Details
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Prefix */}
    <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
      <label className="block text-sm font-medium text-green-800 mb-2">Prefix</label>
      <select
        name="prefix"
        value={formData.guarantor.prefix}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="block w-full text-sm text-gray-600 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <option value="">Select Prefix</option>
        <option>Mr</option>
        <option>Mrs</option>
        <option>Ms</option>
      </select>
    </div>

    {/* Marital Status */}
    <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
      <label className="block text-sm font-medium text-green-800 mb-2">Marital Status</label>
      <select
        name="maritalStatus"
        value={formData.guarantor.maritalStatus}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="block w-full text-sm text-gray-600 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <option value="">Select Marital Status</option>
        <option>Single</option>
        <option>Married</option>
        <option>Separated/Divorced</option>
        <option>Other</option>
      </select>
    </div>

    {/* First Name */}
    <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
      <label className="block text-sm font-medium text-green-800 mb-2">First Name</label>
      <input
        type="text"
        name="Firstname"
        placeholder="First Name"
        value={formData.guarantor.Firstname}
        onChange={(e) => handleNestedChange(e, "guarantor")}
        className="block w-full text-sm text-gray-600 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
      />
    </div>

    {/* Repeat the same card styling for Surname, ID Number, Gender, Mobile, etc. */}

    {/* File Uploads */}
    <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
        <label className="block text-sm font-medium text-green-800 mb-2">
          Upload Guarantor Passport
        </label>
        <input
          type="file"
          onChange={(e) => handleFileUpload(e, setGuarantorPassportFile)}
          className="block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-green-100 file:text-green-700
            hover:file:bg-green-200 cursor-pointer"
        />
      </div>

      <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
        <label className="block text-sm font-medium text-green-800 mb-2">
          Upload Guarantor ID Front
        </label>
        <input
          type="file"
          onChange={(e) => handleFileUpload(e, setGuarantorIdFrontFile)}
          className="block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-green-100 file:text-green-700
            hover:file:bg-green-200 cursor-pointer"
        />
      </div>

      <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
        <label className="block text-sm font-medium text-green-800 mb-2">
          Upload Guarantor ID Back
        </label>
        <input
          type="file"
          onChange={(e) => handleFileUpload(e, setGuarantorIdBackFile)}
          className="block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-green-100 file:text-green-700
            hover:file:bg-green-200 cursor-pointer"
        />
      </div>
    </div>
  </div>
</section>

      )}

      {/* GUARANTOR SECURITY */}
      {activeSection === "guarantorSecurity" && (
       <section className="bg-green-50 p-6 rounded-xl">
  <h3 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2 border-b border-green-200 pb-3">
    <span className="w-1 h-5 bg-green-600 rounded-full"></span>
    Guarantor Security
  </h3>

  {guarantorSecurityItems.map((item, index) => (
    <div
      key={index}
      className="mb-6 p-6 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Item */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-2">
            Item
          </label>
          <input
            type="text"
            name="item"
            placeholder="Item"
            value={item.item}
            onChange={(e) => handleGuarantorSecurityChange(e, index)}
            className="border border-gray-300 p-3 rounded-lg w-full 
                       focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-2">
            Description
          </label>
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={item.description}
            onChange={(e) => handleGuarantorSecurityChange(e, index)}
            className="border border-gray-300 p-3 rounded-lg w-full 
                       focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Identification */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-2">
            Identification
          </label>
          <input
            type="text"
            name="identification"
            placeholder="Identification (e.g. Serial No.)"
            value={item.identification}
            onChange={(e) => handleGuarantorSecurityChange(e, index)}
            className="border border-gray-300 p-3 rounded-lg w-full 
                       focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Value */}
        <div>
          <label className="block text-sm font-medium text-green-800 mb-2">
            Est. Market Value (KES)
          </label>
          <input
            type="number"
            name="value"
            placeholder="Est. Market Value (KES)"
            value={item.value}
            onChange={(e) => handleGuarantorSecurityChange(e, index)}
            className={`border p-3 rounded-lg w-full 
                        focus:ring-2 focus:ring-green-500 focus:border-green-500 
                        ${
                          errors[`guarantorSecurityValue_${index}`]
                            ? "border-red-500"
                            : "border-gray-300"
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

      {/* Upload */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-green-800 mb-2">
          Upload Image for Guarantor Security Item
        </label>
        <input
          type="file"
          onChange={(e) => {
            const newImages = [...guarantorSecurityImages];
            newImages[index] = e.target.files[0];
            setGuarantorSecurityImages(newImages);
          }}
          className="block w-full text-sm text-gray-600
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0
                     file:text-sm file:font-semibold
                     file:bg-green-100 file:text-green-700
                     hover:file:bg-green-200 cursor-pointer"
        />
      </div>
    </div>
  ))}

  {/* Add button */}
  <button
    type="button"
    onClick={addGuarantorSecurityItem}
    className="mt-4 px-5 py-2 bg-green-600 text-white rounded-lg 
               hover:bg-green-700 text-sm font-medium transition-colors"
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
                     focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                     focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                     focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
          className={`border p-3 rounded-lg w-full focus:ring-2 
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
                     focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
          className={`border p-3 rounded-lg w-full focus:ring-2 
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
                     focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                     focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                     focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                     focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
    {/* First Officer and Client Image */}
    <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
      <label className="block text-sm font-medium text-green-800 mb-2">
        First Officer and Client Image
      </label>
      <input
        type="file"
        onChange={(e) => handleFileUpload(e, setOfficerClientImage1)}
        className="block w-full text-sm text-gray-600
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-lg file:border-0
                   file:text-sm file:font-semibold
                   file:bg-green-100 file:text-green-700
                   hover:file:bg-green-200
                   cursor-pointer"
      />
    </div>

    {/* Second Officer and Client Image */}
    <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
      <label className="block text-sm font-medium text-green-800 mb-2">
        Second Officer and Client Image
      </label>
      <input
        type="file"
        onChange={(e) => handleFileUpload(e, setOfficerClientImage2)}
        className="block w-full text-sm text-gray-600
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-lg file:border-0
                   file:text-sm file:font-semibold
                   file:bg-green-100 file:text-green-700
                   hover:file:bg-green-200
                   cursor-pointer"
      />
    </div>

    {/* Both Officers Image */}
    <div className="flex flex-col items-start p-4 border border-green-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
      <label className="block text-sm font-medium text-green-800 mb-2">
        Both Officers Image
      </label>
      <input
        type="file"
        onChange={(e) => handleFileUpload(e, setBothOfficersImage)}
        className="block w-full text-sm text-gray-600
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-lg file:border-0
                   file:text-sm file:font-semibold
                   file:bg-green-100 file:text-green-700
                   hover:file:bg-green-200
                   cursor-pointer"
      />
    </div>
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
          onClick={() => {
            const currentIndex = navItems.findIndex(item => item.id === activeSection);
            if (currentIndex < navItems.length - 1) {
              setActiveSection(navItems[currentIndex + 1].id);
            }
          }}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          disabled={activeSection === "documents"}
        >
          Next
        </button>
      </div>

      {/* SUBMIT BUTTON */}
      {activeSection === "documents" && (
        <div className="flex justify-end mt-8">
          <button
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