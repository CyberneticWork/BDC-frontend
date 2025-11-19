import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  UserCheck,
  Calendar,
  Clock,
  DollarSign,
  PieChart,
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

import { useLocation, useNavigate } from "react-router-dom";
import {
  sidebarUtils,
  toggleSidebar,
  closeSidebar,
  openSidebar,
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

const STORAGE_KEY = "employeeFormData";

const clearForm = () => {
  localStorage.removeItem(STORAGE_KEY);
};

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
        // Fetch total employees
        const employees = await employeeService.fetchEmployees();
        // Fetch departments
        const departments = await fetchDepartments();
        // Fetch today's stats
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
        // Fetch attendance for the last 7 days
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        let presentCounts = [];
        let absentCounts = [];

        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dateStr = date.toISOString().slice(0, 10);

          // Get present count for this date
          const timeCards = await timeCardService.getTimeCardsByDate(dateStr);
          const presentEmployees = new Set();

          timeCards.forEach((card) => {
            if (card.status === "IN") {
              presentEmployees.add(card.employee_id);
            }
          });

          const employees = await employeeService.fetchEmployees();
          presentCounts.push(presentEmployees.size);
          absentCounts.push(employees.length - presentEmployees.size);
        }

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

        // Fetch departments and employee counts per department
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
    </div>
  );
};

const QuickActions = ({ setActiveItem }) => {
  const actions = [
    {
      icon: Users,
      label: "Add Employee",
      action: "employeeMaster",
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Calendar,
      label: "Leave",
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
      label: "Loan",
      action: "employeeLoan",
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: PieChart,
      label: "Leave Calendar",
      action: "leavecalendar",
      color: "from-pink-500 to-pink-600",
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

const Dashboard = ({ user, onLogout }) => {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const responsive = getResponsive();

  // Handle sidebar state changes
  useEffect(() => {
    const unsubscribe = sidebarUtils.subscribe((isOpen) => {
      setIsSidebarOpen(isOpen);
    });

    return () => unsubscribe();
  }, []);

  // Handle breakpoint changes
  useEffect(() => {
    handleBreakpointChange(responsive.isDesktop);
  }, [responsive.isDesktop]);

  // Handle outside clicks for sidebar
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

  const toggle = () => {
    toggleSidebar();
  };

  const close = () => {
    closeSidebar();
  };

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

  // Scroll to top on activeItem change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeItem]);

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
        <div className="flex-1">
          <div className="py-3 sm:py-4 lg:py-6 px-3 sm:px-4 lg:px-6 xl:px-8">
            {activeItem === "employeeMaster" ? (
              <ProtectedComponent module="employeeMaster" action="view">
                <EmployeeMaster />
              </ProtectedComponent>
            ) : activeItem === "employeeAdd" ? (
              <ProtectedComponent module="employeeAdd" action="view">
                <EmployeeAdd />
              </ProtectedComponent>
            ) : activeItem === "show" ? (
              <ProtectedComponent module="show" action="view">
                <ShowEmployee />
              </ProtectedComponent>
            ) : activeItem === "EmployeeMaster" ? (
              <ProtectedComponent module="EmployeeMaster" action="view">
                <EmployeeMaster />
              </ProtectedComponent>
            ) : activeItem === "createNewDeduction" ? (
              <ProtectedComponent module="createNewDeduction" action="view">
                <CreateNewDeduction />
              </ProtectedComponent>
            ) : activeItem === "shiftTime" ? (
              <ProtectedComponent module="shiftTime" action="view">
                <ShiftSchedule />
              </ProtectedComponent>
            ) : activeItem === "createNewAllowance" ? (
              <ProtectedComponent module="createNewAllowance" action="view">
                <CreateNewAllowance />
              </ProtectedComponent>
            ) : activeItem === "employeeLoan" ? (
              <ProtectedComponent module="employeeLoan" action="view">
                <EmployeeLoan />
              </ProtectedComponent>
            ) : activeItem === "viewLoans" ? (
              <ProtectedComponent module="viewLoans" action="view">
                <ViewLoans />
              </ProtectedComponent>
            ) : activeItem === "noPayManagement" ? (
              <ProtectedComponent module="noPayManagement" action="view">
                <NoPayManagement />
              </ProtectedComponent>
            ) : activeItem === "hrLeaveApproval" ? (
              <ProtectedComponent module="hrLeaveApproval" action="view">
                <HRLeaveApproval />
              </ProtectedComponent>
            ) : activeItem === "leaveApproval" ? (
              <ProtectedComponent module="leaveApproval" action="view">
                <LeaveApproval />
              </ProtectedComponent>
            ) : activeItem === "leaveMaster" ? (
              <ProtectedComponent module="leaveMaster" action="view">
                <LeaveMaster />
              </ProtectedComponent>
            ) : activeItem === "TimeCard" ? (
              <ProtectedComponent module="TimeCard" action="view">
                <TimeCard />
              </ProtectedComponent>
            ) : activeItem === "Overtime" ? (
              <ProtectedComponent module="Overtime" action="view">
                <Overtime />
              </ProtectedComponent>
            ) : activeItem === "departmentMaster" ? (
              <ProtectedComponent module="departmentMaster" action="view">
                <Department />
              </ProtectedComponent>
            ) : activeItem === "grouproster" ? (
              <ProtectedComponent module="grouproster" action="view">
                <Grouproster />
              </ProtectedComponent>
            ) : activeItem === "leavecalendar" ? (
              <ProtectedComponent module="leavecalendar" action="view">
                <LeaveCalendar />
              </ProtectedComponent>
            ) : activeItem === "SalaryProcessPage" ? (
              <ProtectedComponent module="SalaryProcessPage" action="view">
                <SalaryProcessPage />
              </ProtectedComponent>
            ) : activeItem === "termination" ? (
              <ProtectedComponent module="termination" action="view">
                <Termination />
              </ProtectedComponent>
            ) : activeItem === "SalaryPage" ? (
              <ProtectedComponent module="SalaryPage" action="view">
                <SalaryPage />
              </ProtectedComponent>
            ) : activeItem === "resignation" ? (
              <ProtectedComponent module="resignation" action="view">
                <Resignation />
              </ProtectedComponent>
            ) : activeItem === "userManagement" ? (
              <ProtectedComponent module="userManagement" action="view">
                <UserManagement />
              </ProtectedComponent>
            ) : activeItem === "pmsDashboard" ? (
              <ProtectedComponent module="pmsDashboard" action="view">
                <PMSDashboard />
              </ProtectedComponent>
            ) : activeItem === "performanceReviews" ? (
              <ProtectedComponent module="performanceReviews" action="view">
                <PerformanceReviews />
              </ProtectedComponent>
            ) : activeItem === "kpis" ? (
              <ProtectedComponent module="kpis" action="view">
                <KPIs />
              </ProtectedComponent>
            ) : activeItem === "employeeEvaluation" ? (
              <EmployeePerformanceEvaluation />
            ) : activeItem === "PerformanceAppraisal" ? (
              <ProtectedComponent module="PerformanceAppraisal" action="view">
                <PerformanceAppraisal />
              </ProtectedComponent>
            ) : activeItem === "taskApproval" ? (
              <ProtectedComponent module="taskApproval" action="view">
                <TaskApproval />
              </ProtectedComponent>
            ) : activeItem === "myKPIs" ? (
              <ProtectedComponent module="myKPIs" action="view">
                <EmployeeKPIView />
              </ProtectedComponent>
            ) : activeItem === "lms" ? (
              <ProtectedComponent module="lms" action="view">
                <LMS />
              </ProtectedComponent>
            ) : activeItem === "lmsDashboard" ? (
              <ProtectedComponent module="lms" action="view">
                <LMS initialView="dashboard" />
              </ProtectedComponent>
            ) : activeItem === "manageExams" ? (
              <ProtectedComponent module="manageExams" action="view">
                <LMS initialView="exams" />
              </ProtectedComponent>
            ) : activeItem === "manageCourses" ? (
              <ProtectedComponent module="manageCourses" action="view">
                <LMS initialView="manage" />
              </ProtectedComponent>
            ) : activeItem === "myProgress" ? (
              <ProtectedComponent module="myProgress" action="view">
                <LMS initialView="progress" />
              </ProtectedComponent>
            ) : activeItem === "lmsUserStats" ? (
              <ProtectedComponent module="lmsUserStats" action="view">
                <UserStats />
              </ProtectedComponent>
            ) : activeItem === "accountingDashboard" ? (
              <ProtectedComponent module="accountingDashboard" action="view">
                <AccountingDashboard setActiveItem={setActiveItem} />
              </ProtectedComponent>
            ) : activeItem === "customer" ? (
              <ProtectedComponent module="customer" action="view">
                <Customer />
              </ProtectedComponent>
            ) : activeItem === "center" ? (
              <ProtectedComponent module="center" action="view">
                <Center />
              </ProtectedComponent>
            ) : activeItem === "product" ? (
              <ProtectedComponent module="product" action="view">
                <ProductList />
              </ProtectedComponent>
            ) : activeItem === "productType" ? (
              <ProtectedComponent module="productType" action="view">
                <ProductType />
              </ProtectedComponent>
            ) : activeItem === "discountLevel" ? (
              <ProtectedComponent module="discountLevel" action="view">
                <DiscountLevel />
              </ProtectedComponent>
            ) : activeItem === "chartOfAccounts" ? (
              <ProtectedComponent module="chartOfAccounts" action="view">
                <ChartOfAccounts />
              </ProtectedComponent>
            ) : activeItem === "accountList" ? (
              <ProtectedComponent module="accountList" action="view">
                <AccountList />
              </ProtectedComponent>
            ) : activeItem === "transactions" ? (
              <ProtectedComponent module="transactions" action="view">
                <Transactions />
              </ProtectedComponent>
            ) : activeItem === "transactionsList" ? (
              <ProtectedComponent module="transactionsList" action="view">
                <Transactions />
              </ProtectedComponent>
            ) : activeItem === "ledger" ? (
              <ProtectedComponent module="ledger" action="view">
                <Ledger />
              </ProtectedComponent>
            ) : activeItem === "trialBalance" ? (
              <ProtectedComponent module="trialBalance" action="view">
                <TrialBalance />
              </ProtectedComponent>
            ) : activeItem === "incomeStatement" ? (
              <ProtectedComponent module="incomeStatement" action="view">
                <IncomeStatement />
              </ProtectedComponent>
            ) : activeItem === "balanceSheet" ? (
              <ProtectedComponent module="balanceSheet" action="view">
                <BalanceSheet />
              </ProtectedComponent>
            ) : activeItem === "cashFlowStatement" ? (
              <ProtectedComponent module="cashFlowStatement" action="view">
                <CashFlowStatement />
              </ProtectedComponent>
            ) : activeItem === "invoices" ? (
              <ProtectedComponent module="invoices" action="view">
                <Invoices />
              </ProtectedComponent>
            ) : activeItem === "salesOrder" ? (
              <ProtectedComponent module="salesOrder" action="view">
                <SalesOrder />
              </ProtectedComponent>
            ) : activeItem === "salesReturn" ? (
              <ProtectedComponent module="salesReturn" action="view">
                <SalesReturn />
              </ProtectedComponent>
            ) : activeItem === "grn" ? (
              <ProtectedComponent module="grn" action="view">
                <GRN />
              </ProtectedComponent>
            ) : activeItem === "purchaseReturn" ? (
              <ProtectedComponent module="purchaseReturn" action="view">
                <PurchaseReturn />
              </ProtectedComponent>
            ) : activeItem === "purchaseOrder" ? (
              <ProtectedComponent module="purchaseOrder" action="view">
                <PurchaseOrder />
              </ProtectedComponent>
            ) : activeItem === "stockTransfer" ? (
              <ProtectedComponent module="stockTransfer" action="view">
                <StockTransfer />
              </ProtectedComponent>
            ) : activeItem === "stockVerification" ? (
              <ProtectedComponent module="stockVerification" action="view">
                <StockVerification />
              </ProtectedComponent>
            ) : activeItem === "pendingApprovals" ? (
              <ProtectedComponent module="pendingApprovals" action="view">
                <Pending />
              </ProtectedComponent>
            ) : activeItem === "supplier" ? (
              <ProtectedComponent module="supplier" action="view">
                <Supplier />
              </ProtectedComponent>
            ) : activeItem === "accountingReports" ? (
              <ProtectedComponent module="accountingReports" action="view">
                <AccountingReports />
              </ProtectedComponent>
            ) : activeItem === "accountingSettings" ? (
              <ProtectedComponent module="accountingSettings" action="view">
                <AccountingSettings />
              </ProtectedComponent>
            ) : activeItem === "supplierEnterBill" ? (
              <ProtectedComponent module="supplierEnterBill" action="view">
                <SupplierEnterBill />
              </ProtectedComponent>
            ) : activeItem === "payment" ? (
              <ProtectedComponent module="payment" action="view">
                <Payment />
              </ProtectedComponent>
            ) : activeItem === "advancePayment" ? (
              <ProtectedComponent module="advancePayment" action="view">
                <AdvancePayment />
              </ProtectedComponent>
            ) : activeItem === "makeDeposit" ? (
              <ProtectedComponent module="makeDeposit" action="view">
                <MakeDeposit />
              </ProtectedComponent>
            ) : activeItem === "receipt" ? (
              <ProtectedComponent module="receipt" action="view">
                <Receipt />
              </ProtectedComponent>
            ) : activeItem === "createUtilityBill" ? (
              <ProtectedComponent module="createUtilityBill" action="view">
                <UtilityBill />
              </ProtectedComponent>
            ) : activeItem === "utilityBillPayment" ? (
              <ProtectedComponent module="utilityBillPayment" action="view">
                <UtilityBillPayment />
              </ProtectedComponent>
            ) : activeItem === "journalEntry" ? (
              <ProtectedComponent module="journalEntry" action="view">
                <JournalEntry />
              </ProtectedComponent>
            ) : activeItem === "pettyCash" ? (
              <ProtectedComponent module="pettyCash" action="view">
                <PettyCash />
              </ProtectedComponent>
            ) : activeItem === "cheque" ? (
              <ProtectedComponent module="cheque" action="view">
                <Cheque />
              </ProtectedComponent>
            ) : activeItem === "doubleEntry" ? (
              <ProtectedComponent module="doubleEntry" action="view">
                <DoubleEntry />
              </ProtectedComponent>
            ) : activeItem === "bankReconciliation" ? (
              <ProtectedComponent module="bankReconciliation" action="view">
                <BankReconciliation />
              </ProtectedComponent>
            ) : activeItem === "supplier" ? (
              <ProtectedComponent module="supplier" action="view">
                <Supplier />
              </ProtectedComponent>
            )  : activeItem === "chatbot" ? (
              <ProtectedComponent module="chatbot" action="view">
                <Chatbot />
              </ProtectedComponent>
            ) : (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    HRM Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Welcome to your comprehensive HR management system
                  </p>
                </div>
                <DashboardStats />
                <QuickActions setActiveItem={setActiveItem} />
                <DashboardCharts />
                <div className="flex justify-center"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
