import React, { useState, useEffect, useMemo, useRef } from "react";
import { getAuthToken, authenticatedFetch } from "@/utils/api";
import { API_BASE_URL_V1 } from "@/configs/api";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
  Tooltip,
  Progress,
  Chip,
  Button,
} from "@material-tailwind/react";
import {
  MoreVertical,
  ArrowUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  Store,
  HeartHandshake,
  BarChart3,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart } from "@/widgets/charts";
import {
  statisticsChartsData,
  projectsTableData,
  ordersOverviewData,
} from "@/data";
import Chart from "react-apexcharts";

export function Home() {
  const navigate = useNavigate();
  const [usersStats, setUsersStats] = useState({
    organizations: 0,
    merchants: 0,
    donors: 0,
    homeless: 0,
  });
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [activityTrends, setActivityTrends] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Cancel previous request if it exists (handles React StrictMode double render)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    const fetchUsersStats = async () => {
      try {
        if (isMountedRef.current) {
          setLoading(true);
        }

        // Get token using utility function
        const token = getAuthToken();

        if (!token) {
          console.warn('No authentication token found. Dashboard stats require admin authentication.');
          if (isMountedRef.current) {
            setLoading(false);
          }
          return;
        }

        // Check user role from session
        try {
          const sessionData = localStorage.getItem('auth_session');
          if (sessionData) {
            const { user } = JSON.parse(sessionData);
            if (user && user.role !== 'admin') {
              console.warn(`Current user role is '${user.role}'. Dashboard stats require 'admin' role.`);
              if (isMountedRef.current) {
                setLoading(false);
              }
              return;
            }
          }
        } catch (e) {
          console.warn('Could not parse session data:', e);
        }

        // Use authenticatedFetch utility for consistent token handling
        const response = await authenticatedFetch(`${API_BASE_URL_V1}/dashboard/stats`, {
          method: 'GET',
          signal: abortControllerRef.current.signal,
        });

        // Check if request was aborted
        if (abortControllerRef.current.signal.aborted) {
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (response.status === 401) {
            console.error('❌ Unauthorized (401):', errorData.message || 'Invalid token or expired session');
            console.error('Full error response:', errorData);
            // Clear invalid session
            localStorage.removeItem('auth_session');
          } else if (response.status === 403) {
            console.error('❌ Forbidden (403):', errorData.message || 'Admin access required');
            console.error('Full error response:', errorData);
          } else {
            console.error(`❌ Failed to fetch dashboard statistics (${response.status}):`, errorData.message || '');
          }

          if (isMountedRef.current) {
            setLoading(false);
          }
          return;
        }

        const data = await response.json();

        if (data.success && isMountedRef.current) {
          setUsersStats({
            organizations: data.data.organizations || 0,
            merchants: data.data.merchants || 0,
            donors: data.data.donors || 0,
            homeless: data.data.homeless || 0,
          });
        }
      } catch (error) {
        // Ignore abort errors (from StrictMode cleanup)
        if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
          return;
        }
        console.error('Error fetching dashboard stats:', error);
        // Keep default values (0) on error
      } finally {
        if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUsersStats();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        const token = getAuthToken();

        if (!token) {
          setAnalyticsLoading(false);
          return;
        }

        // Check user role
        try {
          const sessionData = localStorage.getItem('auth_session');
          if (sessionData) {
            const { user } = JSON.parse(sessionData);
            if (user && user.role !== 'admin') {
              setAnalyticsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Could not parse session data:', e);
        }

        // Get date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const dateRange = {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        };

        const [overviewRes, trendsRes, activitiesRes] = await Promise.all([
          authenticatedFetch(`${API_BASE_URL_V1}/analytics/overview?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
          authenticatedFetch(`${API_BASE_URL_V1}/analytics/trends?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&groupBy=day`),
          authenticatedFetch(`${API_BASE_URL_V1}/analytics/activities?limit=50&page=1`),
        ]);

        const [overviewData, trendsData, activitiesData] = await Promise.all([
          overviewRes.json(),
          trendsRes.json(),
          activitiesRes.json(),
        ]);

        if (overviewData.success && isMountedRef.current) {
          setAnalyticsOverview(overviewData.data);
        }
        if (trendsData.success && isMountedRef.current) {
          setActivityTrends(trendsData.data.trends || []);
        }
        if (activitiesData.success && isMountedRef.current) {
          setRecentActivities(activitiesData.data.activities || []);
          setActivitiesTotal(activitiesData.data.pagination?.totalItems || 0);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        if (isMountedRef.current) {
          setAnalyticsLoading(false);
          setActivitiesLoading(false);
        }
      }
    };

    fetchAnalytics();
  }, []);

  // Fetch more activities when page changes
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true);
        const token = getAuthToken();

        if (!token) {
          setActivitiesLoading(false);
          return;
        }

        try {
          const sessionData = localStorage.getItem('auth_session');
          if (sessionData) {
            const { user } = JSON.parse(sessionData);
            if (user && user.role !== 'admin') {
              setActivitiesLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Could not parse session data:', e);
        }

        const response = await authenticatedFetch(
          `${API_BASE_URL_V1}/analytics/activities?limit=50&page=${activitiesPage}`
        );

        if (!response.ok) {
          setActivitiesLoading(false);
          return;
        }

        const data = await response.json();
        if (data.success && isMountedRef.current) {
          setRecentActivities(data.data.activities || []);
          setActivitiesTotal(data.data.pagination?.totalItems || 0);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        if (isMountedRef.current) {
          setActivitiesLoading(false);
        }
      }
    };

    fetchActivities();
  }, [activitiesPage]);

  // Calculate percentage changes (mock calculations)
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return "+100%";
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  // User statistics cards data - separate cards for each user type
  const userStatisticsCards = useMemo(() => [
    {
      color: "indigo",
      icon: Building2,
      title: "Organizations",
      value: usersStats.organizations.toLocaleString(),
      path: "/dashboard/organizations",
    },
    {
      color: "purple",
      icon: Store,
      title: "Merchants",
      value: usersStats.merchants.toLocaleString(),
      path: "/dashboard/merchants",
    },
    {
      color: "pink",
      icon: HeartHandshake,
      title: "Donors",
      value: usersStats.donors.toLocaleString(),
      path: "/dashboard/donors",
    },
    {
      color: "orange",
      icon: Users,
      title: "Homeless",
      value: usersStats.homeless.toLocaleString(),
      path: "/dashboard/homeless",
    },
  ], [usersStats]);

  // Analytics cards data
  const analyticsCards = useMemo(() => {
    if (!analyticsOverview) return [];

    return [
      {
        color: "blue",
        icon: BarChart3,
        title: "Total Activities",
        value: analyticsOverview.overview?.totalActivities?.toLocaleString() || "0",
        path: "/dashboard/analytics",
      },
      {
        color: "green",
        icon: CheckCircle2,
        title: "Success Rate",
        value: `${analyticsOverview.overview?.successRate || "0"}%`,
        path: "/dashboard/analytics",
      },
      {
        color: "purple",
        icon: Users,
        title: "Active Users",
        value: analyticsOverview.users?.active?.toLocaleString() || "0",
        path: "/dashboard/analytics",
      },
      {
        color: "orange",
        icon: Clock,
        title: "Avg Response Time",
        value: `${analyticsOverview.performance?.avgResponseTime || "0"}ms`,
        path: "/dashboard/analytics",
      },
    ];
  }, [analyticsOverview]);

  // Prepare activity trends chart data
  const activityTrendsChart = useMemo(() => {
    if (!activityTrends.length) return null;

    return {
      type: "line",
      height: 220,
      series: [
        {
          name: "Total Activities",
          data: activityTrends.map(t => t.count),
        },
        {
          name: "Success",
          data: activityTrends.map(t => t.success),
        },
        {
          name: "Failure",
          data: activityTrends.map(t => t.failure),
        },
      ],
      options: {
        chart: {
          toolbar: { show: false },
        },
        colors: ["#3b82f6", "#10b981", "#ef4444"],
        stroke: {
          curve: "smooth",
          width: 2,
        },
        xaxis: {
          categories: activityTrends.map(t => {
            const date = new Date(t.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }),
        },
        legend: {
          position: "top",
        },
        grid: {
          show: true,
          borderColor: "#dddddd",
          strokeDashArray: 5,
        },
      },
    };
  }, [activityTrends]);

  return (
    <div className="mt-6 md:mt-0">
      {/* User Statistics Cards */}
      <div className="mb-6 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        {userStatisticsCards.map(({ icon, title, path, ...rest }) => (
          <div
            key={title}
            onClick={() => navigate(path)}
            className="cursor-pointer group transition-all duration-200 hover:scale-105  relative"
          >
            <StatisticsCard
              {...rest}
              title={
                <div className="flex items-center justify-between gap-2 pl-14 pr-8">
                  <span className="text-sm font-normal text-blue-gray-600">{title}</span>
                </div>
              }
              icon={React.createElement(icon, {
                className: "w-6 h-6 text-white",
              })}
            />
            <div className="absolute top-4 right-4 opacity-60 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-5 w-5 text-blue-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Overview Cards */}
      {/* {analyticsOverview && analyticsCards.length > 0 && (
        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <Typography variant="h5" className="text-gray-900 font-bold">
              System Analytics
            </Typography>
            
          </div>
          <div className="grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
            {analyticsCards.map(({ icon, title, path, ...rest }) => (
              <div
                key={title}
                onClick={() => navigate(path)}
                className="cursor-pointer group transition-all duration-200 hover:scale-105  relative"
              >
                <StatisticsCard
                  {...rest}
                  title={
                    <div className="flex items-center justify-between gap-2 pl-14 pr-8">
                      <span className="text-sm font-normal text-blue-gray-600">{title}</span>
                    </div>
                  }
                  icon={React.createElement(icon, {
                    className: "w-6 h-6 text-white",
                  })}
                />
                <div className="absolute top-4 right-4 opacity-60 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-5 w-5 text-blue-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Activity Trends Chart */}
      {activityTrendsChart && (
        <div className="mb-6">
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardHeader floated={false} shadow={false} className="rounded-none">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h6" color="blue-gray">
                    Activity Trends (Last 30 Days)
                  </Typography>
                  <Typography variant="small" className="text-gray-600 mt-1">
                    Real-time activity tracking across all modules
                  </Typography>
                </div>
                <button
                  onClick={() => navigate("/dashboard/analytics")}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  View Details
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardBody>
              <Chart
                options={activityTrendsChart.options}
                series={activityTrendsChart.series}
                type={activityTrendsChart.type}
                height={activityTrendsChart.height}
              />
            </CardBody>
          </Card>
        </div>
      )}

      {/* Activity Logs Section */}
      <div className="mb-6">
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h6" color="blue-gray">
                  Activity Logs
                </Typography>
                <Typography variant="small" className="text-gray-600 mt-1">
                  Real-time system activity tracking ({activitiesTotal.toLocaleString()} total activities)
                </Typography>
              </div>
               
            </div>
          </CardHeader>
          <CardBody>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-12">
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
                  <Typography variant="small" className="text-gray-600">
                    Loading activities...
                  </Typography>
                </div>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-12">
                <Typography variant="small" className="text-gray-500">
                  No activities found. Activities will appear here as users interact with the system.
                </Typography>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentActivities.map((activity) => {
                    // Use new fields if available, fallback to legacy fields
                    const title = activity.title || `${activity.module || 'system'}.${activity.action || 'unknown'}`;
                    const description = activity.description || '';
                    const section = activity.section || activity.module || 'System';
                    const actorEmail = activity.actorEmail || activity.userEmail || 'System';
                    const activityTime = activity.activityTime || activity.timestamp;
                    const status = activity.status?.toUpperCase() || activity.status || 'SUCCESS';

                    // Format date properly
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
                      <div
                        key={activity.id || activity.activityId}
                        className="flex items-start gap-3 p-3 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Typography variant="small" className="font-semibold text-gray-900">
                              {title}
                            </Typography>
                            {activity.method && (
                              <Chip
                                value={activity.method}
                                size="sm"
                                variant="outlined"
                                className="text-xs"
                              />
                            )}
                          </div>
                          {description && (
                            <Typography variant="small" className="text-gray-600 mb-1">
                              {description}
                            </Typography>
                          )}
                          <Typography variant="small" className="text-gray-600 truncate">
                            {actorEmail} • {section} {activity.endpoint ? `• ${activity.endpoint}` : ''}
                          </Typography>
                          <div className="flex items-center gap-3 mt-1">
                            <Typography variant="small" className="text-gray-400">
                              {formattedDate}
                            </Typography>
                            {activity.responseTime && (
                              <Typography variant="small" className="text-gray-400">
                                • {activity.responseTime}ms
                              </Typography>
                            )}
                          </div>
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
                {activitiesTotal > 50 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <Typography variant="small" className="text-gray-600">
                      Showing {recentActivities.length} of {activitiesTotal} activities
                    </Typography>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outlined"
                        disabled={activitiesPage === 1}
                        onClick={() => setActivitiesPage(prev => Math.max(1, prev - 1))}
                      >
                        Previous
                      </Button>
                      <Typography variant="small" className="text-gray-600">
                        Page {activitiesPage} of {Math.ceil(activitiesTotal / 50)}
                      </Typography>
                      <Button
                        size="sm"
                        variant="outlined"
                        disabled={activitiesPage >= Math.ceil(activitiesTotal / 50)}
                        onClick={() => setActivitiesPage(prev => prev + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Legacy Charts (if no analytics data) */}
      {!analyticsLoading && !analyticsOverview && (
        <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-2">
          {statisticsChartsData.map((props) => (
            <StatisticsChart
              key={props.title}
              {...props}
              footer={
                <Typography
                  variant="small"
                  className="flex items-center font-normal text-blue-gray-600"
                >
                  <Clock strokeWidth={2} className="h-4 w-4 text-blue-gray-400" />
                  &nbsp;{props.footer}
                </Typography>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
