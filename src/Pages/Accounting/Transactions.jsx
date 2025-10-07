import React from "react";

const Transactions = () => {
  return (
    <div className="transactions">
      <h1>Transactions / Journal Entries</h1>
      <p>Add and view financial entries.</p>
      {/* Placeholder for transaction list and add form */}
      <button>Add New Entry</button>
      <ul>
        <li>Entry 1: Debit $100 to Account A, Credit $100 to Account B</li>
        <li>Entry 2: Debit $200 to Account C, Credit $200 to Account D</li>
      </ul>
    </div>
  );
};

export default Transactions;
