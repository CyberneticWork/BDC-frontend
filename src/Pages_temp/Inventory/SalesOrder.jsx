import React, {useCallback,useEffect,useMemo,useRef,useState,} from "react";
import { Plus, Trash2, CheckCircle, X } from "lucide-react";
import { getInventoryDetails as fetchInventoryDetails } from "../../services/Inventory/productListService";
import { fetchCenters as fetchCentersService } from "../../services/Inventory/centerService";
import { getCustomers as fetchCustomersService } from "../../services/Account/CustomerService";
import { useAuth } from "../../contexts/AuthContext";
import {fetchSalesOrders,salesOrder,getNextSalesOrder,}from"../../services/Inventory/inventoryService";
import { getAll as fetchDiscountLevels } from "../../services/Inventory/discountLevelService";
import { SuccessPdfView } from "../../components/Inventory/successPdf.jsx";

const incrementSoCode = (code) => {
  if (!code) return "";
  const match = String(code).match(/^(.*?)(\d+)([^0-9]*)$/);
  if (!match) return String(code);
  const [, prefix, digits, suffix] = match;
  const nextDigits = (parseInt(digits, 10) + 1)
    .toString()
    .padStart(digits.length, "0");
  return `${prefix}${nextDigits}${suffix}`;
};

const SalesOrder = () => {
  const { user } = useAuth();
  const createdById = useMemo(() => {
    return user?.id ?? user?.userId ?? user?.user_id ?? null;
  }, [user]);

  const [orders, setOrders] = useState([]);
  const [nextSONumber, setNextSONumber] = useState("");
  const [nextLoading, setNextLoading] = useState(false);
  const [serverProvidedSo, setServerProvidedSo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [recentOrderDetails, setRecentOrderDetails] = useState(null);
  const ordersMounted = useRef(true);
  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchSalesOrders();
      if (!ordersMounted.current) return;
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading sales orders:", error);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    return () => {
      ordersMounted.current = false;
    };
  }, [loadOrders]);

  // Fetch next Sales Order preview from backend (prefer server value when available)
  const refreshNextSalesOrder = useCallback(async () => {
    setNextLoading(true);
    try {
      const resp = await getNextSalesOrder();
      const next = resp?.data?.next || resp?.next || "";
      if (next) {
        setNextSONumber(next);
        setServerProvidedSo(next);
        setNextLoading(false);
        return next;
      }
      // fallback
      setNextSONumber((prev) => prev || "");
      setNextLoading(false);
      return null;
    } catch (err) {
      console.warn(
        "Failed to fetch next Sales Order from server; falling back.",
        err
      );
      setNextSONumber((prev) => (prev ? incrementSoCode(prev) : ""));
      setNextLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    // fetch server preview on mount
    refreshNextSalesOrder();
  }, [refreshNextSalesOrder]);

  useEffect(() => {
    if (serverProvidedSo) {
      setNextSONumber(serverProvidedSo);
      return;
    }
    if (orders.length === 0) {
      return;
    }
    // Compute next SO number from existing orders; accept with/without dash and preserve higher current state
    const nums = orders
      .map((o) => {
        const digits = String(o.orderNumber || "").replace(/[^0-9]/g, "");
        return digits ? parseInt(digits, 10) : null;
      })
      .filter((n) => n !== null);
    const fromOrders = nums.length ? Math.max(...nums) + 1 : 1;
    setNextSONumber((prev) => {
      const pm = String(prev || "").replace(/[^0-9]/g, "");
      const prevNum = pm ? parseInt(pm, 10) : 0;
      const finalNum = Math.max(fromOrders, prevNum || 0);
      return `SO-${String(finalNum).padStart(4, "0")}`;
    });
  }, [orders, serverProvidedSo]);


  // Success modal stays until user dismisses; no auto-hide

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

    

  const InlinePOForm = ({ nextSONumber, createdById }) => {
    const [form, setForm] = useState({
      orderNumber: "",
      center: "",
      customerId: "",
      customer: "",
      customerAddress: "",
      customerTelephone: "",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      refNumber: "",
    });
    const [items, setItems] = useState([]);
    const [discountLevels, setDiscountLevels] = useState([]);
    const [selectedDiscountLevel, setSelectedDiscountLevel] = useState(null);
    const [entry, setEntry] = useState({
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      batchNumber: "",
    });
    const [errors, setErrors] = useState({});
    const [customers, setCustomers] = useState([]);
    const [centers, setCenters] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventoryDetails, setInventoryDetails] = useState([]);
    const [selectedCenterId, setSelectedCenterId] = useState("");
    const [loading, setLoading] = useState({
      customers: false,
      centers: false,
      products: false,
    });

    // Typeahead state for products
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const productInputRef = useRef(null);

    useEffect(() => {
      if (!nextLoading) {
        setForm((p) => ({ ...p, orderNumber: nextSONumber }));
      }
    }, [nextSONumber]);

    useEffect(() => {
      let active = true;
      const loadDiscountLevels = async () => {
        try {
          const data = await fetchDiscountLevels();
          const list = Array.isArray(data) ? data : data?.data ?? [];
          if (!active) return;
          setDiscountLevels(list);
        } catch (err) {
          console.error("Error loading discount levels:", err);
        }
      };
      loadDiscountLevels();
      const loadCustomers = async () => {
        try {
          setLoading((prev) => ({ ...prev, customers: true }));
          const data = await fetchCustomersService();
          if (!active) return;
          const normalized = Array.isArray(data)
            ? data.map((c) => {
                const address =
                  c.address || c.customer_address || c.location || c.city || "";
                const telephone =
                  c.phone ||
                  c.telephone ||
                  c.phone_number ||
                  c.contact_number ||
                  c.mobile ||
                  "";
                return {
                  id: c.id ?? c.customer_id ?? c.email ?? c.name,
                  name:
                    c.name ??
                    c.customer_name ??
                    `${c.first_name || ""} ${c.last_name || ""}`.trim(),
                  email: c.email ?? c.contact_email ?? "",
                  address,
                  telephone,
                };
              })
            : [];
          setCustomers(
            normalized.filter((c) => c.name && c.id)
          );
        } catch (error) {
          console.error("Error fetching customers:", error);
        } finally {
          if (active) {
            setLoading((prev) => ({ ...prev, customers: false }));
          }
        }
      };
      loadCustomers();
      return () => {
        active = false;
      };
    }, []);

    // Helper: derive a discount input string (e.g. "10%" or "50") from a level object
    const computeDiscountInputFromLevel = (level) => {
      if (!level) return "";
      const raw =
        level.percentage ?? level.percent ?? level.rate ?? level.value ?? level.amount ?? level.discount ?? null;
      if (raw == null) return "";
      if (typeof raw === "number") {
        // treat 0-100 as percentage
        if (raw > 0 && raw <= 100) return `${raw}%`;
        return String(raw);
      }
      const s = String(raw).trim();
      if (!s) return "";
      return s;
    };

    const onDiscountLevelChange = (e) => {
      const id = String(e.target.value || "");
      if (!id) {
        setSelectedDiscountLevel(null);
        // clear discounts on rows
        setItems((prev) => prev.map((it) => ({ ...it, discountEnabled: false, discountInput: "" })));
        return;
      }
      const lev = discountLevels.find((l) => String(l.id) === id) || null;
      setSelectedDiscountLevel(lev);
      const input = computeDiscountInputFromLevel(lev);
      if (lev) {
        setItems((prev) => prev.map((it) => ({ ...it, discountEnabled: true, discountInput: input })));
      }
    };

    useEffect(() => {
      let active = true;
      const loadCenters = async () => {
        try {
          setLoading((prev) => ({ ...prev, centers: true }));
          const data = await fetchCentersService();
          if (!active) return;
          const normalized = Array.isArray(data)
            ? data.map((c) => ({
                id: c.id ?? c.center_id ?? c.value ?? c.name,
                name:
                  c.name ??
                  c.center_name ??
                  c.title ??
                  c.value ??
                  String(c.name || ""),
              }))
            : [];
          if (normalized.length) {
            setCenters(normalized.filter((c) => c.id && c.name));
          }
        } catch (error) {
          console.error("Error fetching centers:", error);
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
      const loadInventory = async () => {
        try {
          setLoading((prev) => ({ ...prev, products: true }));
          const data = await fetchInventoryDetails();
          if (!active) return;
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : [];
          setInventoryDetails(list);
        } catch (error) {
          console.error("Error fetching inventory details:", error);
          if (active) setInventoryDetails([]);
        } finally {
          if (active) {
            setLoading((prev) => ({ ...prev, products: false }));
          }
        }
      };
      loadInventory();
      return () => {
        active = false;
      };
    }, []);

    useEffect(() => {
      const centerId = String(selectedCenterId || "").trim();
      if (!centerId) {
        setProducts([]);
        return;
      }

      const flattened = inventoryDetails.flatMap((product) => {
        const centerStocks = Array.isArray(product.inventory)
          ? product.inventory
          : [];
        return centerStocks
          .filter((stock) => String(stock.center?.id) === centerId)
          .map((stock) => {
            const availableQty = Number(
              stock.available_quantity ??
                stock.availableQuantity ??
                stock.available_qty ??
                stock.availableQty ??
                stock.qty ??
                0
            );
            const productId =
              product.id ?? product.product_id ?? stock.product_id;
            const inventoryStockId =
              stock.inventory_stock_id ?? `${productId}-${centerId}`;

            return {
              id: `${inventoryStockId}`,
              productId,
              name: product.name ?? product.product_name ?? "Unnamed product",
              sku: product.code ?? product.sku ?? product.barcode ?? "",
              unitPrice: Number(
                product.cost ?? product.min_price ?? product.price ?? 0
              ),
              min_price: Number(
                product.min_price ?? product.minPrice ?? product.cost ?? 0
              ),
              mrp: Number(
                product.mrp ?? product.price ?? product.min_price ?? 0
              ),
              currentstock: availableQty,
              availableQty,
              centerId: stock.center?.id ?? null,
              centerName: stock.center?.name ?? "",
              inventoryStockId,
              batchNumber: stock.batch_number ?? stock.batchNumber ?? null,
            };
          });
      });

      setProducts(flattened);
    }, [selectedCenterId, inventoryDetails]);

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

    // Build customer options from inventory service customers
    const customerOptions = useMemo(() => {
      return customers.filter((c) => c.id && c.name);
    }, [customers]);

    // (e.g. "10%") are applied against the unit price.
    const parseDiscount = (input, unitPrice, qty) => {
      const s = String(input || "").trim();
      if (!s) return 0;
      if (s.endsWith("%")) {
        const pct = parseFloat(s.slice(0, -1));
        if (!isFinite(pct) || pct <= 0) return 0;
        const perUnit = (unitPrice * pct) / 100;
        return Math.min(unitPrice * qty, perUnit * qty);
      }
      const perUnit = parseFloat(s);
      if (!isFinite(perUnit) || perUnit <= 0) return 0;
      return Math.min(unitPrice * qty, perUnit * qty);
    };

    const hasBatchColumn = useMemo(() => {
      return items.some((it) => {
        const val = it.batchNumber ?? it.batch_number ?? "";
        return String(val || "").trim().length > 0;
      });
    }, [items]);

    
    // per-unit when numeric; total discount = qty * perUnitDiscount)
    const { subtotal, discountTotal } = useMemo(() => {
      let sub = 0;
      let disc = 0;
      for (const it of items) {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.unitPrice) || 0;
        const gross = qty * price;
        const dAmt = it.discountEnabled
          ? parseDiscount(it.discountInput, price, qty)
          : 0;
        disc += dAmt;
        sub += Math.max(0, gross - dAmt);
      }
      return { subtotal: sub, discountTotal: disc };
    }, [items]);

    const totalAmount = useMemo(() => Math.max(0, subtotal), [subtotal]);

    //*error messages
    const validate = () => {
      const e = {};
      if (!form.orderNumber) e.orderNumber = "SO number not generated";
      if (!form.center.trim()) e.center = "Center is required";
      if (!form.customer?.trim()) e.customer = "Customer is required";
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
        ? Number(selected.unitPrice) || 0
        : Number(entry.unitPrice) || 0;
      const currentStock = selected
        ? Number(selected.availableQty ?? selected.currentstock ?? 0) || 0
        : 0;
      const mrp = selected ? Number(selected.mrp) || 0 : 0;
      const batchNumber = selected?.batchNumber
        ? String(selected.batchNumber).trim()
        : "";
      const e = {};
      if (!selectedCenterId) e.center = "Select a center first";
      if (!name) e.productName = "Product name is required";
      if (unitPrice < 0) e.unitPrice = "Unit price cannot be negative";
      if (selected && qty > currentStock) {
        e.quantity = `Only ${currentStock} units available at this center`;
      }
      setErrors((prev) => ({ ...prev, ...e }));
      if (Object.keys(e).length) return;
      const defaultDiscountInput = selectedDiscountLevel
        ? computeDiscountInputFromLevel(selectedDiscountLevel)
        : "";
      const defaultDiscountEnabled = !!selectedDiscountLevel;
      setItems((prev) => [
        ...prev,
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          productId: selected ? selected.productId ?? selected.id : undefined,
          inventoryStockId: selected?.inventoryStockId ?? null,
          productName: name,
          quantity: qty,
          unitPrice: Math.max(0, unitPrice),
          currentStock,
          mrp,
          batchNumber: batchNumber || null,
              min_price: selected
                ? Number(selected.min_price ?? selected.minPrice ?? 0)
                : 0,
          discountEnabled: defaultDiscountEnabled,
          discountInput: defaultDiscountInput,
        },
      ]);
      setEntry({
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
        batchNumber: "",
      });
    };

    const updateItem = (id, field, rawValue) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          if (field === "discountInput") {
            return { ...it, discountInput: String(rawValue || "") };
          }
          const num =
            typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;
          if (field === "quantity") {
            const safeQty = Math.max(1, Math.floor(num));
            const capped = it.currentStock
              ? Math.min(safeQty, Number(it.currentStock))
              : safeQty;
            return { ...it, quantity: capped };
          }
          if (field === "unitPrice") {
            return { ...it, unitPrice: Math.max(0, num) };
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
      setIsSubmitting(true);
      try {
        const payload = {
          ...form,
          createdById,
          created_by_id: createdById,
          status: form.status || "pending",
          centerId: selectedCenterId || null,
          center_id: selectedCenterId || null,
          // include selected discount level id for backend
          discountLevelId: selectedDiscountLevel?.id ?? null,
          discount_level_id: selectedDiscountLevel?.id ?? null,
            items: items.map((it) => {
            const qty = Number(it.quantity) || 0;
            const price = Number(it.unitPrice) || 0;
            const gross = qty * price;
            const dAmt = it.discountEnabled
              ? parseDiscount(it.discountInput, price, qty)
              : 0;
            const normalizedBatch = it.batchNumber ?? it.batch_number ?? null;
            return {
              ...it,
              batchNumber: normalizedBatch,
              batch_number: normalizedBatch,
                min_price:
                  Number(it.min_price ?? it.minPrice ?? it.unitPrice ?? 0),
              lineGross: gross,
              lineDiscountInput: it.discountInput || "",
              lineDiscountAmount: dAmt,
              lineNet: Math.max(0, gross - dAmt),
            };
          }),
          subtotal,
          discountTotal,
          totalAmount,
        };
        console.log("Sales order payload:", payload);
        const response = await salesOrder(payload);
        const created = response?.data ?? response ?? payload;
        setOrders((prev) => [...prev, created]);
        // Show success toast
        const createdNumber =
          created?.orderNumber || created?.order_number || nextSONumber;
        setSuccessText(`Sales order ${createdNumber} created successfully.`);
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
        const discountLevelLabel =
          selectedDiscountLevel?.name ||
          selectedDiscountLevel?.label ||
          selectedDiscountLevel?.title ||
          (selectedDiscountLevel?.percentage
            ? `${selectedDiscountLevel.percentage}%`
            : null) ||
          "No discount";
        const customerAddress = form.customerAddress || form.address || "";
        const customerTelephone =
          form.customerTelephone || form.telephone || form.phone || "";
        const orderSnapshot = {
          ...payload,
          orderNumber: createdNumber,
          orderDate: form.date,
          center: form.center,
          customer: form.customer,
          refNumber: form.refNumber,
          status: form.status || "pending",
          items: itemsSnapshot,
          discountLevelLabel,
          discountLevelId: selectedDiscountLevel?.id ?? null,
          customerAddress,
          customerTelephone,
          orderName: "Sales Order",
          orderLabel: "Sales Order",
          currencyFormat: (value) => formatLKR(value),
        };
        setRecentOrderDetails(orderSnapshot);
        setShowSuccess(true);
        // Refresh next SO number from server (preferred). If that fails, fall back to incrementing the created number.
        try {
          await refreshNextSalesOrder();
        } catch {
          const m = String(createdNumber).match(/^SO-?(\d+)$/i);
          if (m) {
            const nextNum = Number(m[1]) + 1;
            setNextSONumber(`SO-${String(nextNum).padStart(4, "0")}`);
          } else {
            setNextSONumber((prev) => incrementSoCode(prev));
          }
        }
        // Reset
        setForm({
          orderNumber: "",
          center: "",
          customerId: "",
          customer: "",
          customerAddress: "",
          customerTelephone: "",
          date: new Date().toISOString().split("T")[0],
          status: "pending",
          refNumber: "",
        });
        setSelectedCenterId("");
        setItems([]);
        setEntry({
          productId: "",
          productName: "",
          quantity: 1,
          unitPrice: 0,
          batchNumber: "",
        });
        setErrors({});
        loadOrders();
      } catch (error) {
        console.error("Error creating sales order:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <>
        <div className="bg-slate-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase">
                Sales Order Management
              </h1>
              <div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">
                Order ID: {nextLoading ? "Loading..." : nextSONumber || "—"}
              </div>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">
                Efficiently manage and track your sales orders across centers
              </p>
            </div>
          </div>
        </div>
        {/* No inline message when using popup */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-6 mb-6 sm:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Order Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, date: e.target.value }))
                    }
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.date
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                    }`}
                  />
                  {errors.date && (
                    <p className="text-red-600 text-sm mt-1 font-medium">
                      {errors.date}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Center *
                  </label>
                  <select
                    value={selectedCenterId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedCenterId(value);
                      const centerMeta = centers.find(
                        (c) => String(c.id) === value
                      );
                      setForm((p) => ({
                        ...p,
                        center: centerMeta?.name || "",
                      }));
                    }}
                    disabled={loading.centers}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.center
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                    } ${
                      loading.centers ? "opacity-60 cursor-not-allowed" : ""
                    }`}
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
                    <p className="text-red-600 text-sm mt-1 font-medium">
                      {errors.center}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Customer Information *
                  </label>
                  <select
                    value={form.customerId}
                    onChange={(e) => {
                      const value = e.target.value;
                      const selectedCustomer = customerOptions.find(
                        (c) => String(c.id) === value
                      );
                      setForm((p) => ({
                        ...p,
                        customerId: value,
                        customer: selectedCustomer?.name || "",
                        customerAddress: selectedCustomer?.address || "",
                        customerTelephone: selectedCustomer?.telephone || "",
                      }));
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.customer
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                    }`}
                  >
                    <option value="">Select customer</option>
                    {customerOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {form.customerAddress || form.customerTelephone ? (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-600">
                      {form.customerAddress && (
                        <p>
                          <span className="font-semibold text-slate-700">Address:</span> {form.customerAddress}
                        </p>
                      )}
                      {form.customerTelephone && (
                        <p className="mt-1">
                          <span className="font-semibold text-slate-700">Telephone:</span> {form.customerTelephone}
                        </p>
                      )}
                    </div>
                  ) : null}
                  {errors.customer && (
                    <p className="text-red-600 text-sm mt-1 font-medium">
                      {errors.customer}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={form.refNumber}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, refNumber: e.target.value }))
                    }
                    placeholder="Enter reference number"
                    className="w-full px-4 py-3 border-2 border-slate-300 bg-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors"
                  />
                </div>
                <div className="lg:place-self-end pr-65 text-center bg-slate-100 rounded-lg p-4 border border-slate-200">
                  <p className="text-lg font-semibold text-slate-700">
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatLKR(totalAmount)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Discount: {formatLKR(discountTotal)}
                  </p>
                </div>
              </div>

              {/* Discount level selector */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Discount Level
                </label>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedDiscountLevel?.id ?? ""}
                    onChange={onDiscountLevelChange}
                    className="px-4 py-3 border-2 border-slate-300 bg-slate-50 transition-colors w-80 rounded-lg "
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

              {/* Items entry section */}

              <div className="mb-6 sm:mb-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-4">
                  Add Items
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
                              batchNumber: p.batchNumber
                                ? String(p.batchNumber)
                                : "",
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
                          // Delay hiding to allow click selection
                          setTimeout(() => setShowSuggestions(false), 150);
                        }}
                        disabled={!selectedCenterId || loading.products}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.productName
                            ? "border-red-300 bg-red-50"
                            : "border-slate-300 bg-white hover:border-slate-400"
                        } ${
                          !selectedCenterId || loading.products
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }`}
                        placeholder={
                          !selectedCenterId
                            ? "Select a center first"
                            : loading.products
                            ? "Loading products…"
                            : "Search product by name or SKU"
                        }
                      />
                      {showSuggestions &&
                        selectedCenterId &&
                        filteredProducts.length > 0 && (
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
                                    batchNumber: p.batchNumber
                                      ? String(p.batchNumber)
                                      : "",
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
                                  LKR {Number(p.unitPrice || 0).toFixed(2)} •
                                  MRP {Number(p.mrp || 0).toFixed(2)}
                                  <br />
                                  Stock{" "}
                                  {Number(
                                    p.availableQty ?? p.currentstock ?? 0
                                  )}{" "}
                                  units
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
                  </div>

                  {/* Add Item Button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!selectedCenterId || loading.products}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <table className="min-w-[880px] w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              No
                            </th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Product Name
                            </th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Current Stock
                            </th>
                            {hasBatchColumn && (
                              <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Batch Number
                              </th>
                            )}
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
                            const rowDiscount = it.discountEnabled
                              ? parseDiscount(it.discountInput, rowPrice, rowQty)
                              : 0;
                            const rowTotal = Math.max(0, rowGross - rowDiscount);  //total amount section
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
                                <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
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
                                    className="w-28 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
                                  />
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 whitespace-nowrap font-medium">
                                  {it.currentStock}
                                </td>
                                {hasBatchColumn && (
                                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 whitespace-nowrap font-medium">
                                    {String(
                                      it.batchNumber ?? it.batch_number ?? ""
                                    ).trim() || "—"}
                                  </td>
                                )}
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
                                    disabled={!it.discountEnabled}
                                    title={
                                      !it.discountEnabled
                                        ? "Enable discount in this row to edit"
                                        : undefined
                                    }
                                    placeholder="0 or 10%"
                                    className={`w-24 px-3 py-2 border-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 ${
                                      !it.discountEnabled
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                                        : "border-slate-300 bg-slate-50 hover:bg-white"
                                    }`}
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
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-3 shadow-lg w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Create Sales Order
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
        <section aria-label="Create new sales order">
          <InlinePOForm nextSONumber={nextSONumber} createdById={createdById} />
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
              Creating sales order…
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
          aria-label="Sales order finalized"
        >
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Success</p>
                  <p className="text-sm text-slate-600">{successText || "Sales order created successfully."}</p>
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
              <SuccessPdfView orderData={recentOrderDetails} />
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

export default SalesOrder;
