import React, {useCallback,useEffect,useMemo,useRef,useState,} from "react";
import { Plus, Trash2, CheckCircle, X } from "lucide-react";
import { fetchCenters as fetchCentersService } from "../../services/Inventory/centerService";
import {getAll as fetchProductsList,getInventoryDetails as fetchProductDetails,} from "../../services/Inventory/productListService";
import SupplierService from "../../services/Account/SupplierService";
import {createPurchaseOrder,getNextPurchaseOrder,} from "../../services/Inventory/inventoryService"; //get from dummy data inventoryService.js
import { useAuth } from "../../contexts/AuthContext.jsx";
import Supplier from "./MasterFile/Supplier";
import { SuccessPdfView } from "../../components/Inventory/successPdf.jsx";

const defaultPurchaseOrderNumber = () => `PO-${new Date().getFullYear()}-0001`;

const incrementPurchaseOrderNumber = (current) => {
  if (!current) return defaultPurchaseOrderNumber();
  const match = String(current).match(/^(.*?)(\d+)([^0-9]*)$/);
  if (!match) return defaultPurchaseOrderNumber();
  const [, prefix, digits, suffix] = match;
  const nextDigits = (parseInt(digits, 10) + 1)
    .toString()
    .padStart(digits.length, "0");
  return `${prefix}${nextDigits}${suffix}`;
};

const normalizePurchaseOrderNumber = (payload) => {
  const currentYear = new Date().getFullYear();
  if (payload == null) return "";

  const extractParts = (value) => {
    if (value == null) return null;
    if (typeof value === "string" || typeof value === "number") {
      return { raw: value };
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const result = extractParts(item);
        if (result) return result;
      }
      return null;
    }
    if (typeof value === "object") {
      const directRaw =
        value.orderNumber ||
        value.purchaseOrderNumber ||
        value.number ||
        value.nextNumber;
      if (directRaw != null) {
        return { raw: directRaw };
      }
      const year =
        value.year ?? value.Year ?? value.fiscalYear ?? value.FiscalYear;
      const sequence =
        value.sequence ??
        value.Sequence ??
        value.seq ??
        value.Seq ??
        value.next ??
        value.Next;
      if (year != null || sequence != null) {
        return { year, seq: sequence };
      }
      if (value.data != null) {
        return extractParts(value.data);
      }
      if (value.result != null) {
        return extractParts(value.result);
      }
      if (value.payload != null) {
        return extractParts(value.payload);
      }
    }
    return null;
  };

  const parts = extractParts(payload);
  if (!parts) return "";

  const resolveYear = () => {
    const rawYear = parts.year ?? currentYear;
    const numeric = Number(String(rawYear).replace(/[^0-9]/g, ""));
    if (Number.isFinite(numeric) && numeric > 0) {
      return String(numeric);
    }
    return String(currentYear);
  };

  const formatSequence = (value) => {
    if (value == null) return "";
    const digits = String(value).replace(/[^0-9]/g, "");
    return digits ? digits.padStart(4, "0") : "";
  };

  const yearPart = resolveYear();

  if (parts.raw != null) {
    const rawStr = String(parts.raw).trim();
    if (/^PO-\d{4}-\d+$/i.test(rawStr)) {
      return rawStr.toUpperCase();
    }
    if (/^PO-\d+$/i.test(rawStr)) {
      const seq = rawStr.replace(/^PO-/i, "");
      const formattedSeq = formatSequence(seq);
      if (formattedSeq) {
        return `PO-${yearPart}-${formattedSeq}`;
      }
    }
    const formattedSeq = formatSequence(rawStr);
    if (formattedSeq) {
      return `PO-${yearPart}-${formattedSeq}`;
    }
    return rawStr;
  }

  const seqPart = formatSequence(parts.seq);
  if (seqPart) {
    return `PO-${yearPart}-${seqPart}`;
  }

  return "";
};

const pickNumericValue = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return 0;
};

const extractProductMinPrice = (product) => {
  if (!product) return 0;
  return pickNumericValue(
    product.minPrice,
    product.min_price,
    product.minimumPrice,
    product.minimum_price,
    product.min_cost,
    product.minimumCost,
    product.minimum_cost,
    product.price?.minPrice,
    product.price?.min_price,
    product.pricing?.minPrice,
    product.pricing?.min_price,
    product.product_price?.minPrice,
    product.product_price?.min_price
  );
};

const extractProductUnitPrice = (product) => {
  if (!product) return 0;
  return pickNumericValue(
    product.unitPrice,
    product.unit_price,
    product.price,
    product.cost,
    product.costPrice,
    product.cost_price,
    product.unit_cost,
    product.purchase_price,
    product.purchasePrice,
    product.defaultCost,
    product.default_cost,
    product.standard_cost
  );
};

const PurchaseOrder = () => {
  const [nextPONumber, setNextPONumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [nextNumberError, setNextNumberError] = useState("");
  const [recentOrderDetails, setRecentOrderDetails] = useState(null);

  const fetchNextPONumber = useCallback(async (options = {}) => {
    const { fallbackSource } = options;
    setNextNumberError("");
    setIsFetchingNext(true);
    try {
      const response = await getNextPurchaseOrder();
      const normalized = normalizePurchaseOrderNumber(response);
      if (!normalized) {
        throw new Error("Invalid purchase order number response");
      }
      setNextPONumber(normalized);
    } catch (error) {
      console.error("Failed to fetch next purchase order number", error);
      setNextNumberError(
        "Unable to fetch the next purchase order number. Please try again."
      );
      setNextPONumber((prev) => {
        if (fallbackSource) {
          return prev || fallbackSource;
        }
        if (prev) {
          return incrementPurchaseOrderNumber(prev);
        }
        return defaultPurchaseOrderNumber();
      });
    } finally {
      setIsFetchingNext(false);
    }
  }, []);

  useEffect(() => {
    fetchNextPONumber();
  }, [fetchNextPONumber]);

  // LKR formatter
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

  const InlinePOForm = ({ nextPONumber }) => {
    const [form, setForm] = useState({
      orderNumber: "",
      center: "",
      supplier: "",
      date: new Date().toISOString().split("T")[0],
      status: "Draft",
      refNumber: "",
    });
    const [items, setItems] = useState([]);
    const [entry, setEntry] = useState({
      productId: "",
      productName: "",
      batchNumber: "",
      quantity: 1,
      unitPrice: 0,
      minPrice: 0,
      productDiscount: 0,
    });
    const [centers, setCenters] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState({
      centers: false,
      suppliers: false,
      products: false,
    });
    const [isBatchEnabled, setIsBatchEnabled] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");

    // Auth user for createdBy
    const { user } = useAuth();

    // Typeahead state for products
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const productInputRef = useRef(null);

    useEffect(() => {
      setForm((p) => ({ ...p, orderNumber: nextPONumber }));
    }, [nextPONumber]);

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

    // Supplier options come from fetched supplier list
    const supplierOptions = useMemo(() => suppliers, [suppliers]);

    // Helper to parse discount as amount or % against a base
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

    // Aggregate totals based on per-line discounts
    const { subtotal, discountTotal } = useMemo(() => {
      let sub = 0;
      let disc = 0;
      for (const it of items) {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.unitPrice) || 0;
        const gross = qty * price;
        // prefer user-entered discountInput (parsed) as canonical amount;
        // fall back to configured product_discount when discountInput is empty or parses to 0
        const parsedFromInput = parseDiscount(it.discountInput, gross);
        const productDisc = Number(it.product_discount) || 0;
        const dAmt = parsedFromInput > 0 ? parsedFromInput : productDisc;
        disc += dAmt;
        sub += Math.max(0, gross - dAmt);
      }
      return { subtotal: sub, discountTotal: disc };
    }, [items]);

    const validate = () => {
      const e = {};
      if (!form.orderNumber) e.orderNumber = "PO number not generated";
      if (!form.center.trim()) e.center = "Center is required";
      if (!form.supplier.trim()) e.supplier = "Supplier is required";
      if (!form.date) e.date = "Date is required";
      if (items.length === 0) e.items = "Add at least one item";
      setErrors(e);
      return Object.keys(e).length === 0;
    };

    const addItem = () => {
      const name = (entry.productName || "").trim();
      const selected = entry.productId
        ? products.find((p) => String(p.id) === String(entry.productId))
        : products.find(
            (p) => (p.name || "").toLowerCase() === name.toLowerCase()
          );
      const qty = Math.max(1, Number(entry.quantity) || 1);
      const unitPrice = selected
        ? extractProductUnitPrice(selected)
        : pickNumericValue(entry.unitPrice);
      const currentStock = selected
        ? pickNumericValue(
            selected.currentstock,
            selected.stock,
            selected.availableQty,
            selected.available_qty
          )
        : 0;
      const mrp = selected
        ? pickNumericValue(
            selected.mrp,
            selected.MRP,
            selected.max_price,
            selected.maximum_price
          )
        : 0;
      const minPrice = selected
        ? extractProductMinPrice(selected)
        : pickNumericValue(entry.minPrice);
      const e = {};
      if (!name) e.productName = "Product name is required";
      if (unitPrice < 0) e.unitPrice = "Unit price cannot be negative";
      if (isBatchEnabled && !String(entry.batchNumber || "").trim()) {
        e.batchNumber = "Batch number is required";
      }
      setErrors((prev) => ({ ...prev, ...e }));
      if (Object.keys(e).length) return;
      // Ensure unit price does not exceed MRP at the time of adding
      const clampedUnitPrice =
        mrp > 0 ? Math.min(unitPrice, mrp) : Math.max(0, unitPrice);
      const attemptedOverMrp = mrp > 0 && unitPrice > mrp;
      setItems((prev) => [
        ...prev,
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          productId: selected ? selected.id : undefined,
          productName: name,
          batchNumber: isBatchEnabled ? (entry.batchNumber || "").trim() : "",
          quantity: qty,
          unitPrice: clampedUnitPrice,
          currentStock,
          mrp,
          minPrice,
          discountInput: "",
          product_discount: selected ? Number(selected.productDiscount || 0) : Number(entry.productDiscount || 0),
          attemptedOverMrp,
        },
      ]);
      setEntry({
        productId: "",
        productName: "",
        batchNumber: "",
        quantity: 1,
        unitPrice: 0,
        minPrice: 0,
        productDiscount: 0,
      });
    };

    const handleBatchModeChange = (checked) => {
      setIsBatchEnabled(checked);
      setEntry((prev) => ({ ...prev, batchNumber: "" }));
      setErrors((prev) => ({ ...prev, batchNumber: undefined }));
      if (items.length > 0) {
        setItems([]);
      }
    };

    const updateItem = (id, field, rawValue) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          if (field === "batchNumber") {
            return { ...it, batchNumber: String(rawValue || "") };
          }
          if (field === "discountInput") {
            return { ...it, discountInput: String(rawValue || "") };
          }
          const num =
            typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;
          if (field === "quantity")
            return { ...it, quantity: Math.max(1, Math.floor(num)) };
          // Prevent unit price from exceeding MRP and flag a visible message
          if (field === "unitPrice") {
            const mrp = Number(it.mrp) || 0;
            const clamped = Math.max(0, num);
            if (mrp > 0 && clamped > mrp) {
              return { ...it, unitPrice: mrp, attemptedOverMrp: true };
            }
            return { ...it, unitPrice: clamped, attemptedOverMrp: false };
          }
          return it;
        })
      );
    };

    const removeItem = (id) =>
      setItems((prev) => prev.filter((it) => it.id !== id));

    const onSubmit = async (e) => {
      e.preventDefault();
      if (!validate()) return;
      setSubmitError("");
      setIsSubmitting(true);
      try {
        const ensuredOrderNumber =
          form.orderNumber || nextPONumber || defaultPurchaseOrderNumber();
        const minPrice = items.length
          ? Math.min(
              ...items.map((it) => {
                const itemMin = pickNumericValue(it.minPrice, it.min_price);
                return itemMin > 0 ? itemMin : pickNumericValue(it.unitPrice);
              })
            )
          : 0;
        const payload = {
          ...form,
          status: "Completed",
          orderNumber: ensuredOrderNumber,
          minPrice,
          items: items.map((it) => {
            const qty = Number(it.quantity) || 0;
            const price = Number(it.unitPrice) || 0;
            const gross = qty * price;
            const itemMinPrice = pickNumericValue(it.minPrice, it.min_price);
            // Prefer user-entered discountInput (parsed to absolute amount) as canonical per-line discount;
            // fall back to configured product_discount when input is empty
            const parsedFromInput = parseDiscount(it.discountInput, gross);
            const configuredProductDisc = Number(it.product_discount) || 0;
            const productDisc = parsedFromInput > 0 ? parsedFromInput : configuredProductDisc;
            return {
              ...it,
              // set product_discount to the final numeric discount amount that will be sent to backend
              product_discount: productDisc,
              batchNumber: it.batchNumber || "",
              minPrice: itemMinPrice,
              min_price: itemMinPrice,
              lineGross: gross,
              lineDiscountInput: it.discountInput || "",
              lineDiscountAmount: productDisc,
              lineNet: Math.max(0, gross - productDisc),
            };
          }),
          subtotal,
          discountTotal,
        };
        // Attach createdBy from auth context if available
        if (user) {
          payload.createdBy = {
            id: user.id ?? user.userId ?? null,
            name:
              user.name ?? user.fullName ?? user.username ?? user.email ?? "",
          };
        }

        // Detailed logging for debugging: payload, JSON, batch numbers and each item
        try {
          console.log("Purchase order payload:", payload);
          const batchNumbers = (payload.items || []).map(
            (it) => it.batchNumber || ""
          );
          console.log("Batch numbers:", batchNumbers);
          (payload.items || []).forEach((it, idx) =>
            console.log(`Item ${idx + 1}:`, it)
          );
          console.log("createdById:", payload.createdBy?.id ?? null);
        } catch (logError) {
          console.warn(
            "Failed to stringify purchase order payload for logging",
            logError
          );
          console.log("Purchase order payload (fallback):", payload);
        }

        const response = await createPurchaseOrder(payload);
        const createdData = response?.data ?? response;
        const createdNumber =
          normalizePurchaseOrderNumber(createdData) ||
          createdData?.orderNumber ||
          createdData?.purchaseOrderNumber ||
          ensuredOrderNumber;
        console.log("Purchase order API response:", createdData);
        setSuccessText(`Purchase order ${createdNumber} created successfully.`);
        
        // Create order snapshot for PDF generation
        const itemsSnapshot = payload.items.map((item) => {
          const qty = Number(item.quantity || 0);
          const unitPrice = Number(item.unitPrice || 0);
          const discountAmount = Number(item.lineDiscountAmount || 0);
          return {
            ...item,
            quantity: qty,
            unitPrice,
            lineDiscountAmount: discountAmount,
            lineNet: Number(
              item.lineNet ?? Math.max(0, qty * unitPrice - discountAmount)
            ),
          };
        });
        
        const orderSnapshot = {
          ...payload,
          orderNumber: createdNumber,
          orderDate: form.date,
          center: form.center,
          supplier: selectedSupplier?.name || form.supplier,
          supplierName: selectedSupplier?.name || form.supplier,
          supplierAddress: [selectedSupplier?.address1, selectedSupplier?.address2].filter(Boolean).join(", ") || selectedSupplier?.address || "",
          supplierPhone: selectedSupplier?.telephone || selectedSupplier?.phone || "",
          refNumber: form.refNumber,
          status: payload.status || "Completed",
          items: itemsSnapshot,
          discountTotal,
          totalAmount: subtotal - discountTotal,
          documentType: "Purchase Order",
          currencyFormat: (value) => formatLKR(value),
        };
        setRecentOrderDetails(orderSnapshot);
        setShowSuccess(true);
        const optimisticNext = incrementPurchaseOrderNumber(createdNumber);
        setNextPONumber(optimisticNext);
        setForm({
          orderNumber: optimisticNext,
          center: "",
          supplier: "",
          date: new Date().toISOString().split("T")[0],
          status: "Draft",
          refNumber: "",
        });
        setItems([]);
        setEntry({
          productId: "",
          productName: "",
          batchNumber: "",
          quantity: 1,
          unitPrice: 0,
          minPrice: 0,
        });
        setErrors({});
        await fetchNextPONumber({ fallbackSource: optimisticNext });
      } catch (error) {
        console.error("Failed to create purchase order", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to create purchase order. Please try again.";
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    };

    useEffect(() => {
      const loadCenters = async () => {
        try {
          setLoading((prev) => ({ ...prev, centers: true }));
          const data = await fetchCentersService();
          const normalized = Array.isArray(data)
            ? data.map((c) => ({
                id:
                  c.id ??
                  c.center_id ??
                  c.value ??
                  String(c.name || c.title || c),
                name: c.name ?? c.center_name ?? c.title ?? String(c.name || c),
              }))
            : [];
          setCenters(normalized);
        } catch (e) {
          console.error("error fetching centers", e);
          setCenters([]);
        } finally {
          setLoading((prev) => ({ ...prev, centers: false }));
        }
      };

      const loadProducts = async () => {
        try {
          setLoading((prev) => ({ ...prev, products: true }));
          let data;
          try {
            data = await fetchProductDetails();
          } catch (detailError) {
            console.warn("Falling back to basic product list", detailError);
            data = await fetchProductsList();
          }
          const flatData = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : [];
          const normalized = flatData.map((p) => ({
            id:
              p.id ?? p.product_id ?? p.value ?? String(p.name || p.title || p),
            name: p.name ?? p.product_name ?? p.title ?? String(p.name || p),
            sku:
              p.sku ?? p.product_sku ?? p.code ?? String(p.sku || p.code || ""),
            unitPrice: extractProductUnitPrice(p),
            mrp: pickNumericValue(
              p.mrp,
              p.MRP,
              p.max_price,
              p.maximum_price,
              p.maximumPrice
            ),
            currentstock: pickNumericValue(
              p.currentstock,
              p.stock,
              p.availableQty,
              p.available_qty,
              p.quantity_on_hand,
              p.qty_on_hand
            ),
            minPrice: extractProductMinPrice(p),
            productDiscount: pickNumericValue(
              p.product_discount,
              p.discount,
              p.discountPerUnit,
              p.discount_per_unit,
              p.default_discount,
              0
            ),
          }));
          setProducts(normalized);
        } catch (e) {
          console.error("error fetching products", e);
          setProducts([]);
        } finally {
          setLoading((prev) => ({ ...prev, products: false }));
        }
      };



// for supplier details load
      const loadSuppliers = async () => {
        try {
          setLoading((prev) => ({ ...prev, suppliers: true }));
          const data = await SupplierService.list();
          const normalized = Array.isArray(data)
            ? data.map((s) => ({
                id:
                  s.id ?? s.supplier_id ??  s.value ??  String(s.name || s.title || s),
                name:
                   s.supplier_name ?? String(s.name || s),
                address1:
                  s.address1 ??  "",
                address2:
                  s.address2 ?? "",
                telephone:
                   s.phone_number ?? "",
              }))
            : [];
          setSuppliers(normalized);
        } catch (e) {
          console.error("error fetching suppliers", e);
          setSuppliers([]);
        } finally {
          setLoading((prev) => ({ ...prev, suppliers: false }));
        }
      };

      loadCenters();
      loadProducts();
      loadSuppliers();
    }, []);

    const selectedSupplier = suppliers.find(
      (s) => String(s.id) === String(form.supplier)
    );

    return (
      <>
        <div className="bg-slate-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase">
                Purchase Order
              </h1>
              <div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">
                Purchase Order Number :{" "}
                {isFetchingNext ? "Loading…" : nextPONumber || "Unavailable"}
              </div>
              {nextNumberError && (
                <p className="text-sm text-red-600 mt-1">{nextNumberError}</p>
              )}
              <p className="text-slate-600 mt-2 text-base">
                Create and manage purchase orders
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 border border-slate-200">
          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, date: e.target.value }))
                    }
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white ${
                      errors.date ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                  {errors.date && (
                    <p className="text-red-500 text-sm mt-2">{errors.date}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Center *
                  </label>
                  <select
                    value={form.center}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, center: e.target.value }))
                    }
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white ${
                      errors.center ? "border-red-500" : "border-slate-300"
                    }`}
                    disabled={loading.centers}
                  >
                    <option value="">
                      {loading.centers ? "Loading centers…" : "Select a center"}
                    </option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.center && (
                    <p className="text-red-500 text-sm mt-2">{errors.center}</p>
                  )}
                 
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Supplier Name *
                  </label>
                  <select
                    value={form.supplier}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, supplier: e.target.value }))
                    }
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white ${
                      errors.supplier ? "border-red-500" : "border-slate-300"
                    }`}
                    disabled={loading.suppliers}
                  >
                    <option value="">
                      {loading.suppliers
                        ? "Loading suppliers…"
                        : "Select supplier"}
                    </option>
                    {supplierOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplier && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.supplier}
                    </p>
                  )}
                  {selectedSupplier && (
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedSupplier.address1 && (
                        <span className="block">{selectedSupplier.address1}</span>
                      )}
                      {selectedSupplier.address2 && (
                        <span className="block">{selectedSupplier.address2}</span>
                      )}
                      {selectedSupplier.telephone && (
                        <span className="block">Contact: {selectedSupplier.telephone}</span>
                      )}
                    </p>
                  )}
                 
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Ref Number
                  </label>
                  <input
                    type="text"
                    value={form.refNumber}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, refNumber: e.target.value }))
                    }
                    placeholder="Enter reference number"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
                  />
                </div>
                <div className="lg:place-self-end pr-65 text-center bg-slate-100 rounded-lg p-4 border border-slate-200">
                  <p className="text-lg font-semibold text-slate-700">
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatLKR(subtotal)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Total Discount: <span className="text-sm font-medium text-slate-700">{formatLKR(discountTotal)}</span>
                  </p>
                </div>
              </div>

              {/* Items entry section */}

              <div className="mb-6 bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-slate-900">
                    Add Items
                  </h4>
                  <div className="mt-2 flex items-center gap-3">
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                        checked={isBatchEnabled}
                        onChange={(e) => handleBatchModeChange(e.target.checked)}
                      />
                      <span>Enable batch numbers per item</span>
                    </label>
                  </div>
                </div>
                <div className={`grid grid-cols-1 ${isBatchEnabled ? "sm:grid-cols-5" : "sm:grid-cols-4"} gap-6`}>
                  <div className={isBatchEnabled ? "sm:col-span-3 space-y-2" : "sm:col-span-2 space-y-2"}>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                              batchNumber: "",
                              quantity: 1,
                              unitPrice: extractProductUnitPrice(p),
                              minPrice: extractProductMinPrice(p),
                              productDiscount: Number(p.productDiscount || 0),
                            });
                            setShowSuggestions(false);
                            setActiveIndex(-1);
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
                            minPrice: 0,
                          }));
                          setShowSuggestions(true);
                          setActiveIndex(-1);
                        }}
                        onBlur={() => {
                          // Delay hiding to allow click selection
                          setTimeout(() => setShowSuggestions(false), 150);
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-slate-400 ${
                          errors.productName
                            ? "border-red-500"
                            : "border-slate-300"
                        }`}
                        placeholder="Type to search product (name or SKU)"
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
                              } transition-colors`}
                              onMouseEnter={() => setActiveIndex(idx)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setEntry({
                                  productId: p.id,
                                  productName: p.name,
                                  batchNumber: "",
                                  quantity: 1,
                                  unitPrice: extractProductUnitPrice(p),
                                  minPrice: extractProductMinPrice(p),
                                  productDiscount: Number(p.productDiscount || 0),
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
                                Product Code: {p.sku || "N/A"}
                              </span>
                              <span className="ml-auto text-xs text-slate-600 font-semibold">
                                Cost: {formatLKR(p.unitPrice)} • Min{" "}
                                {formatLKR(p.minPrice)} • MRP {formatLKR(p.mrp)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {errors.productName && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.productName}
                      </p>
                    )}
                  </div>

                  {isBatchEnabled && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={entry.batchNumber}
                        onChange={(e) =>
                          setEntry((p) => ({ ...p, batchNumber: e.target.value }))
                        }
                        placeholder={"Enter batch number"}
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-slate-400"
                      />
                    </div>
                  )}

                  {/* Add Item Button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md"
                    >
                      <Plus className="h-5 w-5" />
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              {items.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm">
                      <table className="min-w-[980px] w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              No
                            </th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Product Name
                            </th>
                            {isBatchEnabled && (
                              <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Batch No
                              </th>
                            )}
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Cost Price
                            </th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Qty
                            </th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                              MRP
                            </th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Discount
                            </th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {items.map((it, idx) => {
                            const rowQty = Number(it.quantity) || 0;
                            const rowPrice = Number(it.unitPrice) || 0;
                            const rowGross = rowQty * rowPrice;
                            // prefer parsed discountInput (user-entered) as canonical amount; fall back to product_discount
                            const parsedRowDiscount = parseDiscount(it.discountInput, rowGross);
                            const rowProductDisc = Number(it.product_discount) || 0;
                            const rowDiscount = parsedRowDiscount > 0 ? parsedRowDiscount : rowProductDisc;
                            const rowTotal = Math.max(
                              0,
                              rowGross - rowDiscount
                            );
                            return (
                              <tr
                                key={it.id}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                                  {idx + 1}
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-900 font-semibold">
                                  {it.productName}
                                </td>
                                {isBatchEnabled && (
                                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-900 whitespace-nowrap">
                                    <input
                                      type="text"
                                      value={it.batchNumber || ""}
                                      onChange={(e) =>
                                        updateItem(
                                          it.id,
                                          "batchNumber",
                                          e.target.value
                                        )
                                      }
                                      placeholder={"Required"}
                                      className="w-28 px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
                                    />
                                  </td>
                                )}
                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                  {/*unit price cannot exceep MRP message */}
                                  <div className="flex flex-col items-end">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={it.unitPrice}
                                      onChange={(e) =>
                                        updateItem(
                                          it.id,
                                          "unitPrice",
                                          e.target.value
                                        )
                                      }
                                      className={`w-28 px-3 py-2 border-2 rounded-lg text-right focus:outline-none focus:ring-2 transition-colors bg-slate-50 hover:bg-white ${
                                        it?.attemptedOverMrp
                                          ? "border-red-500 focus:ring-red-500"
                                          : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                                      }`}
                                    />
                                    {it?.attemptedOverMrp && (
                                      <p className="mt-1 text-xs text-red-600">
                                        Unit price cannot exceed MRP (
                                        {formatLKR(it.mrp || 0)})
                                      </p>
                                    )}
                                  </div>
                                </td>

                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="1"
                                    value={it.quantity}
                                    onChange={(e) =>
                                      updateItem(
                                        it.id,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    className="w-24 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
                                  />
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">
                                  {formatLKR(it.mrp || 0)}
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={it.discountInput || ""}
                                    onChange={(e) =>
                                      updateItem(
                                        it.id,
                                        "discountInput",
                                        e.target.value
                                      )
                                    }
                                    placeholder="0 or 10%"
                                    className="w-24 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
                                  />
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                                  {formatLKR(rowTotal)}
                                </td>
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

              <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
                {submitError && (
                  <p
                    className="w-full sm:w-auto text-red-600 text-sm font-semibold"
                    role="alert"
                  >
                    {submitError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-3 shadow-lg w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Create Purchase Order
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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-100 to-slate-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <section aria-label="Create new purchase order">
          <InlinePOForm nextPONumber={nextPONumber} />
        </section>
      </div>

      {/* Loading overlay */}
      {isSubmitting && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 flex items-center gap-4 border border-slate-200">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-slate-800 font-medium">
              Creating purchase order…
            </span>
          </div>
        </div>
      )}

      {/* Success modal popup with order details */}
      {showSuccess && recentOrderDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Purchase order created"
        >
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Success</p>
                  <p className="text-sm text-slate-600">{successText || "Purchase order created successfully."}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSuccess(false);
                  setRecentOrderDetails(null);
                }}
                className="rounded-full p-2 text-slate-500 hover:text-slate-900"
                aria-label="Close order summary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5">
              <SuccessPdfView orderData={recentOrderDetails} documentType="Purchase Order" />
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowSuccess(false);
                  setRecentOrderDetails(null);
                }}
                className="px-5 py-2 text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrder;
