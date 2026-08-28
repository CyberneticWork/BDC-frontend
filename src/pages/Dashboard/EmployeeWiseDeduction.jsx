import employeeService from "@services/EmployeeDataService";
import { fetchCompanies, fetchDeductions } from "@services/DeductionService";
import {
  assignDeduction,
  deleteAssignedDeduction,
  listAssignedDeductions,
} from "@services/AssignSalaryComponentService";
import { Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

function normalizeDeductions(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

function EmployeeWiseDeduction() {
  const [companies, setCompanies] = useState([]);
  const [predefined, setPredefined] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState(String(currentYear));
  const [deletingId, setDeletingId] = useState(null);

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filterCompany) params.company_id = filterCompany;
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      const rows = await listAssignedDeductions(params);
      setAssignments(rows);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load deduction assignments");
    } finally {
      setIsLoading(false);
    }
  }, [filterCompany, filterMonth, filterYear]);

  useEffect(() => {
    (async () => {
      try {
        const [companyList, deductionList] = await Promise.all([
          fetchCompanies(),
          fetchDeductions(),
        ]);
        setCompanies(companyList || []);
        setPredefined(
          normalizeDeductions(deductionList).filter((d) => d.status !== "inactive")
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load masters");
      }
    })();
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return assignments;
    return assignments.filter(
      (r) =>
        String(r.deduction_code || "").toLowerCase().includes(term) ||
        String(r.deduction_name || "").toLowerCase().includes(term) ||
        String(r.employee_name || "").toLowerCase().includes(term) ||
        String(r.attendance_no || "").toLowerCase().includes(term)
    );
  }, [assignments, searchTerm]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this deduction assignment?")) return;
    setDeletingId(id);
    try {
      await deleteAssignedDeduction(id);
      toast.success("Assignment removed");
      await loadAssignments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove assignment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3 justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Assign Deductions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select a predefined deduction, apply to all employees or one employee.
            Fixed = month period (master amount). Variable = month + amount.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Assign Deduction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All months</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All years</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee / deduction"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Attendance No</th>
                <th className="px-4 py-3">Deduction</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{row.employee_name}</td>
                  <td className="px-4 py-3">{row.attendance_no}</td>
                  <td className="px-4 py-3">
                    {row.deduction_code} — {row.deduction_name}
                  </td>
                  <td className="px-4 py-3 capitalize">{row.deduction_type || "—"}</td>
                  <td className="px-4 py-3">
                    {MONTHS.find((m) => m.value === Number(row.month))?.label || row.month}/{row.year}
                  </td>
                  <td className="px-4 py-3">{Number(row.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={deletingId === row.id}
                      onClick={() => handleDelete(row.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      {deletingId === row.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No assignments found. Click Assign Deduction to add.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AssignDeductionModal
          companies={companies}
          predefined={predefined}
          onClose={() => setShowModal(false)}
          onSuccess={async () => {
            setShowModal(false);
            await loadAssignments();
          }}
        />
      )}
    </div>
  );
}

function AssignDeductionModal({ companies, predefined, onClose, onSuccess }) {
  const now = new Date();
  const [applyTo, setApplyTo] = useState("employee");
  const [companyId, setCompanyId] = useState("");
  const [deductionId, setDeductionId] = useState("");
  const [valueType, setValueType] = useState("fixed");
  const [fromMonth, setFromMonth] = useState(now.getMonth() + 1);
  const [fromYear, setFromYear] = useState(now.getFullYear());
  const [toMonth, setToMonth] = useState(now.getMonth() + 1);
  const [toYear, setToYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [amount, setAmount] = useState("");
  const [employee, setEmployee] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const attendanceRef = useRef(null);

  const filteredDeductions = useMemo(() => {
    if (!companyId) return predefined;
    return predefined.filter((d) => String(d.company_id) === String(companyId));
  }, [predefined, companyId]);

  const selectedDeduction = useMemo(
    () => filteredDeductions.find((d) => String(d.id) === String(deductionId)),
    [filteredDeductions, deductionId]
  );

  useEffect(() => {
    if (!selectedDeduction) return;
    const type = String(selectedDeduction.deduction_type || "fixed").toLowerCase();
    setValueType(type === "variable" ? "variable" : "fixed");
    if (type !== "variable") {
      setAmount(String(selectedDeduction.amount ?? ""));
    } else {
      setAmount("");
    }
  }, [selectedDeduction]);

  const searchEmployee = async () => {
    const no = attendanceRef.current?.value?.trim();
    if (!no) {
      toast.error("Enter attendance number");
      return;
    }
    try {
      const emp = await employeeService.searchByAttendanceNo(no);
      if (!emp) {
        toast.error("Employee not found");
        setEmployee(null);
        return;
      }
      setEmployee(emp);
      const empCompany = emp.organization_assignment?.company_id;
      if (empCompany) setCompanyId(String(empCompany));
    } catch (err) {
      console.error(err);
      toast.error("Employee search failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deductionId) {
      toast.error("Select a predefined deduction");
      return;
    }
    if (applyTo === "employee" && !employee?.id) {
      toast.error("Search and select an employee");
      return;
    }
    if (valueType === "variable" && (amount === "" || Number(amount) < 0)) {
      toast.error("Enter amount for variable deduction");
      return;
    }

    const payload = {
      apply_to: applyTo,
      employee_id: applyTo === "employee" ? employee.id : null,
      company_id: companyId || selectedDeduction?.company_id || null,
      deduction_id: Number(deductionId),
      value_type: valueType,
    };

    if (valueType === "fixed") {
      Object.assign(payload, {
        from_month: Number(fromMonth),
        from_year: Number(fromYear),
        to_month: Number(toMonth),
        to_year: Number(toYear),
      });
    } else {
      Object.assign(payload, {
        month: Number(month),
        year: Number(year),
        amount: Number(amount),
      });
    }

    setIsSaving(true);
    try {
      const res = await assignDeduction(payload);
      toast.success(
        `${res.message} (${res.affected_employees} employee(s), ${res.months} month(s))`
      );
      onSuccess();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors && JSON.stringify(err.response.data.errors)) ||
        "Failed to assign deduction";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">Assign Predefined Deduction</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Apply To</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="apply_to"
                  checked={applyTo === "all"}
                  onChange={() => setApplyTo("all")}
                />
                All employees
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="apply_to"
                  checked={applyTo === "employee"}
                  onChange={() => setApplyTo("employee")}
                />
                Employee wise
              </label>
            </div>
          </div>

          {applyTo === "employee" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <div className="flex gap-2">
                <input
                  ref={attendanceRef}
                  placeholder="Attendance number"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={searchEmployee}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm"
                >
                  Search
                </button>
              </div>
              {employee && (
                <p className="text-sm text-green-700">
                  {employee.name_with_initials || employee.full_name} ({employee.attendance_employee_no})
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setDeductionId("");
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required={applyTo === "all"}
            >
              <option value="">Select company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Predefined Deduction
            </label>
            <select
              value={deductionId}
              onChange={(e) => setDeductionId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">Select deduction</option>
              {filteredDeductions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deduction_code} — {d.deduction_name} ({d.deduction_type || "fixed"})
                  {d.amount != null ? ` · ${d.amount}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deduction Type
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={valueType === "fixed"}
                  onChange={() => setValueType("fixed")}
                />
                Fixed (select month period, use master amount)
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={valueType === "variable"}
                  onChange={() => setValueType("variable")}
                />
                Variable (select month + amount)
              </label>
            </div>
            {selectedDeduction && valueType === "fixed" && (
              <p className="text-xs text-gray-500 mt-1">
                Master amount: {Number(selectedDeduction.amount || 0).toFixed(2)}
              </p>
            )}
          </div>

          {valueType === "fixed" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From month</label>
                <select
                  value={fromMonth}
                  onChange={(e) => setFromMonth(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">From year</label>
                <select
                  value={fromYear}
                  onChange={(e) => setFromYear(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To month</label>
                <select
                  value={toMonth}
                  onChange={(e) => setToMonth(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To year</label>
                <select
                  value={toYear}
                  onChange={(e) => setToYear(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(EmployeeWiseDeduction);
