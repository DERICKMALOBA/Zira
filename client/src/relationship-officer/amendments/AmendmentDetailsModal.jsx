function AmendmentDetailsModal({ amendment, onClose }) {
  // Helper function to get status badge
  const getStatusBadge = (status) => {
    if (status === null || status === undefined) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Not Reviewed
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          status
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {status ? "✓ Verified" : "✗ Not Verified"}
      </span>
    );
  };

  // Helper function to get decision badge
  const getDecisionBadge = (decision) => {
    if (!decision) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Pending
        </span>
      );
    }
    
    const colors = {
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800"
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors[decision] || colors.pending}`}>
        {decision.charAt(0).toUpperCase() + decision.slice(1)}
      </span>
    );
  };

  // Helper function to render verification section
  const renderVerificationSection = (role, roleData, roleLabel) => {
    const hasData = Object.values(roleData).some(value => value !== null && value !== undefined);
    
    if (!hasData) {
      return (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{roleLabel} Verification</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Not Started
            </span>
          </div>
          <p className="text-gray-500 italic">No verification data available</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">{roleLabel} Verification</h3>
          <div className="flex items-center space-x-2">
            {getDecisionBadge(roleData.final_decision)}
            {roleData.verified_at && (
              <span className="text-xs text-gray-500">
                {new Date(roleData.verified_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Customer Information */}
          {(roleData.customer_id_verified !== undefined || roleData.customer_phone_verified !== undefined || roleData.customer_comment) && (
            <div className="border-l-4 border-blue-400 pl-4">
              <h4 className="font-medium text-gray-800 mb-3">Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roleData.customer_id_verified !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ID Verified:</span>
                    {getStatusBadge(roleData.customer_id_verified)}
                  </div>
                )}
                {roleData.customer_phone_verified !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Phone Verified:</span>
                    {getStatusBadge(roleData.customer_phone_verified)}
                  </div>
                )}
              </div>
              {roleData.customer_comment && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Comment:</p>
                  <p className="text-sm bg-blue-50 p-2 rounded text-gray-700">
                    {roleData.customer_comment}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Business Information */}
          {(roleData.business_verified !== undefined || roleData.business_comment) && (
            <div className="border-l-4 border-green-400 pl-4">
              <h4 className="font-medium text-gray-800 mb-3">Business Information</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Business Verified:</span>
                {getStatusBadge(roleData.business_verified)}
              </div>
              {roleData.business_comment && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Comment:</p>
                  <p className="text-sm bg-green-50 p-2 rounded text-gray-700">
                    {roleData.business_comment}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Document Information */}
          {(roleData.document_verified !== undefined || roleData.document_comment) && (
            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="font-medium text-gray-800 mb-3">Document Verification</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Documents Verified:</span>
                {getStatusBadge(roleData.document_verified)}
              </div>
              {roleData.document_comment && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Comment:</p>
                  <p className="text-sm bg-purple-50 p-2 rounded text-gray-700">
                    {roleData.document_comment}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Guarantor Information */}
          {(roleData.guarantor_id_verified !== undefined || roleData.guarantor_phone_verified !== undefined || roleData.guarantor_comment) && (
            <div className="border-l-4 border-orange-400 pl-4">
              <h4 className="font-medium text-gray-800 mb-3">Guarantor Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roleData.guarantor_id_verified !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ID Verified:</span>
                    {getStatusBadge(roleData.guarantor_id_verified)}
                  </div>
                )}
                {roleData.guarantor_phone_verified !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Phone Verified:</span>
                    {getStatusBadge(roleData.guarantor_phone_verified)}
                  </div>
                )}
              </div>
              {roleData.guarantor_comment && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Comment:</p>
                  <p className="text-sm bg-orange-50 p-2 rounded text-gray-700">
                    {roleData.guarantor_comment}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Security Information */}
          {(roleData.borrower_security_verified !== undefined || roleData.borrower_security_comment || roleData.guarantor_security_verified !== undefined || roleData.guarantor_security_comment) && (
            <div className="border-l-4 border-red-400 pl-4">
              <h4 className="font-medium text-gray-800 mb-3">Security Information</h4>
              <div className="space-y-4">
                {(roleData.borrower_security_verified !== undefined || roleData.borrower_security_comment) && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Borrower Security:</span>
                      {getStatusBadge(roleData.borrower_security_verified)}
                    </div>
                    {roleData.borrower_security_comment && (
                      <p className="text-sm bg-red-50 p-2 rounded text-gray-700 ml-4">
                        <span className="text-xs text-gray-500">Comment: </span>
                        {roleData.borrower_security_comment}
                      </p>
                    )}
                  </div>
                )}
                
                {(roleData.guarantor_security_verified !== undefined || roleData.guarantor_security_comment) && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Guarantor Security:</span>
                      {getStatusBadge(roleData.guarantor_security_verified)}
                    </div>
                    {roleData.guarantor_security_comment && (
                      <p className="text-sm bg-red-50 p-2 rounded text-gray-700 ml-4">
                        <span className="text-xs text-gray-500">Comment: </span>
                        {roleData.guarantor_security_comment}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next of Kin */}
          {(roleData.next_of_kin_verified !== undefined || roleData.next_of_kin_comment) && (
            <div className="border-l-4 border-indigo-400 pl-4">
              <h4 className="font-medium text-gray-800 mb-3">Next of Kin</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Next of Kin Verified:</span>
                {getStatusBadge(roleData.next_of_kin_verified)}
              </div>
              {roleData.next_of_kin_comment && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Comment:</p>
                  <p className="text-sm bg-indigo-50 p-2 rounded text-gray-700">
                    {roleData.next_of_kin_comment}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Loan Information */}
          {(roleData.loan_scored_amount !== undefined || roleData.loan_comment) && (
            <div className="border-l-4 border-yellow-400 pl-4">
              <h4 className="font-medium text-gray-800 mb-3">Loan Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {roleData.loan_scored_amount !== undefined && (
                  <div>
                    <span className="text-sm text-gray-600">Scored Amount:</span>
                    <p className="font-medium text-gray-800">
                      {roleData.loan_scored_amount ? `KES ${Number(roleData.loan_scored_amount).toLocaleString()}` : 'Not Set'}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Final Decision:</span>
                  <div className="mt-1">
                    {getDecisionBadge(roleData.final_decision)}
                  </div>
                </div>
              </div>
              {roleData.loan_comment && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Comment:</p>
                  <p className="text-sm bg-yellow-50 p-2 rounded text-gray-700">
                    {roleData.loan_comment}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Overall Assessment */}
          {roleData.overall_comment && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Overall Assessment</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {roleData.overall_comment}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Extract role-specific data
  const bmData = {
    customer_id_verified: amendment.branch_manager_customer_id_verified,
    customer_phone_verified: amendment.branch_manager_customer_phone_verified,
    customer_comment: amendment.branch_manager_customer_comment,
    business_verified: amendment.branch_manager_business_verified,
    business_comment: amendment.branch_manager_business_comment,
    document_verified: amendment.branch_manager_document_verified,
    document_comment: amendment.branch_manager_document_comment,
    guarantor_id_verified: amendment.branch_manager_guarantor_id_verified,
    guarantor_phone_verified: amendment.branch_manager_guarantor_phone_verified,
    guarantor_comment: amendment.branch_manager_guarantor_comment,
    borrower_security_verified: amendment.branch_manager_borrower_security_verified,
    borrower_security_comment: amendment.branch_manager_borrower_security_comment,
    guarantor_security_verified: amendment.branch_manager_guarantor_security_verified,
    guarantor_security_comment: amendment.branch_manager_guarantor_security_comment,
    next_of_kin_verified: amendment.branch_manager_next_of_kin_verified,
    next_of_kin_comment: amendment.branch_manager_next_of_kin_comment,
    loan_scored_amount: amendment.branch_manager_loan_scored_amount,
    loan_comment: amendment.branch_manager_loan_comment,
    final_decision: amendment.branch_manager_final_decision,
    overall_comment: amendment.branch_manager_overall_comment,
    verified_at: amendment.branch_manager_verified_at,
    verified_by: amendment.branch_manager_verified_by
  };

  const coData = {
    customer_id_verified: amendment.co_customer_id_verified,
    customer_phone_verified: amendment.co_customer_phone_verified,
    customer_comment: amendment.co_customer_comment,
    business_verified: amendment.co_business_verified,
    business_comment: amendment.co_business_comment,
    document_verified: amendment.co_document_verified,
    document_comment: amendment.co_document_comment,
    guarantor_id_verified: amendment.co_guarantor_id_verified,
    guarantor_phone_verified: amendment.co_guarantor_phone_verified,
    guarantor_comment: amendment.co_guarantor_comment,
    borrower_security_verified: amendment.co_borrower_security_verified,
    borrower_security_comment: amendment.co_borrower_security_comment,
    guarantor_security_verified: amendment.co_guarantor_security_verified,
    guarantor_security_comment: amendment.co_guarantor_security_comment,
    next_of_kin_verified: amendment.co_next_of_kin_verified,
    next_of_kin_comment: amendment.co_next_of_kin_comment,
    loan_scored_amount: amendment.co_loan_scored_amount,
    loan_comment: amendment.co_loan_comment,
    final_decision: amendment.co_final_decision,
    overall_comment: amendment.co_overall_comment,
    verified_at: amendment.co_verified_at,
    verified_by: amendment.co_verified_by
  };

  const creditAnalystData = {
    customer_id_verified: amendment.credit_analyst_officer_customer_id_verified,
    customer_phone_verified: amendment.credit_analyst_officer_customer_phone_verified,
    customer_comment: amendment.credit_analyst_officer_customer_comment,
    business_verified: amendment.credit_analyst_officer_business_verified,
    business_comment: amendment.credit_analyst_officer_business_comment,
    document_verified: amendment.credit_analyst_officer_document_verified,
    document_comment: amendment.credit_analyst_document_comment,
    guarantor_id_verified: amendment.credit_analyst_officer_guarantor_id_verified,
    guarantor_phone_verified: amendment.credit_analyst_officer_guarantor_phone_verified,
    guarantor_comment: amendment.credit_analyst_officer_guarantor_comment,
    borrower_security_verified: amendment.credit_analyst_officer_borrower_security_verified,
    borrower_security_comment: amendment.credit_analyst_officer_borrower_security_comment,
    guarantor_security_verified: amendment.credit_analyst_officer_guarantor_security_verified,
    guarantor_security_comment: amendment.credit_analyst_officer_guarantor_security_comment,
    next_of_kin_verified: amendment.credit_analyst_officer_next_of_kin_verified,
    next_of_kin_comment: amendment.credit_analyst_officer_next_of_kin_comment,
    loan_scored_amount: amendment.credit_analyst_officer_loan_scored_amount,
    loan_comment: amendment.credit_analyst_officer_loan_comment,
    final_decision: amendment.credit_analyst_officer_final_decision,
    overall_comment: amendment.credit_analyst_officer_overall_comment,
    verified_at: amendment.credit_analyst_officer_verified_at,
    verified_by: amendment.credit_analyst_officer_verified_by
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b border-gray-200 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Customer: {amendment.customers?.Firstname} {amendment.customers?.Surname} 
              {amendment.customers?.mobile && ` • ${amendment.customers.mobile}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-3xl leading-none hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Branch Manager Verification */}
          {renderVerificationSection('bm', bmData, 'Branch Manager')}
          
          {/* Customer Service Officer Verification */}
          {renderVerificationSection('co', coData, 'Customer Service Officer')}
          
          {/* Credit Analyst Officer Verification */}
          {renderVerificationSection('credit_analyst', creditAnalystData, 'Credit Analyst Officer')}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white flex justify-end gap-3 p-6 border-t border-gray-200 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AmendmentDetailsModal;