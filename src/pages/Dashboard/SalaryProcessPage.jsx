import { useState, useEffect, useMemo } from "react";
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
  fetchExcelData,
  importExcelData,
} from "@services/SalaryProcessService";
import { fetchSalaryCSV } from "@services/SalaryService";
import AllowancesService from "@services/AllowancesService";
import * as DeductionService from "@services/DeductionService";
import ImportExcelModal from "@dashboard/ImportExcelModal";
import Swal from "sweetalert2";
import EmployeeSalaryCard from "../../components/EmployeeSalaryCard";

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

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const SalaryProcessPage = () => {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState("Unprocessed");

  const [filteredData, setFilteredData] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  const [availableAllowances, setAvailableAllowances] = useState([]);
  const [availableDeductions, setAvailableDeductions] = useState([]);
  const [isLoadingAllowances, setIsLoadingAllowances] = useState(false);

  const [kpiType, setKpiType] = useState("");

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [bulkActionType, setBulkActionType] = useState("allowance");
  const [bulkActionAmount, setBulkActionAmount] = useState("");
  const [bulkActionId, setBulkActionId] = useState("");

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState("");

  const [availableBonuses, setAvailableBonuses] = useState([]);
  const [isLoadingBonuses, setIsLoadingBonuses] = useState(false);

  const [statusInfo, setStatusInfo] = useState({
    processUser: "Admin",
    lastProcessDate: "2025-05-30",
  });

  const [employeeData, setEmployeeData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);

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

  const parseJsonField = (value, fallback) => {
    if (value == null) return fallback;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (error) {
        return fallback;
      }
    }
    return value;
  };

  const normalizeNamedItems = (items, type) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
      ...item,
      name:
        item?.name ||
        item?.[`${type}_name`] ||
        item?.title ||
        type.charAt(0).toUpperCase() + type.slice(1),
      code: item?.code || item?.[`${type}_code`] || "-",
      amount: Number(item?.amount || 0),
    }));
  };

  const normalizeEmployee = (emp) => {
    const allowances = parseJsonField(emp?.allowances, []);
    const bonuses = parseJsonField(emp?.bonuses, []);
    const deductions = parseJsonField(emp?.deductions, []);
    const salaryBreakdown = parseJsonField(emp?.salary_breakdown, {});

    return {
      ...emp,
      allowances: normalizeNamedItems(allowances, "allowance"),
      bonuses: normalizeNamedItems(bonuses, "bonus"),
      deductions: normalizeNamedItems(deductions, "deduction"),
      salary_breakdown:
        salaryBreakdown && typeof salaryBreakdown === "object"
          ? salaryBreakdown
          : {},
    };
  };

  const processedDisplayedData = useMemo(() => {
    let rows = Array.isArray(displayedData) ? [...displayedData] : [];

    if (activeFilter === "EPF") {
      rows = rows.filter((emp) => !!emp.enable_epf_etf);
    } else if (activeFilter === "NonEPF") {
      rows = rows.filter((emp) => !emp.enable_epf_etf);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      rows = rows.filter(
        (emp) =>
          String(emp?.emp_no || "").toLowerCase().includes(q) ||
          String(emp?.employee_no || "").toLowerCase().includes(q) ||
          String(emp?.full_name || "").toLowerCase().includes(q)
      );
    }

    return rows;
  }, [displayedData, activeFilter, searchTerm]);

  const totalSalary = processedDisplayedData.reduce(
    (sum, emp) => sum + (parseFloat(emp?.basic_salary) || 0),
    0
  );

  const employeeCount = processedDisplayedData.length;

  const loadAllowancesAndDeductions = async () => {
    setIsLoadingAllowances(true);
    try {
      const allowances = await AllowancesService.getAllAllowances();
      setAvailableAllowances(allowances || []);

      const deductions = await DeductionService.fetchDeductionsByCompanyOrDepartment();
      setAvailableDeductions(deductions || []);
    } catch (error) {
      console.error("Error loading allowances and deductions:", error);
    } finally {
      setIsLoadingAllowances(false);
    }
  };

  const loadAllowancesByCompany = async (companyId) => {
    setIsLoadingAllowances(true);
    try {
      const allowances = await AllowancesService.getAllowancesByCompanyOrDepartment(
        companyId,
        null
      );
      setAvailableAllowances(allowances || []);
    } catch (error) {
      console.error("Error loading allowances by company:", error);
    } finally {
      setIsLoadingAllowances(false);
    }
  };

  const handleImportExcel = async (file) => {
    try {
      const response = await importExcelData(file);
      setImportSuccessMessage(
        response.message || "Employee allowances imported successfully"
      );
      notify.success("Imported", "Employee allowances imported successfully");
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
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];
      setAvailableBonuses(list);
    } catch (error) {
      console.error("Error loading bonuses:", error);
      setAvailableBonuses([]);
    } finally {
      setIsLoadingBonuses(false);
    }
  };

  const loadBonusesByCompanyOrDepartment = async (companyId, departmentId) => {
    setIsLoadingBonuses(true);
    try {
      const res = await BonusService.getBonusesByCompanyOrDepartment(
        companyId,
        departmentId
      );
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];
      setAvailableBonuses(list);
    } catch (error) {
      console.error("Error loading bonuses by company/department:", error);
      setAvailableBonuses([]);
    } finally {
      setIsLoadingBonuses(false);
    }
  };

  const handleImportSuccess = (message) => {
    setImportSuccessMessage(message);
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
      notify.error("Download Failed", "Failed to download CSV");
    }
  };

  const handleSalaryProcess = async () => {
    setStatus("Processed");
    setStatusInfo((prev) => ({
      ...prev,
      lastProcessDate: new Date().toISOString().split("T")[0],
    }));

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

  const buildPayslipGroups = (emp) => {
    const breakdown = parseJsonField(emp?.salary_breakdown, {});
    const allowances = normalizeNamedItems(parseJsonField(emp?.allowances, []), "allowance");
    const bonuses = normalizeNamedItems(parseJsonField(emp?.bonuses, []), "bonus");
    const salaryAdvance = Number(emp?.salary_advance || 0);

    const basicEarnings = [
      {
        label: "Basic Salary",
        amount: Number(breakdown.basic_salary || emp?.basic_salary || 0),
      },
      ...allowances.map((a) => ({
        label: a.name || "Allowance",
        amount: Number(a.amount || 0),
      })),
    ].filter((item) => item.amount > 0);

    const basicOnlyDeductions = [
      {
        label: "EPF Deduction (8%)",
        amount: Number(breakdown.epf_employee_deduction || 0),
      },
      {
        label: "Official No Pay Deduction",
        amount: Number(breakdown.no_pay_deduction || 0),
      },
    ].filter((item) => item.amount > 0);

    const bonusSideDeductions = [
      {
        label: "Late Arrival Deduction",
        amount: Number(breakdown.late_deduction_amount || 0),
      },
      {
        label: "Half Day Deduction",
        amount: Number(breakdown.half_day_deduction || 0),
      },
      {
        label: "Loan Installment / Interest",
        amount: Number(breakdown.loan_installment || 0),
      },
      {
        label: "Salary Advance",
        amount: salaryAdvance,
      },
    ].filter((item) => item.amount > 0);

    const bonusEarnings = [
      ...bonuses.map((b) => ({
        label: b.name || "Bonus",
        amount: Number(b.amount || 0),
      })),
      {
        label: "KPI Allowance",
        amount: Number(breakdown.kpi_allowance || 0),
      },
      {
        label: "KPI Bonus (6M)",
        amount: Number(breakdown.kpi_bonus_allowance || 0),
      },
    ].filter((item) => item.amount > 0);

    const hasBonus = bonusEarnings.length > 0;

    return {
      basicPayslip: {
        title: "BASIC + ALLOWANCES PAYSLIP",
        paymentMethod: "Bank Transfer",
        earnings: basicEarnings,
        deductions: hasBonus
          ? basicOnlyDeductions
          : [...basicOnlyDeductions, ...bonusSideDeductions],
      },
      bonusPayslip: {
        title: "BONUS PAYSLIP",
        paymentMethod: "Cash",
        earnings: bonusEarnings,
        deductions: hasBonus ? bonusSideDeductions : [],
      },
      overtimePayslip: {
        title: "OVERTIME PAYSLIP",
        paymentMethod: "Separate Payment",
        earnings: [
          {
            label: "Morning OT",
            amount: Number(breakdown.ot_morning_fees || 0),
          },
          {
            label: "Evening OT",
            amount: Number(breakdown.ot_night_fees || 0),
          },
          {
            label: "Holiday OT",
            amount: Number(breakdown.holiday_ot_fees || 0),
          },
        ].filter((item) => item.amount > 0),
        deductions: [],
      },
      hasBonus,
    };
  };

  const generateSinglePayslipPDF = (doc, emp, payslip, monthName, selectedYear, isFirstPage = false) => {
    if (!isFirstPage) doc.addPage();

    const earningsTotal = (payslip.earnings || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const deductionsTotal = (payslip.deductions || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const netTotal = earningsTotal - deductionsTotal;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${emp.company_name || "Company"}`, 105, 15, { align: "center" });
    doc.text(`${payslip.title}`, 105, 22, { align: "center" });
    doc.text(`${monthName} ${selectedYear}`, 105, 29, { align: "center" });
    doc.text(`Payment Method: ${payslip.paymentMethod}`, 105, 36, { align: "center" });
    doc.rect(10, 8, 190, 34);

    let y = 50;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Employee No :`, 15, y);
    doc.text(`${emp.employee_no || emp.emp_no || "N/A"}`, 60, y);
    y += 6;

    doc.text(`Name :`, 15, y);
    doc.text(`${emp.full_name || "N/A"}`, 60, y);
    y += 6;

    doc.text(`Department :`, 15, y);
    doc.text(`${emp.department_name || "N/A"}`, 60, y);
    y += 6;

    if (payslip.paymentMethod === "Bank Transfer") {
      doc.text(`Bank :`, 15, y);
      doc.text(`${emp.compensation?.bank_name || "N/A"}`, 60, y);
      y += 6;
      doc.text(`Branch :`, 15, y);
      doc.text(`${emp.compensation?.branch_name || "N/A"}`, 60, y);
      y += 6;
      doc.text(`Account No :`, 15, y);
      doc.text(`${emp.compensation?.bank_account_no || "N/A"}`, 60, y);
      y += 8;
    } else {
      y += 4;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Earnings", 15, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    if ((payslip.earnings || []).length > 0) {
      payslip.earnings.forEach((item) => {
        doc.text(item.label, 15, y);
        doc.text(formatMoney(item.amount), 170, y, { align: "right" });
        y += 6;
      });
    } else {
      doc.text("No earnings", 15, y);
      y += 6;
    }

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Deductions", 15, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    if ((payslip.deductions || []).length > 0) {
      payslip.deductions.forEach((item) => {
        doc.text(item.label, 15, y);
        doc.text(formatMoney(item.amount), 170, y, { align: "right" });
        y += 6;
      });
    } else {
      doc.text("No deductions", 15, y);
      y += 6;
    }

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Total Earnings", 15, y);
    doc.text(formatMoney(earningsTotal), 170, y, { align: "right" });
    y += 8;

    doc.text("Total Deductions", 15, y);
    doc.text(formatMoney(deductionsTotal), 170, y, { align: "right" });
    y += 10;

    doc.setFontSize(12);
    doc.text("Net Amount", 15, y);
    doc.text(formatMoney(netTotal), 170, y, { align: "right" });
    y += 12;

    doc.setFontSize(10);
    doc.text("LIFEHRMS", 15, y);
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate().toString().padStart(2, "0")}/${(currentDate.getMonth() + 1).toString().padStart(2, "0")}/${currentDate.getFullYear()}`;
    doc.text(formattedDate, 170, y, { align: "right" });

    doc.rect(10, 45, 190, Math.max(80, y - 38));
  };

  const handleDownloadAllProcessed = async () => {
    try {
      setIsLoading(true);
      if (!month || !year) {
        notify.warning("Missing Filters", "Please select month and year before downloading payslips.");
        return;
      }

      const sourceData = processedDisplayedData && processedDisplayedData.length > 0 ? processedDisplayedData : [];
      if (!sourceData || sourceData.length === 0) {
        notify.info("No Data", "No salary data found for the selected period.");
        return;
      }

      const doc = new jsPDF();
      const monthObj = months.find((m) => m.value === month);
      const monthName = monthObj ? monthObj.label : `${month}`;
      let isFirstPage = true;

      sourceData.forEach((emp) => {
        const { basicPayslip, bonusPayslip, overtimePayslip, hasBonus } = buildPayslipGroups(emp);

        generateSinglePayslipPDF(doc, emp, basicPayslip, monthName, year, isFirstPage);
        isFirstPage = false;

        if (hasBonus) {
          generateSinglePayslipPDF(doc, emp, bonusPayslip, monthName, year, false);
        }

        if ((overtimePayslip.earnings || []).length > 0) {
          generateSinglePayslipPDF(doc, emp, overtimePayslip, monthName, year, false);
        }
      });

      doc.save(`payslips_${monthName}_${year}.pdf`);
      notify.success("Success", "Payslips generated successfully!");
    } catch (error) {
      console.error("Error generating payslips:", error);
      notify.error("PDF Error", "Error generating payslips. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEPFFilter = () => setActiveFilter("EPF");
  const handleNonEPFFilter = () => setActiveFilter("NonEPF");
  const handleAllEmployees = () => setActiveFilter("All");

  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const companiesData = await fetchCompanies();
        setCompanies(companiesData || []);
      } catch (error) {
        console.error("Error loading companies:", error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    const loadDepartments = async () => {
      if (selectedCompany) {
        setIsLoadingDepartments(true);
        try {
          const departmentsData = await fetchDepartmentsById(selectedCompany);
          setDepartments(departmentsData || []);
        } catch (error) {
          console.error("Error loading departments:", error);
        } finally {
          setIsLoadingDepartments(false);
        }
      } else {
        setDepartments([]);
        setSelectedDepartment("");
      }
    };
    loadDepartments();
  }, [selectedCompany]);

  useEffect(() => {
    loadAllowancesAndDeductions();
    loadBonuses();
  }, []);

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    setSelectedDepartment("");

    if (companyId) {
      loadAllowancesByCompany(companyId);
      loadBonusesByCompanyOrDepartment(companyId, null);
    } else {
      loadAllowancesAndDeductions();
      loadBonuses();
    }
  };

  const fetchSalaryData = async () => {
    if (!month || !year || !selectedCompany) {
      notify.warning("Missing Filters", "Please select company, month, and year before applying filters");
      return null;
    }

    setIsLoading(true);
    try {
      const data = await getSalaryData({
        month,
        year,
        company_id: selectedCompany,
        department_id: selectedDepartment || undefined,
        kpi_type: kpiType || undefined,
      });

      const rows = (data?.data || []).map(normalizeEmployee);

      setEmployeeData(rows);
      setDisplayedData(rows);
      setFilteredData(rows);
      return rows;
    } catch (error) {
      console.error("Error fetching salary data:", error);
      notify.error("Fetch Failed", "Error fetching salary data. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    await fetchSalaryData();
  };

  const resetFilter = () => {
    setActiveFilter("All");
    setEmployeeData([]);
    setDisplayedData([]);
    setFilteredData([]);
    setSelectedCompany("");
    setSelectedDepartment("");
    setMonth("");
    setKpiType("");
    setSearchTerm("");
    setShowHistory(false);
  };

  const handleAllowanceDeductionChange = (id) => {
    const numericId = Number(id);
    setBulkActionId(numericId);

    if (bulkActionType === "allowance") {
      const a = availableAllowances.find((x) => Number(x.id) === numericId);
      if (a?.amount != null) setBulkActionAmount(parseFloat(a.amount).toFixed(2));
    } else if (bulkActionType === "deduction") {
      const d = availableDeductions.find((x) => Number(x.id) === numericId);
      if (d?.amount != null) setBulkActionAmount(parseFloat(d.amount).toFixed(2));
    } else if (bulkActionType === "bonus") {
      const b = availableBonuses.find((x) => Number(x.id) === numericId);
      if (b?.amount != null) setBulkActionAmount(parseFloat(b.amount).toFixed(2));
    }
  };

  const handleSelectEmployee = (employee) => {
    const empId = `${employee.id}`;
    if (selectedEmployees.includes(empId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== empId));
    } else {
      setSelectedEmployees([...selectedEmployees, empId]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      const allEmployeeIds = processedDisplayedData.map((employee) => `${employee.id}`);
      setSelectedEmployees(allEmployeeIds);
    }
    setSelectAll(!selectAll);
  };

  const applyBulkAction = async () => {
    if (!bulkActionId || selectedEmployees.length === 0) {
      notify.warning("Missing Data", "Please fill all fields and select at least one employee");
      return;
    }

    const payload = {
      selectedEmployees,
      bulkActionId,
      bulkActionType,
      bulkActionAmount: bulkActionAmount || null,
    };

    try {
      await UpdateAllowances(payload);
      notify.success("Success", `Successfully applied ${bulkActionType} to ${selectedEmployees.length} employee(s)`);
      await fetchSalaryData();
      setSelectedEmployees([]);
      setSelectAll(false);
      setBulkActionAmount("");
    } catch (error) {
      console.log(error);
      notify.error("Error", error.response?.data?.message || error.message || "Operation failed");
    }
  };

  const getExcelData = async () => {
    if (!bulkActionId || selectedEmployees.length === 0) {
      notify.warning("Missing Data", "Please fill all fields and select at least one employee");
      return;
    }

    const payload = { selectedEmployees, bulkActionId, bulkActionType };

    try {
      const response = await fetchExcelData(payload);
      const [employees, allowances, deductions, bonuses] = response || [];

      const worksheetData = (employees || []).map((employee) => {
        const row = {
          EMPLOYEE_NO: employee.attendance_employee_no,
          NIC: employee.nic,
          "Full Name": employee.full_name,
        };

        if (allowances && allowances.length > 0) {
          allowances.forEach((allowance) => {
            row["Allowance ID"] = allowance.id;
            row["Allowance Name"] = allowance.allowance_name;
            row["Amount (LKR)"] = 0;
          });
        }
        if (deductions && deductions.length > 0) {
          deductions.forEach((deduction) => {
            row["Deduction ID"] = deduction.id;
            row["Deduction Name"] = deduction.deduction_name;
            row["Amount (LKR)"] = 0;
          });
        }
        if (bonuses && bonuses.length > 0) {
          bonuses.forEach((bonus) => {
            row["Bonus ID"] = bonus.id;
            row["Bonus Name"] = bonus.bonus_name;
            row["Amount (LKR)"] = 0;
          });
        }
        return row;
      });

      const csvContent = convertArrayToCSV(worksheetData);
      const filePrefix =
        payload.bulkActionType === "allowance" ? "employee_allowances"
        : payload.bulkActionType === "deduction" ? "employee_deductions"
        : "employee_bonuses";

      downloadCSV(csvContent, `${filePrefix}_${Date.now()}.csv`);
      notify.success("Download Ready", "Template downloaded successfully");
    } catch (error) {
      console.error("Error generating Excel data:", error);
      notify.error("Failed", "Failed to generate Excel file");
    }
  };

  useEffect(() => {
    const allSelected = processedDisplayedData.length > 0 && selectedEmployees.length === processedDisplayedData.length;
    setSelectAll(allSelected);
  }, [selectedEmployees, processedDisplayedData]);

  useEffect(() => {
    setSelectedEmployees([]);
    setSelectAll(false);
  }, [month, selectedCompany, selectedDepartment, kpiType, showHistory]);

  function convertArrayToCSV(data) {
    if (!data || data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map((obj) =>
      headers.map((header) => {
        let value = obj[header] !== undefined ? String(obj[header]) : "";
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }

  function downloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function convertToCSV(data) {
    if (!data || data.length === 0) return "";
    const flattenedData = data.map((item) => {
      const flattened = { ...item };
      if (Array.isArray(item.allowances)) {
        flattened.allowances = item.allowances.map((a) => `${a.name || a.allowance_name}: ${a.amount}`).join("; ");
      } else { flattened.allowances = ""; }

      if (Array.isArray(item.bonuses)) {
        flattened.bonuses = item.bonuses.map((b) => `${b.name || b.bonus_name}: ${b.amount}`).join("; ");
      } else { flattened.bonuses = ""; }

      if (Array.isArray(item.deductions)) {
        flattened.deductions = item.deductions.map((d) => `${d.name || d.deduction_name}: ${d.amount}`).join("; ");
      } else { flattened.deductions = ""; }

      if (item.salary_breakdown && typeof item.salary_breakdown === "object") {
        for (const [key, value] of Object.entries(item.salary_breakdown)) {
          flattened[`breakdown_${key}`] = Array.isArray(value) ? JSON.stringify(value) : value;
        }
        delete flattened.salary_breakdown;
      }

      const yesNoFields = ["increment_active", "ot_morning", "ot_evening", "enable_epf_etf", "br1", "br2"];
      yesNoFields.forEach((field) => {
        if (flattened[field] !== undefined && flattened[field] !== null) {
          flattened[field] = flattened[field] == 1 ? "Yes" : "No";
        }
      });
      return flattened;
    });

    const headerMappings = {
      id: "ID", emp_no: "Employee No", full_name: "Full Name", company_name: "Company",
      department_name: "Department", sub_department_name: "Sub Department", basic_salary: "Basic Salary",
      increment_active: "Increment Active", increment_value: "Increment Value",
      increment_effected_date: "Increment Effective Date", ot_morning: "OT Morning", ot_evening: "OT Evening",
      enable_epf_etf: "EPF/ETF Enabled", br1: "BR1 Allowance", br2: "BR2 Allowance",
      ot_morning_rate: "OT Morning Rate", ot_night_rate: "OT Night Rate", stamp: "Stamp Fee",
      br_status: "BR Status", total_loan_amount: "Total Loan Amount", installment_count: "Installment Count",
      installment_amount: "Installment Amount", approved_no_pay_days: "Approved No-Pay Days",
      allowances: "Allowances", bonuses: "Bonuses", deductions: "Deductions",
      breakdown_basic_salary: "Basic Salary (Adjusted)", breakdown_br_allowance: "BR Allowance",
      breakdown_ot_morning_fees: "OT Morning Fees", breakdown_ot_night_fees: "OT Night Fees",
      breakdown_holiday_ot_fees: "Holiday OT Fees", breakdown_adjusted_basic: "Adjusted Basic",
      breakdown_per_day_salary: "Per Day Salary", breakdown_no_pay_deduction: "No-Pay Deduction",
      breakdown_late_deduction_amount: "Late Deduction", breakdown_total_allowances: "Total Allowances",
      breakdown_epf_etf_base: "EPF/ETF Base", breakdown_epf_employee_deduction: "EPF Employee Deduction",
      breakdown_epf_employer_contribution: "EPF Employer Contribution", breakdown_etf_employer_contribution: "ETF Employer Contribution",
      breakdown_total_fixed_deductions: "Total Fixed Deductions", breakdown_loan_installment: "Loan Installment",
      breakdown_gross_salary: "Gross Salary", breakdown_kpi_allowance: "KPI Allowance",
      breakdown_kpi_bonus_allowance: "KPI Bonus (6M)", breakdown_total_deductions: "Total Deductions",
      breakdown_stamp: "Stamp Fee (Breakdown)", breakdown_net_salary: "Net Salary",
      breakdown_late_count_for_policy: "Late Count", breakdown_approved_leave_late_count: "Approved Leave Late Count",
      breakdown_no_deduction_late_count: "No Deduction Late Count", breakdown_short_leave_count: "Short Leave Count",
      breakdown_half_day_count: "Half Day Count", breakdown_deductible_late_count: "Deductible Late Count",
    };

    const headerSet = new Set(Object.keys(flattenedData[0] || {}));
    headerSet.add("breakdown_kpi_allowance");
    headerSet.add("breakdown_kpi_bonus_allowance");
    const headers = Array.from(headerSet);

    const friendlyHeaders = headers.map((header) =>
      headerMappings[header] || header.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );

    const rows = flattenedData.map((obj) =>
      headers.map((header) => {
        let value = obj[header] !== undefined && obj[header] !== null ? String(obj[header]) : "";
        if (header.includes("salary") || header.includes("amount") || header.includes("rate") ||
            header.includes("fee") || header.includes("deduction") || header.includes("contribution")) {
          if (!isNaN(parseFloat(value)) && isFinite(value)) {
            value = parseFloat(value).toFixed(2);
          }
        }
        if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes(";")) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    );
    return [friendlyHeaders.join(","), ...rows].join("\n");
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Salary Processing
        </h1>
        <div className="flex items-center space-x-2">
          <span
            className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm border ${
              status === "Processed"
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
            }`}
          >
            {status === "Processed" ? (
              <CheckCircle className="inline mr-1 h-4 w-4" />
            ) : (
              <AlertCircle className="inline mr-1 h-4 w-4" />
            )}
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl border border-blue-200 p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">
                    Total Salary Cost
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    LKR {totalSalary.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-blue-200 text-blue-700 shadow">
                  <Wallet size={24} strokeWidth={2} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl border border-green-200 p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">
                    Employee Count
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {employeeCount}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-green-200 text-green-700 shadow">
                  <Users size={24} strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow flex flex-wrap gap-4">
            <button
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                activeFilter === "All"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50"
              }`}
              onClick={handleAllEmployees}
              type="button"
            >
              All Employees
            </button>

            <button
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                activeFilter === "EPF"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50"
              }`}
              onClick={handleEPFFilter}
              type="button"
            >
              <Users size={18} strokeWidth={2} />
              EPF Employee
            </button>

            <button
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                activeFilter === "NonEPF"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50"
              }`}
              onClick={handleNonEPFFilter}
              type="button"
            >
              <Users size={18} strokeWidth={2} />
              Non EPF Employee
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow">
            <h3 className="text-base font-semibold text-gray-700 mb-4">
              Filter Employees
            </h3>

            <div className="relative mb-4">
              <label
                htmlFor="search"
                className="block text-xs font-semibold text-gray-500 mb-1"
              >
                Search by ID or Name (UI only)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Enter employee ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-5 mb-4">
              <div className="relative flex-1">
                <label
                  htmlFor="company"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Company
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  {isLoadingCompanies ? (
                    <div className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <select
                      id="company"
                      value={selectedCompany}
                      onChange={handleCompanyChange}
                      className="appearance-none w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    >
                      <option value="">Select Company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                </div>
              </div>

              <div className="relative flex-1">
                <label
                  htmlFor="department"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Department
                </label>
                <div className="relative">
                  <Layers
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  {isLoadingDepartments ? (
                    <div className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <select
                      id="department"
                      value={selectedDepartment}
                      onChange={(e) => {
                        const deptId = e.target.value;
                        setSelectedDepartment(deptId);
                        if (selectedCompany) {
                          loadBonusesByCompanyOrDepartment(
                            selectedCompany,
                            deptId || null
                          );
                        }
                      }}
                      disabled={!selectedCompany}
                      className={`appearance-none w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm ${
                        !selectedCompany ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="">All Departments</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                </div>
              </div>

              <div className="relative flex-1">
                <label
                  htmlFor="month"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Month
                </label>
                <select
                  id="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                >
                  <option value="">Select Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
              </div>

              <div className="relative flex-1">
                <label
                  htmlFor="kpiMode"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  KPI Mode
                </label>
                <select
                  id="kpiMode"
                  value={kpiType}
                  onChange={(e) => setKpiType(e.target.value)}
                  className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                >
                  <option value="">None</option>
                  <option value="monthly">Monthly</option>
                  <option value="6month">6 Month Bonus</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                <p className="mt-1 text-[10px] text-gray-500">
                  Monthly adds to EPF base; 6 Month Bonus adds to gross only
                </p>
              </div>

              <div className="relative flex-1">
                <label
                  htmlFor="year"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                  placeholder="Enter year"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors shadow"
                onClick={applyFilters}
                type="button"
              >
                <Filter size={18} strokeWidth={2} />
                Apply Filters
              </button>

              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-base font-semibold hover:bg-gray-300 transition-colors shadow"
                onClick={resetFilter}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 p-6 shadow h-fit">
          <h3 className="text-base font-semibold text-blue-700 mb-4">
            Process Status
          </h3>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Status</p>
              <div className="flex items-center">
                {status === "Processed" ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                )}
                <p
                  className={`font-semibold text-lg ${
                    status === "Processed"
                      ? "text-green-700"
                      : "text-yellow-700"
                  }`}
                >
                  {status}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                Processed By
              </p>
              <p className="font-semibold text-gray-800">
                {statusInfo.processUser}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                Last Process Date
              </p>
              <p className="font-semibold text-gray-800">
                {statusInfo.lastProcessDate}
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                  status === "Processed"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700 shadow"
                }`}
                onClick={async () => {
                  if (filteredData.length === 0) {
                    notify.info(
                      "No Data",
                      "No data to save. Please apply filters first."
                    );
                    return;
                  }
                  try {
                    const dataWithMonth = filteredData.map((item) => ({
                      ...item,
                      month,
                    }));

                    await saveSalaryData(dataWithMonth);

                    const csvContent = convertToCSV(filteredData);
                    const kpiSuffix = kpiType ? `_${kpiType}` : `_none`;
                    downloadCSV(
                      csvContent,
                      `salary_data${kpiSuffix}_${Date.now()}.csv`
                    );

                    notify.success(
                      "Saved",
                      "Salary data saved and downloaded successfully!"
                    );
                  } catch (error) {
                    console.error("Error saving salary data:", error);
                    notify.error(
                      "Save Failed",
                      error.response?.data?.message || error.message || "Unknown error"
                    );
                  }
                }}
                type="button"
                disabled={filteredData.length === 0}
              >
                <FileText size={18} strokeWidth={2} />
                Save Data
              </button>

              <button
                className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                  status === "Processed"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 shadow"
                }`}
                onClick={handleSalaryProcess}
                disabled={status === "Processed"}
              >
                <FileText size={18} strokeWidth={2} />
                Process Salary
              </button>

              <button
                className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                  status !== "Processed"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700 shadow"
                }`}
                onClick={() => {
                  handleDownloadAllProcessed();
                  handleDownloadCSV();
                }}
                disabled={status !== "Processed"}
              >
                <Download size={18} strokeWidth={2} />
                Download 3 Payslips Per Employee
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedEmployees.length > 0 && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-md mb-8 animate-fadeIn">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Users className="mr-2" size={20} />
            Bulk Actions ({selectedEmployees.length} employees selected)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Action Type
              </label>
              <select
                value={bulkActionType}
                onChange={(e) => {
                  setBulkActionType(e.target.value);
                  setBulkActionAmount("");
                  setBulkActionId("");
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="allowance">Add Allowance</option>
                <option value="deduction">Add Deduction</option>
                <option value="bonus">Add Bonus</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {bulkActionType === "allowance"
                  ? "Allowance Type"
                  : bulkActionType === "deduction"
                  ? "Deduction Type"
                  : "Bonus Type"}
              </label>

              <select
                value={bulkActionId}
                onChange={(e) => handleAllowanceDeductionChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Type</option>

                {bulkActionType === "allowance" &&
                  availableAllowances.map((allowance) => (
                    <option key={allowance.id} value={allowance.id}>
                      {allowance.allowance_name}
                    </option>
                  ))}

                {bulkActionType === "deduction" &&
                  availableDeductions.map((deduction) => (
                    <option key={deduction.id} value={deduction.id}>
                      {deduction.deduction_name}
                    </option>
                  ))}

                {bulkActionType === "bonus" &&
                  (Array.isArray(availableBonuses) ? availableBonuses : []).map(
                    (bonus) => (
                      <option key={bonus.id} value={bonus.id}>
                        {bonus.bonus_name}
                      </option>
                    )
                  )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                value={bulkActionAmount}
                onChange={(e) => setBulkActionAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount"
              />
            </div>

            <div className="flex items-end">
              <button
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200"
                onClick={applyBulkAction}
                type="button"
              >
                Apply to Selected
              </button>

              <button
                className="ms-2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200"
                onClick={getExcelData}
                type="button"
              >
                Download Excel
              </button>

              <button
                className="ms-2 py-2 px-4 bg-green-300 hover:bg-green-400 text-black font-medium rounded-lg transition duration-200"
                onClick={() => setIsImportModalOpen(true)}
                type="button"
              >
                Import Excel
              </button>

              {isImportModalOpen && (
                <ImportExcelModal
                  isOpen={isImportModalOpen}
                  onClose={() => {
                    setIsImportModalOpen(false);
                    setImportSuccessMessage("");
                  }}
                  onSuccess={handleImportSuccess}
                  onImport={handleImportExcel}
                />
              )}

              {importSuccessMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                  {importSuccessMessage}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="text-gray-600 hover:text-gray-800 font-medium"
              onClick={() => {
                setSelectedEmployees([]);
                setSelectAll(false);
              }}
              type="button"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!isLoading && processedDisplayedData.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All Employees
            </span>
          </div>

          {processedDisplayedData.map((employee) => (
            <EmployeeSalaryCard
              key={employee.id}
              employee={employee}
              empId={String(employee.id)}
              isSelected={selectedEmployees.includes(String(employee.id))}
              onSelect={() => handleSelectEmployee(employee)}
            />
          ))}
        </div>
      )}

      {!isLoading && processedDisplayedData.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow text-center">
          <div className="mx-auto max-w-md">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No employees found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Apply filters (company/month/year) and load data
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={resetFilter}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryProcessPage;


/*
import { useState, useEffect, useMemo } from "react";
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
  fetchExcelData,
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

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const SalaryProcessPage = () => {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState("Unprocessed");

  const [filteredData, setFilteredData] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  const [availableAllowances, setAvailableAllowances] = useState([]);
  const [availableDeductions, setAvailableDeductions] = useState([]);
  const [isLoadingAllowances, setIsLoadingAllowances] = useState(false);

  const [kpiType, setKpiType] = useState("");

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [bulkActionType, setBulkActionType] = useState("allowance");
  const [bulkActionAmount, setBulkActionAmount] = useState("");
  const [bulkActionId, setBulkActionId] = useState("");

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState("");

  const [availableBonuses, setAvailableBonuses] = useState([]);
  const [isLoadingBonuses, setIsLoadingBonuses] = useState(false);

  const [statusInfo, setStatusInfo] = useState({
    processUser: "Admin",
    lastProcessDate: "2025-05-30",
  });

  const [employeeData, setEmployeeData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);

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

  const parseJsonField = (value, fallback) => {
    if (value == null) return fallback;

    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (error) {
        return fallback;
      }
    }

    return value;
  };

  const normalizeNamedItems = (items, type) => {
    if (!Array.isArray(items)) return [];

    return items.map((item) => ({
      ...item,
      name:
        item?.name ||
        item?.[`${type}_name`] ||
        item?.title ||
        type.charAt(0).toUpperCase() + type.slice(1),
      code: item?.code || item?.[`${type}_code`] || "-",
      amount: Number(item?.amount || 0),
    }));
  };

  const normalizeEmployee = (emp) => {
    const allowances = parseJsonField(emp?.allowances, []);
    const bonuses = parseJsonField(emp?.bonuses, []);
    const deductions = parseJsonField(emp?.deductions, []);
    const salaryBreakdown = parseJsonField(emp?.salary_breakdown, {});

    return {
      ...emp,
      allowances: normalizeNamedItems(allowances, "allowance"),
      bonuses: normalizeNamedItems(bonuses, "bonus"),
      deductions: normalizeNamedItems(deductions, "deduction"),
      salary_breakdown:
        salaryBreakdown && typeof salaryBreakdown === "object"
          ? salaryBreakdown
          : {},
    };
  };

  const processedDisplayedData = useMemo(() => {
    let rows = Array.isArray(displayedData) ? [...displayedData] : [];

    if (activeFilter === "EPF") {
      rows = rows.filter((emp) => !!emp.enable_epf_etf);
    } else if (activeFilter === "NonEPF") {
      rows = rows.filter((emp) => !emp.enable_epf_etf);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      rows = rows.filter(
        (emp) =>
          String(emp?.emp_no || "").toLowerCase().includes(q) ||
          String(emp?.employee_no || "").toLowerCase().includes(q) ||
          String(emp?.full_name || "").toLowerCase().includes(q)
      );
    }

    return rows;
  }, [displayedData, activeFilter, searchTerm]);

  const totalSalary = processedDisplayedData.reduce(
    (sum, emp) => sum + (parseFloat(emp?.basic_salary) || 0),
    0
  );

  const employeeCount = processedDisplayedData.length;

  const loadAllowancesAndDeductions = async () => {
    setIsLoadingAllowances(true);
    try {
      const allowances = await AllowancesService.getAllAllowances();
      setAvailableAllowances(allowances || []);

      const deductions =
        await DeductionService.fetchDeductionsByCompanyOrDepartment();
      setAvailableDeductions(deductions || []);
    } catch (error) {
      console.error("Error loading allowances and deductions:", error);
    } finally {
      setIsLoadingAllowances(false);
    }
  };

  const loadAllowancesByCompany = async (companyId) => {
    setIsLoadingAllowances(true);
    try {
      const allowances =
        await AllowancesService.getAllowancesByCompanyOrDepartment(
          companyId,
          null
        );
      setAvailableAllowances(allowances || []);
    } catch (error) {
      console.error("Error loading allowances by company:", error);
    } finally {
      setIsLoadingAllowances(false);
    }
  };

  const handleImportExcel = async (file) => {
    try {
      const response = await importExcelData(file);
      setImportSuccessMessage(
        response.message || "Employee allowances imported successfully"
      );
      notify.success("Imported", "Employee allowances imported successfully");
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
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      setAvailableBonuses(list);
    } catch (error) {
      console.error("Error loading bonuses:", error);
      setAvailableBonuses([]);
    } finally {
      setIsLoadingBonuses(false);
    }
  };

  const loadBonusesByCompanyOrDepartment = async (companyId, departmentId) => {
    setIsLoadingBonuses(true);
    try {
      const res = await BonusService.getBonusesByCompanyOrDepartment(
        companyId,
        departmentId
      );

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      setAvailableBonuses(list);
    } catch (error) {
      console.error("Error loading bonuses by company/department:", error);
      setAvailableBonuses([]);
    } finally {
      setIsLoadingBonuses(false);
    }
  };

  const handleImportSuccess = (message) => {
    setImportSuccessMessage(message);
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
      notify.error("Download Failed", "Failed to download CSV");
    }
  };

  const handleSalaryProcess = async () => {
    setStatus("Processed");
    setStatusInfo((prev) => ({
      ...prev,
      lastProcessDate: new Date().toISOString().split("T")[0],
    }));

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

  const buildPayslipGroups = (emp) => {
    const breakdown = parseJsonField(emp?.salary_breakdown, {});
    const allowances = normalizeNamedItems(
      parseJsonField(emp?.allowances, []),
      "allowance"
    );
    const bonuses = normalizeNamedItems(parseJsonField(emp?.bonuses, []), "bonus");

    const salaryAdvance = Number(emp?.salary_advance || 0);

    const basicEarnings = [
      {
        label: "Basic Salary",
        amount: Number(breakdown.basic_salary || emp?.basic_salary || 0),
      },
      ...allowances.map((a) => ({
        label: a.name || "Allowance",
        amount: Number(a.amount || 0),
      })),
    ].filter((item) => item.amount > 0);

    const basicOnlyDeductions = [
      {
        label: "EPF Deduction (8%)",
        amount: Number(breakdown.epf_employee_deduction || 0),
      },
      {
        label: "Official No Pay Deduction",
        amount: Number(breakdown.no_pay_deduction || 0),
      },
    ].filter((item) => item.amount > 0);

    const bonusSideDeductions = [
      {
        label: "Late Arrival Deduction",
        amount: Number(breakdown.late_deduction_amount || 0),
      },
      {
        label: "Half Day Deduction",
        amount: Number(breakdown.half_day_deduction || 0),
      },
      {
        label: "Loan Installment / Interest",
        amount: Number(breakdown.loan_installment || 0),
      },
      {
        label: "Salary Advance",
        amount: salaryAdvance,
      },
    ].filter((item) => item.amount > 0);

    const bonusEarnings = [
      ...bonuses.map((b) => ({
        label: b.name || "Bonus",
        amount: Number(b.amount || 0),
      })),
      {
        label: "KPI Allowance",
        amount: Number(breakdown.kpi_allowance || 0),
      },
      {
        label: "KPI Bonus (6M)",
        amount: Number(breakdown.kpi_bonus_allowance || 0),
      },
    ].filter((item) => item.amount > 0);

    const hasBonus = bonusEarnings.length > 0;

    return {
      basicPayslip: {
        title: "BASIC + ALLOWANCES PAYSLIP",
        paymentMethod: "Bank Transfer",
        earnings: basicEarnings,
        deductions: hasBonus
          ? basicOnlyDeductions
          : [...basicOnlyDeductions, ...bonusSideDeductions],
      },
      bonusPayslip: {
        title: "BONUS PAYSLIP",
        paymentMethod: "Cash",
        earnings: bonusEarnings,
        deductions: hasBonus ? bonusSideDeductions : [],
      },
      overtimePayslip: {
        title: "OVERTIME PAYSLIP",
        paymentMethod: "Separate Payment",
        earnings: [
          {
            label: "Morning OT",
            amount: Number(breakdown.ot_morning_fees || 0),
          },
          {
            label: "Evening OT",
            amount: Number(breakdown.ot_night_fees || 0),
          },
          {
            label: "Holiday OT",
            amount: Number(breakdown.holiday_ot_fees || 0),
          },
        ].filter((item) => item.amount > 0),
        deductions: [],
      },
      hasBonus,
    };
  };

  const generateSinglePayslipPDF = (
    doc,
    emp,
    payslip,
    monthName,
    selectedYear,
    isFirstPage = false
  ) => {
    if (!isFirstPage) doc.addPage();

    const earningsTotal = (payslip.earnings || []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const deductionsTotal = (payslip.deductions || []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const netTotal = earningsTotal - deductionsTotal;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${emp.company_name || "Company"}`, 105, 15, { align: "center" });
    doc.text(`${payslip.title}`, 105, 22, { align: "center" });
    doc.text(`${monthName} ${selectedYear}`, 105, 29, { align: "center" });
    doc.text(`Payment Method: ${payslip.paymentMethod}`, 105, 36, {
      align: "center",
    });
    doc.rect(10, 8, 190, 34);

    let y = 50;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Employee No :`, 15, y);
    doc.text(`${emp.employee_no || emp.emp_no || "N/A"}`, 60, y);
    y += 6;

    doc.text(`Name :`, 15, y);
    doc.text(`${emp.full_name || "N/A"}`, 60, y);
    y += 6;

    doc.text(`Department :`, 15, y);
    doc.text(`${emp.department_name || "N/A"}`, 60, y);
    y += 6;

    if (payslip.paymentMethod === "Bank Transfer") {
      doc.text(`Bank :`, 15, y);
      doc.text(`${emp.compensation?.bank_name || "N/A"}`, 60, y);
      y += 6;

      doc.text(`Branch :`, 15, y);
      doc.text(`${emp.compensation?.branch_name || "N/A"}`, 60, y);
      y += 6;

      doc.text(`Account No :`, 15, y);
      doc.text(`${emp.compensation?.bank_account_no || "N/A"}`, 60, y);
      y += 8;
    } else {
      y += 4;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Earnings", 15, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    if ((payslip.earnings || []).length > 0) {
      payslip.earnings.forEach((item) => {
        doc.text(item.label, 15, y);
        doc.text(formatMoney(item.amount), 170, y, { align: "right" });
        y += 6;
      });
    } else {
      doc.text("No earnings", 15, y);
      y += 6;
    }

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Deductions", 15, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    if ((payslip.deductions || []).length > 0) {
      payslip.deductions.forEach((item) => {
        doc.text(item.label, 15, y);
        doc.text(formatMoney(item.amount), 170, y, { align: "right" });
        y += 6;
      });
    } else {
      doc.text("No deductions", 15, y);
      y += 6;
    }

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Total Earnings", 15, y);
    doc.text(formatMoney(earningsTotal), 170, y, { align: "right" });
    y += 8;

    doc.text("Total Deductions", 15, y);
    doc.text(formatMoney(deductionsTotal), 170, y, { align: "right" });
    y += 10;

    doc.setFontSize(12);
    doc.text("Net Amount", 15, y);
    doc.text(formatMoney(netTotal), 170, y, { align: "right" });
    y += 12;

    doc.setFontSize(10);
    doc.text("LIFEHRMS", 15, y);
    const currentDate = new Date();
    const formattedDate = `${currentDate
      .getDate()
      .toString()
      .padStart(2, "0")}/${(currentDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${currentDate.getFullYear()}`;
    doc.text(formattedDate, 170, y, { align: "right" });

    doc.rect(10, 45, 190, Math.max(80, y - 38));
  };

  const handleDownloadAllProcessed = async () => {
    try {
      setIsLoading(true);

      if (!month || !year) {
        notify.warning(
          "Missing Filters",
          "Please select month and year before downloading payslips."
        );
        return;
      }

      const sourceData =
        processedDisplayedData && processedDisplayedData.length > 0
          ? processedDisplayedData
          : [];

      if (!sourceData || sourceData.length === 0) {
        notify.info("No Data", "No salary data found for the selected period.");
        return;
      }

      const doc = new jsPDF();
      const monthObj = months.find((m) => m.value === month);
      const monthName = monthObj ? monthObj.label : `${month}`;

      let isFirstPage = true;

      sourceData.forEach((emp) => {
        const { basicPayslip, bonusPayslip, overtimePayslip, hasBonus } =
          buildPayslipGroups(emp);

        generateSinglePayslipPDF(
          doc,
          emp,
          basicPayslip,
          monthName,
          year,
          isFirstPage
        );
        isFirstPage = false;

        if (hasBonus) {
          generateSinglePayslipPDF(
            doc,
            emp,
            bonusPayslip,
            monthName,
            year,
            false
          );
        }

        if ((overtimePayslip.earnings || []).length > 0) {
          generateSinglePayslipPDF(
            doc,
            emp,
            overtimePayslip,
            monthName,
            year,
            false
          );
        }
      });

      doc.save(`payslips_${monthName}_${year}.pdf`);
      notify.success("Success", "Payslips generated successfully!");
    } catch (error) {
      console.error("Error generating payslips:", error);
      notify.error("PDF Error", "Error generating payslips. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEPFFilter = () => setActiveFilter("EPF");
  const handleNonEPFFilter = () => setActiveFilter("NonEPF");
  const handleAllEmployees = () => setActiveFilter("All");

  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const companiesData = await fetchCompanies();
        setCompanies(companiesData || []);
      } catch (error) {
        console.error("Error loading companies:", error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    const loadDepartments = async () => {
      if (selectedCompany) {
        setIsLoadingDepartments(true);
        try {
          const departmentsData = await fetchDepartmentsById(selectedCompany);
          setDepartments(departmentsData || []);
        } catch (error) {
          console.error("Error loading departments:", error);
        } finally {
          setIsLoadingDepartments(false);
        }
      } else {
        setDepartments([]);
        setSelectedDepartment("");
      }
    };
    loadDepartments();
  }, [selectedCompany]);

  useEffect(() => {
    loadAllowancesAndDeductions();
    loadBonuses();
  }, []);

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    setSelectedDepartment("");

    if (companyId) {
      loadAllowancesByCompany(companyId);
      loadBonusesByCompanyOrDepartment(companyId, null);
    } else {
      loadAllowancesAndDeductions();
      loadBonuses();
    }
  };

  const fetchSalaryData = async () => {
    if (!month || !year || !selectedCompany) {
      notify.warning(
        "Missing Filters",
        "Please select company, month, and year before applying filters"
      );
      return null;
    }

    setIsLoading(true);
    try {
      const data = await getSalaryData({
        month,
        year,
        company_id: selectedCompany,
        department_id: selectedDepartment || undefined,
        kpi_type: kpiType || undefined,
      });

      const rows = (data?.data || []).map(normalizeEmployee);

      setEmployeeData(rows);
      setDisplayedData(rows);
      setFilteredData(rows);

      console.log("salary rows", rows);
      console.log("first employee bonuses", rows[0]?.bonuses);
      console.log("first employee allowances", rows[0]?.allowances);
      console.log("first employee breakdown", rows[0]?.salary_breakdown);

      return rows;
    } catch (error) {
      console.error("Error fetching salary data:", error);
      notify.error("Fetch Failed", "Error fetching salary data. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    await fetchSalaryData();
  };

  const resetFilter = () => {
    setActiveFilter("All");
    setEmployeeData([]);
    setDisplayedData([]);
    setFilteredData([]);
    setSelectedCompany("");
    setSelectedDepartment("");
    setMonth("");
    setKpiType("");
    setSearchTerm("");
    setShowHistory(false);
  };

  const handleAllowanceDeductionChange = (id) => {
    const numericId = Number(id);
    setBulkActionId(numericId);

    if (bulkActionType === "allowance") {
      const a = availableAllowances.find((x) => Number(x.id) === numericId);
      if (a?.amount != null) setBulkActionAmount(parseFloat(a.amount).toFixed(2));
    } else if (bulkActionType === "deduction") {
      const d = availableDeductions.find((x) => Number(x.id) === numericId);
      if (d?.amount != null) setBulkActionAmount(parseFloat(d.amount).toFixed(2));
    } else if (bulkActionType === "bonus") {
      const b = availableBonuses.find((x) => Number(x.id) === numericId);
      if (b?.amount != null) setBulkActionAmount(parseFloat(b.amount).toFixed(2));
    }
  };

  const handleSelectEmployee = (employee) => {
    const empId = `${employee.id}`;
    if (selectedEmployees.includes(empId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== empId));
    } else {
      setSelectedEmployees([...selectedEmployees, empId]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      const allEmployeeIds = processedDisplayedData.map(
        (employee) => `${employee.id}`
      );
      setSelectedEmployees(allEmployeeIds);
    }
    setSelectAll(!selectAll);
  };

  const applyBulkAction = async () => {
    if (!bulkActionId || selectedEmployees.length === 0) {
      notify.warning(
        "Missing Data",
        "Please fill all fields and select at least one employee"
      );
      return;
    }

    const payload = {
      selectedEmployees,
      bulkActionId,
      bulkActionType,
      bulkActionAmount: bulkActionAmount || null,
    };

    try {
      await UpdateAllowances(payload);
      notify.success(
        "Success",
        `Successfully applied ${bulkActionType} to ${selectedEmployees.length} employee(s)`
      );

      await fetchSalaryData();

      setSelectedEmployees([]);
      setSelectAll(false);
      setBulkActionAmount("");
    } catch (error) {
      console.log(error);
      notify.error(
        "Error",
        error.response?.data?.message || error.message || "Operation failed"
      );
    }
  };

  const getExcelData = async () => {
    if (!bulkActionId || selectedEmployees.length === 0) {
      notify.warning(
        "Missing Data",
        "Please fill all fields and select at least one employee"
      );
      return;
    }

    const payload = {
      selectedEmployees,
      bulkActionId,
      bulkActionType,
    };

    try {
      const response = await fetchExcelData(payload);
      const [employees, allowances, deductions, bonuses] = response || [];

      const worksheetData = (employees || []).map((employee) => {
        const row = {
          EMPLOYEE_NO: employee.attendance_employee_no,
          NIC: employee.nic,
          "Full Name": employee.full_name,
        };

        if (allowances && allowances.length > 0) {
          allowances.forEach((allowance) => {
            row["Allowance ID"] = allowance.id;
            row["Allowance Name"] = allowance.allowance_name;
            row["Amount (LKR)"] = 0;
          });
        }

        if (deductions && deductions.length > 0) {
          deductions.forEach((deduction) => {
            row["Deduction ID"] = deduction.id;
            row["Deduction Name"] = deduction.deduction_name;
            row["Amount (LKR)"] = 0;
          });
        }

        if (bonuses && bonuses.length > 0) {
          bonuses.forEach((bonus) => {
            row["Bonus ID"] = bonus.id;
            row["Bonus Name"] = bonus.bonus_name;
            row["Amount (LKR)"] = 0;
          });
        }

        return row;
      });

      const csvContent = convertArrayToCSV(worksheetData);

      const filePrefix =
        payload.bulkActionType === "allowance"
          ? "employee_allowances"
          : payload.bulkActionType === "deduction"
          ? "employee_deductions"
          : "employee_bonuses";

      downloadCSV(csvContent, `${filePrefix}_${Date.now()}.csv`);
      notify.success("Download Ready", "Template downloaded successfully");
    } catch (error) {
      console.error("Error generating Excel data:", error);
      notify.error("Failed", "Failed to generate Excel file");
    }
  };

  useEffect(() => {
    const allSelected =
      processedDisplayedData.length > 0 &&
      selectedEmployees.length === processedDisplayedData.length;
    setSelectAll(allSelected);
  }, [selectedEmployees, processedDisplayedData]);

  useEffect(() => {
    setSelectedEmployees([]);
    setSelectAll(false);
  }, [month, selectedCompany, selectedDepartment, kpiType, showHistory]);

  function convertArrayToCSV(data) {
    if (!data || data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map((obj) =>
      headers
        .map((header) => {
          let value = obj[header] !== undefined ? String(obj[header]) : "";
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }

  function downloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function convertToCSV(data) {
    if (!data || data.length === 0) return "";

    const flattenedData = data.map((item) => {
      const flattened = { ...item };

      if (Array.isArray(item.allowances)) {
        flattened.allowances = item.allowances
          .map((a) => `${a.name || a.allowance_name}: ${a.amount}`)
          .join("; ");
      } else {
        flattened.allowances = "";
      }

      if (Array.isArray(item.bonuses)) {
        flattened.bonuses = item.bonuses
          .map((b) => `${b.name || b.bonus_name}: ${b.amount}`)
          .join("; ");
      } else {
        flattened.bonuses = "";
      }

      if (Array.isArray(item.deductions)) {
        flattened.deductions = item.deductions
          .map((d) => `${d.name || d.deduction_name}: ${d.amount}`)
          .join("; ");
      } else {
        flattened.deductions = "";
      }

      if (item.salary_breakdown && typeof item.salary_breakdown === "object") {
        for (const [key, value] of Object.entries(item.salary_breakdown)) {
          flattened[`breakdown_${key}`] = Array.isArray(value)
            ? JSON.stringify(value)
            : value;
        }
        delete flattened.salary_breakdown;
      }

      const yesNoFields = [
        "increment_active",
        "ot_morning",
        "ot_evening",
        "enable_epf_etf",
        "br1",
        "br2",
      ];

      yesNoFields.forEach((field) => {
        if (flattened[field] !== undefined && flattened[field] !== null) {
          flattened[field] = flattened[field] == 1 ? "Yes" : "No";
        }
      });

      return flattened;
    });

    const headerMappings = {
      id: "ID",
      emp_no: "Employee No",
      full_name: "Full Name",
      company_name: "Company",
      department_name: "Department",
      sub_department_name: "Sub Department",
      basic_salary: "Basic Salary",
      increment_active: "Increment Active",
      increment_value: "Increment Value",
      increment_effected_date: "Increment Effective Date",
      ot_morning: "OT Morning",
      ot_evening: "OT Evening",
      enable_epf_etf: "EPF/ETF Enabled",
      br1: "BR1 Allowance",
      br2: "BR2 Allowance",
      ot_morning_rate: "OT Morning Rate",
      ot_night_rate: "OT Night Rate",
      stamp: "Stamp Fee",
      br_status: "BR Status",
      total_loan_amount: "Total Loan Amount",
      installment_count: "Installment Count",
      installment_amount: "Installment Amount",
      approved_no_pay_days: "Approved No-Pay Days",
      allowances: "Allowances",
      bonuses: "Bonuses",
      deductions: "Deductions",
      breakdown_basic_salary: "Basic Salary (Adjusted)",
      breakdown_br_allowance: "BR Allowance",
      breakdown_ot_morning_fees: "OT Morning Fees",
      breakdown_ot_night_fees: "OT Night Fees",
      breakdown_holiday_ot_fees: "Holiday OT Fees",
      breakdown_adjusted_basic: "Adjusted Basic",
      breakdown_per_day_salary: "Per Day Salary",
      breakdown_no_pay_deduction: "No-Pay Deduction",
      breakdown_late_deduction_amount: "Late Deduction",
      breakdown_total_allowances: "Total Allowances",
      breakdown_epf_etf_base: "EPF/ETF Base",
      breakdown_epf_employee_deduction: "EPF Employee Deduction",
      breakdown_epf_employer_contribution: "EPF Employer Contribution",
      breakdown_etf_employer_contribution: "ETF Employer Contribution",
      breakdown_total_fixed_deductions: "Total Fixed Deductions",
      breakdown_loan_installment: "Loan Installment",
      breakdown_gross_salary: "Gross Salary",
      breakdown_kpi_allowance: "KPI Allowance",
      breakdown_kpi_bonus_allowance: "KPI Bonus (6M)",
      breakdown_total_deductions: "Total Deductions",
      breakdown_stamp: "Stamp Fee (Breakdown)",
      breakdown_net_salary: "Net Salary",
      breakdown_late_count_for_policy: "Late Count",
      breakdown_approved_leave_late_count: "Approved Leave Late Count",
      breakdown_no_deduction_late_count: "No Deduction Late Count",
      breakdown_short_leave_count: "Short Leave Count",
      breakdown_half_day_count: "Half Day Count",
      breakdown_deductible_late_count: "Deductible Late Count",
    };

    const headerSet = new Set(Object.keys(flattenedData[0] || {}));
    headerSet.add("breakdown_kpi_allowance");
    headerSet.add("breakdown_kpi_bonus_allowance");
    const headers = Array.from(headerSet);

    const friendlyHeaders = headers.map(
      (header) =>
        headerMappings[header] ||
        header.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );

    const rows = flattenedData.map((obj) =>
      headers
        .map((header) => {
          let value =
            obj[header] !== undefined && obj[header] !== null
              ? String(obj[header])
              : "";

          if (
            header.includes("salary") ||
            header.includes("amount") ||
            header.includes("rate") ||
            header.includes("fee") ||
            header.includes("deduction") ||
            header.includes("contribution")
          ) {
            if (!isNaN(parseFloat(value)) && isFinite(value)) {
              value = parseFloat(value).toFixed(2);
            }
          }

          if (
            value.includes(",") ||
            value.includes('"') ||
            value.includes("\n") ||
            value.includes(";")
          ) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    );

    return [friendlyHeaders.join(","), ...rows].join("\n");
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Salary Processing
        </h1>
        <div className="flex items-center space-x-2">
          <span
            className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm border ${
              status === "Processed"
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
            }`}
          >
            {status === "Processed" ? (
              <CheckCircle className="inline mr-1 h-4 w-4" />
            ) : (
              <AlertCircle className="inline mr-1 h-4 w-4" />
            )}
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl border border-blue-200 p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">
                    Total Salary Cost
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    LKR {totalSalary.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-blue-200 text-blue-700 shadow">
                  <Wallet size={24} strokeWidth={2} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl border border-green-200 p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">
                    Employee Count
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {employeeCount}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-green-200 text-green-700 shadow">
                  <Users size={24} strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow flex flex-wrap gap-4">
            <button
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                activeFilter === "All"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50"
              }`}
              onClick={handleAllEmployees}
              type="button"
            >
              All Employees
            </button>

            <button
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                activeFilter === "EPF"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50"
              }`}
              onClick={handleEPFFilter}
              type="button"
            >
              <Users size={18} strokeWidth={2} />
              EPF Employee
            </button>

            <button
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                activeFilter === "NonEPF"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50"
              }`}
              onClick={handleNonEPFFilter}
              type="button"
            >
              <Users size={18} strokeWidth={2} />
              Non EPF Employee
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow">
            <h3 className="text-base font-semibold text-gray-700 mb-4">
              Filter Employees
            </h3>

            <div className="relative mb-4">
              <label
                htmlFor="search"
                className="block text-xs font-semibold text-gray-500 mb-1"
              >
                Search by ID or Name (UI only)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Enter employee ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-5 mb-4">
              <div className="relative flex-1">
                <label
                  htmlFor="company"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Company
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  {isLoadingCompanies ? (
                    <div className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <select
                      id="company"
                      value={selectedCompany}
                      onChange={handleCompanyChange}
                      className="appearance-none w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    >
                      <option value="">Select Company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                </div>
              </div>

              <div className="relative flex-1">
                <label
                  htmlFor="department"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Department
                </label>
                <div className="relative">
                  <Layers
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  {isLoadingDepartments ? (
                    <div className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <select
                      id="department"
                      value={selectedDepartment}
                      onChange={(e) => {
                        const deptId = e.target.value;
                        setSelectedDepartment(deptId);
                        if (selectedCompany) {
                          loadBonusesByCompanyOrDepartment(
                            selectedCompany,
                            deptId || null
                          );
                        }
                      }}
                      disabled={!selectedCompany}
                      className={`appearance-none w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm ${
                        !selectedCompany ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="">All Departments</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                </div>
              </div>

              <div className="relative flex-1">
                <label
                  htmlFor="month"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Month
                </label>
                <select
                  id="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                >
                  <option value="">Select Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
              </div>

              <div className="relative flex-1">
                <label
                  htmlFor="kpiMode"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  KPI Mode
                </label>
                <select
                  id="kpiMode"
                  value={kpiType}
                  onChange={(e) => setKpiType(e.target.value)}
                  className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                >
                  <option value="">None</option>
                  <option value="monthly">Monthly</option>
                  <option value="6month">6 Month Bonus</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                <p className="mt-1 text-[10px] text-gray-500">
                  Monthly adds to EPF base; 6 Month Bonus adds to gross only
                </p>
              </div>

              <div className="relative flex-1">
                <label
                  htmlFor="year"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                  placeholder="Enter year"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors shadow"
                onClick={applyFilters}
                type="button"
              >
                <Filter size={18} strokeWidth={2} />
                Apply Filters
              </button>

              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-base font-semibold hover:bg-gray-300 transition-colors shadow"
                onClick={resetFilter}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 p-6 shadow h-fit">
          <h3 className="text-base font-semibold text-blue-700 mb-4">
            Process Status
          </h3>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Status</p>
              <div className="flex items-center">
                {status === "Processed" ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                )}
                <p
                  className={`font-semibold text-lg ${
                    status === "Processed"
                      ? "text-green-700"
                      : "text-yellow-700"
                  }`}
                >
                  {status}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                Processed By
              </p>
              <p className="font-semibold text-gray-800">
                {statusInfo.processUser}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                Last Process Date
              </p>
              <p className="font-semibold text-gray-800">
                {statusInfo.lastProcessDate}
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                  status === "Processed"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700 shadow"
                }`}
                onClick={async () => {
                  if (filteredData.length === 0) {
                    notify.info(
                      "No Data",
                      "No data to save. Please apply filters first."
                    );
                    return;
                  }
                  try {
                    const dataWithMonth = filteredData.map((item) => ({
                      ...item,
                      month,
                    }));

                    await saveSalaryData(dataWithMonth);

                    const csvContent = convertToCSV(filteredData);
                    const kpiSuffix = kpiType ? `_${kpiType}` : `_none`;
                    downloadCSV(
                      csvContent,
                      `salary_data${kpiSuffix}_${Date.now()}.csv`
                    );

                    notify.success(
                      "Saved",
                      "Salary data saved and downloaded successfully!"
                    );
                  } catch (error) {
                    console.error("Error saving salary data:", error);
                    notify.error(
                      "Save Failed",
                      error.response?.data?.message || error.message || "Unknown error"
                    );
                  }
                }}
                type="button"
                disabled={filteredData.length === 0}
              >
                <FileText size={18} strokeWidth={2} />
                Save Data
              </button>

              <button
                className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                  status === "Processed"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 shadow"
                }`}
                onClick={handleSalaryProcess}
                disabled={status === "Processed"}
              >
                <FileText size={18} strokeWidth={2} />
                Process Salary
              </button>

              <button
                className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                  status !== "Processed"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700 shadow"
                }`}
                onClick={() => {
                  handleDownloadAllProcessed();
                  handleDownloadCSV();
                }}
                disabled={status !== "Processed"}
              >
                <Download size={18} strokeWidth={2} />
                Download 3 Payslips Per Employee
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedEmployees.length > 0 && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-md mb-8 animate-fadeIn">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Users className="mr-2" size={20} />
            Bulk Actions ({selectedEmployees.length} employees selected)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Action Type
              </label>
              <select
                value={bulkActionType}
                onChange={(e) => {
                  setBulkActionType(e.target.value);
                  setBulkActionAmount("");
                  setBulkActionId("");
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="allowance">Add Allowance</option>
                <option value="deduction">Add Deduction</option>
                <option value="bonus">Add Bonus</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {bulkActionType === "allowance"
                  ? "Allowance Type"
                  : bulkActionType === "deduction"
                  ? "Deduction Type"
                  : "Bonus Type"}
              </label>

              <select
                value={bulkActionId}
                onChange={(e) => handleAllowanceDeductionChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Type</option>

                {bulkActionType === "allowance" &&
                  availableAllowances.map((allowance) => (
                    <option key={allowance.id} value={allowance.id}>
                      {allowance.allowance_name}
                    </option>
                  ))}

                {bulkActionType === "deduction" &&
                  availableDeductions.map((deduction) => (
                    <option key={deduction.id} value={deduction.id}>
                      {deduction.deduction_name}
                    </option>
                  ))}

                {bulkActionType === "bonus" &&
                  (Array.isArray(availableBonuses) ? availableBonuses : []).map(
                    (bonus) => (
                      <option key={bonus.id} value={bonus.id}>
                        {bonus.bonus_name}
                      </option>
                    )
                  )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                value={bulkActionAmount}
                onChange={(e) => setBulkActionAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount"
              />
            </div>

            <div className="flex items-end">
              <button
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200"
                onClick={applyBulkAction}
                type="button"
              >
                Apply to Selected
              </button>

              <button
                className="ms-2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200"
                onClick={getExcelData}
                type="button"
              >
                Download Excel
              </button>

              <button
                className="ms-2 py-2 px-4 bg-green-300 hover:bg-green-400 text-black font-medium rounded-lg transition duration-200"
                onClick={() => setIsImportModalOpen(true)}
                type="button"
              >
                Import Excel
              </button>

              {isImportModalOpen && (
                <ImportExcelModal
                  isOpen={isImportModalOpen}
                  onClose={() => {
                    setIsImportModalOpen(false);
                    setImportSuccessMessage("");
                  }}
                  onSuccess={handleImportSuccess}
                  onImport={handleImportExcel}
                />
              )}

              {importSuccessMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                  {importSuccessMessage}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="text-gray-600 hover:text-gray-800 font-medium"
              onClick={() => {
                setSelectedEmployees([]);
                setSelectAll(false);
              }}
              type="button"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!isLoading && processedDisplayedData.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All Employees
            </span>
          </div>

          {processedDisplayedData.map((employee) => {
            const empId = `${employee.id}`;

            const allowances = Array.isArray(employee.allowances)
              ? employee.allowances
              : [];
            const bonuses = Array.isArray(employee.bonuses) ? employee.bonuses : [];
            const deductions = Array.isArray(employee.deductions)
              ? employee.deductions
              : [];
            const breakdown =
              employee.salary_breakdown &&
              typeof employee.salary_breakdown === "object"
                ? employee.salary_breakdown
                : {};

            const totalAllowances = allowances.reduce(
              (sum, a) => sum + (parseFloat(a.amount) || 0),
              0
            );

            const totalBonuses = bonuses.reduce(
              (sum, b) => sum + (parseFloat(b.amount) || 0),
              0
            );

            const gross = Number(breakdown.gross_salary || 0);
            const net = Number(breakdown.net_salary || 0);
            const totalDeductionBreakdown = Number(breakdown.total_deductions || 0);

            const otMorning = Number(breakdown.ot_morning_fees || 0);
            const otNight = Number(breakdown.ot_night_fees || 0);
            const holidayOt = Number(breakdown.holiday_ot_fees || 0);

            const lateCountForPolicy = Number(breakdown.late_count_for_policy || 0);
            const approvedLeaveLateCount = Number(
              breakdown.approved_leave_late_count || 0
            );
            const noDeductionLateCount = Number(
              breakdown.no_deduction_late_count || 0
            );
            const shortLeaveCount = Number(breakdown.short_leave_count || 0);
            const halfDayCount = Number(breakdown.half_day_count || 0);
            const deductibleLateCount = Number(
              breakdown.deductible_late_count || 0
            );
            const lateDeductionAmount = Number(
              breakdown.late_deduction_amount || 0
            );
            const lateDates = Array.isArray(breakdown.late_dates)
              ? breakdown.late_dates
              : [];



              console.log("CARD EMPLOYEE", {
  id: employee.id,
  emp_no: employee.emp_no,
  full_name: employee.full_name,
  allowances: employee.allowances,
  bonuses: employee.bonuses,
  salary_breakdown: employee.salary_breakdown,
});

            return (
              <div
                key={employee.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(empId)}
                        onChange={() => handleSelectEmployee(employee)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {employee.emp_no} • {employee.full_name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          BR: {employee.br_status}
                        </span>
                        {employee.enable_epf_etf ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                            EPF/ETF
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-100">
                            Non-EPF
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        {employee.company_name} • {employee.department_name}
                        {employee.sub_department_name
                          ? ` (${employee.sub_department_name})`
                          : ""}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Basic:{" "}
                        <span className="font-semibold text-gray-800">
                          {Number(employee.basic_salary || 0).toLocaleString()}
                        </span>
                        {employee.increment_active ? (
                          <span className="ml-2">
                            • Increment: {employee.increment_value} (eff.{" "}
                            {employee.increment_effected_date})
                          </span>
                        ) : (
                          <span className="ml-2">• No increment</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 min-w-[320px]">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="text-[11px] text-gray-500">Gross</div>
                      <div className="text-sm font-bold">{gross.toLocaleString()}</div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="text-[11px] text-gray-500">Allowances</div>
                      <div className="text-sm font-bold">
                        {totalAllowances.toLocaleString()}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-blue-50 p-3">
                      <div className="text-[11px] text-blue-600">Bonuses</div>
                      <div className="text-sm font-bold text-blue-700">
                        {totalBonuses.toLocaleString()}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-red-50 p-3">
                      <div className="text-[11px] text-red-600">Late Deduction</div>
                      <div className="text-sm font-bold text-red-700">
                        {lateDeductionAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="text-[11px] text-gray-500">Deductions</div>
                      <div className="text-sm font-bold text-red-600">
                        {totalDeductionBreakdown.toLocaleString()}
                      </div>
                    </div>

                    <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                      <div className="text-[11px] text-green-700">Net Salary</div>
                      <div className="text-sm font-extrabold text-green-700">
                        {net.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <details className="border-t border-gray-200">
                  <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                    View details (Allowances / Bonuses / Deductions / OT / Breakdown)
                  </summary>

                  <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-bold text-gray-800">
                          Allowances
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {totalAllowances.toLocaleString()}
                        </div>
                      </div>

                      {allowances.length > 0 ? (
                        <div className="space-y-2">
                          {allowances.map((a, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {a.name || a.allowance_name || "Allowance"}{" "}
                                <span className="text-xs text-gray-400">
                                  ({a.code || a.allowance_code || "-"})
                                </span>
                              </span>
                              <span className="font-semibold">
                                {Number(a.amount || 0).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No allowances</div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-bold text-gray-800">
                          Bonuses
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {totalBonuses.toLocaleString()}
                        </div>
                      </div>

                      {bonuses.length > 0 ? (
                        <div className="space-y-2">
                          {bonuses.map((b, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {b.name || b.bonus_name || "Bonus"}{" "}
                                <span className="text-xs text-gray-400">
                                  ({b.code || b.bonus_code || "-"})
                                </span>
                              </span>
                              <span className="font-semibold">
                                {Number(b.amount || 0).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No bonuses</div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-bold text-gray-800">
                          Deductions
                        </div>
                        <div className="text-sm font-bold text-red-600">
                          {totalDeductionBreakdown.toLocaleString()}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">EPF (Employee 8%)</span>
                          <span className="font-semibold text-red-600">
                            {Number(
                              breakdown.epf_employee_deduction || 0
                            ).toLocaleString()}
                          </span>
                        </div>

                        {deductions.map((d, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {d.name || d.deduction_name || "Deduction"}{" "}
                              <span className="text-xs text-gray-400">
                                ({d.code || d.deduction_code || "-"})
                              </span>
                            </span>
                            <span className="font-semibold text-red-600">
                              {Number(d.amount || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}

                        <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between text-sm font-bold">
                          <span>Total</span>
                          <span className="text-red-600">
                            {totalDeductionBreakdown.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4">
                      <div className="text-sm font-bold text-gray-800 mb-3">
                        OT & Breakdown
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                          <div className="text-[11px] text-gray-500">OT Morning</div>
                          <div className="text-sm font-bold">
                            {otMorning.toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                          <div className="text-[11px] text-gray-500">OT Night</div>
                          <div className="text-sm font-bold">
                            {otNight.toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                          <div className="text-[11px] text-gray-500">Holiday OT</div>
                          <div className="text-sm font-bold">
                            {holidayOt.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Adj. Basic</span>
                          <span className="font-semibold">
                            {Number(breakdown.adjusted_basic || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Per Day</span>
                          <span className="font-semibold">
                            {Number(breakdown.per_day_salary || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">No Pay Deduction</span>
                          <span className="font-semibold text-red-600">
                            {Number(breakdown.no_pay_deduction || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Late Deduction</span>
                          <span className="font-semibold text-red-600">
                            {lateDeductionAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Loan</span>
                          <span className="font-semibold text-red-600">
                            {Number(breakdown.loan_installment || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stamp</span>
                          <span className="font-semibold text-red-600">
                            {Number(breakdown.stamp || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-red-200 p-4 bg-red-50 lg:col-span-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-bold text-red-800">
                          Late Attendance Details
                        </div>
                        <div className="text-sm font-bold text-red-700">
                          {lateDeductionAmount.toLocaleString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                        <div className="rounded-xl border border-red-100 bg-white p-3">
                          <div className="text-[11px] text-gray-500">Late Count</div>
                          <div className="text-sm font-bold">{lateCountForPolicy}</div>
                        </div>

                        <div className="rounded-xl border border-red-100 bg-white p-3">
                          <div className="text-[11px] text-gray-500">
                            Approved Leave Late
                          </div>
                          <div className="text-sm font-bold text-green-700">
                            {approvedLeaveLateCount}
                          </div>
                        </div>

                        <div className="rounded-xl border border-red-100 bg-white p-3">
                          <div className="text-[11px] text-gray-500">No Deduction</div>
                          <div className="text-sm font-bold text-blue-700">
                            {noDeductionLateCount}
                          </div>
                        </div>

                        <div className="rounded-xl border border-red-100 bg-white p-3">
                          <div className="text-[11px] text-gray-500">Short Leave</div>
                          <div className="text-sm font-bold text-orange-700">
                            {shortLeaveCount}
                          </div>
                        </div>

                        <div className="rounded-xl border border-red-100 bg-white p-3">
                          <div className="text-[11px] text-gray-500">Half Day</div>
                          <div className="text-sm font-bold text-red-700">
                            {halfDayCount}
                          </div>
                        </div>

                        <div className="rounded-xl border border-red-100 bg-white p-3">
                          <div className="text-[11px] text-gray-500">Deductible</div>
                          <div className="text-sm font-bold text-red-700">
                            {deductibleLateCount}
                          </div>
                        </div>
                      </div>

                      {lateDates.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-red-100 bg-white">
                          <table className="min-w-full text-sm">
                            <thead className="bg-red-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                  Date
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                  In Time
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                  Late Min
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                  Policy
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                  Leave
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                  Deduction
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {lateDates.map((late, idx) => (
                                <tr key={idx} className="border-t border-gray-100">
                                  <td className="px-3 py-2">{late.date || "-"}</td>
                                  <td className="px-3 py-2">{late.in_time || "-"}</td>
                                  <td className="px-3 py-2">
                                    {late.late_minutes ?? 0}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                        late.policy_action === "No Deduction"
                                          ? "bg-blue-100 text-blue-700"
                                          : late.policy_action === "Short Leave"
                                          ? "bg-orange-100 text-orange-700"
                                          : late.policy_action === "Half Day"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-green-100 text-green-700"
                                      }`}
                                    >
                                      {late.policy_action || "-"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    {late.has_approved_leave ? (
                                      <div className="space-y-1">
                                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                          Approved
                                        </span>
                                        <div className="text-xs text-gray-500">
                                          {late.leave_type || "-"}
                                          {late.is_half_day_leave ? " • Half Day" : ""}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">No</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 font-semibold text-red-600">
                                    {Number(
                                      late.salary_deduction || 0
                                    ).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          No late records for this period
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && processedDisplayedData.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow text-center">
          <div className="mx-auto max-w-md">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No employees found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Apply filters (company/month/year) and load data
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={resetFilter}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryProcessPage;

*/








