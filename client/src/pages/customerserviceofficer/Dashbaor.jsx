import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const Dashboardcs = () => {
  const [userRegion, setUserRegion] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [branchesMap, setBranchesMap] = useState({});

  const [stats, setStats] = useState([
    {
      title: "Total Loans",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      loading: true,
    },
    {
      title: "Active Customers",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      loading: true,
    },
    {
      title: "Pending Approvals",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      loading: true,
    },
    {
      title: "Portfolio Value",
      value: "Ksh 0",
      change: "+0%",
      trend: "up",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      loading: true,
    },
  ]);

  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    portfolioGrowth: 0,
    defaultRate: 0,
    approvalRate: 0,
  });
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Tab configuration with icons
  const tabs = [
    {
      id: "overview",
      name: "Overview",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: "branches",
      name: "Branches",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      id: "customers",
      name: "Customers",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      id: "loans",
      name: "Loans",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  // Fetch current user's region and branch from profiles table
  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user from auth:", userError);
        throw userError;
      }

      if (user) {
        // Query profiles table to get region_id and branch_id
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("region_id, branch_id")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          throw error;
        }

        setUserRegion(profileData?.region_id);
        setUserBranch(profileData?.branch_id);
        return {
          regionId: profileData?.region_id,
          branchId: profileData?.branch_id,
        };
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
    return null;
  };

  // Fetch dashboard data filtered by region
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const profile = await fetchUserProfile();

      if (!profile || !profile.regionId) {
        console.error("No region found for user in profiles table");
        setLoading(false);
        return;
      }

      const { regionId, branchId } = profile;
      console.log("Fetching data for region:", regionId, "branch:", branchId);
      // Fetch region name
      const { data: regionData, error: regionError } = await supabase
        .from("regions")
        .select("name")
        .eq("id", regionId)
        .single();

      if (regionError) {
        console.error("Error fetching region name:", regionError);
      } else {
        setUserRegion(regionData?.name || "Unknown");
      }
      console.log("region name", regionData.name);

      // Fetch branches in the region
      const { data: branchesData, error: branchesError } = await supabase
        .from("branches")
        .select("id, name")
        .eq("region_id", regionId);

      if (branchesError) {
        console.error("Error fetching branches:", branchesError);
      } else if (branchesData) {
        // Convert array into { branchId: branchName } map
        const branchLookup = branchesData.reduce((acc, branch) => {
          acc[branch.id] = branch.name;
          return acc;
        }, {});
        setBranchesMap(branchLookup);
      }

      // Fetch customers in the region - using region_id from profiles
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .eq("region_id", regionId);

      if (customersError) console.error("Customers error:", customersError);

      // Fetch loans in the region - using region_id from profiles
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*")
        .eq("region_id", regionId);

      if (loansError) console.error("Loans error:", loansError);

      // Fetch total loans count for the region
      const { count: totalLoans, error: totalLoansError } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .eq("region_id", regionId);

      if (totalLoansError) console.error("Total loans error:", totalLoansError);

      // Fetch active customers count for the region
      const { count: activeCustomers, error: activeCustomersError } =
        await supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("region_id", regionId);

      if (activeCustomersError)
        console.error("Active customers error:", activeCustomersError);

      // Fetch pending approvals for the region
      const { count: pendingApprovals, error: approvalsError } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("region_id", regionId)
        .eq("status", "rm_review");

      if (approvalsError)
        console.error("Pending approvals error:", approvalsError);

      // Calculate portfolio value for the region
      let portfolioValue = 0;
      let approvedLoans = 0;
      let defaultedLoans = 0;

      if (loansData) {
        portfolioValue = loansData.reduce(
          (sum, loan) => sum + (loan.scored_amount || 0),
          0
        );
        approvedLoans = loansData.filter(
          (loan) => loan.status === "booked"
        ).length;
        defaultedLoans = loansData.filter(
          (loan) => loan.status === "defaulted"
        ).length;
      }

      // Fetch recent activity from loans table with customer info for the region
      const { data: activityData, error: activityError } = await supabase
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
        .eq("region_id", regionId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (activityError) console.error("Activity error:", activityError);

      // Set detailed data
      setBranches(branchesData || []);
      setCustomers(customersData || []);
      setLoans(loansData || []);

      // Update stats with enhanced UI properties
      setStats([
        {
          title: "Total Loans",
          value: totalLoans?.toLocaleString() || "0",
          change: "+12%",
          trend: "up",
          icon: stats[0].icon,
          color: "from-blue-500 to-blue-600",
          bgColor: "bg-blue-50",
          textColor: "text-blue-600",
          loading: false,
        },
        {
          title: "Active Customers",
          value: activeCustomers?.toLocaleString() || "0",
          change: "+8%",
          trend: "up",
          icon: stats[1].icon,
          color: "from-emerald-500 to-emerald-600",
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-600",
          loading: false,
        },
        {
          title: "Pending Approvals",
          value: pendingApprovals?.toLocaleString() || "0",
          change: "-5%",
          trend: "down",
          icon: stats[2].icon,
          color: "from-amber-500 to-amber-600",
          bgColor: "bg-amber-50",
          textColor: "text-amber-600",
          loading: false,
        },
        {
          title: "Portfolio Value",
          value: `Ksh ${portfolioValue.toLocaleString()}`,
          change: "+15%",
          trend: "up",
          icon: stats[3].icon,
          color: "from-purple-500 to-purple-600",
          bgColor: "bg-purple-50",
          textColor: "text-purple-600",
          loading: false,
        },
      ]);

      // Calculate performance metrics
      const portfolioGrowth =
        totalLoans > 0 ? Math.round((approvedLoans / totalLoans) * 100) : 0;
      const defaultRate =
        totalLoans > 0 ? Math.round((defaultedLoans / totalLoans) * 100) : 0;
      const approvalRate =
        totalLoans > 0 ? Math.round((approvedLoans / totalLoans) * 100) : 0;

      setPerformanceMetrics({
        portfolioGrowth,
        defaultRate,
        approvalRate,
      });

      // Format recent activity with enhanced UI properties
      if (activityData) {
        const formattedActivity = activityData.map((item) => ({
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
          time: new Date(item.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          amount: `Ksh ${item.scored_amount?.toLocaleString() || "0"}`,
          icon:
            item.status === "approved" ? (
              <svg
                className="h-5 w-5 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : item.status === "disbursed" ? (
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            ),
          iconBg:
            item.status === "approved"
              ? "bg-emerald-100"
              : item.status === "disbursed"
              ? "bg-blue-100"
              : "bg-amber-100",
        }));
        setRecentActivity(formattedActivity);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    console.log("Updated region:", userRegion);
  }, [userRegion]);

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const loansSubscription = supabase
      .channel("loan-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loans" },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const customersSubscription = supabase
      .channel("customer-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const branchesSubscription = supabase
      .channel("branch-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "branches" },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    // Also subscribe to profiles table in case region_id changes
    const profilesSubscription = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        async (payload) => {
          // Only refetch if it's the current user's profile
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user && payload.new.id === user.id) {
            fetchDashboardData();
          }
        }
      )
      .subscribe();

    return () => {
      loansSubscription.unsubscribe();
      customersSubscription.unsubscribe();
      branchesSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
    };
  }, []);

  // Helper function to get branch name from branch_id
  const getBranchName = (branchId) => {
    return branchesMap[branchId] || branchId || "N/A";
  };

  // Render data tables with enhanced UI
  const renderBranchesTable = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Regional Branches
            </h3>
            <p className="text-sm text-gray-600">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {branches.length} Active Branches
              </span>
              <span className="ml-2 text-gray-500">Region: {userRegion}</span>
            </p>
          </div>
          <div className="text-3xl text-blue-600">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Branch Details
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {branches.map((branch) => (
              <tr
                key={branch.id}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {branch.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <svg
                        className="h-4 w-4 text-gray-400 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {branch.location}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {branch.contact_email || branch.contact_phone || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      branch.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        branch.status === "active"
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    {branch.status || "unknown"}
                  </span>
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                  <div className="text-blue-600 mb-4 mx-auto w-16 h-16">
                    <svg
                      className="w-full h-full"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <p>No branches found in your region</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCustomersTable = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Regional Customers
            </h3>
            <p className="text-sm text-gray-600">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                {customers.length} Total Customers
              </span>
              <span className="ml-2 text-gray-500">Region: {userRegion}</span>
            </p>
          </div>
          <div className="text-3xl text-emerald-600">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Contact Info
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {customer.Firstname?.[0]}
                      {customer.Surname?.[0]}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {customer.Firstname} {customer.Surname}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{customer.email}</div>
                  <div className="text-sm text-gray-500">{customer.mobile}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {getBranchName(customer.branch_id)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.verification_status === "verified"
                        ? "bg-emerald-100 text-emerald-800"
                        : customer.verification_status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full mr-2 ${
                        customer.status === "approved"
                          ? "bg-emerald-500"
                          : customer.status === "bm_review"
                          ? "bg-yellow-400"
                          : customer.status === "rm_review"
                          ? "bg-orange-400"
                          : customer.status === "cs_review"
                          ? "bg-blue-400"
                          : customer.status === "rejected"
                          ? "bg-red-500"
                          : "bg-gray-300" // fallback
                      }`}
                    ></div>

                    {customer.status || "unknown"}
                  </span>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  <div className="text-emerald-600 mb-4 mx-auto w-16 h-16">
                    <svg
                      className="w-full h-full"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <p>No customers found in your region</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLoansTable = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Regional Loans
            </h3>
            <p className="text-sm text-gray-600">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {loans.length} Total Loans
              </span>
              <span className="ml-2 text-gray-500">Region: {userRegion}</span>
            </p>
          </div>
          <div className="text-3xl text-purple-600">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Loan ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loans.map((loan) => (
              <tr
                key={loan.id}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="px-6 py-4">
                  <div className="text-sm font-mono font-semibold text-gray-900">
                    #{loan.id ? String(loan.id).slice(-8) : "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">
                    Ksh {loan.scored_amount?.toLocaleString() || "0"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      loan.status === "booked"
                        ? "bg-emerald-100 text-emerald-800"
                        : loan.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : loan.status === "defaulted"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        loan.status === "booked"
                          ? "bg-emerald-500"
                          : loan.status === "pending"
                          ? "bg-amber-500"
                          : loan.status === "defaulted"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    {loan.status || "unknown"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {getBranchName(loan.branch_id)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {loan.created_at
                    ? new Date(loan.created_at).toLocaleDateString()
                    : "N/A"}
                </td>
              </tr>
            ))}
            {loans.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="text-purple-600 mb-4 mx-auto w-16 h-16">
                    <svg
                      className="w-full h-full"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p>No loans found in your region</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading && !userRegion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div
              className="animate-pulse absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-400 mx-auto"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>
          <p className="mt-6 text-lg text-gray-600 font-medium">
            Loading regional dashboard...
          </p>
          <p className="text-sm text-gray-500">Fetching your regional data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {/* Header content remains the same */}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
            <nav className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="group">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white shadow-lg`}
                      >
                        {stat.icon}
                      </div>
                      <div
                        className={`flex items-center text-sm font-semibold ${
                          stat.trend === "up"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        <svg
                          className={`h-4 w-4 mr-1 ${
                            stat.trend === "up" ? "rotate-0" : "rotate-180"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 17l9.2-9.2M17 17V7H7"
                          />
                        </svg>
                        {stat.change}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      {stat.loading ? (
                        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
                      ) : (
                        <p className="text-3xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity and Performance */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Recent Activity
                    </h2>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View All
                    </button>
                  </div>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center p-4 bg-gray-50 rounded-xl animate-pulse"
                        >
                          <div className="bg-gray-200 rounded-xl p-3 mr-4 h-12 w-12"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={activity.id}
                          className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-all duration-200"
                        >
                          <div
                            className={`rounded-xl p-3 mr-4 ${activity.iconBg} shadow-sm`}
                          >
                            {activity.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 mb-1">
                              {activity.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500">
                                {activity.time}
                              </p>
                              <p className="text-sm font-bold text-gray-700">
                                {activity.amount}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {recentActivity.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-blue-600 mb-4 mx-auto w-16 h-16">
                            <svg
                              className="w-full h-full"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-medium">
                            No recent activity in your region
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Overview */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Performance Metrics
                </h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-600">
                        Portfolio Growth
                      </p>
                      <span className="text-sm font-bold text-emerald-600">
                        +{performanceMetrics.portfolioGrowth}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{
                          width: `${performanceMetrics.portfolioGrowth}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-600">
                        Approval Rate
                      </p>
                      <span className="text-sm font-bold text-blue-600">
                        {performanceMetrics.approvalRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${performanceMetrics.approvalRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-600">
                        Default Rate
                      </p>
                      <span className="text-sm font-bold text-red-600">
                        {performanceMetrics.defaultRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${performanceMetrics.defaultRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "branches" && (
          <div className="space-y-6">
            {renderBranchesTable()}

            {/* Branch Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Branches</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {branches.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "customers" && renderCustomersTable()}
        {activeTab === "loans" && renderLoansTable()}
      </div>
    </div>
  );
};

export default Dashboardcs;
