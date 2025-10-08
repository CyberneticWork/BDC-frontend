// To fix: Run `npm install feather-icons` in your project root to resolve the missing dependency.
import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import feather from 'feather-icons';
import { getDashboardCharts } from '../../services/AccountingService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Responsive hook
const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    windowSize
  };
};

// Responsive container component
const ResponsiveContainer = ({ children, className = '', maxWidth = 'max-w-7xl', padding = 'px-4 sm:px-6 lg:px-8' }) => {
  return (
    <div className={`mx-auto ${maxWidth} ${padding} ${className}`}>
      {children}
    </div>
  );
};

// Responsive grid component
const ResponsiveGrid = ({ children, cols = 'grid-cols-1', gap = 'gap-4 sm:gap-6', className = '' }) => {
  return (
    <div className={`grid ${cols} ${gap} ${className}`}>
      {children}
    </div>
  );
};

// Responsive card component
const ResponsiveCard = ({ children, className = '', padding = 'p-4 sm:p-6' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm ${padding} ${className}`}>
      {children}
    </div>
  );
};

// Responsive button component
const ResponsiveButton = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const StatCard = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    blue: { border: 'border-blue-500', bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { border: 'border-green-500', bg: 'bg-green-100', text: 'text-green-600' },
    red: { border: 'border-red-500', bg: 'bg-red-100', text: 'text-red-600' },
    purple: { border: 'border-purple-500', bg: 'bg-purple-100', text: 'text-purple-600' }
  };

  return (
    <ResponsiveCard className={`border-l-4 ${colorClasses[color]?.border}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-sm font-medium truncate">{title}</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 truncate">{value}</h3>
          <p className={`text-xs sm:text-sm mt-2 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '+' : ''}{change}% from last month
          </p>
        </div>
        <div className={`p-2 sm:p-3 rounded-full ml-4 flex-shrink-0 ${colorClasses[color]?.bg}`}>
          <i data-feather={icon} className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClasses[color]?.text}`}></i>
        </div>
      </div>
    </ResponsiveCard>
  );
};

const FinancialChart = ({ type }) => {
  const chartData = getDashboardCharts();
  const responsive = useResponsive();
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: type === 'income' ? false : true,
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          drawBorder: false
        },
        ticks: {
          font: {
            size: responsive.isMobile ? 10 : 12
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: responsive.isMobile ? 10 : 12
          }
        }
      }
    }
  };

  return (
    <ResponsiveCard>
      <h3 className="font-semibold text-lg mb-4">
        {type === 'income' ? 'Income Trend' : 'Revenue vs Expenses'}
      </h3>
      <div className="chart-container" style={{ height: responsive.isMobile ? '250px' : '300px' }}>
        {type === 'income' ? (
          <Line data={chartData.incomeData} options={options} />
        ) : (
          <Bar data={chartData.revenueExpensesData} options={options} />
        )}
      </div>
    </ResponsiveCard>
  );
};

const RecentTransactions = () => {
  const transactions = [
    { id: 1, name: 'Office Supplies', date: 'Today, 10:45 AM', amount: '-$245.50', category: 'expense', status: 'completed' },
    { id: 2, name: 'Client Payment', date: 'Today, 09:30 AM', amount: '$1,500.00', category: 'income', status: 'completed' },
    { id: 3, name: 'Software Subscription', date: 'Yesterday, 3:45 PM', amount: '-$99.00', category: 'expense', status: 'completed' },
    { id: 4, name: 'Consulting Fee', date: 'Yesterday, 11:20 AM', amount: '$750.00', category: 'income', status: 'pending' },
    { id: 5, name: 'Marketing Services', date: 'Jul 28, 2023', amount: '-$1,200.00', category: 'expense', status: 'completed' },
  ];

  return (
    <ResponsiveCard>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Recent Transactions</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap">View All</button>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex justify-between items-start sm:items-center pb-3 sm:pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="flex items-start min-w-0 flex-1">
              <div className={`p-2 rounded-full mr-3 mt-1 flex-shrink-0 ${transaction.category === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                <i 
                  data-feather={transaction.category === 'income' ? 'dollar-sign' : 'shopping-bag'} 
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${transaction.category === 'income' ? 'text-green-600' : 'text-red-600'}`}
                ></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base truncate">{transaction.name}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{transaction.date}</p>
              </div>
            </div>
            <div className="text-right ml-2 flex-shrink-0">
              <p className={`font-medium text-sm sm:text-base whitespace-nowrap ${transaction.category === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.amount}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {transaction.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ResponsiveCard>
  );
};

const AccountBalances = () => {
  const accounts = [
    { name: 'Business Checking', number: '****4532', balance: '$25,430.50', color: 'blue' },
    { name: 'Savings Account', number: '****7854', balance: '$42,100.00', color: 'green' },
    { name: 'Credit Card', number: '****9012', balance: '-$3,245.75', color: 'red' },
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' }
  };

  return (
    <ResponsiveCard>
      <h3 className="font-semibold text-lg mb-4">Account Balances</h3>
      <div className="space-y-3 sm:space-y-4">
        {accounts.map((account, index) => (
          <div key={index} className="flex justify-between items-start sm:items-center pb-3 sm:pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="flex items-start min-w-0 flex-1">
              <div className={`p-2 rounded-full mr-3 mt-1 flex-shrink-0 ${colorClasses[account.color]?.bg}`}>
                <i 
                  data-feather={account.color === 'red' ? 'credit-card' : 'dollar-sign'} 
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${colorClasses[account.color]?.text}`}
                ></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base truncate">{account.name}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{account.number}</p>
              </div>
            </div>
            <p className={`font-medium text-sm sm:text-base whitespace-nowrap ml-2 ${account.color === 'red' ? 'text-red-600' : 'text-gray-800'}`}>
              {account.balance}
            </p>
          </div>
        ))}
      </div>
    </ResponsiveCard>
  );
};

const QuickActions = ({ onNavigate }) => {
  const actions = [
    { icon: 'plus', title: 'New Invoice', color: 'blue', action: 'invoices' },
    { icon: 'file-text', title: 'Create Bill', color: 'red', action: 'expenses' },
    { icon: 'dollar-sign', title: 'Record Payment', color: 'green', action: 'transactionsList' },
    { icon: 'upload', title: 'Import Data', color: 'purple', action: 'accountingSettings' },
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', iconBg: 'bg-blue-100', text: 'text-blue-600' },
    red: { bg: 'bg-red-50', hover: 'hover:bg-red-100', iconBg: 'bg-red-100', text: 'text-red-600' },
    green: { bg: 'bg-green-50', hover: 'hover:bg-green-100', iconBg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', iconBg: 'bg-purple-100', text: 'text-purple-600' }
  };

  return (
    <ResponsiveCard>
      <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {actions.map((action, index) => (
          <button 
            key={index} 
            onClick={() => onNavigate && onNavigate(action.action)}
            className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg ${colorClasses[action.color]?.bg} ${colorClasses[action.color]?.hover} transition-colors`}
          >
            <div className={`p-2 sm:p-3 rounded-full mb-2 ${colorClasses[action.color]?.iconBg}`}>
              <i data-feather={action.icon} className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClasses[action.color]?.text}`}></i>
            </div>
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">{action.title}</span>
          </button>
        ))}
      </div>
    </ResponsiveCard>
  );
};

const FinancialSummary = () => {
  return (
    <ResponsiveCard>
      <h3 className="font-semibold text-lg mb-4">Financial Summary</h3>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm sm:text-base">Total Assets</span>
          <span className="font-medium text-sm sm:text-base">$100,000.00</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm sm:text-base">Total Liabilities</span>
          <span className="font-medium text-sm sm:text-base">$50,000.00</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm sm:text-base">Net Worth</span>
          <span className="font-medium text-sm sm:text-base">$50,000.00</span>
        </div>
        <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-gray-100">
          <span className="text-gray-600 text-sm sm:text-base">This Month Income</span>
          <span className="font-medium text-green-600 text-sm sm:text-base">$10,000.00</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm sm:text-base">This Month Expenses</span>
          <span className="font-medium text-red-600 text-sm sm:text-base">$4,500.00</span>
        </div>
        <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-gray-100">
          <span className="text-gray-600 text-sm sm:text-base">Net Income</span>
          <span className="font-medium text-blue-600 text-sm sm:text-base">$5,500.00</span>
        </div>
      </div>
    </ResponsiveCard>
  );
};

// New Accounting Sections Component
const AccountingSections = ({ onNavigate }) => {
  const responsive = useResponsive();
  
  const sections = [
    {
      title: "Management",
      items: [
        { name: "Customer Management", icon: "users", action: "customer", description: "Manage customers and client information" },
        { name: "Center Management", icon: "home", action: "center", description: "Manage business centers" }
      ]
    },
    {
      title: "Chart of Accounts",
      items: [
        { name: "Account List", icon: "list", action: "accountList", description: "View and manage all accounts" },
        { name: "Supplier Enter Bill", icon: "file-text", action: "supplierEnterBill", description: "Create bills for suppliers" },
        { name: "Payment", icon: "dollar-sign", action: "payment", description: "Record payments to suppliers" },
        { name: "Advance Payment", icon: "credit-card", action: "advancePayment", description: "Manage advance payments" },
        { name: "Make Deposit", icon: "trending-up", action: "makeDeposit", description: "Record deposits to bank accounts" },
        { name: "Receipt", icon: "receipt", action: "receipt", description: "Record customer receipts" },
        { name: "Create Utility Bill", icon: "zap", action: "createUtilityBill", description: "Create utility bills" },
        { name: "Utility Bill Payment", icon: "check-circle", action: "utilityBillPayment", description: "Pay utility bills" },
        { name: "Journal Entry", icon: "book-open", action: "journalEntry", description: "Create manual journal entries" },
        { name: "Petty Cash", icon: "piggy-bank", action: "pettyCash", description: "Manage petty cash transactions" },
        { name: "Cheque", icon: "file-minus", action: "cheque", description: "Manage cheque transactions" },
        { name: "Bank Reconciliation", icon: "refresh-cw", action: "bankReconciliation", description: "Reconcile bank statements" }
      ]
    },
    {
      title: "Transactions", 
      items: [
        { name: "Transaction List", icon: "file-text", action: "transactionsList", description: "View all transactions" },
        { name: "Invoices", icon: "file", action: "invoices", description: "Create and manage invoices" },
        { name: "Sales Orders", icon: "shopping-cart", action: "salesOrder", description: "Manage sales orders" },
        { name: "Sales Return", icon: "rotate-ccw", action: "salesReturn", description: "Process sales returns" },
        { name: "GRN", icon: "truck", action: "grn", description: "Goods Received Notes" },
        { name: "Purchase Return", icon: "arrow-left-circle", action: "purchaseReturn", description: "Process purchase returns" },
        { name: "Purchase Orders", icon: "shopping-bag", action: "purchaseOrder", description: "Manage purchase orders" },
        { name: "Stock Transfer", icon: "refresh-cw", action: "stockTransfer", description: "Transfer stock between locations" },
        { name: "Stock Verification", icon: "check-square", action: "stockVerification", description: "Verify stock levels" }
      ]
    },
    {
      title: "Finance Reports",
      items: [
        { name: "Trial Balance", icon: "bar-chart-2", action: "trialBalance", description: "View trial balance reports" },
        { name: "Income Statement", icon: "trending-up", action: "incomeStatement", description: "Profit and loss statements" },
        { name: "Balance Sheet", icon: "pie-chart", action: "balanceSheet", description: "Assets, liabilities & equity" },
        { name: "Cash Flow Statement", icon: "dollar-sign", action: "cashFlowStatement", description: "Cash flow analysis" }
      ]
    },
    {
      title: "Other",
      items: [
        { name: "Ledger", icon: "book", action: "ledger", description: "General ledger entries" },
        { name: "Expenses", icon: "credit-card", action: "expenses", description: "Manage business expenses" },
        { name: "Settings", icon: "settings", action: "accountingSettings", description: "Configure accounting settings" }
      ]
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {sections.map((section, sectionIndex) => (
        <ResponsiveCard key={sectionIndex} className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{section.title}</h3>
          <ResponsiveGrid 
            cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} 
            gap="gap-3 sm:gap-4"
          >
            {section.items.map((item, itemIndex) => (
              <button
                key={itemIndex}
                onClick={() => onNavigate && onNavigate(item.action)}
                className="flex items-start p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:shadow-md transition-all duration-200 group text-left w-full"
              >
                <div className="flex-shrink-0 mr-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <i data-feather={item.icon} className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5"></i>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm sm:text-base text-gray-900 group-hover:text-blue-900 truncate">{item.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
              </button>
            ))}
          </ResponsiveGrid>
        </ResponsiveCard>
      ))}
    </div>
  );
};

const Dashboard = ({ setActiveItem }) => {
  const responsive = useResponsive();
  
  useEffect(() => {
    // Replace feather icons after component mounts
    feather.replace();
  }, []);

  const handleNavigate = (action) => {
    if (setActiveItem) {
      setActiveItem(action);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <ResponsiveContainer className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Accounting Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">Overview of your accounting system and quick access to all modules</p>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <i data-feather="bell" className="w-4 h-4 sm:w-5 sm:h-5"></i>
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-2 flex-shrink-0">
                  JD
                </div>
                <span className="text-sm sm:text-base font-medium hidden sm:block">John Doe</span>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </header>

      {/* Main Content */}
      <main>
        <ResponsiveContainer className="py-4 sm:py-6">
          {/* Welcome Section */}
          <ResponsiveCard className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white mb-6 sm:mb-8 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">Welcome to Accounting</h2>
                <p className="text-blue-100 text-sm sm:text-base">Manage your financial operations efficiently with our comprehensive accounting tools</p>
              </div>
              <div className="hidden sm:block flex-shrink-0">
                <i data-feather="bar-chart-2" className="w-12 h-12 sm:w-16 sm:h-16 text-blue-200"></i>
              </div>
            </div>
          </ResponsiveCard>

          {/* Stats Cards */}
          <ResponsiveGrid 
            cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} 
            gap="gap-4 sm:gap-6" 
            className="mb-6 sm:mb-8"
          >
            <StatCard 
              title="Total Revenue" 
              value="$25,430" 
              change={12.5} 
              icon="dollar-sign" 
              color="green" 
            />
            <StatCard 
              title="Total Expenses" 
              value="$12,450" 
              change={8.3} 
              icon="trending-down" 
              color="red" 
            />
            <StatCard 
              title="Net Profit" 
              value="$12,980" 
              change={15.2} 
              icon="bar-chart-2" 
              color="blue" 
            />
            <StatCard 
              title="Cash Flow" 
              value="$8,750" 
              change={5.7} 
              icon="repeat" 
              color="purple" 
            />
          </ResponsiveGrid>

          {/* Charts */}
          <ResponsiveGrid 
            cols={responsive.isDesktop ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} 
            gap="gap-6 sm:gap-8" 
            className="mb-6 sm:mb-8"
          >
            <FinancialChart type="income" />
            <FinancialChart type="revenue-expenses" />
          </ResponsiveGrid>

          {/* Accounting Sections */}
          <AccountingSections onNavigate={handleNavigate} />

          {/* Bottom Section */}
          <ResponsiveGrid 
            cols={responsive.isDesktop ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} 
            gap="gap-6 sm:gap-8" 
            className="mt-6 sm:mt-8"
          >
            <div className={responsive.isDesktop ? 'lg:col-span-2' : ''}>
              <div className="space-y-6 sm:space-y-8">
                <RecentTransactions />
                <QuickActions onNavigate={handleNavigate} />
              </div>
            </div>
            <div className="space-y-6 sm:space-y-8">
              <AccountBalances />
              <FinancialSummary />
            </div>
          </ResponsiveGrid>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default Dashboard;