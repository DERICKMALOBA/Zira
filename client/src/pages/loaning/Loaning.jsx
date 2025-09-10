// src/pages/loaning/Loaning.jsx
import React from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import Loans from './Loans'
import LoanApproval from './LoanApproval'

const Loaning = () => {
  const location = useLocation()
  const tabs = [
    { name: 'Loans', href: '/loaning/loans' },
    { name: 'Loan Approval', href: '/loaning/loan-approval' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Loan Management</h1>
      
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
          <Route path="loans" element={<Loans />} />
          <Route path="loan-approval" element={<LoanApproval />} />
          <Route path="*" element={<Navigate to="loans" />} />
        </Routes>
      </div>
    </div>
  )
}

export default Loaning