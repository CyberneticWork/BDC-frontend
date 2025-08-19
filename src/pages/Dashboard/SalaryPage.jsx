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
    ot_morning: false,
    ot_evening: false,
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
    setCurrentRecord(record);
    setFormData({
      basic_salary: record.basic_salary,
      increment_active: record.increment_active,
      increment_value: record.increment_value || "",
      increment_effected_date:
        record.increment_effected_date?.split("T")[0] || "",
      ot_morning: record.ot_morning,
      ot_evening: record.ot_evening,
      enable_epf_etf: record.enable_epf_etf,
      br1: record.br1,
      br2: record.br2,
      total_loan_amount: record.total_loan_amount,
      installment_count: record.installment_count || "",
      installment_amount: record.installment_amount || "",
      approved_no_pay_days: record.approved_no_pay_days,
      status: record.status,
      month: record.month,
      year: record.year,
    });
    setIsModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    updateSalaryRecord(currentRecord.id, formData);
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
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
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
          <div className="flex items-end gap-2">
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

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {currentRecord && (
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold mb-4">Edit Salary Record</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">
                {currentRecord.full_name}
              </h3>
              <p className="text-gray-600">
                {currentRecord.company_name} - {currentRecord.department_name}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Basic Salary */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Basic Salary
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="basic_salary"
                      value={formData.basic_salary}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="pending">Pending</option>
                    <option value="processed">Processed</option>
                  </select>
                </div>

                {/* Increment */}
                <div className="space-y-2">
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
                    <>
                      <input
                        type="text"
                        name="increment_value"
                        value={formData.increment_value}
                        onChange={handleInputChange}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Increment value (e.g. 10%)"
                      />
                      <input
                        type="date"
                        name="increment_effected_date"
                        value={formData.increment_effected_date}
                        onChange={handleInputChange}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </>
                  )}
                </div>

                {/* Overtime */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Overtime
                  </label>
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <input
                        id="ot_morning"
                        name="ot_morning"
                        type="checkbox"
                        checked={formData.ot_morning}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="ot_morning"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Morning
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="ot_evening"
                        name="ot_evening"
                        type="checkbox"
                        checked={formData.ot_evening}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="ot_evening"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Evening
                      </label>
                    </div>
                  </div>
                </div>

                {/* EPF/ETF */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="enable_epf_etf"
                      name="enable_epf_etf"
                      type="checkbox"
                      checked={formData.enable_epf_etf}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="enable_epf_etf"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Enable EPF/ETF
                    </label>
                  </div>
                </div>

                {/* BR Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    BR Status
                  </label>
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <input
                        id="br1"
                        name="br1"
                        type="checkbox"
                        checked={formData.br1}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="br1"
                        className="ml-2 block text-sm text-gray-700"
                      >
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="br2"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        BR2
                      </label>
                    </div>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Loan Amount
                  </label>
                  <input
                    type="number"
                    name="total_loan_amount"
                    value={formData.total_loan_amount}
                    onChange={handleInputChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Installment Count
                  </label>
                  <input
                    type="number"
                    name="installment_count"
                    value={formData.installment_count}
                    onChange={handleInputChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Installment Amount
                  </label>
                  <input
                    type="number"
                    name="installment_amount"
                    value={formData.installment_amount}
                    onChange={handleInputChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* No Pay Days */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Approved No Pay Days
                  </label>
                  <input
                    type="number"
                    name="approved_no_pay_days"
                    value={formData.approved_no_pay_days}
                    onChange={handleInputChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0"
                  />
                </div>

                {/* Month/Year */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Month
                  </label>
                  <input
                    type="text"
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="MM"
                    maxLength="2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="YYYY"
                    maxLength="4"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Save size={18} className="mr-2" />
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
