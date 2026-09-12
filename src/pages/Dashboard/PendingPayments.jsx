import React, { useEffect, useState } from "react";
import { Banknote, Check, RefreshCw } from "lucide-react";
import { listPendingPayments, markPendingPaymentPaid } from "../../services/BenefitPackService";

const money = (v) =>
  `Rs. ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PendingPayments() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const data = await listPendingPayments(status ? { status } : {});
      setItems(data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load pending payments");
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const pay = async (id) => {
    try {
      await markPendingPaymentPaid(id);
      setMsg("Marked as paid");
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Banknote className="w-6 h-6 text-teal-600" /> Pending Payments
      </h2>
      <p className="text-sm text-slate-500">Approved medical claims and salary advances waiting for HR payment.</p>
      {msg && <p className="text-sm text-teal-800 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">{msg}</p>}
      <div className="flex gap-2">
        <select className="border rounded-xl px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
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
              <th className="p-3">Type</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td className="p-4 text-slate-500" colSpan={5}>No pending payments</td></tr>
            ) : items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.employee?.full_name || row.employee?.name_with_initials}</td>
                <td className="p-3">{row.source_type === "medical_claim" ? "Medical claim" : "Salary advance"}</td>
                <td className="p-3">{money(row.amount)}</td>
                <td className="p-3">{row.status}</td>
                <td className="p-3 text-right">
                  {row.status === "PENDING" && (
                    <button type="button" onClick={() => pay(row.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                      <Check className="w-4 h-4" /> Mark paid
                    </button>
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
