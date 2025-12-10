
import axios from "../../utils/axios";
const inventoryData = {
  purchaseOrders: [
  ],

  purchaseReturns: [
   
  ],
  salesReturns: [
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
    const response = await axios.get("/customers");
    return response.data;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
};
export const getSuppliers = () => inventoryData.suppliers;

// GRN API post functions
export const createGRN = async (grnData) => {
  try {
    const response = await axios.post("/grn", grnData);
    return response.data;
  } catch (error) {
    console.error("Error creating GRN:", error);
    throw error;
  }
};

// INV API post functions
export const createINV = async (invData) => {
  try {
    const response = await axios.post("/invoices", invData);
    return response.data;
  } catch (error) {
    console.error("Error creating INV:", error);
    throw error;
  }
};

//salesOrder post API post functions
export const salesOrder = async (soData) => {
  try {
    const response = await axios.post("/salesOrder", soData);
    return response.data;
  } catch (error) {
    console.error("Error creating Sales Order:", error);
    throw error;
  }
};

//salesReturn API post functions
export const createSalesReturn = async (data) => {
  try {
    const response = await axios.post("/salesreturn", data);
    return response.data;
  } catch (error) {
    console.error("Error creating sales return:", error);
    throw error;
  }
};

//Stock Transfer API post functions
export const createStockTransfer = async (data) => {
  try {
    const response = await axios.post("/stock-transfer", data);
    return response.data;
  } catch (error) {
    console.error("Error creating stock transfer:", error);
    throw error;
  }
};

//Purchaseorder API post functions
export const createPurchaseOrder = async (data) => {
  try {
    const response = await axios.post("/purchaseOrder", data);
    return response.data;
  } catch (error) {
    console.error("Error creating Purchase Order:", error);
    throw error;
  }
};

//PurchaseReturn API post functions
export const createPurchaseReturn = async (data) => {
  try {
    const response = await axios.post("/purchaseReturn", data);
    return response.data;
  }
  catch (error) {
    console.error("Error creating Purchase Return:", error);
    throw error;
  }
};

//for fetching sales orders
export const fetchSalesOrders = async (soData) => {
  try {
    const response = await axios.get("/salesOrder", soData);
    return response.data;
  } catch (error) {
    console.error("Error fetching Sales Orders:", error);
    throw error;
  }
};

// Fetch invoices with optional filters
export const fetchInvoices = async (config) => {
  try {
    const response = await axios.get("/invoices", config);
    return response.data;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

//fetch purchaseOrder with optional filters
export const fetchPurchaseOrders = async (config) => {
  try {
    const response = await axios.get("/purchaseOrder", config);
    return response.data;
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    throw error;
  }
};

//fetch pending Sales return from backend
export const fetchPendingSalesReturns = async (config) => {
  try {
    const response = await axios.get("/salesreturn", config);
    return response.data;
  } 
  catch (error) {
    console.error("Error fetching pending sales returns:", error);
    throw error;
  }
};

//fetch stock transfer with optional filters
export const fetchStockTransfers = async (config) => {
  try {
    const response = await axios.get("/inventory-stocks/all", config);
    return response.data;
  } catch (error) {
    console.error("Error fetching stock transfers:", error);
    throw error;
  }
};

//fetch GRN with optional filters
export const fetchGRNs = async (config) => {
  try {
    const response = await axios.get("/grn", config);
    return response.data;
  }
  catch (error) {
    console.error("Error fetching GRNs:", error);
    throw error;
  } 
};

// Fetch next auto-generated GRN number (preview only)
export const getNextGrn = async () => {
  try {
    const response = await axios.get("/grn/next");
    return response.data; // { data: { next, year, sequence } }
  } catch (error) {
    console.error("Error fetching next GRN number:", error);
    throw error;
  }
};

//fetch next auto-Generate INV number (Preview only)
export const getNextInv = async () => {
  try {
    const response = await axios.get("/invoices/next");
    return response.data; // { data: { next, year, sequence } }
  } catch (error) {
    console.error("Error fetching next INV number:", error);
    throw error;
  }
};

//fetch next auto-Generate Sales Order number (Preview only)
export const getNextSalesOrder = async () => {
  try {
    // Backend route uses '/salesOrder/next' (singular camel-case)
    const response = await axios.get("/salesOrder/next");
    return response.data; // { data: { next, year, sequence } }
  } catch (error) {
    console.error("Error fetching next Sales Order number:", error);
    throw error;
  }
};

//fetch next auto-Generate Sales return number (Preview only)
export const getNextSalesReturn = async () => {
  // Try multiple common endpoint variants to be tolerant of backend naming
  const candidates = [
    "/salesreturn/next",
    "/salesReturn/next",
    "/sales-return/next",
    "/sales-return/next",
  ];
  for (const url of candidates) {
    try {
      const response = await axios.get(url);
      return response.data; // expected shapes: string or { data: { next, year, sequence } }
    } catch (err) {
      // If 404, try next candidate; otherwise log and continue
      const status = err?.response?.status;
      if (status && status !== 404) {
        console.warn(
          `getNextSalesReturn: request to ${url} failed with status ${status}`,
          err?.message || err
        );
      }
    }
  }

  return null;
};

// fetch next auto-generated Stock Transfer number (Preview only)
export const getNextStockTransfer = async () => {
  try {
    const response = await axios.get("/stock-transfer/next");
    return response.data; // expected shapes: string or { data: { next, year, sequence } }
  } catch (error) {
    console.error("Error fetching next Stock Transfer number:", error);
    throw error;
  }
};

//fetch next auto-generated purchase order number (Preview only)
export const getNextPurchaseOrder = async () => {
  try {
    const response = await axios.get("/purchaseOrder/next");
    return response.data;
  } catch (error) {
    console.error("Error fetching next Purchase Order number:", error);
    throw error;
  }
};

//fetch next auto-generated purchase return number (Preview only)
export const getNextPurchaseReturn = async () => {
  try { 
    const response = await axios.get("/purchaseReturn/next");
    return response.data;
  } catch (error) {
    console.error("Error fetching next Purchase Return number:", error);
    throw error;
  }
};

//fetch next auto-generate stock verification number (Preview only)
export const getNextStockVerification = async () => {
  try {
    const response = await axios.get("/stockVerification/next");
    return response.data;
  }
  catch (error) {
    console.error("Error fetching next Stock Verification number:", error);
    throw error;
  }
};

// Mutation functions
export const addPurchaseOrder = (order) => {
  const newOrder = {
    ...order,
    id: Date.now(),
    orderNumber: `PO-${String(inventoryData.purchaseOrders.length + 1).padStart(
      4,
      "0"
    )}`,
  };
  inventoryData.purchaseOrders.push(newOrder);
  return newOrder;
};

export const updatePurchaseOrder = (id, updated) => {
  const idx = inventoryData.purchaseOrders.findIndex((o) => o.id === id);
  if (idx !== -1) {
    inventoryData.purchaseOrders[idx] = {
      ...inventoryData.purchaseOrders[idx],
      ...updated,
    };
    return inventoryData.purchaseOrders[idx];
  }
  return null;
};

export const addPurchaseReturn = (ret) => {
  const newReturn = {
    ...ret,
    id: Date.now(),
    returnNumber: `PR${String(
      inventoryData.purchaseReturns.length + 1
    ).padStart(3, "0")}`,
  };
  inventoryData.purchaseReturns.push(newReturn);
  return newReturn;
};

export const addSalesReturn = (ret) => {
  const newReturn = {
    ...ret,
    id: Date.now(),
    returnNumber: `SR${String(inventoryData.salesReturns.length + 1).padStart(
      3,
      "0"
    )}`,
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
  try {
    localStorage.setItem(
      "inventory_stockTransfers",
      JSON.stringify(inventoryData.stockTransfers)
    );
  } catch {
    /* ignore */
  }
  return newTransfer;
};

export const updateStockTransfer = (id, updated) => {
  const idx = inventoryData.stockTransfers.findIndex((t) => t.id === id);
  if (idx !== -1) {
    inventoryData.stockTransfers[idx] = {
      ...inventoryData.stockTransfers[idx],
      ...updated,
    };
    try {
      localStorage.setItem(
        "inventory_stockTransfers",
        JSON.stringify(inventoryData.stockTransfers)
      );
    } catch {
      /* ignore */
    }
    return inventoryData.stockTransfers[idx];
  }
  return null;
};

export const addStockVerification = (verification) => {
  // Determine next STV sequence by scanning existing verification numbers
  const nums = inventoryData.stockVerifications
    .map((v) => {
      const m = String(v.verificationNumber || v.id || "").match(
        /^STV-(\d{4})$/i
      );
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
  try {
    localStorage.setItem(
      "inventory_stockVerifications",
      JSON.stringify(inventoryData.stockVerifications)
    );
  } catch {
    /* ignore */
  }
  return newVerification;
};

export const updateStockVerification = (id, updated) => {
  const idx = inventoryData.stockVerifications.findIndex((v) => v.id === id);
  if (idx !== -1) {
    inventoryData.stockVerifications[idx] = {
      ...inventoryData.stockVerifications[idx],
      ...updated,
    };
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
  fetchStockTransfers,
  createPurchaseOrder,
  fetchPurchaseOrders,
  fetchPendingSalesReturns,
  getNextPurchaseReturn,
  fetchGRNs,
};
