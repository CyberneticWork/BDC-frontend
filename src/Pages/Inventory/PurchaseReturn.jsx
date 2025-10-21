import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getInvoiceData, addInvoice, getSuppliers, getProducts } from "../../services/Inventory/inventoryService";
import Payment from "../../components/Inventory/Payment";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextPrtId, setNextPrtId] = useState("");

  useEffect(() => {
    const initial = getInvoiceData();
    setInvoices(initial);
  }, []);

  useEffect(() => {
    const nums = invoices
      .map((inv) => {
        const m = String(inv.id || "").match(/^PRT-(\d{4})$/i);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n) => n !== null);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    setNextPrtId(`PRT-${String(next).padStart(4, "0")}`);
  }, [invoices]);

  const formatLKR = (value) => {
    try {
      return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(value || 0));
    } catch {
      const num = Number(value || 0).toFixed(2);
      return `LKR ${num}`;
    }
  };

  const InlineNewInvoiceForm = ({ nextPrtId }) => {
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

    // Entry state and typeahead like SalesOrder page
    const [entry, setEntry] = useState({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const productInputRef = useRef(null);

    useEffect(() => {
      setFormData((p) => ({ ...p, id: nextPrtId }));
    }, [nextPrtId]);

    const centers = ["Main Center", "Branch A", "Branch B", "Warehouse 01"];
    const suppliers = getSuppliers();
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
      if (!formData.center.trim()) e.center = "Center is required";
      if (!formData.date) e.date = "Date is required";
      if (!formData.supplier.trim()) e.supplier = "Supplier is required";
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

      setPendingInvoice(invoiceData);
      setShowPaymentModal(true);
    };

    const finalizeInvoiceWithPayment = async (paymentData) => {
      if (!pendingInvoice) return;
      setIsSubmitting(true);
      try {
        const newInvoice = addInvoice({ ...pendingInvoice, payment: paymentData });
        setInvoices((prev) => [...prev, newInvoice]);
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
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900"> Purchase Return</h1>
              <div className="text-red-600 font-bold mt-1 text-md sm:text-base">Purchase Return Number : {nextPrtId}</div>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and track your Purchase Returns</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Create New Invoice</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Center *</label>
                  <select
                    value={formData.center}
                    onChange={(e) => setFormData((prev) => ({ ...prev, center: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.center ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select a center</option>
                    {centers.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.center && <p className="text-red-500 text-sm mt-1">{errors.center}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name*</label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
                    aria-invalid={!!errors.supplier}
                    aria-describedby={errors.supplier ? "supplier-error" : undefined}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.supplier ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  {errors.supplier && <p id="supplier-error" className="text-red-500 text-sm mt-1">Supplier is required</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ref Number</label>
                  <input
                    type="text"
                    value={formData.refNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, refNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter reference number"
                  />
                </div>

                <div className="lg:place-self-end pr-65 text-center ">
                  <p className="text-[18px]">Total Amount</p>
                  <p className="text-[35px] font-medium">{formatLKR(tableTotal)}</p>
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
                        <table className="min-w-[900px] w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Stock</th>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price</th>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">MRP</th>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider" title="Per unit discount when enabled">Discount</th>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                              <th scope="col" className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                              <th scope="col" className="px-2 sm:px-3 py-2 text-left"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {items.map((it, idx) => {
                              const Discount = (Number(it.discount) || 0) * (Number(it.quantity) || 0);
                              const Total = (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0);
                              const rowTotal = Total - Discount;
                              return (
                                <tr key={it.id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100/60">
                                  <td className="px-3 sm:px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{idx + 1}</td>
                                  <td className="px-3 sm:px-4 py-2 text-sm text-gray-900">{it.name}</td>
                                  <td className="px-3 sm:px-4 py-2 text-sm text-gray-900 text-left whitespace-nowrap">{it.currentStock}</td>
                                  <td className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">
                                    <input
                                      type="number"
                                      min="1"
                                      value={it.quantity}
                                      onChange={(e) => updateItemField(it.id, "quantity", parseInt(e.target.value) || 0)}
                                      aria-label={`Quantity for ${it.name}`}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={it.unitPrice}
                                      onChange={(e) => updateItemField(it.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                      aria-label={`Unit price for ${it.name}`}
                                      className="w-28 px-2 py-1 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={it.mrp}
                                      onChange={(e) => updateItemField(it.id, "mrp", parseFloat(e.target.value) || 0)}
                                      aria-label={`MRP for ${it.name}`}
                                      className="w-28 px-2 py-1 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 text-left whitespace-nowrap">
                                    <input
                                      type="number"
                                      className="w-24 px-2 py-1 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-900 text-left whitespace-nowrap">{formatLKR(rowTotal)}</td>
                                  <td className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">
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
                              );
                            })}
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
                      Create Invoice
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
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Set Payment</h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close payment modal"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <div className="mb-3 text-sm text-gray-600">
                  Total Payable: <span className="font-medium">{formatLKR(pendingInvoice?.amount || tableTotal)}</span>
                </div>
                <Payment onSetPayment={finalizeInvoiceWithPayment} />
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <section aria-label="Create new invoice">
          <InlineNewInvoiceForm nextPrtId={nextPrtId} />
        </section>
      </div>
    </div>
  );
};

export default Invoices;