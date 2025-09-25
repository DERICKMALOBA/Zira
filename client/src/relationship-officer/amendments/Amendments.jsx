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
  const [bookLoan, setBookLoan] = useState(null);
  const { profile } = useAuth();

  const fetchAmendments = async () => {
    if (!profile?.id || profile.role !== "relationship_officer") {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // First, fetch customers with the required statuses
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .eq("created_by", profile.id)
        .in("status", ["sent_back_by_bm", "sent_back_by_rm", "sent_back_by_cs", "pending"])
        .order("updated_at", { ascending: false });

      if (customersError) {
        console.error("Error fetching customers:", customersError.message);
        setAmendments([]);
        return;
      }

      console.log("Customers with required statuses:", customers);

      if (!customers || customers.length === 0) {
        console.log("No customers found with the required statuses");
        setAmendments([]);
        return;
      }

      // Extract customer IDs
      const customerIds = customers.map(customer => customer.id);

      // Fetch all customer verifications for these customers
      const { data: verifications, error: verificationsError } = await supabase
        .from("customer_verifications")
        .select("*")
        .in("customer_id", customerIds)
        .order("updated_at", { ascending: false });

      if (verificationsError) {
        console.error("Error fetching verifications:", verificationsError.message);
        setAmendments([]);
        return;
      }

      console.log("Customer verifications:", verifications);

      // Combine customer data with their verifications
      const combinedData = [];
      
      customers.forEach(customer => {
        // Get all verifications for this customer
        const customerVerifications = verifications.filter(v => v.customer_id === customer.id);
        
        if (customerVerifications.length > 0) {
          // For each verification, create a combined object
          customerVerifications.forEach(verification => {
            combinedData.push({
              ...verification,
              customers: customer, // Add customer data to match your existing structure
              customer_data: customer // Also add as customer_data for clarity
            });
          });
        } else {
          // If no verifications exist, create an entry with just customer data
          combinedData.push({
            id: null, // No verification ID
            customer_id: customer.id,
            customers: customer,
            customer_data: customer,
            // Add default verification fields
            verification_status: null,
            verification_notes: null,
            created_at: customer.created_at,
            updated_at: customer.updated_at
          });
        }
      });

      console.log("Combined customer and verification data:", combinedData);

      // Keep only the latest verification per customer (if multiple exist)
      const latestAmendments = [];
      const seen = new Set();

      for (const item of combinedData) {
        if (!seen.has(item.customer_id)) {
          latestAmendments.push(item);
          seen.add(item.customer_id);
        }
      }

      console.log("Latest amendments (final result):", latestAmendments);
      setAmendments(latestAmendments);

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
    try {
      // If id is null (no verification exists), handle differently
      if (!id) {
        console.log("No verification ID provided");
        return;
      }

      const { data: amendment, error: amendmentError } = await supabase
        .from("customer_verifications")
        .select(`
          *,
          customers:customer_id (
            id_number,
            Firstname,
            Surname,
            mobile,
            created_by,
            status
          )
        `)
        .eq("id", id)
        .single();

      if (amendmentError) {
        console.error("Error fetching amendment:", amendmentError.message);
        return;
      }

      // Verify the customer belongs to this RO
      if (amendment.customers?.created_by !== profile?.id) {
        console.error("Amendment does not belong to current user");
        return;
      }

      console.log("Amendment details:", amendment);
      setViewAmendment(amendment);
    } catch (err) {
      console.error("Error in fetchAmendmentDetails:", err);
    }
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
        onBookLoan={(a) => setBookLoan(a)}
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