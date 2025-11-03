import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, 
  Search, 
  Download, 
  Filter, 
  CheckCircle, 
  Check,
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
  Building2,
  Layers,
  Save
} from "lucide-react";
import PMSService from "@services/PMS/PMSService";
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import SavedEvaluationsModal from './SavedEvaluationsModal';

const EmployeePerformanceEvaluation = () => {
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

  const swalSmallModal = (options) => Swal.fire({
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
  const [evaluationResults, setEvaluationResults] = useState([]); // Changed to array for multiple results
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDetails, setViewDetails] = useState({});
  const [showSavedEvaluationsModal, setShowSavedEvaluationsModal] = useState(false);

  // Saved evaluations count + loading for improved button UI
  const [savedCount, setSavedCount] = useState(0);
  const [isLoadingSavedCount, setIsLoadingSavedCount] = useState(false);

  // Add new states for company and department filtering
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadSavedCount = async () => {
      setIsLoadingSavedCount(true);
      try {
        const res = await PMSService.getSavedPerformanceEvaluations();
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (!mounted) return;
        setSavedCount(list.length);
      } catch (err) {
        console.error("Failed to load saved evaluations count", err);
      } finally {
        if (mounted) setIsLoadingSavedCount(false);
      }
    };
    loadSavedCount();
    return () => { mounted = false; };
  }, []);

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
    const fetchEmployees = async () => {
      try {
        let response;
        
        // If company is selected, fetch employees by company/department
        if (selectedCompany) {
          response = await PMSService.getEmployeesByCompany(
            selectedCompany,
            selectedDepartment || null,
            ""
          );
        } else {
          // Fall back to all employees
          response = await PMSService.getAllEmployees();
        }
        
        const list = Array.isArray(response) ? response : (response?.data || []);
        
        // Also fetch employees who have task assignments to ensure they're included
        const assignments = await PMSService.getKpiTaskAssignments();
        const employeesFromAssignments = [];
        
        if (Array.isArray(assignments)) {
          assignments.forEach(task => {
            if (task.employee_id && task.employee_name) {
              // Check if this employee is already in the main list
              const existsInMain = list.find(emp => 
                emp.id === task.employee_id || 
                emp.attendance_employee_no === task.employee_id
              );
              
              if (!existsInMain) {
                // Add employee from assignment data, but only if it matches our company/department filter
                const matchesCompanyFilter = !selectedCompany || 
                  task.company_id?.toString() === selectedCompany.toString();
                const matchesDepartmentFilter = !selectedDepartment || 
                  task.department_id?.toString() === selectedDepartment.toString();
                
                if (matchesCompanyFilter && matchesDepartmentFilter) {
                  employeesFromAssignments.push({
                    id: task.employee_id,
                    full_name: task.employee_name,
                    attendance_employee_no: task.employee_id,
                    department: task.department || '',
                    company: task.company || ''
                  });
                }
              }
            }
          });
        }
        
        // Combine both lists and remove duplicates
        const combinedEmployees = [...list, ...employeesFromAssignments];
        const uniqueEmployees = combinedEmployees.filter((emp, index, self) => 
          index === self.findIndex(e => 
            (e.id === emp.id) || 
            (e.attendance_employee_no === emp.attendance_employee_no)
          )
        );
        
        setEmployees(uniqueEmployees);
        
        // Get employees with task assignments
        if (uniqueEmployees.length > 0) {
          fetchEmployeesWithTasks(uniqueEmployees);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
        
        // compact error toast
        swalToast.fire({
          icon: 'error',
          title: 'Failed to load employees',
          text: 'Please refresh or try again later.'
        });
      }
    };
    
    fetchEmployees();

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [selectedCompany, selectedDepartment]); // Add dependencies

  // Fetch which employees have tasks assigned
  const fetchEmployeesWithTasks = async (empList) => {
    try {
      // Get all KPI task assignments
      const assignments = await PMSService.getKpiTaskAssignments();
      
      // Create a map of employee IDs to task counts
      const taskMap = {};
      if (Array.isArray(assignments)) {
        assignments.forEach(task => {
          if (task.employee_id) {
            // Handle both numeric IDs and attendance numbers
            const employeeKey = task.employee_id;
            taskMap[employeeKey] = (taskMap[employeeKey] || 0) + 1;
            
            // Also map by actual employee ID if it's different
            const matchingEmployee = empList.find(emp => 
              emp.attendance_employee_no === task.employee_id || 
              emp.id === task.employee_id
            );
            
            if (matchingEmployee && matchingEmployee.id !== employeeKey) {
              taskMap[matchingEmployee.id] = (taskMap[matchingEmployee.id] || 0) + 1;
            }
          }
        });
      }
      
      setEmployeesWithTasks(taskMap);
    } catch (error) {
      console.error("Error fetching task assignments:", error);
      // Silent fail for task assignment data as it's supplementary information
    }
  };

  // Debounced search handler - now filters client-side only
  const handleSearchChange = (e) => {
    const val = e.target.value || "";
    setSearchTerm(val);
    setSelectedEmployee(""); // clear selection when typing
    setSelectedEmployeeName("");
    setSearchLoading(false); // No backend call, so no loading
  };

  // Filter employees client-side as a fallback: match name, id or attendance no
  const filteredEmployees = (employees || []).filter(emp => {
    const q = (searchTerm || "").toString().toLowerCase().trim();
    if (!q) return true;
    
    const fullname = (emp.full_name || emp.name || "").toString().toLowerCase();
    const empId = (emp.id || "").toString().toLowerCase();
    const attendance = (emp.attendance_employee_no || "").toString().toLowerCase();
    
    return fullname.includes(q) || empId.includes(q) || attendance.includes(q);
  }).sort((a, b) => {
    // Sort to prioritize employees with tasks
    const aHasTasks = employeesWithTasks[a.id] || employeesWithTasks[a.attendance_employee_no] || 0;
    const bHasTasks = employeesWithTasks[b.id] || employeesWithTasks[b.attendance_employee_no] || 0;
    return bHasTasks - aHasTasks; // Sort by task count desc
  });

  // Function to get grade from percentage
  const getGrade = (percentage) => {
    if (percentage >= 81) return { grade: "A+", label: "Excellent" };
    if (percentage >= 61) return { grade: "A", label: "Above Average" };
    if (percentage >= 41) return { grade: "B", label: "Average" };
    if (percentage >= 21) return { grade: "B-", label: "Below Average" };
    return { grade: "C", label: "Poor Performance" };
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
        text: 'Please select both start and end dates to calculate performance.',
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
      // Prepare request data with company/department filters
      const requestData = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        employee_id: selectedEmployee || undefined,
        company_id: selectedCompany || undefined,
        department_id: selectedDepartment || undefined
      };
      
      const response = await PMSService.calculateEmployeePerformance(requestData);
      
      if (!response.data) {
        // Enhanced info toast
        await Swal.fire({
          icon: 'info',
          title: 'No Data Found',
          text: 'No completed tasks found in the selected date range for the specified filters. Try adjusting the date range, company, department selection or ensure tasks are marked as completed.',
          confirmButtonColor: '#3B82F6',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-xl shadow-2xl',
            title: 'text-lg font-bold text-blue-600'
          }
        });
        setEvaluationResults([]);
      } else {
        const results = Array.isArray(response.data) ? response.data : [response.data];
        
        // Sort by end_date descending (latest first)
        results.sort((a, b) => new Date(b.end_date || b.start_date) - new Date(a.end_date || a.start_date));
        
        setEvaluationResults(results);
        setCurrentPage(1); // Reset to first page
        
        if (results.length > 0) {
          // Enhanced success modal with filter info
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
            title: 'Performance Calculated Successfully!',
            html: `
              <div class="text-left space-y-2">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span><strong>${results.length}</strong> employee(s) evaluated</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span><strong>${results.reduce((sum, r) => sum + (r.task_count || 0), 0)}</strong> tasks analyzed</span>
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
      }
    } catch (error) {
      console.error("Error calculating performance:", error);
      setEvaluationResults([]);
      
      let errorTitle = 'Calculation Failed';
      let errorMessage = 'An error occurred while calculating performance. Please try again.';
      
      if (error.response?.status === 404) {
        errorTitle = 'No Data Found';
        errorMessage = 'No completed tasks found for the selected criteria.';
      } else if (error.response?.status === 422) {
        errorTitle = 'Invalid Parameters';
        errorMessage = 'Please check your filter selections and try again.';
      }
      
      await Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: '#EF4444',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-xl shadow-2xl',
          title: 'text-lg font-bold text-red-600'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save evaluation button click
  const handleSaveEvaluation = async (evaluationResult) => {
    if (!evaluationResult) return;
    
    // Enhanced confirmation modal with better styling
    const result = await Swal.fire({
      title: 'Confirm Save Evaluation',
      html: `
        <div class="text-left space-y-3">
          <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div class="font-semibold text-gray-800">${evaluationResult.employee_name}</div>
              <div class="text-sm text-gray-600">Attendance No: ${evaluationResult.attendance_no}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-2 bg-green-50 rounded-lg">
              <div class="text-lg font-bold text-green-600">${evaluationResult.grade}</div>
              <div class="text-xs text-gray-600">${evaluationResult.performance_label}</div>
            </div>
            <div class="text-center p-2 bg-indigo-50 rounded-lg">
              <div class="text-lg font-bold text-indigo-600">${evaluationResult.percentage}%</div>
              <div class="text-xs text-gray-600">Performance Score</div>
            </div>
          </div>
          <div class="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            This will save the evaluation to the database and cannot be easily undone.
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Save Evaluation',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'text-lg font-bold text-gray-800',
        confirmButton: 'px-6 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200',
        cancelButton: 'px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all duration-200'
      }
    });

    if (!result.isConfirmed) return;
    
    setIsSaving(true);
    try {
      if (!evaluationResult.employee_id || !evaluationResult.tasks || !Array.isArray(evaluationResult.tasks)) {
        await Swal.fire({
          icon: 'error',
          title: 'Invalid Data',
          text: 'Invalid evaluation data detected. Please recalculate the performance and try again.',
          confirmButtonColor: '#EF4444',
          customClass: {
            popup: 'rounded-xl shadow-2xl',
            title: 'text-lg font-bold text-red-600'
          }
        });
        return;
      }

      const saveData = {
        employee_id: parseInt(evaluationResult.employee_id),
        evaluator_id: 1, // Get from auth context or current user
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        percentage: parseInt(evaluationResult.percentage),
        grade: evaluationResult.grade,
        performance_label: evaluationResult.performance_label,
        calculation_details: evaluationResult.tasks,
        task_count: parseInt(evaluationResult.task_count)
      };
      
      const response = await PMSService.saveEmployeePerformance(saveData);
      
      // Handle different response types
      const action = response.data?.action || response.action || 'saved';
      let successTitle = 'Evaluation Saved!';
      let successMessage = `Performance evaluation for <strong>${evaluationResult.employee_name}</strong> has been saved successfully.`;
      
      if (action === 'updated') {
        successTitle = 'Evaluation Updated!';
        successMessage = `Performance evaluation for <strong>${evaluationResult.employee_name}</strong> has been updated successfully (data was different from existing record).`;
      } else if (action === 'restored_and_updated') {
        successTitle = 'Evaluation Restored!';
        successMessage = `Performance evaluation for <strong>${evaluationResult.employee_name}</strong> has been restored from deleted records and updated.`;
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
            <p class="text-sm text-gray-500 mt-2">The evaluation is now stored in the system.</p>
          </div>
        `,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'Great!',
        timer: 4000,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-xl shadow-2xl',
          title: 'text-lg font-bold text-green-600'
        }
      });
      
    } catch (error) {
      console.error("Error saving evaluation:", error);
      
      // Enhanced error handling with detailed messages
      let errorTitle = 'Save Failed';
      let errorMessage = 'Failed to save the performance evaluation.';
      let errorDetails = '';
      
      // Handle specific error types
      if (error.response?.status === 409 && error.response?.data?.error_type === 'duplicate_data') {
        const existingDate = error.response.data.existing_created_at;
        await Swal.fire({
          icon: 'warning',
          title: 'Duplicate Evaluation',
          html: `
            <div class="text-left">
              <p class="text-gray-700 mb-3">An identical performance evaluation already exists for <strong>${evaluationResult.employee_name}</strong> for this date range.</p>
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
      
      if (error.response?.status === 422) {
        errorTitle = 'Validation Error';
        errorMessage = 'The evaluation data did not pass validation.';
        if (error.response.data?.errors) {
          const errors = Object.values(error.response.data.errors).flat();
          errorDetails = errors.join('<br>');
        }
      } else if (error.response?.status === 500) {
        errorTitle = 'Server Error';
        errorMessage = 'A server error occurred while saving the evaluation.';
        errorDetails = 'Please try again later or contact the system administrator.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      await Swal.fire({
        icon: 'error',
        title: errorTitle,
        html: `
          <div class="text-left">
            <p class="mb-3">${errorMessage}</p>
            ${errorDetails ? `<div class="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">${errorDetails}</div>` : ''}
          </div>
        `,
        confirmButtonColor: '#EF4444',
        confirmButtonText: 'Try Again',
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
    Swal.fire({
      icon: 'info',
      title: 'Export Feature Coming Soon',
      text: 'The export functionality will be available in a future update. Stay tuned!',
      confirmButtonColor: '#3B82F6',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'text-lg font-bold text-blue-600'
      }
    });
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

  // Toggle view details for specific employee
  const toggleViewDetails = (employeeId) => {
    setViewDetails(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  // Pagination logic
  const totalPages = Math.ceil(evaluationResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = evaluationResults.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
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

  // Update the handleClearFilters function to include company/department
  const handleClearFilters = () => {
    setDateRange({
      startDate: "",
      endDate: ""
    });
    setSelectedEmployee("");
    setSelectedEmployeeName("");
    setSearchTerm("");
    setSelectedCompany("");
    setSelectedDepartment("");
    setEvaluationResults([]);
    setCurrentPage(1);
    setViewDetails({});
    setHasAttempted(false);
    setValidationErrors({
      startDate: false,
      endDate: false
    });
  };

  // Add new state for selection functionality
  const [selectedEvaluations, setSelectedEvaluations] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  // Handle individual evaluation selection
  const handleEvaluationSelect = (employeeId, isSelected) => {
    const newSelected = new Set(selectedEvaluations);
    if (isSelected) {
      newSelected.add(employeeId);
    } else {
      newSelected.delete(employeeId);
    }
    setSelectedEvaluations(newSelected);
    
    // Update select all checkbox
    setSelectAll(newSelected.size === evaluationResults.length && evaluationResults.length > 0);
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedEvaluations(new Set());
    } else {
      // Select all visible results
      const allIds = new Set(evaluationResults.map(result => result.employee_id));
      setSelectedEvaluations(allIds);
    }
    setSelectAll(!selectAll);
  };

  // Handle bulk save of selected evaluations
  const handleBulkSave = async () => {
    if (selectedEvaluations.size === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select at least one evaluation to save.',
        confirmButtonColor: '#F59E0B',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'swal2-rounded',
          title: 'swal2-title-warning'
        }
      });
      return;
    }

    // Get selected evaluation results
    const selectedResults = evaluationResults.filter(result => 
      selectedEvaluations.has(result.employee_id)
    );

    // Enhanced confirmation modal with proper HTML structure
    const result = await Swal.fire({
      title: 'Confirm Bulk Save',
      html: `
        <div style="text-align: left; padding: 16px 0;">
          <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #3b82f6;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <svg style="width: 20px; height: 20px; color: #2563eb;" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293z"/>
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v4a1 1 0 11-2 0V4H7v4a1 1 0 11-2 0V4z"/>
              </svg>
              <span style="font-weight: 600; color: #1f2937;">Bulk Save Performance Evaluations</span>
            </div>
            <p style="color: #374151; margin: 0; font-size: 14px;">
              You are about to save <strong>${selectedResults.length}</strong> performance evaluation(s) to the database.
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 12px; border-radius: 8px; max-height: 120px; overflow-y: auto; margin-bottom: 16px;">
            <h4 style="font-size: 14px; font-weight: 500; color: #374151; margin: 0 0 8px 0;">Selected Employees:</h4>
            <div style="font-size: 12px; color: #6b7280;">
              ${selectedResults.map(result => `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5e7eb;">
                  <span>${result.employee_name}</span>
                  <span style="font-weight: 500;">${result.grade} (${result.percentage}%)</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div style="background: #fef3c7; padding: 8px; border-radius: 6px; border: 1px solid #f59e0b;">
            <p style="font-size: 12px; color: #92400e; margin: 0;">
              <strong>Note:</strong> This action will save all selected evaluations to the database and cannot be easily undone.
            </p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, Save ${selectedResults.length} Evaluation${selectedResults.length > 1 ? 's' : ''}`,
      cancelButtonText: 'Cancel',
      width: 500,
      customClass: {
        popup: 'swal2-rounded',
        htmlContainer: 'swal2-html-container-custom',
        confirmButton: 'swal2-confirm-success',
        cancelButton: 'swal2-cancel-gray'
      }
    });

    if (!result.isConfirmed) return;

    setIsBulkSaving(true);
    
    try {
      // Prepare bulk save data
      const evaluationsData = selectedResults.map(evaluationResult => ({
        employee_id: parseInt(evaluationResult.employee_id),
        evaluator_id: 1, // You might want to get this from auth context
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        percentage: parseInt(evaluationResult.percentage),
        grade: evaluationResult.grade,
        performance_label: evaluationResult.performance_label,
        calculation_details: evaluationResult.tasks,
        task_count: parseInt(evaluationResult.task_count)
      }));

      const response = await PMSService.saveEmployeePerformanceBulk(evaluationsData);
      
      // Handle response
      const responseData = response.data || response;
      const saved_count = responseData.saved_count || 0;
      const duplicates = responseData.duplicates || [];
      const errors = responseData.errors || [];
      const total_requested = responseData.total_requested || evaluationsData.length;
      
      // Clear selections after successful save
      setSelectedEvaluations(new Set());
      setSelectAll(false);
      
      // Update saved count
      setSavedCount(prev => prev + saved_count);

      // Enhanced success modal
      await Swal.fire({
        icon: 'success',
        title: 'Bulk Save Completed!',
        html: `
          <div style="text-align: left; padding: 16px 0;">
            <div style="background: #d1fae5; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <svg style="width: 20px; height: 20px; color: #059669;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span style="font-weight: 600; color: #065f46;">Save Summary</span>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
                <div>
                  <span style="color: #374151;">Total Requested:</span>
                  <span style="font-weight: 500; margin-left: 8px;">${total_requested}</span>
                </div>
                <div>
                  <span style="color: #374151;">Successfully Saved:</span>
                  <span style="font-weight: 500; margin-left: 8px; color: #059669;">${saved_count}</span>
                </div>
                ${duplicates.length > 0 ? `
                <div>
                  <span style="color: #374151;">Duplicates Skipped:</span>
                  <span style="font-weight: 500; margin-left: 8px; color: #d97706;">${duplicates.length}</span>
                </div>
                ` : ''}
                ${errors.length > 0 ? `
                <div>
                  <span style="color: #374151;">Errors:</span>
                  <span style="font-weight: 500; margin-left: 8px; color: #dc2626;">${errors.length}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
        `,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'Great!',
        timer: 6000,
        timerProgressBar: true,
        width: 600,
        customClass: {
          popup: 'swal2-rounded'
        }
      });

    } catch (error) {
      console.error("Error in bulk save:", error);
      
      // Enhanced error handling
      let errorTitle = 'Bulk Save Failed';
      let errorMessage = 'An unexpected error occurred while saving evaluations.';
      let errorDetails = '';
      
      if (error.response?.status === 422) {
        errorTitle = 'Validation Error';
        errorMessage = 'Some evaluation data did not pass validation.';
        if (error.response.data?.errors) {
          const errors = Object.values(error.response.data.errors).flat();
          errorDetails = errors.join('<br>');
        }
      } else if (error.response?.status === 500) {
        errorTitle = 'Server Error';
        errorMessage = 'A server error occurred while saving the evaluations.';
        errorDetails = 'Please try again later or contact the system administrator.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      await Swal.fire({
        icon: 'error',
        title: errorTitle,
        html: `
          <div style="text-align: left; padding: 16px 0;">
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 14px;">${errorMessage}</p>
            ${errorDetails ? `
            <div style="background: #fef2f2; padding: 12px; border-radius: 6px; border: 1px solid #fca5a5;">
              <div style="font-size: 12px; color: #dc2626; line-height: 1.5;">${errorDetails}</div>
            </div>
            ` : ''}
          </div>
        `,
        confirmButtonColor: '#EF4444',
        confirmButtonText: 'Try Again',
        width: 450
      });
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Reset selections when evaluation results change
  useEffect(() => {
    setSelectedEvaluations(new Set());
    setSelectAll(false);
  }, [evaluationResults]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              Employee Performance Evaluation
            </h1>
            <p className="text-gray-600 mt-2">
              Calculate and grade employee performance based on completed tasks
            </p>
          </div>
          <button
            onClick={() => setShowSavedEvaluationsModal(true)}
            title="View saved performance evaluations"
            aria-label="View saved performance evaluations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg shadow-sm transition-colors"
          >
            {isLoadingSavedCount ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span className="hidden sm:inline font-medium">Saved</span>
            <span className="text-sm font-medium">Evaluations</span>
            {savedCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-white text-indigo-700 text-xs font-semibold">
                {savedCount}
              </span>
            )}
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
                className="appearance-none w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
                className="appearance-none w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={handleStartDateChange}
                className={`w-full pl-10 pr-4 py-2 border ${
                  hasAttempted && validationErrors.startDate ? "border-red-300 bg-red-50" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                required
              />
            </div>
            {hasAttempted && validationErrors.startDate && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full mr-1"></span>
                Start date is required
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={handleEndDateChange}
                className={`w-full pl-10 pr-4 py-2 border ${
                  hasAttempted && validationErrors.endDate ? "border-red-300 bg-red-50" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                min={dateRange.startDate}
                required
              />
            </div>
            {hasAttempted && validationErrors.endDate && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full mr-1"></span>
                End date is required
              </p>
            )}
          </div>
          
          {/* Employee Selection (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, ID or attendance no"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                        <span className="block mt-1 text-blue-600">
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
                            setSearchTerm("");
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
              <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="text-sm font-medium text-indigo-900">Selected: {selectedEmployeeName}</div>
                <div className="text-xs text-indigo-600">ID: {selectedEmployee}</div>
              </div>
            )}
            
            {employees.length === 0 && !searchLoading && (
              <div className="mt-2 p-3 text-center text-sm text-gray-500 border border-gray-100 rounded-lg bg-white">
                No employees available. Please ensure employees are loaded.
              </div>
            )}
          </div>
        </div>

        {/* Filter Summary */}
        {(selectedCompany || selectedDepartment) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
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
        
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
          
          <button
            onClick={handleEvaluate}
            disabled={isLoading || !dateRange.startDate || !dateRange.endDate}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isLoading || !dateRange.startDate || !dateRange.endDate
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <BarChart2 className="h-4 w-4" />
                <span>Calculate Performance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section - Multiple Results */}
      {evaluationResults.length > 0 && (
        <div className="space-y-6">
          {/* Summary Header with Bulk Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Performance Evaluation Results</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {dateRange.startDate} to {dateRange.endDate} • {evaluationResults.length} employee(s) • {evaluationResults.reduce((sum, result) => sum + result.task_count, 0)} tasks analyzed
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Selection Summary */}
                {selectedEvaluations.size > 0 && (
                  <div className="text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                    {selectedEvaluations.size} of {evaluationResults.length} selected
                  </div>
                )}
                
                {/* Bulk Save Button */}
                <button
                  onClick={handleBulkSave}
                  disabled={selectedEvaluations.size === 0 || isBulkSaving}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    selectedEvaluations.size === 0 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm'
                  }`}
                >
                  {isBulkSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Selected ({selectedEvaluations.size})
                    </>
                  )}
                </button>

                <button 
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50"
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4" />
                  Export All
                </button>
              </div>
            </div>

            {/* Bulk Selection Controls */}
            {evaluationResults.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={handleSelectAll}
                      className="flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      {selectAll ? (
                        <Check className="w-4 h-4 text-indigo-600" />
                      ) : null}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({evaluationResults.length})
                    </span>
                  </label>
                  
                  {selectedEvaluations.size > 0 && (
                    <button
                      onClick={() => {
                        setSelectedEvaluations(new Set());
                        setSelectAll(false);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Individual Employee Results - With Selection */}
          <div className="grid gap-4">
            {paginatedResults.map((evaluationResult, index) => {
              const isSelected = selectedEvaluations.has(evaluationResult.employee_id);
              
              return (
                <div 
                  key={`${evaluationResult.employee_id}-${index}`} 
                  className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 ${
                    isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100'
                  }`}
                >
                  {/* Employee Results Header - With Selection Checkbox */}
                  <div className={`p-4 border-b border-gray-100 ${
                    isSelected ? 'bg-gradient-to-r from-indigo-100 to-blue-100' : 'bg-gradient-to-r from-indigo-50 to-blue-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {/* Selection Checkbox */}
                        <label className="flex items-center cursor-pointer">
                          <div
                            onClick={() => handleEvaluationSelect(evaluationResult.employee_id, !isSelected)}
                            className="flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded hover:border-indigo-500 transition-colors cursor-pointer"
                          >
                            {isSelected ? (
                              <Check className="w-4 h-4 text-indigo-600" />
                            ) : null}
                          </div>
                        </label>
                        
                        <div>
                          <h3 className="text-base font-bold text-gray-900">{evaluationResult.employee_name}</h3>
                          <p className="text-xs text-gray-600 mt-1">
                            Attendance No: {evaluationResult.attendance_no} • {evaluationResult.task_count} tasks completed
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Individual Save Button */}
                        <button 
                          onClick={() => handleSaveEvaluation(evaluationResult)}
                          disabled={isSaving}
                          className={`px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:from-blue-600 hover:to-blue-700 hover:shadow-md disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 transform hover:scale-105`}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Save Individual
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Results Content - Compact */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Grade Card - Compact */}
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-medium text-gray-600">Final Grade</h4>
                          <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getGradeBadgeClass(evaluationResult.grade)}`}>
                            {evaluationResult.grade}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-gray-900 mb-1">{evaluationResult.performance_label}</div>
                        <div className="text-xs text-gray-500">
                          Based on supervisor ratings and task weights
                        </div>
                      </div>
                      
                      {/* Percentage Card - Compact */}
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <h4 className="text-xs font-medium text-gray-600 mb-2">Performance Score</h4>
                        <div className="flex items-center gap-2">
                          <div className="text-xl font-bold text-indigo-600">{evaluationResult.percentage}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                evaluationResult.percentage < 30 ? 'bg-red-500' : 
                                evaluationResult.percentage < 60 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${evaluationResult.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Formula: Total Score (capped at 100%)
                        </div>
                      </div>
                      
                      {/* Task Summary Card - Compact */}
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <h4 className="text-xs font-medium text-gray-600 mb-2">Task Summary</h4>
                        <div className="text-xl font-bold text-gray-900">{evaluationResult.task_count}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Tasks completed within period
                        </div>
                        <button 
                          onClick={() => toggleViewDetails(evaluationResult.employee_id)}
                          className="mt-2 text-xs text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
                        >
                          {viewDetails[evaluationResult.employee_id] ? 'Hide Details' : 'View Calculation Details'}
                          <ChevronDown className={`h-3 w-3 transition-transform ${viewDetails[evaluationResult.employee_id] ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Calculation Details - Compact */}
                    {viewDetails[evaluationResult.employee_id] && (
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-900 mb-3 text-sm">Calculation Details for {evaluationResult.employee_name}</h4>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Task
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Supervisor Progress
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Task Weight Total
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Calculation
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Score
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {evaluationResult.tasks.map((task, taskIndex) => (
                                <tr key={taskIndex}>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                    {task.task_name}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                    {task.supervisor_progress}%
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                    {task.total_weight}%
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                    {task.supervisor_progress}% × {task.total_weight}% ÷ 100
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-indigo-600">
                                    {task.task_score.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50">
                                <td colSpan="4" className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                                  Total Score = Sum of All Task Scores:
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-indigo-600">
                                  {evaluationResult.tasks.reduce((sum, task) => sum + task.task_score, 0).toFixed(2)}
                                </td>
                              </tr>
                              <tr className="bg-gray-50">
                                <td colSpan="4" className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                                  Final Percentage = Total Score (capped at 100%):
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-indigo-600">
                                  {evaluationResult.percentage}%
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                ))}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Performance Scale Reference - Compact */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h4 className="font-medium text-gray-900 mb-3 text-sm">Performance Grade Scale</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage Range
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance Level
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">A+</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">81-100%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">Excellent</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">A</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">61-80%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">Above Average</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800">B</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">41-60%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">Average</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-800">B-</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">21-40%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">Below Average</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-800">C</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">1-20%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">Poor Performance</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500 italic">
              Formula: Final Percentage = Sum of (Task Weight × Supervisor Progress ÷ 100), capped at 100%
            </p>
          </div>
        </div>
      )}
      
      {/* No Results State */}
      {evaluationResults.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No Evaluation Results Found
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Try adjusting the date range or employee selection, then calculate the performance again.
          </p>
          <button
            onClick={() => setCurrentPage(1)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition-all duration-200"
          >
            <ArrowUpRight className="w-4 h-4 inline-block -mt-1 mr-1" />
            Retry Evaluation
          </button>
        </div>
      )}

      {/* Saved Evaluations Modal */}
      <SavedEvaluationsModal
        isOpen={showSavedEvaluationsModal}
        onClose={() => setShowSavedEvaluationsModal(false)}
      />
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-gray-600">Please refresh the page and try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Then wrap your component
const EmployeePerformanceEvaluationWithBoundary = () => (
  <ErrorBoundary>
    <EmployeePerformanceEvaluation />
  </ErrorBoundary>
);

export default EmployeePerformanceEvaluationWithBoundary;