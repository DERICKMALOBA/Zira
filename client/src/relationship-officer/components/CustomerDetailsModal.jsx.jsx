// src/components/CustomerDetailsModal.jsx
import React from "react";

function CustomerDetailsModal({ customer, onClose }) {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-3/4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {customer.prefix} {customer.Firstname} {customer.Surname}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg font-bold">
            ✕
          </button>
        </div>

        {/* PERSONAL INFO */}
        <section className="mb-6">
          <h3 className="font-semibold mb-2">Personal Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <p><strong>Mobile:</strong> {customer.mobile}</p>
            <p><strong>ID Number:</strong> {customer.id_number}</p>
            <p><strong>Town:</strong> {customer.town}</p>
            <p><strong>Postal Address:</strong> {customer.postal_address} - {customer.code}</p>
            <p><strong>County:</strong> {customer.county}</p>
          </div>
        </section>

        {/* BUSINESS INFO */}
        <section className="mb-6">
          <h3 className="font-semibold mb-2">Business Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <p><strong>Business:</strong> {customer.business_name}</p>
            <p><strong>Year Established:</strong> {customer.year_established}</p>
            <p><strong>Location:</strong> {customer.business_location}</p>
            <p><strong>Road:</strong> {customer.road}</p>
            <p><strong>Landmark:</strong> {customer.landmark}</p>
          </div>
        </section>

        {/* GUARANTORS */}
        <section className="mb-6">
          <h3 className="font-semibold mb-2">Guarantors</h3>
          {customer.guarantors?.length > 0 ? (
            <ul className="list-disc ml-6">
              {customer.guarantors.map((g) => (
                <li key={g.id}>
                  {g.prefix} {g.name} – {g.mobile}, {g.occupation}
                </li>
              ))}
            </ul>
          ) : <p>No guarantors found.</p>}
        </section>

        {/* NEXT OF KIN */}
        <section className="mb-6">
          <h3 className="font-semibold mb-2">Next of Kin</h3>
          {customer.nextOfKin?.length > 0 ? (
            <ul className="list-disc ml-6">
              {customer.nextOfKin.map((n) => (
                <li key={n.id}>{n.name} – {n.mobile}, {n.relationship}</li>
              ))}
            </ul>
          ) : <p>No next of kin found.</p>}
        </section>

        {/* SECURITY */}
        <section className="mb-6">
          <h3 className="font-semibold mb-2">Borrower Security</h3>
          {customer.security?.length > 0 ? (
            <ul className="list-disc ml-6">
              {customer.security.map((s) => (
                <li key={s.id}>
                  {s.item} ({s.identification}) – KES {s.value}
                </li>
              ))}
            </ul>
          ) : <p>No security items found.</p>}
        </section>
      </div>
    </div>
  );
}

export default CustomerDetailsModal;
