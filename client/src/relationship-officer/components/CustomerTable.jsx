// src/components/CustomersTable.jsx
import { useState } from "react";
import { Pencil, Trash2, Eye, Search, Users, Plus } from "lucide-react";
import AddCustomer from "./AddCustomer"; 

function CustomersTable({ customers, loading, onEdit, onDelete, onView }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-gray-500 text-sm">Loading customers...</p>
      </div>
    );
  }
if (!customers || customers.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4">
      <p className="text-gray-500 text-sm">No customers found.</p>
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <Plus size={18} /> Add Customer
      </button>

      {/* ✅ AddCustomer Modal */}
      {showForm && <AddCustomer onClose={() => setShowForm(false)} />}
    </div>
  );
}


  // 🔍 Filter customers by name, phone, or id
  const filteredCustomers = customers.filter(
    (c) =>
      c.Firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.Surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile?.toString().includes(searchTerm) ||
      c.id_number?.toString().includes(searchTerm)
  );

  return (
    <div className="w-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        {/* Total Customers */}
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Users size={20} className="text-indigo-600" />
          <span>Total: {customers.length}</span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search by name, phone, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* Add Customer Button */}
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-indigo-50 text-gray-700 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-3 border-b">First Name</th>
              <th className="p-3 border-b">Surname</th>
              <th className="p-3 border-b">Mobile</th>
              <th className="p-3 border-b">ID</th>
              <th className="p-3 border-b">Business</th>
              <th className="p-3 border-b">Town</th>
              <th className="p-3 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c, index) => (
                <tr
                  key={c.id || index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3 border-b">{c.Firstname}</td>
                  <td className="p-3 border-b">{c.Surname}</td>
                  <td className="p-3 border-b">{c.mobile}</td>
                  <td className="p-3 border-b">{c.id_number}</td>
                  <td className="p-3 border-b">{c.business_name}</td>
                  <td className="p-3 border-b">{c.town}</td>
                  <td className="p-3 border-b">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => onView(c.id)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onEdit(c)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(c.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-6 text-gray-500 text-sm"
                >
                  No customers match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ AddCustomer Modal */}
      {showForm && <AddCustomer onClose={() => setShowForm(false)} />}
    </div>
  );
}

export default CustomersTable;
