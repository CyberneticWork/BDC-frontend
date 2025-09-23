import React from "react";

const CashFlowStatement = () => {
  return (
    <div className="cash-flow-statement">
      <h1>Cash Flow Statement</h1>
      <p>Track inflow and outflow of cash.</p>
      {/* Placeholder for cash flow */}
      <div>
        <p>Operating Cash Flow: $20,000</p>
        <p>Investing Cash Flow: -$5,000</p>
        <p>Financing Cash Flow: -$10,000</p>
        <p>Net Cash Flow: $5,000</p>
      </div>
    </div>
  );
};

export default CashFlowStatement;
