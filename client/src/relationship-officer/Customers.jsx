
import  { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Plus } from "lucide-react";
import CustomersTable from "./components/CustomerTable";
import CustomerDetailsModal from "./components/CustomerDetailsModal.jsx";
import EditCustomer from "./components/EditCustomer.jsx";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*");
    if (error) console.error("Error fetching customers:", error.message);
    else setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Delete
  const deleteCustomer = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (!error) setCustomers(customers.filter((c) => c.id !== id));
  };

  // Fetch single customer details + relations
  const fetchCustomerDetails = async (id) => {
    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    const { data: guarantors } = await supabase
      .from("guarantors")
      .select("*")
      .eq("customer_id", id);

    const { data: nextOfKin } = await supabase
      .from("next_of_kin")
      .select("*")
      .eq("customer_id", id);

    const { data: security } = await supabase
      .from("borrower_security")
      .select("*")
      .eq("customer_id", id);

    setViewCustomer({
      ...customer,
      guarantors: guarantors || [],
      nextOfKin: nextOfKin || [],
      security: security || [],
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers ({customers.length})</h1>
        <button
          onClick={() => {
            setEditCustomer(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Add Customer
        </button>
      </div>

      {/* Table */}
      <CustomersTable
        customers={customers}
        loading={loading}
        onEdit={(c) => {
          setEditCustomer(c.id);
          setShowForm(true);
        }}
        onDelete={deleteCustomer}
        onView={fetchCustomerDetails}
      />

      {/* Modals */}
      {showForm && (
        <EditCustomer
         customerId={editCustomer}
          onClose={() => {
            setShowForm(false);
            fetchCustomers();
          }}
        />
      )}
  {viewCustomer && (
  <CustomerDetailsModal
    customer={viewCustomer}   
    onClose={() => setViewCustomer(null)}
  />
)}
    </div>
  );
}

export default Customers;
