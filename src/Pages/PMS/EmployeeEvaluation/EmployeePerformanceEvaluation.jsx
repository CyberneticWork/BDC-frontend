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
  ClipboardCheck
} from "lucide-react";
import PMSService from "@services/PMS/PMSService";
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const EmployeePerformanceEvaluation = () => {
  // compact SweetAlert2 helpers (must be defined before useEffect)
  const swalToast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 2500,
    customClass: {
      popup: 'rounded-lg shadow-lg',
      title: 'text-sm font-semibold',
      content: 'text-sm'
    }
  });

  const swalSmallModal = (options) =>
    Swal.fire({
      width: 420,
      showCloseButton: true,
      customClass: {
        popup: 'rounded-lg shadow-lg p-4',
        title: 'text-base font-semibold',
        content: 'text-sm',
        confirmButton: 'px-3 py-1 rounded-md'
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

  // Search loading + debounce ref
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef(null);

  // Fetch employees on mount (initial list)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await PMSService.getEmployeesByCompany(1); // initial load
        const list = Array.isArray(response) ? response : (response?.data || []);
        setEmployees(list);
        
        // Get employees with task assignments
        if (list.length > 0) {
          fetchEmployeesWithTasks(list);
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
  }, []);
  
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
            taskMap[task.employee_id] = (taskMap[task.employee_id] || 0) + 1;
          }
        });
      }
      
      setEmployeesWithTasks(taskMap);
    } catch (error) {
      console.error("Error fetching task assignments:", error);
      // Silent fail for task assignment data as it's supplementary information
    }
  };

  // Debounced search handler - queries backend by name/id/attendance no
  const handleSearchChange = (e) => {
    const val = e.target.value || "";
    setSearchTerm(val);
    setSelectedEmployee(""); // clear selection when typing
    setSelectedEmployeeName("");

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    // If empty, restore the initial list (or refetch)
    if (val.trim() === "") {
      searchDebounceRef.current = setTimeout(async () => {
        try {
          setSearchLoading(true);
          const response = await PMSService.getEmployeesByCompany(1);
          const list = Array.isArray(response) ? response : (response?.data || []);
          setEmployees(list);
        } catch {
          setEmployees([]);
        } finally {
          setSearchLoading(false);
        }
      }, 250);
      return;
    }

    // Debounce backend search
    searchDebounceRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        // PMSService.getEmployeesByCompany supports search param
        const response = await PMSService.getEmployeesByCompany(1, null, val);
        const list = Array.isArray(response) ? response : (response?.data || []);
        setEmployees(list);
      } catch (err) {
        console.error("Search error:", err);
        setEmployees([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  };

  // Filter employees client-side as a fallback: match name, id or attendance number
  const filteredEmployees = (employees || []).filter(emp => {
    const q = (searchTerm || "").toString().toLowerCase().trim();
    if (!q) return true;
    const fullname = (emp.full_name || emp.name || "").toString().toLowerCase();
    const empId = (emp.id || "").toString().toLowerCase();
    const attendance = (emp.attendance_employee_no || "").toString().toLowerCase();
    return fullname.includes(q) || empId.includes(q) || attendance.includes(q);
  }).sort((a, b) => {
    // Sort to prioritize employees with tasks
    const aHasTasks = employeesWithTasks[a.id] || 0;
    const bHasTasks = employeesWithTasks[b.id] || 0;
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
    setIsLoading(true);
    
    try {
      // Validate inputs
      if (!dateRange.startDate || !dateRange.endDate) {
        // compact warning toast
        swalToast.fire({
          icon: 'warning',
          title: 'Select date range',
          text: 'Start and end dates are required.'
        });
        setIsLoading(false);
        return;
      }
      
      // Prepare request data
      const requestData = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        employee_id: selectedEmployee || undefined // Only include if selected
      };
      
      const response = await PMSService.calculateEmployeePerformance(requestData);
      
      if (!response.data) {
        // compact info toast
        swalToast.fire({
          icon: 'info',
          title: 'No completed tasks',
          text: 'No completed tasks found for the selected date range.'
        });
        setEvaluationResults([]);
      } else {
        const results = Array.isArray(response.data) ? response.data : [response.data];
        setEvaluationResults(results);
        
        if (results.length > 0) {
          // concise success modal (smaller than previous)
          swalSmallModal({
            icon: 'success',
            title: 'Performance Calculated',
            html: `
              <div class="text-sm text-left">
                <div>✅ <strong>${results.length}</strong> employee(s) evaluated</div>
                <div>📊 <strong>${results.reduce((sum, r) => sum + (r.task_count || 0), 0)}</strong> tasks analyzed</div>
                <div class="mt-2 text-xs text-gray-600">Date Range: ${dateRange.startDate} → ${dateRange.endDate}</div>
              </div>
            `,
            confirmButtonText: 'View Results'
          });
        }
      }
    } catch (error) {
      console.error("Error calculating performance:", error);
      setEvaluationResults([]);
      // smaller modal for errors with details collapsed
      let message = 'An unexpected error occurred. Please try again.';
      if (error.response?.data?.message) message = error.response.data.message;
      swalSmallModal({
        icon: 'error',
        title: 'Calculation Failed',
        text: message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save evaluation button click
  const handleSaveEvaluation = async (evaluationResult) => {
    if (!evaluationResult) return;
    
    // compact confirmation modal
    const result = await swalSmallModal({
      title: 'Save Evaluation?',
      html: `
        <div class="text-sm text-left">
          <div><strong>Employee:</strong> ${evaluationResult.employee_name}</div>
          <div><strong>Grade:</strong> ${evaluationResult.grade} (${evaluationResult.performance_label})</div>
          <div><strong>Score:</strong> ${evaluationResult.percentage}%</div>
          <div class="mt-2 text-xs text-gray-600">This will save the evaluation to the database.</div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;
    
    setIsSaving(true);
    try {
      if (!evaluationResult.employee_id || !evaluationResult.tasks || !Array.isArray(evaluationResult.tasks)) {
        swalToast.fire({
          icon: 'error',
          title: 'Invalid data',
          text: 'Recalculate before saving.'
        });
        return;
      }

      const saveData = {
        employee_id: parseInt(evaluationResult.employee_id),
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        percentage: parseInt(evaluationResult.percentage),
        grade: evaluationResult.grade,
        performance_label: evaluationResult.performance_label,
        calculation_details: evaluationResult.tasks,
        task_count: parseInt(evaluationResult.task_count)
      };
      
      await PMSService.saveEmployeePerformance(saveData);
      
      // small success toast
      swalToast.fire({
        icon: 'success',
        title: 'Saved',
        text: `${evaluationResult.employee_name} evaluation saved.`
      });
    } catch (error) {
      console.error("Error saving evaluation:", error);
      let msg = 'Failed to save. Please try again.';
      if (error.response?.data?.errors) {
        msg = Object.values(error.response.data.errors).flat().join('; ');
      } else if (error.response?.data?.error) {
        msg = error.response.data.error;
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      swalSmallModal({
        icon: 'error',
        title: 'Save Failed',
        html: `<div class="text-sm text-left">${msg}</div>`
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
      text: 'The export functionality will be available in a future update.',
      confirmButtonColor: '#3B82F6',
      confirmButtonText: 'OK'
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
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

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                min={dateRange.startDate}
                required
              />
            </div>
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
                    </div>
                    {filteredEmployees.map(emp => {
                      const hasAssignedTasks = employeesWithTasks[emp.id] > 0;
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
                                  {employeesWithTasks[emp.id]}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {emp.id} • {emp.attendance_employee_no || emp.attendanceNo || ""}
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
        
        <div className="mt-6 flex justify-end">
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
          {/* Summary Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Performance Evaluation Results</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {dateRange.startDate} to {dateRange.endDate} • {evaluationResults.length} employee(s) • {evaluationResults.reduce((sum, result) => sum + result.task_count, 0)} tasks analyzed
                </p>
              </div>
              <button 
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50"
                onClick={handleExport}
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
            </div>
          </div>

          {/* Individual Employee Results */}
          {evaluationResults.map((evaluationResult, index) => (
            <div key={`${evaluationResult.employee_id}-${index}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Employee Results Header */}
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{evaluationResult.employee_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Attendance No: {evaluationResult.attendance_no} • {evaluationResult.task_count} tasks completed
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSaveEvaluation(evaluationResult)}
                      disabled={isSaving}
                      className="px-3 py-2 bg-green-600 text-white border border-green-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Results Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Grade Card */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium text-gray-600">Final Grade</h4>
                      <div className={`px-2.5 py-1 rounded-full text-sm font-medium ${getGradeBadgeClass(evaluationResult.grade)}`}>
                        {evaluationResult.grade}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">{evaluationResult.performance_label}</div>
                    <div className="text-sm text-gray-500">
                      Based on supervisor ratings and task weights
                    </div>
                  </div>
                  
                  {/* Percentage Card */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-600 mb-4">Performance Score</h4>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-indigo-600">{evaluationResult.percentage}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            evaluationResult.percentage < 30 ? 'bg-red-500' : 
                            evaluationResult.percentage < 60 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${evaluationResult.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-4">
                      Formula: (Average / 60) * 100
                    </div>
                  </div>
                  
                  {/* Task Summary Card */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-600 mb-4">Task Summary</h4>
                    <div className="text-3xl font-bold text-gray-900">{evaluationResult.task_count}</div>
                    <div className="text-sm text-gray-500 mt-2">
                      Tasks completed within period
                    </div>
                    <button 
                      onClick={() => toggleViewDetails(evaluationResult.employee_id)}
                      className="mt-4 text-sm text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
                    >
                      {viewDetails[evaluationResult.employee_id] ? 'Hide Details' : 'View Calculation Details'}
                      <ChevronDown className={`h-4 w-4 transition-transform ${viewDetails[evaluationResult.employee_id] ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {/* Calculation Details */}
                {viewDetails[evaluationResult.employee_id] && (
                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Calculation Details for {evaluationResult.employee_name}</h4>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Task
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Supervisor Progress
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Task Weight Total
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Calculation
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Score
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {evaluationResult.tasks.map((task, taskIndex) => (
                            <tr key={taskIndex}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {task.task_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {task.supervisor_progress}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {task.total_weight}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {task.supervisor_progress}% × {task.total_weight}% ÷ 100
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                {task.task_score.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50">
                            <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              Average = Sum of Scores / Number of Tasks:
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                              {(evaluationResult.tasks.reduce((sum, task) => sum + task.task_score, 0) / evaluationResult.task_count).toFixed(2)}
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              Final Percentage = (Average / 60) × 100:
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
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
          ))}

          {/* Performance Scale Reference */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-medium text-gray-900 mb-4">Performance Grade Scale</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage Range
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance Level
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">A+</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">81-100%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Excellent</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">A</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">61-80%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Above Average</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">B</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">41-60%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Average</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">B-</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">21-40%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Below Average</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">C</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1-20%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Poor Performance</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-500 italic">
              Formula: Final Percentage = (Average / 60) * 100
            </p>
          </div>
        </div>
      )}
      
      {/* No Results State */}
      {evaluationResults.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluation Results Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Select a date range and optionally an employee, then click "Calculate Performance" to generate evaluation reports for employees with completed tasks.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformanceEvaluation;