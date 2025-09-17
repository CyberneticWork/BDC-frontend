import React, { useState, useEffect } from "react";
import {
  PieChart,
  Search,
  Clock,
  CalendarDays,
  CheckCircle,
  AlertCircle,
  BarChart3,
  User,
  Eye,
  Upload,
  Loader2,
  File,
  Calendar,
  X,
} from "lucide-react";
import PMSService from "../../../services/PMS/PMSService"; // Updated import
import { TaskProgressUpdateModal } from "./TaskProgressUpdateModal";
import { TaskViewModal } from "./TaskViewModal";

const EmployeeKPIView = () => {
  const [myTasks, setMyTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Add state for progress submissions
  const [progressSubmissions, setProgressSubmissions] = useState({});
  
  // Modal states
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Current employee ID (replace with auth context or prop)
  const [currentEmployeeId, setCurrentEmployeeId] = useState(getLoggedInEmployeeId());

  function getLoggedInEmployeeId() {
    // Prefer stored auth user payload if present
    try {
      const authRaw = localStorage.getItem('auth_user') || localStorage.getItem('user') || null;
      if (authRaw) {
        const auth = JSON.parse(authRaw);
        if (auth.employee_id) return String(auth.employee_id);
        if (auth.attendance_employee_no) return String(auth.attendance_employee_no);
        if (auth.user && auth.user.employee_id) return String(auth.user.employee_id);
        if (auth.user && auth.user.attendance_employee_no) return String(auth.user.attendance_employee_no);
      }
    } catch (e) {
      // ignore parse errors
    }
    // fallback saved id
    const saved = localStorage.getItem('currentEmployeeId');
    if (saved) return String(saved);
    return ''; // empty if unknown
  }

  // Fetch tasks from API (updated to use employee-specific endpoint)
  const fetchMyTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching tasks for employeeId:', currentEmployeeId);

      if (!currentEmployeeId) {
        console.error('No employeeId available!');
        setError('User ID not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      const response = await PMSService.getEmployeeKpiTaskAssignments(currentEmployeeId);
      console.log('API Response:', response);

      if (!Array.isArray(response)) {
        console.error('Invalid API response format, expected array:', response);
        setError('Invalid data received from server');
        setMyTasks([]);
        return;
      }

      setMyTasks(response);
      
      // Fetch progress submissions for each task
      await fetchProgressSubmissions(response);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err?.message || 'Failed to fetch tasks');
      setMyTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // New function to fetch progress submissions
  const fetchProgressSubmissions = async (tasks) => {
    try {
      const submissions = {};
      
      // Fetch progress submissions for each task
      for (const task of tasks) {
        try {
          const taskSubmissions = await PMSService.getTaskProgressSubmissions(task.id);
          submissions[task.id] = taskSubmissions || [];
        } catch (err) {
          console.error(`Error fetching submissions for task ${task.id}:`, err);
          submissions[task.id] = [];
        }
      }
      
      setProgressSubmissions(submissions);
    } catch (err) {
      console.error('Error fetching progress submissions:', err);
    }
  };

  // Get latest submission for a task
  const getLatestSubmission = (taskId) => {
    const submissions = progressSubmissions[taskId] || [];
    if (submissions.length === 0) return null;
    
    // Sort by created_at desc and get the first one
    return submissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  };

  // Get all submissions for a task (for view modal)
  const getAllSubmissions = (taskId) => {
    const submissions = progressSubmissions[taskId] || [];
    return submissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  useEffect(() => {
    fetchMyTasks();
  }, [currentEmployeeId]); // Refetch if employee ID changes

  useEffect(() => {
    applyFilters();
  }, [myTasks, searchTerm, statusFilter]);

  const applyFilters = () => {
    let filtered = Array.isArray(myTasks) ? myTasks : [];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((task) => {
        const name = (task.name || '').toString().toLowerCase();
        const desc = (task.description || '').toString().toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => (task.status || '').toString() === statusFilter);
    }

    setFilteredTasks(filtered);
  };

  const handleOpenProgressModal = (task) => {
    setSelectedTask(task);
    setIsProgressModalOpen(true);
  };

  const handleOpenViewModal = (task) => {
    setSelectedTask(task);
    setIsViewModalOpen(true);
  };

  const handleProgressUpdate = async (taskId, progressData) => {
    console.log("handleProgressUpdate called with:", { taskId, progressData }); // Debug log
    
    try {
      // Find the assignment ID for this task
      const task = myTasks.find(t => t.id === taskId);
      if (!task) {
        console.error("Task not found:", taskId);
        alert("Task not found");
        return;
      }

      // Get current employee ID (convert to numeric if needed)
      let employeeDbId = null;
      
      // Try to extract numeric ID from currentEmployeeId
      if (typeof currentEmployeeId === 'string' && currentEmployeeId.startsWith('EMP')) {
        // Extract number from EMP0001 format
        const numericPart = currentEmployeeId.replace(/\D/g, '');
        employeeDbId = parseInt(numericPart);
      } else if (typeof currentEmployeeId === 'number') {
        employeeDbId = currentEmployeeId;
      } else {
        employeeDbId = parseInt(currentEmployeeId);
      }

      // Enhanced validation with detailed logging
      console.log("Validation data:", {
        employeeDbId,
        progressPercentage: progressData.progressPercentage,
        note: progressData.note
      });

      if (!employeeDbId || isNaN(employeeDbId)) {
        console.error("Invalid employee ID:", employeeDbId);
        alert("Invalid employee ID. Please refresh the page and try again.");
        return;
      }

      if (!progressData.progressPercentage && progressData.progressPercentage !== 0) {
        console.error("Missing progressPercentage:", progressData.progressPercentage);
        alert("Progress percentage is missing. Please set a progress value.");
        return;
      }

      if (isNaN(parseInt(progressData.progressPercentage))) {
        console.error("Invalid progressPercentage:", progressData.progressPercentage);
        alert("Invalid progress percentage. Please ensure you've set a progress value.");
        return;
      }

      if (!progressData.note || progressData.note.trim() === '') {
        console.error("Missing or empty note:", progressData.note);
        alert("Progress note is required. Please add a note describing your progress.");
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Append form fields with proper data types
      formData.append('kpi_assignment_id', parseInt(taskId));
      formData.append('employee_id', employeeDbId);
      formData.append('note', progressData.note.trim());
      formData.append('progress_percentage', parseInt(progressData.progressPercentage));
      formData.append('performance_metrics', JSON.stringify(progressData.performanceMetrics || {
        [task.name]: parseInt(progressData.progressPercentage)
      }));
      
      // Append document metadata only if file exists
      if (progressData.file && progressData.documentName) {
        formData.append('document_name', progressData.documentName);
        formData.append('document_size', progressData.documentSize || '0 KB');
        formData.append('document_type', progressData.documentType || 'unknown');
        formData.append('document', progressData.file);
      }

      console.log("FormData ready for submission");

      const result = await PMSService.submitTaskProgress(formData);
      console.log("Progress submitted successfully:", result);

      // Refresh tasks and submissions after successful submission
      await fetchMyTasks();
      setIsProgressModalOpen(false);
      
      alert("Progress submitted successfully!");

    } catch (error) {
      console.error("Error updating task progress:", error);
      
      // Handle validation errors specifically
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;
        if (errors) {
          console.error("Validation errors:", errors);
          const errorMessages = Object.entries(errors).map(([field, messages]) => 
            `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
          ).join('\n');
          alert(`Validation failed:\n${errorMessages}`);
        } else {
          alert(`Validation failed: ${error.response?.data?.message || 'Please check your input and try again.'}`);
        }
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        alert(`Failed to submit progress: ${errorMessage}`);
      }
    }
  };

  // Helper functions (unchanged)
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "bg-green-100 text-green-800",
      attention: "bg-yellow-100 text-yellow-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return statusConfig[status] || statusConfig.inactive;
  };

  const getCompletionStatusBadge = (status) => {
    const statusConfig = {
      "not-started": "bg-gray-100 text-gray-700",
      "pending": "bg-blue-100 text-blue-700",
      "in-progress": "bg-purple-100 text-purple-700",
      "completed": "bg-green-100 text-green-700",
    };
    return statusConfig[status] || statusConfig["not-started"];
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const due = new Date(endDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
    };
    return priorityConfig[priority] || "bg-gray-100 text-gray-800";
  };

  const getTimelinePercentage = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    const totalDuration = end - start;
    const elapsedDuration = today - start;
    
    if (elapsedDuration <= 0) return 0;
    if (elapsedDuration >= totalDuration) return 100;
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="mt-2 text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Tasks</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchMyTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Progress Update Modal */}
      <TaskProgressUpdateModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        task={selectedTask}
        onSubmit={(progressData) => handleProgressUpdate(selectedTask?.id, progressData)} // Fix: pass selectedTask.id and progressData separately
        employeeId={currentEmployeeId}
        employeeName="Current Employee" // Replace with actual name from auth
      />

      {/* View Task Modal - Pass submissions data */}
      <TaskViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        kpi={selectedTask}
        submissions={selectedTask ? getAllSubmissions(selectedTask.id) : []}
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              My KPI Tasks
            </h1>
            <p className="text-gray-600 mt-2">
              Track and submit deliverables for your assigned tasks
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{myTasks.length}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {myTasks.filter((k) => k.completionStatus === "completed").length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Need Attention</p>
              <p className="text-2xl font-bold text-yellow-600">
                {myTasks.filter((k) => k.status === "attention").length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Documents Submitted</p>
              <p className="text-2xl font-bold text-indigo-600">
                {Object.values(progressSubmissions).reduce((total, submissions) => total + submissions.length, 0)}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl">
              <File className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="attention">Need Attention</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const latestSubmission = getLatestSubmission(task.id);

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                {/* Task content */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                          task.status
                        )}`}
                      >
                        {task.status === "active" && (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        {task.status === "attention" && (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompletionStatusBadge(
                          task.completionStatus
                        )}`}
                      >
                        {task.completionStatus?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "Not Started"}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="col-span-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Timeline ({getTimelinePercentage(task.startDate, task.endDate)}% elapsed)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {getDaysRemaining(task.endDate)} days remaining
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-indigo-500`}
                            style={{
                              width: `${getTimelinePercentage(task.startDate, task.endDate)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {(progressSubmissions[task.id] || []).length} submission{(progressSubmissions[task.id] || []).length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Last updated: {latestSubmission ? new Date(latestSubmission.created_at).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Progress: {latestSubmission ? latestSubmission.progress_percentage : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Latest Submission */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2 font-medium">Latest Submission</p>
                      {latestSubmission ? (
                        <div className="space-y-2">
                          {/* Document info - more compact */}
                          {latestSubmission.document_name && (
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 bg-indigo-100 rounded p-1">
                                <File className="w-3 h-3 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-indigo-600 truncate">
                                  {latestSubmission.document_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {latestSubmission.document_size}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Progress Bar - more compact */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                                <BarChart3 className="h-3 w-3 text-gray-500" />
                                Progress: {latestSubmission.progress_percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  latestSubmission.progress_percentage < 30 ? 'bg-red-500' : 
                                  latestSubmission.progress_percentage < 70 ? 'bg-yellow-500' : 
                                  'bg-green-500'
                                }`}
                                style={{ width: `${latestSubmission.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Note - more compact */}
                          <p className="text-xs text-gray-800 leading-relaxed line-clamp-2">
                            {latestSubmission.note}
                          </p>
                          
                          {/* Timestamp - more compact */}
                          <p className="text-xs text-gray-500">
                            {new Date(latestSubmission.created_at).toLocaleString()}
                          </p>
                          
                          {/* Performance Metrics Highlights - more compact */}
                          {latestSubmission.performance_metrics && (
                            <div className="pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-2 font-medium">Top Metrics:</p>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                {Object.entries(latestSubmission.performance_metrics)
                                  .sort((a, b) => b[1] - a[1])
                                  .slice(0, 4)
                                  .map(([key, value]) => {
                                    const displayName = key.replace(/([A-Z])/g, ' $1')
                                      .replace(/^./, str => str.toUpperCase());
                                    
                                    return (
                                      <div key={key} className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600 truncate pr-1" title={displayName}>
                                          {displayName.length > 12 ? displayName.substring(0, 12) + '...' : displayName}:
                                        </span>
                                        <span className="text-xs font-medium text-gray-900">{value}%</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">No submissions yet</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row lg:flex-col gap-2">
                    <button
                      onClick={() => handleOpenViewModal(task)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => handleOpenProgressModal(task)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Submit Work</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search criteria or filters"
                : "You don't have any assigned KPI tasks yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeKPIView;