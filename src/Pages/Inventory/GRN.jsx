import React, {useCallback,useEffect,useMemo,useRef,useState} from "react";
import { Plus, Trash2, CheckCircle, X } from "lucide-react";
import {createGRN,getNextGrn,fetchPurchaseOrders,} from "../../services/Inventory/inventoryService";
import { fetchCenters as fetchCentersService } from "../../services/Inventory/centerService";
import { getAll as fetchProductsService } from "../../services/Inventory/productListService";
import SupplierService from "../../services/Account/SupplierService";
import { useAuth } from "../../contexts/AuthContext";
import ErrorMessage from "../../components/ErrorMessage/ErrorMessage";
import InventoryPopup from "../../components/Inventory/inventoryPopup";
import { SuccessPdfView } from "../../components/Inventory/successPdf";

const incrementGrnCode = (code) => {
  if (!code) return "";
  const match = String(code).match(/^(.*?)(\d+)([^0-9]*)$/);
  if (!match) return String(code);
  const [, prefix, digits, suffix] = match;
  const nextDigits = (parseInt(digits, 10) + 1)
    .toString()
    .padStart(digits.length, "0");
  return `${prefix}${nextDigits}${suffix}`;
};

const GRN = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Display the next GRN fetched from backend
  const [nextGrnId, setNextGrnId] = useState("");
  // Loading flag while fetching next GRN from backend
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  // State for success modal and GRN details for PDF
  const [showSuccess, setShowSuccess] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [recentGrnDetails, setRecentGrnDetails] = useState(null);

  const refreshNextGrn = useCallback(async () => {
    setIsFetchingNext(true);
    try {
      const resp = await getNextGrn();
      const next = resp?.data?.next || "";
      if (next) {
        setNextGrnId(next);
        return next;
      }
      setNextGrnId((prev) => prev || "GRN-0001");
      return next;
    } catch (e) {
      console.warn("Failed to fetch next GRN from server; using fallback.", e);
      setNextGrnId((prev) => (prev ? incrementGrnCode(prev) : "GRN-0001"));
      return null;
    } finally {
      setIsFetchingNext(false);
    }
  }, []);

  // Fetch next GRN from backend on mount
  useEffect(() => {
    refreshNextGrn();
  }, [refreshNextGrn]);

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

  const InlineNewGRNForm = ({
    nextGrnId,
    refreshNextGrn,
    setNextGrnId: updateNextGrnId,
    onSuccess,
  }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
      id: "",
      center: "",
      supplier: "",
      supplierName: "",
      centerName: "",
      customerId: "",
      fromCenter: null,
      toCenter: null,
      date: new Date().toISOString().split("T")[0],
      status: "completed",
      refNumber: "",
      amount: 0,
      productName: "",
      quantity: 0,
    });
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [items, setItems] = useState([]);

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
    const [centers, setCenters] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState({
      centers: false,
      suppliers: false,
      products: false,
    });
    const [isBatchEnabled, setIsBatchEnabled] = useState(false);
    const [purchaseOrderOptions, setPurchaseOrderOptions] = useState([]);
    const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
    const [isPurchaseOrderLoading, setIsPurchaseOrderLoading] = useState(false);
    const [purchaseOrderError, setPurchaseOrderError] = useState("");
    const [purchaseOrderInlineNotice, setPurchaseOrderInlineNotice] =
      useState("");
    const [purchaseOrderContext, setPurchaseOrderContext] = useState({
      supplierName: "",
      centerName: "",
    });
    const pendingPurchaseOrderRef = useRef(null);

    useEffect(() => {
      setFormData((p) => ({ ...p, id: nextGrnId }));
    }, [nextGrnId]);

    // Load data from services (centers, suppliers, products)
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
          console.error("Error fetching centers:", e);
          setCenters([]);
        } finally {
          setLoading((prev) => ({ ...prev, centers: false }));
        }
      };

      const loadSuppliers = async () => {
        try {
          setLoading((prev) => ({ ...prev, suppliers: true }));
          const data = await SupplierService.list();
          const normalized = Array.isArray(data)
            ? data.map((s) => ({
                id:
                  s.id ??
                  s.supplier_id ??
                  s.value ??
                  String(s.name || s.title || s),
                name:
                  s.name ?? s.supplier_name ?? s.title ?? String(s.name || s),
                // Carry through address/contact fields from backend so we can show them under the select
                address1: s.address1 ?? s.address_1 ?? s.addressLine1 ?? s.address_line1 ?? "",
                address2: s.address2 ?? s.address_2 ?? s.addressLine2 ?? s.address_line2 ?? "",
                // Normalize to `telephone` like PurchaseOrder uses
                telephone:
                  s.telephone ??
                  s.phone_number ??
                  s.phoneNumber ??
                  s.phone ??
                  s.mobile ??
                  "",
              }))
            : [];
          setSuppliers(normalized);
        } catch (e) {
          console.error("Error fetching suppliers:", e);
          setSuppliers([]);
        } finally {
          setLoading((prev) => ({ ...prev, suppliers: false }));
        }
      };

      const loadProducts = async () => {
        try {
          setLoading((prev) => ({ ...prev, products: true }));
          const resp = await fetchProductsService();
          const list = Array.isArray(resp)
            ? resp
            : Array.isArray(resp?.data)
            ? resp.data
            : [];
          const normalized = list.map((p) => ({
            id: p.id ?? p.product_id ?? String(p.sku || p.code || p.name),
            name: p.name ?? p.product_name ?? p.title ?? `#${p.id}`,
            sku: p.sku ?? p.code ?? p.product_code ?? "",
            // keep selling/unit price if present, but also capture explicit cost
            unitPrice: Number(
              p.unitPrice ??
                p.price ??
                p.unit_price ??
                p.selling_price ??
                p.cost_price ??
                0
            ),
            costPrice: Number(
              p.costPrice ??
                p.cost_price ??
                p.purchase_price ??
                p.buying_price ??
                p.cost ??
                0
            ),
            mrp: Number(p.mrp ?? p.mrp_price ?? p.retail_price ?? p.price ?? 0),
            currentstock: p.currentstock ?? p.stock ?? p.qty ?? 0,
            productDiscount:
              Number(
                p.product_discount ?? p.discount ?? p.discountPerUnit ?? p.discount_per_unit ?? 0
              ) || 0,
          }));
          setProducts(normalized);
        } catch (e) {
          console.error("Error fetching products:", e);
          setProducts([]);
        } finally {
          setLoading((prev) => ({ ...prev, products: false }));
        }
      };

      loadCenters();
      loadSuppliers();
      loadProducts();
    }, []);

    const openPurchaseOrderPicker = useCallback(
      async ({ centerId, centerName, supplierId, supplierName }) => {
        if (!centerId || !supplierId) return;
        setPurchaseOrderContext({ supplierName, centerName });
        setShowPurchaseOrderModal(true);
        setIsPurchaseOrderLoading(true);
        setPurchaseOrderError("");
        setPurchaseOrderOptions([]);
        try {
          const response = await fetchPurchaseOrders({
            params: {
              centerId,
              center_id: centerId,
              center: centerName,
              supplierId,
              supplier_id: supplierId,
              supplier: supplierName,
              supplierName,
            },
          });
          const rawList = response?.data ?? response ?? [];
          const list = Array.isArray(rawList)
            ? rawList
            : Array.isArray(rawList?.rows)
            ? rawList.rows
            : [];
          const centerKey = String(centerId || "")
            .trim()
            .toLowerCase();
          const centerNameKey = String(centerName || "")
            .trim()
            .toLowerCase();
          const supplierKey = String(supplierId || "")
            .trim()
            .toLowerCase();
          const supplierNameKey = String(supplierName || "")
            .trim()
            .toLowerCase();

          let filtered = list;
          let fallbackApplied = false;
          if (centerKey || centerNameKey || supplierKey || supplierNameKey) {
            filtered = list.filter((order) => {
              const orderCenters = [
                order.centerId,
                order.center_id,
                order.center,
                order.centerName,
                order.center_name,
                order?.center?.id,
                order?.center?.name,
              ]
                .map((value) =>
                  String(value ?? "")
                    .trim()
                    .toLowerCase()
                )
                .filter(Boolean);
              const orderSuppliers = [
                order.supplierId,
                order.supplier_id,
                order.supplier,
                order.supplierName,
                order.supplier_name,
                order?.supplier?.id,
                order?.supplier?.name,
              ]
                .map((value) =>
                  String(value ?? "")
                    .trim()
                    .toLowerCase()
                )
                .filter(Boolean);
              const centerCriteria = [centerKey, centerNameKey].filter(Boolean);
              const supplierCriteria = [supplierKey, supplierNameKey].filter(
                Boolean
              );
              const matchesCenter =
                !centerCriteria.length ||
                orderCenters.some((value) => centerCriteria.includes(value));
              const matchesSupplier =
                !supplierCriteria.length ||
                orderSuppliers.some((value) =>
                  supplierCriteria.includes(value)
                );
              return matchesCenter && matchesSupplier;
            });
          }

          if (!filtered.length && list.length) {
            filtered = list;
            fallbackApplied = true;
          }

          setPurchaseOrderOptions(filtered);
          if (!filtered.length) {
            setPurchaseOrderError(
              "No purchase orders found for this supplier at the selected center."
            );
          } else if (fallbackApplied) {
            setPurchaseOrderError(
              "No exact matches; showing all purchase orders so you can pick manually."
            );
          } else {
            setPurchaseOrderError("");
          }
        } catch (error) {
          console.error(
            "Failed to fetch purchase orders for GRN picker",
            error
          );
          setPurchaseOrderOptions([]);
          setPurchaseOrderError(
            "Unable to load purchase orders. Please try again."
          );
        } finally {
          setIsPurchaseOrderLoading(false);
        }
      },
      []
    );

    useEffect(() => {
      if (!formData.center || !pendingPurchaseOrderRef.current) return;
      const context = pendingPurchaseOrderRef.current;
      pendingPurchaseOrderRef.current = null;
      const centerMeta = centers.find(
        (c) => String(c.id) === String(formData.center)
      );
      openPurchaseOrderPicker({
        centerId: formData.center,
        centerName: centerMeta?.name || "",
        supplierId: context.supplierId,
        supplierName: context.supplierName,
      }).catch(() => {});
    }, [formData.center, centers, openPurchaseOrderPicker]);

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

    const { totalAmount, discountTotal } = useMemo(() => {
      let totalAcc = 0;
      let discAcc = 0;
      for (const it of items) {
        const qty = Number(it.quantity) || 0;
        const unit = Number(it.unitPrice) || 0;
        const gross = unit * qty;
        // Treat `it.discount` as an absolute line discount amount (not per-unit)
        const lineDiscount = Number(it.discount) || 0;
        discAcc += lineDiscount;
        totalAcc += Math.max(0, gross - lineDiscount);
      }
      return { totalAmount: totalAcc, discountTotal: discAcc };
    }, [items]);

    useEffect(() => {
      setFormData((p) => ({ ...p, amount: totalAmount }));
    }, [totalAmount]);

    const validateForm = () => {
      const e = {};
      if (!formData.id) e.id = "GRN number not generated";
      if (!String(formData.center).trim()) e.center = "Center is required";
      if (!formData.date) e.date = "Date is required";
      if (!String(formData.supplier).trim())
        e.supplier = "Supplier is required";
      if ((items?.length || 0) === 0) e.items = "Add at least one item";
      setErrors(e);
      return Object.keys(e).length === 0;
    };

    // enable below code for batch vice GRN

    const handleBatchModeChange = (checked) => {
      setIsBatchEnabled(checked);
      setEntry((prev) => ({ ...prev, batchNumber: "" }));
      setErrors((prev) => ({ ...prev, batchNumber: undefined }));
      if (items.length > 0) {
        setItems([]);
      }
    };

    const handleCenterChange = (selectedId) => {
      const selected = centers.find((c) => String(c.id) === String(selectedId));
      setFormData((prev) => ({
        ...prev,
        center: selectedId,
        fromCenter: null,
        toCenter: null,
        centerName: selected?.name || "",
      }));
      setPurchaseOrderInlineNotice("");
      if (!selectedId) {
        pendingPurchaseOrderRef.current = null;
        return;
      }
      if (formData.supplier) {
        pendingPurchaseOrderRef.current = {
          supplierId: formData.supplier,
          supplierName: formData.supplierName,
        };
      }
    };

    const handleSupplierChange = (selectedId) => {
      const selected = suppliers.find(
        (s) => String(s.id) === String(selectedId)
      );
      const supplierName = selected?.name || "";
      setFormData((prev) => ({
        ...prev,
        supplier: selectedId,
        supplierName,
      }));
      setPurchaseOrderInlineNotice("");
      setPurchaseOrderOptions([]);
      setPurchaseOrderError("");
      if (!selectedId) {
        pendingPurchaseOrderRef.current = null;
        setShowPurchaseOrderModal(false);
        return;
      }
      if (formData.center) {
        pendingPurchaseOrderRef.current = null;
        const centerMeta = centers.find(
          (c) => String(c.id) === String(formData.center)
        );
        openPurchaseOrderPicker({
          centerId: formData.center,
          centerName: centerMeta?.name || "",
          supplierId: selectedId,
          supplierName,
        }).catch(() => {});
      } else {
        pendingPurchaseOrderRef.current = {
          supplierId: selectedId,
          supplierName,
        };
        setPurchaseOrderInlineNotice(
          "Select a center to view matching purchase orders."
        );
      }
    };

    const resolveOrderUnitPrice = (orderItem, qty) => {
      const numeric = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
      };
      const qtySafe = qty && qty > 0 ? qty : 1;
      const aggregateSources = [
        orderItem.total,
        orderItem.lineTotal,
        orderItem.line_total,
        orderItem.subtotal,
        orderItem.amount,
        orderItem.grossAmount,
        orderItem.gross_amount,
      ];
      for (const aggregate of aggregateSources) {
        const num = numeric(aggregate);
        if (num != null && num > 0) {
          return num / qtySafe;
        }
      }
      return 0;
    };

    const applyPurchaseOrderToGrn = (order) => {
      if (!order) return;
      const sourceItems = Array.isArray(order.items)
        ? order.items
        : Array.isArray(order.orderItems)
        ? order.orderItems
        : [];
      if (!sourceItems.length) {
        setPurchaseOrderError(
          "Selected purchase order does not contain any items."
        );
        return;
      }
      const baseId = Date.now();
      const mappedItems = sourceItems
        .map((item, idx) => {
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
          if (!qty) return null;
          const explicitCost = Number(
            item.cost ??
              item.cost_price ??
              item.purchase_price ??
              item.unit_price ??
              item.unitPrice ??
              item.price ??
              0
          );
          const unitPrice = Math.max(
            0,
            explicitCost > 0 ? explicitCost : resolveOrderUnitPrice(item, qty)
          );
          const discountValue =
            Number(
              item.discountPerUnit ?? item.discount ?? item.discountAmount ?? 0
            ) || 0;
          const resolvedName = item.product?.name ?? `Item ${idx + 1}`;
          const productId =
            item.productId ?? item.product_id ?? item.id ?? null;
          const batchNumberRaw = item.batchNumber ?? item.batch_number ?? null;
          return {
            rowId: `${baseId}-${idx}`,
            productId: productId ?? "",
            name: resolvedName,
            productName: resolvedName,
            quantity: qty,
            unitPrice: Math.max(0, unitPrice),
            discount: Math.max(0, Number(discountValue)),
            product_discount: Number(
              item.product?.product_discount ?? item.product_discount ?? item.product?.discount ?? 0
            ) || 0,
            mrp: Number(item.mrp ?? item.maximumRetailPrice ?? 0),
            currentStock: Number(
              item.currentStock ?? item.current_stock ?? item.stock ?? 0
            ),
            batchNumber: batchNumberRaw ? String(batchNumberRaw) : null,
          };
        })
        .filter(Boolean);

      if (!mappedItems.length) {
        setPurchaseOrderError(
          "Selected purchase order does not contain any valid items."
        );
        return;
      }

      setItems(mappedItems);
      setIsBatchEnabled(
        (prev) => prev || mappedItems.some((row) => !!row.batchNumber)
      );
      setEntry({
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
        batchNumber: "",
        productDiscount: 0,
      });
      setErrors((prev) => ({ ...prev, items: undefined }));
      setSubmitError("");
      setPurchaseOrderError("");
      setShowPurchaseOrderModal(false);
      setFormData((prev) => ({
        ...prev,
        refNumber:
          order.refNumber ??
          order.orderNumber ??
          order.voucherNumber ??
          prev.refNumber,
      }));
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
        ? Number(selected.costPrice) || Number(selected.unitPrice) || 0
        : Number(entry.unitPrice) || 0;
      const productDiscount = selected
        ? Number(selected.productDiscount || 0)
        : Number(entry.productDiscount || 0) || 0;
      if (!name) {
        setErrors((prev) => ({
          ...prev,
          productName: "Product name is required",
        }));
        return;
      }
      if (isBatchEnabled && !String(entry.batchNumber || "").trim()) {
        setErrors((prev) => ({
          ...prev,
          batchNumber: "Batch number is required",
        }));
        return;
      }
      const productId = selected ? selected.id : entry.productId;
      if (!isBatchEnabled) {
        const duplicateRow = items.find((it) => {
          if (productId) {
            return String(it.productId) === String(productId);
          }
          return (it.name || "").toLowerCase() === name.toLowerCase();
        });
        if (duplicateRow) {
          setItems((prev) =>
            prev.map((it) => {
              const matches = productId
                ? String(it.productId) === String(productId)
                : (it.name || "").toLowerCase() === name.toLowerCase();
              if (!matches) return it;
              const existingQty = Number(it.quantity) || 0;
              return {
                ...it,
                quantity: existingQty + qty,
                unitPrice: Math.max(0, unitPrice),
              };
            })
          );
          setEntry({
            productId: "",
            productName: "",
            quantity: 1,
            unitPrice: 0,
            batchNumber: "",
          });
          setShowSuggestions(false);
          setActiveIndex(-1);
          setErrors((prev) => ({ ...prev, productName: undefined }));
          setSubmitError("");
          return;
        }
      }
      const newItem = {
        rowId: Date.now() + Math.floor(Math.random() * 1000),
        productId: productId ?? "",
        name,
        quantity: qty,
        unitPrice: Math.max(0, unitPrice),
        discount: 0,
        product_discount: productDiscount,
        mrp: selected ? Number(selected.mrp) || 0 : 0,
        currentStock: selected ? selected.currentstock || 0 : 0,
        batchNumber: isBatchEnabled
          ? String(entry.batchNumber || "").trim()
          : null,
      };
      setItems((prev) => [...prev, newItem]);
      setEntry({
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
        batchNumber: "",
        productDiscount: 0,
      });
      setShowSuggestions(false);
      setActiveIndex(-1);
      setErrors((prev) => ({
        ...prev,
        productName: undefined,
        batchNumber: undefined,
      }));
      setSubmitError("");
    };

    const updateItemField = (rowId, field, value) => {
      setItems((prev) =>
        prev.map((it) => (it.rowId === rowId ? { ...it, [field]: value } : it))
      );
      setSubmitError("");
    };

    const deleteItem = (rowId) => {
      setItems((prev) => prev.filter((it) => it.rowId !== rowId));
      setSubmitError("");
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitError("");
      if (!validateForm()) return;

      // Use computed totalAmount (sum of line gross - line discount) as the GRN amount
      const computedAmount = totalAmount;

      const itemsForPayload = items.map((item, index) => {
        const { rowId: _ROW_ID, id: legacyId, ...itemWithoutRowId } = item;
        let resolvedProductId = itemWithoutRowId.productId ?? legacyId ?? null;
        if (resolvedProductId === "") {
          resolvedProductId = null;
        }
        const numericProductId =
          resolvedProductId != null ? Number(resolvedProductId) : null;
        const finalProductId =
          resolvedProductId != null && !Number.isNaN(numericProductId)
            ? numericProductId
            : resolvedProductId;
        const quantity = Number(itemWithoutRowId.quantity) || 0;
        const unitPrice = Number(itemWithoutRowId.unitPrice) || 0;
        // `discount` is treated as an absolute per-line discount amount
        const discount = Number(itemWithoutRowId.discount) || 0;
        const mrp = Number(itemWithoutRowId.mrp) || 0;
        const lineGross = unitPrice * quantity;
        const lineDiscount = Math.max(0, discount); // absolute line discount (not multiplied by qty)
        const normalizedProductDiscount = lineDiscount || Number(itemWithoutRowId.product_discount) || 0;
        const lineDiscountAmount = lineDiscount;
        const lineNet = Math.max(0, lineGross - lineDiscount);
        const batchNumber = itemWithoutRowId.batchNumber
          ? String(itemWithoutRowId.batchNumber).trim()
          : null;

        return {
          ...itemWithoutRowId,
          product_discount: normalizedProductDiscount,
          id: finalProductId,
          productId: finalProductId,
          product_id: finalProductId,
          productName: itemWithoutRowId.name,
          product_name: itemWithoutRowId.name,
          quantity,
          unitPrice,
          unit_price: unitPrice,
          discount,
          mrp,
          batchNumber,
          batch_number: batchNumber,
          lineNumber: index + 1,
          line_number: index + 1,
          total: lineNet,
          line_total: lineNet,
            line_discount: lineDiscount,
            lineDiscountAmount: lineDiscountAmount,
            line_discount_amount: lineDiscountAmount,
        };
      });

      const {
        productName: _legacyProductName,
        quantity: _legacyQuantity,
        ...formWithoutLegacyFields
      } = formData;

      const grnData = {
        ...formWithoutLegacyFields,
        amount: computedAmount || formData.amount,
        items: itemsForPayload,
        batchTrackingEnabled: isBatchEnabled,
        batch_tracking_enabled: isBatchEnabled,
        totalDiscount: discountTotal,
        total_discount: discountTotal,
        discountTotal,
        discount_total: discountTotal,
      };

      setIsSubmitting(true);
      try {
        const centerId = grnData.center_id ?? grnData.center ?? "";
        const supplierId = grnData.supplier_id ?? grnData.supplier ?? "";
        const customerId = grnData.customer_id ?? grnData.customerId ?? "";
        const fromCenter = grnData.from_center ?? grnData.fromCenter ?? null;
        const toCenter = grnData.to_center ?? grnData.toCenter ?? null;
        const inventoryStockPayload = itemsForPayload.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          batch_number: item.batch_number ?? null,
          center_id: centerId,
        }));

        const dataToSend = {
          // Send both id and voucherNumber (backend accepts either) and add created_by fallback
          ...grnData,
          voucherNumber: grnData?.id,
          center_id: centerId,
          supplier_id: supplierId,
          customer_id: customerId,
          from_center: fromCenter ?? null,
          to_center: toCenter ?? null,
          created_by: user?.id ?? undefined,
          inventoryStocks: inventoryStockPayload,
          inventory_stocks: inventoryStockPayload,
        };
        console.log("Data to be sent to backend:", dataToSend);
        const apiResp = await createGRN(dataToSend);
        const saved = apiResp?.data ?? apiResp;
        const voucher = saved?.voucherNumber || grnData?.id;
        const optimisticNext = incrementGrnCode(
          voucher || grnData?.id || nextGrnId
        );
        if (optimisticNext && typeof updateNextGrnId === "function") {
          updateNextGrnId(optimisticNext);
        }
        if (typeof refreshNextGrn === "function") {
          try {
            await refreshNextGrn();
          } catch {
            // already applied optimistic update; ignore refresh failure
          }
        }
        setErrors({});
        
        // Create GRN snapshot for PDF generation BEFORE clearing form
        const itemsSnapshot = itemsForPayload.map((item) => {
          const qty = Number(item.quantity || 0);
          const unitPrice = Number(item.unitPrice || 0);
          const discountAmount = Number(item.lineDiscountAmount || 0);
          return {
            ...item,
            quantity: qty,
            unitPrice,
            lineDiscountAmount: discountAmount,
            lineNet: Number(
              item.line_total ?? Math.max(0, qty * unitPrice - discountAmount)
            ),
          };
        });

        const selectedSupplier = suppliers.find(
          (s) => String(s.id) === String(formData.supplier)
        );
        const selectedCenter = centers.find(
          (c) => String(c.id) === String(formData.center)
        );

        const grnSnapshot = {
          orderNumber: voucher,
          orderDate: formData.date,
          center: selectedCenter?.name || formData.centerName || formData.center,
          supplier: selectedSupplier?.name || formData.supplierName || formData.supplier,
          supplierName: selectedSupplier?.name || formData.supplierName || formData.supplier,
          supplierAddress: [selectedSupplier?.address1, selectedSupplier?.address2].filter(Boolean).join(", ") || selectedSupplier?.address || "",
          supplierPhone: selectedSupplier?.telephone || selectedSupplier?.phone || "",
          refNumber: formData.refNumber,
          status: "Completed",
          items: itemsSnapshot,
          discountTotal,
          totalAmount: computedAmount,
          documentType: "GRN",
          currencyFormat: (value) => formatLKR(value),
        };

        // Now clear the form
        setFormData({
          id: "",
          center: "",
          centerName: "",
          supplier: "",
          supplierName: "",
          customerId: "",
          fromCenter: null,
          toCenter: null,
          date: new Date().toISOString().split("T")[0],
          status: "completed",
          refNumber: "",
          amount: 0,
          productName: "",
          quantity: 0,
        });
        
        // Clear items
        setItems([]);

        // Trigger parent success handler with GRN details
        if (typeof onSuccess === "function") {
          onSuccess({
            grnSnapshot,
            successText: `GRN ${voucher} has been created successfully!`,
          });
        }

        try {
          const freshCenters = await fetchCentersService();
          const normalized = Array.isArray(freshCenters)
            ? freshCenters.map((c) => ({
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
          // non-fatal: log and continue
          console.warn("refresh centers failed", e);
        }
        setSubmitError("");
      } catch (error) {
        console.error("Error creating GRN:", error);
        const status = error?.response?.status;
        const data = error?.response?.data;

        const collectMissingIds = (payload) => {
          if (!payload) return [];
          if (Array.isArray(payload))
            return payload.filter(Boolean).map(String);
          if (typeof payload === "object") {
            return Object.values(payload).flat().filter(Boolean).map(String);
          }
          return String(payload)
            .split(/[,\s]+/)
            .map((val) => val.trim())
            .filter(Boolean);
        };

        let message = "Failed to create GRN. Please try again.";
        if (status === 422) {
          const missingCandidates = [
            data?.missing_ids,
            data?.missingIds,
            data?.missing_products,
            data?.missingProducts,
            data?.errors?.missing_ids,
            data?.errors?.missingIds,
          ];

          const missingIds = missingCandidates
            .map(collectMissingIds)
            .reduce((acc, arr) => acc.concat(arr), [])
            .filter((value, index, self) => self.indexOf(value) === index);

          if (missingIds.length > 0) {
            message = `Please verify each item uses a valid product id (products.id). Missing ids: ${missingIds.join(
              ", "
            )}.`;
          } else if (typeof data?.message === "string" && data.message.trim()) {
            message = data.message.trim();
          } else if (data?.errors) {
            if (Array.isArray(data.errors)) {
              message = data.errors.filter(Boolean).join(" ");
            } else if (typeof data.errors === "object") {
              message = Object.values(data.errors)
                .flat()
                .filter(Boolean)
                .join(" ");
            }
          }
        } else if (typeof data?.message === "string" && data.message.trim()) {
          message = data.message.trim();
        }

        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    };

    const selectedSupplier = suppliers.find(
      (s) => String(s.id) === String(formData.supplier)
    );

    return (
      <>
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="uppercase text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Goods Received Note (GRN)
              </h1>
              <div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">
                GRN Number:{" "}
                {isFetchingNext ? "Loading…" : nextGrnId || "Unavailable"}
              </div>
              <p className="text-slate-600 text-sm sm:text-base">
                Manage and track your goods received notes efficiently
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">
            Create New GRN
          </h3>
          {submitError && <ErrorMessage message={submitError} />}
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
                    disabled
                    title="GRN date is auto-set and cannot be changed"
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? "date-error" : undefined}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.date
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    } opacity-90 cursor-not-allowed`}
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
                    Center *
                  </label>
                  <select
                    value={formData.center}
                    onChange={(e) => handleCenterChange(e.target.value)}
                    disabled={loading.centers}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.center
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    } ${
                      loading.centers ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">
                      {loading.centers ? "Loading centers…" : "Select a center"}
                    </option>
                    {!loading.centers &&
                      centers.map((c) => (
                        <option key={c.id} value={c.id}>
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
                    Supplier Name *
                  </label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    disabled={loading.suppliers}
                    aria-invalid={!!errors.supplier}
                    aria-describedby={
                      errors.supplier ? "supplier-error" : undefined
                    }
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.supplier
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    } ${
                      loading.suppliers ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">
                      {loading.suppliers
                        ? "Loading suppliers…"
                        : "Select supplier"}
                    </option>
                    {!loading.suppliers &&
                      suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
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
                    {purchaseOrderInlineNotice && !errors.supplier && (
                      <p className="text-amber-600 text-xs mt-2 font-semibold">
                        {purchaseOrderInlineNotice}
                      </p>
                    )}
                    {/** Show supplier address and contact under select like Purchase Order */}
                    {selectedSupplier && (
                      <div className="mt-2 text-sm text-slate-600 space-y-1" aria-live="polite">
                        {/* Address lines */}
                        {selectedSupplier.address1 && (
                          <p className="leading-snug">{selectedSupplier.address1}</p>
                        )}
                        {selectedSupplier.address2 && (
                          <p className="leading-snug">{selectedSupplier.address2}</p>
                        )}
                        {!selectedSupplier.address1 && !selectedSupplier.address2 && (
                          <p className="leading-snug">
                            {selectedSupplier.address ||
                              selectedSupplier.supplierAddress ||
                              selectedSupplier.supplier_address ||
                              selectedSupplier.addressLine1 ||
                              selectedSupplier.address_line1 ||
                              "Address not available"}
                          </p>
                        )}
                        {/* Contact number */}
                        <p className="leading-snug">
                          Contact: {selectedSupplier.telephone ||
                            selectedSupplier.phone_number ||
                            selectedSupplier.phone ||
                            selectedSupplier.mobile ||
                            selectedSupplier.contact ||
                            selectedSupplier.contactNumber ||
                            selectedSupplier.contact_number ||
                            "—"}
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* Customer Details removed as requested */}

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

                <div className="lg:place-self-end text-center bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200">
                  <p className="text-slate-600 font-medium mb-2">
                    Total Amount
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                    {formatLKR(totalAmount)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Total Discount: <span className="text-sm font-medium text-slate-700">{formatLKR(discountTotal)}</span>
                  </p>
                </div>
              </div>

              {/* enable below code for batch vice GRN  */}

              <div className="mb-6 sm:mb-8">
                <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6">
                  Product Details
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                      checked={isBatchEnabled}
                      onChange={(e) => handleBatchModeChange(e.target.checked)}
                    />
                    Enable batch numbers per item
                  </label>
                  <p className="text-xs text-slate-500">
                    {isBatchEnabled
                      ? "Each line requires a batch number and will be stored separately."
                      : "Quantities aggregate by product and update a single stock row."}
                  </p>
                </div>
                <div
                  className={`grid grid-cols-1 gap-6 ${
                    isBatchEnabled ? "sm:grid-cols-5" : "sm:grid-cols-4"
                  }`}
                >
                  <div
                    className={
                      isBatchEnabled ? "sm:col-span-3" : "sm:col-span-3"
                    }
                  >
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
                            const defaultUnit =
                              typeof p.costPrice === "number" &&
                              !Number.isNaN(p.costPrice) &&
                              p.costPrice > 0
                                ? Number(p.costPrice)
                                : Number(p.unitPrice) || 0;
                            setEntry({
                              productId: p.id,
                              productName: p.name,
                              quantity: 1,
                              unitPrice: defaultUnit,
                              batchNumber: "",
                              productDiscount: Number(p.productDiscount || 0),
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
                            productDiscount: 0,
                          }));
                          setShowSuggestions(true);
                          setActiveIndex(-1);
                        }}
                        onBlur={() => {
                          // Delay hiding to allow click selection
                          setTimeout(() => setShowSuggestions(false), 150);
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-slate-400 ${
                          errors.productName ? "border-red-500" : "border-slate-300"
                        }`}
                        placeholder={
                          !formData.center
                            ? "Select a center first"
                            : loading.products
                            ? "Loading products…"
                            : "Type to search product (name or SKU)"
                        }
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
                                className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors duration-150 ${
                                  idx === activeIndex
                                    ? "bg-blue-50 border-l-4 border-blue-500"
                                    : "hover:bg-slate-50"
                                }`}
                                onMouseEnter={() => setActiveIndex(idx)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  const defaultUnit =
                                    typeof p.costPrice === "number" &&
                                    !Number.isNaN(p.costPrice) &&
                                    p.costPrice > 0
                                      ? Number(p.costPrice)
                                      : Number(p.unitPrice) || 0;
                                  setEntry({
                                    productId: p.id,
                                    productName: p.name,
                                    quantity: 1,
                                    unitPrice: defaultUnit,
                                    batchNumber: "",
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
                                <span className="ml-auto text-xs text-slate-600 font-medium">
                                  Cost LKR {Number(p.costPrice || 0).toFixed(2)}{" "}
                                  • MRP LKR {Number(p.mrp || 0).toFixed(2)}
                                  {typeof p.currentstock !== "undefined"
                                    ? ` • Stock ${p.currentstock}`
                                    : ""}
                                </span>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                    {errors.productName && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        {errors.productName}
                      </p>
                    )}
                  </div>

                  {/*enable below code for batch vice GRN  */}

                  {isBatchEnabled && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Batch Number *
                      </label>
                      <input
                        type="text"
                        value={entry.batchNumber}
                        onChange={(e) =>
                          setEntry((prev) => ({
                            ...prev,
                            batchNumber: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.batchNumber
                            ? "border-red-300 bg-red-50"
                            : "border-slate-300 bg-white hover:border-slate-400"
                        }`}
                        placeholder="Enter batch number"
                      />
                      {errors.batchNumber && (
                        <p className="text-red-500 text-sm mt-2 font-medium">
                          {errors.batchNumber}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex items-end sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!formData.center || loading.products}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <table className="min-w-[1100px] w-full divide-y divide-slate-200">
                          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
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
                                className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Current Stock
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Qty
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
                                MRP
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider"
                                title="Per unit discount (optional)"
                              >
                                Discount
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Total
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {items.map((it, idx) => {
                              const qty = Number(it.quantity) || 0;
                              const unit = Number(it.unitPrice) || 0;
                              const gross = unit * qty;
                              // treat `it.discount` as an absolute line discount amount
                              const lineDiscount = Number(it.discount) || 0;
                              const rowTotal = Math.max(0, gross - lineDiscount);
                              return (
                                <tr
                                  key={it.rowId}
                                  className="hover:bg-slate-50/60 transition-colors duration-150"
                                >
                                  <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                                    {idx + 1}
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900">
                                    {it.name}
                                  </td>
                                  {isBatchEnabled && (
                                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                                      <input
                                        type="text"
                                        value={it.batchNumber || ""}
                                        onChange={(e) =>
                                          updateItemField(
                                            it.rowId,
                                            "batchNumber",
                                            e.target.value
                                          )
                                        }
                                        aria-label={`Batch number for ${it.name}`}
                                        className="w-32 px-3 py-2 border-2 border-slate-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all duration-200 bg-white"
                                        placeholder="Batch"
                                      />
                                    </td>
                                  )}
                                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 text-right whitespace-nowrap">
                                    {it.currentStock}
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                    <input
                                      type="number"
                                      min="1"
                                      value={it.quantity}
                                      onChange={(e) =>
                                        updateItemField(
                                          it.rowId,
                                          "quantity",
                                          parseInt(e.target.value) || 0
                                        )
                                      }
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
                                      onChange={(e) =>
                                        updateItemField(
                                          it.rowId,
                                          "unitPrice",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
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
                                      onChange={(e) =>
                                        updateItemField(
                                          it.rowId,
                                          "mrp",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
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
                                      onChange={(e) =>
                                        updateItemField(
                                          it.rowId,
                                          "discount",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      aria-label={`Per-unit discount for ${it.name}`}
                                      className="w-24 px-3 py-2 border-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 border-slate-300 bg-white hover:border-slate-400"
                                    />
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                                    {formatLKR(rowTotal)}
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => deleteItem(it.rowId)}
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
                  disabled={
                    isSubmitting ||
                    loading.centers ||
                    loading.suppliers ||
                    loading.products
                  }
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating GRN...
                    </>
                  ) : loading.centers ||
                    loading.suppliers ||
                    loading.products ? (
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

        <InventoryPopup
          isOpen={showPurchaseOrderModal}
          title="Link Purchase Order"
          subtitle={`${purchaseOrderContext.supplierName || "Supplier"} • ${
            purchaseOrderContext.centerName || "Center"
          }`}
          onClose={() => {
            if (!isPurchaseOrderLoading) {
              setShowPurchaseOrderModal(false);
            }
          }}
          closeOnOverlay={!isPurchaseOrderLoading}
        >
          <div className="space-y-4">
            {isPurchaseOrderLoading ? (
              <div className="flex items-center justify-center gap-3 text-slate-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                Loading purchase orders…
              </div>
            ) : purchaseOrderOptions.length ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {purchaseOrderOptions.map((order, idx) => {
                  const orderNumber =
                    order.orderNumber ??
                    order.voucherNumber ??
                    order.poNumber ??
                    order.id ??
                    `PO-${idx + 1}`;
                  const total = Number(
                    order.totalAmount ??
                      order.total ??
                      order.subtotal ??
                      order.amount ??
                      0
                  );
                  const statusLabel = order.status ?? "-";
                  const date =
                    order.date ?? order.createdAt ?? order.created_at ?? "";
                  const itemsCount = Array.isArray(order.items)
                    ? order.items.length
                    : Array.isArray(order.orderItems)
                    ? order.orderItems.length
                    : 0;
                  return (
                    <button
                      type="button"
                      key={orderNumber || `po-${idx}`}
                      onClick={() => applyPurchaseOrderToGrn(order)}
                      className="w-full text-left border-2 border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-xs text-slate-500">PO Number</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {orderNumber}
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
                        <div>
                          <p className="text-xs text-slate-500">Status</p>
                          <p className="text-sm font-semibold text-slate-800 capitalize">
                            {statusLabel}
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
                {purchaseOrderError ||
                  "No purchase orders available for this supplier."}
              </p>
            )}
            {purchaseOrderError && purchaseOrderOptions.length > 0 && (
              <p className="text-sm text-red-600 text-center">
                {purchaseOrderError}
              </p>
            )}
          </div>
        </InventoryPopup>

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
                  Please wait while we create your GRN.
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const handleGrnSuccess = ({ grnSnapshot, successText: text }) => {
    setRecentGrnDetails(grnSnapshot);
    setSuccessText(text);
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <section aria-label="Create new GRN">
          <InlineNewGRNForm
            nextGrnId={nextGrnId}
            refreshNextGrn={refreshNextGrn}
            setNextGrnId={setNextGrnId}
            onSuccess={handleGrnSuccess}
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
              Creating GRN…
            </span>
          </div>
        </div>
      )}

      {/* Success Modal with PDF View */}
      {showSuccess && recentGrnDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="GRN created"
        >
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Success</p>
                  <p className="text-sm text-slate-600">{successText || "GRN created successfully."}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSuccess(false);
                  setRecentGrnDetails(null);
                }}
                className="rounded-full p-2 text-slate-500 hover:text-slate-900"
                aria-label="Close GRN summary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5">
              <SuccessPdfView orderData={recentGrnDetails} documentType="GRN" />
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowSuccess(false);
                  setRecentGrnDetails(null);
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

export default GRN;
