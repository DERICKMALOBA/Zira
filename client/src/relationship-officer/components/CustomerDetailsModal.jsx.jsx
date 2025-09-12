// src/components/CustomerDetailsModal.jsx
import React from "react";

function CustomerDetailsModal({ customer, onClose }) {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl w-4/5 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* HEADER */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-2xl  text-center font-bold text-green-600">
            {customer.prefix} {customer.Firstname} {customer.Surname}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* PERSONAL INFO */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-1">
            Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>Mobile:</strong> {customer.mobile}</p>
            <p><strong>ID Number:</strong> {customer.id_number}</p>
            <p><strong>Town:</strong> {customer.town}</p>
            <p><strong>Postal Address:</strong> {customer.postal_address} - {customer.code}</p>
            <p><strong>County:</strong> {customer.county}</p>
          </div>
        </section>

        {/* BUSINESS INFO */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-1">
            Business Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>Business:</strong> {customer.business_name}</p>
            <p><strong>Year Established:</strong> {customer.year_established}</p>
            <p><strong>Location:</strong> {customer.business_location}</p>
            <p><strong>Road:</strong> {customer.road}</p>
            <p><strong>Landmark:</strong> {customer.landmark}</p>
          </div>
        </section>

        {/* BORROWER SECURITY */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-1">
            Borrower Security
          </h3>
          {customer.security?.length > 0 ? (
            <div className="space-y-2 text-sm">
              {customer.security.map((s) => (
                <div
                  key={s.id}
                  className="p-3 border rounded-lg bg-gray-50"
                >
                  <p><strong>Item:</strong> {s.item}</p>
                  <p><strong>Identification:</strong> {s.identification}</p>
                  <p><strong>Value:</strong> KES {s.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No security items found.</p>
          )}
        </section>

        {/* GUARANTORS */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-1">
            Guarantors
          </h3>
          {customer.guarantors?.length > 0 ? (
            <div className="space-y-2 text-sm">
              {customer.guarantors.map((g) => (
                <div
                  key={g.id}
                  className="p-3 border rounded-lg bg-gray-50"
                >
                  <p><strong>Name:</strong> {g.prefix} {g.name}</p>
                  <p><strong>Mobile:</strong> {g.mobile}</p>
                  <p><strong>Occupation:</strong> {g.occupation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No guarantors found.</p>
          )}
        </section>

        {/* GUARANTORS SECURITY */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-1">
            Guarantors Security
          </h3>
          {customer.guarantorSecurity?.length > 0 ? (
            <div className="space-y-2 text-sm">
              {customer.guarantorSecurity.map((s) => (
                <div
                  key={s.id}
                  className="p-3 border rounded-lg bg-gray-50"
                >
                  <p><strong>Item:</strong> {s.item}</p>
                  <p><strong>Identification:</strong> {s.identification}</p>
                  <p><strong>Value:</strong> KES {s.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No guarantor security items found.</p>
          )}
        </section>

        {/* NEXT OF KIN */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-1">
            Next of Kin
          </h3>
          {customer.nextOfKin?.length > 0 ? (
            <div className="space-y-2 text-sm">
              {customer.nextOfKin.map((n) => (
                <div
                  key={n.id}
                  className="p-3 border rounded-lg bg-gray-50"
                >
                  <p><strong>Name:</strong> {n.name}</p>
                  <p><strong>Mobile:</strong> {n.mobile}</p>
                  <p><strong>Relationship:</strong> {n.relationship}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No next of kin found.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default CustomerDetailsModal;
