// src/pages/relationship-officer/Leads.jsx
import { useState, useEffect } from "react";
import CustomerForm from "../relationship-officer/components/CustomerForm";
import { supabase } from "../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newLead, setNewLead] = useState({
    Firstname: "",
    Surname: "",
    mobile: "",
    business_name: "",
    business_location: "",
    business_type:"",
    status: "Cold",
  });

  // Fetch leads
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data, error } = await supabase.from("leads").select("*");
    if (error) {
      toast.error("Failed to fetch leads");
      console.error("Error fetching leads:", error);
    } else {
      setLeads(data);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewLead({ ...newLead, [name]: value });
  };

  // --- helper to check uniqueness ---
  const checkUniqueMobile = async (mobile) => {
    const { data, error } = await supabase
      .from("leads")
      .select("id")
      .eq("mobile", mobile);

    if (error) {
      console.error("Error checking mobile uniqueness:", error);
      return false; // fail safe: treat as duplicate
    }

    return data.length === 0; // true if unique
  };

  // --- Save new lead ---
  const addLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // --- validation ---
    if (!/^[0-9]{10,15}$/.test(newLead.mobile.replace(/\D/g, ""))) {
      toast.error("Please enter a valid mobile number (10–15 digits).");
      setIsSaving(false);
      return;
    }

    const isUnique = await checkUniqueMobile(newLead.mobile);
    if (!isUnique) {
      toast.error("A lead with this phone number already exists!");
      setIsSaving(false);
      return;
    }

    // --- insert lead if valid ---
    const { data, error } = await supabase
      .from("leads")
      .insert([newLead])
      .select();

    setIsSaving(false);

    if (error) {
      toast.error("Error saving lead");
      console.error("Error saving lead:", error);
      return;
    }

    setLeads([...leads, data[0]]);
    setNewLead({
      Firstname: "",
      Surname: "",
      mobile: "",
      business_name: "",
      business_location: "",
      status: "Cold",
    });
    setShowLeadForm(false);
    toast.success("Lead saved successfully");
  };

  // // Save new lead
  // const addLead = async (e) => {
  //   e.preventDefault();
  //   setIsSaving(true);

  //   const { data} = await supabase
  //     .from("leads")
  //     .insert([newLead])
  //     .select();

  //   setIsSaving(false);

  //   setLeads([...leads, data[0]]);
  //   setNewLead({
  //     Firstname: "",
  //     Surname: "",
  //     mobile: "",
  //     business_name: "",
  //     business_location: "",
  //     status: "Cold",
  //   });
  //   setShowLeadForm(false);
  //   toast.success("Lead saved successfully");
  // };

  // Convert lead to customer
  const handleConvertToCustomer = (lead) => {
    setSelectedLead(lead);
    setShowCustomerForm(true);
  };

  // Handle successful customer conversion
  const handleCustomerConversionSuccess = async (leadId) => {
    try {
      // Delete the lead from the database
      const { error } = await supabase.from("leads").delete().eq("id", leadId);

      if (error) {
        console.error("Error deleting lead:", error);
        toast.error("Failed to remove lead after conversion");
        return;
      }

      // Remove the lead from the local state
      setLeads(leads.filter((lead) => lead.id !== leadId));
      toast.success(
        "Lead successfully converted to customer and removed from leads"
      );
    } catch (error) {
      console.error("Error handling lead conversion:", error);
      toast.error("Error processing lead conversion");
    }
  };

  // 🔍 Filter customers by name, phone, or id
  // Filtered leads
  const filteredLeads = leads.filter(
    (lead) =>
      (lead.Firstname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.Surname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.mobile || "").toString().includes(searchTerm) ||
      (lead.id_number || "").toString().includes(searchTerm)
  );

  return (
    <div className="p-6">
      {/* Toastify Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
        <button
          onClick={() => setShowLeadForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Add Lead
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // ✅ fix here
          className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-200 focus:border-indigo-500"
        />
      </div>

      {/* Leads Count */}
      <p className="mb-4 text-gray-600">Total Leads: {filteredLeads.length}</p>

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 bg-white rounded-lg shadow-md">
          <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Firstname</th>
              <th className="px-4 py-3 text-left">Surname</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Business Name</th>
                            <th className="px-4 py-3 text-left">Business Type</th>

              <th className="px-4 py-3 text-left">Business Location</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{lead.Firstname}</td>
                <td className="px-4 py-3">{lead.Surname}</td>
                <td className="px-4 py-3">{lead.mobile}</td>
                <td className="px-4 py-3">{lead.business_name}</td>
                                <td className="px-4 py-3">{lead.business_type}</td>

                <td className="px-4 py-3">{lead.business_location}</td>
                <td>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      lead.status === "Hot"
                        ? "bg-red-100 text-red-700"
                        : lead.status === "Warm"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleConvertToCustomer(lead)}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Convert to Customer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Lead Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
            <h2 className="text-lg font-bold mb-4">Add New Lead</h2>
            <form onSubmit={addLead} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Firstname
                </label>
                <input
                  type="text"
                  name="Firstname"
                  value={newLead.Firstname}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Surname
                </label>
                <input
                  type="text"
                  name="Surname"
                  value={newLead.Surname}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={newLead.mobile}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={newLead.business_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

    <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Type
                </label>
                <input
                  type="text"
                  name="business_type"
                  value={newLead.business_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Location
                </label>
                <input
                  type="text"
                  name="business_location"
                  value={newLead.business_location}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  value={newLead.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLeadForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-4 py-2 text-white rounded-lg ${
                    isSaving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isSaving ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Form */}
      {showCustomerForm && (
        <CustomerForm
          leadData={selectedLead}
          onClose={() => setShowCustomerForm(false)}
          onConversionSuccess={(leadId) =>
            handleCustomerConversionSuccess(leadId)
          }
        />
      )}
    </div>
  );
};

export default Leads;
