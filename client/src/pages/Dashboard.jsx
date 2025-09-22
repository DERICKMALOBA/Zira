import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { 
      title: 'Total Loans', 
      value: '0', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      color: 'bg-blue-500', 
      loading: true 
    },
    { 
      title: 'Active Customers', 
      value: '0', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ), 
      color: 'bg-green-500', 
      loading: true 
    },
    { 
      title: 'Pending Approvals', 
      value: '0', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      color: 'bg-yellow-500', 
      loading: true 
    },
    { 
      title: 'Portfolio Value', 
      value: 'Ksh 0', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      color: 'bg-purple-500', 
      loading: true 
    },
  ]);
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    portfolioGrowth: 0,
    defaultRate: 0,
    approvalRate: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch total loans
      const { count: totalLoans, error: loansError } = await supabase
        .from('loans')
        .select('*', { count: 'exact' });
      
      // Fetch active customers
      const { count: activeCustomers, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact' });
        console.log("customers", activeCustomers)
      
      // Fetch pending approvals (assuming you have a status field in loans table)
      const { count: pendingApprovals, error: approvalsError } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('verification_status', 'pending');
      
      // Calculate portfolio value (sum of all loan amounts)
      const { data: loansData, error: portfolioError } = await supabase
        .from('loans')
        .select('scored_amount, status');
      
      let portfolioValue = 0;
      let approvedLoans = 0;
      let defaultedLoans = 0;
      
      if (loansData) {
        portfolioValue = loansData.reduce((sum, loan) => sum + (loan.scored_amount || 0), 0);
        
        // Calculate performance metrics
        approvedLoans = loansData.filter(loan => loan.status === 'booked').length;
        defaultedLoans = loansData.filter(loan => loan.status === 'defaulted').length;
      }
      
      // Fetch recent activity from loans table with customer info
      const { data: activityData, error: activityError } = await supabase
        .from('loans')
        .select(`
          *,
          customers:customer_id (
            Firstname,
            Surname
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (loansError || customersError || approvalsError || portfolioError || activityError) {
        console.error('Error fetching dashboard data:', 
          loansError || customersError || approvalsError || portfolioError || activityError);
      } else {
        // Update stats
        setStats([
          { 
            title: 'Total Loans', 
            value: totalLoans?.toLocaleString() || '0', 
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ), 
            color: 'bg-blue-500',
            loading: false
          },
          { 
            title: 'Active Customers', 
            value: activeCustomers?.toLocaleString() || '0', 
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ), 
            color: 'bg-green-500',
            loading: false
          },
          { 
            title: 'Pending Approvals', 
            value: pendingApprovals?.toLocaleString() || '0', 
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ), 
            color: 'bg-yellow-500',
            loading: false
          },
          { 
            title: 'Portfolio Value', 
            value: `Ksh ${portfolioValue.toLocaleString()}`, 
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ), 
            color: 'bg-purple-500',
            loading: false
          },
        ]);
        
        // Calculate performance metrics
        const portfolioGrowth = totalLoans > 0 ? Math.round((approvedLoans / totalLoans) * 100) : 0;
        const defaultRate = totalLoans > 0 ? Math.round((defaultedLoans / totalLoans) * 100) : 0;
        const approvalRate = totalLoans > 0 ? Math.round((approvedLoans / totalLoans) * 100) : 0;
        
        setPerformanceMetrics({
          portfolioGrowth,
          defaultRate,
          approvalRate
        });
        
        // Format recent activity
        if (activityData) {
          const formattedActivity = activityData.map(item => ({
            id: item.id,
            type: item.status === 'approved' ? 'approval' : item.status === 'disbursed' ? 'disbursement' : 'application',
            message: item.status === 'approved' 
              ? `Loan approved for ${item.customers?.Firstname} ${item.customers?.Surname}`
              : item.status === 'disbursed'
              ? `Loan disbursed to ${item.customers?.Firstname} ${item.customers?.Surname}`
              : `Loan application from ${item.customers?.Firstname} ${item.customers?.Surname}`,
            time: new Date(item.created_at).toLocaleDateString(),
            icon: item.status === 'approved' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : item.status === 'disbursed' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            iconBg: item.status === 'approved' ? 'bg-green-100' : item.status === 'disbursed' ? 'bg-purple-100' : 'bg-blue-100'
          }));
          setRecentActivity(formattedActivity);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscription for loans table
    const loansSubscription = supabase
      .channel('loan-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'loans' }, 
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    // Set up real-time subscription for customers table
    const customersSubscription = supabase
      .channel('customer-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customers' }, 
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(loansSubscription);
      supabase.removeChannel(customersSubscription);
    };
  }, []);

  return (
    <div>
     
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`rounded-full p-3 ${stat.color} text-white mr-4`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                {stat.loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center">
                  <div className="bg-gray-200 rounded-full p-2 mr-3 animate-pulse h-9 w-9"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((activity, index) => (
                <li key={index} className="flex items-center">
                  <div className={`rounded-full p-2 mr-3 ${activity.iconBg}`}>
                    {activity.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </li>
              ))}
              {recentActivity.length === 0 && (
                <li className="text-center text-gray-500 py-4">
                  No recent activity
                </li>
              )}
            </ul>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio growth</p>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${performanceMetrics.portfolioGrowth}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-green-600">+{performanceMetrics.portfolioGrowth}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Default rate</p>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${performanceMetrics.defaultRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-red-600">{performanceMetrics.defaultRate}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Approval rate</p>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${performanceMetrics.approvalRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-blue-600">{performanceMetrics.approvalRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;