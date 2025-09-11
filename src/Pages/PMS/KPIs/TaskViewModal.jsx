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

export const TaskViewModal = ({ isOpen, onClose, kpi = null }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [showAllMetrics, setShowAllMetrics] = useState({});

  if (!isOpen || !kpi) return null;

  // Get all employee updates for this KPI
  const getAllUpdates = () => {
    const allUpdates = [];
    kpi.assigneeUpdates.forEach((assignee) => {
      assignee.updates.forEach((update) => {
        allUpdates.push({
          ...update,
          employeeId: assignee.employeeId,
        });
      });
    });

    // Sort by date, newest first
    return allUpdates.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  };

  const toggleShowAllMetrics = (updateId) => {
    setShowAllMetrics((prev) => ({
      ...prev,
      [updateId]: !prev[updateId]
    }));
  };

  // Calculate progress from startDate to endDate
  const getTimelinePercentage = () => {
    const startDate = new Date(kpi.startDate);
    const endDate = new Date(kpi.endDate);
    const today = new Date();
    
    const totalDuration = endDate - startDate;
    const elapsedDuration = today - startDate;
    
    if (elapsedDuration <= 0) return 0;
    if (elapsedDuration >= totalDuration) return 100;
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const due = new Date(kpi.endDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "bg-green-100 text-green-800",
      attention: "bg-yellow-100 text-yellow-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return statusConfig[status] || statusConfig.inactive;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
    };
    return priorityConfig[priority] || "bg-gray-100 text-gray-800";
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
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(
                  kpi.priority
                )}`}
              >
                {kpi.priority.charAt(0).toUpperCase() + kpi.priority.slice(1)} Priority
              </span>
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
                activeTab === "updates"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("updates")}
            >
              Updates
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
                        {new Date(kpi.startDate).toLocaleDateString()} — {new Date(kpi.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        Timeline: {getTimelinePercentage()}% elapsed
                      </span>
                    </div>
                  </div>
                  
                  <div className="col-span-full">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full bg-indigo-500"
                        style={{ width: `${getTimelinePercentage()}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <span className="text-sm text-gray-600">
                        {getDaysRemaining()} days remaining
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
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3>
                  <p className="text-gray-800">{kpi.department}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Owner</h3>
                  <p className="text-gray-800">{kpi.owner}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                  <p className="text-gray-800">{new Date(kpi.lastUpdated).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Documents Submitted</h3>
                  <p className="text-gray-800">{kpi.documentCount || 0}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "updates" && (
            <div className="space-y-6">
              <h3 className="text-sm font-medium text-gray-500">Task Updates</h3>
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                {getAllUpdates().length > 0 ? (
                  getAllUpdates().map((update, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        {update.documentName ? (
                          <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-2">
                            <File className="w-5 h-5 text-indigo-600" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 bg-gray-200 rounded-full p-2">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          {update.documentName && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-indigo-600">
                                {update.documentName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {update.documentSize}
                              </span>
                              <button className="p-1 text-gray-400 hover:text-indigo-600">
                                <Download className="h-3 w-3" />
                              </button>
                            </div>
                          )}

                          {/* Performance Metrics Display */}
                          {update.progressPercentage !== undefined && (
                            <div className="mt-3 mb-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-700 font-medium flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3 text-gray-500" />
                                  Overall Progress: {update.progressPercentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    update.progressPercentage < 30 ? 'bg-red-500' : 
                                    update.progressPercentage < 70 ? 'bg-yellow-500' : 
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${update.progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Performance Metrics Details */}
                          {update.performanceMetrics && (
                            <div className="mt-3 mb-3 bg-gray-100 rounded-lg p-3">
                              <div 
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() => toggleShowAllMetrics(`${idx}-${update.date}`)}
                              >
                                <h4 className="text-xs font-semibold text-gray-700">Performance Metrics:</h4>
                                {showAllMetrics[`${idx}-${update.date}`] ? (
                                  <ChevronUp className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                              
                              {showAllMetrics[`${idx}-${update.date}`] ? (
                                // Show all metrics when expanded
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                  {Object.entries(update.performanceMetrics).map(([key, value]) => {
                                    // Convert camelCase to display format
                                    const displayName = key.replace(/([A-Z])/g, ' $1')
                                      .replace(/^./, str => str.toUpperCase());
                                    
                                    return (
                                      <div key={key}>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-xs text-gray-600">{displayName}:</span>
                                          <span className="text-xs font-medium">{value}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1">
                                          <div 
                                            className="h-1 rounded-full bg-indigo-500"
                                            style={{ width: `${value}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                // Show top 4 metrics when collapsed
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {Object.entries(update.performanceMetrics)
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
                          
                          <p className="text-sm text-gray-800">{update.note}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              By {update.author || "Unknown"} • {new Date(update.date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No updates found for this task</p>
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