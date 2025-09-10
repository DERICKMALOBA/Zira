// src/components/CustomerForm.jsx
import React, { useState, useEffect } from "react";

const CustomerForm = ({ leadData, onClose }) => {
  const [securityItems, setSecurityItems] = useState([
    { item: "", description: "", identification: "", value: "" },
  ]);

  const [formData, setFormData] = useState({
    prefix: "",
    firstName: "",
    surname: "",
    mobile: "",
    businessName: "",
    businessLocation: "",
  });

  // Prefill from leadData when modal opens
  useEffect(() => {
    if (leadData) {
      setFormData({
        prefix: "",
        firstName: leadData.name.split(" ")[0] || "",
        surname: leadData.name.split(" ")[1] || "",
        mobile: leadData.phone || "",
        businessName: leadData.business || "",
        businessLocation: leadData.location || "",
      });
    }
  }, [leadData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add more security items dynamically
  const addSecurityItem = () => {
    setSecurityItems([
      ...securityItems,
      { item: "", description: "", identification: "", value: "" },
    ]);
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
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Surname"
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
                className="border p-2 rounded w-full"
              />
              <input
                type="number"
                placeholder="Year Established"
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Business Location"
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Road"
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Landmark (e.g. Mosque)"
                className="border p-2 rounded w-full"
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
                  className="border p-2 rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Description"
                  className="border p-2 rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Identification (e.g. Serial No.)"
                  className="border p-2 rounded w-full"
                />
                <input
                  type="number"
                  placeholder="Est. Market Value (KES)"
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
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Postal Address"
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Code"
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Occupation"
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Relationship with Borrower"
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
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Relationship"
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Mobile Number"
                className="border p-2 rounded w-full"
              />
            </div>
          </section>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
