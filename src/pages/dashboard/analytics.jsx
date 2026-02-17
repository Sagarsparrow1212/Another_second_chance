import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Select,
  Option,
  Chip,
} from "@material-tailwind/react";
import {
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
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

  // Calculate date range
  const getDateRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { startDate, endDate } = getDateRange(dateRange);

      const [overviewRes, trendsRes, featuresRes, heatmapRes, activitiesRes, usersRes] = await Promise.all([
        authenticatedFetch(`${API_BASE_URL_V1}/analytics/overview?startDate=${startDate}&endDate=${endDate}`),
        authenticatedFetch(`${API_BASE_URL_V1}/analytics/trends?startDate=${startDate}&endDate=${endDate}&groupBy=day`),
        authenticatedFetch(`${API_BASE_URL_V1}/analytics/features?startDate=${startDate}&endDate=${endDate}`),
        authenticatedFetch(`${API_BASE_URL_V1}/analytics/heatmap?startDate=${startDate}&endDate=${endDate}`),
        authenticatedFetch(`${API_BASE_URL_V1}/analytics/activities?limit=20`),
        authenticatedFetch(`${API_BASE_URL_V1}/analytics/users?startDate=${startDate}&endDate=${endDate}`),
      ]);

      // Check for errors
      if (!overviewRes.ok) {
        const errorData = await overviewRes.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch analytics: ${overviewRes.status}`);
      }

      const [overviewData, trendsData, featuresData, heatmapData, activitiesData, usersData] = await Promise.all([
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
      if (heatmapData.success) setHeatmapData(heatmapData.data?.heatmap || {});
      if (activitiesData.success) setRecentActivities(activitiesData.data?.activities || []);
      if (usersData.success) setUserStats(usersData.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError(error.message || "Failed to load analytics data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  // Auto-refresh
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
          type: "line",
          toolbar: { show: false },
        },
        xaxis: {
          categories: trends.map(t => t.date),
        },
        colors: ["#3b82f6", "#10b981", "#ef4444"],
        legend: {
          position: "top",
        },
        stroke: {
          curve: "smooth",
          width: 2,
        },
      },
      series: [
        {
          name: "Total",
          data: trends.map(t => t.count),
        },
        {
          name: "Success",
          data: trends.map(t => t.success),
        },
        {
          name: "Failure",
          data: trends.map(t => t.failure),
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
        },
        xaxis: {
          categories: overview.moduleActivity.map(m => m.module),
        },
        colors: ["#3b82f6"],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "55%",
          },
        },
      },
      series: [
        {
          name: "Activities",
          data: overview.moduleActivity.map(m => m.total),
        },
      ],
    };
  }, [overview]);

  const statusPieChartData = useMemo(() => {
    if (!overview) return null;

    return {
      options: {
        chart: {
          type: "pie",
        },
        labels: ["Success", "Failure", "Error"],
        colors: ["#10b981", "#f59e0b", "#ef4444"],
        legend: {
          position: "bottom",
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
        },
        labels: overview.roleActivity.map(r => r.role),
        colors: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
        legend: {
          position: "bottom",
        },
      },
      series: overview.roleActivity.map(r => r.count),
    };
  }, [overview]);

  if (loading && !overview) {
    return (
      <div className="mt-12 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <Typography color="blue-gray">Loading analytics...</Typography>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12">
        <Card className="border border-red-200 bg-red-50">
          <CardBody className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <Typography variant="h6" className="text-red-900 mb-1">
                  Error Loading Analytics
                </Typography>
                <Typography variant="small" className="text-red-700">
                  {error}
                </Typography>
                <Button
                  size="sm"
                  color="red"
                  className="mt-3"
                  onClick={fetchAnalyticsData}
                >
                  Retry
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-6 md:mt-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Typography variant="h4" className="text-gray-900 font-bold mb-2">
            Analytics Dashboard
          </Typography>
          <Typography variant="small" className="text-gray-600">
            Real-time activity intelligence and system insights
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onChange={(val) => setDateRange(val)}
            label="Date Range"
            className="w-40"
          >
            <Option value="7">Last 7 days</Option>
            <Option value="30">Last 30 days</Option>
            <Option value="90">Last 90 days</Option>
            <Option value="365">Last year</Option>
          </Select>
          <Button
            size="sm"
            variant={autoRefresh ? "filled" : "outlined"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button size="sm" onClick={fetchAnalyticsData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {overview ? (
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="text-gray-600 mb-1">
                    Total Activities
                  </Typography>
                  <Typography variant="h3" className="text-gray-900">
                    {overview.overview.totalActivities.toLocaleString()}
                  </Typography>
                </div>
                <BarChart3 className="h-12 w-12 text-blue-500 opacity-20" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="text-gray-600 mb-1">
                    Success Rate
                  </Typography>
                  <Typography variant="h3" className="text-gray-900">
                    {overview.overview.successRate}%
                  </Typography>
                </div>
                <CheckCircle2 className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="text-gray-600 mb-1">
                    Active Users
                  </Typography>
                  <Typography variant="h3" className="text-gray-900">
                    {overview.users.active}
                  </Typography>
                </div>
                <Users className="h-12 w-12 text-purple-500 opacity-20" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="text-gray-600 mb-1">
                    Avg Response Time
                  </Typography>
                  <Typography variant="h3" className="text-gray-900">
                    {overview.performance.avgResponseTime}ms
                  </Typography>
                </div>
                <Clock className="h-12 w-12 text-orange-500 opacity-20" />
              </div>
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card className="mb-8">
          <CardBody className="p-6 text-center">
            <Typography variant="h6" className="text-gray-600 mb-2">
              No Analytics Data Available
            </Typography>
            <Typography variant="small" className="text-gray-500">
              Analytics data will appear here once users start interacting with the system.
            </Typography>
          </CardBody>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Activity Trends */}
        {trendsChartData && (
          <Card>
            <CardHeader floated={false} shadow={false} className="rounded-none">
              <Typography variant="h6" color="blue-gray">
                Activity Trends Over Time
              </Typography>
            </CardHeader>
            <CardBody>
              <Chart
                options={trendsChartData.options}
                series={trendsChartData.series}
                type="line"
                height={300}
              />
            </CardBody>
          </Card>
        )}

        {/* Status Distribution */}
        {statusPieChartData && (
          <Card>
            <CardHeader floated={false} shadow={false} className="rounded-none">
              <Typography variant="h6" color="blue-gray">
                Status Distribution
              </Typography>
            </CardHeader>
            <CardBody>
              <Chart
                options={statusPieChartData.options}
                series={statusPieChartData.series}
                type="pie"
                height={300}
              />
            </CardBody>
          </Card>
        )}

        {/* Module Activity */}
        {moduleActivityChartData && (
          <Card>
            <CardHeader floated={false} shadow={false} className="rounded-none">
              <Typography variant="h6" color="blue-gray">
                Module Activity Breakdown
              </Typography>
            </CardHeader>
            <CardBody>
              <Chart
                options={moduleActivityChartData.options}
                series={moduleActivityChartData.series}
                type="bar"
                height={300}
              />
            </CardBody>
          </Card>
        )}

        {/* Role Activity */}
        {roleActivityChartData && (
          <Card>
            <CardHeader floated={false} shadow={false} className="rounded-none">
              <Typography variant="h6" color="blue-gray">
                Activity by User Role
              </Typography>
            </CardHeader>
            <CardBody>
              <Chart
                options={roleActivityChartData.options}
                series={roleActivityChartData.series}
                type="donut"
                height={300}
              />
            </CardBody>
          </Card>
        )}
      </div>

      {/* Feature Usage & Recent Activities */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Feature Usage */}
        <Card>
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <Typography variant="h6" color="blue-gray">
              Top Feature Usage
            </Typography>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {featureUsage.slice(0, 10).map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Typography variant="small" className="font-semibold text-gray-900">
                      {feature.module}.{feature.action}
                    </Typography>
                    <Typography variant="small" className="text-gray-600">
                      {feature.uniqueUsers} unique users
                    </Typography>
                  </div>
                  <Chip value={feature.usageCount.toLocaleString()} color="blue" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <Typography variant="h6" color="blue-gray">
              Recent Activities
            </Typography>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivities.map((activity) => {
                const title = activity.title || `${activity.module || 'system'}.${activity.action || 'unknown'}`;
                const description = activity.description || '';
                const section = activity.section || activity.module || 'System';
                const actorEmail = activity.actorEmail || activity.userEmail || 'System';
                const activityTime = activity.activityTime || activity.timestamp;
                const status = activity.status?.toUpperCase() || activity.status || 'SUCCESS';
                
                let formattedDate = 'Invalid Date';
                try {
                  if (activityTime) {
                    const date = new Date(activityTime);
                    if (!isNaN(date.getTime())) {
                      formattedDate = date.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      });
                    }
                  }
                } catch (e) {
                  console.error('Date formatting error:', e);
                }

                return (
                  <div key={activity.id || activity.activityId} className="flex items-start gap-3 p-3 border-b border-gray-200 last:border-0">
                    <div className="flex-1 min-w-0">
                      <Typography variant="small" className="font-semibold text-gray-900">
                        {title}
                      </Typography>
                      {description && (
                        <Typography variant="small" className="text-gray-600 mt-1">
                          {description}
                        </Typography>
                      )}
                      <Typography variant="small" className="text-gray-600 truncate">
                        {actorEmail} • {section} {activity.endpoint ? `• ${activity.endpoint}` : ''}
                      </Typography>
                      <Typography variant="small" className="text-gray-400">
                        {formattedDate}
                      </Typography>
                    </div>
                    <Chip
                      value={status}
                      color={
                        status === "SUCCESS" || status === "success"
                          ? "green"
                          : status === "FAILED" || status === "failure"
                          ? "amber"
                          : "red"
                      }
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Analytics;

