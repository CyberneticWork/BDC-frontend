import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getStockTransfers, addStockTransfer, getProducts, fetchStockTransfers } from "../../services/Inventory/inventoryService";
import { fetchCenters } from "../../services/Inventory/centerService";
// Payment component removed

const StockTransfer = () => {
  const [transfers, setTransfers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextStId, setNextStId] = useState("");

  useEffect(() => {
    const initial = getStockTransfers();
    setTransfers(initial);
  }, []);

  useEffect(() => {
    const nums = transfers
      .map((t) => {
        const m = String(t.id || "").match(/^ST-(\d{4})$/i);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n) => n !== null);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    setNextStId(`ST-${String(next).padStart(4, "0")}`);
  }, [transfers]);

  // formatLKR removed — amount display is no longer shown in the form UI

    const InlineNewInvoiceForm = ({ nextStId }) => {
    const [formData, setFormData] = useState({
      id: "",
      fromCenter: "",
      toCenter: "",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      amount: 0,
      // kept for backward compatibility where needed
      productName: "",
      quantity: 0,
    });
    const [errors, setErrors] = useState({});
    const [items, setItems] = useState([]);
    // Payment modal and pendingInvoice removed

    // Entry state and typeahead like SalesOrder page
    const [entry, setEntry] = useState({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const productInputRef = useRef(null);

    useEffect(() => {
      setFormData((p) => ({ ...p, id: nextStId }));
    }, [nextStId]);

    const [centers, setCenters] = useState([]);
    const [centersLoading, setCentersLoading] = useState(false);
    const [centersError, setCentersError] = useState(null);

    // Products available for the selected center
    const [centerProducts, setCenterProducts] = useState([]);
    const [centerProductsLoading, setCenterProductsLoading] = useState(false);
    const [centerProductsError, setCenterProductsError] = useState(null);

    useEffect(() => {
      let mounted = true;
      const loadCenters = async () => {
        try {
          setCentersLoading(true);
          const res = await fetchCenters();
          if (!mounted) return;
          // res may be array of objects or array of strings
          setCenters(Array.isArray(res) ? res : []);
        } catch (err) {
          console.error('Failed to load centers:', err);
          setCentersError(err?.message || String(err));
        } finally {
          if (mounted) setCentersLoading(false);
        }
      };
      loadCenters();
      return () => { mounted = false; };
    }, []);
    // const suppliers = getSuppliers();
    // Products source: prefer products available for selected center, fallback to static getProducts()
    const products = useMemo(() => (Array.isArray(centerProducts) && centerProducts.length ? centerProducts : (getProducts?.() || [])), [centerProducts]);

    // Load products for selected center (uses existing service function `fetchStockTransfers`)
    useEffect(() => {
      let mounted = true;
      const loadProductsForCenter = async () => {
        const centerId = formData.fromCenter;
        if (!centerId) {
          // reset to default static products when no center selected
          setCenterProducts([]);
          setCenterProductsError(null);
          return;
        }
        try {
          setCenterProductsLoading(true);
          const raw = await fetchStockTransfers();
          const stocks = Array.isArray(raw) ? raw : (raw?.data ?? []);

          const collected = [];
          stocks.forEach((s) => {
            const stockCenterId = s.center_id ?? s.centerId ?? s.center?.id ?? s.center;
            if (String(stockCenterId) !== String(centerId)) return;

            // If entry contains products array
            if (Array.isArray(s.products) && s.products.length) {
              s.products.forEach((p) => {
                collected.push({
                  id: p.id ?? p.product_id ?? p.productId,
                  name: p.productName ?? p.name ?? p.product ?? "",
                  sku: p.sku ?? p.code ?? "",
                  unitPrice: p.unitPrice ?? p.unit_price ?? p.price ?? 0,
                  currentstock: p.currentstock ?? p.currentStock ?? p.quantity ?? p.qty ?? 0,
                });
              });
              return;
            }

            // If entry itself is a product record
            if (s.product || s.product_id || s.productName || s.name) {
              const p = s.product ?? s;
              collected.push({
                id: p.id ?? p.product_id ?? p.productId ?? s.id,
                name: p.productName ?? p.name ?? p.product ?? s.productName ?? "",
                sku: p.sku ?? p.code ?? "",
                unitPrice: p.unitPrice ?? p.unit_price ?? p.price ?? 0,
                currentstock: p.currentstock ?? p.currentStock ?? p.quantity ?? p.qty ?? s.currentstock ?? 0,
              });
              return;
            }

            // fallback: top-level product fields
            if (s.productName || s.name || s.sku) {
              collected.push({
                id: s.product_id ?? s.id,
                name: s.productName ?? s.name ?? "",
                sku: s.sku ?? "",
                unitPrice: s.unitPrice ?? s.unit_price ?? 0,
                currentstock: s.currentstock ?? s.quantity ?? s.qty ?? 0,
              });
            }
          });

          // deduplicate by id or name
          const seen = new Map();
          const deduped = [];
          collected.forEach((p) => {
            const key = p.id ?? p.name;
            if (!seen.has(String(key))) {
              seen.set(String(key), true);
              deduped.push(p);
            }
          });

          if (!mounted) return;
          setCenterProducts(deduped);
          setCenterProductsError(null);
        } catch (err) {
          console.error('Failed to load center products:', err);
          if (!mounted) return;
          setCenterProductsError(err?.message || String(err));
          setCenterProducts([]);
        } finally {
          if (mounted) setCenterProductsLoading(false);
        }
      };
      loadProductsForCenter();
      return () => { mounted = false; };
    }, [formData.fromCenter]);

    const filteredProducts = useMemo(() => {
      const q = (entry.productName || "").toLowerCase().trim();
      if (!q) return products.slice(0, 8);
      return products
        .filter((p) => (p.name || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q))
        .slice(0, 8);
    }, [entry.productName, products]);

    const tableTotal = useMemo(() => {
      return items.reduce((acc, it) => {
        const qty = Number(it.quantity) || 0;
        const unit = Number(it.unitPrice) || 0;
        const disc = (it.discountEnabled ? Number(it.discount) : 0) || 0;
        const lineTotal = unit * qty;
        const lineDiscount = disc * qty;
        return acc + (lineTotal - lineDiscount);
      }, 0);
    }, [items]);

    useEffect(() => {
      setFormData((p) => ({ ...p, amount: tableTotal }));
    }, [tableTotal]);

    const validateForm = () => {
      const e = {};
      if (!formData.id) e.id = "Invoice number not generated";
      if (!formData.fromCenter) e.fromCenter = "From Center is required";
      if (!formData.toCenter) e.toCenter = "To Center is required";
      if (!formData.date) e.date = "Date is required";
      if ((items?.length || 0) === 0) e.items = "Add at least one item";
      setErrors(e);
      return Object.keys(e).length === 0;
    };

    const handleAddItem = () => {
      const name = (entry.productName || "").trim();
      const selected = entry.productId
        ? products.find((p) => String(p.id) === String(entry.productId))
        : products.find((p) => (p.name || "").toLowerCase() === name.toLowerCase());
      const qty = Math.max(1, Number(entry.quantity) || 1);
      const unitPrice = selected ? Number(selected.unitPrice) || 0 : Number(entry.unitPrice) || 0;
      if (!name) {
        setErrors((prev) => ({ ...prev, productName: "Product name is required" }));
        return;
      }
      const newItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name,
        quantity: qty,
        unitPrice: Math.max(0, unitPrice),
        discount: 0,
        discountEnabled: false,
        mrp: selected ? Number(selected.mrp) || 0 : 0,
        currentStock: selected ? selected.currentstock || 0 : 0,
      };
      setItems((prev) => [...prev, newItem]);
      setEntry({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
      setShowSuggestions(false);
      setActiveIndex(-1);
      setErrors((prev) => ({ ...prev, productName: undefined }));
    };

    const updateItemField = (id, field, value) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
    };

    const deleteItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      const firstItem = items[0];
      const computedAmount = items.reduce((acc, it) => {
        const qty = Number(it.quantity) || 0;
        const unit = Number(it.unitPrice) || 0;
        const disc = (it.discountEnabled ? Number(it.discount) : 0) || 0;
        const lineTotal = unit * qty;
        const lineDiscount = disc * qty;
        return acc + (lineTotal - lineDiscount);
      }, 0);

      const invoiceData = {
        ...formData,
        amount: computedAmount || formData.amount,
        items,
        productName: firstItem ? firstItem.name : "",
        quantity: firstItem ? firstItem.quantity : 0,
      };

      // Directly add invoice, no payment modal
      setIsSubmitting(true);
      try {
        let nextIdForReset = null;
  const newTransfer = addStockTransfer(invoiceData);
  setTransfers((prev) => [...prev, newTransfer]);
        // compute and set next ST id by incrementing current nextStId
        try {
          const m = String(nextStId || "").match(/^ST-(\d{4})$/i);
          const curr = m ? parseInt(m[1], 10) : 0;
          const nextNum = curr + 1;
          const nextId = `ST-${String(nextNum).padStart(4, "0")}`;
          setNextStId(nextId);
          nextIdForReset = nextId;
        } catch {
          // ignore and keep existing nextStId on failure
        }
        setErrors({});
        setFormData({
          id: nextIdForReset || nextStId,
          fromCenter: "",
          toCenter: "",
          date: new Date().toISOString().split("T")[0],
          status: "pending",
          amount: 0,
          productName: "",
          quantity: 0,
        });
        setItems([]);
      } finally {
        setIsSubmitting(false);
      }
    };

    // finalizeInvoiceWithPayment removed

    return (
      <>
        <div className="bg-slate-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase">Stock Transfer Management</h1>
              <div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">Transfer ID: {nextStId}</div>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">Efficiently manage and track your stock transfers across centers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-slate-900 border-b border-slate-200 pb-4">Create New Stock Transfer</h3>
          <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 mb-6 sm:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Transfer Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? "date-error" : undefined}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.date ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`}
                  />
                  {errors.date && <p id="date-error" className="text-red-600 text-sm mt-1 font-medium">{errors.date}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">From Center *</label>
                  <select
                    value={formData.fromCenter}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fromCenter: e.target.value }))}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.fromCenter ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`}
                  >
                    <option value="">Select source center</option>
                    {centersLoading ? (
                      <option value="">Loading centers...</option>
                    ) : centersError ? (
                      <option value="">Error loading centers</option>
                    ) : Array.isArray(centers) && centers.length === 0 ? (
                      <option value="">No centers available</option>
                    ) : (
                      centers.map((c) => (
                        <option key={c?.id ?? c} value={c?.id ?? c}>{c?.centerName ?? c?.name ?? c?.center_name ?? c}</option>
                      ))
                    )}
                  </select>
                  {errors.fromCenter && <p className="text-red-600 text-sm mt-1 font-medium">{errors.fromCenter}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">To Center *</label>
                  <select
                    value={formData.toCenter}
                    onChange={(e) => setFormData((prev) => ({ ...prev, toCenter: e.target.value }))}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.toCenter ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`}
                  >
                    <option value="">Select destination center</option>
                    {centersLoading ? (
                      <option value="">Loading centers...</option>
                    ) : centersError ? (
                      <option value="">Error loading centers</option>
                    ) : Array.isArray(centers) && centers.length === 0 ? (
                      <option value="">No centers available</option>
                    ) : (
                      centers.map((c) => (
                        <option key={c?.id ?? c} value={c?.id ?? c}>{c?.centerName ?? c?.name ?? c?.center_name ?? c}</option>
                      ))
                    )}
                  </select>
                  {errors.toCenter && <p className="text-red-600 text-sm mt-1 font-medium">{errors.toCenter}</p>}
                </div>
              </div>

              {/* Product Section - SalesOrder-like entry */}
              <div className="mb-6 sm:mb-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-4">Product Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="sm:col-span-3 space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name *</label>
                    <div
                      className="relative"
                      onKeyDown={(e) => {
                        if (!showSuggestions && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                          setShowSuggestions(true);
                          return;
                        }
                        if (!showSuggestions) return;
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setActiveIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setActiveIndex((prev) => Math.max(prev - 1, 0));
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (activeIndex >= 0 && filteredProducts[activeIndex]) {
                            const p = filteredProducts[activeIndex];
                            setEntry({ productId: p.id, productName: p.name, quantity: 1, unitPrice: Number(p.unitPrice) || 0 });
                            setShowSuggestions(false);
                            setActiveIndex(-1);
                          } else {
                            handleAddItem();
                          }
                        } else if (e.key === "Escape") {
                          setShowSuggestions(false);
                          setActiveIndex(-1);
                        }
                      }}
                    >
                      <input
                        ref={productInputRef}
                        type="text"
                        value={entry.productName}
                        onFocus={() => setShowSuggestions(true)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEntry((p) => ({ ...p, productId: "", productName: val }));
                          setShowSuggestions(true);
                          setActiveIndex(-1);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 150);
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.productName ? "border-red-300 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"}`}
                        placeholder="Search product by name or SKU"
                      />
                      {showSuggestions && filteredProducts.length > 0 && (
                        <ul className="absolute z-20 mt-2 w-full max-h-60 overflow-auto rounded-lg border-2 border-slate-200 bg-white shadow-xl">
                          {filteredProducts.map((p, idx) => (
                            <li
                              key={p.id}
                              className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-b-0 ${idx === activeIndex ? "bg-blue-50 border-blue-200" : "hover:bg-slate-50"}`}
                              onMouseEnter={() => setActiveIndex(idx)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setEntry({ productId: p.id, productName: p.name, quantity: 1, unitPrice: Number(p.unitPrice) || 0 });
                                setShowSuggestions(false);
                                setActiveIndex(-1);
                                productInputRef.current?.blur();
                              }}
                            >
                              <span className="text-sm font-medium text-slate-900">{p.name}</span>
                              <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{p.sku}</span>
                              <span className="ml-auto text-xs text-slate-600 font-semibold">LKR {Number(p.unitPrice || 0).toFixed(2)}{typeof p.currentstock !== "undefined" ? ` • Stock: ${p.currentstock}` : ""}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {errors.productName && <p className="text-red-600 text-sm mt-1 font-medium">{errors.productName}</p>}
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={handleAddItem} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md">
                      <Plus className="h-5 w-5" />
                      Add Item
                    </button>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="mt-6 overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm">
                        <table className="min-w-[400px] w-full divide-y divide-slate-200">
                          <thead className="bg-slate-100 sticky top-0 z-10">
                            <tr>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">No</th>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Product Name</th>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity</th>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {items.map((it, idx) => (
                              <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">{idx + 1}</td>
                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-900 font-semibold">{it.name}</td>
                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="1"
                                    value={it.quantity}
                                    onChange={(e) => updateItemField(it.id, "quantity", parseInt(e.target.value) || 0)}
                                    aria-label={`Quantity for ${it.name}`}
                                    className="w-24 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
                                  />
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => deleteItem(it.id)}
                                    className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 hover:text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors border border-red-200 hover:border-red-600"
                                    aria-label={`Remove ${it.name} from list`}
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-3 shadow-lg w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing Transfer...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Create Stock Transfer
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Payment modal removed */}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
                <section aria-label="Create new stock transfer">
          <InlineNewInvoiceForm nextStId={nextStId} />
        </section>
      </div>
    </div>
  );
};

export default StockTransfer;