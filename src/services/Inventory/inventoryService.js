// inventoryService.js - Static data and functions for Inventory module

// This service centralizes all Inventory-related dummy data and operations.
// Pages: GRN, PurchaseOrder, PurchaseReturn, SalesReturn, StockTransfer, StockVerification, Invoices (if inventory invoices)

import axios from '../../utils/axios';

const inventoryData = {
  centers: [
    "Main Center",
    "Branch A",
    "Branch B",
    "Warehouse 01",
  ],
  // Simple product catalog used by Purchase Orders and other inventory pages
  products: [
    {
      id: "1",
      name: "Laptop 15" ,
      sku: "LAP-15",
      unit: "pcs",
      unitPrice: 1200,
      mrp: 1400,
      currentstock: "50"
    },
    {
      id: "2",
      name: "Wireless Mouse",
      sku: "MOU-WLS",
      unit: "pcs",
      unitPrice: 25,
      mrp: 35,
      currentstock: "30"
    },
    {
      id: "3",
      name: "Mechanical Keyboard",
      sku: "KEY-MECH",
      unit: "pcs",
      unitPrice: 50,
      mrp: 70,
      currentstock: "20"
    },
    {
      id: "4",
      name: "24\" Monitor",
      sku: "MON-24FHD",
      unit: "pcs",
      unitPrice: 180,
      mrp: 220,
      currentstock: "15",
    },
  ],

  // Suppliers used by GRN and Purchase Orders
  suppliers: [
    { id: "SUP-0001", name: "Tech Supplies Ltd" },
    { id: "SUP-0002", name: "Office Equipment Co" },
    { id: "SUP-0003", name: "Global Components Pvt" },
    { id: "SUP-0004", name: "Sri Lanka Trading Co" },
  ],


  invoices: [
    // Mirror structure used by Invoices page
    {
      id: "INV-0001",
      customer: "Acme Corporation",
      customerEmail: "billing@acme.com",
      amount: 5420.0,
      date: "2024-01-15",
      dueDate: "2024-02-15",
      status: "paid",
      items: [
        { description: "Web Development Services", quantity: 1, rate: 5000, amount: 5000 },
        { description: "Domain & Hosting", quantity: 1, rate: 420, amount: 420 },
      ],
    },
    {
      id: "INV-0002",
      customer: "Tech Solutions Ltd",
      customerEmail: "accounts@techsolutions.com",
      amount: 8750.0,
      date: "2024-01-18",
      dueDate: "2024-02-18",
      status: "pending",
      items: [
        { description: "Software Development", quantity: 1, rate: 8000, amount: 8000 },
        { description: "Project Management", quantity: 1, rate: 750, amount: 750 },
      ],
    },
    {
      id: "INV-0003",
      customer: "Global Enterprises",
      customerEmail: "finance@global.com",
      amount: 3200.0,
      date: "2024-01-20",
      dueDate: "2024-02-05",
      status: "overdue",
      items: [{ description: "Consulting Services", quantity: 40, rate: 80, amount: 3200 }],
    },
  ],
  purchaseOrders: [
    {
      id: 1,
      orderNumber: "PO-0001",
      supplier: "Tech Supplies Ltd",
      center: "Main Center",
      refNumber: "REF-PO-0001",
      date: "2024-01-10",
      status: "Received",
      items: [
        { productName: "Laptop", quantity: 10, unitPrice: 1000, total: 10000 },
        { productName: "Mouse", quantity: 20, unitPrice: 20, total: 400 },
      ],
      subtotal: 10400,
      tax: 1040,
      totalAmount: 11440,
    },
    {
      id: 2,
      orderNumber: "PO-0002",
      supplier: "Office Equipment Co",
      center: "Branch A",
      refNumber: "REF-PO-0002",
      date: "2024-01-15",
      status: "Partial",
      items: [
        { productName: "Desktop PC", quantity: 5, unitPrice: 750, total: 3750 },
        { productName: "Keyboard", quantity: 5, unitPrice: 50, total: 250 },
      ],
      subtotal: 4000,
      tax: 400,
      totalAmount: 4400,
    },
  ],
  grn: [
    {
      id: 1,
      grnNumber: "GRN001",
      supplier: "Tech Supplies Ltd",
      purchaseOrder: "PO-0001",
      receivedDate: "2024-01-12",
      status: "Received",
      items: [
        { productName: "Laptop", orderedQty: 10, receivedQty: 10, unitPrice: 1000, total: 10000 },
        { productName: "Mouse", orderedQty: 20, receivedQty: 18, unitPrice: 20, total: 360 },
      ],
      totalAmount: 10360,
      remarks: "2 mice missing from shipment",
    },
    {
      id: 2,
      grnNumber: "GRN002",
      supplier: "Office Equipment Co",
      purchaseOrder: "PO-0002",
      receivedDate: "2024-01-18",
      status: "Partial",
      items: [
        { productName: "Desktop PC", orderedQty: 5, receivedQty: 3, unitPrice: 750, total: 2250 },
        { productName: "Keyboard", orderedQty: 5, receivedQty: 5, unitPrice: 50, total: 250 },
      ],
      totalAmount: 2500,
      remarks: "Remaining 2 PCs to be delivered next week",
    },
  ],
  purchaseReturns: [
    {
      id: 1,
      returnNumber: "PR001",
      supplier: "Tech Supplies Ltd",
      originalGRN: "GRN001",
      date: "2024-01-16",
      reason: "Damaged in transit",
      status: "Approved",
      items: [{ productName: "Laptop", quantity: 1, unitPrice: 1000, total: 1000 }],
      totalAmount: 1000,
    },
  ],
  salesReturns: [
    {
      id: 1,
      returnNumber: "SR001",
      customer: "ABC Company",
      originalInvoice: "INV-0001",
      date: "2024-01-25",
      reason: "Defective product",
      status: "Approved",
      items: [{ productName: "Laptop", quantity: 1, unitPrice: 1200, total: 1200 }],
      subtotal: 1200,
      tax: 120,
      totalAmount: 1320,
    },
  ],
  stockTransfers: [],
  stockVerifications: [
    {
      id: 1,
      verificationNumber: "SV001",
      location: "Main Warehouse",
      date: "2024-01-30",
      status: "Completed",
      verifiedBy: "Sarah Wilson",
      items: [
        {
          productName: "Laptop",
          systemQty: 25,
          physicalQty: 24,
          variance: -1,
          unitPrice: 1200,
          varianceValue: -1200,
        },
        {
          productName: "Mouse",
          systemQty: 50,
          physicalQty: 52,
          variance: 2,
          unitPrice: 25,
          varianceValue: 50,
        },
      ],
      totalVarianceValue: -1150,
      remarks: "Annual stock audit - minor discrepancies found",
    },
  ],
};

// Load persisted stockTransfers from localStorage if available
try {
  const saved = localStorage.getItem("inventory_stockTransfers");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      inventoryData.stockTransfers = parsed;
    }
  }
} catch {
  // ignore localStorage errors
}

// Getter functions
export const getInvoiceData = () => inventoryData.invoices;
export const getPurchaseOrders = () => inventoryData.purchaseOrders;
export const getGRN = () => inventoryData.grn;
export const getPurchaseReturns = () => inventoryData.purchaseReturns;
export const getSalesReturns = () => inventoryData.salesReturns;
export const getStockTransfers = () => inventoryData.stockTransfers;
export const getStockVerifications = () => inventoryData.stockVerifications;
export const getCenters = () => inventoryData.centers;
export const getProducts = () => inventoryData.products;
export const getCustomers = async () => {
  try {
    const response = await axios.get('/customers');
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};
export const getSuppliers = () => inventoryData.suppliers;

// Mutations: create/update/delete with simple in-memory logic
export const addInvoice = (invoice) => {
  const newInvoice = {
    ...invoice,
    id: `INV-${String(inventoryData.invoices.length + 1).padStart(4, "0")}`,
  };
  inventoryData.invoices.push(newInvoice);
  return newInvoice;
};

export const updateInvoice = (id, updated) => {
  const idx = inventoryData.invoices.findIndex((i) => i.id === id);
  if (idx !== -1) {
    inventoryData.invoices[idx] = { ...inventoryData.invoices[idx], ...updated };
    return inventoryData.invoices[idx];
  }
  return null;
};

export const deleteInvoice = (id) => {
  const idx = inventoryData.invoices.findIndex((i) => i.id === id);
  if (idx !== -1) {
    return inventoryData.invoices.splice(idx, 1)[0];
  }
  return null;
};

export const addPurchaseOrder = (order) => {
  const newOrder = {
    ...order,
    id: Date.now(),
    orderNumber: `PO-${String(inventoryData.purchaseOrders.length + 1).padStart(4, "0")}`,
  };
  inventoryData.purchaseOrders.push(newOrder);
  return newOrder;
};

export const updatePurchaseOrder = (id, updated) => {
  const idx = inventoryData.purchaseOrders.findIndex((o) => o.id === id);
  if (idx !== -1) {
    inventoryData.purchaseOrders[idx] = { ...inventoryData.purchaseOrders[idx], ...updated };
    return inventoryData.purchaseOrders[idx];
  }
  return null;
};

export const addGRN = (grn) => {
  const newGrn = {
    ...grn,
    id: Date.now(),
    grnNumber: `GRN${String(inventoryData.grn.length + 1).padStart(3, "0")}`,
  };
  inventoryData.grn.push(newGrn);
  return newGrn;
};

export const addPurchaseReturn = (ret) => {
  const newReturn = {
    ...ret,
    id: Date.now(),
    returnNumber: `PR${String(inventoryData.purchaseReturns.length + 1).padStart(3, "0")}`,
  };
  inventoryData.purchaseReturns.push(newReturn);
  return newReturn;
};

export const addSalesReturn = (ret) => {
  const newReturn = {
    ...ret,
    id: Date.now(),
    returnNumber: `SR${String(inventoryData.salesReturns.length + 1).padStart(3, "0")}`,
  };
  inventoryData.salesReturns.push(newReturn);
  return newReturn;
};

export const addStockTransfer = (transfer) => {
  // Determine next sequence by scanning existing ST ids to avoid collisions
  const nums = inventoryData.stockTransfers
    .map((t) => {
      const m = String(t.id || "").match(/^ST-(\d{4})$/i);
      return m ? parseInt(m[1], 10) : null;
    })
    .filter((n) => n !== null);
  const nextSeq = nums.length ? Math.max(...nums) + 1 : 1;
  const stId = `ST-${String(nextSeq).padStart(4, "0")}`;
  const newTransfer = {
    ...transfer,
    id: stId,
    transferNumber: stId,
  };
  inventoryData.stockTransfers.push(newTransfer);
  try { localStorage.setItem("inventory_stockTransfers", JSON.stringify(inventoryData.stockTransfers)); } catch { /* ignore */ }
  return newTransfer;
};

export const updateStockTransfer = (id, updated) => {
  const idx = inventoryData.stockTransfers.findIndex((t) => t.id === id);
  if (idx !== -1) {
    inventoryData.stockTransfers[idx] = { ...inventoryData.stockTransfers[idx], ...updated };
  try { localStorage.setItem("inventory_stockTransfers", JSON.stringify(inventoryData.stockTransfers)); } catch { /* ignore */ }
    return inventoryData.stockTransfers[idx];
  }
  return null;
};

export const addStockVerification = (verification) => {
  // Determine next STV sequence by scanning existing verification numbers
  const nums = inventoryData.stockVerifications
    .map((v) => {
      const m = String(v.verificationNumber || v.id || "").match(/^STV-(\d{4})$/i);
      return m ? parseInt(m[1], 10) : null;
    })
    .filter((n) => n !== null);
  const nextSeq = nums.length ? Math.max(...nums) + 1 : 1;
  const stv = `STV-${String(nextSeq).padStart(4, "0")}`;
  const newVerification = {
    ...verification,
    id: stv,
    verificationNumber: stv,
  };
  inventoryData.stockVerifications.push(newVerification);
  try { localStorage.setItem('inventory_stockVerifications', JSON.stringify(inventoryData.stockVerifications)); } catch { /* ignore */ }
  return newVerification;
};

export const updateStockVerification = (id, updated) => {
  const idx = inventoryData.stockVerifications.findIndex((v) => v.id === id);
  if (idx !== -1) {
    inventoryData.stockVerifications[idx] = { ...inventoryData.stockVerifications[idx], ...updated };
    return inventoryData.stockVerifications[idx];
  }
  return null;
};

export default {
  // getters
  getInvoiceData,
  getPurchaseOrders,
  getGRN,
  getPurchaseReturns,
  getSalesReturns,
  getStockTransfers,
  getStockVerifications,
  getCenters,
  getProducts,
  getCustomers,
  getSuppliers,
  // mutations
  addInvoice,
  updateInvoice,
  deleteInvoice,
  addPurchaseOrder,
  updatePurchaseOrder,
  addGRN,
  addPurchaseReturn,
  addSalesReturn,
  addStockTransfer,
  updateStockTransfer,
  addStockVerification,
  updateStockVerification,
};
