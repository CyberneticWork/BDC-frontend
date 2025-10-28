import { useState, useEffect } from "react";
import {
  Download,
  Users,
  Wallet,
  Clock,
  FileText,
  Printer,
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

const SalaryProcessPage = () => {
  // State for filters
  const [location, setLocation] = useState("All Locations");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState("Unprocessed");
  const [filteredData, setFilteredData] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [employeeHistoryData, setEmployeeHistoryData] = useState([]);
  const [showingHistory, setShowingHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New state for companies and departments
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [availableAllowances, setAvailableAllowances] = useState([]);
  const [availableDeductions, setAvailableDeductions] = useState([]);
  const [isLoadingAllowances, setIsLoadingAllowances] = useState(false);
  // KPI Mode state: "" | "monthly" | "6month"
  const [kpiType, setKpiType] = useState("");

  // New state for selected employees
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionType, setBulkActionType] = useState("allowance");
  const [bulkActionAmount, setBulkActionAmount] = useState("");
  const [bulkActionName, setBulkActionName] = useState("");
  const [bulkActionId, setBulkActionId] = useState("");

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState("");

  // Add this function to handle the import
  const handleImportExcel = async (file) => {
    try {
      const response = await importExcelData(file);
      setImportSuccessMessage(
        response.message || "Employee allowances imported successfully"
      );
      // Optionally refresh your data after import
      // await fetchSalaryData();
      notify.success("Imported", "Employee allowances imported successfully");
      return true;
    } catch (error) {
      console.error("Error importing Excel:", error);
      const msg = error.response?.data?.message || "Failed to import file";
      notify.error("Import Failed", msg);
      throw msg;
    }
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

  // Add this success handler
  const handleImportSuccess = (message) => {
    setImportSuccessMessage(message);
    notify.success("Import Successful", message || "Data imported");
    fetchSalaryData();
  };

  // Status information
  const statusInfo = {
    processUser: "Admin",
    lastProcessDate: "2025-05-30",
  };

  const [employeeData, setEmployeeData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const totalSalary = (displayedData || []).reduce(
    (sum, emp) => sum + (parseFloat(emp?.basic_salary) || 0),
    0
  );
  const employeeCount = displayedData.length;

  // Months for dropdowns
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

  // Handle salary process
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
    // Save processed data to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employeeData));
  };

  const handlePrintPayslips = async () => {
    // Get processed data from localStorage
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!data.length) {
      notify.info("No Data", "No processed salary data found.");
    }
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
      const monthName = monthObj ? monthObj.label : ` ${month}`;

      processedData.forEach((emp, idx) => {
        if (idx > 0) doc.addPage();

        // Header
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Company: ${emp.company_name}`, 105, 15, { align: "center" });
        doc.text(`Department: ${emp.department_name}`, 105, 22, {
          align: "center",
        });
        doc.text("Payslip", 105, 29, { align: "center" });
        doc.text(`${monthName} ${year}`, 105, 36, { align: "center" });
        doc.rect(10, 8, 190, 32);

        let y = 50;

        // Employee Info
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`EPF No :`, 15, y);
        doc.text(`${emp.employee_no || "N/A"}`, 60, y);
        y += 6;

        doc.text(`Code :`, 15, y);
        doc.text(`${emp.employee_no || "N/A"}`, 60, y);
        y += 6;

        doc.text(`Name :`, 15, y);
        doc.text(`${emp.full_name || "N/A"}`, 60, y);
        y += 6;

        doc.text(`Bank :`, 15, y);
        doc.text(`${emp.compensation?.bank_name || "N/A"}`, 60, y);
        y += 6;

        doc.text(`Branch :`, 15, y);
        doc.text(`${emp.compensation?.branch_name || "N/A"}`, 60, y);
        y += 6;

        doc.text(`Account No. :`, 15, y);
        doc.text(`${emp.compensation?.bank_account_no || "N/A"}`, 60, y);
        y += 10;

        // Basic Salary
        doc.setFont("helvetica", "bold");
        doc.text(`Basic Salary`, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.basic_salary?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 10;

        // Transactions for EPF
        doc.setFont("helvetica", "normal");
        doc.text(`Transactions for EPF`, 15, y);
        y += 8;

        doc.text(`Allowances`, 15, y);
        y += 6;

        if (emp.allowances && emp.allowances.length > 0) {
          emp.allowances.forEach((allowance) => {
            doc.text(`${allowance.name}`, 15, y);
            doc.text(
              `${parseFloat(allowance.amount || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
              170,
              y,
              { align: "right" }
            );
            y += 6;
          });
        } else {
          doc.text(`BRA1 Act`, 15, y);
          doc.text(
            `${
              emp.salary_breakdown?.br_allowance?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "0.00"
            }`,
            170,
            y,
            { align: "right" }
          );
          y += 6;
        }

        y += 4;

        doc.text(`Nopay Amount`, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.no_pay_deduction?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.text(`Gross for EPF`, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.epf_etf_base?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 10;

        // ✅ OVERTIME SECTION
        doc.setFont("helvetica", "bold");
        doc.text("Overtime Details", 15, y);
        y += 8;
        doc.setFont("helvetica", "normal");

        doc.text(`Morning OT Amount`, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.ot_morning_fees?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 6;

        doc.text(`Evening OT Amount`, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.ot_night_fees?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 8;

        doc.text(`Nopay Amount `, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.no_pay_deduction?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.text(`Gross Salary`, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.gross_salary?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 10;

        // Deductions
        doc.text(`Deductions`, 15, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.text(`EPF - Employee - 8.00%`, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.epf_employee_deduction?.toLocaleString(
              "en-US",
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            ) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 6;

        if (emp.deductions && emp.deductions.length > 0) {
          emp.deductions.forEach((deduction) => {
            doc.text(`${deduction.name}`, 15, y);
            doc.text(
              `${parseFloat(deduction.amount || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
              170,
              y,
              { align: "right" }
            );
            y += 6;
          });
        } else {
          // Default deduction entries
          // doc.text(`Salary Advance`, 15, y);
          // doc.text(`0.00`, 170, y, { align: "right" });
          // y += 6;
          // doc.text(`APIT`, 15, y);
          // doc.text(`0.00`, 170, y, { align: "right" });
          // y += 6;
          doc.text(`Stamp Duty`, 15, y);
          doc.text(
            `${(emp.salary_breakdown?.stamp || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            170,
            y,
            { align: "right" }
          );
          y += 6;
        }

        if (emp.salary_breakdown?.loan_installment) {
          doc.text(`Loan`, 15, y);
          doc.text(
            `${emp.salary_breakdown.loan_installment.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            170,
            y,
            { align: "right" }
          );
          y += 6;
        }

        y += 2;

        doc.setFont("helvetica", "bold");
        doc.text(`Total Deduction`, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.total_deductions?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 10;

        doc.setFontSize(12);
        doc.text(`Net Salary Rs.`, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.net_salary?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 12;

        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text(`Employer Contribution:`, 15, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.text(`EPF - 12.00%`, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.epf_employer_contribution?.toLocaleString(
              "en-US",
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            ) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 6;

        doc.text(`ETF - 3.00%`, 15, y);
        doc.text(
          `${
            emp.salary_breakdown?.etf_employer_contribution?.toLocaleString(
              "en-US",
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            ) || "0.00"
          }`,
          170,
          y,
          { align: "right" }
        );
        y += 6;

        const totalEPF =
          (emp.salary_breakdown?.epf_employee_deduction || 0) +
          (emp.salary_breakdown?.epf_employer_contribution || 0);

        doc.text(`Total EPF`, 15, y);
        doc.text(
          `${totalEPF.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          170,
          y,
          { align: "right" }
        );
        y += 15;

        doc.text(`LIFEHRMS`, 15, y);
        const currentDate = new Date();
        const formattedDate = `${currentDate
          .getDate()
          .toString()
          .padStart(2, "0")}/${(currentDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${currentDate.getFullYear()}`;
        doc.text(formattedDate, 170, y, { align: "right" });

        doc.rect(10, 45, 190, y - 40);
      });

      doc.save(`payslips_${monthName}_${year}.pdf`);

      try {
        await updateSlaryStatus("issued");
        notify.success("Salary Issued", "Salary Issued!");
      } catch (error) {
        notify.error(
          "Issue Update Failed",
          error.response?.data?.message || error.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      notify.error("PDF Error", "Error generating PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle EPF filter
  const handleEPFFilter = () => {
    setActiveFilter("EPF");
    const epfEmployees = employeeData.filter((emp) => emp.enable_epf_etf);
    setDisplayedData(epfEmployees);
  };

  // Handle Non EPF filter
  const handleNonEPFFilter = () => {
    setActiveFilter("NonEPF");
    const nonEPFEmployees = employeeData.filter((emp) => !emp.enable_epf_etf);
    setDisplayedData(nonEPFEmployees);
  };

  // NEW: Handle All Employees (show current fetched dataset)
  const handleAllEmployees = () => {
    setActiveFilter("All");
    if (!employeeData || employeeData.length === 0) {
      notify.info("No Data", "No data loaded yet. Please apply filters first.");
      return;
    }
    setDisplayedData(employeeData);
    setFilteredData(employeeData);
    setSearchTerm("");
  };

  // Fetch companies on component mount
  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const companiesData = await fetchCompanies();
        setCompanies(companiesData);
      } catch (error) {
        console.error("Error loading companies:", error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, []);

  // Fetch departments when company is selected
  useEffect(() => {
    const loadDepartments = async () => {
      if (selectedCompany) {
        setIsLoadingDepartments(true);
        try {
          const departmentsData = await fetchDepartmentsById(selectedCompany);
          setDepartments(departmentsData);
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

  // Fetch salary data when Apply Filters is clicked
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
      setEmployeeData(data.data);
      setDisplayedData(data.data);
      setFilteredData(data.data);
      return data.data; // Return the data
    } catch (error) {
      console.error("Error fetching salary data:", error);
      notify.error(
        "Fetch Failed",
        "Error fetching salary data. Please try again."
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  const applyFilters = async () => {
    const newData = await fetchSalaryData(); // Get the new data directly
    if (!newData) return; // Handle error case

    let filtered = newData; // Use the newly returned data instead of employeeData

    if (activeFilter === "EPF") {
      filtered = filtered.filter((emp) => emp.enable_epf_etf);
    } else if (activeFilter === "NonEPF") {
      filtered = filtered.filter((emp) => !emp.enable_epf_etf);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.emp_no.toString().includes(term) ||
          emp.full_name.toLowerCase().includes(term)
      );
    }

    setDisplayedData(filtered);
    setFilteredData(filtered);
  };

  // Reset filter function
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
    setFromDate("");
    setToDate("");
    setShowHistory(false);
    setEmployeeHistoryData([]);
    setShowingHistory(false);
  };

  // Add this function to load allowances by company
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

  // Add this useEffect to load allowances and deductions when the component mounts
  useEffect(() => {
    const loadAllowancesAndDeductions = async () => {
      setIsLoadingAllowances(true);
      try {
        // Get all allowances
        const allowances = await AllowancesService.getAllAllowances();
        setAvailableAllowances(allowances || []);

        // Get all deductions
        const deductions =
          await DeductionService.fetchDeductionsByCompanyOrDepartment();
        setAvailableDeductions(deductions || []);
      } catch (error) {
        console.error("Error loading allowances and deductions:", error);
      } finally {
        setIsLoadingAllowances(false);
      }
    };

    loadAllowancesAndDeductions();
  }, []);

  // Add this function to your SalaryProcessPage component
  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    setSelectedDepartment("");

    // If a company is selected, fetch its allowances
    if (companyId) {
      loadAllowancesByCompany(companyId);
    } else {
      // If no company is selected, load all allowances
      loadAllowancesAndDeductions();
    }
  };

  // Handle selection of allowance or deduction and auto-fill amount
  const handleAllowanceDeductionChange = (id) => {
    // Set the selected action ID
    setBulkActionId(id);

    // Find the selected allowance or deduction to get its amount
    if (bulkActionType === "allowance") {
      const selectedAllowance = availableAllowances.find(
        (allowance) => allowance.id === id
      );
      if (selectedAllowance && selectedAllowance.amount) {
        // Convert to number and format to 2 decimal places if needed
        const amount = parseFloat(selectedAllowance.amount).toFixed(2);
        setBulkActionAmount(amount);
      }
    } else {
      const selectedDeduction = availableDeductions.find(
        (deduction) => deduction.id === id
      );
      if (selectedDeduction && selectedDeduction.amount) {
        // Convert to number and format to 2 decimal places if needed
        const amount = parseFloat(selectedDeduction.amount).toFixed(2);
        setBulkActionAmount(amount);
      }
    }
  };

  // Handle checkbox selection
  const handleSelectEmployee = (employee) => {
    const empId = `${employee.id}`;
    if (selectedEmployees.includes(empId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== empId));
    } else {
      setSelectedEmployees([...selectedEmployees, empId]);
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
      selectedEmployees: selectedEmployees,
      bulkActionId: bulkActionId,
      bulkActionType: bulkActionType,
    };

    try {
      const response = await fetchExcelData(payload);
      console.log(JSON.stringify(response));

      // Process the response data - now contains [employees, allowances, deductions]
      const [employees, allowances, deductions] = response;

      // Create worksheet data
      const worksheetData = employees.map((employee) => {
        const row = {
          // ID: employee.id,
          EMPLOYEE_NO: employee.attendance_employee_no,
          NIC: employee.nic,
          "Full Name": employee.full_name,
        };

        // Add allowance columns if they exist
        if (allowances && allowances.length > 0) {
          allowances.forEach((allowance) => {
            row[`Allowance ID`] = allowance.id;
            row[`Allowance Name`] = allowance.allowance_name;
            row[`Amount (LKR)`] = 0; // Default amount
          });
        }

        // Add deduction columns if they exist
        if (deductions && deductions.length > 0) {
          deductions.forEach((deduction) => {
            row[`Deduction ID`] = deduction.id;
            row[`Deduction Name`] = deduction.deduction_name;
            row[`Amount (LKR)`] = 0; // Default amount
          });
        }

        return row;
      });

      // Convert to CSV
      const csvContent = convertArrayToCSV(worksheetData);

      // Create appropriate filename based on type
      const filePrefix =
        payload.bulkActionType === "allowance"
          ? "employee_allowances"
          : "employee_deductions";

      // Download the file
      downloadCSV(csvContent, `${filePrefix}_${Date.now()}.csv`);
      notify.success("Download Ready", "Template downloaded successfully");
    } catch (error) {
      console.error("Error generating Excel data:", error);
      notify.error("Failed", "Failed to generate Excel file");
    }
  };

  // Helper function to convert array to CSV
  function convertArrayToCSV(data) {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const rows = data.map((obj) =>
      headers
        .map((header) => {
          let value = obj[header] !== undefined ? String(obj[header]) : "";
          if (
            value.includes(",") ||
            value.includes('"') ||
            value.includes("\n")
          ) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    );

    return [headers.join(","), ...rows].join("\n");
  }

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      const allEmployeeIds = displayedData.map((employee) => `${employee.id}`);
      setSelectedEmployees(allEmployeeIds);
    }
    setSelectAll(!selectAll);
  };

  // Apply bulk action to selected employees
  const applyBulkAction = async () => {
    if (!bulkActionId || selectedEmployees.length === 0) {
      notify.warning(
        "Missing Data",
        "Please fill all fields and select at least one employee"
      );
      return;
    }

    const payload = {
      selectedEmployees: selectedEmployees,
      bulkActionId: bulkActionId,
      bulkActionType: bulkActionType,
      bulkActionAmount: bulkActionAmount || null,
    };

    try {
      const res = await UpdateAllowances(payload);
      console.log(JSON.stringify(res));
      notify.success(
        "Success",
        `Successfully applied ${bulkActionType} to ${selectedEmployees.length} employee(s)`
      );
      // Refresh data after bulk action
      await fetchSalaryData();

      // Clear selection after applying
      setSelectedEmployees([]);
      setSelectAll(false);
      setShowBulkActions(false);
      setBulkActionAmount("");
      setBulkActionName("");
    } catch (error) {
      console.log(error);
      notify.error(
        "Error",
        error.response?.data?.message || error.message || "Operation failed"
      );
    }
  };

  // Effect to check if we should show the select all as checked
  useEffect(() => {
    const allSelected =
      displayedData.length > 0 &&
      selectedEmployees.length === displayedData.length;
    setSelectAll(allSelected);
  }, [selectedEmployees, displayedData]);

  // Reset selected employees when filters change
  useEffect(() => {
    setSelectedEmployees([]);
    setSelectAll(false);
  }, [searchTerm, location, month, activeFilter, showHistory]);

  // Convert array of objects to CSV string, flattening salary_breakdown
  function convertToCSV(data) {
    if (data.length === 0) return "";

    // Flatten each object to include salary_breakdown properties
    const flattenedData = data.map((item) => {
      const flattened = { ...item };

      // Process allowances array
      if (Array.isArray(item.allowances)) {
        flattened.allowances = item.allowances
          .map((a) => `${a.name}: $${a.amount}`)
          .join("; ");
      } else {
        flattened.allowances = "";
      }

      // Process deductions array
      if (Array.isArray(item.deductions)) {
        flattened.deductions = item.deductions
          .map((d) => `${d.name}: $${d.amount}`)
          .join("; ");
      } else {
        flattened.deductions = "";
      }

      // If salary_breakdown exists, flatten its properties
      if (item.salary_breakdown && typeof item.salary_breakdown === "object") {
        for (const [key, value] of Object.entries(item.salary_breakdown)) {
          flattened[`breakdown_${key}`] = value;
        }
        delete flattened.salary_breakdown;
      }

      // Convert boolean/flag values to Yes/No
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

    // Create user-friendly header mappings
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
      deductions: "Deductions",
      breakdown_basic_salary: "Basic Salary (Adjusted)",
      breakdown_br_allowance: "BR Allowance",
      breakdown_ot_morning_fees: "OT Morning Fees",
      breakdown_ot_night_fees: "OT Night Fees",
      breakdown_adjusted_basic: "Adjusted Basic",
      breakdown_per_day_salary: "Per Day Salary",
      breakdown_no_pay_deduction: "No-Pay Deduction",
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
    };

  // Extract headers from the first flattened object
  const headerSet = new Set(Object.keys(flattenedData[0]));
  // Ensure KPI fields are present even if not in the first row
  headerSet.add("breakdown_kpi_allowance");
  headerSet.add("breakdown_kpi_bonus_allowance");
  const headers = Array.from(headerSet);

    // Create user-friendly headers
    const friendlyHeaders = headers.map(
      (header) =>
        headerMappings[header] ||
        header.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );

    // Create CSV rows
    const rows = flattenedData.map((obj) =>
      headers
        .map((header) => {
          // Handle null/undefined values
          let value =
            obj[header] !== undefined && obj[header] !== null
              ? String(obj[header])
              : "";

          // Format currency values
          if (
            header.includes("salary") ||
            header.includes("amount") ||
            header.includes("rate") ||
            header.includes("fee") ||
            header.includes("deduction") ||
            header.includes("contribution")
          ) {
            // Check if it's already formatted or is a textual description
            if (!isNaN(parseFloat(value)) && isFinite(value)) {
              value = parseFloat(value).toFixed(2);
            }
          }

          // Escape quotes and wrap in quotes if contains comma or special characters
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

  // Trigger CSV download
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

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Salary Processing
        </h1>
        <div className="flex items-center space-x-2">
          <span
            className={`
            px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm border
            ${
              status === "Processed"
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
            }
          `}
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

      {/* Summary Cards and Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Side - Summary Cards */}
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

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow flex flex-wrap gap-4">
            <button
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors
                ${
                  activeFilter === "All"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50"
                }
              `}
              onClick={handleAllEmployees} // changed from resetFilter
            >
              All Employees
            </button>
            <button
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors
                ${
                  activeFilter === "EPF"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50"
                }
              `}
              onClick={handleEPFFilter}
            >
              <Users size={18} strokeWidth={2} />
              EPF Employee
            </button>
            <button
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors
                ${
                  activeFilter === "NonEPF"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50"
                }
              `}
              onClick={handleNonEPFFilter}
            >
              <Users size={18} strokeWidth={2} />
              Non EPF Employee
            </button>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow">
            <h3 className="text-base font-semibold text-gray-700 mb-4">
              Filter Employees
            </h3>

            {/* Search by ID or Name */}
            <div className="relative mb-4">
              <label
                htmlFor="search"
                className="block text-xs font-semibold text-gray-500 mb-1"
              >
                Search by ID or Name
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
                      <option value="">All Companies</option>
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
                      onChange={(e) => setSelectedDepartment(e.target.value)}
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
                  Month {month}
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

              {/* KPI Mode */}
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

        {/* Right Side - Status Card */}
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
                className={`
                  w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors
                  ${
                    status === "Processed"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700 shadow"
                  }
                `}
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
                      month: month,
                    }));

                    const savedData = await saveSalaryData(dataWithMonth);
                    // console.log(JSON.stringify(dataWithMonth));
                    // Convert to CSV and download
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
                      error.response?.data?.message ||
                        error.message ||
                        "Unknown error"
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
                className={`
                  w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors
                  ${
                    status === "Processed"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700 shadow"
                  }
                `}
                onClick={handleSalaryProcess}
                disabled={status === "Processed"}
              >
                <FileText size={18} strokeWidth={2} />
                Process Salary
              </button>
              <button
                className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors
    ${
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
                Download All Processed Payslips
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Panel - Show when employees are selected */}
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
                  setBulkActionName("");
                  setBulkActionAmount("");
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="allowance">Add Allowance</option>
                <option value="deduction">Add Deduction</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {bulkActionType === "allowance"
                  ? "Allowance Type"
                  : "Deduction Type"}
              </label>
              <select
                value={bulkActionId}
                onChange={(e) => handleAllowanceDeductionChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Type</option>
                {bulkActionType === "allowance"
                  ? availableAllowances.map((allowance) => (
                      <option key={allowance.id} value={allowance.id}>
                        {allowance.allowance_name}
                      </option>
                    ))
                  : availableDeductions.map((deduction) => (
                      <option key={deduction.id} value={deduction.id}>
                        {deduction.deduction_name}
                      </option>
                    ))}
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
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Employee Salary Table */}
      {!isLoading && displayedData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    EMP No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Company/Dept
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Salary Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    EPF/ETF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Allowances
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Overtime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Salary Breakdown
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Net Salary
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {displayedData.map((employee) => {
                  const empId = `${employee.id}`;

                  // Calculate totals
                  const totalAllowances =
                    employee.allowances?.reduce(
                      (sum, allowance) =>
                        sum + (parseFloat(allowance.amount) || 0),
                      0
                    ) || 0;

                  const totalDeductions =
                    employee.deductions?.reduce(
                      (sum, deduction) =>
                        sum + (parseFloat(deduction.amount) || 0),
                      0
                    ) || 0;

                  // KPI amounts from backend (if any)
                  const kpiMonthlyAllowance =
                    employee.salary_breakdown?.kpi_allowance || 0;
                  const kpiSixMonthBonus =
                    employee.salary_breakdown?.kpi_bonus_allowance || 0;
                  const hasKpiAllowanceInList = Array.isArray(employee.allowances)
                    ? employee.allowances.some(
                        (a) =>
                          (a?.name || "")
                            .toString()
                            .toLowerCase() === "kpi allowance"
                      )
                    : false;

                  const netSalary =
                    employee.salary_breakdown?.net_salary ||
                    (parseFloat(employee.basic_salary) || 0) +
                      totalAllowances -
                      totalDeductions;

                  return (
                    <tr
                      key={employee.id}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(empId)}
                          onChange={() => handleSelectEmployee(employee)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {employee.emp_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{employee.full_name}</div>
                        <div className="text-xs text-gray-500">
                          ID: {employee.id} | BR: {employee.br_status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">
                          {employee.company_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.department_name}
                          {employee.sub_department_name &&
                            ` (${employee.sub_department_name})`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          Basic:{" "}
                          {parseFloat(
                            employee.basic_salary || 0
                          ).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.increment_active ? (
                            <>
                              Incr: {employee.increment_value} (eff.{" "}
                              {employee.increment_effected_date})
                            </>
                          ) : (
                            "No active increment"
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          OT: {employee.ot_morning ? "Morning" : ""}{" "}
                          {employee.ot_evening ? "Evening" : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{employee.enable_epf_etf ? "Yes" : "No"}</div>
                        {employee.enable_epf_etf && (
                          <div className="text-xs text-gray-500">
                            EPF:{" "}
                            {employee.salary_breakdown?.epf_deduction?.toLocaleString() ||
                              "0"}
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-xs">EPF Cut:</span>
                          <span className="text-red-600">
                            {employee.salary_breakdown?.epf_employee_deduction?.toFixed(
                              2
                            ) || "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs">EPF:</span>
                          <span className="text-yellow-600">
                            {employee.salary_breakdown.epf_employer_contribution.toFixed(
                              2
                            ) || "0"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs">ETF:</span>
                          <span className="text-yellow-600">
                            {employee.salary_breakdown.etf_employer_contribution.toFixed(
                              2
                            ) || "0"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col space-y-1">
                          {employee.allowances?.map((allowance) => (
                            <div
                              key={allowance.id}
                              className="flex justify-between"
                            >
                              <span className="text-xs">
                                {allowance.name} ({allowance.code})
                              </span>
                              <span className="font-medium">
                                {parseFloat(
                                  allowance.amount || 0
                                ).toLocaleString()}
                              </span>
                            </div>
                          ))}
                          {/* Show KPI Allowance if backend provided it but it's not already listed */}
                          {kpiMonthlyAllowance > 0 && !hasKpiAllowanceInList && (
                            <div className="flex justify-between text-blue-700">
                              <span className="text-xs">
                                KPI Allowance <span className="text-[10px] text-gray-500">(EPF base)</span>
                              </span>
                              <span className="font-medium">
                                {Number(kpiMonthlyAllowance).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="font-semibold border-t mt-1 pt-1">
                            Total: {totalAllowances.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col space-y-1">
                          {employee.deductions?.map((deduction) => (
                            <div
                              key={deduction.id}
                              className="flex justify-between"
                            >
                              <span className="text-xs">
                                {deduction.name} ({deduction.code})
                              </span>
                              <span className="font-medium">
                                {parseFloat(
                                  deduction.amount || 0
                                ).toLocaleString()}
                              </span>
                            </div>
                          ))}
                          <div className="font-semibold border-t mt-1 pt-1">
                            Total: {totalDeductions.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs">Morning :</span>
                            <span>
                              {employee.salary_breakdown.ot_morning_fees?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs">Night :</span>
                            <span>
                              {employee.salary_breakdown.ot_night_fees?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {employee.salary_breakdown && (
                          <div className="flex flex-col space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs">Gross:</span>
                              <span>
                                {employee.salary_breakdown.gross_salary?.toLocaleString()}
                              </span>
                            </div>
                            {/* Show KPI Bonus (6M) if provided by backend */}
                            {kpiSixMonthBonus > 0 && (
                              <div className="flex justify-between text-purple-700">
                                <span className="text-xs">KPI Bonus (6M) <span className="text-[10px] text-gray-500">(excluded from EPF base)</span>:</span>
                                <span>
                                  {Number(kpiSixMonthBonus).toLocaleString()}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-xs">Adj. Basic:</span>
                              <span>
                                {employee.salary_breakdown.adjusted_basic?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs">Per Day:</span>
                              <span>
                                {employee.salary_breakdown.per_day_salary?.toLocaleString()}
                              </span>
                            </div>

                            {/* New: show probation over limit days and deduction */}
                            {employee.salary_breakdown
                              .probation_over_limit_days !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-xs">
                                  Probation Over Limit (days):
                                </span>
                                <span>
                                  {Number(
                                    employee.salary_breakdown
                                      .probation_over_limit_days
                                  ).toString()}
                                </span>
                              </div>
                            )}
                            {employee.salary_breakdown.probation_deduction !==
                              undefined && (
                              <div className="flex justify-between">
                                <span className="text-xs">
                                  Probation Deduction:
                                </span>
                                <span>
                                  {Number(
                                    employee.salary_breakdown
                                      .probation_deduction
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between">
                              <span className="text-xs">Loan:</span>
                              <span>
                                {employee.salary_breakdown.loan_installment?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs">No Pay Days:</span>
                              <span>
                                {employee.salary_breakdown.no_pay_deduction ||
                                  "0"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs">Stamp :</span>
                              <span>{employee.stamp || "0"}</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                        <div>{netSalary.toLocaleString()}</div>
                        {employee.salary_breakdown && (
                          <div className="text-xs font-normal text-gray-500">
                            Deductions:{" "}
                            {employee.salary_breakdown.total_deductions?.toLocaleString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayedData.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow text-center">
          <div className="mx-auto max-w-md">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No employees found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={resetFilter}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {displayedData.length > 0 && (
        <div className="flex items-center justify-between bg-white px-8 py-4 rounded-2xl border border-gray-200 shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-5 py-2 border border-gray-300 text-base font-semibold rounded-lg text-gray-700 bg-white hover:bg-blue-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-5 py-2 border border-gray-300 text-base font-semibold rounded-lg text-gray-700 bg-white hover:bg-blue-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-base text-gray-700">
                Showing <span className="font-bold">1</span> to{" "}
                <span className="font-bold">{Math.min(10, employeeCount)}</span>{" "}
                of <span className="font-bold">{employeeCount}</span> results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-base font-semibold text-gray-500 hover:bg-blue-50">
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>
                <button
                  aria-current="page"
                  className="z-10 bg-blue-100 border-blue-500 text-blue-700 relative inline-flex items-center px-5 py-2 border text-base font-bold"
                >
                  1
                </button>
                <button className="bg-white border-gray-300 text-gray-500 hover:bg-blue-50 relative inline-flex items-center px-5 py-2 border text-base font-semibold">
                  2
                </button>
                <button className="bg-white border-gray-300 text-gray-500 hover:bg-blue-50 relative inline-flex items-center px-5 py-2 border text-base font-semibold">
                  3
                </button>
                <button className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-base font-semibold text-gray-500 hover:bg-blue-50">
                  <span className="sr-only">Next</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryProcessPage;
