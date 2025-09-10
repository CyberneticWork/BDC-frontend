import React, { useState, useRef } from "react";
import { X, Loader2, Upload, File, AlertCircle, Clock, Calendar, BarChart, ChevronDown, ChevronUp } from "lucide-react";

export const TaskProgressUpdateModal = ({ 
  isOpen, 
  onClose, 
  task, 
  onSubmit, 
  employeeId,
  employeeName
}) => {
  const [progressNote, setProgressNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Performance metrics state - now simplified to focus on just one metric matching the task name
  const [currentMetricValue, setCurrentMetricValue] = useState(0);

  // Map from task name to performance metric key
  const taskNameToMetricKey = {
    "Job Knowledge and Skills": "jobKnowledge",
    "Quality of Work": "qualityOfWork",
    "Productivity": "productivity",
    "Communication Skills": "communicationSkills",
    "Teamwork and Collaboration": "teamwork",
    "Behavior at work": "behaviorAtWork",
    "Problem-Solving and Decision-Making": "problemSolving",
    "Attendance and Punctuality": "attendance",
    "Adaptability and Flexibility": "adaptability",
    "Self-Development": "selfDevelopment",
    "Discipline and conduct at work": "discipline",
    "Adherence to the given Guidelines": "adherenceToGuidelines"
  };

  // Format metric key for display
  const formatMetricName = (metricKey) => {
    if (!metricKey) return "";
    return metricKey.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  // Get metric key from task name
  const getMetricKeyFromTask = () => {
    return task ? taskNameToMetricKey[task.name] || null : null;
  };

  // Get display name for the current metric
  const getCurrentMetricDisplayName = () => {
    return task ? task.name : "";
  };

  if (!isOpen || !task) return null;

  // Get previous updates by this employee
  const getMyPreviousUpdates = () => {
    const myUpdates = task.assigneeUpdates.find(
      au => au.employeeId === parseInt(employeeId)
    )?.updates || [];
    
    return myUpdates;
  };

  const myPreviousUpdates = getMyPreviousUpdates();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!progressNote.trim()) {
      alert("Please add a note about your progress");
      return;
    }

    if (!selectedFile) {
      alert("Please upload a document to support your progress");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create current timestamp
      const now = new Date().toISOString();
      
      // Create full performance metrics object with current value
      const metricKey = getMetricKeyFromTask();
      const performanceMetrics = {};
      // Set value only for the current metric, leave others at 0
      Object.keys(taskNameToMetricKey).forEach(taskName => {
        const key = taskNameToMetricKey[taskName];
        performanceMetrics[key] = key === metricKey ? currentMetricValue : 0;
      });
      
      // In a real implementation, you'd upload the file to a server here
      const progressData = {
        note: progressNote,
        employeeId,
        date: now,
        documentName: selectedFile.name,
        documentSize: (selectedFile.size / 1024).toFixed(1) + " KB",
        documentType: selectedFile.type,
        progressPercentage: currentMetricValue, // Use the single metric value as overall progress
        performanceMetrics: performanceMetrics, // Include all metrics but only current one has value
      };
      
      await onSubmit(progressData);
      
      setProgressNote("");
      setSelectedFile(null);
      setCurrentMetricValue(0);
      onClose();
    } catch (error) {
      console.error("Error updating progress:", error);
      alert("Failed to update progress. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate task completion percentage based on timeline
  const getTimelinePercentage = () => {
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    const today = new Date();
    
    const totalDuration = endDate - startDate;
    const elapsedDuration = today - startDate;
    
    if (elapsedDuration <= 0) return 0;
    if (elapsedDuration >= totalDuration) return 100;
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  };

  const timelinePercentage = getTimelinePercentage();
  const metricKey = getMetricKeyFromTask();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Submit Task Progress</h2>
            <p className="text-gray-600 text-sm mt-1">{task.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-6">
            {/* Task details summary */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {new Date(task.startDate).toLocaleDateString()} — {new Date(task.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      Timeline: {timelinePercentage}% elapsed
                    </span>
                  </div>
                </div>
                
                <div className="col-span-full">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full bg-indigo-500"
                      style={{ width: `${timelinePercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <File className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">{selectedFile.name}</div>
                    <div className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown type'}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSelectedFile(null)}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium mb-1">Drop your file here, or</p>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="text-indigo-600 font-medium hover:text-indigo-700"
                      >
                        browse
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Support for PDF, Word, Excel, and image files up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress Notes
              </label>
              <textarea
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder="Describe your progress, challenges, or achievements..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              ></textarea>
            </div>

            {/* Performance Category Section - Now focused on just the relevant metric */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <BarChart className="h-4 w-4 text-gray-500" />
                  {getCurrentMetricDisplayName()} Progress
                </label>
                <div className="text-sm font-bold text-indigo-600">{currentMetricValue}%</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                {metricKey ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Progress in this Category:</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className={`h-2.5 rounded-full ${
                          currentMetricValue < 30 ? 'bg-red-500' : 
                          currentMetricValue < 70 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${currentMetricValue}%` }}
                      ></div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate your {getCurrentMetricDisplayName()} progress (0-100%):
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={currentMetricValue}
                        onChange={(e) => setCurrentMetricValue(parseInt(e.target.value))}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Not started (0%)</span>
                        <span>In progress (50%)</span>
                        <span>Completed (100%)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Unable to determine the metric for this task. Please contact your supervisor.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                isSubmitting || !selectedFile 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Progress</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};