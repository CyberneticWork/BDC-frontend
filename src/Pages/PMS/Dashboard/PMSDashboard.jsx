import React, { useState, useEffect } from "react";
import {
  BarChart3,
  ClipboardCheck,
  Star,
  Target,
  Users,
  Award,
  FileText,
  PieChart,
  Calendar,
  ArrowUpRight,
  Loader2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import PMSService from "@services/PMS/PMSService";
import NotificationService from "@services/NotificationService";

const PMSDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    activeReviews: 0,
    goalProgress: 0,
    upcomingDeadlines: 0,
    totalKpiTasks: 0,
    completedTasks: 0,
    progressIncrease: 0,
  });

  const [recentReviews, setRecentReviews] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [kpiStats, setKpiStats] = useState({
    onTarget: 0,
    needAttention: 0,
    totalInWindow: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(null);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated before making requests
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          setError("Please log in to view dashboard data");
          setIsLoading(false);
          return;
        }

        try {
          // Fetch dashboard statistics
          const stats = await PMSService.getPMSDashboardStats();
          setDashboardStats(stats);
        } catch (statsError) {
          console.warn("Failed to fetch dashboard stats:", statsError);
          // Set default values if stats fail
          setDashboardStats({
            activeReviews: 0,
            goalProgress: 0,
            upcomingDeadlines: 0,
            totalKpiTasks: 0,
            completedTasks: 0,
            progressIncrease: 0,
          });
        }

        try {
          // Fetch recent performance reviews
          const reviews = await PMSService.getRecentPerformanceReviews(5);
          setRecentReviews(reviews?.data || []);
        } catch (reviewsError) {
          console.warn("Failed to fetch recent reviews:", reviewsError);
          setRecentReviews([]);
        }

        try {
          // Fetch upcoming deadlines
          const deadlines = await PMSService.getUpcomingDeadlines();
          setUpcomingDeadlines(deadlines || []);
        } catch (deadlinesError) {
          console.warn("Failed to fetch upcoming deadlines:", deadlinesError);
          setUpcomingDeadlines([]);
        }

        try {
          // Fetch KPI performance stats for cards
          const kpiPerf = await PMSService.getKpiPerformance();
          setKpiStats(kpiPerf);
        } catch (kpiError) {
          console.warn("Failed to fetch KPI performance:", kpiError);
          setKpiStats({
            onTarget: 0,
            needAttention: 0,
            totalInWindow: 0,
          });
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);

        // Handle authentication errors specifically
        if (err?.response?.status === 401) {
          setError("Authentication required. Please log in again.");
        } else {
          setError("Failed to load dashboard data");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch notifications
  useEffect(() => {
    let intervalId;
    const fetchNotifications = async () => {
      try {
        setNotifLoading(true);
        setNotifError(null);
        const [list, count] = await Promise.all([
          NotificationService.getNotifications(10),
          NotificationService.getUnreadCount(),
        ]);
        setNotifications(list);
        setUnreadCount(count);
      } catch (e) {
        console.warn("Failed to load notifications", e);
        setNotifError("Could not load notifications");
      } finally {
        setNotifLoading(false);
      }
    };

    fetchNotifications();
    // Poll every 60s (can be adjusted or replaced by websockets later)
    intervalId = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllNotificationsRead();
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all read", e);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        // Optimistic
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        await NotificationService.markNotificationRead(notification.id);
      } catch (e) {
        console.error("Failed to mark notification read", e);
      }
    }
    // Potential navigation based on notification.type / data
    // Example: if (notification.type === 'kpi_assigned') navigate(`/pms/kpis/${notification.data?.kpi_id}`)
  };

  // Derive KPI performance data from real stats
  const kpiData = [
    {
      category: "On Target",
      percentage:
        kpiStats.totalInWindow > 0
          ? Math.round((kpiStats.onTarget / kpiStats.totalInWindow) * 100)
          : 0,
      color: "bg-blue-500",
      icon: CheckCircle2,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      category: "Need Attention",
      percentage:
        kpiStats.totalInWindow > 0
          ? Math.round((kpiStats.needAttention / kpiStats.totalInWindow) * 100)
          : 0,
      color: "bg-orange-500",
      icon: AlertTriangle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      category: "In Progress",
      percentage:
        kpiStats.totalInWindow > 0
          ? Math.round(
              ((kpiStats.totalInWindow -
                kpiStats.onTarget -
                kpiStats.needAttention) /
                kpiStats.totalInWindow) *
                100
            )
          : 0,
      color: "bg-gray-500",
      icon: Clock,
      iconColor: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ].filter((item) => item.percentage > 0);

  // PMS modules quick access cards (keep existing)
  const pmsModules = [
    {
      id: "performanceReviews",
      name: "Performance Reviews",
      icon: ClipboardCheck,
      color: "bg-slate-100 border-slate-200",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      description: "Manage review cycles and assessments",
      count: dashboardStats.activeReviews,
    },
    {
      id: "goals",
      name: "Goals & OKRs",
      icon: Target,
      color: "bg-slate-100 border-slate-200",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      description: "Track objectives and key results",
      count: dashboardStats.completedTasks,
    },
    {
      id: "kpis",
      name: "KPIs",
      icon: PieChart,
      color: "bg-slate-100 border-slate-200",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      description: "Monitor key performance indicators",
      count: dashboardStats.totalKpiTasks,
    },
    {
      id: "360feedback",
      name: "360° Feedback",
      icon: Users,
      color: "bg-slate-100 border-slate-200",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      description: "Multi-source feedback collection",
      count: 0, // Could add if you have 360 feedback data
    },
    {
      id: "appraisals",
      name: "Appraisals",
      icon: Award,
      color: "bg-slate-100 border-slate-200",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      description: "Final ratings and appraisal documents",
      count: dashboardStats.completedTasks,
    },
    {
      id: "competency",
      name: "Competencies",
      icon: FileText,
      color: "bg-slate-100 border-slate-200",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      description: "Skills and competency frameworks",
      count: 0, // Could add if you have competency data
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">
            Loading dashboard...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Fetching your performance data
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <div className="text-red-600 text-xl font-semibold mb-2">
              Error Loading Dashboard
            </div>
            <div className="text-gray-600 mb-6">{error}</div>
            {error.includes("Authentication") && (
              <button
                onClick={() => (window.location.href = "/")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Performance Management System
                </h1>
                <p className="text-gray-600 text-lg">
                  Dashboard overview of your organization's performance metrics
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-gray-100 rounded-full p-4">
                  <BarChart3 className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Insights Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-blue-50 rounded-t-xl p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Active Reviews</h3>
                <div className="bg-blue-100 rounded-full p-2">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  {dashboardStats.activeReviews}
                </span>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">
                    +{dashboardStats.progressIncrease}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">From last month</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-green-50 rounded-t-xl p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Goals Progress</h3>
                <div className="bg-green-100 rounded-full p-2">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  {dashboardStats.goalProgress}%
                </span>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">
                    +{dashboardStats.progressIncrease}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">Average completion rate</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-orange-50 rounded-t-xl p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Upcoming Deadlines
                </h3>
                <div className="bg-orange-100 rounded-full p-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  {dashboardStats.upcomingDeadlines}
                </span>
                <span className="text-sm text-orange-600 font-medium">
                  This month
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Next:{" "}
                {upcomingDeadlines.length > 0
                  ? `${upcomingDeadlines[0]?.name} (${upcomingDeadlines[0]?.daysLeft} days)`
                  : "No upcoming deadlines"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Access to PMS Modules */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Performance Management Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pmsModules.map((module) => (
              <div
                key={module.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div
                  className={`rounded-t-xl p-6 border-b border-gray-200 ${module.color}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {module.name}
                    </h3>
                    <div className={`rounded-full p-2 ${module.iconBg}`}>
                      <module.icon className={`h-5 w-5 ${module.iconColor}`} />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{module.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      {module.count} items
                    </span>
                    <div className="bg-gray-100 rounded-full p-2">
                      <ArrowUpRight className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Real KPI Performance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
            <div className="bg-gray-50 rounded-t-xl p-6 border-b border-gray-200">
              <h2 className="font-bold text-xl text-gray-900">
                KPI Performance
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Current month overview
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {kpiData.length > 0 ? (
                  kpiData.map((item) => (
                    <div key={item.category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${item.bgColor}`}>
                            <item.icon
                              className={`h-4 w-4 ${item.iconColor}`}
                            />
                          </div>
                          <span className="font-medium text-gray-800">
                            {item.category}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-1000 ease-out`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No KPI data available
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Data will appear as tasks are completed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Notifications Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
            <div className="bg-gray-50 rounded-t-xl p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                  Notifications{" "}
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      {unreadCount}
                    </span>
                  )}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Latest updates & KPI assignments
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="p-4">
              {notifLoading && notifications.length === 0 && (
                <div className="py-8 text-center text-gray-500 text-sm">
                  Loading notifications...
                </div>
              )}
              {notifError && (
                <div className="py-4 text-center text-red-600 text-sm">
                  {notifError}
                </div>
              )}
              <ul className="divide-y divide-gray-200 max-h-96 overflow-auto">
                {notifications.length > 0
                  ? notifications.slice(0, 8).map((n) => (
                      <li
                        key={n.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition flex gap-3 ${
                          !n.is_read ? "bg-blue-50/40" : ""
                        }`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm font-medium ${
                                !n.is_read ? "text-gray-900" : "text-gray-700"
                              }`}
                            >
                              {n.title || n.type}
                            </p>
                            {!n.is_read && (
                              <span className="inline-block h-2 w-2 rounded-full bg-blue-600 mt-1"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </li>
                    ))
                  : !notifLoading && (
                      <li className="p-8 text-center text-gray-500 text-sm">
                        No notifications
                      </li>
                    )}
              </ul>
            </div>
          </div>

          {/* Recent Performance Reviews from Backend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-1 lg:col-span-1 md:col-span-2 lg:col-span-1 lg:col-span-1 lg:col-span-2">
            <div className="bg-gray-50 rounded-t-xl p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl text-gray-900">
                  Recent Performance Reviews
                </h2>
                <div className="bg-gray-200 rounded-full p-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentReviews.length > 0 ? (
                      recentReviews.map((review) => (
                        <tr
                          key={review.id}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {review.employeeName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {review.department}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {review.taskName}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(review.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                review.status === "Completed"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : review.status === "In Progress"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              }`}
                            >
                              {review.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center">
                              <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${review.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="font-medium text-gray-800">
                                {review.progress || 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <FileText className="h-10 w-10 text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">
                              No recent performance reviews found
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              Reviews will appear here as they are completed
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PMSDashboard;
