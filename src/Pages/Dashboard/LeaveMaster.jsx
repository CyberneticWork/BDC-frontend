import React, { useState, useEffect } from "react";
import {
  Calendar,
  User,
  Briefcase,
  Clock,
  CheckCircle,
  Search,
  Building,
  FileText,
  X,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import employeeService from "../../services/EmployeeDataService";
import {
  createLeave,
  getLeaveById,
  getLeaveCountsByEmployee,
} from "../../services/LeaveMaster";
import { fetchLeaveCalendar } from "../../services/LeaveCalendar";

const LeaveMaster = () => {
  // State for form fields
  const [formData, setFormData] = useState({
    attendanceNo: "",
    epfNo: "",
    employeeName: "",
    department: "",
    reportingDate: getCurrentDate(),
    leaveType: "",
    leaveDateType: "fullDay", // fullDay, halfDay, manual
    halfDayPeriod: "morning", // morning, afternoon
    leaveDate: {
      single: getCurrentDate(),
      from: getCurrentDate(),
      to: getCurrentDate(),
    },
    reason: "",
  });

  // Loading and notification states
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(false);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [leaveUsageData, setLeaveUsageData] = useState([]);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [disabledDates, setDisabledDates] = useState([]);
  const [hoveredDate, setHoveredDate] = useState(null);

  // Add a new state to store employee data
  const [employeeData, setEmployeeData] = useState(null);

  // Define standard leave entitlements - modified to only have Casual Leave available
  const leaveEntitlements = {
    "Casual Leave": 7,
    "Annual Leave": 0,
    "Medical Leave": 0,
    "Unpaid Leave": 0,
    "Special Leave": 0,
  };

  // Keep all leave types but make only Casual Leave selectable
  const leaveTypes = [
    "Casual Leave",
    // Keep these for future use but they won't be selectable in the dropdown
    // "Annual Leave",
    // "Medical Leave",
    // "Unpaid Leave",
    // "Special Leave",
  ];

  // Helper function to get current date in YYYY-MM-DD format
  function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  // Function to format date for display
  function formatDate(dateInput) {
    if (!dateInput) return "";
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toISOString().split("T")[0];
  }

  // Function to format leave record for display
  function formatLeaveRecord(leaveData) {
    return {
      id: leaveData.id,
      leaveDate: leaveData.leave_date
        ? formatDate(leaveData.leave_date)
        : `${formatDate(leaveData.leave_from)} to ${formatDate(
            leaveData.leave_to
          )}`,
      reportDate: formatDate(leaveData.reporting_date),
      fullHalfDay: leaveData.leave_date
        ? leaveData.period
          ? `Half Day (${leaveData.period})`
          : "Full Day"
        : "Multiple Days",
      leaveType: leaveData.leave_type,
      status: leaveData.status,
    };
  }

  // Update the getDisabledDates function to check company ID
  const getDisabledDates = (calendarData, employeeCompanyId) => {
    const dates = [];

    if (!employeeCompanyId) return dates;

    calendarData.forEach((leave) => {
      // Only process leaves that match the employee's company
      if (leave.company_id === employeeCompanyId && leave.start_date) {
        const start = new Date(leave.start_date);
        const end = leave.end_date
          ? new Date(leave.end_date)
          : new Date(leave.start_date);
        for (
          let date = new Date(start);
          date <= end;
          date.setDate(date.getDate() + 1)
        ) {
          dates.push(formatDate(new Date(date)));
        }
      }
    });
    return dates;
  };

  // Enhanced date input handler with validation
  const handleDateChange = (e) => {
    const { name, value } = e.target;

    // Check if this is a date field
    if (name.includes("leaveDate")) {
      // Check if the selected date is disabled
      if (disabledDates.includes(value)) {
        // Show error message
        Swal.fire({
          icon: "error",
          title: "Date Not Available",
          html: `
            <div class="text-left">
              <p>This date (${formatDateForDisplay(
                value
              )}) is not available for leave requests because:</p>
              <ul class="list-disc pl-5 mt-2">
                <li>It's marked as an event day</li>
                <li>Or it's already booked as leave</li>
              </ul>
              <p class="mt-3 text-sm">Please select a different date.</p>
            </div>
          `,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Ok, I understand",
          customClass: {
            popup: "rounded-xl",
            confirmButton: "rounded-lg text-sm px-5 py-2.5",
          },
        });
        return; // Don't update the state
      }
    }

    // Handle nested objects in state (like leaveDate.single, leaveDate.from, etc.)
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Format date for display in error messages
  const formatDateForDisplay = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to check if a date is disabled
  const isDateDisabled = (dateString) => {
    return disabledDates.includes(dateString);
  };

  // Function to get date input styling based on disabled status
  const getDateInputStyle = (dateString) => {
    const baseStyle =
      "w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";

    if (isDateDisabled(dateString)) {
      return `${baseStyle} bg-red-50 border-red-300 text-red-700 cursor-not-allowed`;
    }

    return `${baseStyle} border-gray-300`;
  };

  // Function to get date hover tooltip content
  const getDateHoverContent = (dateString) => {
    if (!isDateDisabled(dateString)) return null;

    return (
      <div className="absolute z-10 bottom-full mb-2 left-0 bg-red-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
        <AlertCircle className="inline mr-1 w-3 h-3" />
        Unavailable date (event or existing leave)
      </div>
    );
  };

  // Function to fetch employee leaves and calendar data (to set disabled dates)
  const fetchEmployeeLeaves = async (employeeId, empData) => {
    if (!employeeId) return;

    setIsLoadingLeaves(true);
    try {
      const [leaveData, calendarData] = await Promise.all([
        getLeaveById(employeeId),
        fetchLeaveCalendar(),
      ]);

      // Get employee's company ID from organization assignment
      const employeeCompanyId = empData?.organization_assignment?.company?.id;

      // Set disabled dates only for matching company
      const disabledDatesArray = getDisabledDates(
        calendarData,
        employeeCompanyId
      );
      setDisabledDates(disabledDatesArray);

      if (leaveData && Array.isArray(leaveData)) {
        const formattedLeaves = leaveData.map(formatLeaveRecord);
        setLeaveRecords(formattedLeaves);
      } else {
        setLeaveRecords([]);
      }
    } catch (error) {
      console.error("Error fetching employee leaves:", error);
      setLeaveRecords([]);
    } finally {
      setIsLoadingLeaves(false);
    }
  };

  // Function to fetch employee leave counts - modified to handle half-day calculations and exclude rejected leaves
  const fetchLeaveUsage = async (employeeId) => {
    if (!employeeId) return;

    setIsLoadingUsage(true);
    try {
      const leaveCounts = await getLeaveCountsByEmployee(employeeId);

      if (leaveCounts && Array.isArray(leaveCounts)) {
        const formattedUsage = Object.keys(leaveEntitlements).map(
          (leaveType, index) => {
            // Find the leave data for this type
            const leaveData = leaveCounts.find(
              (item) => item.leave_type === leaveType
            ) || {
              count: 0,
              half_days: 0,
              rejected_count: 0,
              rejected_half_days: 0,
            };

            // Calculate total used including half days, but excluding rejected leaves
            const total = leaveEntitlements[leaveType];
            // If half_days property exists, use it, otherwise assume all are full days
            const fullDays =
              (leaveData.count || 0) - (leaveData.rejected_count || 0);
            const halfDays =
              (leaveData.half_days || 0) - (leaveData.rejected_half_days || 0);
            const usage = fullDays + halfDays * 0.5;
            const balance = total - usage;

            return {
              id: index + 1,
              leaveType: leaveType,
              total: total,
              usage: usage.toFixed(1), // Format to 1 decimal place for better display
              balance: balance.toFixed(1),
            };
          }
        );
        setLeaveUsageData(formattedUsage);
      } else {
        const defaultUsage = Object.keys(leaveEntitlements).map(
          (leaveType, index) => ({
            id: index + 1,
            leaveType: leaveType,
            total: leaveEntitlements[leaveType],
            usage: "0.0",
            balance: leaveEntitlements[leaveType].toFixed(1),
          })
        );
        setLeaveUsageData(defaultUsage);
      }
    } catch (error) {
      console.error("Error fetching leave usage data:", error);
      const defaultUsage = Object.keys(leaveEntitlements).map(
        (leaveType, index) => ({
          id: index + 1,
          leaveType: leaveType,
          total: leaveEntitlements[leaveType],
          usage: "0.0",
          balance: leaveEntitlements[leaveType].toFixed(1),
        })
      );
      setLeaveUsageData(defaultUsage);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  // Function to fetch employee details using the API
  const fetchEmployeeDetails = async () => {
    if (!formData.attendanceNo) {
      setSearchError("Please enter an employee number");
      return;
    }

    setIsLoading(true);
    setSearchError("");

    try {
      const empData = await employeeService.fetchEmployeeById(
        formData.attendanceNo
      );

      if (empData) {
        // Store the full employee data
        setEmployeeData(empData);

        setFormData({
          ...formData,
          epfNo: empData.epf || "",
          employeeName: empData.name_with_initials || "",
          department: empData.organization_assignment?.department?.name || "",
        });

        await Promise.all([
          fetchEmployeeLeaves(formData.attendanceNo, empData),
          fetchLeaveUsage(formData.attendanceNo),
        ]);
      } else {
        setSearchError("Employee not found");
        setLeaveRecords([]);
        setEmployeeData(null);
        const defaultUsage = Object.keys(leaveEntitlements).map(
          (leaveType, index) => ({
            id: index + 1,
            leaveType: leaveType,
            total: leaveEntitlements[leaveType],
            usage: 0,
            balance: leaveEntitlements[leaveType],
          })
        );
        setLeaveUsageData(defaultUsage);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setSearchError("Failed to retrieve employee data. Please try again.");
      setLeaveRecords([]);
      setEmployeeData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission for leave requests - modified to validate leave balance
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);
    setIsSubmitting(true);

    try {
      // First validate all selected dates
      let invalidDates = [];

      if (formData.leaveDateType === "fullDay") {
        if (isDateDisabled(formData.leaveDate.single)) {
          invalidDates.push(formData.leaveDate.single);
        }
      } else if (formData.leaveDateType === "halfDay") {
        if (isDateDisabled(formData.leaveDate.single)) {
          invalidDates.push(formData.leaveDate.single);
        }
      } else if (formData.leaveDateType === "manual") {
        // Check each date in the range
        const fromDate = new Date(formData.leaveDate.from);
        const toDate = new Date(formData.leaveDate.to);

        for (
          let d = new Date(fromDate);
          d <= toDate;
          d.setDate(d.getDate() + 1)
        ) {
          const dateStr = formatDate(d);
          if (isDateDisabled(dateStr)) {
            invalidDates.push(dateStr);
          }
        }
      }

      if (invalidDates.length > 0) {
        const formattedDates = invalidDates
          .map((d) => formatDateForDisplay(d))
          .join(", ");
        Swal.fire({
          icon: "error",
          title: "Invalid Date Selection",
          html: `
            <div class="text-left">
              <p>The following selected dates are not available:</p>
              <ul class="list-disc pl-5 mt-2">
                ${invalidDates
                  .map((d) => `<li>${formatDateForDisplay(d)}</li>`)
                  .join("")}
              </ul>
              <p class="mt-3 text-sm">Please adjust your leave dates and try again.</p>
            </div>
          `,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Ok, I understand",
          customClass: {
            popup: "rounded-xl",
            confirmButton: "rounded-lg text-sm px-5 py-2.5",
          },
        });
        return;
      }

      // Check if employee has sufficient leave balance
      if (formData.leaveType === "Casual Leave") {
        const casualLeaveData = leaveUsageData.find(
          (leave) => leave.leaveType === "Casual Leave"
        );
        if (casualLeaveData) {
          let requiredDays = 0;

          if (formData.leaveDateType === "fullDay") {
            requiredDays = 1;
          } else if (formData.leaveDateType === "halfDay") {
            requiredDays = 0.5;
          } else if (formData.leaveDateType === "manual") {
            const fromDate = new Date(formData.leaveDate.from);
            const toDate = new Date(formData.leaveDate.to);
            const dayDiff =
              Math.abs(toDate - fromDate) / (1000 * 60 * 60 * 24) + 1;
            requiredDays = dayDiff;
          }

          if (parseFloat(casualLeaveData.balance) < requiredDays) {
            Swal.fire({
              icon: "error",
              title: "Insufficient Leave Balance",
              html: `
                <div class="text-left">
                  <p>You don't have enough Casual Leave balance.</p>
                  <p class="mt-2">Current balance: <strong>${casualLeaveData.balance} days</strong></p>
                  <p>Required: <strong>${requiredDays} days</strong></p>
                </div>
              `,
              confirmButtonColor: "#3085d6",
              confirmButtonText: "Ok",
              customClass: {
                popup: "rounded-xl",
                confirmButton: "rounded-lg text-sm px-5 py-2.5",
              },
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      let leaveData = {
        employee_id: parseInt(formData.attendanceNo),
        reporting_date: formData.reportingDate,
        leave_type: formData.leaveType,
        reason: formData.reason,
        status: "Pending",
        leave_date: null,
        leave_from: null,
        leave_to: null,
        period: null,
        is_half_day: false, // Add this field to track half-day leaves
      };

      if (formData.leaveDateType === "fullDay") {
        leaveData.leave_date = formData.leaveDate.single;
        leaveData.is_half_day = false;
      } else if (formData.leaveDateType === "halfDay") {
        leaveData.leave_date = formData.leaveDate.single;
        leaveData.period =
          formData.halfDayPeriod === "morning" ? "Morning" : "Afternoon";
        leaveData.is_half_day = true; // Mark as half day
      } else if (formData.leaveDateType === "manual") {
        leaveData.leave_from = formData.leaveDate.from;
        leaveData.leave_to = formData.leaveDate.to;
        leaveData.is_half_day = false;
      }

      const response = await createLeave(leaveData);

      await Promise.all([
        fetchEmployeeLeaves(formData.attendanceNo, employeeData),
        fetchLeaveUsage(formData.attendanceNo),
      ]);

      setSubmitSuccess(true);
      setFormData({
        attendanceNo: formData.attendanceNo,
        epfNo: formData.epfNo,
        employeeName: formData.employeeName,
        department: formData.department,
        reportingDate: getCurrentDate(),
        leaveType: "",
        leaveDateType: "fullDay",
        halfDayPeriod: "morning",
        leaveDate: {
          single: getCurrentDate(),
          from: getCurrentDate(),
          to: getCurrentDate(),
        },
        reason: "",
      });
    } catch (error) {
      console.error("Error submitting leave request:", error);
      setSubmitError("Failed to submit leave request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize default leave usage data when component mounts
  useEffect(() => {
    const defaultUsage = Object.keys(leaveEntitlements).map(
      (leaveType, index) => ({
        id: index + 1,
        leaveType: leaveType,
        total: leaveEntitlements[leaveType],
        usage: "0.0",
        balance: leaveEntitlements[leaveType].toFixed(1),
      })
    );
    setLeaveUsageData(defaultUsage);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 py-4 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-gray-900 px-4 sm:px-8 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center">
              Leave Master
            </h1>
            <p className="text-slate-300 text-center mt-2 text-sm sm:text-base">
              Employee Leave Management System
            </p>
          </div>
          <div className="p-4 sm:p-6 lg:p-8">
            {submitSuccess && (
              <div className="mb-6 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>Leave request submitted successfully!</span>
                </div>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="text-green-700 hover:text-green-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {submitError && (
              <div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <X className="w-5 h-5 mr-2" />
                  <span>{submitError}</span>
                </div>
                <button
                  onClick={() => setSubmitError("")}
                  className="text-red-700 hover:text-red-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Leave Form */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Attendance No */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          EMP number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            name="attendanceNo"
                            value={formData.attendanceNo}
                            onChange={handleDateChange}
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter employee number"
                          />
                          <button
                            type="button"
                            className="ml-2 p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            onClick={fetchEmployeeDetails}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="w-5 h-5 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                            ) : (
                              <Search className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {searchError && (
                          <p className="text-xs text-red-500 mt-1">
                            {searchError}
                          </p>
                        )}
                      </div>
                      {/* EPF No */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          EPF No
                        </label>
                        <input
                          type="text"
                          name="epfNo"
                          value={formData.epfNo}
                          disabled
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="EPF number"
                        />
                      </div>
                      {/* Employee Name */}
                      <div className="space-y-2 sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Employee Name
                        </label>
                        <input
                          type="text"
                          name="employeeName"
                          value={formData.employeeName}
                          disabled
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Employee name"
                        />
                      </div>
                      {/* Department */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Department
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          disabled
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Department"
                        />
                      </div>
                      {/* Reporting Date */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Reporting Date
                        </label>
                        <input
                          type="date"
                          name="reportingDate"
                          value={formData.reportingDate}
                          disabled
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      {/* Leave Type */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Leave Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="leaveType"
                          value={formData.leaveType}
                          onChange={handleDateChange}
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        >
                          <option value="">Select Leave Type</option>
                          {leaveTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Leave Date Section */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Leave Duration <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="fullDay"
                            name="leaveDateType"
                            value="fullDay"
                            checked={formData.leaveDateType === "fullDay"}
                            onChange={handleDateChange}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor="fullDay"
                            className="text-sm text-gray-700"
                          >
                            Full Day
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="halfDay"
                            name="leaveDateType"
                            value="halfDay"
                            checked={formData.leaveDateType === "halfDay"}
                            onChange={handleDateChange}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor="halfDay"
                            className="text-sm text-gray-700"
                          >
                            Half Day
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="manual"
                            name="leaveDateType"
                            value="manual"
                            checked={formData.leaveDateType === "manual"}
                            onChange={handleDateChange}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor="manual"
                            className="text-sm text-gray-700"
                          >
                            Date Range
                          </label>
                        </div>
                      </div>

                      {formData.leaveDateType === "fullDay" && (
                        <div className="mb-4 relative">
                          <label className="block text-xs text-gray-500 mb-1">
                            Date
                          </label>
                          <div
                            className="relative"
                            onMouseEnter={() =>
                              setHoveredDate(formData.leaveDate.single)
                            }
                            onMouseLeave={() => setHoveredDate(null)}
                          >
                            <input
                              type="date"
                              name="leaveDate.single"
                              value={formData.leaveDate.single}
                              onChange={handleDateChange}
                              required
                              className={getDateInputStyle(
                                formData.leaveDate.single
                              )}
                              min={getCurrentDate()}
                              onKeyDown={(e) => e.preventDefault()}
                            />
                            {hoveredDate === formData.leaveDate.single &&
                              getDateHoverContent(formData.leaveDate.single)}
                          </div>
                          {isDateDisabled(formData.leaveDate.single) && (
                            <p className="mt-1 text-xs text-red-600 flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              This date is unavailable for leave
                            </p>
                          )}
                        </div>
                      )}

                      {formData.leaveDateType === "halfDay" && (
                        <div className="space-y-4">
                          <div className="relative">
                            <label className="block text-xs text-gray-500 mb-1">
                              Date
                            </label>
                            <div
                              className="relative"
                              onMouseEnter={() =>
                                setHoveredDate(formData.leaveDate.single)
                              }
                              onMouseLeave={() => setHoveredDate(null)}
                            >
                              <input
                                type="date"
                                name="leaveDate.single"
                                value={formData.leaveDate.single}
                                onChange={handleDateChange}
                                required
                                className={getDateInputStyle(
                                  formData.leaveDate.single
                                )}
                                min={getCurrentDate()}
                                onKeyDown={(e) => e.preventDefault()}
                              />
                              {hoveredDate === formData.leaveDate.single &&
                                getDateHoverContent(formData.leaveDate.single)}
                            </div>
                            {isDateDisabled(formData.leaveDate.single) && (
                              <p className="mt-1 text-xs text-red-600 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                This date is unavailable for leave
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Period
                            </label>
                            <select
                              name="halfDayPeriod"
                              value={formData.halfDayPeriod}
                              onChange={handleDateChange}
                              required
                              className="w-full sm:w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="morning">Morning</option>
                              <option value="afternoon">Afternoon</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {formData.leaveDateType === "manual" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <label className="block text-xs text-gray-500 mb-1">
                              From
                            </label>
                            <div
                              className="relative"
                              onMouseEnter={() =>
                                setHoveredDate(formData.leaveDate.from)
                              }
                              onMouseLeave={() => setHoveredDate(null)}
                            >
                              <input
                                type="date"
                                name="leaveDate.from"
                                value={formData.leaveDate.from}
                                onChange={handleDateChange}
                                required
                                className={getDateInputStyle(
                                  formData.leaveDate.from
                                )}
                                min={getCurrentDate()}
                                onKeyDown={(e) => e.preventDefault()}
                              />
                              {hoveredDate === formData.leaveDate.from &&
                                getDateHoverContent(formData.leaveDate.from)}
                            </div>
                            {isDateDisabled(formData.leaveDate.from) && (
                              <p className="mt-1 text-xs text-red-600 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                This date is unavailable for leave
                              </p>
                            )}
                          </div>
                          <div className="relative">
                            <label className="block text-xs text-gray-500 mb-1">
                              To
                            </label>
                            <div
                              className="relative"
                              onMouseEnter={() =>
                                setHoveredDate(formData.leaveDate.to)
                              }
                              onMouseLeave={() => setHoveredDate(null)}
                            >
                              <input
                                type="date"
                                name="leaveDate.to"
                                value={formData.leaveDate.to}
                                onChange={handleDateChange}
                                required
                                className={getDateInputStyle(
                                  formData.leaveDate.to
                                )}
                                min={formData.leaveDate.from}
                                onKeyDown={(e) => e.preventDefault()}
                              />
                              {hoveredDate === formData.leaveDate.to &&
                                getDateHoverContent(formData.leaveDate.to)}
                            </div>
                            {isDateDisabled(formData.leaveDate.to) && (
                              <p className="mt-1 text-xs text-red-600 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                This date is unavailable for leave
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reason Textarea */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason
                      </label>
                      <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleDateChange}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Reason for leave"
                      ></textarea>
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                      <p>
                        Marked with <span className="text-red-500">*</span> are
                        required
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      type="button"
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                      onClick={() => {
                        setFormData({
                          attendanceNo: "",
                          epfNo: "",
                          employeeName: "",
                          department: "",
                          reportingDate: getCurrentDate(),
                          leaveType: "",
                          leaveDateType: "fullDay",
                          halfDayPeriod: "morning",
                          leaveDate: {
                            single: getCurrentDate(),
                            from: getCurrentDate(),
                            to: getCurrentDate(),
                          },
                          reason: "",
                        });
                        setSearchError("");
                        setSubmitError("");
                        setSubmitSuccess(false);
                        setLeaveRecords([]);
                      }}
                      disabled={isSubmitting}
                    >
                      Clear Form
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md hover:shadow-lg flex items-center justify-center min-w-[150px]"
                      disabled={isSubmitting || !formData.attendanceNo}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        "Submit Leave Request"
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Column - Leave Records */}
                <div className="space-y-6">
                  {/* Leave Usage Summary Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-800">
                        Leave Usage Summary
                      </h3>
                      {formData.employeeName && (
                        <span className="text-sm text-gray-600">
                          {formData.employeeName}
                        </span>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      {isLoadingUsage ? (
                        <div className="py-10 text-center">
                          <div className="inline-block w-6 h-6 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                          <p className="mt-2 text-sm text-gray-600">
                            Loading leave usage data...
                          </p>
                        </div>
                      ) : (
                        <table className="min-w-full bg-white border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                Leave Type
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                Total
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                Usage
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                Balance
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaveUsageData.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 border text-sm">
                                  {item.id}
                                </td>
                                <td className="px-4 py-3 border text-sm">
                                  {item.leaveType}
                                </td>
                                <td className="px-4 py-3 border text-sm">
                                  {item.total}
                                </td>
                                <td className="px-4 py-3 border text-sm">
                                  {item.usage}
                                </td>
                                <td className="px-4 py-3 border text-sm font-medium text-blue-600">
                                  {item.balance}
                                </td>
                              </tr>
                            ))}
                            {leaveUsageData.length === 0 && !isLoadingUsage && (
                              <tr>
                                <td
                                  colSpan="5"
                                  className="px-4 py-8 border text-center text-gray-500"
                                >
                                  {formData.employeeName
                                    ? "No leave usage data available for this employee"
                                    : "Search for an employee to view leave balances"}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Employee Leave Record */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-800">
                        Employee Leave Record
                      </h3>
                      {formData.employeeName && (
                        <span className="text-sm text-gray-600">
                          {formData.employeeName}
                        </span>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      {isLoadingLeaves ? (
                        <div className="py-10 text-center">
                          <div className="inline-block w-6 h-6 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                          <p className="mt-2 text-sm text-gray-600">
                            Loading leave records...
                          </p>
                        </div>
                      ) : (
                        <table className="min-w-full bg-white border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                Leave Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                Report Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                Full/Half Day
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                Leave Type
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaveRecords.map((record) => (
                              <tr key={record.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 border text-sm">
                                  {record.id}
                                </td>
                                <td className="px-4 py-3 border text-sm">
                                  {record.leaveDate}
                                </td>
                                <td className="px-4 py-3 border text-sm">
                                  {record.reportDate}
                                </td>
                                <td className="px-4 py-3 border text-sm">
                                  {record.fullHalfDay}
                                </td>
                                <td className="px-4 py-3 border text-sm">
                                  {record.leaveType}
                                </td>
                                <td className="px-4 py-3 border text-sm">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      record.status === "Approved"
                                        ? "bg-green-100 text-green-800"
                                        : record.status === "Rejected"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {leaveRecords.length === 0 && !isLoadingLeaves && (
                              <tr>
                                <td
                                  colSpan="6"
                                  className="px-4 py-8 border text-center text-gray-500"
                                >
                                  {formData.employeeName
                                    ? "No leave records found for this employee"
                                    : "Search for an employee to view their leave records"}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveMaster;
