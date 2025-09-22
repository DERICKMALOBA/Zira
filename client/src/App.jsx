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
import Sidebar from "./components/sidebar";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

// Officer components
import OfficerSidebar from "./relationship-officer/components/OfficerSidebar";
import OfficerHeader from "./relationship-officer/components/OfficerHeader";

// Shared pages
import Dashboard from "./pages/Dashboard";
import Accounting from "./pages/accounting/Accounting";
import CreditSettings from "./pages/Credit-settings/CreditSettings";
import Registry from "./pages/registry/Registry";
import Reports from "./pages/reports/Reports";

// Loaning pages
import AllLoans from "./pages/loaning/AllLoans";
import LoanPendingRm from "./pages/loaning/LoanPendingRm";
import LoanPendingBm from "./pages/loaning/LoanPendingBm";
import LoanPendingDisbursement from "./pages/loaning/LoanPendingDisbursement";
import DisbursementLoans from "./pages/loaning/DisbursementLoans";
import RejectedLoans from "./pages/loaning/RejectedLoans";

// Officer pages
import OfficerDashboard from "./relationship-officer/Dashboard";
import Leads from "./relationship-officer/Leads";
import Customers from "./relationship-officer/Customers";
import ConversionChart from "./relationship-officer/components/CoversionChart";
import Approval from "./relationship-officer/Approval";
import Amendments from "./relationship-officer/amendments/Amendments";
import Loans from "./relationship-officer/loans/Loans";
import LoanApplication from "./relationship-officer/loans/LoanApplication";
import ApprovalQueue from "./relationship-officer/loans/ApprovalQueue";

// Auth pages
import Login from "./pages/Login"; // make sure you have this

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  const role = profile?.role;

  return (
    <Router>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Only show sidebars + headers if user is logged in */}
        {profile && (
          <>
            {role === "relationship_officer" ? (
              <OfficerSidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            ) : (
              <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            )}
          </>
        )}

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-w-0">
          {profile && (
            <>
              {role === "relationship_officer" ? (
                <OfficerHeader
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              ) : (
                <Header
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              )}
            </>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" />} />

              {/* Shared routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/*"
                element={
                  <ProtectedRoute>
                    <Accounting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/credit-settings/*"
                element={
                  <ProtectedRoute>
                    <CreditSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/registry/*"
                element={
                  <ProtectedRoute>
                    <Registry />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/*"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* Loaning - restricted by role */}
              {role === "regional_manager" && (
                <>
                  <Route
                    path="/loaning/all"
                    element={
                      <ProtectedRoute>
                        <AllLoans />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/pending-regional-manager"
                    element={
                      <ProtectedRoute>
                        <LoanPendingRm />
                      </ProtectedRoute>
                    }
                  />
                </>
              )}
              {role === "branch_manager" && (
                <Route
                  path="/loaning/pending-branch-manager"
                  element={
                    <ProtectedRoute>
                      <LoanPendingBm />
                    </ProtectedRoute>
                  }
                />
              )}
              {(role === "credit_analyst" || role === "customer_service") && (
                <>
                  <Route
                    path="/loaning/pending-disbursement"
                    element={
                      <ProtectedRoute>
                        <LoanPendingDisbursement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/disbursement-loans"
                    element={
                      <ProtectedRoute>
                        <DisbursementLoans />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loaning/rejected-loans"
                    element={
                      <ProtectedRoute>
                        <RejectedLoans />
                      </ProtectedRoute>
                    }
                  />
                </>
              )}

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
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
