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
import PMSService from "@services/PMS/PMSService";
import PMSDummyDataStore from "@services/PMS/PMSDummyDataStore";
import { TaskProgressUpdateModal } from "./TaskProgressUpdateModal";
import { TaskViewModal } from "./TaskViewModal";

const EmployeeKPIView = () => {
  const [myTasks, setMyTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal states
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState("1"); // Should come from auth context
  // DEBUG: temporary employee switcher
  const employeeOptions = [
    { id: "1", name: "Sarah Johnson" },
    { id: "2", name: "Mike Chen" },
    { id: "3", name: "Emma Davis" },
    { id: "4", name: "John Smith" },
  ];

  // Mock employee data - replace with context or API call
  const currentEmployee = {
    id: "1",
    name: "Sarah Johnson",
    department: "Customer Service",
    position: "Customer Service Lead"
  };

  // fetchMyTasks stays as-is
  const fetchMyTasks = async () => {
    setIsLoading(true);
    try {
      const all = PMSDummyDataStore.getAllKpiTasks
        ? PMSDummyDataStore.getAllKpiTasks()
        : [];
      console.log("All tasks in store:", all.map(t => ({
        id: t.id,
        assignees: t.assignees,
        updates: t.assigneeUpdates?.map(u => ({ emp: u.employeeId, count: u.updates.length }))
      })));
      const tasks = PMSDummyDataStore.getEmployeeTasks(currentEmployeeId);
      console.log('Fetched tasks for employee', currentEmployeeId, ':', tasks.map(t=>t.id));
      setMyTasks(tasks);
      setFilteredTasks(tasks);
    } finally {
      setIsLoading(false);
    }
  };

  // Replace initial mount effect with a subscription so this view refreshes
  useEffect(() => {
    // initial load
    fetchMyTasks();

    // subscribe to store changes (PMSDummyDataStore.subscribe returns an unsubscribe fn)
    const unsubscribe = PMSDummyDataStore.subscribe(() => {
      // re-fetch tasks when store notifies
      fetchMyTasks();
    });

    return () => {
      // cleanup subscription on unmount
      unsubscribe();
    };
  }, [currentEmployeeId]); // refetch if employee id changes

  useEffect(() => {
    applyFilters();
  }, [myTasks, searchTerm, statusFilter]);

  const applyFilters = () => {
    let filtered = myTasks;

    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
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
      PMSDummyDataStore.updateTaskProgress(taskId, currentEmployeeId, {
        ...progressData,
        author: currentEmployee.name,
      });
      const refreshed = PMSDummyDataStore.getEmployeeTasks(currentEmployeeId);
      setMyTasks(refreshed);
      setIsProgressModalOpen(false);
    } catch (e) {
      console.error("Error updating task progress:", e);
    }
  };

  // Helper functions
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

  // Calculate task timeline percentage
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Progress Update Modal */}
      <TaskProgressUpdateModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        task={selectedTask}
        onSubmit={(progressData) => handleProgressUpdate(selectedTask?.id, progressData)}
        employeeId={currentEmployeeId}
        employeeName={currentEmployee.name}
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

      {/* DEBUG: Employee switcher and reload button */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="text-xs text-gray-500">Viewing as:</div>
        <select
          value={currentEmployeeId}
          onChange={(e)=>setCurrentEmployeeId(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded-lg"
        >
          {employeeOptions.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name} (ID {emp.id})</option>
          ))}
        </select>
        <button
          onClick={fetchMyTasks}
          className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md"
        >
          Reload
        </button>
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
            // ensure myUpdates is available to all sub-sections in this task card
            const myUpdates = task.assigneeUpdates.find(
              (au) => au.employeeId === parseInt(currentEmployeeId)
            )?.updates || [];

            return (
            <div
              key={task.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
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
                    
                    <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
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
                              {/* Add self-reported progress visualization here */}
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
                    
                    {/* Performance Metrics Highlights - new section */}
                    {myUpdates.length > 0 && myUpdates[myUpdates.length - 1].performanceMetrics && (
                       <div className="mt-3 pt-3 border-t border-gray-200">
                         <p className="text-xs text-gray-500 mb-2">Performance Metrics Highlights:</p>
                         <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                           {/* Show top 4 metrics */}
                           {Object.entries(myUpdates[myUpdates.length - 1].performanceMetrics)
                             .sort((a, b) => b[1] - a[1])
                             .slice(0, 4)
                             .map(([key, value]) => {
                               // Convert camelCase to display format
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