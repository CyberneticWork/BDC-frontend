import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Trash2,
  Eye,
  Calendar,
  User,
  Award,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react';
import PMSService from '@services/PMS/PMSService';
import Swal from 'sweetalert2';

const SavedEvaluationsModal = ({ isOpen, onClose }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const perPage = 10;

  // Fetch evaluations
  const fetchEvaluations = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await PMSService.getSavedPerformanceEvaluations({
        page,
        per_page: perPage,
        search
      });
      
      if (response.success) {
        setEvaluations(response.data);
        setTotalPages(response.meta.last_page);
        setTotalItems(response.meta.total);
        setCurrentPage(response.meta.current_page);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load saved evaluations. Please try again.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchEvaluations(1, value);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchEvaluations(page, searchTerm);
  };

  // Handle view details
  const handleViewDetails = async (evaluation) => {
    try {
      const response = await PMSService.getPerformanceEvaluationById(evaluation.id);
      if (response.success) {
        setSelectedEvaluation(response.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching evaluation details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load evaluation details.',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // Handle delete
  const handleDelete = async (evaluation) => {
    const result = await Swal.fire({
      title: 'Delete Performance Evaluation',
      html: `
        <div class="text-left space-y-3">
          <div class="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <User class="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div class="font-semibold text-gray-800">${evaluation.employee_name}</div>
              <div class="text-sm text-gray-600">Attendance No: ${evaluation.employee_attendance_no}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-2 bg-gray-50 rounded-lg">
              <div class="text-lg font-bold text-gray-600">${evaluation.grade}</div>
              <div class="text-xs text-gray-600">${evaluation.performance_label}</div>
            </div>
            <div class="text-center p-2 bg-gray-50 rounded-lg">
              <div class="text-lg font-bold text-gray-600">${evaluation.percentage}%</div>
              <div class="text-xs text-gray-600">Performance Score</div>
            </div>
          </div>
          <div class="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            <strong>Warning:</strong> This action will permanently delete this evaluation record.
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'text-lg font-bold text-red-600'
      }
    });

    if (result.isConfirmed) {
      setDeleting(evaluation.id);
      try {
        await PMSService.deletePerformanceEvaluation(evaluation.id);
        
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Performance evaluation has been deleted successfully.',
          confirmButtonColor: '#10B981',
          timer: 2000,
          timerProgressBar: true
        });
        
        // Refresh the list
        fetchEvaluations(currentPage, searchTerm);
      } catch (error) {
        console.error('Error deleting evaluation:', error);
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: 'Failed to delete the evaluation. Please try again.',
          confirmButtonColor: '#EF4444'
        });
      } finally {
        setDeleting(null);
      }
    }
  };

  // Get grade badge color
  const getGradeBadgeClass = (grade) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-yellow-100 text-yellow-700';
      case 'B-': return 'bg-orange-100 text-orange-800';
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEvaluations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-indigo-600" />
                Saved Performance Evaluations
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                View and manage all saved performance evaluation records
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by employee name, attendance no, evaluator, or grade..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">Loading evaluations...</span>
              </div>
            ) : evaluations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluations Found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No evaluations match your search criteria.' : 'No saved evaluations available.'}
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Evaluator
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tasks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {evaluations.map((evaluation) => (
                        <tr key={evaluation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {evaluation.employee_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Att. No: {evaluation.employee_attendance_no}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {evaluation.evaluator_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <div>{evaluation.start_date}</div>
                              <div className="text-xs">to {evaluation.end_date}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getGradeBadgeClass(evaluation.grade)}`}>
                                {evaluation.grade}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {evaluation.performance_label}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-indigo-600">
                              {evaluation.percentage}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {evaluation.task_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(evaluation.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewDetails(evaluation)}
                                className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-100 rounded"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(evaluation)}
                                disabled={deleting === evaluation.id}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-100 rounded disabled:opacity-50"
                                title="Delete"
                              >
                                {deleting === evaluation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalItems)} of {totalItems} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 2);
                        return page <= totalPages ? (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ) : null;
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedEvaluation && (
        <EvaluationDetailsModal
          evaluation={selectedEvaluation}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEvaluation(null);
          }}
        />
      )}
    </>
  );
};

// Evaluation Details Modal Component
const EvaluationDetailsModal = ({ evaluation, isOpen, onClose }) => {
  if (!isOpen || !evaluation) return null;

  const getGradeBadgeClass = (grade) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-yellow-100 text-yellow-700';
      case 'B-': return 'bg-orange-100 text-orange-800';
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="h-6 w-6 text-indigo-600" />
              Evaluation Details
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Performance evaluation for {evaluation.employee_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Employee</h4>
                  <p className="text-sm text-gray-600">{evaluation.employee_name}</p>
                  <p className="text-xs text-gray-500">Att. No: {evaluation.employee_attendance_no}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Grade</h4>
                  <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getGradeBadgeClass(evaluation.grade)}`}>
                    {evaluation.grade}
                  </span>
                  <p className="text-xs text-gray-500">{evaluation.performance_label}</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-indigo-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Score</h4>
                  <p className="text-lg font-bold text-indigo-600">{evaluation.percentage}%</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Tasks</h4>
                  <p className="text-lg font-bold text-purple-600">{evaluation.task_count}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Evaluation Information */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              Evaluation Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Evaluation Period</label>
                <p className="text-gray-800">{evaluation.start_date} to {evaluation.end_date}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Evaluator</label>
                <p className="text-gray-800">{evaluation.evaluator_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Created Date</label>
                <p className="text-gray-800">{new Date(evaluation.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-gray-800">{new Date(evaluation.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Calculation Details */}
          {evaluation.calculation_details && evaluation.calculation_details.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Task Calculation Details
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supervisor Progress
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Weight
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {evaluation.calculation_details.map((task, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {task.task_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {task.supervisor_progress}%
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {task.total_weight}%
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                          {task.task_score?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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

export default SavedEvaluationsModal;