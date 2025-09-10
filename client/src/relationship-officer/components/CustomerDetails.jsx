// src/components/CustomerDetailsModal.jsx
import React from "react";

function CustomerDetailsModal({ customer, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-3/4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          Customer Details – {customer.Firstname} {customer.Surname}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <p><strong>Mobile:</strong> {customer.mobile}</p>
          <p><strong>Business:</strong> {customer.business_name}</p>
          <p><strong>Town:</strong> {customer.town}</p>
          <p><strong>Postal Address:</strong> {customer.postal_address}</p>
          <p><strong>Postal Code:</strong> {customer.code}</p>
          <p><strong>County:</strong> {customer.county}</p>
        </div>

        <h3 className="mt-6 font-semibold">Guarantors</h3>
        {customer.guarantors?.length > 0 ? (
          <ul className="list-disc ml-6">
            {customer.guarantors.map((g) => (
              <li key={g.id}>{g.name} – {g.mobile}</li>
            ))}
          </ul>
        ) : <p>No guarantors found.</p>}

        <h3 className="mt-6 font-semibold">Next of Kin</h3>
        {customer.nextOfKin?.length > 0 ? (
          <ul className="list-disc ml-6">
            {customer.nextOfKin.map((n) => (
              <li key={n.id}>{n.name} – {n.mobile}</li>
            ))}
          </ul>
        ) : <p>No next of kin found.</p>}

        <h3 className="mt-6 font-semibold">Borrower Security</h3>
        {customer.security?.length > 0 ? (
          <ul className="list-disc ml-6">
            {customer.security.map((s) => (
              <li key={s.id}>
                {s.item} ({s.identification}) – KES {s.market_value}
              </li>
            ))}
          </ul>
        ) : <p>No security items found.</p>}

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetailsModal;
