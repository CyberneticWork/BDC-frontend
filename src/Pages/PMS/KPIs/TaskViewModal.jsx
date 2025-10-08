import React, { useState } from "react";
import {
  X,
  File,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Paperclip,
  Download,
  BarChart3,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export const TaskViewModal = ({ isOpen, onClose, kpi = null, submissions = [] }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [showAllMetrics, setShowAllMetrics] = useState({});

  if (!isOpen || !kpi) return null;

  const toggleShowAllMetrics = (updateId) => {
    setShowAllMetrics((prev) => ({
      ...prev,
      [updateId]: !prev[updateId]
    }));
  };

  // Helper function to safely format dates
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

  // Helper function to get start date from different possible property names
  const getStartDate = () => {
    return kpi.startDate || kpi.start_date || kpi.created_at;
  };

  // Helper function to get end date from different possible property names
  const getEndDate = () => {
    return kpi.endDate || kpi.end_date || kpi.dueDate || kpi.due_date;
  };

  // Calculate progress from startDate to endDate
  const getTimelinePercentage = () => {
    const startDate = getStartDate();
    const endDate = getEndDate();
    
    if (!startDate || !endDate) {
      console.warn('Missing dates for KPI:', kpi.id, { startDate, endDate });
      return 0;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid dates for KPI:', kpi.id, { startDate, endDate });
      return 0;
    }
    
    const totalDuration = end - start;
    const elapsedDuration = today - start;
    
    if (elapsedDuration <= 0) return 0;
    if (elapsedDuration >= totalDuration) return 100;
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  };

  const getDaysRemaining = () => {
    const endDate = getEndDate();
    
    if (!endDate) return 'No due date';
    
    const today = new Date();
    const due = new Date(endDate);
    
    if (isNaN(due.getTime())) return 'Invalid date';
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    return `${diffDays} days remaining`;
  };

  // Helper function to get timeline status message
  const getTimelineStatus = () => {
    const startDate = getStartDate();
    const endDate = getEndDate();
    
    if (!startDate || !endDate) return 'No dates set';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid dates';
    
    const percentage = getTimelinePercentage();
    if (percentage >= 100) return 'Timeline complete';
    if (percentage <= 0) return 'Not started';
    return `${percentage}% elapsed`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "bg-green-100 text-green-800",
      attention: "bg-yellow-100 text-yellow-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return statusConfig[status] || statusConfig.inactive;
  };

  // const getPriorityBadge = (priority) => {
  //   const priorityConfig = {
  //     high: "bg-red-100 text-red-800",
  //     medium: "bg-yellow-100 text-yellow-800",
  //     low: "bg-blue-100 text-blue-800",
  //   };
  //   return priorityConfig[priority] || "bg-gray-100 text-gray-800";
  // };

  const getCompletionStatusBadge = (status) => {
    const statusConfig = {
      "not-started": "bg-gray-100 text-gray-700",
      "pending": "bg-blue-100 text-blue-700",
      "in-progress": "bg-purple-100 text-purple-700",
      "completed": "bg-green-100 text-green-700",
    };
    return statusConfig[status] || statusConfig["not-started"];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{kpi.name}</h2>
            <div className="flex items-center mt-2 flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                  kpi.status
                )}`}
              >
                {kpi.status === "active" && <CheckCircle className="w-3 h-3 mr-1" />}
                {kpi.status === "attention" && <AlertCircle className="w-3 h-3 mr-1" />}
                {kpi.status.charAt(0).toUpperCase() + kpi.status.slice(1)}
              </span>
              {/* <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(
                  kpi.priority
                )}`}
              >
                {kpi.priority.charAt(0).toUpperCase() + kpi.priority.slice(1)} Priority
              </span> */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompletionStatusBadge(
                  kpi.completionStatus
                )}`}
              >
                {kpi.completionStatus?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "Not Started"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100">
          <div className="flex px-6">
            <button
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                activeTab === "details"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                activeTab === "submissions"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("submissions")}
            >
              Progress Submissions ({submissions.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {formatDate(getStartDate())} — {formatDate(getEndDate())}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        Timeline: {getTimelineStatus()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="col-span-full">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          getTimelinePercentage() >= 100 ? 'bg-red-500' : 
                          getTimelinePercentage() <= 0 ? 'bg-gray-400' : 
                          'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(getTimelinePercentage(), 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <span className="text-sm text-gray-600">
                        {getDaysRemaining()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-gray-800">{kpi.description}</p>
              </div>

              {/* Performance Criteria Weights */}
              {kpi.weights && kpi.weights.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Performance Criteria Weights</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      {kpi.weights.map((weight, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{weight.title}</p>
                            {weight.description && (
                              <p className="text-xs text-gray-500">{weight.description}</p>
                            )}
                          </div>
                          <span className="text-sm font-bold text-indigo-600">{weight.percentage}%</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Total:</span>
                        <span className="text-sm font-bold text-indigo-600">
                          {kpi.weights.reduce((sum, w) => sum + (w.percentage || 0), 0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                  <p className="text-gray-800">{formatDate(getStartDate())}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
                  <p className="text-gray-800">{formatDate(getEndDate())}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3>
                  <p className="text-gray-800">{kpi.department || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Submissions</h3>
                  <p className="text-gray-800">{submissions.length}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                  <p className="text-gray-800">
                    {kpi.lastUpdated ? formatDate(kpi.lastUpdated) : 
                     kpi.updated_at ? formatDate(kpi.updated_at) : 'Not available'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Current Progress</h3>
                  <p className="text-gray-800">
                    {submissions.length > 0 ? submissions[0].progress_percentage : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "submissions" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Progress History</h3>
                <span className="text-xs text-gray-400">Sorted by most recent</span>
              </div>
              
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                {submissions.length > 0 ? (
                  submissions.map((submission, idx) => (
                    <div key={submission.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        {submission.document_name ? (
                          <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-2">
                            <File className="w-5 h-5 text-indigo-600" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 bg-gray-200 rounded-full p-2">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          {/* Document info */}
                          {submission.document_name && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-indigo-600">
                                {submission.document_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {submission.document_size}
                              </span>
                              {submission.document_path && (
                                <button className="p-1 text-gray-400 hover:text-indigo-600">
                                  <Download className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="mt-3 mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-700 font-medium flex items-center gap-1">
                                <BarChart3 className="h-3 w-3 text-gray-500" />
                                Progress: {submission.progress_percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  submission.progress_percentage < 30 ? 'bg-red-500' : 
                                  submission.progress_percentage < 70 ? 'bg-yellow-500' : 
                                  'bg-green-500'
                                }`}
                                style={{ width: `${submission.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Performance Metrics */}
                          {submission.performance_metrics && (
                            <div className="mt-3 mb-3 bg-gray-100 rounded-lg p-3">
                              <div 
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() => toggleShowAllMetrics(`${submission.id}-${submission.created_at}`)}
                              >
                                <h4 className="text-xs font-semibold text-gray-700">Performance Metrics:</h4>
                                {showAllMetrics[`${submission.id}-${submission.created_at}`] ? (
                                  <ChevronUp className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                              
                              {showAllMetrics[`${submission.id}-${submission.created_at}`] ? (
                                // Show all metrics when expanded
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                  {Object.entries(submission.performance_metrics).map(([key, value]) => {
                                    // Convert camelCase to display format
                                    const displayName = key.replace(/([A-Z])/g, ' $1')
                                      .replace(/^./, str => str.toUpperCase());
                                    
                                    return (
                                      <div key={key}>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-xs text-gray-600">{displayName}:</span>
                                          <span className="text-xs font-medium">{value}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                          <div 
                                            className="h-1.5 rounded-full bg-indigo-500"
                                            style={{ width: `${Math.min(value, 100)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                // Show top 4 metrics when collapsed
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {Object.entries(submission.performance_metrics)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 4)
                                    .map(([key, value]) => {
                                      // Convert camelCase to display format
                                      const displayName = key.replace(/([A-Z])/g, ' $1')
                                        .replace(/^./, str => str.toUpperCase());
                                        
                                      return (
                                        <div key={key} className="flex justify-between">
                                          <span className="text-xs text-gray-600">{displayName}:</span>
                                          <span className="text-xs font-medium">{value}%</span>
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Note */}
                          <p className="text-sm text-gray-800 mb-2">{submission.note}</p>
                          
                          {/* Timestamp and employee info */}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              Submitted on {new Date(submission.created_at).toLocaleString()}
                            </p>
                            {submission.employee && (
                              <p className="text-xs text-gray-500">
                                by {submission.employee.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                    <p className="text-gray-500">
                      No progress submissions have been made for this task yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};