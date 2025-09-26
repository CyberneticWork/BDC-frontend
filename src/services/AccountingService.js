// AccountingService.js - Static data for Accounting module

const staticData = {
  dashboard: {
    totalAssets: 100000,
    totalLiabilities: 50000,
    netIncome: 10000,
    charts: {
      incomeData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [{
          label: 'Income',
          data: [12000, 19000, 15000, 18000, 14000, 21000, 22000],
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      revenueExpensesData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
          {
            label: 'Revenue',
            data: [12000, 19000, 15000, 18000, 14000, 21000, 22000],
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 4
          },
          {
            label: 'Expenses',
            data: [8000, 12000, 10000, 11000, 9000, 14000, 13000],
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderRadius: 4
          }
        ]
      }
    }
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
  customers: [
    {
      id: 1,
      customerCategory: 'Corporate',
      customerType: 'Premium',
      customerName: 'Acme Corporation',
      phoneNumber: '+1-555-0123',
      brNumberNic: 'BR123456789',
      email: 'billing@acme.com',
      address: '123 Business Ave, Suite 100',
      city: 'New York',
      createdDate: '2024-01-10'
    },
    {
      id: 2,
      customerCategory: 'Individual',
      customerType: 'Regular',
      customerName: 'John Smith',
      phoneNumber: '+1-555-0456',
      brNumberNic: 'NIC987654321',
      email: 'john.smith@email.com',
      address: '456 Main Street',
      city: 'Los Angeles',
      createdDate: '2024-01-15'
    },
    {
      id: 3,
      customerCategory: 'Corporate',
      customerType: 'VIP',
      customerName: 'Tech Solutions Ltd',
      phoneNumber: '+1-555-0789',
      brNumberNic: 'BR567890123',
      email: 'accounts@techsolutions.com',
      address: '789 Tech Park, Building A',
      city: 'San Francisco',
      createdDate: '2024-01-20'
    }
  ],
  customerCategories: [
    'Individual',
    'Corporate',
    'Government',
    'NGO'
  ],
  customerTypes: [
    'Regular',
    'Premium',
    'VIP',
    'Wholesale'
  ],
  centers: [
    {
      id: 1,
      centerName: 'Main Office',
      createdDate: '2024-01-01',
      status: 'Active'
    },
    {
      id: 2,
      centerName: 'Branch Office A',
      createdDate: '2024-01-05',
      status: 'Active'
    },
    {
      id: 3,
      centerName: 'Warehouse Center',
      createdDate: '2024-01-10',
      status: 'Active'
    }
  ],
  // Income Statement data
  incomeStatementData: {
    revenue: {
      salesRevenue: 85000,
      serviceRevenue: 25000,
      otherRevenue: 3000
    },
    costOfGoodsSold: {
      directMaterials: 20000,
      directLabor: 15000,
      manufacturingOverhead: 8000
    },
    operatingExpenses: {
      salariesAndWages: 18000,
      rentExpense: 6000,
      utilitiesExpense: 2500,
      advertisingExpense: 4000,
      insuranceExpense: 1500,
      depreciationExpense: 3000,
      officeSupplies: 800,
      professionalFees: 2200
    },
    otherIncome: {
      interestIncome: 500,
      dividendIncome: 200,
      gainOnSale: 1500
    },
    otherExpenses: {
      interestExpense: 1200,
      lossOnSale: 300
    }
  },
  // Balance Sheet data
  balanceSheetData: {
    assets: {
      currentAssets: {
        cash: 25000,
        accountsReceivable: 18000,
        inventory: 12000,
        prepaidExpenses: 3000,
        shortTermInvestments: 5000
      },
      fixedAssets: {
        propertyPlantEquipment: 85000,
        accumulatedDepreciation: -25000,
        intangibleAssets: 15000,
        longTermInvestments: 20000
      }
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: 12000,
        shortTermDebt: 8000,
        accruedExpenses: 5000,
        taxesPayable: 3000
      },
      longTermLiabilities: {
        longTermDebt: 45000,
        deferredTaxLiabilities: 8000,
        otherLongTermLiabilities: 5000
      }
    },
    equity: {
      commonStock: 50000,
      retainedEarnings: 35000,
      additionalPaidInCapital: 15000,
      treasuryStock: -5000
    }
  },
  // Previous period balance sheet data for comparison
  previousBalanceSheetData: {
    assets: {
      currentAssets: {
        cash: 22000,
        accountsReceivable: 16000,
        inventory: 14000,
        prepaidExpenses: 2500,
        shortTermInvestments: 4000
      },
      fixedAssets: {
        propertyPlantEquipment: 85000,
        accumulatedDepreciation: -22000,
        intangibleAssets: 15000,
        longTermInvestments: 18000
      }
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: 10000,
        shortTermDebt: 7000,
        accruedExpenses: 4500,
        taxesPayable: 2500
      },
      longTermLiabilities: {
        longTermDebt: 48000,
        deferredTaxLiabilities: 7500,
        otherLongTermLiabilities: 5000
      }
    },
    equity: {
      commonStock: 50000,
      retainedEarnings: 32000,
      additionalPaidInCapital: 15000,
      treasuryStock: -5000
    }
  },
  // Cash Flow Statement data
  cashFlowData: {
    operatingActivities: {
      netIncome: 25000,
      depreciationAmortization: 5000,
      changeInAccountsReceivable: -3000,
      changeInInventory: 2000,
      changeInAccountsPayable: 1500,
      changeInAccruedExpenses: 800,
      otherOperatingActivities: -500
    },
    investingActivities: {
      purchaseOfEquipment: -15000,
      saleOfInvestments: 8000,
      purchaseOfInvestments: -5000,
      otherInvestingActivities: 1000
    },
    financingActivities: {
      proceedsFromLongTermDebt: 20000,
      repaymentOfLongTermDebt: -8000,
      dividendsPaid: -5000,
      stockRepurchase: -3000,
      otherFinancingActivities: 500
    },
    beginningCash: 18000
  },
  // Previous period cash flow data for comparison
  previousCashFlowData: {
    operatingActivities: {
      netIncome: 22000,
      depreciationAmortization: 4500,
      changeInAccountsReceivable: -2000,
      changeInInventory: 1500,
      changeInAccountsPayable: 1000,
      changeInAccruedExpenses: 600,
      otherOperatingActivities: -300
    },
    investingActivities: {
      purchaseOfEquipment: -10000,
      saleOfInvestments: 5000,
      purchaseOfInvestments: -3000,
      otherInvestingActivities: 500
    },
    financingActivities: {
      proceedsFromLongTermDebt: 15000,
      repaymentOfLongTermDebt: -6000,
      dividendsPaid: -4000,
      stockRepurchase: -2000,
      otherFinancingActivities: 200
    },
    beginningCash: 15000
  },
  // Trial Balance data
  trialBalanceAccounts: [
    // Assets
    { code: "1001", name: "Cash", type: "Asset", debit: 25000, credit: 0, balance: 25000 },
    { code: "1002", name: "Accounts Receivable", type: "Asset", debit: 15000, credit: 0, balance: 15000 },
    { code: "1003", name: "Inventory", type: "Asset", debit: 8000, credit: 0, balance: 8000 },
    { code: "1004", name: "Equipment", type: "Asset", debit: 30000, credit: 0, balance: 30000 },
    { code: "1005", name: "Accumulated Depreciation - Equipment", type: "Asset", debit: 0, credit: 5000, balance: -5000 },
    // Liabilities
    { code: "2001", name: "Accounts Payable", type: "Liability", debit: 0, credit: 8000, balance: -8000 },
    { code: "2002", name: "Notes Payable", type: "Liability", debit: 0, credit: 12000, balance: -12000 },
    { code: "2003", name: "Accrued Expenses", type: "Liability", debit: 0, credit: 3000, balance: -3000 },
    // Equity
    { code: "3001", name: "Owner's Capital", type: "Equity", debit: 0, credit: 40000, balance: -40000 },
    { code: "3002", name: "Retained Earnings", type: "Equity", debit: 0, credit: 8000, balance: -8000 },
    // Revenue
    { code: "4001", name: "Sales Revenue", type: "Revenue", debit: 0, credit: 25000, balance: -25000 },
    { code: "4002", name: "Service Revenue", type: "Revenue", debit: 0, credit: 10000, balance: -10000 },
    // Expenses
    { code: "5001", name: "Cost of Goods Sold", type: "Expense", debit: 15000, credit: 0, balance: 15000 },
    { code: "5002", name: "Rent Expense", type: "Expense", debit: 3000, credit: 0, balance: 3000 },
    { code: "5003", name: "Utilities Expense", type: "Expense", debit: 1500, credit: 0, balance: 1500 },
    { code: "5004", name: "Salaries Expense", type: "Expense", debit: 8000, credit: 0, balance: 8000 },
    { code: "5005", name: "Depreciation Expense", type: "Expense", debit: 2500, credit: 0, balance: 2500 }
  ],
  // Enhanced invoice data
  invoiceData: [
    {
      id: "INV-001",
      customer: "Acme Corporation",
      customerEmail: "billing@acme.com",
      amount: 5420.00,
      date: "2024-01-15",
      dueDate: "2024-02-15",
      status: "paid",
      items: [
        { description: "Web Development Services", quantity: 1, rate: 5000, amount: 5000 },
        { description: "Domain & Hosting", quantity: 1, rate: 420, amount: 420 }
      ]
    },
    {
      id: "INV-002",
      customer: "Tech Solutions Ltd",
      customerEmail: "accounts@techsolutions.com",
      amount: 8750.00,
      date: "2024-01-18",
      dueDate: "2024-02-18",
      status: "pending",
      items: [
        { description: "Software Development", quantity: 1, rate: 8000, amount: 8000 },
        { description: "Project Management", quantity: 1, rate: 750, amount: 750 }
      ]
    },
    {
      id: "INV-003",
      customer: "Global Enterprises",
      customerEmail: "finance@global.com",
      amount: 3200.00,
      date: "2024-01-20",
      dueDate: "2024-02-05",
      status: "overdue",
      items: [
        { description: "Consulting Services", quantity: 40, rate: 80, amount: 3200 }
      ]
    }
  ],
  // Enhanced expenses data
  enhancedExpenses: [
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
    },
    {
      id: 4,
      description: "Monthly Internet Service",
      amount: 150.00,
      category: "Utilities",
      date: "2024-01-01",
      vendor: "TechNet ISP",
      reference: "UTIL-2024-001",
      status: "Paid"
    },
    {
      id: 5,
      description: "Marketing Campaign - Q1",
      amount: 2500.00,
      category: "Marketing & Advertising",
      date: "2024-01-05",
      vendor: "Creative Agency",
      reference: "MKT-2024-001",
      status: "Paid"
    }
  ],
  // Expense categories
  expenseCategories: [
    "Office Supplies",
    "Travel & Transportation",
    "Utilities",
    "Marketing & Advertising",
    "Professional Services",
    "Software & Technology",
    "Insurance",
    "Rent & Facilities",
    "Equipment",
    "Meals & Entertainment",
    "Other"
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

// New exports for added data
export const getCustomers = () => staticData.customers;
export const getCustomerCategories = () => staticData.customerCategories;
export const getCustomerTypes = () => staticData.customerTypes;
export const getCenters = () => staticData.centers;
export const getIncomeStatementData = () => staticData.incomeStatementData;
export const getBalanceSheetData = () => staticData.balanceSheetData;
export const getPreviousBalanceSheetData = () => staticData.previousBalanceSheetData;
export const getCashFlowData = () => staticData.cashFlowData;
export const getPreviousCashFlowData = () => staticData.previousCashFlowData;
export const getTrialBalanceAccounts = () => staticData.trialBalanceAccounts;
export const getInvoiceData = () => staticData.invoiceData;
export const getEnhancedExpenses = () => staticData.enhancedExpenses;
export const getExpenseCategories = () => staticData.expenseCategories;
export const getDashboardCharts = () => staticData.dashboard.charts;

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

// Customer functions
export const addCustomer = (customer) => {
  const newCustomer = {
    ...customer,
    id: Date.now(),
    createdDate: new Date().toLocaleDateString()
  };
  staticData.customers.push(newCustomer);
  return newCustomer;
};

export const updateCustomer = (id, updatedCustomer) => {
  const index = staticData.customers.findIndex(customer => customer.id === id);
  if (index !== -1) {
    staticData.customers[index] = { ...staticData.customers[index], ...updatedCustomer };
    return staticData.customers[index];
  }
  return null;
};

export const deleteCustomer = (id) => {
  const index = staticData.customers.findIndex(customer => customer.id === id);
  if (index !== -1) {
    return staticData.customers.splice(index, 1)[0];
  }
  return null;
};

// Center functions
export const addCenter = (center) => {
  const newCenter = {
    ...center,
    id: Date.now(),
    createdDate: new Date().toLocaleDateString(),
    status: 'Active'
  };
  staticData.centers.push(newCenter);
  return newCenter;
};

export const updateCenter = (id, updatedCenter) => {
  const index = staticData.centers.findIndex(center => center.id === id);
  if (index !== -1) {
    staticData.centers[index] = { ...staticData.centers[index], ...updatedCenter };
    return staticData.centers[index];
  }
  return null;
};

export const deleteCenter = (id) => {
  const index = staticData.centers.findIndex(center => center.id === id);
  if (index !== -1) {
    return staticData.centers.splice(index, 1)[0];
  }
  return null;
};

// Invoice functions
export const addInvoice = (invoice) => {
  const newInvoice = {
    ...invoice,
    id: `INV-${String(staticData.invoiceData.length + 1).padStart(3, '0')}`
  };
  staticData.invoiceData.push(newInvoice);
  return newInvoice;
};

export const updateInvoice = (id, updatedInvoice) => {
  const index = staticData.invoiceData.findIndex(invoice => invoice.id === id);
  if (index !== -1) {
    staticData.invoiceData[index] = { ...staticData.invoiceData[index], ...updatedInvoice };
    return staticData.invoiceData[index];
  }
  return null;
};

export const deleteInvoice = (id) => {
  const index = staticData.invoiceData.findIndex(invoice => invoice.id === id);
  if (index !== -1) {
    return staticData.invoiceData.splice(index, 1)[0];
  }
  return null;
};

// Enhanced expense functions
export const addEnhancedExpense = (expense) => {
  const newExpense = {
    ...expense,
    id: Date.now()
  };
  staticData.enhancedExpenses.push(newExpense);
  return newExpense;
};

export const updateEnhancedExpense = (id, updatedExpense) => {
  const index = staticData.enhancedExpenses.findIndex(expense => expense.id === id);
  if (index !== -1) {
    staticData.enhancedExpenses[index] = { ...staticData.enhancedExpenses[index], ...updatedExpense };
    return staticData.enhancedExpenses[index];
  }
  return null;
};

export const deleteEnhancedExpense = (id) => {
  const index = staticData.enhancedExpenses.findIndex(expense => expense.id === id);
  if (index !== -1) {
    return staticData.enhancedExpenses.splice(index, 1)[0];
  }
  return null;
};
