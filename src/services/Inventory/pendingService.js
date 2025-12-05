// pendingService.js - Service for managing pending approvals

const pendingInvoices = [
  {
    id: "INV-25-0001",
    center: "2",
    customer: "Sumedha",
    date: "2025-11-11",
    status: null,
    refNumber: "",
    amount: 80,
    productName: "Rubber Seal 125",
    quantity: 1,
    items: [
      {
        id: 1762844201493,
        productId: 2,
        name: "Rubber Seal 125",
        quantity: 1,
        unitPrice: 80,
        discount: 0,
        discountEnabled: false,
      },
    ],
    payment: {
      mode: "cash",
      amount: 80,
    },
    created_by: 4,
  },
];

// Getter function
export const getPendingInvoices = () => pendingInvoices;

// Approve invoice
export const approveInvoice = (id) => {
  const idx = pendingInvoices.findIndex((inv) => inv.id === id);
  if (idx !== -1) {
    pendingInvoices[idx].status = "approved";
    return pendingInvoices[idx];
  }
  return null;
};

// Reject invoice
export const rejectInvoice = (id) => {
  const idx = pendingInvoices.findIndex((inv) => inv.id === id);
  if (idx !== -1) {
    pendingInvoices[idx].status = "rejected";
    return pendingInvoices[idx];
  }
  return null;
};

export default {
  getPendingInvoices,
  approveInvoice,
  rejectInvoice,
};
