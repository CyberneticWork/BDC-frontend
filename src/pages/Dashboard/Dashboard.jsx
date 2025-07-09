import React, { useState } from "react";
import {
  Building2,
  Users,
  UserCheck,
  Calendar,
  Clock,
  DollarSign,
  PieChart,
} from "lucide-react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

import Sidebar from "@dashboard/Sidebar";
import EmployeeMaster from "@dashboard/AddEmployeeMaster/EmployeeMaster";
import EmployeeAdd from "@dashboard/EmployeeAdd";
import ShowEmployee from "@dashboard/ShowEmployee";
import CreateNewDeduction from "@dashboard/createnewdeduction";
import ShiftSchedule from "@dashboard/ShiftSchedule";
import CreateNewAllowance from "@dashboard/createnewallowance";
import EmployeeLoan from "@dashboard/employeeloan";
import TimeCard from "@dashboard/timecard";
import Overtime from "@dashboard/overtime";
import Department from "@dashboard/Department";
import Grouproster from "@dashboard/Grouproster";
import LeaveMaster from "@dashboard/LeaveMaster";
import NoPayManagement from "@dashboard/nopaymanagement";
import LeaveCalendar from "@dashboard/leavecalendar";
import SalaryProcessPage from "@dashboard/salaryprocesspage";
import LeaveApproval from "@dashboard/LeaveApproval";
import HRLeaveApproval from "@dashboard/HRLeaveApproval";
import Resignation from "@dashboard/Resignation";
import Termination from "@dashboard/Termination";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const STORAGE_KEY = "employeeFormData";

const clearForm = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const DashboardStats = () => {
  const stats = [
    {
      name: "Total Employees",
      value: "2,847",
      change: "+12%",
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50",
      iconBg: "bg-blue-500",
      shadowColor: "shadow-blue-200",
    },
    {
      name: "Present Today",
      value: "2,234",
      change: "+2.3%",
      icon: UserCheck,
      gradient: "from-green-500 to-green-600",
      lightBg: "bg-green-50",
      iconBg: "bg-green-500",
      shadowColor: "shadow-green-200",
    },
    {
      name: "On Leave",
      value: "89",
      change: "-5.4%",
      icon: Calendar,
      gradient: "from-yellow-500 to-orange-500",
      lightBg: "bg-yellow-50",
      iconBg: "bg-yellow-500",
      shadowColor: "shadow-yellow-200",
    },
    {
      name: "Departments",
      value: "24",
      change: "+1",
      icon: Building2,
      gradient: "from-purple-500 to-purple-600",
      lightBg: "bg-purple-50",
      iconBg: "bg-purple-500",
      shadowColor: "shadow-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`${stat.lightBg} rounded-2xl shadow-lg ${stat.shadowColor} p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/50 backdrop-blur-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                {stat.name}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stat.value}
              </p>
              <p
                className={`text-sm mt-3 font-semibold ${
                  stat.change.startsWith("+")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.change} from last month
              </p>
            </div>
            <div className={`${stat.iconBg} p-4 rounded-2xl shadow-lg`}>
              <stat.icon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardCharts = () => {
  // Employee Attendance Data
  const attendanceData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Present",
        data: [2100, 2150, 2200, 2180, 2250, 1800, 800],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: "Absent",
        data: [150, 120, 100, 90, 80, 200, 400],
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Department Distribution Data
  const departmentData = {
    labels: [
      "Sales",
      "Marketing",
      "Development",
      "HR",
      "Finance",
      "Operations",
    ],
    datasets: [
      {
        data: [300, 250, 500, 100, 150, 200],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(251, 146, 60, 0.8)",
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(251, 146, 60, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Salary Trend Data
  const salaryData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Total Salary Paid (LKR)",
        data: [
          85000000, 87000000, 89000000, 91000000, 93000000, 95000000, 97000000,
        ],
        fill: true,
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        borderColor: "rgba(139, 92, 246, 1)",
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: "rgba(139, 92, 246, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Attendance Chart */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-2 rounded-xl mr-3">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Weekly Attendance</h3>
        </div>
        <div className="h-80">
          <Bar
            data={attendanceData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                  labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                      size: 12,
                      weight: "bold",
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: "rgba(0, 0, 0, 0.1)",
                  },
                  ticks: {
                    callback: function (value) {
                      return value.toLocaleString();
                    },
                    font: {
                      size: 11,
                    },
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    font: {
                      size: 11,
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Department Distribution Chart */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center mb-6">
          <div className="bg-green-100 p-2 rounded-xl mr-3">
            <Building2 className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            Department Distribution
          </h3>
        </div>
        <div className="h-80">
          <Pie
            data={departmentData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                      size: 12,
                      weight: "bold",
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Salary Trend Chart */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 lg:col-span-2">
        <div className="flex items-center mb-6">
          <div className="bg-purple-100 p-2 rounded-xl mr-3">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            Monthly Salary Trend
          </h3>
        </div>
        <div className="h-80">
          <Line
            data={salaryData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                  labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                      size: 12,
                      weight: "bold",
                    },
                  },
                },
              },
              scales: {
                y: {
                  grid: {
                    color: "rgba(0, 0, 0, 0.1)",
                  },
                  ticks: {
                    callback: function (value) {
                      return "LKR " + (value / 1000000).toFixed(1) + "M";
                    },
                    font: {
                      size: 11,
                    },
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    font: {
                      size: 11,
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

const QuickActions = () => {
  const actions = [
    {
      icon: Users,
      label: "Add Employee",
      action: "employeeAdd",
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Calendar,
      label: "Leave Approval",
      action: "leaveMaster",
      color: "from-green-500 to-green-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Clock,
      label: "Time Cards",
      action: "TimeCard",
      color: "from-yellow-500 to-yellow-600",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      icon: DollarSign,
      label: "Process Salary",
      action: "SalaryProcessPage",
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: PieChart,
      label: "Reports",
      action: "reports",
      color: "from-pink-500 to-pink-600",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
    },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            className="group flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-white hover:to-gray-50 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
          >
            <div
              className={`${action.iconBg} p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300`}
            >
              <action.icon className={`h-6 w-6 ${action.iconColor}`} />
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }) => {
  // Sidebar state
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Sidebar */}
      <Sidebar
        user={user}
        onLogout={onLogout}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <nav className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center lg:hidden">
                <button
                  onClick={() => setIsOpen(true)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
              <div className="hidden lg:flex items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    HRM Dashboard
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700 flex items-center gap-2">
                  Welcome, {user.name}
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M10 2a4 4 0 00-4 4v1H4a2 2 0 00-2 2v2h16V9a2 2 0 00-2-2h-2V6a4 4 0 00-4-4zm-2 5V6a2 2 0 114 0v1H8zm-4 6v3a2 2 0 002 2h8a2 2 0 002-2v-3H4z" />
                    </svg>
                    {user.role}
                  </span>
                </span>
                <button
                  onClick={onLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
        <div className="py-6 sm:px-6 lg:px-8 flex-1">
          <div className="px-4 py-6 sm:px-0 h-full">
            {activeItem === "employeeMaster" ? (
              <EmployeeMaster />
            ) : activeItem === "employeeAdd" ? (
              <EmployeeAdd />
            ) : activeItem === "show" ? (
              <ShowEmployee />
            ) : activeItem === "createNewDeduction" ? (
              <CreateNewDeduction />
            ) : activeItem === "shiftTime" ? (
              <ShiftSchedule />
            ) : activeItem === "createNewAllowance" ? (
              <CreateNewAllowance />
            ) : activeItem === "employeeLoan" ? (
              <EmployeeLoan />
            ) : activeItem === "noPayManagement" ? (
              <NoPayManagement />
            ) : activeItem === "hrLeaveApproval" ? (
              <HRLeaveApproval />
            ) : activeItem === "leaveApproval" ? (
              <LeaveApproval />
            ) : activeItem === "leaveMaster" ? (
              <LeaveMaster />
            ) : activeItem === "TimeCard" ? (
              <TimeCard />
            ) : activeItem === "Overtime" ? (
              <Overtime />
            ) : activeItem === "departmentMaster" ? (
              <Department />
            ) : activeItem === "grouproster" ? (
              <Grouproster />
            ) : activeItem === "leavecalendar" ? (
              <LeaveCalendar />
            ) : activeItem === "SalaryProcessPage" ? (
              <SalaryProcessPage />
            ) : activeItem === "termination" ? (
              <Termination />
            ) : activeItem === "resignation" ? (
              <Resignation />
            ) : (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    HRM Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Welcome to your comprehensive HR management system
                  </p>
                </div>
                <DashboardStats />
                <QuickActions />
                <DashboardCharts />
                <div className="flex justify-center">
                  <button
                    onClick={clearForm}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Clear Form Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
