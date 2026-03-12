import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, CheckCircle, X } from "lucide-react";
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
import { SuccessPdfView } from "../../components/Inventory/successPdf";

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [recentReturnDetails, setRecentReturnDetails] = useState(null);

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

  const InlineNewInvoiceForm = ({ nextPrtId, onPurchaseReturnCreated, onShowSuccess, setIsSubmitting }) => {
    const [formData, setFormData] = useState({
      id: "",
      center: "",
      supplier: "",
      date: new Date().toISOString().split("T")[0],
      refNumber: "",
      amount: 0,
      productName: "",
      quantity: 0,
    });
    const [errors, setErrors] = useState({});
    const [items, setItems] = useState([]);
    // Payment popup removed; no payment state needed
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
      productDiscount: 0,
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
            address1:
              item.address1 ??
              item.address_1 ??
              item.addressLine1 ??
              item.address_line_1 ??
              "",
            address2:
              item.address2 ??
              item.address_2 ??
              item.addressLine2 ??
              item.address_line_2 ??
              "",
            telephone:
              item.telephone ??
              item.phone_number ??
              item.phone ??
              item.mobile ??
              item.contact ??
              item.contactNumber ??
              item.contact_number ??
              "",
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

    const selectedSupplier = useMemo(() => {
      const value = String(formData.supplier || "").trim();
      if (!value) return null;
      return (
        supplierOptions.find(
          (s) => String(s.id) === value || String(s.name) === value
        ) || null
      );
    }, [formData.supplier, supplierOptions]);

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
        const disc = Number(it.discount) || 0; // discount is a flat line amount
        const lineTotal = unit * qty;
        const lineDiscount = disc; // treat discount as total for the line, not per-unit
        return acc + (lineTotal - lineDiscount);
      }, 0);
    }, [items]);

    const totalDiscount = useMemo(() => {
      return items.reduce((acc, it) => {
        const d = Number(it.discount) || 0;
        return acc + (Number.isFinite(d) ? d : 0);
      }, 0);
    }, [items]);

    const showBatchColumn = useMemo(() => {
      try {
        return (items || []).some(
          (it) => it && (it.batchNumber || "").toString().trim().length > 0
        );
      } catch {
        return false;
      }
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
        item.costPrice,
        item.cost_price,
        item.unitCost,
        item.unit_cost,
        item.purchasePrice,
        item.purchase_price,
        item.rate,
        item.unitRate,
        item.unit_rate,
        item.unitPrice,
        item.unit_price,
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
          // Prefer GRN-provided line totals/discounts to compute accurate unit price and discount
          const grnLineTotal = Number(
            item.line_total ?? item.lineTotal ?? item.total ?? item.totalAmount ?? NaN
          );
          const grnLineDiscount = Number(
            item.line_discount_amount ??
              item.lineDiscountAmount ??
              item.line_discount ??
              item.discountAmount ??
              item.discount ??
              item.product_discount ??
              item.productDiscount ??
              item.total_discount ??
              item.totalDiscount ??
              NaN
          );
          let discount = 0;
          if (!Number.isNaN(grnLineDiscount) && grnLineDiscount >= 0) {
            discount = grnLineDiscount;
          } else {
            const rawPerUnit = Number(item.discountPerUnit ?? NaN);
            if (!Number.isNaN(rawPerUnit) && rawPerUnit > 0) {
              discount = rawPerUnit * qty;
            } else {
              discount = 0;
            }
          }
          const reconstructedUnitFromTotals =
            !Number.isNaN(grnLineTotal) && grnLineTotal >= 0 && qty > 0
              ? Math.max(0, (grnLineTotal + discount) / qty)
              : null;
          
          const directUnitPriceSources = [
            item.cost,
            item.cost_price,
            item.unitCost,
            item.unit_cost,
            item.purchasePrice,
            item.purchase_price,
            item.purchaseRate,
            item.purchase_rate,
            item.rate,
            item.unitRate,
            item.unit_rate,
            item.unitPrice,
            item.unit_price,
            item.price,
            item.product?.purchasePrice,
            item.product?.purchase_price,
            item.product?.purchaseRate,
            item.product?.purchase_rate,
            item.product?.costPrice,
            item.product?.cost_price,
            item.product?.unitCost,
            item.product?.unit_cost,
            item.product?.unitPrice,
            item.product?.unit_price,
            item.product?.rate,
          ];
          const directUnitPrice = directUnitPriceSources
            .map((src) => Number(src))
            .find((val) => Number.isFinite(val) && val >= 0);

          const unitPriceCandidates = [reconstructedUnitFromTotals, directUnitPrice]
            .filter((v) => Number.isFinite(v) && v > 0);

          let unitPrice = unitPriceCandidates.length
            ? Math.max(...unitPriceCandidates)
            : null;

          if (!(Number.isFinite(unitPrice) && unitPrice > 0)) {
            if (reconstructedUnitFromTotals !== null && reconstructedUnitFromTotals > 0) {
              unitPrice = reconstructedUnitFromTotals;
            } else if (!Number.isNaN(grnLineTotal) && grnLineTotal >= 0 && qty > 0) {
              
              unitPrice = Math.max(0, (grnLineTotal + discount) / qty);
            } else {
              unitPrice = Math.max(0, resolveGrnUnitPrice(item, qty));
            }
          }
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
            // Mirror the actual line discount into product_discount for backend consistency
            product_discount: Math.max(0, discount),
            mrp: Number(item.mrp ?? item.maximumRetailPrice ?? 0),
            currentStock: Number(
              item.currentStock ?? item.current_stock ?? item.stock ?? 0
            ),
            batchNumber: batchNumber ? String(batchNumber) : "",
          };
        })
        .filter(Boolean);

      if (!mappedItems.length) {
        setGrnError("Selected GRN does not contain any valid items.");
        return;
      }

      setItems(mappedItems);
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
        product_discount: selected ? Number(selected.productDiscount || 0) : Number(entry.productDiscount || 0),
        mrp: selected ? Number(selected.mrp) || 0 : 0,
        currentStock: selected ? selected.currentstock || 0 : 0,
        batchNumber: "",
      };
      setItems((prev) => [...prev, newItem]);
      setEntry({ productId: "", productName: "", quantity: 1, unitPrice: 0, productDiscount: 0 });
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
        const disc = Number(it.discount) || 0; // flat discount for the line
        const lineTotal = unit * qty;
        const lineDiscount = disc;
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
        const discount = Number(it.discount) || 0; // discount is flat amount for the line
        const lineTotal = qty * unitPrice;
        const netLineTotal = Math.max(0, lineTotal - discount);
        const discountPerUnit = qty > 0 ? discount / qty : 0;
        return {
          ...it,
          product_discount: Number(it.product_discount) || 0,
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
          discount: discount,
          discountPerUnit: discountPerUnit,
          discount_per_unit: discountPerUnit,
          discountAmount: discount,
          batchNumber: it.batchNumber || "",
          batch_number: it.batchNumber || "",
          mrp: Number(it.mrp) || 0,
          currentStock: Number(it.currentStock) || 0,
          current_stock: Number(it.currentStock) || 0,
          lineTotal: netLineTotal,
          total: netLineTotal,
        };
      });

      const totalDiscount = normalizedItems.reduce((acc, it) => {
        const d = Number(it.discountAmount ?? it.discount ?? 0);
        return acc + (Number.isFinite(d) ? d : 0);
      }, 0);

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
        // single canonical total discount field (sum of flat line discounts)
        total_discount: totalDiscount,
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

        // Prepare order details for PDF generation
        const returnDetailsForPdf = {
          orderNumber: createdId || nextPrtId,
          refNumber: payload.refNumber || payload.referenceNumber || "",
          date: payload.returnDate || completedInvoice.date,
          supplier: supplierName,
          supplierName: supplierName,
          // Build supplier address from address1 and address2 like PurchaseOrder
          supplierAddress: [
            supplierMatch?.address1,
            supplierMatch?.address2,
          ].filter(Boolean).join(", ") || supplierMatch?.address || supplierMatch?.supplier_address || "",
          address1: supplierMatch?.address1 || "",
          address2: supplierMatch?.address2 || "",
          supplierPhone: supplierMatch?.telephone || supplierMatch?.phone || supplierMatch?.supplier_phone || "",
          supplierTelephone: supplierMatch?.telephone || "",
          center: centerName,
          centerName: centerName,
          totalAmount: payload.totalAmount || payload.amount || 0,
          discountTotal: totalDiscount,
          discountAmount: totalDiscount,
          status: payload.status,
          items: normalizedItems.map((item, idx) => ({
            id: item.id || idx,
            productName: item.productName || item.name,
            quantity: item.quantity || item.qty || 0,
            unitPrice: item.unitPrice || item.unit_price || 0,
            discount: item.discountAmount || item.discount || 0,
            lineDiscount: item.discountAmount || item.discount || 0,
            lineDiscountAmount: item.discountAmount || item.discount || 0,
            lineTotal: item.lineTotal || item.total || 0,
            lineNet: item.lineTotal || item.total || 0,
            batchNumber: item.batchNumber || "",
          })),
          currencyFormat: (value) => {
            try {
              return new Intl.NumberFormat("en-LK", {
                style: "currency",
                currency: "LKR",
              }).format(Number(value || 0));
            } catch {
              return `LKR ${Number(value || 0).toFixed(2)}`;
            }
          },
          documentType: "Purchase Return",
        };

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
        onShowSuccess?.(successMessage, returnDetailsForPdf);
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
                  {selectedSupplier && (
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedSupplier.address1 && (
                        <span className="block">
                          {selectedSupplier.address1}
                        </span>
                      )}
                      {selectedSupplier.address2 && (
                        <span className="block">
                          {selectedSupplier.address2}
                        </span>
                      )}
                      {selectedSupplier.telephone && (
                        <span className="block">
                          Contact: {selectedSupplier.telephone}
                        </span>
                      )}
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
                  <p className="text-sm text-slate-500 mt-1">
                    Total Discount: <span className="text-sm font-medium text-slate-700">{formatLKR(totalDiscount)}</span>
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
                              // Prefer costPrice; fallback to unitPrice
                              unitPrice:
                                Number(p.costPrice) ||
                                Number(p.cost_price) ||
                                Number(p.unitCost) ||
                                Number(p.unit_cost) ||
                                Number(p.unitPrice) ||
                                0,
                              batchNumber: "",
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
                                  // Prefer costPrice from product, fallback to unitPrice
                                  unitPrice:
                                    Number(p.costPrice) ||
                                    Number(p.cost_price) ||
                                    Number(p.unitCost) ||
                                    Number(p.unit_cost) ||
                                    Number(p.unitPrice) ||
                                    0,
                                  batchNumber: p.batchNumber ?? "",
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
                      {/* batch number entry removed per requirements */}
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
                              const Discount = Number(it.discount) || 0; // flat discount for the entire line
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
                                  {showBatchColumn && (
                                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 text-left whitespace-nowrap">
                                      {it.batchNumber ? (
                                        <span className="text-sm text-slate-800">{it.batchNumber}</span>
                                      ) : (
                                        <span className="text-sm text-slate-400">—</span>
                                      )}
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
                                      min="0"
                                      step="0.01"
                                      value={it.discount}
                                      onChange={(e) =>
                                        updateItemField(
                                          it.id,
                                          "discount",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      aria-label={`Discount for ${it.name}`}
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
      </>
    );
  };

  // Handler to show success modal with return details
  const handleShowSuccess = useCallback((message, returnDetails) => {
    setSuccessText(message);
    setRecentReturnDetails(returnDetails);
    setShowSuccess(true);
  }, []);

  // Handler to close success modal
  const handleCloseSuccess = useCallback(() => {
    setShowSuccess(false);
    setRecentReturnDetails(null);
    setSuccessText("");
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <section aria-label="Create new purchase return">
          <InlineNewInvoiceForm
            nextPrtId={nextPrtId}
            onPurchaseReturnCreated={handlePurchaseReturnCreated}
            onShowSuccess={handleShowSuccess}
            setIsSubmitting={setIsSubmitting}
          />
        </section>
      </div>

      {/* Loading Modal */}
      {isSubmitting && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 flex items-center gap-4 border border-slate-200">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-slate-800 font-medium">
              Creating purchase return…
            </span>
          </div>
        </div>
      )}

      {/* Success Modal with PDF Preview */}
      {showSuccess && recentReturnDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Purchase return created"
        >
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Success</p>
                  <p className="text-sm text-slate-600">{successText || "Purchase return created successfully."}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseSuccess}
                className="rounded-full p-2 text-slate-500 hover:text-slate-900"
                aria-label="Close return summary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5">
              <SuccessPdfView orderData={recentReturnDetails} documentType="Purchase Return" />
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleCloseSuccess}
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

export default Invoices;
