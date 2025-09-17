import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

function EditAmendment({ amendmentId, onClose }) {
  const [amendment, setAmendment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    final_decision: '',
    overall_comment: ''
  });

  useEffect(() => {
    if (amendmentId) {
      fetchAmendment();
    }
  }, [amendmentId]);

  const fetchAmendment = async () => {
    const { data, error } = await supabase
      .from("loan_verifications")
      .select(`
        *,
        customers:customer_id (
          id,
          firstname,
          surname,
          phone
        )
      `)
      .eq("id", amendmentId)
      .single();
    
    if (error) {
      console.error("Error fetching amendment:", error.message);
    } else {
      setAmendment(data);
      setFormData({
        final_decision: data.final_decision || '',
        overall_comment: data.overall_comment || ''
      });
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from("loan_verifications")
      .update({
        final_decision: formData.final_decision,
        overall_comment: formData.overall_comment,
        status: formData.final_decision ? 'reviewed' : 'pending',
        reviewed_at: new Date().toISOString()
      })
      .eq("id", amendmentId);
    
    if (error) {
      console.error("Error updating amendment:", error.message);
    }
    
    setSaving(false);
    onClose();
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Update Amendment</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              &times;
            </button>
          </div>
          
          {amendment && (
            <div className="mb-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{amendment.customers?.firstname} {amendment.customers?.surname}</p>
                <p className="text-sm text-gray-600">Phone: {amendment.customers?.phone}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Final Decision</label>
                <select 
                  name="final_decision"
                  value={formData.final_decision}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select decision</option>
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Overall Comments</label>
                <textarea 
                  name="overall_comment"
                  value={formData.overall_comment}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your overall comments here"
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditAmendment;