import React, { useState, useEffect, useMemo } from "react";
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
  Shield,
  MessageCircle,
  Package, // Add for Inventory
  Key, // Add for Change Password
  Briefcase, // Add for Labor Management
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext"; // Adjust path
import config from "@src/config";

const Sidebar = ({
  user,
  employeeProfile,
  onLogout,
  activeItem,
  setActiveItem,
  isOpen,
  setIsOpen,
}) => {
  const { hasPermission } = useAuth();

  const [expandedItems, setExpandedItems] = useState({
    hrMaster: false,
    allowanceDeduction: false,
    loans: false,
    salaryProcess: false,
    timeAttendance: false,
    pms: false,
    lms: false,
    accounting: false,
    chartOfAccounts: false,
    transactions: false,
    financeReports: false,
    inventory: false,
    masterFiles: false,
    // ADD
    reports: false,
    timecardReports: false,
    settings: false,
  });

  const menuItems = useMemo(() => {
    if (user.role === 'employee') {
      return [
        { id: "dashboard", name: "Dashboard", icon: Home },
        { id: "myProfile", name: "My Profile", icon: User },
        { id: "changePassword", name: "Change Password", icon: Key },
        {
          id: "hrMaster",
          name: "My Info",
          icon: Users,
          subItems: [
            {
              id: "loans",
              name: "Loans",
              subItems: [
                { id: "viewLoans", name: "My Loans" },
              ],
            },
            {
              id: "salaryProcess",
              name: "Salary",
              subItems: [
                { id: "salaryRecords", name: "Salary Records & Download" },
                { id: "downloadSalarySlip", name: "Salary Slip" },
              ],
            },
            {
              id: "timeAttendance",
              name: "Time & Attendance",
              subItems: [
                { id: "leaveMaster", name: "Leave Form" },
                { id: "attendanceReport", name: "My Attendance" },
              ],
            },
          ],
        },
      ];
    }

    return [
    { id: "dashboard", name: "Dashboard", icon: Home, badge: null },
    { id: "chatbot", name: "Chat with System", icon: MessageCircle },
    { id: "userManagement", name: "User Management", icon: Users },
    { id: "laborManagement", name: "Labor Management", icon: Briefcase },
    {
      id: "hrMaster",
      name: "HRM Master",
      icon: Users,
      badge: null,
      subItems: [
        { id: "show", name: "Show Employee", icon: UserCheck },
        { id: "employeeMaster", name: "Add Employee Master" },
        { id: "departmentMaster", name: "Department Master" },
        { id: "shiftTime", name: "Shift Time" },
        { id: "grouproster", name: "Roster" },
        { id: "shiftOvertimeRates", name: "Shift OT Rates" },
        { id: "resignation", name: "Resignation" },
        { id: "termination", name: "Termination" },
        {
          id: "allowanceDeduction",
          name: "Compensation",
          subItems: [
            { id: "createNewAllowance", name: "Allowance" },
            { id: "createNewDeduction", name: "Deduction" },
            { id: "createNewBonus", name: "Bonus" },
          ],
        },
        {
          id: "loans",
          name: "Loans",
          subItems: [
            { id: "viewLoans", name: "View Loans" },
            { id: "employeeLoan", name: "Employee Wise Loan" },
          ],
        },
        {
          id: "salaryProcess",
          name: "Salary Process",
          subItems: [
            { id: "SalaryProcessPage", name: "Salary Process" },
            { id: "SalaryPage", name: "View Salary" },
          ],
        },
        {
          id: "timeAttendance",
          name: "Time Attendance",
          subItems: [
            { id: "TimeCard", name: "Time Card" },
            { id: "Overtime", name: "Over Time" },
            { id: "leaveMaster", name: "Leave Form" },
            { id: "leaveApproval", name: "Leave Approval" },
            { id: "hrLeaveApproval", name: "HR Leave Approval" },
            { id: "noPayManagement", name: "NoPay" },
            { id: "leavecalendar", name: "Leave Calendar" },
          ],
        },
      ],
    },
    // Commented out - Not in use
    /*
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
        { id: "taskApproval", name: "Task Approval", icon: Shield }, // Add this line
        { id: "myKPIs", name: "My KPI Tasks", icon: User },
        { id: "employeeEvaluation", name: "Employee Evaluation", icon: Award },
        {
          id: "PerformanceAppraisal",
          name: "Performance Appraisal",
          icon: Award,
        },
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
    */
    // Commented out - Not in use
    /*
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
    */
    // Commented out - Not in use
    /*
    {
      id: "accounting",
      name: "Accounting",
      icon: Calculator,
      badge: null,
      subItems: [
        { id: "accountingDashboard", name: "Dashboard" },
        {
          id: "chartOfAccounts",
          name: "Chart of Accounts",
          subItems: [
            { id: "accountList", name: "Account List" },
             { id: "journalEntry", name: "Journal Entry" },
            {id: "doubleEntry", name: "Double Entry"},
            { id: "supplierEnterBill", name: "Supplier Enter Bill" },
            { id: "payment", name: "Payment" },
            { id: "advancePayment", name: "Advance Payment" },
            { id: "makeDeposit", name: "Make Deposit" },
            { id: "receipt", name: "Receipt" },
            { id: "createUtilityBill", name: "Create Utility Bill" },
            { id: "utilityBillPayment", name: "Utility Bill Payment" },
           
            { id: "pettyCash", name: "Petty Cash" },
            { id: "cheque", name: "Cheque" },
            { id: "bankReconciliation", name: "Bank Reconciliation" },
          ],
        },
        {
          id: "transactions",
          name: "Transactions",
          subItems: [
            { id: "transactionsList", name: "Transaction List" },
          ],
        },
        {
          id: "financeReports",
          name: "Finance Reports",
          subItems: [
            { id: "trialBalance", name: "Trial Balance" },
            { id: "incomeStatement", name: "Income Statement" },
            { id: "balanceSheet", name: "Balance Sheet" },
            { id: "cashFlowStatement", name: "Cash Flow Statement" },
          ],
        },
        // { id: "ledger", name: "Ledger" },
        // { id: "expenses", name: "Expenses" },
        // { id: "accountingSettings", name: "Settings" },
      ],
    },
    */
    // Commented out - Not in use
    /*
    { //for inventory section
      id: "inventory",
      name: "Inventory",
      icon: Package,
      badge: null,
      subItems: [
          {
            id: "masterFiles",
            name: "Master Files",
            icon: FileText,
            subItems: [
              { id: "customer", name: "Customer" },
              { id: "supplier", name: "Supplier" },
              { id: "center", name: "Center" },
              { id: "discountLevel", name: "Discount Level" },
              { id: "productType", name: "Product Type" },
              { id: "product", name: "Product List" },
              
            ],
          },
        {id: "pendingApprovals", name: "Pending Approval"},
        { id: "invoices", name: "Invoice" },
        { id: "salesOrder", name: "Sales Order" },
        { id: "salesReturn", name: "Sales Return" },
        { id: "grn", name: "GRN" },
        { id: "purchaseReturn", name: "Purchase Return" },
        { id: "purchaseOrder", name: "Purchase Order" },
        { id: "stockTransfer", name: "Stock Transfer" },
        { id: "stockVerification", name: "Stock Verification" },
      ],
    },
    */
    // REPLACE the plain "reports" item with a nested structure:
    {
      id: "reports",
      name: "Reports",
      icon: BarChart3,
      subItems: [
        {
          id: "timecardReports",
          name: "Timecard Reports",
          icon: FileText,
          subItems: [
            { id: "attendanceReport", name: "Attendance Report" },
            { id: "singleEntryReport", name: "Single Entry Report" },
            { id: "absentReport", name: "Absent Report" }, // NEW
          ],
        },
      ],
    },
    {
      id: "settings",
      name: "Settings",
      icon: Settings,
      badge: null,
      subItems: [
        { id: "leaveSettings", name: "Leave Settings" },
      ],
    },
    ];
  }, [user.role]);

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
        path.includes("allowanceDeduction") || activeItem === "allowanceDeduction",
      loans: path.includes("loans") || activeItem === "loans",
      salaryProcess: path.includes("salaryProcess") || activeItem === "salaryProcess" || ["SalaryProcessPage", "SalaryPage", "salaryRecords", "downloadSalarySlip"].includes(activeItem),
      timeAttendance: path.includes("timeAttendance") || activeItem === "timeAttendance",
      pms: path.includes("pms") || activeItem === "pms",
      lms: path.includes("lms") || activeItem === "lms",
      accounting: path.includes("accounting") || activeItem === "accounting",
      chartOfAccounts:
        path.includes("chartOfAccounts") ||
        activeItem === "chartOfAccounts" ||
        [
          "accountList",
          "supplierEnterBill",
          "payment",
          "advancePayment",
          "makeDeposit",
          "receipt",
          "createUtilityBill",
          "utilityBillPayment",
          "journalEntry",
          "pettyCash",
          "cheque",
          "bankReconciliation",
        ].includes(activeItem),
      transactions:
        path.includes("transactions") ||
        activeItem === "transactions" ||
        ["transactionsList"].includes(activeItem),
      financeReports:
        path.includes("financeReports") ||
        activeItem === "financeReports" ||
        ["trialBalance", "incomeStatement", "balanceSheet", "cashFlowStatement"].includes(activeItem),

      inventory:
        path.includes("inventory") ||
        activeItem === "inventory" ||
        [
          "invoices",
          "salesOrder",
          "salesReturn",
          "grn",
          "purchaseReturn",
          "purchaseOrder",
          "stockTransfer",
          "stockVerification",
          "pendingApprovals",
          // moved master files children
          "customer",
          "supplier",
          "center",
          "product",
          "discountLevel",
        ].includes(activeItem),
      masterFiles:
        path.includes("masterFiles") ||
        activeItem === "masterFiles" ||
        ["customer", "supplier", "center", "product", "discountLevel"].includes(activeItem),

      // ADD
      reports: path.includes("reports") || activeItem === "reports",
      timecardReports:
        path.includes("timecardReports") ||
        activeItem === "timecardReports" ||
        ["attendanceReport", "singleEntryReport","absentReport"].includes(activeItem),
      settings:
        path.includes("settings") ||
        activeItem === "settings" ||
        ["leaveSettings"].includes(activeItem)
        
    });
  }, [activeItem, menuItems]);

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
    setExpandedItems((prev) => ({
      ...prev,
      chartOfAccounts: !prev.chartOfAccounts,
    }));
  };
  const toggleTransactions = () => {
    setExpandedItems((prev) => ({ ...prev, transactions: !prev.transactions }));
  };
  const toggleFinanceReports = () => {
    setExpandedItems((prev) => ({
      ...prev,
      financeReports: !prev.financeReports,
    }));
  };
  const toggleInventory = () => {
    setExpandedItems((prev) => ({ ...prev, inventory: !prev.inventory }));
  };
  const toggleMasterFiles = () => {
    setExpandedItems((prev) => ({ ...prev, masterFiles: !prev.masterFiles }));
  };
  // ADD
  const toggleReports = () => {
    setExpandedItems((prev) => ({ ...prev, reports: !prev.reports }));
  };
  const toggleTimecardReports = () => {
    setExpandedItems((prev) => ({ ...prev, timecardReports: !prev.timecardReports }));
  };
  const toggleSettings = () => {
    setExpandedItems((prev) => ({ ...prev, settings: !prev.settings }));
  };

  // Recursive function to filter menu items based on permissions
  const filterMenuItems = (items, ancestors = []) => {
    // Employee role: menu already pre-filtered, skip permission checks
    if (user.role === 'employee') return items;

    return items
      .map((item) => {
        // Always show these items without permission check
        const alwaysShowItems = ["dashboard", "myProfile", "changePassword"];
        if (alwaysShowItems.includes(item.id)) {
          return item;
        }
        
        if (item.subItems) {
          const filteredSubItems = filterMenuItems(item.subItems, [...ancestors, item.id]);
          // Show parent if:
          // - it has permitted children, OR
          // - the parent itself has permission, OR
          // - any ancestor higher up has permission (fallback for broader permissions)
          if (
            filteredSubItems.length > 0 ||
            hasPermission(item.id, "view") ||
            ancestors.some((a) => hasPermission(a, "view"))
          ) {
            return { ...item, subItems: filteredSubItems };
          }
        } else if (
          hasPermission(item.id, "view") ||
          // if user has permission for any ancestor (e.g., "inventory" or "masterFiles"), allow the child
          ancestors.some((a) => hasPermission(a, "view"))
        ) {
          return item;
        }
        return null;
      })
      .filter(Boolean);
  };

  const filteredMenuItems = filterMenuItems(menuItems);

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
        className={`
        min-h-screen bg-white border-r border-gray-200 shadow-lg z-50
        transform transition-transform duration-300 ease-in-out
        w-64
        fixed left-0 top-0
        lg:static lg:z-0 lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">
                  {user.role === 'employee' ? 'Employee System' : 'HRM System'}
                </h2>
                <p className="text-xs text-gray-500">v2.1.0</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center overflow-hidden">
              {employeeProfile?.profile_photo_path ? (
                <img
                  src={`${config.apiBaseUrl}/storage/${employeeProfile.profile_photo_path}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-sm text-gray-500 truncate capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto">
          <div className="p-4">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => (
                <li key={item.id}>
                  {item.subItems ? (
                    <>
                      {/* support multiple top-level dropdowns dynamically */}
                      {(() => {
                        const topDropdowns = {
                          hrMaster: { toggle: toggleHrMaster, expanded: expandedItems.hrMaster },
                          pms: { toggle: togglePMS, expanded: expandedItems.pms },
                          lms: { toggle: toggleLMS, expanded: expandedItems.lms },
                          accounting: { toggle: toggleAccounting, expanded: expandedItems.accounting },
                          inventory: { toggle: toggleInventory, expanded: expandedItems.inventory },
                          chartOfAccounts: { toggle: toggleChartOfAccounts, expanded: expandedItems.chartOfAccounts },
                          transactions: { toggle: toggleTransactions, expanded: expandedItems.transactions },
                          financeReports: { toggle: toggleFinanceReports, expanded: expandedItems.financeReports },
                          // ADD
                          reports: { toggle: toggleReports, expanded: expandedItems.reports },
                          settings: { toggle: toggleSettings, expanded: expandedItems.settings },
                        };
                        const top = topDropdowns[item.id] || {
                          toggle: () => {},
                          expanded: false,
                        };

                        return (
                          <button
                            onClick={top.toggle}
                            className={`
    w-full flex items-right justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
    transition-all duration-200 group
    ${
      activeItem === item.id ||
      item.subItems.some((subItem) => activeItem === subItem.id)
        ? "bg-indigo-50 text-indigo-700"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
    }
  `}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <item.icon
                                className={`h-5 w-5 flex-shrink-0 ${
                                  activeItem === item.id ||
                                  item.subItems.some(
                                    (subItem) => activeItem === subItem.id
                                  )
                                    ? "text-indigo-600"
                                    : "text-gray-400 group-hover:text-gray-600"
                                }`}
                              />
                              <span className="flex-1 text-left truncate">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {item.badge && (
                                <span
                                  className={`
          px-2 py-0.5 text-xs rounded-full font-medium
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
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                          </button>
                        );
                      })()}

                      {/* use top-expanded state to render children */}
                      {(() => {
                        // Support for accounting top-level dropdowns
                        const topExpanded =
                          item.id === "hrMaster" ? expandedItems.hrMaster :
                          item.id === "pms" ? expandedItems.pms :
                          item.id === "lms" ? expandedItems.lms :
                          item.id === "accounting" ? expandedItems.accounting :
                          item.id === "inventory" ? expandedItems.inventory :
                          // ADD
                          item.id === "reports" ? expandedItems.reports :
                          item.id === "settings" ? expandedItems.settings :
                          false;
                        if (!topExpanded) return null;
                        return (
                          <ul className="ml-4 mt-1 space-y-1">
                            {item.subItems.map((subItem) => {
                              // Map subItem.id to its toggle and expanded state
                              const subDropdowns = {
                                allowanceDeduction: { toggle: toggleAllowanceDeduction, expanded: expandedItems.allowanceDeduction },
                                masterFiles: { toggle: toggleMasterFiles, expanded: expandedItems.masterFiles },
                                loans: { toggle: toggleLoans, expanded: expandedItems.loans },
                                salaryProcess: { toggle: toggleSalaryProcess, expanded: expandedItems.salaryProcess },
                                timeAttendance: { toggle: toggleTimeAttendance, expanded: expandedItems.timeAttendance },
                                chartOfAccounts: { toggle: toggleChartOfAccounts, expanded: expandedItems.chartOfAccounts },
                                transactions: { toggle: toggleTransactions, expanded: expandedItems.transactions },
                                financeReports: { toggle: toggleFinanceReports, expanded: expandedItems.financeReports },
                                // ADD
                                timecardReports: { toggle: toggleTimecardReports, expanded: expandedItems.timecardReports },
                              };

                              if (subItem.subItems) {
                                const dropdown = subDropdowns[subItem.id] || {};
                                // Check if this is an accounting-related dropdown
                                const isAccountingSubDropdown = [
                                  "chartOfAccounts",
                                  "transactions",
                                  "financeReports",
                                ].includes(subItem.id);
                                return (
                                  <li key={subItem.id}>
                                    <button
                                      onClick={
                                        dropdown.toggle ||
                                        (isAccountingSubDropdown
                                          ? subItem.id === "chartOfAccounts"
                                            ? toggleChartOfAccounts
                                            : subItem.id === "transactions"
                                            ? toggleTransactions
                                            : subItem.id === "financeReports"
                                            ? toggleFinanceReports
                                            : undefined
                                          : undefined)
                                      }
                                      className={`
                                     w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium
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
                                      <span className="flex items-center gap-2 flex-1 text-left">
                                        {subItem.icon ? (
                                          <subItem.icon className={`h-4 w-4 flex-shrink-0 text-gray-400`} />
                                        ) : (
                                          <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></span>
                                        )}
                                        <span className="truncate">{subItem.name}</span>
                                      </span>
                                      <span className="flex-shrink-0">
                                        {dropdown.expanded ? (
                                          <ChevronDown className="h-4 w-4 text-gray-500" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-gray-500" />
                                        )}
                                      </span>
                                    </button>
                                    {(dropdown.expanded ||
                                      (subItem.id === "chartOfAccounts" &&
                                        expandedItems.chartOfAccounts) ||
                                      (subItem.id === "transactions" &&
                                        expandedItems.transactions) ||
                                      (subItem.id === "financeReports" &&
                                        expandedItems.financeReports)) && (
                                      <ul className="ml-4 mt-1 space-y-1">
                                        {subItem.subItems.map((subSubItem) => (
                                          <li key={subSubItem.id}>
                                            <button
                                              onClick={() =>
                                                setActiveItem(subSubItem.id)
                                              }
                                              className={`
                                             w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                                             transition-all duration-200
                                             ${
                                               activeItem === subSubItem.id
                                                 ? "bg-indigo-50 text-indigo-700"
                                                 : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                             }
                                           `}
                                            >
                                              <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"></span>
                                              <span className="flex-1 text-left truncate">
                                                {subSubItem.name}
                                              </span>
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
                                   w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                                   transition-all duration-200
                                   ${
                                     activeItem === subItem.id
                                       ? "bg-indigo-50 text-indigo-700"
                                       : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                   }
                                 `}
                                  >
                                    <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></span>
                                    <span className="flex-1 text-left truncate">
                                      {subItem.name}
                                    </span>
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
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-200 group
                      ${
                        activeItem === item.id
                          ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }
                    `}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          activeItem === item.id
                            ? "text-indigo-600"
                            : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                      <span className="flex-1 text-left">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`
                        px-2 py-0.5 text-xs rounded-full font-medium
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
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 space-y-2 flex-shrink-0">
          
          

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 text-red-500 group-hover:text-red-600" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
