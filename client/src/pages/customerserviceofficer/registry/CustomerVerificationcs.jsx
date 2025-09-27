// src/components/LoanVerificationForm.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../../hooks/userAuth";
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentMagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  IdentificationIcon,
  HomeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  BuildingOffice2Icon,
  PhotoIcon,
  DevicePhoneMobileIcon,
  PhoneIcon,
  PencilSquareIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const CustomerVerificationFormcs = ({ customerId, onClose }) => {
  const [step, setStep] = useState(1);
  const { profile } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [guarantors, setGuarantors] = useState([]);
  const [securityItems, setSecurityItems] = useState([]);
  const [guarantorSecurityItems, setGuarantorSecurityItems] = useState([]);
  const [loanDetails, setLoanDetails] = useState(null);
  const [businessImages, setBusinessImages] = useState([]);
  const [documentImages, setDocumentImages] = useState([]);
  const [nextOfKinInfo, setNextOfKinInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [verificationData, setVerificationData] = useState({
    customer: {
      idVerified: false,
      prequalifiedAmount: 0,
      phoneVerified: false,
      comment: "",
    },
    loan: {
      scoredAmount: 0,
    },
    finalDecision: "",
    overallComment: "",
  });

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      setVerificationData((prev) => ({
        ...prev,
        loan: {
          ...prev.loan,
          prequalifiedAmount: customerData.prequalifedAmount || 0,
        },
      }));

      // 2. Fetch business images
      const { data: businessData, error: businessError } = await supabase
        .from("business_images")
        .select("*")
        .eq("customer_id", customerId);

      if (!businessError) setBusinessImages(businessData || []);



// Fetch latest BM score
const { data: bmRow, error: bmError } = await supabase
  .from("customer_verifications")
  .select("bm_loan_scored_amount")
  .eq("customer_id", Number(customerId))
  .not("bm_loan_scored_amount", "is", null) // only rows with BM values
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (bmError) console.error("❌ BM fetch error:", bmError);

// Fetch latest RM score
const { data: rmRow, error: rmError } = await supabase
  .from("customer_verifications")
  .select("rm_loan_scored_amount")
  .eq("customer_id", Number(customerId))
  .not("rm_loan_scored_amount", "is", null) // only rows with RM values
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (rmError) console.error("❌ RM fetch error:", rmError);

// Update state
setVerificationData((prev) => ({
  ...prev,
  bmScoredAmount: bmRow?.bm_loan_scored_amount || 0,
  rmScoredAmount: rmRow?.rm_loan_scored_amount || 0,
}));

console.log("✅ Latest BM:", bmRow?.bm_loan_scored_amount, "Latest RM:", rmRow?.rm_loan_scored_amount);





  

      // 3. Fetch loan details (only for scored amount and loan-specific info)
      const { data: loanData, error: loanError } = await supabase
        .from("loans")
        .select("*")
        .eq("customer_id", customerId)
        .single();

      if (!loanError && loanData) {
        setLoanDetails(loanData);
        setVerificationData((prev) => ({
          ...prev,
          loan: {
            ...prev.loan,
            scoredAmount: loanData.scored_amount || 0,
          },
        }));
      }

      // 4. Fetch guarantors
      const { data: guarantorsData, error: guarantorsError } = await supabase
        .from("guarantors")
        .select("*")
        .eq("customer_id", customerId);

      if (!guarantorsError && guarantorsData) {
        setGuarantors(guarantorsData);
      }

      const { data: nokData, error: nokError } = await supabase
        .from("next_of_kin")
        .select("*")
        .eq("customer_id", customerId);

      if (!nokError) {
        setNextOfKinInfo(nokData || []);
        console.log(" Next of Kin:", nokData);
      }

      // 5. Fetch borrower security items and images
      const { data: securityItemsData, error: securityItemsError } =
        await supabase
          .from("security_items")
          .select("*")
          .eq("customer_id", customerId);

      if (!securityItemsError && securityItemsData) {
        const { data: securityImagesData, error: securityImagesError } =
          await supabase
            .from("security_item_images")
            .select("*")
            .in(
              "security_item_id",
              securityItemsData.map((s) => s.id)
            );

        if (!securityImagesError) {
          const securityWithImages = securityItemsData.map((item) => {
            const images = (securityImagesData || [])
              .filter((img) => img.security_item_id === item.id)
              .map((img) => {
                if (img.image_url) {
                  const { data } = supabase.storage
                    .from("customers")
                    .getPublicUrl(img.image_url);
                  console.log(
                    "📸 Borrower Image Path:",
                    img.image_url,
                    "➡️",
                    data.publicUrl
                  );
                  return data.publicUrl;
                }
                return null;
              });
            return { ...item, images };
          });

          console.log(" securityWithImages (final):", securityWithImages);
          setSecurityItems(securityWithImages);
        }
      }

      // 6. Fetch guarantor security + images
      if (guarantorsData && guarantorsData.length > 0) {
        const guarantorIds = guarantorsData.map((g) => g.id);

        const { data: gSecurityData, error: gSecurityError } = await supabase
          .from("guarantor_security")
          .select("*")
          .in("guarantor_id", guarantorIds);

        if (!gSecurityError && gSecurityData) {
          const { data: gSecurityImagesData, error: gSecurityImagesError } =
            await supabase
              .from("guarantor_security_images")
              .select("*")
              .in(
                "guarantor_security_id",
                gSecurityData.map((gs) => gs.id)
              );

          if (!gSecurityImagesError) {
            const gSecurityWithImages = gSecurityData.map((item) => {
              const images = (gSecurityImagesData || [])
                .filter((img) => img.guarantor_security_id === item.id)
                .map((img) => img.image_url)
                .filter(Boolean);

              return { ...item, images };
            });

            setGuarantorSecurityItems(gSecurityWithImages);
            console.log("✅ gSecurityWithImages (final):", gSecurityWithImages);
          }
        }
      }

      // 7. Fetch customer documents
      const { data: documentsData, error: documentsError } = await supabase
        .from("documents")
        .select("*")
        .eq("customer_id", customerId);

      if (!documentsError && documentsData) {
        const docsWithUrls = documentsData.map((doc) => {
          if (doc.document_url) {
            const { data } = supabase.storage
              .from("customers")
              .getPublicUrl(doc.document_url);
            return {
              ...doc,
              image_url: data.publicUrl,
            };
          }
          return doc;
        });
        setDocumentImages(docsWithUrls);
        console.log(" Customer Documents:", docsWithUrls);
      }
    } catch (error) {
      console.error(" Error fetching customer details:", error);
      toast.error("Error loading customer details");
    } finally {
      setLoading(false);
    }
  };




  const handleVerificationChange = (
    field,
    value,
    section = "customer",
    index = null
  ) => {
    setVerificationData((prev) => {
      // Handle finalDecision as a top-level field
      if (field === "finalDecision" || field === "overallComment") {
        return {
          ...prev,
          [field]: value,
        };
      }

      if (section === "loan") {
        return {
          ...prev,
          loan: {
            ...prev.loan,
            [field]: value,
          },
        };
      }

      return prev;
    });
  };

const submitVerification = async () => {
  try {
    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);

    // Insert verification record
    const { error: insertError } = await supabase
      .from("customer_verifications")
      .insert({
        co_final_decision: verificationData.finalDecision,
        co_overall_comment: verificationData.overallComment,
        co_verified_by: profile?.id || null,
        co_verified_at: new Date().toISOString(),
        customer_id: Number(customerId),
      });

    if (insertError) {
      console.error("❌ Insert Error:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      throw insertError;
    }

    
   let newStatus;
if (
  verificationData.finalDecision === "approved" || 
  verificationData.finalDecision === "referred"
) {
  newStatus = "approved";
} else if (
  verificationData.finalDecision === "pending" || 
  verificationData.finalDecision === "edit"
) {
  newStatus = "sent_back_by_co";
} else if (verificationData.finalDecision === "rejected") {
  newStatus = "rejected"; 
}



    if (newStatus !== undefined) {
      const { error: statusError } = await supabase
        .from("customers")
        .update({ status: newStatus })
        .eq("id", customerId);

      if (statusError) {
        console.error("❌ Status Update Error:", {
          message: statusError.message,
          details: statusError.details,
          hint: statusError.hint,
          code: statusError.code,
        });
        throw statusError;
      }
    }

    toast.success("Verification submitted successfully!");
    onClose();
  } catch (error) {
    console.error("🚨 Unexpected Error in submitVerification:", error);
    toast.error("Error submitting verification");
  } finally {
    setLoading(false);
  }
};


  const DocumentCard = ({ title, imageUrl, placeholder, icon: Icon }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">
      <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
          <Icon className="h-4 w-4 text-indigo-600 mr-2" />
          {title}
        </h4>
      </div>
      <div className="p-4">
        {imageUrl ? (
          <div
            className="relative group cursor-pointer"
            onClick={() => setSelectedImage({ url: imageUrl, title })}
          >
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-48 object-contain rounded-lg bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white bg-opacity-95 rounded-full p-3 shadow-lg border border-indigo-100">
                <DocumentMagnifyingGlassIcon className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <Icon className="h-12 w-12 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500 font-medium">
              {placeholder}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading verification details...
          </p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <DocumentMagnifyingGlassIcon className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Customer Not Found
          </h3>
          <p className="text-gray-600">
            The requested customer details could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const DetailRow = ({ label, value }) => (
    <div className="flex justify-between">
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="text-sm font-semibold text-gray-900">
        {value || "Not provided"}
      </span>
    </div>
  );

  const validateCurrentStep = () => {
    // Only validate step 8 (final decision step)
    if (step === 8) {
      if (!verificationData.finalDecision) {
        toast.error("Please select a final decision");
        return false;
      }
      if (!verificationData.overallComment.trim()) {
        toast.error("Please add overall comments and recommendations");
        return false;
      }
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                Customer Application Verification
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive verification of customer documents and information
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
            >
              <XCircleIcon className="h-8 w-8" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-indigo-100">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Customer", icon: UserCircleIcon },
              { num: 2, label: "Business", icon: BuildingOffice2Icon },
              { num: 3, label: "Guarantors", icon: UserGroupIcon },
              { num: 4, label: "Security", icon: ShieldCheckIcon },
              { num: 5, label: "Next of Kin", icon: UserCircleIcon },
              { num: 6, label: "Documents", icon: DocumentTextIcon },
              { num: 7, label: "Loan", icon: CurrencyDollarIcon },
              { num: 8, label: "Decision", icon: ClipboardDocumentCheckIcon },
            ].map(({ num, label, icon: Icon }) => (
              <div key={num} className="flex flex-col items-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer ${
                    step === num
                      ? "border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-200 scale-110"
                      : step > num
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-md"
                      : "border-gray-300 bg-white text-gray-400 hover:border-gray-400"
                  }`}
                  onClick={() => setStep(num)} // Allow direct navigation to any step
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span
                  className={`text-sm mt-3 font-medium transition-colors ${
                    step === num
                      ? "text-indigo-700"
                      : step > num
                      ? "text-emerald-700"
                      : "text-gray-600"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 mb-8 overflow-hidden">
          {/* Step 1: Customer Information & Documents */}
          {step === 1 && (
            <div className="p-8">
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <UserCircleIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  Customer Information
                </h2>
                <p className="text-gray-600 mt-2">
                  Review customer identity and contact information
                </p>
              </div>

              {/* Customer Profile Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8 mb-8 border border-indigo-100">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  {/* Profile Photo + Basic Info */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl cursor-pointer group transition-all duration-200 hover:shadow-2xl hover:scale-105 relative"
                      onClick={() =>
                        customer.passport_url &&
                        setSelectedImage({
                          url: customer.passport_url,
                          title: "Customer Profile Photo",
                        })
                      }
                    >
                      {customer.passport_url ? (
                        <img
                          src={customer.passport_url}
                          alt="Profile"
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <UserCircleIcon className="h-20 w-20 text-gray-400" />
                        </div>
                      )}
                      {customer.passport_url && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-white bg-opacity-95 rounded-full p-2 shadow-lg border border-indigo-100">
                            <DocumentMagnifyingGlassIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                        </div>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mt-4 text-center">
                      {customer.prefix} {customer.Firstname}{" "}
                      {customer.Middlename} {customer.Surname}
                    </h3>
                    <p className="text-indigo-600 font-semibold">
                      Primary Applicant
                    </p>
                  </div>

                  {/* Personal Info Container */}
                  <div className="flex-1">
                    {/* Highlighted ID + Mobile above personal details */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <p className="flex-1 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold shadow-sm">
                        <IdentificationIcon className="h-5 w-5 text-indigo-600" />
                        ID Number: {customer.id_number || "Not provided"}
                      </p>
                      <p className="flex-1 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold shadow-sm">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
                        Mobile: {customer.mobile || "Not provided"}
                      </p>
                    </div>

                    {/* Personal Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left column */}
                      <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
                        <DetailRow
                          label="First Name"
                          value={customer.Firstname}
                        />
                        <DetailRow label="Surname" value={customer.Surname} />
                        <DetailRow
                          label="Marital Status"
                          value={customer.marital_status}
                        />
                        <DetailRow
                          label="Residence Status"
                          value={customer.residence_status}
                        />
                        <DetailRow
                          label="Postal Address"
                          value={customer.postal_address}
                        />
                        <DetailRow label="Postal Code" value={customer.code} />
                      </div>

                      {/* Right column */}
                      <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
                        <DetailRow label="Town" value={customer.town} />
                        <DetailRow label="Gender" value={customer.gender} />
                        <DetailRow label="County" value={customer.county} />
                        <DetailRow
                          label="Alternative Mobile"
                          value={customer.alternative_mobile}
                        />
                        <DetailRow
                          label="Occupation"
                          value={customer.occupation}
                        />
                        <DetailRow
                          label="Date of Birth"
                          value={customer.date_of_birth}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DocumentCard
                  title="ID Front"
                  imageUrl={customer.id_front_url}
                  placeholder="No ID front available"
                  icon={IdentificationIcon}
                />
                <DocumentCard
                  title="ID Back"
                  imageUrl={customer.id_back_url}
                  placeholder="No ID back available"
                  icon={IdentificationIcon}
                />
                <DocumentCard
                  title="Residence"
                  imageUrl={customer.house_image_url}
                  placeholder="No residence image available"
                  icon={HomeIcon}
                />
              </div>
            </div>
          )}

          {/* Step 2: Business Information */}
          {step === 2 && (
            <div className="p-8">
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <BuildingOffice2Icon className="h-8 w-8 text-indigo-600 mr-3" />
                  Business Information
                </h2>
                <p className="text-gray-600 mt-2">
                  Review business operations and location
                </p>
              </div>

              {/* Business Details */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
                  Business Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Business Name</p>
                    <p className="font-semibold text-gray-900">
                      {customer.business_name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Business Type</p>
                    <p className="font-semibold text-gray-900">
                      {customer.business_type || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold text-gray-900">
                      {customer.business_location || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Year Established</p>
                    <p className="font-semibold text-gray-900">
                      {customer.year_established
                        ? new Date(
                            customer.year_established
                          ).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Road</p>
                    <p className="font-semibold text-gray-900">
                      {customer.road || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Landmark</p>
                    <p className="font-semibold text-gray-900">
                      {customer.landmark || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Daily Sales</p>
                    <p className="font-semibold text-gray-900">
                      {customer.daily_Sales || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Images */}
              {businessImages.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <BuildingOffice2Icon className="mx-auto h-20 w-20 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Business Images
                  </h3>
                  <p className="text-gray-600">
                    This customer has not provided business images.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {businessImages.map((image, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
                      >
                        <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                          <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                            <PhotoIcon className="h-4 w-4 text-indigo-600 mr-2" />
                            Business Image {index + 1}
                          </h4>
                        </div>
                        <div className="p-4">
                          <div
                            className="relative group cursor-pointer"
                            onClick={() =>
                              setSelectedImage({
                                url: image.image_url,
                                title: `Business Image ${index + 1}`,
                              })
                            }
                          >
                            <img
                              src={image.image_url}
                              alt={`Business ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                            />

                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-white bg-opacity-95 rounded-full p-3 shadow-lg border border-indigo-100">
                                  <DocumentMagnifyingGlassIcon className="h-6 w-6 text-indigo-600" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {image.description && (
                            <p className="mt-3 text-sm text-gray-600">
                              {image.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Guarantors */}
          {step === 3 && (
            <div className="p-8">
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <UserGroupIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  Guarantor Information
                </h2>
                <p className="text-gray-600 mt-2">
                  Review guarantor identity and contact information
                </p>
              </div>

              {guarantors.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <UserGroupIcon className="mx-auto h-20 w-20 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Guarantors
                  </h3>
                  <p className="text-gray-600">
                    This customer has no guarantors listed.
                  </p>
                </div>
              ) : (
                <div className="space-y-12">
                  {guarantors.map((guarantor, index) => (
                    <div
                      key={guarantor.id}
                      className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                          <UserGroupIcon className="h-6 w-6 text-indigo-600 mr-3" />
                          Guarantor {index + 1}
                        </h3>
                        <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                          {guarantor.relationship || "Relationship Unknown"}
                        </span>
                      </div>

                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8 mb-8 border border-indigo-100">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                          <div className="flex flex-col items-center">
                            <div
                              className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl cursor-pointer group transition-all duration-200 hover:shadow-2xl hover:scale-105 relative"
                              onClick={() =>
                                guarantor.passport_url &&
                                setSelectedImage({
                                  url: guarantor.passport_url,
                                  title: `Guarantor ${index + 1} Profile Photo`,
                                })
                              }
                            >
                              {guarantor.passport_url ? (
                                <img
                                  src={guarantor.passport_url}
                                  alt="Guarantor"
                                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                  <UserCircleIcon className="h-20 w-20 text-gray-400" />
                                </div>
                              )}
                              {guarantor.passport_url && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="bg-white bg-opacity-95 rounded-full p-2 shadow-lg border border-indigo-100">
                                    <DocumentMagnifyingGlassIcon className="h-5 w-5 text-indigo-600" />
                                  </div>
                                </div>
                              )}
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mt-4 text-center">
                              {guarantor.prefix} {guarantor.Firstname}{" "}
                              {guarantor.Middlename} {guarantor.Surname}
                            </h3>
                            <p className="text-indigo-600 font-semibold">
                              Guarantor
                            </p>
                          </div>

                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                              <p className="flex-1 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold shadow-sm">
                                <IdentificationIcon className="h-5 w-5 text-indigo-600" />
                                ID Number:{" "}
                                {guarantor.id_number || "Not provided"}
                              </p>
                              <p className="flex-1 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold shadow-sm">
                                <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
                                Mobile: {guarantor.mobile || "Not provided"}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
                                <DetailRow
                                  label="First Name"
                                  value={guarantor.Firstname}
                                />
                                <DetailRow
                                  label="Surname"
                                  value={guarantor.Surname}
                                />
                                <DetailRow
                                  label="Marital Status"
                                  value={guarantor.marital_status}
                                />
                                <DetailRow
                                  label="Residence Status"
                                  value={guarantor.residence_status}
                                />
                                <DetailRow
                                  label="Postal Address"
                                  value={guarantor.postal_address}
                                />
                                <DetailRow
                                  label="Postal Code"
                                  value={guarantor.code}
                                />
                              </div>
                              <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
                                <DetailRow
                                  label="Town"
                                  value={guarantor.city_town}
                                />
                                <DetailRow
                                  label="Gender"
                                  value={guarantor.gender}
                                />
                                <DetailRow
                                  label="County"
                                  value={guarantor.county}
                                />
                                <DetailRow
                                  label="Alternative Mobile"
                                  value={guarantor.alternative_mobile}
                                />
                                <DetailRow
                                  label="Occupation"
                                  value={guarantor.occupation}
                                />
                                <DetailRow
                                  label="Date of Birth"
                                  value={guarantor.date_of_birth}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <DocumentCard
                          title="ID Front"
                          imageUrl={guarantor.id_front_url}
                          placeholder="No ID front available"
                          icon={IdentificationIcon}
                        />
                        <DocumentCard
                          title="ID Back"
                          imageUrl={guarantor.id_back_url}
                          placeholder="No ID back available"
                          icon={IdentificationIcon}
                        />
                        <DocumentCard
                          title="Residence"
                          imageUrl={guarantor.house_image_url}
                          placeholder="No residence image available"
                          icon={HomeIcon}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Security Items */}
          {step === 4 && (
            <div className="p-8">
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <ShieldCheckIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  Security Information
                </h2>
                <p className="text-gray-600 mt-2">
                  Review customer and guarantor security items
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <ShieldCheckIcon className="h-6 w-6 text-indigo-600 mr-3" />
                  Customer Security Items
                </h3>

                {securityItems.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <ShieldCheckIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      No Security Items
                    </h4>
                    <p className="text-gray-600">
                      Customer has not provided security items
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {securityItems.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                              <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {item.item || "Security Item"}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Item {index + 1}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            KES {item.value?.toLocaleString() || "N/A"}
                          </span>
                        </div>

                        {item.images && item.images.length > 0 && (
                          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {item.images.map((imgUrl, i) => (
                              <img
                                key={i}
                                src={imgUrl}
                                alt={`${item.item || "Security Item"} - Image ${
                                  i + 1
                                }`}
                                className="w-full h-40 object-cover rounded-lg shadow-sm hover:scale-105 transition-transform duration-200 cursor-pointer"
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                                onClick={() =>
                                  setSelectedImage({
                                    url: imgUrl,
                                    title: `${
                                      item.item || "Security Item"
                                    } - Image ${i + 1}`,
                                  })
                                }
                              />
                            ))}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Identification:
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {item.identification || "N/A"}
                            </span>
                          </div>
                          {item.description && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">
                                Description:
                              </span>
                              <p className="text-sm text-gray-900 mt-1">
                                {item.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <ShieldCheckIcon className="h-6 w-6 text-indigo-600 mr-3" />
                  Guarantor Security Items
                </h3>

                {guarantorSecurityItems.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <ShieldCheckIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      No Guarantor Security Items
                    </h4>
                    <p className="text-gray-600">
                      Guarantors have not provided security items
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {guarantorSecurityItems.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                              <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {item.item || "Security Item"}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Guarantor Item {index + 1}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            KES{" "}
                            {item.estimated_market_value?.toLocaleString() ||
                              "N/A"}
                          </span>
                        </div>

                        {item.images?.length > 0 && (
                          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {item.images
                              .filter((imgUrl) => !!imgUrl)
                              .map((imgUrl, i) => (
                                <img
                                  key={i}
                                  src={imgUrl}
                                  alt={`${
                                    item.item ||
                                    `Guarantor Security ${index + 1}`
                                  } - Image ${i + 1}`}
                                  className="w-full h-40 object-cover rounded-lg shadow-sm hover:scale-105 transition-transform duration-200 cursor-pointer"
                                  onError={(e) =>
                                    (e.currentTarget.style.display = "none")
                                  }
                                  onClick={() =>
                                    setSelectedImage({
                                      url: imgUrl,
                                      title: `${
                                        item.item ||
                                        `Guarantor Security ${index + 1}`
                                      } - Image ${i + 1}`,
                                    })
                                  }
                                />
                              ))}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Identification:
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {item.identification || "N/A"}
                            </span>
                          </div>
                          {item.description && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">
                                Description:
                              </span>
                              <p className="text-sm text-gray-900 mt-1">
                                {item.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Next of Kin */}
          {step === 5 && (
            <div className="p-8">
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <UserCircleIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  Next of Kin Information
                </h2>
                <p className="text-gray-600 mt-2">
                  Review next of kin information and contacts
                </p>
              </div>

              {!nextOfKinInfo || nextOfKinInfo.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <UserCircleIcon className="mx-auto h-20 w-20 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Next of Kin Information
                  </h3>
                  <p className="text-gray-600">
                    This customer has not provided next of kin details.
                  </p>
                </div>
              ) : (
                nextOfKinInfo.map((nok, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm mb-6"
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-indigo-100">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <UserCircleIcon className="h-6 w-6 text-indigo-600 mr-3" />
                        Next of Kin Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
                          <DetailRow
                            label="Full Name"
                            value={`${nok.Firstname || ""} ${
                              nok.middlename || ""
                            } ${nok.surname || ""}`}
                          />
                          <DetailRow label="ID Number" value={nok.id_number} />
                          <DetailRow label="Mobile" value={nok.mobile} />
                          <DetailRow
                            label="Alternative Mobile"
                            value={nok.alternative_mobile}
                          />
                          <DetailRow label="Email" value={nok.email} />
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
                          <DetailRow
                            label="Relationship"
                            value={nok.relationship}
                          />
                          <DetailRow label="Gender" value={nok.gender} />
                          <DetailRow
                            label="Occupation"
                            value={nok.occupation}
                          />
                          <DetailRow label="County" value={nok.county} />
                          <DetailRow label="City/Town" value={nok.city_town} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 6: Documents */}
          {step === 6 && (
            <div className="p-8">
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <DocumentTextIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  Document Information
                </h2>
                <p className="text-gray-600 mt-2">
                  Review officer and client meeting documentation
                </p>
              </div>

              {documentImages.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <DocumentTextIcon className="mx-auto h-20 w-20 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Document Images
                  </h3>
                  <p className="text-gray-600">
                    No meeting documentation images have been uploaded.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-3" />
                    Meeting Documentation
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {documentImages.map((doc, index) => (
                      <div
                        key={doc.id || index}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
                      >
                        <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                          <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                            <PhotoIcon className="h-4 w-4 text-indigo-600 mr-2" />
                            {doc.document_type || `Document ${index + 1}`}
                          </h4>
                        </div>
                        <div className="p-4">
                          <div
                            className="relative group cursor-pointer"
                            onClick={() =>
                              setSelectedImage({
                                url: doc.document_url,
                                title:
                                  doc.document_type || `Document ${index + 1}`,
                              })
                            }
                          >
                            <img
                              src={doc.document_url}
                              alt={doc.document_type || `Document ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                            />

                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-white bg-opacity-95 rounded-full p-3 shadow-lg border border-indigo-100">
                                  <DocumentMagnifyingGlassIcon className="h-6 w-6 text-indigo-600" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {doc.description && (
                            <p className="mt-3 text-sm text-gray-600">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        
          {/* Step 7: Loan Information */}
          {step === 7 && (
            <div className="p-8">
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  Loan Information
                </h2>
                <p className="text-gray-600 mt-2">
                  Review loan details and assessment
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-indigo-600 mr-3" />
                  Loan Details & Scoring History
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Prequalified Amount */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-blue-900">
                        Prequalified Amount
                      </h4>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                          INITIAL
                        </span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 mb-2">
                      KES {customer?.prequalifiedAmount?.toLocaleString("en-US") || "0"}
                    </p>
                    <p className="text-sm text-blue-600">
                      Initial system assessment
                    </p>
                  </div>

                  {/* RM Scored Amount */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-purple-900">
                        RM Scored Amount
                      </h4>
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-xs">
                          RM
                        </span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-purple-700 mb-2">
                      KES {verificationData.rmScoredAmount?.toLocaleString("en-US") || "0"}
                    </p>
                    <p className="text-sm text-purple-600">
                      Relationship Manager assessment
                    </p>
                  </div>

                  {/* BM Scored Amount */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-emerald-900">
                        BM Scored Amount
                      </h4>
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 font-bold text-xs">
                          BM
                        </span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700 mb-2">
                      KES {verificationData.bmScoredAmount?.toLocaleString("en-US") || "0"}
                    </p>
                    <p className="text-sm text-emerald-600">
                      Branch Manager assessment
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Step 8: Final Decision */}
          {step === 8 && (
            <div className="p-8">
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <ClipboardDocumentCheckIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  Final Decision
                </h2>
                <p className="text-gray-600 mt-2">
                  Make final verification decision and provide comprehensive
                  feedback
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  {/* Decision Selection */}
                  <div className="lg:col-span-1">
                    <label className="block text-lg font-semibold text-gray-900 mb-4">
                      Verification Decision
                    </label>
                    <div className="space-y-3">
                      {[
                        {
                          value: "approved",
                          label: "Approve",
                          color: "emerald",
                          icon: CheckCircleIcon,
                        },
                        // {
                        //   value: "rejected",
                        //   label: "Reject",
                        //   color: "red",
                        //   icon: XCircleIcon,
                        // },
                        {
                          value: "pending",
                          label: "Request More Information",
                          color: "amber",
                          icon: DocumentMagnifyingGlassIcon,
                        },
                        // {
                        //   value: "referred",
                        //   label: "Refer to Senior Manager",
                        //   color: "purple",
                        //   icon: UserGroupIcon,
                        // },
                        {
                          value: "edit",
                          label: "Edit Personal Details",
                          color: "blue",
                          icon: PencilSquareIcon,
                        },
                      ].map(({ value, label, color, icon: Icon }) => {
                        const isSelected =
                          verificationData.finalDecision === value;

                        // Color mapping
                        const colorClasses = {
                          emerald: {
                            bg: "bg-emerald-50",
                            border: "border-emerald-500",
                            text: "text-emerald-700",
                            icon: "text-emerald-600",
                            hover: "hover:bg-emerald-100",
                          },
                          red: {
                            bg: "bg-red-50",
                            border: "border-red-500",
                            text: "text-red-700",
                            icon: "text-red-600",
                            hover: "hover:bg-red-100",
                          },
                          amber: {
                            bg: "bg-amber-50",
                            border: "border-amber-500",
                            text: "text-amber-700",
                            icon: "text-amber-600",
                            hover: "hover:bg-amber-100",
                          },
                          purple: {
                            bg: "bg-purple-50",
                            border: "border-purple-500",
                            text: "text-purple-700",
                            icon: "text-purple-600",
                            hover: "hover:bg-purple-100",
                          },
                          blue: {
                            bg: "bg-blue-50",
                            border: "border-blue-500",
                            text: "text-blue-700",
                            icon: "text-blue-600",
                            hover: "hover:bg-blue-100",
                          },
                        };

                        const currentColor = colorClasses[color];

                        return (
                          <button
                            key={value}
                            type="button"
                            className={`flex items-center w-full p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? `${currentColor.bg} ${currentColor.border} ${currentColor.text}`
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() =>
                              handleVerificationChange("finalDecision", value)
                            }
                          >
                            <Icon
                              className={`h-6 w-6 mr-3 ${
                                isSelected ? currentColor.icon : "text-gray-400"
                              }`}
                            />
                            <span className="font-medium">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amount and Summary */}
                  <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200 mb-6">
    <h4 className="text-lg font-semibold text-indigo-900 mb-4">
      Recommended Loan Amounts
    </h4>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
      {/* Prequalified Amount */}
      <div className="p-4 bg-white rounded-xl shadow-sm border border-indigo-100">
        <h5 className="text-sm font-medium text-gray-600 mb-2">Prequalified</h5>
        <p className="text-2xl font-bold text-indigo-700">
        {customer?.prequalifiedAmount?.toLocaleString("en-US") || "0"}
        </p>
      </div>

      {/* BM Scored Amount */}
      <div className="p-4 bg-white rounded-xl shadow-sm border border-indigo-100">
        <h5 className="text-sm font-medium text-gray-600 mb-2">BM Scored</h5>
        <p className="text-2xl font-bold text-blue-700">
          KES {verificationData?.bmScoredAmount || 0}
        </p>
      </div>

      {/* RM Scored Amount */}
      <div className="p-4 bg-white rounded-xl shadow-sm border border-indigo-100">
        <h5 className="text-sm font-medium text-gray-600 mb-2">RM Scored</h5>
        <p className="text-2xl font-bold text-green-700">
          KES {verificationData?.rmScoredAmount || 0}
        </p>
      </div>
    </div>
  </div>

                    {/* Verification Summary - Display only */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">
                        Application Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm font-medium text-gray-700">
                            Customer Documents:
                          </span>
                          <span className="flex items-center text-sm font-semibold text-blue-600">
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            Available
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm font-medium text-gray-700">
                            Business Info:
                          </span>
                          <span className="flex items-center text-sm font-semibold text-blue-600">
                            <BuildingOffice2Icon className="h-4 w-4 mr-1" />
                            Provided
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm font-medium text-gray-700">
                            Guarantors:
                          </span>
                          <span className="flex items-center text-sm font-semibold text-blue-600">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            {guarantors.length} Listed
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm font-medium text-gray-700">
                            Security Items:
                          </span>
                          <span className="flex items-center text-sm font-semibold text-blue-600">
                            <ShieldCheckIcon className="h-4 w-4 mr-1" />
                            {securityItems.length} Items
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overall Comments */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-gray-200">
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    Overall Comments & Recommendations
                  </label>
                  <textarea
                    value={verificationData.overallComment}
                    onChange={(e) =>
                      handleVerificationChange("overallComment", e.target.value)
                    }
                    placeholder="Provide comprehensive final comments, recommendations for the relationship officer, risk assessment, and any special instructions..."
                    className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                    rows={6}
                    required
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex justify-between border border-indigo-100">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
              step === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md"
            }`}
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Previous
          </button>

          {step < 8 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Next
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (validateCurrentStep()) {
                  submitVerification();
                }
              }}
              disabled={loading}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                loading
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-md hover:shadow-lg"
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Submitting...
                </div>
              ) : (
                "Submit Verification"
              )}
            </button>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full bg-white rounded-2xl overflow-hidden shadow-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {selectedImage.title}
                  </h3>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                  >
                    <XCircleIcon className="h-8 w-8" />
                  </button>
                </div>
              </div>

              {/* Modal Image */}
              <div className="p-4 bg-gray-50">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Click outside the image or the X button to close
                  </p>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerVerificationFormcs;