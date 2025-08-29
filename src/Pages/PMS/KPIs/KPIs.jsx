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
} from "lucide-react";
import PMSService from "../../../services/PMS/PMSService";

// Task Modal Component (shared between Add and Edit)
// NOTE: accepts `employees` prop now (list of {id, name, department})
const TaskModal = ({ isOpen, onClose, onSubmit, initialData = {}, isEdit = false, isLoading = false, employees = [] }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    assignees: [], // array of assignee ids (strings)
    ...initialData,
  });

  const [empSearch, setEmpSearch] = useState("");

  useEffect(() => {
    // Reset form when modal opens with new data
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      assignees: initialData.assignees ? [...initialData.assignees] : [],
      ...initialData
    });
    setEmpSearch("");
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
    emp.department.toLowerCase().includes(empSearch.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

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
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter KPI task name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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

              <div className="flex gap-2">
                <input
                  type="text"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search employees by name or department..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Search results */}
              {empSearch && filteredEmployees.length > 0 && (
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
          </div>

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

// New: View modal to display task details + per-assignee updates
const TaskViewModal = ({ isOpen, onClose, kpi = null, employees = [] }) => {
  if (!isOpen || !kpi) return null;

  const getEmployee = (id) => employees.find(e => e.id === id) || { id, name: "Unknown", department: "" };
  const updatesFor = (empId) => (kpi.assigneeUpdates || []).find(u => u.employeeId === empId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{kpi.name}</h2>
            <p className="text-gray-600 text-sm mt-1">{kpi.description}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500">Timeline</label>
              <div className="text-sm text-gray-900">{new Date(kpi.startDate).toLocaleDateString()} — {new Date(kpi.endDate).toLocaleDateString()}</div>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Last Updated</label>
              <div className="text-sm text-gray-900">{new Date(kpi.lastUpdated).toLocaleString()}</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Assigned Employees & Updates</h3>
            <div className="space-y-3">
              { (kpi.assignees || []).length === 0 && <div className="text-sm text-gray-500">No assignees</div> }
              { (kpi.assignees || []).map((idStr) => {
                const empId = parseInt(idStr);
                const emp = getEmployee(empId);
                const entry = updatesFor(empId);
                return (
                  <div key={idStr} className="p-3 rounded-md border border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-500">{emp.department}</div>
                      </div>
                      <div className="text-xs text-gray-500">{entry?.updates?.length ? `${entry.updates.length} update(s)` : "No updates"}</div>
                    </div>

                    {entry?.updates?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {entry.updates.map((u, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="text-xs text-gray-400">{new Date(u.date).toLocaleString()}</div>
                            <div className="text-gray-800">{u.note}</div>
                            <div className="text-xs text-gray-500 mt-1">By: {u.author || "System"}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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

  // New view modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewKpi, setViewKpi] = useState(null);

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
      department: "Customer Service",
      owner: "Sarah Johnson",
      assignees: ["1"],
      assigneeUpdates: [
        {
          employeeId: 1,
          updates: [
            { date: "2024-01-05T09:00:00Z", note: "Initial assignment", author: "Manager" },
            { date: "2024-02-01T14:30:00Z", note: "Submitted first draft of report", author: "Sarah Johnson" },
          ]
        }
      ],
      startDate: "2023-12-01",
      endDate: "2024-03-31",
      lastUpdated: "2024-02-01T14:30:00Z",
      frequency: "Monthly",
      category: "Customer",
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
      department: "Sales",
      owner: "Mike Chen",
      assignees: ["2","4"],
      assigneeUpdates: [
        {
          employeeId: 2,
          updates: [{ date: "2024-01-12T11:00:00Z", note: "Provided Q4 numbers", author: "Mike Chen" }]
        },
        {
          employeeId: 4,
          updates: [{ date: "2024-01-15T10:00:00Z", note: "Assisted with data cleanup", author: "John Smith" }]
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
      department: "HR",
      owner: "Emma Davis",
      assignees: ["3"],
      assigneeUpdates: [
        {
          employeeId: 3,
          updates: [
            { date: "2024-01-10T09:00:00Z", note: "Reviewed exit interviews", author: "Emma Davis" },
            { date: "2024-02-01T14:30:00Z", note: "Identified trends in departures", author: "Emma Davis" },
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
      department: "Operations",
      owner: "John Smith",
      assignees: ["4"],
      assigneeUpdates: [
        {
          employeeId: 4,
          updates: [
            { date: "2024-01-15T10:00:00Z", note: "Project A completed", author: "John Smith" },
            { date: "2024-01-20T10:00:00Z", note: "Project B on track", author: "John Smith" },
          ]
        }
      ],
      startDate: "2024-01-01",
      endDate: "2024-03-15",
      lastUpdated: "2024-01-20T10:00:00Z",
      frequency: "Weekly",
      category: "Operations",
    },
  ];

  useEffect(() => {
    fetchKpis();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [kpis, searchTerm, statusFilter, departmentFilter]);

  const fetchKpis = async () => {
    try {
      setIsLoading(true);
      // For now, using sample data
      // const data = await PMSService.getKpis();
      setKpis(sampleKpis);
    } catch (err) {
      setError("Failed to fetch KPIs");
      console.error("Error fetching KPIs:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const firstAssignee = formData.assignees && formData.assignees.length > 0
        ? parseInt(formData.assignees[0])
        : null;

      const newKpi = {
        id: kpis.length + 1,
        name: formData.name,
        description: formData.description,
        target: 0,
        current: 0,
        unit: "%",
        trend: "up",
        status: "active",
        department: firstAssignee === 1 ? "Customer Service" :
                   firstAssignee === 2 ? "Sales" :
                   firstAssignee === 3 ? "HR" : "Operations",
        owner: firstAssignee ? (employees.find(e => e.id === firstAssignee)?.name || "") : "",
        assignees: (formData.assignees || []).map(s => s.toString()),
        assigneeUpdates: (formData.assignees || []).map(s => ({
          employeeId: parseInt(s),
          updates: [{ date: new Date().toISOString(), note: "Task assigned", author: "System" }]
        })),
        startDate: formData.startDate,
        endDate: formData.endDate,
        lastUpdated: new Date().toISOString(),
        frequency: "Monthly",
        category: firstAssignee === 1 ? "Customer" :
                 firstAssignee === 2 ? "Financial" :
                 firstAssignee === 3 ? "HR" : "Operations",
      };

      setKpis(prev => [...prev, newKpi]);
      alert('KPI task created successfully!');
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error creating KPI:", error);
      alert('Failed to create KPI task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditKpi = async (formData) => {
    setIsSubmitting(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const firstAssignee = formData.assignees && formData.assignees.length > 0
        ? parseInt(formData.assignees[0])
        : null;

      const updatedKpis = kpis.map(kpi =>
        kpi.id === currentKpi.id ? {
          ...kpi,
          name: formData.name,
          description: formData.description,
          assignees: (formData.assignees || []).map(s => s.toString()),
          // merge existing updates or add "reassigned" note if changed
          assigneeUpdates: (formData.assignees || []).map(s => {
            const empId = parseInt(s);
            const existing = (kpi.assigneeUpdates || []).find(a => a.employeeId === empId);
            return existing || { employeeId: empId, updates: [{ date: new Date().toISOString(), note: "Assigned/Updated", author: "System" }] };
          }),
          assignee: firstAssignee,
          department: firstAssignee === 1 ? "Customer Service" :
                     firstAssignee === 2 ? "Sales" :
                     firstAssignee === 3 ? "HR" : "Operations",
          owner: firstAssignee ? (employees.find(e => e.id === firstAssignee)?.name || "") : kpi.owner,
          startDate: formData.startDate,
          endDate: formData.endDate,
          lastUpdated: new Date().toISOString(),
        } : kpi
      );

      setKpis(updatedKpis);
      alert('KPI task updated successfully!');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating KPI:", error);
      alert('Failed to update KPI task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKpi = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, this would be an API call:
      // await PMSService.deleteKpi(currentKpi.id);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove KPI from state
      const updatedKpis = kpis.filter(kpi => kpi.id !== currentKpi.id);
      setKpis(updatedKpis);
      setIsDeleteModalOpen(false);
      
      // Show success notification
      alert('KPI task deleted successfully!');
    } catch (error) {
      console.error("Error deleting KPI:", error);
      alert('Failed to delete KPI task');
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredKpis.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredKpis.length / itemsPerPage);

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
          assignees: currentKpi.assignees ? [...currentKpi.assignees] : []
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {getUniqueValues("category").length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Target className="w-6 h-6 text-blue-600" />
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

      {/* KPIs Table */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
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
                      </div>
                      <div className="text-sm text-gray-500">{kpi.description}</div>
                      <div className="text-xs text-gray-400">{kpi.department}</div>
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
                              kpi.current >= kpi.target
                                ? "bg-green-500"
                                : kpi.current >= kpi.target * 0.8
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                (kpi.current / kpi.target) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
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
                          {kpi.owner
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {kpi.owner}
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
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(kpi.lastUpdated).toLocaleDateString()}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredKpis.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{filteredKpis.length}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? "z-10 bg-purple-50 border-purple-500 text-purple-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </nav>
                </div>
              </div>
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