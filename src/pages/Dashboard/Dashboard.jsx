import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  UserCheck,
  Calendar,
  Clock,
  DollarSign,
  PieChart,
  User,
  BarChart3,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import NotificationBell from "../../components/NotificationBell";
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

import Sidebar from "./Sidebar";
import EmployeeDashboard from "./EmployeeDashboard";
import EmployeeMaster from "@dashboard/AddEmployeeMaster/EmployeeMaster";
import EmployeeAdd from "@dashboard/EmployeeAdd";
import ShowEmployee from "@dashboard/ShowEmployee";
import MyProfile from "@dashboard/MyProfile";
import ChangePassword from "@dashboard/ChangePassword";
import CreateNewDeduction from "@dashboard/createnewdeduction";

import CreateNewBonus from "@dashboard/CreateNewBonus";
import ShiftSchedule from "@dashboard/ShiftSchedule";
import ShiftOvertimeRates from "@dashboard/ShiftOvertimeRates";
import CreateNewAllowance from "@dashboard/createnewallowance";
import EmployeeLoan from "@dashboard/employeeloan";
import TimeCard from "@dashboard/timecard";
import Overtime from "@dashboard/overtime";
import Department from "@dashboard/Department";
import Grouproster from "@dashboard/grouproster";
import LeaveMaster from "@dashboard/LeaveMaster";
import NoPayManagement from "@dashboard/nopaymanagement";
import LeaveCalendar from "@dashboard/leavecalendar";
import SalaryProcessPage from "@dashboard/salaryprocesspage";
import LeaveApproval from "@dashboard/LeaveApproval";
import HRLeaveApproval from "@dashboard/HRLeaveApproval";
import Resignation from "@dashboard/Resignation";
import Termination from "@dashboard/Termination";
import ViewLoans from "@dashboard/ViewLoans";
import SalaryPage from "@dashboard/SalaryPage";
import UserManagement from "@dashboard/UserManagement";
import Chatbot from "./Chatbot";
// Import PMS components
import { PMSDashboard, PerformanceReviews, KPIs } from "../PMS";
import EmployeePerformanceEvaluation from "../PMS/EmployeeEvaluation";
import EmployeeKPIView from "../PMS/KPIs/EmployeeKPIView";
import TaskApproval from "../../Pages/PMS/TaskApproval/TaskApproval";
import PerformanceAppraisal from "../PMS/PerformanceAppraisal/PerformanceAppraisal";

// Import LMS components
import LMS from "../LMS/LMS";
import UserStats from "../LMS/UserStats";

// Import Accounting components
import AccountingDashboard from "@Accounting/Dashboard";
import Supplier from "@Inventory/Supplier";
import DoubleEntry from "../Accounting/DoubleEntry";
import ChartOfAccounts from "../Accounting/ChartOfAccounts";
import AccountList from "../Accounting/AccountList";
import Customer from "@Inventory/Customer";
import Center from "@Inventory/Center";
import DiscountLevel from "../Inventory/MasterFile/DiscountLevel";
import ProductList from "../Inventory/MasterFile/ProductList";
import ProductType from "../Inventory/MasterFile/ProductType";
import Transactions from "../Accounting/Transactions";
import Ledger from "../Accounting/Ledger";
import TrialBalance from "../Accounting/TrialBalance";
import IncomeStatement from "../Accounting/IncomeStatement";
import BalanceSheet from "../Accounting/BalanceSheet";
import CashFlowStatement from "../Accounting/CashFlowStatement";
import Invoices from "../Inventory/Invoices";
import SalesOrder from "../Inventory/SalesOrder";
import SalesReturn from "../Inventory/SalesReturn";
import GRN from "../Inventory/GRN";
import PurchaseReturn from "../Inventory/PurchaseReturn";
import PurchaseOrder from "../Inventory/PurchaseOrder";
import StockTransfer from "../Inventory/StockTransfer";
import StockVerification from "../Inventory/StockVerification";
import Pending from "../Inventory/Pending";
import Expenses from "../Accounting/Expenses";
import AccountingReports from "../Accounting/Reports";
import AccountingSettings from "../Accounting/Settings";
// Import new accounting pages
import SupplierEnterBill from "../Accounting/SupplierEnterBill";
import Payment from "../Accounting/Payment";
import AdvancePayment from "../Accounting/AdvancePayment";
import MakeDeposit from "../Accounting/MakeDeposit";
import Receipt from "../Accounting/Receipt";
import UtilityBill from "../Accounting/UtilityBill";
import UtilityBillPayment from "../Accounting/UtilityBillPayment";
import JournalEntry from "../Accounting/JournalEntry";
import PettyCash from "../Accounting/PettyCash";
import Cheque from "../Accounting/Cheque";
import BankReconciliation from "../Accounting/BankReconciliation";

import employeeService from "../../services/EmployeeDataService";
import { fetchDepartments } from "../../services/ApiDataService";
import timeCardService from "../../services/timeCardService";
import ProtectedComponent from "../../components/ProtectedComponent";
import SingleEntryReport from "@src/Pages/Reports/TimeCard/SingleEntryReport";
import AttendanceReport from "../Reports/TimeCard/AttendanceReport";
import LeaveSettings from "./LeaveSettings";
import AbsentReport from "../Reports/TimeCard/AbsentReport";

import { useLocation, useNavigate } from "react-router-dom";
import {
  sidebarUtils,
  toggleSidebar,
  closeSidebar,
  isOutsideClick,
  handleBreakpointChange,
} from "../../utils/SidebarUtils";
import { getResponsive } from "../../utils/ResponsiveUtils";

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

// ─── DashboardStats ───────────────────────────────────────────────────────────
const DashboardStats = () => {
  const [stats, setStats] = useState([
    { name: "Total Employees", value: "-", change: "-", icon: Users },
    { name: "Present Today", value: "-", change: "-", icon: UserCheck },
    { name: "On Leave", value: "-", change: "-", icon: Calendar },
    { name: "Departments", value: "-", change: "-", icon: Building2 },
  ]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const employees = await employeeService.fetchEmployees();
        const departments = await fetchDepartments();
        const todayStats = await timeCardService.fetchTodayStats();

        setStats([
          {
            name: "Total Employees",
            value: employees.length,
            change: "+12%",
            icon: Users,
          },
          {
            name: "Present Today",
            value: todayStats.present,
            change: "+2.3%",
            icon: UserCheck,
          },
          {
            name: "On Leave",
            value: todayStats.on_leave,
            change: "-5.4%",
            icon: Calendar,
          },
          {
            name: "Departments",
            value: departments.length,
            change: "+1",
            icon: Building2,
          },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-100"
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
            <div className="bg-blue-100 p-4 rounded-2xl shadow-lg">
              <stat.icon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── DashboardCharts ──────────────────────────────────────────────────────────
const DashboardCharts = () => {
  const [attendanceData, setAttendanceData] = useState({
    labels: [],
    datasets: [],
  });
  const [departmentData, setDepartmentData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    async function fetchChartData() {
      try {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const presentCounts = [45, 48, 46, 50, 47, 20, 15];
        const absentCounts = [5, 2, 4, 0, 3, 30, 35];

        setAttendanceData({
          labels: days,
          datasets: [
            {
              label: "Present",
              data: presentCounts,
              backgroundColor: "rgba(16, 185, 129, 0.8)",
              borderColor: "rgba(16, 185, 129, 1)",
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false,
            },
            {
              label: "Absent",
              data: absentCounts,
              backgroundColor: "rgba(239, 68, 68, 0.8)",
              borderColor: "rgba(239, 68, 68, 1)",
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false,
            },
          ],
        });

        const departments = await fetchDepartments();
        const employees = await employeeService.fetchEmployees();
        const deptLabels = departments.map((d) => d.name);
        const deptCounts = departments.map(
          (d) =>
            employees.filter((e) => e.organization?.department === d.name)
              .length
        );

        setDepartmentData({
          labels: deptLabels,
          datasets: [
            {
              data: deptCounts,
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
        });
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    }
    fetchChartData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
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
                    font: { size: 12, weight: "bold" },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: "rgba(0, 0, 0, 0.1)" },
                  ticks: {
                    callback: (value) => value.toLocaleString(),
                    font: { size: 11 },
                  },
                },
                x: {
                  grid: { display: false },
                  ticks: { font: { size: 11 } },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
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
                    font: { size: 12, weight: "bold" },
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

// ─── QuickActions ─────────────────────────────────────────────────────────────
const QuickActions = ({ setActiveItem }) => {
  const actions = [
    {
      icon: Users,
      label: "Add Employee",
      action: "employeeMaster",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Calendar,
      label: "Leave",
      action: "leaveMaster",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Clock,
      label: "Time Cards",
      action: "TimeCard",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      icon: DollarSign,
      label: "Loan",
      action: "employeeLoan",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: PieChart,
      label: "Leave Calendar",
      action: "leavecalendar",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
    },
  ];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => setActiveItem(action.action)}
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

// ─── AdminHRDashboardHome ─────────────────────────────────────────────────────
const AdminHRDashboardHome = ({ setActiveItem }) => (
  <>
    <DashboardStats />
    <QuickActions setActiveItem={setActiveItem} />
    <DashboardCharts />
  </>
);

// ─── EmployeeDashboardHome ────────────────────────────────────────────────────
const EmployeeDashboardHome = ({
  employeeProfile,
  attendanceRecords,
  isLoadingAttendance,
  lateCount,
  setActiveItem,
}) => (
  <div className="space-y-6">
    {/* Employee Profile Card */}
    {employeeProfile && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Employee Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-900">
                {employeeProfile.name_with_initials || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="text-sm font-medium text-gray-900">
                {employeeProfile.organization_assignment?.department?.name ||
                  "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Employee ID</p>
              <p className="text-sm font-medium text-gray-900">
                {employeeProfile.attendance_employee_no || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Late Policy Card */}
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border border-orange-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-orange-600" />
        Late Policy - This Month
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Late Count</p>
            <span
              className={`px-3 py-1 rounded-full text-lg font-bold ${
                lateCount <= 3
                  ? "bg-green-100 text-green-700"
                  : lateCount <= 5
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {lateCount}
            </span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{lateCount}/6</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  lateCount <= 3
                    ? "bg-green-500"
                    : lateCount <= 5
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${Math.min((lateCount / 6) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">Remaining Allowance</p>
          <p className="text-3xl font-bold text-blue-600">
            {Math.max(3 - lateCount, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {lateCount <= 3
              ? "No penalty"
              : lateCount <= 5
              ? "Short leave applied"
              : "Half day deduction"}
          </p>
        </div>
      </div>
      <div className="mt-4 bg-white rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">
          Policy Rules:
        </p>
        <div className="space-y-1 text-xs text-gray-600">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Late 1-3: No penalty
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Late 4-5: Short leave deduction
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Late 6+: Half day deduction
          </p>
        </div>
      </div>
    </div>

    {/* Leave Summary Card */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-green-600" />
        Leave Summary - This Month
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-gray-600 mb-1">Short Leave</p>
          <p className="text-2xl font-bold text-purple-600">0</p>
          <p className="text-xs text-gray-500 mt-1">2 hours</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-xs text-gray-600 mb-1">Half Day</p>
          <p className="text-2xl font-bold text-orange-600">0</p>
          <p className="text-xs text-gray-500 mt-1">4 hours</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-xs text-gray-600 mb-1">No Pay Leave</p>
          <p className="text-2xl font-bold text-red-600">0</p>
          <p className="text-xs text-gray-500 mt-1">Full day</p>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-700 mb-3">
          Short Leave Time Slots:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            "8:30 AM - 10:30 AM",
            "10:30 AM - 12:30 PM",
            "1:30 PM - 3:30 PM",
            "3:30 PM - 5:30 PM",
          ].map((slot) => (
            <div
              key={slot}
              className="bg-white rounded px-3 py-2 text-xs text-gray-700 border border-gray-200"
            >
              {slot}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Salary Breakdown Card */}
    {employeeProfile && (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Salary Breakdown - Current Month
        </h3>
        <div className="bg-white rounded-lg p-5 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">Basic Salary</span>
            <span className="text-sm font-semibold text-gray-900">
              Rs.{" "}
              {employeeProfile.salary_details?.basic_salary?.toLocaleString() ||
                "0"}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">Allowances</span>
            <span className="text-sm font-semibold text-green-600">
              + Rs.{" "}
              {(
                employeeProfile.salary_details?.allowances || 0
              ).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">OT Payment</span>
            <span className="text-sm font-semibold text-green-600">
              + Rs.{" "}
              {(
                employeeProfile.salary_details?.ot_payment || 0
              ).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">Deductions</span>
            <span className="text-sm font-semibold text-red-600">
              - Rs.{" "}
              {(
                employeeProfile.salary_details?.deductions || 0
              ).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 bg-green-50 rounded-lg p-3 mt-3">
            <span className="text-base font-bold text-gray-900">
              Net Salary
            </span>
            <span className="text-xl font-bold text-green-600">
              Rs.{" "}
              {(
                (employeeProfile.salary_details?.basic_salary || 0) +
                (employeeProfile.salary_details?.allowances || 0) +
                (employeeProfile.salary_details?.ot_payment || 0) -
                (employeeProfile.salary_details?.deductions || 0)
              ).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setActiveItem("SalaryPage")}
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
          >
            View Detailed Salary Slip
            <svg
              className="w-4 h-4"
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
        </div>
      </div>
    )}

    {/* OT and Loan Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* OT Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Overtime - This Month
        </h3>
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-blue-600">0</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Payment</p>
              <p className="text-2xl font-bold text-green-600">Rs. 0</p>
            </div>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500 text-sm">
          No overtime records this month
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Season Period:</span> June -
            November
          </p>
        </div>
      </div>

      {/* Loan Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-purple-600" />
          Loan Details
        </h3>
        <div className="space-y-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-600">Loan Amount</span>
              <span className="text-lg font-bold text-purple-600">Rs. 0</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-600">Monthly Deduction</span>
              <span className="text-sm font-semibold text-red-600">Rs. 0</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-purple-200">
              <span className="text-xs font-semibold text-gray-700">
                Remaining Balance
              </span>
              <span className="text-xl font-bold text-orange-600">Rs. 0</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Progress</span>
              <span>0%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>
          <div className="text-center py-4 text-gray-500 text-sm">
            No active loans
          </div>
        </div>
      </div>
    </div>

    {/* Bonus and Paysheet Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Bonus Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-yellow-600" />
          Bonus Records
        </h3>
        <div className="text-center py-8 text-gray-500 text-sm">
          No bonus records available
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Bonuses are separate from salary and paid as additional compensation
          </p>
        </div>
      </div>

      {/* Paysheet History Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-green-600" />
          Paysheet History
        </h3>
        <div className="text-center py-8 text-gray-500 text-sm">
          No paysheet records available
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>

    {/* Quick Actions for Employee */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <button
        onClick={() => setActiveItem("myProfile")}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">My Profile</h3>
            <p className="text-sm text-gray-600">View your details</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => setActiveItem("leaveMaster")}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Apply Leave</h3>
            <p className="text-sm text-gray-600">Request time off</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => setActiveItem("leavecalendar")}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Leave Calendar</h3>
            <p className="text-sm text-gray-600">View schedule</p>
          </div>
        </div>
      </button>
    </div>

    {/* Info Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Quick Links
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => setActiveItem("SalaryPage")}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between group"
          >
            <span className="text-gray-700 group-hover:text-gray-900">
              View Salary
            </span>
            <DollarSign className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </button>
          <button
            onClick={() => setActiveItem("attendanceReport")}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between group"
          >
            <span className="text-gray-700 group-hover:text-gray-900">
              Attendance Report
            </span>
            <BarChart3 className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Important Information
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          {[
            "Use Leave Form to apply for time off",
            "Check Leave Calendar for company holidays",
            "View your salary slips anytime",
            "Update your profile information",
          ].map((info) => (
            <p key={info} className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>{info}</span>
            </p>
          ))}
        </div>
      </div>
    </div>

    {/* Attendance Records */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-blue-600" />
        Recent Attendance (Last 7 Days)
      </h3>
      <div className="overflow-x-auto">
        {isLoadingAttendance ? (
          <div className="py-8 text-center">
            <div className="inline-block w-6 h-6 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-gray-600">
              Loading attendance...
            </p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  OUT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record, index) => {
                  const isLate = record.late_status === "Late";
                  const isNPL =
                    record.status === "NPL" ||
                    record.status === "No Pay Leave";
                  const isHalfDay = record.status === "Half Day";
                  const isShortLeave = record.status === "Short Leave";

                  return (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.in_time || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.out_time || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isNPL
                              ? "bg-red-100 text-red-800"
                              : isLate
                              ? "bg-yellow-100 text-yellow-800"
                              : isHalfDay
                              ? "bg-orange-100 text-orange-800"
                              : isShortLeave
                              ? "bg-purple-100 text-purple-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {isNPL
                            ? "NPL"
                            : isLate
                            ? "Late"
                            : isHalfDay
                            ? "Half Day"
                            : isShortLeave
                            ? "Short Leave"
                            : "Present"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-8 text-center text-gray-500 text-sm"
                  >
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
);

// ─── Dashboard (main) ─────────────────────────────────────────────────────────
const Dashboard = ({ user, onLogout }) => {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [lateCount, setLateCount] = useState(0);
  const responsive = getResponsive();

  // Fetch employee profile for employee role
  useEffect(() => {
    if (user.role === "employee" && user.employee_id) {
      employeeService
        .fetchEmployeeById(user.employee_id)
        .then((data) => {
          setEmployeeProfile(data);
          if (data?.attendance_employee_no) {
            fetchAttendanceRecords(data.attendance_employee_no);
          }
        })
        .catch((err) =>
          console.error("Error fetching employee profile:", err)
        );
    }
  }, [user]);

  const fetchAttendanceRecords = async (empNo) => {
    setIsLoadingAttendance(true);
    try {
      const response = await timeCardService.searchEmployeeTimeCards(empNo);
      if (response && Array.isArray(response)) {
        setAttendanceRecords(response.slice(0, 7));
        calculateLateCount(response);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const calculateLateCount = (records) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lateThisMonth = records.filter((record) => {
      const recordDate = new Date(record.date);
      return (
        recordDate.getMonth() === currentMonth &&
        recordDate.getFullYear() === currentYear &&
        record.late_status === "Late"
      );
    }).length;
    setLateCount(lateThisMonth);
  };

  useEffect(() => {
    const unsubscribe = sidebarUtils.subscribe((isOpen) => {
      setIsSidebarOpen(isOpen);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    handleBreakpointChange(responsive.isDesktop);
  }, [responsive.isDesktop]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if ((responsive.isMobile || responsive.isTablet) && isSidebarOpen) {
        if (isOutsideClick(event)) {
          closeSidebar();
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSidebarOpen, responsive.isMobile, responsive.isTablet]);

  const toggle = () => toggleSidebar();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    if (
      parts[0] === "dashboard" &&
      parts[1] === "pms" &&
      parts[2] === "evaluation"
    ) {
      setActiveItem("employeeEvaluation");
    } else {
      const section = parts[1] || "dashboard";
      if (section && section !== activeItem) {
        setActiveItem(section);
      }
    }
  }, [location.pathname]);

  const handleSetActiveItem = (id) => {
    setActiveItem(id);
    if (id === "dashboard") navigate("/dashboard", { replace: false });
    else if (id === "employeeEvaluation")
      navigate("/dashboard/pms/evaluation", { replace: false });
    else navigate(`/dashboard/${id}`, { replace: false });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeItem]);

  const renderContent = () => {
    switch (activeItem) {
      case "employeeMaster":
        return (
          <ProtectedComponent module="employeeMaster" action="view">
            <EmployeeMaster />
          </ProtectedComponent>
        );
      case "employeeAdd":
        return (
          <ProtectedComponent module="employeeAdd" action="view">
            <EmployeeAdd />
          </ProtectedComponent>
        );
      case "show":
        return (
          <ProtectedComponent module="show" action="view">
            <ShowEmployee />
          </ProtectedComponent>
        );
      case "myProfile":
        return <MyProfile />;
      case "EmployeeMaster":
        return (
          <ProtectedComponent module="EmployeeMaster" action="view">
            <EmployeeMaster />
          </ProtectedComponent>
        );
      case "createNewDeduction":
        return (
          <ProtectedComponent module="createNewDeduction" action="view">
            <CreateNewDeduction />
          </ProtectedComponent>
        );
      case "createNewBonus":
        return (
          <ProtectedComponent module="createNewBonus" action="view">
            <CreateNewBonus />
          </ProtectedComponent>
        );
      case "shiftTime":
        return (
          <ProtectedComponent module="shiftTime" action="view">
            <ShiftSchedule />
          </ProtectedComponent>
        );
      case "createNewAllowance":
        return (
          <ProtectedComponent module="createNewAllowance" action="view">
            <CreateNewAllowance />
          </ProtectedComponent>
        );
      case "employeeLoan":
        return (
          <ProtectedComponent module="employeeLoan" action="view">
            <EmployeeLoan />
          </ProtectedComponent>
        );
      case "viewLoans":
        return (
          <ProtectedComponent module="viewLoans" action="view">
            <ViewLoans />
          </ProtectedComponent>
        );
      case "noPayManagement":
        return (
          <ProtectedComponent module="noPayManagement" action="view">
            <NoPayManagement />
          </ProtectedComponent>
        );
      case "hrLeaveApproval":
        return (
          <ProtectedComponent module="hrLeaveApproval" action="view">
            <HRLeaveApproval />
          </ProtectedComponent>
        );
      case "leaveApproval":
        return (
          <ProtectedComponent module="leaveApproval" action="view">
            <LeaveApproval />
          </ProtectedComponent>
        );
      case "leaveMaster":
        return (
          <ProtectedComponent module="leaveMaster" action="view">
            <LeaveMaster />
          </ProtectedComponent>
        );
      case "TimeCard":
        return (
          <ProtectedComponent module="TimeCard" action="view">
            <TimeCard />
          </ProtectedComponent>
        );
      case "Overtime":
        return (
          <ProtectedComponent module="Overtime" action="view">
            <Overtime />
          </ProtectedComponent>
        );
      case "departmentMaster":
        return (
          <ProtectedComponent module="departmentMaster" action="view">
            <Department />
          </ProtectedComponent>
        );
      case "grouproster":
        return (
          <ProtectedComponent module="grouproster" action="view">
            <Grouproster />
          </ProtectedComponent>
        );
      case "shiftOvertimeRates":
        return (
          <ProtectedComponent module="shiftOvertimeRates" action="view">
            <ShiftOvertimeRates />
          </ProtectedComponent>
        );
      case "leavecalendar":
        return (
          <ProtectedComponent module="leavecalendar" action="view">
            <LeaveCalendar />
          </ProtectedComponent>
        );
      case "SalaryProcessPage":
        return (
          <ProtectedComponent module="SalaryProcessPage" action="view">
            <SalaryProcessPage />
          </ProtectedComponent>
        );
      case "termination":
        return (
          <ProtectedComponent module="termination" action="view">
            <Termination />
          </ProtectedComponent>
        );
      case "SalaryPage":
        return (
          <ProtectedComponent module="SalaryPage" action="view">
            <SalaryPage />
          </ProtectedComponent>
        );
      case "resignation":
        return (
          <ProtectedComponent module="resignation" action="view">
            <Resignation />
          </ProtectedComponent>
        );
      case "userManagement":
        return (
          <ProtectedComponent module="userManagement" action="view">
            <UserManagement />
          </ProtectedComponent>
        );
      case "pmsDashboard":
        return (
          <ProtectedComponent module="pmsDashboard" action="view">
            <PMSDashboard />
          </ProtectedComponent>
        );
      case "performanceReviews":
        return (
          <ProtectedComponent module="performanceReviews" action="view">
            <PerformanceReviews />
          </ProtectedComponent>
        );
      case "kpis":
        return (
          <ProtectedComponent module="kpis" action="view">
            <KPIs />
          </ProtectedComponent>
        );
      case "employeeEvaluation":
        return <EmployeePerformanceEvaluation />;
      case "PerformanceAppraisal":
        return (
          <ProtectedComponent module="PerformanceAppraisal" action="view">
            <PerformanceAppraisal />
          </ProtectedComponent>
        );
      case "taskApproval":
        return (
          <ProtectedComponent module="taskApproval" action="view">
            <TaskApproval />
          </ProtectedComponent>
        );
      case "myKPIs":
        return (
          <ProtectedComponent module="myKPIs" action="view">
            <EmployeeKPIView />
          </ProtectedComponent>
        );
      case "absentReport":
        return (
          <ProtectedComponent module="absentReport" action="view">
            <AbsentReport />
          </ProtectedComponent>
        );
      case "attendanceReport":
        return (
          <ProtectedComponent module="attendanceReport" action="view">
            <AttendanceReport />
          </ProtectedComponent>
        );
      case "singleEntryReport":
        return (
          <ProtectedComponent module="singleEntryReport" action="view">
            <SingleEntryReport />
          </ProtectedComponent>
        );
      case "lms":
        return (
          <ProtectedComponent module="lms" action="view">
            <LMS />
          </ProtectedComponent>
        );
      case "lmsDashboard":
        return (
          <ProtectedComponent module="lms" action="view">
            <LMS initialView="dashboard" />
          </ProtectedComponent>
        );
      case "manageExams":
        return (
          <ProtectedComponent module="manageExams" action="view">
            <LMS initialView="exams" />
          </ProtectedComponent>
        );
      case "manageCourses":
        return (
          <ProtectedComponent module="manageCourses" action="view">
            <LMS initialView="manage" />
          </ProtectedComponent>
        );
      case "myProgress":
        return (
          <ProtectedComponent module="myProgress" action="view">
            <LMS initialView="progress" />
          </ProtectedComponent>
        );
      case "lmsUserStats":
        return (
          <ProtectedComponent module="lmsUserStats" action="view">
            <UserStats />
          </ProtectedComponent>
        );
      case "accountingDashboard":
        return (
          <ProtectedComponent module="accountingDashboard" action="view">
            <AccountingDashboard setActiveItem={setActiveItem} />
          </ProtectedComponent>
        );
      case "customer":
        return (
          <ProtectedComponent module="customer" action="view">
            <Customer />
          </ProtectedComponent>
        );
      case "center":
        return (
          <ProtectedComponent module="center" action="view">
            <Center />
          </ProtectedComponent>
        );
      case "product":
        return (
          <ProtectedComponent module="product" action="view">
            <ProductList />
          </ProtectedComponent>
        );
      case "productType":
        return (
          <ProtectedComponent module="productType" action="view">
            <ProductType />
          </ProtectedComponent>
        );
      case "discountLevel":
        return (
          <ProtectedComponent module="discountLevel" action="view">
            <DiscountLevel />
          </ProtectedComponent>
        );
      case "chartOfAccounts":
        return (
          <ProtectedComponent module="chartOfAccounts" action="view">
            <ChartOfAccounts />
          </ProtectedComponent>
        );
      case "accountList":
        return (
          <ProtectedComponent module="accountList" action="view">
            <AccountList />
          </ProtectedComponent>
        );
      case "transactions":
      case "transactionsList":
        return (
          <ProtectedComponent module="transactions" action="view">
            <Transactions />
          </ProtectedComponent>
        );
      case "ledger":
        return (
          <ProtectedComponent module="ledger" action="view">
            <Ledger />
          </ProtectedComponent>
        );
      case "trialBalance":
        return (
          <ProtectedComponent module="trialBalance" action="view">
            <TrialBalance />
          </ProtectedComponent>
        );
      case "incomeStatement":
        return (
          <ProtectedComponent module="incomeStatement" action="view">
            <IncomeStatement />
          </ProtectedComponent>
        );
      case "balanceSheet":
        return (
          <ProtectedComponent module="balanceSheet" action="view">
            <BalanceSheet />
          </ProtectedComponent>
        );
      case "cashFlowStatement":
        return (
          <ProtectedComponent module="cashFlowStatement" action="view">
            <CashFlowStatement />
          </ProtectedComponent>
        );
      case "invoices":
        return (
          <ProtectedComponent module="invoices" action="view">
            <Invoices />
          </ProtectedComponent>
        );
      case "salesOrder":
        return (
          <ProtectedComponent module="salesOrder" action="view">
            <SalesOrder />
          </ProtectedComponent>
        );
      case "salesReturn":
        return (
          <ProtectedComponent module="salesReturn" action="view">
            <SalesReturn />
          </ProtectedComponent>
        );
      case "grn":
        return (
          <ProtectedComponent module="grn" action="view">
            <GRN />
          </ProtectedComponent>
        );
      case "purchaseReturn":
        return (
          <ProtectedComponent module="purchaseReturn" action="view">
            <PurchaseReturn />
          </ProtectedComponent>
        );
      case "purchaseOrder":
        return (
          <ProtectedComponent module="purchaseOrder" action="view">
            <PurchaseOrder />
          </ProtectedComponent>
        );
      case "stockTransfer":
        return (
          <ProtectedComponent module="stockTransfer" action="view">
            <StockTransfer />
          </ProtectedComponent>
        );
      case "stockVerification":
        return (
          <ProtectedComponent module="stockVerification" action="view">
            <StockVerification />
          </ProtectedComponent>
        );
      case "pendingApprovals":
        return (
          <ProtectedComponent module="pendingApprovals" action="view">
            <Pending />
          </ProtectedComponent>
        );
      case "supplier":
        return (
          <ProtectedComponent module="supplier" action="view">
            <Supplier />
          </ProtectedComponent>
        );
      case "accountingReports":
        return (
          <ProtectedComponent module="accountingReports" action="view">
            <AccountingReports />
          </ProtectedComponent>
        );
      case "accountingSettings":
        return (
          <ProtectedComponent module="accountingSettings" action="view">
            <AccountingSettings />
          </ProtectedComponent>
        );
      case "supplierEnterBill":
        return (
          <ProtectedComponent module="supplierEnterBill" action="view">
            <SupplierEnterBill />
          </ProtectedComponent>
        );
      case "payment":
        return (
          <ProtectedComponent module="payment" action="view">
            <Payment />
          </ProtectedComponent>
        );
      case "advancePayment":
        return (
          <ProtectedComponent module="advancePayment" action="view">
            <AdvancePayment />
          </ProtectedComponent>
        );
      case "makeDeposit":
        return (
          <ProtectedComponent module="makeDeposit" action="view">
            <MakeDeposit />
          </ProtectedComponent>
        );
      case "receipt":
        return (
          <ProtectedComponent module="receipt" action="view">
            <Receipt />
          </ProtectedComponent>
        );
      case "createUtilityBill":
        return (
          <ProtectedComponent module="createUtilityBill" action="view">
            <UtilityBill />
          </ProtectedComponent>
        );
      case "utilityBillPayment":
        return (
          <ProtectedComponent module="utilityBillPayment" action="view">
            <UtilityBillPayment />
          </ProtectedComponent>
        );
      case "journalEntry":
        return (
          <ProtectedComponent module="journalEntry" action="view">
            <JournalEntry />
          </ProtectedComponent>
        );
      case "pettyCash":
        return (
          <ProtectedComponent module="pettyCash" action="view">
            <PettyCash />
          </ProtectedComponent>
        );
      case "cheque":
        return (
          <ProtectedComponent module="cheque" action="view">
            <Cheque />
          </ProtectedComponent>
        );
      case "doubleEntry":
        return (
          <ProtectedComponent module="doubleEntry" action="view">
            <DoubleEntry />
          </ProtectedComponent>
        );
      case "bankReconciliation":
        return (
          <ProtectedComponent module="bankReconciliation" action="view">
            <BankReconciliation />
          </ProtectedComponent>
        );
      case "leaveSettings":
        return (
          <ProtectedComponent module="leaveSettings" action="view">
            <LeaveSettings />
          </ProtectedComponent>
        );
      case "chatbot":
        return (
          <ProtectedComponent module="chatbot" action="view">
            <Chatbot />
          </ProtectedComponent>
        );
      case "changePassword":
        return <ChangePassword />;

      default:
        // Home / dashboard view
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {user.role === "employee"
                  ? "Employee Dashboard"
                  : "HRM Dashboard"}
              </h1>
              <p className="text-gray-600 text-lg">
                {user.role === "employee"
                  ? "Welcome to your employee portal"
                  : "Welcome to your comprehensive HR management system"}
              </p>
            </div>
            {user.role === "employee" ? (
              <EmployeeDashboardHome
                employeeProfile={employeeProfile}
                attendanceRecords={attendanceRecords}
                isLoadingAttendance={isLoadingAttendance}
                lateCount={lateCount}
                setActiveItem={handleSetActiveItem}
              />
            ) : (
              <AdminHRDashboardHome setActiveItem={handleSetActiveItem} />
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        onLogout={onLogout}
        activeItem={activeItem}
        setActiveItem={handleSetActiveItem}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Navbar */}
        <nav className="bg-white shadow-lg border-b border-gray-200 flex-shrink-0 z-10">
          <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="flex justify-between h-14 sm:h-16">
              <div className="flex items-center lg:hidden">
                <button
                  data-hamburger
                  onClick={toggle}
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
                  <span className="text-xl font-bold text-gray-900">
                    {user.role === "employee"
                      ? "Employee Dashboard"
                      : "HRM Dashboard"}
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
                    >
                      <path d="M10 2a4 4 0 00-4 4v1H4a2 2 0 00-2 2v2h16V9a2 2 0 00-2-2h-2V6a4 4 0 00-4-4zm-2 5V6a2 2 0 114 0v1H8zm-4 6v3a2 2 0 002 2h8a2 2 0 002-2v-3H4z" />
                    </svg>
                    {user.role}
                  </span>
                </span>
                <NotificationBell />
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

        {/* Page content */}
        <div className="flex-1">
          <div className="py-3 sm:py-4 lg:py-6 px-3 sm:px-4 lg:px-6 xl:px-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;