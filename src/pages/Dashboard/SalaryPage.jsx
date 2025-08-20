import { useState, useEffect } from "react";
import {
  Building2,
  Edit,
  Trash2,
  Check,
  X,
  ChevronDown,
  Loader2,
  Save,
  User,
  DollarSign,
  Calendar,
  Layers,
  Clock,
  FileText,
  RefreshCw,
} from "lucide-react";
import {
  fetchSalaryDataAPI,
  updateSalaryAPI,
  deleteSalaryRecordAPI,
  fetchSalaryCSV,
} from "@services/SalaryService";

// Modal Component
// Fixed Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on backdrop
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  // Add keyboard event listener when modal opens
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Enhanced backdrop with blur and animation */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out"
        aria-hidden="true"
      />

      {/* Modal content with enhanced animations and styling */}
      <div
        className="relative w-full max-w-2xl transform transition-all duration-300 ease-out scale-100 opacity-100"
        style={{
          animation: isOpen
            ? "modalEnter 0.3s ease-out"
            : "modalExit 0.2s ease-in",
        }}
      >
        <div className="relative bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 group"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Modal content */}
          <div className="relative">{children}</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes modalExit {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

const SalaryPage = () => {
  const [salaryData, setSalaryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [formData, setFormData] = useState({
    basic_salary: "",
    increment_active: false,
    increment_value: "",
    increment_effected_date: "",
    // OT controls (enabled + value)
    ot_morning_enabled: false,
    ot_morning: 0,
    ot_evening_enabled: false,
    ot_evening: 0,
    enable_epf_etf: false,
    br1: false,
    br2: false,
    total_loan_amount: "",
    installment_count: "",
    installment_amount: "",
    approved_no_pay_days: 0,
    status: "pending",
    month: "",
    year: "",
    stamp: false,
    net_salary: 0,
  });

  // Fetch salary data
  const fetchSalaryData = async () => {
    setIsLoading(true);

    try {
      const response = await fetchSalaryDataAPI();
      setSalaryData(response);
      setFilteredData(response);
    } catch (error) {
      console.error("Error fetching salary data:", error);
      // Optionally show an error message to the user
    } finally {
      setIsLoading(false);
    }
  };

  // Update salary record
  const updateSalaryRecord = async (id, data) => {
    try {
      await updateSalaryAPI(id, data);
      fetchSalaryData(); // Refresh data
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating salary record:", error);
      alert("Failed to update record");
    }
  };

  // Delete salary record
  const deleteSalaryRecord = async (id) => {
    try {
      await deleteSalaryRecordAPI(id);
      fetchSalaryData(); // Refresh data
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting salary record:", error);
      alert("Failed to delete record");
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle edit button click
  const handleEdit = (record) => {
    // Normalize various backend formats (0/1, "0"/"1", boolean)
    const bool = (v) => Boolean(v || v === 1 || v === "1");
    const sb = record.salary_breakdown || {};
    setCurrentRecord(record);
    setFormData({
      basic_salary: record.basic_salary ?? "",
      increment_active: bool(record.increment_active),
      increment_value: record.increment_value ?? "",
      increment_effected_date: record.increment_effected_date?.split("T")[0] ?? "",
      ot_morning_enabled: Number(record.ot_morning) > 0 || bool(sb.ot_morning_fees),
      ot_morning: sb.ot_morning_fees ?? record.ot_morning ?? 0,
      ot_evening_enabled: Number(record.ot_evening) > 0 || bool(sb.ot_night_fees),
      ot_evening: sb.ot_night_fees ?? record.ot_evening ?? 0,
      enable_epf_etf: bool(record.enable_epf_etf),
      br1: bool(record.br1),
      br2: bool(record.br2),
      stamp: bool(record.stamp),
      total_loan_amount: record.total_loan_amount ?? "",
      installment_count: record.installment_count ?? "",
      installment_amount: record.installment_amount ?? "",
      approved_no_pay_days: record.approved_no_pay_days ?? 0,
      status: record.status ?? "pending",
      month: record.month ?? "",
      year: record.year ?? "",
      // visible preview value
      net_salary: sb.net_salary ?? 0,
    });
    setIsModalOpen(true);
  };

  // Update the handleSubmit function to properly format the data for API
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Show loading indicator
      setIsLoading(true);
      
      // Build salary_breakdown object (editable subset + recalculated fields)
      // preserve allowances/deductions from currentRecord if present
      const allowances = Array.isArray(currentRecord?.allowances)
        ? currentRecord.allowances
        : (currentRecord?.allowances ? JSON.parse(currentRecord.allowances) : []);
      const deductions = Array.isArray(currentRecord?.deductions)
        ? currentRecord.deductions
        : (currentRecord?.deductions ? JSON.parse(currentRecord.deductions) : []);
      
      const basicSalaryNum = parseFloat(formData.basic_salary || 0);
      const workingDays = (() => {
        const y = parseInt(formData.year || currentRecord?.year || new Date().getFullYear());
        const m = parseInt(formData.month || currentRecord?.month || (new Date().getMonth() + 1));
        if (!isNaN(y) && !isNaN(m)) {
          const totalDaysInMonth = new Date(y, m, 0).getDate();
          return Math.max(1, totalDaysInMonth - 8); // same heuristic as backend
        }
        return 22;
      })();
      
      const perDaySalary = basicSalaryNum / workingDays;
      const noPayDeduction = (parseInt(formData.approved_no_pay_days || 0) || 0) * perDaySalary;
      const adjustedBasic = basicSalaryNum - noPayDeduction;
      
      const totalAllowances = (allowances || []).reduce((s, a) => s + (parseFloat(a.amount || 0) || 0), 0);
      const totalFixedDeductions = (deductions || []).reduce((s, d) => s + (parseFloat(d.amount || 0) || 0), 0);
      
      const epfBase = adjustedBasic + totalAllowances;
      const epfEmployee = formData.enable_epf_etf ? epfBase * 0.08 : 0;
      const epfEmployer = formData.enable_epf_etf ? epfBase * 0.12 : 0;
      const etfEmployer = formData.enable_epf_etf ? epfBase * 0.03 : 0;
      
      const morningOtVal = formData.ot_morning_enabled ? parseFloat(formData.ot_morning || 0) : 0;
      const eveningOtVal = formData.ot_evening_enabled ? parseFloat(formData.ot_evening || 0) : 0;
      
      const grossSalary = epfBase + morningOtVal + eveningOtVal;
      const totalDeductions = totalFixedDeductions + (parseFloat(formData.installment_amount || 0) || 0) + epfEmployee;
      const stampVal = formData.stamp ? 25 : 0;
      const netSalaryPreview = grossSalary - totalDeductions - stampVal;
      
      const updatedSalaryBreakdown = {
        basic_salary: basicSalaryNum,
        br_allowance: calculateBRAllowance(), // uses formData.br1/br2
        ot_morning_fees: morningOtVal,
        ot_night_fees: eveningOtVal,
        adjusted_basic: adjustedBasic,
        per_day_salary: perDaySalary,
        no_pay_deduction: noPayDeduction,
        total_allowances: totalAllowances,
        epf_etf_base: epfBase,
        epf_employee_deduction: epfEmployee,
        epf_employer_contribution: epfEmployer,
        etf_employer_contribution: etfEmployer,
        total_fixed_deductions: totalFixedDeductions,
        loan_installment: parseFloat(formData.installment_amount || 0) || 0,
        gross_salary: grossSalary,
        total_deductions: totalDeductions,
        stamp: stampVal,
        net_salary: Math.round((netSalaryPreview + Number.EPSILON) * 100) / 100,
      };
      
      const formattedData = {
        basic_salary: parseFloat(formData.basic_salary),
        increment_active: formData.increment_active ? 1 : 0,
        increment_value: formData.increment_value ? parseFloat(formData.increment_value) : null,
        increment_effected_date: formData.increment_effected_date || null,
        ot_morning: formData.ot_morning_enabled ? parseFloat(formData.ot_morning || 0) : 0,
        ot_evening: formData.ot_evening_enabled ? parseFloat(formData.ot_evening || 0) : 0,
        enable_epf_etf: formData.enable_epf_etf ? 1 : 0,
        br1: formData.br1 ? 1 : 0,
        br2: formData.br2 ? 1 : 0,
        stamp: formData.stamp ? 1 : 0,
        total_loan_amount: formData.total_loan_amount ? parseFloat(formData.total_loan_amount) : 0,
        installment_count: formData.installment_count ? parseInt(formData.installment_count) : null,
        installment_amount: formData.installment_amount ? parseFloat(formData.installment_amount) : null,
        approved_no_pay_days: parseInt(formData.approved_no_pay_days || 0),
        status: formData.status,
        month: String(formData.month),
        year: String(formData.year),
        // send updated salary_breakdown as object (backend will store JSON)
        salary_breakdown: updatedSalaryBreakdown,
      };

      await updateSalaryAPI(currentRecord.id, formattedData);
      
      // Refresh data
      await fetchSalaryData();
      
      // Show success message
      alert("Salary record updated successfully");
      
      // Close modal
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating salary record:", error);
      
      // Show validation errors if available
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response?.data?.errors || {})
          .flat()
          .join('\n');
        alert(`Validation errors:\n${errorMessages}`);
      } else {
        // Show generic error message
        alert("Failed to update record: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data by company
  useEffect(() => {
    if (selectedCompany === "") {
      setFilteredData(salaryData);
    } else {
      const filtered = salaryData.filter(
        (item) => item.company_name === selectedCompany
      );
      setFilteredData(filtered);
    }
  }, [selectedCompany, salaryData]);

  // Fetch data on component mount
  useEffect(() => {
    fetchSalaryData();
  }, []);

  // Get unique companies for filter
  const companies = [
    ...new Set(salaryData.map((item) => item.company_name)),
  ].sort();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [expandedRow, setExpandedRow] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      processed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      draft: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full border ${
          statusConfig[status] || statusConfig.draft
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await fetchSalaryCSV();

      const blob = await response;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "salary_records.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download CSV");
    }
  };

  // Add these helper functions for calculations
  const calculateBRAllowance = () => {
    let brAllowance = 0;
    if (formData.br1 && formData.br2) {
      brAllowance = 3500; // Both BR1 and BR2
    } else if (formData.br1) {
      brAllowance = 1000; // BR1 Only
    } else if (formData.br2) {
      brAllowance = 2500; // BR2 Only
    }
    return brAllowance;
  };

  const calculateNoPayDeduction = () => {
    const basicSalary = parseFloat(formData.basic_salary || 0);
    // Simplified calculation - for production you might want more accuracy
    const workingDays = 22; // Assuming ~22 working days per month
    const perDaySalary = basicSalary / workingDays;
    return perDaySalary * (parseInt(formData.approved_no_pay_days || 0));
  };

  const calculateEPF = () => {
    if (!formData.enable_epf_etf) return 0;
    const basicSalary = parseFloat(formData.basic_salary || 0);
    // Using simplified calculation - actual would include allowances too
    return basicSalary * 0.08;
  };

  const calculateETF = () => {
    if (!formData.enable_epf_etf) return 0;
    const basicSalary = parseFloat(formData.basic_salary || 0);
    // Using simplified calculation - actual would include allowances too
    return basicSalary * 0.03;
  };

  const calculateNetSalary = () => {
    const basicSalary = parseFloat(formData.basic_salary || 0);
    const brAllowance = calculateBRAllowance();
    const noPayDeduction = calculateNoPayDeduction();
    const epfDeduction = calculateEPF();
    const loanInstallment = parseFloat(formData.installment_amount || 0);
    const stampDuty = formData.stamp ? 25 : 0;
    const morningOT = formData.ot_morning_enabled ? parseFloat(formData.ot_morning || 0) : 0;
    const eveningOT = formData.ot_evening_enabled ? parseFloat(formData.ot_evening || 0) : 0;
    
    return basicSalary + brAllowance + morningOT + eveningOT - noPayDeduction - epfDeduction - loanInstallment - stampDuty;
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Salary Records</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Company
            </label>
            <div className="relative">
              <Building2
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Companies</option>
                {companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          {/* In your filter section, modify the button container */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSalaryData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <RefreshCw size={18} className="mr-2" />
              Refresh
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <FileText size={18} className="mr-2" />
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
        </div>
      )}

      {/* Salary Records Table */}
      {!isLoading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company/Dept
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Basic Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {record.employee_no}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.company_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.department_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parseFloat(record.basic_salary).toLocaleString("en-US", {
                        style: "currency",
                        currency: "LKR",
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === "processed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.salary_breakdown?.net_salary?.toLocaleString(
                        "en-US",
                        {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 2,
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentRecord(record);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredData.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Building2 size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No salary records found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filter criteria
            </p>
          </div>
        </div>
      )}

      {/* Edit Modal - Improved, more compact UI */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {currentRecord && (
          <div className="p-4">
            {/* Header with employee info */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-lg font-bold">Edit Salary Record</h2>
                <p className="text-sm text-gray-600">
                  {currentRecord.full_name} • {currentRecord.department_name}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Tabs for better organization */}
              <div className="border-b border-gray-200 mb-4">
                <div className="flex space-x-2 text-sm">
                  <button type="button" className="px-3 py-2 border-b-2 border-blue-500 text-blue-600 font-medium">
                    Basic Info
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {/* First column - Basic salary and status */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Basic Salary
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">Rs.</span>
                      </div>
                      <input
                        type="number"
                        name="basic_salary"
                        value={formData.basic_salary}
                        onChange={handleInputChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-2 py-1.5 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="block w-full pl-2 pr-8 py-1.5 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                    >
                      {/* <option value="pending">Pending</option>
                      <option value="processed">Processed</option> */}
                      <option value="issued">Issued</option>
                      <option value="hold">Hold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      No Pay Days
                    </label>
                    <input
                      type="number"
                      name="approved_no_pay_days"
                      value={formData.approved_no_pay_days}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full px-2 py-1.5 sm:text-sm border-gray-300 rounded-md"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>

                {/* Second column - Period and checkboxes */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Month
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="month"
                        value={formData.month}
                        onChange={handleInputChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full px-2 py-1.5 sm:text-sm border-gray-300 rounded-md"
                        placeholder="MM"
                        maxLength="2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full px-2 py-1.5 sm:text-sm border-gray-300 rounded-md"
                        placeholder="YYYY"
                        maxLength="4"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center">
                        <input
                          id="enable_epf_etf"
                          name="enable_epf_etf"
                          type="checkbox"
                          checked={formData.enable_epf_etf}
                          onChange={handleInputChange}
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="enable_epf_etf" className="ml-1.5 block text-xs text-gray-700">
                          Enable EPF/ETF
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="stamp"
                          name="stamp"
                          type="checkbox"
                          checked={formData.stamp}
                          onChange={handleInputChange}
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="stamp" className="ml-1.5 block text-xs text-gray-700">
                          Apply Stamp Duty (Rs. 25)
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      BR Status
                    </label>
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <input
                          id="br1"
                          name="br1"
                          type="checkbox"
                          checked={formData.br1}
                          onChange={handleInputChange}
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="br1" className="ml-1.5 block text-xs text-gray-700">
                          BR1
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="br2"
                          name="br2"
                          type="checkbox"
                          checked={formData.br2}
                          onChange={handleInputChange}
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="br2" className="ml-1.5 block text-xs text-gray-700">
                          BR2
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Third column - Overtime and loan */}
                <div className="space-y-3">
                  <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Overtime
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center mb-1">
                          <input
                            id="ot_morning"
                            name="ot_morning_enabled"
                            type="checkbox"
                            checked={formData.ot_morning_enabled}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                ot_morning_enabled: e.target.checked,
                                ot_morning: e.target.checked ? formData.ot_morning : 0,
                              });
                            }}
                            className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="ot_morning" className="ml-1.5 block text-xs text-gray-700">
                            Morning
                          </label>
                        </div>
                        <input
                          type="number"
                          name="ot_morning"
                          value={formData.ot_morning}
                          onChange={handleInputChange}
                          disabled={!formData.ot_morning_enabled}
                          className={`w-full px-2 py-1 text-xs border rounded ${
                            !formData.ot_morning_enabled ? "bg-gray-100" : ""
                          }`}
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <input
                            id="ot_evening"
                            name="ot_evening_enabled"
                            type="checkbox"
                            checked={formData.ot_evening_enabled}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                ot_evening_enabled: e.target.checked,
                                ot_evening: e.target.checked ? formData.ot_evening : 0,
                              });
                            }}
                            className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="ot_evening" className="ml-1.5 block text-xs text-gray-700">
                            Evening
                          </label>
                        </div>
                        <input
                          type="number"
                          name="ot_evening"
                          value={formData.ot_evening}
                          onChange={handleInputChange}
                          disabled={!formData.ot_evening_enabled}
                          className={`w-full px-2 py-1 text-xs border rounded ${
                            !formData.ot_evening_enabled ? "bg-gray-100" : ""
                          }`}
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Loan Details
                    </label>
                    <div className="space-y-2">
                      <div>
                        <input
                          type="number"
                          name="total_loan_amount"
                          value={formData.total_loan_amount}
                          onChange={handleInputChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full px-2 py-1 text-xs border-gray-300 rounded"
                          placeholder="Loan Amount"
                          step="0.01"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          name="installment_count"
                          value={formData.installment_count}
                          onChange={handleInputChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full px-2 py-1 text-xs border-gray-300 rounded"
                          placeholder="Installments"
                          min="0"
                        />
                        <input
                          type="number"
                          name="installment_amount"
                          value={formData.installment_amount}
                          onChange={handleInputChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full px-2 py-1 text-xs border-gray-300 rounded"
                          placeholder="Per Month"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Increment panel */}
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    id="increment_active"
                    name="increment_active"
                    type="checkbox"
                    checked={formData.increment_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="increment_active"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Active Increment
                  </label>
                </div>
                {formData.increment_active && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pl-6">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Increment Value</label>
                      <input
                        type="text"
                        name="increment_value"
                        value={formData.increment_value}
                        onChange={handleInputChange}
                        className="block w-full px-2 py-1.5 text-sm border-gray-300 rounded"
                        placeholder="Amount or %"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Effective Date</label>
                      <input
                        type="date"
                        name="increment_effected_date"
                        value={formData.increment_effected_date}
                        onChange={handleInputChange}
                        className="block w-full px-2 py-1.5 text-sm border-gray-300 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Calculation Preview - Compact */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <RefreshCw size={14} className="mr-1" /> Calculation Preview
                </h3>

                {/* Show stored/current net salary from record for clarity */}
                {currentRecord?.salary_breakdown?.net_salary != null && (
                  <div className="text-xs text-gray-600 mb-2">
                    Current Net Salary:{" "}
                    <span className="font-medium text-gray-800">
                      {parseFloat(currentRecord.salary_breakdown.net_salary).toLocaleString("en-LK", {
                        style: "currency",
                        currency: "LKR",
                      })}
                    </span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Basic Salary:</span>
                    <span className="font-medium">
                      {parseFloat(formData.basic_salary || 0).toLocaleString("en-LK", {
                        style: "currency",
                        currency: "LKR",
                      })}
                    </span>
                  </div>

                  {/* Estimated net salary based on edits */}
                  <div className="col-span-2 mt-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-700">Estimated Net Salary (preview):</span>
                      <span className="text-blue-700">
                        {calculateNetSalary().toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">BR Allowance:</span>
                    <span className="font-medium">
                      {calculateBRAllowance().toLocaleString("en-LK", {
                        style: "currency",
                        currency: "LKR",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">No-Pay Deduction:</span>
                    <span className="font-medium">
                      {calculateNoPayDeduction().toLocaleString("en-LK", {
                        style: "currency",
                        currency: "LKR",
                      })}
                    </span>
                  </div>

                  {formData.enable_epf_etf && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">EPF (8%):</span>
                      <span className="font-medium">
                        {calculateEPF().toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-500">Loan Installment:</span>
                    <span className="font-medium">
                      {parseFloat(formData.installment_amount || 0).toLocaleString("en-LK", {
                        style: "currency",
                        currency: "LKR",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Stamp Duty:</span>
                    <span className="font-medium">
                      {formData.stamp ? "LKR 25.00" : "LKR 0.00"}
                    </span>
                  </div>

                  <div className="col-span-2 border-t border-gray-200 mt-1 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-700">Estimated Net Salary:</span>
                      <span className="text-blue-700">
                        {calculateNetSalary().toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Save size={16} className="mr-1" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <p className="mb-6">
            Are you sure you want to delete the salary record for{" "}
            <span className="font-semibold">{currentRecord?.full_name}</span>?
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteSalaryRecord(currentRecord.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
            >
              <Trash2 size={18} className="mr-2" />
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SalaryPage;
