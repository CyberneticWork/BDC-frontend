import React, { useState, useEffect, useRef } from "react";
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
  MapPin,
} from "lucide-react";

import {
  fetchCompanies,
  fetchLocations,
  fetchDepartmentsById,
  fetchSubDepartmentsById,
  fetchDesignations,
  addNewDesignation,
} from "@services/ApiDataService";
import { useEmployeeForm } from "@contexts/EmployeeFormContext";
import FieldError from "@components/ErrorMessage/FieldError";
import DatePickerInput from "../../../components/DatePickerInput";

const sameId = (a, b) =>
  a !== "" && a != null && b !== "" && b != null && String(a) === String(b);

const OrganizationDetails = ({ onNext, onPrevious }) => {
  const { formData, updateFormData, errors, clearFieldError } =
    useEmployeeForm();
  const orgRef = useRef(formData.organization);
  const personalRef = useRef(formData.personal);
  useEffect(() => {
    orgRef.current = formData.organization;
  }, [formData.organization]);
  useEffect(() => {
    personalRef.current = formData.personal;
  }, [formData.personal]);

  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingSubDepartments, setIsLoadingSubDepartments] = useState(false);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(true);

  // Dropdown data state - now storing objects with id and name
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [locations, setLocations] = useState([]);

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
      const _newDesignation = await addNewDesignation(newDesignationName.trim());

      const DesignationsData = await fetchDesignations();

      setDesignations(DesignationsData);

      // Reset and close modal
      setNewDesignationName("");
      setNewDesignationError("");
      setShowAddDesignationModal(false);
      setNewDesignationSubmitting(false);
    } catch {
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

        // Read latest form after await — do not overwrite an employee already loaded for edit
        const currentOrg = orgRef.current || {};
        const isEditing = !!personalRef.current?.id || !!localStorage.getItem("editEmployeeId");
        let companyRows = Array.isArray(companiesData) ? [...companiesData] : [];

        if (
          currentOrg.company &&
          !companyRows.some((c) => sameId(c.id, currentOrg.company))
        ) {
          companyRows = [
            {
              id: currentOrg.company,
              name: currentOrg.companyName || `Company #${currentOrg.company}`,
              company_code: currentOrg.companyCode || "",
            },
            ...companyRows,
          ];
        }

        setCompanies(companyRows);
        setIsLoadingCompanies(false);
        setDesignations(Array.isArray(DesignationsData) ? DesignationsData : []);
        setIsLoadingDesignations(false);

        // Only auto-pick a company on a blank "new employee" form
        if (companyRows.length && !currentOrg.company && !isEditing) {
          const preferred =
            companyRows.find((c) => c.portal_active) || companyRows[0];
          updateFormData("organization", {
            company: preferred.id != null ? String(preferred.id) : "",
            companyCode: preferred.company_code || "",
            companyName: preferred.name || "",
          });
        }
      } catch (e) {
        console.error("Error loading data:", e);
        setIsLoadingCompanies(false);
        setIsLoadingDesignations(false);
      }
    };

    loadData();

    // Listen for loadDepartments event from context
    const handleLoadDepartments = async (event) => {
      const { companyId } = event.detail;
      if (companyId) {
        setIsLoadingDepartments(true);
        try {
          const departmentsData = await fetchDepartmentsById(companyId);
          setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
        } catch (e) {
          console.error("Error loading departments:", e);
        } finally {
          setIsLoadingDepartments(false);
        }
      }
    };

    window.addEventListener('loadDepartments', handleLoadDepartments);

    return () => {
      window.removeEventListener('loadDepartments', handleLoadDepartments);
    };
  }, [updateFormData]);

  // Keep the selected company visible even if the tenant company list is filtered
  useEffect(() => {
    const companyId = formData.organization.company;
    if (!companyId) return;
    setCompanies((prev) => {
      if (prev.some((c) => sameId(c.id, companyId))) return prev;
      return [
        {
          id: companyId,
          name: formData.organization.companyName || `Company #${companyId}`,
          company_code: formData.organization.companyCode || "",
        },
        ...prev,
      ];
    });
  }, [
    formData.organization.company,
    formData.organization.companyName,
    formData.organization.companyCode,
  ]);

  // Keep selected designation visible if the master list missed it
  useEffect(() => {
    const designationId = formData.organization.designation;
    if (!designationId) return;
    setDesignations((prev) => {
      if (prev.some((d) => sameId(d.id, designationId))) return prev;
      return [
        {
          id: designationId,
          name:
            formData.organization.designationName ||
            `Designation #${designationId}`,
        },
        ...prev,
      ];
    });
  }, [
    formData.organization.designation,
    formData.organization.designationName,
  ]);

  // Load departments when company is selected
  useEffect(() => {
    if (formData.organization.company) {
      const loadDepartments = async () => {
        setIsLoadingDepartments(true);
        try {
          const departmentsData = await fetchDepartmentsById(
            formData.organization.company
          );
          let rows = Array.isArray(departmentsData) ? [...departmentsData] : [];
          const deptId = orgRef.current?.department;
          if (
            deptId &&
            !rows.some((d) => sameId(d.id, deptId))
          ) {
            rows = [
              {
                id: deptId,
                name: orgRef.current?.departmentName || `Department #${deptId}`,
                company_id: formData.organization.company,
              },
              ...rows,
            ];
          }
          setDepartments(rows);
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

  useEffect(() => {
    const companyId = formData.organization.company;
    if (!companyId) {
      setLocations([]);
      return;
    }
    let cancelled = false;
    fetchLocations(companyId).then((rows) => {
      if (cancelled) return;
      const locationId = orgRef.current?.location;
      if (locationId && !rows.some((l) => sameId(l.id, locationId))) {
        rows = [{ id: locationId, name: orgRef.current?.locationName || `Location #${locationId}` }, ...rows];
      }
      setLocations(rows);
    });
    return () => {
      cancelled = true;
    };
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
          let rows = Array.isArray(subDepartmentsData) ? [...subDepartmentsData] : [];
          const subId = orgRef.current?.subDepartment;
          if (subId && !rows.some((s) => sameId(s.id, subId))) {
            rows = [
              {
                id: subId,
                name: orgRef.current?.subDepartmentName || `Sub-department #${subId}`,
                department_id: formData.organization.department,
              },
              ...rows,
            ];
          }
          setSubDepartments(rows);
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
    const parsedValue = value === "" ? "" : String(value);

    // Clear field error
    if (errors.organization?.[name]) {
      clearFieldError("organization", name);
    }

    if (name === "company") {
      const selected = companies.find((c) => sameId(c.id, parsedValue));
      updateFormData("organization", {
        company: selected?.id != null ? String(selected.id) : parsedValue,
        companyCode: selected?.company_code || "",
        companyName: selected?.name || "",
        department: "",
        departmentName: "",
        subDepartment: "",
        subDepartmentName: "",
        location: "",
        locationName: "",
      });
      return;
    }

    if (name === "location") {
      const selected = locations.find((l) => sameId(l.id, parsedValue));
      updateFormData("organization", {
        location: selected?.id != null ? String(selected.id) : "",
        locationName: selected?.name || "",
      });
      return;
    }

    if (name === "department") {
      const selected = departments.find((d) => sameId(d.id, parsedValue));
      updateFormData("organization", {
        department: selected?.id != null ? String(selected.id) : parsedValue,
        departmentName: selected?.name || "",
        subDepartment: "",
        subDepartmentName: "",
      });
      return;
    }

    if (name === "subDepartment") {
      const selected = subDepartments.find((s) => sameId(s.id, parsedValue));
      updateFormData("organization", {
        subDepartment: selected?.id != null ? String(selected.id) : parsedValue,
        subDepartmentName: selected?.name || "",
      });
      return;
    }

    if (name === "designation") {
      const selected = designations.find((s) => sameId(s.id, parsedValue));
      updateFormData("organization", {
        designation: selected?.id != null ? String(selected.id) : parsedValue,
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

  const ToggleButton = ({ enabled, onToggle, label }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        onChange={onToggle}
        className="sr-only peer"
        aria-label={`Toggle ${label}`}
      />
      <div
        className={`w-11 h-6 rounded-full transition-colors ${enabled ? "bg-blue-600" : "bg-gray-300"
          } peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2`}
      ></div>
      <div
        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0"
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
            {/* Company ID (dropdown) */}
            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Building2 className="text-gray-500" size={16} />
                Company ID <span className="text-red-500">*</span>
              </label>
              <div className="relative flex-1">
                {isLoadingCompanies ? (
                  <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-100">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <select
                    name="company"
                    value={formData.organization.company || ""}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-2 border ${errors.organization?.company
                      ? "border-red-500"
                      : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
                  >
                    <option value="">Select Company ID</option>
                    {companies.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.company_code
                          ? `${c.company_code} — ${c.name}`
                          : c.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Choose the company for this employee. Only companies in this organization are listed.
                </p>
                <FieldError error={errors.organization?.company} />
              </div>
            </div>

            {/* Company Name (auto-populated, read-only) */}
            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Building2 className="text-gray-500" size={16} />
                Company Name
              </label>
              <div className="relative flex-1">
                <input
                  type="text"
                  name="companyName"
                  value={formData.organization.companyName || ""}
                  readOnly
                  tabIndex={-1}
                  placeholder="Auto-populated from Company ID"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Determined automatically based on the selected Company ID.
                </p>
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
                    value={formData.organization.department || ""}
                    onChange={handleChange}
                    disabled={
                      !formData.organization.company || isLoadingDepartments
                    }
                    className={`w-full pl-8 pr-3 py-2 border ${errors.organization?.department
                      ? "border-red-500"
                      : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!formData.organization.company
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                      }`}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>
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
                    value={formData.organization.subDepartment || ""}
                    onChange={handleChange}
                    disabled={
                      !formData.organization.department ||
                      isLoadingSubDepartments
                    }
                    className={`w-full pl-8 pr-3 py-2 border ${errors.organization?.subDepartment
                      ? "border-red-500"
                      : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!formData.organization.department
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                      }`}
                    required
                  >
                    <option value="">Select Sub Department</option>
                    {subDepartments.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
                <FieldError error={errors.organization?.subDepartment} />
              </div>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <MapPin className="text-gray-500" size={16} />
                Location
              </label>
              <select
                name="location"
                value={formData.organization.location || ""}
                onChange={handleChange}
                disabled={!formData.organization.company || locations.length === 0}
                className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!formData.organization.company || locations.length === 0
                  ? "bg-gray-100 cursor-not-allowed"
                  : ""
                  }`}
              >
                <option value="">
                  {formData.organization.company && locations.length === 0
                    ? "No locations — add them in Department Master"
                    : "Select Location"}
                </option>
                {locations.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.name}
                  </option>
                ))}
              </select>
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
                  className={`w-full pl-8 pr-3 py-2 border ${errors.organization?.currentSupervisor
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
                <span className="text-xs text-gray-400 font-normal ml-1">(YYYY/MM/DD)</span>
              </label>
              <div className="relative">
                <DatePickerInput
                  name="dateOfJoined"
                  value={formData.organization.dateOfJoined}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={handleChange}
                  displayFormat="YYYY/MM/DD"
                  className={`w-full pl-8 pr-3 py-2 border ${errors.organization?.dateOfJoined
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
                      value={formData.organization.designation || ""}
                      onChange={handleDesignationChange}
                      className={`w-full pl-8 pr-3 py-2 border ${errors.organization?.designation
                        ? "border-red-500"
                        : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      required
                    >
                      <option value="">Select designation</option>
                      {designations.map((s) => (
                        <option key={s.id} value={String(s.id)}>
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
              <div className="relative mb-4">
                <select
                  name="dayOff"
                  value={formData.organization.dayOff || ""}
                  onChange={handleChange}
                  className={`w-full pl-8 pr-3 py-2 border ${errors.organization?.dayOff
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

              {/* Employee Category (Executive / Non-Executive) */}
              <div className="mb-4">
                <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                  <Briefcase className="text-gray-500" size={16} />
                  Employee Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="employeeCategory"
                    value={formData.organization.employeeCategory || ""}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-2 border ${errors.organization?.employeeCategory
                      ? "border-red-500"
                      : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Executive">Executive</option>
                    <option value="Non-Executive">Non-Executive</option>
                  </select>
                  <Briefcase
                    className="absolute left-2 top-2.5 text-gray-400"
                    size={16}
                  />
                </div>
                <FieldError error={errors.organization?.employeeCategory} />
              </div>
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
                    className={`text-sm ${formData.organization.probationPeriod
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
                    <DatePickerInput
                      name="probationFrom"
                      value={formData.organization.probationFrom}
                      onChange={handleChange}
                      min={formData.organization.dateOfJoined || ""}
                      max={formData.organization.probationTo || ""}
                      disabled={!formData.organization.probationPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${!formData.organization.probationPeriod
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : errors.organization?.probationFrom
                          ? "border-red-500"
                          : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${formData.organization.probationPeriod
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
                    <DatePickerInput
                      name="probationTo"
                      value={formData.organization.probationTo}
                      onChange={handleChange}
                      min={formData.organization.probationFrom || ""}
                      disabled={!formData.organization.probationPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${!formData.organization.probationPeriod
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : errors.organization?.probationTo
                          ? "border-red-500"
                          : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${formData.organization.probationPeriod
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
                    className={`text-sm ${formData.organization.trainingPeriod
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
                    <DatePickerInput
                      name="trainingFrom"
                      value={formData.organization.trainingFrom}
                      onChange={handleChange}
                      min={formData.organization.dateOfJoined || ""}
                      max={formData.organization.trainingTo || ""}
                      disabled={!formData.organization.trainingPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${!formData.organization.trainingPeriod
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : errors.organization?.trainingFrom
                          ? "border-red-500"
                          : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${formData.organization.trainingPeriod
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
                    <DatePickerInput
                      name="trainingTo"
                      value={formData.organization.trainingTo}
                      onChange={handleChange}
                      min={formData.organization.trainingFrom || ""}
                      disabled={!formData.organization.trainingPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${!formData.organization.trainingPeriod
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : errors.organization?.trainingTo
                          ? "border-red-500"
                          : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${formData.organization.trainingPeriod
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
                    className={`text-sm ${formData.organization.contractPeriod
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
                    <DatePickerInput
                      name="contractFrom"
                      value={formData.organization.contractFrom}
                      onChange={handleChange}
                      min={formData.organization.dateOfJoined || ""}
                      max={formData.organization.contractTo || ""}
                      disabled={!formData.organization.contractPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${!formData.organization.contractPeriod
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : errors.organization?.contractFrom
                          ? "border-red-500"
                          : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${formData.organization.contractPeriod
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
                    <DatePickerInput
                      name="contractTo"
                      value={formData.organization.contractTo}
                      onChange={handleChange}
                      min={formData.organization.contractFrom || ""}
                      disabled={!formData.organization.contractPeriod}
                      className={`w-full pl-8 pr-3 py-2 border ${!formData.organization.contractPeriod
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : errors.organization?.contractTo
                          ? "border-red-500"
                          : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${formData.organization.contractPeriod
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
                    className={`text-sm ${toggleStates.confirmationEnabled
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
                <DatePickerInput
                  name="confirmationDate"
                  value={formData.organization.confirmationDate}
                  onChange={handleChange}
                  // disabled={!toggleStates.confirmationEnabled}
                  className={`w-full pl-8 pr-3 py-2 border  rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <Calendar
                  className={`absolute left-2 top-2.5 ${toggleStates.confirmationEnabled
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
