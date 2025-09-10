import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient"; // make sure you have this

const CustomerForm = ({ leadData, onClose }) => {
  const [securityItems, setSecurityItems] = useState([
    { item: "", description: "", identification: "", value: "" },
  ]);

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

  // Prefill from leads
 useEffect(() => {
  if (leadData) {
    setFormData((prev) => ({
      ...prev,
      Firstname:leadData.Firstname || "",
      Surname: leadData.Surname || "",
      mobile: leadData.mobile || leadData.phone || "",
      businessName: leadData.business_name || "",
      businessLocation: leadData.business_location || "",
    }));
  }
}, [leadData]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const addSecurityItem = () => {
    setSecurityItems([
      ...securityItems,
      { item: "", description: "", identification: "", value: "" },
    ]);
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("customers").insert([
      {
        prefix: formData.prefix,
        FirstName: formData.FirstName,
        Surname: formData.Surname,
        marital_status: formData.maritalStatus,
        residence_status: formData.residenceStatus,
        mobile: formData.mobile,
        id_number: formData.idNumber,
        postal_address: formData.postalAddress,
        code: formData.code,
        town: formData.town,
        county: formData.county,
        business_name: formData.businessName,
        year_established: formData.yearEstablished,
        business_location: formData.businessLocation,
        road: formData.road,
        landmark: formData.landmark,
        has_local_authority_license:
          formData.hasLocalAuthorityLicense === "Yes",
        security_items: securityItems,
        guarantor: formData.guarantor,
        next_of_kin: formData.nextOfKin,
      },
    ]);

    if (error) {
      console.error("Error saving customer:", error.message);
      alert("Failed to save customer.");
    } else {
      alert("Customer saved successfully!");
      onClose();
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
              <select className="border p-2 rounded w-full">
                <option>Mr</option>
                <option>Mrs</option>
                <option>Ms</option>
              </select>
              <input
                type="text"
                placeholder="First Name"
                 value={formData.Firstname}
                    onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Surname"
                  value={formData.Surname}
                     onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <select className="border p-2 rounded w-full">
                <option>Single</option>
                <option>Married</option>
                <option>Separated/Divorced</option>
                <option>Other</option>
              </select>
              <select className="border p-2 rounded w-full">
                <option>Own</option>
                <option>Rent</option>
                <option>Family</option>
                <option>Other</option>
              </select>
              <input
                type="text"
                placeholder="Mobile Number"
                onChange={handleChange}
                 value={formData.mobile}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="ID Number"
                  onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Postal Address"
                  onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Code"
                  onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Town / City"
                  onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="County"
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
                placeholder="Business Name"
                  value={formData.businessName}
                     onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="number"
                placeholder="Year Established"
                   onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Business Location"
                value={formData.businessLocation}
                  onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Road"
                   onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Landmark (e.g. Mosque)"
                className="border p-2 rounded w-full"
                   onChange={handleChange}
              />
              <select className="border p-2 rounded w-full">
                <option>Have Local Authority Licence?</option>
                <option>Yes</option>
                <option>No</option>
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
                  placeholder="Item"
                     onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Description"
                     onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Identification (e.g. Serial No.)"
                     onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
                <input
                  type="number"
                  placeholder="Est. Market Value (KES)"
                     onChange={handleChange}
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
              <select className="border p-2 rounded w-full">
                <option>Mr</option>
                <option>Mrs</option>
                <option>Ms</option>
              </select>
              <select className="border p-2 rounded w-full">
                <option>Single</option>
                <option>Married</option>
                <option>Separated/Divorced</option>
                <option>Other</option>
              </select>
              <select className="border p-2 rounded w-full">
                <option>Male</option>
                <option>Female</option>
              </select>
              <input
                type="text"
                placeholder="Mobile Number"
                   onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Postal Address"
                   onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Code"
                   onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Occupation"
                    onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Relationship with Borrower"
                    onChange={handleChange}
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
                placeholder="Name"
                   onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Relationship"
                   onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Mobile Number"
                   onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>
          </section>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end">
            <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
