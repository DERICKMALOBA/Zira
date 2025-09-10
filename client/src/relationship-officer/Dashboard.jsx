// src/pages/relationship-officer/Dashboard.jsx
import React, { useState, useEffect } from 'react'
import StatsCards from './components/StatsCards'
import RecentActivity from './components/RecentActivity'
import ConversionChart from './components/CoversionChart'

const OfficerDashboard = () => {
  const [stats, setStats] = useState({
    totalLeads: 45,
    totalCustomers: 28,
    totalLoans: 15,
    conversionRate: 62.2,
    activeLeads: { hot: 12, warm: 18, cold: 15 }
  })
  
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, full_name: 'John Doe', phone: '+254712345678', status: 'hot', created_at: new Date() },
    { id: 2, full_name: 'Jane Smith', phone: '+254723456789', status: 'warm', created_at: new Date(Date.now() - 86400000) },
    { id: 3, full_name: 'Mike Johnson', phone: '+254734567890', status: 'cold', created_at: new Date(Date.now() - 172800000) },
    { id: 4, full_name: 'Sarah Wilson', phone: '+254745678901', status: 'hot', created_at: new Date(Date.now() - 259200000) },
    { id: 5, full_name: 'David Brown', phone: '+254756789012', status: 'warm', created_at: new Date(Date.now() - 345600000) }
  ])

  

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Relationship Officer Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your performance overview.</p>
      </div>

      {/* Statistics Cards */}
      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Conversion Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Conversion Rate</h2>
          <ConversionChart stats={stats} />
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Leads</h2>
          <RecentActivity activities={recentActivity} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/officer/leads"
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
          >
            <h3 className="font-semibold text-indigo-600">Add New Lead</h3>
            <p className="text-sm text-gray-600">Capture new potential customer information</p>
          </a>
          
          <a
            href="/officer/customers"
            className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <h3 className="font-semibold text-green-600">View Customers</h3>
            <p className="text-sm text-gray-600">Manage your converted customers</p>
          </a>
          
          <a
            href="/officer/loans"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <h3 className="font-semibold text-purple-600">Book Loan</h3>
            <p className="text-sm text-gray-600">Create new loan applications</p>
          </a>
        </div>
      </div>
    </div>
  )
}

export default OfficerDashboard