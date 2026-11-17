import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Calendar,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { API_BASE_URL_V1 } from "@/configs/api";
import { authenticatedFetch } from "@/utils/api";
import Chart from "react-apexcharts";

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [featureUsage, setFeatureUsage] = useState([]);
  const [heatmapData, setHeatmapData] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [dateRange, setDateRange] = useState("30"); // days
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate date range
  const getDateRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  // Fetch analytics data
  const fetchAnalyticsData = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else if (!overview) setLoading(true);
      setError(null);
      const { startDate, endDate } = getDateRange(dateRange);

      const [overviewRes, trendsRes, featuresRes, heatmapRes, activitiesRes, usersRes] =
        await Promise.all([
          authenticatedFetch(
            `${API_BASE_URL_V1}/analytics/overview?startDate=${startDate}&endDate=${endDate}`
          ),
          authenticatedFetch(
            `${API_BASE_URL_V1}/analytics/trends?startDate=${startDate}&endDate=${endDate}&groupBy=day`
          ),
          authenticatedFetch(
            `${API_BASE_URL_V1}/analytics/features?startDate=${startDate}&endDate=${endDate}`
          ),
          authenticatedFetch(
            `${API_BASE_URL_V1}/analytics/heatmap?startDate=${startDate}&endDate=${endDate}`
          ),
          authenticatedFetch(`${API_BASE_URL_V1}/analytics/activities?limit=20`),
          authenticatedFetch(
            `${API_BASE_URL_V1}/analytics/users?startDate=${startDate}&endDate=${endDate}`
          ),
        ]);

      if (!overviewRes.ok) {
        const errorData = await overviewRes.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch analytics: ${overviewRes.status}`
        );
      }

      const [
        overviewData,
        trendsData,
        featuresData,
        heatmapDataRes,
        activitiesData,
        usersData,
      ] = await Promise.all([
        overviewRes.json(),
        trendsRes.json().catch(() => ({ success: false })),
        featuresRes.json().catch(() => ({ success: false })),
        heatmapRes.json().catch(() => ({ success: false })),
        activitiesRes.json().catch(() => ({ success: false })),
        usersRes.json().catch(() => ({ success: false })),
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (trendsData.success) setTrends(trendsData.data?.trends || []);
      if (featuresData.success) setFeatureUsage(featuresData.data?.features || []);
      if (heatmapDataRes.success) setHeatmapData(heatmapDataRes.data?.heatmap || {});
      if (activitiesData.success)
        setRecentActivities(activitiesData.data?.activities || []);
      if (usersData.success) setUserStats(usersData.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(
        err.message ||
          "Failed to load analytics data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, dateRange]);

  // Prepare chart data
  const trendsChartData = useMemo(() => {
    if (!trends.length) return null;

    return {
      options: {
        chart: {
          type: "area",
          toolbar: { show: false },
          fontFamily: "inherit",
        },
        dataLabels: { enabled: false },
        xaxis: {
          type: "category",
          categories: trends.map((t) => {
            if (!t?.date) return "";
            const cleanStr =
              typeof t.date === "string" ? t.date.trim().replace(" ", "T") : t.date;
            const parsed = new Date(cleanStr);
            if (!isNaN(parsed.getTime())) {
              return parsed.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }
            return String(t.date);
          }),
          labels: {
            style: { colors: "#64748B", fontSize: "11px", fontWeight: 500 },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: "#64748B", fontSize: "11px", fontWeight: 500 },
          },
        },
        grid: {
          borderColor: "#F1F5F9",
          strokeDashArray: 3,
        },
        tooltip: {
          theme: "light",
          x: {
            formatter: (val, { dataPointIndex }) => {
              const item = trends[dataPointIndex];
              if (!item?.date) return val || "Date";
              const cleanStr =
                typeof item.date === "string"
                  ? item.date.trim().replace(" ", "T")
                  : item.date;
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
        colors: ["#2878E5", "#10B981", "#EF4444"],
        legend: {
          position: "top",
          horizontalAlign: "right",
          fontSize: "12px",
          fontWeight: 600,
        },
        stroke: {
          curve: "smooth",
          width: 2,
        },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.25,
            opacityTo: 0.02,
            stops: [0, 90, 100],
          },
        },
      },
      series: [
        {
          name: "Total",
          data: trends.map((t) => t.count),
        },
        {
          name: "Success",
          data: trends.map((t) => t.success),
        },
        {
          name: "Failure",
          data: trends.map((t) => t.failure),
        },
      ],
    };
  }, [trends]);

  const moduleActivityChartData = useMemo(() => {
    if (!overview?.moduleActivity?.length) return null;

    return {
      options: {
        chart: {
          type: "bar",
          toolbar: { show: false },
          fontFamily: "inherit",
        },
        xaxis: {
          categories: overview.moduleActivity.map((m) => m.module),
          labels: {
            style: { colors: "#64748B", fontSize: "11px", fontWeight: 500 },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: "#64748B", fontSize: "11px", fontWeight: 500 },
          },
        },
        grid: {
          borderColor: "#F1F5F9",
          strokeDashArray: 3,
        },
        colors: ["#2878E5"],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "45%",
            borderRadius: 6,
          },
        },
        dataLabels: { enabled: false },
      },
      series: [
        {
          name: "Activities",
          data: overview.moduleActivity.map((m) => m.total),
        },
      ],
    };
  }, [overview]);

  const statusPieChartData = useMemo(() => {
    if (!overview) return null;

    return {
      options: {
        chart: {
          type: "donut",
          fontFamily: "inherit",
        },
        labels: ["Success", "Failure", "Error"],
        colors: ["#10B981", "#F59E0B", "#EF4444"],
        legend: {
          position: "bottom",
          fontSize: "12px",
          fontWeight: 500,
        },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: "70%",
            },
          },
        },
      },
      series: [
        overview.overview.successCount,
        overview.overview.failureCount,
        overview.overview.errorCount,
      ],
    };
  }, [overview]);

  const roleActivityChartData = useMemo(() => {
    if (!overview?.roleActivity?.length) return null;

    return {
      options: {
        chart: {
          type: "donut",
          fontFamily: "inherit",
        },
        labels: overview.roleActivity.map((r) => r.role),
        colors: ["#2878E5", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"],
        legend: {
          position: "bottom",
          fontSize: "12px",
          fontWeight: 500,
        },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: "70%",
            },
          },
        },
      },
      series: overview.roleActivity.map((r) => r.count),
    };
  }, [overview]);

  if (loading && !overview) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-9 h-9 border-3 border-[#2878E5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading intelligence data...</p>
          <p className="text-xs text-slate-400 mt-1">Aggregating real-time platform telemetry</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-6 rounded-2xl bg-white border border-rose-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Error Loading Analytics
            </h3>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <button
              onClick={() => fetchAnalyticsData(true)}
              className="px-4 py-2 rounded-xl bg-[#2878E5] hover:bg-[#1D65CE] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-10">
      
      {/* =========================================================================
          TOP HEADER & CONTROLS (Harmonized, Clean & Enterprise-Grade)
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#101B35] tracking-tight">
            Analytics & System Intelligence
          </h1>
          <p className="text-xs text-[#64748B] mt-1 font-normal">
            Real-time telemetry, audit trails, and platform activity intelligence
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Custom Date Range Select */}
          <div className="relative inline-flex items-center">
            <Calendar className="w-4 h-4 text-[#64748B] absolute left-3 pointer-events-none" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-10 pl-9 pr-8 text-xs font-semibold text-[#1E293B] bg-white border border-[#CBD5E1] rounded-xl hover:border-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2878E5]/20 focus:border-[#2878E5] transition-all cursor-pointer shadow-sm appearance-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <div className="absolute right-2.5 pointer-events-none text-[#64748B]">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`h-10 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
              autoRefresh
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-white text-[#64748B] border-[#CBD5E1] hover:bg-slate-50 hover:text-[#1E293B]"
            } shadow-sm`}
            title="Toggle periodic background telemetry sync"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
              }`}
            />
            <span>{autoRefresh ? "Auto-refresh: ON" : "Auto-refresh: OFF"}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchAnalyticsData(true)}
            disabled={isRefreshing}
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-[#CBD5E1] hover:border-[#94A3B8] text-xs font-semibold text-[#1E293B] flex items-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#2878E5] ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          KEY TELEMETRY METRIC CARDS
          ========================================================================= */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Activities */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Total Activities
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2878E5] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#101B35] tracking-tight">
              {overview.overview.totalActivities.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#64748B] mt-1 font-medium">
              Audit events in selected window
            </p>
          </div>

          {/* 2. Success Rate */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Success Rate
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">
              {overview.overview.successRate}%
            </div>
            <p className="text-[11px] text-[#64748B] mt-1 font-medium">
              {overview.overview.successCount.toLocaleString()} successful operations
            </p>
          </div>

          {/* 3. Active Users */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Active Users
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#101B35] tracking-tight">
              {overview.users.active}
            </div>
            <p className="text-[11px] text-[#64748B] mt-1 font-medium">
              Unique actors in ecosystem
            </p>
          </div>

          {/* 4. Avg Response Time */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Avg Latency
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#101B35] tracking-tight">
              {overview.performance.avgResponseTime}ms
            </div>
            <p className="text-[11px] text-[#64748B] mt-1 font-medium">
              Average API execution time
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          CHARTS SECTION (Activity Trends & Status Distribution)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trends Over Time */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#101B35]">Activity Trends</h2>
              <p className="text-xs text-[#64748B]">Volume of actions logged per day</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 text-[#64748B]">
              <TrendingUp className="w-4 h-4 text-[#2878E5]" />
            </div>
          </div>
          {trendsChartData ? (
            <Chart
              options={trendsChartData.options}
              series={trendsChartData.series}
              type="area"
              height={280}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-xs text-slate-400">
              No trend data available for this range
            </div>
          )}
        </div>

        {/* Status Distribution Donut */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#101B35]">Outcome Distribution</h2>
              <p className="text-xs text-[#64748B]">Success vs. Failure vs. Errors</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 text-[#64748B]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          {statusPieChartData ? (
            <Chart
              options={statusPieChartData.options}
              series={statusPieChartData.series}
              type="donut"
              height={280}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-xs text-slate-400">
              No status records found
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODULE BREAKDOWN & ROLE ACTIVITY
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Activity Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#101B35]">Module Breakdown</h2>
              <p className="text-xs text-[#64748B]">Action volume by platform subsystem</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 text-[#64748B]">
              <Layers className="w-4 h-4 text-[#2878E5]" />
            </div>
          </div>
          {moduleActivityChartData ? (
            <Chart
              options={moduleActivityChartData.options}
              series={moduleActivityChartData.series}
              type="bar"
              height={260}
            />
          ) : (
            <div className="h-[260px] flex items-center justify-center text-xs text-slate-400">
              No module records available
            </div>
          )}
        </div>

        {/* Activity by User Role */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#101B35]">Activity by Role</h2>
              <p className="text-xs text-[#64748B]">Interaction distribution among actors</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 text-[#64748B]">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          {roleActivityChartData ? (
            <Chart
              options={roleActivityChartData.options}
              series={roleActivityChartData.series}
              type="donut"
              height={260}
            />
          ) : (
            <div className="h-[260px] flex items-center justify-center text-xs text-slate-400">
              No role activity records available
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          FEATURE USAGE & RECENT ACTIVITIES AUDIT TRAIL
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Feature Usage */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
          <h2 className="text-sm font-bold text-[#101B35] mb-1">Top Platform Features</h2>
          <p className="text-xs text-[#64748B] mb-4">Most executed endpoints & operations</p>

          <div className="space-y-2.5">
            {featureUsage.slice(0, 8).map((feature, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100"
              >
                <div className="min-w-0 pr-3">
                  <div className="text-xs font-semibold text-[#101B35] truncate">
                    {feature.module}.{feature.action}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    {feature.uniqueUsers} unique actor{feature.uniqueUsers === 1 ? "" : "s"}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#2878E5]/10 text-[#2878E5] text-xs font-bold">
                  {feature.usageCount.toLocaleString()}
                </span>
              </div>
            ))}
            {featureUsage.length === 0 && (
              <div className="py-8 text-center text-xs text-[#94A3B8]">
                No feature statistics logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Audit Events */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-[#101B35] mb-1">Recent Audit Trail</h2>
          <p className="text-xs text-[#64748B] mb-4">Live operational activity stream</p>

          <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1 divide-y divide-[#F1F5F9]">
            {recentActivities.map((activity) => {
              const title =
                activity.title ||
                `${activity.module || "system"}.${activity.action || "unknown"}`;
              const description = activity.description || "";
              const section = activity.section || activity.module || "System";
              const actorEmail =
                activity.actorEmail || activity.userEmail || "System";
              const activityTime = activity.activityTime || activity.timestamp;
              const status =
                activity.status?.toUpperCase() || activity.status || "SUCCESS";

              let formattedDate = "Just now";
              try {
                if (activityTime) {
                  const date = new Date(activityTime);
                  if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                  }
                }
              } catch (e) {
                console.error("Date formatting error:", e);
              }

              const isSuccess =
                status === "SUCCESS" || status === "success" || status === "200";

              return (
                <div
                  key={activity.id || activity.activityId}
                  className="pt-3 first:pt-0 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#101B35] truncate leading-tight">
                      {title}
                    </p>
                    {description && (
                      <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">
                        {description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] mt-1">
                      <span className="font-medium text-[#64748B] truncate max-w-[150px]">
                        {actorEmail}
                      </span>
                      <span>•</span>
                      <span>{section}</span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex-shrink-0 ${
                      isSuccess
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              );
            })}
            {recentActivities.length === 0 && (
              <div className="py-8 text-center text-xs text-[#94A3B8]">
                No recent activities found.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Analytics;
