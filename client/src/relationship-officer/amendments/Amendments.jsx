import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import AmendmentsTable from "./AmendmentsTable";
import AmendmentDetailsModal from "./AmendmentDetailsModal";
import EditAmendment from "./EditAmendment";

function Amendments() {
  const [amendments, setAmendments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAmendment, setEditAmendment] = useState(null);
  const [viewAmendment, setViewAmendment] = useState(null);

  // Fetch amendments with customer information
  const fetchAmendments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("loan_verifications")
      .select(`
        *,
        customers:customer_id (
          id_number,
          Firstname,
          Surname,
          mobile
        )
      `)
     
    if (error) {
      console.error("Error fetching amendments:", error.message);
    } else {
      setAmendments(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAmendments();
  }, []);

  // Fetch single amendment details with related data
  const fetchAmendmentDetails = async (id) => {
    const { data: amendment, error: amendmentError } = await supabase
      .from("loan_verifications")
      .select(`
        *,
        customers:customer_id (
          id_number,
          Firstname,
          Surname,
          mobile
        )
      `)
      .eq("id", id)
      .single();

    if (amendmentError) {
      console.error("Error fetching amendment:", amendmentError.message);
      return;
    }

    setViewAmendment(amendment);
  };

  return (
    <div className="p-6">
      

      {/* Table */}
      <AmendmentsTable
        amendments={amendments}
        loading={loading}
       onEdit={(a) => {
    setEditAmendment(a); 
    setShowForm(true);
  }}
        onView={fetchAmendmentDetails}
        onRefresh={fetchAmendments}
      />

      {/* Modals */}
      {showForm && (
        <EditAmendment
    amendmentId={editAmendment.id}
    customerId={editAmendment.customer_id || editAmendment.customers?.id} // fallback if nested
    onClose={() => {
      setShowForm(false);
      fetchAmendments();
    }}
  />
      )}
      
      {viewAmendment && (
        <AmendmentDetailsModal
          amendment={viewAmendment}
          onClose={() => setViewAmendment(null)}
        />
      )}
    </div>
  );
}

export default Amendments;