// src/pages/credit-settings/CreditSettings.jsx
import React from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import DocumentSettings from './DocumentSettings'
import KPICategories from './KPICategories'

const CreditSettings = () => {
  const location = useLocation()
  const tabs = [
    { name: 'Document Settings', href: '/credit-settings/document-settings' },
    { name: 'KPI Categories', href: '/credit-settings/kpi-categories' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Credit Settings</h1>
      
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
          <Route path="document-settings" element={<DocumentSettings />} />
          <Route path="kpi-categories" element={<KPICategories />} />
          <Route path="*" element={<Navigate to="document-settings" />} />
        </Routes>
      </div>
    </div>
  )
}

export default CreditSettings