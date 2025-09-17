// src/App.jsx
import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/sidebar";
import Header from "./components/Header";
import OfficerSidebar from './relationship-officer/components/OfficerSidebar'
import Dashboard from "./pages/Dashboard";
import Accounting from "./pages/accounting/Accounting";
import CreditSettings from "./pages/Credit-settings/CreditSettings";
import Registry from "./pages/registry/Registry";
import Loaning from "./pages/loaning/Loaning";
import Reports from "./pages/reports/Reports";

import "./index.css";
import OfficerDashboard from "./relationship-officer/Dashboard";
import Leads from "./relationship-officer/Leads";
import Customers from "./relationship-officer/Customers";
import Loans from "./relationship-officer/Loans";
import ConversionChart from "./relationship-officer/components/CoversionChart";
import LoanVerificationForm from "./loan/LoanVerificationForm";
import Approval from "./relationship-officer/Approval";
import Amendments from "./relationship-officer/amendments/Amendments";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Conditional Sidebar based on route */}
              <Routes>
                <Route path="/officer/*" element={
                  <div className={`flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`}>
                    <OfficerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                  </div>
                } />
                <Route path="*" element={
                  <div className={`flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`}>
                    <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                  </div>
                } />
              </Routes>

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounting/*" element={<Accounting />} />
              <Route path="/credit-settings/*" element={<CreditSettings />} />
              <Route path="/registry/*" element={<Registry />} />
              <Route path="/loaning/*" element={<Loaning />} />
              <Route path="/reports/*" element={<Reports />} />


              <Route path="/loans" element={<LoanVerificationForm/>} />

              <Route path="/officer" element={<OfficerDashboard />} />
              <Route path="/officer/leads" element={<Leads />} />
              <Route path="/officer/customers" element={<Customers />} />
              <Route path="/officer/loans" element={<Loans />} />
                            <Route path="/officer/customers/approval" element={<Approval />} />
              <Route path="/officer/customers/amendments" element={<Amendments/>} />


              <Route
                path="/officer/conversions"
                element={<ConversionChart />}
              />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
