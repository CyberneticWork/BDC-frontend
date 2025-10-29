import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, 
  Search, 
  Download, 
  Filter, 
  CheckCircle, 
  User, 
  BarChart2,
  ArrowUpRight, 
  X,
  Loader2,
  ChevronDown,
  FileText,
  Award,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  TrendingUp,
  Target,
  Check,
  Square,
  Building2,
  Layers
} from "lucide-react";
import PMSService from "@services/PMS/PMSService";
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import SavedAppraisalsModal from './SavedAppraisalsModal';

const PerformanceAppraisal = () => {
  // Enhanced SweetAlert2 helpers with professional styling
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

  const swalSmallModal = (options) =>
    Swal.fire({
      width: 450,
      showCloseButton: true,
      customClass: {
        popup: 'rounded-xl shadow-2xl border-0',
        title: 'text-lg font-bold text-gray-800',
        content: 'text-sm text-gray-600',
        confirmButton: 'px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg',
        cancelButton: 'px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all duration-200'
      },
      ...options
    });

  // States for filtering and data
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [employees, setEmployees] = useState([]);
  const [employeesWithTasks, setEmployeesWithTasks] = useState({});
  const [appraisalResults, setAppraisalResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDetails, setViewDetails] = useState({});
  const [showSavedAppraisalsModal, setShowSavedAppraisalsModal] = useState(false);
  
  // NEW: Selection states for bulk save functionality
  const [selectedAppraisals, setSelectedAppraisals] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Add new states for company and department filtering
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  
  // Pagination (server + client fallback)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [serverPaginated, setServerPaginated] = useState(false);

  // Add state for validation errors
  const [validationErrors, setValidationErrors] = useState({
    startDate: false,
    endDate: false
  });

  // Add state to track if user has attempted to submit/interact
  const [hasAttempted, setHasAttempted] = useState(false);

  // Search loading + debounce ref
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef(null);

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const companiesData = await PMSService.getCompanies();
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
      } catch (error) {
        console.error("Error loading companies:", error);
        swalToast.fire({
          icon: 'error',
          title: 'Failed to load companies'
        });
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch departments when company is selected
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!selectedCompany) {
        setDepartments([]);
        setSelectedDepartment("");
        return;
      }

      setIsLoadingDepartments(true);
      try {
        const departmentsData = await PMSService.getDepartmentsByCompany(selectedCompany);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
        setSelectedDepartment(""); // Reset department selection when company changes
      } catch (error) {
        console.error("Error loading departments:", error);
        setDepartments([]);
        swalToast.fire({
          icon: 'error',
          title: 'Failed to load departments'
        });
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [selectedCompany]);

  // Fetch employees on mount (initial list)
  useEffect(() => {
    const fetchInitialEmployees = async () => {
      try {
        let employeeData;
        
        // If company is selected, fetch employees by company/department
        if (selectedCompany) {
          employeeData = await PMSService.getEmployeesByCompany(
            selectedCompany,
            selectedDepartment || null,
            ""
          );
        } else {
          // Fall back to all employees
          employeeData = await PMSService.getAllEmployees();
        }
        
        const employeeList = Array.isArray(employeeData) ? employeeData : (employeeData?.data ?? []);
        setEmployees(employeeList);
        await fetchEmployeesWithTasks(employeeList);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
      }
    };

    fetchInitialEmployees();
  }, [selectedCompany, selectedDepartment]); // Add dependencies

  // Fetch which employees have tasks assigned
  const fetchEmployeesWithTasks = async (empList) => {
    try {
      const taskChecks = {};
      
      for (const emp of empList) {
        try {
          const assignments = await PMSService.getEmployeeKpiTaskAssignments(emp.id);
          taskChecks[emp.id] = Array.isArray(assignments) ? assignments.length > 0 : false;
        } catch (error) {
          taskChecks[emp.id] = false;
        }
      }
      
      setEmployeesWithTasks(taskChecks);
    } catch (error) {
      console.error("Error checking employee tasks:", error);
      setEmployeesWithTasks({});
    }
  };

  // NEW: Reset selection when results change
  useEffect(() => {
    setSelectedAppraisals(new Set());
    setSelectAll(false);
  }, [appraisalResults]);

  // Debounced search handler - now filters client-side only
  const handleSearchChange = (e) => {
    const val = e.target.value || "";
    setSearchTerm(val);
    // Clear selection when user types (same behavior as EmployeeEvaluation)
    setSelectedEmployee("");
    setSelectedEmployeeName("");
    setSearchLoading(false); // no backend call here, so disable loading
  };

  // Filter employees client-side as a fallback: match name, id or attendance no
  const filteredEmployees = (employees || []).filter(emp => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      emp.full_name?.toLowerCase().includes(search) ||
      emp.id?.toString().includes(search) ||
      emp.attendance_employee_no?.toLowerCase().includes(search)
    );
  }).sort((a, b) => {
    const aHasTasks = employeesWithTasks[a.id] || false;
    const bHasTasks = employeesWithTasks[b.id] || false;
    if (aHasTasks === bHasTasks) {
      return a.full_name?.localeCompare(b.full_name) || 0;
    }
    return bHasTasks - aHasTasks; // Employees with tasks first
  });

  // Function to get grade from percentage
  const getGrade = (percentage) => {
    if (percentage >= 81) return { grade: "A+", label: "Excellent" };
    if (percentage >= 61) return { grade: "A", label: "Above Average" };
    if (percentage >= 41) return { grade: "B", label: "Average" };
    if (percentage >= 21) return { grade: "B-", label: "Below Average" };
    return { grade: "C", label: "Poor Performance" };
  };
  
  // Fetch a page of appraisal results (server-side pagination if available)
  const fetchAppraisalsPage = async (page = 1) => {
    setIsLoading(true);
    try {
      const requestData = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        employee_id: selectedEmployee || undefined,
        company_id: selectedCompany || undefined,
        department_id: selectedDepartment || undefined,
        page,
        per_page: itemsPerPage
      };
      
      const response = await PMSService.calculatePerformanceAppraisal(requestData);
      
      // Backend paginated response (common Laravel structure)
      if (response?.data && (response.data.data || response.data.meta || response.data.current_page)) {
        const pageData = response.data.data ?? response.data;
        setAppraisalResults(Array.isArray(pageData) ? pageData : []);
        const lastPage = response.data.last_page ?? response.data.meta?.last_page ?? Math.max(1, Math.ceil((response.data.total ?? pageData.length) / itemsPerPage));
        const total = response.data.total ?? (Array.isArray(response.data) ? response.data.length : pageData.length);
        setTotalPages(lastPage);
        setTotalItems(total);
        setCurrentPage(Number(page));
        setServerPaginated(true);
      } else if (Array.isArray(response.data)) {
        // Fallback: server returned all results, use client-side pagination
        setAppraisalResults(response.data);
        setServerPaginated(false);
        setTotalItems(response.data.length);
        setTotalPages(Math.max(1, Math.ceil(response.data.length / itemsPerPage)));
        setCurrentPage(1);
      } else {
        // No data
        setAppraisalResults([]);
        setTotalItems(0);
        setTotalPages(1);
        setCurrentPage(1);
        setServerPaginated(false);
      }
    } catch (error) {
      console.error("Error fetching appraisal page:", error);
      // keep UI stable
    } finally {
      setIsLoading(false);
    }
  };

  // Handle evaluate button click
  const handleEvaluate = async () => {
    setHasAttempted(true); // Mark that user has attempted to evaluate
    
    // Validate inputs
    const errors = {
      startDate: !dateRange.startDate,
      endDate: !dateRange.endDate
    };
    
    setValidationErrors(errors);
    
    if (!dateRange.startDate || !dateRange.endDate) {
      // Enhanced warning toast with better styling
      await Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select both start and end dates to calculate performance appraisal.',
        confirmButtonColor: '#F59E0B',
        confirmButtonText: 'Got it',
        customClass: {
          popup: 'rounded-xl shadow-2xl',
          title: 'text-lg font-bold text-orange-600',
          confirmButton: 'px-4 py-2 rounded-lg font-semibold'
        }
      });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use fetchAppraisalsPage to support page-wise retrieval
      await fetchAppraisalsPage(1);
      
      // Enhanced success notification
      if ((appraisalResults && appraisalResults.length > 0) || totalItems > 0) {
        // Build filter info for success message
        const filterInfo = [];
        if (selectedCompany) {
          const companyName = companies.find(c => c.id.toString() === selectedCompany.toString())?.name || 'Selected Company';
          filterInfo.push(`Company: ${companyName}`);
        }
        if (selectedDepartment) {
          const departmentName = departments.find(d => d.id.toString() === selectedDepartment.toString())?.name || 'Selected Department';
          filterInfo.push(`Department: ${departmentName}`);
        }
        
        await Swal.fire({
          icon: 'success',
          title: 'Appraisal Calculated!',
          html: `
            <div class="text-left space-y-2">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span><strong>${appraisalResults.length}</strong> employee(s) appraised</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span><strong>${(appraisalResults.reduce ? appraisalResults.reduce((sum, r) => sum + (r.task_count || 0), 0) : totalItems)}</strong> tasks analyzed</span>
              </div>
              ${filterInfo.length > 0 ? `
                <div class="mt-2 p-2 bg-blue-50 rounded-lg text-xs">
                  <div class="font-medium text-blue-800 mb-1">Filters Applied:</div>
                  ${filterInfo.map(info => `<div class="text-blue-700">${info}</div>`).join('')}
                </div>
              ` : ''}
              <div class="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                Date Range: ${dateRange.startDate} → ${dateRange.endDate}
              </div>
            </div>
          `,
          confirmButtonColor: '#10B981',
          confirmButtonText: 'View Results',
          customClass: {
            popup: 'rounded-xl shadow-2xl',
            title: 'text-lg font-bold text-green-600'
          }
        });
      }
    } catch (error) {
      console.error("Error calculating performance appraisal:", error);
      setAppraisalResults([]);
      
      // Enhanced error modal with better error handling
      let errorTitle = 'Calculation Failed';
      let errorMessage = 'An unexpected error occurred while calculating performance appraisal. Please try again.';
      let errorDetails = '';
      
      if (error.response?.status === 422) {
        errorTitle = 'Validation Error';
        errorMessage = 'The provided data did not pass validation.';
        if (error.response.data?.errors) {
          const errors = Object.values(error.response.data.errors).flat();
          errorDetails = errors.join('<br>');
        }
      } else if (error.response?.status === 500) {
        errorTitle = 'Server Error';
        errorMessage = 'A server error occurred. Please contact support if the problem persists.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      await Swal.fire({
        icon: 'error',
        title: errorTitle,
        html: `
          <div class="text-left">
            <p class="text-gray-700 mb-3">${errorMessage}</p>
            ${errorDetails ? `<div class="bg-red-50 p-3 rounded-lg text-sm text-red-700">${errorDetails}</div>` : ''}
          </div>
        `,
        confirmButtonColor: '#EF4444',
        customClass: {
          popup: 'rounded-xl shadow-2xl',
          title: 'text-lg font-bold text-red-600'
        }
      });
    } finally {
      // no-op: fetchAppraisalsPage handles loading state
    }
  };

  // NEW: Handle individual checkbox selection
  const handleSelectAppraisal = (appraisalId, isChecked) => {
    const newSelected = new Set(selectedAppraisals);
    if (isChecked) {
      newSelected.add(appraisalId);
    } else {
      newSelected.delete(appraisalId);
    }
    setSelectedAppraisals(newSelected);
    
    // Update select all state
    setSelectAll(newSelected.size === paginatedResults.length && paginatedResults.length > 0);
  };

  // NEW: Handle select all functionality
  const handleSelectAll = (isChecked) => {
    setSelectAll(isChecked);
    if (isChecked) {
      const allIds = new Set(paginatedResults.map(result => result.employee_id));
      setSelectedAppraisals(allIds);
    } else {
      setSelectedAppraisals(new Set());
    }
  };

  // NEW: Handle bulk save of selected appraisals
  const handleBulkSave = async () => {
    if (selectedAppraisals.size === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select at least one appraisal to save.',
        confirmButtonColor: '#F59E0B',
        customClass: {
          popup: 'rounded-xl shadow-2xl',
          title: 'text-lg font-bold text-orange-600'
        }
      });
      return;
    }

    const selectedData = paginatedResults.filter(result =>
      selectedAppraisals.has(result.employee_id)
    );

    const result = await Swal.fire({
      icon: 'question',
      title: 'Save Selected Appraisals',
      html: `
        <div class="text-left space-y-3">
          <div class="p-3 bg-blue-50 rounded-lg">
            <div class="font-semibold text-gray-800">Selected Appraisals: ${selectedData.length}</div>
            <div class="text-sm text-gray-600 mt-1">
              ${selectedData.map(item => item.employee_name).join(', ')}
            </div>
          </div>
          <div class="text-sm text-gray-600 text-center">
            Do you want to save all selected performance appraisals?
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `Save ${selectedData.length} Appraisal${selectedData.length > 1 ? 's' : ''}`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      customClass: {
        popup: 'rounded-xl shadow-2xl border-0',
        title: 'text-lg font-bold text-gray-800',
        htmlContainer: 'text-sm',
        confirmButton: 'px-6 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-green-600',
        cancelButton: 'px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200'
      }
    });

    if (!result.isConfirmed) return;

    setIsSaving(true);
    try {
      const bulkData = selectedData.map(appraisalResult => ({
        employee_id: parseInt(appraisalResult.employee_id, 10),
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        employee_self_rating: parseInt(appraisalResult.employee_self_rating, 10),
        supervisor_rating: parseInt(appraisalResult.supervisor_rating, 10),
        average_rating: parseFloat(appraisalResult.average_rating),
        percentage: parseInt(appraisalResult.percentage, 10),
        grade: appraisalResult.grade,
        performance_label: appraisalResult.performance_label,
        calculation_details: appraisalResult.tasks || [],
        task_count: parseInt(appraisalResult.task_count, 10)
      }));

      // IMPORTANT: pass the array (PMSService will wrap into { appraisals: [...] } )
      const response = await PMSService.savePerformanceAppraisalsBulk(bulkData);

      // normalize response
      const respData = response?.data ?? response;
      setSelectedAppraisals(new Set());
      setSelectAll(false);

      await Swal.fire({
        icon: 'success',
        title: respData?.message ?? 'Saved',
        html: respData?.message ? '' : `<div>${(respData?.saved_count ?? bulkData.length)} appraisal(s) saved.</div>`,
        timer: 2200,
        showConfirmButton: false,
        customClass: { popup: 'rounded-xl shadow-2xl' }
      });

      // refresh current page results (recalculate or refetch)
      await fetchAppraisalsPage(currentPage);

    } catch (error) {
      console.error("Error saving bulk appraisals:", error);

      // Extract validation details if available
      let title = 'Save Failed';
      let html = '';
      if (error.response) {
        if (error.response.status === 422) {
          title = 'Validation Error';
          const errs = error.response.data?.errors ?? error.response.data;
          if (errs && typeof errs === 'object') {
            html = '<div class="text-left">';
            Object.entries(errs).forEach(([k, v]) => {
              const msg = Array.isArray(v) ? v.join(', ') : v;
              html += `<div class="text-sm text-red-600 mb-1"><strong>${k}:</strong> ${msg}</div>`;
            });
            html += '</div>';
          } else if (error.response.data?.message) {
            html = `<div class="text-sm text-red-600">${error.response.data.message}</div>`;
          }
        } else if (error.response.data?.message) {
          html = `<div class="text-sm text-red-600">${error.response.data.message}</div>`;
        }
      } else {
        html = `<div class="text-sm text-red-600">${error.message}</div>`;
      }

      await Swal.fire({
        icon: 'error',
        title,
        html,
        confirmButtonColor: '#EF4444',
        customClass: { popup: 'rounded-xl shadow-2xl' }
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save appraisal button click (individual save - keep existing functionality)
  const handleSaveAppraisal = async (appraisalResult) => {
    // Enhanced confirmation modal
    const result = await Swal.fire({
      icon: 'question',
      title: 'Save Performance Appraisal',
      html: `
        <div class="text-left space-y-3">
          <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div class="font-semibold text-gray-800">${appraisalResult.employee_name}</div>
              <div class="text-sm text-gray-600">Attendance No: ${appraisalResult.attendance_no}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-2 bg-green-50 rounded-lg">
              <div class="text-lg font-bold text-green-600">${appraisalResult.grade}</div>
              <div class="text-xs text-gray-600">${appraisalResult.performance_label}</div>
            </div>
            <div class="text-center p-2 bg-indigo-50 rounded-lg">
              <div class="text-lg font-bold text-indigo-600">${appraisalResult.percentage}%</div>
              <div class="text-xs text-gray-600">Final Score</div>
            </div>
          </div>
          <p class="text-sm text-gray-600 text-center">Do you want to save this performance appraisal?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Appraisal',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      customClass: {
        popup: 'rounded-xl shadow-2xl border-0',
        title: 'text-lg font-bold text-gray-800',
        htmlContainer: 'text-sm',
        confirmButton: 'px-6 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-green-600',
        cancelButton: 'px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200'
      }
    });

    if (!result.isConfirmed) return;
    
    setIsSaving(true);
    try {
      if (!appraisalResult.employee_id || !appraisalResult.tasks || !Array.isArray(appraisalResult.tasks)) {
        await Swal.fire({
          icon: 'error',
          title: 'Invalid Data',
          text: 'Invalid appraisal data detected. Please recalculate the performance appraisal and try again.',
          confirmButtonColor: '#EF4444',
          customClass: {
            popup: 'rounded-xl shadow-2xl',
            title: 'text-lg font-bold text-red-600'
          }
        });
        return;
      }

      const saveData = {
        employee_id: parseInt(appraisalResult.employee_id),
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        employee_self_rating: parseInt(appraisalResult.employee_self_rating),
        supervisor_rating: parseInt(appraisalResult.supervisor_rating),
        average_rating: parseFloat(appraisalResult.average_rating),
        percentage: parseInt(appraisalResult.percentage),
        grade: appraisalResult.grade,
        performance_label: appraisalResult.performance_label,
        calculation_details: appraisalResult.tasks,
        task_count: parseInt(appraisalResult.task_count)
      };
      
      const response = await PMSService.savePerformanceAppraisal(saveData);
      
      // Handle different response types
      const action = response.action || 'saved';
      let successTitle = 'Appraisal Saved!';
      let successMessage = `Performance appraisal for <strong>${appraisalResult.employee_name}</strong> has been saved successfully.`;
      
      if (action === 'updated') {
        successTitle = 'Appraisal Updated!';
        successMessage = `Performance appraisal for <strong>${appraisalResult.employee_name}</strong> has been updated successfully (data was different from existing record).`;
      } else if (action === 'restored_and_updated') {
        successTitle = 'Appraisal Restored!';
        successMessage = `Performance appraisal for <strong>${appraisalResult.employee_name}</strong> has been restored from deleted records and updated.`;
      }
      
      // Enhanced success toast with animation
      await Swal.fire({
        icon: 'success',
        title: successTitle,
        html: `
          <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle class="w-8 h-8 text-green-600" />
            </div>
            <p class="text-gray-700">${successMessage}</p>
            <p class="text-sm text-gray-500 mt-2">The appraisal is now stored in the system.</p>
          </div>
        `,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'Great!',
        timer: 4000,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-xl shadow-2xl border-0',
          title: 'text-lg font-bold text-green-600'
        }
      });
    } catch (error) {
      console.error("Error saving appraisal:", error);
      
      let errorMessage = 'Failed to save the performance appraisal. Please try again.';
      
      // Handle specific error types
      if (error.response?.status === 409 && error.response?.data?.error_type === 'duplicate_data') {
        const existingDate = error.response.data.existing_created_at;
        await Swal.fire({
          icon: 'warning',
          title: 'Duplicate Appraisal',
          html: `
            <div class="text-left">
              <p class="text-gray-700 mb-3">An identical performance appraisal already exists for <strong>${appraisalResult.employee_name}</strong> for this date range.</p>
              <div class="bg-yellow-50 p-3 rounded-lg text-sm">
                <div class="font-medium text-yellow-800">Existing Record Details:</div>
                <div class="text-yellow-700 mt-1">Created: ${new Date(existingDate).toLocaleString()}</div>
                <div class="text-yellow-700">Same data, grades, and calculations</div>
              </div>
              <p class="text-gray-600 mt-3 text-sm">No changes were made since the data is identical.</p>
            </div>
          `,
          confirmButtonColor: '#F59E0B',
          customClass: {
            popup: 'rounded-xl shadow-2xl',
            title: 'text-lg font-bold text-yellow-600'
          }
        });
        return;
      }
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: errorMessage,
        confirmButtonColor: '#EF4444',
        customClass: {
          popup: 'rounded-xl shadow-2xl',
          title: 'text-lg font-bold text-red-600'
        }
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle export to PDF/Excel (stub for now)
  const handleExport = () => {
    swalToast.fire({
      icon: 'info',
      title: 'Export feature coming soon!',
    });
  };
  
  // Get grade badge color
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

  // Toggle view details for specific employee
  const toggleViewDetails = (employeeId) => {
    setViewDetails(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  // Pagination logic (client fallback if serverPaginated is false)
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const clientPaginatedResults = appraisalResults.slice(startIndex, endIndex);
  const paginatedResults = serverPaginated ? appraisalResults : clientPaginatedResults;

  const handlePageChange = async (page) => {
    if (page < 1) return;
    if (serverPaginated) {
      await fetchAppraisalsPage(page);
    } else {
      setCurrentPage(page);
    }
  };

  // Update the date input handlers to clear validation errors
  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setDateRange({...dateRange, startDate: value});
    
    // Clear validation error when user provides input
    if (value && validationErrors.startDate) {
      setValidationErrors(prev => ({...prev, startDate: false}));
    }
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setDateRange({...dateRange, endDate: value});
    
    // Clear validation error when user provides input
    if (value && validationErrors.endDate) {
      setValidationErrors(prev => ({...prev, endDate: false}));
    }
  };

  // Update the handleClearFilters function
  const handleClearFilters = () => {
    setDateRange({ startDate: "", endDate: "" });
    setSelectedEmployee("");
    setSelectedEmployeeName("");
    setSearchTerm("");
    setSelectedCompany("");
    setSelectedDepartment("");
    setAppraisalResults([]);
    setValidationErrors({ startDate: false, endDate: false });
    setHasAttempted(false);
    setCurrentPage(1);
    setSelectedAppraisals(new Set());
    setSelectAll(false);
    
    // Success toast
    swalToast.fire({
      icon: 'success',
      title: 'Filters cleared!',
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              Performance Appraisal
            </h1>
            <p className="text-gray-600 mt-2">
              Calculate and grade employee performance appraisal using self-rating and supervisor rating
            </p>
          </div>
          
          <button
            onClick={() => setShowSavedAppraisalsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Saved Appraisals</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* First Row - Company and Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Company Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="appearance-none w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                disabled={isLoadingCompanies}
              >
                <option value="">All Companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {isLoadingCompanies && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              )}
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Layers className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="appearance-none w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                disabled={!selectedCompany || isLoadingDepartments}
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {isLoadingDepartments && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              )}
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            {!selectedCompany && (
              <p className="mt-1 text-xs text-gray-500">Select a company first to choose department</p>
            )}
          </div>
        </div>

        {/* Second Row - Date Range and Employee */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={handleStartDateChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  validationErrors.startDate && hasAttempted ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Start Date"
              />
              {validationErrors.startDate && hasAttempted && (
                <p className="mt-1 text-xs text-red-600">Start date is required</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={handleEndDateChange}
                min={dateRange.startDate}
                className={`block w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  validationErrors.endDate && hasAttempted ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="End Date"
              />
              {validationErrors.endDate && hasAttempted && (
                <p className="mt-1 text-xs text-red-600">End date is required</p>
              )}
            </div>
          </div>

          {/* Employee Selection (matching EmployeeEvaluation UI) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, ID or attendance no"
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {selectedEmployee && (
                <button
                  onClick={() => {
                    setSelectedEmployee("");
                    setSelectedEmployeeName("");
                    setSearchTerm("");
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            
            {searchTerm && !selectedEmployee && (
              <div className="mt-2 max-h-60 overflow-auto border border-gray-100 rounded-lg bg-white shadow-sm absolute z-10 w-full md:max-w-[300px]">
                {searchLoading ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Searching...
                  </div>
                ) : filteredEmployees.length > 0 ? (
                  <>
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                      {employeesWithTasks && Object.keys(employeesWithTasks).length > 0 ? 
                        "Employees with tasks are highlighted" : 
                        "Showing all employees matching search"}
                      {selectedCompany && (
                        <span className="block mt-1 text-purple-600">
                          Filtered by: {companies.find(c => c.id.toString() === selectedCompany.toString())?.name}
                          {selectedDepartment && (
                            <span> → {departments.find(d => d.id.toString() === selectedDepartment.toString())?.name}</span>
                          )}
                        </span>
                      )}
                    </div>
                    {filteredEmployees.map(emp => {
                      const hasAssignedTasks = (employeesWithTasks[emp.id] || employeesWithTasks[emp.attendance_employee_no] || 0) > 0;
                      const taskCount = employeesWithTasks[emp.id] || employeesWithTasks[emp.attendance_employee_no] || 0;
                      
                      return (
                        <div 
                          key={emp.id} 
                          className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                            hasAssignedTasks ? 'bg-green-50' : ''
                          }`}
                          onClick={() => {
                            setSelectedEmployee(emp.id);
                            setSelectedEmployeeName(emp.full_name || emp.name);
                            setSearchTerm(emp.full_name || emp.name);
                          }}
                        >
                          <div>
                            <div className="text-sm font-medium flex items-center">
                              {emp.full_name || emp.name}
                              {hasAssignedTasks && (
                                <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                                  <ClipboardCheck className="w-3 h-3 mr-1" />
                                  {taskCount}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {emp.id} • {emp.attendance_employee_no || emp.attendanceNo || ""}
                              {emp.department && <span> • {emp.department}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="p-3 text-center text-sm text-gray-500">No employees found matching your search</div>
                )}
              </div>
            )}
            
            {selectedEmployee && (
              <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-sm font-medium text-purple-900">Selected: {selectedEmployeeName}</div>
                <div className="text-xs text-purple-600">ID: {selectedEmployee}</div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Summary */}
        {(selectedCompany || selectedDepartment) && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm text-purple-800">
              <span className="font-medium">Active Filters:</span>
              {selectedCompany && (
                <span className="ml-2">
                  Company: {companies.find(c => c.id.toString() === selectedCompany.toString())?.name}
                </span>
              )}
              {selectedDepartment && (
                <span className="ml-2">
                  • Department: {departments.find(d => d.id.toString() === selectedDepartment.toString())?.name}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Date range presets removed as requested */}
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleEvaluate}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <BarChart2 className="h-4 w-4" />
                <span>Calculate Appraisal</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Results Section */}
      {appraisalResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Appraisal Results ({appraisalResults.length} employee{appraisalResults.length !== 1 ? 's' : ''})
            </h2>
            
            {/* NEW: Selection controls */}
            <div className="flex items-center gap-4">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                  Select All
                </label>
              </div>

              {/* Selected count and bulk save button */}
              {selectedAppraisals.size > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {selectedAppraisals.size} selected
                  </span>
                  <button
                    onClick={handleBulkSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="h-4 w-4" />
                        <span>Save Selected ({selectedAppraisals.size})</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              {totalPages > 1 && (
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1}-{Math.min(endIndex, appraisalResults.length)} of {appraisalResults.length}
                </div>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-6">
            {paginatedResults.map((appraisalResult, index) => (
              <div key={`${appraisalResult.employee_id}-${index}`} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                {/* Employee Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* NEW: Selection checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedAppraisals.has(appraisalResult.employee_id)}
                      onChange={(e) => handleSelectAppraisal(appraisalResult.employee_id, e.target.checked)}
                      className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{appraisalResult.employee_name}</h3>
                      <p className="text-sm text-gray-500">ID: {appraisalResult.attendance_no}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleViewDetails(appraisalResult.employee_id)}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                    >
                      {viewDetails[appraisalResult.employee_id] ? 'Hide Details' : 'View Details'}
                    </button>
                    
                    <button
                      onClick={() => handleSaveAppraisal(appraisalResult)}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="h-4 w-4" />
                          <span>Save Appraisal</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* Self Rating Card */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-medium text-gray-600">Total Self Rating</h4>
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-xl font-bold text-blue-600 mb-1">{appraisalResult.employee_self_rating} pts</div>
                    <div className="text-xs text-gray-500">Sum of all self ratings (1–5 scale)</div>
                  </div>

                  {/* Supervisor Rating Card */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-medium text-gray-600">Total Supervisor Rating</h4>
                      <UserCheck className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-xl font-bold text-green-600 mb-1">{appraisalResult.supervisor_rating} pts</div>
                    <div className="text-xs text-gray-500">Sum of all supervisor ratings (1–5 scale)</div>
                  </div>

                  {/* Grade Card */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-medium text-gray-600">Final Grade</h4>
                      <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getGradeBadgeClass(appraisalResult.grade)}`}>
                        {appraisalResult.grade}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mb-1">{appraisalResult.performance_label}</div>
                    <div className="text-xs text-gray-500">
                      Based on combined rating-points
                    </div>
                  </div>
                  
                  {/* Percentage Card */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Final Score</h4>
                    <div className="flex items-center gap-2">
                      <div className="text-xl font-bold text-purple-600">{appraisalResult.percentage}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            (appraisalResult.percentage || 0) < 30 ? 'bg-red-500' : 
                            (appraisalResult.percentage || 0) < 60 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${appraisalResult.percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Formula: (Combined Average in points ÷ {appraisalResult.dividend || (appraisalResult.task_count * 5)} points) × 100
                    </div>
                  </div>

                  {/* Task Summary Card */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 md:col-span-4">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Task Summary</h4>
                    <div className="flex items-center gap-6 text-sm flex-wrap">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">
                          <strong>{appraisalResult.task_count}</strong> tasks completed
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-700">
                          Total Self Rating: <strong>{appraisalResult.employee_self_rating} pts</strong>
                          <span className="text-xs text-gray-500 ml-2">(max {appraisalResult.task_count * 5} pts)</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-400" />
                        <span className="text-gray-700">
                          Total Supervisor Rating: <strong>{appraisalResult.supervisor_rating} pts</strong>
                          <span className="text-xs text-gray-500 ml-2">(max {appraisalResult.task_count * 5} pts)</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-700">
                          Combined Average: <strong>{appraisalResult.average_rating} pts</strong>
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        Period: {dateRange.startDate} to {dateRange.endDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Calculation (Collapsible) */}
                {viewDetails[appraisalResult.employee_id] && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Calculation Details for {appraisalResult.employee_name}</h4>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Task
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Employee Self Rating
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Supervisor Rating
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Task Average (points)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {appraisalResult.tasks.map((task, taskIndex) => (
                            <tr key={taskIndex}>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {task.task_name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-blue-600">
                                {task.employee_self_rating}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-green-600">
                                {task.supervisor_rating}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-purple-600">
                                {(((task.employee_self_rating || 0) + (task.supervisor_rating || 0)) / 2).toFixed(1)} pts
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-blue-50">
                            <td colSpan="3" className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                              Total Self Rating:
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-blue-600">
                              {appraisalResult.employee_self_rating} pts
                            </td>
                          </tr>
                          <tr className="bg-green-50">
                            <td colSpan="3" className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                              Total Supervisor Rating:
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-green-600">
                              {appraisalResult.supervisor_rating} pts
                            </td>
                          </tr>
                          <tr className="bg-purple-50">
                            <td colSpan="3" className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                              Combined Average (points) = (Total Self + Total Supervisor) ÷ 2:
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-purple-600">
                              {appraisalResult.average_rating} pts
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td colSpan="3" className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                              Final Percentage = (Average (pts) ÷ {appraisalResult.dividend || (appraisalResult.task_count * 5)} pts) × 100:
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-indigo-600">
                              {appraisalResult.percentage}%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Add formula explanation */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h5 className="text-xs font-semibold text-blue-800 mb-2">Updated Calculation Formula:</h5>
                      <div className="space-y-1 text-xs text-blue-700">
                        <div>1. Sum all self ratings: {appraisalResult.tasks?.map(t => t.employee_self_rating).join(' + ')} = {appraisalResult.employee_self_rating} pts</div>
                        <div>2. Sum all supervisor ratings: {appraisalResult.tasks?.map(t => t.supervisor_rating).join(' + ')} = {appraisalResult.supervisor_rating} pts</div>
                        <div>3. Combined Average: ({appraisalResult.employee_self_rating} + {appraisalResult.supervisor_rating}) ÷ 2 = {appraisalResult.average_rating} pts</div>
                        <div>4. Final Percentage: ({appraisalResult.average_rating} ÷ {appraisalResult.dividend || (appraisalResult.task_count * 5)} pts) × 100 = {appraisalResult.percentage}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          { (serverPaginated ? totalPages > 1 : Math.ceil((appraisalResults.length || 0) / itemsPerPage) > 1) && (
             <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
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
                  {Array.from({ length: serverPaginated ? totalPages : Math.max(1, Math.ceil((appraisalResults.length || 0) / itemsPerPage)) }, (_, i) => i + 1).map((page) => (
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
                   ))}
                 </div>
                 
                 <button
                   onClick={() => handlePageChange(currentPage + 1)}
                   disabled={currentPage === (serverPaginated ? totalPages : Math.max(1, Math.ceil((appraisalResults.length || 0) / itemsPerPage)))}
                   className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Next
                   <ChevronRight className="h-4 w-4" />
                 </button>
               </div>
               
              <div className="text-sm text-gray-500">
                Page {currentPage} of {serverPaginated ? totalPages : Math.max(1, Math.ceil((appraisalResults.length || 0) / itemsPerPage))}
              </div>
             </div>
           )}
         </div>
       )}

      {/* Performance Scale Reference */}
      {appraisalResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            Performance Grading Scale
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage Range
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                    A+
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    Excellent - Consistently superior performance
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    81% - 100%
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                    A
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    Above Average - Performance is regularly above expectations
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    61% - 80%
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                    B
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    Average - Performance is acceptable on all counts
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    41% - 60%
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                    B-
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    Below Average - Some competency issues noted
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    21% - 40%
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                    C
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    Poor Performance - Well below requirements
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    0% - 20%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Saved Appraisals Modal */}
      <SavedAppraisalsModal
        isOpen={showSavedAppraisalsModal}
        onClose={() => setShowSavedAppraisalsModal(false)}
      />
    </div>
  );
};

export default PerformanceAppraisal;