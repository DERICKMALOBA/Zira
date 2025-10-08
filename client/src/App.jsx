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

// Layout Components
import OfficerSidebar from "./relationship-officer/components/OfficerSidebar";
import SidebarAdmin from "./pages/admin/components/SidebarAdmin";

import OfficerHeader from "./relationship-officer/components/OfficerHeader";
import HeaderAdmin from "./pages/admin/components/HeaderAdmin";



// Relationship Officer Pages (Remain separate)
import OfficerDashboard from "./relationship-officer/Dashboard";
import Leads from "./relationship-officer/Leads";
import Customers from "./relationship-officer/Customers";
import Loans from "./relationship-officer/loans/Loans";
import LoanApplication from "./relationship-officer/loans/LoanApplication";
import ApprovalQueue from "./relationship-officer/loans/ApprovalQueue";
import Approval from "./relationship-officer/Approval";
import Amendments from "./relationship-officer/amendments/Amendments";
import ConversionChart from "./relationship-officer/components/CoversionChart";

// Admin Pages (Remain separate)
import AdminDashboard from "./pages/admin/AdminDashboard";
import AllUsers from "./pages/admin/AllUsers";
import AddUsers from "./pages/admin/AddUsers";
import SuspendedUsers from "./pages/admin/suspendedUsers";
import AllLoansAdmin from "./pages/admin/loans/AllLoansAdmin";
import PendingLoans from "./pages/admin/loans/PendingLoans";
import ApprovedLoans from "./pages/admin/loans/ApprovedLoans";
import LoanProduct from "./pages/admin/loans/LoanProduct";
import RestructureLoans from "./pages/admin/loans/RestructureLoans";
import RejectedLoans from "./pages/loaning/RejectedLoans";

import LoanWriteOff from "./pages/admin/loans/LoanWriteOff";

// Other
import Login from "./pages/Login";
import OperationsManagement from "./pages/operations/Operations";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SharedSidebar from "./components/SharedSidebar";
import SharedHeader from "./components/SharedHeader";
import Dashboard from "./pages/Dashboard";
import Accounting from "./pages/accounting/Accounting";
import Transactions from "./pages/accounting/Transactions";
import ChartOfAccounts from "./pages/accounting/ChartOfAccounts";
import BankReconciliations from "./pages/accounting/BankReconciliations";
import Journals from "./pages/accounting/Journals";
import Registry from "./pages/registry/Registry";
import PendingAmendments from "./pages/registry/PendingAmendments";
import ApprovalPending from "./pages/registry/ApprovalPending";
import CustomerTransfer from "./pages/registry/CustomerTransfer";
import CustomerCategories from "./pages/registry/CustomerCategories";
import CustomerEdits from "./pages/registry/CustomerEdits";
import AllLoans from "./pages/loaning/AllLoans";
import LoanPendingRm from "./pages/loaning/LoanPendingRm";
import LoanPendingBm from "./pages/loaning/LoanPendingBm";
import LoanPendingDisbursement from "./pages/loaning/LoanPendingDisbursement";
import ApproveLoanbm from "./pages/loaning/ApproveLoan";
import Reports from "./pages/reports/Reports";
import HQReports from "./pages/reports/HQReports";
import CallbacksPending from "./pages/registry/CallbacksPending";
import AllCustomers from "./pages/registry/AllCustomers";
import DisbursedLoans from "./pages/loaning/DisbursementLoans";
import DisbursedLoansAdmin from "./pages/admin/loans/DisbursedLoansAdmin";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  const role = profile?.role;

  // Roles that share the same layout and components
  const sharedRoles = ['branch_manager', 'regional_manager', 'credit_analyst_officer', 'customer_service_officer'];
  const isSharedRole = sharedRoles.includes(role);

  const renderSidebar = () => {
    switch (role) {
      case "relationship_officer":
        return (
          <OfficerSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        );
      case "admin":
        return (
          <SidebarAdmin
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        );
      default:
        if (isSharedRole) {
          return (
            <SharedSidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              userRole={role}
            />
          );
        }
        return null;
    }
  };

  const renderHeader = () => {
    switch (role) {
      case "relationship_officer":
        return (
          <OfficerHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        );
      case "admin":
        return (
          <HeaderAdmin
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        );
      default:
        if (isSharedRole) {
          return (
            <SharedHeader
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              userRole={role}
            />
          );
        }
        return null;
    }
  };

  const getDefaultRoute = () => {
    switch (role) {
      case "relationship_officer":
        return "/officer";
      case "branch_manager":
        return "/dashboard";
      case "regional_manager":
        return "/dashboard";
      case "credit_analyst_officer":
        return "/dashboard";
      case "customer_service_officer":
        return "/dashboard";
      case "admin":
        return "/dashboard/admin";
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
        {profile && <>{renderSidebar()}</>}

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-w-0">
          {profile && renderHeader()}

          <div className="flex-1 overflow-y-auto p-6">
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

              {/* Default redirect based on role */}
              <Route path="/" element={<Navigate to={getDefaultRoute()} />} />

              {/* Relationship Officer Routes */}
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
                        <Approval />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/officer/customers/amendments"
                    element={
                      <ProtectedRoute>
                        <Amendments />
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

              {/* Shared Routes for RM, BM, CA, CSO */}
              {isSharedRole && (
                <>
                  {/* Dashboard */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard userRole={role} />
                      </ProtectedRoute>
                    }
                  />

                  {/* Accounting */}
                  <Route
                    path="/accounting"
                    element={
                      <ProtectedRoute>
                        <Accounting userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/accounting/transactions"
                    element={
                      <ProtectedRoute>
                        <Transactions userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/accounting/chart-of-accounts"
                    element={
                      <ProtectedRoute>
                        <ChartOfAccounts userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/accounting/bank-reconciliations"
                    element={
                      <ProtectedRoute>
                        <BankReconciliations userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/accounting/journals"
                    element={
                      <ProtectedRoute>
                        <Journals userRole={role} />
                      </ProtectedRoute>
                    }
                  />

                  {/* Registry */}
                  <Route
                    path="/registry"
                    element={
                      <ProtectedRoute>
                        <Registry userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/registry/customers"
                    element={
                      <ProtectedRoute>
                        <AllCustomers userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/registry/pending-amendments"
                    element={
                      <ProtectedRoute>
                        <PendingAmendments userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/registry/approvals-pending"
                    element={
                      <ProtectedRoute>
                        <ApprovalPending userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/registry/customer-transfer"
                    element={
                      <ProtectedRoute>
                        <CustomerTransfer userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/registry/customer-categories"
                    element={
                      <ProtectedRoute>
                        <CustomerCategories userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/registry/customer-edits"
                    element={
                      <ProtectedRoute>
                        <CustomerEdits userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                    <Route
                    path="/registry/callbacks-pending"
                    element={
                      <ProtectedRoute>
                        <CallbacksPending userRole={role} />
                      </ProtectedRoute>
                    }
                  />

                  {/* Reports */}
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <Reports userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports/hq-reports"
                    element={
                      <ProtectedRoute>
                        <HQReports userRole={role} />
                      </ProtectedRoute>
                    }
                  />

                  {/* Loaning */}
                  <Route
                    path="/loaning/all"
                    element={
                      <ProtectedRoute>
                        <AllLoans userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/pending-regional-manager"
                    element={
                      <ProtectedRoute>
                        <LoanPendingRm userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/pending-branch-manager"
                    element={
                      <ProtectedRoute>
                        <LoanPendingBm userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/pending-disbursement"
                    element={
                      <ProtectedRoute>
                        <LoanPendingDisbursement userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/disbursement-loans"
                    element={
                      <ProtectedRoute>
                        <DisbursedLoans userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/loan-approval"
                    element={
                      <ProtectedRoute>
                        <ApproveLoanbm userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/rejected-loans"
                    element={
                      <ProtectedRoute>
                        <RejectedLoans userRole={role} />
                      </ProtectedRoute>
                    }
                  />
                </>
              )}

              {/* Operations */}
              <Route path="/operations" element={<OperationsManagement />} />

              {/* Admin Routes */}
              {role === "admin" && (
                <>
                  <Route path="/dashboard/admin" element={<AdminDashboard />} />
                  <Route path="/users/all/admin" element={<AllUsers />} />
                  <Route path="/users/add/admin" element={<AddUsers />} />
                  <Route
                    path="/users/suspended/admin"
                    element={<SuspendedUsers />}
                  />

                  <Route path="/loans/all/admin" element={<AllLoansAdmin />} />
                  <Route
                    path="/loans/pending/admin"
                    element={<PendingLoans />}
                  />
                  <Route
                    path="/loans/approved/admin"
                    element={<ApprovedLoans />}
                  />
                  <Route
                    path="/loans/product/admin"
                    element={<LoanProduct />}
                  />
                  <Route
                    path="/loans/restructure/admin"
                    element={<RestructureLoans />}
                  />
                  <Route
                    path="/loans/rejected/admin"
                    element={<RejectedLoans />}
                  />
                  <Route
                    path="/loans/disbursed/admin"
                    element={<DisbursedLoansAdmin />}
                  />
                  <Route
                    path="/loans/writeoffs/admin"
                    element={<LoanWriteOff />}
                  />
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