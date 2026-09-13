import React, { useEffect, useState } from "react";
import { Check, X, RefreshCw, Landmark } from "lucide-react";
import { listHrLoans, reviewLoanRequest } from "@services/LoanService";

const money = (v) =>
  `Rs. ${Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function LoanApprovals() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState({});
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const data = await listHrLoans(status ? { status } : {});
      setItems(data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load loan requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const review = async (id, action) => {
    try {
      const res = await reviewLoanRequest(id, {
        action,
        notes: note[id] || "",
      });
      setMsg(res.message || (action === "approve" ? "Approved" : "Rejected"));
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Review failed");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--brand-ink)] flex items-center gap-2">
            <Landmark className="w-6 h-6 text-teal-600" />
            Loan approval
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review employee portal loan requests. Approved loans become active and start payroll deduction.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="border border-teal-100 rounded-xl px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="">All</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 text-teal-800 text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-2 text-sm text-teal-800">
          {msg}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500 text-sm">No loan requests found.</p>
      ) : (
        <div className="space-y-3">
          {items.map((row) => (
            <article
              key={row.id}
              className="bg-white rounded-2xl border border-teal-50 p-4 shadow-[0_10px_30px_rgba(6,42,50,0.06)]"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-display font-bold text-lg text-[var(--brand-ink)]">
                    {money(row.loan_amount)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {row.employee?.full_name || row.employee?.name_with_initials || `Employee #${row.employee_id}`}
                    {row.employee?.attendance_employee_no ? ` · #${row.employee.attendance_employee_no}` : ""}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Installment {money(row.installment_amount)}
                    {row.start_from ? ` · from ${String(row.start_from).slice(0, 7)}` : ""}
                    {row.submitted_via === "portal" ? " · Portal request" : " · HR entry"}
                  </p>
                  {row.reason && <p className="text-sm text-slate-500 mt-1">{row.reason}</p>}
                </div>
                <span className="h-fit px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 capitalize">
                  {row.status}
                </span>
              </div>

              {row.status === "pending" && (
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Review note (optional)"
                    className="flex-1 min-w-[180px] border border-teal-100 rounded-xl px-3 py-2 text-sm"
                    value={note[row.id] || ""}
                    onChange={(e) => setNote({ ...note, [row.id]: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => review(row.id, "approve")}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => review(row.id, "reject")}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
