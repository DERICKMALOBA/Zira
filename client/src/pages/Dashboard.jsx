// src/pages/Dashboard.jsx
import React from 'react'

const Dashboard = () => {
  const stats = [
    { title: 'Total Loans', value: '1,245', icon: '💰', color: 'bg-blue-500' },
    { title: 'Active Customers', value: '892', icon: '👥', color: 'bg-green-500' },
    { title: 'Pending Approvals', value: '47', icon: '⏳', color: 'bg-yellow-500' },
    { title: 'Portfolio Value', value: '$4.2M', icon: '📊', color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`rounded-full p-3 ${stat.color} text-white mr-4`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <ul className="space-y-3">
            <li className="flex items-center">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <span className="text-blue-600">📝</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Loan application from John Doe</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </li>
            <li className="flex items-center">
              <div className="bg-green-100 rounded-full p-2 mr-3">
                <span className="text-green-600">💳</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Payment received from Jane Smith</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </li>
            <li className="flex items-center">
              <div className="bg-purple-100 rounded-full p-2 mr-3">
                <span className="text-purple-600">👤</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New customer registration: ABC Enterprises</p>
                <p className="text-xs text-gray-500">Yesterday</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio growth</p>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                </div>
                <span className="text-sm font-medium text-green-600">+12%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Default rate</p>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
                <span className="text-sm font-medium text-red-600">2.3%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Approval rate</p>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <span className="text-sm font-medium text-blue-600">78%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard