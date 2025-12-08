import React, { useEffect, useState } from "react";
import { getPendingInvoices, approveInvoice, rejectInvoice } from "../../services/Inventory/pendingService";

const Pending = () => {
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      const data = await getPendingInvoices();
      setPendingInvoices(Array.isArray(data) ? data : []);
    };
    load();
  }, []);

  const handleApprove = (id) => {
    approveInvoice(id);
    setPendingInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: "approved" } : inv)));
  };

  const handleReject = (id) => {
    rejectInvoice(id);
    setPendingInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: "rejected" } : inv)));
  };

  const toggleExpanded = (id) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const q = (searchTerm || "").toString().trim().toLowerCase();
  const filteredInvoices = pendingInvoices.filter((inv = {}) => {
    if (!q) return true;
    return ((inv.customer || "") + "" ).toLowerCase().includes(q) || ((inv.id || "") + "").toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900">Pending Approvals</h1>
          <p className="text-sm text-slate-500">Review and act on pending invoices</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <input
            type="text"
            placeholder="Search by invoice ID or customer"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300"
          />

          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-full text-xs font-medium">Pending: {filteredInvoices.filter((inv) => !inv.status).length}</div>
            <div className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full text-xs font-medium">Approved: {filteredInvoices.filter((inv) => inv.status === 'approved').length}</div>
            <div className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-100 rounded-full text-xs font-medium">Rejected: {filteredInvoices.filter((inv) => inv.status === 'rejected').length}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Center</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredInvoices.map((inv, idx) => (
                <React.Fragment key={inv.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {inv.id}
                      <div className="text-xs text-slate-500">{inv.date ? new Date(inv.date).toLocaleDateString() : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{inv.customer}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{inv.center}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-900 font-semibold">${inv.amount}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : inv.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                        {inv.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleApprove(inv.id)}
                          disabled={inv.status !== null}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(inv.id)}
                          disabled={inv.status !== null}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 shadow-sm"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => toggleExpanded(inv.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedItems.has(inv.id) && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="text-sm text-slate-700 space-y-1">
                            <div className="font-medium text-slate-900">Customer</div>
                            <div>{inv.customer}</div>
                            <div className="text-xs text-slate-500">Ref: {inv.refNumber || 'N/A'}</div>
                          </div>
                          <div className="text-sm text-slate-700 space-y-1">
                            <div className="font-medium text-slate-900">Payment</div>
                            <div className="capitalize">{inv.payment?.mode || '-'} • ${inv.payment?.amount ?? 0}</div>
                            <div className="text-xs text-slate-500">Created by: {inv.created_by}</div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="mt-2 bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
                              <div className="font-medium text-slate-900 mb-2">Items ({inv.items?.length ?? 0})</div>
                              <div className="space-y-2">
                                {(inv.items || []).map((item, i) => (
                                  <div key={item.id ?? i} className="flex items-center justify-between text-sm text-slate-700">
                                    <div>{i + 1}. {item.name} <span className="text-xs text-slate-500">(Product ID: {item.productId})</span></div>
                                    <div className="text-slate-900 font-medium">${((item.unitPrice || 0) * (item.quantity || 0) - (item.discount || 0)).toFixed(2)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12 text-slate-500">No pending approvals found.</div>
        )}
      </div>
    </div>
  );
};

export default Pending;
 
