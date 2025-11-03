import React, { useState, useEffect, useRef } from "react";
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
import AddKpiTaskModal from "./AddKpiTaskModal";
import AddCreatorRoleModal from "./AddCreatorRoleModal";
import AddKpiWeightModal from "./AddKpiWeightModal";
import SelectedEmployeesModal from "./SelectedEmployeesModal";

// Add this helper function at the top of the file, before the TaskModal component
const getCurrentUserRole = () => {
  try {
    const authUser = localStorage.getItem('auth_user') || localStorage.getItem('user');
    if (authUser) {
      const user = JSON.parse(authUser);
      return user.role || user.user?.role || '';
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  return '';
};

// Also add this helper to check if user can see KPI type selection
const canSelectKpiType = (userRole) => {
  const allowedRoles = ['hr', 'admin', 'manager', 'human resources', 'hr manager'];
  return allowedRoles.includes(userRole.toLowerCase());
};

// Move this function outside of TaskModal, before the TaskModal component definition
const mergeTemplateWithAssignmentWeights = (templateWeights, assignmentWeights) => {
  // Create maps for fast lookups
  const templateMap = new Map();
  templateWeights.forEach(w => {
    const key = w.id || w.name;
    if (key) templateMap.set(key, { ...w, percentage: 0 });
  });
  
  const assignmentMap = new Map();
  if (Array.isArray(assignmentWeights)) {
    assignmentWeights.forEach(w => {
      // Try to match by id first, then by title/name
      const key = w.id || w.title;
      if (key) assignmentMap.set(key, w);
    });
  }
  
  // First add all template weights (with assignment percentages where available)
  const result = [];
  templateMap.forEach((templateWeight, key) => {
    if (assignmentMap.has(key)) {
      // This template weight exists in assignment weights - use assignment percentage
      const assignmentWeight = assignmentMap.get(key);
      result.push({
        id: templateWeight.id,
        title: templateWeight.name || assignmentWeight.title,
        description: templateWeight.description || assignmentWeight.description || '',
        percentage: assignmentWeight.percentage || 0
      });
      // Remove from assignment map so we don't add it twice
      assignmentMap.delete(key);
    } else {
      // This is a new template weight not in assignment - add with 0%
      result.push({
        id: templateWeight.id,
        title: templateWeight.name,
        description: templateWeight.description || '',
        percentage: 0
      });
    }
  });
  
  // Then add any remaining assignment weights that weren't in templates
  assignmentMap.forEach(weight => {
    result.push({
      id: weight.id,
      title: weight.title || weight.name || '',
      description: weight.description || '',
      percentage: weight.percentage || 0
    });
  });
  
  return result;
};

// Task Modal Component (shared between Add and Edit)
// NOTE: accepts `employees` prop now (list of {id, name, department})
const TaskModal = ({ isOpen, onClose, onSubmit, initialData = {}, isEdit = false, isLoading = false, employees = [] }) => {
  // Add new state for SelectedEmployeesModal
  const [showSelectedEmployeesModal, setShowSelectedEmployeesModal] = useState(false);

  // Add this new state for the weight modal
  const [isAddWeightModalOpen, setIsAddWeightModalOpen] = useState(false);
  
  // Add this new state for database weights
  const [dbWeights, setDbWeights] = useState([]);
  const [isLoadingWeights, setIsLoadingWeights] = useState(false);

  // Existing formData state - keep as is but update the initialization
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
    creatorRole: "",
    weights: [],
    // Use numeric 0/1 to match backend boolean (0 = regular, 1 = performance appraisal)
    kpi_type: 0,
    ...initialData,
  });

  // Add this useEffect to fetch weights from database
  useEffect(() => {
    const fetchWeights = async () => {
      setIsLoadingWeights(true);
      try {
        // Always fetch template weights
        const templateWeights = await PMSService.getKpiWeights();
        const mappedTemplateWeights = Array.isArray(templateWeights) ? templateWeights.map(w => ({
          id: w.id ?? null,
          name: w.name ?? '',
          description: w.description ?? '',
          percentage: 0
        })) : [];
        
        setDbWeights(mappedTemplateWeights);

        // For edit mode with existing weights, merge template weights with assignment weights
        if (isEdit && initialData?.weights) {
          const mergedWeights = mergeTemplateWithAssignmentWeights(
            mappedTemplateWeights,
            initialData.weights
          );
          
          setFormData(prev => ({
            ...prev,
            weights: mergedWeights
          }));
        } 
        // For create mode, just use template weights if no weights set
        else if (!isEdit) {
          const hasWeights = Array.isArray(formData.weights) && formData.weights.length > 0;
          if (!hasWeights) {
            setFormData(prev => ({
              ...prev,
              weights: mappedTemplateWeights.map(w => ({
                id: w.id,
                title: w.name,  // Use title for consistency
                name: w.name,   // Keep name as backup
                description: w.description,
                percentage: 0
              }))
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching KPI weights:', error);
        // Fallback to hardcoded weights if database fetch fails
        const fallbackWeights = [
          { title: "Consistent follow-up with customers for payments", description: "", percentage: 0 },
          { title: "Tax Compliance", description: "Preparation of monthly schedules and returns for VAT, SSCL, APIT, AIT, and Stamp Duty.", percentage: 0 },
          { title: "Accounting Entries and Provisions", description: "Recording salary entries and other provisions, reviewing General Ledger (GL) entries.", percentage: 0 },
          { title: "Management Reporting", description: "Completing monthly and ad hoc management reports efficiently and accurately.", percentage: 0 },
          { title: "Commitment to Quality", description: "Maintaining a high standard of accuracy and precision in all tasks.", percentage: 0 },
          { title: "Teamwork and Discipline", description: "Upholding strong teamwork and maintaining discipline in all professional activities.", percentage: 0 }
        ];
        setDbWeights(fallbackWeights);
        setFormData(prev => {
          const hasWeights = Array.isArray(prev.weights) && prev.weights.length > 0;
          if (!isEdit && !hasWeights) {
            return { ...prev, weights: fallbackWeights };
          }
          return prev;
        });
      } finally {
        setIsLoadingWeights(false);
      }
    };

    if (isOpen) {
      fetchWeights();
    }
  }, [isOpen, isEdit, initialData?.weights]);

  const [showWeights, setShowWeights] = useState(false); // State for weights dropdown
  const [empSearch, setEmpSearch] = useState("");

  // Local state for the small "+" Add KPI Task modal used inside TaskModal
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  
  // Creator roles from backend
  const [creatorRoles, setCreatorRoles] = useState([]);
  const [isLoadingCreatorRoles, setIsLoadingCreatorRoles] = useState(false);

  // Local state to open Add Creator Role modal
  const [isAddCreatorRoleModal, setIsAddCreatorRoleModal] = useState(false); // Fix: rename from isAddCreatorRoleModal

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
  
  // NEW: fetch tasks function moved outside useEffect so it can be called after create
  const fetchTaskOptions = async () => {
    setIsLoadingTasks(true);
    try {
      const tasks = await PMSService.getKpiTasks(); // [`PMSService.getKpiTasks`](d:/office/hr_system_frontend/src/services/PMS/PMSService.js)
      setTaskOptions(Array.isArray(tasks) ? tasks : []);
    } catch (e) {
      console.error("Error fetching KPI task names:", e);
      setTaskOptions([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Fetch KPI task names from backend on mount
  useEffect(() => {
    fetchTaskOptions();
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
  
  // Fetch creator roles once (extracted to a function so we can refresh on new create)
  useEffect(() => {
    let mounted = true;
    const fetchCreatorRoles = async () => {
      setIsLoadingCreatorRoles(true);
      try {
        const roles = await PMSService.getCreatorRoles(); // [`PMSService.getCreatorRoles`](d:/office/hr_system_frontend/src/services/PMS/PMSService.js)
        if (!mounted) return;
        setCreatorRoles(Array.isArray(roles) ? roles : []);
      } catch (err) {
        console.error("Error fetching creator roles:", err);
        if (mounted) setCreatorRoles([]);
      } finally {
        if (mounted) setIsLoadingCreatorRoles(false);
      }
    };
    fetchCreatorRoles();
    return () => { mounted = false; };
  }, []);

  // Reset form when modal opens with new data
  const prevIsOpen = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only reset form data when modal is actually opening for the first time
    if (isOpen && !prevIsOpen.current) {
      if (isEdit && initialData && Object.keys(initialData).length > 0) {
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
          weights: initialData.weights || dbWeights, // Use dbWeights as fallback
          // Ensure numeric 0/1 to match backend boolean (0 = regular, 1 = performance appraisal)
          kpi_type: initialData.kpi_type ? 1 : 0, // ensure numeric 0/1
        });
      } else if (!isEdit) {
        // Add mode: use database weights
        const hasExistingData = formData.name || formData.description || formData.assignees?.length > 0;
        if (!hasExistingData) {
          setFormData({
            name: "",
            description: "",
            startDate: "",
            endDate: "",
            assignees: [],
            company: "",
            department: "",
            category: "",
            priority: "medium",
            creatorRole: "",
            weights: dbWeights, // Use database weights
            kpi_type: false, // Default to regular KPI (false)
          });
        }
      }
    }
  }, [isOpen, isEdit, dbWeights]);
  
  // Add a separate useEffect to handle initialData changes only when necessary
  useEffect(() => {
    if (isOpen && isEdit && initialData && Object.keys(initialData).length > 0) {
      const currentFormHasData = formData.name || formData.description || formData.assignees?.length > 0;
      if (!currentFormHasData || (initialData.id && initialData.id !== formData.id)) {
        setFormData({
          id: initialData.id, // Track the record ID
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
          weights: initialData.weights || dbWeights, // Use dbWeights as fallback
          // numeric 0/1
          kpi_type: initialData.kpi_type ? 1 : 0, // numeric 0/1
        });
      }
    }
  }, [initialData?.id, isOpen, isEdit, dbWeights]);

  // Ensure numeric IDs for company/department/creatorRole
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;

    // Handle KPI type conversion
    if (name === 'kpi_type') {
      // Convert select values '0'|'1' (strings) into numeric 0/1
      processedValue = (value === '1' || value === 1 || value === true || value === 'true') ? 1 : 0;
    }

    // Convert string values to numbers for specific fields
    if (['company', 'department'].includes(name) && value !== '') {
      processedValue = parseInt(value, 10);
    }

    // If company or department changes, clear assignees and search results to avoid "Unknown" items
    if (name === 'company' || name === 'department') {
      // reset employee search and results, and clear selected assignees
      setEmpSearch("");
      setCompanyEmployees([]);
      setFormData(prev => ({
        ...prev,
        [name]: processedValue,
        assignees: []
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
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

  // Mode-aware min start date:
  // - Create mode: disallow past dates (min = today)
  // - Edit mode: allow selecting back to the record creation date (if provided) or existing startDate
  const computeMinStartDate = (initial) => {
    if (!isEdit) return getToday();
    const created = initial?.created_at || initial?.createdAt || initial?.created || initial?.startDate || null;
    if (created) {
      try {
        return new Date(created).toISOString().split('T')[0];
      } catch (e) {
        // fallthrough
      }
    }
    return initial?.startDate || getToday();
  };

  const minStartDateForMode = computeMinStartDate(initialData);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate weights total: must not exceed 100%
    const totalWeights = Array.isArray(formData.weights)
      ? formData.weights.reduce((sum, w) => sum + (Number(w.percentage) || 0), 0)
      : 0;
    
    if (totalWeights > 100) {
      await Swal.fire({
        icon: "warning",
        title: "Weights sum exceeds 100%",
        html: `The total of all performance criteria weights is <strong>${totalWeights}%</strong>. Please adjust so the total does not exceed <strong>100%</strong>.`,
        confirmButtonColor: "#F59E0B",
      });
      return;
    }

    // New: Check weights for each assignee (only for regular KPIs)
    if (!formData.kpi_type) { // Only check for regular KPIs
      try {
        const checkData = {
          assignees: formData.assignees,
          start_date: formData.startDate,
          end_date: formData.endDate,
          weights: formData.weights,
          kpi_task_id: isEdit && initialData?.id ? initialData.id : null // Fix: Use initialData.id instead of currentKpi.id
        };

        const weightCheck = await PMSService.checkAssigneeWeights(checkData);

        if (weightCheck.hasOverLimit) {
          let message = '<div class="text-left">';
          message += '<p class="mb-4">Cannot assign this KPI task. The following employees would exceed 100% total weights for the month:</p>';
          message += '<ul class="list-disc pl-4 space-y-2">';
          
          weightCheck.overLimitAssignees.forEach(assignee => {
            message += `
              <li>
                <strong>${assignee.name}</strong><br>
                Current total: ${assignee.currentTotal}%<br>
                New task weights: ${totalWeights}%<br>
                Would exceed by: ${(assignee.currentTotal + totalWeights - 100).toFixed(1)}%
              </li>
            `;
          });
          
          message += '</ul></div>';

          await Swal.fire({
            icon: "warning",
            title: "Weight Limit Exceeded",
            html: message,
            confirmButtonColor: "#F59E0B",
          });
          return;
        }
      } catch (error) {
        console.error("Error checking assignee weights:", error);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to validate assignee weights. Please try again.",
        });
        return;
      }
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
  
  // handle single weight input change with total <= 100% validation
  const handleWeightChange = (index, value) => {
    const newVal = Number(value) || 0;
    setFormData(prev => {
      const currentWeights = Array.isArray(prev.weights) ? [...prev.weights] : [];
      // ensure an entry exists for this index
      while (currentWeights.length <= index) {
        currentWeights.push({ title: "", description: "", percentage: 0 });
      }
      // simulate new total
      const simulated = currentWeights.map((w, i) => i === index ? ({ ...w, percentage: newVal }) : w);
      const total = simulated.reduce((s, w) => s + (Number(w.percentage) || 0), 0);
      if (total > 100) {
        Swal.fire({
          icon: 'warning',
          title: 'Weights exceed 100%',
          html: `The total of all criteria would be <strong>${total}%</strong>. Please adjust to make the total <= 100%.`,
          confirmButtonColor: '#F59E0B'
        });
        // reject the change by returning previous state unchanged
        return prev;
      }
      // commit the change
      currentWeights[index] = { ...(currentWeights[index] || {}), percentage: newVal };
      return { ...prev, weights: currentWeights };
    });
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

  // Add this inside the TaskModal component, after the creator role section and before the weights section
  const currentUserRole = getCurrentUserRole();
  const showKpiTypeSelection = canSelectKpiType(currentUserRole);

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
                <div className="flex items-center gap-2">
                  {/* Select with visible dropdown icon */}
                  <div className="relative flex-1">
                    <select
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none pr-10" /* space for icon */
                      disabled={isLoadingTasks}
                    >
                      <option value="">Select task name</option>
                      {taskOptions.map((t) => (
                        <option
                          key={t.id ?? t.task_name}
                          value={t.task_name}
                        >
                          {t.task_name}
                        </option>
                      ))}
                    </select>
                    {/* dropdown icon */}
                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddTaskModalOpen(true)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    title="Add new KPI task"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {isLoadingTasks && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
               {/* Add KPI Task Modal */}
               <AddKpiTaskModal
                 isOpen={isAddTaskModalOpen}
                 onClose={() => setIsAddTaskModalOpen(false)}
                 onCreated={async (newTask) => {
                   // refresh authoritative list from backend so dropdown shows exact DB rows
                   await fetchTaskOptions();
                   // select the created task (backend record should set task_name)
                   if (newTask && newTask.task_name) {
                     setFormData(prev => ({ ...prev, name: newTask.task_name }));
                   }
                   setIsAddTaskModalOpen(false);
                 }}
               />
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
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    name="creatorRole"
                    value={formData.creatorRole}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none pr-10"
                    disabled={isLoadingCreatorRoles}
                  >
                    <option value="">Select Creator Role</option>
                    {creatorRoles.map((r) => (
                      // Use the role name string so the UI can call .split() safely
                      <option key={r.id ?? r.role_name} value={r.role_name}>
                        {r.role_name || r.name || `Role ${r.id}`}
                      </option>
                    ))}
                  </select>
                  {/* dropdown icon */}
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddCreatorRoleModal(true)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                  title="Add new Creator Role"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {isLoadingCreatorRoles && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              )}
              
              {/* Add Creator Role Modal */}
              <AddCreatorRoleModal
                isOpen={isAddCreatorRoleModal} // This should now work
                onClose={() => setIsAddCreatorRoleModal(false)}
                onCreated={async (newRole) => {
                  // refresh authoritative list and select created role
                  try {
                    const roles = await PMSService.getCreatorRoles();
                    setCreatorRoles(Array.isArray(roles) ? roles : []);
                    if (newRole && (newRole.role_name || newRole.name)) {
                      setFormData(prev => ({ ...prev, creatorRole: newRole.role_name || newRole.name }));
                    }
                  } catch (err) {
                    console.error("Failed to refresh creator roles after create:", err);
                  } finally {
                    setIsAddCreatorRoleModal(false);
                  }
                }}
              />
            </div>

            {/* KPI Type Selection - Only for HR and higher roles */}
            {showKpiTypeSelection && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  KPI Type*
                </label>
                <select
                  name="kpi_type"
                  value={String(formData.kpi_type)} // '0' or '1'
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none"
                >
                  <option value="0">Regular KPI</option>
                  <option value="1">Performance Appraisal</option>
                </select>
              </div>
            )}

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
              
              {/* Add the new button with flex container */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">Configure custom weight criteria</span>
                <button
                  type="button"
                  onClick={() => setIsAddWeightModalOpen(true)}
                  className="inline-flex items-center px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Manage Weights
                </button>
              </div>
              
              {showWeights && (
                <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {formData.weights.map((weight, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <strong>{weight.title || weight.name}</strong>
                          {weight.description && (
                            <span className="text-xs text-gray-500 ml-1"> - {weight.description}</span>
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
                    min={minStartDateForMode}
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

              {/* Added employees - Enhanced display with view all button */}
              <div className="mt-3">
                <div className="flex flex-wrap gap-2 items-center">
                  {formData.assignees && formData.assignees.length > 0 ? (
                    <>
                      {/* Show first 5 assignees */}
                      {formData.assignees.slice(0, 5).map((id) => {
                        const emp = findEmployee(id);
                        if (!emp) return null;
                        return (
                          <div key={id} className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm">
                            <div className="font-medium truncate max-w-[150px]">{emp.name}</div>
                            <button 
                              type="button" 
                              onClick={() => removeEmployee(id)} 
                              className="p-0.5 hover:bg-indigo-100 rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                      
                      {/* Show count and view button if more than 5 assignees */}
                      {formData.assignees.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setShowSelectedEmployeesModal(true)}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors"
                        >
                          +{formData.assignees.length - 5} more • View all
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No employees assigned</p>
                  )}
                </div>
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

        {/* Add Weight Modal */}
        <AddKpiWeightModal
          isOpen={isAddWeightModalOpen}
          onClose={() => setIsAddWeightModalOpen(false)}
          onCreated={async (newWeight) => {
            // refresh authoritative list and include the new weight
            try {
              const weights = await PMSService.getKpiWeights();
              const mappedWeights = Array.isArray(weights) ? weights.map(w => ({
                id: w.id ?? null, // Include the ID for proper mapping
                title: w.name,
                description: w.description || '',
                percentage: 0
              })) : [];
              
              setDbWeights(mappedWeights);
              
              // Always update the form data weights to include the new weight
              setFormData(prev => {
                // For both edit and create modes, we need to handle this properly
                const currentWeights = Array.isArray(prev.weights) ? prev.weights : [];
                
                // Check if the new weight already exists in current weights
                const newWeightExists = currentWeights.some(w => 
                  (w.id && w.id === newWeight.id) || 
                  (w.title === newWeight.name) || 
                  (w.name === newWeight.name)
                );
                
                if (!newWeightExists) {
                  // Add the new weight to the existing weights
                  const updatedWeights = [
                    ...currentWeights,
                    {
                      id: newWeight.id,
                      title: newWeight.name,
                      name: newWeight.name,
                      description: newWeight.description || '',
                      percentage: 0
                    }
                  ];
                  
                  return {
                    ...prev,
                    weights: updatedWeights
                  };
                } else {
                  // If it already exists, just ensure we have the latest template data
                  const updatedWeights = currentWeights.map(w => {
                    if ((w.id && w.id === newWeight.id) || (w.title === newWeight.name)) {
                      return {
                        ...w,
                        title: newWeight.name,
                        name: newWeight.name,
                        description: newWeight.description || w.description
                      };
                    }
                    return w;
                  });
                  
                  return {
                    ...prev,
                    weights: updatedWeights
                  };
                }
              });
              
              // Show success feedback
              await Swal.fire({
                icon: "success",
                title: "Weight Added",
                text: `"${newWeight.name}" has been added to the criteria list.`,
                timer: 1500,
                showConfirmButton: false,
              });
              
            } catch (error) {
              console.error('Error fetching KPI weights after creation:', error);
              await Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to refresh weight list. Please close and reopen the modal.",
              });
            } finally {
              setIsAddWeightModalOpen(false);
            }
          }}
        />

        {/* Selected Employees Modal (opened from the "View all" assignees button) */}
        <SelectedEmployeesModal
          isOpen={showSelectedEmployeesModal}
          onClose={() => setShowSelectedEmployeesModal(false)}
          selectedEmployees={formData.assignees || []}
          allEmployees={companyEmployees.length ? companyEmployees : employees}
          onRemoveEmployee={removeEmployee}
          companyName={getCompanyName(formData.company)}
          departmentName={getDepartmentName(formData.department)}
        />
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, kpiName, isLoading }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w/full max-w-md mx-4">
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
                  const empId = parseInt(idStr);
                  const emp = getEmployee(idStr);
                  const entry = updatesFor(empId);
                  
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

  // Add missing state for the small "Add Task" (+) modal next to Task Name select
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  
  // Creator roles from backend
  const [creatorRoles, setCreatorRoles] = useState([]);
  const [isLoadingCreatorRoles, setIsLoadingCreatorRoles] = useState(false);

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
      // Use the service to get assignments (see [`PMSService.getKpiTaskAssignments`](d:/office/hr_system_frontend/src/services/PMS/PMSService.js))
      const raw = await PMSService.getKpiTaskAssignments();
      const list = Array.isArray(raw) ? raw : (raw?.data || []);

      // Normalize items: ensure kpi_type is numeric 0 or 1 and keep other fallbacks consistent
      const normalized = list.map(item => {
        // Accept many possible shapes from backend: boolean, number, or string
        const rawType = item.kpi_type ?? item.kpiType ?? item.kpi_type_raw ?? null;
        const kpi_type = (rawType === true || rawType === 1 || rawType === '1' || rawType === 'true') ? 1 : 0;

        // Also normalize date keys sometimes named differently
        const startDate = item.startDate ?? item.start_date ?? item.created_at ?? null;
        const endDate = item.endDate ?? item.end_date ?? item.due_date ?? null;

        return {
          ...item,
          kpi_type,
          startDate,
          endDate
        };
      });

      setKpis(normalized);
      
      // Also refresh KPI stats when tasks are fetched
      await fetchKpiStats(filterStartDate, filterEndDate);
    } catch (e) {
      setError("Failed to fetch KPI task assignments");
      console.error(e);
      setKpis([]);
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
        kpi_type: formData.kpi_type, // Include the KPI type
      };
      
      const result = await PMSService.createKpiTaskAssignment(data);
      
      // Show success message using SweetAlert
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: `KPI task assignment created successfully. ${result.total_created || result.length || 1} assignment(s) created.`,
        timer: 2000,
        showConfirmButton: false,
      });
      
      // Only close modal and refresh data after successful creation
      setIsAddModalOpen(false);
      await fetchKpis(); // This now includes stats refresh

    } catch (e) {
      console.error(e);
      
      // Handle duplicate error specifically
      if (e.response?.status === 422 && e.response?.data?.duplicates) {
        const duplicates = e.response.data.duplicates;
        let duplicateList = duplicates.map(dup => 
          `• ${dup.employee} (${dup.attendance_no})\n  Existing: ${dup.existing_start} to ${dup.existing_end}\n  New: ${dup.new_start} to ${dup.new_end}`
        ).join('\n\n');

        await Swal.fire({
          icon: "warning",
          title: "Duplicate Assignments Detected",
          text: `The following employees already have this KPI task assigned with overlapping dates:\n\n${duplicateList}\n\nPlease choose different date ranges that don't overlap with existing assignments.`,
          confirmButtonColor: "#F59E0B",
          customClass: {
            popup: 'text-left'
          }
        });
        // IMPORTANT: Don't close modal or reset any state here
        // Let the user fix the validation issues
      } else {
        // Handle other errors
        const errorMessage = e.response?.data?.message || e.response?.data?.error || "Failed to create KPI task assignment. Please try again.";
        
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
        // IMPORTANT: Don't close modal or reset any state here either
      }
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
        kpi_type: formData.kpi_type, // Include the KPI type
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
      
      // Refresh the KPI list AND stats
      await fetchKpis(); // This now includes stats refresh
    
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
      
      // Refresh the KPI list AND stats
      await fetchKpis(); // This now includes stats refresh
    
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
  const openEditModal = async (kpi) => {
    try {
      // Fetch current template weights from database
      const templateWeights = await PMSService.getKpiWeights();
      const mappedTemplateWeights = Array.isArray(templateWeights) 
        ? templateWeights.map(w => ({
            id: w.id ?? null,
            title: w.name ?? '',
            description: w.description ?? '',
            percentage: 0
          })) 
        : [];
      
      // Get template weight IDs for filtering
      const templateWeightIds = new Set(mappedTemplateWeights.map(w => w.id).filter(id => id !== null));
      
      // Filter existing assignment weights to only include:
      // 1. Weights that exist in current templates, OR
      // 2. Weights that have assigned percentage > 0 (to preserve user's work)
      const existingWeights = Array.isArray(kpi.weights) ? kpi.weights : [];
      const filteredExistingWeights = existingWeights.filter(weight => {
        const hasId = weight.id !== null && weight.id !== undefined;
        const existsInTemplate = hasId && templateWeightIds.has(weight.id);
        const hasAssignedPercentage = weight.percentage && weight.percentage > 0;
        
        // Keep weight if it exists in current templates OR has assigned percentage
        return existsInTemplate || hasAssignedPercentage;
      });
      
      // Merge filtered existing weights with template weights
      const mergedWeights = mergeTemplateWithAssignmentWeights(mappedTemplateWeights, filteredExistingWeights);
      
      // Helper function to format date consistently
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
          // Handle various date formats that might come from the API
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '';
          
          // Format as YYYY-MM-DD for HTML date input
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          
          return `${year}-${month}-${day}`;
        } catch (error) {
          console.error('Error formatting date:', dateString, error);
          return '';
        }
      };
      
      // Set currentKpi with cleaned weights and properly formatted dates
      setCurrentKpi({
        ...kpi,
        // Ensure dates are in the correct format for HTML date inputs
        startDate: formatDateForInput(kpi.startDate),
        endDate: formatDateForInput(kpi.endDate),
        // Preserve other fields with fallbacks
        name: kpi.name || '',
        description: kpi.description || '',
        company: kpi.company || kpi.company_id || '',
        department: kpi.department || kpi.departmentId || kpi.department_id || '',
        departmentId: kpi.departmentId || kpi.department_id || '',
        companyName: kpi.companyName || '',
        departmentName: kpi.departmentName || '',
        assignees: Array.isArray(kpi.assignees) ? [...kpi.assignees] : [],
        creatorRole: kpi.creatorRole || kpi.creator?.role || '',
        priority: kpi.priority || 'medium',
        status: kpi.status || 'active',
        weights: mergedWeights,
        // Add any other fields that might be needed
        id: kpi.id,
        created_at: kpi.created_at || kpi.createdAt,
        updated_at: kpi.updated_at || kpi.updatedAt,
        last_updated: kpi.last_updated || kpi.lastUpdated
      });
      
      // Open edit modal
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching template weights for edit:", error);
      
      // Fall back to just opening the modal with existing weights but still fix dates
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '';
          
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          
          return `${year}-${month}-${day}`;
        } catch (error) {
          console.error('Error formatting date:', dateString, error);
          return '';
        }
      };
      
      setCurrentKpi({
        ...kpi,
        startDate: formatDateForInput(kpi.startDate),
        endDate: formatDateForInput(kpi.endDate),
        departmentId: kpi.departmentId || kpi.department_id || '',
        creatorRole: kpi.creatorRole || kpi.creator?.role || '',
        assignees: Array.isArray(kpi.assignees) ? [...kpi.assignees] : []
      });
      setIsEditModalOpen(true);
    }
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
          // Ensure numeric 0/1 to match backend boolean (0 = regular, 1 = performance appraisal)
          kpi_type: currentKpi.kpi_type ? 1 : 0, // ensure numeric 0/1
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
              <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <span role="img" aria-label="total">📊</span>
                Total KPIs
              </p>
              <p className="text-2xl font-bold text-gray-900">{kpis.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <div className="p-2 bg-indigo-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <span role="img" aria-label="ontarget">✅</span>
                On Target
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoadingKpiStats ? "—" : kpiStats.onTarget}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpiStats.startDate && kpiStats.endDate ? `${kpiStats.startDate} → ${kpiStats.endDate}` : "This month"}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <span role="img" aria-label="attention">⚠️</span>
                Need Attention
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoadingKpiStats ? "—" : kpiStats.needAttention}
              </p>
              <p className="text-xs text-gray-400 mt-1">No submissions in period</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignees
                </th>
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

                  {/* KPI Type */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        kpi.kpi_type 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {kpi.kpi_type ? 'Performance Appraisal' : 'Regular KPI'}
                    </span>
                  </td>

                  {/* Assignees */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {kpi.assignees && kpi.assignees.length > 0 ? (
                        kpi.assignees.slice(0, 3).map((assigneeId) => {
                          const employee = allEmployeesForModals.find(emp => 
                            String(emp.id) === String(assigneeId)
                          ) || { 
                            id: assigneeId, 
                            name: `Employee ${assigneeId}`, 
                            department: "Unknown" 
                          };
                          
                          return (
                            <div key={assigneeId} className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="h-3 w-3 text-indigo-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-900 truncate">
                                  {employee.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {employee.department}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-500">No assignees</span>
                      )}
                      
                      {/* Show count if more than 3 assignees */}
                      {kpi.assignees && kpi.assignees.length > 3 && (
                        <div className="text-xs text-gray-500 mt-1">
                          +{kpi.assignees.length - 3} more
                        </div>
                      )}
                    </div>
                  </td>

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
          <p className="text-gray-600 mb-4">
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