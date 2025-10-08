// AccountingService.js - Static data for Accounting module

const staticData = {
  dashboard: {
    totalAssets: 100000,
    totalLiabilities: 50000,
    netIncome: 10000,
    charts: [], // Placeholder for chart data
  },
  chartOfAccounts: [
    { id: 1, name: "Cash", type: "Asset", balance: 20000 },
    { id: 2, name: "Accounts Receivable", type: "Asset", balance: 15000 },
    { id: 3, name: "Inventory", type: "Asset", balance: 30000 },
    { id: 4, name: "Accounts Payable", type: "Liability", balance: 25000 },
    { id: 5, name: "Loans", type: "Liability", balance: 25000 },
    { id: 6, name: "Equity", type: "Equity", balance: 50000 },
    { id: 7, name: "Revenue", type: "Income", balance: 50000 },
    { id: 8, name: "Expenses", type: "Expense", balance: 40000 },
  ],
  transactions: [
    {
      id: 1,
      date: "2023-01-01",
      description: "Sale of goods",
      debit: 1000,
      credit: 0,
      account: "Revenue",
    },
    {
      id: 2,
      date: "2023-01-02",
      description: "Purchase of supplies",
      debit: 0,
      credit: 500,
      account: "Expenses",
    },
  ],
  ledger: [
    {
      account: "Cash",
      entries: [{ date: "2023-01-01", debit: 1000, credit: 0, balance: 1000 }],
    },
    {
      account: "Revenue",
      entries: [{ date: "2023-01-01", debit: 0, credit: 1000, balance: 1000 }],
    },
  ],
  trialBalance: {
    totalDebits: 30000,
    totalCredits: 30000,
    balanced: true,
  },
  incomeStatement: {
    revenue: 50000,
    expenses: 40000,
    netProfit: 10000,
  },
  balanceSheet: {
    assets: 100000,
    liabilities: 50000,
    equity: 50000,
  },
  cashFlowStatement: {
    operating: 20000,
    investing: -5000,
    financing: -10000,
    netCashFlow: 5000,
  },
  invoices: [
    { id: 1, number: "INV001", amount: 1000, status: "Paid" },
    { id: 2, number: "INV002", amount: 2000, status: "Pending" },
  ],
  expenses: [
    { id: 1, description: "Office Supplies", amount: 500 },
    { id: 2, description: "Travel", amount: 1000 },
  ],
  reports: [], // Placeholder
  settings: {
    companyName: "ABC Corp",
    currency: "USD",
    taxRate: 0.1,
  },
  usersAndRoles: [
    { id: 1, name: "Admin", permissions: ["full"] },
    { id: 2, name: "Accountant", permissions: ["accounting"] },
    { id: 3, name: "Staff", permissions: ["limited"] },
  ],
};

export const getDashboardData = () => staticData.dashboard;
export const getChartOfAccounts = () => staticData.chartOfAccounts;
export const getTransactions = () => staticData.transactions;
export const getLedger = () => staticData.ledger;
export const getTrialBalance = () => staticData.trialBalance;
export const getIncomeStatement = () => staticData.incomeStatement;
export const getBalanceSheet = () => staticData.balanceSheet;
export const getCashFlowStatement = () => staticData.cashFlowStatement;
export const getInvoices = () => staticData.invoices;
export const getExpenses = () => staticData.expenses;
export const getReports = () => staticData.reports;
export const getSettings = () => staticData.settings;
export const getUsersAndRoles = () => staticData.usersAndRoles;

// Placeholder functions for future API calls
export const addTransaction = (transaction) => {
  staticData.transactions.push(transaction);
};

export const updateSettings = (newSettings) => {
  staticData.settings = { ...staticData.settings, ...newSettings };
};

// Add more functions as needed
