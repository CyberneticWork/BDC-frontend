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
} from "lucide-react";
import axios from "@utils/axios";
import Swal from "sweetalert2";
import {
  fetchCompanies,
  fetchDepartments,
  fetchSubDepartments,
  fetchDesignations,
} from "@services/ApiDataService";
import { useEmployeeForm } from '@contexts/EmployeeFormContext';

const OrganizationDetails = ({ onNext, onPrevious, activeCategory }) => {
  const { formData, updateFormData } = useEmployeeForm();
  const [isLoading, setIsLoading] = useState(false);

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

  // Load organization data from API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [
          companiesData,
          departmentsData,
          subDepartmentsData,
          DesignationsData,
        ] = await Promise.all([
          fetchCompanies(),
          fetchDepartments(),
          fetchSubDepartments(),
          fetchDesignations(),
        ]);

        setCompanies(companiesData);
        setDepartments(departmentsData);
        setSubDepartments(subDepartmentsData);
        setDesignations(DesignationsData);
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    updateFormData('organization', {
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
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
        updateFormData('organization', { [formKey]: newValue });
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

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 bg-white rounded-lg shadow-md flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
                <select
                  name="company"
                  value={formData.organization.company}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department */}
            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Layers className="text-gray-500" size={16} />
                Department
              </label>
              <div className="relative flex-1">
                <select
                  name="department"
                  value={formData.organization.department}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub Department */}
            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Layers className="text-gray-500" size={16} />
                Sub Department <span className="text-red-500">*</span>
              </label>
              <div className="relative flex-1">
                <select
                  name="subDepartment"
                  value={formData.organization.subDepartment}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Sub Department</option>
                  {subDepartments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
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
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <User
                  className="absolute left-2 top-2.5 text-gray-400"
                  size={16}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Calendar className="text-gray-500" size={16} />
                Date of Joined
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dateOfJoined"
                  value={formData.organization.dateOfJoined}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Briefcase className="text-gray-500" size={16} />
                Designation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="designation"
                  value={formData.organization.designation}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select designations</option>
                  {designations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Layers className="text-gray-500" size={16} />
                Day Off <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="dayOff"
                  value={formData.organization.dayOff || ""}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                </select>
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
                    className={`text-sm ${
                      toggleStates.probationEnabled
                        ? "text-blue-600"
                        : "text-red-400"
                    }`}
                  >
                    {toggleStates.probationEnabled ? "Enabled" : "Disabled"}
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
                      disabled={!toggleStates.probationEnabled}
                      className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !toggleStates.probationEnabled
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        toggleStates.probationEnabled
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">To Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="probationTo"
                      value={formData.organization.probationTo}
                      onChange={handleChange}
                      disabled={!toggleStates.probationEnabled}
                      className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !toggleStates.probationEnabled
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        toggleStates.probationEnabled
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
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
                      toggleStates.trainingEnabled
                        ? "text-blue-600"
                        : "text-red-400"
                    }`}
                  >
                    {toggleStates.trainingEnabled ? "Enabled" : "Disabled"}
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
                      disabled={!toggleStates.trainingEnabled}
                      className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !toggleStates.trainingEnabled
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        toggleStates.trainingEnabled
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">To Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="trainingTo"
                      value={formData.organization.trainingTo}
                      onChange={handleChange}
                      disabled={!toggleStates.trainingEnabled}
                      className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !toggleStates.trainingEnabled
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        toggleStates.trainingEnabled
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
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
                      toggleStates.contractEnabled
                        ? "text-blue-600"
                        : "text-red-400"
                    }`}
                  >
                    {toggleStates.contractEnabled ? "Enabled" : "Disabled"}
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
                      disabled={!toggleStates.contractEnabled}
                      className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !toggleStates.contractEnabled
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        toggleStates.contractEnabled
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">To Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="contractTo"
                      value={formData.organization.contractTo}
                      onChange={handleChange}
                      disabled={!toggleStates.contractEnabled}
                      className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !toggleStates.contractEnabled
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                    />
                    <Calendar
                      className={`absolute left-2 top-2.5 ${
                        toggleStates.contractEnabled
                          ? "text-gray-400"
                          : "text-gray-300"
                      }`}
                      size={16}
                    />
                  </div>
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
                    {toggleStates.confirmationEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <ToggleButton
                    enabled={toggleStates.confirmationEnabled}
                    onToggle={() => handleToggle("confirmationEnabled")}
                    label="Confirmation Date"
                  />
                </div>
              </div>
              <div className="relative">
                <input
                  type="date"
                  name="confirmationDate"
                  value={formData.organization.confirmationDate}
                  onChange={handleChange}
                  disabled={!toggleStates.confirmationEnabled}
                  className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !toggleStates.confirmationEnabled
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : ""
                  }`}
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
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
          <p className="text-gray-500 text-sm">* Required fields</p>
          <div className="flex gap-4">
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
        </div>
      </form>
    </div>
  );
};

export default OrganizationDetails;