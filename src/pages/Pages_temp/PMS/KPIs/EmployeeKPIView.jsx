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
  ChevronLeft,
  ChevronRight,
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 3;
  
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

      // changed code: sort only by most-recent timestamp (created_at, lastUpdated, startDate) — latest first
      const parseTimestamp = (t) => {
        const candidates = [t.created_at, t.lastUpdated, t.startDate, t.endDate];
        for (const c of candidates) {
          if (c) {
            const ts = Date.parse(c);
            if (!isNaN(ts)) return ts;
          }
        }
        return 0;
      };

      const sortedTasks = [...response].sort((a, b) => parseTimestamp(b) - parseTimestamp(a));

      setMyTasks(sortedTasks);
      
      // Fetch progress submissions for each task
      await fetchProgressSubmissions(sortedTasks);
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
    setCurrentPage(1); // Reset pagination when filters change
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        note: progressData.note,
        rating: progressData.rating // Add rating to validation log
      });

      if (!employeeDbId || isNaN(employeeDbId)) {
        console.error("Invalid employee ID:", employeeDbId);
        alert("Invalid employee ID. Please refresh the page and try again.");
        return;
      }

      // Check if this is a performance appraisal task
      const isPerformanceAppraisal = task.kpi_type === 1 || task.kpi_type === true || task.kpi_type === 'performance_appraisal';

      if (isPerformanceAppraisal) {
        // For Performance Appraisal: validate rating
        if (!progressData.rating || progressData.rating < 1 || progressData.rating > 5) {
          console.error("Invalid rating for performance appraisal:", progressData.rating);
          alert("Rating is required for performance appraisal tasks (1-5).");
          return;
        }
      } else {
        // For Regular tasks: validate progress percentage
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
      
      // Handle progress percentage and rating based on task type
      if (isPerformanceAppraisal) {
        // For performance appraisal: use rating * 20 as progress percentage
        const calculatedProgress = progressData.rating * 20;
        formData.append('progress_percentage', calculatedProgress);
        formData.append('rating', progressData.rating);
      } else {
        // For regular tasks: use the progress percentage directly
        formData.append('progress_percentage', parseInt(progressData.progressPercentage));
        // Don't append rating for regular tasks (it will be null in database)
      }
      
      formData.append('performance_metrics', JSON.stringify(progressData.performanceMetrics || {
        [task.name]: isPerformanceAppraisal ? (progressData.rating * 20) : parseInt(progressData.progressPercentage)
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

  // compute documents submitted count (only count submissions that have a document)
  const documentsSubmittedCount = Object.values(progressSubmissions).reduce(
    (total, subs) => {
      if (!Array.isArray(subs)) return total;
      const withDoc = subs.filter(s =>
        Boolean(
          s.document_name ||
          s.documentName ||
          s.document_path ||
          s.documentPath ||
          s.document ||
          s.file
        )
      ).length;
      return total + withDoc;
    },
    0
  );

  // --- NEW: compute Completed and Need-Attention counts from real data ---
  const completedCount = myTasks.reduce((count, task) => {
    const latest = getLatestSubmission(task.id);
    const completionStatus = (task.completionStatus || task.completion_status || '').toString().toLowerCase();

    // Task is completed if:
    // 1. Completion status is explicitly 'completed', OR
    // 2. Latest submission progress is >= 100%, OR  
    // 3. Has at least one submission (any progress counts as completed task)
    if (completionStatus === 'completed') return count + 1;
    
    if (latest) {
      const latestProgress = parseInt(latest.progress_percentage ?? latest.progress ?? 0, 10) || 0;
      if (latestProgress >= 100) return count + 1;
      // If task has any submission, count as completed (one submission = one completed task)
      return count + 1;
    }

    return count;
  }, 0);

  const needAttentionCount = myTasks.reduce((count, task) => {
    const completionStatus = (task.completionStatus || task.completion_status || '').toString().toLowerCase();
    const subs = Array.isArray(progressSubmissions[task.id]) ? progressSubmissions[task.id] : [];
    const latest = getLatestSubmission(task.id);

    // Need attention if:
    // 1. Not explicitly completed AND
    // 2. No submissions at all (hasn't started)
    if (completionStatus !== 'completed' && subs.length === 0 && !latest) {
      return count + 1;
    }

    return count;
  }, 0);

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

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: "bg-gray-100 text-gray-700",
      medium: "bg-blue-100 text-blue-700", 
      high: "bg-red-100 text-red-700",
    };
    return priorityConfig[priority] || priorityConfig.medium;
  };

  // Update the getTimelinePercentage function to handle different date property names
  const getTimelinePercentage = (task) => {
    // Try different possible date property names
    const startDate = task.startDate || task.start_date || task.startedAt || task.created_at;
    const endDate = task.endDate || task.end_date || task.dueDate || task.due_date;
    
    if (!startDate || !endDate) {
      console.warn('Missing dates for task:', task.id, { startDate, endDate });
      return { percentage: 0, status: 'no-dates' };
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid dates for task:', task.id, { startDate, endDate });
      return { percentage: 0, status: 'invalid-dates' };
    }
    
    const totalDuration = end - start;
    const elapsedDuration = today - start;
    
    if (elapsedDuration <= 0) return { percentage: 0, status: 'not-started' };
    if (elapsedDuration >= totalDuration) return { percentage: 100, status: 'overdue' };
    
    return { 
      percentage: Math.round((elapsedDuration / totalDuration) * 100), 
      status: 'on-track' 
    };
  };

  // Update getDaysRemaining function
  const getDaysRemaining = (task) => {
    const endDate = task.endDate || task.end_date || task.dueDate || task.due_date;
    
    if (!endDate) return 'No due date';
    
    const today = new Date();
    const due = new Date(endDate);
    
    if (isNaN(due.getTime())) return 'Invalid date';
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Add a helper function to format dates safely
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Not set';
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Add this helper function near your other helper functions (around line 380)
  const isTaskPastDue = (task) => {
    const endDate = task.endDate || task.end_date || task.dueDate || task.due_date;
    
    if (!endDate) return false; // If no end date, allow submission
    
    const today = new Date();
    const due = new Date(endDate);
    
    if (isNaN(due.getTime())) return false; // If invalid date, allow submission
    
    // Set time to end of day for due date to allow submissions until end of due date
    due.setHours(23, 59, 59, 999);
    
    return today > due; // Returns true if current time is past the end date
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
              Track and submit deliverables for your assigned tasks (Latest added first)
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
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
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
              <p className="text-2xl font-bold text-yellow-600">{needAttentionCount}</p>
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
                {documentsSubmittedCount}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl">
              <File className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        {/* New Stats Card: Overdue Tasks */}
        {/* <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
              <p className="text-2xl font-bold text-red-600">
                {myTasks.filter(task => isTaskPastDue(task)).length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div> */}
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
        {currentTasks.length > 0 ? (
          currentTasks.map((task) => {
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
                      
                      {/* KPI Type Badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.kpi_type ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.kpi_type ? 'Performance Appraisal' : 'Regular KPI'}
                      </span>
                      
                      {/* Add past due indicator */}
                      {isTaskPastDue(task) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Past Due
                        </span>
                      )}
                      
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompletionStatusBadge(
                          task.completionStatus
                        )}`}
                      >
                        {task.completionStatus?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "Not Started"}
                      </span>

                      {/* Priority display commented out per request */}
                      {/*
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </span>
                      */}
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="col-span-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Timeline ({(() => {
                                const timeline = getTimelinePercentage(task);
                                if (timeline.status === 'no-dates') return 'No dates set';
                                if (timeline.status === 'invalid-dates') return 'Invalid dates';
                                if (timeline.status === 'overdue') return 'Overdue';
                                return `${timeline.percentage}% elapsed`;
                              })()})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {(() => {
                                const remaining = getDaysRemaining(task);
                                if (typeof remaining === 'number') {
                                  if (remaining < 0) return `${Math.abs(remaining)} days overdue`;
                                  if (remaining === 0) return 'Due today';
                                  return `${remaining} days remaining`;
                                }
                                return remaining; // 'No due date' or 'Invalid date'
                              })()}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          {(() => {
                            const timeline = getTimelinePercentage(task);
                            return (
                              <div
                                className={`h-2 rounded-full ${
                                  timeline.status === 'not-started' ? 'bg-gray-400' :
                                  timeline.status === 'overdue' ? 'bg-red-500' :
                                  timeline.status === 'no-dates' || timeline.status === 'invalid-dates' ? 'bg-gray-300' :
                                  'bg-blue-500'
                                }`}
                                style={{
                                  width: `${timeline.percentage}%`,
                                }}
                              ></div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(task.startDate || task.start_date)} - {formatDate(task.endDate || task.end_date)}
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
                            Last updated: {latestSubmission ? formatDate(latestSubmission.created_at) : 'Never'}
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
                    
                    {/* Latest Submission - Reduced Size */}
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Latest Submission</p>
                      {latestSubmission ? (
                        <div className="space-y-1">
                          {/* Document info - compact */}
                          {latestSubmission.document_name && (
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 bg-indigo-100 rounded p-0.5">
                                <File className="w-2.5 h-2.5 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-indigo-600 truncate">
                                  {latestSubmission.document_name}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Progress Bar - compact */}
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                              <BarChart3 className="h-2.5 w-2.5 text-gray-500" />
                              Progress: {latestSubmission.progress_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full ${
                                latestSubmission.progress_percentage < 30 ? 'bg-red-500' : 
                                latestSubmission.progress_percentage < 70 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${latestSubmission.progress_percentage}%` }}
                            ></div>
                          </div>
                          
                          {/* Note - compact */}
                          <p className="text-xs text-gray-800 line-clamp-1 mt-1">
                            {latestSubmission.note}
                          </p>
                          
                          {/* Timestamp - compact */}
                          <p className="text-xs text-gray-500">
                            {new Date(latestSubmission.created_at).toLocaleDateString()}
                          </p>
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
                    {/* Update the Submit Work button */}
                    <button
                      onClick={() => handleOpenProgressModal(task)}
                      disabled={isTaskPastDue(task)}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        isTaskPastDue(task)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                      title={isTaskPastDue(task) ? "Cannot submit work after task end date" : "Submit your work progress"}
                    >
                      <Upload className="h-4 w-4" />
                      <span>{isTaskPastDue(task) ? "Past Due" : "Submit Work"}</span>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredTasks.length)} of {filteredTasks.length} tasks
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
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
            
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
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
  );
};

export default EmployeeKPIView;