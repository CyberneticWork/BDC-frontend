import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Home,
  UserCheck,
  DollarSign,
  Calendar,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronRight,
  Settings,
  LogOut,
  X,
  User2,
  UserPlus,
  User, // <-- add this
  Star,
  Target,
  Award,
  ClipboardCheck,
  PieChart,
  BookOpen, // Add for LMS
  Calculator, // Add for Accounting
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext"; // Adjust path

const Sidebar = ({
  user,
  onLogout,
  activeItem,
  setActiveItem,
  isOpen,
  setIsOpen,
}) => {
  const { hasPermission } = useAuth();

  const [expandedItems, setExpandedItems] = useState({
    hrMaster: false,
    allowanceDeduction: false, // Replace allowance and deduction with this
    loans: false,
    salaryProcess: false,
    timeAttendance: false,
    pms: false,
    lms: false,
    accounting: false,
    chartOfAccounts: false,
    transactions: false,
    financeReports: false,
  });

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: Home, badge: null },
    { id: "userManagement", name: "User Management", icon: Users },
    // { id: "user", name: "Users", icon: User2, badge: null },
    {
      id: "hrMaster",
      name: "HR Master",
      icon: Users,
      badge: null,
      subItems: [
        { id: "show", name: "Show Employee", icon: UserCheck },
        { id: "employeeMaster", name: " Add Employee Master" },
        { id: "departmentMaster", name: "Department Master" },
        { id: "shiftTime", name: "Shift Time" },
        { id: "grouproster", name: "Roster" },
        { id: "resignation", name: "Resignation" },
        { id: "termination", name: "Termination" },
        // { id: "userManagement", name: "User Management", icon: Users },
        {
          id: "allowanceDeduction",
          name: "Compensation",
          icon: DollarSign,
          subItems: [
            { id: "createNewAllowance", name: "Allowance" },
            { id: "createNewDeduction", name: "Deduction" },
          ],
        },
        {
          id: "loans",
          name: "Loans",
          icon: DollarSign,
          subItems: [
            { id: "viewLoans", name: "View Loans" },
            { id: "employeeLoan", name: "Employee Wise Loan" },
          ],
        },
        {
          id: "salaryProcess",
          name: "Salary Process",
          icon: DollarSign,
          subItems: [
            { id: "SalaryProcessPage", name: "Salary Process" },
            { id: "SalaryPage", name: "View Salary" },
          ],
        },
        {
          id: "timeAttendance",
          name: "Time Attendance",
          icon: UserCheck,
          subItems: [
            { id: "TimeCard", name: "Time Card" },
            { id: "Overtime", name: "Over Time" },
            { id: "leaveMaster", name: "Leave Master" },
            { id: "leaveApproval", name: "Leave Approval" },
            { id: "hrLeaveApproval", name: "HR Leave Approval" },
            { id: "noPayManagement", name: "NoPay" },
            { id: "leavecalendar", name: "Leave Calendar" },
          ],
        },
        //add more i needed
      ],
    },
    {
      id: "pms",
      name: "PMS",
      icon: Star,
      badge: null,
      subItems: [
        { id: "pmsDashboard", name: "PMS Dashboard", icon: Home },
        {
          id: "performanceReviews",
          name: "Performance Reviews",
          icon: ClipboardCheck,
        },
        { id: "kpis", name: "KPIs", icon: PieChart },
        { id: "myKPIs", name: "My KPI Tasks", icon: User },
        { id: "employeeEvaluation", name: "Employee Evaluation", icon: Award },
        // { id: "goals", name: "Goals & OKRs", icon: Target },
        // { id: "360feedback", name: "360 Feedback", icon: Users },
        // { id: "appraisals", name: "Appraisals", icon: Award },
        // { id: "competency", name: "Competency Library", icon: ClipboardCheck },
        // { id: "developmentPlans", name: "Development / Learning Plans", icon: FileText },
        // { id: "succession", name: "Succession Planning", icon: Star },
        // { id: "calibration", name: "Calibration", icon: Target },
        // { id: "reports", name: "Performance Reports", icon: BarChart3 },
      ],
    },
    {
      id: "lms",
      name: "Learning Management",
      icon: BookOpen,
      badge: null,
      subItems: [
        { id: "lmsDashboard", name: "LMS Dashboard", icon: Home },
        { id: "manageExams", name: "Exams", icon: FileText },
        { id: "manageCourses", name: "Courses", icon: BookOpen },
        { id: "myProgress", name: "My Progress", icon: BarChart3 },
        { id: "lmsUserStats", name: "User Stats", icon: BarChart3 },
      ],
    },
    {
      id: "accounting",
      name: "Accounting",
      icon: Calculator,
      badge: null,
      subItems: [
        { id: "accountingDashboard", name: "Dashboard" },
        { id: "customer", name: "Customer" },
        { id: "center", name: "Center" },
        {
          id: "chartOfAccounts",
          name: "Chart of Accounts",
          subItems: [
            { id: "accountList", name: "Account List" },
          ],
        },
        {
          id: "transactions",
          name: "Transactions",
          subItems: [
            { id: "transactionsList", name: "Transaction List" },
            { id: "invoices", name: "Invoices" },
            { id: "salesOrder", name: "Sales Order" },
            { id: "salesReturn", name: "Sales Return" },
            { id: "grn", name: "GRN" },
            { id: "purchaseReturn", name: "Purchase Return" },
            { id: "purchaseOrder", name: "Purchase Order" },
            { id: "stockTransfer", name: "Stock Transfer" },
            { id: "stockVerification", name: "Stock Verification" },
          ],
        },
        {
          id: "financeReports",
          name: "Finance Reports",
          icon: BarChart3,
          subItems: [
            { id: "trialBalance", name: "Trial Balance" },
            { id: "incomeStatement", name: "Income Statement" },
            { id: "balanceSheet", name: "Balance Sheet" },
            { id: "cashFlowStatement", name: "Cash Flow Statement" },
          ],
        },
        { id: "ledger", name: "Ledger" },
        { id: "expenses", name: "Expenses" },
        { id: "accountingSettings", name: "Settings" },
       
      ],
    },
    { id: "utilities", name: "Utilities", icon: FileText, badge: null },
  ];

  // NEW: auto-expand nested groups based on the current activeItem (works on reload)
  useEffect(() => {
    const findPath = (items, target) => {
      for (const item of items) {
        if (item.id === target) return [item.id];
        if (item.subItems) {
          const subPath = findPath(item.subItems, target);
          if (subPath) return [item.id, ...subPath];
        }
      }
      return null;
    };

    const path = findPath(menuItems, activeItem) || [];

    setExpandedItems({
      hrMaster: path.includes("hrMaster"),
      allowanceDeduction:
        path.includes("allowanceDeduction") ||
        activeItem === "allowanceDeduction",
      loans: path.includes("loans") || activeItem === "loans",
      salaryProcess:
        path.includes("salaryProcess") || activeItem === "salaryProcess",
      timeAttendance:
        path.includes("timeAttendance") || activeItem === "timeAttendance",
      pms: path.includes("pms") || activeItem === "pms",
      lms: path.includes("lms") || activeItem === "lms",
      accounting: path.includes("accounting") || activeItem === "accounting",
      chartOfAccounts: path.includes("chartOfAccounts") || activeItem === "chartOfAccounts" || activeItem === "accountList",
      transactions: path.includes("transactions") || activeItem === "transactions" || ["transactionsList", "invoices", "salesOrder", "salesReturn", "grn", "purchaseReturn", "purchaseOrder", "stockTransfer", "stockVerification"].includes(activeItem),
      financeReports: path.includes("financeReports") || activeItem === "financeReports" || ["trialBalance", "incomeStatement", "balanceSheet", "cashFlowStatement"].includes(activeItem),
    });
  }, [activeItem]);

  const toggleHrMaster = () => {
    setExpandedItems((prev) => ({ ...prev, hrMaster: !prev.hrMaster }));
  };
  const toggleAllowanceDeduction = () => {
    setExpandedItems((prev) => ({
      ...prev,
      allowanceDeduction: !prev.allowanceDeduction,
    }));
  };
  const toggleLoans = () => {
    setExpandedItems((prev) => ({ ...prev, loans: !prev.loans }));
  };
  const toggleSalaryProcess = () => {
    setExpandedItems((prev) => ({
      ...prev,
      salaryProcess: !prev.salaryProcess,
    }));
  };
  const toggleTimeAttendance = () => {
    setExpandedItems((prev) => ({
      ...prev,
      timeAttendance: !prev.timeAttendance,
    }));
  };
  const togglePMS = () => {
    setExpandedItems((prev) => ({ ...prev, pms: !prev.pms }));
  };
  const toggleLMS = () => {
    setExpandedItems((prev) => ({ ...prev, lms: !prev.lms }));
  };
  const toggleAccounting = () => {
    setExpandedItems((prev) => ({ ...prev, accounting: !prev.accounting }));
  };
  const toggleChartOfAccounts = () => {
    setExpandedItems((prev) => ({ ...prev, chartOfAccounts: !prev.chartOfAccounts }));
  };
  const toggleTransactions = () => {
    setExpandedItems((prev) => ({ ...prev, transactions: !prev.transactions }));
  };
  const toggleFinanceReports = () => {
    setExpandedItems((prev) => ({ ...prev, financeReports: !prev.financeReports }));
  };

  // Recursive function to filter menu items based on permissions
  const filterMenuItems = (items) => {
    return items
      .map((item) => {
        if (item.subItems) {
          const filteredSubItems = filterMenuItems(item.subItems);
          if (filteredSubItems.length > 0 && hasPermission(item.id, "view")) {
            return { ...item, subItems: filteredSubItems };
          }
        } else if (hasPermission(item.id, "view")) {
          return item;
        }
        return null;
      })
      .filter(Boolean);
  };

  const filteredMenuItems = filterMenuItems(menuItems);
  
  // Debug log for Customer and Center permissions
  console.log('Customer permission:', hasPermission('customer', 'view'));
  console.log('Center permission:', hasPermission('center', 'view'));
  console.log('Accounting menu items:', filteredMenuItems.find(item => item.id === 'accounting')?.subItems);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        data-sidebar
        className={`
        min-h-screen bg-white border-r border-gray-200 shadow-lg z-50
        transform transition-transform duration-300 ease-in-out
        w-64 sm:w-72 md:w-80 lg:w-64
        fixed left-0 top-0
        lg:static lg:z-0 lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        overflow-y-auto sidebar-scroll
      `}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-indigo-600 p-2 rounded-lg flex-shrink-0">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 text-sm sm:text-base truncate">HRM System</h2>
                <p className="text-xs text-gray-500">v2.1.0</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs sm:text-sm">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{user.name}</p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">HR Manager</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-2 sm:p-4 pb-20">
          <ul className="space-y-1 sm:space-y-2">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                {item.subItems ? (
                  <>
                    {/* support multiple top-level dropdowns dynamically */}
                    {(() => {
                      const topDropdowns = {
                        hrMaster: {
                          toggle: toggleHrMaster,
                          expanded: expandedItems.hrMaster,
                        },
                        pms: { toggle: togglePMS, expanded: expandedItems.pms },
                        lms: { toggle: toggleLMS, expanded: expandedItems.lms },
                        accounting: {
                          toggle: toggleAccounting,
                          expanded: expandedItems.accounting,
                        },
                      };
                      const top = topDropdowns[item.id] || {
                        toggle: () => {},
                        expanded: false,
                      };

                      return (
                        <button
                          onClick={top.toggle}
                          className={`
    w-full flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium
    transition-all duration-200 group
    ${
      activeItem === item.id ||
      item.subItems.some((subItem) => activeItem === subItem.id)
        ? "bg-indigo-50 text-indigo-700"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
    }
  `}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <item.icon
                              className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                                activeItem === item.id ||
                                item.subItems.some(
                                  (subItem) => activeItem === subItem.id
                                )
                                  ? "text-indigo-600"
                                  : "text-gray-400 group-hover:text-gray-600"
                              }`}
                            />
                            <span className="text-left truncate">
                              {item.name}
                            </span>
                          </div>{" "}
                          {/* Changed here */}
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {item.badge && (
                              <span
                                className={`
          px-1.5 sm:px-2 py-0.5 text-xs rounded-full font-medium
          ${
            activeItem === item.id ||
            item.subItems.some((subItem) => activeItem === subItem.id)
              ? "bg-indigo-100 text-indigo-700"
              : "bg-gray-100 text-gray-600"
          }
        `}
                              >
                                {item.badge}
                              </span>
                            )}
                            {top.expanded ? (
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                            )}
                          </div>
                        </button>
                      );
                    })()}

                    {/* use top-expanded state to render children */}
                    {(() => {
                      const topExpanded =
                        item.id === "hrMaster"
                          ? expandedItems.hrMaster
                          : item.id === "pms"
                          ? expandedItems.pms
                          : item.id === "lms"
                          ? expandedItems.lms
                          : item.id === "accounting"
                          ? expandedItems.accounting
                          : false;
                      if (!topExpanded) return null;
                      return (
                        <ul className="ml-3 sm:ml-4 mt-1 space-y-1">
                          {item.subItems.map((subItem) => {
                            // Map subItem.id to its toggle and expanded state
                            const subDropdowns = {
                              allowanceDeduction: {
                                toggle: toggleAllowanceDeduction,
                                expanded: expandedItems.allowanceDeduction,
                              },
                              loans: {
                                toggle: toggleLoans,
                                expanded: expandedItems.loans,
                              },
                              salaryProcess: {
                                toggle: toggleSalaryProcess,
                                expanded: expandedItems.salaryProcess,
                              },
                              timeAttendance: {
                                toggle: toggleTimeAttendance,
                                expanded: expandedItems.timeAttendance,
                              },
                              chartOfAccounts: {
                                toggle: toggleChartOfAccounts,
                                expanded: expandedItems.chartOfAccounts,
                              },
                              transactions: {
                                toggle: toggleTransactions,
                                expanded: expandedItems.transactions,
                              },
                              financeReports: {
                                toggle: toggleFinanceReports,
                                expanded: expandedItems.financeReports,
                              },
                            };

                            if (subItem.subItems) {
                              const dropdown = subDropdowns[subItem.id] || {};
                              return (
                                <li key={subItem.id}>
                                  <button
                                    onClick={dropdown.toggle}
                                    className={`
                                     w-full flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium
                                     transition-all duration-200
                                     ${
                                       activeItem === subItem.id ||
                                       subItem.subItems.some(
                                         (s) => activeItem === s.id
                                       )
                                         ? "bg-indigo-50 text-indigo-700"
                                         : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                     }
                                   `}
                                  >
                                    <span className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                      {subItem.icon ? (
                                        <subItem.icon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                      ) : (
                                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 flex-shrink-0"></span>
                                      )}
                                      <span className="truncate">{subItem.name}</span>
                                    </span>
                                    {dropdown.expanded ? (
                                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                    )}
                                  </button>
                                  {dropdown.expanded && (
                                    <ul className="ml-3 sm:ml-4 mt-1 space-y-1">
                                      {subItem.subItems.map((subSubItem) => (
                                        <li key={subSubItem.id}>
                                          <button
                                            onClick={() =>
                                              setActiveItem(subSubItem.id)
                                            }
                                            className={`
                                             w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium
                                             transition-all duration-200
                                             ${
                                               activeItem === subSubItem.id
                                                 ? "bg-indigo-50 text-indigo-700"
                                                 : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                             }
                                           `}
                                          >
                                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-300 flex-shrink-0"></span>
                                            <span className="truncate">{subSubItem.name}</span>
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              );
                            }
                            return (
                              <li key={subItem.id}>
                                <button
                                  onClick={() => setActiveItem(subItem.id)}
                                  className={`
                                   w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium
                                   transition-all duration-200
                                   ${
                                     activeItem === subItem.id
                                       ? "bg-indigo-50 text-indigo-700"
                                       : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                   }
                                 `}
                                >
                                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 flex-shrink-0"></span>
                                  <span className="truncate">{subItem.name}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      );
                    })()}
                  </>
                ) : (
                  <button
                    onClick={() => setActiveItem(item.id)}
                    className={`
                      w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium
                      transition-all duration-200 group
                      ${
                        activeItem === item.id
                          ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }
                    `}
                  >
                    <item.icon
                      className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                        activeItem === item.id
                          ? "text-indigo-600"
                          : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    />
                    <span className="flex-1 text-left truncate">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`
                        px-1.5 sm:px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0
                        ${
                          activeItem === item.id
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 text-gray-600"
                        }
                      `}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 sm:p-4 border-t border-gray-100 space-y-1 sm:space-y-2">
          <button
            onClick={() => setActiveItem("settings")}
            className={`
              w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium
              transition-all duration-200 group
              ${
                activeItem === "settings"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }
            `}
          >
            <Settings
              className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                activeItem === "settings"
                  ? "text-indigo-600"
                  : "text-gray-400 group-hover:text-gray-600"
              }`}
            />
            <span className="truncate">Settings</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 group"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 group-hover:text-red-600 flex-shrink-0" />
            <span className="truncate">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
