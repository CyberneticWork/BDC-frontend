// pendingService.js - Service for managing pending approvals
import axios from "../../utils/axios";

const parseInvoicePayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.invoices)) return payload.invoices;
  if (Array.isArray(payload?.records)) return payload.records;
  return [];
};

const normalizeInvoice = (inv) => {
  if (!inv) return inv;
  const id = inv.id || inv.voucher_number || inv.invoice_number || inv.number || inv.invoice_no || inv.inv_no || inv.code || String(inv.id || "");
  const voucherNumber =
    inv.voucherNumber ||
    inv.voucher_number ||
    inv.voucher_no ||
    inv.voucherId ||
    inv.reference_number ||
    inv.reference ||
    inv.refNumber ||
    null;
  const invoiceNumber = voucherNumber || inv.invoice_number || inv.number || inv.invoice_no || inv.inv_no || inv.code || id;
  const customer =
    (typeof inv.customer === "string" && inv.customer) ||
    inv.customer?.name ||
    inv.customer_name ||
    inv.customer?.company ||
    (inv.customer?.first_name ? `${inv.customer.first_name} ${inv.customer.last_name || ""}` : "") ||
    "";
  const amount = inv.amount ?? inv.total ?? inv.grand_total ?? inv.total_amount ?? inv.payable ?? 0;
  const discount = inv.discount ?? inv.discountValue ?? inv.discount_value ?? inv.total_discount ?? inv.discount_amount ?? 0;
  const date = inv.date || inv.invoice_date || inv.created_at || inv.createdAt || null;
  const centerName = inv.center?.name || inv.center_name || inv.center || inv.center_id || "";
  const status = inv.status ?? inv.approval_status ?? inv.state ?? null;
  const refNumber = inv.refNumber || inv.ref_number || inv.reference || inv.ref || "";
  const payment = inv.payment || (inv.payment_mode || inv.payment_amount ? { mode: inv.payment_mode, amount: inv.payment_amount } : null);
  const items = inv.items || inv.invoice_items || inv.line_items || inv.products || [];
  const supplier = inv.supplier || inv.supplier_name || inv.vendor || inv.supplier?.name || inv.supplier_name || "";
  const created_by = 
  (typeof inv.creator === "string" && inv.creator) ||
    inv.creator?.name ||
    inv.creator_name ||
    inv.creator?.company ||
    (inv.creator?.first_name ? `${inv.creator.first_name} ${inv.creator.last_name || ""}` : "") ||
    "";

  return { ...inv, id, voucherNumber, invoiceNumber, customer, amount, discount, date, center: centerName, centerName, status, refNumber, payment, items, supplier, created_by };
};

export const getPendingInvoices = async () => {
  try {
    const response = await axios.get("/inventory-pending");
    const raw = parseInvoicePayload(response.data);
    return raw.map(normalizeInvoice);
  } catch (error) {
    console.error("Error fetching pending invoices:", error);
    return [];
  }
};

export const postPendingInvoice = async (payload) => {
  try {
    const response = await axios.post("/inventory-approved", payload);
    return normalizeInvoice(response.data);
  }
  catch (error) {
    console.error("Error posting pending invoice:", error);
    throw error.response?.data ?? error;
  }
};

export default {
  getPendingInvoices,
  postPendingInvoice,
};
