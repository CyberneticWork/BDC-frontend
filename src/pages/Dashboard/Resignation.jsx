import React, { useState } from "react";
import { Calendar, FileText, CheckCircle, XCircle, User, MapPin, Download, X, Check, ChevronDown, Upload } from "lucide-react";

const defaultFormData = {
  resignationDate: "",
  resignationDocuments: [],
  resignationReason: "",
  employeeName: "",
};

const dummyResignations = [
  {
    id: 1,
    employee: "John Doe",
    department: "Engineering",
    resignationDate: "2024-06-15",
    lastWorkingDay: "2024-07-15",
    status: "Notice Period",
    approval: "Pending",
    reason: "Better opportunity"
  },
  {
    id: 2,
    employee: "Jane Smith",
    department: "Marketing",
    resignationDate: "2024-06-20",
    lastWorkingDay: "2024-07-20",
    status: "Exit Formalities",
    approval: "Pending",
    reason: "Personal reasons"
  }
];

const employees = [
  { id: 1, name: "John Doe", department: "Engineering" },
  { id: 2, name: "Jane Smith", department: "Marketing" },
  { id: 3, name: "Mike Johnson", department: "Sales" },
  { id: 4, name: "Sarah Wilson", department: "HR" },
  { id: 5, name: "David Brown", department: "Finance" },
];

const Resignation = () => {
  const [formData, setFormData] = useState(defaultFormData);
  const [submitted, setSubmitted] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [errors, setErrors] = useState({});
  const [isTermination, setIsTermination] = useState(false);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle bulk file upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newDocuments = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      file: file
    }));
    
    setFormData({
      ...formData,
      resignationDocuments: [...formData.resignationDocuments, ...newDocuments]
    });
  };

  // Remove uploaded file
  const handleRemoveFile = (documentId) => {
    setFormData({
      ...formData,
      resignationDocuments: formData.resignationDocuments.filter(doc => doc.id !== documentId)
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.resignationDate) newErrors.resignationDate = "Resignation date is required";
    if (formData.resignationDocuments.length === 0) newErrors.resignationDocuments = "At least one document is required";
    if (!formData.resignationReason) newErrors.resignationReason = "Resignation reason is required";
    if (!formData.employeeName) newErrors.employeeName = "Employee selection is required";
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setErrors({});
    setSubmitted(true);
    setShowTable(true);
    setIsTermination(true);
    
    // Scroll to table after submission
    setTimeout(() => {
      const table = document.getElementById("resignation-table");
      if (table) {
        table.scrollIntoView({ behavior: "smooth" });
      }
    }, 500);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-500" size={20} />
            Manage Resignation Details
          </h2>
        </div>
        
        <div className="space-y-6">
          {/* Employee Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
              <User className="text-blue-500" size={18} />
              Select Employee
            </label>
            <div className="relative">
              <select
                name="employeeName"
                value={formData.employeeName}
                onChange={handleChange}
                className={`w-full md:w-1/2 pl-10 pr-8 py-2 border ${errors.employeeName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none`}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.name}>
                    {employee.name} - {employee.department}
                  </option>
                ))}
              </select>
              <User
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            {errors.employeeName && (
              <p className="mt-1 text-sm text-red-500">{errors.employeeName}</p>
            )}
          </div>

          {/* Resignation Date */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="text-blue-500" size={18} />
              Date of Resigning
            </h3>
            <div className="relative">
              <input
                type="date"
                name="resignationDate"
                value={formData.resignationDate}
                onChange={handleChange}
                className={`w-full md:w-1/2 pl-10 pr-3 py-2 border ${errors.resignationDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
              />
              <Calendar
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              {errors.resignationDate && (
                <p className="mt-1 text-sm text-red-500">{errors.resignationDate}</p>
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
                name="resignationReason"
                value={formData.resignationReason}
                onChange={handleChange}
                rows="4"
                placeholder="Please provide the reason for resignation..."
                className={`w-full pl-10 pr-3 py-2 border ${errors.resignationReason ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none`}
              />
              <FileText
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              {errors.resignationReason && (
                <p className="mt-1 text-sm text-red-500">{errors.resignationReason}</p>
              )}
            </div>
          </div>

          {/* Bulk Document Upload */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
              <Upload className="text-blue-500" size={18} />
              Upload Documents (Multiple files allowed)
            </label>
            
            {/* Upload Area */}
            <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors mb-4"
              style={{ borderColor: errors.resignationDocuments ? '#ef4444' : '#d1d5db' }}>
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-1 text-sm text-gray-500">
                  <span className="font-semibold text-blue-500">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">PDF, DOCX, JPG, PNG (MAX. 5MB each)</p>
              </div>
              <input
                type="file"
                name="resignationDocuments"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
              />
            </label>

            {/* Uploaded Files Display */}
            {formData.resignationDocuments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Uploaded Documents ({formData.resignationDocuments.length})</h4>
                {formData.resignationDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-green-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-full">
                        <FileText className="text-green-500" size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(doc.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Remove"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {errors.resignationDocuments && (
              <p className="mt-1 text-sm text-red-500">{errors.resignationDocuments}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
            >
              {submitted ? (
                <>
                  <Check size={18} />
                  Submitted
                </>
              ) : (
                "Submit Resignation"
              )}
            </button>
          </div>
        </div>

        {submitted && (
          <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle className="text-green-500" size={20} />
            Resignation submitted successfully!
          </div>
        )}
      </div>

      {/* Resignation Table - shown after submission */}
      {showTable && (
        <div id="resignation-table" className="bg-white rounded-2xl shadow-xl p-6 transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <FileText className="text-blue-500" size={20} />
            {isTermination ? 'Termination Records' : 'Recent Resignations'}
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resignation Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Working Day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dummyResignations.map((resignation) => (
                  <tr key={resignation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{resignation.employee}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resignation.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resignation.resignationDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resignation.lastWorkingDay}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resignation.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${resignation.status === 'Notice Period' ? 'bg-blue-100 text-blue-800' : 
                          resignation.status === 'Exit Formalities' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {resignation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="text-blue-500 hover:text-blue-700 cursor-pointer">View (2)</span>
                    </td>
                  </tr>
                ))}
                {/* Add the newly submitted resignation */}
                {submitted && (
                  <tr className="bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formData.employeeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employees.find(emp => emp.name === formData.employeeName)?.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formData.resignationDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formData.resignationDate ? 
                        new Date(new Date(formData.resignationDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                        'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formData.resignationReason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Terminated
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="text-blue-500 hover:text-blue-700 cursor-pointer">
                        View ({formData.resignationDocuments.length})
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resignation;