// inventoryService.js - Static data and functions for Inventory module

// This service centralizes all Inventory-related dummy data and operations.
// Pages: GRN, PurchaseOrder, PurchaseReturn, SalesReturn, StockTransfer, StockVerification, Invoices (if inventory invoices)

import axios from '../../utils/axios';

const inventoryData = {
  
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
export const getPurchaseOrders = () => inventoryData.purchaseOrders;
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

// GRN API post functions
export const createGRN = async (grnData) => {
  try {
    const response = await axios.post('/grn', grnData);
    return response.data;
  } catch (error) {
    console.error('Error creating GRN:', error);
    throw error;
  }
};

// INV API post functions
export const createINV = async (invData) => {
  try {
    const response = await axios.post('/invoices', invData);
    return response.data;
  } catch (error) {
    console.error('Error creating INV:', error);
    throw error;
  }
};

//salesOrder post API post functions
export const salesOrder = async (soData) => {
  try {
    const response = await axios.post('/salesOrder', soData);
    return response.data;
  } catch (error) {
    console.error('Error creating Sales Order:', error);
    throw error;
  }
};

//salesReturn API post functions
export const createSalesReturn = async (data) => {
  try {
    const response = await axios.post('/salesreturn', data);
    return response.data;
  } catch (error) {
    console.error('Error creating sales return:', error);
    throw error;
  }
};

//Stock Transfer API post functions
export const createStockTransfer = async (data) => {
  try {
    const response = await axios.post('/stock-transfer', data);
    return response.data;
  } catch (error) {
    console.error('Error creating stock transfer:', error);
    throw error;
  }
};

//for fetching sales orders
export const fetchSalesOrders = async (soData) => {
  try {               
    const response = await axios.get('/salesOrder', soData);
    return response.data;
  }
  catch (error) {
    console.error('Error fetching Sales Orders:', error);
    throw error;
  } 
};

// Fetch invoices with optional filters
export const fetchInvoices = async (config) => {
  try {
    const response = await axios.get('/invoices', config);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

//fetch stock transfer with optional filters
export const fetchStockTransfers = async (config) => {
  try {
    const response = await axios.get('/inventory-stocks/all', config);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock transfers:', error);
    throw error;
  } 
};

// Fetch next auto-generated GRN number (preview only)
export const getNextGrn = async () => {
  try {
    const response = await axios.get('/grn/next');
    return response.data; // { data: { next, year, sequence } }
  } catch (error) {
    console.error('Error fetching next GRN number:', error);
    throw error;
  }
};

//fetch next auto-Generate INV number (Preview only)
export const getNextInv = async () => {
  try {
    const response = await axios.get('/invoices/next');
    return response.data; // { data: { next, year, sequence } }
  } catch (error) {
    console.error('Error fetching next INV number:', error);
    throw error;
  }
};

//fetch next auto-Generate Sales Order number (Preview only)
export const getNextSalesOrder = async () => {
  try {
    // Backend route uses '/salesOrder/next' (singular camel-case)
    const response = await axios.get('/salesOrder/next');
    return response.data; // { data: { next, year, sequence } }
  } catch (error) {
    console.error('Error fetching next Sales Order number:', error);
    throw error;
  }
};

//fetch next auto-Generate Sales return number (Preview only)
export const getNextSalesReturn = async () => {
  // Try multiple common endpoint variants to be tolerant of backend naming
  const candidates = ['/salesreturn/next', '/salesReturn/next', '/sales-return/next', '/sales-return/next'];
  for (const url of candidates) {
    try {
      const response = await axios.get(url);
      return response.data; // expected shapes: string or { data: { next, year, sequence } }
    } catch (err) {
      // If 404, try next candidate; otherwise log and continue
      const status = err?.response?.status;
      if (status && status !== 404) {
        console.warn(`getNextSalesReturn: request to ${url} failed with status ${status}`, err?.message || err);
      }
      
    }
  }
 
  return null;
};

// fetch next auto-generated Stock Transfer number (Preview only)
export const getNextStockTransfer = async () => {
  try {
    const response = await axios.get('/stock-transfer/next');
    return response.data; // expected shapes: string or { data: { next, year, sequence } }
  } catch (error) {
    console.error('Error fetching next Stock Transfer number:', error);
    throw error;
  }
};


//fetch next auto-generated purchase order number (Preview only)
export const getNextPurchaseOrder = async () => {
  try {
    const response = await axios.get('/purchaseOrder/next');
    return response.data; // { data: { next, year, sequence } }
  }catch (error) {
    console.error('Error fetching next Purchase Order number:', error);
    throw error;
  }
};


// Mutation functions
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
  getPurchaseOrders,
  getPurchaseReturns,
  getSalesReturns,
  getStockTransfers,
  getStockVerifications,
  getCenters,
  getProducts,
  getCustomers,
  getSuppliers,
  // mutations
  addPurchaseOrder,
  updatePurchaseOrder,
  addPurchaseReturn,
  addSalesReturn,
  addStockTransfer,
  updateStockTransfer,
  addStockVerification,
  updateStockVerification,
  // GRN
  createGRN,
  getNextGrn,
  // INV
  createINV,
  getNextInv,
  // Sales Order
  getNextSalesOrder,
  createSalesReturn,
  getNextSalesReturn,
  getNextStockTransfer,
  fetchSalesOrders,
  fetchInvoices,
  salesOrder,
  createStockTransfer,
  fetchStockTransfers
};
