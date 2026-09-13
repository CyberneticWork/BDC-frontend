import React, { useEffect, useState } from "react";
import { CalendarDays, Check, X, RefreshCw } from "lucide-react";
import {
  createWeeklyOff,
  listWeeklyOffs,
  reviewWeeklyOff,
} from "../../services/BenefitPackService";
import employeeService from "../../services/EmployeeDataService";

export default function WeeklyOffManagement() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("Pending");
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employee_id: "",
    off_date: "",
    days: "1",
    reason: "",
    publish: true,
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listWeeklyOffs(status ? { status } : {});
      setItems(data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load weekly offs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    employeeService
      .fetchEmployees()
      .then((rows) => setEmployees(Array.isArray(rows) ? rows : rows?.data || []))
      .catch(() => setEmployees([]));
  }, [status]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await createWeeklyOff({
        ...form,
        publish: !!form.publish,
        days: Number(form.days),
      });
      setMsg("Weekly off saved. Approved rows are visible on employee portals.");
      setForm({ ...form, off_date: "", reason: "" });
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Save failed");
    }
  };

  const review = async (id, action) => {
    try {
      await reviewWeeklyOff(id, { action });
      setMsg(action === "APPROVE" ? "Approved" : "Rejected");
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Review failed");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-teal-600" />
          Weekly Off Schedule
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Maintain the weekly-off calendar. After approve, employees see it on their portal.
        </p>
      </div>
      {msg && <p className="text-sm text-teal-800 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">{msg}</p>}
      <form onSubmit={save} className="bg-white rounded-2xl border p-4 grid sm:grid-cols-5 gap-3">
        <select
          required
          className="border rounded-xl px-3 py-2 text-sm sm:col-span-2"
          value={form.employee_id}
          onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
        >
          <option value="">Employee</option>
          {employees.slice(0, 400).map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name || emp.name_with_initials} ({emp.attendance_employee_no || emp.id})
            </option>
          ))}
        </select>
        <input
          type="date"
          required
          className="border rounded-xl px-3 py-2 text-sm"
          value={form.off_date}
          onChange={(e) => setForm({ ...form, off_date: e.target.value })}
        />
        <select
          className="border rounded-xl px-3 py-2 text-sm"
          value={form.days}
          onChange={(e) => setForm({ ...form, days: e.target.value })}
        >
          <option value="1">Full (1)</option>
          <option value="0.5">Half (0.5)</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.publish}
            onChange={(e) => setForm({ ...form, publish: e.target.checked })}
          />
          Approve now
        </label>
        <input
          className="border rounded-xl px-3 py-2 text-sm sm:col-span-4"
          placeholder="Note"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        <button type="submit" className="rounded-xl bg-teal-700 text-white text-sm font-semibold px-3 py-2">
          Save
        </button>
      </form>
      <div className="flex gap-2">
        <select className="border rounded-xl px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="">All</option>
        </select>
        <button type="button" onClick={load} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-50 text-teal-800 text-sm font-semibold">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500 border-b">
              <th className="p-3">Employee</th>
              <th className="p-3">Date</th>
              <th className="p-3">Days</th>
              <th className="p-3">Source</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-slate-500" colSpan={6}>Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-4 text-slate-500" colSpan={6}>No rows</td></tr>
            ) : items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.employee?.full_name || row.employee?.name_with_initials}</td>
                <td className="p-3">{String(row.off_date).slice(0, 10)}</td>
                <td className="p-3">{row.days}</td>
                <td className="p-3">{row.source}</td>
                <td className="p-3">{row.status}</td>
                <td className="p-3 text-right">
                  {row.status === "Pending" && (
                    <span className="inline-flex gap-1">
                      <button type="button" onClick={() => review(row.id, "APPROVE")} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700"><Check className="w-4 h-4" /></button>
                      <button type="button" onClick={() => review(row.id, "REJECT")} className="p-1.5 rounded-lg bg-rose-50 text-rose-700"><X className="w-4 h-4" /></button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
