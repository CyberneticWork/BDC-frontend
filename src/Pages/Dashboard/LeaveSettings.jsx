import React, { useState, useEffect } from "react";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getAllLeaveSettings,
  createLeaveSettings,
  updateLeaveSettings,
  deleteLeaveSettings,
} from "../../services/LeaveSettingsService";

const LeaveSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    employee_type: "probation",
    annual_leave_days: 0,
    number_of_quarters: 4,
    quarters: [],
    is_active: true,
    description: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getAllLeaveSettings();
      setSettings(data.data || data || []);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setMessage({ type: "error", text: "Failed to load leave settings" });
    } finally {
      setLoading(false);
    }
  };

  const initializeQuarters = (count) => {
    const quarters = [];
    const currentYear = new Date().getFullYear();
    
    // Calculate default date ranges based on number of quarters
    const monthsPerQuarter = Math.floor(12 / count);
    
    for (let i = 1; i <= count; i++) {
      const startMonth = (i - 1) * monthsPerQuarter;
      const endMonth = i * monthsPerQuarter - 1;
      
      // Default start date: first day of the quarter's first month
      const defaultStartDate = `${currentYear}-${String(startMonth + 1).padStart(2, '0')}-01`;
      
      // Default end date: last day of the quarter's last month
      const lastDay = new Date(currentYear, endMonth + 1, 0).getDate();
      const defaultEndDate = `${currentYear}-${String(endMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      quarters.push({
        quarter_number: i,
        leave_days: 0,
        name: `Quarter ${i}`,
        start_date: defaultStartDate,
        end_date: defaultEndDate,
      });
    }
    return quarters;
  };

  // Validate quarter dates
  const validateQuarterDates = (quarters) => {
    const errors = {};
    
    quarters.forEach((quarter, index) => {
      const quarterErrors = [];
      
      if (!quarter.start_date) {
        quarterErrors.push("Start date is required");
      }
      if (!quarter.end_date) {
        quarterErrors.push("End date is required");
      }
      
      if (quarter.start_date && quarter.end_date) {
        const startDate = new Date(quarter.start_date);
        const endDate = new Date(quarter.end_date);
        
        // Check if start date is before end date
        if (startDate >= endDate) {
          quarterErrors.push("Start date must be before end date");
        }
        
        // Check for overlapping with other quarters
        quarters.forEach((otherQuarter, otherIndex) => {
          if (index !== otherIndex && otherQuarter.start_date && otherQuarter.end_date) {
            const otherStart = new Date(otherQuarter.start_date);
            const otherEnd = new Date(otherQuarter.end_date);
            
            // Check if date ranges overlap
            if (
              (startDate >= otherStart && startDate <= otherEnd) ||
              (endDate >= otherStart && endDate <= otherEnd) ||
              (startDate <= otherStart && endDate >= otherEnd)
            ) {
              quarterErrors.push(`Date range overlaps with Quarter ${otherQuarter.quarter_number}`);
            }
          }
        });
      }
      
      if (quarterErrors.length > 0) {
        errors[`quarter_${index}`] = quarterErrors;
      }
    });
    
    return errors;
  };

  // Handle quarter date change
  const handleQuarterDateChange = (index, field, value) => {
    setFormData((prev) => {
      const newQuarters = [...prev.quarters];
      newQuarters[index] = {
        ...newQuarters[index],
        [field]: value,
      };
      
      // Validate after change
      const errors = validateQuarterDates(newQuarters);
      setValidationErrors(errors);
      
      return { ...prev, quarters: newQuarters };
    });
  };

  const handleEmployeeTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      employee_type: type,
      quarters: type === "permanent" ? initializeQuarters(prev.number_of_quarters) : [],
    }));
  };

  const handleQuarterCountChange = (count) => {
    const numQuarters = parseInt(count) || 4;
    setFormData((prev) => ({
      ...prev,
      number_of_quarters: numQuarters,
      quarters: initializeQuarters(numQuarters),
    }));
  };

  const handleQuarterDaysChange = (index, days) => {
    setFormData((prev) => {
      const newQuarters = [...prev.quarters];
      newQuarters[index] = {
        ...newQuarters[index],
        leave_days: parseInt(days) || 0,
      };
      return { ...prev, quarters: newQuarters };
    });
  };

  const resetForm = () => {
    setFormData({
      employee_type: "probation",
      annual_leave_days: 0,
      number_of_quarters: 4,
      quarters: [],
      is_active: true,
      description: "",
    });
    setEditingId(null);
    setValidationErrors({});
  };

  const openModal = (setting = null) => {
    if (setting) {
      setEditingId(setting.id);
      setFormData({
        employee_type: setting.employee_type,
        annual_leave_days: setting.annual_leave_days || 0,
        number_of_quarters: setting.number_of_quarters || 4,
        quarters: setting.quarters || initializeQuarters(setting.number_of_quarters || 4),
        is_active: setting.is_active ?? true,
        description: setting.description || "",
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate quarter dates for permanent employees
    if (formData.employee_type === "permanent") {
      const errors = validateQuarterDates(formData.quarters);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setMessage({ type: "error", text: "Please fix the validation errors before saving" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        return;
      }
    }
    
    setSaving(true);

    try {
      const payload = {
        employee_type: formData.employee_type,
        is_active: formData.is_active,
        description: formData.description,
      };

      if (formData.employee_type === "probation") {
        payload.annual_leave_days = formData.annual_leave_days;
        payload.number_of_quarters = null;
        payload.quarters = null;
      } else {
        payload.annual_leave_days = null;
        payload.number_of_quarters = formData.number_of_quarters;
        payload.quarters = formData.quarters;
      }

      if (editingId) {
        await updateLeaveSettings(editingId, payload);
        setMessage({ type: "success", text: "Leave settings updated successfully!" });
      } else {
        await createLeaveSettings(payload);
        setMessage({ type: "success", text: "Leave settings created successfully!" });
      }

      fetchSettings();
      closeModal();
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save leave settings",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLeaveSettings(id);
      setMessage({ type: "success", text: "Leave settings deleted successfully!" });
      fetchSettings();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting settings:", error);
      setMessage({ type: "error", text: "Failed to delete leave settings" });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const calculateTotalDays = (setting) => {
    if (setting.employee_type === "probation") {
      return setting.annual_leave_days || 0;
    }
    return (setting.quarters || []).reduce((sum, q) => sum + (q.leave_days || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-6 w-6 text-blue-600" />
                Leave Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Configure leave allocation for different employee types
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <Plus className="h-5 w-5" />
              Add New Setting
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Settings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settings.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Leave Settings Configured
              </h3>
              <p className="text-gray-600 mb-4">
                Start by adding leave settings for your employee types.
              </p>
              <button
                onClick={() => openModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add First Setting
              </button>
            </div>
          ) : (
            settings.map((setting) => (
              <div
                key={setting.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
                  setting.is_active ? "border-green-200" : "border-gray-200"
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          setting.employee_type === "probation"
                            ? "bg-orange-100"
                            : "bg-blue-100"
                        }`}
                      >
                        <Users
                          className={`h-6 w-6 ${
                            setting.employee_type === "probation"
                              ? "text-orange-600"
                              : "text-blue-600"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {setting.employee_type} Employees
                        </h3>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            setting.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {setting.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(setting)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(setting.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Leave Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Annual Leave</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {calculateTotalDays(setting)} days
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  {setting.employee_type === "probation" ? (
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Leave Allocation:</strong> {setting.annual_leave_days} days per year
                      </p>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={() =>
                          setExpandedCard(expandedCard === setting.id ? null : setting.id)
                        }
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {expandedCard === setting.id ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Hide Quarter Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            View Quarter Details
                          </>
                        )}
                      </button>

                      {expandedCard === setting.id && (
                        <div className="mt-4 space-y-2">
                          {(setting.quarters || []).map((quarter, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-700 font-medium">
                                  {quarter.name || `Quarter ${quarter.quarter_number}`}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {quarter.leave_days} days
                                </span>
                              </div>
                              {(quarter.start_date || quarter.end_date) && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {quarter.start_date ? new Date(quarter.start_date).toLocaleDateString() : "N/A"} 
                                    {" - "} 
                                    {quarter.end_date ? new Date(quarter.end_date).toLocaleDateString() : "N/A"}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {setting.description && (
                    <p className="mt-4 text-sm text-gray-500 italic">
                      {setting.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Leave Settings" : "Add Leave Settings"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Employee Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Employee Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleEmployeeTypeChange("probation")}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      formData.employee_type === "probation"
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Users
                        className={`h-8 w-8 ${
                          formData.employee_type === "probation"
                            ? "text-orange-600"
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          formData.employee_type === "probation"
                            ? "text-orange-700"
                            : "text-gray-600"
                        }`}
                      >
                        Probation
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEmployeeTypeChange("permanent")}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      formData.employee_type === "permanent"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Users
                        className={`h-8 w-8 ${
                          formData.employee_type === "permanent"
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          formData.employee_type === "permanent"
                            ? "text-blue-700"
                            : "text-gray-600"
                        }`}
                      >
                        Permanent
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Probation Settings */}
              {formData.employee_type === "probation" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Leave Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.annual_leave_days}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        annual_leave_days: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter number of leave days"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Total leave days allocated per year for probation employees
                  </p>
                </div>
              )}

              {/* Permanent Settings (Quarter-based) */}
              {formData.employee_type === "permanent" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Quarters
                    </label>
                    <select
                      value={formData.number_of_quarters}
                      onChange={(e) => handleQuarterCountChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 6, 12].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Quarter" : "Quarters"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Leave Days per Quarter
                    </label>
                    <div className="space-y-4">
                      {formData.quarters.map((quarter, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            validationErrors[`quarter_${index}`]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-900 font-semibold">
                              Quarter {quarter.quarter_number}
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={quarter.leave_days}
                                onChange={(e) =>
                                  handleQuarterDaysChange(index, e.target.value)
                                }
                                className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                placeholder="Days"
                              />
                              <span className="text-gray-500 text-sm">days</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={quarter.start_date || ""}
                                onChange={(e) =>
                                  handleQuarterDateChange(index, "start_date", e.target.value)
                                }
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                  validationErrors[`quarter_${index}`]
                                    ? "border-red-300"
                                    : "border-gray-300"
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                End Date
                              </label>
                              <input
                                type="date"
                                value={quarter.end_date || ""}
                                onChange={(e) =>
                                  handleQuarterDateChange(index, "end_date", e.target.value)
                                }
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                  validationErrors[`quarter_${index}`]
                                    ? "border-red-300"
                                    : "border-gray-300"
                                }`}
                              />
                            </div>
                          </div>
                          
                          {/* Validation Errors */}
                          {validationErrors[`quarter_${index}`] && (
                            <div className="mt-2 space-y-1">
                              {validationErrors[`quarter_${index}`].map((error, errIdx) => (
                                <p key={errIdx} className="text-xs text-red-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {error}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700 font-medium">Total Annual Leave</span>
                        <span className="text-blue-900 font-bold text-lg">
                          {formData.quarters.reduce((sum, q) => sum + q.leave_days, 0)} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes or description..."
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">Active Status</span>
                  <p className="text-sm text-gray-500">
                    Enable this setting for leave calculations
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingId ? "Update" : "Create"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Leave Settings?
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveSettings;
