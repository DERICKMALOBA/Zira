// src/pages/reports/Reports.jsx
import React from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import CallCenterReports from './CallCenterReports'
import HQReports from './HQReports'

const Reports = () => {
  const location = useLocation()
  const tabs = [
    { name: 'Call Center Reports', href: '/reports/call-center-reports' },
    { name: 'HQ Reports', href: '/reports/hq-reports' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.href}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === tab.href
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="mt-6">
        <Routes>
          <Route path="call-center-reports" element={<CallCenterReports />} />
          <Route path="hq-reports" element={<HQReports />} />
          <Route path="*" element={<Navigate to="call-center-reports" />} />
        </Routes>
      </div>
    </div>
  )
}

export default Reports