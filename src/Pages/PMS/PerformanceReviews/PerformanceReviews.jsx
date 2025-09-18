import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; // Add this import
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
import PMSDummyDataStore from "@services/PMS/PMSDummyDataStore";
import PMSService from "@services/PMS/PMSService"; // Add this missing import
import EmployeeDocumentsModal from './EmployeeDocumentsModal';
import { permissions } from '../../../config/permissions';
import { useAuth } from '../../../contexts/AuthContext';

// Progress Review Modal Component
const ProgressReviewModal = ({ isOpen, onClose, review, onSave, useDatabase = false }) => {
  const [progress, setProgress] = useState(review?.progress || 0);
  const [grade, setGrade] = useState(review?.grade || '');
  const [comments, setComments] = useState(review?.supervisorComments || '');
  const [statusState, setStatusState] = useState(review?.status || 'In Progress');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  
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

  const [taskDetails, setTaskDetails] = useState(null);

  // keep only the grades you mentioned
  const gradeOptions = ['A+', 'A', 'B', 'C', 'C-'];
  const statusOptions = ['Completed', 'In Progress', 'Pending Manager', 'Pending Employee', 'Draft'];

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

  // Fetch detailed task and submission data when using database
  useEffect(() => {
    if (isOpen && review && useDatabase && review.id) {
      const fetchTaskDetails = async () => {
        try {
          const details = await PMSService.getPerformanceReviewDetails(review.id);
          setTaskDetails(details);
          
          // Pre-populate metrics if available
          if (details.submissions && details.submissions.length > 0) {
            const latestSubmission = details.submissions[0];
            if (latestSubmission.performance_metrics) {
              setPerformanceMetrics(latestSubmission.performance_metrics);
            }
          }
        } catch (error) {
          console.error('Error fetching task details:', error);
        }
      };
      
      fetchTaskDetails();
    }
  }, [isOpen, review, useDatabase]);

  // Get the linked task if available
  const getLinkedTask = () => {
    if (useDatabase && taskDetails) {
      return {
        id: taskDetails.assignment.id,
        name: taskDetails.assignment.task_name,
        description: taskDetails.assignment.description,
        startDate: taskDetails.assignment.start_date,
        endDate: taskDetails.assignment.end_date,
        weights: taskDetails.assignment.weights
      };
    } else if (review?.taskId) {
      return PMSDummyDataStore.getTaskById(review.taskId);
    }
    return null;
  };

  const linkedTask = getLinkedTask();
  const taskSpecificMetricKey = linkedTask ? taskNameToMetricKey[linkedTask.name] : null;

  // Calculate overall progress from the performance metrics
  const calculateOverallProgress = (metrics) => {
    if (taskSpecificMetricKey) {
      // If task-specific, use only that metric's value
      return metrics[taskSpecificMetricKey] || 0;
    } else {
      // Fallback to average of all metrics
      const values = Object.values(metrics);
      const sum = values.reduce((acc, val) => acc + val, 0);
      return Math.round(sum / values.length);
    }
  };

  // sync local state when review prop changes (modal reopened with different review)
  useEffect(() => {
    if (review) {
      setProgress(review.progress || 0);
      setGrade(review.grade || '');
      setComments(review.supervisorComments || '');
      setStatusState(review.status || 'In Progress');
      
      // Load performance metrics if they exist
      if (review.performanceMetrics) {
        setPerformanceMetrics(review.performanceMetrics);
      } else {
        // Reset metrics if not present
        setPerformanceMetrics({
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
      }
    }
  }, [review]);

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
    if (review?.performanceMetrics) {
      setPerformanceMetrics(review.performanceMetrics);
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
    setIsSubmitting(true);

    try {
      // Create updated review object including supervisor-selected status
      const updatedReview = {
        ...review,
        progress: parseInt(progress), // Ensure this is an integer
        grade: grade,
        supervisorComments: comments,
        status: statusState,
        lastUpdated: new Date().toISOString(),
        performanceMetrics: performanceMetrics // Include performance metrics as JSON object
      };
      
      await onSave(updatedReview);
      onClose();
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review: " + error.message);
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
              <span className="font-medium">{review.employeeName}</span> • {review.position || 'Employee'}
            </div>
            {linkedTask && (
              <div className="text-sm text-indigo-600 mt-1">
                Task: {linkedTask.name}
              </div>
            )}
            {useDatabase && (
              <div className="text-xs text-green-600 mt-1">
                ✓ Database Data
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
        {useDatabase && taskDetails && (
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
                    <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                    <p className="text-sm text-gray-600">
                      {linkedTask 
                        ? `Rate performance for: ${linkedTask.name}`
                        : "Rate employee performance across key areas"
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Current Progress Display */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{progress}%</div>
                    <div className="text-xs text-gray-500">Overall Score</div>
                  </div>
                  
                  {/* Enhanced Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowCategoryDetails(prev => !prev)}
                    onKeyDown={handleHeaderKeyDown}
                    aria-expanded={showCategoryDetails}
                    aria-controls="performance-metrics-panel"
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    title={showCategoryDetails ? "Hide detailed metrics" : "Show detailed metrics"}
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {showCategoryDetails ? "Hide Details" : "Rate Performance"}
                    </span>
                    <div className={`transform transition-transform duration-200 ${showCategoryDetails ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-4 w-4 text-indigo-600" />
                    </div>
                  </button>
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
                    title="Reset all metrics to 0"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </button>
                </div>
                
                {/* Progress Bar Preview */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Progress:</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress < 30 ? 'bg-red-500' : 
                        progress < 70 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Metrics Panel */}
            <div 
              id="performance-metrics-panel"
              className={`bg-gray-50 rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 ${
                showCategoryDetails ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Detailed Performance Categories</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {linkedTask 
                      ? `Adjust the slider below to rate the employee's performance in: ${linkedTask.name}`
                      : "Adjust the sliders below to rate the employee's performance in each category (0-100%):"
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {taskSpecificMetricKey ? (
                    // Show only the task-specific metric
                    (() => {
                      const metricKey = taskSpecificMetricKey;
                      const metricName = linkedTask.name;
                      const metricValue = performanceMetrics[metricKey];
                      
                      return (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {metricName}: <span className="font-bold text-indigo-600">{metricValue}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={metricValue}
                            onChange={(e) => handleMetricChange(metricKey, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={metricName}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Poor</span>
                            <span>Excellent</span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    // Fallback: Show all metrics if no task is linked
                    <>
                      {/* Job Knowledge and Skills */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Job Knowledge and Skills: <span className="font-bold text-indigo-600">{performanceMetrics.jobKnowledge}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.jobKnowledge}
                          onChange={(e) => handleMetricChange('jobKnowledge', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Job Knowledge and Skills"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>

                      {/* Quality of Work */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Quality of Work: <span className="font-bold text-indigo-600">{performanceMetrics.qualityOfWork}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.qualityOfWork}
                          onChange={(e) => handleMetricChange('qualityOfWork', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Quality of Work"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>

                      {/* Productivity */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Productivity: <span className="font-bold text-indigo-600">{performanceMetrics.productivity}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.productivity}
                          onChange={(e) => handleMetricChange('productivity', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Productivity"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>

                      {/* Communication Skills */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Communication Skills: <span className="font-bold text-indigo-600">{performanceMetrics.communicationSkills}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.communicationSkills}
                          onChange={(e) => handleMetricChange('communicationSkills', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Communication Skills"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>

                      {/* Teamwork and Collaboration */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Teamwork and Collaboration: <span className="font-bold text-indigo-600">{performanceMetrics.teamwork}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.teamwork}
                          onChange={(e) => handleMetricChange('teamwork', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Teamwork and Collaboration"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>

                      {/* Behavior at work */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Behavior at Work: <span className="font-bold text-indigo-600">{performanceMetrics.behaviorAtWork}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.behaviorAtWork}
                          onChange={(e) => handleMetricChange('behaviorAtWork', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Behavior at Work"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>

                      {/* Problem-Solving and Decision-Making */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Problem-Solving: <span className="font-bold text-indigo-600">{performanceMetrics.problemSolving}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.problemSolving}
                          onChange={(e) => handleMetricChange('problemSolving', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Problem-Solving and Decision-Making"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>

                      {/* Attendance and Punctuality */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Attendance and Punctuality: <span className="font-bold text-indigo-600">{performanceMetrics.attendance}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.attendance}
                          onChange={(e) => handleMetricChange('attendance', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Attendance and Punctuality"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>

                      {/* Adaptability and Flexibility */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Adaptability and Flexibility: <span className="font-bold text-indigo-600">{performanceMetrics.adaptability}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.adaptability}
                          onChange={(e) => handleMetricChange('adaptability', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Adaptability and Flexibility"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>

                      {/* Self-Development */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Self-Development: <span className="font-bold text-indigo-600">{performanceMetrics.selfDevelopment}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.selfDevelopment}
                          onChange={(e) => handleMetricChange('selfDevelopment', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Self-Development"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>

                      {/* Discipline and conduct at work */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Discipline and Conduct: <span className="font-bold text-indigo-600">{performanceMetrics.discipline}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.discipline}
                          onChange={(e) => handleMetricChange('discipline', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Discipline and conduct at work"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>

                      {/* Adherence to the given Guidelines */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Adherence to Guidelines: <span className="font-bold text-indigo-600">{performanceMetrics.adherenceToGuidelines}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={performanceMetrics.adherenceToGuidelines}
                          onChange={(e) => handleMetricChange('adherenceToGuidelines', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Adherence to the given Guidelines"
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    </>
                  )}
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
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
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
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
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
const ReviewDetailsModal = ({ isOpen, onClose, review, useDatabase = false }) => {
  const [reviewDetails, setReviewDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch review details when modal opens
  useEffect(() => {
    if (isOpen && review && useDatabase && review.id) {
      fetchReviewDetails();
    } else if (isOpen && review && !useDatabase) {
      // Use dummy data for non-database mode
      setReviewDetails(review);
    }
  }, [isOpen, review, useDatabase]);

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
            {useDatabase && (
              <div className="text-xs text-green-600 mt-1">
                ✓ Database Data • Assignment ID: {review.id}
              </div>
            )}
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
                      <p className="text-xs text-gray-500">Progress (Supervisor)</p>
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

                  {/* Self-Reported Progress (if available) */}
                  {typeof reviewDetails.selfReportedProgress === 'number' && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Self-Reported Progress</p>
                          <p className="font-medium text-gray-900">{reviewDetails.selfReportedProgress}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-indigo-500"
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
              {useDatabase && reviewDetails.submissions && (
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
                    <div>
                      <p className="text-xs text-gray-500">Review Cycle</p>
                      <p className="font-medium text-gray-900">{reviewDetails.cycle}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-medium text-gray-900">{reviewDetails.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Manager</p>
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
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    status: [],
    type: [],
    department: [],
    period: '',
  });

  // State for modals
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewReviewModalOpen, setIsNewReviewModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  
  const [isLoadingFromDB, setIsLoadingFromDB] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add this missing state
  const [useDatabase, setUseDatabase] = useState(true);

  // Enhanced sample review data with progress and grade fields
  const [reviewData, setReviewData] = useState(() => 
    useDatabase ? [] : PMSDummyDataStore.getPerformanceReviews()
  );

  // Function to fetch reviews from database
  const fetchReviewsFromDatabase = async () => {
    setIsLoadingFromDB(true);
    try {
      const data = await PMSService.getPerformanceReviewsFromDB();
      console.log('Fetched performance reviews from database:', data);
      setReviewData(data);
    } catch (error) {
      console.error('Error fetching reviews from database:', error);
      // Fallback to dummy data
      setReviewData(PMSDummyDataStore.getPerformanceReviews());
    } finally {
      setIsLoadingFromDB(false);
    }
  };

  // Subscribe to store updates so this view refreshes automatically
  useEffect(() => {
    if (useDatabase) {
      fetchReviewsFromDatabase();
    } else {
      const unsubscribe = PMSDummyDataStore.subscribe(() => {
        setReviewData(PMSDummyDataStore.getPerformanceReviews());
      });
      return () => {
        unsubscribe();
      };
    }
  }, [useDatabase]);

  // Handle opening progress review modal
  const openProgressModal = (review) => {
    setSelectedReview(review);
    setIsProgressModalOpen(true);
  };

  // Handle opening details modal
  const openDetailsModal = (review) => {
    setSelectedReview(review);
    setIsDetailsModalOpen(true);
  };

  // Handle opening documents modal with database data
  const openDocumentsModal = async (review) => {
    setSelectedReview(review);
    if (useDatabase && review.id) {
      try {
        const documents = await PMSService.getAssignmentDocuments(review.id);
        setSelectedReview({
          ...review,
          documents: documents
        });
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    }
    setIsDocumentsModalOpen(true);
  };

  // Handle saving progress review
  const handleSaveProgressReview = async (updatedReview) => {
    try {
      setIsLoading(true);
      
      if (useDatabase && updatedReview.id) {
        // For real database, call the API
        const reviewData = {
          progress: updatedReview.progress,
          grade: updatedReview.grade,
          supervisor_comments: updatedReview.supervisorComments,
          status: updatedReview.status,
          performance_metrics: updatedReview.performanceMetrics
        };
        
        console.log('Sending review data:', reviewData); // Debug log
        
        const response = await PMSService.updatePerformanceReview(updatedReview.id, reviewData);
        console.log('Response received:', response); // Debug log
        
        // Refresh the reviews list
        const freshData = await PMSService.getPerformanceReviewsFromDB();
        setReviewData(freshData);
      } else {
        // For dummy data store
        PMSDummyDataStore.updatePerformanceReview(updatedReview.id, updatedReview);
        setReviewData(PMSDummyDataStore.getPerformanceReviews());
      }
      
      // Show success message
      toast.success("Performance review updated successfully");
    } catch (error) {
      console.error("Error saving review:", error);
      
      let errorMessage = "Failed to save review";
      
      if (error.response?.data?.message) {
        errorMessage += ": " + error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage += ": " + error.response.data.error;
      } else if (error.message) {
        errorMessage += ": " + error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creating new review
  const handleCreateReview = (reviewDataForm) => {
    const newReview = {
      id: Date.now(),
      employeeName: reviewDataForm.employeeName,
      employeeId: reviewDataForm.employeeId,
      position: reviewDataForm.employeePosition,
      department: reviewDataForm.employeeDepartment,
      manager: reviewDataForm.supervisorName,
      type: reviewDataForm.reviewType === "performance" ? "Performance Review" :
            reviewDataForm.reviewType === "quarterly" ? "Quarterly Review" :
            reviewDataForm.reviewType === "annual" ? "Annual Review" :
            reviewDataForm.reviewType === "probation" ? "Probation Review" : "Progress Check-in",
      status: "Draft",
      startDate: reviewDataForm.startDate,
      dueDate: reviewDataForm.dueDate,
      completedDate: null,
      overallRating: null,
      cycle: reviewDataForm.reviewCycle.replace('_',' '),
      progress: 0,
      grade: null,
      supervisorComments: reviewDataForm.reviewNotes,
      lastUpdated: new Date().toISOString(),
      selfReportedProgress: 0,
      selfReportedLastUpdated: null,
      selfReportedAuthor: null,
      taskId: reviewDataForm.taskId || null,
      performanceMetrics: null
    };
    PMSDummyDataStore.addPerformanceReview(newReview);
    setReviewData(PMSDummyDataStore.getPerformanceReviews());
  };

  // Filter reviews based on active tab and search query
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

    // Check if review matches selected filters
    const matchesStatus = selectedFilters.status.length === 0 || 
                         selectedFilters.status.includes(review.status);
    const matchesType = selectedFilters.type.length === 0 || 
                       selectedFilters.type.includes(review.type);
    const matchesDepartment = selectedFilters.department.length === 0 || 
                            selectedFilters.department.includes(review.department);
    const matchesPeriod = !selectedFilters.period || 
                         review.cycle.includes(selectedFilters.period);

    return matchesTab && matchesSearch && matchesStatus && 
           matchesType && matchesDepartment && matchesPeriod;
  });

  // Helper function to get appropriate status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending Manager':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending Employee':
        return 'bg-purple-100 text-purple-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Add toggle for data source */}
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useDatabase}
            onChange={(e) => setUseDatabase(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-600">Use Database Data</span>
        </label>
        {useDatabase && (
          <button
            onClick={fetchReviewsFromDatabase}
            disabled={isLoadingFromDB}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoadingFromDB ? 'Loading...' : 'Refresh'}
          </button>
        )}
      </div>

      {/* Progress Review Modal */}
      <ProgressReviewModal 
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        review={selectedReview}
        onSave={handleSaveProgressReview}
        useDatabase={useDatabase}
      />

      {/* Review Details Modal */}
      <ReviewDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        review={selectedReview}
        useDatabase={useDatabase}
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
        useDatabase={useDatabase}
      />

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-gray-600">Manage and track employee performance evaluations</p>
        </div>
        {/* <button 
          onClick={() => setIsNewReviewModalOpen(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Review</span>
        </button> */}
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

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-64"
                placeholder="Search employee or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className={`border ${showFilters ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'} rounded-lg px-3 py-2 flex items-center gap-2`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-700">Filters</h3>
              <button
                className="text-sm text-indigo-600 hover:text-indigo-800"
                onClick={clearFilters}
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="space-y-1">
                  {['Completed', 'In Progress', 'Pending Manager', 'Pending Employee', 'Draft'].map(status => (
                    <div key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`status-${status}`}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedFilters.status.includes(status)}
                        onChange={() => handleFilterChange('status', status)}
                      />
                      <label htmlFor={`status-${status}`} className="ml-2 text-sm text-gray-700">
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Type
                </label>
                <div className="space-y-1">
                  {['Annual Performance Review', 'Quarterly Review', 'Probation Review'].map(type => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`type-${type}`}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedFilters.type.includes(type)}
                        onChange={() => handleFilterChange('type', type)}
                      />
                      <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <div className="space-y-1">
                  {['Engineering', 'Marketing', 'Sales', 'Design', 'Product', 'Support'].map(dept => (
                    <div key={dept} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`dept-${dept}`}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedFilters.department.includes(dept)}
                        onChange={() => handleFilterChange('department', dept)}
                      />
                      <label htmlFor={`dept-${dept}`} className="ml-2 text-sm text-gray-700">
                        {dept}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Period Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Period
                </label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedFilters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                >
                  <option value="">All Periods</option>
                  <option value="2025 Annual">2025 Annual</option>
                  <option value="2025 Q3">2025 Q3</option>
                  <option value="2025 Q2">2025 Q2</option>
                  <option value="2025 Q1">2025 Q1</option>
                </select>
              </div>
            </div>
          </div>
        )}

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
                  <div className="flex items-center gap-1">
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
                        {review.status}
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
                              const task = PMSDummyDataStore.getTaskById(review.taskId);
                              if (task?.weights && task.weights.length > 0) {
                                return task.weights.reduce((sum, w) => sum + (parseFloat(w.percentage) || 0), 0);
                              }
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

                        {/* Show Update Progress only if not "user" role and has edit permission */}
                        {userRole !== 'user' && userPermissions.edit && (
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
                        {userRole !== 'user' && userPermissions.edit && (
                          <button className="text-green-600 hover:text-green-900 p-1" title="Edit Review">
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
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

        {/* Pagination - Same as before */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredReviews.length}</span> of{" "}
                <span className="font-medium">{filteredReviews.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Previous</span>
                  <ChevronDown className="h-5 w-5 transform rotate-90" />
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-indigo-500 bg-indigo-50 text-sm font-medium text-indigo-600">
                  2
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  3
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  <ChevronDown className="h-5 w-5 transform -rotate-90" />
                </button>
              </nav>
            </div>
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

// Utility to generate review object for each new task assignment
function buildReviewFromTask(task, assigneeId) {
  const now = new Date().toISOString();
  return {
    id: reviewIdCounter++,
    taskId: task.id,
    employeeName: resolveEmployeeName(assigneeId),
    employeeId: "EMP" + assigneeId.toString().padStart(3, "0"),
    position: "", // unknown in dummy scope
    department: task.department || "",
    manager: task.creator?.name || "Supervisor",
    type: "Performance Review",
    status: "Draft",
    startDate: task.startDate,
    dueDate: task.endDate,
    completedDate: null,
    overallRating: null,
    cycle: deriveCycle(task.startDate),
    progress: 0,
    grade: null,
    supervisorComments: null,
    lastUpdated: now,
    selfReportedProgress: 0,
    selfReportedLastUpdated: null,
    selfReportedAuthor: null,
    performanceMetrics: null,
    weights: task.weights // Add weights from the linked task
  };
}
