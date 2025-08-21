import React, { useState, useEffect } from "react";
import {
  Check,
  X,
  Search,
  Filter,
  Calendar,
  UserCheck,
  Clock,
  AlertCircle,
  ChevronDown,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getAllLeaves, updateLeaveStatus } from "../../services/LeaveMaster";
import Swal from "sweetalert2"; // Add this import

const LeaveApproval = () => {
  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Pending");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterLeaveType, setFilterLeaveType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDetails, setShowDetails] = useState(null);

  // New state variables for rejection reason modal
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingRequestId, setRejectingRequestId] = useState(null);

  // State for leave requests
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add new state for loading during email sending
  const [emailSending, setEmailSending] = useState(false);

  // Fetch leave requests on component mount
  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  // Function to fetch leave requests
  const fetchLeaveRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllLeaves();

      // Transform the API data to match our component's expected format
      const formattedData = data.map((leave) => ({
        id: leave.id,
        employeeNo:
          leave.employee?.attendance_employee_no?.toString() ||
          leave.employee_id?.toString() ||
          "N/A",
        employeeName:
          leave.employee?.full_name ||
          leave.employee?.name_with_initials ||
          "Unknown Employee",
        department:
          leave.employee?.organization_assignment?.department?.name || "N/A",
        leaveType: leave.leave_type,
        startDate: leave.leave_date || leave.leave_from,
        endDate: leave.leave_date || leave.leave_to,
        duration: calculateDuration(
          leave.leave_date,
          leave.leave_from,
          leave.leave_to
        ),
        reason: leave.reason || "No reason provided",
        status: leave.status || "Pending",
        submittedDate:
          leave.created_at?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        approvedBy: leave.approved_by || "",
        approvedDate: leave.approved_date || "",
        rejectedBy: leave.rejected_by || "",
        rejectedDate: leave.rejected_date || "",
        rejectionReason: leave.rejection_reason || "",
      }));

      setLeaveRequests(formattedData);
    } catch (err) {
      console.error("Failed to fetch leave requests:", err);
      setError("Failed to load leave requests. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate duration between dates
  const calculateDuration = (singleDate, fromDate, toDate) => {
    if (singleDate) {
      return 1; // Single day leave
    }

    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
      return diffDays;
    }

    return 1; // Default to 1 if dates are not available
  };

  // Count statistics
  const pendingCount = leaveRequests.filter(
    (req) => req.status === "Pending"
  ).length;
  const approvedCount = leaveRequests.filter(
    (req) => req.status === "Approved"
  ).length;
  const hrApprovedCount = leaveRequests.filter(
    (req) => req.status === "HR_Approved"
  ).length;
  const rejectedCount = leaveRequests.filter(
    (req) => req.status === "Rejected"
  ).length;
  const managerApprovedCount = leaveRequests.filter(
    (req) => req.status === "Manager Approved"
  ).length;

  // Handle approval with email notification
  const handleApprove = async (id) => {
    // Use SweetAlert2 for confirmation
    const result = await Swal.fire({
      title: "Approve Leave?",
      text: "An email notification will be sent to the employee",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4ade80",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Yes, approve it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        // Show loading animation
        setEmailSending(true);

        // Use updateLeaveStatus instead of updateLeave for email notifications
        await updateLeaveStatus(id, {
          status: "HR_Approved",
        });

        // Update local state
        setLeaveRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.id === id
              ? {
                  ...request,
                  status: "HR_Approved",
                  approvedBy: "Current HR Manager",
                  approvedDate: new Date().toISOString().split("T")[0],
                }
              : request
          )
        );

        // Show success message with SweetAlert2
        Swal.fire({
          icon: "success",
          title: "Approved!",
          text: "Leave request has been approved. Email sent to employee.",
          confirmButtonColor: "#3b82f6",
        });

        // Refresh the data
        fetchLeaveRequests();
      } catch (error) {
        console.error("Failed to approve leave request:", error);

        // Show error message with SweetAlert2
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not approve leave request. Please try again.",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setEmailSending(false);
      }
    }
  };

  // Handle rejection with email notification
  const handleReject = (id) => {
    setRejectingRequestId(id);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  // Process the rejection with email notification
  const confirmReject = async () => {
    if (rejectionReason.trim() && rejectingRequestId) {
      try {
        // Show loading animation
        setEmailSending(true);

        // Use updateLeaveStatus for email notifications
        await updateLeaveStatus(rejectingRequestId, {
          status: "Rejected",
          rejection_reason: rejectionReason,
        });

        // Update local state
        setLeaveRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.id === rejectingRequestId
              ? {
                  ...request,
                  status: "Rejected",
                  rejectedBy: "Current Manager",
                  rejectedDate: new Date().toISOString().split("T")[0],
                  rejectionReason: rejectionReason,
                }
              : request
          )
        );

        // Close the modal after processing
        setShowRejectionModal(false);
        setRejectingRequestId(null);
        setRejectionReason("");

        // Show success message with SweetAlert2
        Swal.fire({
          icon: "success",
          title: "Rejected!",
          text: "Leave request has been rejected. Email sent to employee.",
          confirmButtonColor: "#3b82f6",
        });

        // Refresh the data
        fetchLeaveRequests();
      } catch (error) {
        console.error("Failed to reject leave request:", error);

        // Show error message with SweetAlert2
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not reject leave request. Please try again.",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setEmailSending(false);
      }
    }
  };

  // Filter leave requests based on search and filter criteria
  const filteredRequests = leaveRequests.filter((request) => {
    // Search term filter
    const matchesSearch =
      request.employeeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      filterStatus === "All" || request.status === filterStatus;

    // Department filter
    const matchesDepartment =
      !filterDepartment || request.department === filterDepartment;

    // Leave type filter
    const matchesLeaveType =
      !filterLeaveType || request.leaveType === filterLeaveType;

    // Date range filter
    let matchesDateRange = true;
    if (dateFrom) {
      matchesDateRange = request.startDate >= dateFrom;
    }
    if (dateTo) {
      matchesDateRange = matchesDateRange && request.endDate <= dateTo;
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDepartment &&
      matchesLeaveType &&
      matchesDateRange
    );
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return dateString || "N/A";
    }
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "HR_Approved":
        return "bg-blue-100 text-blue-800";
      case "Manager Approved":
        return "bg-indigo-100 text-indigo-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "HR_Approved":
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case "Manager Approved":
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case "Rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilterStatus("Pending");
    setFilterDepartment("");
    setFilterLeaveType("");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
  };

  // Extract unique departments from leave requests
  const departments = [
    ...new Set(leaveRequests.map((req) => req.department).filter(Boolean)),
  ];

  // Extract unique leave types from leave requests
  const leaveTypes = [
    ...new Set(leaveRequests.map((req) => req.leaveType).filter(Boolean)),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 py-4 sm:py-8">
      {/* Email sending overlay */}
      {emailSending && (
        <div className="fixed inset-0 bg-opacity-50 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
            <div className="w-20 h-20 mb-4">
              <svg
                className="animate-spin w-full h-full text-blue-600"
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
            <p className="text-lg font-medium text-gray-700">
              Sending email notification...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please wait, this may take a moment
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-gray-900 px-4 sm:px-8 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center">
              Leave Approval
            </h1>
            <p className="text-slate-300 text-center mt-2 text-sm sm:text-base">
              Review and manage employee leave requests
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {pendingCount}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {approvedCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {rejectedCount}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <X className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Manager Approved
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {managerApprovedCount}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    HR Approved
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {hrApprovedCount}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="px-4 sm:px-6 lg:px-8 pb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Filter Requests
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="HR_Approved">HR Approved</option>
                    <option value="Manager Approved">Manager Approved</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Type
                  </label>
                  <select
                    value={filterLeaveType}
                    onChange={(e) => setFilterLeaveType(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">All Leave Types</option>
                    {leaveTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
              </div>

              {/* Search and Reset */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by employee name, number or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="px-4 sm:px-6 lg:px-8 pb-8">
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="ml-3 text-gray-600">
                    Loading leave requests...
                  </p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    Error Loading Data
                  </h3>
                  <p className="text-gray-600">{error}</p>
                  <button
                    onClick={fetchLeaveRequests}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Employee
                        </th>
                        {/* <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Department
                        </th> */}
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Leave Type
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Duration
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.length > 0 ? (
                        filteredRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-medium">
                                    {request.employeeName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {request.employeeName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {request.employeeNo}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {request.department}
                              </div>
                            </td> */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {request.leaveType}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(request.startDate)} -{" "}
                                {formatDate(request.endDate)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {request.duration} day
                                {request.duration !== 1 ? "s" : ""}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                  request.status
                                )}`}
                              >
                                {getStatusIcon(request.status)}
                                <span className="ml-1.5">{request.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() =>
                                    setShowDetails(
                                      showDetails === request.id
                                        ? null
                                        : request.id
                                    )
                                  }
                                  className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={18} />
                                </button>

                                {request.status === "Pending" && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(request.id)}
                                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                      title="Approve"
                                    >
                                      <Check size={18} />
                                    </button>

                                    <button
                                      onClick={() => handleReject(request.id)} // This now opens the modal instead of showing a prompt
                                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                      title="Reject"
                                    >
                                      <X size={18} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-6 py-10 text-center text-gray-500"
                          >
                            <div className="flex flex-col items-center">
                              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                              <p className="text-lg font-medium mb-1">
                                No leave requests found
                              </p>
                              <p className="text-sm">
                                Adjust your filters or try a different search
                                term
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Details Modal */}
          {showDetails !== null && (
            <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">
                    Leave Request Details
                  </h3>
                  <button
                    onClick={() => setShowDetails(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {leaveRequests.find((req) => req.id === showDetails) && (
                  <div className="p-6">
                    {(() => {
                      const request = leaveRequests.find(
                        (req) => req.id === showDetails
                      );
                      return (
                        <div className="space-y-6">
                          <div className="flex items-center">
                            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-xl">
                                {request.employeeName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-xl font-bold text-gray-900">
                                {request.employeeName}
                              </h4>
                              <p className="text-gray-500">
                                {request.employeeNo} • {request.department}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-sm font-medium text-gray-500 mb-1">
                                Leave Type
                              </h5>
                              <p className="text-lg font-medium text-gray-900">
                                {request.leaveType}
                              </p>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-gray-500 mb-1">
                                Status
                              </h5>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                                  request.status
                                )}`}
                              >
                                {getStatusIcon(request.status)}
                                <span className="ml-1.5">{request.status}</span>
                              </span>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-gray-500 mb-1">
                                Duration
                              </h5>
                              <p className="text-lg font-medium text-gray-900">
                                {request.duration} day
                                {request.duration !== 1 ? "s" : ""}
                              </p>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-gray-500 mb-1">
                                Date Range
                              </h5>
                              <p className="text-lg font-medium text-gray-900">
                                {formatDate(request.startDate)} -{" "}
                                {formatDate(request.endDate)}
                              </p>
                            </div>

                            <div className="md:col-span-2">
                              <h5 className="text-sm font-medium text-gray-500 mb-1">
                                Reason
                              </h5>
                              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                                {request.reason}
                              </p>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-gray-500 mb-1">
                                Submitted On
                              </h5>
                              <p className="text-gray-900">
                                {formatDate(request.submittedDate)}
                              </p>
                            </div>

                            {request.status === "Approved" && (
                              <>
                                <div>
                                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                                    Approved By
                                  </h5>
                                  <p className="text-gray-900">
                                    {request.approvedBy}
                                  </p>
                                </div>

                                <div>
                                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                                    Approved Date
                                  </h5>
                                  <p className="text-gray-900">
                                    {formatDate(request.approvedDate)}
                                  </p>
                                </div>
                              </>
                            )}

                            {request.status === "Rejected" && (
                              <>
                                <div>
                                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                                    Rejected By
                                  </h5>
                                  <p className="text-gray-900">
                                    {request.rejectedBy}
                                  </p>
                                </div>

                                <div>
                                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                                    Rejected Date
                                  </h5>
                                  <p className="text-gray-900">
                                    {formatDate(request.rejectedDate)}
                                  </p>
                                </div>

                                <div className="md:col-span-2">
                                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                                    Rejection Reason
                                  </h5>
                                  <p className="text-red-700 bg-red-50 p-4 rounded-lg">
                                    {request.rejectionReason}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          {request.status === "Pending" && (
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                              <button
                                onClick={() => {
                                  handleReject(request.id);
                                  setShowDetails(null);
                                }}
                                className="px-5 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                Reject Request
                              </button>

                              <button
                                onClick={() => {
                                  handleApprove(request.id);
                                  setShowDetails(null);
                                }}
                                className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors shadow"
                              >
                                Approve Request
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Modal */}
          {showRejectionModal && (
            <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">
                    Reject Leave Request
                  </h3>
                  <button
                    onClick={() => setShowRejectionModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Rejection{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Please provide a reason for rejecting this leave request..."
                    ></textarea>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowRejectionModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={confirmReject}
                      disabled={!rejectionReason.trim()}
                      className={`px-4 py-2 ${
                        rejectionReason.trim()
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-red-300 cursor-not-allowed"
                      } text-white rounded-lg transition-colors`}
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveApproval;
