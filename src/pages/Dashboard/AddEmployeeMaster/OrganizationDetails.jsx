import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Layers,
  User,
  Calendar,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";

import {
  fetchCompanies,
  fetchDepartmentsById,
  fetchSubDepartmentsById,
  fetchDesignations,
  addNewDesignation,
} from "@services/ApiDataService";
import { useEmployeeForm } from "@contexts/EmployeeFormContext";
import FieldError from "@components/ErrorMessage/FieldError";

const OrganizationDetails = ({ onNext, onPrevious, activeCategory }) => {
  const { formData, updateFormData, errors, clearFieldError } =
    useEmployeeForm();
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingSubDepartments, setIsLoadingSubDepartments] = useState(false);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(true);

  // Dropdown data state - now storing objects with id and name
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Toggle state
  const [toggleStates, setToggleStates] = useState({
    probationEnabled: false,
    trainingEnabled: false,
    contractEnabled: false,
    confirmationEnabled: false,
  });

  // State
  const [showAddDesignationModal, setShowAddDesignationModal] = useState(false);
  const [newDesignationName, setNewDesignationName] = useState("");
  const [newDesignationError, setNewDesignationError] = useState("");
  const [newDesignationSubmitting, setNewDesignationSubmitting] =
    useState(false);

  // Handlers
  const handleDesignationChange = (e) => {
    const value = e.target.value;

    if (value === "add-new") {
      setShowAddDesignationModal(true);
      // Reset the select to previous value or empty
      e.target.value = formData.organization.designation || "";
    } else {
      handleChange(e); // Your original handleChange function
    }
  };

  const handleAddDesignation = async () => {
    if (!newDesignationName.trim()) {
      setNewDesignationError("Please enter a designation name");
      return;
    }
    setNewDesignationSubmitting(true);
    try {
      // Call your API to add new designation
      const newDesignation = await addNewDesignation(newDesignationName.trim());

      const DesignationsData = await fetchDesignations();

      setDesignations(DesignationsData);

      // Reset and close modal
      setNewDesignationName("");
      setNewDesignationError("");
      setShowAddDesignationModal(false);
      setNewDesignationSubmitting(false);
    } catch (error) {
      setNewDesignationError("Failed to add designation. Please try again.");
    }
  };

  // Load companies and designations from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, DesignationsData] = await Promise.all([
          fetchCompanies(),
          fetchDesignations(),
        ]);

        setCompanies(companiesData);
        setIsLoadingCompanies(false);
        setDesignations(DesignationsData);
        setIsLoadingDesignations(false);
      } catch (e) {
        console.error("Error loading data:", e);
      }
    };

    loadData();
  }, []);

  // Load departments when company is selected
  useEffect(() => {
    if (formData.organization.company) {
      const loadDepartments = async () => {
        setIsLoadingDepartments(true);
        try {
          const departmentsData = await fetchDepartmentsById(
            formData.organization.company
          );
          setDepartments(departmentsData);
          // Reset department and sub-department when company changes
          updateFormData("organization", {
            department: "",
            subDepartment: "",
          });
          setSubDepartments([]);
        } catch (e) {
          console.error("Error loading departments:", e);
        } finally {
          setIsLoadingDepartments(false);
        }
      };
      loadDepartments();
    } else {
      setDepartments([]);
      setSubDepartments([]);
    }
  }, [formData.organization.company]);

  // Load sub-departments when department is selected
  useEffect(() => {
    if (formData.organization.department) {
      const loadSubDepartments = async () => {
        setIsLoadingSubDepartments(true);
        try {
          const subDepartmentsData = await fetchSubDepartmentsById(
            formData.organization.department
          );
          setSubDepartments(subDepartmentsData);
          // Reset sub-department when department changes
          updateFormData("organization", {
            subDepartment: "",
          });
        } catch (e) {
          console.error("Error loading sub-departments:", e);
        } finally {
          setIsLoadingSubDepartments(false);
        }
      };
      loadSubDepartments();
    } else {
      setSubDepartments([]);
    }
  }, [formData.organization.department]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    const parsedValue = value === "" ? "" : Number(value); // safely parse to number if not empty

    // Clear field error
    if (errors.organization?.[name]) {
      clearFieldError("organization", name);
    }

    if (name === "company") {
      const selected = companies.find((c) => c.id === parsedValue);
      updateFormData("organization", {
        company: parsedValue.toString(),
        companyName: selected?.name || "",
        department: "",
        departmentName: "",
        subDepartment: "",
        subDepartmentName: "",
      });
      return;
    }

    if (name === "department") {
      const selected = departments.find((d) => d.id === parsedValue);
      updateFormData("organization", {
        department: parsedValue.toString(),
        departmentName: selected?.name || "",
        subDepartment: "",
        subDepartmentName: "",
      });
      return;
    }

    if (name === "subDepartment") {
      const selected = subDepartments.find((s) => s.id === parsedValue);
      updateFormData("organization", {
        subDepartment: parsedValue.toString(),
        subDepartmentName: selected?.name || "",
      });
      return;
    }

    if (name === "designation") {
      const selected = designations.find((s) => s.id === parsedValue);
      updateFormData("organization", {
        designation: parsedValue.toString(),
        designationName: selected?.name || "",
      });
      return;
    }

    updateFormData("organization", {
      [name]:
        type === "checkbox" ? checked : type === "file" ? files[0] : value,
    });
  };

  const handleToggle = (section) => {
    setToggleStates((prev) => {
      const newValue = !prev[section];
      // Map toggleStates key to formData key
      const formKeyMap = {
        probationEnabled: "probationPeriod",
        trainingEnabled: "trainingPeriod",
        contractEnabled: "contractPeriod",
        confirmationEnabled: null, // No direct boolean in formData for confirmation
      };
      const formKey = formKeyMap[section];
      if (formKey) {
        updateFormData("organization", { [formKey]: newValue });
      }
      return {
        ...prev,
        [section]: newValue,
      };
    });
  };

  const ToggleButton = ({ enabled, onToggle, label, value }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        onChange={onToggle}
        className="sr-only peer"
        aria-label={`Toggle ${label}`}
      />
      <div
        className={`w-11 h-6 rounded-full transition-colors ${
          enabled ? "bg-blue-600" : "bg-gray-300"
        } peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2`}
      ></div>
      <div
        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      ></div>
    </label>
  );

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Building2 className="text-blue-600" size={24} />
        Organization Details
      </h1>

      <form>
        {/* Company Information Section */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Users className="text-blue-500" size={20} />
            Company Information
          </h2>
          <p className="text-gray-500 mb-4 pl-7">
            Basic company and employee details
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company */}
            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Building2 className="text-gray-500" size={16} />
                Company <span className="text-red-500">*</span>
              </label>
              <div className="relative flex-1">
                {isLoadingCompanies ? (
                  <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-100">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <select
                    name="company"
                    value={formData.organization.company}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-2 border ${
                      errors.organization?.company
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Select Company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                <FieldError error={errors.organization?.company} />
              </div>
            </div>

            {/* Department */}
            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Layers className="text-gray-500" size={16} />
                Department
              </label>
              <div className="relative flex-1">
                {isLoadingDepartments ? (
                  <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-100">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <select
                    name="department"
                    value={formData.organization.department}
                    onChange={handleChange}
                    disabled={
                      !formData.organization.company || isLoadingDepartments
                    }
                    className={`w-full pl-8 pr-3 py-2 border ${
                      errors.organization?.department
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !formData.organization.company
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
                <FieldError error={errors.organization?.department} />
              </div>
            </div>

            {/* Sub Department */}
            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Layers className="text-gray-500" size={16} />
                Sub Department
              </label>
              <div className="relative flex-1">
                {isLoadingSubDepartments ? (
                  <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-100">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <select
                    name="subDepartment"
                    value={formData.organization.subDepartment}
                    onChange={handleChange}
                    disabled={
                      !formData.organization.department ||
                      isLoadingSubDepartments
                    }
                    className={`w-full pl-8 pr-3 py-2 border ${
                      errors.organization?.subDepartment
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !formData.organization.department
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                    required
                  >
                    <option value="">Select Sub Department</option>
                    {subDepartments.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
                <FieldError error={errors.organization?.subDepartment} />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <User className="text-gray-500" size={16} />
                Current Supervisor
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="currentSupervisor"
                  value={formData.organization.currentSupervisor}
                  onChange={handleChange}
                  placeholder="e.g., John Doe"
                  className={`w-full pl-8 pr-3 py-2 border ${
                    errors.organization?.currentSupervisor
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <User
                  className="absolute left-2 top-2.5 text-gray-400"
                  size={16}
                />
              </div>
              <FieldError error={errors.organization?.currentSupervisor} />
            </div>

            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Calendar className="text-gray-500" size={16} />
                Date of Joined <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dateOfJoined"
                  value={formData.organization.dateOfJoined}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={handleChange}
                  className={`w-full pl-8 pr-3 py-2 border ${
                    errors.organization?.dateOfJoined
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <FieldError error={errors.organization?.dateOfJoined} />
            </div>

            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Briefcase className="text-gray-500" size={16} />
                Designation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {isLoadingDesignations ? (
                  <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-100">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <>
                    <select
                      name="designation"
                      value={formData.organization.designation}
                      onChange={handleDesignationChange}
                      className={`w-full pl-8 pr-3 py-2 border ${
                        errors.organization?.designation
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      required
                    >
                      <option value="">Select designation</option>
                      {designations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      <option
                        value="add-new"
                        className="text-blue-500 font-medium"
                      >
                        + Add New Designation
                      </option>
                    </select>

                    {/* Add New Designation Modal */}
                    {showAddDesignationModal && (
                      <div className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                              Add New Designation
                            </h3>
                            <button
                              onClick={() => setShowAddDesignationModal(false)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X size={20} />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Designation Name
                              </label>
                              <input
                                type="text"
                                value={newDesignationName}
                                onChange={(e) =>
                                  setNewDesignationName(e.target.value)
                                }
                                placeholder="Enter designation name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            </div>

                            {newDesignationError && (
                              <p className="text-red-500 text-sm">
                                {newDesignationError}
                              </p>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                              <button
                                onClick={() => {
                                  setShowAddDesignationModal(false);
                                  setNewDesignationName("");
                                  setNewDesignationError("");
                                }}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                              {newDesignationSubmitting ? (
                                <button
                                  disabled
                                  className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                                >
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Adding...</span>
                                </button>
                              ) : (
                                <button
                                  onClick={handleAddDesignation}
                                  disabled={!newDesignationName.trim()}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                  Add Designation
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <FieldError error={errors.organization?.designation} />
            </div>

            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Layers className="text-gray-500" size={16} />
                Day Off
              </label>
              <div className="relative">
                <select
                  name="dayOff"
                  value={formData.organization.dayOff || ""}
                  onChange={handleChange}
                  className={`w-full pl-8 pr-3 py-2 border ${
                    errors.organization?.dayOff
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                >
                  <option value="">Select Day Off</option>
                  <option value="Sunday">Sunday</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="none">None</option>
                </select>
              </div>
              <FieldError error={errors.organization?.dayOff} />
            </div>
          </div>
        </div>

        {/* Employment Periods Section */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="text-blue-500" size={20} />
            Employment Periods
          </h2>
          <p className="text-gray-500 mb-4 pl-7">
            Define training, probation, and contract periods
          </p>
          <div className="space-y-6">
            {/* Probation Period */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    1
                  </span>
                  Probation Period
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      formData.organization.probationPeriod
                        ? "text-blue-600"
                        : "text-red-400"
                    }`}
                  >
                    {formData.organization.probationPeriod
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                  <ToggleButton
                    enabled={formData.organization.probationPeriod}
                    onToggle={() => handleToggle("probationEnabled")}
                    label="Probation Period"
                    value={formData.organization.probationPeriod}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-1">From Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="probationFrom"
                      value={formData.organization.probationFrom}
                      onChange={handleChange}
                      min={formData.organization.dateOfJoined || ""}
                      max={formData.organization.probationTo || ""}
                      disabled={!formData.organization.probationPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${
                        !formData.organization.probationPeriod
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : errors.organization?.probationFrom
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        formData.organization.probationPeriod
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
                  <FieldError error={errors.organization?.probationFrom} />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">To Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="probationTo"
                      value={formData.organization.probationTo}
                      onChange={handleChange}
                      min={formData.organization.probationFrom || ""}
                      disabled={!formData.organization.probationPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${
                        !formData.organization.probationPeriod
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : errors.organization?.probationTo
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        formData.organization.probationPeriod
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
                  <FieldError error={errors.organization?.probationTo} />
                </div>
              </div>
            </div>
            {/* Training Period */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    2
                  </span>
                  Training Period
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      formData.organization.trainingPeriod
                        ? "text-blue-600"
                        : "text-red-400"
                    }`}
                  >
                    {formData.organization.trainingPeriod
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                  <ToggleButton
                    enabled={formData.organization.trainingPeriod}
                    onToggle={() => handleToggle("trainingEnabled")}
                    value={formData.organization.trainingPeriod}
                    label="Training Period"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-1">From Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="trainingFrom"
                      value={formData.organization.trainingFrom}
                      onChange={handleChange}
                      min={formData.organization.dateOfJoined || ""}
                      max={formData.organization.trainingTo || ""}
                      disabled={!formData.organization.trainingPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${
                        !formData.organization.trainingPeriod
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : errors.organization?.trainingFrom
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        formData.organization.trainingPeriod
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
                  <FieldError error={errors.organization?.trainingFrom} />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">To Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="trainingTo"
                      value={formData.organization.trainingTo}
                      onChange={handleChange}
                      min={formData.organization.trainingFrom || ""}
                      disabled={!formData.organization.trainingPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${
                        !formData.organization.trainingPeriod
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : errors.organization?.trainingTo
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        formData.organization.trainingPeriod
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
                  <FieldError error={errors.organization?.trainingTo} />
                </div>
              </div>
            </div>
            {/* Contract Period */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    3
                  </span>
                  Contract Period
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      formData.organization.contractPeriod
                        ? "text-blue-600"
                        : "text-red-400"
                    }`}
                  >
                    {formData.organization.contractPeriod
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                  <ToggleButton
                    enabled={formData.organization.contractPeriod}
                    onToggle={() => handleToggle("contractEnabled")}
                    label="Contract Period"
                    value={formData.organization.contractPeriod}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-1">From Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="contractFrom"
                      value={formData.organization.contractFrom}
                      onChange={handleChange}
                      min={formData.organization.dateOfJoined || ""}
                      max={formData.organization.contractTo || ""}
                      disabled={!formData.organization.contractPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${
                        !formData.organization.contractPeriod
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : errors.organization?.contractFrom
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        formData.organization.contractPeriod
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
                  <FieldError error={errors.organization?.contractFrom} />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">To Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="contractTo"
                      value={formData.organization.contractTo}
                      onChange={handleChange}
                      min={formData.organization.contractFrom || ""}
                      disabled={!formData.organization.contractPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${
                        !formData.organization.contractPeriod
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : errors.organization?.contractTo
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        formData.organization.contractPeriod
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
                  <FieldError error={errors.organization?.contractTo} />
                </div>
              </div>
            </div>
            {/* Confirmation Date */}
            <div className="md:w-1/2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-700 font-medium flex items-center gap-1">
                  <CheckCircle className="text-gray-500" size={16} />
                  Confirmation Date
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      toggleStates.confirmationEnabled
                        ? "text-blue-600"
                        : "text-red-400"
                    }`}
                  >
                    {/* {toggleStates.confirmationEnabled ? "Enabled" : "Disabled"} */}
                  </span>
                  {/* <ToggleButton
                    enabled={toggleStates.confirmationEnabled}
                    onToggle={() => handleToggle("confirmationEnabled")}
                    label="Confirmation Date"
                  /> */}
                </div>
              </div>
              <div className="relative">
                <input
                  type="date"
                  name="confirmationDate"
                  value={formData.organization.confirmationDate}
                  onChange={handleChange}
                  // disabled={!toggleStates.confirmationEnabled}
                  className={`w-full pl-8 pr-3 py-2 border  rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <Calendar
                  className={`absolute left-2 top-2.5 ${
                    toggleStates.confirmationEnabled
                      ? "text-gray-400"
                      : "text-gray-300"
                  }`}
                  size={16}
                />
              </div>
              <FieldError error={errors.organization?.confirmationDate} />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between space-x-4">
          <button
            type="button"
            onClick={onPrevious}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationDetails;
