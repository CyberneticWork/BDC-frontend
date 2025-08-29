import React, { useState } from 'react';
import { 
  Calendar, 
  Filter, 
  Plus, 
  Search, 
  Star, 
  ChevronDown, 
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
  Loader2
} from 'lucide-react';

// Progress Review Modal Component
const ProgressReviewModal = ({ isOpen, onClose, review, onSave }) => {
  const [progress, setProgress] = useState(review?.progress || 0);
  const [grade, setGrade] = useState(review?.grade || '');
  const [comments, setComments] = useState(review?.supervisorComments || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !review) return null;

  // keep only the grades you mentioned
  const gradeOptions = ['A+', 'A', 'B', 'C', 'C-'];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, you would make an API call here
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      onSave({
        ...review,
        progress,
        grade,
        supervisorComments: comments,
        lastUpdated: new Date().toISOString()
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving review:", error);
      alert("Failed to save review");
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
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Progress Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion Progress
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress} 
                onChange={(e) => setProgress(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-sm font-medium text-gray-700 w-12">{progress}%</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  progress < 30 ? 'bg-red-500' : 
                  progress < 70 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
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

          {/* Details Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Review Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Review Type</p>
                <p className="font-medium">{review.type}</p>
              </div>
              <div>
                <p className="text-gray-600">Review Period</p>
                <p className="font-medium">{review.cycle}</p>
              </div>
              <div>
                <p className="text-gray-600">Start Date</p>
                <p className="font-medium">{new Date(review.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Due Date</p>
                <p className="font-medium">{new Date(review.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
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
                  <p className="text-xs text-gray-500">Progress</p>
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
      lastUpdated: "2025-08-12T10:30:00Z"
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
      lastUpdated: "2025-08-20T14:15:00Z"
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
      lastUpdated: null
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
      lastUpdated: "2025-08-10T16:45:00Z"
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
      lastUpdated: "2025-08-18T11:20:00Z"
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

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-gray-600">Manage and track employee performance evaluations</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>New Review</span>
        </button>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
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
    </div>
  );
};

export default PerformanceReviews;
