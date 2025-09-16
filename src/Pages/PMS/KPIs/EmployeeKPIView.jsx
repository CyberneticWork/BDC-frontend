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
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err?.message || 'Failed to fetch tasks');
      setMyTasks([]);
    } finally {
      setIsLoading(false);
    }
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
    try {
      // Assuming you have an API method for updates (e.g., PMSService.updateTaskProgress)
      // For now, simulate or call the appropriate service
      console.log("Updating progress for task:", taskId, progressData);
      // Refresh tasks after update
      fetchMyTasks();
      setIsProgressModalOpen(false);
    } catch (e) {
      console.error("Error updating task progress:", e);
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
        onSubmit={(progressData) => handleProgressUpdate(selectedTask?.id, progressData)}
        employeeId={currentEmployeeId}
        employeeName="Current Employee" // Replace with actual name from auth
      />

      {/* View Task Modal */}
      <TaskViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        kpi={selectedTask}
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
                {myTasks.reduce((total, task) => total + (task.documentCount || 0), 0)}
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
            // Ensure myUpdates is available
            const empNumeric = parseInt(String(currentEmployeeId).replace(/\D/g, ''), 10) || null;
            const empRawStr = String(currentEmployeeId);

            const myUpdates = (task.assigneeUpdates && Array.isArray(task.assigneeUpdates))
              ? (task.assigneeUpdates.find(au => {
                  if (!au) return false;
                  // match numeric or string or direct equality
                  if (typeof au.employeeId === 'number' && empNumeric && au.employeeId === empNumeric) return true;
                  if (String(au.employeeId) === empRawStr) return true;
                  if (String(au.employeeId) === String(empNumeric)) return true;
                  return false;
                }) || {}).updates || []
              : [];

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                {/* Task content (unchanged from original) */}
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
                            {task.documentCount || 0} document{task.documentCount !== 1 ? 's' : ''} submitted
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Last updated: {new Date(task.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Weights Total: {task.weights ? task.weights.reduce((sum, w) => sum + (w.percentage || 0), 0) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Latest update with document */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Latest Submission</p>
                      {myUpdates.length > 0 ? (
                        (() => {
                          const latestUpdate = myUpdates[myUpdates.length - 1];
                          return (
                            <div className="flex items-start gap-3">
                              {latestUpdate.documentName && (
                                <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-2">
                                  <File className="w-5 h-5 text-indigo-600" />
                                </div>
                              )}
                              <div>
                                {latestUpdate.documentName && (
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-indigo-600">
                                      {latestUpdate.documentName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {latestUpdate.documentSize}
                                    </span>
                                  </div>
                                )}
                                {/* Self-reported progress */}
                                {latestUpdate.progressPercentage !== undefined && (
                                  <div className="mt-1 mb-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600 font-medium flex items-center gap-1">
                                        <BarChart3 className="h-3 w-3 text-gray-500" />
                                        Self-reported progress: {latestUpdate.progressPercentage}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                      <div 
                                        className={`h-1.5 rounded-full ${
                                          latestUpdate.progressPercentage < 30 ? 'bg-red-500' : 
                                          latestUpdate.progressPercentage < 70 ? 'bg-yellow-500' : 
                                          'bg-green-500'
                                        }`}
                                        style={{ width: `${latestUpdate.progressPercentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                <p className="text-sm text-gray-800">{latestUpdate.note}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(latestUpdate.date).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <p className="text-sm text-gray-600">No documents submitted yet</p>
                      )}
                      
                      {/* Performance Metrics Highlights */}
                      {myUpdates.length > 0 && myUpdates[myUpdates.length - 1].performanceMetrics && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Performance Metrics Highlights:</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {Object.entries(myUpdates[myUpdates.length - 1].performanceMetrics)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 4)
                              .map(([key, value]) => {
                                const displayName = key.replace(/([A-Z])/g, ' $1')
                                  .replace(/^./, str => str.toUpperCase());
                                
                                return (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-xs text-gray-600">{displayName}:</span>
                                    <span className="text-xs font-medium text-gray-900">{value}%</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
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