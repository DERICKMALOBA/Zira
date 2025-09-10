// src/pages/relationship-officer/Leads.jsx
import React, { useState } from "react";

const Leads = () => {
  const [leads, setLeads] = useState([
    {
      id: 1,
      name: "John Doe",
      phone: "0712345678",
      business: "Electronics Shop",
      location: "Nairobi",
      status: "Hot",
    },
    {
      id: 2,
      name: "Mary Jane",
      phone: "0798765432",
      business: "Clothing Store",
      location: "Mombasa",
      status: "Warm",
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    business: "",
    location: "",
    status: "Cold",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewLead({ ...newLead, [name]: value });
  };

  const addLead = (e) => {
    e.preventDefault();
    setLeads([...leads, { id: Date.now(), ...newLead }]);
    setNewLead({ name: "", phone: "", business: "", location: "", status: "Cold" });
    setShowForm(false);
  };

  const convertToCustomer = (id) => {
    alert(`Lead ${id} converted to customer!`);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Hot":
        return "bg-red-100 text-red-600";
      case "Warm":
        return "bg-yellow-100 text-yellow-600";
      case "Cold":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow hover:bg-indigo-700 transition"
        >
          + Add Lead
        </button>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Business</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{lead.name}</td>
                <td className="px-4 py-3">{lead.phone}</td>
                <td className="px-4 py-3">{lead.business}</td>
                <td className="px-4 py-3">{lead.location}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(
                      lead.status
                    )}`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => convertToCustomer(lead.id)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Convert
                  </button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                  No leads available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
            <h2 className="text-lg font-bold mb-4">Add New Lead</h2>
            <form onSubmit={addLead} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newLead.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={newLead.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business</label>
                <input
                  type="text"
                  name="business"
                  value={newLead.business}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  value={newLead.location}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={newLead.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                >
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
