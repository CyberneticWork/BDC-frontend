import React from "react";

const Expenses = () => {
  return (
    <div className="expenses">
      <h1>Expenses</h1>
      <p>Track company expenses.</p>
      {/* Placeholder for expenses */}
      <button>Add New Expense</button>
      <ul>
        <li>Office Supplies: $500</li>
        <li>Travel: $1,000</li>
      </ul>
    </div>
  );
};

export default Expenses;
