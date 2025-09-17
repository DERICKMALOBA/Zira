
import  { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
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


  
 // Fetch single customer details + relations
const fetchCustomerDetails = async (id) => {
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
    console.log("customer data ",customer);

  if (customerError) {
    console.error("Error fetching customer:", customerError.message);
    return;
  }

  const { data: guarantors } = await supabase
    .from("guarantors")
    .select("*")
    .eq("customer_id", id);

  const { data: nextOfKin } = await supabase
    .from("next_of_kin")
    .select("*")
    .eq("customer_id", id);

  const { data: borrower_security } = await supabase
    .from("borrower_security")
    .select("*")
    .eq("customer_id", id);

  const { data: guarantor_security } = await supabase
    .from("guarantor_security")
    .select("*")
    .eq("customer_id", id);
    console.log("guarantor ",guarantor_security);

  setViewCustomer({
    ...customer,
    guarantors: guarantors || [],
    nextOfKin: nextOfKin || [],
    borrowerSecurity: borrower_security || [], // Make sure this matches
    guarantorSecurity: guarantor_security || []
  });
};




  return (
    <div className="p-6">
      {/* Header */}
     <div className="mb-8 text-center">
             <h1 className="text-green-600 font-serif mb-2 mt-0 text-xl ">Customers' Table</h1>
              <p className="text-gray-600 mb-6">Manage your customers here.</p>
     </div>
   

      {/* Table */}
      <CustomersTable
        customers={customers}
        loading={loading}
        onEdit={(c) => {
          setEditCustomer(c.id);
          setShowForm(true);
        }}
       
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
