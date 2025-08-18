import React, { useState, useEffect } from "react";
import {
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  User,
  Download,
  X,
  Check,
  ChevronDown,
  Upload,
  Search,
} from "lucide-react";
import ResignationsService from "@services/ResignationsService";
import employeeService from "@services/EmployeeDataService";
import Swal from "sweetalert2";

const Resignation = () => {
  const [formData, setFormData] = useState({
    employee_id: "",
    employee_name: "",
    employee_number: "",
    resigning_date: "",
    last_working_day: "",
    resignation_reason: "",
    documents: [],
  });

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch employees and resignations on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const employeesResponse = await employeeService.fetchEmployees();
        setEmployees(employeesResponse);
        setFilteredEmployees(employeesResponse);

        const resignationsResponse = await ResignationsService.getAllResignations();
        setResignations(resignationsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter employees based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (emp) =>
          String(emp.attendance_employee_no)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.id.toString().includes(searchTerm)
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee) => {
    setFormData({
      ...formData,
      employee_id: employee.id,
      employee_name: employee.full_name,
      employee_number: employee.attendance_employee_no,
    });
    setShowEmployeeDropdown(false);
    setSearchTerm("");
  };

  // Handle file upload with size validation
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes

    // Check for oversized files
    const oversizedFiles = files.filter(file => file.size > MAX_SIZE);
    
    if (oversizedFiles.length > 0) {
      const errorMessage = [
        "The following files exceed 5MB limit:",
        ...oversizedFiles.map(f => `• ${f.name} (${(f.size/(1024*1024)).toFixed(2)}MB)`)
      ].join('\n');

      setErrors({
        ...errors,
        documents: [errorMessage]
      });
      return;
    }

    setFormData({
      ...formData,
      documents: [...formData.documents, ...files],
    });
    
    // Clear previous errors if any
    if (errors.documents) {
      setErrors({
        ...errors,
        documents: null,
      });
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (index) => {
    const updatedDocuments = [...formData.documents];
    updatedDocuments.splice(index, 1);
    setFormData({
      ...formData,
      documents: updatedDocuments,
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (!formData.employee_id) {
      newErrors.employee_id = "Please select an employee";
    }

    if (!formData.resigning_date) {
      newErrors.resigning_date = "Resignation date is required";
    }

    if (!formData.last_working_day) {
      newErrors.last_working_day = "Last working day is required";
    } else if (new Date(formData.last_working_day) < new Date(formData.resigning_date)) {
      newErrors.last_working_day = "Last working day must be on or after resignation date";
    }

    if (!formData.resignation_reason) {
      newErrors.resignation_reason = "Resignation reason is required";
    } else if (formData.resignation_reason.length < 10) {
      newErrors.resignation_reason = "Reason must be at least 10 characters long";
    }

    // File size validation
    if (formData.documents?.length > 0) {
      const oversizedFiles = formData.documents.filter(f => f.size > MAX_SIZE);
      if (oversizedFiles.length > 0) {
        newErrors.documents = [
          "The following files exceed 5MB limit:",
          ...oversizedFiles.map(f => `• ${f.name} (${(f.size/(1024*1024)).toFixed(2)}MB)`)
        ];
      }
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      
      // Display all errors in a modal
      const errorMessages = [];
      Object.values(formErrors).forEach(error => {
        if (Array.isArray(error)) {
          errorMessages.push(...error);
        } else {
          errorMessages.push(error);
        }
      });

      Swal.fire({
        icon: "error",
        title: "Form Errors",
        html: errorMessages.map(msg => `<div>${msg}</div>`).join(''),
      });
      
      return;
    }

    try {
      setLoading(true);
      const submissionData = {
        employee_id: formData.employee_id,
        resigning_date: formData.resigning_date,
        last_working_day: formData.last_working_day,
        resignation_reason: formData.resignation_reason,
        documents: formData.documents,
      };
      
      await ResignationsService.createResignation(submissionData);

      // Reset form
      setFormData({
        employee_id: "",
        employee_name: "",
        employee_number: "",
        resigning_date: "",
        last_working_day: "",
        resignation_reason: "",
        documents: [],
      });
      
      setErrors({});
      setSuccessMessage("Resignation submitted successfully!");

      // Refresh data
      const updatedResignations = await ResignationsService.getAllResignations();
      setResignations(updatedResignations.data);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Resignation submitted successfully!",
        timer: 2000,
      });

    } catch (error) {
      console.error("Error submitting resignation:", error);
      
      let errorMessage = "An error occurred while submitting the resignation";
      
      if (error.response?.data?.message === 'This employee already has a pending resignation request') {
        errorMessage = "This employee already has a pending resignation request";
      } else if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).flat().join('\n');
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {loading && employees.length === 0 && resignations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
          <div className="text-lg text-blue-600 font-semibold">
            Loading data...
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="text-blue-500" size={20} />
                Manage Resignation Details
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Employee Selection */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                  <User className="text-blue-500" size={18} />
                  Search Employee
                </label>

                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowEmployeeDropdown(true);
                      }}
                      onFocus={() => setShowEmployeeDropdown(true)}
                      placeholder="Search by ID, name or employee number..."
                      className={`w-full pl-10 pr-8 py-2 border ${
                        errors.employee_id
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
                      disabled={loading}
                    />
                    <Search
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
                  </div>

                  {showEmployeeDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-auto">
                      {filteredEmployees.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500">
                          No employees found
                        </div>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <div
                            key={employee.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                            onClick={() => handleEmployeeSelect(employee)}
                          >
                            <div>
                              <div className="font-medium">
                                {employee.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {employee.id} |{" "}
                                {employee.attendance_employee_no} |{" "}
                                {employee.department}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {errors.employee_id && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.employee_id}
                    </p>
                  )}
                </div>

                {/* Selected Employee Info */}
                {formData.employee_id && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {formData.employee_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Employee No: {formData.employee_number}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            employee_id: "",
                            employee_name: "",
                            employee_number: "",
                          }));
                          setSearchTerm("");
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Resignation Date */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="text-blue-500" size={18} />
                  Resignation Submission Date
                </h3>
                <div className="relative">
                  <input
                    type="date"
                    name="resigning_date"
                    value={formData.resigning_date}
                    onChange={handleChange}
                    className={`w-full md:w-1/2 pl-10 pr-3 py-2 border ${
                      errors.resigning_date
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
                    disabled={loading}
                  />
                  <Calendar
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                  {errors.resigning_date && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.resigning_date}
                    </p>
                  )}
                </div>
              </div>

              {/* Last Working Day */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="text-blue-500" size={18} />
                  Last Working Day
                </h3>
                <div className="relative">
                  <input
                    type="date"
                    name="last_working_day"
                    value={formData.last_working_day}
                    onChange={handleChange}
                    className={`w-full md:w-1/2 pl-10 pr-3 py-2 border ${
                      errors.last_working_day
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
                    disabled={loading}
                  />
                  <Calendar
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                  {errors.last_working_day && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.last_working_day}
                    </p>
                  )}
                </div>
              </div>

              {/* Resignation Reason */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                  <FileText className="text-blue-500" size={18} />
                  Resignation Reason
                </label>
                <div className="relative">
                  <textarea
                    name="resignation_reason"
                    value={formData.resignation_reason}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Please provide the reason for resignation"
                    className={`w-full pl-10 pr-3 py-2 border ${
                      errors.resignation_reason
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none`}
                    disabled={loading}
                  />
                  <FileText
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                  {errors.resignation_reason && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.resignation_reason}
                    </p>
                  )}
                </div>
              </div>

              {/* Document Upload */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                  <Upload className="text-blue-500" size={18} />
                  Upload Documents (Max 5MB each)
                </label>

                {/* Upload Area */}
                <label
                  className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors mb-4"
                  style={{
                    borderColor: errors.documents ? "#ef4444" : "#d1d5db",
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-1 text-sm text-gray-500">
                      <span className="font-semibold text-blue-500">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      PDF, DOC, DOCX, JPG, PNG (MAX. 5MB each)
                    </p>
                  </div>
                  <input
                    type="file"
                    name="documents"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    multiple
                    disabled={loading}
                  />
                </label>

                {/* Uploaded Files Display */}
                {formData.documents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">
                      Uploaded Documents ({formData.documents.length})
                    </h4>
                    {formData.documents.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-green-100 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 rounded-full">
                            <FileText className="text-green-500" size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove"
                          disabled={loading}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File size errors */}
                {errors.documents && (
                  <div className="mt-2 p-2 bg-red-50 text-red-600 rounded text-sm">
                    {errors.documents.map((msg, i) => (
                      <p key={i}>{msg}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    "Submitting..."
                  ) : (
                    <>
                      {successMessage ? <Check size={18} /> : null}
                      {successMessage ? "Submitted" : "Submit Resignation"}
                    </>
                  )}
                </button>
              </div>
            </form>

            {successMessage && (
              <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                <CheckCircle className="text-green-500" size={20} />
                {successMessage}
              </div>
            )}
          </div>

          {/* Resignation Table */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <FileText className="text-blue-500" size={20} />
              Resignation Records
            </h2>

            {loading && resignations.length === 0 ? (
              <div className="text-center py-8">Loading resignations...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resignation Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Working Day
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resignations.map((resignation) => (
                      <tr key={resignation.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(() => {
                            const emp = employees.find(
                              (e) => e.id === resignation.employee_id
                            );
                            return emp ? emp.full_name : "N/A";
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(() => {
                            const emp = employees.find(
                              (e) => e.id === resignation.employee_id
                            );
                            return emp ? emp.attendance_employee_no : "N/A";
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(resignation.resigning_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(resignation.last_working_day)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                          {resignation.resignation_reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                              resignation.status
                            )}`}
                          >
                            {resignation.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Resignation;