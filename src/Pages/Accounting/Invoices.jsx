import React from "react";

const Invoices = () => {
  return (
    <div className="invoices">
      <h1>Invoices / Billing</h1>
      <p>Create and manage client invoices.</p>
      {/* Placeholder for invoices */}
      <button>Create New Invoice</button>
      <ul>
        <li>Invoice #001: $1,000 - Paid</li>
        <li>Invoice #002: $2,000 - Pending</li>
      </ul>
    </div>
  );
};

export default Invoices;
