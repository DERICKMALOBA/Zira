import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [userRegion, setUserRegion] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userBranchId, setUserBranchId] = useState(null);
  const [userRegionId, setUserRegionId] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
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
      outstandingArrears: 0,
      monthToDateArrears: 0,
      totalLoanArrears: 0
    },
    collectionOverview: {
      todayCollectionAmount: 0,
      todayCollectionRate: 0,
      tomorrowCollection: 0,
      monthlyCollectionAmount: 0,
      monthlyCollectionRate: 0,
      prepaymentAmount: 0,
      prepaymentRate: 0,
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
          id: user.id,
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

      if (userRole === "branch_manager" && userBranchId) {
        query = query.eq("branch_id", userBranchId);
      } else if (userRole === "regional_manager") {
        if (branchFilter !== "all") {
          query = query.eq("branch_id", branchFilter);
        } else {
          query = query.eq("region_id", userRegionId);
        }
      } else if (branchFilter !== "all") {
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

      if (role === "branch_manager") {
        loansQuery = loansQuery.eq("branch_id", branchId);
      } else if (role === "regional_manager") {
        loansQuery = loansQuery.eq("region_id", regionId);
      }

      const { data: recentLoans, error: loansError } = await loansQuery;
      if (loansError) throw loansError;

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

const fetchMonthlyCollectionData = async (loanIds) => {
  if (!loanIds || loanIds.length === 0)
    return { monthlyAmount: 0, monthlyRate: 0 };

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    //  Fetch total repayments received this month
    const { data: repayments, error: repayError } = await supabase
      .from("mpesa_c2b_transactions")
      .select("amount, loan_id, created_at")
      .in("loan_id", loanIds)
      .eq("status", "applied")
      .eq("payment_type", "repayment")
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth);

    if (repayError) throw repayError;

    const monthlyAmount = repayments?.reduce(
      (sum, r) => sum + (parseFloat(r.amount) || 0),
      0
    );

    //  Fetch expected installments for this month
    const { data: installments, error: instError } = await supabase
      .from("loan_installments")
      .select("due_amount")
      .in("loan_id", loanIds)
      .gte("due_date", startOfMonth)
      .lte("due_date", endOfMonth);

    if (instError) throw instError;

    const totalMonthlyExpected = installments?.reduce(
      (sum, inst) => sum + (parseFloat(inst.due_amount) || 0),
      0
    );

    //  Calculate Monthly Collection Rate
    const monthlyRate =
      totalMonthlyExpected > 0
        ? Math.round((monthlyAmount / totalMonthlyExpected) * 100)
        : 0;

    return { monthlyAmount, monthlyRate };
  } catch (error) {
    console.error("Error fetching monthly collection data:", error);
    return { monthlyAmount: 0, monthlyRate: 0 };
  }
};



  // Fetch prepayment data
  const fetchPrepaymentData = async (loanIds) => {
    if (!loanIds || loanIds.length === 0) return { prepaymentAmount: 0, prepaymentRate: 0 };
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const { data: tomorrowInstallments, error } = await supabase
        .from("loan_installments")
        .select("due_amount, loan_id")
        .in("loan_id", loanIds)
        .eq("due_date", tomorrowStr);

      if (error) throw error;
      
      const totalDueTomorrow = tomorrowInstallments?.reduce((sum, inst) => sum + (parseFloat(inst.due_amount) || 0), 0) || 0;
      
      // Calculate prepayments made today for tomorrow's installments
      const { data: prepayments, error: prepayError } = await supabase
        .from("mpesa_c2b_transactions")
        .select("amount, loan_id")
        .in("loan_id", loanIds)
        .eq("status", "applied")
        .eq("payment_type", "repayment")
        .gte("created_at", new Date().toISOString().split('T')[0]);

      if (prepayError) throw prepayError;
      
      const prepaymentAmount = prepayments?.reduce((sum, transaction) => sum + (parseFloat(transaction.amount) || 0), 0) || 0;
      const prepaymentRate = totalDueTomorrow > 0 ? Math.round((prepaymentAmount / totalDueTomorrow) * 100) : 0;

      return { 
        prepaymentAmount, 
        prepaymentRate,
        totalDueTomorrow 
      };
    } catch (error) {
      console.error("Error fetching prepayment data:", error);
      return { prepaymentAmount: 0, prepaymentRate: 0, totalDueTomorrow: 0 };
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
      const applyFilters = (query) => {
        if (role === "branch_manager") {
          query = query.eq("branch_id", branchId);
        } else if (role === "regional_manager") {
          if (selectedRegion !== "all") {
            query = query.eq("region_id", selectedRegion);
          }
          if (selectedBranch !== "all") {
            query = query.eq("branch_id", selectedBranch);
          }
        } else if (role === "relationship_officer") {
          query = query.eq("created_by", userId);
        } else if (role === "credit_analyst_officer" || role === "customer_service_officer") {
          if (selectedRegion !== "all") query = query.eq("region_id", selectedRegion);
          if (selectedBranch !== "all") query = query.eq("branch_id", selectedBranch);
          if (selectedRO !== "all") query = query.eq("created_by", selectedRO);
        }
        return query;
      };

      let leadsQuery = applyFilters(supabase.from("leads").select("id, created_at"));
      const { data: leads, error: leadsError } = await leadsQuery;
      if (leadsError) throw leadsError;

      let customersQuery = applyFilters(
        supabase.from("customers").select("id, created_at, form_status")
      );
      customersQuery = customersQuery.neq("form_status", "draft");

      const { data: customers, error: customersError } = await customersQuery;
      if (customersError) throw customersError;

      const totalLeads = (leads?.length || 0) + (customers?.length || 0);
      const convertedLeads = customers?.length || 0;
      const conversionRate =
        totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

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

      const leadsThisYear = leads.filter(
        (l) => new Date(l.created_at).getFullYear() === currentYear
      ).length;

      const customersThisYear = customers.filter(
        (c) => new Date(c.created_at).getFullYear() === currentYear
      ).length;

      const totalThisYear = leadsThisYear + customersThisYear;
      const conversionRateYear =
        totalThisYear > 0 ? Math.round((customersThisYear / totalThisYear) * 100) : 0;

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


  // Fetch total paid amount for performing loans only
const fetchPerformingLoansPaidAmount = async (performingLoanIds) => {
  if (!performingLoanIds || performingLoanIds.length === 0) return 0;
  
  try {
    const { data, error } = await supabase
      .from("mpesa_c2b_transactions")
      .select("amount, loan_id")
      .in("loan_id", performingLoanIds)
      .eq("status", "applied")
      .eq("payment_type", "repayment");

    if (error) throw error;
    
    return data?.reduce((sum, transaction) => sum + (parseFloat(transaction.amount) || 0), 0) || 0;
  } catch (error) {
    console.error("Error fetching performing loans paid amounts:", error);
    return 0;
  }
};

  // Calculate dashboard metrics with proper filtering
  const calculateDashboardMetrics = async (loansData, customersData, profile) => {
    const { role, branchId, regionId } = profile;

    let filteredLoans = loansData;
    let filteredCustomers = customersData;

    if (role === "branch_manager") {
      filteredLoans = loansData.filter(loan => loan.branch_id === branchId);
      filteredCustomers = customersData.filter(customer => customer.branch_id === branchId);
      
      if (selectedRO !== "all") {
        filteredCustomers = filteredCustomers.filter(customer => customer.created_by === selectedRO);
        const customerIds = filteredCustomers.map(c => c.id);
        filteredLoans = filteredLoans.filter(loan => 
          loan.booked_by === selectedRO || customerIds.includes(loan.customer_id)
        );
      }
    } else if (role === "regional_manager") {
      filteredLoans = loansData.filter(loan => loan.region_id === regionId);
      filteredCustomers = customersData.filter(customer => customer.region_id === regionId);
      
      if (selectedBranch !== "all") {
        filteredLoans = filteredLoans.filter(loan => loan.branch_id === selectedBranch);
        filteredCustomers = filteredCustomers.filter(customer => customer.branch_id === selectedBranch);
      }
      
      if (selectedRO !== "all") {
        filteredCustomers = filteredCustomers.filter(customer => customer.created_by === selectedRO);
        const customerIds = filteredCustomers.map(c => c.id);
        filteredLoans = filteredLoans.filter(loan => 
          loan.booked_by === selectedRO || customerIds.includes(loan.customer_id)
        );
      }
    } else if (role === "credit_analyst_officer" || role === "customer_service_officer") {
      if (selectedRegion !== "all") {
        filteredLoans = filteredLoans.filter(loan => loan.region_id === selectedRegion);
        filteredCustomers = filteredCustomers.filter(customer => customer.region_id === selectedRegion);
      }
      
      if (selectedBranch !== "all") {
        filteredLoans = filteredLoans.filter(loan => loan.branch_id === selectedBranch);
        filteredCustomers = filteredCustomers.filter(customer => customer.branch_id === selectedBranch);
      }
      
      if (selectedRO !== "all") {
        filteredCustomers = filteredCustomers.filter(customer => customer.created_by === selectedRO);
        const customerIds = filteredCustomers.map(c => c.id);
        filteredLoans = filteredLoans.filter(loan => 
          loan.booked_by === selectedRO || customerIds.includes(loan.customer_id)
        );
      }
    }

    const performingLoans = await fetchPerformingLoans(filteredLoans);
    const loanIds = filteredLoans.map(loan => loan.id);
    const totalPaidAmount = await fetchTotalPaidAmount(loanIds);
    const monthlyCollectionData = await fetchMonthlyCollectionData(loanIds);
    const prepaymentData = await fetchPrepaymentData(loanIds);
    

    const totalLoanAmount = filteredLoans.reduce((sum, loan) =>
      sum + (loan.total_payable || loan.scored_amount || 0), 0
    );

    const outstandingBalance = totalLoanAmount - totalPaidAmount;

    const outstandingLoans = filteredLoans.filter(loan =>
      loan.status === "disbursed" && loan.repayment_state !== "completed"
    );

 // Calculate performing loan balance correctly
  const performingLoanIds = performingLoans.map(loan => loan.id);
  const performingLoanTotalPayable = performingLoans.reduce((sum, loan) =>
    sum + (loan.total_payable || loan.scored_amount || 0), 0
  );
  const performingLoansPaid = await fetchPerformingLoansPaidAmount(performingLoanIds);
  const performingLoanBalance = performingLoanTotalPayable - performingLoansPaid;

// Active customers are those with at least one loan where repayment_state is not 'completed'
    const activeCustomerIds = new Set();

    filteredLoans.forEach(loan => {
      if (loan.repayment_state?.toLowerCase() !== "completed") {
        activeCustomerIds.add(loan.customer_id);
      }
    });

    const activeCustomers = activeCustomerIds.size;
    const inactiveCustomers = filteredCustomers.length - activeCustomers;




    const today = new Date().toISOString().split("T")[0];
    const newCustomersToday = filteredCustomers.filter(c =>
      c.created_at && c.created_at.split("T")[0] === today
    ).length;

    const leadConversionRate = await fetchLeadsConversionRate(
      regionId,
      branchId,
      role,
      profile?.id,
      selectedRegion,
      selectedBranch,
      selectedRO
    );

    const disbursedLoans = filteredLoans.filter(loan => loan.status === "disbursed");
    const disbursedLoansAmount = disbursedLoans.reduce((sum, loan) =>
      sum + (loan.scored_amount || 0), 0
    );

    const todayCollectionAmount = filteredLoans.reduce((sum, loan) =>
      sum + (loan.today_collection || 0), 0
    );

    // Calculate month-to-date arrears
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthToDateArrears = outstandingLoans.reduce((sum, loan) => {
      const loanArrears = loan.arrears_amount || 0;
      const loanDate = new Date(loan.disbursed_date || loan.created_at);
      return loanDate >= startOfMonth ? sum + loanArrears : sum;
    }, 0);

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
       performingLoanBalance, 
    performingLoanAmount: performingLoanTotalPayable,
      
      performingLoansCount: performingLoans.length,
      totalCustomers: filteredCustomers.length,
      customerOverview: {
        activeCustomers,
        inactiveCustomers,
        newCustomersToday,
        leadConversionRateMonth: leadConversionRate.conversionRateMonth,
        leadConversionRateYear: leadConversionRate.conversionRateYear
      },
      loanOverview: {
        disbursedLoansAmount,
        disbursedLoansCount: disbursedLoans.length,
        loansDueToday: filteredLoans.filter(l => l.due_date === today).length,
        outstandingArrears: outstandingLoans.reduce((sum, l) => sum + (l.arrears_amount || 0), 0),
        monthToDateArrears,
        totalLoanArrears: outstandingLoans.reduce((sum, l) => sum + (l.arrears_amount || 0), 0)
      },
      collectionOverview: {
        todayCollectionAmount,
        todayCollectionRate:
          outstandingBalance > 0 ? Math.round((todayCollectionAmount / outstandingBalance) * 100) : 0,
        tomorrowCollection: prepaymentData.prepaymentAmount,
        monthlyCollectionAmount: monthlyCollectionData.monthlyAmount,
        monthlyCollectionRate: monthlyCollectionData.monthlyRate,
        prepaymentAmount: prepaymentData.prepaymentAmount,
        prepaymentRate: prepaymentData.prepaymentRate,
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

      const { role, regionId, branchId, id: userId } = profile;

      if (role === "credit_analyst_officer" || role === "customer_service_officer") {
        const regionsData = await fetchRegions();
        setAvailableRegions(regionsData);
      }

      let branchesData = [];
      if (role === "regional_manager") {
        branchesData = await fetchBranches(regionId);
      } else {
        branchesData = await fetchBranches("all");
      }
      setAvailableBranches(branchesData);

      const relationshipOfficers = await fetchRelationshipOfficers(
        "all",
        role,
        branchId,
        regionId
      );
      setAvailableROs([{ id: "all", full_name: "All ROs" }, ...relationshipOfficers]);

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

      const metrics = await calculateDashboardMetrics(loansData || [], customersData || [], profile);
      setDashboardMetrics(metrics);

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
        branchId: userBranchId,
        id: userBranchId
      };
      calculateDashboardMetrics(loans, customers, profile).then(setDashboardMetrics);
    }
  }, [selectedRegion, selectedBranch, selectedRO, userRole, loans, customers, userRegionId, userBranchId]);

  // Update branches when region changes
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

  // Circular Progress Component
  const CircularProgress = ({ percentage, label, total, converted }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-44 h-44">
          <svg className="transform -rotate-90 w-44 h-44">
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="#C19A6B"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-800">{percentage}%</p>
              <p className="text-xs text-gray-500 mt-1">{converted}/{total}</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4 font-medium text-center">{label}</p>
      </div>
    );
  };

  // Main Stats Card Component
 const MainStatCard = ({ title, amount, count, loading }) => (
  <div className="bg-blue-500 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-indigo-400/20">
    {loading ? (
      <div className="space-y-3">
        <div className="h-5 w-32 bg-white/20 animate-pulse rounded"></div>
        <div className="h-10 w-40 bg-white/30 animate-pulse rounded-lg"></div>
        <div className="h-4 w-24 bg-white/20 animate-pulse rounded"></div>
      </div>
    ) : (
      <div className="flex flex-col h-full">
        {/* Title */}
        <div className="mb-3">
          <p className="text-sm font-medium text-indigo-100 uppercase tracking-wide">
            {title}
          </p>
        </div>
        
        {/* Amount */}
        <div className="flex-grow flex items-center">
          <p className="text-3xl lg:text-4xl font-bold tracking-tight leading-none">
            {amount}
          </p>
        </div>
        
        {/* Count/Additional Info */}
        <div className="mt-4 pt-3 border-t border-white/20">
          <p className="text-sm font-semibold text-indigo-50 flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {count}
          </p>
        </div>
      </div>
    )}
  </div>
);
  // Overview Section Component
  const OverviewSection = ({ title, children, onViewAll }) => (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-600">{title}</h3>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="flex items-center text-blue-500 hover:text-blue-600 font-medium text-sm transition duration-200"
          >
            View Customers
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      {children}
    </div>
  );

const ProgressBar = ({ label, value, total, type }) => {
  const percentage = total ? Math.round((value / total) * 100) : value; // value as rate if total not provided
  const bgColor = percentage < 50 ? "bg-red-500" : "bg-green-500";

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-2xl font-bold text-gray-800">
        {total ? `Ksh ${value.toLocaleString()}` : `${value}%`}
        {total && <span className="text-sm font-normal text-gray-500">/Ksh {total.toLocaleString()}</span>}
      </p>
      <p className="text-sm text-gray-600 mt-2">{label}</p>
      <div className="mt-3 bg-gray-200 rounded-full h-2">
        <div
          className={`${bgColor} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
    </div>
  );
};



  if (loading && !userRegion && !userBranch && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          </div>
          <p className="mt-6 text-lg text-gray-600 font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section with Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
         
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Region Filter */}
            {(userRole === "credit_analyst_officer" || userRole === "customer_service_officer") && (
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 cursor-pointer"
              >
                <option value="all">All Regions</option>
                {availableRegions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            )}

            {/* Branch Filter */}
            {(userRole === "regional_manager" || userRole === "credit_analyst_officer" || userRole === "customer_service_officer") && (
              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 cursor-pointer"
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
            )}

            {/* RO Filter */}
            <select 
              value={selectedRO}
              onChange={(e) => setSelectedRO(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Main Stats Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
 
  <MainStatCard
    title="Outstanding Loan Balance"
    amount={`Ksh ${(dashboardMetrics?.outstandingBalance ?? 0).toLocaleString()}`}
    count={`${(dashboardMetrics?.outstandingLoansCount ?? 0).toLocaleString()} Loans`}
    loading={loading}
  />
  <MainStatCard
    title="Performing Loan Balance"
    amount={`Ksh ${(dashboardMetrics?.performingLoanBalance ?? 0).toLocaleString()}`}
    count={`${(dashboardMetrics?.performingLoansCount ?? 0).toLocaleString()} Loans`}
    loading={loading}
  />
  <MainStatCard
    title="Total Customers"
    amount={(dashboardMetrics?.totalCustomers ?? 0).toLocaleString()}
    count={`${(dashboardMetrics?.totalCustomers ?? 0).toLocaleString()} Customers`}
    loading={loading}
  />
</div>

      {/* Customer Overview and Loans Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customers Overview */}
        <OverviewSection 
          title="Customers Overview" 
          onViewAll={handleViewCustomers}
        >
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-800">{dashboardMetrics.customerOverview.activeCustomers.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Active Customers</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-800">{dashboardMetrics.customerOverview.inactiveCustomers.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Inactive Customers</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-800">{dashboardMetrics.customerOverview.newCustomersToday}</p>
              <p className="text-sm text-gray-600 mt-1">New Today</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <CircularProgress 
              percentage={dashboardMetrics.customerOverview.leadConversionRateMonth || 0}
              label="Leads Conversion this month"
              total={0}
              converted={0}
            />
            <CircularProgress 
              percentage={dashboardMetrics.customerOverview.leadConversionRateYear || 0}
              label="Leads Conversion this year"
              total={0}
              converted={0}
            />
          </div>
        </OverviewSection>

        {/* Loans Overview */}
        <OverviewSection title="Loans Overview" onViewAll={handleViewLoans}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Disbursed Loans</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">
                  Ksh {dashboardMetrics.loanOverview.disbursedLoansAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">{dashboardMetrics.loanOverview.disbursedLoansCount.toLocaleString()} loans</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Loans Due Today</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">
                  {dashboardMetrics.loanOverview.loansDueToday.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">loans</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm font-medium text-red-700">Month to Date Arrears</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">
                  Ksh {dashboardMetrics.loanOverview.monthToDateArrears.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">arrears</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Outstanding Total Loan Arrears</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">
                  Ksh {dashboardMetrics.loanOverview.totalLoanArrears.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">total arrears</p>
              </div>
            </div>
          </div>
        </OverviewSection>
      </div>

      {/* Collections Overview and Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collections Overview */}
     <OverviewSection title="Collections Overview">
  <div className="grid grid-cols-2 gap-4">
    <ProgressBar
      label="Today's Collection Rate"
      value={dashboardMetrics.collectionOverview.todayCollectionAmount}
      total={dashboardMetrics.outstandingBalance}
    />
    <ProgressBar
      label="Monthly Collection Rate"
      value={dashboardMetrics.collectionOverview.monthlyCollectionRate}
    />
    <ProgressBar
      label="Prepayment Rate"
      value={dashboardMetrics.collectionOverview.prepaymentRate}
    />
    <ProgressBar
      label="PAR"
      value={dashboardMetrics.collectionOverview.par}
    />
  </div>
</OverviewSection>


        {/* Pending Actions */}
        <OverviewSection title="Pending Actions">
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
              onClick={handleCustomerApprovals}
            >
              <span className="text-sm font-medium text-gray-700">Pending Customers Approvals</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">{dashboardMetrics.pendingActions.pendingCustomerApprovals}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
              onClick={handlePendingAmendments}
            >
              <span className="text-sm font-medium text-gray-700">Pending Customers Amendments</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">{dashboardMetrics.pendingActions.pendingAmends}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
            >
              <span className="text-sm font-medium text-gray-700">Limit Approvals</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">{dashboardMetrics.pendingActions.pendingLimitApprovals}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
              onClick={handlePendingBMLoans}
            >
              <span className="text-sm font-medium text-gray-700">Lock Approvals</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">{dashboardMetrics.pendingActions.pendingBMLoanApprovals}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </OverviewSection>
      </div>
    </div>
  );
};

export default Dashboard;