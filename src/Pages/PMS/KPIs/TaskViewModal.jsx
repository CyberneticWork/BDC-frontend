import React from "react";
import { X, CheckCircle, AlertCircle, CalendarDays, Clock, User, File, BarChart } from "lucide-react";

export const TaskViewModal = ({ isOpen, onClose, kpi, employees = [] }) => {
  if (!isOpen || !kpi) return null;

  const getEmployee = (id) => {
    if (employees.length > 0) {
      return employees.find(e => e.id === id) || { id, name: "Unknown", department: "" };
    }
    
    // Default employee data if not provided through props
    const defaultEmployees = {
      "1": { id: "1", name: "Sarah Johnson", department: "Customer Service" },
      "2": { id: "2", name: "Mike Chen", department: "Sales" },
      "3": { id: "3", name: "Emma Davis", department: "HR" },
      "4": { id: "4", name: "John Smith", department: "Operations" },
    };
    
    return defaultEmployees[id] || { id, name: "Unknown", department: "" };
  };
  
  const updatesFor = (empId) => (kpi.assigneeUpdates || []).find(u => u.employeeId === parseInt(empId));

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "bg-green-100 text-green-800",
      attention: "bg-yellow-100 text-yellow-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return statusConfig[status] || statusConfig.inactive;
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const due = new Date(endDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get the latest self-reported progress across all assignees
  const getLatestSelfReportedProgress = () => {
    let latestProgress = null;
    let latestDate = null;
    
    (kpi.assignees || []).forEach(idStr => {
      const empId = parseInt(idStr);
      const entry = updatesFor(empId);
      
      if (entry && entry.updates && entry.updates.length > 0) {
        entry.updates.forEach(update => {
          if (update.progressPercentage !== undefined) {
            const updateDate = new Date(update.date);
            if (!latestDate || updateDate > latestDate) {
              latestDate = updateDate;
              latestProgress = {
                percentage: update.progressPercentage,
                date: update.date,
                author: update.author || getEmployee(idStr).name
              };
            }
          }
        });
      }
    });
    
    return latestProgress;
  };

  const latestProgress = getLatestSelfReportedProgress();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{kpi.name}</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                  kpi.status
                )}`}
              >
                {kpi.status === "active" && (
                  <CheckCircle className="w-3 h-3 mr-1" />
                )}
                {kpi.status === "attention" && (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {kpi.status.charAt(0).toUpperCase() + kpi.status.slice(1)}
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1">{kpi.description}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Timeline */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Timeline</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {new Date(kpi.startDate).toLocaleDateString()} — {new Date(kpi.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {getDaysRemaining(kpi.endDate)} days remaining
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {new Date(kpi.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress Details - UPDATED WITH SELF-REPORTED PROGRESS */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Progress</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Current: {kpi.current} {kpi.unit}
                </span>
                <span className="text-sm text-gray-600">
                  Target: {kpi.target} {kpi.unit}
                </span>
              </div>
              <p className="text-xs text-right text-gray-500 mb-3">
                {Math.round((kpi.current / kpi.target) * 100)}% complete
              </p>
              
              {/* Self-reported progress section */}
              {latestProgress && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <BarChart className="h-4 w-4 text-gray-500" />
                      Self-Reported Progress
                    </span>
                    <span className="text-sm font-medium text-indigo-600">
                      {latestProgress.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div 
                      className={`h-2 rounded-full ${
                        latestProgress.percentage < 30 ? 'bg-red-500' : 
                        latestProgress.percentage < 70 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${latestProgress.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    Last reported by {latestProgress.author} on {new Date(latestProgress.date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Assigned Team */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Assigned Team</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                {(kpi.assignees || []).length === 0 && <div className="text-sm text-gray-500">No assignees</div>}
                {(kpi.assignees || []).map((idStr) => {
                  const emp = getEmployee(idStr);
                  return (
                    <div key={idStr} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.department}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Updates Timeline */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Updates Timeline</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-4">
                {(kpi.assignees || []).map((idStr) => {
                  const empId = parseInt(idStr);
                  const emp = getEmployee(idStr);
                  const entry = updatesFor(empId);
                  
                  if (!entry || !entry.updates || entry.updates.length === 0) return null;
                  
                  return (
                    <div key={idStr} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-indigo-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                      </div>
                      <div className="space-y-4 ml-8">
                        {entry.updates.map((u, idx) => (
                          <div key={idx} className="relative">
                            <div className="absolute left-[-16px] top-2 w-2 h-2 bg-indigo-400 rounded-full"></div>
                            <div className="pl-4 border-l border-gray-200">
                              {/* Show document info if available */}
                              {u.documentName && (
                                <div className="flex items-center gap-2 mb-1 text-indigo-600">
                                  <File className="w-4 h-4" />
                                  <span className="text-xs font-medium">{u.documentName}</span>
                                  {u.documentSize && (
                                    <span className="text-xs text-gray-500">({u.documentSize})</span>
                                  )}
                                </div>
                              )}
                              
                              {/* Display progress percentage if available (keeping this for update history) */}
                              {u.progressPercentage !== undefined && (
                                <div className="mb-2">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-600 font-medium flex items-center gap-1">
                                      <BarChart className="h-3 w-3 text-gray-500" />
                                      Self-reported progress: {u.progressPercentage}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className={`h-1.5 rounded-full ${
                                        u.progressPercentage < 30 ? 'bg-red-500' : 
                                        u.progressPercentage < 70 ? 'bg-yellow-500' : 
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${u.progressPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              
                              <p className="text-sm text-gray-800">{u.note}</p>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-gray-500">{new Date(u.date).toLocaleString()}</p>
                                <p className="text-xs text-gray-400">By: {u.author || "System"}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {!kpi.assignees || !kpi.assignees.some(idStr => {
                  const empId = parseInt(idStr);
                  const entry = updatesFor(empId);
                  return entry && entry.updates && entry.updates.length > 0;
                }) && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No updates recorded yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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