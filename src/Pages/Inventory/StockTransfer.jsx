import React, {useCallback,useEffect,useMemo,useRef,useState,} from "react";
import { Plus, Trash2 } from "lucide-react";
import {createStockTransfer,getProducts,fetchStockTransfers,getNextStockTransfer,} from "../../services/Inventory/inventoryService";
import { fetchCenters } from "../../services/Inventory/centerService";
import { useAuth } from "../../contexts/AuthContext";


const extractNextTransferNumber = (resp) => {
  if (!resp) return "";
  if (typeof resp === "string") return resp;

  const buckets = [resp, resp?.data, resp?.data?.data];

  for (const bucket of buckets) {
    if (!bucket) continue;
    if (typeof bucket === "string") return bucket;
    if (typeof bucket === "object") {
      if (typeof bucket.next === "string") return bucket.next;
      if (typeof bucket.data === "string") return bucket.data;
      if (typeof bucket.data?.next === "string") return bucket.data.next;
    }
  }

  return "";
};

const StockTransfer = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextStId, setNextStId] = useState("");
  const [nextIdError, setNextIdError] = useState("");
  const [isFetchingNextId, setIsFetchingNextId] = useState(false);

  const refreshNextStockTransferId = useCallback(async () => {
    setIsFetchingNextId(true);
    setNextIdError("");
    try {
      const resp = await getNextStockTransfer();
      const next = extractNextTransferNumber(resp);
      if (next) {
        setNextStId(next);
        return next;
      }
      throw new Error("Missing next stock transfer number in response");
    } catch (err) {
      console.warn("Failed to fetch next stock transfer id.", err);
      setNextStId("");
      const message =
        err?.message || "Unable to fetch next stock transfer number.";
      setNextIdError(message);
      return "";
    } finally {
      setIsFetchingNextId(false);
    }
  }, []);

  useEffect(() => {
    refreshNextStockTransferId();
  }, [refreshNextStockTransferId]);

  // formatLKR removed — amount display is no longer shown in the form UI

  const InlineNewInvoiceForm = ({
    nextStId,
    refreshNextId,
    nextIdError,
    isFetchingNextId,
  }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
      id: "",
      fromCenter: "",
      toCenter: "",
      date: new Date().toISOString().split("T")[0],
      status: "completed",
      amount: 0,
      // kept for backward compatibility where needed
      productName: "",
      quantity: 0,
    });
    const [errors, setErrors] = useState({});
    const [submitAlert, setSubmitAlert] = useState({ type: null, message: "" });
    const [items, setItems] = useState([]);
    // Payment modal and pendingInvoice removed

    // Entry state and typeahead like SalesOrder page
    const [entry, setEntry] = useState({
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
    });
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
          console.error("Failed to load centers:", err);
          setCentersError(err?.message || String(err));
        } finally {
          if (mounted) setCentersLoading(false);
        }
      };
      loadCenters();
      return () => {
        mounted = false;
      };
    }, []);
    // const suppliers = getSuppliers();
    // Products source: prefer products available for selected center, fallback to static getProducts()
    const products = useMemo(() => {
      if (formData.fromCenter) {
        // When a center is selected, only show products loaded for that center
        return Array.isArray(centerProducts) ? centerProducts : [];
      }
      // Without a selected center fall back to any static catalog
      return getProducts?.() || [];
    }, [centerProducts, formData.fromCenter]);

    // Load products for selected center (uses existing service function `fetchStockTransfers`)
    useEffect(() => {
      let mounted = true;
      const loadProductsForCenter = async () => {
        const centerId = formData.fromCenter;
        // clear entry so suggestions don't show stale products from previous center
        setEntry({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
        if (!centerId) {
          setCenterProducts([]);
          setCenterProductsError(null);
          return;
        }
        try {
          setCenterProductsLoading(true);
          // Ask backend for inventory stocks, include center as query param so backend can filter if supported
          const raw = await fetchStockTransfers({
            params: { center: centerId, center_id: centerId },
          });
          const stocks = Array.isArray(raw)
            ? raw
            : raw?.data ?? raw?.data?.data ?? [];

          const collected = [];
          stocks.forEach((s) => {
            const stockCenterId =
              s.center_id ?? s.centerId ?? s.center?.id ?? s.center;
            if (stockCenterId && String(stockCenterId) !== String(centerId))
              return;

            const productData = s.product ?? s.productDetails ?? {};
            const productId =
              productData.id ??
              s.product_id ??
              productData.product_id ??
              s.productId ??
              s.id;
            const stockQty =
              Number(
                s.quantity ??
                  s.qty ??
                  productData.quantity ??
                  productData.currentStock ??
                  0
              ) || 0;
            const price =
              Number(
                productData.cost ??
                  productData.min_price ??
                  productData.mrp ??
                  0
              ) || 0;
            const sku =
              productData.code ??
              productData.barcode ??
              productData.sku ??
              s.productCode ??
              s.batch_number ??
              "";
            const name =
              productData.name ??
              s.productName ??
              s.name ??
              `Product ${productId ?? ""}`;

            collected.push({
              id: s.id ?? productId,
              stockId: s.id,
              productId,
              centerId: stockCenterId ?? centerId,
              batchNumber: s.batch_number ?? s.batchNumber ?? "",
              name,
              sku,
              unitPrice: price,
              currentStock: stockQty,
              currentstock: stockQty,
            });
          });

          // deduplicate by stock entry (inventory stock id)
          const seen = new Map();
          const deduped = [];
          collected.forEach((p) => {
            const key =
              p.stockId ??
              `${p.productId}-${p.batchNumber ?? ""}-${p.centerId ?? ""}`;
            if (!seen.has(String(key))) {
              seen.set(String(key), true);
              deduped.push(p);
            }
          });

          if (!mounted) return;
          setCenterProducts(deduped);
          setCenterProductsError(null);
        } catch (err) {
          console.error("Failed to load center products:", err);
          if (!mounted) return;
          setCenterProductsError(err?.message || String(err));
          setCenterProducts([]);
        } finally {
          if (mounted) setCenterProductsLoading(false);
        }
      };
      loadProductsForCenter();
      return () => {
        mounted = false;
      };
    }, [formData.fromCenter]);

    const filteredProducts = useMemo(() => {
      const q = (entry.productName || "").toLowerCase().trim();
      if (!q) return products.slice(0, 8);
      return products
        .filter(
          (p) =>
            (p.name || "").toLowerCase().includes(q) ||
            (p.sku || "").toLowerCase().includes(q)
        )
        .slice(0, 8);
    }, [entry.productName, products]);

    const showBatchColumn = useMemo(() => {
      // show batch if any center product has a batchNumber or any added item has one
      const hasCenterBatches =
        Array.isArray(centerProducts) &&
        centerProducts.some((p) => !!p.batchNumber);
      const hasItemBatches =
        Array.isArray(items) && items.some((it) => !!it.batchNumber);
      return hasCenterBatches || hasItemBatches;
    }, [centerProducts, items]);

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
      // Ensure no item quantity errors exist
      const badItem = (items || []).find((it) => {
        const qty = Number(it.quantity) || 0;
        if (qty <= 0) return true;
        const stockVal = it.currentStock ?? it.currentstock;
        if (
          typeof stockVal !== "undefined" &&
          stockVal !== null &&
          stockVal !== ""
        ) {
          const stock = Number(stockVal) || 0;
          if (qty > stock) return true;
        }
        return false;
      });
      if (badItem) e.items = "Resolve item quantity errors before submitting";
      setErrors(e);
      return Object.keys(e).length === 0;
    };

    const handleAddItem = () => {
      const name = (entry.productName || "").trim();
      const selected = entry.productId
        ? products.find((p) => String(p.id) === String(entry.productId))
        : products.find(
            (p) => (p.name || "").toLowerCase() === name.toLowerCase()
          );
      const qty = Math.max(1, Number(entry.quantity) || 1);
      const unitPrice = selected
        ? Number(selected.unitPrice) || 0
        : Number(entry.unitPrice) || 0;
      if (!name) {
        setErrors((prev) => ({
          ...prev,
          productName: "Product name is required",
        }));
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
        currentStock: selected
          ? selected.currentStock ?? selected.currentstock ?? 0
          : 0,
        currentstock: selected
          ? selected.currentStock ?? selected.currentstock ?? 0
          : 0,
        batchNumber: selected?.batchNumber ?? "",
        stockId: selected?.stockId ?? selected?.id ?? null,
        productId: selected?.productId ?? selected?.id ?? null,
      };
      // mark quantity error if it exceeds available stock or invalid
      if (
        typeof newItem.currentStock !== "undefined" &&
        newItem.currentStock !== null &&
        newItem.currentStock !== ""
      ) {
        const stock = Number(newItem.currentStock) || 0;
        if (Number(newItem.quantity) > stock) {
          newItem.quantityError = `Quantity exceeds available stock (${stock})`;
        }
      }
      setItems((prev) => [...prev, newItem]);
      setEntry({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
      setShowSuggestions(false);
      setActiveIndex(-1);
      setErrors((prev) => ({ ...prev, productName: undefined }));
    };

    const updateItemField = (id, field, value) => {
      // Prevent changing batchNumber via this updater to keep batches immutable here
      if (field === "batchNumber") return;

      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const updated = { ...it, [field]: value };
          if (field === "quantity") {
            const qty = Number(value) || 0;
            if (qty <= 0) {
              updated.quantityError = "Quantity must be at least 1";
            } else {
              const stockVal = it.currentStock ?? it.currentstock;
              if (
                typeof stockVal !== "undefined" &&
                stockVal !== null &&
                stockVal !== ""
              ) {
                const stock = Number(stockVal) || 0;
                if (qty > stock) {
                  updated.quantityError = `Quantity exceeds available stock (${stock})`;
                } else {
                  delete updated.quantityError;
                }
              } else {
                delete updated.quantityError;
              }
            }
          }
          return updated;
        })
      );
    };

    const deleteItem = (id) =>
      setItems((prev) => prev.filter((it) => it.id !== id));

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitAlert({ type: null, message: "" });
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
        status: "completed",
      };

      const payload = {
        transfer_number: invoiceData.id,
        transfer_no: invoiceData.id,
        from_center_id: invoiceData.fromCenter,
        fromCenter: invoiceData.fromCenter,
        to_center_id: invoiceData.toCenter,
        toCenter: invoiceData.toCenter,
        transfer_date: invoiceData.date,
        date: invoiceData.date,
        status: invoiceData.status,
        total_amount: invoiceData.amount,
        amount: invoiceData.amount,
        created_by: user?.id ?? null,
        items: (invoiceData.items || []).map((it) => ({
          product_id: it.productId ?? it.id ?? null,
          productId: it.productId ?? it.id ?? null,
          stock_id: it.stockId ?? null,
          stockId: it.stockId ?? null,
          name: it.name,
          quantity: Number(it.quantity) || 0,
          unit_price: Number(it.unitPrice) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          batch_number: it.batchNumber ?? null,
        })),
      };

      // Directly add invoice, no payment modal
      setIsSubmitting(true);
      try {
        await createStockTransfer(payload);
        setSubmitAlert({
          type: "success",
          message: "Stock transfer saved successfully.",
        });
        // Log user action: creation triggered by UI button click (omit amount)
        const safePayload = { ...invoiceData };
        if (Object.prototype.hasOwnProperty.call(safePayload, "amount"))
          delete safePayload.amount;
        console.log("Stock transfer created via UI", {
          createdBy: user?.id ?? null,
          transferId: formData.id,
          itemsCount: items.length,
          payload: safePayload,
        });
        let nextIdForReset = null;
        if (typeof refreshNextId === "function") {
          try {
            nextIdForReset = await refreshNextId();
          } catch (err) {
            console.warn(
              "Failed to refresh next stock transfer id after submit.",
              err
            );
          }
        }
        setErrors({});
        setFormData({
          id: nextIdForReset || "",
          fromCenter: "",
          toCenter: "",
          date: new Date().toISOString().split("T")[0],
          status: "completed",
          amount: 0,
          productName: "",
          quantity: 0,
        });
        setItems([]);
      } catch (err) {
        console.error("Failed to create stock transfer via API", err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create stock transfer.";
        setSubmitAlert({ type: "error", message });
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
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase">
                Stock Transfer Management
              </h1>
              <div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">
                Transfer ID:{" "}
                {isFetchingNextId ? "Loading Number..." : nextStId || "—"}
              </div>
              {nextIdError && (
                <p className="text-red-600 text-sm mt-1" role="alert">
                  {nextIdError}
                </p>
              )}
              <p className="text-slate-600 mt-2 text-sm sm:text-base">
                Efficiently manage and track your stock transfers across centers
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-slate-900 border-b border-slate-200 pb-4">
            Create New Stock Transfer
          </h3>
          <form onSubmit={handleSubmit}>
            {submitAlert.message && (
              <div
                className={`mb-6 rounded-lg border px-4 py-3 text-sm font-semibold ${
                  submitAlert.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
                role="alert"
              >
                {submitAlert.message}
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 mb-6 sm:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Transfer Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? "date-error" : undefined}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.date
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                    }`}
                  />
                  {errors.date && (
                    <p
                      id="date-error"
                      className="text-red-600 text-sm mt-1 font-medium"
                    >
                      {errors.date}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    From Center *
                  </label>
                  <select
                    value={formData.fromCenter}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fromCenter: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.fromCenter
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                    }`}
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
                        <option key={c?.id ?? c} value={c?.id ?? c}>
                          {c?.centerName ?? c?.name ?? c?.center_name ?? c}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.fromCenter && (
                    <p className="text-red-600 text-sm mt-1 font-medium">
                      {errors.fromCenter}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    To Center *
                  </label>
                  <select
                    value={formData.toCenter}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        toCenter: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.toCenter
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                    }`}
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
                        <option key={c?.id ?? c} value={c?.id ?? c}>
                          {c?.centerName ?? c?.name ?? c?.center_name ?? c}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.toCenter && (
                    <p className="text-red-600 text-sm mt-1 font-medium">
                      {errors.toCenter}
                    </p>
                  )}
                </div>
              </div>

              {/* Product Section - SalesOrder-like entry */}
              <div className="mb-6 sm:mb-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-4">
                  Product Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="sm:col-span-3 space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Product Name *
                    </label>
                    <div
                      className="relative"
                      onKeyDown={(e) => {
                        if (
                          !showSuggestions &&
                          (e.key === "ArrowDown" || e.key === "ArrowUp")
                        ) {
                          setShowSuggestions(true);
                          return;
                        }
                        if (!showSuggestions) return;
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setActiveIndex((prev) =>
                            Math.min(prev + 1, filteredProducts.length - 1)
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setActiveIndex((prev) => Math.max(prev - 1, 0));
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            activeIndex >= 0 &&
                            filteredProducts[activeIndex]
                          ) {
                            const p = filteredProducts[activeIndex];
                            setEntry({
                              productId: p.id,
                              productName: p.name,
                              quantity: 1,
                              unitPrice: Number(p.unitPrice) || 0,
                              batchNumber: p.batchNumber ?? "",
                            });
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
                          setEntry((p) => ({
                            ...p,
                            productId: "",
                            productName: val,
                          }));
                          setShowSuggestions(true);
                          setActiveIndex(-1);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 150);
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.productName
                            ? "border-red-300 bg-red-50"
                            : "border-slate-300 bg-white hover:border-slate-400"
                        }`}
                        placeholder="Search product by name or SKU"
                      />
                      {showSuggestions && filteredProducts.length > 0 && (
                        <ul className="absolute z-20 mt-2 w-full max-h-60 overflow-auto rounded-lg border-2 border-slate-200 bg-white shadow-xl">
                          {filteredProducts.map((p, idx) => (
                            <li
                              key={p.id}
                              className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-b-0 ${
                                idx === activeIndex
                                  ? "bg-blue-50 border-blue-200"
                                  : "hover:bg-slate-50"
                              }`}
                              onMouseEnter={() => setActiveIndex(idx)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setEntry({
                                  productId: p.id,
                                  productName: p.name,
                                  quantity: 1,
                                  unitPrice: Number(p.unitPrice) || 0,
                                  batchNumber: p.batchNumber ?? "",
                                });
                                setShowSuggestions(false);
                                setActiveIndex(-1);
                                productInputRef.current?.blur();
                              }}
                            >
                              <span className="text-sm font-medium text-slate-900">
                                {p.name}
                              </span>
                              <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                {p.batchNumber
                                  ? ` • Batch: ${p.batchNumber}`
                                  : ""}
                              </span>
                              <span className="ml-auto text-xs text-slate-600 font-semibold">
                                LKR {Number(p.unitPrice || 0).toFixed(2)}
                                {typeof (p.currentStock ?? p.currentstock) !==
                                  "undefined" &&
                                (p.currentStock ?? p.currentstock) !== null &&
                                (p.currentStock ?? p.currentstock) !== ""
                                  ? ` • Stock: ${
                                      p.currentStock ?? p.currentstock
                                    }`
                                  : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {centerProductsLoading && (
                      <p className="text-xs text-slate-500 mt-2">
                        Loading products for the selected center...
                      </p>
                    )}
                    {centerProductsError && (
                      <p className="text-xs text-red-600 mt-1">
                        {centerProductsError}
                      </p>
                    )}
                    {errors.productName && (
                      <p className="text-red-600 text-sm mt-1 font-medium">
                        {errors.productName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md"
                    >
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
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                No
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Product Name
                              </th>
                              {showBatchColumn && (
                                <th
                                  scope="col"
                                  className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                                >
                                  Batch
                                </th>
                              )}
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Stock
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Quantity
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {items.map((it, idx) => (
                              <tr
                                key={it.id}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                                  {idx + 1}
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-900 font-semibold">
                                  {it.name}
                                </td>
                                {showBatchColumn && (
                                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                                    {it.batchNumber ? (
                                      <span className="font-medium">
                                        {it.batchNumber}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>
                                )}
                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 text-right whitespace-nowrap">
                                  {(() => {
                                    const stockVal =
                                      it.currentStock ?? it.currentstock;
                                    if (
                                      typeof stockVal !== "undefined" &&
                                      stockVal !== null &&
                                      stockVal !== ""
                                    ) {
                                      return (
                                        <span className="font-medium">
                                          {Number(stockVal)}
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="text-slate-400">—</span>
                                    );
                                  })()}
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                  <div className="inline-flex flex-col items-end">
                                    <input
                                      type="number"
                                      min="1"
                                      value={it.quantity}
                                      onChange={(e) =>
                                        updateItemField(
                                          it.id,
                                          "quantity",
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      aria-label={`Quantity for ${it.name}`}
                                      className={`w-24 px-3 py-2 border-2 rounded-lg text-right focus:outline-none focus:ring-2 transition-colors ${
                                        it.quantityError
                                          ? "border-red-400 bg-red-50 focus:ring-red-400"
                                          : "border-slate-300 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 hover:bg-white"
                                      }`}
                                    />
                                    {it.quantityError && (
                                      <p className="text-xs text-red-600 mt-1">
                                        {it.quantityError}
                                      </p>
                                    )}
                                  </div>
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
                  disabled={isSubmitting || !formData.id}
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
    <div className="min-h-screen bg-linear-to-br from-slate-100 to-slate-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <section aria-label="Create new stock transfer">
          <InlineNewInvoiceForm
            nextStId={nextStId}
            refreshNextId={refreshNextStockTransferId}
            nextIdError={nextIdError}
            isFetchingNextId={isFetchingNextId}
          />
        </section>
      </div>
    </div>
  );
};

export default StockTransfer;
