// src/App.jsx
import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/userAuth";

// Shared components
import ProtectedRoute from "./components/ProtectedRoute";
import OfficerSidebar from "./relationship-officer/components/OfficerSidebar";
import Sidebarbm from "./pages/branchmanager/components/Sidebarbm";
import Sidebarrm from "./pages/regionalmanager/components/sidebarrm";
import Sidebarca from "./pages/creditanalyst/components/sidebarca";
import Sidebarcs from "./pages/customerserviceofficer/components/sidebarcs";
import OfficerHeader from "./relationship-officer/components/OfficerHeader";
import Headerbm from "./pages/branchmanager/components/Headerbm";
import Headerrm from "./pages/regionalmanager/components/Headerrm";
import Headerca from "./pages/creditanalyst/components/Headerca";
import Headercs from "./pages/customerserviceofficer/components/Headercs";
import OfficerDashboard from "./relationship-officer/Dashboard";
import Leads from "./relationship-officer/Leads";
import Customers from "./relationship-officer/Customers";
import Loans from "./relationship-officer/loans/Loans";
import LoanApplication from "./relationship-officer/loans/LoanApplication";
import ApprovalQueue from "./relationship-officer/loans/ApprovalQueue";
import Approval from "./relationship-officer/Approval";
import Amendments from "./relationship-officer/amendments/Amendments";
import ConversionChart from "./relationship-officer/components/CoversionChart";
import Dashboarbm from "./pages/branchmanager/Dashboardbm";
import Accountingbm from "./pages/branchmanager/accounting/Accountingbm";
import Registrybm from "./pages/branchmanager/registry copy/Registrybm";
import Reportsbm from "./pages/branchmanager/reports/Reportsbm";
import AllLoansbm from "./pages/branchmanager/loaning/AllLoansbm";
import LoanPendingRmbm from "./pages/branchmanager/loaning/LoanPendingRmbm";
import LoanPendingBmbm from "./pages/branchmanager/loaning/LoanPendingBmbm";
import LoanPendingDisbursementbm from "./pages/branchmanager/loaning/LoanPendingDisbursementbm";
import DisbursementLoansbm from "./pages/branchmanager/loaning/DisbursementLoansbm";
import ApproveLoanbm from "./pages/branchmanager/loaning/ApproveLoanbm";
import RejectedLoansbm from "./pages/branchmanager/loaning/RejectedLoansbm";
import Dashboarrm from "./pages/regionalmanager/Dashboard";
import Accountingrm from "./pages/regionalmanager/Accountingrm";
import Registryrm from "./pages/regionalmanager/registry/Registryrm";
import Reportsrm from "./pages/regionalmanager/reports/Reportsrm";
import AllLoansrm from "./pages/regionalmanager/loaning/AllLoansrm";
import LoanPendingRmrm from "./pages/regionalmanager/loaning/LoanPendingRmrm";
import LoanPendingBmrm from "./pages/regionalmanager/loaning/LoanPendingBmrm";
import LoanPendingDisbursementrm from "./pages/regionalmanager/loaning/LoanPendingDisbursementrm";
import DisbursementLoansrm from "./pages/regionalmanager/loaning/DisbursementLoansrm";
import ApproveLoanrm from "./pages/regionalmanager/loaning/ApproveLoanrm";
import RejectedLoansrm from "./pages/regionalmanager/loaning/RejectedLoansrm";
import Dashboarca from "./pages/creditanalyst/Dashboard";
import Accountingca from "./pages/creditanalyst/Accountingca";
import Registryca from "./pages/creditanalyst/registry/Registryca";
import Reportsca from "./pages/creditanalyst/reports/Reportsca";
import AllLoansca from "./pages/creditanalyst/loaning/AllLoansca";
import LoanPendingDisbursementca from "./pages/creditanalyst/loaning/LoanPendingDisbursementca";
import DisbursementLoansca from "./pages/creditanalyst/loaning/DisbursementLoansca";
import ApproveLoanca from "./pages/creditanalyst/loaning/ApproveLoanca";
import RejectedLoansca from "./pages/creditanalyst/loaning/RejectedLoansca";
import Dashboardcs from "./pages/customerserviceofficer/Dashbaor";
import Accountingcs from "./pages/customerserviceofficer/accounting/Accountingcs";
import Registrycs from "./pages/customerserviceofficer/registry/Registrycs";
import Reportscs from "./pages/customerserviceofficer/reports/Reportscs";
import AllLoans from "./pages/loaning/AllLoans";
import LoanPendingDisbursementcs from "./pages/customerserviceofficer/loaning/LoanPendingDisbursementcs";
import DisbursementLoanscs from "./pages/customerserviceofficer/loaning/DisbursementLoanscs";
import ApproveLoancs from "./pages/customerserviceofficer/loaning/ApproveLoancs";
import RejectedLoanscs from "./pages/customerserviceofficer/loaning/RejectedLoanscs";
import Login from "./pages/Login";
import Customersrm from "./pages/regionalmanager/registry/Customersrm";
import PendingAmendmentsrm from "./pages/regionalmanager/registry/PendingAmendmentsrm";
import ApprovalPendingrm from "./pages/regionalmanager/registry/ApprovalPendingrm";
import CustomerTransferrm from "./pages/regionalmanager/registry/CustomerTransferrm";
import CustomerCategoriesrm from "./pages/regionalmanager/registry/CustomerCategoriesrm";
import CustomerEditsrm from "./pages/regionalmanager/registry/CustomerEditsrm";
import Customersbm from "./pages/branchmanager/registry copy/Customersbm";
import PendingAmendmentsbm from "./pages/branchmanager/registry copy/PendingAmendmentsbm";
import ApprovalPendingbm from "./pages/branchmanager/registry copy/ApprovalPendingbm";
import CustomerTransferbm from "./pages/branchmanager/registry copy/CustomerTransferbm";
import CustomerCategoriesbm from "./pages/branchmanager/registry copy/CustomerCategoriesbm";
import CustomerEditsbm from "./pages/branchmanager/registry copy/CustomerEditsbm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AllLoanscs from "./pages/customerserviceofficer/loaning/AllLoanscs";
import LoanPendingRmcs from "./pages/customerserviceofficer/loaning/LoanPendingRmcs";
import Customerscs from "./pages/customerserviceofficer/registry/Customerscs";
import PendingAmendmentscs from "./pages/customerserviceofficer/registry/PendingAmendmentscs";
import ApprovalPendingcs from "./pages/customerserviceofficer/registry/ApprovalPendingcs";
import CustomerTransfercs from "./pages/customerserviceofficer/registry/CustomerTransfercs";
import CustomerCategoriescs from "./pages/customerserviceofficer/registry/CustomerCategoriescs";
import CustomerEditscs from "./pages/customerserviceofficer/registry/CustomerEditscs";
import LoanPendingRmca from "./pages/creditanalyst/loaning/LoanPendingRmca"
import Customersca from "./pages/creditanalyst/registry/Customersca";
import PendingAmendmentsca from "./pages/creditanalyst/registry/PendingAmendmentsca";
import ApprovalPendingca from "./pages/creditanalyst/registry/ApprovalPendingca";
import CustomerTransferca from "./pages/creditanalyst/registry/CustomerTransferca";
import CustomerCategoriesca from "./pages/creditanalyst/registry/CustomerCategoriesca";
import CustomerEditsca from "./pages/creditanalyst/registry/CustomerEditsca";
import OperationsManagement from "./pages/operations/Operations";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SidebarAdmin from "./pages/admin/components/SidebarAdmin";
import HeaderAdmin from "./pages/admin/components/HeaderAdmin";







// Customer Service pages


function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  const role = profile?.role;

 const renderSidebar = () => {
  switch (role) {
    case "relationship_officer":
      return <OfficerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    case "branch_manager":
      return <Sidebarbm sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    case "regional_manager":
      return <Sidebarrm sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    case "credit_analyst_officer":        
      return <Sidebarca sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
        case "admin":        
      return <SidebarAdmin sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    case "customer_service_officer":      
      return <Sidebarcs sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    default:
      return null;
  }
};

const renderHeader = () => {
  switch (role) {
    case "relationship_officer":
      return <OfficerHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    case "branch_manager":
      return <Headerbm sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    case "regional_manager":
      return <Headerrm sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    case "credit_analyst_officer":        
      return <Headerca sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
       case "admin":        
      return <HeaderAdmin sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    case "customer_service_officer":      

      return <Headercs sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
    default:
      return null;
  }
};
const getDefaultRoute = () => {
  switch (role) {
    case "relationship_officer":
      return "/officer";
    case "branch_manager":
      return "/dashboard/bm";
    case "regional_manager":
      return "/dashboard/rm";
    case "credit_analyst_officer":        // ← Change this
      return "/dashboard/ca";
    case "customer_service_officer":      // ← Change this
      return "/dashboard/cs";
    default:
      return "/dashboard";
  }
};

  return (
    <Router>
       <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        
        {/* Only show sidebars + headers if user is logged in */}
        {profile && (
          <>
            {renderSidebar()}
          </>
        )}

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-w-0">
          {profile && renderHeader()}

          <div className="flex-1 overflow-y-auto p-6">
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

              {/* Default redirect based on role */}
              <Route path="/" element={<Navigate to={getDefaultRoute()} />} />

              {/* Officer Routes */}
              {role === "relationship_officer" && (
                <>
                  <Route
                    path="/officer"
                    element={
                      <ProtectedRoute>
                        <OfficerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/officer/leads"
                    element={
                      <ProtectedRoute>
                        <Leads />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/officer/customers"
                    element={
                      <ProtectedRoute>
                        <Customers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/officer/loans"
                    element={
                      <ProtectedRoute>
                        <Loans />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/officer/loans/applications"
                    element={
                      <ProtectedRoute>
                        <LoanApplication />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/officer/loans/approval"
                    element={
                      <ProtectedRoute>
                        <ApprovalQueue />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/officer/customers/approval"
                    element={
                      <ProtectedRoute>
                        <Approval/>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/officer/customers/amendments"
                    element={
                      <ProtectedRoute>
                        <Amendments/>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/officer/conversions"
                    element={
                      <ProtectedRoute>
                        <ConversionChart />
                      </ProtectedRoute>
                    }
                  />
                </>
              )}

              {/* Branch Manager Routes */}
              {role === "branch_manager" && (
                <>
                  <Route
                    path="/dashboard/bm"
                    element={
                      <ProtectedRoute>
                        <Dashboarbm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/accounting/bm"
                    element={
                      <ProtectedRoute>
                        <Accountingbm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/registry/bm"
                    element={
                      <ProtectedRoute>
                        <Registrybm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports/bm"
                    element={
                      <ProtectedRoute>
                        <Reportsbm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/all/bm"
                    element={
                      <ProtectedRoute>
                        <AllLoansbm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/pending-regional-manager/bm"
                    element={
                      <ProtectedRoute>
                        <LoanPendingRmbm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/pending-branch-manager/bm"
                    element={
                      <ProtectedRoute>
                        <LoanPendingBmbm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/pending-disbursement/bm"
                    element={
                      <ProtectedRoute>
                        <LoanPendingDisbursementbm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/disbursement-loans/bm"
                    element={
                      <ProtectedRoute>
                        <DisbursementLoansbm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/loan-approval/bm"
                    element={
                      <ProtectedRoute>
                        <ApproveLoanbm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/rejected-loans/bm"
                    element={
                      <ProtectedRoute>
                        <RejectedLoansbm/>
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
  path="/registry/customers/bm"
  element={
    <ProtectedRoute>
      <Customersbm />
    </ProtectedRoute>
  }
/>
<Route
  path="/registry/pending-amendments/bm"
  element={
    <ProtectedRoute>
      <PendingAmendmentsbm />
    </ProtectedRoute>
  }
/>
<Route
  path="/registry/approvals-pending/bm"
  element={
    <ProtectedRoute>
      <ApprovalPendingbm/>
    </ProtectedRoute>
  }
/>
{/* <Route
  path="/registry/callbacks-pending/rm"
  element={
    <ProtectedRoute>
      <CallbacksPendingrm />
    </ProtectedRoute>
  }
/> */}
<Route
  path="/registry/customer-transfer/bm"
  element={
    <ProtectedRoute>
      <CustomerTransferbm/>
    </ProtectedRoute>
  }
/>
<Route
  path="/registry/customer-categories/bm"
  element={
    <ProtectedRoute>
      <CustomerCategoriesbm/>
    </ProtectedRoute>
  }
/>
<Route
  path="/registry/customer-edits/rm"
  element={
    <ProtectedRoute>
      <CustomerEditsbm />
    </ProtectedRoute>
  }
  />
                </>
              )}

              {/* Regional Manager Routes */}
              {role === "regional_manager" && (
                <>
                  <Route
                    path="/dashboard/rm"
                    element={
                      <ProtectedRoute>
                        <Dashboarrm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/accounting/rm"
                    element={
                      <ProtectedRoute>
                        <Accountingrm/>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/registry/rm"
                    element={
                      <ProtectedRoute>
                        <Registryrm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports/rm"
                    element={
                      <ProtectedRoute>
                        <Reportsrm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/all/rm"
                    element={
                      <ProtectedRoute>
                        <AllLoansrm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/pending-regional-manager/rm"
                    element={
                      <ProtectedRoute>
                        <LoanPendingRmrm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/pending-branch-manager/rm"
                    element={
                      <ProtectedRoute>
                        <LoanPendingBmrm/>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/pending-disbursement/rm"
                    element={
                      <ProtectedRoute>
                        <LoanPendingDisbursementrm/>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/disbursement-loans/rm"
                    element={
                      <ProtectedRoute>
                        <DisbursementLoansrm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/loan-approval/rm"
                    element={
                      <ProtectedRoute>
                        <ApproveLoanrm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/rejected-loans/rm"
                    element={
                      <ProtectedRoute>
                        <RejectedLoansrm/>
                      </ProtectedRoute>
                    }
                  />







                  <Route
  path="/registry/customers/rm"
  element={
    <ProtectedRoute>
      <Customersrm />
    </ProtectedRoute>
  }
/>
<Route
  path="/registry/pending-amendments/rm"
  element={
    <ProtectedRoute>
      <PendingAmendmentsrm />
    </ProtectedRoute>
  }
/>
<Route
  path="/registry/approvals-pending/rm"
  element={
    <ProtectedRoute>
      <ApprovalPendingrm/>
    </ProtectedRoute>
  }
/>
{/* <Route
  path="/registry/callbacks-pending/rm"
  element={
    <ProtectedRoute>
      <CallbacksPendingrm />
    </ProtectedRoute>
  }
/> */}
<Route
  path="/registry/customer-transfer/rm"
  element={
    <ProtectedRoute>
      <CustomerTransferrm />
    </ProtectedRoute>
  }
/>
<Route
  path="/registry/customer-categories/rm"
  element={
    <ProtectedRoute>
      <CustomerCategoriesrm/>
    </ProtectedRoute>
  }
/>
<Route
  path="/registry/customer-edits/rm"
  element={
    <ProtectedRoute>
      <CustomerEditsrm />
    </ProtectedRoute>
  }
/>

                </>
              )}

               {/* Credit Analyst Routes */}
              {role === "credit_analyst_officer" && (
                <>
                  <Route path="/dashboard/ca" element={<ProtectedRoute><Dashboarca /></ProtectedRoute>} />
                  <Route path="/accounting/ca" element={<ProtectedRoute><Accountingca/></ProtectedRoute>} />
                  <Route path="/registry/ca" element={<ProtectedRoute><Registryca/></ProtectedRoute>} />
                  <Route path="/reports/ca" element={<ProtectedRoute><Reportsca/></ProtectedRoute>} />
                  <Route path="/loaning/all/ca" element={<ProtectedRoute><AllLoansca/></ProtectedRoute>} />
                  <Route path="/loaning/pending-regional-manager/ca" element={<ProtectedRoute><LoanPendingRmca /></ProtectedRoute>} />
                  <Route path="/loaning/pending-branch-manager/ca" element={<ProtectedRoute><LoanPendingDisbursementca /></ProtectedRoute>} />
                  <Route path="/loaning/pending-disbursement/ca" element={<ProtectedRoute><LoanPendingDisbursementca /></ProtectedRoute>} />
                  <Route path="/loaning/disbursement-loans/ca" element={<ProtectedRoute><DisbursementLoansca /></ProtectedRoute>} />
                  <Route path="/loaning/loan-approval/ca" element={<ProtectedRoute><ApproveLoanca /></ProtectedRoute>} />
                  <Route path="/loaning/rejected-loans/ca" element={<ProtectedRoute><RejectedLoansca/></ProtectedRoute>} />
                  <Route path="/registry/customers/ca" element={<ProtectedRoute><Customersca/></ProtectedRoute>} />
                  <Route path="/registry/pending-amendments/ca" element={<ProtectedRoute><PendingAmendmentsca /></ProtectedRoute>} />
                  <Route path="/registry/approvals-pending/ca" element={<ProtectedRoute><ApprovalPendingca/></ProtectedRoute>} />
                  <Route path="/registry/customer-transfer/ca" element={<ProtectedRoute><CustomerTransferca /></ProtectedRoute>} />
                  <Route path="/registry/customer-categories/ca" element={<ProtectedRoute><CustomerCategoriesca/></ProtectedRoute>} />
                  <Route path="/registry/customer-edits/ca" element={<ProtectedRoute><CustomerEditsca /></ProtectedRoute>} />
                </>
              )}

              {/* Customer Service Routes */}
              {role === "customer_service_officer" && (
                <>
                  <Route path="/dashboard/cs" element={<ProtectedRoute><Dashboardcs/></ProtectedRoute>} />
                  <Route path="/accounting/cs" element={<ProtectedRoute><Accountingcs/></ProtectedRoute>} />
                  <Route path="/registry/cs" element={<ProtectedRoute><Registrycs/></ProtectedRoute>} />
                  <Route path="/reports/cs" element={<ProtectedRoute><Reportscs /></ProtectedRoute>} />
                  <Route path="/loaning/all/cs" element={<ProtectedRoute><AllLoanscs/></ProtectedRoute>} />
                  <Route path="/loaning/pending-regional-manager/cs" element={<ProtectedRoute><LoanPendingRmcs/></ProtectedRoute>} />
                  <Route path="/loaning/pending-branch-manager/cs" element={<ProtectedRoute><LoanPendingRmcs /></ProtectedRoute>} />
                  <Route path="/loaning/pending-disbursement/cs" element={<ProtectedRoute><LoanPendingDisbursementcs /></ProtectedRoute>} />
                  <Route path="/loaning/disbursement-loans/cs" element={<ProtectedRoute><DisbursementLoanscs/></ProtectedRoute>} />
                  <Route path="/loaning/loan-approval/cs" element={<ProtectedRoute><ApproveLoancs /></ProtectedRoute>} />
                  <Route path="/loaning/rejected-loans/cs" element={<ProtectedRoute><RejectedLoanscs /></ProtectedRoute>} />
                  <Route path="/registry/customers/cs" element={<ProtectedRoute><Customerscs /></ProtectedRoute>} />
                  <Route path="/registry/pending-amendments/cs" element={<ProtectedRoute><PendingAmendmentscs /></ProtectedRoute>} />
                  <Route path="/registry/approvals-pending/cs" element={<ProtectedRoute><ApprovalPendingcs/></ProtectedRoute>} />
                  <Route path="/registry/customer-transfer/cs" element={<ProtectedRoute><CustomerTransfercs /></ProtectedRoute>} />
                  <Route path="/registry/customer-categories/cs" element={<ProtectedRoute><CustomerCategoriescs/></ProtectedRoute>} />
                  <Route path="/registry/customer-edits/cs" element={<ProtectedRoute><CustomerEditscs /></ProtectedRoute>} />
                </>
              )}

               <Route path="/operations" element={<OperationsManagement/>} />
               



 {role === "admin" && (
                <>
                    <Route path="/dashboard/admin" element={<AdminDashboard/>} />
                </>
              )}





            </Routes>
          </div>
        </div>
      </div>

                       

    </Router>
  );
}

export default App;