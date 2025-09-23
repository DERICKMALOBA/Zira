import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

// Heroicons
import {
  BanknotesIcon,
  UsersIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowDownCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const Dashboarbm = () => {
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    portfolioGrowth: 0,
    defaultRate: 0,
    approvalRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState(null);

  // 🔹 Get branch_id of logged-in BM
  const fetchBranchId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("branch_id")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching branch id", error);
      return;
    }

    setBranchId(profile.branch_id);
  };

  // 🔹 Fetch dashboard data for the BM's branch
  const fetchDashboardData = async (branchId) => {
    try {
      setLoading(true);

      // Total loans for this branch
      const { count: totalLoans } = await supabase
        .from("loans")
        .select("*", { count: "exact" })
        .eq("branch_id", branchId);

      // Active customers for this branch
      const { count: activeCustomers } = await supabase
        .from("customers")
        .select("*", { count: "exact" })
        .eq("branch_id", branchId);

      // Pending approvals in this branch
      const { count: pendingApprovals } = await supabase
        .from("customers")
        .select("*", { count: "exact" })
        .eq("branch_id", branchId)
        .eq("verification_status", "pending");

      // Portfolio value for this branch
      const { data: loansData } = await supabase
        .from("loans")
        .select("scored_amount, status")
        .eq("branch_id", branchId);

      let portfolioValue = 0;
      let approvedLoans = 0;
      let defaultedLoans = 0;

      if (loansData) {
        portfolioValue = loansData.reduce(
          (sum, loan) => sum + (loan.scored_amount || 0),
          0
        );
        approvedLoans = loansData.filter((loan) => loan.status === "booked")
          .length;
        defaultedLoans = loansData.filter(
          (loan) => loan.status === "defaulted"
        ).length;
      }

      // Recent activity in this branch
      const { data: activityData } = await supabase
        .from("loans")
        .select(
          `
          *,
          customers:customer_id (
            Firstname,
            Surname
          )
        `
        )
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false })
        .limit(5);

      // ✅ Update stats
      setStats([
        {
          title: "Total Loans",
          value: totalLoans?.toLocaleString() || "0",
          icon: <BanknotesIcon className="h-6 w-6" />,
          color: "bg-blue-500",
        },
        {
          title: "Active Customers",
          value: activeCustomers?.toLocaleString() || "0",
          icon: <UsersIcon className="h-6 w-6" />,
          color: "bg-green-500",
        },
        {
          title: "Pending Approvals",
          value: pendingApprovals?.toLocaleString() || "0",
          icon: <ClockIcon className="h-6 w-6" />,
          color: "bg-yellow-500",
        },
        {
          title: "Portfolio Value",
          value: `Ksh ${portfolioValue.toLocaleString()}`,
          icon: <ChartBarIcon className="h-6 w-6" />,
          color: "bg-purple-500",
        },
      ]);

      // ✅ Performance metrics
      const portfolioGrowth =
        totalLoans > 0 ? Math.round((approvedLoans / totalLoans) * 100) : 0;
      const defaultRate =
        totalLoans > 0 ? Math.round((defaultedLoans / totalLoans) * 100) : 0;
      const approvalRate =
        totalLoans > 0 ? Math.round((approvedLoans / totalLoans) * 100) : 0;

      setPerformanceMetrics({ portfolioGrowth, defaultRate, approvalRate });

      // ✅ Format recent activity
      setRecentActivity(
        activityData?.map((item) => ({
          id: item.id,
          type:
            item.status === "approved"
              ? "approval"
              : item.status === "disbursed"
              ? "disbursement"
              : "application",
          message:
            item.status === "approved"
              ? `Loan approved for ${item.customers?.Firstname} ${item.customers?.Surname}`
              : item.status === "disbursed"
              ? `Loan disbursed to ${item.customers?.Firstname} ${item.customers?.Surname}`
              : `Loan application from ${item.customers?.Firstname} ${item.customers?.Surname}`,
          time: new Date(item.created_at).toLocaleDateString(),
          icon:
            item.status === "approved" ? (
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            ) : item.status === "disbursed" ? (
              <ArrowDownCircleIcon className="h-5 w-5 text-purple-600" />
            ) : (
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            ),
          iconBg:
            item.status === "approved"
              ? "bg-green-100"
              : item.status === "disbursed"
              ? "bg-purple-100"
              : "bg-blue-100",
        })) || []
      );
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load branchId first, then fetch dashboard data
  useEffect(() => {
    fetchBranchId();
  }, []);

  useEffect(() => {
    if (branchId) {
      fetchDashboardData(branchId);

      // 🔹 Real-time updates for this branch
      const loansSubscription = supabase
        .channel("loan-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "loans", filter: `branch_id=eq.${branchId}` },
          () => fetchDashboardData(branchId)
        )
        .subscribe();

      const customersSubscription = supabase
        .channel("customer-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "customers", filter: `branch_id=eq.${branchId}` },
          () => fetchDashboardData(branchId)
        )
        .subscribe();

      return () => {
        supabase.removeChannel(loansSubscription);
        supabase.removeChannel(customersSubscription);
      };
    }
  }, [branchId]);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`rounded-full p-3 ${stat.color} text-white mr-4`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Recent Activity
          </h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((activity, index) => (
                <li key={index} className="flex items-center">
                  <div className={`rounded-full p-2 mr-3 ${activity.iconBg}`}>
                    {activity.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
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

        {/* Performance Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Performance Overview
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Portfolio growth
              </p>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${performanceMetrics.portfolioGrowth}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-green-600">
                  +{performanceMetrics.portfolioGrowth}%
                </span>
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
                <span className="text-sm font-medium text-red-600">
                  {performanceMetrics.defaultRate}%
                </span>
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
                <span className="text-sm font-medium text-blue-600">
                  {performanceMetrics.approvalRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboarbm;
