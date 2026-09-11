import React, { useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@utils/axios";
import ExcessLateReviewService from "@services/ExcessLateReviewService";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const fmt = (n) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(n || 0));

export default function ExcessLateReview() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [companyId, setCompanyId] = useState("");
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [deductFrom, setDeductFrom] = useState("bonus");

  const years = useMemo(() => Array.from({ length: 6 }, (_, i) => now.getFullYear() - i), [now]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/apiData/companies");
        const rows = Array.isArray(data) ? data : [];
        setCompanies(rows.filter((c) => c.late_attendance_policy_enabled));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const data = await ExcessLateReviewService.preview({
        month,
        year,
        company_id: companyId || undefined,
        search: search || undefined,
      });
      setPreview(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Load failed",
        text: error?.response?.data?.message || "Could not load late-over-30 minutes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, companyId]);

  const decide = async (employee, day, action) => {
    const key = `${employee.employee_id}-${day.date}`;
    setBusyKey(key);
    try {
      const result = await ExcessLateReviewService.decide({
        employee_id: employee.employee_id,
        late_date: day.date,
        action,
        leave_type: action === "leave" ? leaveType : undefined,
        deduct_from: action === "reject" ? deductFrom : undefined,
      });
      Swal.fire({
        icon: "success",
        title: action === "leave" ? "Leave applied" : "Rejected — NoPay",
        text: result.message,
        timer: 1600,
        showConfirmButton: false,
      });
      await loadPreview();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: error?.response?.data?.message || "Could not save the decision.",
      });
    } finally {
      setBusyKey("");
    }
  };

  const employees = preview?.employees || [];

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 rounded-2xl bg-slate-900 p-6 text-white">
          <h1 className="text-2xl font-bold">Late over 30 minutes</h1>
          <p className="mt-1 text-sm text-slate-300">
            Only companies enabled in Cybernetic Admin. Apply leave, or reject and deduct late minutes as NoPay from Basic or Monthly Bonus.
          </p>
        </div>

        <div className="mb-4 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-5">
          <select className="rounded-lg border px-3 py-2" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
          <select className="rounded-lg border px-3 py-2" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select className="rounded-lg border px-3 py-2" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">All enabled companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.company_label || c.name}</option>
            ))}
          </select>
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Search employee"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadPreview()}
          />
          <button
            type="button"
            onClick={loadPreview}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Load
          </button>
        </div>

        <div className="mb-4 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-2">
          <label className="text-sm">
            Leave type when applying leave
            <select className="mt-1 w-full rounded-lg border px-3 py-2" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              <option>Casual Leave</option>
              <option>Annual Leave</option>
            </select>
          </label>
          <label className="text-sm">
            NoPay deduct from (if leave is rejected)
            <select className="mt-1 w-full rounded-lg border px-3 py-2" value={deductFrom} onChange={(e) => setDeductFrom(e.target.value)}>
              <option value="bonus">Monthly Bonus</option>
              <option value="basic">Basic salary</option>
            </select>
          </label>
        </div>

        {companies.length === 0 && (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            No company has this calculation enabled. Turn it on in Cybernetic Admin for the company that needs it.
          </p>
        )}

        <div className="space-y-4">
          {employees.map((emp) => (
            <div key={emp.employee_id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{emp.employee_name}</p>
                  <p className="text-xs text-slate-500">{emp.employee_no} · {emp.company_name}</p>
                </div>
                <p className="text-sm text-rose-700 font-medium">
                  Rejected NoPay so far: {fmt(emp.reject_nopay_amount)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Late</th>
                      <th className="px-3 py-2">If Basic</th>
                      <th className="px-3 py-2">If Bonus</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emp.days.map((day) => {
                      const key = `${emp.employee_id}-${day.date}`;
                      return (
                        <tr key={day.date} className="border-t">
                          <td className="px-3 py-2">{day.date}</td>
                          <td className="px-3 py-2 font-semibold text-rose-700">{day.late_display}</td>
                          <td className="px-3 py-2">{fmt(day.amount_if_basic)}</td>
                          <td className="px-3 py-2">{fmt(day.amount_if_bonus)}</td>
                          <td className="px-3 py-2">
                            {day.decision === "leave" && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">Leave ({day.leave_type})</span>
                            )}
                            {day.decision === "reject" && (
                              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-800">
                                NoPay {fmt(day.nopay_amount)} ({day.deduct_from})
                              </span>
                            )}
                            {day.decision === "pending" && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Pending</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={busyKey === key}
                                onClick={() => decide(emp, day, "leave")}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Apply leave
                              </button>
                              <button
                                type="button"
                                disabled={busyKey === key}
                                onClick={() => decide(emp, day, "reject")}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-xs text-white"
                              >
                                <Ban className="h-3.5 w-3.5" /> Reject (NoPay)
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {!loading && employees.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
              <Clock className="mx-auto mb-2 h-8 w-8" />
              No employees late more than 30 minutes for this month.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
