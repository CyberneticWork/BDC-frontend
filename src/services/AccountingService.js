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
  // New Account List data
  accountList: [
    {
      id: 1,
      accountName: "Petty Cash",
      accountSubCategory: "Current Assets",
      accountGroup: "Bank",
      openingBalance: 5000
    },
    {
      id: 2,
      accountName: "Office Supplies",
      accountSubCategory: "Expenses",
      accountGroup: "Distribution Expenses",
      openingBalance: 0
    }
  ],
  accountCategories: [
    {
      id: 1,
      accountType: "ASSETS",
      accountCategoryName: "Current Assets"
    },
    {
      id: 2,
      accountType: "EXPENSES",
      accountCategoryName: "Operating Expenses"
    }
  ],
  accountGroups: [
    {
      id: 1,
      accountGroupName: "Bank"
    },
    {
      id: 2,
      accountGroupName: "Distribution Expenses"
    }
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
      entries: [
        { date: "2023-01-01", debit: 1000, credit: 0, balance: 1000, description: "Initial deposit" },
        { date: "2023-01-02", debit: 0, credit: 500, balance: 500, description: "Office supplies payment" },
        { date: "2023-01-05", debit: 2000, credit: 0, balance: 2500, description: "Client payment received" }
      ],
    },
    {
      account: "Revenue",
      entries: [
        { date: "2023-01-01", debit: 0, credit: 1000, balance: 1000, description: "Service revenue" },
        { date: "2023-01-05", debit: 0, credit: 2000, balance: 3000, description: "Consulting fees" }
      ],
    },
    {
      account: "Expenses",
      entries: [
        { date: "2023-01-02", debit: 500, credit: 0, balance: 500, description: "Office supplies" },
        { date: "2023-01-03", debit: 300, credit: 0, balance: 800, description: "Utilities" }
      ],
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
  salesOrders: [
    {
      id: 1,
      orderNumber: "SO001",
      customer: "ABC Company",
      date: "2024-01-15",
      dueDate: "2024-02-15",
      status: "Pending",
      items: [
        { productName: "Laptop", quantity: 5, unitPrice: 1200, total: 6000 },
        { productName: "Mouse", quantity: 10, unitPrice: 25, total: 250 }
      ],
      subtotal: 6250,
      tax: 625,
      totalAmount: 6875
    },
    {
      id: 2,
      orderNumber: "SO002",
      customer: "XYZ Corporation",
      date: "2024-01-20",
      dueDate: "2024-02-20",
      status: "Completed",
      items: [
        { productName: "Desktop PC", quantity: 3, unitPrice: 800, total: 2400 },
        { productName: "Monitor", quantity: 3, unitPrice: 300, total: 900 }
      ],
      subtotal: 3300,
      tax: 330,
      totalAmount: 3630
    }
  ],
  salesReturns: [
    {
      id: 1,
      returnNumber: "SR001",
      customer: "ABC Company",
      originalInvoice: "INV001",
      date: "2024-01-25",
      reason: "Defective product",
      status: "Approved",
      items: [
        { productName: "Laptop", quantity: 1, unitPrice: 1200, total: 1200 }
      ],
      subtotal: 1200,
      tax: 120,
      totalAmount: 1320
    },
    {
      id: 2,
      returnNumber: "SR002",
      customer: "XYZ Corporation",
      originalInvoice: "INV002",
      date: "2024-01-28",
      reason: "Wrong specification",
      status: "Pending",
      items: [
        { productName: "Monitor", quantity: 1, unitPrice: 300, total: 300 }
      ],
      subtotal: 300,
      tax: 30,
      totalAmount: 330
    }
  ],
  grn: [
    {
      id: 1,
      grnNumber: "GRN001",
      supplier: "Tech Supplies Ltd",
      purchaseOrder: "PO001",
      receivedDate: "2024-01-12",
      status: "Received",
      items: [
        { productName: "Laptop", orderedQty: 10, receivedQty: 10, unitPrice: 1000, total: 10000 },
        { productName: "Mouse", orderedQty: 20, receivedQty: 18, unitPrice: 20, total: 360 }
      ],
      totalAmount: 10360,
      remarks: "2 mice missing from shipment"
    },
    {
      id: 2,
      grnNumber: "GRN002",
      supplier: "Office Equipment Co",
      purchaseOrder: "PO002",
      receivedDate: "2024-01-18",
      status: "Partial",
      items: [
        { productName: "Desktop PC", orderedQty: 5, receivedQty: 3, unitPrice: 750, total: 2250 },
        { productName: "Keyboard", orderedQty: 5, receivedQty: 5, unitPrice: 50, total: 250 }
      ],
      totalAmount: 2500,
      remarks: "Remaining 2 PCs to be delivered next week"
    }
  ],
  purchaseReturns: [
    {
      id: 1,
      returnNumber: "PR001",
      supplier: "Tech Supplies Ltd",
      originalGRN: "GRN001",
      date: "2024-01-16",
      reason: "Damaged in transit",
      status: "Approved",
      items: [
        { productName: "Laptop", quantity: 1, unitPrice: 1000, total: 1000 }
      ],
      totalAmount: 1000
    },
    {
      id: 2,
      returnNumber: "PR002",
      supplier: "Office Equipment Co",
      originalGRN: "GRN002",
      date: "2024-01-22",
      reason: "Wrong model delivered",
      status: "Pending",
      items: [
        { productName: "Keyboard", quantity: 2, unitPrice: 50, total: 100 }
      ],
      totalAmount: 100
    }
  ],
  purchaseOrders: [
    {
      id: 1,
      orderNumber: "PO001",
      supplier: "Tech Supplies Ltd",
      date: "2024-01-10",
      expectedDate: "2024-01-15",
      status: "Received",
      items: [
        { productName: "Laptop", quantity: 10, unitPrice: 1000, total: 10000 },
        { productName: "Mouse", quantity: 20, unitPrice: 20, total: 400 }
      ],
      subtotal: 10400,
      tax: 1040,
      totalAmount: 11440
    },
    {
      id: 2,
      orderNumber: "PO002",
      supplier: "Office Equipment Co",
      date: "2024-01-15",
      expectedDate: "2024-01-20",
      status: "Partial",
      items: [
        { productName: "Desktop PC", quantity: 5, unitPrice: 750, total: 3750 },
        { productName: "Keyboard", quantity: 5, unitPrice: 50, total: 250 }
      ],
      subtotal: 4000,
      tax: 400,
      totalAmount: 4400
    },
    {
      id: 3,
      orderNumber: "PO003",
      supplier: "Software Solutions Inc",
      date: "2024-01-25",
      expectedDate: "2024-02-05",
      status: "Pending",
      items: [
        { productName: "Antivirus Software", quantity: 50, unitPrice: 30, total: 1500 },
        { productName: "Office Suite License", quantity: 25, unitPrice: 120, total: 3000 }
      ],
      subtotal: 4500,
      tax: 450,
      totalAmount: 4950
    }
  ],
  stockTransfers: [
    {
      id: 1,
      transferNumber: "ST001",
      fromLocation: "Main Warehouse",
      toLocation: "Branch Office A",
      date: "2024-01-14",
      status: "Completed",
      items: [
        { productName: "Laptop", quantity: 3, unitPrice: 1200, total: 3600 },
        { productName: "Mouse", quantity: 10, unitPrice: 25, total: 250 }
      ],
      totalValue: 3850,
      transferredBy: "John Smith",
      receivedBy: "Jane Doe",
      remarks: "Branch office setup"
    },
    {
      id: 2,
      transferNumber: "ST002",
      fromLocation: "Branch Office B",
      toLocation: "Main Warehouse",
      date: "2024-01-20",
      status: "In Transit",
      items: [
        { productName: "Desktop PC", quantity: 2, unitPrice: 800, total: 1600 },
        { productName: "Monitor", quantity: 2, unitPrice: 300, total: 600 }
      ],
      totalValue: 2200,
      transferredBy: "Mike Johnson",
      receivedBy: "Pending",
      remarks: "Return of excess inventory"
    }
  ],
  stockVerifications: [
    {
      id: 1,
      verificationNumber: "SV001",
      location: "Main Warehouse",
      date: "2024-01-30",
      status: "Completed",
      verifiedBy: "Sarah Wilson",
      items: [
        {
          productName: "Laptop",
          systemQty: 25,
          physicalQty: 24,
          variance: -1,
          unitPrice: 1200,
          varianceValue: -1200
        },
        {
          productName: "Mouse",
          systemQty: 50,
          physicalQty: 52,
          variance: 2,
          unitPrice: 25,
          varianceValue: 50
        },
        {
          productName: "Monitor",
          systemQty: 15,
          physicalQty: 15,
          variance: 0,
          unitPrice: 300,
          varianceValue: 0
        }
      ],
      totalVarianceValue: -1150,
      remarks: "Annual stock audit - minor discrepancies found"
    },
    {
      id: 2,
      verificationNumber: "SV002",
      location: "Branch Office A",
      date: "2024-02-05",
      status: "In Progress",
      verifiedBy: "David Chen",
      items: [
        {
          productName: "Desktop PC",
          systemQty: 8,
          physicalQty: 8,
          variance: 0,
          unitPrice: 800,
          varianceValue: 0
        },
        {
          productName: "Keyboard",
          systemQty: 12,
          physicalQty: null,
          variance: null,
          unitPrice: 50,
          varianceValue: null
        }
      ],
      totalVarianceValue: 0,
      remarks: "Monthly verification in progress"
    }
  ],
  expenses: [
    {
      id: 1,
      description: "Office Supplies - Stationery",
      amount: 245.50,
      category: "Office Supplies",
      date: "2024-01-15",
      vendor: "OfficeMax",
      reference: "INV-2024-001",
      status: "Paid"
    },
    {
      id: 2,
      description: "Software License - Adobe Creative Suite",
      amount: 599.99,
      category: "Software & Technology",
      date: "2024-01-10",
      vendor: "Adobe Systems",
      reference: "SUB-2024-012",
      status: "Paid"
    },
    {
      id: 3,
      description: "Business Travel - Client Meeting",
      amount: 1250.00,
      category: "Travel & Transportation",
      date: "2024-01-08",
      vendor: "Delta Airlines",
      reference: "TRV-2024-003",
      status: "Pending"
    }
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
export const getSalesOrders = () => staticData.salesOrders;
export const getSalesReturns = () => staticData.salesReturns;
export const getGRN = () => staticData.grn;
export const getPurchaseReturns = () => staticData.purchaseReturns;
export const getPurchaseOrders = () => staticData.purchaseOrders;
export const getStockTransfers = () => staticData.stockTransfers;
export const getStockVerifications = () => staticData.stockVerifications;
export const getExpenses = () => staticData.expenses;
export const getReports = () => staticData.reports;
export const getSettings = () => staticData.settings;
export const getUsersAndRoles = () => staticData.usersAndRoles;

// Placeholder functions for future API calls
export const addTransaction = (transaction) => {
  staticData.transactions.push(transaction);
};

// Sales Order functions
export const addSalesOrder = (order) => {
  const newOrder = {
    ...order,
    id: Date.now(),
    orderNumber: `SO${String(staticData.salesOrders.length + 1).padStart(3, '0')}`
  };
  staticData.salesOrders.push(newOrder);
  return newOrder;
};

export const updateSalesOrder = (id, updatedOrder) => {
  const index = staticData.salesOrders.findIndex(order => order.id === id);
  if (index !== -1) {
    staticData.salesOrders[index] = { ...staticData.salesOrders[index], ...updatedOrder };
    return staticData.salesOrders[index];
  }
  return null;
};

// Sales Return functions
export const addSalesReturn = (returnItem) => {
  const newReturn = {
    ...returnItem,
    id: Date.now(),
    returnNumber: `SR${String(staticData.salesReturns.length + 1).padStart(3, '0')}`
  };
  staticData.salesReturns.push(newReturn);
  return newReturn;
};

// GRN functions
export const addGRN = (grn) => {
  const newGRN = {
    ...grn,
    id: Date.now(),
    grnNumber: `GRN${String(staticData.grn.length + 1).padStart(3, '0')}`
  };
  staticData.grn.push(newGRN);
  return newGRN;
};

// Purchase Return functions
export const addPurchaseReturn = (returnItem) => {
  const newReturn = {
    ...returnItem,
    id: Date.now(),
    returnNumber: `PR${String(staticData.purchaseReturns.length + 1).padStart(3, '0')}`
  };
  staticData.purchaseReturns.push(newReturn);
  return newReturn;
};

// Purchase Order functions
export const addPurchaseOrder = (order) => {
  const newOrder = {
    ...order,
    id: Date.now(),
    orderNumber: `PO${String(staticData.purchaseOrders.length + 1).padStart(3, '0')}`
  };
  staticData.purchaseOrders.push(newOrder);
  return newOrder;
};

export const updatePurchaseOrder = (id, updatedOrder) => {
  const index = staticData.purchaseOrders.findIndex(order => order.id === id);
  if (index !== -1) {
    staticData.purchaseOrders[index] = { ...staticData.purchaseOrders[index], ...updatedOrder };
    return staticData.purchaseOrders[index];
  }
  return null;
};

// Stock Transfer functions
export const addStockTransfer = (transfer) => {
  const newTransfer = {
    ...transfer,
    id: Date.now(),
    transferNumber: `ST${String(staticData.stockTransfers.length + 1).padStart(3, '0')}`
  };
  staticData.stockTransfers.push(newTransfer);
  return newTransfer;
};

export const updateStockTransfer = (id, updatedTransfer) => {
  const index = staticData.stockTransfers.findIndex(transfer => transfer.id === id);
  if (index !== -1) {
    staticData.stockTransfers[index] = { ...staticData.stockTransfers[index], ...updatedTransfer };
    return staticData.stockTransfers[index];
  }
  return null;
};

// Stock Verification functions
export const addStockVerification = (verification) => {
  const newVerification = {
    ...verification,
    id: Date.now(),
    verificationNumber: `SV${String(staticData.stockVerifications.length + 1).padStart(3, '0')}`
  };
  staticData.stockVerifications.push(newVerification);
  return newVerification;
};

export const updateStockVerification = (id, updatedVerification) => {
  const index = staticData.stockVerifications.findIndex(verification => verification.id === id);
  if (index !== -1) {
    staticData.stockVerifications[index] = { ...staticData.stockVerifications[index], ...updatedVerification };
    return staticData.stockVerifications[index];
  }
  return null;
};

export const updateSettings = (newSettings) => {
  staticData.settings = { ...staticData.settings, ...newSettings };
};

export const addExpense = (expense) => {
  const newExpense = {
    ...expense,
    id: Date.now()
  };
  staticData.expenses.push(newExpense);
  return newExpense;
};

export const updateExpense = (id, updatedExpense) => {
  const index = staticData.expenses.findIndex(expense => expense.id === id);
  if (index !== -1) {
    staticData.expenses[index] = { ...staticData.expenses[index], ...updatedExpense };
    return staticData.expenses[index];
  }
  return null;
};

export const deleteExpense = (id) => {
  const index = staticData.expenses.findIndex(expense => expense.id === id);
  if (index !== -1) {
    return staticData.expenses.splice(index, 1)[0];
  }
  return null;
};

// Add more functions as needed

// Account List functions
export const getAccountList = () => staticData.accountList;
export const addAccount = (account) => {
  const newAccount = {
    ...account,
    id: Date.now()
  };
  staticData.accountList.push(newAccount);
  return newAccount;
};

export const updateAccount = (id, updatedAccount) => {
  const index = staticData.accountList.findIndex(account => account.id === id);
  if (index !== -1) {
    staticData.accountList[index] = { ...staticData.accountList[index], ...updatedAccount };
    return staticData.accountList[index];
  }
  return null;
};

export const deleteAccount = (id) => {
  const index = staticData.accountList.findIndex(account => account.id === id);
  if (index !== -1) {
    return staticData.accountList.splice(index, 1)[0];
  }
  return null;
};

// Account Categories functions
export const getAccountCategories = () => staticData.accountCategories;
export const addAccountCategory = (category) => {
  const newCategory = {
    ...category,
    id: Date.now()
  };
  staticData.accountCategories.push(newCategory);
  return newCategory;
};

// Account Groups functions
export const getAccountGroups = () => staticData.accountGroups;
export const addAccountGroup = (group) => {
  const newGroup = {
    ...group,
    id: Date.now()
  };
  staticData.accountGroups.push(newGroup);
  return newGroup;
};
