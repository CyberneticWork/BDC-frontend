import { useState, useEffect } from "react";
import BonusService from "../../components/BonusService";
import {
  Download, Users, Wallet, FileText, ChevronDown,
  Filter, CheckCircle, AlertCircle, Search, Building2, Layers,
} from "lucide-react";
import jsPDF from "jspdf";
import { fetchCompanies, fetchDepartmentsById } from "@services/ApiDataService";
import {
  getSalaryData, UpdateAllowances, saveSalaryData,
  updateSlaryStatus, getProcessedSalaries, fetchExcelData, importExcelData,
} from "@services/SalaryProcessService";
import { fetchSalaryCSV } from "@services/SalaryService";
import AllowancesService from "@services/AllowancesService";
import * as DeductionService from "@services/DeductionService";
import ImportExcelModal from "@dashboard/ImportExcelModal";
import Swal from "sweetalert2";

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "processedSalaryData";

const MONTHS = [
  { value: "01", label: "January"   }, { value: "02", label: "February"  },
  { value: "03", label: "March"     }, { value: "04", label: "April"     },
  { value: "05", label: "May"       }, { value: "06", label: "June"      },
  { value: "07", label: "July"      }, { value: "08", label: "August"    },
  { value: "09", label: "September" }, { value: "10", label: "October"   },
  { value: "11", label: "November"  }, { value: "12", label: "December"  },
];

// ─── Notification helpers ─────────────────────────────────────────────────────

const notify = {
  success: (title, text) => Swal.fire({ icon: "success", title, text, confirmButtonColor: "#3085d6" }),
  error:   (title, text) => Swal.fire({ icon: "error",   title, text, confirmButtonColor: "#d33"    }),
  warning: (title, text) => Swal.fire({ icon: "warning", title, text, confirmButtonColor: "#f59e0b" }),
  info:    (title, text) => Swal.fire({ icon: "info",    title, text, confirmButtonColor: "#3085d6" }),
};

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSVCell(value) {
  let v = value !== undefined && value !== null ? String(value) : "";
  if (v.includes(",") || v.includes('"') || v.includes("\n") || v.includes(";")) {
    v = `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function arrayToCSV(data) {
  if (!data?.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((obj) => headers.map((h) => escapeCSVCell(obj[h])).join(","));
  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), {
    href: url, download: fileName, style: "visibility:hidden",
  });
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const HEADER_MAPPINGS = {
  id: "ID", emp_no: "Employee No", full_name: "Full Name",
  company_name: "Company", department_name: "Department",
  sub_department_name: "Sub Department", basic_salary: "Basic Salary",
  increment_active: "Increment Active", increment_value: "Increment Value",
  increment_effected_date: "Increment Effective Date",
  ot_morning: "OT Morning", ot_evening: "OT Evening",
  enable_epf_etf: "EPF/ETF Enabled", br1: "BR1 Allowance", br2: "BR2 Allowance",
  ot_morning_rate: "OT Morning Rate", ot_night_rate: "OT Night Rate",
  stamp: "Stamp Fee", br_status: "BR Status",
  total_loan_amount: "Total Loan Amount", installment_count: "Installment Count",
  installment_amount: "Installment Amount", approved_no_pay_days: "Approved No-Pay Days",
  allowances: "Allowances", deductions: "Deductions",
  breakdown_basic_salary: "Basic Salary (Adjusted)", breakdown_br_allowance: "BR Allowance",
  breakdown_ot_morning_fees: "OT Morning Fees", breakdown_ot_night_fees: "OT Night Fees",
  breakdown_adjusted_basic: "Adjusted Basic", breakdown_per_day_salary: "Per Day Salary",
  breakdown_no_pay_deduction: "No-Pay Deduction", breakdown_total_allowances: "Total Allowances",
  breakdown_epf_etf_base: "EPF/ETF Base",
  breakdown_epf_employee_deduction: "EPF Employee Deduction",
  breakdown_epf_employer_contribution: "EPF Employer Contribution",
  breakdown_etf_employer_contribution: "ETF Employer Contribution",
  breakdown_total_fixed_deductions: "Total Fixed Deductions",
  breakdown_loan_installment: "Loan Installment", breakdown_gross_salary: "Gross Salary",
  breakdown_kpi_allowance: "KPI Allowance", breakdown_kpi_bonus_allowance: "KPI Bonus (6M)",
  breakdown_total_deductions: "Total Deductions", breakdown_stamp: "Stamp Fee (Breakdown)",
  breakdown_net_salary: "Net Salary",
};

const YES_NO_FIELDS = ["increment_active", "ot_morning", "ot_evening", "enable_epf_etf", "br1", "br2"];
const NUMERIC_KEYS  = ["salary", "amount", "rate", "fee", "deduction", "contribution"];

function convertToCSV(data) {
  if (!data?.length) return "";

  const flattenedData = data.map((item) => {
    const flat = { ...item };

    flat.allowances = Array.isArray(item.allowances)
      ? item.allowances.map((a) => `${a.name}: ${a.amount}`).join("; ") : "";

    flat.deductions = Array.isArray(item.deductions)
      ? item.deductions.map((d) => `${d.name}: ${d.amount}`).join("; ") : "";

    if (item.salary_breakdown && typeof item.salary_breakdown === "object") {
      for (const [k, v] of Object.entries(item.salary_breakdown)) flat[`breakdown_${k}`] = v;
      delete flat.salary_breakdown;
    }

    YES_NO_FIELDS.forEach((f) => {
      if (flat[f] !== undefined && flat[f] !== null) flat[f] = flat[f] == 1 ? "Yes" : "No";
    });

    return flat;
  });

  const headerSet = new Set(Object.keys(flattenedData[0] || {}));
  headerSet.add("breakdown_kpi_allowance");
  headerSet.add("breakdown_kpi_bonus_allowance");
  const headers = Array.from(headerSet);

  const friendlyHeaders = headers.map(
    (h) => HEADER_MAPPINGS[h] || h.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );

  const rows = flattenedData.map((obj) =>
    headers.map((h) => {
      let v = obj[h] !== undefined && obj[h] !== null ? String(obj[h]) : "";
      if (NUMERIC_KEYS.some((k) => h.includes(k)) && !isNaN(parseFloat(v)) && isFinite(v)) {
        v = parseFloat(v).toFixed(2);
      }
      return escapeCSVCell(v);
    }).join(",")
  );

  return [friendlyHeaders.join(","), ...rows].join("\n");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
function StatCard({ label, value, icon: IconComp, colorClass }) {
  return (
    <div className={`bg-gradient-to-br ${colorClass} rounded-2xl border p-6 shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="p-4 rounded-xl shadow">
          <IconComp size={24} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

function FilterButton({ label, active, onClick, icon: IconComp }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors
        ${active ? "bg-blue-600 text-white shadow" : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50"}`}
    >
      {IconComp && <IconComp size={18} strokeWidth={2} />}
      {label}
    </button>
  );
}

function SelectField({ id, label, value, onChange, disabled, children, icon: IconComp }) {
  return (
    <div className="relative flex-1">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <div className="relative">
        {IconComp && <IconComp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`appearance-none w-full ${IconComp ? "pl-10" : "pl-3"} pr-10 py-2 border border-gray-300 rounded-lg text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm
            ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );
}

function EmployeeCard({ employee, isSelected, onSelect }) {
  const totalAllowances = (employee.allowances || []).reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
  const totalBonuses    = (employee.bonuses    || []).reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const gross           = Number(employee.salary_breakdown?.gross_salary   || 0);
  const net             = Number(employee.salary_breakdown?.net_salary      || 0);
  const totalDeductions = Number(employee.salary_breakdown?.total_deductions || 0);
  const otMorning       = Number(employee.salary_breakdown?.ot_morning_fees  || 0);
  const otNight         = Number(employee.salary_breakdown?.ot_night_fees    || 0);
  const holidayOt       = Number(employee.salary_breakdown?.holiday_ot_fees  || 0);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(employee)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {employee.emp_no} • {employee.full_name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                BR: {employee.br_status}
              </span>
              {employee.enable_epf_etf ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">EPF/ETF</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-100">Non-EPF</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {employee.company_name} • {employee.department_name}
              {employee.sub_department_name ? ` (${employee.sub_department_name})` : ""}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Basic: <span className="font-semibold text-gray-800">{Number(employee.basic_salary || 0).toLocaleString()}</span>
              {employee.increment_active
                ? <span className="ml-2">• Increment: {employee.increment_value} (eff. {employee.increment_effected_date})</span>
                : <span className="ml-2">• No increment</span>}
            </div>
          </div>
        </div>

        {/* Summary chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-[320px]">
          {[
            { label: "Gross",        value: gross.toLocaleString(),            cls: "" },
            { label: "Allowances",   value: totalAllowances.toLocaleString(),  cls: "" },
            { label: "Deductions",   value: totalDeductions.toLocaleString(),  cls: "text-red-600" },
            { label: "Net Salary",   value: net.toLocaleString(),              cls: "text-green-700 font-extrabold", border: "border-green-200 bg-green-50" },
          ].map(({ label, value, cls, border }) => (
            <div key={label} className={`rounded-xl border p-3 ${border || "border-gray-200 bg-gray-50"}`}>
              <div className="text-[11px] text-gray-500">{label}</div>
              <div className={`text-sm font-bold ${cls}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable details */}
      <details className="border-t border-gray-200">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
          View details (Allowances / Bonuses / Deductions / OT / Breakdown)
        </summary>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Allowances */}
          <DetailCard title="Allowances" total={totalAllowances.toLocaleString()}>
            {(employee.allowances || []).length > 0
              ? employee.allowances.map((a, i) => (
                  <LineItem key={i} label={`${a.name} (${a.code})`} value={Number(a.amount || 0).toLocaleString()} />
                ))
              : <EmptyRow text="No allowances" />}
          </DetailCard>

          {/* Bonuses */}
          <DetailCard title="Bonuses" total={totalBonuses.toLocaleString()}>
            {(employee.bonuses || []).length > 0
              ? employee.bonuses.map((b, i) => (
                  <LineItem key={i} label={`${b.name} (${b.code})`} value={Number(b.amount || 0).toLocaleString()} />
                ))
              : <EmptyRow text="No bonuses" />}
          </DetailCard>

          {/* Deductions */}
          <DetailCard title="Deductions" total={totalDeductions.toLocaleString()} totalCls="text-red-600">
            <LineItem
              label="EPF (Employee 8%)"
              value={Number(employee.salary_breakdown?.epf_employee_deduction || 0).toLocaleString()}
              valueCls="text-red-600"
            />
            {(employee.deductions || []).map((d, i) => (
              <LineItem key={i} label={`${d.name} (${d.code})`} value={Number(d.amount || 0).toLocaleString()} valueCls="text-red-600" />
            ))}
          </DetailCard>

          {/* OT & Breakdown */}
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="text-sm font-bold text-gray-800 mb-3">OT & Breakdown</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "OT Morning", value: otMorning },
                { label: "OT Night",   value: otNight   },
                { label: "Holiday OT", value: holidayOt },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-[11px] text-gray-500">{label}</div>
                  <div className="text-sm font-bold">{value.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <LineItem label="Adj. Basic"        value={Number(employee.salary_breakdown?.adjusted_basic    || 0).toLocaleString()} />
              <LineItem label="Per Day"            value={Number(employee.salary_breakdown?.per_day_salary   || 0).toLocaleString()} />
              <LineItem label="No Pay Deduction"   value={Number(employee.salary_breakdown?.no_pay_deduction || 0).toLocaleString()} valueCls="text-red-600" />
              <LineItem label="Loan"               value={Number(employee.salary_breakdown?.loan_installment || 0).toLocaleString()} valueCls="text-red-600" />
              <LineItem label="Stamp"              value={Number(employee.salary_breakdown?.stamp            || 0).toLocaleString()} valueCls="text-red-600" />
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

function DetailCard({ title, total, totalCls = "", children }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-gray-800">{title}</div>
        <div className={`text-sm font-bold ${totalCls || "text-gray-900"}`}>{total}</div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function LineItem({ label, value, valueCls = "" }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${valueCls}`}>{value}</span>
    </div>
  );
}

function EmptyRow({ text }) {
  return <div className="text-sm text-gray-500">{text}</div>;
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

function generatePayslipPDF(processedData, monthName, year) {
  const doc = new jsPDF();

  processedData.forEach((emp, idx) => {
    if (idx > 0) doc.addPage();

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Company: ${emp.company_name}`, 105, 15, { align: "center" });
    doc.text(`Department: ${emp.department_name}`, 105, 22, { align: "center" });
    doc.text("Payslip", 105, 29, { align: "center" });
    doc.text(`${monthName} ${year}`, 105, 36, { align: "center" });
    doc.rect(10, 8, 190, 32);

    let y = 50;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const field = (label, val) => { doc.text(`${label} :`, 15, y); doc.text(`${val}`, 60, y); y += 6; };
    field("EPF No",     emp.employee_no || "N/A");
    field("Code",       emp.employee_no || "N/A");
    field("Name",       emp.full_name   || "N/A");
    field("Bank",       emp.compensation?.bank_name       || "N/A");
    field("Branch",     emp.compensation?.branch_name     || "N/A");
    field("Account No", emp.compensation?.bank_account_no || "N/A");
    y += 4;

    const fmt   = (n) => (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const right = (label, val) => {
      doc.text(label, 15, y);
      doc.text(fmt(val), 170, y, { align: "right" });
      y += 6;
    };

    doc.setFont("helvetica", "bold");
    doc.text("Basic Salary", 15, y);
    doc.text(fmt(emp.salary_breakdown?.basic_salary), 170, y, { align: "right" });
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.text("Transactions for EPF", 15, y); y += 8;
    doc.text("Allowances", 15, y); y += 6;

    if (emp.allowances?.length) {
      emp.allowances.forEach((a) => right(a.name, a.amount));
    } else {
      right("BRA1 Act", emp.salary_breakdown?.br_allowance);
    }

    y += 4;
    right("Nopay Amount", emp.salary_breakdown?.no_pay_deduction);
    y += 2;

    doc.setFont("helvetica", "bold");
    right("Gross for EPF", emp.salary_breakdown?.epf_etf_base);
    y += 4;

    doc.text("Overtime Details", 15, y); y += 8;
    doc.setFont("helvetica", "normal");
    right("Morning OT Amount", emp.salary_breakdown?.ot_morning_fees);
    right("Evening OT Amount", emp.salary_breakdown?.ot_night_fees);
    right("Nopay Amount", emp.salary_breakdown?.no_pay_deduction);
    y += 2;

    doc.setFont("helvetica", "bold");
    right("Gross Salary", emp.salary_breakdown?.gross_salary);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.text("Deductions", 15, y); y += 8;
    right("EPF - Employee - 8.00%", emp.salary_breakdown?.epf_employee_deduction);

    if (emp.deductions?.length) {
      emp.deductions.forEach((d) => right(d.name, d.amount));
    } else {
      right("Stamp Duty", emp.salary_breakdown?.stamp);
    }

    if (emp.salary_breakdown?.loan_installment) right("Loan", emp.salary_breakdown.loan_installment);

    y += 2;
    doc.setFont("helvetica", "bold");
    right("Total Deduction", emp.salary_breakdown?.total_deductions);
    y += 4;

    doc.setFontSize(12);
    right("Net Salary Rs.", emp.salary_breakdown?.net_salary);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Employer Contribution:", 15, y); y += 8;
    doc.setFont("helvetica", "normal");
    right("EPF - 12.00%", emp.salary_breakdown?.epf_employer_contribution);
    right("ETF - 3.00%",  emp.salary_breakdown?.etf_employer_contribution);

    const totalEPF = (emp.salary_breakdown?.epf_employee_deduction || 0) + (emp.salary_breakdown?.epf_employer_contribution || 0);
    right("Total EPF", totalEPF);
    y += 9;

    doc.text("LIFEHRMS", 15, y);
    const d = new Date();
    doc.text(`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`, 170, y, { align: "right" });
    doc.rect(10, 45, 190, y - 40);
  });

  return doc;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SalaryProcessPage = () => {
  // Filter state
  const [month,      setMonth]      = useState("");
  const [year,       setYear]       = useState(new Date().getFullYear().toString());
  const [status,     setStatus]     = useState("Unprocessed");
  const [kpiType,    setKpiType]    = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // Companies / Departments
  const [companies,           setCompanies]           = useState([]);
  const [departments,         setDepartments]         = useState([]);
  const [selectedCompany,     setSelectedCompany]     = useState("");
  const [selectedDepartment,  setSelectedDepartment]  = useState("");
  const [isLoadingCompanies,  setIsLoadingCompanies]  = useState(false);
  const [isLoadingDepartments,setIsLoadingDepartments]= useState(false);

  // Allowances / Deductions / Bonuses
  const [availableAllowances, setAvailableAllowances] = useState([]);
  const [availableDeductions, setAvailableDeductions] = useState([]);
  const [availableBonuses,    setAvailableBonuses]    = useState([]);

  // Employee data
  const [employeeData,  setEmployeeData]  = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [filteredData,  setFilteredData]  = useState([]);
  const [isLoading,     setIsLoading]     = useState(false);

  // Bulk actions
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll,         setSelectAll]         = useState(false);
  const [bulkActionType,    setBulkActionType]    = useState("allowance");
  const [bulkActionAmount,  setBulkActionAmount]  = useState("");
  const [bulkActionId,      setBulkActionId]      = useState("");

  // Import modal
  const [isImportModalOpen,   setIsImportModalOpen]   = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState("");

  const statusInfo = { processUser: "Admin", lastProcessDate: "2025-05-30" };

  const totalSalary  = displayedData.reduce((s, e) => s + (parseFloat(e?.basic_salary) || 0), 0);
  const employeeCount = displayedData.length;

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadAllowancesAndDeductions = async () => {
    try {
      const [allowances, deductions] = await Promise.all([
        AllowancesService.getAllAllowances(),
        DeductionService.fetchDeductions(),
      ]);
      setAvailableAllowances(allowances || []);
      setAvailableDeductions(deductions || []);
    } catch (err) {
      console.error("Error loading allowances/deductions:", err);
    }
  };

  const loadAllowancesByCompany = async (companyId) => {
    try {
      const allowances = await AllowancesService.getAllowancesByCompanyOrDepartment(companyId, null);
      setAvailableAllowances(allowances || []);
    } catch (err) {
      console.error("Error loading allowances by company:", err);
    }
  };

  const loadBonuses = async () => {
    try {
      const res  = await BonusService.getAllBonuses();
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
      setAvailableBonuses(list);
    } catch (err) {
      console.error("Error loading bonuses:", err);
      setAvailableBonuses([]);
    }
  };

  const loadBonusesByCompanyOrDepartment = async (companyId, departmentId) => {
    try {
      const res  = await BonusService.getBonusesByCompanyOrDepartment(companyId, departmentId);
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
      setAvailableBonuses(list);
    } catch (err) {
      console.error("Error loading bonuses by company/dept:", err);
      setAvailableBonuses([]);
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
        month, year,
        company_id:    selectedCompany,
        department_id: selectedDepartment || undefined,
        kpi_type:      kpiType            || undefined,
        search:        searchTerm         || undefined,
      });
      const rows = data?.data || [];
      setEmployeeData(rows);
      return rows;
    } catch (err) {
      console.error("Error fetching salary data:", err);
      notify.error("Fetch Failed", "Error fetching salary data. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setIsLoadingCompanies(true);
      try { setCompanies((await fetchCompanies()) || []); }
      catch (e) { console.error(e); }
      finally { setIsLoadingCompanies(false); }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!selectedCompany) { setDepartments([]); setSelectedDepartment(""); return; }
      setIsLoadingDepartments(true);
      try { setDepartments((await fetchDepartmentsById(selectedCompany)) || []); }
      catch (e) { console.error(e); }
      finally { setIsLoadingDepartments(false); }
    };
    load();
  }, [selectedCompany]);

  useEffect(() => {
    loadAllowancesAndDeductions();
    loadBonuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let dataToFilter = [...employeeData];
    if (activeFilter === "EPF") {
      dataToFilter = dataToFilter.filter(emp => emp.enable_epf_etf == 1);
    } else if (activeFilter === "NonEPF") {
      dataToFilter = dataToFilter.filter(emp => emp.enable_epf_etf != 1);
    }
    setDisplayedData(dataToFilter);
    setFilteredData(dataToFilter); // Keep filteredData in sync for handleSaveData
  }, [activeFilter, employeeData]);

  useEffect(() => {
    setSelectAll(displayedData.length > 0 && selectedEmployees.length === displayedData.length);
  }, [selectedEmployees, displayedData]);

  useEffect(() => {
    setSelectedEmployees([]);
    setSelectAll(false);
  }, [month, selectedCompany, selectedDepartment, kpiType]);

  // ── Event handlers ──────────────────────────────────────────────────────────

  const handleCompanyChange = (e) => {
    const id = e.target.value;
    setSelectedCompany(id);
    setSelectedDepartment("");
    if (id) { loadAllowancesByCompany(id); loadBonusesByCompanyOrDepartment(id, null); }
    else     { loadAllowancesAndDeductions(); loadBonuses(); }
  };

  const handleDepartmentChange = (e) => {
    const id = e.target.value;
    setSelectedDepartment(id);
    if (selectedCompany) loadBonusesByCompanyOrDepartment(selectedCompany, id || null);
  };

  const handleSelectEmployee = (employee) => {
    const id = `${employee.id}`;
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedEmployees(selectAll ? [] : displayedData.map((e) => `${e.id}`));
    setSelectAll(!selectAll);
  };

  const handleAllowanceDeductionChange = (id) => {
    const numericId = Number(id);
    setBulkActionId(numericId);
    const lookup =
      bulkActionType === "allowance" ? availableAllowances :
      bulkActionType === "deduction" ? availableDeductions  : availableBonuses;
    const found = lookup.find((x) => Number(x.id) === numericId);
    if (found?.amount != null) setBulkActionAmount(parseFloat(found.amount).toFixed(2));
  };

  const applyFilters = () => fetchSalaryData();

  const resetFilter = () => {
    setActiveFilter("All");
    setEmployeeData([]); setDisplayedData([]); setFilteredData([]);
    setSelectedCompany(""); setSelectedDepartment("");
    setMonth(""); setKpiType(""); setSearchTerm("");
  };

  const applyBulkAction = async () => {
    if (!bulkActionId || !selectedEmployees.length) {
      notify.warning("Missing Data", "Please fill all fields and select at least one employee");
      return;
    }
    try {
      await UpdateAllowances({ selectedEmployees, bulkActionId, bulkActionType, bulkActionAmount: bulkActionAmount || null });
      notify.success("Success", `Successfully applied ${bulkActionType} to ${selectedEmployees.length} employee(s)`);
      await fetchSalaryData();
      setSelectedEmployees([]); setSelectAll(false); setBulkActionAmount("");
    } catch (err) {
      notify.error("Error", err.response?.data?.message || err.message || "Operation failed");
    }
  };

  const getExcelData = async () => {
    if (!bulkActionId || !selectedEmployees.length) {
      notify.warning("Missing Data", "Please fill all fields and select at least one employee");
      return;
    }
    try {
      const response = await fetchExcelData({ selectedEmployees, bulkActionId, bulkActionType });
      const [employees, allowances, deductions, bonuses] = response || [];

      const worksheetData = (employees || []).map((emp) => {
        const row = { EMPLOYEE_NO: emp.attendance_employee_no, NIC: emp.nic, "Full Name": emp.full_name };
        allowances?.forEach((a) => { row["Allowance ID"] = a.id; row["Allowance Name"] = a.allowance_name; row["Amount (LKR)"] = 0; });
        deductions?.forEach((d) => { row["Deduction ID"] = d.id; row["Deduction Name"] = d.deduction_name; row["Amount (LKR)"] = 0; });
        bonuses?.forEach((b)    => { row["Bonus ID"]     = b.id; row["Bonus Name"]     = b.bonus_name;     row["Amount (LKR)"] = 0; });
        return row;
      });

      const prefix = bulkActionType === "allowance" ? "employee_allowances"
                   : bulkActionType === "deduction" ? "employee_deductions" : "employee_bonuses";
      downloadCSV(arrayToCSV(worksheetData), `${prefix}_${Date.now()}.csv`);
      notify.success("Download Ready", "Template downloaded successfully");
    } catch (err) {
      console.error(err);
      notify.error("Failed", "Failed to generate Excel file");
    }
  };

  const handleImportExcel = async (file) => {
    try {
      const res = await importExcelData(file);
      setImportSuccessMessage(res.message || "Employee allowances imported successfully");
      notify.success("Imported", "Employee allowances imported successfully");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to import file";
      notify.error("Import Failed", msg);
      throw msg;
    }
  };

  const handleImportSuccess = (message) => {
    setImportSuccessMessage(message);
    notify.success("Import Successful", message || "Data imported");
    fetchSalaryData();
  };

  const handleSalaryProcess = async () => {
    setStatus("Processed");
    statusInfo.lastProcessDate = new Date().toISOString().split("T")[0];
    try {
      await updateSlaryStatus("processed");
      notify.success("Status Updated", "Salary status updated!");
      window.dispatchEvent(new CustomEvent("salaryUpdated"));
    } catch (err) {
      notify.error("Update Failed", err.response?.data?.message || err.message || "Unknown error");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employeeData));
  };

  const handleSaveData = async () => {
    if (!filteredData.length) { notify.info("No Data", "No data to save. Please apply filters first."); return; }
    try {
      await saveSalaryData(filteredData.map((item) => ({ ...item, month })));
      const kpiSuffix = kpiType ? `_${kpiType}` : "_none";
      downloadCSV(convertToCSV(filteredData), `salary_data${kpiSuffix}_${Date.now()}.csv`);
      notify.success("Saved", "Salary data saved and downloaded successfully!");
    } catch (err) {
      notify.error("Save Failed", err.response?.data?.message || err.message || "Unknown error");
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const blob = await fetchSalaryCSV();
      const url  = window.URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), { href: url, download: "salary_records.csv" });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download CSV");
    }
  };

  const handleDownloadAllProcessed = async () => {
    setIsLoading(true);
    try {
      const processedData = await getProcessedSalaries();
      if (!processedData?.length) { notify.info("No Data", "No processed salary data found."); return; }
      const monthObj   = MONTHS.find((m) => m.value === month);
      const monthName  = monthObj?.label || month;
      const doc        = generatePayslipPDF(processedData, monthName, year);
      doc.save(`payslips_${monthName}_${year}.pdf`);
      try {
        await updateSlaryStatus("issued");
        notify.success("Salary Issued", "Salary Issued!");
      } catch (err) {
        notify.error("Issue Update Failed", err.response?.data?.message || err.message || "Unknown error");
      }
    } catch (err) {
      console.error(err);
      notify.error("PDF Error", "Error generating PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const isProcessed = status === "Processed";

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">

      {/* Page header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Salary Processing</h1>
        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm border
          ${isProcessed ? "bg-green-100 text-green-800 border-green-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"}`}>
          {isProcessed
            ? <><CheckCircle className="inline mr-1 h-4 w-4" />Processed</>
            : <><AlertCircle className="inline mr-1 h-4 w-4" />Unprocessed</>}
        </span>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              label="Total Salary Cost"
              value={`LKR ${totalSalary.toLocaleString()}`}
              icon={Wallet}
              colorClass="from-blue-100 to-blue-50 border-blue-200 text-blue-700 [&>div>div:last-child]:bg-blue-200 [&>div>div:last-child]:text-blue-700"
            />
            <StatCard
              label="Employee Count"
              value={employeeCount}
              icon={Users}
              colorClass="from-green-100 to-green-50 border-green-200 text-green-700 [&>div>div:last-child]:bg-green-200 [&>div>div:last-child]:text-green-700"
            />
          </div>

          {/* EPF filter buttons */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow flex flex-wrap gap-4">
            <FilterButton label="All Employees"    active={activeFilter === "All"}    onClick={() => setActiveFilter("All")}    />
            <FilterButton label="EPF Employee"     active={activeFilter === "EPF"}    onClick={() => setActiveFilter("EPF")}    icon={Users} />
            <FilterButton label="Non EPF Employee" active={activeFilter === "NonEPF"} onClick={() => setActiveFilter("NonEPF")} icon={Users} />
          </div>

          {/* Filter panel */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow">
            <h3 className="text-base font-semibold text-gray-700 mb-4">Filter Employees</h3>

            {/* Search */}
            <div className="relative mb-4">
              <label htmlFor="search" className="block text-xs font-semibold text-gray-500 mb-1">Search by ID or Name</label>
              <div className="relative">
                <input
                  type="text" id="search"
                  placeholder="Enter employee ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-5 mb-4">
              {/* Company */}
              <div className="relative flex-1">
                <label htmlFor="company" className="block text-xs font-semibold text-gray-500 mb-1">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  {isLoadingCompanies ? (
                    <div className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500" />
                      <span className="ml-2 text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <select id="company" value={selectedCompany} onChange={handleCompanyChange}
                      className="appearance-none w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm">
                      <option value="">Select Company</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                </div>
              </div>

              {/* Department */}
              <div className="relative flex-1">
                <label htmlFor="department" className="block text-xs font-semibold text-gray-500 mb-1">Department</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  {isLoadingDepartments ? (
                    <div className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500" />
                      <span className="ml-2 text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <select id="department" value={selectedDepartment} onChange={handleDepartmentChange}
                      disabled={!selectedCompany}
                      className={`appearance-none w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm ${!selectedCompany ? "bg-gray-100 cursor-not-allowed" : ""}`}>
                      <option value="">All Departments</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  )}
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                </div>
              </div>

              {/* Month */}
              <SelectField id="month" label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="">Select Month</option>
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </SelectField>

              {/* KPI Mode */}
              <div className="relative flex-1">
                <SelectField id="kpiMode" label="KPI Mode" value={kpiType} onChange={(e) => setKpiType(e.target.value)}>
                  <option value="">None</option>
                  <option value="monthly">Monthly</option>
                  <option value="6month">6 Month Bonus</option>
                </SelectField>
                <p className="mt-1 text-[10px] text-gray-500">Monthly adds to EPF base; 6 Month Bonus adds to gross only</p>
              </div>

              {/* Year */}
              <div className="relative flex-1">
                <label htmlFor="year" className="block text-xs font-semibold text-gray-500 mb-1">Year</label>
                <input type="number" id="year" value={year} onChange={(e) => setYear(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                  placeholder="Enter year" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={applyFilters}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors shadow">
                <Filter size={18} strokeWidth={2} /> Apply Filters
              </button>
              <button type="button" onClick={resetFilter}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-base font-semibold hover:bg-gray-300 transition-colors shadow">
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Process Status panel */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 p-6 shadow h-fit">
          <h3 className="text-base font-semibold text-blue-700 mb-4">Process Status</h3>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Status</p>
              <div className="flex items-center">
                {isProcessed
                  ? <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  : <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />}
                <p className={`font-semibold text-lg ${isProcessed ? "text-green-700" : "text-yellow-700"}`}>{status}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Processed By</p>
              <p className="font-semibold text-gray-800">{statusInfo.processUser}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Last Process Date</p>
              <p className="font-semibold text-gray-800">{statusInfo.lastProcessDate}</p>
            </div>

            <div className="pt-2 space-y-3">
              <button type="button" onClick={handleSaveData} disabled={!filteredData.length}
                className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors
                  ${!filteredData.length ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-purple-600 text-white hover:bg-purple-700 shadow"}`}>
                <FileText size={18} strokeWidth={2} /> Save Data
              </button>

              <button type="button" onClick={handleSalaryProcess} disabled={isProcessed}
                className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors
                  ${isProcessed ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700 shadow"}`}>
                <FileText size={18} strokeWidth={2} /> Process Salary
              </button>

              <button type="button" disabled={!isProcessed}
                onClick={() => { handleDownloadAllProcessed(); handleDownloadCSV(); }}
                className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-colors
                  ${!isProcessed ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-purple-600 text-white hover:bg-purple-700 shadow"}`}>
                <Download size={18} strokeWidth={2} /> Download All Processed Payslips
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk actions panel */}
      {selectedEmployees.length > 0 && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-md mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Users className="mr-2" size={20} />
            Bulk Actions ({selectedEmployees.length} employees selected)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Action type */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Action Type</label>
              <select value={bulkActionType}
                onChange={(e) => { setBulkActionType(e.target.value); setBulkActionAmount(""); setBulkActionId(""); }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option value="allowance">Add Allowance</option>
                <option value="deduction">Add Deduction</option>
                <option value="bonus">Add Bonus</option>
              </select>
            </div>

            {/* Allowance / Deduction / Bonus picker */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {bulkActionType === "allowance" ? "Allowance Type" : bulkActionType === "deduction" ? "Deduction Type" : "Bonus Type"}
              </label>
              <select value={bulkActionId} onChange={(e) => handleAllowanceDeductionChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg">
                <option value="">Select Type</option>
                {bulkActionType === "allowance" && availableAllowances.map((a) =>
                  <option key={a.id} value={a.id}>{a.allowance_name}</option>)}
                {bulkActionType === "deduction" && availableDeductions.map((d) =>
                  <option key={d.id} value={d.id}>{d.deduction_name}</option>)}
                {bulkActionType === "bonus" && availableBonuses.map((b) =>
                  <option key={b.id} value={b.id}>{b.bonus_name}</option>)}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input type="number" value={bulkActionAmount} onChange={(e) => setBulkActionAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount" />
            </div>

            {/* Action buttons */}
            <div className="flex items-end gap-2 flex-wrap">
              <button type="button" onClick={applyBulkAction}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
                Apply to Selected
              </button>
              <button type="button" onClick={getExcelData}
                className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition">
                Download Excel
              </button>
              <button type="button" onClick={() => setIsImportModalOpen(true)}
                className="py-2 px-4 bg-green-300 hover:bg-green-400 text-black font-medium rounded-lg transition">
                Import Excel
              </button>
            </div>
          </div>

          {importSuccessMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{importSuccessMessage}</div>
          )}

          <div className="flex justify-end">
            <button type="button" className="text-gray-600 hover:text-gray-800 font-medium"
              onClick={() => { setSelectedEmployees([]); setSelectAll(false); }}>
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Import modal */}
      {isImportModalOpen && (
        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => { setIsImportModalOpen(false); setImportSuccessMessage(""); }}
          onSuccess={handleImportSuccess}
          onImport={handleImportExcel}
        />
      )}

      {/* Loading spinner */}
      {isLoading && <Spinner />}

      {/* Select-all bar */}
      {!isLoading && displayedData.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 mb-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <input type="checkbox" checked={selectAll} onChange={handleSelectAll}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-600">
            {selectAll ? "Deselect All" : `Select All (${displayedData.length})`}
          </span>
        </div>
      )}

      {/* Employee cards */}
      {!isLoading && displayedData.length > 0 && (
        <div className="space-y-4 mb-8">
          {displayedData.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              isSelected={selectedEmployees.includes(`${employee.id}`)}
              onSelect={handleSelectEmployee}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && displayedData.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow text-center">
          <div className="mx-auto max-w-md">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No employees found</h3>
            <p className="mt-1 text-sm text-gray-500">Apply filters (company / month / year) and load data</p>
            <div className="mt-6">
              <button type="button" onClick={resetFilter}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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