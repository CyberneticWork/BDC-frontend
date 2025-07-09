import React, { useState } from "react";
import { Calendar, FileText, CheckCircle, XCircle, User, MapPin, Download, X, Check, ChevronDown } from "lucide-react";

const defaultFormData = {
  resignationDate: "",
  resignationLetter: null,
  resignationApproved: false,
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
    approval: "Approved",
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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        resignationLetter: {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          file: file
        }
      });
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setFormData({...formData, resignationLetter: null});
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.resignationDate) newErrors.resignationDate = "Resignation date is required";
    if (!formData.resignationLetter) newErrors.resignationLetter = "Resignation letter is required";
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
      document.getElementById("resignation-table").scrollIntoView({ behavior: "smooth" });
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Resignation Letter */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
              <FileText className="text-blue-500" size={18} />
              Upload Resignation Letter
            </label>
            
            {formData.resignationLetter ? (
              <div className="flex items-center justify-between p-3 bg-white border border-green-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-full">
                    <FileText className="text-green-500" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{formData.resignationLetter.name}</p>
                    <p className="text-sm text-gray-500">{formData.resignationLetter.size}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Remove"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                style={{ borderColor: errors.resignationLetter ? '#ef4444' : '#d1d5db' }}>
                <div className="flex flex-col items-center justify-center">
                  <FileText className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-1 text-sm text-gray-500">
                    <span className="font-semibold text-blue-500">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PDF, DOCX (MAX. 5MB)</p>
                </div>
                <input
                  type="file"
                  name="resignationLetter"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                />
              </label>
            )}
            {errors.resignationLetter && (
              <p className="mt-1 text-sm text-red-500">{errors.resignationLetter}</p>
            )}
          </div>

          {/* Approval Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="resignationApproved"
                checked={formData.resignationApproved}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              <span className="ms-3 text-gray-700 font-medium flex items-center gap-2">
                {formData.resignationApproved ? (
                  <>
                    <CheckCircle className="text-green-500" size={18} />
                    <span>Resignation Approved</span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-500" size={18} />
                    <span>Pending Approval</span>
                  </>
                )}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
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
        </form>

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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${resignation.approval === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {resignation.approval}
                      </span>
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${formData.resignationApproved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {formData.resignationApproved ? 'Approved' : 'Pending'}
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