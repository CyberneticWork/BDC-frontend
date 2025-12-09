import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import {
  getProducts,
  getNextPurchaseReturn,
  fetchGRNs,
  createPurchaseReturn,
} from "../../services/Inventory/inventoryService";
import { fetchCenters as fetchCentersService } from "../../services/Inventory/centerService";
import SupplierService from "../../services/Account/SupplierService";
import InventoryPopup from "../../components/Inventory/inventoryPopup";
import { getUser } from "../../services/UserService";

const LAST_PURCHASE_RETURN_KEY = "inventory_last_prt_id";

const incrementPrtCode = (code) => {
  const match = String(code).match(/^(.*?)(\d+)([^0-9]*)$/);
  if (!match) return String(code);
  const [, prefix, digits, suffix] = match;
  const nextDigits = (parseInt(digits, 10) + 1)
    .toString()
    .padStart(digits.length, "0");
  return `${prefix}${nextDigits}${suffix}`;
};

const Invoices = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextPrtId, setNextPrtId] = useState("");
  const lastCreatedPrtRef = useRef("");

  const refreshNextPrtId = useCallback(async () => {
    const applyStoredFallback = () => {
      const storedLast = (lastCreatedPrtRef.current || "").trim();
      if (!storedLast) return null;
      const nextFromStored = incrementPrtCode(storedLast);
      if (nextFromStored) {
        setNextPrtId(nextFromStored);
        return nextFromStored;
      }
      return null;
    };

    try {
      const resp = await getNextPurchaseReturn();
      const rawNext =
        resp?.data?.next ??
        resp?.next ??
        resp?.data?.voucher ??
        resp?.voucher ??
        resp?.data?.current ??
        resp?.current ??
        "";
      if (rawNext) {
        const normalized = String(rawNext).trim();
        if (normalized) {
          if (
            String(lastCreatedPrtRef.current || "").trim() === normalized
          ) {
            const bumped = incrementPrtCode(normalized);
            setNextPrtId(bumped);
            return bumped;
          }

          setNextPrtId(normalized);
          return normalized;
        }
      }

      const fallbackFromStored = applyStoredFallback();
      if (fallbackFromStored) return fallbackFromStored;

      const year = new Date().getFullYear().toString().slice(-2);
      const fallbackNext = `PRT-${year}-0001`;
      setNextPrtId(fallbackNext);
      return fallbackNext;
    } catch (error) {
      console.warn("Failed to fetch next Purchase Return number", error);
      const fallbackFromStored = applyStoredFallback();
      if (fallbackFromStored) return fallbackFromStored;

      const year = new Date().getFullYear().toString().slice(-2);
      const fallbackNext = `PRT-${year}-0001`;
      setNextPrtId((prev) => prev || fallbackNext);
      return null;
    }
  }, []);

  const handlePurchaseReturnCreated = useCallback(
    (createdId) => {
      const normalized = String(createdId || nextPrtId || "").trim();
      if (normalized) {
        lastCreatedPrtRef.current = normalized;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(LAST_PURCHASE_RETURN_KEY, normalized);
        }
      }
      refreshNextPrtId();
    },
    [nextPrtId, refreshNextPrtId]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LAST_PURCHASE_RETURN_KEY);
    if (stored) {
      lastCreatedPrtRef.current = stored.trim();
    }
  }, []);

  useEffect(() => {
    refreshNextPrtId();
  }, [refreshNextPrtId]);

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

  const InlineNewInvoiceForm = ({ nextPrtId, onPurchaseReturnCreated }) => {
    const [formData, setFormData] = useState({
      id: "",
      center: "",
      supplier: "",
      date: new Date().toISOString().split("T")[0],
      refNumber: "",
      amount: 0,
      // kept for backward compatibility where needed
      productName: "",
      quantity: 0,
    });
    const [errors, setErrors] = useState({});
    const [items, setItems] = useState([]);
    const [isBatchEnabled, setIsBatchEnabled] = useState(false);
    // Payment popup removed; no payment state needed
    const [showSuccess, setShowSuccess] = useState(false);
    const [successText, setSuccessText] = useState("");
    const [centerOptions, setCenterOptions] = useState([]);
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [loading, setLoading] = useState({ centers: false, suppliers: false });
    const [grnOptions, setGrnOptions] = useState([]);
    const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
    const [isGrnLoading, setIsGrnLoading] = useState(false);
    const [grnError, setGrnError] = useState("");
    const grnQueryRef = useRef({ center: "", supplier: "" });

    // Entry state and typeahead like SalesOrder page
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

    useEffect(() => {
      setFormData((p) => ({ ...p, id: nextPrtId }));
    }, [nextPrtId]);

    const products = useMemo(() => getProducts?.() || [], []);
    useEffect(() => {
      let active = true;
      const loadCenters = async () => {
        try {
          setLoading((prev) => ({ ...prev, centers: true }));
          const data = await fetchCentersService();
          if (!active) return;
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : [];
          const normalized = list.map((item) => ({
            id: item.id ?? item.center_id ?? item.value ?? item.name,
            name:
              item.name ??
              item.center_name ??
              item.title ??
              item.value ??
              String(item.name || ""),
          }));
          if (active) {
            setCenterOptions(normalized.filter((c) => c.id && c.name));
          }
        } catch (error) {
          console.error("Error fetching centers:", error);
          if (active) {
            setCenterOptions([]);
          }
        } finally {
          if (active) {
            setLoading((prev) => ({ ...prev, centers: false }));
          }
        }
      };
      loadCenters();
      return () => {
        active = false;
      };
    }, []);

    useEffect(() => {
      let active = true;
      const loadSuppliers = async () => {
        try {
          setLoading((prev) => ({ ...prev, suppliers: true }));
          const data = await SupplierService.list();
          if (!active) return;
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : [];
          const normalized = list.map((item) => ({
            id: item.id ?? item.supplier_id ?? item.value ?? item.name,
            name:
              item.name ??
              item.supplier_name ??
              item.display_name ??
              item.business_name ??
              String(item.name || ""),
          }));
          if (active) {
            setSupplierOptions(normalized.filter((s) => s.id && s.name));
          }
        } catch (error) {
          console.error("Error fetching suppliers:", error);
          if (active) {
            setSupplierOptions([]);
          }
        } finally {
          if (active) {
            setLoading((prev) => ({ ...prev, suppliers: false }));
          }
        }
      };
      loadSuppliers();
      return () => {
        active = false;
      };
    }, []);

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
        const disc = Number(it.discount) || 0;
        const lineTotal = unit * qty;
        const lineDiscount = disc * qty;
        return acc + (lineTotal - lineDiscount);
      }, 0);
    }, [items]);

    useEffect(() => {
      setFormData((p) => ({ ...p, amount: tableTotal }));
    }, [tableTotal]);

    const loadGrnsForSelection = useCallback(
      async ({ centerName, supplierName }) => {
        if (!centerName || !supplierName) return;
        setIsGrnLoading(true);
        setGrnError("");
        try {
          const center = centerOptions.find((c) => c.name === centerName);
          const supplier = supplierOptions.find((s) => s.name === supplierName);
          const response = await fetchGRNs({
            params: {
              center: centerName,
              centerName,
              centerId: center?.id,
              center_id: center?.id,
              supplier: supplierName,
              supplierName,
              supplierId: supplier?.id,
              supplier_id: supplier?.id,
            },
          });
          const rawList = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.rows)
            ? response.rows
            : Array.isArray(response)
            ? response
            : [];
          const filtered = rawList.filter((grn) => {
            const flag = grn?.is_ref;
            return !(flag === 1 || flag === "1" || flag === true);
          });
          setGrnOptions(filtered);
          setIsGrnModalOpen(true);
        } catch (error) {
          console.error("Error fetching GRNs:", error);
          setGrnOptions([]);
          setGrnError("Unable to load GRNs for this supplier.");
          setIsGrnModalOpen(true);
        } finally {
          setIsGrnLoading(false);
        }
      },
      [centerOptions, supplierOptions]
    );

    const resolveGrnUnitPrice = (item, qty) => {
      const numeric = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
      };
      const qtySafe = qty && qty > 0 ? qty : 1;
      const aggregateSources = [
        item.total,
        item.totalAmount,
        item.lineTotal,
        item.line_total,
        item.subtotal,
        item.amount,
        item.grossAmount,
        item.gross_amount,
      ];
      for (const aggregate of aggregateSources) {
        const num = numeric(aggregate);
        if (num != null && num > 0) {
          return num / qtySafe;
        }
      }
      const directSources = [
        item.unitPrice,
        item.unit_price,
        item.costPrice,
        item.cost_price,
        item.price,
      ];
      for (const direct of directSources) {
        const num = numeric(direct);
        if (num != null && num >= 0) return num;
      }
      return 0;
    };

    useEffect(() => {
      const centerName = (formData.center || "").trim();
      const supplierName = (formData.supplier || "").trim();
      if (!centerName || !supplierName) return;
      const last = grnQueryRef.current;
      if (last.center === centerName && last.supplier === supplierName) return;
      grnQueryRef.current = { center: centerName, supplier: supplierName };
      loadGrnsForSelection({ centerName, supplierName });
    }, [formData.center, formData.supplier, loadGrnsForSelection]);

    const applyGrnToReturn = (grn) => {
      if (!grn) return;
      const sourceItems = Array.isArray(grn.items)
        ? grn.items
        : Array.isArray(grn.grnItems)
        ? grn.grnItems
        : [];
      if (!sourceItems.length) {
        setGrnError("Selected GRN does not contain any items.");
        return;
      }

      const baseId = Date.now();
      const mappedItems = sourceItems
        .map((item, idx) => {
          const productId =
            item.productId ??
            item.product_id ??
            item.product?.id ??
            item.product?.product_id ??
            item.product?.productId ??
            null;
          const qty = Math.max(
            1,
            Number(
              item.receivedQty ??
                item.receivedQuantity ??
                item.quantity ??
                item.qty ??
                0
            )
          );
          const unitPrice = Math.max(0, resolveGrnUnitPrice(item, qty));
          const discount = Number(
            item.discountPerUnit ?? item.discount ?? item.discountAmount ?? 0
          );
          const name =
            item.product?.name ??
            item.name ??
            item.productName ??
            `Item ${idx + 1}`;
          const batchFromArrays = Array.isArray(item.batches) && item.batches.length
            ? item.batches[0]?.batch_number ?? item.batches[0]?.batchNumber ?? item.batches[0]?.batch ?? null
            : null;
          const batchFromProduct = Array.isArray(item.product?.batches) && item.product.batches.length
            ? item.product.batches[0]?.batch_number ?? item.product.batches[0]?.batchNumber ?? item.product.batches[0]?.batch ?? null
            : null;
          const batchNumber =
            item.batchNumber ??
            item.batch_no ??
            item.batch ??
            batchFromArrays ??
            batchFromProduct ??
            null;
          return {
            id: `${baseId}-${idx}`,
            productId,
            name,
            quantity: qty,
            unitPrice,
            discount: Math.max(0, discount),
            mrp: Number(item.mrp ?? item.maximumRetailPrice ?? 0),
            currentStock: Number(
              item.currentStock ?? item.current_stock ?? item.stock ?? 0
            ),
            batchNumber,
          };
        })
        .filter(Boolean);

      if (!mappedItems.length) {
        setGrnError("Selected GRN does not contain any valid items.");
        return;
      }

      setItems(mappedItems);
      try {
        const hasBatch = mappedItems.some(
          (m) => m.batchNumber && String(m.batchNumber).trim().length > 0
        );
        setIsBatchEnabled(hasBatch);
      } catch {
        setIsBatchEnabled(false);
      }
      setErrors((prev) => ({ ...prev, items: undefined }));
      setIsGrnModalOpen(false);
      setGrnError("");
      setFormData((prev) => ({
        ...prev,
        refNumber:
          grn.grnNumber ??
          grn.voucherNumber ??
          grn.refNumber ??
          grn.id ??
          prev.refNumber,
      }));
    };

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
        productId: selected?.id || entry.productId || null,
        name,
        quantity: qty,
        unitPrice: Math.max(0, unitPrice),
        discount: 0,
        mrp: selected ? Number(selected.mrp) || 0 : 0,
        currentStock: selected ? selected.currentstock || 0 : 0,
        batchNumber: (isBatchEnabled && (entry.batchNumber || selected?.batchNumber)) ? (entry.batchNumber || selected?.batchNumber || "") : "",
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
        const disc = Number(it.discount) || 0;
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

      const user = getUser?.() || (() => {
        try {
          const raw = window?.localStorage?.getItem("user");
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();
      const createdById = user?.id ?? user?.user_id ?? null;

      // Immediately finalize (no payment popup)
      const completedInvoice = {
        ...invoiceData,
        id: invoiceData.id || nextPrtId,
        status: "completed",
        created_by: createdById,
        createdBy: createdById,
      };

      const centerMatch = centerOptions.find(
        (c) => c.name === formData.center || String(c.id) === String(formData.center)
      );
      const supplierMatch = supplierOptions.find(
        (s) => s.name === formData.supplier || String(s.id) === String(formData.supplier)
      );

      const centerId =
        centerMatch?.id ?? formData.centerId ?? formData.center_id ?? null;
      const centerName =
        centerMatch?.name ?? formData.centerName ?? formData.center ?? "";
      const supplierId =
        supplierMatch?.id ?? formData.supplierId ?? formData.supplier_id ?? null;
      const supplierName =
        supplierMatch?.name ?? formData.supplierName ?? formData.supplier ?? "";

      const normalizedItems = (completedInvoice.items || []).map((it) => {
        const productId =
          it.productId ??
          it.product_id ??
          it.id ??
          it.product?.id ??
          it.product?.product_id ??
          null;
        const qty = Number(it.quantity) || 0;
        const unitPrice = Number(it.unitPrice) || 0;
        const discount = Number(it.discount) || 0;
        const lineTotal = qty * unitPrice;
        return {
          ...it,
          productId,
          product_id: productId,
          productName: it.name ?? it.productName ?? "",
          name: it.name ?? it.productName ?? "",
          quantity: qty,
          qty,
          unitPrice,
          unit_price: unitPrice,
          price: unitPrice,
          rate: unitPrice,
          discount,
          discountPerUnit: discount,
          discount_per_unit: discount,
          discountAmount: discount,
          batchNumber: it.batchNumber || "",
          batch_number: it.batchNumber || "",
          mrp: Number(it.mrp) || 0,
          currentStock: Number(it.currentStock) || 0,
          current_stock: Number(it.currentStock) || 0,
          lineTotal,
          total: lineTotal,
        };
      });

      const payload = {
        ...completedInvoice,
        purchaseReturnNumber: completedInvoice.id,
        voucherNumber: completedInvoice.id,
        referenceNumber: completedInvoice.refNumber,
        refNumber: completedInvoice.refNumber,
        centerId,
        center_id: centerId,
        center: centerName,
        centerName,
        supplierId,
        supplier_id: supplierId,
        supplier: supplierName,
        supplierName,
        returnDate: completedInvoice.date,
        status: completedInvoice.status || "Pending",
        totalAmount: completedInvoice.amount,
        subtotal: completedInvoice.amount,
        amount: completedInvoice.amount,
        itemCount: normalizedItems.length,
        items: normalizedItems,
      };

      console.log("Finalized Purchase Return data:", payload);

      setIsSubmitting(true);
      setErrors((prev) => ({ ...prev, submit: undefined }));

      try {
        const response = await createPurchaseReturn(payload);
        const createdId =
          response?.data?.id ??
          response?.data?.purchaseReturnNumber ??
          response?.data?.voucherNumber ??
          response?.id ??
          completedInvoice.id ??
          nextPrtId;

        const successMessage =
          response?.data?.message ??
          response?.message ??
          `Purchase Return ${createdId || nextPrtId} has been created successfully!`;

        setFormData({
          id: "",
          center: "",
          supplier: "",
          date: new Date().toISOString().split("T")[0],
          refNumber: "",
          amount: 0,
          productName: "",
          quantity: 0,
        });
        setItems([]);
        onPurchaseReturnCreated?.(createdId || nextPrtId);
        setSuccessText(successMessage);
        setShowSuccess(true);
      } catch (error) {
        console.error("Error creating Purchase Return:", error);
        const apiMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to create purchase return. Please try again.";
        setErrors((prev) => ({ ...prev, submit: apiMessage }));
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <>
        <div className="bg-linear-to-r from-slate-50 to-slate-100 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold uppercase text-slate-900 mb-2">
                Purchase Return
              </h1>
              <div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl min-h-7 flex items-center gap-2">
                {nextPrtId ? (
                  <>
                    <span>Purchase Return Number:</span>
                    <span>{nextPrtId}</span>
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                    <span>Loading number…</span>
                  </>
                )}
              </div>
              <p className="text-slate-600 text-sm sm:text-base">
                Manage and track your purchase returns efficiently
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">
            Create New Purchase Return
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? "date-error" : undefined}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.date
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  />
                  {errors.date && (
                    <p
                      id="date-error"
                      className="text-red-500 text-sm mt-2 font-medium"
                    >
                      {errors.date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    {"Center *"}
                  </label>
                  <select
                    value={formData.center}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        center: e.target.value,
                      }))
                    }
                    disabled={loading.centers}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.center
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    } ${loading.centers ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{loading.centers ? "Loading centers…" : "Select a center"}</option>
                    {centerOptions.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.center && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {errors.center}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    { "Supplier Name *"}
                  </label>
                  <select
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplier: e.target.value,
                      }))
                    }
                    aria-invalid={!!errors.supplier}
                    aria-describedby={
                      errors.supplier ? "supplier-error" : undefined
                    }
                    disabled={loading.suppliers}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.supplier
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    } ${loading.suppliers ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{loading.suppliers ? "Loading suppliers…" : "Select supplier"}</option>
                    {supplierOptions.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplier && (
                    <p
                      id="supplier-error"
                      className="text-red-500 text-sm mt-2 font-medium"
                    >
                      Supplier is required
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={formData.refNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        refNumber: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 transition-all duration-200 bg-white"
                    placeholder="Enter reference number"
                  />
                </div>

                <div className="lg:place-self-end text-center bg-linear-to-r from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200">
                  <p className="text-slate-600 font-medium mb-2">
                    Total Amount
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                    {formatLKR(tableTotal)}
                  </p>
                </div>
              </div>

              {/* Product Section - SalesOrder-like entry */}
              <div className="mb-6 sm:mb-8">
                <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6">
                  Product Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Product Name *
                    </label>
                    <div className="flex items-center gap-3 mb-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isBatchEnabled}
                          onChange={(e) => setIsBatchEnabled(!!e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-medium">Enable batch numbers per item</span>
                      </label>
          
                    </div>
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
                              batchNumber: "",
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
                            batchNumber: "",
                          }));
                          setShowSuggestions(true);
                          setActiveIndex(-1);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 150);
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.productName
                            ? "border-red-300 bg-red-50"
                            : "border-slate-300 bg-white hover:border-slate-400"
                        }`}
                        placeholder="Type to search product (name or SKU)"
                      />
                      {showSuggestions && filteredProducts.length > 0 && (
                        <ul className="absolute z-20 mt-2 w-full max-h-60 overflow-auto rounded-lg border-2 border-slate-200 bg-white shadow-xl">
                          {filteredProducts.map((p, idx) => (
                            <li
                              key={p.id}
                              className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors duration-150 ${
                                idx === activeIndex
                                  ? "bg-blue-50 border-l-4 border-blue-500"
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
                                {p.sku}
                              </span>
                              <span className="ml-auto text-xs text-slate-600 font-medium">
                                LKR {Number(p.unitPrice || 0).toFixed(2)}
                                {typeof p.currentstock !== "undefined"
                                  ? ` • Stock ${p.currentstock}`
                                  : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {isBatchEnabled && (
                        <div className="mt-3">
                          <label className="block text-xs text-slate-600 mb-1">Batch Number</label>
                          <input
                            type="text"
                            value={entry.batchNumber}
                            onChange={(e) =>
                              setEntry((p) => ({ ...p, batchNumber: e.target.value }))
                            }
                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg bg-white"
                            placeholder="Enter batch number"
                          />
                        </div>
                      )}
                    </div>
                    {errors.productName && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        {errors.productName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md"
                    >
                      <Plus className="h-5 w-5" />
                      Add to List
                    </button>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="mt-6 overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-lg">
                        <table className="min-w-[900px] w-full divide-y divide-slate-200">
                          <thead className="bg-linear-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
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
                                Current Stock
                              </th>
                              {isBatchEnabled && (
                                <th
                                  scope="col"
                                  className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                                >
                                  Batch
                                </th>
                              )}
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Qty
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Unit Price
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                MRP
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                                title="Per unit discount when enabled"
                              >
                                Discount
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Total
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {items.map((it, idx) => {
                              const Discount =
                                (Number(it.discount) || 0) *
                                (Number(it.quantity) || 0);
                              const Total =
                                (Number(it.unitPrice) || 0) *
                                (Number(it.quantity) || 0);
                              const rowTotal = Total - Discount;
                              return (
                                <tr
                                  key={it.id}
                                  className="hover:bg-slate-50/60 transition-colors duration-150"
                                >
                                  <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                                    {idx + 1}
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900">
                                    {it.name}
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 text-left whitespace-nowrap">
                                    {it.currentStock}
                                  </td>
                                  {isBatchEnabled && (
                                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 text-left whitespace-nowrap">
                                      <input
                                        type="text"
                                        value={it.batchNumber || ""}
                                        onChange={(e) =>
                                          updateItemField(it.id, "batchNumber", e.target.value)
                                        }
                                        className="w-36 px-2 py-1 border-2 border-slate-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-200 bg-white"
                                      />
                                    </td>
                                  )}
                                  <td className="px-4 sm:px-6 py-4 text-left whitespace-nowrap">
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
                                      className="w-20 px-3 py-2 border-2 border-slate-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-200 bg-white"
                                    />
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-left whitespace-nowrap">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={it.unitPrice}
                                      onChange={(e) =>
                                        updateItemField(
                                          it.id,
                                          "unitPrice",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      aria-label={`Unit price for ${it.name}`}
                                      className="w-28 px-3 py-2 border-2 border-slate-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-200 bg-white"
                                    />
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-left whitespace-nowrap">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={it.mrp}
                                      onChange={(e) =>
                                        updateItemField(
                                          it.id,
                                          "mrp",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      aria-label={`MRP for ${it.name}`}
                                      className="w-28 px-3 py-2 border-2 border-slate-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-200 bg-white"
                                    />
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-left whitespace-nowrap">
                                    <input
                                      type="number"
                                      className="w-24 px-3 py-2 border-2 border-slate-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-200 bg-white"
                                    />
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900 text-left whitespace-nowrap">
                                    {formatLKR(rowTotal)}
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-left whitespace-nowrap">
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
                {errors.submit && (
                  <p className="text-red-600 text-sm font-semibold sm:mr-auto">
                    {errors.submit}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={
                    isSubmitting || loading.centers || loading.suppliers
                  }
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating Purchase Return...
                    </>
                  ) : (
                    <>
                      {(loading.centers || loading.suppliers) && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      )}
                      {!loading.centers && !loading.suppliers && (
                        <Plus className="h-5 w-5" />
                      )}
                      {loading.centers || loading.suppliers
                        ? "Loading..."
                        : "Create Purchase Return"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <InventoryPopup
          isOpen={isGrnModalOpen}
          title="Select GRN"
          subtitle={`${formData.supplier || "Supplier"} • ${
            formData.center || "Center"
          }`}
          onClose={() => {
            if (!isGrnLoading) {
              setIsGrnModalOpen(false);
            }
          }}
          closeOnOverlay={!isGrnLoading}
        >
          <div className="space-y-4">
            {isGrnLoading ? (
              <div className="flex items-center justify-center gap-3 text-slate-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                Loading GRNs…
              </div>
            ) : grnOptions.length ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {grnOptions.map((grn, idx) => {
                  const grnNumber =
                    grn.grnNumber ??
                    grn.voucherNumber ??
                    grn.id ??
                    `GRN-${idx + 1}`;
                  const total = Number(
                    grn.totalAmount ?? grn.total ?? grn.amount ?? 0
                  );
                  const date = grn.date ?? grn.createdAt ?? grn.created_at ?? "";
                  const itemsCount = Array.isArray(grn.items)
                    ? grn.items.length
                    : Array.isArray(grn.grnItems)
                    ? grn.grnItems.length
                    : 0;
                  return (
                    <button
                      type="button"
                      key={grnNumber || `grn-${idx}`}
                      onClick={() => applyGrnToReturn(grn)}
                      className="w-full text-left border-2 border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-xs text-slate-500">GRN Number</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {grnNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Items</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {itemsCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Total</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {formatLKR(total)}
                          </p>
                        </div>
                        {date && (
                          <div>
                            <p className="text-xs text-slate-500">Date</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {date}
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-600 text-center py-4">
                {grnError || "No GRNs available for this supplier."}
              </p>
            )}
            {grnError && grnOptions.length > 0 && (
              <p className="text-sm text-red-600 text-center">{grnError}</p>
            )}
          </div>
        </InventoryPopup>

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
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Success!
                </h3>
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
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Processing...
                </h3>
                <p className="text-slate-600">
                  Please wait while we create your purchase return.
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <section aria-label="Create new purchase return">
          <InlineNewInvoiceForm
            nextPrtId={nextPrtId}
            onPurchaseReturnCreated={handlePurchaseReturnCreated}
          />
        </section>
      </div>
    </div>
  );
};

export default Invoices;
