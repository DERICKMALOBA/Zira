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
        .in("status", ["sent_back_by_bm", "sent_back_by_ca", "sent_back_by_cso", "pending"])
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

      // Fetch ALL customer verifications for these customers
      const { data: verifications, error: verificationsError } = await supabase
        .from("customer_verifications")
        .select("*")
        .in("customer_id", customerIds)
        .order("created_at", { ascending: true });

      if (verificationsError) {
        console.error("Error fetching verifications:", verificationsError.message);
        setAmendments([]);
        return;
      }

      console.log("All verification records:", verifications);

      // Create merged data for each customer
      const mergedData = [];

      customers.forEach(customer => {
        // Get all verification records for this customer
        const customerVerifications = verifications.filter(v => v.customer_id === customer.id);
        
        if (customerVerifications.length === 0) {
          // No verifications exist
          mergedData.push({
            id: null,
            customer_id: customer.id,
            customers: customer,
            customer_data: customer,
            verification_status: null,
            verification_notes: null,
            created_at: customer.created_at,
            updated_at: customer.updated_at
          });
        } else {
          // Merge all verification records into one comprehensive object
          const mergedVerification = customerVerifications.reduce((acc, verification) => {
            // Merge strategy: Keep non-null values from all records
            Object.keys(verification).forEach(key => {
              if (verification[key] !== null && verification[key] !== undefined) {
                // For timestamp fields, keep the latest
                if (key.includes('_at') && acc[key]) {
                  const newDate = new Date(verification[key]);
                  const existingDate = new Date(acc[key]);
                  if (newDate > existingDate) {
                    acc[key] = verification[key];
                  }
                } else {
                  acc[key] = verification[key];
                }
              }
            });
            return acc;
          }, {});

          // Use the latest record's ID and ensure all fields are included
          const latestVerification = customerVerifications[customerVerifications.length - 1];
          mergedVerification.id = latestVerification.id;
          mergedVerification.customer_id = customer.id;
          mergedVerification.customers = customer;
          mergedVerification.customer_data = customer;
          
          // Ensure we have created_at and updated_at
          if (!mergedVerification.created_at) {
            mergedVerification.created_at = latestVerification.created_at;
          }
          if (!mergedVerification.updated_at) {
            mergedVerification.updated_at = latestVerification.updated_at;
          }

          mergedData.push(mergedVerification);
        }
      });

      console.log("Merged amendments data:", mergedData);

      // Debug: Check data preservation for each role
      mergedData.forEach(item => {
        const bmFields = Object.keys(item).filter(key => 
          key.includes('branch_manager') && item[key] !== null
        );
        const csoFields = Object.keys(item).filter(key => 
          key.includes('co_') && item[key] !== null
        );
        const caFields = Object.keys(item).filter(key => 
          key.includes('credit_analyst') && item[key] !== null
        );

        console.log(`Customer ${item.customer_id} (${item.customers?.status}):`, {
          totalRecords: verifications.filter(v => v.customer_id === item.customer_id).length,
          bmFields: bmFields.length,
          csoFields: csoFields.length,
          caFields: caFields.length,
          hasBMDecision: !!item.branch_manager_final_decision,
          hasCSODecision: !!item.co_final_decision,
          hasCADecision: !!item.credit_analyst_final_decision
        });
      });

      setAmendments(mergedData);

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

   // Enhanced fetchAmendmentDetails to show complete merged history
  const fetchAmendmentDetails = async (id) => {
    try {
      if (!id) {
        console.log("No verification ID provided");
        return;
      }

      // Get the specific amendment first
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

      // Get ALL verification records for this customer to merge
      const { data: allVerifications, error: historyError } = await supabase
        .from("customer_verifications")
        .select("*")
        .eq("customer_id", amendment.customer_id)
        .order("created_at", { ascending: true });

      if (historyError) {
        console.error("Error fetching verification history:", historyError);
        setViewAmendment(amendment);
        return;
      }

      if (allVerifications && allVerifications.length > 0) {
        // Merge all records into one comprehensive object
        const mergedAmendment = allVerifications.reduce((acc, verification) => {
          Object.keys(verification).forEach(key => {
            if (verification[key] !== null && verification[key] !== undefined) {
              // For timestamps, keep the latest
              if (key.includes('_at') && acc[key]) {
                const newDate = new Date(verification[key]);
                const existingDate = new Date(acc[key]);
                if (newDate > existingDate) {
                  acc[key] = verification[key];
                }
              } else {
                acc[key] = verification[key];
              }
            }
          });
          return acc;
        }, {});

        // Add customer data and metadata
        mergedAmendment.id = amendment.id;
        mergedAmendment.customer_id = amendment.customer_id;
        mergedAmendment.customers = amendment.customers;
        mergedAmendment.customer_data = amendment.customers;
        mergedAmendment.verification_history = allVerifications; // Include full history for debugging

        console.log("Complete merged amendment for details view:", {
          merged: mergedAmendment,
          history: allVerifications
        });

        setViewAmendment(mergedAmendment);
      } else {
        setViewAmendment(amendment);
      }

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