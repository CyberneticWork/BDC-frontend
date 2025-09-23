import React from "react";

const Dashboard = () => {
  return (
    <div className="accounting-dashboard">
      <h1>Accounting Dashboard</h1>
      <p>Overview with stats, charts, and balances.</p>
      {/* Placeholder for stats, charts, balances */}
      <div className="stats">
        <div>Total Assets: $100,000</div>
        <div>Total Liabilities: $50,000</div>
        <div>Net Income: $10,000</div>
      </div>
    </div>
  );
};

export default Dashboard;
