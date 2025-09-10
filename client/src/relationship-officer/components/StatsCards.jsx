// src/pages/relationship-officer/components/StatsCards.jsx
import React from 'react'
import { 
  UserGroupIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline'

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Converted Customers',
      value: stats.totalCustomers,
      icon: UsersIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Booked Loans',
      value: stats.totalLoans,
      icon: CurrencyDollarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: ArrowTrendingUpIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${card.bgColor} ${card.color} mr-4`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards