// src/components/LoanVerificationForm.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoanVerificationForm = ({ customerId,  onComplete, onClose }) => {

  const [formData, setFormData] = useState({
    prefix: "",
    Firstname: "",
    Middlename: "",
    Surname: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    residenceStatus: "",
    mobile: "",
    idNumber: "",
    postalAddress: "",
    code: "",
    town: "",
    county: "",
    businessName: "",
    yearEstablished: "",
    businessLocation: "",
    road: "",
    landmark: "",
    hasLocalAuthorityLicense: "",
    guarantor: {
      prefix: "",
      Firstname: "",
      Middlename: "",
      Surname: "",
      idNumber: "",
      maritalStatus: "",
      gender: "",
      dateOfBirth: "",
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
  });

  const [securityItems, setSecurityItems] = useState([
    { item: "", description: "", identification: "", value: "" },
  ]);
  const [guarantorSecurityItems, setGuarantorSecurityItems] = useState([
    { item: "", description: "", identification: "", value: "" },
  ]);

  // Fetch existing customer data
  useEffect(() => {
    if (!customerId) return;

    const fetchCustomerData = async () => {
      try {
        // Fetch customer
        const { data: customer, error: custError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerId)
          .single();
        if (custError) throw custError;

        setFormData((prev) => ({
          ...prev,
          prefix: customer.prefix || "",
          Firstname: customer.Firstname || "",
          Middlename: customer.Middlename || "",
          Surname: customer.Surname || "",
          dateOfBirth: customer.date_of_birth || "",
          gender: customer.gender || "",
          maritalStatus: customer.marital_status || "",
          residenceStatus: customer.residence_status || "",
          mobile: customer.mobile || "",
          idNumber: customer.id_number ? customer.id_number.toString() : "",
          postalAddress: customer.postal_address || "",
          code: customer.code ? customer.code.toString() : "",
          town: customer.town || "",
          county: customer.county || "",
          businessName: customer.business_name || "",
          yearEstablished: customer.year_established
            ? customer.year_established.toString()
            : "",
          businessLocation: customer.business_location || "",
          road: customer.road || "",
          landmark: customer.landmark || "",
          hasLocalAuthorityLicense: customer.has_local_authority_license
            ? "Yes"
            : "No",
        }));

        // Fetch guarantor
        const { data: guarantor } = await supabase
          .from("guarantors")
          .select("*")
          .eq("customer_id", customerId)
          .single();
        if (guarantor) {
          setFormData((prev) => ({
            ...prev,
            guarantor: {
              prefix: guarantor.prefix || "",
              Firstname: guarantor.Firstname || "",
              Middlename: guarantor.Middlename || "",
              Surname: guarantor.Surname || "",
              idNumber: guarantor.id_number
                ? guarantor.id_number.toString()
                : "",
              maritalStatus: guarantor.marital_status || "",
              gender: guarantor.gender || "",
              dateOfBirth: guarantor.date_of_birth || "",
              mobile: guarantor.mobile || "",
              postalAddress: guarantor.postal_address || "",
              code: guarantor.code ? guarantor.code.toString() : "",
              occupation: guarantor.occupation || "",
              relationship: guarantor.relationship || "",
            },
          }));

          // Fetch guarantor security
          const { data: gSecurity } = await supabase
            .from("guarantor_security")
            .select("*")
            .eq("guarantor_id", guarantor.id);

          setGuarantorSecurityItems(
            gSecurity && gSecurity.length
              ? gSecurity.map((item) => ({
                  item: item.item || "",
                  description: item.description || "",
                  identification: item.identification || "",
                  value: item.estimated_market_value
                    ? item.estimated_market_value.toString()
                    : "",
                }))
              : [{ item: "", description: "", identification: "", value: "" }]
          );
        }

        // Fetch next of kin
        const { data: nextOfKin } = await supabase
          .from("next_of_kin")
          .select("*")
          .eq("customer_id", customerId)
          .single();
        if (nextOfKin) {
          setFormData((prev) => ({
            ...prev,
            nextOfKin: {
              Firstname: nextOfKin.Firstname || "",
              Surname: nextOfKin.Surname || "",
              Middlename: nextOfKin.Middlename || "",
              idNumber: nextOfKin.id_number
                ? nextOfKin.id_number.toString()
                : "",
              relationship: nextOfKin.relationship || "",
              mobile: nextOfKin.mobile || "",
            },
          }));
        }

        // Fetch borrower security
        const { data: security } = await supabase
          .from("security_items")
          .select("*")
          .eq("customer_id", customerId);

        setSecurityItems(
          security && security.length
            ? security.map((s) => ({
                item: s.item || "",
                description: s.description || "",
                identification: s.identification || "",
                value: s.value ? s.value.toString() : "",
              }))
            : [{ item: "", description: "", identification: "", value: "" }]
        );
      } catch (err) {
        console.error("Error fetching customer data:", err.message);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  // Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNestedChange = (e, parent) => {
    setFormData({
      ...formData,
      [parent]: { ...formData[parent], [e.target.name]: e.target.value },
    });
  };

  const handleSecurityChange = (e, index) => {
    const newItems = [...securityItems];
    newItems[index][e.target.name] = e.target.value;
    setSecurityItems(newItems);
  };

  const addSecurityItem = () => {
    setSecurityItems([
      ...securityItems,
      { item: "", description: "", identification: "", value: "" },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Example update query
      const { error } = await supabase
        .from("customers")
        .update({
          prefix: formData.prefix,
          Firstname: formData.Firstname,
          Surname: formData.Surname,
          // add other fields as needed
        })
        .eq("id", customerId);

      if (error) throw error;
      toast.success("Customer updated successfully!");
      if (onComplete) onComplete();
    } catch (err) {
      console.error("Error updating customer:", err.message);
      toast.error("Failed to update customer");
    }
  };


 

 



 



 



  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
     
       <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white w-full max-w-6xl h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Mular Credit Limited - Edit Customer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <input
                type="text"
                name="Firstname"
                placeholder="First Name"
                value={formData.Firstname}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="Surname"
                placeholder="Surname"
                value={formData.Surname}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
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
              <input
                type="text"
                name="mobile"
                placeholder="Mobile Number"
                onChange={handleChange}
                value={formData.mobile}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="idNumber"
                placeholder="ID Number"
                value={formData.idNumber}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="postalAddress"
                placeholder="Postal Address"
                value={formData.postalAddress}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="code"
                placeholder="Code"
                value={formData.code}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="town"
                placeholder="Town / City"
                value={formData.town}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="county"
                placeholder="County"
                value={formData.county}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
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
                type="number"
                name="yearEstablished"
                placeholder="Year Established"
                value={formData.yearEstablished}
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
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3"
              >
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
                <input
                  type="number"
                  name="value"
                  placeholder="Est. Market Value (KES)"
                  value={item.value}
                  onChange={(e) => handleSecurityChange(e, index)}
                  className="border p-2 rounded w-full"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addSecurityItem}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              + Add Item
            </button>
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
              <input
                type="text"
                name="mobile"
                placeholder="Mobile Number"
                value={formData.guarantor.mobile}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="postalAddress"
                placeholder="Postal Address"
                value={formData.guarantor.postalAddress}
                onChange={(e) => handleNestedChange(e, "guarantor")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
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
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3"
              >
                <input
                  type="text"
                  name="item"
                  placeholder="Item"
                  value={item.item}
                  onChange={(e) => {
                    const newItems = [...guarantorSecurityItems];
                    newItems[index][e.target.name] = e.target.value;
                    setGuarantorSecurityItems(newItems);
                  }}
                  className="border p-2 rounded w-full"
                />
                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...guarantorSecurityItems];
                    newItems[index][e.target.name] = e.target.value;
                    setGuarantorSecurityItems(newItems);
                  }}
                  className="border p-2 rounded w-full"
                />
                <input
                  type="text"
                  name="identification"
                  placeholder="Identification"
                  value={item.identification}
                  onChange={(e) => {
                    const newItems = [...guarantorSecurityItems];
                    newItems[index][e.target.name] = e.target.value;
                    setGuarantorSecurityItems(newItems);
                  }}
                  className="border p-2 rounded w-full"
                />
                <input
                  type="number"
                  name="value"
                  placeholder="Est. Market Value (KES)"
                  value={item.value}
                  onChange={(e) => {
                    const newItems = [...guarantorSecurityItems];
                    newItems[index][e.target.name] = e.target.value;
                    setGuarantorSecurityItems(newItems);
                  }}
                  className="border p-2 rounded w-full"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setGuarantorSecurityItems([
                  ...guarantorSecurityItems,
                  { item: "", description: "", identification: "", value: "" },
                ])
              }
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              + Add Guarantor Security
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
                placeholder="Surname Name"
                value={formData.nextOfKin.Surname}
                onChange={(e) => handleNestedChange(e, "nextOfKin")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="Middlename"
                placeholder="Middle Name"
                value={formData.nextOfKin.Middlename}
                onChange={(e) => handleNestedChange(e, "nextOfKin")}
                className="border p-2 rounded w-full"
              />

              <input
                type="text"
                name="idNumber"
                placeholder="ID Number"
                value={formData.nextOfKin.idNumber}
                onChange={(e) => handleNestedChange(e, "nextOfKin")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="relationship"
                placeholder="Relationship"
                value={formData.nextOfKin.relationship}
                onChange={(e) => handleNestedChange(e, "nextOfKin")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="mobile"
                placeholder="Mobile Number"
                value={formData.nextOfKin.mobile}
                onChange={(e) => handleNestedChange(e, "nextOfKin")}
                className="border p-2 rounded w-full"
              />
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};

export default LoanVerificationForm;