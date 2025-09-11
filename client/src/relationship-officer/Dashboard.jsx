// src/pages/relationship-officer/Dashboard.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import StatsCards from './components/StatsCards'
import RecentActivity from './components/RecentActivity'
import ConversionChart from './components/CoversionChart'

const OfficerDashboard = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalCustomers: 0,
    totalLoans: 0,
    conversionRate: 0,
    activeLeads: { hot: 0, warm: 0, cold: 0 }
  })
  
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch leads data
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
        
        if (leadsError) throw leadsError
        
        // Fetch customers data
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
        
        if (customersError) throw customersError
        
        // Fetch loans data (assuming you have a loans table)
        const { data: loansData} = await supabase
          .from('loans')
          .select('*')
        
        // Count leads by status
        const hotLeads = leadsData.filter(lead => lead.status === 'Hot').length
        const warmLeads = leadsData.filter(lead => lead.status === 'Warm').length
        const coldLeads = leadsData.filter(lead => lead.status === 'Cold').length
        
        // Calculate conversion rate
        const conversionRate = customersData.length > 0 
          ? (customersData.length / (customersData.length + leadsData.length)) * 100 
          : 0
        
        // Get recent leads (last 5)
        const recentLeads = leadsData
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(lead => ({
            id: lead.id,
            full_name: `${lead.Firstname || ''} ${lead.Surname || ''}`.trim(),
            phone: lead.mobile || lead.phone || 'N/A',
            status: lead.status?.toLowerCase() || 'cold',
            created_at: lead.created_at ? new Date(lead.created_at) : new Date()
          }))
        
        // Update stats
        setStats({
          totalLeads: leadsData.length,
          totalCustomers: customersData.length,
          totalLoans: loansData?.length || 0,
          conversionRate: parseFloat(conversionRate.toFixed(1)),
          activeLeads: { 
            hot: hotLeads, 
            warm: warmLeads, 
            cold: coldLeads 
          }
        })
        
        // Update recent activity
        setRecentActivity(recentLeads)
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
    
        <p className="text-gray-600 text-center">Welcome back! Here's your performance overview.</p>
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