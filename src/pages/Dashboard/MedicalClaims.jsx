import React, { useEffect, useState } from "react";
import { HeartPulse, Check, X, RefreshCw, Paperclip } from "lucide-react";
import { mediaUrl } from "../../utils/mediaUrl";
import {
  listMedicalClaims,
  medicalClaimBill,
  reviewMedicalClaim,
  saveMedicalQuota,
} from "../../services/BenefitPackService";
import employeeService from "../../services/EmployeeDataService";

const money = (v) =>
  `Rs. ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MedicalClaims() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [employees, setEmployees] = useState([]);
  const [quotaForm, setQuotaForm] = useState({ employee_id: "", allocated_amount: "", year: new Date().getFullYear() });
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const data = await listMedicalClaims(status ? { status } : {});
      setItems(data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load claims");
    }
  };

  useEffect(() => {
    load();
    employeeService
      .fetchEmployees()
      .then((rows) => setEmployees(Array.isArray(rows) ? rows : rows?.data || []))
      .catch(() => setEmployees([]));
  }, [status]);

  const review = async (id, action) => {
    try {
      await reviewMedicalClaim(id, { action });
      setMsg(action === "APPROVE" ? "Approved — sent to Pending Payments" : "Rejected");
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Review failed");
    }
  };

  const saveQuota = async (e) => {
    e.preventDefault();
    try {
      await saveMedicalQuota(quotaForm);
      setMsg("Employee medical quota saved");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Quota save failed");
    }
  };

  const openBill = async (row) => {
    const direct = mediaUrl(row.bill_path);
    if (/^https?:\/\//i.test(String(row.bill_path || ""))) {
      window.open(direct, "_blank");
      return;
    }
    try {
      const data = await medicalClaimBill(row.id);
      if (data.url) window.open(data.url, "_blank");
    } catch {
      setMsg("Bill file not found");
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <HeartPulse className="w-6 h-6 text-teal-600" /> Medical Claims
      </h2>
      {msg && <p className="text-sm text-teal-800 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">{msg}</p>}
      <form onSubmit={saveQuota} className="bg-white rounded-2xl border p-4 grid sm:grid-cols-4 gap-3">
        <select required className="border rounded-xl px-3 py-2 text-sm sm:col-span-2" value={quotaForm.employee_id} onChange={(e) => setQuotaForm({ ...quotaForm, employee_id: e.target.value })}>
          <option value="">Set employee quota</option>
          {employees.slice(0, 400).map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.full_name || emp.name_with_initials}</option>
          ))}
        </select>
        <input type="number" min="0" step="0.01" required className="border rounded-xl px-3 py-2 text-sm" placeholder="Allocated" value={quotaForm.allocated_amount} onChange={(e) => setQuotaForm({ ...quotaForm, allocated_amount: e.target.value })} />
        <button type="submit" className="rounded-xl bg-teal-700 text-white text-sm font-semibold">Save quota</button>
      </form>
      <div className="flex gap-2">
        <select className="border rounded-xl px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
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
              <th className="p-3">Amount</th>
              <th className="p-3">Description</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td className="p-4 text-slate-500" colSpan={5}>No claims</td></tr>
            ) : items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.employee?.full_name || row.employee?.name_with_initials}</td>
                <td className="p-3">{money(row.amount)}</td>
                <td className="p-3">{row.description || "—"}</td>
                <td className="p-3">{row.status}</td>
                <td className="p-3 text-right space-x-1">
                  {row.bill_path && (
                    <button type="button" onClick={() => openBill(row)} className="inline-flex p-1.5 rounded-lg bg-slate-50 text-slate-700">
                      <Paperclip className="w-4 h-4" />
                    </button>
                  )}
                  {row.status === "PENDING" && (
                    <>
                      <button type="button" onClick={() => review(row.id, "APPROVE")} className="inline-flex p-1.5 rounded-lg bg-emerald-50 text-emerald-700"><Check className="w-4 h-4" /></button>
                      <button type="button" onClick={() => review(row.id, "REJECT")} className="inline-flex p-1.5 rounded-lg bg-rose-50 text-rose-700"><X className="w-4 h-4" /></button>
                    </>
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
