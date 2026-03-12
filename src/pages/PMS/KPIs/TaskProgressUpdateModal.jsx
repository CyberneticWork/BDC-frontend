import React, { useState, useRef } from "react";
import { X, Loader2, Upload, File, AlertCircle, Clock, Calendar, BarChart, Star } from "lucide-react";
import Swal from "sweetalert2";

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

  // Performance metrics state
  const [currentMetricValue, setCurrentMetricValue] = useState(0);
  
  // Rating state for performance appraisal tasks
  const [rating, setRating] = useState(0);

  // Check if this is a performance appraisal task
  const isPerformanceAppraisal = task?.kpi_type === 1 || task?.kpi_type === true || task?.kpi_type === 'performance_appraisal';

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
    if (!task || !task.name) return null;
    
    // Direct match first
    if (taskNameToMetricKey[task.name]) {
      return taskNameToMetricKey[task.name];
    }
    
    // Try partial matching if direct match fails
    const taskNameLower = task.name.toLowerCase();
    for (const [key, value] of Object.entries(taskNameToMetricKey)) {
      if (key.toLowerCase().includes(taskNameLower) || taskNameLower.includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Return a generic key if no match found
    return 'generalPerformance';
  };

  // Get display name for the current metric
  const getCurrentMetricDisplayName = () => {
    return task ? task.name : "Task Performance";
  };

  if (!isOpen || !task) return null;

  // Get previous updates by this employee
  const getMyPreviousUpdates = () => {
    if (!task.assigneeUpdates || !Array.isArray(task.assigneeUpdates)) {
      return [];
    }
    
    const myUpdates = task.assigneeUpdates.find(
      au => au.employeeId === parseInt(employeeId) || au.employeeId === employeeId
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

    // Enhanced validation
    if (!progressNote.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Missing note",
        text: "Please add a note about your progress.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (progressNote.trim().length < 5) {
      await Swal.fire({
        icon: "warning",
        title: "Note too short",
        text: "Progress note must be at least 5 characters long.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (progressNote.trim().length > 1000) {
      await Swal.fire({
        icon: "warning",
        title: "Note too long",
        text: "Progress note cannot exceed 1000 characters.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Validation for Performance Appraisal vs Regular tasks
    if (isPerformanceAppraisal) {
      // For Performance Appraisal: require rating, progress is auto-calculated
      if (rating === 0) {
        await Swal.fire({
          icon: "warning",
          title: "Rating required",
          text: "Please provide a rating from 1-5 for this performance appraisal.",
          confirmButtonColor: "#3085d6",
        });
        return;
      }
    } else {
      // For Regular tasks: require progress percentage
      if (currentMetricValue === undefined || currentMetricValue === null || isNaN(currentMetricValue)) {
        await Swal.fire({
          icon: "warning",
          title: "Invalid value",
          text: "Please set a valid progress percentage.",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      if (Number(currentMetricValue) <= 0) {
        await Swal.fire({
          icon: "warning",
          title: "Set your progress",
          text: "Please move the progress bar to indicate your progress before submitting.",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      if (currentMetricValue < 0 || currentMetricValue > 100) {
        await Swal.fire({
          icon: "warning",
          title: "Out of range",
          text: "Progress percentage must be between 0 and 100.",
          confirmButtonColor: "#3085d6",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Create current timestamp
      const now = new Date().toISOString();
      
      // Create full performance metrics object with current value
      const metricKey = getMetricKeyFromTask();
      const performanceMetrics = {};
      
      // For Performance Appraisal: convert rating to percentage (rating * 20)
      // For Regular tasks: use the progress bar value
      const progressValue = isPerformanceAppraisal ? (rating * 20) : parseInt(currentMetricValue);
      
      // Set value only for the current metric, leave others at 0
      Object.keys(taskNameToMetricKey).forEach(taskName => {
        const key = taskNameToMetricKey[taskName];
        performanceMetrics[key] = key === metricKey ? progressValue : 0;
      });
      
      // Add the task name with its percentage to performance metrics
      performanceMetrics[task.name] = progressValue;
      
      // Progress data structure expected by the API
      const progressData = {
        note: progressNote.trim(),
        progressPercentage: progressValue,
        rating: isPerformanceAppraisal ? rating : null, // Only send rating for performance appraisal
        performanceMetrics: performanceMetrics,
        date: now,
        author: employeeName || "Employee",
        // Include file and metadata
        file: selectedFile,
        documentName: selectedFile?.name || null,
        documentSize: selectedFile ? (selectedFile.size / 1024).toFixed(1) + " KB" : null,
        documentType: selectedFile?.type || null,
      };
      
      console.log("Submitting progress data:", progressData); // Debug log
      
      await onSubmit(progressData);
      
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Progress submitted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      // Only clear form and close modal on successful submission
      setProgressNote("");
      setSelectedFile(null);
      setCurrentMetricValue(0);
      setRating(0);
      onClose();
    } catch (error) {
      console.error("Error updating progress:", error);
      
      // Enhanced error handling
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;
        if (errors) {
          console.error("Validation errors:", errors);
          
          const firstError = Object.values(errors)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          
          await Swal.fire({
            icon: "error",
            title: "Validation Error",
            text: errorMessage || "Please check your input and try again.",
            confirmButtonColor: "#EF4444",
          });
        } else {
          await Swal.fire({
            icon: "error",
            title: "Validation Failed",
            text: error.response?.data?.message || "Please check your input and try again.",
            confirmButtonColor: "#EF4444",
          });
        }
      } else {
        await Swal.fire({
          icon: "error",
          title: "Update failed",
          text: error.response?.data?.message || "Failed to update progress. Please try again.",
          confirmButtonColor: "#EF4444",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate task completion percentage based on timeline
  const getTimelinePercentage = () => {
    if (!task.startDate || !task.endDate) return 0;
    
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

  // Rating display helpers
  const getRatingLabel = (ratingValue) => {
    const labels = {
      1: "Poor",
      2: "Below Average", 
      3: "Average",
      4: "Good",
      5: "Excellent"
    };
    return labels[ratingValue] || "";
  };

  const getRatingColor = (ratingValue) => {
    const colors = {
      1: "text-red-500",
      2: "text-orange-500",
      3: "text-yellow-500", 
      4: "text-blue-500",
      5: "text-green-500"
    };
    return colors[ratingValue] || "text-gray-400";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isPerformanceAppraisal ? "Submit Performance Rating" : "Submit Task Progress"}
            </h2>
            <p className="text-gray-600 text-sm mt-1">{task.name}</p>
            {isPerformanceAppraisal && (
              <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                Performance Appraisal
              </span>
            )}
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
                      {task.startDate && task.endDate ? (
                        `${new Date(task.startDate).toLocaleDateString()} — ${new Date(task.endDate).toLocaleDateString()}`
                      ) : 'Date not specified'}
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
                Upload Document <span className="text-gray-500 text-xs">(Optional)</span>
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
                      Support for PDF, Word, Excel, and image files up to 10MB (Optional)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isPerformanceAppraisal ? "Performance Notes" : "Progress Notes"} <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 font-normal ml-2">
                  (Minimum 5 characters, Maximum 1000 characters)
                </span>
              </label>
              <textarea
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder={isPerformanceAppraisal ? 
                  "Describe your performance, achievements, or areas for improvement... (minimum 5 characters)" :
                  "Describe your progress, challenges, or achievements... (minimum 5 characters)"
                }
                rows="4"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  progressNote.trim().length > 0 && progressNote.trim().length < 5 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : progressNote.trim().length > 1000 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300'
                }`}
                required
              ></textarea>
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-gray-500">
                  {progressNote.trim().length < 5 && progressNote.trim().length > 0 && (
                    <span className="text-red-500">Need {5 - progressNote.trim().length} more characters</span>
                  )}
                  {progressNote.trim().length >= 5 && progressNote.trim().length <= 1000 && (
                    <span className="text-green-600">✓ Valid length</span>
                  )}
                  {progressNote.trim().length > 1000 && (
                    <span className="text-red-500">Too long by {progressNote.trim().length - 1000} characters</span>
                  )}
                </div>
                <span className={`text-xs ${
                  progressNote.trim().length > 1000 ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {progressNote.trim().length}/1000
                </span>
              </div>
            </div>

            {/* Performance Rating or Progress Section */}
            {isPerformanceAppraisal ? (
              // Performance Appraisal Rating Section
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-500" />
                    Performance Rating <span className="text-red-500">*</span>
                  </label>
                  {rating > 0 && (
                    <div className="text-sm font-bold">
                      <span className={getRatingColor(rating)}>{rating}/5</span>
                      <span className="text-gray-500 ml-2">({getRatingLabel(rating)})</span>
                    </div>
                  )}
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700">
                      Rate your performance in <strong>{getCurrentMetricDisplayName()}</strong> from 1 to 5:
                    </p>
                    
                    <div className="flex justify-center space-x-2">
                      {[1, 2, 3, 4, 5].map((ratingValue) => (
                        <button
                          key={ratingValue}
                          type="button"
                          onClick={() => setRating(ratingValue)}
                          className={`w-16 h-16 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                            rating === ratingValue
                              ? 'border-purple-500 bg-purple-500 text-white shadow-lg'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          <Star 
                            className={`h-6 w-6 ${
                              rating === ratingValue ? 'fill-white' : 'fill-gray-300'
                            }`}
                          />
                          <span className="text-xs font-semibold mt-1">{ratingValue}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Poor</span>
                      <span>Below Average</span>
                      <span>Average</span>
                      <span>Good</span>
                      <span>Excellent</span>
                    </div>

                    {rating > 0 && (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Rating: {rating}/5 ({getRatingLabel(rating)})
                          </span>
                          <span className="text-sm text-gray-500">
                            Progress: {rating * 20}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="h-2 rounded-full bg-purple-500"
                            style={{ width: `${rating * 20}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Regular Task Progress Section
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-gray-500" />
                    {getCurrentMetricDisplayName()} Progress
                  </label>
                  <div className="text-sm font-bold text-indigo-600">{currentMetricValue}%</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Progress in this Task:</span>
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
                        step="1"
                        value={currentMetricValue}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          console.log("Range value changed:", value);
                          setCurrentMetricValue(value);
                        }}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Not started (0%)</span>
                        <span>In progress (50%)</span>
                        <span>Completed (100%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Previous Updates */}
            {myPreviousUpdates.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Previous Submissions</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {myPreviousUpdates.slice(-3).map((update, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {new Date(update.date).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          {update.rating && (
                            <span className="text-xs font-bold text-purple-600">
                              Rating: {update.rating}/5
                            </span>
                          )}
                          {update.progressPercentage !== undefined && (
                            <span className="text-xs font-bold text-indigo-600">
                              {update.progressPercentage}%
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-700">{update.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                isSubmitting 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : isPerformanceAppraisal
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>{isPerformanceAppraisal ? "Submit Rating" : "Submit Progress"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};