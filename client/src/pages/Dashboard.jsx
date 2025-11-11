import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [userRegion, setUserRegion] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userBranchId, setUserBranchId] = useState(null);
  const [userRegionId, setUserRegionId] = useState(null);
  const [userId, setUserId] = useState(null); // ✅ Added userId state
  const [recentActivity, setRecentActivity] = useState([]);
  const navigate = useNavigate();

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
      leadConversionRateYear: 0,
      totalThisMonth: 0,
      customersThisMonth: 0,
      totalThisYear: 0,
      customersThisYear: 0,
      leadsThisMonth: 0,
      leadsToday: 0,
    },
    loanOverview: {
      disbursedLoansAmount: 0,
      disbursedLoansCount: 0,
      loansDueToday: 0,
      outstandingArrears: 0,
      monthToDateArrears: 0,
      totalLoanArrears: 0,
      disbursedLoansToday: 0,
      disbursedLoansThisMonth: 0,
    },
    collectionOverview: {
      todayCollectionAmount: 0,
      todayCollectionRate: 0,
      tomorrowCollection: 0,
      monthlyCollectionAmount: 0,
      monthlyCollectionRate: 0,
      prepaymentAmount: 0,
      prepaymentRate: 0,
      par: 0,
    },
    pendingActions: {
      pendingCustomerApprovals: 0,
      pendingAmends: 0,
      pendingLimitApprovals: 0,
      pendingBMLoanApprovals: 0,
      pendingRMLoanApprovals: 0,
      pendingDisbursement: 0,
    },
    cleanBookAmount: 0,
    cleanBookPercentage: 0,
  });

  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedRO, setSelectedRO] = useState("all");
  const [availableRegions, setAvailableRegions] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableROs, setAvailableROs] = useState([]);

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
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
          .select(
            `
            region_id,
            branch_id,
            branches!inner(name),
            regions!inner(name)
          `
          )
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setUserRole(userData?.role);
        setUserRegion(profileData?.regions?.name || profileData?.region_id);
        setUserBranch(profileData?.branches?.name || profileData?.branch_id);
        setUserBranchId(profileData?.branch_id);
        setUserRegionId(profileData?.region_id);
        setUserId(user.id); // ✅ Store userId

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

  const fetchRelationshipOfficers = async (
    branchFilter = "all",
    userRole = null,
    userBranchId = null,
    userRegionId = null
  ) => {
    try {
      let query = supabase
        .from("profiles")
        .select(
          `
          id,
          region_id,
          branch_id,
          users!inner(
            id,
            full_name,
            role
          )
        `
        )
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

  const fetchRecentActivities = async (profile) => {
    try {
      const { role, regionId, branchId, id } = profile;

      let loansQuery = supabase
        .from("loans")
        .select(
          `
          id,
          scored_amount,
          status,
          created_at,
          disbursed_date,
          customers!inner(
            Firstname,
            Surname
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      // ✅ Filter for relationship_officer
      if (role === "relationship_officer") {
        loansQuery = loansQuery.eq("booked_by", id);
      } else if (role === "branch_manager") {
        loansQuery = loansQuery.eq("branch_id", branchId);
      } else if (role === "regional_manager") {
        loansQuery = loansQuery.eq("region_id", regionId);
      }

      const { data: recentLoans, error: loansError } = await loansQuery;
      if (loansError) throw loansError;

      const activities =
        recentLoans?.map((loan) => {
          const customerName = `${loan.customers.Firstname} ${loan.customers.Surname}`;
          const timeAgo = getTimeAgo(new Date(loan.created_at));

          let message = "";
          let iconBg = "";
          let icon = null;

          if (loan.status === "disbursed") {
            message = `Loan disbursed to ${customerName}`;
            iconBg = "bg-green-100";
            icon = (
              <svg
                className="w-5 h-5 text-green-600"
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
            );
          } else if (loan.status === "approved") {
            message = `Loan approved for ${customerName}`;
            iconBg = "bg-blue-100";
            icon = (
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            );
          } else {
            message = `New loan application from ${customerName}`;
            iconBg = "bg-amber-100";
            icon = (
              <svg
                className="w-5 h-5 text-amber-600"
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
            );
          }

          return {
            id: loan.id,
            message,
            time: timeAgo,
            amount: `Ksh ${loan.scored_amount?.toLocaleString() || 0}`,
            icon,
            iconBg,
          };
        }) || [];

      return activities;
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

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

      return (
        data?.reduce(
          (sum, transaction) => sum + (parseFloat(transaction.amount) || 0),
          0
        ) || 0
      );
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
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      ).toISOString();

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

  const fetchPrepaymentData = async (loanIds) => {
    if (!loanIds || loanIds.length === 0)
      return { prepaymentAmount: 0, prepaymentRate: 0 };

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const { data: tomorrowInstallments, error } = await supabase
        .from("loan_installments")
        .select("due_amount, loan_id")
        .in("loan_id", loanIds)
        .eq("due_date", tomorrowStr);

      if (error) throw error;

      const totalDueTomorrow =
        tomorrowInstallments?.reduce(
          (sum, inst) => sum + (parseFloat(inst.due_amount) || 0),
          0
        ) || 0;

      const { data: prepayments, error: prepayError } = await supabase
        .from("mpesa_c2b_transactions")
        .select("amount, loan_id")
        .in("loan_id", loanIds)
        .eq("status", "applied")
        .eq("payment_type", "repayment")
        .gte("created_at", new Date().toISOString().split("T")[0]);

      if (prepayError) throw prepayError;

      const prepaymentAmount =
        prepayments?.reduce(
          (sum, transaction) => sum + (parseFloat(transaction.amount) || 0),
          0
        ) || 0;
      const prepaymentRate =
        totalDueTomorrow > 0
          ? Math.round((prepaymentAmount / totalDueTomorrow) * 100)
          : 0;

      return {
        prepaymentAmount,
        prepaymentRate,
        totalDueTomorrow,
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
          // ✅ Filter by created_by for relationship_officer
          query = query.eq("created_by", userId);
        } else if (
          role === "credit_analyst_officer" ||
          role === "customer_service_officer"
        ) {
          if (selectedRegion !== "all")
            query = query.eq("region_id", selectedRegion);
          if (selectedBranch !== "all")
            query = query.eq("branch_id", selectedBranch);
          if (selectedRO !== "all") query = query.eq("created_by", selectedRO);
        }
        return query;
      };

      let leadsQuery = applyFilters(
        supabase.from("leads").select("id, created_at")
      );
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
      const today = now.toISOString().split("T")[0];

      const leadsThisMonth =
        leads?.filter(
          (l) =>
            new Date(l.created_at).getMonth() === currentMonth &&
            new Date(l.created_at).getFullYear() === currentYear
        ).length || 0;

      const customersThisMonth =
        customers?.filter(
          (c) =>
            new Date(c.created_at).getMonth() === currentMonth &&
            new Date(c.created_at).getFullYear() === currentYear
        ).length || 0;

      const totalThisMonth = leadsThisMonth + customersThisMonth;
      const conversionRateMonth =
        totalThisMonth > 0
          ? Math.round((customersThisMonth / totalThisMonth) * 100)
          : 0;

      const leadsThisYear =
        leads?.filter(
          (l) => new Date(l.created_at).getFullYear() === currentYear
        ).length || 0;

      const customersThisYear =
        customers?.filter(
          (c) => new Date(c.created_at).getFullYear() === currentYear
        ).length || 0;

      const totalThisYear = leadsThisYear + customersThisYear;
      const conversionRateYear =
        totalThisYear > 0
          ? Math.round((customersThisYear / totalThisYear) * 100)
          : 0;

      const leadsToday =
        leads?.filter(
          (l) => l.created_at && l.created_at.split("T")[0] === today
        ).length || 0;

      const safe = (val) => (isNaN(val) || val === null ? 0 : Number(val));

      return {
        totalLeads: safe(totalLeads),
        convertedLeads: safe(convertedLeads),
        conversionRate: safe(conversionRate),
        conversionRateMonth: safe(conversionRateMonth),
        conversionRateYear: safe(conversionRateYear),
        totalThisMonth: safe(totalThisMonth),
        customersThisMonth: safe(customersThisMonth),
        totalThisYear: safe(totalThisYear),
        customersThisYear: safe(customersThisYear),
        leadsThisMonth: safe(leadsThisMonth),
        leadsToday: safe(leadsToday),
      };
    } catch (error) {
      console.error("Error fetching leads conversion rate:", error);
      return {
        totalLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
        conversionRateMonth: 0,
        conversionRateYear: 0,
        totalThisMonth: 0,
        customersThisMonth: 0,
        totalThisYear: 0,
        customersThisYear: 0,
        leadsThisMonth: 0,
        leadsToday: 0,
      };
    }
  };

  const fetchPerformingLoans = async (loansData) => {
    if (!loansData || loansData.length === 0) return [];

    try {
      const loanIds = loansData.map((l) => l.id);

      const { data: installments, error } = await supabase
        .from("loan_installments")
        .select("loan_id, status, days_overdue")
        .in("loan_id", loanIds);

      if (error) throw error;

      const grouped =
        installments?.reduce((acc, inst) => {
          if (!acc[inst.loan_id]) acc[inst.loan_id] = [];
          acc[inst.loan_id].push(inst);
          return acc;
        }, {}) || {};

      const performingLoanIds = loansData
        .filter((loan) => {
          if (
            loan.status === "completed" ||
            loan.repayment_state === "completed"
          ) {
            return false;
          }

          const loanInstallments = grouped[loan.id] || [];

          if (loanInstallments.length === 0 && loan.status === "disbursed")
            return true;

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

      return (
        data?.reduce(
          (sum, transaction) => sum + (parseFloat(transaction.amount) || 0),
          0
        ) || 0
      );
    } catch (error) {
      console.error("Error fetching performing loans paid amounts:", error);
      return 0;
    }
  };

  const calculateDashboardMetrics = async (
    loansData,
    customersData,
    profile
  ) => {
    const { role, branchId, regionId, id } = profile;

    let filteredLoans = loansData;
    let filteredCustomers = customersData;

    // ✅ Filter data for relationship_officer
    if (role === "relationship_officer") {
      filteredCustomers = customersData.filter(
        (customer) => customer.created_by === id
      );
      const customerIds = filteredCustomers.map((c) => c.id);
      filteredLoans = loansData.filter(
        (loan) => loan.booked_by === id || customerIds.includes(loan.customer_id)
      );
    } else if (role === "branch_manager") {
      filteredLoans = loansData.filter((loan) => loan.branch_id === branchId);
      filteredCustomers = customersData.filter(
        (customer) => customer.branch_id === branchId
      );

      if (selectedRO !== "all") {
        filteredCustomers = filteredCustomers.filter(
          (customer) => customer.created_by === selectedRO
        );
        const customerIds = filteredCustomers.map((c) => c.id);
        filteredLoans = filteredLoans.filter(
          (loan) =>
            loan.booked_by === selectedRO ||
            customerIds.includes(loan.customer_id)
        );
      }
    } else if (role === "regional_manager") {
      filteredLoans = loansData.filter((loan) => loan.region_id === regionId);
      filteredCustomers = customersData.filter(
        (customer) => customer.region_id === regionId
      );

      if (selectedBranch !== "all") {
        filteredLoans = filteredLoans.filter(
          (loan) => loan.branch_id === selectedBranch
        );
        filteredCustomers = filteredCustomers.filter(
          (customer) => customer.branch_id === selectedBranch
        );
      }

      if (selectedRO !== "all") {
        filteredCustomers = filteredCustomers.filter(
          (customer) => customer.created_by === selectedRO
        );
        const customerIds = filteredCustomers.map((c) => c.id);
        filteredLoans = filteredLoans.filter(
          (loan) =>
            loan.booked_by === selectedRO ||
            customerIds.includes(loan.customer_id)
        );
      }
    } else if (
      role === "credit_analyst_officer" ||
      role === "customer_service_officer"
    ) {
      if (selectedRegion !== "all") {
        filteredLoans = filteredLoans.filter(
          (loan) => loan.region_id === selectedRegion
        );
        filteredCustomers = filteredCustomers.filter(
          (customer) => customer.region_id === selectedRegion
        );
      }

      if (selectedBranch !== "all") {
        filteredLoans = filteredLoans.filter(
          (loan) => loan.branch_id === selectedBranch
        );
        filteredCustomers = filteredCustomers.filter(
          (customer) => customer.branch_id === selectedBranch
        );
      }

      if (selectedRO !== "all") {
        filteredCustomers = filteredCustomers.filter(
          (customer) => customer.created_by === selectedRO
        );
        const customerIds = filteredCustomers.map((c) => c.id);
        filteredLoans = filteredLoans.filter(
          (loan) =>
            loan.booked_by === selectedRO ||
            customerIds.includes(loan.customer_id)
        );
      }
    }

    const performingLoans = await fetchPerformingLoans(filteredLoans);
    const loanIds = filteredLoans.map((loan) => loan.id);
    const totalPaidAmount = await fetchTotalPaidAmount(loanIds);
    const monthlyCollectionData = await fetchMonthlyCollectionData(loanIds);
    const prepaymentData = await fetchPrepaymentData(loanIds);

    const totalLoanAmount = filteredLoans.reduce(
      (sum, loan) => sum + (loan.total_payable || loan.scored_amount || 0),
      0
    );

    const outstandingBalance = totalLoanAmount - totalPaidAmount;

    const outstandingLoans = filteredLoans.filter(
      (loan) =>
        loan.status === "disbursed" && loan.repayment_state !== "completed"
    );

    const performingLoanIds = performingLoans.map((loan) => loan.id);
    const performingLoanTotalPayable = performingLoans.reduce(
      (sum, loan) => sum + (loan.total_payable || loan.scored_amount || 0),
      0
    );
    const performingLoansPaid = await fetchPerformingLoansPaidAmount(
      performingLoanIds
    );
    const performingLoanBalance =
      performingLoanTotalPayable - performingLoansPaid;

    const activeCustomerIds = new Set();

    filteredLoans.forEach((loan) => {
      if (loan.repayment_state?.toLowerCase() !== "completed") {
        activeCustomerIds.add(loan.customer_id);
      }
    });

    const activeCustomers = activeCustomerIds.size;
    const inactiveCustomers = filteredCustomers.length - activeCustomers;

    const today = new Date().toISOString().split("T")[0];
    const newCustomersToday = filteredCustomers.filter(
      (c) => c.created_at && c.created_at.split("T")[0] === today
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

    const disbursedLoans = filteredLoans.filter(
      (loan) => loan.status === "disbursed"
    );
    const disbursedLoansAmount = disbursedLoans.reduce(
      (sum, loan) => sum + (loan.scored_amount || 0),
      0
    );

    const todayCollectionAmount = filteredLoans.reduce(
      (sum, loan) => sum + (loan.today_collection || 0),
      0
    );

    const cleanBookAmount = performingLoanTotalPayable - performingLoansPaid;
    const cleanBookPercentage =
      outstandingBalance > 0
        ? Math.round((cleanBookAmount / outstandingBalance) * 100)
        : 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthToDateArrears = outstandingLoans.reduce((sum, loan) => {
      const loanArrears = loan.arrears_amount || 0;
      const loanDate = new Date(loan.disbursed_date || loan.created_at);
      return loanDate >= startOfMonth ? sum + loanArrears : sum;
    }, 0);

    const disbursedLoansToday = disbursedLoans.filter(
      (loan) =>
        loan.disbursed_date && loan.disbursed_date.split("T")[0] === today
    ).length;

    const disbursedLoansThisMonth = disbursedLoans.filter((loan) => {
      const loanDate = new Date(loan.disbursed_date || loan.created_at);
      return (
        loanDate.getMonth() === now.getMonth() &&
        loanDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const pendingCustomerApprovals = filteredCustomers.filter((c) =>
      ["pending", "bm_review", "ca_review", "cso_review"].includes(c.status)
    ).length;

    const pendingBMLoanApprovals = filteredLoans.filter(
      (l) => l.status === "bm_review"
    ).length;
    const pendingRMLoanApprovals = filteredLoans.filter(
      (l) => l.status === "rm_review"
    ).length;
    const pendingDisbursement = filteredLoans.filter(
      (l) => l.status === "approved" && !l.disbursed_date
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
      cleanBookAmount,
      cleanBookPercentage,
      customerOverview: {
        activeCustomers,
        inactiveCustomers,
        newCustomersToday,
        leadConversionRateMonth: leadConversionRate.conversionRateMonth,
        leadConversionRateYear: leadConversionRate.conversionRateYear,
        totalThisMonth: leadConversionRate.totalThisMonth,
        customersThisMonth: leadConversionRate.customersThisMonth,
        totalThisYear: leadConversionRate.totalThisYear,
        customersThisYear: leadConversionRate.customersThisYear,
        leadsThisMonth: leadConversionRate.leadsThisMonth,
        leadsToday: leadConversionRate.leadsToday,
      },
      loanOverview: {
        disbursedLoansAmount,
        disbursedLoansCount: disbursedLoans.length,
        loansDueToday: filteredLoans.filter((l) => l.due_date === today).length,
        outstandingArrears: outstandingLoans.reduce(
          (sum, l) => sum + (l.arrears_amount || 0),
          0
        ),
        monthToDateArrears,
        totalLoanArrears: outstandingLoans.reduce(
          (sum, l) => sum + (l.arrears_amount || 0),
          0
        ),
        disbursedLoansToday,
        disbursedLoansThisMonth,
      },
      collectionOverview: {
        todayCollectionAmount,
        todayCollectionRate:
          outstandingBalance > 0
            ? Math.round((todayCollectionAmount / outstandingBalance) * 100)
            : 0,
        tomorrowCollection: prepaymentData.prepaymentAmount,
        monthlyCollectionAmount: monthlyCollectionData.monthlyAmount,
        monthlyCollectionRate: monthlyCollectionData.monthlyRate,
        prepaymentAmount: prepaymentData.prepaymentAmount,
        prepaymentRate: prepaymentData.prepaymentRate,
        par:
          outstandingLoans.length > 0
            ? Math.round(
                (outstandingLoans.filter((l) => l.is_delinquent).length /
                  outstandingLoans.length) *
                  100
              )
            : 0,
      },
      pendingActions: {
        pendingCustomerApprovals,
        pendingAmends: filteredCustomers.filter((c) =>
          c.status?.includes("amend")
        ).length,
        pendingLimitApprovals: 0,
        pendingBMLoanApprovals,
        pendingRMLoanApprovals,
        pendingDisbursement,
      },
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const profile = await fetchUserProfile();
      if (!profile) return setLoading(false);

      const { role, regionId, branchId, id } = profile;

      // ✅ Only load regions for analysts and CSO
      if (
        role === "credit_analyst_officer" ||
        role === "customer_service_officer"
      ) {
        const regionsData = await fetchRegions();
        setAvailableRegions(regionsData);
      }

      // ✅ Only load branches if NOT relationship_officer
      let branchesData = [];
      if (role !== "relationship_officer") {
        if (role === "regional_manager") {
          branchesData = await fetchBranches(regionId);
        } else {
          branchesData = await fetchBranches("all");
        }
        setAvailableBranches(branchesData);
      }

      // ✅ Only load ROs if NOT relationship_officer
      if (role !== "relationship_officer") {
        const relationshipOfficers = await fetchRelationshipOfficers(
          "all",
          role,
          branchId,
          regionId
        );
        setAvailableROs([
          { id: "all", full_name: "All ROs" },
          ...relationshipOfficers,
        ]);
      }

      let customersQuery = supabase
        .from("customers")
        .select("*, form_status")
        .neq("form_status", "draft");

      let loansQuery = supabase.from("loans").select("*");

      // ✅ Apply filters based on role
      if (role === "relationship_officer") {
        customersQuery = customersQuery.eq("created_by", id);
        loansQuery = loansQuery.eq("booked_by", id);
      } else if (role === "branch_manager") {
        customersQuery = customersQuery.eq("branch_id", branchId);
        loansQuery = loansQuery.eq("branch_id", branchId);
      } else if (role === "regional_manager") {
        customersQuery = customersQuery.eq("region_id", regionId);
        loansQuery = loansQuery.eq("region_id", regionId);
      }

      const [{ data: customersData }, { data: loansData }] = await Promise.all([
        customersQuery,
        loansQuery,
      ]);

      setCustomers(customersData || []);
      setLoans(loansData || []);

      const metrics = await calculateDashboardMetrics(
        loansData || [],
        customersData || [],
        profile
      );
      setDashboardMetrics(metrics);

      const activities = await fetchRecentActivities(profile);
      setRecentActivity(activities);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (userRole && loans.length > 0 && customers.length > 0) {
      const profile = {
        role: userRole,
        regionId: userRegionId,
        branchId: userBranchId,
        id: userId, // ✅ Pass userId
      };
      calculateDashboardMetrics(loans, customers, profile).then(
        setDashboardMetrics
      );
    }
  }, [
    selectedRegion,
    selectedBranch,
    selectedRO,
    userRole,
    loans,
    customers,
    userRegionId,
    userBranchId,
    userId, // ✅ Add userId dependency
  ]);

  useEffect(() => {
    if (
      selectedRegion !== "all" &&
      (userRole === "credit_analyst_officer" ||
        userRole === "customer_service_officer")
    ) {
      fetchBranches(selectedRegion).then((branches) => {
        setAvailableBranches(branches);
        setSelectedBranch("all");
        setSelectedRO("all");
      });
    }
  }, [selectedRegion, userRole]);

  useEffect(() => {
    if (
      selectedBranch &&
      (userRole === "credit_analyst_officer" ||
        userRole === "customer_service_officer" ||
        userRole === "regional_manager")
    ) {
      fetchRelationshipOfficers(
        selectedBranch,
        userRole,
        userBranchId,
        userRegionId
      ).then((ros) => {
        setAvailableROs([{ id: "all", full_name: "All ROs" }, ...ros]);
      });
      setSelectedRO("all");
    }
  }, [selectedBranch, userRole, userBranchId, userRegionId]);

  const handleViewCustomers = () => navigate("/registry/customers");
  const handleViewLoans = () => navigate("/loaning/all");
  const handlePendingBMLoans = () =>
    navigate("/loaning/pending-branch-manager");
  const handlePendingRMLoans = () =>
    navigate("/loaning/pending-regional-manager");
  const handlePendingDisbursement = () =>
    navigate("/loaning/pending-disbursement");
  const handleCustomerApprovals = () => navigate("/registry/approvals-pending");
  const handlePendingAmendments = () =>
    navigate("/registry/pending-amendments");

  // Component definitions remain the same...
  const SemiCircularConverter = ({ percentage, label, total, converted }) => {
    const radius = 80;
    const circumference = Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const rotation = -90 + (percentage / 100) * 180;

    return (
      <div className="relative flex flex-col items-center space-y-4">
        <div className="relative w-56 h-36 mb-3">
          <svg className="w-full h-full" viewBox="0 0 200 120">
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#goldGradient)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#CA8A04" />
              </linearGradient>
            </defs>
            <g transform="translate(100,100)">
              <g transform={`rotate(${rotation})`}>
                <polygon
                  points="0,0 0,-75 3,-68 -3,-68"
                  fill="#FACC15"
                  stroke="#CA8A04"
                  strokeWidth="1"
                />
              </g>
              <circle
                cx="0"
                cy="0"
                r="10"
                fill="#FACC15"
                stroke="#CA8A04"
                strokeWidth="1.5"
              />
            </g>
          </svg>
        </div>
        <div className="text-center -mt-4">
          <p className="text-3xl font-bold text-gray-800 tracking-tight">{percentage}%</p>
        </div>
        <div className="text-center bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl shadow-sm px-4 py-3 w-full border border-yellow-100">
          <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
          <p className="text-xs text-gray-600">
            <span className="font-bold text-yellow-600">{converted}</span> converted of{" "}
            <span className="font-bold text-gray-700">{total}</span> total
          </p>
        </div>
      </div>
    );
  };

  const MainStatCard = ({
    title,
    amount,
    count,
    percentage,
    loading,
    gradient,
  }) => (
    <div
      className={`${gradient} rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-sm`}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-5 w-32 bg-white/20 animate-pulse rounded"></div>
          <div className="h-10 w-40 bg-white/30 animate-pulse rounded-lg"></div>
          <div className="h-4 w-24 bg-white/20 animate-pulse rounded"></div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <p className="text-sm font-semibold text-white/90 uppercase tracking-wider">
              {title}
            </p>
          </div>
          <div className="flex-grow flex items-center">
            <p className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-none drop-shadow-lg">
              {amount}
            </p>
          </div>
          {percentage !== undefined && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-white/20 backdrop-blur-sm">
                {percentage}% of portfolio
              </span>
            </div>
          )}
          <div className="mt-5 pt-4 border-t border-white/30">
            <p className="text-sm font-bold text-white/95 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {count}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const OverviewSection = ({ title, children, onViewAll }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></span>
          {title}
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition duration-200 group"
          >
            View All
            <svg
              className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
      {children}
    </div>
  );

  const ProgressBar = ({ label, value, total, type }) => {
    const percentage = total ? Math.round((value / total) * 100) : value;
    const getGradient = () => {
      if (percentage >= 80) return "from-green-500 to-emerald-600";
      if (percentage >= 50) return "from-yellow-500 to-orange-500";
      return "from-red-500 to-pink-600";
    };

    return (
      <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-shadow">
        <p className="text-2xl font-bold text-gray-800">
          {total ? `Ksh ${value.toLocaleString()}` : `${value}%`}
        </p>
        {total && (
          <p className="text-xs text-gray-500 mt-1">
            of Ksh {total.toLocaleString()}
          </p>
        )}
        <p className="text-sm text-gray-700 font-medium mt-3 mb-3">{label}</p>
        <div className="relative mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getGradient()} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <p className="text-xs font-semibold text-gray-600 mt-2">
          {percentage}% Complete
        </p>
      </div>
    );
  };

  if (loading && !userRegion && !userBranch && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 bg-indigo-100 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-8 text-xl text-gray-700 font-semibold">
            Loading dashboard...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we fetch your data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      {/* ✅ Hide filter dropdowns for relationship_officer */}
      {userRole !== "relationship_officer" && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {(userRole === "credit_analyst_officer" ||
                userRole === "customer_service_officer") && (
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 cursor-pointer hover:border-indigo-300"
                >
                  <option value="all">All Regions</option>
                  {availableRegions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              )}

              {(userRole === "regional_manager" ||
                userRole === "credit_analyst_officer" ||
                userRole === "customer_service_officer") && (
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 cursor-pointer hover:border-indigo-300"
                >
                  <option value="all">
                    {userRole === "regional_manager"
                      ? "All Branches in Region"
                      : "All Branches"}
                  </option>
                  {availableBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={selectedRO}
                onChange={(e) => setSelectedRO(e.target.value)}
                className="bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 cursor-pointer hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  (userRole === "regional_manager" && selectedBranch === "all") ||
                  (userRole === "credit_analyst_officer" &&
                    selectedBranch === "all") ||
                  (userRole === "customer_service_officer" &&
                    selectedBranch === "all")
                }
              >
                {availableROs.map((ro) => (
                  <option key={ro.id} value={ro.id}>
                    {ro.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the dashboard UI remains the same */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MainStatCard
          title="Outstanding Loan Balance"
          amount={`Ksh ${(
            dashboardMetrics?.outstandingBalance ?? 0
          ).toLocaleString()}`}
          count={`${(
            dashboardMetrics?.outstandingLoansCount ?? 0
          ).toLocaleString()} Active Loans`}
          loading={loading}
          gradient="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500"
        />
        <MainStatCard
          title="Clean Book"
          amount={`Ksh ${(
            dashboardMetrics?.cleanBookAmount ?? 0
          ).toLocaleString()}`}
          count={`${(
            dashboardMetrics?.performingLoansCount ?? 0
          ).toLocaleString()} Performing Loans`}
          percentage={dashboardMetrics?.cleanBookPercentage ?? 0}
          loading={loading}
          gradient="bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500"
        />
        <MainStatCard
          title="Total Customers"
          amount={(dashboardMetrics?.totalCustomers ?? 0).toLocaleString()}
          count={`${(
            dashboardMetrics?.totalCustomers ?? 0
          ).toLocaleString()} Registered`}
          loading={loading}
          gradient="bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-500"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <OverviewSection
          title="Customers Overview"
          onViewAll={handleViewCustomers}
        >
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-5 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
              <p className="text-4xl font-bold text-green-700">
                {dashboardMetrics.customerOverview.activeCustomers.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-2 font-semibold uppercase tracking-wide">
                Active
              </p>
            </div>
            <div className="text-center p-5 bg-gradient-to-br from-red-50 to-rose-100 rounded-xl border border-red-200 hover:shadow-md transition-shadow">
              <p className="text-4xl font-bold text-red-700">
                {dashboardMetrics.customerOverview.inactiveCustomers.toLocaleString()}
              </p>
              <p className="text-xs text-red-600 mt-2 font-semibold uppercase tracking-wide">
                Inactive
              </p>
            </div>
            <div className="text-center p-5 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-xl border border-indigo-200 hover:shadow-md transition-shadow">
              <p className="text-4xl font-bold text-indigo-700">
                {dashboardMetrics.customerOverview.newCustomersToday}
              </p>
              <p className="text-xs text-indigo-600 mt-2 font-semibold uppercase tracking-wide">
                New Today
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl border border-amber-200">
              <p className="text-2xl font-bold text-amber-700">
                {dashboardMetrics.customerOverview.leadsThisMonth}
              </p>
              <p className="text-xs text-amber-600 mt-1 font-semibold">
                Leads This Month
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200">
              <p className="text-2xl font-bold text-purple-700">
                {dashboardMetrics.customerOverview.leadsToday}
              </p>
              <p className="text-xs text-purple-600 mt-1 font-semibold">
                Leads Today
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <SemiCircularConverter
              percentage={
                dashboardMetrics.customerOverview.leadConversionRateMonth || 0
              }
              label="This Month Conversion"
              total={dashboardMetrics.customerOverview.totalThisMonth || 0}
              converted={
                dashboardMetrics.customerOverview.customersThisMonth || 0
              }
            />
            <SemiCircularConverter
              percentage={
                dashboardMetrics.customerOverview.leadConversionRateYear || 0
              }
              label="This Year Conversion"
              total={dashboardMetrics.customerOverview.totalThisYear || 0}
              converted={
                dashboardMetrics.customerOverview.customersThisYear || 0
              }
            />
          </div>
        </OverviewSection>

        <OverviewSection title="Loans Overview" onViewAll={handleViewLoans}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
              <span className="text-sm font-semibold text-gray-700">
                Disbursed Loans
              </span>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-700">
                  Ksh{" "}
                  {dashboardMetrics.loanOverview.disbursedLoansAmount.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  {dashboardMetrics.loanOverview.disbursedLoansCount.toLocaleString()}{" "}
                  loans
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <span className="text-sm font-semibold text-gray-700">
                  Disbursed Today
                </span>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-700">
                    {dashboardMetrics.loanOverview.disbursedLoansToday}
                  </p>
                  <p className="text-xs text-green-600 font-medium">loans</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
                <span className="text-sm font-semibold text-gray-700">
                  Disbursed This Month
                </span>
                <div className="text-right">
                  <p className="text-xl font-bold text-teal-700">
                    {dashboardMetrics.loanOverview.disbursedLoansThisMonth}
                  </p>
                  <p className="text-xs text-teal-600 font-medium">loans</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 hover:shadow-md transition-shadow">
              <span className="text-sm font-semibold text-gray-700">
                Loans Due Today
              </span>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-700">
                  {dashboardMetrics.loanOverview.loansDueToday.toLocaleString()}
                </p>
                <p className="text-xs text-amber-600 font-medium">due today</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-200 hover:shadow-md transition-shadow">
              <span className="text-sm font-semibold text-red-700">
                Month to Date Arrears
              </span>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-700">
                  Ksh{" "}
                  {dashboardMetrics.loanOverview.monthToDateArrears.toLocaleString()}
                </p>
                <p className="text-xs text-red-600 font-medium">in arrears</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100 hover:shadow-md transition-shadow">
              <span className="text-sm font-semibold text-gray-700">
                Total Loan Arrears
              </span>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-700">
                  Ksh{" "}
                  {dashboardMetrics.loanOverview.totalLoanArrears.toLocaleString()}
                </p>
                <p className="text-xs text-orange-600 font-medium">
                  outstanding
                </p>
              </div>
            </div>
          </div>
        </OverviewSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <OverviewSection title="Collections Overview">
          <div className="grid grid-cols-2 gap-4">
            <ProgressBar
              label="Today's Collection"
              value={dashboardMetrics.collectionOverview.todayCollectionAmount}
              total={dashboardMetrics.outstandingBalance}
            />
            <ProgressBar
              label="Monthly Collection"
              value={dashboardMetrics.collectionOverview.monthlyCollectionRate}
            />
            <ProgressBar
              label="Prepayment Rate"
              value={dashboardMetrics.collectionOverview.prepaymentRate}
            />
            <ProgressBar
              label="Portfolio at Risk"
              value={dashboardMetrics.collectionOverview.par}
            />
          </div>
        </OverviewSection>

        <OverviewSection title="Pending Actions">
          <div className="space-y-3">
            <div
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl cursor-pointer hover:shadow-md hover:scale-102 transition-all border border-gray-200"
              onClick={handleCustomerApprovals}
            >
              <span className="text-sm font-semibold text-gray-700">
                Customer Approvals
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-indigo-600">
                  {dashboardMetrics.pendingActions.pendingCustomerApprovals}
                </span>
                <svg
                  className="w-5 h-5 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            <div
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl cursor-pointer hover:shadow-md hover:scale-102 transition-all border border-gray-200"
              onClick={handlePendingAmendments}
            >
              <span className="text-sm font-semibold text-gray-700">
                Customer Amendments
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-purple-600">
                  {dashboardMetrics.pendingActions.pendingAmends}
                </span>
                <svg
                  className="w-5 h-5 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl cursor-pointer hover:shadow-md hover:scale-102 transition-all border border-gray-200">
              <span className="text-sm font-semibold text-gray-700">
                Limit Approvals
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-blue-600">
                  {dashboardMetrics.pendingActions.pendingLimitApprovals}
                </span>
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            <div
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl cursor-pointer hover:shadow-md hover:scale-102 transition-all border border-gray-200"
              onClick={handlePendingBMLoans}
            >
              <span className="text-sm font-semibold text-gray-700">
                Loan Approvals
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-green-600">
                  {dashboardMetrics.pendingActions.pendingBMLoanApprovals}
                </span>
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            <div
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl cursor-pointer hover:shadow-md hover:scale-102 transition-all border border-gray-200"
              onClick={handlePendingRMLoans}
            >
              <span className="text-sm font-semibold text-gray-700">
                RM Loan Approvals
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-orange-600">
                  {dashboardMetrics.pendingActions.pendingRMLoanApprovals}
                </span>
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            <div
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl cursor-pointer hover:shadow-md hover:scale-102 transition-all border border-gray-200"
              onClick={handlePendingDisbursement}
            >
              <span className="text-sm font-semibold text-gray-700">
                Pending Disbursement
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-rose-600">
                  {dashboardMetrics.pendingActions.pendingDisbursement}
                </span>
                <svg
                  className="w-5 h-5 text-rose-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </OverviewSection>
      </div>
      <OverviewSection title="Recent Activity">
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">
                No recent activity to display
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Activity will appear here as loans are processed
              </p>
            </div>
          ) : (
            recentActivity
              .slice(0, 5) // ✅ Limit to the 5 most recent activities
              .map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 group cursor-pointer"
                >
                  <div
                    className={`${activity.iconBg} rounded-full p-3 mr-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {activity.message}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">
                        {activity.time}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm font-medium text-green-600">
                        {activity.amount}
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              ))
          )}
        </div>
      </OverviewSection>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></span>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            onClick={handleViewCustomers}
            className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-indigo-200 hover:scale-105 transition-all duration-300 group text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">
              Manage Customers
            </span>
          </button>

          <button
            onClick={handleViewLoans}
            className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-green-200 hover:scale-105 transition-all duration-300 group text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600 transition-colors">
              View Loans
            </span>
          </button>

          <button
            onClick={handlePendingBMLoans}
            className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 hover:scale-105 transition-all duration-300 group text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
              BM Approvals (
              {dashboardMetrics.pendingActions.pendingBMLoanApprovals})
            </span>
          </button>

          <button
            onClick={handlePendingRMLoans}
            className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-200 hover:scale-105 transition-all duration-300 group text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">
              RM Approvals (
              {dashboardMetrics.pendingActions.pendingRMLoanApprovals})
            </span>
          </button>

          <button
            onClick={handlePendingDisbursement}
            className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-amber-200 hover:scale-105 transition-all duration-300 group text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-amber-600 transition-colors">
              Disburse ({dashboardMetrics.pendingActions.pendingDisbursement})
            </span>
          </button>

          <button
            onClick={handleCustomerApprovals}
            className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-rose-200 hover:scale-105 transition-all duration-300 group text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-rose-600 transition-colors">
              Approvals (
              {dashboardMetrics.pendingActions.pendingCustomerApprovals})
            </span>
          </button>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center text-gray-600 mb-4 md:mb-0">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium">
              System Status: Operational
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Last updated:{" "}
            {new Date().toLocaleString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
