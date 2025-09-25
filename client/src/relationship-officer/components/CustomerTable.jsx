import { useState } from "react";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  UserCircleIcon,
  DevicePhoneMobileIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import AddCustomer from "./AddCustomer"; // import the separate AddCustomer component

function CustomersTable({ customers, loading,  onView, profile }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortedCustomers = (customersList) => {
    if (!sortConfig.key) return customersList;
    return [...customersList].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filteredCustomers = customers?.filter(
    (c) =>
      c.Firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.Surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile?.toString().includes(searchTerm) ||
      c.id_number?.toString().includes(searchTerm) ||
      c.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.town?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedCustomers = getSortedCustomers(filteredCustomers);

  const SortButton = ({ column, label, icon: Icon }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 text-left font-semibold text-indigo-700 hover:text-indigo-900 whitespace-nowrap"
    >
      <Icon className="h-4 w-4 text-gray-500" />
      <span className="text-sm">{label}</span>
      {sortConfig.key === column && (
        <span>
          {sortConfig.direction === "asc" ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
        </span>
      )}
    </button>
  );

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-gray-500">Loading customers...</div>
    </div>
  );

  return (
    <div className="p-8">
      {/* Top Info & Add */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
          <UserGroupIcon className="h-6 w-6 text-indigo-600" />
          <span className="font-semibold text-indigo-700">{customers?.length || 0} Customers</span>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            <PlusIcon className="h-5 w-5" /> Add Customer
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-indigo-100">
        <table className="w-full table-fixed border-collapse">
          <thead className="bg-indigo-50">
            <tr>
              <th className="p-4 text-left"><SortButton column="prefix" label="Prefix" icon={UserCircleIcon} /></th>
              <th className="p-4 text-left"><SortButton column="Firstname" label="First Name" icon={UserCircleIcon} /></th>
              <th className="p-4 text-left"><SortButton column="Surname" label="Surname" icon={UserCircleIcon} /></th>
              <th className="p-4 text-left"><SortButton column="mobile" label="Mobile" icon={DevicePhoneMobileIcon} /></th>
              <th className="p-4 text-left"><SortButton column="id_number" label="ID Number" icon={IdentificationIcon} /></th>
              <th className="p-4 text-left"><SortButton column="business_name" label="Business" icon={BuildingOffice2Icon} /></th>
              <th className="p-4 text-left"><SortButton column="town" label="Location" icon={MapPinIcon} /></th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.length > 0 ? (
              sortedCustomers.map((customer, i) => (
                <tr key={customer.id || i} className="hover:bg-indigo-50 transition">
                  <td className="p-4 text-gray-700">{customer.prefix || "Mr./Ms."}</td>
                  <td className="p-4 font-medium">{customer.Firstname}</td>
                  <td className="p-4 font-medium">{customer.Surname}</td>
                  <td className="p-4">{customer.mobile}</td>
                  <td className="p-4 font-mono">{customer.id_number}</td>
                  <td className="p-4">{customer.business_name || "N/A"}</td>
                  <td className="p-4">{customer.town || "N/A"}</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => onView(customer.id)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {/* <button onClick={() => onEdit(customer)}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                      <PencilSquareIcon className="h-5 w-5" />
                    </button> */}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-12 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Render AddCustomer modal if showForm is true */}
      {showForm && <AddCustomer profile={profile} onClose={() => setShowForm(false)} />}
    </div>
  );
}

export default CustomersTable;
