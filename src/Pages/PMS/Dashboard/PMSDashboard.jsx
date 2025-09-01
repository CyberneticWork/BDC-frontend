import React from "react";
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
} from "lucide-react";
import { Link } from "react-router-dom";

const PMSDashboard = () => {
  // Sample data for KPI summary chart
  const kpiData = [
    { category: "Exceeded", percentage: 22 },
    { category: "Met", percentage: 58 },
    { category: "Partially Met", percentage: 15 },
    { category: "Not Met", percentage: 5 },
  ];

  // Sample data for recent performance reviews
  const recentReviews = [
    {
      id: 1,
      employeeName: "John Smith",
      position: "Software Developer",
      reviewType: "Annual",
      date: "2025-08-15",
      status: "Completed",
      rating: 4.2,
    },
    {
      id: 2,
      employeeName: "Sarah Johnson",
      position: "Marketing Specialist",
      reviewType: "Quarterly",
      date: "2025-08-20",
      status: "Pending Manager",
      rating: null,
    },
    {
      id: 3,
      employeeName: "Michael Wong",
      position: "Project Manager",
      reviewType: "Annual",
      date: "2025-08-12",
      status: "Completed",
      rating: 4.7,
    },
    {
      id: 4,
      employeeName: "Emma Davis",
      position: "UX Designer",
      reviewType: "Quarterly",
      date: "2025-08-22",
      status: "In Progress",
      rating: null,
    },
  ];

  // Sample data for upcoming deadlines
  const upcomingDeadlines = [
    {
      id: 1,
      name: "Q3 Performance Reviews",
      deadline: "2025-09-15",
      daysLeft: 18,
      type: "review",
    },
    {
      id: 2,
      name: "Annual Goal Setting",
      deadline: "2025-09-10",
      daysLeft: 13,
      type: "goals",
    },
    {
      id: 3,
      name: "Leadership Calibration",
      deadline: "2025-09-22",
      daysLeft: 25,
      type: "calibration",
    },
  ];

  // PMS modules quick access cards
  const pmsModules = [
    {
      id: "performanceReviews",
      name: "Performance Reviews",
      icon: ClipboardCheck,
      color: "bg-blue-100 text-blue-600",
      description: "Manage review cycles and assessments",
      count: 24,
      path: "/pms/performanceReviews",
    },
    {
      id: "goals",
      name: "Goals & OKRs",
      icon: Target,
      color: "bg-green-100 text-green-600",
      description: "Track objectives and key results",
      count: 68,
      path: "/pms/goals",
    },
    {
      id: "kpis",
      name: "KPIs",
      icon: PieChart,
      color: "bg-purple-100 text-purple-600",
      description: "Monitor key performance indicators",
      count: 35,
      path: "/pms/kpis",
    },
    {
      id: "360feedback",
      name: "360° Feedback",
      icon: Users,
      color: "bg-orange-100 text-orange-600",
      description: "Multi-source feedback collection",
      count: 12,
      path: "/pms/360feedback",
    },
    {
      id: "appraisals",
      name: "Appraisals",
      icon: Award,
      color: "bg-pink-100 text-pink-600",
      description: "Final ratings and appraisal documents",
      count: 28,
      path: "/pms/appraisals",
    },
    {
      id: "competency",
      name: "Competencies",
      icon: FileText,
      color: "bg-indigo-100 text-indigo-600",
      description: "Skills and competency frameworks",
      count: 42,
      path: "/pms/competency",
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Performance Management System
        </h1>
        <p className="text-gray-600">
          Dashboard overview of your organization's performance metrics
        </p>
      </div>

      {/* Insights Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Active Reviews</h3>
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">24</span>
            <span className="text-sm text-green-600 flex items-center">
              +12% <ArrowUpRight className="h-3 w-3 ml-1" />
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">From last month</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Goals Progress</h3>
            <div className="bg-green-100 text-green-600 p-2 rounded-lg">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">76%</span>
            <span className="text-sm text-green-600 flex items-center">
              +5% <ArrowUpRight className="h-3 w-3 ml-1" />
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Average completion rate</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Upcoming Deadlines</h3>
            <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">3</span>
            <span className="text-sm text-orange-600">This month</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Next: Q3 Reviews (18 days)</p>
        </div>
      </div>

      {/* Quick Access to PMS Modules */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Performance Management Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pmsModules.map((module) => (
            <Link
              key={module.id}
              to={module.path}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex gap-4 items-center"
            >
              <div className={`p-3 rounded-lg ${module.color}`}>
                <module.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{module.name}</h3>
                <p className="text-sm text-gray-500">{module.description}</p>
                <div className="text-xs font-medium text-gray-400 mt-1">
                  {module.count} items
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI Performance Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-1">
          <h2 className="font-semibold text-gray-800 mb-4">KPI Performance</h2>
          <div className="space-y-4">
            {kpiData.map((item) => (
              <div key={item.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-600">
                    {item.category}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {item.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.category === "Exceeded"
                        ? "bg-green-500"
                        : item.category === "Met"
                        ? "bg-blue-500"
                        : item.category === "Partially Met"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Performance Reviews */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">
              Recent Performance Reviews
            </h2>
            <Link
              to="/pms/performanceReviews"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View all <ArrowUpRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {review.employeeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {review.position}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                      {review.reviewType}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(review.date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          review.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : review.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      {review.rating ? (
                        <div className="flex items-center">
                          <Star
                            className="h-4 w-4 text-yellow-500 mr-1 fill-current"
                            fill="currentColor"
                          />
                          <span className="font-medium text-gray-800">
                            {review.rating}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PMSDashboard;
