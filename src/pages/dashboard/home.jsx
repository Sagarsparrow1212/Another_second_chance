import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { getAuthToken, authenticatedFetch } from "@/utils/api";
import { API_BASE_URL_V1 } from "@/configs/api";
import {
  Users,
  Building2,
  Store,
  HeartHandshake,
  ArrowRight,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Briefcase,
  DollarSign,
  UserCheck,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Chart from "react-apexcharts";

export function Home() {
  const navigate = useNavigate();

  // Core metrics state
  const [usersStats, setUsersStats] = useState({
    organizations: 0,
    merchants: 0,
    donors: 0,
    homeless: 0,
    insights: {
      pendingOrganizations: 0,
      totalDonations: 0,
      totalDonationsCount: 0,
      recentOrganizations: 0,
      recentMerchants: 0,
    },
  });

  // Analytics & Activity state
  const [daysFilter, setDaysFilter] = useState(30);
  const [activityTrends, setActivityTrends] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [activityCategoryFilter, setActivityCategoryFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Fetch Dashboard Summary Stats
  const fetchUsersStats = useCallback(async (signal) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const response = await authenticatedFetch(`${API_BASE_URL_V1}/dashboard/stats`, {
        method: "GET",
        signal,
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.success && isMountedRef.current) {
        const stats = data.data?.stats || data.data;
        setUsersStats({
          organizations: stats.organizations || 0,
          merchants: stats.merchants || 0,
          donors: stats.donors || 0,
          homeless: stats.homeless || 0,
          insights: stats.insights || {
            pendingOrganizations: 0,
            totalDonations: 0,
            totalDonationsCount: 0,
            recentOrganizations: 0,
            recentMerchants: 0,
          },
        });
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Dashboard stats error:", error);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  // Fetch Activity Trends (filtered by selected days: 7, 30, 90)
  const fetchActivityTrends = useCallback(async (days, signal) => {
    try {
      setTrendsLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const trendsRes = await authenticatedFetch(
        `${API_BASE_URL_V1}/analytics/trends?days=${days}&groupBy=day`,
        { signal }
      );

      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        if (trendsData.success && isMountedRef.current) {
          setActivityTrends(trendsData.data?.trends || []);
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Fetch trends error:", err);
      }
    } finally {
      if (isMountedRef.current) setTrendsLoading(false);
    }
  }, []);

  // Fetch Live Activity Feed
  const fetchRecentActivities = useCallback(async (signal) => {
    try {
      setActivitiesLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const activitiesRes = await authenticatedFetch(
        `${API_BASE_URL_V1}/analytics/activities?limit=15`,
        { signal }
      );

      if (activitiesRes.ok) {
        const actData = await activitiesRes.json();
        if (actData.success && isMountedRef.current) {
          setRecentActivities(actData.data?.activities || []);
          setActivitiesTotal(
            actData.data?.pagination?.totalItems ||
            actData.data?.pagination?.total ||
            (actData.data?.activities || []).length
          );
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Fetch activities error:", err);
      }
    } finally {
      if (isMountedRef.current) setActivitiesLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    fetchUsersStats(signal);
    fetchActivityTrends(daysFilter, signal);
    fetchRecentActivities(signal);

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchUsersStats, fetchActivityTrends, fetchRecentActivities, daysFilter]);

  // Manual Refresh Handler
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const controller = new AbortController();
    await Promise.all([
      fetchUsersStats(controller.signal),
      fetchActivityTrends(daysFilter, controller.signal),
      fetchRecentActivities(controller.signal),
    ]);
    if (isMountedRef.current) setIsRefreshing(false);
  };

  // 1. Primary Summary Cards
  const platformCards = [
    {
      title: "Organizations",
      value: loading ? "..." : usersStats.organizations.toLocaleString(),
      label: "registered",
      description: "Verified non-profit partners",
      icon: <Building2 className="w-4 h-4 text-[#2878E5]" />,
      badgeBg: "bg-enterprise-softBlue border-[#2878E5]/20",
      accent: "#2878E5",
      path: "/dashboard/organizations",
    },
    {
      title: "Merchants",
      value: loading ? "..." : usersStats.merchants.toLocaleString(),
      label: "active vendors",
      description: "Local employment & retail vendors",
      icon: <Store className="w-4 h-4 text-emerald-600" />,
      badgeBg: "bg-emerald-50 border-emerald-200/60",
      accent: "#10B981",
      path: "/dashboard/merchants",
    },
    {
      title: "Donors",
      value: loading ? "..." : usersStats.donors.toLocaleString(),
      label: "supporters",
      description: "Active community contributors",
      icon: <HeartHandshake className="w-4 h-4 text-amber-600" />,
      badgeBg: "bg-amber-50 border-amber-200/60",
      accent: "#F59E0B",
      path: "/dashboard/donors",
    },
    {
      title: "Homeless Individuals",
      value: loading ? "..." : usersStats.homeless.toLocaleString(),
      label: "supported",
      description: "Registered & assisted individuals",
      icon: <Users className="w-4 h-4 text-purple-600" />,
      badgeBg: "bg-purple-50 border-purple-200/60",
      accent: "#8B5CF6",
      path: "/dashboard/homeless",
    },
  ];

  // 2. Computed totals for the Activity Trends section
  const trendMetrics = useMemo(() => {
    if (!activityTrends || activityTrends.length === 0) {
      return { total: 0, success: 0, failed: 0 };
    }
    const total = activityTrends.reduce((acc, curr) => acc + (curr.count || 0), 0);
    const success = activityTrends.reduce((acc, curr) => acc + (curr.success || 0), 0);
    const failed = activityTrends.reduce((acc, curr) => acc + (curr.failure || curr.error || 0), 0);
    return { total, success, failed };
  }, [activityTrends]);

  // 3. Activity Trends ApexChart Configuration
  const chartConfig = useMemo(() => {
    if (!activityTrends || activityTrends.length === 0) return null;

    return {
      type: "area",
      height: 290,
      series: [
        {
          name: "Total Activities",
          data: activityTrends.map((t) => t.count || 0),
        },
        {
          name: "Successful",
          data: activityTrends.map((t) => t.success || 0),
        },
      ],
      options: {
        chart: {
          toolbar: { show: false },
          fontFamily: '"Plus Jakarta Sans", Inter, -apple-system, sans-serif',
          background: "transparent",
          zoom: { enabled: false },
        },
        colors: ["#2878E5", "#10B981"],
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.22,
            opacityTo: 0.02,
            stops: [0, 90, 100],
          },
        },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2.2 },
        markers: {
          size: activityTrends.length <= 14 ? 3.5 : 0,
          strokeWidth: 2,
          hover: { size: 5 },
        },
        xaxis: {
          type: "category",
          categories: activityTrends.map((t) => {
            if (!t?.date) return "";
            const cleanStr = typeof t.date === "string" ? t.date.trim().replace(" ", "T") : t.date;
            const parsed = new Date(cleanStr);
            if (!isNaN(parsed.getTime())) {
              return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
            return String(t.date);
          }),
          labels: {
            style: { colors: "#98A2B3", fontSize: "11px", fontWeight: 500 },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: "#98A2B3", fontSize: "11px" },
            formatter: (val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${Math.round(val)}`),
          },
        },
        legend: {
          position: "top",
          horizontalAlign: "right",
          fontSize: "12px",
          fontWeight: 600,
          labels: { colors: "#172033" },
          markers: { radius: 12, width: 8, height: 8 },
        },
        grid: {
          borderColor: "#E7ECF2",
          strokeDashArray: 3,
          padding: { left: 10, right: 10, top: 0, bottom: 0 },
        },
        tooltip: {
          theme: "light",
          style: { fontSize: "12px", fontFamily: '"Plus Jakarta Sans", sans-serif' },
          x: {
            formatter: (val, { dataPointIndex }) => {
              const item = activityTrends[dataPointIndex];
              if (!item?.date) return val || "Platform Activity";
              const cleanStr = typeof item.date === "string" ? item.date.trim().replace(" ", "T") : item.date;
              const parsed = new Date(cleanStr);
              if (!isNaN(parsed.getTime())) {
                return parsed.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }
              return String(item.date);
            },
          },
        },
      },
    };
  }, [activityTrends]);

  // 4. Operational Insights Items
  const operationalInsights = [
    {
      title: "Pending Org Approvals",
      value: usersStats.insights?.pendingOrganizations ?? 0,
      unit: "requires review",
      description: "Submitted organizations awaiting verification",
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      badgeBg: "bg-amber-50 border-amber-200/60",
      path: "/dashboard/organizations",
      alert: (usersStats.insights?.pendingOrganizations || 0) > 0,
    },
    {
      title: "Total Contributions",
      value: `$${(usersStats.insights?.totalDonations || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      unit: `${usersStats.insights?.totalDonationsCount || 0} donations`,
      description: "Direct community impact disbursements",
      icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
      badgeBg: "bg-emerald-50 border-emerald-200/60",
      path: "/dashboard/donors",
      alert: false,
    },
    {
      title: "Recent Organizations",
      value: usersStats.insights?.recentOrganizations ?? 0,
      unit: "last 30 days",
      description: "Newly onboarded partner facilities",
      icon: <Building2 className="w-4 h-4 text-[#2878E5]" />,
      badgeBg: "bg-enterprise-softBlue border-[#2878E5]/20",
      path: "/dashboard/organizations",
      alert: false,
    },
    {
      title: "Recent Merchants",
      value: usersStats.insights?.recentMerchants ?? 0,
      unit: "last 30 days",
      description: "Newly registered retail & job partners",
      icon: <Store className="w-4 h-4 text-purple-600" />,
      badgeBg: "bg-purple-50 border-purple-200/60",
      path: "/dashboard/merchants",
      alert: false,
    },
  ];

  // Helper for activity icon & role badge
  const getActivityContext = (activity) => {
    const rawRole = (activity.actorRole || "").toLowerCase();
    const rawSec = (activity.section || activity.module || "").toLowerCase();
    const rawType = (activity.targetType || "").toLowerCase();
    const rawTitle = (activity.title || "").toLowerCase();

    if (rawSec.includes("org") || rawType.includes("org") || rawRole === "organization" || rawTitle.includes("organization")) {
      return {
        icon: <Building2 className="w-3.5 h-3.5 text-[#2878E5]" />,
        iconBg: "bg-enterprise-softBlue border-[#2878E5]/20",
        tag: "Organization",
        tagClass: "bg-blue-50 text-[#2878E5] border-blue-200/60",
      };
    }
    if (rawSec.includes("merch") || rawType.includes("merch") || rawRole === "merchant" || rawTitle.includes("merchant")) {
      return {
        icon: <Store className="w-3.5 h-3.5 text-emerald-600" />,
        iconBg: "bg-emerald-50 border-emerald-200/60",
        tag: "Merchant",
        tagClass: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
      };
    }
    if (rawSec.includes("donor") || rawType.includes("donor") || rawRole === "donor" || rawTitle.includes("donor") || rawTitle.includes("donation")) {
      return {
        icon: <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />,
        iconBg: "bg-amber-50 border-amber-200/60",
        tag: "Donor",
        tagClass: "bg-amber-50 text-amber-700 border-amber-200/60",
      };
    }
    if (rawSec.includes("home") || rawType.includes("home") || rawRole === "homeless" || rawTitle.includes("homeless") || rawTitle.includes("beneficiary")) {
      return {
        icon: <Users className="w-3.5 h-3.5 text-purple-600" />,
        iconBg: "bg-purple-50 border-purple-200/60",
        tag: "Homeless",
        tagClass: "bg-purple-50 text-purple-700 border-purple-200/60",
      };
    }
    if (rawSec.includes("job") || rawType.includes("job") || rawTitle.includes("job") || rawTitle.includes("employment")) {
      return {
        icon: <Briefcase className="w-3.5 h-3.5 text-sky-600" />,
        iconBg: "bg-sky-50 border-sky-200/60",
        tag: "Job",
        tagClass: "bg-sky-50 text-sky-700 border-sky-200/60",
      };
    }
    return {
      icon: <Sparkles className="w-3.5 h-3.5 text-slate-600" />,
      iconBg: "bg-slate-100 border-slate-200",
      tag: "System",
      tagClass: "bg-slate-100 text-slate-700 border-slate-200",
    };
  };

  // Filtered activity logs
  const filteredActivities = useMemo(() => {
    if (activityCategoryFilter === "all") return recentActivities;
    return recentActivities.filter((act) => {
      const ctx = getActivityContext(act);
      return ctx.tag.toLowerCase() === activityCategoryFilter.toLowerCase();
    });
  }, [recentActivities, activityCategoryFilter]);

  return (
    <div className="space-y-6 min-w-0 w-full max-w-full">
      {/* ======================================================== */}
      {/* 1. DASHBOARD HEADER                                      */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-[#E7ECF2] shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-enterprise-textPrimary tracking-tight">
              Platform Overview
            </h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-enterprise-textSecondary mt-0.5">
            Real-time analytics and user management metrics across Another Second Chance
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Live Sync Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F7F9FC] border border-[#E7ECF2] text-enterprise-textPrimary">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-enterprise-textSecondary font-normal hidden sm:inline">Status:</span>
            <span>Live Sync</span>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh dashboard metrics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E7ECF2] text-enterprise-textPrimary hover:bg-slate-50 transition-colors disabled:opacity-60 shadow-subtle"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#2878E5] ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PLATFORM OVERVIEW SUMMARY CARDS                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
        {platformCards.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.path)}
            className="group relative bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated hover:border-[#2878E5]/40 transition-all duration-200 cursor-pointer flex flex-col justify-between min-w-0"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
                  {card.title}
                </span>
                <div
                  className={`p-2 rounded-lg border flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${card.badgeBg}`}
                >
                  {card.icon}
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-enterprise-textPrimary tracking-tight">
                  {card.value}
                </span>
                <span className="text-xs text-enterprise-muted font-medium">
                  {card.label}
                </span>
              </div>

              <p className="text-xs text-enterprise-textSecondary mt-1 line-clamp-1">
                {card.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E7ECF2]/80 flex items-center justify-between text-xs font-medium text-[#2878E5] group-hover:translate-x-0.5 transition-transform">
              <span>View details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 3. ACTIVITY TRENDS ANALYTICS                             */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card space-y-4">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E7ECF2]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-enterprise-textPrimary tracking-tight">
                Activity Trends
              </h2>
              <span className="text-xs text-enterprise-muted">•</span>
              <span className="text-xs font-medium text-enterprise-textSecondary">
                Last {daysFilter} Days
              </span>
            </div>
            <p className="text-xs text-enterprise-textSecondary mt-0.5">
              Daily platform activity and successful operational events across all modules
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Days Filter Pills */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F7F9FC] border border-[#E7ECF2]">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysFilter(d)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    daysFilter === d
                      ? "bg-white text-[#2878E5] shadow-subtle border border-[#E7ECF2]"
                      : "text-enterprise-muted hover:text-enterprise-textPrimary"
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate("/dashboard/analytics")}
              className="text-xs font-semibold text-[#2878E5] hover:underline flex items-center gap-1 pl-1"
            >
              Detailed Analytics
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compact Summary Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#F7F9FC] border border-[#E7ECF2]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-enterprise-muted">
              Total Activities
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-enterprise-textPrimary">
                {trendsLoading ? "..." : trendMetrics.total.toLocaleString()}
              </span>
              <span className="text-[11px] text-enterprise-muted">events</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Successful
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-emerald-700">
                {trendsLoading ? "..." : trendMetrics.success.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">completed</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-lg bg-slate-50 border border-[#E7ECF2]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-enterprise-muted">
              Success Rate
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-enterprise-textPrimary">
                {trendMetrics.total > 0
                  ? `${((trendMetrics.success / trendMetrics.total) * 100).toFixed(1)}%`
                  : "100%"}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">healthy</span>
            </div>
          </div>
        </div>

        {/* Chart View or Clean Empty State */}
        {trendsLoading ? (
          <div className="h-[290px] flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-3 border-[#2878E5] border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-enterprise-muted">Loading activity analytics...</p>
          </div>
        ) : chartConfig && activityTrends.length > 0 ? (
          <div className="min-w-0 w-full overflow-hidden">
            <Chart
              options={chartConfig.options}
              series={chartConfig.series}
              type={chartConfig.type}
              height={chartConfig.height}
            />
          </div>
        ) : (
          <div className="h-[240px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E7ECF2] rounded-xl bg-[#F7F9FC]">
            <Activity className="w-8 h-8 text-enterprise-muted mb-2 opacity-60" />
            <h3 className="text-sm font-semibold text-enterprise-textPrimary">
              No Activity Recorded in Last {daysFilter} Days
            </h3>
            <p className="text-xs text-enterprise-textSecondary max-w-sm mt-1">
              Platform activities, authentication events, and donations will be plotted here in real-time.
            </p>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. OPERATIONAL INSIGHTS                                  */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-enterprise-textPrimary tracking-tight">
              Operational Insights
            </h2>
            <p className="text-xs text-enterprise-textSecondary">
              Administrative pulse and platform compliance checkpoints
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
          {operationalInsights.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-xl border border-[#E7ECF2] p-4.5 sm:p-5 shadow-card hover:shadow-elevated hover:border-[#2878E5]/30 transition-all duration-200 cursor-pointer flex flex-col justify-between min-w-0 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-semibold text-enterprise-muted uppercase tracking-wider line-clamp-1">
                    {item.title}
                  </span>
                  <div
                    className={`p-2 rounded-lg border flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${item.badgeBg}`}
                  >
                    {item.icon}
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-bold text-enterprise-textPrimary tracking-tight">
                    {item.value}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      item.alert ? "text-amber-600 font-semibold" : "text-enterprise-muted"
                    }`}
                  >
                    {item.unit}
                  </span>
                </div>

                <p className="text-xs text-enterprise-textSecondary mt-1 line-clamp-1">
                  {item.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#E7ECF2]/80 flex items-center justify-between text-xs font-medium text-enterprise-textSecondary group-hover:text-[#2878E5] transition-colors">
                <span>Manage module</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. RECENT ACTIVITY FEED                                  */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-[#E7ECF2] shadow-card overflow-hidden">
        {/* Feed Header */}
        <div className="px-5 py-4 border-b border-[#E7ECF2] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-enterprise-textPrimary tracking-tight">
                Recent Activity
              </h2>
              <span className="text-xs text-enterprise-muted">•</span>
              <span className="text-xs text-enterprise-muted">
                {activitiesTotal.toLocaleString()} total platform logs
              </span>
            </div>
            <p className="text-xs text-enterprise-textSecondary mt-0.5">
              Live audit trail of operations, registrations, and administrative events
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Category Filter Pills */}
            <div className="hidden md:inline-flex items-center p-0.5 rounded-lg bg-[#F7F9FC] border border-[#E7ECF2] text-xs">
              {["all", "organization", "merchant", "donor", "homeless"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActivityCategoryFilter(cat)}
                  className={`px-2.5 py-1 font-semibold rounded-md capitalize transition-all ${
                    activityCategoryFilter === cat
                      ? "bg-white text-[#2878E5] shadow-subtle border border-[#E7ECF2]"
                      : "text-enterprise-muted hover:text-enterprise-textPrimary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate("/dashboard/analytics")}
              className="text-xs font-semibold text-[#2878E5] hover:underline flex items-center gap-1"
            >
              View Full Audit Trail
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feed Items */}
        {activitiesLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-[#2878E5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-enterprise-muted">Streaming activity logs...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-xs text-enterprise-muted">
            No activity events found for the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-[#E7ECF2]">
            {filteredActivities.slice(0, 7).map((activity, idx) => {
              const title =
                activity.title ||
                `${activity.section || activity.module || "System"}: ${activity.actionType || activity.action || "Event"}`;
              const description = activity.description || "";
              const timestamp = activity.activityTime || activity.timestamp || activity.createdAt;
              const actor = activity.actorEmail || activity.actorId?.email || activity.userEmail || "System";
              const status = (activity.status || "SUCCESS").toUpperCase();
              const context = getActivityContext(activity);

              return (
                <div
                  key={activity.id || activity._id || idx}
                  className="px-5 py-3.5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border mt-0.5 sm:mt-0 ${context.iconBg}`}
                    >
                      {context.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-enterprise-textPrimary tracking-tight">
                          {title}
                        </p>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border ${context.tagClass}`}
                        >
                          {context.tag}
                        </span>
                        {status === "FAILED" || status === "ERROR" ? (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                            Failed
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-enterprise-textSecondary mt-0.5">
                        {description && (
                          <span className="truncate max-w-md">{description}</span>
                        )}
                        {description && actor && <span>•</span>}
                        {actor && (
                          <span className="text-enterprise-muted font-medium truncate">
                            by {actor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Timestamp */}
                  <div className="flex items-center gap-2 text-right flex-shrink-0 self-end sm:self-center pl-11 sm:pl-0">
                    <span className="text-[11px] text-enterprise-muted flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {timestamp
                        ? new Date(timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
