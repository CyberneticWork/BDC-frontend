import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  Info,
  Loader2,
  Play,
  RefreshCw,
  Search,
  User,
  CalendarDays,
  Leaf,
  Ban,
} from "lucide-react";
import Swal from "sweetalert2";
import axios from "@utils/axios";
import MonthlyLateDeductionService from "@services/MonthlyLateDeductionService";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const bandStyles = {
  free: "bg-emerald-50 text-emerald-800 border-emerald-200",
  grace_only: "bg-emerald-50 text-emerald-800 border-emerald-200",
  one_short: "bg-amber-50 text-amber-900 border-amber-200",
  two_short: "bg-orange-50 text-orange-900 border-orange-200",
  half_day: "bg-orange-50 text-orange-900 border-orange-200",
  half_day_nopay: "bg-rose-50 text-rose-900 border-rose-200",
  excess: "bg-rose-50 text-rose-900 border-rose-200",
};

const stepTypeStyles = {
  info: "border-slate-200 bg-slate-50 text-slate-700",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  deduct: "border-orange-200 bg-orange-50 text-orange-900",
  annual: "border-sky-200 bg-sky-50 text-sky-900",
  casual: "border-teal-200 bg-teal-50 text-teal-900",
  nopay: "border-rose-200 bg-rose-50 text-rose-900",
};

function StatCard({ label, value, hint, accent = "teal" }) {
  const accents = {
    teal: "from-teal-600 to-teal-800",
    amber: "from-amber-500 to-orange-600",
    sky: "from-sky-500 to-cyan-700",
    rose: "from-rose-500 to-rose-700",
    slate: "from-slate-600 to-slate-800",
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold bg-gradient-to-r ${accents[accent]} bg-clip-text text-transparent`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function RulesBanner({ rules }) {
  if (!rules?.length) return null;
  return (
    <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-amber-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Info className="h-5 w-5 text-teal-700" />
        <h3 className="font-semibold text-slate-800">Monthly late deduction rules</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rules.map((rule) => (
          <div
            key={rule.band}
            className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-sm"
          >
            <p className="text-sm font-bold text-slate-800">{rule.band}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{rule.action}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        This screen uses only lates within the first 30 minutes. Days late more than 30 minutes appear on Late Over 30 Minutes.
        First 3 days ≤30m are free. The 4th–5th take short leave. From the 6th ≤30m day, every ≤30m day becomes a half day.
        Deducted days use Casual → Annual → remaining NoPay.
      </p>
    </div>
  );
}

function BreakdownPanel({ employee }) {
  return (
    <div className="space-y-4 border-t border-slate-100 bg-slate-50/80 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-white p-3 border border-slate-200">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Annual before → after</p>
          <p className="mt-1 text-sm font-bold text-sky-800">
            {employee.annual_balance_before} → {employee.annual_balance_after}
          </p>
          <p className="text-xs text-slate-500">Deducting {employee.annual_leave_days} day(s)</p>
        </div>
        <div className="rounded-xl bg-white p-3 border border-slate-200">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Casual before → after</p>
          <p className="mt-1 text-sm font-bold text-teal-800">
            {employee.casual_balance_before} → {employee.casual_balance_after}
          </p>
          <p className="text-xs text-slate-500">Deducting {employee.casual_leave_days} day(s)</p>
        </div>
        <div className="rounded-xl bg-white p-3 border border-slate-200">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Half / short leave</p>
          <p className="mt-1 text-sm font-bold text-amber-800">
            {employee.half_day_count ?? 0} half ({employee.half_day_days ?? 0}d)
            {(employee.short_leave_count ?? 0) > 0
              ? ` · ${employee.short_leave_count} short (${employee.short_leave_days}d)`
              : ""}
          </p>
          <p className="text-xs text-slate-500">
            ≤30m {employee.within_30_day_count ?? 0} · &gt;30m {employee.over_30_day_count ?? 0}
            {" · "}Grace {employee.grace_day_count ?? 0}/{employee.grace_day_limit ?? 3}
            {employee.six_plus_converted ? " · 6+ days within 30m → those days all half" : ""}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 border border-slate-200">
          <p className="text-[11px] font-semibold uppercase text-slate-500">NoPay</p>
          <p className="mt-1 text-sm font-bold text-rose-800">
            {employee.nopay_days} day ({employee.nopay_display})
          </p>
          <p className="text-xs text-slate-500">After leave balances exhausted</p>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Calculation steps</h4>
        <div className="space-y-2">
          {(employee.breakdown || []).map((step) => (
            <div
              key={`${employee.employee_id}-${step.step}-${step.title}`}
              className={`flex gap-3 rounded-xl border px-3 py-2 ${stepTypeStyles[step.type] || stepTypeStyles.info}`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold">
                {step.step}
              </span>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-xs opacity-90">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">
          Late days this month ({employee.late_day_count})
          <span className="ml-2 font-normal text-slate-500">
            {employee.within_30_day_count ?? 0} ≤30m · {employee.over_30_day_count ?? 0} &gt;30m
          </span>
        </h4>
        {(employee.late_days || []).length === 0 ? (
          <p className="text-sm text-slate-500">No late punches recorded.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Track</th>
                  <th className="px-3 py-2">Shift start</th>
                  <th className="px-3 py-2">In time</th>
                  <th className="px-3 py-2">Late</th>
                  <th className="px-3 py-2">Day action</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {employee.late_days.map((day) => (
                  <tr key={day.date} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{day.date}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          day.late_bucket === "over_30"
                            ? "rounded-md bg-orange-100 px-1.5 py-0.5 text-[11px] font-semibold text-orange-800"
                            : "rounded-md bg-sky-100 px-1.5 py-0.5 text-[11px] font-semibold text-sky-800"
                        }
                      >
                        {day.late_bucket === "over_30" ? ">30m" : "≤30m"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{day.shift_start}</td>
                    <td className="px-3 py-2 text-slate-600">{day.in_time}</td>
                    <td className="px-3 py-2 font-semibold text-rose-700">{day.late_display}</td>
                    <td className="px-3 py-2 text-xs">
                      <span
                        className={
                          day.action === "grace"
                            ? "text-emerald-700"
                            : day.action === "short_leave"
                              ? "text-amber-800 font-medium"
                              : day.action === "half_day"
                                ? "text-orange-700 font-medium"
                                : "text-slate-600"
                        }
                      >
                        {day.action_label || "—"}
                      </span>
                      {day.leave_source ? (
                        <span className="block text-[11px] text-slate-500">→ {day.leave_source}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{day.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MonthlyLateDeduction() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [companyId, setCompanyId] = useState("");
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState([]);
  const [rules, setRules] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState([]);
  const [filterBand, setFilterBand] = useState("all");

  const years = useMemo(
    () => Array.from({ length: 6 }, (_, i) => now.getFullYear() - i),
    [now]
  );

  useEffect(() => {
    (async () => {
      try {
        const [rulesRes, companiesRes] = await Promise.all([
          MonthlyLateDeductionService.getRules(),
          axios.get("/apiData/companies"),
        ]);
        setRules(rulesRes.rules || []);
        const rows = Array.isArray(companiesRes.data) ? companiesRes.data : [];
        setCompanies(rows.filter((c) => c.late_attendance_policy_enabled));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const data = await MonthlyLateDeductionService.preview({
        month,
        year,
        company_id: companyId || undefined,
        search: search || undefined,
      });
      setPreview(data);
      setSelected([]);
      setExpanded({});
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Load failed",
        text: error?.response?.data?.message || "Could not calculate monthly late deductions.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, companyId]);

  const employees = useMemo(() => {
    const list = preview?.employees || [];
    if (filterBand === "all") return list;
    if (filterBand === "deduction") return list.filter((e) => e.has_deduction);
    if (filterBand === "applied") return list.filter((e) => e.already_applied);
    if (filterBand === "free" || filterBand === "grace_only") {
      return list.filter((e) => e.band === "grace_only" || e.band === "free");
    }
    if (filterBand === "one_short" || filterBand === "two_short") {
      return list.filter((e) => e.band === "one_short" || e.band === "two_short");
    }
    if (filterBand === "excess" || filterBand === "half_day") {
      return list.filter(
        (e) => e.band === "half_day" || e.band === "half_day_nopay" || e.band === "excess"
      );
    }
    return list.filter((e) => e.band === filterBand);
  }, [preview, filterBand]);

  const selectableIds = useMemo(
    () =>
      employees
        .filter((e) => e.has_deduction && !e.already_applied)
        .map((e) => e.employee_id),
    [employees]
  );

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === selectableIds.length) {
      setSelected([]);
    } else {
      setSelected(selectableIds);
    }
  };

  const handleApply = async (employeeIds = null) => {
    const ids = employeeIds ?? selected;
    const targetCount = ids?.length
      ? ids.length
      : (preview?.summary?.employees_with_deduction || 0) -
        (preview?.summary?.already_applied || 0);

    if (targetCount <= 0) {
      Swal.fire({
        icon: "info",
        title: "Nothing to apply",
        text: "No pending employees with deductions.",
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Apply monthly late deductions?",
      html: `
        <p class="text-sm text-slate-600 text-left">
          This will automatically create <b>Approved</b> Short Leave / Annual / Casual leave
          records and <b>Approved NoPay</b> for the remaining balance for
          <b>${ids?.length ? ids.length : "all pending"}</b> employee(s).
        </p>
        <p class="text-xs text-slate-500 mt-2 text-left">
          Existing applied employees will be skipped. This cannot be undone from this screen.
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, apply now",
      confirmButtonColor: "#0f766e",
    });

    if (!confirm.isConfirmed) return;

    setApplying(true);
    try {
      const result = await MonthlyLateDeductionService.apply({
        month,
        year,
        company_id: companyId || undefined,
        employee_ids: ids?.length ? ids : undefined,
      });

      await Swal.fire({
        icon: "success",
        title: "Applied",
        html: `
          <div class="text-sm text-left space-y-1">
            <p>Applied: <b>${result.applied_count}</b></p>
            <p>Skipped: <b>${result.skipped_count}</b></p>
            <p>Errors: <b>${result.error_count}</b></p>
          </div>
        `,
      });

      await loadPreview();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Apply failed",
        text: error?.response?.data?.message || error.message,
      });
    } finally {
      setApplying(false);
    }
  };

  const summary = preview?.summary;

  return (
    <div className="space-y-5 p-1">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Monthly Late Deduction</h2>
          <p className="mt-1 text-sm text-slate-500">
            Employee-wise late totals → Short Leave → Annual / Casual → NoPay
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadPreview}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recalculate
          </button>
          <button
            type="button"
            onClick={() => handleApply(selected.length ? selected : null)}
            disabled={applying || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {selected.length ? `Apply selected (${selected.length})` : "Apply all pending"}
          </button>
        </div>
      </div>

      <RulesBanner rules={rules} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Month</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              {MONTHS.map((name, idx) => (
                <option key={name} value={idx + 1}>{name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Year</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Company</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              <option value="">All companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-semibold text-slate-600">Search employee</span>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadPreview()}
                placeholder="Name, emp no, NIC…"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3"
              />
            </div>
          </label>
        </div>
      </div>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Employees with late" value={summary.employees_with_late} accent="slate" />
          <StatCard label="Need deduction" value={summary.employees_with_deduction} accent="amber" />
          <StatCard label="Half days" value={summary.total_half_days ?? 0} hint="0.5 each for >30m days, and for 6+ days within 30m" accent="teal" />
          <StatCard label="Short leaves" value={summary.total_short_leaves ?? 0} hint="4th–5th day ≤30m only (over 30m does not use this)" accent="amber" />
          <StatCard
            label="Annual + Casual days"
            value={`${summary.total_annual_days} / ${summary.total_casual_days}`}
            hint="Annual / Casual"
            accent="sky"
          />
          <StatCard label="NoPay days" value={summary.total_nopay_days} accent="rose" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        {[
          { id: "all", label: "All" },
          { id: "deduction", label: "With deduction" },
          { id: "grace_only", label: "Grace only (no deduct)" },
          { id: "one_short", label: "Short leave" },
          { id: "half_day", label: "Half day / NoPay" },
          { id: "applied", label: "Already applied" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilterBand(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${
              filterBand === f.id
                ? "bg-teal-700 text-white border-teal-700"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectableIds.length > 0 && selected.length === selectableIds.length}
              onChange={toggleSelectAll}
              disabled={!selectableIds.length}
            />
            <span className="text-sm font-semibold text-slate-700">
              Employee-wise deduction preview
            </span>
          </div>
          <span className="text-xs text-slate-500">{employees.length} shown</span>
        </div>

        {loading && !preview ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Calculating late totals…
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Clock className="mx-auto mb-3 h-8 w-8 opacity-40" />
            {loading
              ? "Calculating late totals…"
              : "No late records for this month/filter."}
          </div>
        ) : (
          <div className={`divide-y divide-slate-100 ${loading ? "opacity-60 pointer-events-none" : ""}`}>
            {loading && (
              <div className="flex items-center justify-center gap-2 border-b border-slate-100 py-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating {MONTHS[(month || 1) - 1]} {year}…
              </div>
            )}
            {employees.map((emp) => {
              const open = !!expanded[emp.employee_id];
              const canSelect = emp.has_deduction && !emp.already_applied;
              return (
                <div key={emp.employee_id} className="bg-white">
                  <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        disabled={!canSelect}
                        checked={selected.includes(emp.employee_id)}
                        onChange={() => toggleSelect(emp.employee_id)}
                      />
                      <button
                        type="button"
                        onClick={() => toggleExpand(emp.employee_id)}
                        className="mt-0.5 text-slate-400 hover:text-slate-700"
                      >
                        {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </button>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <User className="h-4 w-4 text-teal-700" />
                          <p className="truncate font-semibold text-slate-900">{emp.employee_name}</p>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            #{emp.employee_no}
                          </span>
                          {emp.already_applied && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {emp.company_name || "—"} · {emp.late_day_count} late day(s)
                          {" "}({emp.within_30_day_count ?? 0} ≤30m / {emp.over_30_day_count ?? 0} &gt;30m)
                          {" "}· Shift {emp.shift_hours}h
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                        <Clock className="h-3.5 w-3.5" />
                        {emp.total_late_display}
                      </span>
                      <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${bandStyles[emp.band] || bandStyles.free}`}>
                        {emp.band_label}
                      </span>
                      {emp.short_leave_count > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                          <Leaf className="h-3.5 w-3.5" />
                          {emp.short_leave_count} Short
                        </span>
                      )}
                      {emp.annual_leave_days > 0 && (
                        <span className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-900">
                          Annual {emp.annual_leave_days}
                        </span>
                      )}
                      {emp.casual_leave_days > 0 && (
                        <span className="rounded-lg bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-900">
                          Casual {emp.casual_leave_days}
                        </span>
                      )}
                      {emp.nopay_days > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-900">
                          <Ban className="h-3.5 w-3.5" />
                          NoPay {emp.nopay_days}
                        </span>
                      )}
                      {!emp.has_deduction && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" /> No action
                        </span>
                      )}
                      {canSelect && (
                        <button
                          type="button"
                          onClick={() => handleApply([emp.employee_id])}
                          className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                  {open && <BreakdownPanel employee={emp} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">How apply works</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-amber-900/90">
              <li>≤30m late days (any dates) are counted on their own: first 3 = grace, 4th–5th = short leave, 6+ = half day for every ≤30m day.</li>
              <li>Days over 30 minutes (e.g. 35m) = half day that day. They do not use grace or short-leave slots.</li>
              <li>Creates Approved leave (Casual → Annual) and NoPay (`LATE_MONTHLY`) for shortfall.</li>
            </ul>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-amber-800">
              <CalendarDays className="h-3.5 w-3.5" />
              Period: {preview?.period?.from || "—"} → {preview?.period?.to || "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
