import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
  Calendar, 
  Filter, 
  Plus, 
  Search, 
  Star, 
  ChevronDown,
  ChevronUp,
  CheckSquare, 
  Clock,
  FileText,
  Edit,
  MoreHorizontal,
  ArrowDownUp,
  X,
  Check,
  Users,
  PieChart,
  ListChecks,
  Award,
  Loader2,
  BarChart,
  User,
  RefreshCw,
  File, 
  Download, 
  Upload 
} from 'lucide-react';
import NewReviewModal from "./NewReviewModal";
import PMSService from "@services/PMS/PMSService"; // Remove PMSDummyDataStore import
import EmployeeDocumentsModal from './EmployeeDocumentsModal';
import { permissions } from '../../../config/permissions';
import { useAuth } from '../../../contexts/AuthContext';
import Swal from "sweetalert2";

// Status options used by ProgressReviewModal select
const statusOptions = [
  'Draft',
  'In Progress',
  'Pending',          // maps to Pending Manager when sending
  'Pending Manager',
  'Pending Employee',
  'Completed'
];

// Grade options used by ProgressReviewModal
const gradeOptions = ['A+','A','B','C','C-'];

/**
 * Map a linked task name to the metric key in performanceMetrics.
 * Keep this mapping small and similar to TaskProgressUpdateModal.taskNameToMetricKey.
 */
const getMetricKeyFromTask = (task) => {
  if (!task || !task.name) return null;
  const name = String(task.name).toLowerCase();

  const mapping = [
    { match: 'job knowledge', key: 'jobKnowledge' },
    { match: 'quality', key: 'qualityOfWork' },
    { match: 'productivity', key: 'productivity' },
    { match: 'communication', key: 'communicationSkills' },
    { match: 'teamwork', key: 'teamwork' },
    { match: 'behavior', key: 'behaviorAtWork' },
    { match: 'problem', key: 'problemSolving' },
    { match: 'attendance', key: 'attendance' },
    { match: 'adapt', key: 'adaptability' },
    { match: 'self', key: 'selfDevelopment' },
    { match: 'discipline', key: 'discipline' },
    { match: 'guideline', key: 'adherenceToGuidelines' },
  ];

  for (const m of mapping) {
    if (name.includes(m.match)) return m.key;
  }
  return null;
};

// Progress Review Modal Component
const ProgressReviewModal = ({ isOpen, onClose, review, onSave }) => {
  const [progress, setProgress] = useState(0);
  const [grade, setGrade] = useState(review?.grade || '');
  const [comments, setComments] = useState(review?.supervisorComments || '');
  const [statusState, setStatusState] = useState(review?.status || 'In Progress');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  
  // Add performance metrics state
  const [performanceMetrics, setPerformanceMetrics] = useState({
    jobKnowledge: 0,
    qualityOfWork: 0,
    productivity: 0,
    communicationSkills: 0,
    teamwork: 0,
    behaviorAtWork: 0,
    problemSolving: 0,
    attendance: 0,
    adaptability: 0,
    selfDevelopment: 0,
    discipline: 0,
    adherenceToGuidelines: 0
  });

  // Fetch task details when modal opens
  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!isOpen || !review?.id) return;
      
      setIsLoadingTask(true);
      try {
        const details = await PMSService.getPerformanceReviewDetails(review.id);
        console.log('Fetched task details:', details);
        setTaskDetails(details);
      } catch (error) {
        console.error('Error fetching task details:', error);
        toast.error('Failed to load task details');
      } finally {
        setIsLoadingTask(false);
      }
    };
    
    fetchTaskDetails();
  }, [isOpen, review?.id]);

  // Update values when review changes
  useEffect(() => {
    if (review) {
      // Initialize from review data first
      setProgress(review.progress || 0);
      setGrade(review.grade || '');
      setComments(review.supervisorComments || '');
      setStatusState(review.status || 'In Progress');
      
      // Initialize performance metrics from supervisor review if exists
      if (review.performanceMetrics && Object.values(review.performanceMetrics).some(v => v > 0)) {
        setPerformanceMetrics(review.performanceMetrics);
      } else {
        // Reset metrics if no supervisor review exists yet
        resetMetrics();
      }
    }
    
    // When task details are loaded, override with saved supervisor data if available
    if (taskDetails?.supervisor_review) {
      const supervisorData = taskDetails.supervisor_review;
      setProgress(supervisorData.progress || 0); // Use supervisor's saved progress
      setGrade(supervisorData.grade || '');
      setComments(supervisorData.comments || '');
      setStatusState(supervisorData.status || 'In Progress');
      
      if (supervisorData.performance_metrics && Object.values(supervisorData.performance_metrics).some(v => v > 0)) {
        setPerformanceMetrics(supervisorData.performance_metrics);
      }
    }
  }, [review, taskDetails]);

  // Get the linked task if available
  const getLinkedTask = () => {
    if (taskDetails) {
      return {
        id: taskDetails.assignment.id,
        name: taskDetails.assignment.task_name,
        description: taskDetails.assignment.description,
        startDate: taskDetails.assignment.start_date,
        endDate: taskDetails.assignment.end_date,
        weights: taskDetails.assignment.weights
      };
    }
    return null;
  };

  const linkedTask = getLinkedTask();
  const taskSpecificMetricKey = linkedTask ? getMetricKeyFromTask(linkedTask) : null;

  // Ensure dynamic metric key exists in performanceMetrics state when linkedTask or review changes
  useEffect(() => {
    if (!taskSpecificMetricKey) return;
    setPerformanceMetrics(prev => {
      if (prev.hasOwnProperty(taskSpecificMetricKey)) return prev;
      return { ...prev, [taskSpecificMetricKey]: review?.progress ?? 0 };
    });
  }, [taskSpecificMetricKey, review?.progress]);
  
  // Calculate overall progress from the performance metrics
  const calculateOverallProgress = (metrics) => {
    // If a task-specific key exists, prefer its value (covers DB tasks and legacy mapping)
    if (taskSpecificMetricKey && metrics.hasOwnProperty(taskSpecificMetricKey)) {
      return metrics[taskSpecificMetricKey] || 0;
    }
    // Otherwise fallback to the average of all metrics
    const values = Object.values(metrics);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + (Number(val) || 0), 0);
    return Math.round(sum / values.length);
  };
  
  // Update progress whenever performanceMetrics changes
  useEffect(() => {
    const overall = calculateOverallProgress(performanceMetrics);
    setProgress(overall);
  }, [performanceMetrics, taskSpecificMetricKey]);

  // Handle individual metric changes
  const handleMetricChange = (metric, value) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      [metric]: parseInt(value, 10)
    }));
  };

  // Reset metrics helper
  const resetMetrics = () => {
    const zeroed = {
      jobKnowledge: 0,
      qualityOfWork: 0,
      productivity: 0,
      communicationSkills: 0,
      teamwork: 0,
      behaviorAtWork: 0,
      problemSolving: 0,
      attendance: 0,
      adaptability: 0,
      selfDevelopment: 0,
      discipline: 0,
      adherenceToGuidelines: 0
    };
    setPerformanceMetrics(zeroed);
  };

  // Apply self-reported metrics from the review (if present)
  const applySelfReportedMetrics = () => {
    // Check if there are self-reported metrics from employee submissions
    if (taskDetails?.submissions && taskDetails.submissions.length > 0) {
      const latestSubmission = taskDetails.submissions[0]; // First one is latest due to ordering
      if (latestSubmission.performance_metrics) {
        setPerformanceMetrics(latestSubmission.performance_metrics);
        setShowCategoryDetails(true);
        return;
      }
    }
    
    // Fallback to review's self-reported metrics if available
    if (review?.selfReportedMetrics) {
      setPerformanceMetrics(review.selfReportedMetrics);
      setShowCategoryDetails(true);
    } else {
      alert("No self-reported performance metrics available for this review.");
    }
  };

  const handleHeaderKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setShowCategoryDetails(prev => !prev);
    }
  };

  // ensure dropdown is closed when modal opens freshly
  useEffect(() => {
    if (isOpen) {
      setShowCategoryDetails(false);
    }
  }, [isOpen]);

  if (!isOpen || !review) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // New: require progress to be set (> 0)
    if (isNaN(progress) || progress <= 0 || progress > 100) {
      await Swal.fire({
        icon: "warning",
        title: "Set Progress",
        text: "Please set the progress bar to a value between 1 and 100 before saving.",
        confirmButtonColor: "#F59E0B",
      });
      return;
    }

    // New: require status to be selected
    if (!statusState || statusState.trim() === "") {
      await Swal.fire({
        icon: "warning",
        title: "Status Required",
        text: "Please select a review status before saving.",
        confirmButtonColor: "#F59E0B",
      });
      return;
    }

    // Map UI status -> backend status and validate
    const BACKEND_ALLOWED_STATUSES = ['Draft','In Progress','Pending Manager','Pending Employee','Completed'];
    const STATUS_SEND_MAP = {
      // keep UI short, but send backend-expected value
      'Pending': 'Pending Manager'
    };

    const mappedStatus = STATUS_SEND_MAP[statusState] ?? statusState;
    if (!BACKEND_ALLOWED_STATUSES.includes(mappedStatus)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Status",
        text: `Selected status "${statusState}" is not allowed. Choose one of: ${BACKEND_ALLOWED_STATUSES.join(', ')}`,
        confirmButtonColor: "#EF4444"
      });
      return;
    }

    // Existing validations
    if (!grade || !grade.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Grade Required",
        text: "Please select a performance grade before saving.",
        confirmButtonColor: "#F59E0B",
      });
      return;
    }

    if (!comments || !comments.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Comments Required",
        text: "Please provide supervisor comments.",
        confirmButtonColor: "#F59E0B",
      });
      return;
    }

    // Validate metrics values (0-100)
    for (const [key, val] of Object.entries(performanceMetrics)) {
      const v = Number(val);
      if (isNaN(v) || v < 0 || v > 100) {
        await Swal.fire({
          icon: "warning",
          title: "Invalid Metric Value",
          text: `Metric "${key}" must be between 0 and 100.`,
          confirmButtonColor: "#F59E0B",
        });
        return;
      }
    }

    // Confirmation dialog
    const confirm = await Swal.fire({
      title: "Confirm Update",
      text: "Are you sure you want to save this review update?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4F46E5",
      cancelButtonColor: "#D1D5DB",
      confirmButtonText: "Yes, save",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    setIsSubmitting(true);
    try {
      // Build update payload
      const updatedReview = {
        ...review,
        progress: parseInt(progress, 10),
        grade,
        supervisorComments: comments,
        // send mapped backend-friendly status
        status: mappedStatus,
        performanceMetrics,
        lastUpdated: new Date().toISOString()
      };

      // Call parent handler (which calls backend via PMSService.updatePerformanceReview)
      await onSave(updatedReview);

      await Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Performance review updated successfully.",
        timer: 1600,
        showConfirmButton: false,
      });

      onClose();
    } catch (error) {
      console.error("Error updating review:", error);
      await Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error?.response?.data?.message || "Failed to update the review. Please try again.",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Review Progress</h2>
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{review?.employeeName}</span> • {review?.position || 'Employee'}
            </div>
            {isLoadingTask ? (
              <div className="mt-1 flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                <span className="text-sm text-gray-500">Loading task...</span>
              </div>
            ) : linkedTask ? (
              <div className="text-sm text-indigo-600 mt-1 font-medium">
                Task: {linkedTask.name}
              </div>
            ) : (
              <div className="text-sm text-amber-600 mt-1">
                Task details not available
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close review modal"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Display database-specific information */}
        {taskDetails && ( // Remove useDatabase check
          <div className="p-6 border-b border-gray-100 bg-blue-50">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Task Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Submissions:</span> {taskDetails.submissions.length}
              </div>
              <div>
                <span className="text-blue-700">Latest Progress:</span> {review.selfReportedProgress}% 
              </div>
              <div>
                <span className="text-blue-700">Priority:</span> {review.priority || 'Medium'}
              </div>
              <div>
                <span className="text-blue-700">Documents:</span> {review.documentCount || 0}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Progress Section */}
          <div>
            {/* Enhanced Performance Metrics Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <BarChart className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Performance Review</h3>
                    <p className="text-sm text-gray-600">
                      {linkedTask ? `Task: ${linkedTask.name}` : "General Performance Review"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Current Progress Display */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{progress}%</div>
                    <div className="text-xs text-gray-500">Supervisor Rating</div>
                  </div>
                  
                  {/* Show employee's self-reported progress if available */}
                  {review?.selfReportedProgress > 0 && (
                    <div className="text-center border-l border-gray-200 pl-4">
                      <div className="text-lg font-medium text-blue-600">{review.selfReportedProgress}%</div>
                      <div className="text-xs text-gray-500">Employee Self-Report</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Single Progress Bar - Always visible */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {linkedTask ? `${linkedTask.name} Performance` : "Overall Performance"}
                  </span>
                  <span className="text-sm font-bold text-indigo-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      progress < 30 ? 'bg-red-500' : 
                      progress < 70 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor (0%)</span>
                  <span>Good (50%)</span>
                  <span>Excellent (100%)</span>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-indigo-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applySelfReportedMetrics}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    title="Load employee's self-reported metrics (if available)"
                  >
                    <User className="h-4 w-4" />
                    Use Self-Reported
                  </button>
                  <button
                    type="button"
                    onClick={resetMetrics}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    title="Reset progress to 0"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </button>
                </div>
                
                {/* Toggle for detailed metrics */}
                <button
                  type="button"
                  onClick={() => setShowCategoryDetails(prev => !prev)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  title={showCategoryDetails ? "Hide detailed metrics" : "Show detailed metrics"}
                >
                  <span className="text-sm font-medium text-gray-700">
                    {showCategoryDetails ? "Hide Details" : "Show Details"}
                  </span>
                  <div className={`transform transition-transform duration-200 ${showCategoryDetails ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-4 w-4 text-indigo-600" />
                  </div>
                </button>
              </div>
            </div>

            {/* Main Progress Control - Single Slider */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rate Performance for: <span className="font-semibold text-indigo-600">
                      {linkedTask ? linkedTask.name : "Overall Performance"}
                    </span>
                  </label>
                  <div className="px-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={progress}
                      onChange={(e) => setProgress(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
                
                {/* Progress indicator text */}
                <div className="text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    progress < 30 ? 'bg-red-100 text-red-800' : 
                    progress < 70 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {progress < 30 ? 'Needs Improvement' : 
                     progress < 70 ? 'Good Performance' : 
                     'Excellent Performance'}
                  </span>
                </div>
              </div>
            </div>

            {/* Collapsible Detailed Metrics Panel - Only shows when toggled */}
            <div 
              className={`bg-gray-50 rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 ${
                showCategoryDetails ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Detailed Performance Categories</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Rate the employee's performance in specific areas (0-100%). These will automatically update the main progress above.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Show all detailed metrics */}
                  {Object.entries({
                    jobKnowledge: 'Job Knowledge and Skills',
                    qualityOfWork: 'Quality of Work',
                    productivity: 'Productivity',
                    communicationSkills: 'Communication Skills',
                    teamwork: 'Teamwork and Collaboration',
                    behaviorAtWork: 'Behavior at Work',
                    problemSolving: 'Problem-Solving',
                    attendance: 'Attendance and Punctuality',
                    adaptability: 'Adaptability and Flexibility',
                    selfDevelopment: 'Self-Development',
                    discipline: 'Discipline and Conduct',
                    adherenceToGuidelines: 'Adherence to Guidelines'
                  }).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {label}: <span className="font-bold text-indigo-600">{performanceMetrics[key]}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={performanceMetrics[key]}
                        onChange={(e) => handleMetricChange(key, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={label}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Poor</span>
                        <span>Excellent</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The main progress bar above automatically calculates the average of all these detailed metrics. 
                    You can adjust individual categories here for more precise evaluation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Supervisor selected status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Status (Supervisor)</label>
            <select
              value={statusState}
              onChange={(e) => setStatusState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select status</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {!statusState && (
              <div className="text-sm text-red-600 mt-1">Please select a review status.</div>
            )}
          </div>

          {/* Grade Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Performance Grade
            </label>
            <div className="flex flex-wrap gap-2">
              {gradeOptions.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    grade === g 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supervisor Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Provide feedback on performance, areas of strength, and opportunities for improvement..."
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 mr-3"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Number(progress) <= 0 || !statusState}
              className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 ${ (isSubmitting || Number(progress) <= 0 || !statusState) ? 'opacity-60 cursor-not-allowed' : '' }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Save Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Performance Review Details Modal - Updated to use backend data
const ReviewDetailsModal = ({ isOpen, onClose, review }) => { // Remove useDatabase prop
  const [reviewDetails, setReviewDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch review details when modal opens
  useEffect(() => {
    if (isOpen && review && review.id) { // Remove useDatabase check
      fetchReviewDetails();
    } else if (isOpen && review) {
      // Use review data directly if no ID
      setReviewDetails(review);
    }
  }, [isOpen, review]);

  const fetchReviewDetails = async () => {
    setIsLoadingDetails(true);
    try {
      const details = await PMSService.getPerformanceReviewDetails(review.id);
      
      // Transform backend data to match the expected format
      const transformedDetails = {
        id: review.id,
        taskName: details.assignment.task_name,
        employeeName: details.assignment.employee_name,
        employeeId: details.assignment.employee_id,
        position: review.position || 'Employee',
        department: details.assignment.department,
        company: details.assignment.company,
        type: 'Performance Review',
        status: review.status,
        startDate: details.assignment.start_date,
        dueDate: details.assignment.end_date,
        completedDate: review.completedDate,
        cycle: review.cycle,
        description: details.assignment.description,
        priority: review.priority,
        weights: details.assignment.weights,
        manager: 'Supervisor',
        overallRating: review.overallRating,
        grade: review.grade,
        progress: review.progress,
        supervisorComments: review.supervisorComments,
        lastUpdated: review.lastUpdated,
        selfReportedProgress: review.selfReportedProgress,
        selfReportedLastUpdated: review.selfReportedLastUpdated,
        selfReportedAuthor: review.selfReportedAuthor,
        submissionCount: details.submissions.length,
        latestSubmissionNote: details.submissions.length > 0 ? details.submissions[0].note : null,
        documentCount: review.documentCount,
        performanceMetrics: review.performanceMetrics,
        submissions: details.submissions
      };
      
      setReviewDetails(transformedDetails);
    } catch (error) {
      console.error('Error fetching review details:', error);
      // Fallback to basic review data
      setReviewDetails(review);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (!isOpen || !review) return null;

  // Helper function to get grade color
  const getGradeColor = (grade) => {
    if (!grade) return 'bg-gray-100 text-gray-600';
    
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-700';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Performance Review Details</h2>
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{review.employeeName}</span> • {review.position || 'Employee'}
            </div>
            {/* Remove useDatabase indicator */}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoadingDetails ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading review details...</p>
            </div>
          ) : reviewDetails ? (
            <>
              {/* Status and Progress Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      reviewDetails.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      reviewDetails.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      reviewDetails.status.includes('Pending') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {reviewDetails.status === 'Completed' ? <CheckSquare className="h-5 w-5" /> :
                       reviewDetails.status === 'In Progress' ? <Clock className="h-5 w-5" /> :
                       reviewDetails.status.includes('Pending') ? <Users className="h-5 w-5" /> :
                       <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-medium text-gray-900">{reviewDetails.status}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                      <PieChart className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Supervisor Progress</p>
                      <p className="font-medium text-gray-900">{reviewDetails.progress || 0}% Complete</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className={`h-2.5 rounded-full ${
                        (reviewDetails.progress || 0) < 30 ? 'bg-red-500' : 
                        (reviewDetails.progress || 0) < 70 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${reviewDetails.progress || 0}%` }}
                    ></div>
                  </div>

                  {/* Self-Reported Progress (if available) - shown separately */}
                  {typeof reviewDetails.selfReportedProgress === 'number' && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Employee Self-Reported</p>
                          <p className="font-medium text-gray-900">{reviewDetails.selfReportedProgress}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-blue-500"
                          style={{ width: `${reviewDetails.selfReportedProgress}%` }}
                        ></div>
                      </div>
                      {reviewDetails.selfReportedLastUpdated && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last updated by {reviewDetails.selfReportedAuthor} on {new Date(reviewDetails.selfReportedLastUpdated).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Grade</p>
                      <p className="font-medium text-gray-900">
                        {reviewDetails.grade ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(reviewDetails.grade)}`}>
                            {reviewDetails.grade}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not graded</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database-specific Task Information */}
              {reviewDetails.submissions && ( // Remove useDatabase check
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">Task Submission Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Task:</span>
                      <p className="font-medium text-blue-900">{reviewDetails.taskName}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Submissions:</span>
                      <p className="font-medium text-blue-900">{reviewDetails.submissionCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Documents:</span>
                      <p className="font-medium text-blue-900">{reviewDetails.documentCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Priority:</span>
                      <p className="font-medium text-blue-900">{reviewDetails.priority || 'Medium'}</p>
                    </div>
                  </div>
                  {reviewDetails.latestSubmissionNote && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <span className="text-blue-700 text-sm">Latest Note:</span>
                      <p className="text-blue-900 text-sm mt-1">{reviewDetails.latestSubmissionNote}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Review Information and Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Review Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Review Type</p>
                      <p className="font-medium text-gray-900">{reviewDetails.type}</p>
                    </div>
                    {/* <div>
                      <p className="text-xs text-gray-500">Review Cycle</p>
                      <p className="font-medium text-gray-900">{reviewDetails.cycle}</p>
                    </div> */}
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-medium text-gray-900">{reviewDetails.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Position</p>
                      <p className="font-medium text-gray-900">{reviewDetails.manager}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Timeline</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Start Date</p>
                      <p className="font-medium text-gray-900">{new Date(reviewDetails.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className="font-medium text-gray-900">{new Date(reviewDetails.dueDate).toLocaleDateString()}</p>
                    </div>
                    {reviewDetails.completedDate && (
                      <div>
                        <p className="text-xs text-gray-500">Completion Date</p>
                        <p className="font-medium text-gray-900">{new Date(reviewDetails.completedDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {reviewDetails.lastUpdated && (
                      <div>
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="font-medium text-gray-900">{new Date(reviewDetails.lastUpdated).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Supervisor Comments */}
              {reviewDetails.supervisorComments && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Supervisor Comments</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 whitespace-pre-line">{reviewDetails.supervisorComments}</p>
                  </div>
                </div>
              )}

              {/* Rating Section */}
              {reviewDetails.overallRating && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Performance Rating</h3>
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${i < Math.floor(reviewDetails.overallRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                          fill={i < Math.floor(reviewDetails.overallRating) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold text-gray-900">{reviewDetails.overallRating}</span>
                    <span className="text-sm text-gray-500">out of 5</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No Details Available</h3>
              <p className="text-gray-500 mt-2">Unable to load review details at this time.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PerformanceReviews = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // filters removed: showFilters / selectedFilters

  // State for modals
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewReviewModalOpen, setIsNewReviewModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  
  const [isLoadingFromDB, setIsLoadingFromDB] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Remove useDatabase state - always use database

  // Enhanced sample review data with progress and grade fields - Remove dummy data initialization
  const [reviewData, setReviewData] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 8,
    total: 0
  });

  // Function to fetch reviews from database - Always fetch from database
  // stable via useCallback so we can call it from effects reliably
  const fetchReviewsFromDatabase = useCallback(async (page = 1) => {
    setIsLoadingFromDB(true);
    try {
      const res = await PMSService.getPerformanceReviewsFromDB({
        page,
        per_page: pagination.per_page
      });
      setReviewData(res.data || []);
      if (res.meta) setPagination(res.meta);
    } catch (error) {
      console.error('Error fetching reviews from database:', error);
      setReviewData([]);
    } finally {
      setIsLoadingFromDB(false);
    }
  }, [pagination.per_page]);
  
  // refresh flag - set true when any modal action modifies data
  const [needsRefresh, setNeedsRefresh] = useState(false);

  // when flagged, re-fetch current page once
  useEffect(() => {
    if (!needsRefresh) return;
    (async () => {
      await fetchReviewsFromDatabase(pagination.current_page);
      setNeedsRefresh(false);
    })();
  }, [needsRefresh, fetchReviewsFromDatabase, pagination.current_page]);

   // Subscribe to store updates so this view refreshes automatically - Remove dummy data subscription
  useEffect(() => {
    fetchReviewsFromDatabase(pagination.current_page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchReviewsFromDatabase, pagination.current_page]);
 
  const goToPage = (p) => {
    if (p < 1 || p > pagination.last_page || p === pagination.current_page) return;
    setPagination(prev => ({ ...prev, current_page: p }));
  };

  // Add helper to normalize statuses (map Pending Manager / Pending Employee / Draft -> Pending)
  const normalizeStatus = (status) => {
    if (!status) return status;
    const s = String(status).trim();
    if (s === 'Pending Manager' || s === 'Pending Employee' || s === 'Draft' || s.toLowerCase().includes('pending')) {
      return 'Pending';
    }
    return s;
  };

  // Filter AFTER fetching current page (only page data shown)
  const filteredReviews = reviewData.filter(review => {
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'inProgress' && review.status === 'In Progress') ||
      (activeTab === 'pending' && (review.status === 'Pending Manager' || review.status === 'Pending Employee')) ||
      (activeTab === 'completed' && review.status === 'Completed') ||
      (activeTab === 'draft' && review.status === 'Draft');

    const matchesSearch = 
      review.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

    // Filters removed - only tabs + search apply
    return matchesTab && matchesSearch;
  });

  // Helper function to get appropriate status badge color
  const getStatusBadgeClass = (status) => {
    const s = normalizeStatus(status);
    switch (s) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get grade badge color
  const getGradeBadgeClass = (grade) => {
    if (!grade) return 'bg-gray-100 text-gray-600';
    
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-700';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      
      if (filterType === 'period') {
        newFilters.period = value;
      } else {
        if (newFilters[filterType].includes(value)) {
          newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
        } else {
          newFilters[filterType] = [...newFilters[filterType], value];
        }
      }
      
      return newFilters;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters({
      status: [],
      type: [],
      department: [],
      period: '',
    });
  };

  // Get current user role (adjust based on your auth setup)
  const { user } = useAuth(); // Assuming user object has a 'role' property
  const userRole = user?.role || 'user'; // Default to 'user' if not available
  const userPermissions = permissions[userRole]?.performanceReviews || {};

  // Helper: determine if current user can review (update) this submission
  const canReviewSubmission = (review) => {
    if (!user || !review) return false;
    const role = (user.role || '').toLowerCase();
    
    // Admin can review everything
    if (role === 'admin') return true;
    
    // Prevent anyone from reviewing their own self-submission
    if (user.employee_id && review.employeeId && Number(user.employee_id) === Number(review.employeeId)) {
      return false;
    }
    
    // Creator of the task (creatorId) can review
    if (review.creatorId && Number(review.creatorId) === Number(user.id)) {
      return true;
    }
    
    // Supervisors can only review tasks they created
    if (role === 'supervisor') {
      return review.creatorId && Number(review.creatorId) === Number(user.id);
    }
    
    // HR can review tasks created by supervisors (if creatorRole provided)
    if (role === 'hr') {
      if (review.creatorRole) {
        const cr = String(review.creatorRole).toLowerCase();
        return cr === 'supervisor' || cr === 'manager' || cr === 'operations' || cr.includes('supervisor');
      }
      // If backend didn't include creatorRole, be permissive for HR (or adjust to conservative false)
      return true;
    }
  
    // Default: no review permission
    return false;
  };

  // >>> ADD MISSING HANDLERS (restored) <<<
  const openProgressModal = (review) => {
    setSelectedReview(review);
    setIsProgressModalOpen(true);
  };

  const openDetailsModal = (review) => {
    setSelectedReview(review);
    setIsDetailsModalOpen(true);
  };

  const openDocumentsModal = async (review) => {
    setSelectedReview(review);
    // Optional: fetch documents if you have an endpoint
    // try {
    //   const docs = await PMSService.getAssignmentDocuments(review.id);
    //   setSelectedReview(prev => ({ ...prev, documents: docs }));
    // } catch (e) { console.error(e); }
    setIsDocumentsModalOpen(true);
  };

  const handleSaveProgressReview = async (updatedReview) => {
    try {
      setIsLoading(true);
      const payload = {
        progress: updatedReview.progress,
        grade: updatedReview.grade,
        supervisor_comments: updatedReview.supervisorComments,
        status: updatedReview.status,
        performance_metrics: updatedReview.performanceMetrics
      };
      // call backend (see [`PMSService.updatePerformanceReview`](d:/office/hr_system_frontend/src/services/PMS/PMSService.js))
      await PMSService.updatePerformanceReview(updatedReview.id, payload);
      toast.success('Review updated');
      // mark for refresh and close modal
      setNeedsRefresh(true);
      setIsProgressModalOpen(false);
    } catch (e) {
      console.error('Update failed', e);
      toast.error(e?.response?.data?.message || 'Failed to update review');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReview = async (formData) => {
    try {
      setIsLoading(true);
      await PMSService.createReview(formData);
      toast.success('Review created');
      setIsNewReviewModalOpen(false);
      // reset to first page and request refresh
      setPagination(p => ({ ...p, current_page: 1 }));
      setNeedsRefresh(true);
    } catch (e) {
      console.error('Create failed', e);
      toast.error(e?.response?.data?.message || 'Failed to create review');
    } finally {
      setIsLoading(false);
    }
  };

  // When modals are closed without a save we still want to ensure latest data is shown.
  // If the modal closed and needsRefresh is false, we still re-fetch once to keep UI consistent.
  useEffect(() => {
    if (!isProgressModalOpen && !isDetailsModalOpen && !isNewReviewModalOpen && !isDocumentsModalOpen) {
      // small debounce to avoid double fetches
      const t = setTimeout(() => fetchReviewsFromDatabase(pagination.current_page), 200);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProgressModalOpen, isDetailsModalOpen, isNewReviewModalOpen, isDocumentsModalOpen]);
 
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Remove database toggle */}
      
      {/* Progress Review Modal */}
      <ProgressReviewModal 
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        review={selectedReview}
        onSave={handleSaveProgressReview}
      />

      {/* Review Details Modal */}
      <ReviewDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        review={selectedReview}
      />

      {/* New Review Modal */}
      <NewReviewModal
        isOpen={isNewReviewModalOpen}
        onClose={() => setIsNewReviewModalOpen(false)}
        onSubmit={handleCreateReview}
      />

      {/* Employee Documents Modal */}
      <EmployeeDocumentsModal
        isOpen={isDocumentsModalOpen}
        onClose={() => setIsDocumentsModalOpen(false)}
        review={selectedReview}
      />

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-gray-600">Manage and track employee performance evaluations</p>
        </div>
        {/* Remove new review button if not needed */}
      </div>

      {/* Status Summary Cards - moved here (below header, above table) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">In Progress</div>
              <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => normalizeStatus(r.status) === 'In Progress').length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Pending Approval</div>
              <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => normalizeStatus(r.status) === 'Pending').length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Completed</div>
              <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => normalizeStatus(r.status) === 'Completed').length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gray-100 text-gray-600 mr-4">
              <FileText className="h-6 w-6" />
            </div>
            {/* <div>
              <div className="text-sm font-medium text-gray-500">Draft</div>
              <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => normalizeStatus(r.status) === 'Draft').length}
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Grade Legend */}
      <div className="mb-6 bg-white rounded-xl p-3 border border-gray-100 flex gap-3 items-center">
        <div className="text-sm font-medium text-gray-700">Grades:</div>
        {['A+','A','B','C','C-'].map(g => (
          <div key={g} className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getGradeBadgeClass(g)}`}>
              {g}
            </span>
            <span className="text-xs text-gray-500">
              {
                // short description mapping
                g.startsWith('A') ? 'Excellent' :
                g.startsWith('B') ? 'Good' :
                g === 'C' ? 'Satisfactory' :
                g === 'C-' ? 'Needs Improvement' : 'Satisfactory'
              }
            </span>
          </div>
        ))}
      </div>

      {/* Tabs and Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Reviews
            </button>
            <button
              onClick={() => setActiveTab('inProgress')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'inProgress'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'pending'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'completed'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'draft'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Draft
            </button>
          </div>

          {/* Search - filter button removed */}
          {/* <div className="flex gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-64"
                placeholder="Search Reviews"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div> */}
        </div>

        {/* Reviews Table - Enhanced with Progress and Grade */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Employee
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Department
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Self-Reported Progress
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex itemscenter gap-1">
                    Progress
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Status
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Grade
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                {/* Moved Weights Total here (after Grade) */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Weights Total
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Due Date
                    <ArrowDownUp className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                           </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{review.employeeName}</div>
                        <div className="text-xs text-gray-500">{review.position}</div>
                        <div className="text-xs text-gray-400">ID: {review.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {review.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {typeof review.selfReportedProgress === 'number' ? (
                        <div className="flex items-center">
                          <div className="w-38 md:w-50 flex-shrink-0 mr-3">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  review.selfReportedProgress < 30 ? 'bg-red-500' :
                                 
                                  review.selfReportedProgress < 70 ? 'bg-yellow-500' : 
                                  'bg-green-500'
                                }`}
                                style={{ width: `${review.selfReportedProgress}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-gray-700">{review.selfReportedProgress}%</span>
                                               </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-38 md:w-50 flex-shrink-0 mr-4">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${
                                review.progress < 30 ? 'bg-red-500' : 
                                review.progress < 70 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${review.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-700">{review.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(review.status)}`}>
                        {normalizeStatus(review.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {review.grade ? (
                       
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGradeBadgeClass(review.grade)}`}>
                          {review.grade}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not graded</span>
                      )}
                    </td>
                    {/* Moved Weights Total cell here (after Grade) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <span className="text-sm font-bold text-indigo-600">
                          {(() => {
                           
                            // try weights on review first
                            if (review?.weights && review.weights.length > 0) {
                              return review.weights.reduce((sum, w) => sum + (parseFloat(w.percentage) || 0), 0);
                            }
                            // fallback: look up the linked task and use its weights
                            if (review?.taskId) {
                              // Remove dummy data lookup - weights should come from database
                              return 0;
                            }
                            return 0;
                          })()}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(review.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {/* Always show View Details for all roles with view permission */}
                        {userPermissions.view && (
                          <button 
                            className="text-blue-600 hover:text-blue-900 p-1"
                            onClick={() => openDetailsModal(review)}
                            title="View Details"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}

                        {/* Show Update Progress only if user can review this submission */}
                        {userPermissions.edit && canReviewSubmission(review) && (
                          <button 
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            onClick={() => openProgressModal(review)}
                            title="Update Progress"
                          >
                            <ListChecks className="h-4 w-4" />
                          </button>
                        )}

                        {/* Show View Documents only if not "user" role and has edit permission */}
                        {userRole !== 'user' && userPermissions.edit && (
                          <button 
                            className="text-amber-600 hover:text-amber-900 p-1"
                            onClick={() => openDocumentsModal(review)}
                            title="View Documents"
                          >
                            <File className="h-4 w-4" />
                          </button>
                        )}

                        {/* Show Edit Review only if not "user" role and has edit permission */}
                        {/* {userRole !== 'user' && userPermissions.edit && (
                          <button className="text-green-600 hover:text-green-900 p-1" title="Edit Review">
                            <Edit className="h-4 w-4" />
                          </button>
                        )} */}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Search className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-lg font-medium text-gray-600">No reviews found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - dynamic */}
        <div className="px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} reviews
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="px-3 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Prev
            </button>
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
              .filter(p => {
                const c = pagination.current_page;
                // window around current page
                return p === 1 || p === pagination.last_page || (p >= c - 2 && p <= c + 2);
              })
              .reduce((acc, p, _, arr) => {
                if (acc.length) {
                  const prev = acc[acc.length - 1];
                  if (p - prev.p > 1) acc.push({ gap: true, key: `gap-${p}-${prev.p}` });
                }
                acc.push({ p, key: p });
                return acc;
              }, [])
              .map(item =>
                item.gap ? (
                  <span key={item.key} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={item.key}
                    onClick={() => goToPage(item.p)}
                    className={`px-3 py-2 text-sm border rounded-lg ${
                      item.p === pagination.current_page
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {item.p}
                  </button>
                )
              )
            }
            <button
              onClick={() => goToPage(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="px-3 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Status Summary Cards - Same as before */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">In Progress</div>
                           <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => r.status === 'In Progress').length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Pending Approval</div>
              <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => r.status === 'Pending Manager' || r.status === 'Pending Employee').length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Completed</div>
              <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => r.status === 'Completed').length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gray-100 text-gray-600 mr-4">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Draft</div>
              <div className="text-xl font-semibold text-gray-900">
                {reviewData.filter(r => r.status === 'Draft').length}
              </div>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default PerformanceReviews;
