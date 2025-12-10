import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus, Trash2 } from "lucide-react";
import { fetchCenters } from "../../services/Inventory/centerService";
import {
  getProducts,
  getStockVerifications,
  addStockVerification,
  fetchStockTransfers,
  getNextStockVerification,
} from "../../services/Inventory/inventoryService";

const makeDefaultStvNumber = () => {
  const year = new Date().getFullYear();
  return `STV-${year}-0001`;
};

const normalizeStvNumber = (value) => {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const yearSequenceMatch = str.match(/^STV-(\d{4})-(\d{1,})$/i);
  if (yearSequenceMatch) {
    return `STV-${yearSequenceMatch[1]}-${String(yearSequenceMatch[2]).padStart(
      4,
      "0"
    )}`;
  }
  const sequenceOnlyMatch = str.match(/^STV-(\d+)$/i);
  if (sequenceOnlyMatch) {
    const year = new Date().getFullYear();
    return `STV-${year}-${String(sequenceOnlyMatch[1]).padStart(4, "0")}`;
  }
  const digitsMatch = str.match(/^\d+$/);
  if (digitsMatch) {
    const year = new Date().getFullYear();
    return `STV-${year}-${String(digitsMatch[0]).padStart(4, "0")}`;
  }
  if (str.toUpperCase().startsWith("STV-")) {
    return str;
  }
  return null;
};

const extractNextVerificationNumber = (response) => {
  if (!response) return null;
  const buckets = [response, response?.data, response?.data?.data];
  for (const bucket of buckets) {
    if (!bucket) continue;
    if (typeof bucket === "string") {
      const normalized = normalizeStvNumber(bucket);
      if (normalized) return normalized;
    }
    if (typeof bucket === "object") {
      const candidates = [
        bucket.next,
        bucket.data,
        bucket.data?.next,
        bucket.number,
        bucket.code,
      ];
      for (const candidate of candidates) {
        const normalized = normalizeStvNumber(candidate);
        if (normalized) return normalized;
      }
    }
  }
  return null;
};
// Payment component removed

const StockVerification = () => {
  const [transfers, setTransfers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextStId, setNextStId] = useState("");
  const [isFetchingNextId, setIsFetchingNextId] = useState(false);
  const [nextIdError, setNextIdError] = useState("");

  useEffect(() => {
    // load verifications (we'll still keep transfers array name for compatibility with existing UI code)
    const verifs = getStockVerifications?.() || [];
    setTransfers(verifs);
  }, []);

  const refreshNextStockVerificationId = useCallback(async () => {
    setIsFetchingNextId(true);
    setNextIdError("");
    try {
      const response = await getNextStockVerification();
      const next = extractNextVerificationNumber(response);
      const finalNext = next || makeDefaultStvNumber();
      setNextStId(finalNext);
      return finalNext;
    } catch (err) {
      console.warn("Failed to fetch next stock verification number.", err);
      setNextIdError(
        err?.message || "Unable to fetch next stock verification number."
      );
      const fallback = makeDefaultStvNumber();
      setNextStId(fallback);
      return fallback;
    } finally {
      setIsFetchingNextId(false);
    }
  }, []);
      // kept for backward compatibility where needed
      productName: "",
      quantity: 0,
    });
    const [errors, setErrors] = useState({});
    const [items, setItems] = useState([]);
    const [centers, setCenters] = useState([]);
    const [centersLoading, setCentersLoading] = useState(false);
    const [centersError, setCentersError] = useState(null);
    const [centerProducts, setCenterProducts] = useState([]);
    const [centerProductsLoading, setCenterProductsLoading] = useState(false);
    const [centerProductsError, setCenterProductsError] = useState(null);
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

    useEffect(() => {
      let mounted = true;
      const loadCenters = async () => {
        setCentersLoading(true);
        try {
          const data = await fetchCenters();
          if (!mounted) return;
          const normalized = Array.isArray(data)
            ? data
                .map((center) => {
                  if (!center) return null;
                  if (typeof center === "string") {
                    return { id: center, name: center };
                  }
                  const idValue =
                    center.id ??
                    center.center_id ??
                    center.value ??
                    center.centerId ??
                    center.code ??
                    center.name ??
                    center.center?.id ??
                    "";
                  if (!idValue) return null;
                  const nameValue =
                    center.name ??
                    center.center_name ??
                    center.title ??
                    center.value ??
                    center.center?.name ??
                    center.centerName ??
                    String(idValue);
                  return { id: String(idValue), name: nameValue };
                })
                .filter(Boolean)
            : [];
          if (!mounted) return;
          setCenters(normalized);
          setCentersError(null);
        } catch (err) {
          console.error("Failed to load centers:", err);
          if (!mounted) return;
          setCentersError(err?.message || String(err));
          setCenters([]);
        } finally {
          if (mounted) setCentersLoading(false);
        }
      };
      loadCenters();
      return () => {
        mounted = false;
      };
    }, []);

    useEffect(() => {
      let mounted = true;
      const loadCenterProducts = async () => {
        const centerId = formData.fromCenter;
        if (!centerId) {
          setCenterProducts([]);
          setCenterProductsError(null);
          setCenterProductsLoading(false);
          return;
        }
        setCenterProductsLoading(true);
        try {
          const raw = await fetchStockTransfers({
            params: { center: centerId, center_id: centerId },
          });
          const stocks = Array.isArray(raw)
            ? raw
            : raw?.data ?? raw?.data?.data ?? [];
          const collected = [];
          stocks.forEach((stock) => {
            const stockCenterId =
              stock.center_id ??
              stock.centerId ??
              stock.center?.id ??
              stock.center ??
              "";
            if (!stockCenterId) return;
            if (String(stockCenterId) !== String(centerId)) return;
            const productData = stock.product ?? stock.productDetails ?? {};
            const productId =
              productData.id ??
              stock.product_id ??
              productData.product_id ??
              stock.productId ??
              stock.id ??
              "";
            const stockQty =
              Number(
                stock.quantity ??
                  stock.qty ??
                  productData.quantity ??
                  productData.currentStock ??
                  productData.currentstock ??
                  0
              ) || 0;
            const price =
              Number(
                productData.cost ??
                  productData.min_price ??
                  productData.mrp ??
                  productData.unitPrice ??
                  0
              ) || 0;
            const sku =
              productData.code ??
              productData.barcode ??
              productData.sku ??
              stock.productCode ??
              stock.batch_number ??
              "";
            const name =
              productData.name ??
              stock.productName ??
              stock.name ??
              `Product ${productId || ""}`;
            collected.push({
              id:
                stock.id ??
                `${productId}-${centerId}-${stock.batch_number ?? ""}`,
              stockId: stock.id,
              productId,
              centerId: stockCenterId,
              name,
              sku,
              unitPrice: price,
              currentStock: stockQty,
              currentstock: stockQty,
              batchNumber:
                stock.batch_number ??
                stock.batchNumber ??
                productData.batch_number ??
                productData.batchNumber ??
                "",
            });
          });
          const seen = new Map();
          const deduped = [];
          collected.forEach((product) => {
            const key =
              product.stockId ??
              `${product.productId}-${product.batchNumber ?? ""}-${product.centerId ?? ""}`;
            if (!seen.has(String(key))) {
              seen.set(String(key), true);
              deduped.push(product);
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
      loadCenterProducts();
      return () => {
        mounted = false;
      };
    }, [formData.fromCenter]);

    const staticProducts = useMemo(() => getProducts?.() || [], []);
    const products = useMemo(() => {
      if (formData.fromCenter) {
        return centerProducts || [];
      }
      return staticProducts;
    }, [centerProducts, formData.fromCenter, staticProducts]);
    const selectedCenterLabel = centers.find(
      (c) => String(c.id) === String(formData.fromCenter)
    )?.name;
    // const suppliers = getSuppliers();

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
      if (!formData.fromCenter.trim()) e.fromCenter = "Center is required";
      if (!formData.date) e.date = "Date is required";
      if ((items?.length || 0) === 0) e.items = "Add at least one item";
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
        currentStock: selected ? selected.currentstock || 0 : 0,
      };
      setItems((prev) => [...prev, newItem]);
      setEntry({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
      setShowSuggestions(false);
      setActiveIndex(-1);
      setErrors((prev) => ({ ...prev, productName: undefined }));
    };

    const updateItemField = (id, field, value) => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
      );
    };

    const deleteItem = (id) =>
      setItems((prev) => prev.filter((it) => it.id !== id));

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
        // create a Stock Verification entry and persist
        const newVerification = addStockVerification({
          ...invoiceData,
          verificationNumber: nextStId,
        });
        setTransfers((prev) => [...prev, newVerification]);
        const nextIdForReset = await refreshNextStockVerificationId();
        setErrors({});
        setFormData({
          id: nextIdForReset || nextStId || "",
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
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase">
                Stock Verification Management
              </h1>
              <div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">
                Verification ID:{" "}
                <span>
                  {isFetchingNextId
                    ? "Generating ID..."
                    : nextStId || "Fetching next ID..."}
                </span>
              </div>
              {nextIdError && (
                <p className="text-red-600 text-sm mt-1 font-medium">
                  {nextIdError}
                </p>
              )}
              <p className="text-slate-600 mt-2 text-sm sm:text-base">
                Efficiently manage and track your stock verifications across
                centers ({transfers.length} recorded)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-slate-900 border-b border-slate-200 pb-4">
            Create New Stock Verification
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 mb-6 sm:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Verification Date *
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
                    Center *
                  </label>
                  <select
                    value={formData.fromCenter}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fromCenter: e.target.value,
                      }))
                    }
                    disabled={centersLoading}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.fromCenter
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                    }`}
                  >
                    <option value="">
                      {centersLoading ? "Loading centers..." : "Select a center"}
                    </option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.fromCenter && (
                    <p className="text-red-600 text-sm mt-1 font-medium">
                      {errors.fromCenter}
                    </p>
                  )}
                  {centersError && (
                    <p className="text-red-600 text-sm mt-1 font-medium">
                      Unable to load centers: {centersError}
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
                                {p.sku}
                              </span>
                              <span className="ml-auto text-xs text-slate-600 font-semibold">
                                LKR {Number(p.unitPrice || 0).toFixed(2)}
                                {typeof p.currentstock !== "undefined"
                                  ? ` • Stock: ${p.currentstock}`
                                  : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {errors.productName && (
                      <p className="text-red-600 text-sm mt-1 font-medium">
                        {errors.productName}
                      </p>
                    )}
                    {formData.fromCenter && centerProductsLoading && (
                      <p className="text-sm text-slate-500 mt-2">
                        Loading stock for {selectedCenterLabel || "selected center"}...
                      </p>
                    )}
                    {centerProductsError && (
                      <p className="text-red-600 text-sm mt-2">
                        Unable to load stock for {selectedCenterLabel || "selected center"}: {centerProductsError}
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
                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
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
                  disabled={isSubmitting || isFetchingNextId || !nextStId}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-3 shadow-lg w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing Verification...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Create Stock Verification
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
        <section aria-label="Create new stock verification">
          <InlineNewInvoiceForm nextStId={nextStId} />
        </section>
      </div>
    </div>
  );
};

export default StockVerification;
