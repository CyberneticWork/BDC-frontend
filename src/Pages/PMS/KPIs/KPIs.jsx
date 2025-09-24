import React, { useState, useEffect } from "react";
import {
  PieChart,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users,
  BarChart3,
  Download,
  X,
  User,
  CalendarDays,
  Clock,
  Loader2,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PMSService from "@services/PMS/PMSService";
import Swal from "sweetalert2";

// Task Modal Component (shared between Add and Edit)
// NOTE: accepts `employees` prop now (list of {id, name, department})
const TaskModal = ({ isOpen, onClose, onSubmit, initialData = {}, isEdit = false, isLoading = false, employees = [] }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    assignees: [],
    company: "",
    department: "",
    category: "",
    priority: "medium",
    creatorRole: "", // New field for creator role
    weights: [ // New weights field with predefined criteria - set to empty percentages
      { title: "Consistent follow-up with customers for payments", description: "", percentage: 0 },
      { title: "Tax Compliance", description: "Preparation of monthly schedules and returns for VAT, SSCL, APIT, AIT, and Stamp Duty. Also responsible for attending to tax matters as needed.", percentage: 0 },
      { title: "Accounting Entries and Provisions", description: "Recording salary entries and other provisions, reviewing General Ledger (GL) entries, and following up on necessary corrections.", percentage: 0 },
      { title: "Management Reporting", description: "Completing monthly and ad hoc management reports efficiently and accurately.", percentage: 0 },
      { title: "Commitment to Quality", description: "Maintaining a high standard of accuracy and precision in all tasks.", percentage: 0 },
      { title: "Teamwork and Discipline", description: "Upholding strong teamwork and maintaining discipline in all professional activities.", percentage: 0 }
    ],
    ...initialData,
  });

  const [showWeights, setShowWeights] = useState(false); // State for weights dropdown
  const [empSearch, setEmpSearch] = useState("");

  // Creator roles from backend
  const [creatorRoles, setCreatorRoles] = useState([]);
  const [isLoadingCreatorRoles, setIsLoadingCreatorRoles] = useState(false);

  // NEW: backend-driven state
  const [taskOptions, setTaskOptions] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [companyEmployees, setCompanyEmployees] = useState([]); // employees fetched from backend for selected company/department
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  
  // New: companies and departments to power the top-level filters
  const [companiesForFilter, setCompaniesForFilter] = useState([]);
  const [departmentsForFilter, setDepartmentsForFilter] = useState([]);
  const [isLoadingFilterCompanies, setIsLoadingFilterCompanies] = useState(false);
  const [isLoadingFilterDepartments, setIsLoadingFilterDepartments] = useState(false);
  
  // Fetch KPI task names from backend
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoadingTasks(true);
      try {
        const tasks = await PMSService.getKpiTasks(); // [{id, task_name}]
        setTaskOptions(Array.isArray(tasks) ? tasks : []);
      } catch (e) {
        console.error("Error fetching KPI task names:", e);
        setTaskOptions([]);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    fetchTasks();
  }, []);

  // Fetch companies from backend
  useEffect(() => {
    const fetchCompaniesData = async () => {
      setIsLoadingCompanies(true);
      try {
        const data = await PMSService.getCompanies(); // [{id, name}]
        setCompanies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setCompanies([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    fetchCompaniesData();
  }, []);

  // Fetch departments when company changes
  useEffect(() => {
    const fetchDepartmentsData = async () => {
      if (!formData.company) {
        setDepartments([]);
        return;
      }
      setIsLoadingDepartments(true);
      try {
        const data = await PMSService.getDepartmentsByCompany(formData.company); // [{id, name}]
        setDepartments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching departments:", error);
        setDepartments([]);
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    fetchDepartmentsData();
  }, [formData.company]);

  // Fetch employees for selected company/department (debounced + supports search)
  useEffect(() => {
    // Only fetch when a company is selected
    if (!formData.company) {
      setCompanyEmployees([]);
      return;
    }

    let mounted = true;
    const timer = setTimeout(async () => {
      setIsLoadingEmployees(true);
      try {
        const data = await PMSService.getEmployeesByCompany(
          formData.company,
          formData.department || null,
          empSearch || ""
        );
        if (!mounted) return;
        // API may return array or { data: [...] }
        const list = Array.isArray(data) ? data : (data?.data || []);
        setCompanyEmployees(
          list.map(e => ({
            id: e.attendance_employee_no, // Use attendance_employee_no as ID for consistency
            name: e.full_name || e.name || "",
            department: e.department || e.department_name || ""
          }))
        );
      } catch (err) {
        console.error("Error fetching employees:", err);
        if (mounted) setCompanyEmployees([]);
      } finally {
        if (mounted) setIsLoadingEmployees(false);
      }
    }, 350); // debounce 350ms

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [formData.company, formData.department, empSearch]);
  
  // Fetch creator roles once
  useEffect(() => {
    let mounted = true;
    const fetchRoles = async () => {
      setIsLoadingCreatorRoles(true);
      try {
        const roles = await PMSService.getCreatorRoles(); // calls /creator-roles
        if (!mounted) return;
        setCreatorRoles(Array.isArray(roles) ? roles : []);
      } catch (err) {
        console.error("Error fetching creator roles:", err);
        if (mounted) setCreatorRoles([]);
      } finally {
        if (mounted) setIsLoadingCreatorRoles(false);
      }
    };
    fetchRoles();
    return () => { mounted = false; };
  }, []);

  // Reset form when modal opens with new data
  useEffect(() => {
    setFormData({
      name: initialData.name || "",
      description: initialData.description || "",
      startDate: initialData.startDate || "",
      endDate: initialData.endDate || "",
      assignees: initialData.assignees ? [...initialData.assignees] : [],
      company: initialData.company || "",
      department: initialData.departmentId || initialData.department || "",
      category: initialData.category || "",
      priority: initialData.priority || "medium",
      creatorRole: initialData.creatorRole || "",
      weights: initialData.weights || [
        { title: "Consistent follow-up with customers for payments", description: "", percentage: 0 },
        { title: "Tax Compliance", description: "Preparation of monthly schedules and returns for VAT, SSCL, APIT, AIT, and Stamp Duty. Also responsible for attending to tax matters as needed.", percentage: 0 },
        { title: "Accounting Entries and Provisions", description: "Recording salary entries and other provisions, reviewing General Ledger (GL) entries, and following up on necessary corrections.", percentage: 0 },
        { title: "Management Reporting", description: "Completing monthly and ad hoc management reports efficiently and accurately.", percentage: 0 },
        { title: "Commitment to Quality", description: "Maintaining a high standard of accuracy and precision in all tasks.", percentage: 0 },
        { title: "Teamwork and Discipline", description: "Upholding strong teamwork and maintaining discipline in all professional activities.", percentage: 0 }
      ],
    });
    setEmpSearch("");
    setShowWeights(false); // Reset weights visibility
  }, [initialData, isOpen]);

  // Ensure numeric IDs for company/department/creatorRole
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Only company and department should be cast to Number.
    // creatorRole must remain a string (role name) so the UI can call .split on it safely.
    const isNumericField = name === "company" || name === "department";
    setFormData(prev => ({
      ...prev,
      [name]: isNumericField ? (value ? Number(value) : "") : value
    }));

    if (name === "company") {
      setFormData(prev => ({ ...prev, department: "" }));
    }
  };

  // Filter employees based on selected company and department (now uses companyEmployees from backend)
  const filteredEmployees = companyEmployees.filter(emp => {
    const q = empSearch?.toLowerCase?.() || "";
    if (!q) return true;
    
    // Enhanced search: name, department, attendance number, and employee ID
    const searchFields = [
      emp.name || "",
      emp.department || "",
      String(emp.id) || "", // attendance_employee_no
      String(emp.employee_id) || "", // numeric employee ID if available
      String(emp.attendance_employee_no) || "" // explicit attendance number field
    ];
    
    return searchFields.some(field => 
      field.toLowerCase().includes(q)
    );
  });
  
  const addEmployee = (employee) => {
    setFormData(prev => {
      const next = prev.assignees.includes(employee.id.toString())
        ? prev.assignees
        : [...prev.assignees, employee.id.toString()];
      return { ...prev, assignees: next };
    });
    setEmpSearch("");
  };

  const removeEmployee = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.filter(id => id !== employeeId.toString())
    }));
  };

  // Helper: today's date in yyyy-mm-dd for min attribute
  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prevent start date in the past
    if (formData.startDate && formData.startDate < getToday()) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Start Date",
        text: "Start date cannot be in the past. Please choose today or a future date.",
        confirmButtonColor: "#F59E0B",
      });
      return;
    }

    // Existing end-date validation (keeps ensuring end > start)
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Date Range",
        text: "End date must be after start date.",
        confirmButtonColor: "#F59E0B",
      });
      return;
    }

    // Validate weights total: must not exceed 100%
    const totalWeights = Array.isArray(formData.weights)
      ? formData.weights.reduce((sum, w) => sum + (Number(w.percentage) || 0), 0)
      : 0;
    
    if (totalWeights > 100) {
      // show validation and keep current form data intact
      Swal.fire({
        icon: "warning",
        title: "Weights sum exceeds 100%",
        html: `The total of all performance criteria weights is <strong>${totalWeights}%</strong>. Please adjust so the total does not exceed <strong>100%</strong>.`,
        confirmButtonColor: "#F59E0B",
      });
      return;
    }
    
    // Add computed names to formData before submitting
    const enrichedFormData = {
      ...formData,
      companyName: getCompanyName(formData.company),
      departmentName: getDepartmentName(formData.department),
    };
    onSubmit(enrichedFormData);
  };

  if (!isOpen) return null;

  // Get company name from ID
  const getCompanyName = (id) => {
    return companies.find(c => c.id === id)?.name || "Unknown Company";
  };

  // Get department name from ID
  const getDepartmentName = (id) => {
    return departments.find(d => d.id === id)?.name || "Unknown Department";
  };

  // Find employee by id: prefer backend-fetched companyEmployees, fall back to the shared `employees` prop
  const findEmployee = (id) => {
    const normalizedId = typeof id === "string" ? id : String(id);
    return (
      companyEmployees.find(e => String(e.id) === normalizedId) ||
      employees.find(e => String(e.id) === normalizedId) ||
      { id: normalizedId, name: "Unknown", department: "" }
    );
  };
  
  const handleWeightChange = (index, value) => {
    const updatedWeights = [...formData.weights];
    updatedWeights[index].percentage = parseInt(value, 10) || 0;
    setFormData(prev => ({
      ...prev,
      weights: updatedWeights
    }));
  };

  // Add: select-all handler to fetch employees from backend and populate assignees
  const handleSelectAllAssignees = async () => {
    // require company to be selected
    if (!formData.company) {
      // show quick feedback
      await Swal.fire({
        icon: "warning",
        title: "Select Company",
        text: "Please select a company (and optional department) before selecting all employees.",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    try {
      setIsLoadingEmployees(true);

      // If department is selected, pass it; otherwise pass null to fetch all company employees
      const deptParam = formData.department ? formData.department : null;

      // PMSService.getEmployeesByCompany(companyId, departmentId, search)
      const resp = await PMSService.getEmployeesByCompany(
        formData.company,
        deptParam,
        "" // empty search to get all
      );

      // Normalize response (support array or { data: [...] })
      const list = Array.isArray(resp) ? resp : (resp?.data || []);

      if (!Array.isArray(list) || list.length === 0) {
        await Swal.fire({
          icon: "info",
          title: "No employees",
          text: "No employees found for the selected company/department.",
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      }

      // Map to the same shape used elsewhere in this file (attendance_employee_no used as id)
      const mapped = list.map(e => ({
        id: e.attendance_employee_no ?? String(e.id ?? ""),
        name: e.full_name || e.name || "",
        department: e.department || e.department_name || ""
      }));

      // Use attendance numbers as assignee identifiers (strings)
      const ids = mapped.map(emp => String(emp.id));

      // Replace assignees with the full set for the selected company/department
      setFormData(prev => ({
        ...prev,
        assignees: ids
      }));

      // Update local cached companyEmployees so UI chip lookups work
      setCompanyEmployees(mapped);

      // Feedback: show count
      await Swal.fire({
        icon: "success",
        title: "Selected",
        text: `Assigned KPI to ${ids.length} employee${ids.length > 1 ? "s" : ""}.`,
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Failed to select all assignees", err);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to select employees. See console for details.",
      });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w/full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? "Edit KPI Task" : "Add New KPI Task"}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {isEdit ? "Update task details and assignments" : "Create a new task and assign it"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Task Name from API */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Name*
              </label>
              <div className="relative">
                <select
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none"
                  disabled={isLoadingTasks}
                >
                  <option value="">Select task name</option>
                  {taskOptions.map(t => (
                    <option key={t.id} value={t.task_name}>{t.task_name}</option>
                  ))}
                </select>
                {isLoadingTasks && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter task description (optional)"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Creator Role*
              </label>
              <div className="relative">
                <select
                  name="creatorRole"
                  value={formData.creatorRole}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none"
                  disabled={isLoadingCreatorRoles}
                >
                  <option value="">Select Creator Role</option>
                  {creatorRoles.map((r) => (
                    // Use the role name string so the UI can call .split() safely
                    <option key={r.id} value={r.role_name}>
                      {r.role_name || r.name || `Role ${r.id}`}
                    </option>
                  ))}
                </select>
                {isLoadingCreatorRoles && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Weights Section - Collapsible Dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setShowWeights(!showWeights)}
                className="flex items-center justify-between w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <span className="text-sm font-medium text-gray-700">Performance Criteria Weights (%)</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showWeights ? 'rotate-180' : ''}`} />
              </button>
              
              {showWeights && (
                <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {formData.weights.map((weight, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <strong>{weight.title}</strong>
                          {weight.description && (
                            <span className="text-xs text-gray-500 ml-1">{weight.description}</span>
                          )}
                        </p>
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={weight.percentage || ""}
                          onChange={(e) => handleWeightChange(index, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-purple-500"
                          placeholder="0"
                        />
                      </div>
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                    <span className="text-sm font-medium text-gray-700">Total:</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {formData.weights.reduce((sum, w) => sum + (w.percentage || 0), 0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

            {/* Company from API */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company*
              </label>
              <div className="relative">
                <select
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none"
                  disabled={isLoadingCompanies}
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
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
              </div>
            </div>

            {/* Department from API (depends on company) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department (Optional)
              </label>
              <div className="relative">
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none"
                  disabled={!formData.company || isLoadingDepartments}
                >
                  <option value="">Select Department (Optional)</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {isLoadingDepartments && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              {!formData.company && (
                <p className="text-xs text-gray-500 mt-1">Please select a company first</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDays className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    min={getToday()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDays className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    min={formData.startDate}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Employee Assignee - search + add */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Assignee*
              </label>

              {/* Show company and department info above search */}
              {formData.company && (
                <div className="mb-2 p-2 bg-indigo-50 rounded-lg text-sm">
                  <p className="text-indigo-700">
                    Filtering employees from: <span className="font-medium">{getCompanyName(formData.company)}</span>
                    {formData.department && <span> / <span className="font-medium">{getDepartmentName(formData.department)}</span></span>}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search by name, department, attendance number, or employee ID..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  disabled={!formData.company}
                />
              </div>
              {isLoadingEmployees && (
                <div className="text-xs text-gray-500 mt-1">Loading employees…</div>
              )}

              {!formData.company && (
                <p className="text-xs text-amber-600 mt-1">Please select a company to search employees</p>
              )}

              {/* Search results - Enhanced display */}
              {empSearch && filteredEmployees.length > 0 && formData.company && (
                <div className="mt-2 max-h-40 overflow-auto border border-gray-100 rounded-lg bg-white shadow-sm">
                  {filteredEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                      <div>
                        <div className="text-sm font-medium">{emp.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>ID: {emp.id}</span>
                          {emp.employee_id && emp.employee_id !== emp.id && (
                            <span>• EMP ID: {emp.employee_id}</span>
                          )}
                          <span>• {emp.department}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addEmployee(emp)}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {empSearch && filteredEmployees.length === 0 && formData.company && (
                <div className="mt-2 p-3 text-center text-sm text-gray-500 border border-gray-100 rounded-lg">
                  No employees found matching your search criteria
                </div>
              )}

              {/* Added employees */}
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.assignees && formData.assignees.map((id) => {
                  const emp = findEmployee(id);
                  if (!emp) return null;
                  return (
                    <div key={id} className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                      <div className="text-sm font-medium">{emp.name}</div>
                      <button type="button" onClick={() => removeEmployee(id)} className="text-red-600 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* New: Select All button */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleSelectAllAssignees}
                  disabled={isLoadingEmployees || (!formData.company && !formData.department)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isLoadingEmployees ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isLoadingEmployees ? 'Selecting...' : 'Select all employees for selected Company / Department'}
                </button>
              </div>
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category*
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select category</option>
                <option value="Financial">Financial</option>
                <option value="Customer">Customer</option>
                <option value="Internal Process">Internal Process</option>
                <option value="Learning & Growth">Learning & Growth</option>
                <option value="HR">HR & People</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales & Marketing</option>
              </select>
            </div> */}

            {/* Commented out priority selection section
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <div className="flex gap-2">
                {["low", "medium", "high"].map(priority => (
                  <label key={priority} className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="priority"
                      value={priority}
                      checked={formData.priority === priority}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span className="text-sm">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>
            */}

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
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEdit ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <span>{isEdit ? "Update Task" : "Create Task"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, kpiName, isLoading }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delete KPI Task</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "{kpiName}"? This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced TaskViewModal with support for category, priority, and better document display
const TaskViewModal = ({ isOpen, onClose, kpi = null, employees = [] }) => {
  if (!isOpen || !kpi) return null;

  const getEmployee = (id) => {
    const stringId = String(id);
    
    // Find employee by matching the ID (attendance_employee_no)
    const employee = employees.find(e => String(e.id) === stringId);
    
    return employee || { 
      id: stringId, 
      name: `Employee ${stringId}`, 
      department: "Unknown Department" 
    };
  };

  const updatesFor = (empId) => (kpi.assigneeUpdates || []).find(u => u.employeeId === empId);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "bg-green-100 text-green-800",
      attention: "bg-yellow-100 text-yellow-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return statusConfig[status] || statusConfig.inactive;
  };

  const getPriorityBadge = (priority) => {
    if (!priority) return "bg-gray-100 text-gray-800";
    const priorityConfig = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
    };
    return priorityConfig[priority] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{kpi.name}</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                  kpi.status
                )}`}
              >
                {kpi.status === "active" && (
                  <CheckCircle className="w-3 h-3 mr-1" />
                )}
                {kpi.status === "attention" && (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {kpi.status.charAt(0).toUpperCase() + kpi.status.slice(1)}
              </span>
              {/* Commented out priority badge display
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(
                  kpi.priority
                )}`}
              >
                {kpi.priority.charAt(0).toUpperCase() + kpi.priority.slice(1)} Priority
              </span>
              */}
            </div>
            <p className="text-gray-600 text-sm mt-1">{kpi.description}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Department:</span>
                  <span className="text-sm font-medium text-gray-900">{kpi.departmentName || kpi.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Frequency:</span>
                  <span className="text-sm font-medium text-gray-900">{kpi.frequency || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Target:</span>
                  <span className="text-sm font-medium text-gray-900">{kpi.target}{kpi.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Current:</span>
                  <span className="text-sm font-medium text-gray-900">{kpi.current}{kpi.unit}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Timeline</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {new Date(kpi.startDate).toLocaleDateString()} — {new Date(kpi.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    {(() => {
                      const start = new Date(kpi.startDate);
                      const end = new Date(kpi.endDate);
                      const today = new Date();
                      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                      const daysElapsed = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
                      const percentage = Math.min(Math.max(Math.round((daysElapsed / totalDays) * 100), 0), 100);
                      return (
                        <div
                          className="h-2 rounded-full bg-purple-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-right text-gray-500 mt-1">
                    {(() => {
                      const start = new Date(kpi.startDate);
                      const end = new Date(kpi.endDate);
                      const today = new Date();
                      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                      const daysElapsed = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
                      const percentage = Math.min(Math.max(Math.round((daysElapsed / totalDays) * 100), 0), 100);
                      return `${percentage}% elapsed`;
                    })()}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Last updated: {new Date(kpi.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          {/* <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Progress</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {kpi.current} {kpi.unit} of {kpi.target} {kpi.unit}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round((kpi.current / kpi.target) * 100)}% complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                <div 
                  className={`h-2.5 rounded-full ${
                    kpi.current >= kpi.target
                      ? "bg-green-500"
                      : kpi.current >= kpi.target * 0.8
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div> */}
          
          {/* Assigned Team */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Assigned Team</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                {(kpi.assignees || []).length === 0 && <div className="text-sm text-gray-500">No assignees</div>}
                {(kpi.assignees || []).map((idStr) => {
                  const emp = getEmployee(idStr);
                  return (
                    <div key={idStr} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.department}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Criteria Weights */}
          {kpi.weights && kpi.weights.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Performance Criteria Weights</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {kpi.weights.map((weight, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{weight.title}</p>
                        {weight.description && (
                          <p className="text-xs text-gray-500">{weight.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-indigo-600">{weight.percentage}%</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Total:</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {kpi.weights.reduce((sum, w) => sum + (w.percentage || 0), 0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Updates Timeline */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Updates Timeline</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-5">
                {(kpi.assignees || []).map((idStr) => {
                  const empId = parseInt(idStr);
                  const emp = getEmployee(idStr);
                  const entry = updatesFor(empId);
                  
                  if (!entry || !entry.updates || entry.updates.length === 0) return null;
                  
                  return (
                    <div key={idStr} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-indigo-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                      </div>
                      <div className="space-y-4 ml-8">
                        {entry.updates.map((u, idx) => (
                          <div key={idx} className="relative">
                            <div className="absolute left-[-16px] top-2 w-2 h-2 bg-indigo-400 rounded-full"></div>
                            <div className="pl-4 border-l border-gray-200">
                              {/* Show document info if available */}
                              {u.documentName && (
                                <div className="flex items-center gap-2 mb-1 text-indigo-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-xs font-medium">{u.documentName}</span>
                                  {u.documentSize && (
                                    <span className="text-xs text-gray-500">({u.documentSize})</span>
                                  )}
                                </div>
                              )}
                              <p className="text-sm text-gray-800">{u.note}</p>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-gray-500">{new Date(u.date).toLocaleString()}</p>
                                <p className="text-xs text-gray-400">By: {u.author || "System"}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {!kpi.assignees || !kpi.assignees.some(idStr => {
                  const empId = parseInt(idStr);
                  const entry = updatesFor(empId);
                  return entry && entry.updates && entry.updates.length > 0;
                }) && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No updates recorded yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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

const KPIs = (/* props */) => {
  const [kpis, setKpis] = useState([]);
  const [filteredKpis, setFilteredKpis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Remove searchTerm state
  // const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all"); // <--- ADDED
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7); // Changed from 10 to 7 for at least 7 rows per page

  // New: companies and departments to power the top-level filters
  const [companiesForFilter, setCompaniesForFilter] = useState([]);
  const [departmentsForFilter, setDepartmentsForFilter] = useState([]);
  const [isLoadingFilterCompanies, setIsLoadingFilterCompanies] = useState(false);
  const [isLoadingFilterDepartments, setIsLoadingFilterDepartments] = useState(false);
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentKpi, setCurrentKpi] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Shared employees list used by TaskModal and TaskViewModal
  const [employees, setEmployees] = useState([]);

  // Change this to match the employee ID you're assigning tasks to
  const [currentEmployeeId, setCurrentEmployeeId] = useState("2"); // Or whichever ID you're using

  // Add a state to store all employees for modals
  const [allEmployeesForModals, setAllEmployeesForModals] = useState([]);

  // New states for KPI performance stats
  const [isLoadingKpiStats, setIsLoadingKpiStats] = useState(false);
  const [kpiStats, setKpiStats] = useState({
    onTarget: 0,
    needAttention: 0,
    totalInWindow: 0,
    startDate: null,
    endDate: null
  });

  // Optional date-range state (you may already have these controls)
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);

  useEffect(() => {
    fetchKpis();
  }, []);

  // Fetch KPI tasks and assignments
  const fetchKpis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await PMSService.getKpiTaskAssignments(); // Fetch from backend
      setKpis(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Failed to fetch KPI task assignments");
      console.error(e);
      setKpis([]); // Fallback to empty array
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all employees for modals
  useEffect(() => {
    const fetchEmployeesForModals = async () => {
      try {
        // Fetch all companies first
        const companies = await PMSService.getCompanies();
        let allEmployees = [];
        
        // Fetch employees for each company
        for (const company of companies) {
          try {
            const companyEmployees = await PMSService.getEmployeesByCompany(company.id, null, "");
            const list = Array.isArray(companyEmployees) ? companyEmployees : (companyEmployees?.data || []);
            const mapped = list.map(e => ({
              id: e.attendance_employee_no ?? String(e.id ?? ""),
              name: e.full_name || e.name || "",
              department: e.department || e.department_name || ""
            }));
            allEmployees = [...allEmployees, ...mapped];
          } catch (err) {
            console.error(`Error fetching employees for company ${company.id}:`, err);
          }
        }
        
        setAllEmployeesForModals(allEmployees);
      } catch (err) {
        console.error("Error fetching employees for modals:", err);
      }
    };

    fetchEmployeesForModals();
  }, []);

  // New: fetch KPI performance stats
  const fetchKpiStats = async (startDate = null, endDate = null) => {
    setIsLoadingKpiStats(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const data = await PMSService.getKpiPerformance(params);
      setKpiStats({
        onTarget: data.onTarget ?? 0,
        needAttention: data.needAttention ?? 0,
        totalInWindow: data.totalInWindow ?? 0,
        startDate: data.startDate ?? startDate,
        endDate: data.endDate ?? endDate
      });
    } catch (err) {
      console.error('Failed to load KPI performance stats', err);
      setKpiStats(s => ({ ...s, onTarget: 0, needAttention: 0 }));
    } finally {
      setIsLoadingKpiStats(false);
    }
  };

  // Filter and pagination effects
  useEffect(() => {
    applyFilters();
  }, [kpis, statusFilter, departmentFilter, companyFilter]); // Removed searchTerm

  const applyFilters = () => {
    let filtered = kpis;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((kpi) => kpi.status === statusFilter);
    }

    // Filter by department (support both id and name on KPI objects)
    if (departmentFilter !== "all") {
      filtered = filtered.filter((kpi) => {
        const kDeptId = kpi.department_id ?? kpi.departmentId ?? (kpi.department && (kpi.department.id ?? null));
        if (kDeptId != null && kDeptId !== "") {
          return String(kDeptId) === String(departmentFilter);
        }
        // fallback: compare by department name
        const deptNameFromFilter = (departmentsForFilter.find(d => String(d.id) === String(departmentFilter))?.name || "").toLowerCase();
        return String(kpi.department || kpi.departmentName || "").toLowerCase() === deptNameFromFilter;
      });
    }

    // New: Filter by company (support both id and name on KPI objects)
    if (companyFilter !== "all") {
      filtered = filtered.filter((kpi) => {
        const kCompanyId = kpi.company_id ?? kpi.companyId ?? (kpi.company && (kpi.company.id ?? null));
        if (kCompanyId != null && kCompanyId !== "") {
          return String(kCompanyId) === String(companyFilter);
        }
        // fallback: compare by company name
        const compNameFromFilter = (companiesForFilter.find(c => String(c.id) === String(companyFilter))?.name || "").toLowerCase();
        return String(kpi.companyName || kpi.company || "").toLowerCase() === compNameFromFilter;
      });
    }

    setFilteredKpis(filtered);
    setCurrentPage(1);
  };

  // CRUD Operations
  const handleAddKpi = async (formData) => {
    setIsSubmitting(true);
    try {
      // Validation: ensure at least one assignee is present
      if (!formData.assignees || formData.assignees.length === 0) {
        setIsSubmitting(false);
        return Swal.fire({
          icon: "warning",
          title: "Add Assignee",
          text: "Please add at least one assignee before creating the KPI task.",
        });
      }

      const data = {
        task_name: formData.name,
        description: formData.description,
        company_id: formData.company,
        department_id: formData.department,
        creator_role_name: formData.creatorRole,
        assignees: formData.assignees,
        start_date: formData.startDate,
        end_date: formData.endDate,
        weights: formData.weights,
        priority: formData.priority,
      };
      
      const result = await PMSService.createKpiTaskAssignment(data);
      
      // Show success message using SweetAlert
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "KPI task assignment created successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
      setIsAddModalOpen(false);
      
      // Refresh the KPI list to get the latest data from server
      await fetchKpis();
      
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create KPI task assignment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditKpi = async (formData) => {
    setIsSubmitting(true);
    try {
      const data = {
        task_name: formData.name, // From selected task
        description: formData.description,
        company_id: formData.company,
        department_id: formData.department,
        creator_role_name: formData.creatorRole, // role_name string
        assignees: formData.assignees, // Array of attendance_employee_no
        start_date: formData.startDate,
        end_date: formData.endDate,
        weights: formData.weights,
        priority: formData.priority,
      };
      
      const result = await PMSService.updateKpiTaskAssignment(currentKpi.id, data);
      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "KPI task updated successfully.",
        timer: 1400,
        showConfirmButton: false,
      });
      setIsEditModalOpen(false);
      
      // FIX: Ensure we refresh the list after update
      await fetchKpis();
      
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update KPI task. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKpi = async () => {
    setIsSubmitting(true);
    try {
      const result = await PMSService.deleteKpiTaskAssignment(currentKpi.id);
      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "KPI task deleted successfully.",
        timer: 1400,
        showConfirmButton: false,
      });
      setIsDeleteModalOpen(false);
      
      // FIX: Ensure we refresh the list after deletion
      await fetchKpis();
      
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete KPI task. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal handlers
  const openEditModal = (kpi) => {
    setCurrentKpi(kpi);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (kpi) => {
    setCurrentKpi(kpi);
    setIsDeleteModalOpen(true);
  };

  // Helper functions
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "bg-green-100 text-green-800",
      attention: "bg-yellow-100 text-yellow-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return statusConfig[status] || statusConfig.inactive;
  };

  const getTrendIcon = (trend) => {
    return trend === "up" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getPerformanceColor = (current, target) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  // Update getUniqueValues to include company
  const getUniqueValues = (key) => {
    return [...new Set(kpis.map((kpi) => kpi[key]))];
  };

  // Add this function to get the latest progress from assignee updates
  const getLatestProgress = (kpi) => {
    let latestProgress = 0;
    let latestDate = null;
    
    if (!kpi.assignees || kpi.assignees.length === 0) {
      return kpi.progress || 0;
    }
    
    kpi.assignees.forEach(idStr => {
      const empId = parseInt(idStr);
      const assigneeUpdates = kpi.assigneeUpdates?.find(au => au.employeeId === empId);
      
      if (assigneeUpdates?.updates && assigneeUpdates.updates.length > 0) {
        assigneeUpdates.updates.forEach(update => {
          if (update.progressPercentage !== undefined) {
            const updateDate = new Date(update.date);
            if (!latestDate || updateDate > latestDate) {
              latestDate = updateDate;
              latestProgress = update.progressPercentage;
            }
          }
        });
      }
    });
    
    return latestProgress;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredKpis.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredKpis.length / itemsPerPage);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewKpi, setViewKpi] = useState(null);

  // Load companies for the top filter on mount
  useEffect(() => {
    let mounted = true;
    const loadCompanies = async () => {
      setIsLoadingFilterCompanies(true);
      try {
        const data = await PMSService.getCompanies();
        if (!mounted) return;
        setCompaniesForFilter(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading companies for filter:", err);
        if (mounted) setCompaniesForFilter([]);
      } finally {
        if (mounted) setIsLoadingFilterCompanies(false);
      }
    };
    loadCompanies();
    return () => { mounted = false; };
  }, []);

  // When companyFilter changes, load departments for that company (and clear department selection on 'all')
  useEffect(() => {
    let mounted = true;
    const loadDepartments = async () => {
      if (!companyFilter || companyFilter === "all") {
        setDepartmentsForFilter([]);
        // keep departmentFilter as 'all' when no company selected
        setDepartmentFilter("all");
        return;
      }
      setIsLoadingFilterDepartments(true);
      try {
        const data = await PMSService.getDepartmentsByCompany(companyFilter);
        if (!mounted) return;
        setDepartmentsForFilter(Array.isArray(data) ? data : []);
        // If current departmentFilter isn't in the returned list, reset it
        if (departmentFilter !== "all" && !((Array.isArray(data) ? data : []).some(d => String(d.id) === String(departmentFilter)))) {
          setDepartmentFilter("all");
        }
      } catch (err) {
        console.error("Error loading departments for company filter:", err);
        if (mounted) setDepartmentsForFilter([]);
      } finally {
        if (mounted) setIsLoadingFilterDepartments(false);
      }
    };
    loadDepartments();
    return () => { mounted = false; };
  }, [companyFilter]); // note: departmentFilter may be reset inside

  // initial load - you can pass date range here if you have controls
  useEffect(() => {
    fetchKpiStats(filterStartDate, filterEndDate);
  }, [filterStartDate, filterEndDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading KPIs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading KPIs</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchKpis}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Add Task Modal (Create) */}
      <TaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddKpi}
        initialData={{}}
        isEdit={false}
        isLoading={isSubmitting}
        employees={employees}
      />

      {/* Task Modals (Edit) */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditKpi}
        initialData={currentKpi ? {
          name: currentKpi.name,
          description: currentKpi.description,
          startDate: currentKpi.startDate,
          endDate: currentKpi.endDate,
          assignees: currentKpi.assignees ? [...currentKpi.assignees] : [],
          company: currentKpi.company || "",
          departmentId: currentKpi.departmentId || "",
          companyName: currentKpi.companyName || "",
          category: currentKpi.category || "",
          priority: currentKpi.priority || "medium",
          creatorRole: currentKpi.creator?.role || "",
          weights: currentKpi.weights, // Add weights to initialData
        } : {}}
        isEdit={true}
        isLoading={isSubmitting}
        employees={employees}
      />

      {/* View Modal - Updated to pass allEmployeesForModals */}
      <TaskViewModal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setViewKpi(null); }}
        kpi={viewKpi}
        employees={allEmployeesForModals} // Pass the comprehensive employee list
      />

      {/* DeleteConfirmationModal usage remains unchanged */}
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteKpi}
        kpiName={currentKpi?.name}
        isLoading={isSubmitting}
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              Key Performance Indicators
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor and track your organization's key performance metrics
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add KPI Task
            </button>
             {/* <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
               <Download className="w-4 h-4" />
               Export
             </button> */}
            </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total KPIs</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              {/* icon */}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Target</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoadingKpiStats ? '—' : kpiStats.onTarget}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpiStats.startDate && kpiStats.endDate ? `${kpiStats.startDate} → ${kpiStats.endDate}` : 'This month'}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <svg className="w-6 h-6 text-green-600" /*...*/></svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Need Attention</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoadingKpiStats ? '—' : kpiStats.needAttention}
              </p>
              <p className="text-xs text-gray-400 mt-1">No submissions in period</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <svg className="w-6 h-6 text-red-600" /*...*/></svg>
            </div>
          </div>
        </div>

        {/* other existing cards... */}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Company select - now uses API */}
          <div className="relative">
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Companies</option>
              {companiesForFilter.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {isLoadingFilterCompanies && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
 
          {/* Department select: show company-specific departments when a company is selected */}
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={companyFilter === "all" && getUniqueValues("department").length === 0}
            >
              <option value="all">All Departments</option>
              {companyFilter !== "all"
                ? departmentsForFilter.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                : getUniqueValues("department").map((dept) => <option key={dept} value={dept}>{dept}</option>)
              }
            </select>
            {isLoadingFilterDepartments && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Existing: Status select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="attention">Need Attention</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* KPIs Table with updated columns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KPI Name
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th> */}
                {/* Category column removed */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weights
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-gray-50">
                  {/* KPI Name */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{kpi.name}</div>
                        <div className="ml-2">{getTrendIcon(kpi.trend)}</div>
                        {kpi.priority && (
                          <span
                            className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              kpi.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : kpi.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {kpi.priority.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{kpi.description}</div>
                      <div className="text-xs text-gray-400">{kpi.departmentName || kpi.department}</div>
                    </div>
                                   </td>
                  {/* Performance */}
                  {/* <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${getPerformanceColor(kpi.current, kpi.target)}`}>
                            {kpi.current}{kpi.unit}
                          </span>
                          <span className="text-xs text-gray-500">Target: {kpi.target}{kpi.unit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              getLatestProgress(kpi) < 30 ? "bg-red-500" : getLatestProgress(kpi) < 70 ? "bg-yellow-500" : "bg-green-500"
                            }`}
                            style={{ width: `${getLatestProgress(kpi)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td> */}
  
                  {/* Weights */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {kpi.weights ? (
                        <div className="text-center">
                          <span className="text-sm font-bold text-indigo-600">
                            {kpi.weights.reduce((sum, w) => sum + (w.percentage || 0), 0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No weights set</span>
                      )}
                    </div>
                  </td>
  
                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(kpi.status)}`}>
                      {kpi.status === "active" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {kpi.status === "attention" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {kpi.status.charAt(0).toUpperCase() + kpi.status.slice(1)}
                    </span>
                  </td>
  
                  {/* Owner / Creator */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {kpi.creator?.role ? kpi.creator.role.split(" ").map((w) => w[0]).join("").toUpperCase() : (kpi.owner ? kpi.owner.split(" ").map((w) => w[0]).join("").toUpperCase() : "--")}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{kpi.creator?.role || "—"}</div>
                      </div>
                    </div>
                  </td>
  
                  {/* Timeline */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center text-gray-900">
                        <Clock className="w-4 h-4 text-gray-400 mr-1" />
                        <span>{new Date(kpi.startDate).toLocaleDateString()} - {new Date(kpi.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const start = new Date(kpi.startDate);
                          const end = new Date(kpi.endDate);
                          const today = new Date();
                          const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                          const daysElapsed = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
                          const percentage = Math.min(Math.max(Math.round((daysElapsed / totalDays) * 100), 0), 100);
                          return `${percentage}% of timeline elapsed`;
                        })()}
                      </div>
                    </div>
                  </td>
  
                  {/* Actions */}
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => { setViewKpi(kpi); setIsViewModalOpen(true); }}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" onClick={() => openEditModal(kpi)}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={() => openDeleteModal(kpi)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
               ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredKpis.length)} of {filteredKpis.length} KPIs
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredKpis.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs found</h3>
          <p className="text-gray-600 mb-6">
            {statusFilter !== "all" || departmentFilter !== "all" || companyFilter !== "all"
              ? "Try adjusting your filter criteria"
              : "Get started by creating your first KPI"}
          </p>
        </div>
      )}
    </div>
  );
};

export default KPIs;