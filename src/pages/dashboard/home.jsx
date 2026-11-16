import React, { useState, useEffect, useMemo, useRef } from "react";
import { getAuthToken, authenticatedFetch } from "@/utils/api";
import { API_BASE_URL_V1 } from "@/configs/api";
import {
  Users,
  Building2,
  Store,
  HeartHandshake,
  TrendingUp,
  ArrowRight,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatisticsCard } from "@/widgets/cards";
import Chart from "react-apexcharts";

export function Home() {
  const navigate = useNavigate();
  const [usersStats, setUsersStats] = useState({
    organizations: 0,
    merchants: 0,
    donors: 0,
    homeless: 0,
  });
  const [activityTrends, setActivityTrends] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const fetchUsersStats = async () => {
      try {
        if (isMountedRef.current) setLoading(true);

        const token = getAuthToken();
        if (!token) {
          if (isMountedRef.current) setLoading(false);
          return;
        }

        const response = await authenticatedFetch(`${API_BASE_URL_V1}/dashboard/stats`, {
          method: "GET",
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          if (isMountedRef.current) setLoading(false);
          return;
        }

        const data = await response.json();
        if (data.success && isMountedRef.current) {
          const stats = data.data?.stats || data.data;
          setUsersStats({
            organizations: stats.organizations || 0,
            merchants: stats.merchants || 0,
            donors: stats.donors || 0,
            homeless: stats.homeless || 0,
          });
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Dashboard stats error:", error);
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };

    const fetchActivityData = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        // Fetch activity trends
        const trendsRes = await authenticatedFetch(
          `${API_BASE_URL_V1}/analytics/trends?days=30`,
          { signal: abortControllerRef.current.signal }
        );
        if (trendsRes.ok) {
          const trendsData = await trendsRes.json();
          if (trendsData.success && isMountedRef.current) {
            setActivityTrends(trendsData.data?.trends || []);
          }
        }

        // Fetch recent activities
        if (isMountedRef.current) setActivitiesLoading(true);
        const activitiesRes = await authenticatedFetch(
          `${API_BASE_URL_V1}/analytics/activities?limit=10`,
          { signal: abortControllerRef.current.signal }
        );
        if (activitiesRes.ok) {
          const actData = await activitiesRes.json();
          if (actData.success && isMountedRef.current) {
            setRecentActivities(actData.data?.activities || []);
            setActivitiesTotal(actData.data?.pagination?.total || (actData.data?.activities || []).length);
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch activities error:", err);
        }
      } finally {
        if (isMountedRef.current) setActivitiesLoading(false);
      }
    };

    fetchUsersStats();
    fetchActivityData();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // 4 Primary Metric Cards
  const userCards = [
    {
      title: "Organizations",
      value: loading ? "..." : usersStats.organizations.toLocaleString(),
      color: "blue",
      icon: <Building2 className="w-5 h-5 text-[#2878E5]" />,
      path: "/dashboard/organizations",
      description: "Non-profit partners",
    },
    {
      title: "Merchants",
      value: loading ? "..." : usersStats.merchants.toLocaleString(),
      color: "green",
      icon: <Store className="w-5 h-5 text-emerald-600" />,
      path: "/dashboard/merchants",
      description: "Verified local vendors",
    },
    {
      title: "Donors",
      value: loading ? "..." : usersStats.donors.toLocaleString(),
      color: "amber",
      icon: <HeartHandshake className="w-5 h-5 text-amber-600" />,
      path: "/dashboard/donors",
      description: "Active community supporters",
    },
    {
      title: "Homeless Individuals",
      value: loading ? "..." : usersStats.homeless.toLocaleString(),
      color: "purple",
      icon: <Users className="w-5 h-5 text-purple-600" />,
      path: "/dashboard/homeless",
      description: "Assisted individuals",
    },
  ];

  // Chart configuration with Enterprise Colors
  const chartConfig = useMemo(() => {
    if (!activityTrends || activityTrends.length === 0) return null;

    return {
      type: "area",
      height: 280,
      series: [
        {
          name: "Total Activities",
          data: activityTrends.map((t) => t.count || 0),
        },
        {
          name: "Success",
          data: activityTrends.map((t) => t.success || 0),
        },
      ],
      options: {
        chart: {
          toolbar: { show: false },
          fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
          background: "transparent",
        },
        colors: ["#2878E5", "#10B981"],
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.25,
            opacityTo: 0.02,
            stops: [0, 90, 100],
          },
        },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2.5 },
        xaxis: {
          type: "category",
          categories: activityTrends.map((t) => {
            if (!t?.date) return "";
            // Handle ISO string, 'YYYY-MM-DD', or other standard representations
            // Replace space with 'T' if string is 'YYYY-MM-DD HH:mm:ss'
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
          },
        },
        legend: {
          position: "top",
          horizontalAlign: "right",
          fontSize: "12px",
          fontWeight: 600,
          labels: { colors: "#172033" },
          markers: { radius: 12 },
        },
        grid: {
          borderColor: "#E7ECF2",
          strokeDashArray: 4,
          padding: { left: 10, right: 10 },
        },
        tooltip: {
          theme: "light",
          style: { fontSize: "12px", fontFamily: '"Plus Jakarta Sans", sans-serif' },
          x: {
            formatter: (val, { dataPointIndex }) => {
              const item = activityTrends[dataPointIndex];
              if (!item?.date) return val || "Activity Log";
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

  return (
    <div className="space-y-6">
      {/* Page Title & Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-enterprise-textPrimary tracking-tight">
            Platform Overview
          </h1>
          <p className="text-xs sm:text-sm text-enterprise-textSecondary mt-0.5">
            Real-time analytics and user management metrics across Another Second Chance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E7ECF2] text-enterprise-textPrimary shadow-subtle">
            <Activity className="w-3.5 h-3.5 text-[#2878E5]" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* 1. Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {userCards.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.path)}
            className="cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
          >
            <StatisticsCard
              title={card.title}
              value={card.value}
              color={card.color}
              icon={card.icon}
              description={card.description}
              footer={
                <div className="flex items-center justify-between text-[#2878E5] font-semibold">
                  <span>Manage {card.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              }
            />
          </div>
        ))}
      </div>

      {/* 2. Activity Trends Chart */}
      {chartConfig && (
        <div className="bg-white rounded-xl border border-[#E7ECF2] p-5 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-enterprise-textPrimary">
                Activity Trends (Last 30 Days)
              </h2>
              <p className="text-xs text-enterprise-textSecondary mt-0.5">
                Daily activity transactions, donations, and platform verifications
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/analytics")}
              className="text-xs font-semibold text-[#2878E5] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              Detailed Analytics
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <Chart
            options={chartConfig.options}
            series={chartConfig.series}
            type={chartConfig.type}
            height={chartConfig.height}
          />
        </div>
      )}

      {/* 3. Recent Activity Logs */}
      <div className="bg-white rounded-xl border border-[#E7ECF2] shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E7ECF2] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-enterprise-textPrimary">
              Recent Activity Feed
            </h2>
            <p className="text-xs text-enterprise-textSecondary mt-0.5">
              Live audit logs of platform operations ({activitiesTotal.toLocaleString()} total)
            </p>
          </div>
        </div>

        {activitiesLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-[#2878E5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-enterprise-muted">Loading activity stream...</p>
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="p-8 text-center text-xs text-enterprise-muted">
            No recent activity recorded.
          </div>
        ) : (
          <div className="divide-y divide-[#E7ECF2]">
            {recentActivities.slice(0, 7).map((activity, idx) => {
              const title = activity.title || `${activity.module || "System"}.${activity.action || "Event"}`;
              const description = activity.description || "";
              const timestamp = activity.activityTime || activity.timestamp || activity.createdAt;

              return (
                <div
                  key={activity.id || idx}
                  className="px-5 py-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-enterprise-softBlue text-[#2878E5] flex items-center justify-center flex-shrink-0 border border-[#2878E5]/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-enterprise-textPrimary truncate">
                        {title}
                      </p>
                      {description && (
                        <p className="text-[11px] text-enterprise-textSecondary truncate">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right flex-shrink-0">
                    <span className="text-[11px] text-enterprise-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timestamp
                        ? new Date(timestamp).toLocaleTimeString([], {
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
