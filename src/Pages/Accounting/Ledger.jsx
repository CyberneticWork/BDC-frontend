import React from "react";

const Ledger = () => {
  return (
    <div className="ledger">
      <h1>Ledger</h1>
      <p>Detailed debit/credit of each account.</p>
      {/* Placeholder for ledger details */}
      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account A</td>
            <td>$100</td>
            <td>$0</td>
            <td>$100</td>
          </tr>
          <tr>
            <td>Account B</td>
            <td>$0</td>
            <td>$100</td>
            <td>-$100</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Ledger;
