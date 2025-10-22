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
  File,
  FileText,
  Download,
  Target,
  Building2,
  RefreshCw,
} from "lucide-react";
import PMSService from "@services/PMS/PMSService";
import Swal from "sweetalert2";

// Complete TaskViewModal specifically for TaskApproval page
const TaskViewModal = ({ isOpen, onClose, kpi = null, submissions = [], employees = [] }) => {
  const [activeTab, setActiveTab] = useState("details");

  if (!isOpen || !kpi) return null;

  // Helper functions
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "bg-green-100 text-green-800",
      attention: "bg-yellow-100 text-yellow-800",
      inactive: "bg-red-100 text-red-800",
    };
    return statusConfig[status] || "bg-gray-100 text-gray-800";
  };

  const getCompletionStatusBadge = (status) => {
    const statusConfig = {
      "not-started": "bg-gray-100 text-gray-800",
      pending: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
    };
    return statusConfig[status] || "bg-gray-100 text-gray-800";
  };

  const getApprovalStatusBadge = (status) => {
    const statusConfig = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return statusConfig[status] || "bg-gray-100 text-gray-800";
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : `Employee ${employeeId}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{kpi.name}</h2>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                  kpi.status
                )}`}
              >
                {kpi.status?.charAt(0).toUpperCase() + kpi.status?.slice(1) || "Active"}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompletionStatusBadge(
                  kpi.completion_status
                )}`}
              >
                {kpi.completion_status?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "Not Started"}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalStatusBadge(
                  kpi.approval_status
                )}`}
              >
                {kpi.approval_status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                {kpi.approval_status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                {kpi.approval_status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                {kpi.approval_status?.charAt(0).toUpperCase() + kpi.approval_status?.slice(1) || "Pending"}
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1">{kpi.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Single Details Tab (removed submissions tab) */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-indigo-500" />
                    Task Information
                  </h3>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Department:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {kpi.departmentName || kpi.department || "Not specified"}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Company:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {kpi.companyName || kpi.company || "Not specified"}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Start Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(kpi.startDate || kpi.start_date)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">End Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(kpi.endDate || kpi.end_date)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Priority:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {kpi.priority || "Medium"}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Frequency:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {kpi.frequency || "Monthly"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Last Updated:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(kpi.last_updated || kpi.lastUpdated || kpi.updated_at || 'Not recorded')}
                  </span>
                </div>
              </div>

              {kpi.approval_status === 'pending' && kpi.last_updated && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                  <div className="flex items-center text-sm text-blue-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span>This task has been updated and requires re-approval</span>
                  </div>
                </div>
              )}
            </div>

            {/* Creator Information */}
            {kpi.creator && (
              <div className="bg-blue-50 p-4 rounded-xl">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-500" />
                  Creator Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Creator Role:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {kpi.creator.role || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Created Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(kpi.creator.date || kpi.lastUpdated)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Assignment Details */}
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2 text-green-500" />
                Assignment Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Assigned Employees:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {kpi.assignees?.length || 0} employee(s)
                  </span>
                </div>
                
                {kpi.assignees && kpi.assignees.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500 block mb-2">Employee List:</span>
                    <div className="flex flex-wrap gap-2">
                      {kpi.assignees.map((assigneeId, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white border border-gray-200"
                        >
                          <User className="w-3 h-3 mr-1" />
                          {getEmployeeName(assigneeId)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Criteria Weights */}
            {kpi.weights && kpi.weights.length > 0 && (
              <div className="bg-indigo-50 p-4 rounded-xl">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-indigo-500" />
                  Performance Criteria
                </h3>
                <div className="space-y-3">
                  {kpi.weights.map((weight, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{weight.title}</h4>
                        <span className="text-sm font-bold text-indigo-600">{weight.percentage}%</span>
                      </div>
                      {weight.description && (
                        <p className="text-sm text-gray-600">{weight.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [statusFilter, setStatusFilter] = useState("all");
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

  // Add state for submissions
  const [submissions, setSubmissions] = useState({});

  // Add function to fetch submissions for a task
  const fetchSubmissionsForTask = async (taskId) => {
    try {
      const submissionData = await PMSService.getTaskProgressSubmissions(taskId);
      return Array.isArray(submissionData) ? submissionData : [];
    } catch (error) {
      console.error(`Error fetching submissions for task ${taskId}:`, error);
      return [];
    }
  };

  // Get submissions for current task
  const getCurrentTaskSubmissions = () => {
    if (!currentTask) return [];
    return submissions[currentTask.id] || [];
  };

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
    
    const prevPage = currentPage; // preserve current page
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

      // Optimistic UI update (keeps UI snappy)
      setTasks(prev => prev.map(t => t.id === currentTask.id ? { ...t, approval_status: 'approved' } : t));
      setFilteredTasks(prev => prev.map(t => t.id === currentTask.id ? { ...t, approval_status: 'approved' } : t));

      // Refresh authoritative data from server and restore page
      await fetchTasks();
      setCurrentPage(prevPage);

      // Clear selection
      setCurrentTask(null);

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
    const prevPage = currentPage; // preserve current page
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

      // Optimistic UI update
      setTasks(prev => prev.map(t => t.id === currentTask.id ? { ...t, approval_status: 'rejected' } : t));
      setFilteredTasks(prev => prev.map(t => t.id === currentTask.id ? { ...t, approval_status: 'rejected' } : t));

      // Refresh authoritative data from server and restore page
      await fetchTasks();
      setCurrentPage(prevPage);

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
  const openViewModal = async (task) => {
    setCurrentTask(task);
    setIsViewModalOpen(true);
   
    // Fetch submissions for this task
    try {
      const taskSubmissions = await fetchSubmissionsForTask(task.id);
      setSubmissions(prev => ({
        ...prev,
        [task.id]: taskSubmissions
      }));
    } catch (error) {
      console.error("Error loading task submissions:", error);
    }
  };
 
  // Open approve modal
  const openApproveModal = (task) => {
    setCurrentTask(task);
    setIsApproveModalOpen(true);
  };
 
  // Open reject confirmation and act immediately if confirmed
  const openRejectModal = async (task) => {
    // Don't set currentTask here to avoid state race condition
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
      // Set currentTask right before calling the reject function
      setCurrentTask(task);
      
      // Call reject function directly with the task parameter
      await handleRejectTaskDirectly(task);
    }
  };

  // New function to handle reject with direct task parameter
  const handleRejectTaskDirectly = async (task) => {
    if (!task) return;
    
    const prevPage = currentPage; // preserve current page
    setIsSubmitting(true);
    
    try {
      await PMSService.rejectKpiTask(task.id); // Use task.id directly

      await Swal.fire({
        icon: "success",
        title: "Rejected",
        text: "KPI task has been rejected.",
        timer: 1500,
        showConfirmButton: false,
      });

      // Optimistic UI update
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, approval_status: 'rejected' } : t));
      setFilteredTasks(prev => prev.map(t => t.id === task.id ? { ...t, approval_status: 'rejected' } : t));

      // Refresh authoritative data from server and restore page
      await fetchTasks();
      setCurrentPage(prevPage);

      // Clear current task
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
 
  // Helper functions
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return statusConfig[status] || "bg-gray-100 text-gray-800";
  };

  // Add helper utilities near the top of the file or inside TaskApproval component
  const formatTimeSince = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  const isAssignmentUpdated = (task) => {
    if (!task?.last_updated) return false;
    const last = new Date(task.last_updated).getTime();
    const created = task?.created_at ? new Date(task.created_at).getTime() : 0;
    // treat new records as not-updated: require > 60s difference
    return last - created > 60 * 1000;
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
        onClose={() => {
          setIsViewModalOpen(false);
          setCurrentTask(null);
        }}
        kpi={currentTask}
        submissions={getCurrentTaskSubmissions()}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Pending Card */}
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

        {/* Approved Card */}
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

        {/* Rejected Card */}
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

        {/* Updated card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Updated</p>
              <p className="text-2xl font-bold text-blue-600">
                {Array.isArray(tasks) ? tasks.filter(isAssignmentUpdated).length : 0}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Tasks modified after creation</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search box
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search KPI tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div> */}
          
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
                  KPI Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Update Status
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

                    {/* KPI Type */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.kpi_type ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {task.kpi_type ? 'Performance Appraisal' : 'Regular KPI'}
                        </span>
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
                      <div className="flex flex-col gap-1">
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
                        
                        {/* Show "Updated" tag if the task has been modified */}
                        {task.approval_status === "pending" && task.last_updated && task.created_at && (
                          // Only show "Updated" if last_updated is significantly different from created_at
                          new Date(task.last_updated).getTime() > new Date(task.created_at).getTime() + 60000 // 1 minute buffer
                        ) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Updated
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* Update Status */}
                    <td className="px-6 py-4">
                      {isAssignmentUpdated(task) ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100"
                            title={`Updated: ${task.last_updated ? new Date(task.last_updated).toLocaleString() : 'Unknown'}`}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Updated
                          </span>
                          <span className="text-xs text-gray-400">
                            {task.last_updated ? `${formatTimeSince(task.last_updated)} ago` : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No updates</span>
                      )}
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View button - always visible */
                        <button 
                          onClick={() => openViewModal(task)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>}

                        {/* Conditional Approve and Reject buttons based on approval_status */}
                        {task.approval_status === "pending" && (
                          <>
                            <button 
                              onClick={() => openApproveModal(task)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve task"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            
                            <button 
                              onClick={() => openRejectModal(task)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject task"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Show only reject button for approved tasks */}
                        {task.approval_status === "approved" && (
                          <button 
                            onClick={() => openRejectModal(task)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject approved task"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {/* Show only approve button for rejected tasks */}
                        {task.approval_status === "rejected" && (
                          <button 
                            onClick={() => openApproveModal(task)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve rejected task"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center">
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