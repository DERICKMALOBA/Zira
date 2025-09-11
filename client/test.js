import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const EditCustomerForm = ({ customerData, onClose }) => {
  const [securityItems, setSecurityItems] = useState([]);
  const [formData, setFormData] = useState({
    prefix: "",
    Firstname: "",
    Surname: "",
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
      maritalStatus: "",
      gender: "",
      mobile: "",
      postalAddress: "",
      code: "",
      occupation: "",
      relationship: "",
    },
    nextOfKin: {
      name: "",
      relationship: "",
      mobile: "",
    },
  });

  // Prefill from DB data
  useEffect(() => {
    if (customerData) {
      setFormData({
        prefix: customerData.prefix || "",
        Firstname: customerData.Firstname || "",
        Surname: customerData.Surname || "",
        maritalStatus: customerData.marital_status || "",
        residenceStatus: customerData.residence_status || "",
        mobile: customerData.mobile || "",
        idNumber: customerData.id_number || "",
        postalAddress: customerData.postal_address || "",
        code: customerData.code || "",
        town: customerData.town || "",
        county: customerData.county || "",
        businessName: customerData.business_name || "",
        yearEstablished: customerData.year_established || "",
        businessLocation: customerData.business_location || "",
        road: customerData.road || "",
        landmark: customerData.landmark || "",
        hasLocalAuthorityLicense: customerData.has_local_authority_license
          ? "Yes"
          : "No",
        guarantor: customerData.guarantor || {
          prefix: "",
          maritalStatus: "",
          gender: "",
          mobile: "",
          postalAddress: "",
          code: "",
          occupation: "",
          relationship: "",
        },
        nextOfKin: customerData.next_of_kin || {
          name: "",
          relationship: "",
          mobile: "",
        },
      });

      setSecurityItems(customerData.security_items || []);
    }
  }, [customerData]);

  // Handle top-level form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle nested objects
  const handleNestedChange = (e, section) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [name]: value },
    }));
  };

  // Handle security items
  const handleSecurityChange = (e, index) => {
    const { name, value } = e.target;
    const newItems = [...securityItems];
    newItems[index][name] = value;
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

    const customerId = customerData.id;

    // 1. Update customers
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        prefix: formData.prefix,
        Firstname: formData.Firstname,
        Surname: formData.Surname,
        marital_status: formData.maritalStatus,
        residence_status: formData.residenceStatus,
        mobile: formData.mobile,
        id_number: formData.idNumber ? parseInt(formData.idNumber) : null,
        postal_address: formData.postalAddress,
        code: formData.code ? parseInt(formData.code) : null,
        town: formData.town,
        county: formData.county,
        business_name: formData.businessName,
        year_established: formData.yearEstablished
          ? parseInt(formData.yearEstablished)
          : null,
        business_location: formData.businessLocation,
        road: formData.road,
        landmark: formData.landmark,
        has_local_authority_license:
          formData.hasLocalAuthorityLicense === "Yes",
      })
      .eq("id", customerId);

    if (updateError) {
      console.error("Error updating customer:", updateError.message);
      alert("Failed to update customer.");
      return;
    }

    // 2. Upsert guarantor
    if (formData.guarantor?.mobile) {
      await supabase.from("guarantors").upsert(
        {
          customer_id: customerId,
          ...formData.guarantor,
        },
        { onConflict: "customer_id" }
      );
    }

    // 3. Upsert next of kin
    if (formData.nextOfKin?.mobile) {
      await supabase.from("next_of_kin").upsert(
        {
          customer_id: customerId,
          ...formData.nextOfKin,
        },
        { onConflict: "customer_id" }
      );
    }

    // 4. Replace borrower security items
    await supabase.from("security_items").delete().eq("customer_id", customerId);
    if (securityItems.length > 0) {
      const itemsToInsert = securityItems.map((s) => ({
        customer_id: customerId,
        item: s.item,
        description: s.description,
        identification: s.identification,
        value: s.value ? parseFloat(s.value) : null,
      }));
      await supabase.from("security_items").insert(itemsToInsert);
    }

    alert("Customer updated successfully!");
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white w-full max-w-6xl h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6">
        {/* Header */}
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

        {/* The same form as Add but populated */}
        <form className="space-y-8">
          {/* PERSONAL DETAILS */}
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

          {/* NEXT OF KIN */}
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Next of Kin
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.nextOfKin.name}
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
          
          {/* SUBMIT BUTTON */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Update Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomerForm;
