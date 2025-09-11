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
} from "lucide-react";
import PMSService from "../../../services/PMS/PMSService";
import PMSDummyDataStore from "@services/PMS/PMSDummyDataStore";

// Add predefined task names for dropdown (placed near top, after imports)
const predefinedTaskNames = [
  "Job Knowledge and Skills",
  "Quality of Work",
  "Productivity",
  "Communication Skills",
  "Teamwork and Collaboration",
  "Behavior at work",
  "Problem-Solving and Decision-Making",
  "Attendance and Punctuality",
  "Adaptability and Flexibility",
  "Self-Development",
  "Discipline and conduct at work",
  "Adherence to the given Guidelines"
];

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
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompaniesData = async () => {
      setIsLoadingCompanies(true);
      try {
        // In a real implementation, you would fetch from API
        // const response = await PMSService.getCompanies();
        // For demo, using dummy data
        const dummyCompanies = [
          { id: "1", name: "Acme Corporation" },
          { id: "2", name: "Globex Industries" },
          { id: "3", name: "Wayne Enterprises" }
        ];
        setCompanies(dummyCompanies);
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    
    fetchCompaniesData();
  }, []);

  // Fetch departments when company changes
  useEffect(() => {
    const fetchDepartmentsData = () => {
      if (!formData.company) {
        setDepartments([]);
        return;
      }

      setIsLoadingDepartments(true);
      // Synchronous fetch for dummy data
      let dummyDepartments = [];
      if (formData.company === "1") {
        dummyDepartments = [
          { id: "101", name: "Sales" },
          { id: "102", name: "Customer Service" },
          { id: "103", name: "Engineering" }
        ];
      } else if (formData.company === "2") {
        dummyDepartments = [
          { id: "201", name: "Marketing" },
          { id: "202", name: "HR" },
          { id: "203", name: "Operations" }
        ];
      } else if (formData.company === "3") {
        dummyDepartments = [
          { id: "301", name: "Research & Development" },
          { id: "302", name: "Finance" },
          { id: "303", name: "IT" }
        ];
      }
      setDepartments(dummyDepartments);
      setIsLoadingDepartments(false);
    };
    
    fetchDepartmentsData();
  }, [formData.company]);

  useEffect(() => {
    // Reset form when modal opens with new data
    setFormData({
      name: initialData.name || "",
      description: initialData.description || "",
      startDate: initialData.startDate || "",
      endDate: initialData.endDate || "",
      assignees: initialData.assignees ? [...initialData.assignees] : [],
      // Ensure we use the right property names for company and department
      company: initialData.company || "",
      department: initialData.departmentId || initialData.department || "",
      category: initialData.category || "",
      priority: initialData.priority || "medium",
      creatorRole: initialData.creator?.role || initialData.creatorRole || "",
      weights: initialData.weights || [ // Initialize weights if not present - set to empty
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset department if company changes
    if (name === "company") {
      setFormData(prev => ({
        ...prev,
        department: ""
      }));
    }
  };

  // Filter employees based on selected company and department
  const filteredEmployees = employees.filter(emp => {
    // Only include employees that match the search term
    const matchesSearch = 
      emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
      emp.department.toLowerCase().includes(empSearch.toLowerCase());
    
    // If no company is selected, just filter by search term
    if (!formData.company) return matchesSearch;
    
    // For demo, we'll map employees to companies based on ID
    const empCompany = emp.id <= 2 ? "1" : emp.id <= 4 ? "2" : "3";
    
    // If no department is selected, filter by company and search term (auto-fetch all employees from company's departments)
    if (!formData.department) return empCompany === formData.company && matchesSearch;
    
    // Otherwise, filter by company, department, and search term
    const deptName = departments.find(d => d.id === formData.department)?.name;
    return empCompany === formData.company && emp.department === deptName && matchesSearch;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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

  const handleWeightChange = (index, value) => {
    const updatedWeights = [...formData.weights];
    updatedWeights[index].percentage = parseInt(value, 10) || 0;
    setFormData(prev => ({
      ...prev,
      weights: updatedWeights
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Name*
              </label>
              <select
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select task name</option>
                {predefinedTaskNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
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
              <select
                name="creatorRole"
                value={formData.creatorRole}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                <option value="">Select Creator Role</option>
                <option value="Management">Management</option>
                <option value="Senior Management">Senior Management</option>
                <option value="Executive">Executive</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Department Head">Department Head</option>
                <option value="Director">Director</option>
              </select>
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

            {/* Company Selection - NEW */}
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

            {/* Department Selection - Now optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department (Optional)
              </label>
              <div className="relative">
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  // Removed 'required' to make it optional
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none"
                  disabled={!formData.company || isLoadingDepartments}
                >
                  <option value="">Select Department (Optional)</option>
                  {departments.map(department => (
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
                  placeholder="Search employees by name or department..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  disabled={!formData.company}
                />
              </div>

              {!formData.company && (
                <p className="text-xs text-amber-600 mt-1">Please select a company to search employees</p>
              )}

              {/* Search results */}
              {empSearch && filteredEmployees.length > 0 && formData.company && (
                <div className="mt-2 max-h-40 overflow-auto border border-gray-100 rounded-lg bg-white shadow-sm">
                  {filteredEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                      <div>
                        <div className="text-sm font-medium">{emp.name}</div>
                        <div className="text-xs text-gray-500">{emp.department}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addEmployee(emp)}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm"
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
                {formData.assignees && formData.assignees.length === 0 && (
                  <div className="text-xs text-gray-500">No employees added</div>
                )}
                {formData.assignees && formData.assignees.map((id) => {
                  const emp = employees.find(e => e.id.toString() === id);
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
    const normalizedId = typeof id === "string" ? parseInt(id, 10) : id;
    // try numeric match first, then fallback to string match
    return (
      employees.find(e => e.id === normalizedId || String(e.id) === String(id)) ||
      { id: normalizedId, name: "Unknown", department: "" }
    );
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

const KPIs = () => {
  const [kpis, setKpis] = useState([]);
  const [filteredKpis, setFilteredKpis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentKpi, setCurrentKpi] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Shared employees list used by TaskModal and TaskViewModal
  const [employees] = useState([
    { id: 1, name: "Sarah Johnson", department: "Customer Service" },
    { id: 2, name: "Mike Chen", department: "Sales" },
    { id: 3, name: "Emma Davis", department: "HR" },
    { id: 4, name: "John Smith", department: "Operations" },
  ]);

  // Change this to match the employee ID you're assigning tasks to
  const [currentEmployeeId, setCurrentEmployeeId] = useState("2"); // Or whichever ID you're using

  // Add these maps for company and department names (matching TaskModal)
  const companyMap = {
    "1": "Acme Corporation",
    "2": "Globex Industries",
    "3": "Wayne Enterprises"
  };

  const departmentMap = {
    "101": "Sales",
    "102": "Customer Service",
    "103": "Engineering",
    "201": "Marketing",
    "202": "HR",
    "203": "Operations",
    "301": "Research & Development",
    "302": "Finance",
    "303": "IT"
  };

  // Sample data (replace with actual API call)
  const sampleKpis = [
    {
      id: 1,
      name: "Customer Satisfaction Score",
      description: "Measure of customer satisfaction through surveys",
      target: 85,
      current: 78,
      unit: "%",
      trend: "up",
      status: "active",
      progress: 25,
      department: "Customer Service",
      company: "1",
      departmentId: "101",
      companyName: "Acme Corporation",
      departmentName: "Customer Service",
      owner: "", // owner cleared — UI shows creator role instead
      creator: { name: "Sarah Johnson", role: "Team Lead", date: "2024-01-01T09:00:00Z" },
      assignees: ["1"],
      assigneeUpdates: [
        {
          employeeId: 1,
          updates: [
            { date: "2024-01-05T09:00:00Z", note: "Initial assignment", author: "Manager", progressPercentage: 0 },
            { date: "2024-02-01T14:30:00Z", note: "Submitted first draft of report", author: "Sarah Johnson", progressPercentage: 20 },
          ]
        }
      ],
      startDate: "2023-12-01",
      endDate: "2024-03-31",
      lastUpdated: "2024-02-01T14:30:00Z",
      frequency: "Monthly",
      category: "Customer",
      weights: [ // Add weights to sample data with new structure
        { title: "Consistent follow-up with customers for payments", description: "", percentage: 15 },
        { title: "Tax Compliance", description: "Preparation of monthly schedules and returns for VAT, SSCL, APIT, AIT, and Stamp Duty. Also responsible for attending to tax matters as needed.", percentage: 20 },
        { title: "Accounting Entries and Provisions", description: "Recording salary entries and other provisions, reviewing General Ledger (GL) entries, and following up on necessary corrections.", percentage: 25 },
        { title: "Management Reporting", description: "Completing monthly and ad hoc management reports efficiently and accurately.", percentage: 15 },
        { title: "Commitment to Quality", description: "Maintaining a high standard of accuracy and precision in all tasks.", percentage: 20 },
        { title: "Teamwork and Discipline", description: "Upholding strong teamwork and maintaining discipline in all professional activities.", percentage: 5 }
      ],
    },
    {
      id: 2,
      name: "Revenue Growth Rate",
      description: "Quarterly revenue growth percentage",
      target: 15,
      current: 18,
      unit: "%",
      trend: "up",
      status: "active",
      progress: 45,
      department: "Sales",
      company: "2",
      departmentId: "201",
      companyName: "Globex Industries",
      departmentName: "Sales",
      owner: "Executive",
      creator: { name: "Mike Chen", role: "Supervisor", date: "2024-01-10T11:00:00Z" },
      assignees: ["2","4"],
      assigneeUpdates: [
        {
          employeeId: 2,
          updates: [
            { date: "2024-01-12T11:00:00Z", note: "Provided Q4 numbers", author: "Mike Chen", progressPercentage: 40 }
          ]
        },
        {
          employeeId: 4,
          updates: [
            { date: "2024-01-15T10:00:00Z", note: "Assisted with data cleanup", author: "John Smith", progressPercentage: 10 }
          ]
        }
      ],
      startDate: "2023-11-01",
      endDate: "2024-02-28",
      lastUpdated: "2024-01-15T10:00:00Z",
      frequency: "Quarterly",
      category: "Financial",
    },
    {
      id: 3,
      name: "Employee Turnover Rate",
      description: "Percentage of employees leaving the organization",
      target: 8,
      current: 12,
      unit: "%",
      trend: "down",
      status: "attention",
      progress: 10,
      department: "HR",
      company: "3",
      departmentId: "301",
      companyName: "Wayne Enterprises",
      departmentName: "HR",
      owner: "",
      creator: { name: "Emma Davis", role: "Department Head", date: "2024-01-08T09:00:00Z" },
      assignees: ["3"],
      assigneeUpdates: [
        {
          employeeId: 3,
          updates: [
            { date: "2024-01-10T09:00:00Z", note: "Reviewed exit interviews", author: "Emma Davis", progressPercentage: 5 },
            { date: "2024-02-01T14:30:00Z", note: "Identified trends in departures", author: "Emma Davis", progressPercentage: 10 },
          ]
        }
      ],
      startDate: "2023-10-15",
      endDate: "2024-01-31",
      lastUpdated: "2024-02-01T14:30:00Z",
      frequency: "Monthly",
      category: "HR",
    },
    {
      id: 4,
      name: "Project Completion Rate",
      description: "Percentage of projects completed on time",
      target: 90,
      current: 95,
      unit: "%",
      trend: "up",
      status: "active",
      progress: 80,
      department: "Operations",
      company: "1",
      departmentId: "103",
      companyName: "Acme Corporation",
      departmentName: "Operations",
      owner: "Supervisor",
      creator: { name: "John Smith", role: "Supervisor", date: "2024-01-02T10:00:00Z" },
      assignees: ["4"],
      assigneeUpdates: [
        {
          employeeId: 4,
          updates: [
            { date: "2024-01-15T10:00:00Z", note: "Project A completed", author: "John Smith", progressPercentage: 60 },
            { date: "2024-01-20T10:00:00Z", note: "Project B on track", author: "John Smith", progressPercentage: 80 },
          ]
        }
      ],
      startDate: "2024-01-01",
      endDate: "2024-03-15",
      lastUpdated: "2024-01-20T10:00:00Z",
      frequency: "Weekly",
      category: "Operations",
    },
    // Example new KPI with zero-initialized progress
    {
      id: 5,
      name: "New Product Adoption",
      description: "Track adoption of the new product feature",
      target: 100,
      current: 100,
      unit: "%",
      trend: "up",
      status: "active",
      progress: 0,
      department: "Product",
      company: "2",
      departmentId: "202",
      companyName: "Globex Industries",
      departmentName: "Product",
      owner: "",
      creator: { name: "Linda Perez", role: "Product Manager", date: new Date().toISOString() },
      assignees: [],
      assigneeUpdates: [],
      startDate: new Date().toISOString().slice(0,10),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0,10),
      lastUpdated: new Date().toISOString(),
      frequency: "Monthly",
      category: "Product",
    },
  ];

  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = () => {
    setIsLoading(true);
    try {
      const all = PMSDummyDataStore.getAllKpiTasks();
      setKpis(all);
    } catch (e) {
      setError("Failed to fetch KPIs");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [kpis, searchTerm, statusFilter, departmentFilter]);

  const applyFilters = () => {
    let filtered = kpis;

    if (searchTerm) {
      filtered = filtered.filter(
        (kpi) =>
          kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          kpi.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          kpi.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((kpi) => kpi.status === statusFilter);
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((kpi) => kpi.department === departmentFilter);
    }

    setFilteredKpis(filtered);
    setCurrentPage(1);
  };

  // CRUD Operations
  const handleAddKpi = async (formData) => {
    setIsSubmitting(true);
    try {
      if (!formData.assignees || formData.assignees.length === 0) {
        alert("Please add at least one assignee before creating the KPI task.");
        setIsSubmitting(false);
        return;
      }

      await new Promise(r => setTimeout(r, 500)); // simulate
      const firstAssignee = formData.assignees?.length ? parseInt(formData.assignees[0]) : null;
      const newKpi = {
        name: formData.name,
        description: formData.description,
        target: 0,
        current: 0,
        unit: "%",
        trend: "up",
        status: "active",
        progress: 0,
        // Add company/department fields from formData
        company: formData.company,
        departmentId: formData.department,
        companyName: companyMap[formData.company] || "",
        departmentName: departmentMap[formData.department] || "",
        department: departmentMap[formData.department] || "", // Keep as name for consistency with existing data
        owner: "",
        creator: {
          name: "",
          role: formData.creatorRole || "",
          date: new Date().toISOString()
        },
        assignees: (formData.assignees || []).map(a => a.toString()),
        assigneeUpdates: (formData.assignees || []).map(a => ({
          employeeId: parseInt(a),
          updates: [{
            date: new Date().toISOString(),
            note: "Task assigned",
            author: "System",
            progressPercentage: 0
          }]
        })),
        startDate: formData.startDate,
        endDate: formData.endDate,
        lastUpdated: new Date().toISOString(),
        frequency: "Monthly",
        category: firstAssignee === 1 ? "Customer" :
                  firstAssignee === 2 ? "Financial" :
                  firstAssignee === 3 ? "HR" : "Operations",
        completionStatus: "not-started",
        documentCount: 0,
        priority: formData.priority || "medium",
        weights: formData.weights, // Add weights to new KPI
      };

      PMSDummyDataStore.addKpiTask(newKpi);
      setKpis(PMSDummyDataStore.getAllKpiTasks());
      setIsAddModalOpen(false);
      alert("KPI task created & performance reviews generated.");
    } catch (e) {
      console.error(e);
      alert("Failed to create KPI task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditKpi = async (formData) => {
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      PMSDummyDataStore.updateKpiTask(currentKpi.id, {
        name: formData.name,
        description: formData.description,
        assignees: (formData.assignees || []).map(a => a.toString()),
        startDate: formData.startDate,
        endDate: formData.endDate,
        priority: formData.priority,
        // Add company/department fields from formData
        company: formData.company,
        departmentId: formData.department,
        companyName: companyMap[formData.company] || "",
        departmentName: departmentMap[formData.department] || "",
        department: departmentMap[formData.department] || "", // Keep as name for consistency
        creator: {
          ...(currentKpi.creator || {}),
          role: formData.creatorRole || currentKpi.creator?.role || ""
        }
      });
      setKpis(PMSDummyDataStore.getAllKpiTasks());
      setIsEditModalOpen(false);
      alert("KPI task updated.");
    } catch (e) {
      console.error(e);
      alert("Failed to update KPI task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKpi = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      PMSDummyDataStore.deleteKpiTask(currentKpi.id);
      setKpis(PMSDummyDataStore.getAllKpiTasks());
      setIsDeleteModalOpen(false);
      alert("KPI task deleted.");
    } catch (e) {
      console.error(e);
      alert("Failed to delete KPI task");
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

      {/* View Modal */}
      <TaskViewModal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setViewKpi(null); }}
        kpi={viewKpi}
        employees={employees}
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
             <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
               <Download className="w-4 h-4" />
               Export
             </button>
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
            <div className="p-3 bg-purple-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Target</p>
              <p className="text-2xl font-bold text-green-600">
                {kpis.filter((k) => k.current >= k.target).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Need Attention</p>
              <p className="text-2xl font-bold text-yellow-600">
                {kpis.filter((k) => k.status === "attention").length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search KPIs, departments, or owners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
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
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Departments</option>
            {getUniqueValues("department").map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
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
                  Performance
                </th>
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
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {kpi.name}
                        </div>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm font-medium ${getPerformanceColor(
                              kpi.current,
                              kpi.target
                            )}`}
                          >
                            {kpi.current}{kpi.unit}
                          </span>
                          <span className="text-xs text-gray-500">
                            Target: {kpi.target}{kpi.unit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              getLatestProgress(kpi) < 30
                                ? "bg-red-500"
                                : getLatestProgress(kpi) < 70
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${getLatestProgress(kpi)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>
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
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {kpi.creator?.role
                            ? kpi.creator.role.split(" ").map((w) => w[0]).join("").toUpperCase()
                            : (kpi.owner ? kpi.owner.split(" ").map((w) => w[0]).join("").toUpperCase() : "--")}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {kpi.creator?.role || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center text-gray-900">
                        <Clock className="w-4 h-4 text-gray-400 mr-1" />
                        <span>
                          {new Date(kpi.startDate).toLocaleDateString()} - {new Date(kpi.endDate).toLocaleDateString()}
                        </span>
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
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => { setViewKpi(kpi); setIsViewModalOpen(true); }}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => openEditModal(kpi)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => openDeleteModal(kpi)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination section remains unchanged */}
      </div>

      {/* Empty State */}
      {filteredKpis.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
              ? "Try adjusting your search criteria or filters"
              : "Get started by creating your first KPI"}
          </p>
        </div>
      )}
    </div>
  );
};

export default KPIs;