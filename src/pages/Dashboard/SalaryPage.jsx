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
  Plus,
  Minus,
  Download,
} from "lucide-react";
import { downloadPayslip, downloadPayslips } from "../../utils/payslipPdf";
import {
  updateSalaryAPI,
  deleteSalaryRecordAPI,
} from "@services/SalaryService";
import { getSalaryData, getProcessedSalaries } from "@services/SalaryProcessService";
import { fetchCompanies as fetchCompaniesAPI, fetchDepartmentsById } from "@services/ApiDataService";

// Modal Component
// Fixed Modal Component
const Modal = ({ isOpen, onClose, children }) => {
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
    if (!isOpen) return;
    
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden"; // Prevent background scroll

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
  className="relative w-full max-w-4xl h-[90vh] flex flex-col transform transition-all duration-300 ease-out"
>
  <div className="relative bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 flex flex-col h-full overflow-hidden">
    
    {/* Close button */}
    <button
      onClick={onClose}
      className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
    >
      <X size={18} />
    </button>

    {/* Scrollable Content Area */}
    <div className="flex-1 overflow-y-auto p-6">
      {children}
    </div>

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

const SalaryPage = ({ employeeProfile }) => {
  const [salaryData, setSalaryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const months = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [updatedRowIds] = useState(new Set());
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
  const [allowances, setAllowances] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [allowanceErrors, setAllowanceErrors] = useState([]); // { name: '', amount: '' }
  const [deductionErrors, setDeductionErrors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state: show 9 rows per page
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 9;

  // Fetch salary data
  const fetchSalaryData = async (isAutoRefresh = false) => {
    if (!employeeProfile && (!selectedCompany || !month || !year)) return;
    if (employeeProfile && (!month || !year)) return;
    if (!isAutoRefresh) setIsLoading(true);
    else setIsAutoRefreshing(true);
    try {
      let rows = [];
      if (employeeProfile) {
        // Employee view — all records, no month filter
        const data = await getProcessedSalaries({ employee_no: employeeProfile.attendance_employee_no });
        const raw = Array.isArray(data) ? data : (data?.data || []);
        rows = raw.map(emp => ({
          ...emp,
          employee_no: emp.employee_no || emp.emp_no,
          status: ['pending','processed','issued','hold'].includes(String(emp.status).toLowerCase()) ? String(emp.status).toLowerCase() : 'pending',
          salary_breakdown: typeof emp.salary_breakdown === 'string' ? JSON.parse(emp.salary_breakdown) : (emp.salary_breakdown || {}),
        }));
      } else {
        // Admin view — use /salaryCal/employees endpoint
        const data = await getSalaryData({ month, year, company_id: selectedCompany, department_id: selectedDepartment || undefined, search: searchTerm.trim() || undefined });
        rows = (data?.data || []).map(emp => ({
          ...emp,
          employee_no: emp.emp_no || emp.employee_no,
          status: ['pending','processed','issued','hold'].includes(String(emp.status).toLowerCase()) ? String(emp.status).toLowerCase() : 'pending',
          salary_breakdown: typeof emp.salary_breakdown === 'string' ? JSON.parse(emp.salary_breakdown) : (emp.salary_breakdown || {}),
        }));
      }
      setSalaryData(rows);
      setFilteredData(rows);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching salary data:", error);
    } finally {
      if (!isAutoRefresh) setIsLoading(false);
      else setIsAutoRefreshing(false);
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

  // Helper to detect issued records
  const isIssued = (record) => record?.status === "issued";

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };



  /*
  // Handle edit button click
  const handleEdit = (record) => {
    // Prevent opening edit modal for issued records (UI-only; backend still enforces)
    if (isIssued(record)) {
      alert("This salary record cannot be edited because it is already issued.");
      return;
    }
    // Normalize various backend formats (0/1, "0"/"1", boolean)
    const bool = (v) => Boolean(v || v === 1 || v === "1");
    const sb = record.salary_breakdown || {};

    // For stamp specifically, check both the boolean field and the breakdown value
    const stampChecked = bool(record.stamp) || (sb.stamp > 0);

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
      // Use the combined check for stamp
      stamp: stampChecked,
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

    // Parse allowances and deductions from JSON strings/arrays
    let parsedAllowances = [];
    let parsedDeductions = [];

    try {
      parsedAllowances = Array.isArray(record.allowances)
        ? record.allowances
        : (record.allowances ? JSON.parse(record.allowances) : []);
    } catch (e) {
      console.error("Error parsing allowances:", e);
    }

    try {
      parsedDeductions = Array.isArray(record.deductions)
        ? record.deductions
        : (record.deductions ? JSON.parse(record.deductions) : []);
    } catch (e) {
      console.error("Error parsing deductions:", e);
    }

    setAllowances(parsedAllowances);
    setDeductions(parsedDeductions);

    setIsModalOpen(true);
  };


  */


// Handle edit button click
// Handle edit button click
  const handleEdit = (record) => {
    // Prevent opening edit modal for issued records
    if (isIssued(record)) {
      alert("This salary record cannot be edited because it is already issued.");
      return;
    }
    
    // Normalize various backend formats
    const bool = (v) => Boolean(v || v === 1 || v === "1");
    const sb = record.salary_breakdown || {};
    const stampChecked = bool(record.stamp) || (sb.stamp > 0);

    
    const monthlyInstallment = parseFloat(record.installment_amount) || 0;
    
    // 
    const hasActiveLoan = monthlyInstallment > 0;
    // ==========================================

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
      stamp: stampChecked,
      
      // ==========================================
      // Loan Details
      // hasActiveLoan 
      total_loan_amount: hasActiveLoan ? (record.total_loan_amount || "") : "",
      installment_count: hasActiveLoan ? (record.installment_count || "") : "",
      installment_amount: hasActiveLoan ? monthlyInstallment : "",
      // ==========================================
      
      approved_no_pay_days: record.approved_no_pay_days ?? 0,

      //status: record.status ?? "pending",

     // "unprocessed" 
      status: record.status 
        ? (String(record.status).toLowerCase() === 'unprocessed' ? 'pending' : String(record.status).toLowerCase()) 
        : "pending",
      
      // 
      month: record.month ? String(record.month).padStart(2, '0') : String(month).padStart(2, '0'),
      year: record.year ? String(record.year) : String(year),
      
      // visible preview value
      net_salary: sb.net_salary ?? 0,
    });

    // Parse allowances and deductions from JSON strings/arrays
    let parsedAllowances = [];
    let parsedDeductions = [];

    try {
      parsedAllowances = Array.isArray(record.allowances)
        ? record.allowances
        : (record.allowances ? JSON.parse(record.allowances) : []);
    } catch (e) {
      console.error("Error parsing allowances:", e);
    }

    try {
      parsedDeductions = Array.isArray(record.deductions)
        ? record.deductions
        : (record.deductions ? JSON.parse(record.deductions) : []);
    } catch (e) {
      console.error("Error parsing deductions:", e);
    }

    setAllowances(parsedAllowances);
    setDeductions(parsedDeductions);

    setIsModalOpen(true);
  };



  /*
  // Update the handleSubmit function to ensure stamp is handled consistently
  const handleSubmit = async (e) => {
    e.preventDefault();

    // run client-side validation for allowances/deductions
    if (!validateAllowancesDeductions()) {
      alert("Please fill description and amount for all allowances and deductions.");
      return;
    }

    try {
      // Show loading indicator
      setIsLoading(true);

      // Build salary_breakdown object (editable subset + recalculated fields)
      // preserve allowances/deductions from currentRecord if present
      const totalAllowances = calculateTotalAllowances();
      const totalFixedDeductions = calculateTotalDeductions();

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
        br_allowance: calculateBRAllowance(),
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
        stamp: stampVal, // Ensure numeric value (25 or 0)
        net_salary: Math.round((netSalaryPreview + Number.EPSILON) * 100) / 100,
      };


       
      const getMonthNumber = (monthStr) => {
        if (!isNaN(monthStr)) return String(monthStr).padStart(2, '0');
        const monthObj = months.find(m => m.label === monthStr || m.value === monthStr);
        return monthObj ? monthObj.value : "01";
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
        status: ['pending', 'processed', 'issued', 'hold'].includes(String(formData.status).toLowerCase().trim()) 
            ? String(formData.status).toLowerCase().trim() 
            : 'pending',
        
        // ==========================================
       
        month: getMonthNumber(formData.month),
        // ==========================================
        
        year: String(formData.year),
        salary_breakdown: updatedSalaryBreakdown,
        allowances: allowances,
        deductions: deductions,
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
*/

// Update the handleSubmit function to ensure stamp is handled consistently
  // Update the handleSubmit function to ensure stamp is handled consistently
  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAllowancesDeductions()) {
      alert("Please fill description and amount for all allowances and deductions.");
      return;
    }

    try {
      setIsLoading(true);

      const totalAllowances = calculateTotalAllowances();
      const totalFixedDeductions = calculateTotalDeductions();

      const basicSalaryNum = parseFloat(formData.basic_salary || 0);
      const workingDays = (() => {
        const y = parseInt(formData.year || currentRecord?.year || new Date().getFullYear());
        const m = parseInt(formData.month || currentRecord?.month || (new Date().getMonth() + 1));
        if (!isNaN(y) && !isNaN(m)) {
          const totalDaysInMonth = new Date(y, m, 0).getDate();
          return Math.max(1, totalDaysInMonth - 8); 
        }
        return 22;
      })();

      const perDaySalary = basicSalaryNum / workingDays;
      const noPayDeduction = (parseInt(formData.approved_no_pay_days || 0) || 0) * perDaySalary;
      const adjustedBasic = basicSalaryNum - noPayDeduction;

      const epfBase = Math.max(0, adjustedBasic);
      const epfEmployee = formData.enable_epf_etf ? epfBase * 0.08 : 0;
      const epfEmployer = formData.enable_epf_etf ? epfBase * 0.12 : 0;
      const etfEmployer = formData.enable_epf_etf ? epfBase * 0.03 : 0;

      const morningOtVal = formData.ot_morning_enabled ? parseFloat(formData.ot_morning || 0) : 0;
      const eveningOtVal = formData.ot_evening_enabled ? parseFloat(formData.ot_evening || 0) : 0;

      const grossSalary = adjustedBasic + totalAllowances + morningOtVal + eveningOtVal;
      
      // ==========================================

      // ==========================================
      const existingBreakdown = currentRecord?.salary_breakdown || {};
      
      
      const loanDeductFrom = existingBreakdown.loan_deduct_from || currentRecord?.loan_deduct_from || 'bonus';
      const newInstallment = parseFloat(formData.installment_amount || 0) || 0;
      // ==========================================

      const totalDeductions = totalFixedDeductions + newInstallment + epfEmployee;
      const stampVal = formData.stamp ? 25 : 0;
      const netSalaryPreview = grossSalary - totalDeductions - stampVal;

      const updatedSalaryBreakdown = {
        ...existingBreakdown, 
        basic_salary: basicSalaryNum,
        br_allowance: calculateBRAllowance(),
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
        
        // Loan එකට අදාළ අගයන්
        loan_installment: newInstallment,
        loan_principal: newInstallment, // Interest නැති නිසා සම්පූර්ණ ගාණම Principal එක
        loan_deduct_from: loanDeductFrom, // Basic ද Bonus ද කියන එක
        
        gross_salary: grossSalary,
        total_deductions: totalDeductions,
        stamp: stampVal, 
        net_salary: Math.round((netSalaryPreview + Number.EPSILON) * 100) / 100,
      };

      const getMonthNumber = (monthStr) => {
        if (!isNaN(monthStr)) return String(monthStr).padStart(2, '0');
        const monthObj = months.find(m => m.label === monthStr || m.value === monthStr);
        return monthObj ? monthObj.value : "01";
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
        status: ['pending', 'processed', 'issued', 'hold'].includes(String(formData.status).toLowerCase().trim()) 
            ? String(formData.status).toLowerCase().trim() 
            : 'pending',
        month: getMonthNumber(formData.month),
        year: String(formData.year),
        salary_breakdown: updatedSalaryBreakdown,
        allowances: allowances,
        deductions: deductions,
      };

      const updatedResponse = await updateSalaryAPI(currentRecord.id, formattedData);
      const newRecordData = updatedResponse?.data || formattedData;

      const updatedLocalRecord = {
        ...currentRecord,
        ...newRecordData,
        salary_breakdown: updatedSalaryBreakdown,
        allowances: allowances,
        deductions: deductions
      };

      setSalaryData(prevData => prevData.map(item => item.id === currentRecord.id ? updatedLocalRecord : item));
      setFilteredData(prevData => prevData.map(item => item.id === currentRecord.id ? updatedLocalRecord : item));

      fetchSalaryData(true);

      alert("Salary record updated successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating salary record:", error);
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response?.data?.errors || {}).flat().join('\n');
        alert(`Validation errors:\n${errorMessages}`);
      } else {
        alert("Failed to update record: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };








  // Client-side search filter
  useEffect(() => {
    if (!salaryData || !Array.isArray(salaryData)) { setFilteredData([]); return; }
    if (!searchTerm.trim()) { setFilteredData(salaryData); return; }
    const term = searchTerm.toLowerCase();
    setFilteredData(salaryData.filter(item =>
      (item.employee_no && String(item.employee_no).toLowerCase().includes(term)) ||
      (item.emp_no && String(item.emp_no).toLowerCase().includes(term)) ||
      (item.full_name && item.full_name.toLowerCase().includes(term))
    ));
  }, [searchTerm, salaryData]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, salaryData]);

  // Load companies on mount
  useEffect(() => {
    fetchCompaniesAPI().then(data => setCompanies(Array.isArray(data) ? data : [])).catch(console.error);
  }, []);

  // Load departments when company changes
  useEffect(() => {
    if (selectedCompany) {
      fetchDepartmentsById(selectedCompany).then(setDepartments).catch(console.error);
    } else {
      setDepartments([]);
      setSelectedDepartment("");
    }
  }, [selectedCompany]);

  // Auto-fill from employeeProfile
  useEffect(() => {
    if (!employeeProfile) return;
    const companyId = employeeProfile.organization_assignment?.company?.id;
    const departmentId = employeeProfile.organization_assignment?.department?.id;
    if (companyId) {
      setSelectedCompany(String(companyId));
      if (departmentId) setSelectedDepartment(String(departmentId));
    }
    setSearchTerm(employeeProfile.attendance_employee_no || '');
  }, [employeeProfile]);

  // Auto-load when employeeProfile is set
  useEffect(() => {
    if (employeeProfile && month && year) {
      fetchSalaryData();
    }
  }, [employeeProfile, month, year]);

  // Paginated subset derived from filteredData
  const totalPages = Math.max(1, Math.ceil((filteredData?.length || 0) / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
  const paginatedData = Array.isArray(filteredData) ? filteredData.slice(startIndex, endIndex) : [];

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
    const noPayDeduction = calculateNoPayDeduction();
    return Math.max(0, basicSalary - noPayDeduction) * 0.08;
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

  // Allowance/Deduction helpers (add this block)
  const handleAddAllowance = () => {
    setAllowances((prev) => [...prev, { name: "", amount: "" }]);
    setAllowanceErrors((prev) => [...prev, { name: "", amount: "" }]);
  };

  const handleUpdateAllowance = (index, field, value) => {
    setAllowances((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, [field]: field === "amount" ? value : value } : it
      )
    );
    // clear corresponding error when user edits
    setAllowanceErrors((prev) =>
      prev.map((err, i) => (i === index ? { ...err, [field]: "" } : err))
    );
  };

  const handleRemoveAllowance = (index) => {
    setAllowances((prev) => prev.filter((_, i) => i !== index));
    setAllowanceErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDeduction = () => {
    setDeductions((prev) => [...prev, { name: "", amount: "" }]);
    setDeductionErrors((prev) => [...prev, { name: "", amount: "" }]);
  };

  const handleUpdateDeduction = (index, field, value) => {
    setDeductions((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, [field]: field === "amount" ? value : value } : it
      )
    );
    setDeductionErrors((prev) =>
      prev.map((err, i) => (i === index ? { ...err, [field]: "" } : err))
    );
  };

  const handleRemoveDeduction = (index) => {
    setDeductions((prev) => prev.filter((_, i) => i !== index));
    setDeductionErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotalAllowances = () => {
    return (allowances || []).reduce((s, a) => s + (parseFloat(a.amount || 0) || 0), 0);
  };

  const calculateTotalDeductions = () => {
    return (deductions || []).reduce((s, d) => s + (parseFloat(d.amount || 0) || 0), 0);
  };

  // Validate allowances/deductions before submitting
  const validateAllowancesDeductions = () => {
    const aErrors = allowances.map((a) => {
      const err = { name: "", amount: "" };
      if (!a.name || !String(a.name).trim()) err.name = "Description is required";
      if (a.amount === "" || a.amount === null || isNaN(parseFloat(a.amount))) err.amount = "Amount is required";
      return err;
    });

    const dErrors = deductions.map((d) => {
      const err = { name: "", amount: "" };
      if (!d.name || !String(d.name).trim()) err.name = "Description is required";
      if (d.amount === "" || d.amount === null || isNaN(parseFloat(d.amount))) err.amount = "Amount is required";
      return err;
    });

    setAllowanceErrors(aErrors);
    setDeductionErrors(dErrors);

    const hasAllowanceError = aErrors.some((e) => e.name || e.amount);
    const hasDeductionError = dErrors.some((e) => e.name || e.amount);
    return !(hasAllowanceError || hasDeductionError);
  };

  // Download Pay Slip as PDF
  const downloadPaySlip = (record) => {
    downloadPayslip(record);
  };

  const downloadAllPaySlips = () => {
    if (!salaryData.length) return;
    downloadPayslips(salaryData);
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
      <style jsx>{`
        @keyframes pulse-highlight {
          0%, 100% { background-color: rgb(254, 243, 199); }
          50% { background-color: rgb(253, 224, 71); }
        }
        .row-updated {
          animation: pulse-highlight 0.6s ease-in-out;
        }
      `}</style>
      <div className="flex justify-between items-center mb-8 gap-3">
        <h1 className="text-3xl font-bold text-gray-800">Salary Records</h1>
        {salaryData.length > 0 && (
          <button
            type="button"
            onClick={downloadAllPaySlips}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800"
          >
            <Download size={16} />
            Download all (2 per A4)
          </button>
        )}
      </div>

      {/* Auto-Refresh Controls */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm font-medium text-gray-700">
              Auto-Refresh
            </label>
          </div>

          {autoRefreshEnabled && (
            <div className="flex items-center gap-2">
              <label htmlFor="refreshInterval" className="text-sm text-gray-600">
                Every
              </label>
              <select
                id="refreshInterval"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>
          )}

          <div className="flex-1 flex items-center justify-end gap-2">
            {isAutoRefreshing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span>Updating...</span>
              </div>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Section - admin only */}
      {!employeeProfile && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company *</label>
              <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 h-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Company</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={!selectedCompany}
                className="w-full px-3 h-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100">
                <option value="">All Departments</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Month *</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 h-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
                {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year *</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 h-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name / ID..."
                  className="w-full pl-9 pr-3 h-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex items-end">
              <button onClick={fetchSalaryData} disabled={!selectedCompany}
                className="w-full px-4 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-sm font-medium">
                <RefreshCw size={16} />
                Load
              </button>
            </div>
          </div>
        </div>
      )}

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
                {paginatedData.map((record) => (
                  <tr 
                    key={record.id} 
                    className={`hover:bg-gray-50 transition-all duration-500 ${
                      updatedRowIds.has(record.id) ? 'row-updated' : ''
                    }`}
                  >
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
                          minimumFractionDigits: 2,
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {employeeProfile && (
                        <button
                          onClick={() => downloadPaySlip(record)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                          title="Download Pay Slip"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      )}
                      {!employeeProfile && (
                        <>
                          <button
                            onClick={() => !isIssued(record) && handleEdit(record)}
                            className={`${isIssued(record) ? "opacity-50 cursor-not-allowed mr-4" : "text-blue-600 hover:text-blue-900 mr-4"}`}
                            title={isIssued(record) ? "Cannot edit issued record" : "Edit"}
                            aria-disabled={isIssued(record)}
                            type="button"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (isIssued(record)) {
                                alert("This salary record cannot be deleted because it is already issued.");
                                return;
                              }
                              setCurrentRecord(record);
                              setIsDeleteModalOpen(true);
                            }}
                            className={`${isIssued(record) ? "opacity-50 cursor-not-allowed" : "text-red-600 hover:text-red-900"}`}
                            title={isIssued(record) ? "Cannot delete issued record" : "Delete"}
                            aria-disabled={isIssued(record)}
                            type="button"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          {filteredData.length > rowsPerPage && (
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">{endIndex}</span> of{" "}
                <span className="font-medium">{filteredData.length}</span> records
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md border ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50 text-gray-700"}`}
                >
                  Prev
                </button>

                {/* Simple page buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    aria-current={p === currentPage ? "page" : undefined}
                    className={`px-3 py-1 rounded-md border ${p === currentPage ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md border ${currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50 text-gray-700"}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
                 
                 {/*
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
                      <option value="pending">Pending</option>
                      
                      <option value="hold">Hold</option>
                    </select>
                  </div>
                  */}


                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value.toLowerCase() })} // අනිවාර්යයෙන්ම Simple අකුරු කරන්න!
                      className="block w-full pl-2 pr-8 py-1.5 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                    >
                      <option value="pending">Pending</option>
                      <option value="processed">Processed</option>
                      <option value="hold">Hold</option>
                      
                      
                      {formData.status === 'issued' && (
                        <option value="issued" disabled>Issued</option>
                      )}
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
               {/* Second column - Period and checkboxes */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Month
                      </label>
                      <input
                        type="text"
                        name="month"
                        value={months.find(m => m.value === formData.month)?.label || formData.month} // අංකය වෙනුවට නම පෙන්නන්න
                        readOnly // <--- Edit කරන්න බැරි වෙන්න
                        className="block w-full px-2 py-1.5 sm:text-sm border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed" // <--- අළු පාට කලා
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="text"
                        name="year"
                        value={formData.year}
                        readOnly // <--- Edit කරන්න බැරි වෙන්න
                        className="block w-full px-2 py-1.5 sm:text-sm border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed" // <--- අළු පාට කලා
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

                  {/* BR Status - hidden
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
                  */}
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
                      })}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Basic Salary:</span>
                    <span className="font-medium">
                      {parseFloat(formData.basic_salary || 0).toLocaleString("en-LK", {
                      })}
                    </span>
                  </div>

                  {/* Estimated net salary based on edits */}
                  <div className="col-span-2 mt-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-700">Estimated Net Salary (preview):</span>
                      <span className="text-blue-700">
                        {calculateNetSalary().toLocaleString("en-LK", {
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">BR Allowance:</span>
                    <span className="font-medium">
                      {calculateBRAllowance().toLocaleString("en-LK", {
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">No-Pay Deduction:</span>
                    <span className="font-medium">
                      {calculateNoPayDeduction().toLocaleString("en-LK", {
                      })}
                    </span>
                  </div>

                  {formData.enable_epf_etf && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">EPF (8%):</span>
                      <span className="font-medium">
                        {calculateEPF().toLocaleString("en-LK", {
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-500">Loan Installment:</span>
                    <span className="font-medium">
                      {parseFloat(formData.installment_amount || 0).toLocaleString("en-LK", {
                      })}
                    </span>
                  </div>

                  {/* Probation fields from salary_breakdown */}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Probation Over-limit Days:</span>
                    <span className="font-medium">
                      {(
                        parseFloat(
                          currentRecord?.salary_breakdown?.probation_over_limit_days ??
                            currentRecord?.salary_breakdown?.probation_over_limit ??
                            0
                        ) || 0
                      ).toLocaleString("en-LK", { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Probation Deduction:</span>
                    <span className="font-medium">
                      {(
                        parseFloat(currentRecord?.salary_breakdown?.probation_deduction ?? 0) || 0
                      ).toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
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
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Add these items */}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Allowances:</span>
                    <span className="font-medium">
                      {calculateTotalAllowances().toLocaleString("en-LK", {
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Deductions:</span>
                    <span className="font-medium">
                      {calculateTotalDeductions().toLocaleString("en-LK", {
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Allowances & Deductions Panels */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Allowances Panel */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Allowances</h3>
                    <button
                      type="button"
                      onClick={handleAddAllowance}
                      className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  {allowances.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No allowances</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {allowances.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border border-gray-100">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateAllowance(index, 'name', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border rounded"
                            placeholder="Description"
                          />
                        {allowanceErrors[index]?.name && (
                          <div className="text-red-500 text-xs mt-1 col-span-full">
                            {allowanceErrors[index].name}
                          </div>
                        )}
                          <div className="w-24 flex items-center">
                            <span className="text-gray-500 text-xs mr-1">Rs.</span>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => handleUpdateAllowance(index, 'amount', e.target.value)}
                              className="w-full px-2 py-1 text-xs border rounded text-right"
                              placeholder="0.00"
                              step="0.01"
                            />
                          </div>
                        {allowanceErrors[index]?.amount && (
                          <div className="text-red-500 text-xs mt-1 col-span-full">
                            {allowanceErrors[index].amount}
                          </div>
                        )}
                          <button
                            type="button"
                            onClick={() => handleRemoveAllowance(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Minus size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 text-sm">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-blue-700">
                      {calculateTotalAllowances().toLocaleString("en-LK", {
                      })}
                    </span>
                  </div>
                </div>
                
                {/* Deductions Panel */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Deductions</h3>
                    <button
                      type="button"
                      onClick={handleAddDeduction}
                      className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  {deductions.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No deductions</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {deductions.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border border-gray-100">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateDeduction(index, 'name', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border rounded"
                            placeholder="Description"
                          />
                        {deductionErrors[index]?.name && (
                          <div className="text-red-500 text-xs mt-1 col-span-full">
                            {deductionErrors[index].name}
                          </div>
                        )}
                          <div className="w-24 flex items-center">
                            <span className="text-gray-500 text-xs mr-1">Rs.</span>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => handleUpdateDeduction(index, 'amount', e.target.value)}
                              className="w-full px-2 py-1 text-xs border rounded text-right"
                              placeholder="0.00"
                              step="0.01"
                            />
                          </div>
                        {deductionErrors[index]?.amount && (
                          <div className="text-red-500 text-xs mt-1 col-span-full">
                            {deductionErrors[index].amount}
                          </div>
                        )}
                          <button
                            type="button"
                            onClick={() => handleRemoveDeduction(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Minus size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 text-sm">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-red-700">
                      {calculateTotalDeductions().toLocaleString("en-LK", {
                      })}
                    </span>
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
                  disabled={currentRecord?.status === "issued"}
                  title={currentRecord?.status === "issued" ? "Cannot save issued record" : "Save Changes"}
                  className={`px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${currentRecord?.status === "issued" ? "opacity-50 cursor-not-allowed" : ""}`}
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
              onClick={() => {
                if (currentRecord?.status === "issued") {
                  alert("This salary record cannot be deleted because it is already issued.");
                  return;
                }
                deleteSalaryRecord(currentRecord.id);
              }}
              disabled={currentRecord?.status === "issued"}
              title={currentRecord?.status === "issued" ? "Cannot delete issued record" : "Delete"}
              className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center ${currentRecord?.status === "issued" ? "opacity-50 cursor-not-allowed" : ""}`}
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