import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from "../hooks/userAuth";

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
  const { profile, loading: authLoading } = useAuth();

  const fetchDashboardData = async (regionId) => {
    try {
      setLoading(true);
      console.log('=== DASHBOARD DATA FETCH START ===');
      console.log('Fetching dashboard data for region:', regionId);

      // Initialize variables
      let totalLoans = 0;
      let activeCustomers = 0;
      let pendingApprovals = 0;
      let portfolioValue = 0;

      // 1. TOTAL LOANS
      console.log('1. Fetching total loans...');
      try {
        const { count: loansCount, error: loansError } = await supabase
          .from("loans")
          .select("*", { count: "exact" })
          .eq("region_id", regionId);

        if (loansError) {
          console.error('❌ Total loans error:', loansError);
        } else {
          totalLoans = loansCount || 0;
          console.log('✅ Total loans:', totalLoans);
        }
      } catch (err) {
        console.error('❌ Total loans exception:', err);
      }

      // 2. ACTIVE CUSTOMERS
      console.log('2. Fetching active customers...');
      try {
        const { count: customersCount, error: customersError } = await supabase
          .from("customers")
          .select("*", { count: "exact" })
          .eq("region_id", regionId);

        if (customersError) {
          console.error('❌ Active customers error:', customersError);
        } else {
          activeCustomers = customersCount || 0;
          console.log('✅ Active customers:', activeCustomers);
        }
      } catch (err) {
        console.error('❌ Active customers exception:', err);
      }

      // 3. PENDING APPROVALS - ONLY status = 'rm_review'
      console.log('3. Fetching pending approvals (status = rm_review)...');
      try {
        const { count: pendingCount, error: pendingError } = await supabase
          .from("customers")
          .select("*", { count: "exact" })
          .eq("region_id", regionId)
          .eq("status", "rm_review");

        if (pendingError) {
          console.error('❌ Pending approvals count error:', pendingError);
          console.log('Trying fallback method...');
          
          // Fallback: get actual data and count manually
          const { data: pendingCustomers, error: fallbackError } = await supabase
            .from("customers")
            .select("id, status")
            .eq("region_id", regionId)
            .eq("status", "rm_review");
          
          if (fallbackError) {
            console.error('❌ Pending approvals fallback error:', fallbackError);
            pendingApprovals = 0;
          } else {
            pendingApprovals = pendingCustomers ? pendingCustomers.length : 0;
            console.log('✅ Pending approvals (fallback):', pendingApprovals);
          }
        } else {
          pendingApprovals = pendingCount || 0;
          console.log('✅ Pending approvals:', pendingApprovals);
        }
      } catch (err) {
        console.error('❌ Pending approvals exception:', err);
        pendingApprovals = 0;
      }

      // 4. PORTFOLIO VALUE
      console.log('4. Fetching portfolio data...');
      try {
        const { data: loansData, error: loansDataError } = await supabase
          .from("loans")
          .select("scored_amount, status")
          .eq("region_id", regionId);

        if (loansDataError) {
          console.error('❌ Portfolio data error:', loansDataError);
        } else if (loansData) {
          portfolioValue = loansData.reduce((sum, loan) => sum + (loan.scored_amount || 0), 0);
          console.log('✅ Portfolio value:', portfolioValue);
        }
      } catch (err) {
        console.error('❌ Portfolio data exception:', err);
      }

      // 5. RECENT ACTIVITY
      console.log('5. Fetching recent activity...');
      let formattedActivity = [];
      try {
        const { data: activityData, error: activityError } = await supabase
          .from("loans")
          .select(`
            id,
            status,
            created_at,
            customers:customer_id (
              Firstname,
              Surname
            )
          `)
          .eq("region_id", regionId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (activityError) {
          console.error('❌ Recent activity error:', activityError);
        } else if (activityData) {
          formattedActivity = activityData.map((item) => ({
            id: item.id,
            type: item.status === "approved" ? "approval" : item.status === "disbursed" ? "disbursement" : "application",
            message:
              item.status === "approved"
                ? `Loan approved for ${item.customers?.Firstname || 'Unknown'} ${item.customers?.Surname || ''}`
                : item.status === "disbursed"
                ? `Loan disbursed to ${item.customers?.Firstname || 'Unknown'} ${item.customers?.Surname || ''}`
                : `Loan application from ${item.customers?.Firstname || 'Unknown'} ${item.customers?.Surname || ''}`,
            time: new Date(item.created_at).toLocaleDateString(),
            icon: stats[2].icon,
            iconBg: 'bg-yellow-100 text-yellow-600'
          }));
          console.log('✅ Recent activity:', formattedActivity.length, 'items');
        }
      } catch (err) {
        console.error('❌ Recent activity exception:', err);
      }

      // UPDATE UI
      console.log('6. Updating UI...');
      setStats(prevStats => [
        { ...prevStats[0], value: totalLoans.toLocaleString(), loading: false },
        { ...prevStats[1], value: activeCustomers.toLocaleString(), loading: false },
        { ...prevStats[2], value: pendingApprovals.toLocaleString(), loading: false },
        { ...prevStats[3], value: `Ksh ${portfolioValue.toLocaleString()}`, loading: false },
      ]);

      // Calculate performance metrics
      const portfolioGrowth = totalLoans > 0 ? Math.round((activeCustomers / totalLoans) * 100) : 0;
      const defaultRate = 0;
      const approvalRate = totalLoans > 0 ? Math.round(((totalLoans - pendingApprovals) / totalLoans) * 100) : 0;
      
      setPerformanceMetrics({ portfolioGrowth, defaultRate, approvalRate });
      setRecentActivity(formattedActivity);

      console.log('=== DASHBOARD DATA FETCH COMPLETE ===');
      console.log('Final stats:', { totalLoans, activeCustomers, pendingApprovals, portfolioValue });

    } catch (err) {
      console.error("❌ DASHBOARD FETCH ERROR:", err);
      setStats(prevStats => prevStats.map(stat => ({ ...stat, value: 'Error', loading: false })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== USEEFFECT TRIGGERED ===');
    console.log('Profile:', profile);
    console.log('Auth loading:', authLoading);
    
    if (profile?.region_id && !authLoading) {
      console.log('✅ Profile has region_id, fetching data...');
      fetchDashboardData(profile.region_id);
    } else if (!authLoading) {
      console.log('❌ No region_id found in profile');
      setStats(prevStats => prevStats.map(stat => ({ ...stat, loading: false })));
      setLoading(false);
    }
  }, [profile, authLoading]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Region ID: {profile?.region_id || 'Not assigned'}</p>
      </div>

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
                <li key={activity.id || index} className="flex items-center">
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
                    style={{ width: `${Math.min(performanceMetrics.portfolioGrowth, 100)}%` }}
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
                    style={{ width: `${Math.min(performanceMetrics.defaultRate, 100)}%` }}
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
                    style={{ width: `${Math.min(performanceMetrics.approvalRate, 100)}%` }}
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