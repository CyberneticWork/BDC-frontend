import React, { useState, useEffect } from "react";
import {
  Check,
  X,
  Search,
  Filter,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  AlertTriangle,
  Calendar,
  ArrowRight,
  FileQuestion,
  Briefcase,
} from "lucide-react";

const Termination = () => {
  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Pending");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDetails, setShowDetails] = useState(null);

  // State for rejection modal
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingRequestId, setRejectingRequestId] = useState(null);

  // State for approval confirmation modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState(null);
  const [terminationDate, setTerminationDate] = useState("");
  const [exitNotes, setExitNotes] = useState("");

  // Sample resignation request data
  const [resignationRequests, setResignationRequests] = useState([
    {
      id: 1,
      employeeNo: "EMP001",
      employeeName: "John Smith",
      department: "IT",
      position: "Senior Developer",
      submittedDate: "2025-07-01",
      requestedDate: "2025-08-01",
      reason:
        "I've accepted a position at another company that aligns more closely with my career goals. It was a difficult decision, but I believe this is the best step for my professional growth.",
      status: "Pending",
      yearsOfService: 4.5,
    },
    {
      id: 2,
      employeeNo: "EMP014",
      employeeName: "Sarah Williams",
      department: "Marketing",
      position: "Marketing Manager",
      submittedDate: "2025-06-28",
      requestedDate: "2025-07-28",
      reason:
        "I'm relocating to another city due to family circumstances. I've enjoyed my time with the company and appreciate all the opportunities provided to me during my tenure.",
      status: "Pending",
      yearsOfService: 3.2,
    },
    {
      id: 3,
      employeeNo: "EMP035",
      employeeName: "Michael Johnson",
      department: "Finance",
      position: "Financial Analyst",
      submittedDate: "2025-07-05",
      requestedDate: "2025-08-05",
      reason:
        "I've decided to pursue further education full-time. I believe this will help me advance my career in the long run. I'm grateful for all I've learned while working here.",
      status: "Approved",
      approvedBy: "HR Director",
      approvedDate: "2025-07-10",
      terminationDate: "2025-08-05",
      exitNotes:
        "Exit interview scheduled for Aug 3rd. All company property to be returned by Aug 4th.",
      yearsOfService: 2.0,
    },
    {
      id: 4,
      employeeNo: "EMP087",
      employeeName: "Amanda Chen",
      department: "HR",
      position: "HR Specialist",
      submittedDate: "2025-06-20",
      requestedDate: "2025-07-20",
      reason:
        "I've been offered a position that provides better work-life balance, which is important for my family situation right now. I've enjoyed working with everyone here.",
      status: "Rejected",
      rejectedBy: "HR Manager",
      rejectedDate: "2025-06-25",
      rejectionReason:
        "After discussion with department head, we've offered a flexible work arrangement and revised compensation package. Employee has accepted and withdrawn resignation.",
      yearsOfService: 1.8,
    },
    {
      id: 5,
      employeeNo: "EMP042",
      employeeName: "Robert Taylor",
      department: "Operations",
      position: "Operations Supervisor",
      submittedDate: "2025-07-08",
      requestedDate: "2025-08-15",
      reason:
        "I'm starting my own business venture. This has been a goal of mine for several years, and I feel now is the right time to pursue it. I'm thankful for the skills I've developed here.",
      status: "Pending",
      yearsOfService: 5.3,
    },
  ]);

  // Sample departments
  const departments = [
    "IT",
    "HR",
    "Finance",
    "Marketing",
    "Operations",
    "Sales",
  ];

  // Filter resignation requests based on search and filter criteria
  const filteredRequests = resignationRequests.filter((request) => {
    // Search term filter
    const matchesSearch =
      request.employeeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.department.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      filterStatus === "All" || request.status === filterStatus;

    // Department filter
    const matchesDepartment =
      !filterDepartment || request.department === filterDepartment;

    // Date range filter
    let matchesDateRange = true;
    if (dateFrom) {
      matchesDateRange = request.requestedDate >= dateFrom;
    }
    if (dateTo) {
      matchesDateRange = matchesDateRange && request.requestedDate <= dateTo;
    }

    return (
      matchesSearch && matchesStatus && matchesDepartment && matchesDateRange
    );
  });

  // Count statistics
  const pendingCount = resignationRequests.filter(
    (req) => req.status === "Pending"
  ).length;
  const approvedCount = resignationRequests.filter(
    (req) => req.status === "Approved"
  ).length;
  const rejectedCount = resignationRequests.filter(
    (req) => req.status === "Rejected"
  ).length;
  const totalCount = resignationRequests.length;

  // Handle view details
  const handleViewDetails = (id) => {
    setShowDetails(id);
  };

  // Handle approval initiation
  const handleApprove = (id) => {
    setApprovingRequestId(id);
    const request = resignationRequests.find((req) => req.id === id);
    setTerminationDate(request.requestedDate);
    setExitNotes("");
    setShowApprovalModal(true);
  };

  // Handle confirm approval
  const confirmApproval = () => {
    if (terminationDate) {
      setResignationRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === approvingRequestId
            ? {
                ...request,
                status: "Approved",
                approvedBy: "HR Director",
                approvedDate: new Date().toISOString().split("T")[0],
                terminationDate: terminationDate,
                exitNotes: exitNotes,
              }
            : request
        )
      );
      setShowApprovalModal(false);
      setApprovingRequestId(null);
      setTerminationDate("");
      setExitNotes("");
    }
  };

  // Handle rejection initiation
  const handleReject = (id) => {
    setRejectingRequestId(id);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  // Handle confirm rejection
  const confirmReject = () => {
    if (rejectionReason.trim()) {
      setResignationRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === rejectingRequestId
            ? {
                ...request,
                status: "Rejected",
                rejectedBy: "HR Director",
                rejectedDate: new Date().toISOString().split("T")[0],
                rejectionReason: rejectionReason,
              }
            : request
        )
      );
      setShowRejectionModal(false);
      setRejectingRequestId(null);
      setRejectionReason("");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
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
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 py-4 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-red-800 to-gray-900 px-4 sm:px-8 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center">
              Employee Termination
            </h1>
            <p className="text-gray-300 text-center mt-2 text-sm sm:text-base">
              Review and process employee resignation requests
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Resignations
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {totalCount}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 bg-white shadow-sm"
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
              </div>

              {/* Search and Reset */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by employee name, number, department or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
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

          {/* Resignation Requests Table */}
          <div className="px-4 sm:px-6 lg:px-8 pb-8">
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
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
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Department
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Resignation Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Years of Service
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
                              <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-red-600 font-medium">
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {request.department}
                            </div>
                            <div className="text-xs text-gray-500">
                              {request.position}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(request.requestedDate)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Submitted: {formatDate(request.submittedDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {request.yearsOfService} years
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
                                onClick={() => handleViewDetails(request.id)}
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
                                    title="Approve & Terminate"
                                  >
                                    <Check size={18} />
                                  </button>

                                  <button
                                    onClick={() => handleReject(request.id)}
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
                            <FileQuestion className="h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-lg font-medium mb-1">
                              No resignation requests found
                            </p>
                            <p className="text-sm">
                              Adjust your filters or try a different search term
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

          {/* Details Modal */}
          {showDetails !== null && (
            <div className="fixed inset-0  bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">
                    Resignation Request Details
                  </h3>
                  <button
                    onClick={() => setShowDetails(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {resignationRequests.find((req) => req.id === showDetails) && (
                  <div className="p-6">
                    {(() => {
                      const request = resignationRequests.find(
                        (req) => req.id === showDetails
                      );
                      return (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-red-600 font-medium text-xl">
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
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                                request.status
                              )}`}
                            >
                              {getStatusIcon(request.status)}
                              <span className="ml-1.5">{request.status}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-sm font-medium text-gray-500 mb-1">
                                Position
                              </h5>
                              <p className="text-lg font-medium text-gray-900">
                                {request.position}
                              </p>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-gray-500 mb-1">
                                Years of Service
                              </h5>
                              <p className="text-lg font-medium text-gray-900">
                                {request.yearsOfService} years
                              </p>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-gray-500 mb-1">
                                Resignation Date
                              </h5>
                              <p className="text-lg font-medium text-gray-900">
                                {formatDate(request.requestedDate)}
                              </p>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-gray-500 mb-1">
                                Submitted Date
                              </h5>
                              <p className="text-lg font-medium text-gray-900">
                                {formatDate(request.submittedDate)}
                              </p>
                            </div>

                            <div className="md:col-span-2">
                              <h5 className="text-sm font-medium text-gray-500 mb-1">
                                Resignation Reason
                              </h5>
                              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                                {request.reason}
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
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(request.approvedDate)}
                                  </p>
                                </div>

                                <div>
                                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                                    Termination Date
                                  </h5>
                                  <p className="text-gray-900">
                                    {formatDate(request.terminationDate)}
                                  </p>
                                </div>

                                {request.exitNotes && (
                                  <div className="md:col-span-2">
                                    <h5 className="text-sm font-medium text-gray-500 mb-1">
                                      Exit Notes
                                    </h5>
                                    <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                                      {request.exitNotes}
                                    </p>
                                  </div>
                                )}
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
                                  <p className="text-xs text-gray-500 mt-1">
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
                                className="px-5 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                              >
                                <X size={16} />
                                Reject Request
                              </button>

                              <button
                                onClick={() => {
                                  handleApprove(request.id);
                                  setShowDetails(null);
                                }}
                                className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors shadow flex items-center gap-2"
                              >
                                <Check size={16} />
                                Approve & Terminate
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

          {/* Approval/Termination Modal */}
          {showApprovalModal && (
            <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <div className="flex items-center">
                    <AlertTriangle className="w-6 h-6 text-amber-500 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Approve Resignation & Terminate
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6">
                  {resignationRequests.find(
                    (req) => req.id === approvingRequestId
                  ) && (
                    <div className="mb-4 flex items-center bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <UserX className="flex-shrink-0 h-5 w-5 text-amber-500 mr-2" />
                      <p className="text-amber-800 text-sm">
                        You are about to approve the resignation of{" "}
                        <span className="font-semibold">
                          {
                            resignationRequests.find(
                              (req) => req.id === approvingRequestId
                            ).employeeName
                          }
                        </span>
                        . This will initiate the termination process.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Termination Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={terminationDate}
                        onChange={(e) => setTerminationDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exit Notes
                      </label>
                      <textarea
                        value={exitNotes}
                        onChange={(e) => setExitNotes(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                        placeholder="Add exit interview details, return of company property, final payment instructions, etc."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmApproval}
                    disabled={!terminationDate}
                    className={`px-4 py-2 ${
                      terminationDate
                        ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        : "bg-green-300 cursor-not-allowed"
                    } text-white rounded-lg transition-colors flex items-center gap-2`}
                  >
                    <Check className="w-4 h-4" />
                    Confirm Termination
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Modal */}
          {showRejectionModal && (
            <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">
                    Reject Resignation Request
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                      placeholder="Please provide a reason for rejecting this resignation request..."
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

export default Termination;
