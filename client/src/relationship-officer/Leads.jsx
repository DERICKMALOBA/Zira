// src/pages/relationship-officer/Leads.jsx
import React, { useState, useEffect } from "react";
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
  const [searchTerm, setSearchTerm] = useState(""); // ✅ search state
  const [newLead, setNewLead] = useState({
    Firstname: "",
    Surname: "",
      mobile: "",
    business_name: "",
    business_location: "",
    status: "Cold",
  });

  // Fetch leads
  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) {
        toast.error("Failed to fetch leads");
        console.error("Error fetching leads:", error);
      } else {
        setLeads(data);
      }
    };
    fetchLeads();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewLead({ ...newLead, [name]: value });
  };

  // Save new lead
  const addLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const { data, error } = await supabase
      .from("leads")
      .insert([newLead])
      .select();

    setIsSaving(false);

    if (error) {
      if (error.code === "23505") {
        // unique violation (Postgres)
        toast.error("Lead with this phone number already exists!");
      } else {
        toast.error("Error saving lead");
      }
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

  // Convert lead to customer
 
const handleConvertToCustomer = (lead) => {
  setSelectedLead(lead);
  setShowCustomerForm(true);
};


  //  Filter leads by name or phone
  const filteredLeads = leads.filter(
    (lead) =>
      lead.Firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.Surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobile.includes(searchTerm)
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
          onChange={(e) => setSearchTerm(e.target.value)}
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
              <th className="px-4 py-3 text-left"> Business Location</th>
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
                    disabled={isSaving}
                    className={`px-3 py-1 rounded-lg text-white ${
                      isSaving
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isSaving ? "Saving..." : "Convert to Customer"}
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
              {/* Inputs... */}
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
                      : "bg-indigo-600 hover:bg-indigo-700"
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
        />
      )}
    </div>
  );
};

export default Leads;
