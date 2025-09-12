// src/components/CustomerDetailsModal.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

function CustomerDetailsModal({ customer, onClose }) {
  const [borrowerSecurity, setBorrowerSecurity] = useState([]);
  const [guarantorSecurity, setGuarantorSecurity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customer) {
      fetchSecurityData();
    }
  }, [customer]);

  const fetchSecurityData = async () => {
    setLoading(true);
    
    try {
      // Fetch borrower security - using security_items table with customer_id
      const { data: borrowerData, error: borrowerError } = await supabase
        .from("security_items")
        .select("*")
        .eq("customer_id", customer.id);

      if (borrowerError) {
        console.error("Error fetching borrower security:", borrowerError.message);
      } else {
        setBorrowerSecurity(borrowerData || []);
      }

      // Fetch guarantor security - using guarantor_security table with guarantor_id
      // First get all guarantor IDs for this customer
      const { data: guarantors, error: guarantorsError } = await supabase
        .from("guarantors")
        .select("id")
        .eq("customer_id", customer.id);

      if (guarantorsError) {
        console.error("Error fetching guarantors:", guarantorsError.message);
        setGuarantorSecurity([]);
      } else if (guarantors && guarantors.length > 0) {
        // Get all guarantor security items for these guarantors
        const guarantorIds = guarantors.map(g => g.id);
        const { data: guarantorData, error: guarantorError } = await supabase
          .from("guarantor_security")
          .select("*")
          .in("guarantor_id", guarantorIds);

        if (guarantorError) {
          console.error("Error fetching guarantor security:", guarantorError.message);
        } else {
          setGuarantorSecurity(guarantorData || []);
        }
      } else {
        setGuarantorSecurity([]);
      }
    } catch (error) {
      console.error("Error fetching security data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl w-4/5 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* HEADER */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-green-600 text-center w-full">
            {customer.prefix} {customer.Firstname} {customer.Middlename}{" "}
            {customer.Surname}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* PERSONAL INFO */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
            Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p>
              <span className="font-medium">First Name:</span> {customer.Firstname}
            </p>
            <p>
              <span className="font-medium">Middle Name:</span> {customer.Middlename}
            </p>
            <p>
              <span className="font-medium">Surname:</span> {customer.Surname}
            </p>
            <p>
              <span className="font-medium">Mobile:</span> {customer.mobile}
            </p>
            <p>
              <span className="font-medium">ID Number:</span> {customer.id_number}
            </p>
            <p>
              <span className="font-medium">Date of Birth:</span> {customer.date_of_birth}
            </p>
            <p>
              <span className="font-medium">Gender:</span> {customer.gender}
            </p>
            <p>
              <span className="font-medium">Marital Status:</span> {customer.marital_status}
            </p>
            <p>
              <span className="font-medium">Residence Status:</span> {customer.residence_status}
            </p>
            <p>
              <span className="font-medium">Town:</span> {customer.town}
            </p>
            <p>
              <span className="font-medium">County:</span> {customer.county}
            </p>
            <p>
              <span className="font-medium">Postal Address:</span> {customer.postal_address} -{" "}
              {customer.code}
            </p>
          </div>
        </section>

        {/* BUSINESS INFO */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
            Business Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p>
              <span className="font-medium">Business Name:</span> {customer.business_name}
            </p>
            <p>
              <span className="font-medium">Year Established:</span> {customer.year_established}
            </p>
            <p>
              <span className="font-medium">Business Location:</span> {customer.business_location}
            </p>
            <p>
              <span className="font-medium">Road:</span> {customer.road}
            </p>
            <p>
              <span className="font-medium">Landmark:</span> {customer.landmark}
            </p>
            <p>
              <span className="font-medium">Local Authority License:</span>{" "}
              {customer.has_local_authority_license ? "Yes" : "No"}
            </p>
          </div>
        </section>

        {/* BORROWER SECURITY */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
            Borrower Security
          </h3>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading security data...</p>
          ) : borrowerSecurity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Identification</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Value (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {borrowerSecurity.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{s.item}</td>
                      <td className="px-4 py-2 text-sm">{s.description}</td>
                      <td className="px-4 py-2 text-sm">{s.identification}</td>
                      <td className="px-4 py-2 text-sm">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No borrower security found.</p>
          )}
        </section>

        {/* GUARANTORS */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
            Guarantor Information
          </h3>
          {customer.guarantors?.length > 0 ? (
            customer.guarantors.map((g) => (
              <div key={g.id} className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">{g.prefix} {g.Firstname} {g.Middlename} {g.Surname}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p>
                    <span className="font-medium">First Name:</span> {g.Firstname}
                  </p>
                  <p>
                    <span className="font-medium">Middle Name:</span> {g.Middlename}
                  </p>
                  <p>
                    <span className="font-medium">Surname:</span> {g.Surname}
                  </p>
                  <p>
                    <span className="font-medium">Prefix:</span> {g.prefix}
                  </p>
                  <p>
                    <span className="font-medium">Mobile:</span> {g.mobile}
                  </p>
                  <p>
                    <span className="font-medium">ID Number:</span> {g.id_number}
                  </p>
                  <p>
                    <span className="font-medium">Occupation:</span> {g.occupation}
                  </p>
                  <p>
                    <span className="font-medium">Relationship:</span> {g.relationship}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No guarantors found.</p>
          )}
        </section>

        {/* GUARANTORS SECURITY */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
            Guarantors Security
          </h3>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading security data...</p>
          ) : guarantorSecurity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Identification</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Value (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {guarantorSecurity.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{s.item}</td>
                      <td className="px-4 py-2 text-sm">{s.description}</td>
                      <td className="px-4 py-2 text-sm">{s.identification}</td>
                      <td className="px-4 py-2 text-sm">{s.estimated_market_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No guarantor security found.
            </p>
          )}
        </section>

        {/* NEXT OF KIN */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
            Next of Kin Information
          </h3>
          {customer.nextOfKin?.length > 0 ? (
            customer.nextOfKin.map((n) => (
              <div key={n.id} className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">{n.Firstname} {n.Middlename} {n.Surname}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p>
                    <span className="font-medium">First Name:</span> {n.Firstname}
                  </p>
                  <p>
                    <span className="font-medium">Middle Name:</span> {n.Middlename}
                  </p>
                  <p>
                    <span className="font-medium">Surname:</span> {n.Surname}
                  </p>
                  <p>
                    <span className="font-medium">ID Number:</span> {n.id_number}
                  </p>
                  <p>
                    <span className="font-medium">Mobile:</span> {n.mobile}
                  </p>
                  <p>
                    <span className="font-medium">Relationship:</span> {n.relationship}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No next of kin found.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default CustomerDetailsModal;