import React, {useState, useEffect,useMemo,useRef,useCallback,} from "react";
import { Plus, Trash2, CheckCircle, X } from "lucide-react";
import { fetchCenters as fetchCentersService } from "../../services/Inventory/centerService";
import { getInventoryDetails as fetchInventoryDetails } from "../../services/Inventory/productListService";
import { getCustomers as fetchCustomersService } from "../../services/Account/CustomerService";
import {createINV,getNextInv,fetchSalesOrders,} from "../../services/Inventory/inventoryService";
import { useAuth } from "../../contexts/AuthContext";
import Payment from "../../components/Inventory/Payment";
import { SuccessPdfView } from "../../components/Inventory/successPdf.jsx";
import InventoryPopup from "../../components/Inventory/inventoryPopup";
import discountLevelService from "../../services/Inventory/discountLevelService";

const LAST_INVOICE_STORAGE_KEY = "inventory_last_invoice_id";

const incrementInvCode = (code) => {
  const match = String(code).match(/^(.*?)(\d+)([^0-9]*)$/);
  if (!match) return String(code);
  const [, prefix, digits, suffix] = match;
  const nextDigits = (parseInt(digits, 10) + 1)
    .toString()
    .padStart(digits.length, "0");
  return `${prefix}${nextDigits}${suffix}`;
};

const resolveOrderDiscountLevelId = (order) => {
  if (!order) return null;
  return (
    order.discountLevelId ??
    order.discountLevel_id ??
    order.discount_level_id ??
    order.discountLevel ??
    order.discount_level ??
    order.discountlevel_id ??
    null
  );
};

const Invoices = () => {
  // Track submit state when posting to backend
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextInvoiceId, setNextInvoiceId] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [recentInvoiceDetails, setRecentInvoiceDetails] = useState(null);
  const lastCreatedInvoiceRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LAST_INVOICE_STORAGE_KEY);
    if (stored) {
      lastCreatedInvoiceRef.current = stored.trim();
    }
  }, []);

  // Fetch next invoice id from backend (preview) instead of computing locally
  const refreshNextInv = useCallback(async () => {
    const applyStoredFallback = () => {
      const storedLast = (lastCreatedInvoiceRef.current || "").trim();
      if (!storedLast) return null;
      const nextFromStored = incrementInvCode(storedLast);
      if (nextFromStored) {
        setNextInvoiceId(nextFromStored);
        return nextFromStored;
      }
      return null;
    };

    try {
      const resp = await getNextInv();
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
          setNextInvoiceId(normalized);
          return normalized;
        }
      }

      // Server indicates there is no "next" invoice yet, so start from INV-YY-0001.
      const year = new Date().getFullYear().toString().slice(-2);
      const fallbackNext = `INV-${year}-0001`;
      setNextInvoiceId(fallbackNext);
      return fallbackNext;
    } catch (e) {
      console.warn(
        "Failed to fetch next Invoice from server; using fallback.",
        e
      );
      const fallbackFromStored = applyStoredFallback();
      if (fallbackFromStored) return fallbackFromStored;

      const year = new Date().getFullYear().toString().slice(-2);
      const fallbackNext = `INV-${year}-0001`;
      setNextInvoiceId((prev) => prev || fallbackNext);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshNextInv();
  }, [refreshNextInv]);

  const formatLKR = (value) => {
    try {
      return new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
      }).format(Number(value || 0));
    } catch {
      // Fallback formatting
      const num = Number(value || 0).toFixed(2);
      return `LKR ${num}`;
    }
  };

  const InlineNewInvoiceForm = ({ nextInvoiceId }) => {
    const [formData, setFormData] = useState({
      id: "",
      center: "",
      customer: "",
      customerEmail: "",
      customerAddress: "",
      customerTelephone: "",
      customerId: "",
      date: new Date().toISOString().split("T")[0],
      status: "",
      refNumber: "",
      amount: 0,
      productName: "",
      quantity: 0,
    });
    const [errors, setErrors] = useState({});
    const [items, setItems] = useState([]);
    // Product entry state for typeahead
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
    const pendingSalesOrderRef = useRef(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingInvoice, setPendingInvoice] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [centers, setCenters] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventoryDetails, setInventoryDetails] = useState([]);
    const [loading, setLoading] = useState({
      customers: false,
      centers: false,
      products: false,
    });
    const [isBatchEnabled, setIsBatchEnabled] = useState(false);
    const [salesOrderOptions, setSalesOrderOptions] = useState([]);
    const [discountLevels, setDiscountLevels] = useState([]);
    const [selectedDiscountLevel, setSelectedDiscountLevel] = useState(null);
    const [pendingOrderDiscountLevelId, setPendingOrderDiscountLevelId] = useState(null);
    const [showSalesOrderModal, setShowSalesOrderModal] = useState(false);
    const [isSalesOrderLoading, setIsSalesOrderLoading] = useState(false);
    const [salesOrderFetchError, setSalesOrderFetchError] = useState("");
    const [salesOrderInlineNotice, setSalesOrderInlineNotice] = useState("");
    const [salesOrderContext, setSalesOrderContext] = useState({
      centerId: "",
      centerName: "",
      customerName: "",
      customerEmail: "",
    });

    // Opens the voucher selection modal filtered by the chosen center + customer
    const openSalesOrderPicker = useCallback(
      async ({ centerId, centerName, customerName, customerEmail, customerId }) => {
        if (!centerId || !(customerName || customerId)) return;
        setSalesOrderContext({
          centerId,
          centerName,
          customerName,
          customerEmail,
        });
        setShowSalesOrderModal(true);
        setIsSalesOrderLoading(true);
        setSalesOrderFetchError("");
        setSalesOrderOptions([]);
        try {
          const response = await fetchSalesOrders({
            params: {
              centerId,
              center_id: centerId,
              customer: customerEmail || customerName,
              customerName,
              customerEmail,
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
          const nameKey = String(customerName || "")
            .trim()
            .toLowerCase();
          const emailKey = String(customerEmail || "")
            .trim()
            .toLowerCase();
          const idCustomerKey = String(customerId || "").trim();

          let filtered = list;
          let fallbackApplied = false;

          const orderStatusValue = (order) => {
            const rawStatus =
              order.status ??
              order.orderStatus ??
              order.order_status ??
              order.state ??
              order.approval_status ??
              order.status?.name ??
              "";
            return String(rawStatus).trim().toLowerCase();
          };

          const isCompletedOrder = (order) => {
            const status = orderStatusValue(order);
            return (
              status === "completed" ||
              status === "complete" ||
              status.includes("complete") ||
              status === "done"
            );
          };

          const isReferenceOrder = (order) => {
            const refFlag =
              order.is_ref ??
              order.isRef ??
              order?.isReference ??
              order?.is_reference ??
              null;
            return String(refFlag ?? "").trim() === "1";
          };

          if (centerKey || centerNameKey || nameKey || emailKey) {
            filtered = list.filter((order) => {
              // Exclude any orders marked as a reference (is_ref === 1)
              if (isReferenceOrder(order)) return false;
              // Only include completed orders
              if (!isCompletedOrder(order)) return false;
              const orderCenters = [
                order.centerId,
                order.center_id,
                order.center,
                order.centerName,
                order.center_name,
                order?.center?.id,
                order?.center?.center_id,
                order?.center?.name,
              ]
                .map((value) =>
                  String(value ?? "")
                    .trim()
                    .toLowerCase()
                )
                .filter(Boolean);

              const orderCustomers = [
                order.customer,
                order.customerName,
                order.customer_name,
                order?.customerDetails?.name,
                order?.customerDetails?.customer_name,
              ]
                .map((value) =>
                  String(value ?? "")
                    .trim()
                    .toLowerCase()
                )
                .filter(Boolean);

              const orderEmails = [
                order.customerEmail,
                order.customer_email,
                order?.customerDetails?.email,
              ]
                .map((value) =>
                  String(value ?? "")
                    .trim()
                    .toLowerCase()
                )
                .filter(Boolean);

              const centerCriteria = [centerKey, centerNameKey].filter(Boolean);
              const customerCriteria = nameKey ? [nameKey] : [];
              const emailCriteria = emailKey ? [emailKey] : [];

              const orderCustomerIds = [
                order.customerId,
                order.customer_id,
                order.customer?.id,
                order.customerDetails?.id,
                order.customerDetails?.customer_id,
                order?.customer?.customer_id,
              ]
                .map((v) => String(v ?? "").trim())
                .filter(Boolean);

              // If customerId is provided, require ID match. Otherwise require name/email match
              const shouldMatchById = Boolean(idCustomerKey);

              const matchesCenter =
                centerCriteria.length > 0 &&
                orderCenters.some((value) => centerCriteria.includes(value));

              if (shouldMatchById) {
                const byId =
                  orderCustomerIds.length > 0 && orderCustomerIds.includes(idCustomerKey);
                return matchesCenter && byId;
              }

              const matchesCustomer =
                customerCriteria.length > 0 &&
                orderCustomers.some((value) => customerCriteria.includes(value));
              const matchesEmail =
                emailCriteria.length > 0 &&
                orderEmails.some((value) => emailCriteria.includes(value));

              // require both center and customer (by name or email)
              const customerMatch = matchesCustomer || matchesEmail;
              return matchesCenter && customerMatch;
            });
          }

          if (!filtered.length && list.length) {
            // Do not fall back to showing other customers' orders.
            filtered = [];
          }

          setSalesOrderOptions(filtered);
          if (!filtered.length) {
            setSalesOrderFetchError(
              "No sales orders found for this customer at the selected center."
            );
          } else if (fallbackApplied) {
            setSalesOrderFetchError(
              "No exact matches; showing all sales orders so you can pick manually."
            );
          }
        } catch (error) {
          console.error(
            "Failed to fetch sales orders for voucher selection",
            error
          );
          setSalesOrderFetchError(
            "Unable to load sales orders. Please try again."
          );
          setSalesOrderOptions([]);
        } finally {
          setIsSalesOrderLoading(false);
        }
      },
      []
    );

    // Sync generated invoice id from parent into form
    useEffect(() => {
      setFormData((prev) => ({ ...prev, id: nextInvoiceId }));
    }, [nextInvoiceId]);

    useEffect(() => {
      // Load customers, centers, and products from services
      let active = true;
      const loadDiscountLevels = async () => {
        try {
          const list = await discountLevelService.getAll();
          if (!active) return;
          setDiscountLevels(Array.isArray(list) ? list : []);
        } catch (err) {
          console.debug("No discount levels available or failed to load", err);
          if (!active) return;
          setDiscountLevels([]);
        }
      };
      loadDiscountLevels();
      const loadCustomers = async () => {
        try {
          setLoading((prev) => ({ ...prev, customers: true }));
          const data = await fetchCustomersService();
          const normalized = Array.isArray(data)
                ? data.map((c) => ({
                    id:
                      c.id ??
                      c.customer_id ??
                      String(c.email || c.name || Math.random()),
                    name:
                      c.name ??
                      c.customer_name ??
                      `${c.first_name || ""} ${c.last_name || ""}`.trim(),
                    email: c.email ?? c.contact_email ?? "",
                    address:
                      c.address ?? c.customer_address ?? c.address_line1 ?? c.address1 ?? "",
                    telephone:
                      c.telephone ?? c.phone ?? c.contact_number ?? c.mobile ?? "",
                  }))
                : [];
          setCustomers(normalized);
        } catch (error) {
          console.error("Error fetching customers:", error);
          setCustomers([]);
        } finally {
          setLoading((prev) => ({ ...prev, customers: false }));
        }
      };

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
        } catch (error) {
          console.error("Error fetching centers:", error);
          setCenters([]);
        } finally {
          setLoading((prev) => ({ ...prev, centers: false }));
        }
      };

      const loadInventory = async () => {
        try {
          setLoading((prev) => ({ ...prev, products: true }));
          const data = await fetchInventoryDetails();
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : [];
          setInventoryDetails(list);
        } catch (error) {
          console.error("Error fetching inventory details:", error);
          setInventoryDetails([]);
        } finally {
          setLoading((prev) => ({ ...prev, products: false }));
        }
      };

      loadCustomers();
      loadCenters();
      loadInventory();
      return () => {
        active = false;
      };
    }, []);

    useEffect(() => {
      if (!pendingOrderDiscountLevelId) return;
      const matchedLevel = discountLevels.find(
        (level) =>
          String(level.id) === String(pendingOrderDiscountLevelId)
      );
      if (matchedLevel) {
        setSelectedDiscountLevel(matchedLevel);
        setPendingOrderDiscountLevelId(null);
      }
    }, [discountLevels, pendingOrderDiscountLevelId]);

    

    useEffect(() => {
      // Recalculate the available product list whenever the selected center changes
      const centerId = String(formData.center || "").trim();
      if (!centerId) {
        setProducts([]);
        return;
      }

      const flattenCenterInventory = inventoryDetails.flatMap((product) => {
        const centerStocks = Array.isArray(product.inventory)
          ? product.inventory
          : [];
        return centerStocks
          .filter((stock) => String(stock.center?.id) === centerId)
          .map((stock) => {
            const availableQty = Number(
              stock.available_quantity ??
                stock.availableQuantity ??
                stock.qty ??
                stock.quantity ??
                0
            );

            return {
              id:
                product.id ??
                product.product_id ??
                stock.inventory_stock_id ??
                `${product.name}-${stock.center?.id}`,
              productId: product.id ?? product.product_id ?? stock.product_id,
              name:
                product.name ??
                product.product_name ??
                product.title ??
                "Unnamed product",
              sku: product.code ?? product.barcode ?? product.sku ?? "",
              unitPrice: Number(
                product.min_price ?? product.cost ?? product.price ?? 0
              ),
              mrp: Number(
                product.mrp ?? product.price ?? product.min_price ?? 0
              ),
              costPrice: Number(product.cost ?? product.min_price ?? 0),
              availableQty,
              totalAvailable: Number(
                product.total_available_quantity ??
                  product.totalAvailableQty ??
                  0
              ),
              inventoryStockId: stock.inventory_stock_id,
              centerId: stock.center?.id ?? null,
              centerName: stock.center?.name ?? "",
              batchNumber: stock.batch_number ?? stock.batchNumber ?? null,
            };
          });
      });

      setProducts(flattenCenterInventory);
    }, [formData.center, inventoryDetails]);

    useEffect(() => {
      if (!formData.center || !pendingSalesOrderRef.current) return;
      const context = pendingSalesOrderRef.current;
      pendingSalesOrderRef.current = null;
      const centerMeta = centers.find(
        (c) => String(c.id) === String(formData.center)
      );
      setSalesOrderInlineNotice("");
      openSalesOrderPicker({
        centerId: formData.center,
        centerName: centerMeta?.name || "",
        customerName: context.customerName,
        customerEmail: context.customerEmail,
        customerId: context.customerId,
      }).catch(() => {});
    }, [formData.center, centers, openSalesOrderPicker]);

    // Build customer options from fetched customers
    const availableCustomers = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      address: c.address || "",
      telephone: c.telephone || "",
    }));

    // Helper: compute per-unit discount from a discount level and unit price
    const computePerUnitDiscountFromLevel = (level, unitPrice) => {
      if (!level) return 0;
      const rawPerc = level.percentage ?? level.percent ?? level.rate ?? null;
      const rawAmt = level.amount ?? level.value ?? level.discount ?? null;
      if (rawPerc != null && isFinite(Number(rawPerc))) {
        return Math.round((Number(unitPrice || 0) * Number(rawPerc) / 100) * 100) / 100;
      }
      if (rawAmt != null && isFinite(Number(rawAmt))) {
        // Treat numeric value as per-unit amount when sensible
        return Math.round(Number(rawAmt) * 100) / 100;
      }
      return 0;
    };

    // Compute table totals using the stored line-level discount amount
    const tableTotal = React.useMemo(() => {
      return items.reduce((acc, it) => {
        const qty = Number(it.quantity) || 0;
        const unit = Number(it.unitPrice) || 0;
        const lineDiscount = (it.discountEnabled ? Number(it.discount) : 0) || 0;
        const lineTotal = unit * qty;
        return acc + Math.max(0, lineTotal - lineDiscount);
      }, 0);
    }, [items]);

    const discountTotal = React.useMemo(() => {
      return items.reduce((acc, it) => {
        const lineDiscount = (it.discountEnabled ? Number(it.discount) : 0) || 0;
        return acc + Math.max(0, lineDiscount);
      }, 0);
    }, [items]);

    // Derive invoice amount from items (keep in sync with table total)
    useEffect(() => {
      setFormData((prev) => ({ ...prev, amount: tableTotal }));
    }, [tableTotal]);

    const validateForm = () => {
      const newErrors = {};

      if (!formData.id) newErrors.id = "Invoice number not generated";
      if (!String(formData.center).trim())
        newErrors.center = "Center is required";
      if (!formData.date) newErrors.date = "Date is required";
      if (!formData.customer.trim())
        newErrors.customer = "Customer name is required";
      if (!formData.customerEmail.trim())
        newErrors.customerEmail = "Customer email is required";
      if ((items?.length || 0) === 0) {
        // If there are no line items, require inline product fields (entry)
        if (!String(entry.productName || "").trim())
          newErrors.productName = "Product name is required";
        if ((Number(entry.quantity) || 0) <= 0)
          newErrors.quantity = "Quantity must be greater than 0";
      }
      if (formData.amount <= 0 && (items?.length || 0) === 0)
        newErrors.amount = "Amount must be greater than 0";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleBatchModeChange = (checked) => {
      setIsBatchEnabled(checked);
      setEntry((prev) => ({ ...prev, batchNumber: "" }));
      setErrors((prev) => ({ ...prev, batchNumber: undefined }));
      if (items.length > 0) {
        setItems([]);
      }
    };

    // Capture center selection and queue voucher lookup if customer already selected
    const handleCenterChange = (value) => {
      setFormData((prev) => ({ ...prev, center: value }));
      setSalesOrderInlineNotice("");
      if (formData.customer) {
        pendingSalesOrderRef.current = {
          customerName: formData.customer,
          customerEmail: formData.customerEmail,
          customerId: formData.customerId,
        };
      }
    };

    // Resolve customer meta and trigger voucher fetch once both center/customer are known
    const handleCustomerSelection = (value) => {
      const selected = customers.find((c) => String(c.email) === String(value));
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          customer: selected.name,
          customerEmail: selected.email,
          customerId: selected.id,
          customerAddress: selected.address || "",
          customerTelephone: selected.telephone || "",
        }));
        if (formData.center) {
          setSalesOrderInlineNotice("");
          pendingSalesOrderRef.current = null;
          const centerMeta = centers.find(
            (c) => String(c.id) === String(formData.center)
          );
          openSalesOrderPicker({
            centerId: formData.center,
            centerName: centerMeta?.name || "",
            customerName: selected.name,
            customerEmail: selected.email,
            customerId: selected.id,
          }).catch(() => {});
        } else {
          pendingSalesOrderRef.current = {
            customerName: selected.name,
            customerEmail: selected.email,
            customerId: selected.id,
          };
          setSalesOrderInlineNotice(
            "Select a center to view matching sales orders."
          );
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          customer: "",
          customerEmail: "",
          customerAddress: "",
          customerTelephone: "",
        }));
        pendingSalesOrderRef.current = null;
        setSalesOrderInlineNotice("");
      }
    };

    // Populate invoice table from a selected sales order (voucher)
    const applySalesOrderToInvoice = (order) => {
      if (!order) return;
      const sourceItems = Array.isArray(order.items)
        ? order.items
        : Array.isArray(order.orderItems)
        ? order.orderItems
        : [];
      if (!sourceItems.length) {
        setSalesOrderFetchError(
          "Selected sales order does not contain any items."
        );
        return;
      }
      const baseId = Date.now();
      const mappedItems = sourceItems
        .map((item, idx) => {
          const qty = Math.max(1, Number(item.quantity ?? item.qty ?? 0));
          if (!qty) return null;
          const unitPrice = Math.max(
            0,
            Number(
              item.cost ??
                item.costPrice ??
                item.unit_cost ??
                item.unitCost ??
                item.purchaseCost ??
                item.unitPrice ??
                item.unit_price ??
                item.price ??
                item.amount ??
                0
            )
          );
        
          const resolvedName =
            item.productName ??
            item.name ??
            item.product?.name ??
            item.product?.product_name ??
            item.product?.title ??
            item.inventoryItem?.name ??
            item.itemName ??
            item.description ??
            `Item ${idx + 1}`;
          // Prefer explicit batch fields, then look for common 'batches' arrays
          const batchFromArray =
            Array.isArray(item.batches) && item.batches.length
              ? item.batches[0]?.batch_number ??
                item.batches[0]?.batchNumber ??
                null
              : null;
          const batchFromProduct =
            Array.isArray(item.product?.batches) && item.product.batches.length
              ? item.product.batches[0]?.batch_number ??
                item.product.batches[0]?.batchNumber ??
                null
              : null;

         
          const backendFinalAmount = item.amount ?? null;
          const backendPerUnitDiscount = item.discount ?? null;
          const preDiscountLineTotal = unitPrice * qty;

          let resolvedLineDiscount = 0;
          let discountPerUnit = null;
          if (backendPerUnitDiscount != null && isFinite(Number(backendPerUnitDiscount))) {
            discountPerUnit = Number(backendPerUnitDiscount);
            resolvedLineDiscount = Math.round(discountPerUnit * qty * 100) / 100;
          } else if (backendFinalAmount != null && isFinite(Number(backendFinalAmount))) {
            const finalAmt = Number(backendFinalAmount);
            const inferredDiscount = Math.max(0, preDiscountLineTotal - finalAmt);
            if (inferredDiscount >= 0.005) {
              resolvedLineDiscount = Math.round(inferredDiscount * 100) / 100;
            }
          }

          const mrpVal = Number(item.mrp ?? item.product?.mrp ?? 0);
          const minPriceVal = Number(item.min_price ?? item.product?.min_price ?? item.product?.minPrice ?? 0);

          return {
            id: `${baseId}-${idx}`,
            productId: item.productId ?? item.product_id ?? item.id ?? null,
            name: resolvedName,
            productName: resolvedName,
            quantity: qty,
            unitPrice,
            discountPerUnit: discountPerUnit != null ? Number(discountPerUnit) : undefined,
            discount: Number(resolvedLineDiscount.toFixed(2)),
            mrp: mrpVal,
            min_price: minPriceVal,
            discountEnabled: Number(resolvedLineDiscount) > 0,
            batchNumber:
              item.batchNumber ??
              item.batch_number ??
              batchFromArray ??
              batchFromProduct ??
              null,
            source: "order",
          };
        })
        .filter(Boolean);
      if (!mappedItems.length) {
        setSalesOrderFetchError(
          "Selected sales order does not contain any valid items."
        );
        return;
      }
   
      try {
        const rawOrderDiscount =
          order.discountValue ??
          order.discount_value ??
          order.discountAmount ??
          order.discount_amount ??
          order.totalDiscount ??
          order.total_discount ??
          order.discountTotal ??
          order.discount_total ??
          order.discount ??
          null;
        const totalOrderDiscount =
          rawOrderDiscount != null && isFinite(Number(rawOrderDiscount))
            ? Math.max(0, Number(rawOrderDiscount))
            : 0;
        if (totalOrderDiscount > 0) {
          // If backend provided per-item discounts we should not override them.
          const existingDiscountSum = mappedItems.reduce(
            (s, r) => s + (Number(r.discount) || 0),
            0
          );
          if (existingDiscountSum <= 0) {
            const preTotal = mappedItems.reduce(
              (s, r) => s + (Number(r.unitPrice) || 0) * (Number(r.quantity) || 0),
              0
            );
            const totalQty = mappedItems.reduce(
              (s, r) => s + (Number(r.quantity) || 0),
              0
            );
            if (preTotal > 0) {
              mappedItems.forEach((r) => {
                const lineTotal = (Number(r.unitPrice) || 0) * (Number(r.quantity) || 0);
                const lineShare = lineTotal / preTotal;
                const lineDiscountTotal = totalOrderDiscount * lineShare;
                r.discount = Number(lineDiscountTotal.toFixed(2));
                r.discountEnabled = Number(lineDiscountTotal) > 0;
              });
            } else if (totalQty > 0) {
              const perRow = Number((totalOrderDiscount / totalQty).toFixed(2));
              mappedItems.forEach((r) => {
                const lineDiscountTotal = perRow * (Number(r.quantity) || 0);
                r.discount = Number(lineDiscountTotal.toFixed(2));
                r.discountEnabled = lineDiscountTotal > 0;
              });
            }
          }
        }
      } catch (err) {
        // ignore and proceed without applying order-level discount
        console.warn("Failed to apply order-level discount:", err);
      }
      setItems(mappedItems);
      setIsBatchEnabled(mappedItems.some((row) => row.batchNumber));
      setEntry({
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
        batchNumber: "",
      });
      setFormData((prev) => ({
        ...prev,
        refNumber:
          order.orderNumber ??
          order.voucherNumber ??
          order.voucher_no ??
          prev.refNumber,
      }));
      setSalesOrderFetchError("");
      setShowSalesOrderModal(false);
      // If the sales order carries a reference to a discount level, try to apply it
      try {
        const dlId = resolveOrderDiscountLevelId(order);
        const dlMatchById =
          dlId && discountLevels.find((d) => String(d.id) === String(dlId));
        const dlMatchByName =
          order.discountLevelName || order.discount_level_name
            ? discountLevels.find((d) => {
                const n = String(d.name ?? d.title ?? d.label ?? "").toLowerCase();
                return (
                  n &&
                  [order.discountLevelName, order.discount_level_name]
                    .filter(Boolean)
                    .map((s) => String(s).toLowerCase())
                    .includes(n)
                );
              })
            : null;
        const dlCandidate = dlMatchById || dlMatchByName;

        if (dlCandidate) {
          setSelectedDiscountLevel(dlCandidate);
          setPendingOrderDiscountLevelId(null);
        } else if (dlId) {
          setPendingOrderDiscountLevelId(dlId);
        } else {
          setPendingOrderDiscountLevelId(null);
        }
      } catch {
        // ignore matching errors
      }
    };

   

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

    const handleAddItem = () => {
      const name = String(entry.productName || "").trim();
      const qty = Math.max(1, Number(entry.quantity) || 0);
      const selected = entry.productId
        ? products.find((p) => String(p.id) === String(entry.productId))
        : products.find(
            (p) => (p.name || "").toLowerCase() === name.toLowerCase()
          );

      
      const unitPrice = selected
        ? Number(selected.costPrice) || 0
        : Number(entry.unitPrice) || 0;

      if (!name) {
        setErrors((prev) => ({
          ...prev,
          productName: "Product name is required",
        }));
        return;
      }
      if (qty <= 0) {
        setErrors((prev) => ({
          ...prev,
          quantity: "Quantity must be greater than 0",
        }));
        return;
      }
      if (selected && qty > Number(selected.availableQty ?? Infinity)) {
        setErrors((prev) => ({
          ...prev,
          quantity: `Only ${
            selected.availableQty ?? 0
          } units available at this center`,
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

      
      const defaultPerUnitDiscount = selectedDiscountLevel
        ? computePerUnitDiscountFromLevel(selectedDiscountLevel, unitPrice)
        : 0;
      const defaultLineDiscount = defaultPerUnitDiscount * qty;
      const defaultDiscountEnabled = !!selectedDiscountLevel && defaultLineDiscount > 0;

      const newItem = {
        id: Date.now(),
        productId: selected ? selected.id : undefined,
        name,
        quantity: qty,
        unitPrice: Math.max(0, unitPrice),
        mrp: selected ? Number(selected.mrp ?? selected.mrp ?? 0) : 0,
        min_price: selected ? Number(selected.min_price ?? selected.minPrice ?? 0) : 0,
        discount: Math.max(0, defaultLineDiscount),
        discountEnabled: defaultDiscountEnabled,
        batchNumber: isBatchEnabled
          ? String(entry.batchNumber || "").trim()
          : null,
      };

      setItems((prev) => [...prev, newItem]);

      // Clear entry fields for next add
      setEntry({
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
        batchNumber: "",
      });
      setErrors((prev) => ({
        ...prev,
        productName: undefined,
        quantity: undefined,
        batchNumber: undefined,
      }));
    };

    const updateItemField = (id, field, value) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const updated = { ...it, [field]: value };
        
          if (field === "quantity" && it.discountPerUnit != null) {
            const qty = Number(value) || 0;
            updated.discount = Math.round((Number(it.discountPerUnit) || 0) * qty * 100) / 100;
            updated.discountEnabled = Number(updated.discount) > 0;
          }
          return updated;
        })
      );
    };

    const updateItemDiscount = (id, rawValue) => {
      const v = Number(rawValue) || 0;
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          if (it.discountPerUnit != null) {
            const perUnit = v;
            const qty = Number(it.quantity) || 0;
            const line = Math.round(perUnit * qty * 100) / 100;
            return { ...it, discountPerUnit: perUnit, discount: line, discountEnabled: perUnit > 0 };
          }
          return { ...it, discount: Math.round(v * 100) / 100, discountEnabled: v > 0 };
        })
      );
    };

    const deleteItem = (id) => {
      setItems((prev) => prev.filter((it) => it.id !== id));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      // Prepare invoice payload up to this point (without payment)
      const computedAmount = items.reduce((acc, it) => {
        const qty = Number(it.quantity) || 0;
        const unit = Number(it.unitPrice) || 0;
        const lineDiscount = (it.discountEnabled ? Number(it.discount) : 0) || 0;
        const lineTotal = unit * qty;
        return acc + Math.max(0, lineTotal - lineDiscount);
      }, 0);

      const {
        productName: _legacyProductName,
        quantity: _legacyQuantity,
        ...formWithoutLegacyFields
      } = formData;

      const normalizedItems = items.map((item, index) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const discountValue = item.discountEnabled
          ? Number(item.discount) || 0
          : 0;
        const batchNumber = item.batchNumber
          ? String(item.batchNumber).trim()
          : null;
        const base = {
          ...item,
          quantity,
          unitPrice,
          discount: item.discount,
          mrp: Number(item.mrp) || 0,
          min_price: Number(item.min_price) || 0,
          batchNumber,
          batch_number: batchNumber,
          lineNumber: index + 1,
          line_number: index + 1,
          line_total: Math.max(0, unitPrice * quantity - discountValue),
        };
        return base;
      });

      const centerId =
        formWithoutLegacyFields.center_id ??
        formWithoutLegacyFields.center ??
        "";
      const inventoryStockPayload = normalizedItems
        .map((item) => {
          const resolvedProductId = item.product_id ?? item.productId ?? null;
          if (!resolvedProductId) return null;
          return {
            product_id: resolvedProductId,
            quantity: item.quantity,
            batch_number: item.batch_number ?? item.batchNumber ?? null,
            center_id: centerId || null,
          };
        })
        .filter(Boolean);

      const invoiceData = {
        ...formWithoutLegacyFields,
        center_id: centerId || (formWithoutLegacyFields.center_id ?? undefined),
        amount: computedAmount || formData.amount,
        discount_total: discountTotal,
        items: normalizedItems,
        inventory_stocks: inventoryStockPayload,
        // attach chosen discount level info so backend can record it
        discount_level_id:
          (selectedDiscountLevel && (selectedDiscountLevel.id ?? selectedDiscountLevel.level_id)) ||
          pendingOrderDiscountLevelId ||
          undefined,
        discount_level_name:
          (selectedDiscountLevel && (selectedDiscountLevel.name ?? selectedDiscountLevel.title ?? selectedDiscountLevel.label)) ||
          undefined,
      };

      // Open Payment popup; finalize after payment is set
      setPendingInvoice(invoiceData);
      setShowPaymentModal(true);
    };

    const { user } = useAuth();

    const finalizeInvoiceWithPayment = async (paymentData) => {
      if (!pendingInvoice) return;

    
      const { customerEmail: _omitCustomerEmail, ...pendingSansEmail } =
        pendingInvoice || {};
      const invoicePayload = {
        ...pendingSansEmail,
        status: "completed",
        payment: paymentData,
        created_by: user?.id || user?.user_id || undefined,
      };

      try {
        // Prepare helpful console output
        const itemsWithTotals = (invoicePayload.items || []).map((it) => {
          const qty = Number(it.quantity) || 0;
          const unit = Number(it.unitPrice) || 0;
          const lineDiscount = (it.discountEnabled ? Number(it.discount) : 0) || 0;
          const lineTotal = unit * qty;
          const rowTotal = Math.max(0, lineTotal - lineDiscount);
          const discountPerUnit = qty ? lineDiscount / qty : 0;
          return {
            name: it.name,
            productId: it.productId ?? "",
            quantity: qty,
            unitPrice: unit,
            discountEnabled: !!it.discountEnabled,
            discountPerUnit,
            discountAmount: lineDiscount,
            batchNumber: it.batchNumber ?? "",
            lineTotal,
            lineDiscount,
            rowTotal,
          };
        });

        const grand = itemsWithTotals.reduce(
          (acc, r) => acc + Number(r.rowTotal || 0),
          0
        );

        // Grouped, readable output
        console.group(
          "%cInvoice: SET PAYMENT",
          "color:#2563eb;font-weight:bold"
        );
        console.info("Invoice ID:", invoicePayload.id);
        console.info("Date:", invoicePayload.date);
        console.info("Center:", invoicePayload.center);
        console.info("Customer:", invoicePayload.customer);
        console.info("Created By:", invoicePayload.created_by);
        console.info("Ref Number:", invoicePayload.refNumber || "-");
        console.info("Status:", invoicePayload.status);
        console.info("Amount (computed):", grand);
        console.groupCollapsed("Items (with totals)");
        console.table(itemsWithTotals);
        console.groupEnd();
        console.group("Payment");
        console.info("Mode:", invoicePayload.payment?.mode);
        console.info("Amount:", invoicePayload.payment?.amount);
        if (invoicePayload.payment?.mode === "online") {
          console.info("Bank Name:", invoicePayload.payment?.bankName);
          console.info("Reference No:", invoicePayload.payment?.referenceNo);
          console.info("Transfer Date:", invoicePayload.payment?.transferDate);
        }
        if (invoicePayload.payment?.mode === "cheque") {
          console.info("Cheque No:", invoicePayload.payment?.chequeNo);
          console.info("Bank Name:", invoicePayload.payment?.bankName);
          console.info("Cheque Date:", invoicePayload.payment?.chequeDate);
        }
        if (invoicePayload.payment?.note)
          console.info("Note:", invoicePayload.payment?.note);
        console.groupEnd();

        // Full JSON view (pretty printed)
        console.groupCollapsed("Full JSON payload");
        console.log(JSON.stringify(invoicePayload, null, 2));
        console.groupEnd();
        console.groupEnd();
      } catch {
        // Fallback in case console.table or grouping fails in some environments
        console.log("Invoice JSON payload:", invoicePayload);
      }

      setIsSubmitting(true);
      try {
        const resp = await createINV(invoicePayload);
        const created = resp?.data ?? resp ?? invoicePayload;
        const candidateIdRaw =
          created?.voucherNumber ??
          created?.id ??
          created?.data?.voucherNumber ??
          created?.data?.id ??
          invoicePayload?.id ??
          nextInvoiceId;
        const normalizedCandidateId =
          candidateIdRaw != null ? String(candidateIdRaw).trim() : "";
        if (normalizedCandidateId) {
          lastCreatedInvoiceRef.current = normalizedCandidateId;
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(
                LAST_INVOICE_STORAGE_KEY,
                normalizedCandidateId
              );
            } catch {
              // ignore storage errors
            }
          }
        }

        // After successful creation, fetch authoritative next invoice number from backend
        try {
          await refreshNextInv();
        } catch {
          // Fallback to optimistic increment only if refresh fails
          const fallbackNext = normalizedCandidateId
            ? incrementInvCode(normalizedCandidateId)
            : null;
          if (fallbackNext) setNextInvoiceId(fallbackNext);
        }

        // Reset form for next entry
        setErrors((prev) => ({ ...prev, submit: undefined }));
        setFormData({
          id: "", // will be filled by effect
          center: "",
          customer: "",
          customerEmail: "",
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
        setSuccessText(
          `Invoice ${
            created?.id || invoicePayload?.id || nextInvoiceId
          } created successfully.`
        );
        const previewItems = (invoicePayload.items || []).map((item) => ({
          ...item,
        }));
        const previewOrderNumber =
          invoicePayload?.voucherNumber ??
          invoicePayload?.id ??
          invoicePayload?.reference ??
          nextInvoiceId;
        const previewData = {
          ...invoicePayload,
          items: previewItems,
          documentType: "Invoice",
          paidAmount:
            paymentData?.amount ??
            paymentData?.paidAmount ??
            paymentData?.paid ??
            0,
          payment: paymentData,
          currencyFormat: (value) => formatLKR(value),
          customerAddress:
            invoicePayload?.customerAddress ??
            invoicePayload?.address ??
            invoicePayload?.billingAddress ??
            "",
          customerTelephone:
            invoicePayload?.customerTelephone ??
            invoicePayload?.telephone ??
            invoicePayload?.phone ??
            invoicePayload?.contactNumber ??
            invoicePayload?.mobile ??
            "",
          totalAmount:
            invoicePayload?.amount ??
            invoicePayload?.total ??
            invoicePayload?.value ??
            tableTotal,
          orderNumber: previewOrderNumber,
        };
        setRecentInvoiceDetails(previewData);
        setShowSuccess(true);

        // Optionally refresh centers list post-create
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
        } catch {
          // ignore refresh errors
        }
      } catch (err) {
        console.error("Failed to create invoice (INV):", err);
        setErrors((prev) => ({
          ...prev,
          submit: "Failed to create invoice. Please try again.",
        }));
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <>
        {/* header section for INVOICE Number */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 uppercase">
                Invoice
              </h1>
              <div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">
                Invoice Number :{" "}
                <span className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">
                  {nextInvoiceId}
                </span>
              </div>
              <p className="text-slate-500 text-base">
                Manage and track your invoices
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Form */}
        <div className="bg-slate-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-6">
            Create New Invoice
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    title="Invoice date is auto-set and cannot be changed"
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? "date-error" : undefined}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${
                      errors.date
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-slate-50"
                    } opacity-90 cursor-not-allowed`}
                  />
                  {errors.date && (
                    <p
                      id="date-error"
                      className="text-red-600 text-sm mt-2 font-medium"
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
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 bg-white ${
                      errors.center
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-slate-50"
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
                    <p className="text-red-600 text-sm mt-2 font-medium">
                      {errors.center}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Customer Details*
                  </label>
                  <select
                    value={formData.customerEmail}
                    onChange={(e) => handleCustomerSelection(e.target.value)}
                    disabled={loading.customers}
                    aria-invalid={!!(errors.customer || errors.customerEmail)}
                    aria-describedby={
                      errors.customer || errors.customerEmail
                        ? "customer-error"
                        : undefined
                    }
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 bg-white ${
                      errors.customer || errors.customerEmail
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-slate-50"
                    } ${
                      loading.customers ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">
                      {loading.customers
                        ? "Loading customers…"
                        : "Select customer"}
                    </option>
                    {!loading.customers &&
                      availableCustomers.map((c) => (
                        <option
                          key={c.email}
                          value={c.email}
                        >{`${c.name} (${c.email})`}</option>
                      ))}
                  </select>
                  {(errors.customer || errors.customerEmail) && (
                    <p
                      id="customer-error"
                      className="text-red-600 text-sm mt-2 font-medium"
                    >
                      Customer details are required
                    </p>
                  )}
                  {salesOrderInlineNotice &&
                    !errors.customer &&
                    !errors.customerEmail && (
                      <p className="text-amber-600 text-xs mt-2 font-semibold">
                        {salesOrderInlineNotice}
                      </p>
                    )}
                  {(formData.customerAddress || formData.customerTelephone) ? (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-600">
                      {formData.customerAddress && (
                        <p>
                          <span className="font-semibold text-slate-700">Address:</span> {formData.customerAddress}
                        </p>
                      )}
                      {formData.customerTelephone && (
                        <p className="mt-1">
                          <span className="font-semibold text-slate-700">Telephone:</span> {formData.customerTelephone}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Ref Number
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
                    className="w-full px-4 py-3 border-2 border-slate-300 bg-slate-50 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                    placeholder="Enter reference number"
                  />
                </div>

                {/*total amount section*/}
                <div className="lg:place-self-end text-center bg-slate-100 rounded-lg p-6 border border-slate-200">
                  <p className="text-lg font-semibold text-slate-700 mb-2">
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatLKR(tableTotal)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Discount: {formatLKR(discountTotal)}
                  </p>
                </div>
              </div>

              {/* Discount Level Selector */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Discount Level
                </label>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedDiscountLevel?.id ?? ""}
                    onChange={(e) => {
                      const id = String(e.target.value || "");
                      setPendingOrderDiscountLevelId(null);
                      if (!id) {
                        setSelectedDiscountLevel(null);
                        return;
                      }
                      const found = discountLevels.find((d) => String(d.id) === id) || null;
                      setSelectedDiscountLevel(found);
                    }}
                    className="px-4 py-3 border-2 border-slate-300 bg-slate-50 rounded-lg transition-colors w-72"
                  >
                    <option value="">No discount</option>
                    {discountLevels.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name ?? d.title ?? d.label ?? `Level ${d.id}`}
                      </option>
                    ))}
                  </select>
                  {selectedDiscountLevel && (
                    <div className="text-sm text-slate-600">
                      {selectedDiscountLevel.percentage || selectedDiscountLevel.percent
                        ? `${selectedDiscountLevel.percentage ?? selectedDiscountLevel.percent}%`
                        : selectedDiscountLevel.amount || selectedDiscountLevel.value
                        ? `LKR ${selectedDiscountLevel.amount ?? selectedDiscountLevel.value}`
                        : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Section */}
              <div className="mb-6 sm:mb-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-4">
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
                      ? "Each invoice line must carry a batch number."
                      : "Quantities group per product without batch tracking."}
                  </p>
                </div>
                <div
                  className={`grid grid-cols-1 gap-4 ${
                    isBatchEnabled ? "sm:grid-cols-5" : "sm:grid-cols-4"
                  }`}
                >
                  <div
                    className={
                      isBatchEnabled ? "sm:col-span-3" : "sm:col-span-2"
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
                          }));
                          setShowSuggestions(true);
                          setActiveIndex(-1);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 150);
                        }}
                        disabled={!formData.center || loading.products}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.productName
                            ? "border-red-300 bg-red-50"
                            : "border-slate-300 bg-white hover:border-slate-400"
                        } ${
                          loading.products || !formData.center
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }`}
                        placeholder={
                          !formData.center
                            ? "Select a center first"
                            : loading.products
                            ? "Loading products…"
                            : "Search product by name or SKU"
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
                                    batchNumber: "",
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
                                <span className="ml-auto text-xs text-slate-600 font-semibold text-right">
                                  Cost LKR {Number(p.costPrice || 0).toFixed(2)}{" "}
                                  • MRP {Number(p.mrp || 0).toFixed(2)}
                                  <br />
                                  Stock{" "}
                                  {Number(
                                    p.availableQty ?? p.currentstock ?? 0
                                  )}{" "}
                                  units
                                </span>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                    {errors.productName && (
                      <p className="text-red-600 text-sm mt-2 font-medium">
                        {errors.productName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={entry.quantity || ""}
                      onChange={(e) =>
                        setEntry((prev) => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 0,
                        }))
                      }
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${
                        errors.quantity
                          ? "border-red-300 bg-red-50"
                          : "border-slate-300 bg-white"
                      }`}
                      placeholder="Enter quantity"
                    />
                    {errors.quantity && (
                      <p className="text-red-600 text-sm mt-2 font-medium">
                        {errors.quantity}
                      </p>
                    )}
                  </div>

                  {/* Removed global Special Request toggle; discount is now controlled per row */}

                  {isBatchEnabled && (
                    <div>
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
                        className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${
                          errors.batchNumber
                            ? "border-red-300 bg-red-50"
                            : "border-slate-300 bg-white"
                        }`}
                        placeholder="Enter batch number"
                      />
                      {errors.batchNumber && (
                        <p className="text-red-600 text-sm mt-2 font-medium">
                          {errors.batchNumber}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!formData.center || loading.products}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-5 w-5" />
                      Add Item
                    </button>
                  </div>
                </div>

                {/*/////////added table for product////////////*/}
                {items.length > 0 && (
                  <div className="mt-6 overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm">
                        <table className="min-w-[760px] w-full divide-y divide-slate-200">
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
                                Qty
                              </th>
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                Unit Price
                              </th>
                              {/* Per-row discount toggle removed */}
                              <th
                                scope="col"
                                className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider"
                                title="Line discount total when enabled"
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
                                className="px-3 sm:px-4 py-4 text-right"
                              ></th>
                            </tr>
                          </thead>

                          <tbody className="bg-white divide-y divide-slate-100">
                            {items.map((it, idx) => {
                              const lineDiscount = Number(it.discount) || 0;
                              const unitPrice = Number(it.unitPrice) || 0;
                              const qty = Number(it.quantity) || 0;
                              const lineTotal = unitPrice * qty;
                              const rowTotal = Math.max(0, lineTotal - lineDiscount);

                              return (
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
                                  {isBatchEnabled && (
                                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                                      {it.batchNumber ? (
                                        <div className="text-sm text-slate-700 whitespace-nowrap font-medium">
                                          {it.batchNumber}
                                        </div>
                                      ) : (
                                        <input
                                          type="text"
                                          value={it.batchNumber || ""}
                                          onChange={(e) =>
                                            updateItemField(
                                              it.id,
                                              "batchNumber",
                                              e.target.value
                                            )
                                          }
                                          aria-label={`Batch number for ${it.name}`}
                                          className="w-32 px-3 py-2 border-2 border-slate-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
                                          placeholder="Batch"
                                        />
                                      )}
                                    </td>
                                  )}
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
                                      className="w-20 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
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
                                          it.id,
                                          "unitPrice",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      aria-label={`Unit price for ${it.name}`}
                                      className="w-28 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
                                    />
                                  </td>

                                  {/* per-row discount toggle removed */}

                                  <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                          it.discountPerUnit != null
                                            ? it.discountPerUnit
                                            : it.discount
                                        }
                                        onChange={(e) =>
                                          updateItemDiscount(
                                            it.id,
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        disabled={!it.discountEnabled}
                                        aria-label={`Line discount amount for ${it.name}`}
                                        title={
                                          !it.discountEnabled
                                            ? "Enable discount in this row to edit"
                                            : undefined
                                        }
                                        className={`w-24 px-3 py-2 border-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 ${
                                          !it.discountEnabled
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                                            : "border-slate-300 bg-slate-50 hover:bg-white"
                                        }`}
                                      />
                                  </td>

                                  {/*total amount*/}
                                  <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                                    {formatLKR(rowTotal)}
                                  </td>

                                  <td className="px-3 sm:px-4 py-4 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => deleteItem(it.id)}
                                      className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 hover:text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors border border-red-200 hover:border-red-600"
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

              <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    loading.centers ||
                    loading.customers ||
                    loading.products
                  }
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-3 shadow-lg w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating Invoice...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      {loading.centers || loading.customers || loading.products
                        ? "Loading…"
                        : "Create Invoice"}
                    </>
                  )}
                </button>
              </div>
              {errors.submit && (
                <p className="text-red-600 text-sm font-medium mt-2 text-center sm:text-right">
                  {errors.submit}
                </p>
              )}
              {/* No submit errors in console-only mode */}
            </div>
          </form>
        </div>

        {/*popup sales order selected UI*/}
        <InventoryPopup
          isOpen={showSalesOrderModal}
          title="Link Sales Order"
          subtitle={`${salesOrderContext.customerName || "Customer"} • ${
            salesOrderContext.centerName || "Selected Center"
          }`}
          onClose={() => setShowSalesOrderModal(false)}
          closeOnOverlay={!isSalesOrderLoading}
        >
          <div className="space-y-4">
            {isSalesOrderLoading ? (
              <div className="flex items-center justify-center gap-3 text-slate-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                Loading sales orders…
              </div>
            ) : salesOrderOptions.length ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {salesOrderOptions.map((order, idx) => {
                  const voucher =
                    order.orderNumber ??
                    order.voucherNumber ??
                    order.voucher_no ??
                    order.id;
                  const total =
                    order.totalAmount ??
                    order.total ??
                    order.amount ??
                    order.subtotal ??
                    0;
                  const itemsCount = Array.isArray(order.items)
                    ? order.items.length
                    : Array.isArray(order.orderItems)
                    ? order.orderItems.length
                    : 0;
                  const date =
                    order.date ?? order.createdAt ?? order.created_at ?? "";
                  return (
                    <button
                      type="button"
                      key={voucher || `order-${idx}`}
                      onClick={() => applySalesOrderToInvoice(order)}
                      className="w-full text-left border-2 border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm text-slate-500">Voucher</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {voucher || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Items</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {itemsCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Total</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {formatLKR(total)}
                          </p>
                        </div>
                        {date && (
                          <div>
                            <p className="text-sm text-slate-500">Date</p>
                            <p className="text-lg font-semibold text-slate-900">
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
                {salesOrderFetchError || "No matching sales orders found."}
              </p>
            )}
            {salesOrderFetchError && salesOrderOptions.length > 0 && (
              <p className="text-sm text-red-600 text-center">
                {salesOrderFetchError}
              </p>
            )}
          </div>
        </InventoryPopup>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowPaymentModal(false)}
              aria-hidden="true"
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h3 className="text-xl font-semibold text-slate-800">
                  Set Payment
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-500 hover:text-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors duration-200"
                  aria-label="Close payment modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 text-sm text-slate-600">
                  Total Payable:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatLKR(pendingInvoice?.amount || tableTotal)}
                  </span>
                </div>
                <Payment onSetPayment={finalizeInvoiceWithPayment} />
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && recentInvoiceDetails && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Invoice created"
          >
            <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Success</p>
                    <p className="text-sm text-slate-600">{successText || "Invoice created successfully."}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccess(false);
                    setRecentInvoiceDetails(null);
                  }}
                  className="rounded-full p-2 text-slate-500 hover:text-slate-900"
                  aria-label="Close invoice summary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5">
                <SuccessPdfView
                  orderData={recentInvoiceDetails}
                  documentType="Invoice"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccess(false);
                    setRecentInvoiceDetails(null);
                  }}
                  className="px-5 py-2 text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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
                Creating invoice…
              </span>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <section aria-label="Create new invoice">
          <InlineNewInvoiceForm nextInvoiceId={nextInvoiceId} />
        </section>
       
      </div>
    </div>
  );
};

export default Invoices;
