import React, { useState, useEffect } from 'react';
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
  User, // Add this import
  RefreshCw // Add this import
} from 'lucide-react';
import NewReviewModal from "./NewReviewModal";

// Progress Review Modal Component
const ProgressReviewModal = ({ isOpen, onClose, review, onSave }) => {
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

  // keep only the grades you mentioned
  const gradeOptions = ['A+', 'A', 'B', 'C', 'C-'];
  const statusOptions = ['Completed', 'In Progress', 'Pending Manager', 'Pending Employee', 'Draft'];

  // Calculate overall progress from the performance metrics
  const calculateOverallProgress = () => {
    const values = Object.values(performanceMetrics);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
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

  // Handle individual metric changes
  const handleMetricChange = (metric, value) => {
    setPerformanceMetrics(prev => {
      const updated = {
        ...prev,
        [metric]: parseInt(value, 10)
      };
      
      // Calculate overall progress immediately from updated metrics
      const vals = Object.values(updated);
      const sum = vals.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
      const overall = vals.length ? Math.round(sum / vals.length) : 0;
      setProgress(overall);

      return updated;
    });
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
    setProgress(0);
  };

  // Apply self-reported metrics from the review (if present)
  const applySelfReportedMetrics = () => {
    if (review?.performanceMetrics) {
      setPerformanceMetrics(review.performanceMetrics);
      // calculate overall and set immediately
      const vals = Object.values(review.performanceMetrics);
      const sum = vals.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
      setProgress(vals.length ? Math.round(sum / vals.length) : 0);
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create updated review object including supervisor-selected status
      const updatedReview = {
        ...review,
        progress: progress,
        grade: grade,
        supervisorComments: comments,
        status: statusState,
        lastUpdated: new Date().toISOString(),
        performanceMetrics: performanceMetrics // Include performance metrics
      };
      
      // In a real app, update review on server and optionally update KPI status:
      // await PMSService.updateReview(review.id, updatedReview);
      
      onSave(updatedReview);
      onClose();
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review");
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
              <span className="font-medium">{review.employeeName}</span> • {review.position}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close review modal"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

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
                    <p className="text-sm text-gray-600">Rate employee performance across key areas</p>
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
                    Adjust the sliders below to rate the employee's performance in each category (0-100%):
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

// Performance Review Details Modal
const ReviewDetailsModal = ({ isOpen, onClose, review }) => {
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
              <span className="font-medium">{review.employeeName}</span> • {review.position}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Progress Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  review.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  review.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  review.status.includes('Pending') ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {review.status === 'Completed' ? <CheckSquare className="h-5 w-5" /> :
                   review.status === 'In Progress' ? <Clock className="h-5 w-5" /> :
                   review.status.includes('Pending') ? <Users className="h-5 w-5" /> :
                   <FileText className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium text-gray-900">{review.status}</p>
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
                  <p className="font-medium text-gray-900">{review.progress || 0}% Complete</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className={`h-2.5 rounded-full ${
                    (review.progress || 0) < 30 ? 'bg-red-500' : 
                    (review.progress || 0) < 70 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${review.progress || 0}%` }}
                ></div>
              </div>

              {/* NEW: Self-Reported Progress (if available) */}
              {typeof review.selfReportedProgress === 'number' && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                      <BarChart className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Self-Reported Progress</p>
                      <p className="font-medium text-indigo-900">{review.selfReportedProgress}%</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        review.selfReportedProgress < 30 ? 'bg-red-500' :
                        review.selfReportedProgress < 70 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${review.selfReportedProgress}%` }}
                    ></div>
                  </div>

                  {review.selfReportedLastUpdated && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last reported on {new Date(review.selfReportedLastUpdated).toLocaleString()}
                      {review.selfReportedAuthor ? ` by ${review.selfReportedAuthor}` : ''}
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
                  {review.grade ? (
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getGradeColor(review.grade)}`}>
                      {review.grade}
                    </div>
                  ) : (
                    <p className="font-medium text-gray-500">Not graded</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Review Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Review Information</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Review Type</p>
                  <p className="font-medium text-gray-900">{review.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Review Cycle</p>
                  <p className="font-medium text-gray-900">{review.cycle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="font-medium text-gray-900">{review.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Manager</p>
                  <p className="font-medium text-gray-900">{review.manager}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Timeline</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900">{new Date(review.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-900">{new Date(review.dueDate).toLocaleDateString()}</p>
                </div>
                {review.completedDate && (
                  <div>
                    <p className="text-xs text-gray-500">Completion Date</p>
                    <p className="font-medium text-gray-900">{new Date(review.completedDate).toLocaleDateString()}</p>
                  </div>
                )}
                {review.lastUpdated && (
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-900">{new Date(review.lastUpdated).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Supervisor Comments */}
          {review.supervisorComments && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Supervisor Comments</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 whitespace-pre-line">{review.supervisorComments}</p>
              </div>
            </div>
          )}

          {/* Rating Section */}
          {review.overallRating && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Performance Rating</h3>
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.floor(review.overallRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                      fill={i < Math.floor(review.overallRating) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-gray-900">{review.overallRating}</span>
                <span className="text-sm text-gray-500">out of 5</span>
              </div>
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
  const [selectedReview, setSelectedReview] = useState(null);
  
  // Enhanced sample review data with progress and grade fields
  const [reviewData, setReviewData] = useState([
    {
      id: 1,
      employeeName: "John Smith",
      employeeId: "EMP001",
      position: "Software Developer",
      department: "Engineering",
      manager: "Michael Wong",
      type: "Annual Performance Review",
      status: "Completed",
      startDate: "2025-07-15",
      dueDate: "2025-08-15",
      completedDate: "2025-08-12",
      overallRating: 4.2,
      cycle: "2025 Annual",
      progress: 100,
      grade: "A-",
      supervisorComments: "John has shown exceptional skill in problem-solving and technical implementation. His code quality is excellent and he consistently meets deadlines. Could improve on documentation and knowledge sharing with junior team members.",
      lastUpdated: "2025-08-12T10:30:00Z",
      // self-reported fields added
      selfReportedProgress: 100,
      selfReportedLastUpdated: "2025-08-12T09:45:00Z",
      selfReportedAuthor: "John Smith"
    },
    {
      id: 2,
      employeeName: "Sarah Johnson",
      employeeId: "EMP025",
      position: "Marketing Specialist",
      department: "Marketing",
      manager: "Lisa Chen",
      type: "Quarterly Review",
      status: "In Progress",
      startDate: "2025-08-01",
      dueDate: "2025-08-31",
      completedDate: null,
      overallRating: null,
      cycle: "2025 Q3",
      progress: 65,
      grade: "B+",
      supervisorComments: "Sarah is performing well on her campaign management tasks. Her creative input has been valuable and she's responsive to feedback. Need to focus more on analytics and data-driven decision making.",
      lastUpdated: "2025-08-20T14:15:00Z",
      selfReportedProgress: 60,
      selfReportedLastUpdated: "2025-08-19T16:10:00Z",
      selfReportedAuthor: "Sarah Johnson"
    },
    {
      id: 3,
      employeeName: "David Rodriguez",
      employeeId: "EMP014",
      position: "Sales Representative",
      department: "Sales",
      manager: "Robert Johnson",
      type: "Annual Performance Review",
      status: "Pending Manager",
      startDate: "2025-07-15",
      dueDate: "2025-08-15",
      completedDate: null,
      overallRating: null,
      cycle: "2025 Annual",
      progress: 80,
      grade: null,
      supervisorComments: null,
      lastUpdated: null
      // no self-reported data yet
    },
    {
      id: 4,
      employeeName: "Emily Davis",
      employeeId: "EMP032",
      position: "UX Designer",
      department: "Design",
      manager: "Michael Wong",
      type: "Quarterly Review",
      status: "Draft",
      startDate: "2025-08-01",
      dueDate: "2025-08-31",
      completedDate: null,
      overallRating: null,
      cycle: "2025 Q3",
      progress: 25,
      grade: null,
      supervisorComments: null,
      lastUpdated: null,
      selfReportedProgress: 10,
      selfReportedLastUpdated: "2025-08-05T09:00:00Z",
      selfReportedAuthor: "Emily Davis"
    },
    {
      id: 5,
      employeeName: "James Wilson",
      employeeId: "EMP017",
      position: "Product Manager",
      department: "Product",
      manager: "Lisa Chen",
      type: "Annual Performance Review",
      status: "Completed",
      startDate: "2025-07-15",
      dueDate: "2025-08-15",
      completedDate: "2025-08-10",
      overallRating: 4.7,
      cycle: "2025 Annual",
      progress: 100,
      grade: "A+",
      supervisorComments: "James has exceeded expectations in all areas. His product launches have been highly successful, and he manages cross-functional teams with ease. His strategic vision and execution are exemplary.",
      lastUpdated: "2025-08-10T16:45:00Z",
      selfReportedProgress: 100,
      selfReportedLastUpdated: "2025-08-09T18:20:00Z",
      selfReportedAuthor: "James Wilson"
    },
    {
      id: 6,
      employeeName: "Linda Martinez",
      employeeId: "EMP028",
      position: "Customer Support Specialist",
      department: "Support",
      manager: "Robert Johnson",
      type: "Quarterly Review",
      status: "Pending Employee",
      startDate: "2025-08-01",
      dueDate: "2025-08-31",
      completedDate: null,
      overallRating: null,
      cycle: "2025 Q3",
      progress: 50,
      grade: "C+",
      supervisorComments: "Linda needs improvement in response time and ticket resolution. Communication with customers is good, but follow-through on complex issues needs work.",
      lastUpdated: "2025-08-18T11:20:00Z",
      selfReportedProgress: 45,
      selfReportedLastUpdated: "2025-08-17T13:05:00Z",
      selfReportedAuthor: "Linda Martinez"
    },
  ]);

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

  // Handle saving progress review
  const handleSaveProgressReview = (updatedReview) => {
    setReviewData(prevData => 
      prevData.map(review => 
        review.id === updatedReview.id ? updatedReview : review
      )
    );
  };

  // Handle creating new review
  const handleCreateReview = (reviewData) => {
    // Add the new review to the existing reviews
    setReviewData(prev => [
      {
        id: Math.max(...prev.map(r => r.id)) + 1, // Generate a new ID
        employeeName: reviewData.employeeName,
        employeeId: reviewData.employeeId,
        position: reviewData.employeePosition,
        department: reviewData.employeeDepartment,
        manager: reviewData.supervisorName,
        type: reviewData.reviewType === "performance" ? "Performance Review" : 
              reviewData.reviewType === "quarterly" ? "Quarterly Review" :
              reviewData.reviewType === "annual" ? "Annual Review" :
              reviewData.reviewType === "probation" ? "Probation Review" : 
              "Progress Check-in",
        status: "Draft",
        startDate: reviewData.startDate,
        dueDate: reviewData.dueDate,
        completedDate: null,
        overallRating: null,
        cycle: reviewData.reviewCycle.replace('_', ' '),
        progress: 0,
        grade: null,
        supervisorComments: reviewData.reviewNotes,
        lastUpdated: new Date().toISOString()
      },
      ...prev
    ]);
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
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

                {/* NEW: Self-Reported Progress column */}
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

                    {/* NEW: Self-Reported Progress cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {typeof review.selfReportedProgress === 'number' ? (
                        <div className="flex items-center">
                          {/* fixed width so both columns render bars the same size */}
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

                    {/* Progress (Supervisor) cell - match sizing */}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(review.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900 p-1"
                          onClick={() => openDetailsModal(review)}
                          title="View Details"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          onClick={() => openProgressModal(review)}
                          title="Update Progress"
                        >
                          <ListChecks className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 p-1" title="Edit Review">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
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
