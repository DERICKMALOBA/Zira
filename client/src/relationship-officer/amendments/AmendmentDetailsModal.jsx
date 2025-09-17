function AmendmentDetailsModal({ amendment, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transition-transform">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Amendment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Section Component Wrapper */}
          {[
            {
              title: "Customer Information",
              items: [
                {
                  label: "Customer Name",
                  value: `${amendment.customers?.Firstname || ""} ${
                    amendment.customers?.Surname || ""
                  }`,
                },
                {
                  label: "Phone Number",
                  value: amendment.customers?.mobile,
                },
                {
                  label: "Customer ID Verified",
                  badge: amendment.customer_id_verified,
                },
                {
                  label: "Phone Verified",
                  badge: amendment.customer_phone_verified,
                },
              ],
              comment: amendment.customer_comment,
            },
            {
              title: "Business Information",
              items: [
                {
                  label: "Business Verified",
                  badge: amendment.business_verified,
                },
              ],
              comment: amendment.business_comment,
            },
            {
              title: "Security Information",
              items: [
                {
                  label: "Borrower Security Verified",
                  badge: amendment.borrower_security_verified,
                },
                {
                  label: "Guarantor Security Verified",
                  badge: amendment.guarantor_security_verified,
                },
              ],
              dualComments: [
                {
                  label: "Borrower Security Comments",
                  value: amendment.borrower_security_comment,
                },
                {
                  label: "Guarantor Security Comments",
                  value: amendment.guarantor_security_comment,
                },
              ],
            },
            {
              title: "Loan Information",
              items: [
                {
                  label: "Loan Scored Amount",
                  value: amendment.loan_scored_amount
                    ? `KES ${Number(
                        amendment.loan_scored_amount
                      ).toLocaleString()}`
                    : "N/A",
                },
                {
                  label: "Final Decision",
                  decision: amendment.final_decision,
                },
              ],
              comment: amendment.loan_comment,
            },
            {
              title: "Overall Assessment",
              comment: amendment.overall_comment,
            },
          ].map((section, idx) => (
            <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {section.title}
              </h3>

              {section.items && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {section.items.map((item, i) => (
                    <div key={i}>
                      <label className="block text-sm font-medium text-gray-600">
                        {item.label}
                      </label>
                      {item.badge !== undefined ? (
                        <p className="mt-1">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              item.badge
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.badge ? "Verified" : "Not Verified"}
                          </span>
                        </p>
                      ) : item.decision ? (
                        <p className="mt-1">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              item.decision === "approved"
                                ? "bg-green-100 text-green-700"
                                : item.decision === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.decision || "Pending"}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-gray-900">{item.value || "—"}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {section.comment !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Comments
                  </label>
                  <p className="mt-1 p-3 bg-white rounded-md border text-gray-800 text-sm">
                    {section.comment || "No comments"}
                  </p>
                </div>
              )}

              {section.dualComments && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.dualComments.map((c, i) => (
                    <div key={i}>
                      <label className="block text-sm font-medium text-gray-600">
                        {c.label}
                      </label>
                      <p className="mt-1 p-3 bg-white rounded-md border text-gray-800 text-sm">
                        {c.value || "No comments"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AmendmentDetailsModal;
