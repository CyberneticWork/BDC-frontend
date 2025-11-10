import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, CheckCircle, X } from "lucide-react";
import { createGRN, getNextGrn } from "../../services/Inventory/inventoryService";
import { fetchCenters as fetchCentersService } from "../../services/Inventory/centerService";
import { getAll as fetchProductsService } from "../../services/Inventory/productListService";
import SupplierService from "../../services/Account/SupplierService";
import Payment from "../../components/Inventory/Payment";
import { useAuth } from "../../contexts/AuthContext";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Display the next GRN fetched from backend
  const [nextGrnId, setNextGrnId] = useState("");

  // Fetch next GRN from backend on mount
  useEffect(() => {
    const loadNext = async () => {
      try {
        const resp = await getNextGrn();
        const next = resp?.data?.next || "";
        setNextGrnId(next);
      } catch (e) {
        console.warn("Failed to fetch next GRN from server; falling back to local seed.", e);
        setNextGrnId((prev) => prev || "GRN-0001");
      }
    };
    setInvoices([]);
    loadNext();
  }, []);

  const formatLKR = (value) => {
    try {
      return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(value || 0));
    } catch {
      const num = Number(value || 0).toFixed(2);
      return `LKR ${num}`;
    }
  };

  const InlineNewInvoiceForm = ({ nextGrnId }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
      id: "",
      center: "",
      supplier: "",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      refNumber: "",
      amount: 0,
      // kept for backward compatibility where needed
      productName: "",
      quantity: 0,
    });
    const [errors, setErrors] = useState({});
    const [items, setItems] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingInvoice, setPendingInvoice] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successText, setSuccessText] = useState("");

    // Entry state and typeahead like SalesOrder page
    const [entry, setEntry] = useState({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const productInputRef = useRef(null);
  const [centers, setCenters] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState({ centers: false, suppliers: false, products: false });

    useEffect(() => {
      setFormData((p) => ({ ...p, id: nextGrnId }));
    }, [nextGrnId]);

    // Load data from services (centers, suppliers, products)
    useEffect(() => {
      const loadCenters = async () => {
        try {
          setLoading(prev => ({ ...prev, centers: true }));
          const data = await fetchCentersService();
          const normalized = Array.isArray(data)
            ? data.map((c) => ({
                id: c.id ?? c.center_id ?? c.value ?? String(c.name || c.title || c),
                name: c.name ?? c.center_name ?? c.title ?? String(c.name || c),
              }))
            : [];
          setCenters(normalized);
        } catch (e) {
          console.error("Error fetching centers:", e);
          setCenters([]);
        } finally {
          setLoading(prev => ({ ...prev, centers: false }));
        }
      };

      const loadSuppliers = async () => {
        try {
          setLoading(prev => ({ ...prev, suppliers: true }));
          const data = await SupplierService.list();
          const normalized = Array.isArray(data)
            ? data.map((s) => ({ id: s.id ?? s.supplier_id ?? s.value ?? String(s.name || s.title || s), name: s.name ?? s.supplier_name ?? s.title ?? String(s.name || s) }))
            : [];
          setSuppliers(normalized);
        } catch (e) {
          console.error("Error fetching suppliers:", e);
          setSuppliers([]);
        } finally {
          setLoading(prev => ({ ...prev, suppliers: false }));
        }
      };

      const loadProducts = async () => {
        try {
          setLoading(prev => ({ ...prev, products: true }));
          const resp = await fetchProductsService();
          const list = Array.isArray(resp) ? resp : (Array.isArray(resp?.data) ? resp.data : []);
          const normalized = list.map((p) => ({
            id: p.id ?? p.product_id ?? String(p.sku || p.code || p.name),
            name: p.name ?? p.product_name ?? p.title ?? `#${p.id}`,
            sku: p.sku ?? p.code ?? p.product_code ?? "",
            // keep selling/unit price if present, but also capture explicit cost
            unitPrice: Number(p.unitPrice ?? p.price ?? p.unit_price ?? p.selling_price ?? p.cost_price ?? 0),
            costPrice: Number(p.costPrice ?? p.cost_price ?? p.purchase_price ?? p.buying_price ?? p.cost ?? 0),
            mrp: Number(p.mrp ?? p.mrp_price ?? p.retail_price ?? p.price ?? 0),
            currentstock: p.currentstock ?? p.stock ?? p.qty ?? 0,
          }));
          setProducts(normalized);
        } catch (e) {
          console.error("Error fetching products:", e);
          setProducts([]);
        } finally {
          setLoading(prev => ({ ...prev, products: false }));
        }
      };

      loadCenters();
      loadSuppliers();
      loadProducts();
    }, []);

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
        // discount is optional and applied per-unit if present
        const disc = Number(it.discount || 0) || 0;
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
      if (!formData.id) e.id = "GRN number not generated";
      if (!String(formData.center).trim()) e.center = "Center is required";
      if (!formData.date) e.date = "Date is required";
      if (!String(formData.supplier).trim()) e.supplier = "Supplier is required";
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
      // Prefer the product's cost price for GRN unit price (purchase use-case).
      // Fall back to product.unitPrice or the manually entered entry.unitPrice.
      const unitPrice = selected
        ? (Number(selected.costPrice) || Number(selected.unitPrice) || 0)
        : (Number(entry.unitPrice) || 0);
      if (!name) {
        setErrors((prev) => ({ ...prev, productName: "Product name is required" }));
        return;
      }
      const newItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name,
        quantity: qty,
        unitPrice: Math.max(0, unitPrice),
        // discount is optional and editable per-row (no separate toggle)
        discount: 0,
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
        const disc = Number(it.discount || 0) || 0;
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

      setPendingInvoice(invoiceData);
      setShowPaymentModal(true);
    };

    const finalizeInvoiceWithPayment = async (paymentData) => {
      if (!pendingInvoice) return;
      setIsSubmitting(true);
      try {
        const dataToSend = {
          // Send both id and voucherNumber (backend accepts either) and add created_by fallback
          voucherNumber: pendingInvoice?.id,
          ...pendingInvoice,
          payment: paymentData,
          created_by: user?.id ?? undefined,
          // Map payment amount to inventory.paid_value as required by backend
          paid_value: typeof paymentData?.amount === 'number' ? paymentData.amount : Number(paymentData?.amount) || 0,
        };
  console.log("Data to be sent to backend:", dataToSend);
  const apiResp = await createGRN(dataToSend);
  const saved = apiResp?.data ?? apiResp;
  const voucher = saved?.voucherNumber || pendingInvoice?.id;
  // Refresh next number from server after successful create
  try {
    const next = await getNextGrn();
    setNextGrnId(next?.data?.next || "");
  } catch {}
        setErrors({});
        setFormData({
          id: "",
          center: "",
          supplier: "",
          date: new Date().toISOString().split("T")[0],
          status: "pending",
          refNumber: "",
          amount: 0,
          productName: "",
          quantity: 0,
        });
        setItems([]);
        setPendingInvoice(null);
        setShowPaymentModal(false);
  // Show success modal
  setSuccessText(`GRN ${voucher} has been created successfully!`);
        // Refresh centers after creation per requirement
        try {
          const freshCenters = await fetchCentersService();
          const normalized = Array.isArray(freshCenters)
            ? freshCenters.map((c) => ({ id: c.id ?? c.center_id ?? c.value ?? String(c.name || c.title || c), name: c.name ?? c.center_name ?? c.title ?? String(c.name || c) }))
            : [];
          setCenters(normalized);
        } catch (e) {
          // non-fatal: log and continue
          console.warn("refresh centers failed", e);
        }
        setShowSuccess(true);
      } catch (error) {
        console.error('Error creating GRN:', error);
        // TODO: Show error message to user
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <>
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="uppercase text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Goods Received Note (GRN)</h1>
              <div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">GRN Number: {nextGrnId}</div>
              <p className="text-slate-600 text-sm sm:text-base">Manage and track your goods received notes efficiently</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">Create New GRN</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    disabled
                    title="GRN date is auto-set and cannot be changed"
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? "date-error" : undefined}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.date ? "border-red-300 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"} opacity-90 cursor-not-allowed`}
                  />
                  {errors.date && <p id="date-error" className="text-red-500 text-sm mt-2 font-medium">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Center *</label>
                  <select
                    value={formData.center}
                    onChange={(e) => setFormData((prev) => ({ ...prev, center: e.target.value }))}
                    disabled={loading.centers}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.center ? "border-red-300 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"} ${loading.centers ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{loading.centers ? 'Loading centers…' : 'Select a center'}</option>
                    {!loading.centers && centers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.center && <p className="text-red-500 text-sm mt-2 font-medium">{errors.center}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Supplier Name *</label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
                    disabled={loading.suppliers}
                    aria-invalid={!!errors.supplier}
                    aria-describedby={errors.supplier ? "supplier-error" : undefined}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.supplier ? "border-red-300 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"} ${loading.suppliers ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{loading.suppliers ? 'Loading suppliers…' : 'Select supplier'}</option>
                    {!loading.suppliers && suppliers.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  {errors.supplier && <p id="supplier-error" className="text-red-500 text-sm mt-2 font-medium">Supplier is required</p>}
                </div>
              </div>

              {/* Customer Details removed as requested */}

              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Reference Number</label>
                  <input
                    type="text"
                    value={formData.refNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, refNumber: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 transition-all duration-200 bg-white"
                    placeholder="Enter reference number"
                  />
                </div>

                <div className="lg:place-self-end text-center bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200">
                  <p className="text-slate-600 font-medium mb-2">Total Amount</p>
                  <p className="text-3xl sm:text-4xl font-bold text-slate-900">{formatLKR(tableTotal)}</p>
                </div>
              </div>

              {/* Product Section - SalesOrder-like entry */}
              <div className="mb-6 sm:mb-8">
                <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6">Product Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Product Name *</label>
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
                            const defaultUnit = (typeof p.costPrice === 'number' && !Number.isNaN(p.costPrice) && p.costPrice > 0)
                              ? Number(p.costPrice)
                              : Number(p.unitPrice) || 0;
                            setEntry({ productId: p.id, productName: p.name, quantity: 1, unitPrice: defaultUnit });
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
                        disabled={!formData.center || loading.products}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.productName ? "border-red-300 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"} ${(loading.products || !formData.center) ? "opacity-60 cursor-not-allowed" : ""}`}
                        placeholder={!formData.center ? "Select a center first" : (loading.products ? "Loading products…" : "Type to search product (name or SKU)")}
                      />
                      {showSuggestions && formData.center && (
                        <ul className="absolute z-20 mt-2 w-full max-h-60 overflow-auto rounded-lg border-2 border-slate-200 bg-white shadow-xl">
                          {loading.products ? (
                            <li className="px-4 py-3 text-slate-600 text-sm flex items-center gap-2">
                              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></span>
                              Loading products…
                            </li>
                          ) : (
                            filteredProducts.map((p, idx) => (
                              <li
                                key={p.id}
                                className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors duration-150 ${idx === activeIndex ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-slate-50"}`}
                                onMouseEnter={() => setActiveIndex(idx)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  const defaultUnit = (typeof p.costPrice === 'number' && !Number.isNaN(p.costPrice) && p.costPrice > 0)
                                    ? Number(p.costPrice)
                                    : Number(p.unitPrice) || 0;
                                  setEntry({ productId: p.id, productName: p.name, quantity: 1, unitPrice: defaultUnit });
                                  setShowSuggestions(false);
                                  setActiveIndex(-1);
                                  productInputRef.current?.blur();
                                }}
                              >
                                <span className="text-sm font-medium text-slate-900">{p.name}</span>
                                <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{p.sku}</span>
                                <span className="ml-auto text-xs text-slate-600 font-medium">
                                  Cost LKR {Number(p.costPrice || 0).toFixed(2)} • MRP LKR {Number(p.mrp || 0).toFixed(2)}{typeof p.currentstock !== "undefined" ? ` • Stock ${p.currentstock}` : ""}
                                </span>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                    {errors.productName && <p className="text-red-500 text-sm mt-2 font-medium">{errors.productName}</p>}
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={handleAddItem} disabled={!formData.center || loading.products} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                      <Plus className="h-5 w-5" />
                      Add to List
                    </button>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="mt-6 overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-lg">
                        <table className="min-w-[1100px] w-full divide-y divide-slate-200">
                          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
                            <tr>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">No</th>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Product Name</th>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Current Stock</th>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Qty</th>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Unit Price</th>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">MRP</th>
                                            <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider" title="Per unit discount (optional)">Discount</th>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Total</th>
                              <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {items.map((it, idx) => {
                              const Discount = (Number(it.discount) || 0) * (Number(it.quantity) || 0);
                              const Total = (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0);
                              const rowTotal = Total - Discount;
                              return (
                                <tr key={it.id} className="hover:bg-slate-50/60 transition-colors duration-150">
                                  <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">{idx + 1}</td>
                                  <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900">{it.name}</td>
                                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 text-right whitespace-nowrap">{it.currentStock}</td>
                                  <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                    <input
                                      type="number"
                                      min="1"
                                      value={it.quantity}
                                      onChange={(e) => updateItemField(it.id, "quantity", parseInt(e.target.value) || 0)}
                                      aria-label={`Quantity for ${it.name}`}
                                      className="w-20 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-200 bg-white"
                                    />
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={it.unitPrice}
                                      onChange={(e) => updateItemField(it.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                      aria-label={`Unit price for ${it.name}`}
                                      className="w-28 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-200 bg-white"
                                    />
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={it.mrp}
                                      onChange={(e) => updateItemField(it.id, "mrp", parseFloat(e.target.value) || 0)}
                                      aria-label={`MRP for ${it.name}`}
                                      className="w-28 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-200 bg-white"
                                    />
                                  </td>
                                  {/* Discount toggle removed — discount input is optional and editable */}
                                  <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={it.discount}
                                      onChange={(e) => updateItemField(it.id, "discount", parseFloat(e.target.value) || 0)}
                                      aria-label={`Per-unit discount for ${it.name}`}
                                      className="w-24 px-3 py-2 border-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 border-slate-300 bg-white hover:border-slate-400"
                                    />
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">{formatLKR(rowTotal)}</td>
                                  <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => deleteItem(it.id)}
                                      className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 transition-all duration-200 shadow-sm"
                                      aria-label={`Remove ${it.name} from list`}
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting || loading.centers || loading.suppliers || loading.products}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating GRN...
                    </>
                  ) : loading.centers || loading.suppliers || loading.products ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Loading…
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Create GRN
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowPaymentModal(false)} aria-hidden="true" />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 border border-slate-200">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Set Payment</h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-500 hover:text-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  aria-label="Close payment modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  Total Payable: <span className="font-bold text-slate-900 text-lg">{formatLKR(pendingInvoice?.amount || tableTotal)}</span>
                </div>
                <Payment onSetPayment={finalizeInvoiceWithPayment} />
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 border border-slate-200">
              <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Success!</h3>
                <p className="text-slate-600 mb-6">{successText}</p>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Modal */}
        {isSubmitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 border border-slate-200">
              <div className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Processing...</h3>
                <p className="text-slate-600">Please wait while we create your GRN.</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <section aria-label="Create new GRN">
          <InlineNewInvoiceForm nextGrnId={nextGrnId} />
        </section>
      </div>
    </div>
  );
};

export default Invoices;