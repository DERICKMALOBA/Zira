// src/pages/ReportsPage.jsx
import React from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import LoanReports from './LoanReports'
import PTPReports from './PTPReports'
import OfficerReports from './OfficerReports'
import FinancialReports from './FinancialReports'

const ReportsPage = () => {
  const location = useLocation()
  
  const tabs = [
    { name: 'Loan Reports', href: '/reports/loans', icon: '📊' },
    { name: 'PTP Reports', href: '/reports/ptp', icon: '🤝' },
    { name: 'Officer Reports', href: '/reports/officers', icon: '👥' },
    { name: 'Financial Reports', href: '/reports/financial', icon: '💰' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Generate and export comprehensive reports for your loan management system
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  to={tab.href}
                  className={`flex items-center whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                    location.pathname === tab.href
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            <Routes>
              <Route path="loans" element={<LoanReports />} />
              <Route path="ptp" element={<PTPReports />} />
              <Route path="officers" element={<OfficerReports />} />
              <Route path="financial" element={<FinancialReports />} />
              <Route path="*" element={<Navigate to="loans" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage