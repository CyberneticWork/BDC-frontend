import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Search,
  Calendar,
  User,
  Award,
  FileText,
  Eye,
  Trash2,
  RotateCcw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";
import PMSService from "@services/PMS/PMSService";
import Swal from "sweetalert2";

const SavedAppraisalsModal = ({ isOpen, onClose }) => {
  const [appraisals, setAppraisals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Enhanced SweetAlert2 helpers
  const swalToast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 3000,
    customClass: {
      popup: 'rounded-lg shadow-lg border-l-4',
      title: 'text-sm font-semibold',
      content: 'text-sm'
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  // Fetch saved appraisals
  const fetchAppraisals = async (page = 1, search = "") => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search: search.trim()
      };

      const response = await PMSService.getSavedPerformanceAppraisals(params);
      
      if (response?.data) {
        setAppraisals(response.data);
        if (response.meta) {
          setCurrentPage(response.meta.current_page);
          setTotalPages(response.meta.last_page);
          setTotalItems(response.meta.total);
        }
      }
    } catch (error) {
      console.error("Error fetching saved appraisals:", error);
      swalToast.fire({
        icon: 'error',
        title: 'Failed to load saved appraisals'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAppraisals(1, searchTerm);
    } else {
      // Reset state when modal closes
      setAppraisals([]);
      setSearchTerm("");
      setCurrentPage(1);
      setSelectedAppraisal(null);
      setShowDetailModal(false);
    }
  }, [isOpen]);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchAppraisals(1, value);
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchAppraisals(page, searchTerm);
    }
  };

  // Handle view details
  const handleViewDetails = (appraisal) => {
    setSelectedAppraisal(appraisal);
    setShowDetailModal(true);
  };

  // Handle delete appraisal
  const handleDelete = async (appraisal) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Performance Appraisal',
      html: `
        <div class="text-left space-y-3">
          <div class="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <User class="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div class="font-semibold text-gray-800">${appraisal.employee_name}</div>
              <div class="text-sm text-gray-600">Period: ${appraisal.start_date} to ${appraisal.end_date}</div>
            </div>
          </div>
          <p class="text-sm text-gray-600 text-center">This action will move the appraisal to trash. Are you sure?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      customClass: {
        popup: 'rounded-xl shadow-2xl border-0',
        title: 'text-lg font-bold text-gray-800',
        htmlContainer: 'text-sm',
        confirmButton: 'px-6 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg',
        cancelButton: 'px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all duration-200'
      }
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      await PMSService.deletePerformanceAppraisal(appraisal.id);
      
      swalToast.fire({
        icon: 'success',
        title: 'Appraisal deleted successfully'
      });

      // Refresh the list
      fetchAppraisals(currentPage, searchTerm);
    } catch (error) {
      console.error("Error deleting appraisal:", error);
      swalToast.fire({
        icon: 'error',
        title: 'Failed to delete appraisal'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get grade badge class
  const getGradeBadgeClass = (grade) => {
    const gradeColors = {
      'A+': 'bg-green-100 text-green-800 border-green-200',
      'A': 'bg-blue-100 text-blue-800 border-blue-200',
      'B': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'B-': 'bg-orange-100 text-orange-800 border-orange-200',
      'C': 'bg-red-100 text-red-800 border-red-200',
    };
    return gradeColors[grade] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // --- new helper: safely format dates for display ---
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString; // fallback to raw value
    return d.toLocaleDateString();
  };

  const renderPeriod = (start, end) => {
    const s = formatDateForDisplay(start);
    const e = formatDateForDisplay(end);

    if (!s && !e) return "—";
    if (s && e) {
      // if same day, show single date
      if (s === e) return <div>{s}</div>;
      return (
        <>
          <div>{s}</div>
          <div className="text-xs text-gray-500">to {e}</div>
        </>
      );
    }
    return <div>{s || e}</div>;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-purple-500" />
                Saved Performance Appraisals
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                View and manage previously saved performance appraisals
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by employee name, attendance no, or grade..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Total: {totalItems} appraisals</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="ml-2 text-gray-600">Loading appraisals...</span>
              </div>
            ) : appraisals.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Appraisals Found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No appraisals match your search criteria.' : 'No saved appraisals available.'}
                </p>
              </div>
            ) : (
              <>
                {/* Appraisals Grid */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appraiser</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appraisals.map((appraisal) => (
                        <tr key={appraisal.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{appraisal.employee_name}</div>
                              <div className="text-sm text-gray-500">Att. No: {appraisal.employee_attendance_no || appraisal.employee_attendance_no}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {appraisal.appraiser_name || appraisal.appraiser?.name || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderPeriod(appraisal.start_date, appraisal.end_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getGradeBadgeClass(appraisal.grade)}`}>
                                {appraisal.grade}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">{appraisal.performance_label}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-purple-600">{appraisal.percentage}%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appraisal.task_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(appraisal.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewDetails(appraisal)}
                                className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(appraisal)}
                                disabled={isDeleting}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded disabled:opacity-50"
                                title="Delete"
                              >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-md ${
                                currentPage === page
                                  ? 'bg-purple-600 text-white'
                                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        {totalPages > 5 && (
                          <>
                            <span className="px-2 text-gray-500">...</span>
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className={`px-3 py-2 text-sm font-medium rounded-md ${
                                currentPage === totalPages
                                  ? 'bg-purple-600 text-white'
                                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages} ({totalItems} total)
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAppraisal && (
        <AppraisalDetailModal
          appraisal={selectedAppraisal}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAppraisal(null);
          }}
        />
      )}
    </>
  );
};

// Detail Modal Component
const AppraisalDetailModal = ({ appraisal, isOpen, onClose }) => {
  if (!isOpen || !appraisal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Appraisal Details</h2>
            <p className="text-gray-600 text-sm mt-1">
              {appraisal.employee_name} • {appraisal.start_date} to {appraisal.end_date}
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
        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-800">Self Rating</h4>
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{appraisal.employee_self_rating}%</div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-green-800">Supervisor Rating</h4>
                <Award className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{appraisal.supervisor_rating}%</div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-purple-800">Final Score</h4>
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{appraisal.percentage}%</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-800">Grade</h4>
                <Award className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-600">{appraisal.grade}</div>
            </div>
          </div>

          {/* Calculation Details */}
          {appraisal.calculation_details && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Self Rating</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supervisor Rating</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appraisal.calculation_details.map((task, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{task.task_name}</td>
                        <td className="px-4 py-2 text-sm text-blue-600">{task.employee_self_rating}%</td>
                        <td className="px-4 py-2 text-sm text-green-600">{task.supervisor_rating}%</td>
                        <td className="px-4 py-2 text-sm font-medium text-purple-600">
                          {((task.employee_self_rating + task.supervisor_rating) / 2).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Label</h4>
              <p className="text-gray-900">{appraisal.performance_label}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tasks Evaluated</h4>
              <p className="text-gray-900">{appraisal.task_count} tasks</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Appraiser</h4>
              <p className="text-gray-900">{appraisal.appraiser_name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                appraisal.status === 'Completed' ? 'bg-green-100 text-green-800' :
                appraisal.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {appraisal.status}
              </span>
            </div>
          </div>

          {/* Comments */}
          {(appraisal.supervisor_comments || appraisal.employee_comments) && (
            <div className="mt-6 space-y-4">
              {appraisal.supervisor_comments && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Supervisor Comments</h4>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{appraisal.supervisor_comments}</p>
                </div>
              )}
              {appraisal.employee_comments && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Employee Comments</h4>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{appraisal.employee_comments}</p>
                </div>
              )}
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

export default SavedAppraisalsModal;