import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import AmendmentsTable from "./AmendmentsTable";
import AmendmentDetailsModal from "./AmendmentDetailsModal";
import EditAmendment from "./EditAmendment";
import LoanBookingForm from "../loans/LoanBooking";
import { useAuth } from "../../hooks/userAuth";


function Amendments() {
  const [amendments, setAmendments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAmendment, setEditAmendment] = useState(null);
  const [viewAmendment, setViewAmendment] = useState(null);
  const [bookLoan, setBookLoan] = useState(null); // new state
   const { profile } = useAuth();

// ✅ Fetch amendments only for customers created by the logged-in RO
const fetchAmendments = async () => {
  if (!profile?.id || profile.role !== "relationship_officer") {
    setLoading(false);
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabase
      .from("customer_verifications")
      .select(`
        *,
        customers:customer_id (
          id,
          id_number,
          Firstname,
          Surname,
          mobile,
          created_by
        )
      `)
      .filter("customers.created_by", "eq", profile.id)
       .neq("final_decision", "approved");

    if (error) {
      console.error("Error fetching amendments:", error.message);
      setAmendments([]);
    } else {
      console.log("Fetched amendments:", data); // 👀 debug
      setAmendments(data || []);
    }
  } catch (err) {
    console.error("Unexpected error fetching amendments:", err);
    setAmendments([]);
  } finally {
    setLoading(false);
  }
};


useEffect(() => {
  if (profile) {
    fetchAmendments();
  }
}, [profile]);

  // Fetch single amendment details
 const fetchAmendmentDetails = async (id) => {
  const { data: amendment, error: amendmentError } = await supabase
    .from("customer_verifications")
    .select(`
      *,
      customers:customer_id (
        id_number,
        Firstname,
        Surname,
        mobile,
        created_by
      )
    `)
    .eq("id", id)
    .eq("customers.created_by", profile?.id)  // ✅ check RO ownership
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
        onBookLoan={(a) => setBookLoan(a)} // pass down handler
        onRefresh={fetchAmendments}
      />
{showForm && (
  <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-50 via-white to-blue-50 overflow-y-auto">
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <EditAmendment
        amendmentId={editAmendment.id}
        customerId={editAmendment.customer_id || editAmendment.customers?.id}
        onClose={() => {
          setShowForm(false);
          fetchAmendments();
        }}
      />
    </div>
  </div>
)}


      
      {/* View Amendment */}
      {viewAmendment && (
        <AmendmentDetailsModal
          amendment={viewAmendment}
          onClose={() => setViewAmendment(null)}
        />
      )}

      {/* Loan Booking */}
      {bookLoan && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <LoanBookingForm
            amendment={bookLoan}
            onComplete={() => {
              setBookLoan(null);
              fetchAmendments();
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Amendments;
