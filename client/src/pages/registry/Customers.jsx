// src/pages/registry/Customers.jsx
import { useState, useEffect } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../supabaseClient";
import CustomerDetailsModal from "../../relationship-officer/components/CustomerDetailsModal.jsx";
import LoanVerificationForm from "../../loan/LoanVerificationForm.jsx";
import AddCustomer from "../../relationship-officer/components/AddCustomer.jsx";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
   const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Fetch customers from Supabase
  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("customers")
        .select(
          `
        *,
        loans ( id, principal, product, duration_weeks, processing_fee, registration_fee, interest_rate, created_at )
      `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching customers:", error);
        return;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };
  const verifyCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;

    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);

      if (error) {
        console.error("Error deleting customer:", error);
        return;
      }

      setCustomers(customers.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // 🔍 Filter customers by name, phone, or id
  const filteredCustomers = customers.filter(
    (c) =>
      (c.Firstname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Surname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Middlename || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.mobile || "").toString().includes(searchTerm) ||
      (c.id_number || "").toString().includes(searchTerm)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Customer Management
        </h1>

        <div>


            {/* Button */}
      <button
        onClick={() => setShowAddCustomer(true)} // open modal/form
        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add New Customer
      </button>

      {/* Conditionally render AddCustomer */}
      {showAddCustomer && (
        <AddCustomer onClose={() => setShowAddCustomer(false)} />
      )}
        </div>
       
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Customers
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, mobile, or ID..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} // ✅ switch to local filter
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end space-x-2">
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
              <FunnelIcon className="h-5 w-5 mr-2" />
              More Filters
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  First Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Surname
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Middle Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Principle Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{customer.Firstname}</td>
                  <td className="px-6 py-4">{customer.Surname}</td>
                  <td className="px-6 py-4">{customer.Middlename || "N/A"}</td>
                  <td className="px-6 py-4">{customer.mobile}</td>
                  <td className="px-6 py-4">{customer.id_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {customer.loans && customer.loans.length > 0
                      ? customer.loans[0].principal.toLocaleString("en-KE", {
                          style: "currency",
                          currency: "KES",
                        })
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewCustomerDetails(customer)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => verifyCustomer(customer)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <h1>Verify</h1>
                      </button>
                      <button
                        onClick={() => deleteCustomer(customer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {customers.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            No customers found matching your criteria.
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Customer Details Modal */}
      {showForm && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full relative rounded-none shadow-xl">
            {/* Close button */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-bold"
            >
              ✕
            </button>

            {/* Loan form takes the whole screen */}
            <div className="p-6 h-full overflow-y-auto">
              <LoanVerificationForm
                customerId={selectedCustomer.id}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
