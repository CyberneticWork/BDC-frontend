import React, { useState, useEffect } from "react";
import { 
  X, 
  Loader2, 
  Search, 
  Calendar, 
  User, 
  Users, 
  Target, 
  CheckCircle,
  FileText,
  Clock,
  ClipboardCheck,
  Building2,
  UserCheck,
  ChevronDown,
  Filter
} from "lucide-react";
import PMSService from "@services/PMS/PMSService";

const NewReviewModal = ({ isOpen, onClose, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
  const [showTaskSearch, setShowTaskSearch] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);

  const [formData, setFormData] = useState({
    reviewTitle: "",
    reviewType: "performance",
    reviewCycle: "",
    employeeId: "",
    employeeName: "",
    employeeNo: "",
    employeeDepartment: "",
    employeePosition: "",
    taskId: "",
    taskName: "",
    taskCategory: "",
    startDate: "",
    dueDate: "",
    evaluationMetrics: [{
      name: "Quality",
      weight: 25
    }, {
      name: "Timeliness",
      weight: 25
    }, {
      name: "Initiative",
      weight: 25
    }, {
      name: "Collaboration",
      weight: 25
    }],
    reviewFrequency: "weekly",
    supervisorId: "1", // Should be from auth context
    supervisorName: "Michael Wong", // Should be from auth context
    reviewNotes: "",
    expectedOutcomes: "",
    status: "Draft"
  });

  // Sample data - in a real app, these would come from API calls
  const departments = [
    { id: 1, name: "Engineering" },
    { id: 2, name: "Marketing" },
    { id: 3, name: "Sales" },
    { id: 4, name: "HR" },
    { id: 5, name: "Customer Service" },
    { id: 6, name: "Operations" },
  ];

  const reviewTypes = [
    { id: "performance", name: "Performance Review" },
    { id: "progress", name: "Progress Check-in" },
    { id: "quarterly", name: "Quarterly Review" },
    { id: "annual", name: "Annual Review" },
    { id: "probation", name: "Probation Review" },
  ];

  const reviewCycles = [
    { id: "2025_Q1", name: "2025 Q1" },
    { id: "2025_Q2", name: "2025 Q2" },
    { id: "2025_Q3", name: "2025 Q3" },
    { id: "2025_Q4", name: "2025 Q4" },
    { id: "2025_Annual", name: "2025 Annual" },
  ];

  const reviewFrequencies = [
    { id: "weekly", name: "Weekly" },
    { id: "biweekly", name: "Bi-weekly" },
    { id: "monthly", name: "Monthly" },
    { id: "quarterly", name: "Quarterly" },
  ];

  // Simulated data load for employees and tasks
  useEffect(() => {
    // This would be replaced with actual API calls
    const sampleEmployees = [
      { id: "EMP001", name: "John Smith", department: "Engineering", position: "Software Developer", attendanceNo: "A1001" },
      { id: "EMP002", name: "Sarah Johnson", department: "Customer Service", position: "Customer Service Lead", attendanceNo: "A1002" },
      { id: "EMP025", name: "Mike Chen", department: "Sales", position: "Sales Representative", attendanceNo: "A1025" },
      { id: "EMP032", name: "Emma Davis", department: "Design", position: "UX Designer", attendanceNo: "A1032" },
      { id: "EMP014", name: "David Rodriguez", department: "Engineering", position: "Backend Developer", attendanceNo: "A1014" },
      { id: "EMP017", name: "James Wilson", department: "Product", position: "Product Manager", attendanceNo: "A1017" },
      { id: "EMP028", name: "Linda Martinez", department: "Support", position: "Customer Support Specialist", attendanceNo: "A1028" },
    ];

    const sampleTasks = [
      { id: 1, name: "Customer Satisfaction Score Report", category: "Customer", department: "Customer Service" },
      { id: 2, name: "Revenue Growth Rate Analysis", category: "Financial", department: "Sales" },
      { id: 3, name: "Employee Turnover Rate Reduction", category: "HR", department: "HR" },
      { id: 4, name: "Project Completion Rate Tracking", category: "Operations", department: "Operations" },
      { id: 5, name: "Code Quality Improvement", category: "Technical", department: "Engineering" },
      { id: 6, name: "User Experience Enhancement", category: "Design", department: "Design" },
    ];

    setEmployees(sampleEmployees);
    setTasks(sampleTasks);
  }, []);

  // Filter employees based on search term and department
  useEffect(() => {
    let filtered = employees;
    
    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }
    
    if (employeeSearchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        emp.attendanceNo.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(employeeSearchTerm.toLowerCase())
      );
    }
    
    setFilteredEmployees(filtered);
  }, [employees, employeeSearchTerm, selectedDepartment]);

  // Filter tasks based on search term and selected employee's department
  useEffect(() => {
    let filtered = tasks;
    
    if (formData.employeeDepartment) {
      filtered = filtered.filter(task => 
        task.department === formData.employeeDepartment || task.department === "All"
      );
    }
    
    if (taskSearchTerm) {
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.category.toLowerCase().includes(taskSearchTerm.toLowerCase())
      );
    }
    
    setFilteredTasks(filtered);
  }, [tasks, taskSearchTerm, formData.employeeDepartment]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectEmployee = (employee) => {
    setFormData(prev => ({
      ...prev,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeNo: employee.attendanceNo,
      employeeDepartment: employee.department,
      employeePosition: employee.position
    }));
    setShowEmployeeSearch(false);
  };

  const handleSelectTask = (task) => {
    setFormData(prev => ({
      ...prev,
      taskId: task.id,
      taskName: task.name,
      taskCategory: task.category,
      reviewTitle: `${task.name} Review for ${formData.employeeName}`
    }));
    setShowTaskSearch(false);
  };

  const handleMetricChange = (index, field, value) => {
    const updatedMetrics = [...formData.evaluationMetrics];
    updatedMetrics[index][field] = value;
    setFormData(prev => ({
      ...prev,
      evaluationMetrics: updatedMetrics
    }));
  };

  const addMetric = () => {
    setFormData(prev => ({
      ...prev,
      evaluationMetrics: [
        ...prev.evaluationMetrics,
        { name: "", weight: 0 }
      ]
    }));
  };

  const removeMetric = (index) => {
    const updatedMetrics = [...formData.evaluationMetrics];
    updatedMetrics.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      evaluationMetrics: updatedMetrics
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real app, this would call the API
      // await PMSService.createReview(formData);
      console.log("Submitting review:", formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error creating review:", error);
      alert("Failed to create review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create New Performance Review</h2>
            <p className="text-gray-600 text-sm mt-1">
              Set up a new review to monitor task progress and performance
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Review Information */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Review Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Title*
                </label>
                <input
                  type="text"
                  name="reviewTitle"
                  value={formData.reviewTitle}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter review title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Type*
                </label>
                <select
                  name="reviewType"
                  value={formData.reviewType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {reviewTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Cycle*
                </label>
                <select
                  name="reviewCycle"
                  value={formData.reviewCycle}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Review Cycle</option>
                  {reviewCycles.map(cycle => (
                    <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Frequency
                </label>
                <select
                  name="reviewFrequency"
                  value={formData.reviewFrequency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {reviewFrequencies.map(freq => (
                    <option key={freq.id} value={freq.id}>{freq.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              Employee Selection
            </h3>
            <div className="relative mb-4">
              <div className="flex gap-4 mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Department (Filter)
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee*
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.employeeName}
                      placeholder="Search employee by name or ID..."
                      onClick={() => setShowEmployeeSearch(true)}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>
              </div>

              {showEmployeeSearch && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={employeeSearchTerm}
                        onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                        placeholder="Search by name, ID or attendance no..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map(emp => (
                        <div
                          key={emp.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectEmployee(emp)}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{emp.name}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>ID: {emp.id}</span>
                                <span>Attendance: {emp.attendanceNo}</span>
                                <span>{emp.department}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No employees found matching your search
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {formData.employeeId && (
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{formData.employeeName}</h4>
                      <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                        ID: {formData.employeeId}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span>{formData.employeePosition}</span>
                      <span>•</span>
                      <span>{formData.employeeDepartment}</span>
                      <span>•</span>
                      <span>Attendance: {formData.employeeNo}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Task Selection */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-500" />
              Task Selection
            </h3>
            <div className="relative mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Task to Review*
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.taskName}
                  placeholder="Search and select a task..."
                  onClick={() => setShowTaskSearch(true)}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>

              {showTaskSearch && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={taskSearchTerm}
                        onChange={(e) => setTaskSearchTerm(e.target.value)}
                        placeholder="Search by task name or category..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map(task => (
                        <div
                          key={task.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectTask(task)}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <Target className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{task.name}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                                  {task.category}
                                </span>
                                <span>{task.department}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No tasks found matching your search
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {formData.taskId && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{formData.taskName}</h4>
                      <span className="text-sm bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        {formData.taskCategory}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Review Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                    min={formData.startDate}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Evaluation Metrics */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-indigo-500" />
                Evaluation Metrics
              </h3>
              <button 
                type="button" 
                onClick={addMetric}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                + Add Metric
              </button>
            </div>
            
            <div className="space-y-3 mb-2">
              {formData.evaluationMetrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={metric.name}
                      onChange={(e) => handleMetricChange(index, 'name', e.target.value)}
                      placeholder="Metric name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="w-24">
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={metric.weight}
                        onChange={(e) => handleMetricChange(index, 'weight', parseInt(e.target.value))}
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-gray-600">%</span>
                    </div>
                  </div>
                  {formData.evaluationMetrics.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeMetric(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="text-sm text-gray-500 mt-2">
              Note: The sum of all metric weights should equal 100%
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Additional Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Outcomes
                </label>
                <textarea
                  name="expectedOutcomes"
                  value={formData.expectedOutcomes}
                  onChange={handleInputChange}
                  placeholder="What are the expected outcomes or deliverables for this review?"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Notes
                </label>
                <textarea
                  name="reviewNotes"
                  value={formData.reviewNotes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes or instructions for the review..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewReviewModal;