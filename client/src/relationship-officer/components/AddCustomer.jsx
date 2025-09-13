import { useState } from "react";
import { supabase } from "../../supabaseClient";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

const AddCustomer = ({ onClose }) => {
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
    },
    nextOfKin: {
      Firstname: "",
      Surname: "",
      Middlename: "",
      idNumber: "",
      relationship: "",
      mobile: "",
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

      const principal = parseFloat(updatedLoan.principal) || 0;
      const duration = parseInt(updatedLoan.durationWeeks) || 0;

      updatedLoan.processingFee = calculateProcessingFee(principal);
      updatedLoan.registrationFee = calculateRegistrationFee(true);
      updatedLoan.interestRate = calculateInterestRate(duration);
      updatedLoan.totalPayable = calculateTotalPayable({
        principal,
        interestRate: updatedLoan.interestRate,
        processingFee: updatedLoan.processingFee,
        registrationFee: updatedLoan.registrationFee,
      });

      return { ...prev, loan: updatedLoan };
    });
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



  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white w-full max-w-6xl h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Mular Credit Limited - Customer Application
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg font-bold"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <form className="space-y-8">
          {/* PERSONAL DETAILS */}
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <select
                  name="prefix"
                  value={formData.prefix}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select Prefix</option>
                  <option>Mr</option>
                  <option>Mrs</option>
                  <option>Ms</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  name="Firstname"
                  placeholder="First Name *"
                  value={formData.Firstname}
                  onChange={handleChange}
                  className={`border p-2 rounded w-full ${
                    errors.Firstname ? "border-red-500" : ""
                  }`}
                  required
                />
                {errors.Firstname && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.Firstname}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="Surname"
                  placeholder="Surname *"
                  value={formData.Surname}
                  onChange={handleChange}
                  className={`border p-2 rounded w-full ${
                    errors.Surname ? "border-red-500" : ""
                  }`}
                  required
                />
                {errors.Surname && (
                  <p className="text-red-500 text-xs mt-1">{errors.Surname}</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="Middlename"
                  placeholder="Middle Name"
                  value={formData.Middlename}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select Marital Status</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Separated/Divorced</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <select
                  name="residenceStatus"
                  value={formData.residenceStatus}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Residence Status</option>
                  <option>Own</option>
                  <option>Rent</option>
                  <option>Family</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile Number *"
                  onChange={handleChange}
                  value={formData.mobile}
                  className={`border p-2 rounded w-full ${
                    errors.mobile ? "border-red-500" : ""
                  }`}
                  required
                />
                {errors.mobile && (
                  <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
                )}
              </div>

              <div>
                <input
                  type="date"
                  name="dateOfBirth"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`border p-2 rounded w-full ${
                    errors.dateOfBirth ? "border-red-500" : ""
                  }`}
                  max={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 18)
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  name="idNumber"
                  placeholder="ID Number *"
                  value={formData.idNumber}
                  onChange={handleChange}
                  className={`border p-2 rounded w-full ${
                    errors.idNumber ? "border-red-500" : ""
                  }`}
                  required
                />
                {errors.idNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.idNumber}</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="postalAddress"
                  placeholder="Postal Address"
                  value={formData.postalAddress}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <input
                  type="number"
                  name="code"
                  placeholder="Code"
                  value={formData.code}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="town"
                  placeholder="Town / City"
                  value={formData.town}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="county"
                  placeholder="County"
                  value={formData.county}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          </section>

          {/* BUSINESS INFORMATION */}
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="businessName"
                placeholder="Business Name"
                value={formData.businessName}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />

              <input
                type="text"
                name="businessType"
                placeholder="Business Type (e.g. Retail, Wholesale)"
                value={formData.businessType}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="number"
                name="yearEstablished"
                placeholder="Year Established"
                value={formData.yearEstablished}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                min="1900"
                max={new Date().getFullYear()}
              />
              <input
                type="number"
                name="daily_Sales"
                placeholder="Daily Sales (KES)"
                value={formData.daily_Sales}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />

              <input
                type="text"
                name="businessLocation"
                placeholder="Business Location"
                value={formData.businessLocation}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="road"
                placeholder="Road"
                value={formData.road}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="landmark"
                placeholder="Landmark (e.g. Mosque)"
                value={formData.landmark}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <select
                name="hasLocalAuthorityLicense"
                value={formData.hasLocalAuthorityLicense}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              >
                <option value="">Have Local Authority Licence?</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </section>

          {/* BORROWER SECURITY */}
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Borrower Security
            </h3>
            {securityItems.map((item, index) => (
              <div key={index} className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                  <input
                    type="text"
                    name="item"
                    placeholder="Item"
                    value={item.item}
                    onChange={(e) => handleSecurityChange(e, index)}
                    className="border p-2 rounded w-full"
                  />
                  <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleSecurityChange(e, index)}
                    className="border p-2 rounded w-full"
                  />
                  <input
                    type="text"
                    name="identification"
                    placeholder="Identification (e.g. Serial No.)"
                    value={item.identification}
                    onChange={(e) => handleSecurityChange(e, index)}
                    className="border p-2 rounded w-full"
                  />
                  <div>
                    <input
                      type="number"
                      name="value"
                      placeholder="Est. Market Value (KES)"
                      value={item.value}
                      onChange={(e) => handleSecurityChange(e, index)}
                      className={`border p-2 rounded w-full ${
                        errors[`securityValue_${index}`] ? "border-red-500" : ""
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
              </div>
            ))}
            <button
              type="button"
              onClick={addSecurityItem}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              disabled={isSubmitting}
            >
              + Add Item
            </button>
          </section>


          
<section>
  <h3 className="text-lg font-semibold mb-4 border-b pb-2">
    Loan Information
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Principal */}

<input
  type="number"
  name="principal"
  placeholder="Principal Amount"
  value={formData.loan.principal}
  onChange={handleLoanChange}
  className="border p-2 rounded w-full"
/>
    {/* Product */}
    <select
      name="product"
      value={formData.loan.product}
      onChange={(e) =>
        setFormData((prev) => ({
          ...prev,
          loan: { ...prev.loan, product: e.target.value },
        }))
      }
      className="border p-2 rounded w-full"
    >
      <option value="">Select Product</option>
      <option value="Inuka">Inuka</option>
      <option value="Kuza">Kuza</option>
      <option value="Fadhili">Fadhili</option>
    </select>

    {/* Duration */}
    <select
      name="durationWeeks"
      value={formData.loan.durationWeeks}
      onChange={(e) => {
        const weeks = parseInt(e.target.value) || 0;
        setFormData((prev) => ({
          ...prev,
          loan: {
            ...prev.loan,
            durationWeeks: weeks,
            interestRate: calculateInterestRate(weeks),
          },
        }));
      }}
      className="border p-2 rounded w-full"
    >
      <option value="">Duration (Weeks)</option>
      {[4, 5, 6, 7, 8].map((week) => (
        <option key={week} value={week}>
          {week} weeks
        </option>
      ))}
    </select>

    {/* Auto-calculated Processing Fee */}
    <input
      type="number"
      name="processingFee"
      placeholder="Processing Fee"
        onChange={handleLoanChange}
      value={formData.loan.processingFee}
      readOnly
      className="border p-2 rounded w-full bg-gray-100"
    />

    {/* Auto-calculated Registration Fee (assume new customer true) */}
    <input
      type="number"
      name="registrationFee"
      placeholder="Registration Fee"
        onChange={handleLoanChange}
      value={formData.loan.registrationFee || calculateRegistrationFee(true)}
      readOnly
      className="border p-2 rounded w-full bg-gray-100"
    />

    {/* Auto-calculated Interest */}
    <input
      type="number"
      name="interestRate"
      placeholder="Interest Rate (%)"
      value={formData.loan.interestRate}
        onChange={handleLoanChange}
      readOnly
      className="border p-2 rounded w-full bg-gray-100"
    />


    <input
  type="number"
  name="totalPayable"
  placeholder="Total Payable"
  value={formData.loan.totalPayable || ""}
    onChange={handleLoanChange}
  readOnly
  className="border p-2 rounded w-full bg-gray-200 font-semibold"
/>



    {/* Status */}
    <select
      name="status"
      value={formData.loan.status}
      onChange={(e) =>
        setFormData((prev) => ({
          ...prev,
          loan: { ...prev.loan, status: e.target.value },
        }))
      }
      className="border p-2 rounded w-full"
    >
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
    </select>
  </div>
</section>


          {/* GUARANTOR DETAILS */}
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Guarantor Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                name="prefix"
                value={formData.guarantor.prefix}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              >
                <option value="">Select Prefix</option>
                <option>Mr</option>
                <option>Mrs</option>
                <option>Ms</option>
              </select>
              <select
                name="maritalStatus"
                value={formData.guarantor.maritalStatus}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              >
                <option value="">Select Marital Status</option>
                <option>Single</option>
                <option>Married</option>
                <option>Separated/Divorced</option>
                <option>Other</option>
              </select>
              <input
                type="text"
                name="Firstname"
                placeholder="First Name"
                value={formData.guarantor.Firstname}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="Surname"
                placeholder="Surname Name"
                value={formData.guarantor.Surname}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              />

              <input
                type="text"
                name="idNumber"
                placeholder="ID Number"
                value={formData.guarantor.idNumber}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className={`border p-2 rounded w-full ${
                  errors.guarantorIdNumber ? "border-red-500" : ""
                }`}
              />
              {errors.guarantorIdNumber && (
                <p className="text-red-500 text-xs mt-1 col-span-full">
                  {errors.guarantorIdNumber}
                </p>
              )}

              <select
                name="gender"
                value={formData.guarantor.gender}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              >
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
              <div>
                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile Number"
                  value={formData.guarantor.mobile}
                  onChange={(e) => handleNestedChange(e, "guarantor")}
                  className={`border p-2 rounded w-full ${
                    errors.guarantorMobile ? "border-red-500" : ""
                  }`}
                />
                {errors.guarantorMobile && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.guarantorMobile}
                  </p>
                )}
              </div>
              <input
                type="text"
                name="Middlename"
                placeholder="Middle Name"
                value={formData.guarantor.Middlename}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              />
              <div>
                <input
                  type="date"
                  name="dateOfBirth"
                  placeholder="Date of Birth"
                  value={formData.guarantor.dateOfBirth}
                  onChange={(e) => handleNestedChange(e, "guarantor")}
                  className={`border p-2 rounded w-full ${
                    errors.guarantorDateOfBirth ? "border-red-500" : ""
                  }`}
                  max={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 18)
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                />
                {errors.guarantorDateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.guarantorDateOfBirth}
                  </p>
                )}
              </div>
              <select
                name="residenceStatus"
                value={formData.guarantor.residenceStatus}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              >
                <option value="">Residence Status</option>
                <option>Own</option>
                <option>Rent</option>
                <option>Family</option>
                <option>Other</option>
              </select>
              <input
                type="text"
                name="postalAddress"
                placeholder="Postal Address"
                value={formData.guarantor.postalAddress}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              />
              <input
                type="number"
                name="code"
                placeholder="Code"
                value={formData.guarantor.code}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="occupation"
                placeholder="Occupation"
                value={formData.guarantor.occupation}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="relationship"
                placeholder="Relationship with Borrower"
                value={formData.guarantor.relationship}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              />
            </div>
          </section>

          {/* GUARANTOR SECURITY */}
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Guarantor Security
            </h3>
            {guarantorSecurityItems.map((item, index) => (
              <div key={index} className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                  <input
                    type="text"
                    name="item"
                    placeholder="Item"
                    value={item.item}
                    onChange={(e) => handleGuarantorSecurityChange(e, index)}
                    className="border p-2 rounded w-full"
                  />
                  <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleGuarantorSecurityChange(e, index)}
                    className="border p-2 rounded w-full"
                  />
                  <input
                    type="text"
                    name="identification"
                    placeholder="Identification (e.g. Serial No.)"
                    value={item.identification}
                    onChange={(e) => handleGuarantorSecurityChange(e, index)}
                    className="border p-2 rounded w-full"
                  />
                  <div>
                    <input
                      type="number"
                      name="value"
                      placeholder="Est. Market Value (KES)"
                      value={item.value}
                      onChange={(e) => handleGuarantorSecurityChange(e, index)}
                      className={`border p-2 rounded w-full ${
                        errors[`guarantorSecurityValue_${index}`]
                          ? "border-red-500"
                          : ""
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
              </div>
            ))}
            <button
              type="button"
              onClick={addGuarantorSecurityItem}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              disabled={isSubmitting}
            >
              + Add Guarantor Item
            </button>
          </section>

          {/* NEXT OF KIN */}
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Next of Kin
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="Firstname"
                placeholder="First Name"
                value={formData.nextOfKin.Firstname}
                onChange={(e) => handleNestedChange(e, "nextOfKin")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="Surname"
                placeholder="Surname"
                value={formData.nextOfKin.Surname}
                onChange={(e) => handleNestedChange(e, "nextOfKin")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="idNumber"
                placeholder="ID Number"
                value={formData.nextOfKin.idNumber}
                onChange={(e) => handleNestedChange(e, "nextOfKin")}
                className={`border p-2 rounded w-full ${
                  errors.nextOfKinIdNumber ? "border-red-500" : ""
                }`}
              />
              {errors.nextOfKinIdNumber && (
                <p className="text-red-500 text-xs mt-1 col-span-full">
                  {errors.nextOfKinIdNumber}
                </p>
              )}
              <input
                type="text"
                name="relationship"
                placeholder="Relationship"
                value={formData.nextOfKin.relationship}
                onChange={(e) => handleNestedChange(e, "nextOfKin")}
                className="border p-2 rounded w-full"
              />
              <div>
                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile Number"
                  value={formData.nextOfKin.mobile}
                  onChange={(e) => handleNestedChange(e, "nextOfKin")}
                  className={`border p-2 rounded w-full ${
                    errors.nextOfKinMobile ? "border-red-500" : ""
                  }`}
                />
                {errors.nextOfKinMobile && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.nextOfKinMobile}
                  </p>
                )}
              </div>
              <input
                type="text"
                name="Middlename"
                placeholder="Middle Name"
                value={formData.nextOfKin.Middlename}
                onChange={(e) => handleNestedChange(e, "nextOfKin")}
                className="border p-2 rounded w-full"
              />
            </div>
          </section>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomer;
