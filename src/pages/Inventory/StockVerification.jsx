import React, {useCallback,useEffect,useMemo,useRef,useState,} from "react";
import { Plus, Trash2 } from "lucide-react";
import { fetchCenters } from "../../services/Inventory/centerService";
import {getProducts, createStockVerification, fetchStockTransfers, getNextStockVerification,} from "../../services/Inventory/inventoryService";
import { useAuth } from "../../contexts/AuthContext";

const LAST_STV_STORAGE_KEY = "inventory_last_stv_id";

// Helpers for generating and normalizing STV codes
const getYearFragment = (input) => {
  const fallback = new Date().getFullYear().toString().slice(-2);
  if (!input && input !== 0) return fallback;
  const str = String(input);
  return str.length === 2 ? str : str.slice(-2);
};

const buildStvCode = (yearFragment, sequence) => {
  const year = getYearFragment(yearFragment);
  const seq = Math.max(1, parseInt(sequence ?? 1, 10) || 1);
  return `STV-${year}-${String(seq).padStart(4, "0")}`;
};

const defaultStvCode = () => buildStvCode(undefined, 1);

const incrementStvCode = (code) => {
  const match = String(code || "").match(/^(.*?)(\d+)([^0-9]*)$/);
  if (!match) return code || defaultStvCode();
  const [, prefix, digits, suffix] = match;
  const bumped = (parseInt(digits, 10) + 1)
    .toString()
    .padStart(digits.length, "0");
  return `${prefix}${bumped}${suffix}`;
};

const normalizeStvCode = (value) => {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const exact = str.match(/^STV-(\d{2})-(\d{1,})$/i);
  if (exact) {
    return buildStvCode(exact[1], exact[2]);
  }
  const digitsOnly = str.match(/^\d+$/);
  if (digitsOnly) {
    return buildStvCode(undefined, digitsOnly[0]);
  }
  const tailDigits = str.match(/(\d{1,})$/);
  if (tailDigits) {
    return buildStvCode(undefined, tailDigits[1]);
  }
  return str.toUpperCase().startsWith("STV-") ? str : null;
};


const StockVerification = () => {
  // Component-level state and refs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextStId, setNextStId] = useState("");
  const [isFetchingNextId, setIsFetchingNextId] = useState(false);
  const [nextIdError, setNextIdError] = useState("");
  const lastCreatedStvRef = useRef("");

  // Hydrate last-created code from localStorage so we can increment when needed
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(LAST_STV_STORAGE_KEY);
      if (stored && /^STV-\d{2}-\d+/i.test(stored.trim())) {
        lastCreatedStvRef.current = stored.trim();
      }
    } catch {
      /* ignore */
    }
  }, []);


  // Fetches the next STV code from the backend or falls back to stored/derived sequence
  const refreshNextStockVerificationId = useCallback(async () => {
    const applyStoredFallback = () => {
      const stored = String(lastCreatedStvRef.current || "").trim();
      if (!stored) return null;
      const bumped = incrementStvCode(stored);
      setNextStId(bumped);
      return bumped;
    };

    const tryExtractNormalized = (payload) => {
      if (!payload) return null;
      const buckets = [payload, payload?.data, payload?.data?.data];
      for (const bucket of buckets) {
        if (bucket === null || bucket === undefined) continue;
        if (
          typeof bucket === "string" ||
          typeof bucket === "number"
        ) {
          const normalized = normalizeStvCode(bucket);
          if (normalized) return normalized;
        }
        if (typeof bucket === "object") {
          if (
            (bucket.year || bucket.year === 0) &&
            (bucket.sequence || bucket.next || bucket.number)
          ) {
            const combined = buildStvCode(
              bucket.year,
              bucket.sequence ?? bucket.next ?? bucket.number
            );
            if (combined) return combined;
          }
          const candidates = [
            bucket.next,
            bucket.current,
            bucket.voucher,
            bucket.code,
            bucket.number,
            bucket.sequence,
            bucket.data,
            bucket.data?.next,
          ];
          for (const candidate of candidates) {
            if (
              typeof candidate === "string" ||
              typeof candidate === "number"
            ) {
              const normalized = normalizeStvCode(candidate);
              if (normalized) return normalized;
            }
            if (candidate && typeof candidate === "object") {
              const nested = tryExtractNormalized(candidate);
              if (nested) return nested;
            }
          }
        }
      }
      return null;
    };

    setIsFetchingNextId(true);
    setNextIdError("");
    try {
      const response = await getNextStockVerification();
      let normalized = tryExtractNormalized(response);
      if (normalized) {
        if (
          normalized === String(lastCreatedStvRef.current || "").trim()
        ) {
          normalized = incrementStvCode(normalized);
        }
        setNextStId(normalized);
        return normalized;
      }
      const fallbackFromStored = applyStoredFallback();
      if (fallbackFromStored) return fallbackFromStored;
      const fallback = defaultStvCode();
      setNextStId(fallback);
      return fallback;
    } catch (err) {
      console.warn("Failed to fetch next stock verification number.", err);
      const status = err?.response?.status;
      if (status !== 404) {
        setNextIdError(
          err?.message || "Unable to fetch next stock verification number."
        );
      } else {
        setNextIdError("");
      }
      const fallbackFromStored = applyStoredFallback();
      if (fallbackFromStored) return fallbackFromStored;
      const fallback = defaultStvCode();
      setNextStId(fallback);
      return fallback;
    } finally {
      setIsFetchingNextId(false);
    }
  }, []);

  useEffect(() => {
    refreshNextStockVerificationId();
  }, [refreshNextStockVerificationId]);

  // Inline form used to capture verification details without leaving the page
  const InlineNewInvoiceForm = ({ nextStId }) => {
    const { user } = useAuth();
    // Primary form inputs
    const [formData, setFormData] = useState({
      id: nextStId || "",
      centerId: "",
      centerName: "",
      date: new Date().toISOString().split("T")[0],
      status: "completed",
      productName: "",
      quantity: 0,
    });
    // Supporting UI state for validation, listed items, and fetched center/product data
    const [errors, setErrors] = useState({});
    const [items, setItems] = useState([]);
    const [centers, setCenters] = useState([]);
    const [centersLoading, setCentersLoading] = useState(false);
    const [centersError, setCentersError] = useState(null);
    const [centerProducts, setCenterProducts] = useState([]);
    const [centerProductsLoading, setCenterProductsLoading] = useState(false);
    const [centerProductsError, setCenterProductsError] = useState(null);

    // Autocomplete entry state for the product selector
    const [entry, setEntry] = useState({
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      batchNumber: "",
    });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const productInputRef = useRef(null);

    // Refresh the available stock list for the selected center
    useEffect(() => {
      setFormData((p) => ({ ...p, id: nextStId }));
    }, [nextStId]);

    // Load centers once and cache their normalized IDs/names
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
          if (normalized.length > 0) {
            setFormData((prev) => {
              if (prev.centerId) return prev;
              return {
                ...prev,
                centerId: normalized[0].id,
                centerName: normalized[0].name,
              };
            });
          }
          setCentersError(null);
        } catch (err) {
          console.error("Failed to load centers:", err);
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
        const centerId = formData.centerId;
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
                  productData.unitPrice ??
                  productData.mrp ??
                  productData.min_price ??
                  0
              ) || 0;
            const minPrice =
              Number(
                productData.min_price ??
                  productData.minPrice ??
                  stock.min_price ??
                  stock.minPrice ??
                  0
              ) || 0;
            const mrp =
              Number(
                productData.mrp ??
                  stock.mrp ??
                  productData.MRP ??
                  stock.MRP ??
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
              minPrice,
              mrp,
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
    }, [formData.centerId]);

    // Memoized product lists: static catalog or stock-specific entries
    const staticProducts = useMemo(() => getProducts?.() || [], []);
    const products = useMemo(() => {
      if (formData.centerId) {
        return centerProducts || [];
      }
      return staticProducts;
    }, [centerProducts, formData.centerId, staticProducts]);
    const selectedCenterLabel = formData.centerName ||
      centers.find((c) => String(c.id) === String(formData.centerId))?.name;
    // Visible suggestions for the product typeahead
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

    const validateForm = () => {
      const e = {};
      if (!formData.id) e.id = "Invoice number not generated";
      if (!formData.centerId.trim()) e.fromCenter = "Center is required";
      if (!formData.date) {
        e.date = "Date is required";
      }
      if ((items?.length || 0) === 0) {
        e.items = "Add at least one item";
      } else {
        const invalidItem = items.find((it) => {
          const qty = Number(it.quantity);
          return !it.name?.trim() || Number.isNaN(qty) || qty < 1;
        });
        if (invalidItem) {
          e.items = "Each item must have a name and a quantity of at least 1";
        }
      }
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
      const catalogProduct = staticProducts.find((p) => {
        if (entry.productId) return String(p.id) === String(entry.productId);
        if (selected?.id) return String(p.id) === String(selected.id);
        return (p.name || "").toLowerCase() === name.toLowerCase();
      });
      const qty = Math.max(1, Number(entry.quantity) || 1);
      const unitPrice = selected
        ? Number(selected.unitPrice) || Number(catalogProduct?.unitPrice) || 0
        : Number(entry.unitPrice) || Number(catalogProduct?.unitPrice) || 0;
      const minPrice = selected
        ? Number(selected.min_price ?? selected.minPrice ?? catalogProduct?.min_price ?? catalogProduct?.minPrice ?? 0) || 0
        : Number(catalogProduct?.min_price ?? catalogProduct?.minPrice ?? 0) || 0;
      const mrp = selected
        ? Number(selected.mrp ?? catalogProduct?.mrp ?? catalogProduct?.MRP ?? 0) || 0
        : Number(catalogProduct?.mrp ?? catalogProduct?.MRP ?? 0) || 0;
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
        mrp,
        minPrice,
        currentStock: selected ? selected.currentstock || 0 : 0,
        batchNumber: selected
          ? selected.batchNumber || selected.batch_number || selected.batch || ""
          : entry.batchNumber || "",
      };
      setItems((prev) => [...prev, newItem]);
      setEntry({ productId: "", productName: "", quantity: 1, unitPrice: 0, batchNumber: "" });
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

      const invoiceData = {
        ...formData,
        items,
        productName: firstItem ? firstItem.name : "",
        quantity: firstItem ? firstItem.quantity : 0,
      };

     //for submitting
      setIsSubmitting(true);
      try {
        // Build the exact payload we'll send, include createdBy fallback
        const payload = {
          ...invoiceData,
          verificationNumber: nextStId,
          // include user details (full object) and user id for backend
          createdBy: user ?? (formData.createdBy ?? ""),
          created_by: user?.id ?? (formData.createdBy ?? ""),
        };

        // Snapshot the payload for reliable console logging (avoids DevTools live-object confusion)
        try {
          console.log("Stock Verification Payload", JSON.parse(JSON.stringify(payload)));
        } catch (err) {
          // fallback if serialization fails
          console.warn("Failed to stringify payload", err);
          console.log("Stock Verification Payload", payload);
        }

        // send the payload to backend using the service function
        try {
          await createStockVerification(payload);
        } catch (err) {
          console.error("Failed to create stock verification on server:", err);
          // surface a generic error to the user
          setErrors((prev) => ({
            ...prev,
            submit: err?.message || "Failed to create stock verification",
          }));
          return;
        }
        lastCreatedStvRef.current = nextStId;
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(LAST_STV_STORAGE_KEY, nextStId);
          } catch {
            /* ignore */
          }
        }
        const nextIdForReset = await refreshNextStockVerificationId();
        setErrors({});
        setFormData({
          id: nextIdForReset || nextStId || "",
          centerId: "",
          centerName: "",
          date: new Date().toISOString().split("T")[0],
          status: "completed",
          productName: "",
          quantity: 0,
        });
        setItems([]);
      } finally {
        setIsSubmitting(false);
      }
    };

  

    return (
      <>
        {/* Header area describing the verification workflow */}
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
                    ? "Loading Number..."
                    : nextStId || "Loading Number..."}
                </span>
              </div>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">
                Efficiently manage and track your stock verifications across centers.
              </p>
              {nextIdError && (
                <p className="text-red-600 text-sm mt-1 font-medium">
                  {nextIdError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main form surface */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-slate-900 border-b border-slate-200 pb-4">
            Create New Stock Verification
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 mb-6 sm:mb-8">
              {/* Date/center selectors */}
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
                    value={formData.centerId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      const match = centers.find((c) => String(c.id) === String(nextId));
                      setFormData((prev) => ({
                        ...prev,
                        centerId: nextId,
                        centerName: match?.name || "",
                      }));
                    }}
                    disabled={centersLoading}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.fromCenter
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                    }`}
                  >
                    <option value="">{centersLoading ? "Loading centers..." : "Select a center"}</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {formData.centerName && (
                    <p className="text-sm text-slate-600">Center Name: {formData.centerName}</p>
                  )}
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
              {/* Product picker and item table */}
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
                              batchNumber: p.batchNumber || p.batch_number || p.batch || "",
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
                            batchNumber: "",
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
                                  batchNumber: p.batchNumber || p.batch_number || p.batch || "",
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
                    {formData.centerId && centerProductsLoading && (
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
                                className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Batch No
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Unit Price
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
                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                                  {it.batchNumber ? it.batchNumber : "-"}
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-right text-sm text-slate-700 whitespace-nowrap font-semibold">
                                  {`LKR ${Number(it.unitPrice || 0).toFixed(2)}`}
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

              {/* Submit action */}
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
