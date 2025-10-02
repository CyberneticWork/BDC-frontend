import React, { useState, useEffect } from "react";
import {
  PieChart,
  Search,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Clock,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  User,
  Shield,
} from "lucide-react";
import PMSService from "@services/PMS/PMSService";
import Swal from "sweetalert2";
import { TaskViewModal } from "../KPIs/TaskViewModal";

// Approval Confirmation Modal
const ApprovalModal = ({ isOpen, onClose, onConfirm, isSubmitting, kpiName }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Approve KPI Task</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to approve "{kpiName}"? This will make the task visible to employees.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Approving...</span>
                </>
              ) : (
                <span>Approve</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskApproval = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Changed from "pending" to "all"
  const [companyFilter, setCompanyFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  // Companies and departments for filters
  const [companiesForFilter, setCompaniesForFilter] = useState([]);
  const [departmentsForFilter, setDepartmentsForFilter] = useState([]);
  const [isLoadingFilterCompanies, setIsLoadingFilterCompanies] = useState(false);
  const [isLoadingFilterDepartments, setIsLoadingFilterDepartments] = useState(false);
  
  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  // const [isRejectModalOpen, setIsRejectModalOpen] = useState(false); // removed modal state: rejection uses Swal confirm now
  const [currentTask, setCurrentTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });
  
  // All employees for view modal
  const [allEmployeesForModals, setAllEmployeesForModals] = useState([]);

  // Fetch tasks that need approval
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await PMSService.getKpiTasksForApproval();
      
      // Sort tasks to show latest first (by created_at or id)
      const sortedData = Array.isArray(data) ? data.sort((a, b) => {
        // Sort by created_at first, fallback to id if created_at is same/missing
        const aDate = new Date(a.created_at || a.lastUpdated || 0);
        const bDate = new Date(b.created_at || b.lastUpdated || 0);
        
        if (aDate.getTime() !== bDate.getTime()) {
          return bDate.getTime() - aDate.getTime(); // Latest first
        }
        
        // Fallback to ID for consistent sorting
        return (b.id || 0) - (a.id || 0);
      }) : [];
      
      setTasks(sortedData);
      
      // Calculate stats
      const pendingCount = sortedData.filter(task => task.approval_status === 'pending').length;
      const approvedCount = sortedData.filter(task => task.approval_status === 'approved').length;
      const rejectedCount = sortedData.filter(task => task.approval_status === 'rejected').length;
      
      setStats({
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      });
      
    } catch (e) {
      setError("Failed to fetch KPI tasks for approval");
      console.error(e);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch all employees for view modal
  useEffect(() => {
    const fetchEmployeesForModals = async () => {
      try {
        // Fetch all companies first
        const companies = await PMSService.getCompanies();
        let allEmployees = [];
        
        // Fetch employees for each company
        for (const company of companies) {
          try {
            const companyEmployees = await PMSService.getEmployeesByCompany(company.id, null, "");
            const list = Array.isArray(companyEmployees) ? companyEmployees : (companyEmployees?.data || []);
            const mapped = list.map(e => ({
              id: e.attendance_employee_no ?? String(e.id ?? ""),
              name: e.full_name || e.name || "",
              department: e.department || e.department_name || ""
            }));
            allEmployees = [...allEmployees, ...mapped];
          } catch (err) {
            console.error(`Error fetching employees for company ${company.name}:`, err);
          }
        }
        
        setAllEmployeesForModals(allEmployees);
      } catch (err) {
        console.error("Error fetching employees for modals:", err);
      }
    };

    fetchEmployeesForModals();
  }, []);

  // Load companies for filter
  useEffect(() => {
    let mounted = true;
    const loadCompanies = async () => {
      setIsLoadingFilterCompanies(true);
      try {
        const data = await PMSService.getCompanies();
        if (!mounted) return;
        setCompaniesForFilter(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading companies for filter:", err);
      } finally {
        if (mounted)
          setIsLoadingFilterCompanies(false);
      }
    };
    loadCompanies();
    return () => { mounted = false; };
  }, []);

  // Load departments when company changes
  useEffect(() => {
    let mounted = true;
    const loadDepartments = async () => {
      if (!companyFilter || companyFilter === "all") {
        setDepartmentsForFilter([]);
        setDepartmentFilter("all");
        return;
      }
      
      setIsLoadingFilterDepartments(true);
      try {
        const data = await PMSService.getDepartmentsByCompany(companyFilter);
        if (!mounted) return;
        setDepartmentsForFilter(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading departments for filter:", err);
      } finally {
        if (mounted)
          setIsLoadingFilterDepartments(false);
      }
    };
    
    loadDepartments();
    return () => { mounted = false; };
  }, [companyFilter]);

  // Initial data load
  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks when filters change
  useEffect(() => {
    applyFilters();
  }, [tasks, statusFilter, departmentFilter, companyFilter, searchTerm]);

  // Apply filters to the tasks
  const applyFilters = () => {
    let filtered = tasks;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(term) || 
        task.description?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.approval_status === statusFilter);
    }

    // Filter by department
    if (departmentFilter !== "all") {
      filtered = filtered.filter(task => {
        const taskDeptId = task.department_id ?? task.departmentId;
        if (taskDeptId != null) {
          return String(taskDeptId) === String(departmentFilter);
        }
        // fallback: compare by department name
        const deptNameFromFilter = (departmentsForFilter.find(d => 
          String(d.id) === String(departmentFilter))?.name || "").toLowerCase();
        return String(task.department || task.departmentName || "").toLowerCase() === deptNameFromFilter;
      });
    }

    // Filter by company
    if (companyFilter !== "all") {
      filtered = filtered.filter(task => {
        const taskCompanyId = task.company_id ?? task.companyId;
        if (taskCompanyId != null) {
          return String(taskCompanyId) === String(companyFilter);
        }
        // fallback: compare by company name
        const compNameFromFilter = (companiesForFilter.find(c => 
          String(c.id) === String(companyFilter))?.name || "").toLowerCase();
        return String(task.companyName || task.company || "").toLowerCase() === compNameFromFilter;
      });
    }

    setFilteredTasks(filtered);
    setCurrentPage(1);
  };

  // Handle task approval
  const handleApproveTask = async () => {
    if (!currentTask) return;
    
    setIsSubmitting(true);
    try {
      // Call backend
      await PMSService.approveKpiTask(currentTask.id);
      
      await Swal.fire({
        icon: "success",
        title: "Approved",
        text: "KPI task has been approved successfully. You can still reject it if needed.",
        timer: 2000,
        showConfirmButton: false,
      });
      
      setIsApproveModalOpen(false);

      // Update local state immediately for better UX
      setTasks(prev => prev.map(t => t.id === currentTask.id ? { ...t, approval_status: 'approved' } : t));
      setFilteredTasks(prev => prev.map(t => t.id === currentTask.id ? { ...t, approval_status: 'approved' } : t));
      setStats(prev => ({ ...prev, approved: prev.approved + 1, pending: Math.max(prev.pending - 1, 0) }));

      // Clear selection
      setCurrentTask(null);

      // Don't change the page - keep showing the same items
      // Don't call fetchTasks() here to avoid resetting the view

    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to approve the KPI task. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle task rejection (no reason). Show confirm dialog, then call API.
  const handleRejectTask = async () => {
    if (!currentTask) return;
    setIsSubmitting(true);
    try {
      await PMSService.rejectKpiTask(currentTask.id); // optional reason omitted

      await Swal.fire({
        icon: "success",
        title: "Rejected",
        text: "KPI task has been rejected.",
        timer: 1500,
        showConfirmButton: false,
      });

      // Update local state immediately
      setTasks(prev => prev.map(t => t.id === currentTask.id ? { ...t, approval_status: 'rejected' } : t));
      setFilteredTasks(prev => prev.map(t => t.id === currentTask.id ? { ...t, approval_status: 'rejected' } : t));
      setStats(prev => ({ ...prev, rejected: prev.rejected + 1, pending: Math.max(prev.pending - 1, 0) }));

      setCurrentTask(null);
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to reject the KPI task. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
 
   // Open view modal
   const openViewModal = (task) => {
     setCurrentTask(task);
     setIsViewModalOpen(true);
   };
 
   // Open approve modal
   const openApproveModal = (task) => {
     setCurrentTask(task);
     setIsApproveModalOpen(true);
   };
 
  // Open reject confirmation and act immediately if confirmed
  const openRejectModal = async (task) => {
    setCurrentTask(task);
    const result = await Swal.fire({
      title: `Reject KPI Task?`,
      text: `Are you sure you want to reject "${task.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, reject",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      await handleRejectTask();
    } else {
      setCurrentTask(null);
    }
  };
 
  // Helper functions
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return statusConfig[status] || "bg-gray-100 text-gray-800";
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading KPI Tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading KPI Tasks</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* View Modal */}
      <TaskViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        kpi={currentTask}
        employees={allEmployeesForModals}
      />
      
      {/* Approval Modal */}
      <ApprovalModal 
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApproveTask}
        isSubmitting={isSubmitting}
        kpiName={currentTask?.name}
      />
      
      {/* Rejection now uses SweetAlert confirm; no inline modal */}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 px-4 sm:px-8 py-6 sm:py-8 rounded-xl mb-6">
        <div className="flex items-center justify-center mb-2">
          <Shield className="h-10 w-10 text-white opacity-80 mr-3" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center">
            KPI Task Approval
          </h1>
        </div>
        <p className="text-purple-200 text-center mt-2 text-sm sm:text-base">
          Review and manage KPI tasks before they're assigned to employees
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search KPI tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* Company select */}
          <div className="relative">
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Companies</option>
              {companiesForFilter.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {isLoadingFilterCompanies && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
          
          {/* Department select */}
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={companyFilter === "all"}
            >
              <option value="all">All Departments</option>
              {departmentsForFilter.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {isLoadingFilterDepartments && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
          
          {/* Status select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* KPI Tasks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creator Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length > 0 ? (
                currentItems.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    {/* Task Name */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {task.description || "No description"}
                        </div>
                      </div>
                    </td>
                    
                    {/* Department */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {task.departmentName || task.department || "Not specified"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {task.companyName || task.company || ""}
                      </div>
                    </td>
                    
                    {/* Creator Role */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {task.creator?.role ? 
                              task.creator.role.split(" ").map((w) => w[0]).join("").toUpperCase() : "--"}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{task.creator?.role || "—"}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Timeline */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          <span>
                            {new Date(task.startDate || task.start_date).toLocaleDateString()} - 
                            {new Date(task.endDate || task.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusBadge(task.approval_status)
                        }`}
                      >
                        {task.approval_status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {task.approval_status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                        {task.approval_status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                        {task.approval_status.charAt(0).toUpperCase() + task.approval_status.slice(1)}
                      </span>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => openViewModal(task)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Always show Approve and Reject buttons (do not hide after status change) */}
                        <button 
                          onClick={() => openApproveModal(task)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title={task.approval_status === "approved" ? "Approve (already approved)" : "Approve"}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => openRejectModal(task)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={task.approval_status === "rejected" ? "Reject (already rejected)" : "Reject"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center">
                      <PieChart className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium mb-1">No KPI tasks found</p>
                      <p className="text-sm text-gray-500">
                        {statusFilter !== "all" || departmentFilter !== "all" || companyFilter !== "all" || searchTerm
                          ? "Try adjusting your filter criteria"
                          : "There are no KPI tasks that require approval"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTasks.length)} of {filteredTasks.length} tasks
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskApproval;