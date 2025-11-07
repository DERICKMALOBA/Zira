import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [userRegion, setUserRegion] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userBranchId, setUserBranchId] = useState(null);
  const [userRegionId, setUserRegionId] = useState(null);
  const navigate = useNavigate();

  // Dashboard metrics state
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalLoanAmount: 0,
    totalLoanCount: 0,
    outstandingBalance: 0,
    outstandingLoansCount: 0,
    performingLoanAmount: 0,
    performingLoansCount: 0,
    totalCustomers: 0,
    customerOverview: {
      activeCustomers: 0,
      inactiveCustomers: 0,
      newCustomersToday: 0,
      leadConversionRateMonth: 0,
      leadConversionRateYear: 0
    },
    loanOverview: {
      disbursedLoansAmount: 0,
      disbursedLoansCount: 0,
      loansDueToday: 0,
      outstandingArrears: 0
    },
    collectionOverview: {
      todayCollectionAmount: 0,
      todayCollectionRate: 0,
      tomorrowCollection: 0,
      par: 0
    },
    pendingActions: {
      pendingCustomerApprovals: 0,
      pendingAmends: 0,
      pendingLimitApprovals: 0,
      pendingBMLoanApprovals: 0,
      pendingRMLoanApprovals: 0,
      pendingDisbursement: 0
    }
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedRO, setSelectedRO] = useState("all");
  const [availableRegions, setAvailableRegions] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableROs, setAvailableROs] = useState([]);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (user) {
        const { data: userData, error: userDataError } = await supabase
          .from("users")
          .select("role, full_name")
          .eq("id", user.id)
          .single();

        if (userDataError) throw userDataError;

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select(`
            region_id,
            branch_id,
            branches!inner(name),
            regions!inner(name)
          `)
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setUserRole(userData?.role);
        setUserRegion(profileData?.regions?.name || profileData?.region_id);
        setUserBranch(profileData?.branches?.name || profileData?.branch_id);
        setUserBranchId(profileData?.branch_id);
        setUserRegionId(profileData?.region_id);

        return {
          role: userData?.role,
          regionId: profileData?.region_id,
          branchId: profileData?.branch_id,
          regionName: profileData?.regions?.name,
          branchName: profileData?.branches?.name,
        };
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
    return null;
  };

  // Fetch regions (for CA and CSO officers)
  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from("regions")
        .select("id, name, code")
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching regions:", error);
      return [];
    }
  };

  // Fetch branches with region filtering
  const fetchBranches = async (regionFilter = "all") => {
    try {
      let query = supabase
        .from("branches")
        .select("id, name, code, address, region_id")
        .order("name");

      // Filter by selected region if not "all"
      if (regionFilter !== "all") {
        query = query.eq("region_id", regionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching branches:", error);
      return [];
    }
  };

  // Fetch relationship officers with proper role-based filtering
  const fetchRelationshipOfficers = async (
    branchFilter = "all",
    userRole = null,
    userBranchId = null,
    userRegionId = null
  ) => {
    try {
      let query = supabase
        .from("profiles")
        .select(`
          id,
          region_id,
          branch_id,
          users!inner(
            id,
            full_name,
            role
          )
        `)
        .eq("users.role", "relationship_officer")
        .order("users(full_name)");

      // Branch Manager → ROs in their own branch only
      if (userRole === "branch_manager" && userBranchId) {
        query = query.eq("branch_id", userBranchId);
      }
      // Regional Manager → show ROs in selected branch or all ROs in region
      else if (userRole === "regional_manager") {
        if (branchFilter !== "all") {
          // Show ROs from selected branch
          query = query.eq("branch_id", branchFilter);
        } else {
          // Show all ROs in the region
          query = query.eq("region_id", userRegionId);
        }
      }
      // Credit Analyst / Customer Service → branch filter as usual
      else if (branchFilter !== "all") {
        query = query.eq("branch_id", branchFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (
        data?.map((item) => ({
          id: item.users.id,
          full_name: item.users.full_name,
          branch_id: item.branch_id,
          region_id: item.region_id,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching relationship officers:", error);
      return [];
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async (profile) => {
    try {
      const { role, regionId, branchId } = profile;
      
      let loansQuery = supabase
        .from("loans")
        .select(`
          id,
          scored_amount,
          status,
          created_at,
          disbursed_date,
          customers!inner(
            Firstname,
            Surname
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      // Apply role-based filters
      if (role === "branch_manager") {
        loansQuery = loansQuery.eq("branch_id", branchId);
      } else if (role === "regional_manager") {
        loansQuery = loansQuery.eq("region_id", regionId);
      }

      const { data: recentLoans, error: loansError } = await loansQuery;
      if (loansError) throw loansError;

      // Format activities
      const activities = recentLoans?.map(loan => {
        const customerName = `${loan.customers.Firstname} ${loan.customers.Surname}`;
        const timeAgo = getTimeAgo(new Date(loan.created_at));
        
        let message = "";
        let iconBg = "";
        let icon = null;

        if (loan.status === "disbursed") {
          message = `Loan disbursed to ${customerName}`;
          iconBg = "bg-green-100";
          icon = (
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        } else if (loan.status === "approved") {
          message = `Loan approved for ${customerName}`;
          iconBg = "bg-blue-100";
          icon = (
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          );
        } else {
          message = `New loan application from ${customerName}`;
          iconBg = "bg-amber-100";
          icon = (
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        }

        return {
          id: loan.id,
          message,
          time: timeAgo,
          amount: `Ksh ${loan.scored_amount?.toLocaleString() || 0}`,
          icon,
          iconBg
        };
      }) || [];

      return activities;
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }
  };

  // Helper function to get time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  // Fetch total paid amount
  const fetchTotalPaidAmount = async (loanIds) => {
    if (!loanIds || loanIds.length === 0) return 0;
    
    try {
      const { data, error } = await supabase
        .from("mpesa_c2b_transactions")
        .select("amount, loan_id")
        .in("loan_id", loanIds)
        .eq("status", "applied")
        .eq("payment_type", "repayment");

      if (error) throw error;
      
      return data?.reduce((sum, transaction) => sum + (parseFloat(transaction.amount) || 0), 0) || 0;
    } catch (error) {
      console.error("Error fetching paid amounts:", error);
      return 0;
    }
  };
  const fetchLeadsConversionRate = async (
  regionId,
  branchId,
  role,
  userId,
  selectedRegion = "all",
  selectedBranch = "all",
  selectedRO = "all"
) => {
  try {
    // === Helper: Apply correct filters ===
   const applyFilters = (query, table = "customers") => {
  if (role === "branch_manager") {
    query = query.eq("branch_id", branchId);
  } 
  else if (role === "regional_manager") {
    if (selectedRegion !== "all") {
      query = query.eq("region_id", selectedRegion);
    } else {
      //  All regions = no filter at all
    }

    if (selectedBranch !== "all") {
      query = query.eq("branch_id", selectedBranch);
    }
  } 
  else if (role === "relationship_officer") {
    query = query.eq("created_by", userId);
  } 
  else if (role === "credit_analyst_officer" || role === "customer_service_officer") {
    //  Allow all filter combinations properly
    if (selectedRegion !== "all") query = query.eq("region_id", selectedRegion);
    if (selectedBranch !== "all") query = query.eq("branch_id", selectedBranch);
    if (selectedRO !== "all") query = query.eq("created_by", selectedRO);
  }

  return query;
};


    // === Fetch all leads ===
    let leadsQuery = applyFilters(supabase.from("leads").select("id, created_at"));
    const { data: leads, error: leadsError } = await leadsQuery;
    if (leadsError) throw leadsError;

    // === Fetch converted leads (customers) ===
    let customersQuery = applyFilters(
      supabase.from("customers").select("id, created_at, form_status")
    );
    customersQuery = customersQuery.neq("form_status", "draft");

    const { data: customers, error: customersError } = await customersQuery;
    if (customersError) throw customersError;

    // === Totals ===
    const totalLeads = (leads?.length || 0) + (customers?.length || 0);
    const convertedLeads = customers?.length || 0;
    const conversionRate =
      totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // === Monthly ===
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const leadsThisMonth = leads.filter(
      (l) =>
        new Date(l.created_at).getMonth() === currentMonth &&
        new Date(l.created_at).getFullYear() === currentYear
    ).length;

    const customersThisMonth = customers.filter(
      (c) =>
        new Date(c.created_at).getMonth() === currentMonth &&
        new Date(c.created_at).getFullYear() === currentYear
    ).length;

    const totalThisMonth = leadsThisMonth + customersThisMonth;
    const conversionRateMonth =
      totalThisMonth > 0 ? Math.round((customersThisMonth / totalThisMonth) * 100) : 0;

    // === Yearly ===
    const leadsThisYear = leads.filter(
      (l) => new Date(l.created_at).getFullYear() === currentYear
    ).length;

    const customersThisYear = customers.filter(
      (c) => new Date(c.created_at).getFullYear() === currentYear
    ).length;

    const totalThisYear = leadsThisYear + customersThisYear;
    const conversionRateYear =
      totalThisYear > 0 ? Math.round((customersThisYear / totalThisYear) * 100) : 0;

    // Safe numeric return
    const safe = (val) => (isNaN(val) || val === null ? 0 : Number(val));

    return {
      totalLeads: safe(totalLeads),
      convertedLeads: safe(convertedLeads),
      conversionRate: safe(conversionRate),
      conversionRateMonth: safe(conversionRateMonth),
      conversionRateYear: safe(conversionRateYear),
    };
  } catch (error) {
    console.error("Error fetching leads conversion rate:", error);
    return {
      totalLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      conversionRateMonth: 0,
      conversionRateYear: 0,
    };
  }
};






  // Fetch performing loans
  const fetchPerformingLoans = async (loansData) => {
    if (!loansData || loansData.length === 0) return [];

    try {
      const loanIds = loansData.map((l) => l.id);

      const { data: installments, error } = await supabase
        .from("loan_installments")
        .select("loan_id, status, days_overdue")
        .in("loan_id", loanIds);

      if (error) throw error;

      const grouped = installments?.reduce((acc, inst) => {
        if (!acc[inst.loan_id]) acc[inst.loan_id] = [];
        acc[inst.loan_id].push(inst);
        return acc;
      }, {}) || {};

      const performingLoanIds = loansData
        .filter((loan) => {
          if (loan.status === "completed" || loan.repayment_state === "completed") {
            return false;
          }

          const loanInstallments = grouped[loan.id] || [];

          if (loanInstallments.length === 0 && loan.status === "disbursed") return true;

          const allOnTime = loanInstallments.every(
            (inst) =>
              ["paid", "pending", "partial"].includes(inst.status) &&
              (!inst.days_overdue || inst.days_overdue <= 0)
          );

          return allOnTime;
        })
        .map((l) => l.id);

      return loansData.filter((l) => performingLoanIds.includes(l.id));
    } catch (error) {
      console.error("Error fetching performing loans:", error);
      return [];
    }
  };

  // Calculate dashboard metrics with proper filtering
  const calculateDashboardMetrics = async (loansData, customersData, profile) => {
    const { role, branchId, regionId } = profile;

    // Apply filters based on role and selections
    let filteredLoans = loansData;
    let filteredCustomers = customersData;

    if (role === "branch_manager") {
      // Branch manager sees only their branch data
      filteredLoans = loansData.filter(loan => loan.branch_id === branchId);
      filteredCustomers = customersData.filter(customer => customer.branch_id === branchId);
      
      // Apply RO filter for branch manager
      if (selectedRO !== "all") {
        filteredCustomers = filteredCustomers.filter(customer => customer.created_by === selectedRO);
        const customerIds = filteredCustomers.map(c => c.id);
        filteredLoans = filteredLoans.filter(loan => 
          loan.booked_by === selectedRO || customerIds.includes(loan.customer_id)
        );
      }
    } else if (role === "regional_manager") {
      // Regional manager sees only their region data
      filteredLoans = loansData.filter(loan => loan.region_id === regionId);
      filteredCustomers = customersData.filter(customer => customer.region_id === regionId);
      
      // Apply branch filter for regional manager
      if (selectedBranch !== "all") {
        filteredLoans = filteredLoans.filter(loan => loan.branch_id === selectedBranch);
        filteredCustomers = filteredCustomers.filter(customer => customer.branch_id === selectedBranch);
      }
      
      // Apply RO filter for regional manager
      if (selectedRO !== "all") {
        filteredCustomers = filteredCustomers.filter(customer => customer.created_by === selectedRO);
        const customerIds = filteredCustomers.map(c => c.id);
        filteredLoans = filteredLoans.filter(loan => 
          loan.booked_by === selectedRO || customerIds.includes(loan.customer_id)
        );
      }
    } else if (role === "credit_analyst_officer" || role === "customer_service_officer") {
      // CA and CSO can filter by region, branch, and RO
      
      // Apply region filter
      if (selectedRegion !== "all") {
        filteredLoans = filteredLoans.filter(loan => loan.region_id === selectedRegion);
        filteredCustomers = filteredCustomers.filter(customer => customer.region_id === selectedRegion);
      }
      
      // Apply branch filter
      if (selectedBranch !== "all") {
        filteredLoans = filteredLoans.filter(loan => loan.branch_id === selectedBranch);
        filteredCustomers = filteredCustomers.filter(customer => customer.branch_id === selectedBranch);
      }
      
      // Apply RO filter
      if (selectedRO !== "all") {
        filteredCustomers = filteredCustomers.filter(customer => customer.created_by === selectedRO);
        const customerIds = filteredCustomers.map(c => c.id);
        filteredLoans = filteredLoans.filter(loan => 
          loan.booked_by === selectedRO || customerIds.includes(loan.customer_id)
        );
      }
    }

    // Fetch performing loans
    const performingLoans = await fetchPerformingLoans(filteredLoans);

    // Calculate total paid amount
    const loanIds = filteredLoans.map(loan => loan.id);
    const totalPaidAmount = await fetchTotalPaidAmount(loanIds);

    // Calculate totals
    const totalLoanAmount = filteredLoans.reduce((sum, loan) =>
      sum + (loan.total_payable || loan.scored_amount || 0), 0
    );

    const outstandingBalance = totalLoanAmount - totalPaidAmount;

    const outstandingLoans = filteredLoans.filter(loan =>
      loan.status === "disbursed" && loan.repayment_state !== "completed"
    );

    const performingLoanAmount = performingLoans.reduce((sum, loan) =>
      sum + (loan.total_payable || loan.scored_amount || 0), 0
    );

    // Customer stats
    const activeCustomerIds = new Set();

    filteredLoans.forEach(loan => {
      if (
        loan.status !== "completed" &&
        loan.repayment_state !== "completed" &&
        (loan.outstanding_balance > 0 || loan.arrears_amount > 0 || loan.status === "disbursed")
      ) {
        activeCustomerIds.add(loan.customer_id);
      }
    });

    const activeCustomers = filteredCustomers.filter(c => activeCustomerIds.has(c.id)).length;
    const inactiveCustomers = filteredCustomers.filter(c => !activeCustomerIds.has(c.id)).length;

    const today = new Date().toISOString().split("T")[0];
    const newCustomersToday = filteredCustomers.filter(c =>
      c.created_at && c.created_at.split("T")[0] === today
    ).length;

    // Lead conversion
   const leadConversionRate = await fetchLeadsConversionRate(
  regionId,
  branchId,
  role,
  profile?.id ,
  selectedRegion,
  selectedBranch,
  selectedRO
);


    // Loan overview
    const disbursedLoans = filteredLoans.filter(loan => loan.status === "disbursed");
    const disbursedLoansAmount = disbursedLoans.reduce((sum, loan) =>
      sum + (loan.scored_amount || 0), 0
    );

    const todayCollectionAmount = filteredLoans.reduce((sum, loan) =>
      sum + (loan.today_collection || 0), 0
    );

    // Pending actions
    const pendingCustomerApprovals = filteredCustomers.filter(c =>
      ["pending", "bm_review", "ca_review", "cso_review"].includes(c.status)
    ).length;

    const pendingBMLoanApprovals = filteredLoans.filter(l => l.status === "bm_review").length;
    const pendingRMLoanApprovals = filteredLoans.filter(l => l.status === "rm_review").length;
    const pendingDisbursement = filteredLoans.filter(l =>
      l.status === "approved" && !l.disbursed_date
    ).length;

    return {
      totalLoanAmount,
      totalLoanCount: filteredLoans.length,
      outstandingBalance,
      outstandingLoansCount: outstandingLoans.length,
      performingLoanAmount,
      performingLoansCount: performingLoans.length,
      totalCustomers: filteredCustomers.length,
      customerOverview: {
        activeCustomers,
        inactiveCustomers,
        newCustomersToday,
        leadConversionRateMonth: leadConversionRate,
        leadConversionRateYear: 0
      },
      loanOverview: {
        disbursedLoansAmount,
        disbursedLoansCount: disbursedLoans.length,
        loansDueToday: filteredLoans.filter(l => l.due_date === today).length,
        outstandingArrears: outstandingLoans.reduce((sum, l) => sum + (l.arrears_amount || 0), 0)
      },
      collectionOverview: {
        todayCollectionAmount,
        todayCollectionRate:
          outstandingBalance > 0 ? Math.round((todayCollectionAmount / outstandingBalance) * 100) : 0,
        tomorrowCollection: 0,
        par:
          outstandingLoans.length > 0
            ? Math.round(
                (outstandingLoans.filter(l => l.is_delinquent).length / outstandingLoans.length) * 100
              )
            : 0
      },
      pendingActions: {
        pendingCustomerApprovals,
        pendingAmends: filteredCustomers.filter(c => c.status.includes("amend")).length,
        pendingLimitApprovals: 0,
        pendingBMLoanApprovals,
        pendingRMLoanApprovals,
        pendingDisbursement
      }
    };
  };
// Fetch dashboard data
const fetchDashboardData = async () => {
  try {
    setLoading(true);

    const profile = await fetchUserProfile();
    if (!profile) return setLoading(false);

    const { role, regionId, branchId, id: userId } = profile; // include userId

    // Fetch regions (for CA and CSO)
    if (role === "credit_analyst_officer" || role === "customer_service_officer") {
      const regionsData = await fetchRegions();
      setAvailableRegions(regionsData);
    }

    // Fetch branches based on role
    let branchesData = [];
    if (role === "regional_manager") {
      branchesData = await fetchBranches(regionId);
    } else {
      branchesData = await fetchBranches("all");
    }
    setAvailableBranches(branchesData);

    // Fetch relationship officers
    const relationshipOfficers = await fetchRelationshipOfficers(
      "all",
      role,
      branchId,
      regionId
    );
    setAvailableROs([{ id: "all", full_name: "All ROs" }, ...relationshipOfficers]);

    // Fetch customers and loans based on role
 let customersQuery = supabase
  .from("customers")
   .select("*, form_status")
  .neq("form_status", "draft"); 

let loansQuery = supabase
  .from("loans")
  .select("*");

    if (role === "branch_manager") {
      customersQuery = customersQuery.eq("branch_id", branchId);
      loansQuery = loansQuery.eq("branch_id", branchId);
    } else if (role === "regional_manager") {
      customersQuery = customersQuery.eq("region_id", regionId);
      loansQuery = loansQuery.eq("region_id", regionId);
    }

    const [
      { data: customersData },
      { data: loansData }
    ] = await Promise.all([
      customersQuery,
      loansQuery
    ]);

    setCustomers(customersData || []);
    setLoans(loansData || []);
    setBranches(branchesData || []);

    //  Fetch lead conversion metrics (monthly + yearly)
const { 
  totalLeads, 
  convertedLeads, 
  conversionRate, 
  conversionRateMonth, 
  conversionRateYear 
} = await fetchLeadsConversionRate(
  regionId,
  branchId,
  role,
  userId,
  selectedRegion,
  selectedBranch,
  selectedRO
);


    // Calculate other dashboard metrics (your existing function)
    const metrics = await calculateDashboardMetrics(loansData || [], customersData || [], profile);

    // Merge conversion metrics into dashboard state
setDashboardMetrics({
  ...metrics,
  customerOverview: {
    ...metrics.customerOverview,
    totalLeads,
    convertedLeads,
    leadConversionRate: conversionRate,
    leadConversionRateMonth: conversionRateMonth, 
    leadConversionRateYear: conversionRateYear,   
  },
});



    // Fetch recent activities
    const activities = await fetchRecentActivities(profile);
    setRecentActivity(activities);

  } catch (err) {
    console.error("Error fetching dashboard data:", err);
  } finally {
    setLoading(false);
  }
};


  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (userRole && loans.length > 0 && customers.length > 0) {
      const profile = {
        role: userRole,
        regionId: userRegionId,
        branchId: userBranchId
      };
      calculateDashboardMetrics(loans, customers, profile).then(setDashboardMetrics);
    }
  }, [selectedRegion, selectedBranch, selectedRO, userRole, loans, customers, userRegionId, userBranchId]);

  // Update branches when region changes (for CA and CSO)
  useEffect(() => {
    if (selectedRegion !== "all" && (userRole === "credit_analyst_officer" || userRole === "customer_service_officer")) {
      fetchBranches(selectedRegion).then(branches => {
        setAvailableBranches(branches);
        setSelectedBranch("all");
        setSelectedRO("all");
      });
    }
  }, [selectedRegion, userRole]);

  // Update ROs when branch changes
  useEffect(() => {
    if (selectedBranch && (userRole === "credit_analyst_officer" || userRole === "customer_service_officer" || userRole === "regional_manager")) {
      fetchRelationshipOfficers(selectedBranch, userRole, userBranchId, userRegionId).then((ros) => {
        setAvailableROs([{ id: "all", full_name: "All ROs" }, ...ros]);
      });
      setSelectedRO("all");
    }
  }, [selectedBranch, userRole, userBranchId, userRegionId]);

  // Navigation handlers
  const handleViewCustomers = () => navigate("/registry/customers");
  const handleViewLoans = () => navigate("/loaning/all");
  const handlePendingBMLoans = () => navigate("/loaning/pending-branch-manager");
  const handlePendingRMLoans = () => navigate("/loaning/pending-regional-manager");
  const handlePendingDisbursement = () => navigate("/loaning/pending-disbursement");
  const handleCustomerApprovals = () => navigate("/registry/approvals-pending");
  const handlePendingAmendments = () => navigate("/registry/pending-amendments");

  // Main Stats Card Component
  const MainStatCard = ({ title, amount, count, icon, color, loading }) => (
    <div className="group relative transition-transform hover:-translate-y-1.5 duration-500">
      <div
        className={`absolute inset-0 bg-gradient-to-r ${color} rounded-2xl opacity-25 blur-lg group-hover:opacity-40 transition-all duration-700`}
      ></div>
      <div className="relative bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-md hover:shadow-2xl p-6 transition-all duration-500">
        <div className="flex items-center justify-between mb-5">
          <div
            className={`p-3.5 rounded-xl bg-gradient-to-r ${color} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-500`}
          >
            {icon}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <svg
              className="w-5 h-5 text-yellow-400 animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2l2 5h5l-4 3 1 5-4-3-4 3 1-5-4-3h5l2-5z" />
            </svg>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-600 tracking-wide uppercase mb-2">
            {title}
          </p>
          {loading ? (
            <>
              <div className="h-7 w-36 bg-gray-200 animate-pulse rounded-lg mb-2"></div>
              <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
            </>
          ) : (
            <>
              <p className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
                {amount}
              </p>
              <p className="text-sm font-medium text-gray-500">{count}</p>
            </>
          )}
        </div>
        <div
          className={`mt-5 h-1 w-full rounded-full bg-gradient-to-r ${color} opacity-60 group-hover:opacity-90 transition-opacity duration-500`}
        ></div>
      </div>
    </div>
  );

  // Filter Components with proper conditional rendering
  const FilterSection = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-green-600">Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">
            {userRole === "branch_manager" 
              ? `Branch: ${userBranch}` 
              : userRole === "regional_manager"
              ? `Region: ${userRegion}`
              : "Multi-Region View"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Region Filter (for CA and CSO only) */}
          {(userRole === "credit_analyst_officer" || userRole === "customer_service_officer") && (
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Region:</label>
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-white border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-200 cursor-pointer hover:border-gray-400"
              >
                <option value="all">All Regions</option>
                {availableRegions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Branch Filter (for Regional Manager, CA and CSO) */}
          {(userRole === "regional_manager" || userRole === "credit_analyst_officer" || userRole === "customer_service_officer") && (
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Branch:</label>
              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-white border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-200 cursor-pointer hover:border-gray-400"
              >
                <option value="all">
                  {userRole === "regional_manager" ? "All Branches in Region" : "All Branches"}
                </option>
                {availableBranches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Relationship Officer Filter (for all roles except when branch is not selected for regional manager) */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">RO:</label>
            <select 
              value={selectedRO}
              onChange={(e) => setSelectedRO(e.target.value)}
              className="bg-white border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-200 cursor-pointer hover:border-gray-400"
              disabled={
                (userRole === "regional_manager" && selectedBranch === "all") ||
                (userRole === "credit_analyst_officer" && selectedBranch === "all") ||
                (userRole === "customer_service_officer" && selectedBranch === "all")
              }
            >
              {availableROs.map(ro => (
                <option key={ro.id} value={ro.id}>
                  {ro.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Section Components
  const OverviewSection = ({ title, children, bgColor = "bg-white", onViewAll }) => (
    <div className={`${bgColor} rounded-2xl shadow-lg border border-gray-100 p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-600">{title}</h3>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition duration-200"
          >
            View All
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      {children}
    </div>
  );

  if (loading && !userRegion && !userBranch && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          </div>
          <p className="mt-6 text-lg text-gray-600 font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Main stats configuration
  const mainStats = [
    {
      title: "Total Loan Amount",
      amount: `Ksh ${dashboardMetrics.totalLoanAmount.toLocaleString()}`,
      count: `${dashboardMetrics.totalLoanCount} Loans`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Outstanding Balance",
      amount: `Ksh ${dashboardMetrics.outstandingBalance.toLocaleString()}`,
      count: `${dashboardMetrics.outstandingLoansCount} Loans`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Performing Loans",
      amount: `Ksh ${dashboardMetrics.performingLoanAmount.toLocaleString()}`,
      count: `${dashboardMetrics.performingLoansCount} Loans`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Total Customers",
      amount: dashboardMetrics.totalCustomers.toLocaleString(),
      count: "All Time",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "from-indigo-500 to-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      {/* Filter Section */}
      <FilterSection />

      {/* Main Content */}
      <div className="space-y-6">
        {/* Four Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {mainStats.map((stat, index) => (
            <MainStatCard
              key={index}
              title={stat.title}
              amount={stat.amount}
              count={stat.count}
              icon={stat.icon}
              color={stat.color}
              loading={loading}
            />
          ))}
        </div>

       
       {/* Customer Overview and Loan Overview Side by Side */}
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
  {/* Customer Overview */}
  <OverviewSection 
    title="Customer Overview" 
    bgColor="bg-white"
    onViewAll={handleViewCustomers}
  >
    {/* Top Stats (3 small cards) */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <p className="text-2xl font-bold text-blue-600">{dashboardMetrics.customerOverview.activeCustomers}</p>
        <p className="text-sm text-gray-600">Active</p>
      </div>
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-2xl font-bold text-gray-600">{dashboardMetrics.customerOverview.inactiveCustomers}</p>
        <p className="text-sm text-gray-600">Inactive</p>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <p className="text-2xl font-bold text-green-600">{dashboardMetrics.customerOverview.newCustomersToday}</p>
        <p className="text-sm text-gray-600">New Today</p>
      </div>
    </div>

    {/* Conversion Rates (2 equal wide cards) */}

<div className="grid grid-cols-2 gap-4 mt-4">
  <div className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg h-full">
  <p className="text-2xl font-bold text-purple-600">
  {isNaN(Number(dashboardMetrics.customerOverview.leadConversionRateMonth))
    ? 0
    : Number(dashboardMetrics.customerOverview.leadConversionRateMonth)}%
</p>


    <p className="text-sm text-gray-600 whitespace-nowrap">
      Conversion Rate (This Month)
    </p>
  </div>

  <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg h-full">
   <p className="text-2xl font-bold text-indigo-600">
  {isNaN(Number(dashboardMetrics.customerOverview.leadConversionRateYear))
    ? 0
    : Number(dashboardMetrics.customerOverview.leadConversionRateYear)}%
</p>

    <p className="text-sm text-gray-600 whitespace-nowrap">
      Conversion Rate (This Year)
    </p>
  </div>
</div>

  </OverviewSection>

  {/* Loan Overview */}
  <OverviewSection 
    title="Loan Overview" 
    bgColor="bg-white"
    onViewAll={handleViewLoans}
  >
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <p className="text-2xl font-bold text-green-600">Ksh {dashboardMetrics.loanOverview.disbursedLoansAmount.toLocaleString()}</p>
        <p className="text-sm text-gray-600">Disbursed Amount</p>
      </div>
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <p className="text-2xl font-bold text-blue-600">{dashboardMetrics.loanOverview.disbursedLoansCount}</p>
        <p className="text-sm text-gray-600">Disbursed Loans</p>
      </div>
      <div className="text-center p-4 bg-amber-50 rounded-lg">
        <p className="text-2xl font-bold text-amber-600">{dashboardMetrics.loanOverview.loansDueToday}</p>
        <p className="text-sm text-gray-600">Due Today</p>
      </div>
      <div className="text-center p-4 bg-red-50 rounded-lg">
        <p className="text-2xl font-bold text-red-600">Ksh {dashboardMetrics.loanOverview.outstandingArrears.toLocaleString()}</p>
        <p className="text-sm text-gray-600">Outstanding Arrears</p>
      </div>
    </div>
  </OverviewSection>
</div>


        {/* Collection Overview and Pending Actions Side by Side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Collection Overview */}
          <OverviewSection title="Collection Overview" bgColor="bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">Ksh {(dashboardMetrics?.collectionOverview?.todayCollectionAmount || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-600">Today's Collection</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{dashboardMetrics?.collectionOverview?.todayCollectionRate || 0}%</p>
                <p className="text-sm text-gray-600">Collection Rate</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">Ksh {(dashboardMetrics?.collectionOverview?.tomorrowCollection || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-600">Tomorrow's Due</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{dashboardMetrics?.collectionOverview?.par || 0}%</p>
                <p className="text-sm text-gray-600">PAR</p>
              </div>
            </div>
          </OverviewSection>

          {/* Pending Actions */}
          <OverviewSection title="Pending Actions" bgColor="bg-white">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div 
                className="text-center p-4 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition duration-200"
                onClick={handleCustomerApprovals}
              >
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-amber-600">{dashboardMetrics.pendingActions.pendingCustomerApprovals}</p>
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Customer Approvals</p>
              </div>
              
              <div 
                className="text-center p-4 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition duration-200"
                onClick={handlePendingAmendments}
              >
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-amber-600">{dashboardMetrics.pendingActions.pendingAmends}</p>
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Pending Amends</p>
              </div>
              
              <div 
                className="text-center p-4 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition duration-200"
                onClick={handlePendingBMLoans}
              >
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-amber-600">{dashboardMetrics.pendingActions.pendingBMLoanApprovals}</p>
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">BM Loan Approval</p>
              </div>
              
              <div 
                className="text-center p-4 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition duration-200"
                onClick={handlePendingRMLoans}
              >
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-amber-600">{dashboardMetrics.pendingActions.pendingRMLoanApprovals}</p>
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">RM Loan Approval</p>
              </div>
              
              <div 
                className="text-center p-4 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition duration-200"
                onClick={handlePendingDisbursement}
              >
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-amber-600">{dashboardMetrics.pendingActions.pendingDisbursement}</p>
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Pending Disbursement</p>
              </div>
            </div>
          </OverviewSection>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1">
          <OverviewSection title="Recent Activities" bgColor="bg-white">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center p-4 bg-gray-50 rounded-xl animate-pulse">
                    <div className="bg-gray-200 rounded-xl p-3 mr-4 h-12 w-12"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer group"
                    >
                      <div className={`rounded-xl p-3 mr-4 ${activity.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1 truncate">
                          {activity.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 font-medium">
                            {activity.time}
                          </p>
                          <p className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                            {activity.amount}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 font-medium text-lg">No recent activity</p>
                    <p className="text-gray-400 text-sm mt-1">Activity will appear here as it happens</p>
                  </div>
                )}
              </div>
            )}
          </OverviewSection>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;