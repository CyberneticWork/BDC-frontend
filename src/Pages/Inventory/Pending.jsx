import React, { useEffect, useMemo, useState } from "react";
import { getPendingInvoices, approveInvoice, rejectInvoice } from "../../services/Inventory/pendingService";
import { useAuth } from "../../contexts/AuthContext";

const Pending = () => {
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ action: null, invoice: null });
  const { user } = useAuth();

  const openConfirmModal = (action, invoice) => setConfirmModal({ action, invoice });
  const closeConfirmModal = () => setConfirmModal({ action: null, invoice: null });
  const confirmAction = () => {
    if (!confirmModal.action || !confirmModal.invoice) return;
    if (confirmModal.action === "approve") handleApprove(confirmModal.invoice);
    if (confirmModal.action === "reject") handleReject(confirmModal.invoice.id);
    closeConfirmModal();
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPendingInvoices();
        setPendingInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err?.message || "Failed to load pending invoices");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = (invoice) => {
    if (!invoice) return;
    const approverName =
      user?.name || user?.fullName || user?.username || user?.email || "Inventory Approver";
    const updatedInvoice = {
      ...invoice,
      status: "completed",
      is_confirmed: 1,
      approvedBy: approverName,
      approved_by: approverName,
    };
    console.log("Approving invoice details:", updatedInvoice);
    approveInvoice(invoice.id);
    setPendingInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? updatedInvoice : inv)));
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
    return ((inv.customer || "") + "").toLowerCase().includes(q) || ((inv.id || "") + "").toLowerCase().includes(q);
  });

  const statusSummary = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, inv) => {
        if (inv.status === "approved" || inv.status === "completed") acc.approved += 1;
        else if (inv.status === "rejected") acc.rejected += 1;
        else acc.pending += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  }, [filteredInvoices]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <section className="rounded-3xl bg-white shadow-xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Inventory</p>
            <h1 className="text-3xl font-semibold text-slate-900">Pending Approvals</h1>
            <p className="text-sm text-slate-500">Scan, review, and approve invoices with confidence.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <input
              type="text"
              placeholder="Search by invoice ID, customer or center"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:w-80 px-4 py-3 rounded-2xl bg-slate-100 border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
            />

            <div className="w-full lg:w-auto">
              <div className="rounded-2xl px-4 py-2 text-center border bg-amber-100 border-amber-300 text-amber-700">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pending</p>
                <p className="text-2xl font-semibold text-slate-900">{statusSummary.pending}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {loading && (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-600">Loading pending approvals…</div>
          )}
          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">Error: {error}</div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredInvoices.map((inv, idx) => {
              const firstItem = (inv.items && inv.items[0]) || {};
              const pName =
                firstItem.product?.name ||
                firstItem.name ||
                firstItem.product_name ||
                firstItem.productName ||
                "—";
              const pCode =
                firstItem.product?.code || firstItem.product_code || "—";
              const pUnit =
                firstItem.cost ??
                firstItem.unitPrice ??
                firstItem.unit_price ??
                firstItem.rate ??
                0;
              const totalQty = (inv.items || []).reduce(
                (s, it) => s + (it.quantity ?? it.qty ?? 0),
                0
              );

              // Resolve MRP and minimum price from various possible shapes
              // Parse numeric strings and prefer product-level values when item-level values are zero or absent
              const parsePositive = (v) => {
                if (v == null) return null;
                const n = Number(String(v).replace(/[^0-9.-]+/g, ""));
                return Number.isFinite(n) && n > 0 ? n : null;
              };

              const pMrp =
                parsePositive(firstItem.mrp ?? firstItem.MRP ?? firstItem.mrp_price ?? firstItem.mrpPrice ?? firstItem.price ?? firstItem.unitPrice) ??
                parsePositive(firstItem.product?.mrp) ??
                0;

              const pMinPrice =
                parsePositive(firstItem.minPrice ?? firstItem.min_price ?? firstItem.min_rate ?? firstItem.minimum) ??
                parsePositive(firstItem.product?.minPrice ?? firstItem.product?.min_price) ??
                0;

              // Normalize batch / OEM values: return a usable string or null
              const normalizeValue = (v) => {
                if (v == null) return null;
                if (Array.isArray(v)) return v.length ? v.join(", ") : null;
                if (typeof v === "string") return v.trim() ? v.trim() : null;
                return String(v);
              };

              // Only treat explicit item batch_number as Batch Number for UI
              const batchValue = normalizeValue(firstItem.batch_number);

              return (
              <article key={inv.id || idx} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
                <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Invoice #{idx + 1}</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {inv.voucherNumber || inv.invoiceNumber || ""}
                      </p>
                      <p className="text-sm text-slate-600">{inv.customer || "Unknown customer"}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold uppercase px-3 py-1 rounded-full border ${
                        inv.status === "approved"
                          ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                          : inv.status === "rejected"
                          ? "border-rose-300 bg-rose-100 text-rose-700"
                          : "border-amber-300 bg-amber-100 text-amber-700"
                      }`}
                    >
                      {inv.status || "Pending"}
                    </span>
                  </div>
                  
                </div>

                {/* Summary: show only the requested five fields */}
                <div className="mt-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <div className="text-xs text-slate-400 uppercase">Voucher</div>
                      <div className="text-sm font-semibold text-slate-900 truncate">{inv.voucherNumber || inv.invoiceNumber || "—"}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400 uppercase">Date</div>
                      <div className="text-sm font-semibold text-slate-900">{inv.date ? new Date(inv.date).toLocaleDateString() : "—"}</div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 uppercase">Center</div>
                      <div className="text-sm font-semibold text-slate-900">{inv.centerName || inv.center || "—"}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400 uppercase">Amount</div>
                      <div className="text-sm font-semibold text-slate-900">Rs. {(inv.amount ?? 0).toLocaleString()}</div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 uppercase">Discount</div>
                      <div className="text-sm font-semibold text-rose-600">Rs. {(inv.discount ?? 0).toLocaleString()}</div>
                    </div>
                    <div />
                  </div>
                </div>

    
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => openConfirmModal("approve", inv)}
                    disabled={inv.status && inv.status !== "pending"}
                    className="flex-1 whitespace-nowrap rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openConfirmModal("reject", inv)}
                    disabled={inv.status && inv.status !== "pending"}
                    className="flex-1 whitespace-nowrap rounded-2xl bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-rose-500 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => toggleExpanded(inv.id)}
                    className="flex-1 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900"
                  >
                    {expandedItems.has(inv.id) ? "Hide Details" : "View Details"}
                  </button>
                </div>

                {expandedItems.has(inv.id) && (
                  <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    {/* Additional details shown only when expanded */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 text-sm text-slate-700">
                      <div>
                        <div className="text-xs text-slate-400">Creator</div>
                        <div className="font-medium text-slate-900">{(inv.creator && inv.creator.name) || inv.created_by || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Reference</div>
                        <div className="font-medium text-slate-900">{inv.refNumber || inv.reference || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Product</div>
                        <div className="font-medium text-slate-900">{pName}</div>
                       
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Total Qty</div>
                        <div className="font-medium text-slate-900">{totalQty}</div>
                      </div>
                       <div>
                        <div className="text-xs text-slate-400">Product Code</div>
                        <div className="font-medium text-slate-900">{pCode}</div>
                      </div>
                         <div>
                        <div className="text-xs text-slate-400">Unit Price</div>
                        <div className="font-medium text-slate-900">Rs. {Number(pUnit).toLocaleString()}</div>
                      </div>
                          <div>
                            <div className="text-xs text-slate-400">MRP</div>
                            <div className="font-medium text-slate-900">Rs. {pMrp.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">Min Price</div>
                            <div className="font-medium text-slate-900">Rs. {pMinPrice.toLocaleString()}</div>
                          </div>
                          {batchValue && (
                            <div>
                              <div className="text-xs text-slate-400">Batch Number</div>
                              <div className="font-medium text-slate-900">{batchValue}</div>
                            </div>
                          )}
                    </div>
                    
                  </div>
                )}
              </article>
              );
            })}
          </div>

          {!loading && filteredInvoices.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">No pending approvals found.</div>
          )}
        </section>
      </div>
      {confirmModal.action && confirmModal.invoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div>
              <p className="text-sm text-slate-500">Are you sure?</p>
              <h2 className="text-xl font-semibold text-slate-900">
                {confirmModal.action === "approve" ? "Approve" : "Reject"} {confirmModal.invoice.voucherNumber || confirmModal.invoice.invoiceNumber || `#${confirmModal.invoice.id}`}
              </h2>
            </div>
            <p className="text-sm text-slate-600">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 text-sm rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 text-sm rounded-2xl text-white ${confirmModal.action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
              >
                {confirmModal.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pending;

