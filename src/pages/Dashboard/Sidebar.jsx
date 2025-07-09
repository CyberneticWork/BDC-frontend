import React, { useState } from "react";
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
} from "lucide-react";

const Sidebar = ({
  user,
  onLogout,
  activeItem,
  setActiveItem,
  isOpen,
  setIsOpen,
}) => {
  const [expandedItems, setExpandedItems] = useState({
    hrMaster: false,
    allowanceDeduction: false, // Replace allowance and deduction with this
    loans: false,
    salaryProcess: false,
    timeAttendance: false,
  });

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

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: Home, badge: null },

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
        // {
        //   id: "Allowance",
        //   name: "Allowance",
        //   icon: DollarSign,
        //   subItems: [{ id: "createNewAllowance", name: "View Allowance" }],
        // },
        // {
        //   id: "deduction",
        //   name: "Deduction",
        //   icon: DollarSign,
        //   subItems: [{ id: "createNewDeduction", name: "View Deduction" }],
        // },
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
            // { id: "loanMaster", name: "Loan Master" },
            { id: "employeeLoan", name: "Employee Wise Loan" },
            // { id: "loanProcess", name: "Loan Process" },
          ],
        },
        {
          id: "salaryProcess",
          name: "Salary Process",
          icon: DollarSign,
          subItems: [
            // { id: "salaryMaster", name: "Salary Master" },
            { id: "SalaryProcessPage", name: "Salary Process" },
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
            { id: "hrLeaveApproval", name: "HR Leave Approval" }, // Add this new line
            { id: "noPayManagement", name: "NoPay" },
            { id: "leavecalendar", name: "Leave Calendar" },
          ],
        },
        //add more i needed
      ],
    },
    // { id: "attendance", name: "Attendance", icon: UserCheck, badge: null },
    // { id: "payroll", name: "Payroll", icon: DollarSign, badge: null },
    // { id: "calendar", name: "Calendar", icon: Calendar, badge: null },
    { id: "reports", name: "Reports", icon: BarChart3, badge: null },
    { id: "utilities", name: "Utilities", icon: FileText, badge: null },
  ];

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
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">HRM System</h2>
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
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-sm text-gray-500 truncate">HR Manager</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                {item.subItems ? (
                  <>
                    <button
                      onClick={toggleHrMaster}
                      className={`
                        w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-200 group
                        ${
                          activeItem === item.id ||
                          item.subItems.some(
                            (subItem) => activeItem === subItem.id
                          )
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`h-5 w-5 ${
                            activeItem === item.id ||
                            item.subItems.some(
                              (subItem) => activeItem === subItem.id
                            )
                              ? "text-indigo-600"
                              : "text-gray-400 group-hover:text-gray-600"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span
                            className={`
                              px-2 py-0.5 text-xs rounded-full font-medium
                              ${
                                activeItem === item.id ||
                                item.subItems.some(
                                  (subItem) => activeItem === subItem.id
                                )
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-gray-100 text-gray-600"
                              }
                            `}
                          >
                            {item.badge}
                          </span>
                        )}
                        {expandedItems.hrMaster ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </button>

                    {expandedItems.hrMaster && (
                      <ul className="ml-4 mt-1 space-y-1">
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
                          };

                          if (subItem.subItems) {
                            const dropdown = subDropdowns[subItem.id] || {};
                            return (
                              <li key={subItem.id}>
                                <button
                                  onClick={dropdown.toggle}
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
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                    {subItem.name}
                                  </span>
                                  {dropdown.expanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                </button>
                                {dropdown.expanded && (
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
                                          <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                          <span>{subSubItem.name}</span>
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
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                <span>{subItem.name}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
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
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={() => setActiveItem("settings")}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200 group
              ${
                activeItem === "settings"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }
            `}
          >
            <Settings
              className={`h-5 w-5 ${
                activeItem === "settings"
                  ? "text-indigo-600"
                  : "text-gray-400 group-hover:text-gray-600"
              }`}
            />
            <span>Settings</span>
          </button>

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
