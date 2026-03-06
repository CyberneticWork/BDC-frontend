import { useState, useEffect } from "react";
import BonusService from "../../components/BonusService";
import {
  Download,
  Users,
  Wallet,
  FileText,
  ChevronDown,
  Filter,
  CheckCircle,
  AlertCircle,
  Search,
  Building2,
  Layers,
} from "lucide-react";
import jsPDF from "jspdf";
import { fetchCompanies, fetchDepartmentsById } from "@services/ApiDataService";
import {
  getSalaryData,
  UpdateAllowances,
  saveSalaryData,
  updateSlaryStatus,
  getProcessedSalaries,
  importExcelData,
} from "@services/SalaryProcessService";
import { fetchSalaryCSV } from "@services/SalaryService";
import AllowancesService from "@services/AllowancesService";
import * as DeductionService from "@services/DeductionService";
import ImportExcelModal from "@dashboard/ImportExcelModal";
import Swal from "sweetalert2";

const STORAGE_KEY = "processedSalaryData";

const notify = {
  success: (title, text) =>
    Swal.fire({ icon: "success", title, text, confirmButtonColor: "#3085d6" }),
  error: (title, text) =>
    Swal.fire({ icon: "error", title, text, confirmButtonColor: "#d33" }),
  warning: (title, text) =>
    Swal.fire({ icon: "warning", title, text, confirmButtonColor: "#f59e0b" }),
  info: (title, text) =>
    Swal.fire({ icon: "info", title, text, confirmButtonColor: "#3085d6" }),
};

const SalaryProcessPage = () => {
  // State for filters (UI only - no client filtering)
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState("Unprocessed");

  const [isLoading, setIsLoading] = useState(false);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");

  // Companies and departments
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  // Allowances and deductions
  const [availableAllowances, setAvailableAllowances] = useState([]);
  const [availableDeductions, setAvailableDeductions] = useState([]);

  // Selected employees (checkbox)
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Bulk actions
  const [bulkActionType, setBulkActionType] = useState("allowance");
  const [bulkActionAmount, setBulkActionAmount] = useState("");
  const [bulkActionId, setBulkActionId] = useState("");

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  //bonus
  const [availableBonuses, setAvailableBonuses] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [isLoadingBonuses, setIsLoadingBonuses] = useState(false);


  // Status information
  const statusInfo = {
    processUser: "Admin",
    lastProcessDate: "2025-05-30",
  };

  // Salary data
  const [employeeData, setEmployeeData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);

  const totalSalary = (displayedData || []).reduce(
    (sum, emp) => sum + (parseFloat(emp?.basic_salary) || 0),
    0
  );
  const employeeCount = displayedData.length;

  // Months
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const loadAllowancesAndDeductions = async () => {
    try {
      const allowances = await AllowancesService.getAllAllowances();
      setAvailableAllowances(allowances || []);

      const deductions =
        await DeductionService.fetchDeductionsByCompanyOrDepartment();
      setAvailableDeductions(deductions || []);
    } catch (error) {
      console.error("Error loading allowances and deductions:", error);
    }
  };

  const loadAllowancesByCompany = async (companyId) => {
    try {
      const allowances =
        await AllowancesService.getAllowancesByCompanyOrDepartment(
          companyId,
          null
        );
      setAvailableAllowances(allowances || []);
    } catch (error) {
      console.error("Error loading allowances by company:", error);
    }
  };

  // Import Excel
  const handleImportExcel = async (file) => {
    try {
      const response = await importExcelData(file);
      notify.success("Imported", response.message || "Employee allowances imported successfully");
      return true;
    } catch (error) {
      console.error("Error importing Excel:", error);
      const msg = error.response?.data?.message || "Failed to import file";
      notify.error("Import Failed", msg);
      throw msg;
    }
  };

  const loadBonuses = async () => {
    setIsLoadingBonuses(true);
    try {
      const res = await BonusService.getAllBonuses();

      // res might be axios response or {data: ...}
      const list =
        Array.isArray(res) ? res :
          Array.isArray(res?.data) ? res.data :
            Array.isArray(res?.data?.data) ? res.data.data :
              [];

      setAvailableBonuses(list);
    } catch (error) {
      console.error("Error loading bonuses:", error);
      setAvailableBonuses([]); // keep safe
    } finally {
      setIsLoadingBonuses(false);
    }
  };

  //loard bonus================
  const loadBonusesByCompanyOrDepartment = async (companyId, departmentId) => {
    setIsLoadingBonuses(true);
    try {
      const res = await BonusService.getBonusesByCompanyOrDepartment(companyId, departmentId);

      const list =
        Array.isArray(res) ? res :
          Array.isArray(res?.data) ? res.data :
            Array.isArray(res?.data?.data) ? res.data.data :
              [];

      setAvailableBonuses(list);
    } catch (error) {
      console.error("Error loading bonuses by company/department:", error);
      setAvailableBonuses([]);
    } finally {
      setIsLoadingBonuses(false);
    }
  };

  const handleImportSuccess = (message) => {
    notify.success("Import Successful", message || "Data imported");
    fetchSalaryData();
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

  // Salary process
  const handleSalaryProcess = async () => {
    setStatus("Processed");
    statusInfo.lastProcessDate = new Date().toISOString().split("T")[0];

    try {
      await updateSlaryStatus("processed");
      notify.success("Status Updated", "Salary status updated!");
    } catch (error) {
      notify.error(
        "Update Failed",
        error.response?.data?.message || error.message || "Unknown error"
      );
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(employeeData));
  };

  const handleDownloadAllProcessed = async () => {
    try {
      setIsLoading(true);

      const processedData = await getProcessedSalaries();

      if (!processedData || processedData.length === 0) {
        notify.info(
          "No Data",
          "No processed salary data found for the selected period."
        );
        return;
      }

      const doc = new jsPDF();

      const monthObj = months.find((m) => m.value === month);
      const monthName = monthObj ? monthObj.label : "Unknown";

      doc.setFontSize(16);
      doc.text(`Processed Salary Report - ${monthName} ${year}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Total Employees: ${processedData.length}`, 14, 30);

      let yPos = 40;
      processedData.forEach((emp, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(
          `${idx + 1}. ${emp.employee_name || "N/A"} - Rs. ${parseFloat(emp.basic_salary || 0).toFixed(2)}`,
          14,
          yPos
        );
        yPos += 10;
      });

      doc.save(`Processed_Salaries_${monthName}_${year}.pdf`);
      notify.success("Downloaded", "Processed salary report downloaded!");
    } catch (error) {
      console.error("Download failed:", error);
      notify.error("Download Failed", "Failed to download processed salaries");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalaryData = async () => {
    if (!month || !year) {
      notify.warning("Missing Fields", "Please select month and year");
      return;
    }

    setIsLoading(true);
    try {
      const data = await getSalaryData(
        month,
        year,
        selectedCompany,
        selectedDepartment
      );
      setEmployeeData(data || []);
      setDisplayedData(data || []);
    } catch (error) {
      console.error("Error fetching salary data:", error);
      notify.error("Fetch Failed", "Failed to fetch salary data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setDisplayedData(employeeData);
      return;
    }

    const filtered = employeeData.filter((emp) => {
      const searchLower = term.toLowerCase();
      return (
        emp.employee_name?.toLowerCase().includes(searchLower) ||
        emp.employee_id?.toString().toLowerCase().includes(searchLower)
      );
    });
    setDisplayedData(filtered);
  };

  const handleSaveSalary = async () => {
    if (!month || !year) {
      notify.warning("Missing Fields", "Please select month and year");
      return;
    }

    try {
      await saveSalaryData(employeeData, month, year);
      notify.success("Saved", "Salary data saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      notify.error("Save Failed", "Failed to save salary data");
    }
  };

  const handleAllowanceChange = (empId, allowanceId, value) => {
    setEmployeeData((prev) =>
      prev.map((emp) => {
        if (emp.employee_id === empId) {
          const updatedAllowances = emp.allowances.map((a) =>
            a.allowance_id === allowanceId ? { ...a, amount: value } : a
          );
          return { ...emp, allowances: updatedAllowances };
        }
        return emp;
      })
    );
  };

  const handleDeductionChange = (empId, deductionId, value) => {
    setEmployeeData((prev) =>
      prev.map((emp) => {
        if (emp.employee_id === empId) {
          const updatedDeductions = emp.deductions.map((d) =>
            d.deduction_id === deductionId ? { ...d, amount: value } : d
          );
          return { ...emp, deductions: updatedDeductions };
        }
        return emp;
      })
    );
  };

  const handleBonusChange = (empId, bonusId, value) => {
    setEmployeeData((prev) =>
      prev.map((emp) => {
        if (emp.employee_id === empId) {
          const updatedBonuses = emp.bonuses?.map((b) =>
            b.bonus_id === bonusId ? { ...b, amount: value } : b
          ) || [];
          return { ...emp, bonuses: updatedBonuses };
        }
        return emp;
      })
    );
  };

  const handleSelectEmployee = (empId) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(displayedData.map((emp) => emp.employee_id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkAction = () => {
    if (selectedEmployees.length === 0) {
      notify.warning("No Selection", "Please select employees first");
      return;
    }

    if (!bulkActionId || !bulkActionAmount) {
      notify.warning("Missing Fields", "Please select item and enter amount");
      return;
    }

    setEmployeeData((prev) =>
      prev.map((emp) => {
        if (selectedEmployees.includes(emp.employee_id)) {
          if (bulkActionType === "allowance") {
            const updatedAllowances = emp.allowances.map((a) =>
              a.allowance_id === parseInt(bulkActionId)
                ? { ...a, amount: bulkActionAmount }
                : a
            );
            return { ...emp, allowances: updatedAllowances };
          } else if (bulkActionType === "deduction") {
            const updatedDeductions = emp.deductions.map((d) =>
              d.deduction_id === parseInt(bulkActionId)
                ? { ...d, amount: bulkActionAmount }
                : d
            );
            return { ...emp, deductions: updatedDeductions };
          } else if (bulkActionType === "bonus") {
            const updatedBonuses = emp.bonuses?.map((b) =>
              b.bonus_id === parseInt(bulkActionId)
                ? { ...b, amount: bulkActionAmount }
                : b
            ) || [];
            return { ...emp, bonuses: updatedBonuses };
          }
        }
        return emp;
      })
    );

    notify.success("Applied", "Bulk action applied successfully!");
  };

  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const data = await fetchCompanies();
        setCompanies(data || []);
      } catch (error) {
        console.error("Error loading companies:", error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    loadCompanies();
    loadAllowancesAndDeductions();
    loadBonuses();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const loadDepartments = async () => {
        setIsLoadingDepartments(true);
        try {
          const data = await fetchDepartmentsById(selectedCompany);
          setDepartments(data || []);
        } catch (error) {
          console.error("Error loading departments:", error);
        } finally {
          setIsLoadingDepartments(false);
        }
      };
      loadDepartments();
      loadAllowancesByCompany(selectedCompany);
      loadBonusesByCompanyOrDepartment(selectedCompany, null);
    } else {
      setDepartments([]);
      setSelectedDepartment("");
      loadAllowancesAndDeductions();
      loadBonuses();
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedDepartment) {
      loadBonusesByCompanyOrDepartment(selectedCompany, selectedDepartment);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [employeeData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Salary Processing
              </h1>
              <p className="text-gray-600 mt-1">Manage employee salaries</p>
            </div>
            <Wallet className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Company
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                disabled={isLoadingCompanies}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.company_id} value={c.company_id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Layers className="w-4 h-4 inline mr-1" />
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={!selectedCompany || isLoadingDepartments}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={fetchSalaryData}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Load Data"}
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Import Excel
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Download className="w-4 h-4 inline mr-2" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {employeeData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by employee name or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Employees</p>
                <p className="text-3xl font-bold mt-1">{employeeCount}</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Salary</p>
                <p className="text-3xl font-bold mt-1">
                  Rs. {totalSalary.toFixed(2)}
                </p>
              </div>
              <Wallet className="w-12 h-12 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Status</p>
                <p className="text-2xl font-bold mt-1">{status}</p>
              </div>
              {status === "Processed" ? (
                <CheckCircle className="w-12 h-12 text-purple-200" />
              ) : (
                <AlertCircle className="w-12 h-12 text-purple-200" />
              )}
            </div>
          </div>
        </div>

        {/* Results Info */}
        {employeeData.length > 0 && searchTerm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              Showing {displayedData.length} of {employeeData.length} employees
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedEmployees.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">
              Bulk Action ({selectedEmployees.length} selected)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={bulkActionType}
                onChange={(e) => setBulkActionType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="allowance">Allowance</option>
                <option value="deduction">Deduction</option>
                <option value="bonus">Bonus</option>
              </select>
              <select
                value={bulkActionId}
                onChange={(e) => setBulkActionId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Item</option>
                {bulkActionType === "allowance" &&
                  availableAllowances.map((a) => (
                    <option key={a.allowance_id} value={a.allowance_id}>
                      {a.allowance_name}
                    </option>
                  ))}
                {bulkActionType === "deduction" &&
                  availableDeductions.map((d) => (
                    <option key={d.deduction_id} value={d.deduction_id}>
                      {d.deduction_name}
                    </option>
                  ))}
                {bulkActionType === "bonus" &&
                  availableBonuses.map((b) => (
                    <option key={b.bonus_id} value={b.bonus_id}>
                      {b.bonus_name}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                value={bulkActionAmount}
                onChange={(e) => setBulkActionAmount(e.target.value)}
                placeholder="Amount"
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={handleBulkAction}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Employee Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Basic Salary</th>
                  <th className="px-4 py-3 text-left">Allowances</th>
                  <th className="px-4 py-3 text-left">Deductions</th>
                  <th className="px-4 py-3 text-left">Bonuses</th>
                  <th className="px-4 py-3 text-left">Net Salary</th>
                </tr>
              </thead>
              <tbody>
                {displayedData.map((emp) => {
                  const totalAllowances = (emp.allowances || []).reduce(
                    (sum, a) => sum + parseFloat(a.amount || 0),
                    0
                  );
                  const totalDeductions = (emp.deductions || []).reduce(
                    (sum, d) => sum + parseFloat(d.amount || 0),
                    0
                  );
                  const totalBonuses = (emp.bonuses || []).reduce(
                    (sum, b) => sum + parseFloat(b.amount || 0),
                    0
                  );
                  const netSalary =
                    parseFloat(emp.basic_salary || 0) +
                    totalAllowances +
                    totalBonuses -
                    totalDeductions;

                  return (
                    <tr
                      key={emp.employee_id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(emp.employee_id)}
                          onChange={() => handleSelectEmployee(emp.employee_id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{emp.employee_name}</p>
                          <p className="text-sm text-gray-500">
                            {emp.employee_id}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        Rs. {parseFloat(emp.basic_salary || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {(emp.allowances || []).map((a) => (
                            <div key={a.allowance_id} className="flex gap-2">
                              <span className="text-sm">
                                {a.allowance_name}:
                              </span>
                              <input
                                type="number"
                                value={a.amount || 0}
                                onChange={(e) =>
                                  handleAllowanceChange(
                                    emp.employee_id,
                                    a.allowance_id,
                                    e.target.value
                                  )
                                }
                                className="w-20 px-2 py-1 border rounded text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {(emp.deductions || []).map((d) => (
                            <div key={d.deduction_id} className="flex gap-2">
                              <span className="text-sm">
                                {d.deduction_name}:
                              </span>
                              <input
                                type="number"
                                value={d.amount || 0}
                                onChange={(e) =>
                                  handleDeductionChange(
                                    emp.employee_id,
                                    d.deduction_id,
                                    e.target.value
                                  )
                                }
                                className="w-20 px-2 py-1 border rounded text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {(emp.bonuses || []).map((b) => (
                            <div key={b.bonus_id} className="flex gap-2">
                              <span className="text-sm">{b.bonus_name}:</span>
                              <input
                                type="number"
                                value={b.amount || 0}
                                onChange={(e) =>
                                  handleBonusChange(
                                    emp.employee_id,
                                    b.bonus_id,
                                    e.target.value
                                  )
                                }
                                className="w-20 px-2 py-1 border rounded text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        Rs. {netSalary.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSaveSalary}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Save Salary Data
          </button>
          <button
            onClick={handleSalaryProcess}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Process Salary
          </button>
          <button
            onClick={handleDownloadAllProcessed}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Download Processed
          </button>
        </div>
      </div>

      {/* Import Modal */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportExcel}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default SalaryProcessPage;
