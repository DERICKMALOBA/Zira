// src/components/CustomersTable.jsx
import React from "react";
import { Pencil, Trash2, Eye } from "lucide-react";

function CustomersTable({ customers, loading, onEdit, onDelete, onView }) {
  if (loading) return <p>Loading customers...</p>;
  if (customers.length === 0) return <p>No customers found.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 rounded-lg shadow-sm text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3 border-b">First Name</th>
            <th className="p-3 border-b">Surname</th>
            <th className="p-3 border-b">Mobile</th>
            <th className="p-3 border-b">Business</th>
            <th className="p-3 border-b">Town</th>
            <th className="p-3 border-b text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{c.Firstname}</td>
              <td className="p-3 border-b">{c.Surname}</td>
              <td className="p-3 border-b">{c.mobile}</td>
              <td className="p-3 border-b">{c.business_name}</td>
              <td className="p-3 border-b">{c.town}</td>
              <td className="p-3 border-b flex justify-center gap-3">
                <button
                  onClick={() => onView(c.id)}
                  className="text-green-600 hover:text-green-800"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => onEdit(c)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CustomersTable;
