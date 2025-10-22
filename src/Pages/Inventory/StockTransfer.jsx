import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getStockTransfers, addStockTransfer, getProducts } from "../../services/Inventory/inventoryService";
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

    const centers = ["Main Center", "Branch A", "Branch B", "Warehouse 01"];
    // const suppliers = getSuppliers();
    const products = useMemo(() => getProducts?.() || [], []);

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
      if (!formData.fromCenter.trim()) e.fromCenter = "From Center is required";
      if (!formData.toCenter.trim()) e.toCenter = "To Center is required";
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
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900"> Stock Transfer</h1>
              <div className="text-red-600 font-bold mt-1 text-md sm:text-base">Stock Transfer Number : {nextStId}</div>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and track your Stock Transfers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Create New Stock Transfer</h3>
          <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? "date-error" : undefined}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.date ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.date && <p id="date-error" className="text-red-500 text-sm mt-1">{errors.date}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Center *</label>
                    <select
                      value={formData.fromCenter}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fromCenter: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.fromCenter ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="">Select a center</option>
                      {centers.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.fromCenter && <p className="text-red-500 text-sm mt-1">{errors.fromCenter}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Center *</label>
                    <select
                      value={formData.toCenter}
                      onChange={(e) => setFormData((prev) => ({ ...prev, toCenter: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.toCenter ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="">Select a center</option>
                      {centers.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.toCenter && <p className="text-red-500 text-sm mt-1">{errors.toCenter}</p>}
                  </div>
                </div>
              </div>

              {/* Product Section - SalesOrder-like entry */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Product Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.productName ? "border-red-500" : "border-gray-300"}`}
                        placeholder="Type to search product (name or SKU)"
                      />
                      {showSuggestions && filteredProducts.length > 0 && (
                        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                          {filteredProducts.map((p, idx) => (
                            <li
                              key={p.id}
                              className={`px-3 py-2 cursor-pointer flex justify-between items-center ${idx === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"}`}
                              onMouseEnter={() => setActiveIndex(idx)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setEntry({ productId: p.id, productName: p.name, quantity: 1, unitPrice: Number(p.unitPrice) || 0 });
                                setShowSuggestions(false);
                                setActiveIndex(-1);
                                productInputRef.current?.blur();
                              }}
                            >
                              <span className="text-sm text-gray-900">{p.name}</span>
                              <span className="ml-2 text-xs text-gray-500">{p.sku}</span>
                              <span className="ml-auto text-xs text-gray-600">LKR {Number(p.unitPrice || 0).toFixed(2)}{typeof p.currentstock !== "undefined" ? ` • Stock ${p.currentstock}` : ""}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {errors.productName && <p className="text-red-500 text-sm mt-1">{errors.productName}</p>}
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={handleAddItem} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 ">
                      <Plus className="h-4 w-4" />
                      Add to List
                    </button>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <table className="min-w-[400px] w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                              <th scope="col" className="px-2 sm:px-3 py-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {items.map((it, idx) => (
                              <tr key={it.id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100/60">
                                <td className="px-3 sm:px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{idx + 1}</td>
                                <td className="px-3 sm:px-4 py-2 text-sm text-gray-900">{it.name}</td>
                                <td className="px-3 sm:px-4 py-2 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="1"
                                    value={it.quantity}
                                    onChange={(e) => updateItemField(it.id, "quantity", parseInt(e.target.value) || 0)}
                                    aria-label={`Quantity for ${it.name}`}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </td>
                                <td className="px-2 sm:px-3 py-2 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => deleteItem(it.id)}
                                    className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                                    aria-label={`Remove ${it.name} from list`}
                                  >
                                    <Trash2 className="h-4 w-4" />
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

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 w-full "
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <section aria-label="Create new invoice">
          <InlineNewInvoiceForm nextStId={nextStId} />
        </section>
      </div>
    </div>
  );
};

export default StockTransfer;