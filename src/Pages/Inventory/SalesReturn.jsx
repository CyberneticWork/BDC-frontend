import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, CheckCircle, X } from "lucide-react";
// Sales Orders come from AccountingService; centers/products from Inventory service
import { addSalesOrder, getSalesOrders } from "../../services/AccountingService";
import { getCenters, getProducts, getCustomers  } from "../../services/Inventory/inventoryService";  // dummy data inventoryService.js

/**
 * SalesReturn Component - Manages sales return creation and management
 * Handles form submission, item management, and customer/product selection
 */
const SalesReturn = () => {
  // ===== STATE MANAGEMENT =====
  // Main component state for orders and UI control
  const [orders, setOrders] = useState([]); // List of existing sales returns
  const [nextSONumber, setNextSONumber] = useState(""); // Next available return number
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for form submission
  const [showSuccess, setShowSuccess] = useState(false); // Success modal visibility
  const [successText, setSuccessText] = useState(""); // Success message text

  // ===== EFFECTS =====
  // Load initial sales returns data on component mount
  useEffect(() => {
    const initial = getSalesOrders();
    setOrders(initial);
  }, []);

  // Generate next sales return number based on existing orders
  useEffect(() => {
    // Compute next SO number from existing orders; accept with/without dash and preserve higher current state
    const nums = orders
      .map((o) => {
        const m = String(o.orderNumber || "").match(/^SRET-?(\d+)$/i);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n) => n !== null);
    const fromOrders = nums.length ? Math.max(...nums) + 1 : 1;
    setNextSONumber((prev) => {
      const pm = String(prev || "").match(/^SRET-?(\d+)$/i);
      const prevNum = pm ? parseInt(pm[1], 10) : 0;
      const finalNum = Math.max(fromOrders, prevNum || 0);
      return `SRET-${String(finalNum).padStart(4, "0")}`;
    });
  }, [orders]);

  // ===== UTILITY FUNCTIONS =====
  // Success modal stays until user dismisses; no auto-hide

  // Format currency values to Sri Lankan Rupees
  const formatLKR = (value) => {
    try {
      return new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
      }).format(Number(value || 0));
    } catch {
      const num = Number(value || 0).toFixed(2);
      return `LKR ${num}`;
    }
  };

  /**
   * InlinePOForm Component - Inner form component for sales return creation
   * Contains all form fields, item management, and validation logic
   */
  const InlinePOForm = ({ nextSONumber }) => {
    // ===== FORM STATE =====
    const [form, setForm] = useState({
      orderNumber: "",
      center: "",
      customer: "",
      date: new Date().toISOString().split("T")[0],
      status: "Draft",
      refNumber: "",
    });
    const [items, setItems] = useState([]); // Array of return items
    const [entry, setEntry] = useState({ productId: "", productName: "", quantity: 1, unitPrice: 0 }); // Current item entry
    const [errors, setErrors] = useState({}); // Form validation errors
    const [customers, setCustomers] = useState([]); // Fetched customers from API

    // ===== TYPEAHEAD STATE =====
    // Product search suggestions state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const productInputRef = useRef(null);

    // ===== EFFECTS =====
    // Set order number when nextSONumber prop changes
    useEffect(() => {
      setForm((p) => ({ ...p, orderNumber: nextSONumber }));
    }, [nextSONumber]);

    // Fetch customers from API on component mount
    useEffect(() => {
      const fetchCustomers = async () => {
        try {
          const data = await getCustomers();
          setCustomers(data);
        } catch (error) {
          console.error('Error fetching customers:', error);
        }
      };
      fetchCustomers();
    }, []);

    // ===== COMPUTED VALUES =====
    // Static data from services
    const centers = useMemo(() => getCenters() || [], []); // Available centers
    const products = useMemo(() => getProducts() || [], []); // Available products

    // Filter products based on search input for typeahead
    const filteredProducts = useMemo(() => {
      const q = (entry.productName || "").toLowerCase().trim();
      if (!q) return products.slice(0, 8);
      return products
        .filter((p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q)
        )
        .slice(0, 8);
    }, [entry.productName, products]);

    // Build customer options from fetched customers
    const customerOptions = useMemo(() => {
      return customers.map(c => c.name).filter(Boolean);
    }, [customers]);

    // ===== UTILITY FUNCTIONS =====
    // Parse discount input (supports percentage or fixed amount)
    const parseDiscount = (input, base) => {
      const s = String(input || "").trim();
      if (!s) return 0;
      if (s.endsWith("%")) {
        const pct = parseFloat(s.slice(0, -1));
        if (!isFinite(pct) || pct <= 0) return 0;
        return Math.min(base, (base * pct) / 100);
      }
      const amt = parseFloat(s);
      if (!isFinite(amt) || amt <= 0) return 0;
      return Math.min(base, amt);
    };

    // Calculate totals from items
    const { subtotal, discountTotal } = useMemo(() => {
      let sub = 0;
      let disc = 0;
      for (const it of items) {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.unitPrice) || 0;
        const gross = qty * price;
        const dAmt = parseDiscount(it.discountInput, gross);
        disc += dAmt;
        sub += Math.max(0, gross - dAmt);
      }
      return { subtotal: sub, discountTotal: disc };
    }, [items]);

    // Calculate tax (10% of subtotal)
    const tax = useMemo(() => {
      return (subtotal || 0) * 0.1;
    }, [subtotal]);

    // Calculate final total amount
    const totalAmount = useMemo(() => Math.max(0, subtotal) + tax, [subtotal, tax]);

    // ===== VALIDATION =====
    // Validate form before submission
    const validate = () => {
      const e = {};
      if (!form.orderNumber) e.orderNumber = "SRET number not generated";
      if (!form.center.trim()) e.center = "Center is required";
      if (!form.customer?.trim()) e.customer = "Customer is required";
      if (!form.date) e.date = "Date is required";
      if (items.length === 0) e.items = "Add at least one item";
      setErrors(e);
      return Object.keys(e).length === 0;
    };

    // ===== ITEM MANAGEMENT =====
    // Add new item to the return list
    const addItem = () => {
      const name = (entry.productName || "").trim();
      const selected = entry.productId ? products.find((p) => String(p.id) === String(entry.productId)) : products.find((p) => (p.name || "").toLowerCase() === name.toLowerCase());
      const qty = Math.max(1, Number(entry.quantity) || 1);
      const unitPrice = selected ? Number(selected.unitPrice) || 0 : Number(entry.unitPrice) || 0;
      const currentStock = selected ? Number(selected.currentstock) || 0 : 0;
      const mrp = selected ? Number(selected.mrp) || 0 : 0;
      const e = {};
      if (!name) e.productName = "Product is required";
      if (unitPrice < 0) e.unitPrice = "Unit price cannot be negative";
      setErrors((prev) => ({ ...prev, ...e }));
      if (Object.keys(e).length) return;
      setItems((prev) => [
        ...prev,
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          productId: selected ? selected.id : undefined,
          productName: name,
          quantity: qty,
          unitPrice: Math.max(0, unitPrice),
          currentStock,
          mrp,
          discountInput: "",
        },
      ]);
      setEntry({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
    };

    // Update existing item field
    const updateItem = (id, field, rawValue) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          if (field === "discountInput") {
            return { ...it, discountInput: String(rawValue || "") };
          }
          const num = typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;
          if (field === "quantity") return { ...it, quantity: Math.max(1, Math.floor(num)) };
          if (field === "unitPrice") {
            return { ...it, unitPrice: Math.max(0, num) };
          }
          return it;
        })
      )
    };

    // Remove item from return list
    const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

    // ===== FORM SUBMISSION =====
    // Handle form submission
    const onSubmit = async (e) => {
      e.preventDefault();
      if (!validate()) return;
      setIsSubmitting(true);
      try {
        // Prepare payload with calculated values
        const payload = {
          ...form,
          items: items.map((it) => {
            const qty = Number(it.quantity) || 0;
            const price = Number(it.unitPrice) || 0;
            const gross = qty * price;
            const dAmt = parseDiscount(it.discountInput, gross);
            return {
              ...it,
              lineGross: gross,
              lineDiscountInput: it.discountInput || "",
              lineDiscountAmount: dAmt,
              lineNet: Math.max(0, gross - dAmt),
            };
          }),
          subtotal,
          discountTotal,
          tax,
          totalAmount,
        };
        const created = addSalesOrder(payload);
        setOrders((prev) => [...prev, created]);
        // Show success message
        const createdNumber = created?.orderNumber || nextSONumber;
        setSuccessText(`Sales return ${createdNumber} created successfully.`);
        setShowSuccess(true);
        // Update next number for display
        const m = String(createdNumber).match(/^SRET-?(\d+)$/i);
        if (m) {
          const nextNum = Number(m[1]) + 1;
          setNextSONumber(`SRET-${String(nextNum).padStart(4, "0")}`);
        }
        // Reset form after successful submission
        setForm({ orderNumber: "", center: "", customer: "", date: new Date().toISOString().split("T")[0], status: "Draft", refNumber: "" });
        setItems([]);
        setEntry({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
        setErrors({});
      } finally {
        setIsSubmitting(false);
      }
    };

    // ===== RENDER =====
    return (
      <>
        {/* ===== HEADER SECTION ===== */}
        <div className="bg-slate-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="uppercase text-2xl sm:text-3xl font-bold text-slate-900">Sales Return Management</h1>
              <div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">Return ID: {nextSONumber}</div>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">Efficiently manage and track your sales returns across centers</p>
            </div>
          </div>
        </div>

        {/* ===== MAIN FORM ===== */}
        <div className="bg-slate-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-6 mb-6 sm:mb-8">
              {/* ===== FORM FIELDS ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
                {/* Return Date Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Return Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.date ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`} />
                  {errors.date && <p className="text-red-600 text-sm mt-1 font-medium">{errors.date}</p>}
                </div>

                {/* Center Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Center *</label>
                  <select
                    value={form.center}
                    onChange={(e) => setForm((p) => ({ ...p, center: e.target.value }))}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.center ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`}
                  >
                    <option value="">Select a center</option>
                    {centers.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.center && <p className="text-red-600 text-sm mt-1 font-medium">{errors.center}</p>}
                </div>

                {/* Customer Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Customer Information *</label>
                  <select
                    value={form.customer}
                    onChange={(e) => setForm((p) => ({ ...p, customer: e.target.value }))}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.customer ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`}
                  >
                    <option value="">Select customer</option>
                    {customerOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.customer && <p className="text-red-600 text-sm mt-1 font-medium">{errors.customer}</p>}
                </div>
              </div>

              {/* ===== REFERENCE AND TOTAL ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
                {/* Reference Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    value={form.refNumber}
                    onChange={(e) => setForm((p) => ({ ...p, refNumber: e.target.value }))}
                    placeholder="Enter reference number"
                    className="w-full px-4 py-3 border-2 border-slate-300 bg-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors" />
                </div>

                {/* Total Amount Display */}
                <div className="lg:place-self-end pr-65 text-center bg-slate-100 rounded-lg p-4 border border-slate-200">
                  <p className="text-lg font-semibold text-slate-700">Total Amount</p>
                  <p className="text-3xl font-bold text-slate-900">{formatLKR(subtotal)}</p>
                </div>
              </div>

              {/* ===== ITEMS ENTRY SECTION ===== */}
              <div className="mb-6 sm:mb-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-4">Add Items</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  {/* Product Search Input */}
                  <div className="sm:col-span-3 space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name *</label>
                    <div className="relative" onKeyDown={(e) => {
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
                        }
                      } else if (e.key === "Escape") {
                        setShowSuggestions(false);
                        setActiveIndex(-1);
                      }
                    } }>
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
                        } }
                        onBlur={() => {
                          // Delay hiding to allow click selection
                          setTimeout(() => setShowSuggestions(false), 150);
                        } }
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.productName ? "border-red-300 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"}`}
                        placeholder="Search product by name or SKU" />
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
                              } }
                            >
                              <span className="text-sm font-medium text-slate-900">{p.name}</span>
                              <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{p.sku}</span>
                              <span className="ml-auto text-xs text-slate-600 font-semibold">LKR {Number(p.unitPrice || 0).toFixed(2)} • MRP {Number(p.mrp || 0).toFixed(2)} • Stock {p.currentstock}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {errors.productName && <p className="text-red-600 text-sm mt-1 font-medium">{errors.productName}</p>}
                  </div>

                  {/* Add Item Button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md">
                      <Plus className="h-5 w-5" />
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* ===== ITEMS TABLE ===== */}
              {items.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm">
                      <table className="min-w-[880px] w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">No</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Product Name</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Unit Price</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Current Stock</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Qty</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">MRP</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Discount</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Total</th>
                            <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {items.map((it, idx) => {
                            const rowQty = Number(it.quantity) || 0;
                            const rowPrice = Number(it.unitPrice) || 0;
                            const rowGross = rowQty * rowPrice;
                            const rowDiscount = parseDiscount(it.discountInput, rowGross);
                            const rowTotal = Math.max(0, rowGross - rowDiscount);
                            return (
                              <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">{idx + 1}</td>
                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-900 font-semibold">{it.productName}</td>
                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={it.unitPrice}
                                    readOnly
                                    disabled
                                    className="w-28 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50" />
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 whitespace-nowrap font-medium">{it.currentStock}</td>
                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="1"
                                    value={it.quantity}
                                    onChange={(e) => updateItem(it.id, "quantity", e.target.value)}
                                    className="w-24 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white" />
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">{formatLKR(it.mrp || 0)}</td>
                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={it.discountInput || ""}
                                    readOnly
                                    disabled
                                    placeholder="Not editable"
                                    className="w-24 px-3 py-2 border-2 border-slate-300 rounded-lg text-right bg-slate-100 text-slate-500 cursor-not-allowed" />
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">{formatLKR(rowTotal)}</td>
                                <td className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(it.id)}
                                    className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 hover:text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors border border-red-200 hover:border-red-600"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Summary rows intentionally removed as requested */}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== SUBMIT BUTTON ===== */}
              <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-3 shadow-lg w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing Return...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Create Sales Return
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </>
    );
  };

  // ===== MAIN COMPONENT RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <section aria-label="Create new sales return">
          <InlinePOForm nextSONumber={nextSONumber} />
        </section>
      </div>

      {/* ===== LOADING OVERLAY ===== */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" role="status" aria-live="polite">
          <div className="bg-white rounded-xl shadow-xl p-6 flex items-center gap-4 border border-slate-200">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-slate-800 font-medium">Creating sales return…</span>
          </div>
        </div>
      )}

      {/* ===== SUCCESS MODAL ===== */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Sales return created">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-md border border-slate-200">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-7 w-7 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900">Success</h3>
                <p className="mt-2 text-sm text-slate-700">{successText || "Sales return created successfully."}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="ml-2 text-slate-500 hover:text-slate-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReturn;

