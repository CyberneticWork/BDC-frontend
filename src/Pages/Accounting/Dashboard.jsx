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

const StatCard = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    blue: { border: 'border-blue-500', bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { border: 'border-green-500', bg: 'bg-green-100', text: 'text-green-600' },
    red: { border: 'border-red-500', bg: 'bg-red-100', text: 'text-red-600' },
    purple: { border: 'border-purple-500', bg: 'bg-purple-100', text: 'text-purple-600' }
  };

  return (
    <div className={`card bg-white rounded-xl p-6 shadow-sm border-l-4 ${colorClasses[color]?.border}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '+' : ''}{change}% from last month
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]?.bg}`}>
          <i data-feather={icon} className={colorClasses[color]?.text}></i>
        </div>
      </div>
    </div>
  );
};

const FinancialChart = ({ type }) => {
  const incomeData = {
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
  };

  const revenueExpensesData = {
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
  };

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
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        }
      }
    }
  };

  return (
    <div className="card bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">
        {type === 'income' ? 'Income Trend' : 'Revenue vs Expenses'}
      </h3>
      <div className="chart-container" style={{ height: '300px' }}>
        {type === 'income' ? (
          <Line data={incomeData} options={options} />
        ) : (
          <Bar data={revenueExpensesData} options={options} />
        )}
      </div>
    </div>
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
    <div className="card bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Recent Transactions</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
      </div>
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="flex items-center">
              <div className={`p-2 rounded-full mr-3 ${transaction.category === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                <i 
                  data-feather={transaction.category === 'income' ? 'dollar-sign' : 'shopping-bag'} 
                  className={transaction.category === 'income' ? 'text-green-600' : 'text-red-600'}
                ></i>
              </div>
              <div>
                <p className="font-medium">{transaction.name}</p>
                <p className="text-sm text-gray-500">{transaction.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-medium ${transaction.category === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.amount}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {transaction.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
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
    <div className="card bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Account Balances</h3>
      <div className="space-y-4">
        {accounts.map((account, index) => (
          <div key={index} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="flex items-center">
              <div className={`p-2 rounded-full mr-3 ${colorClasses[account.color]?.bg}`}>
                <i 
                  data-feather={account.color === 'red' ? 'credit-card' : 'dollar-sign'} 
                  className={colorClasses[account.color]?.text}
                ></i>
              </div>
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-sm text-gray-500">{account.number}</p>
              </div>
            </div>
            <p className={`font-medium ${account.color === 'red' ? 'text-red-600' : 'text-gray-800'}`}>
              {account.balance}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuickActions = () => {
  const actions = [
    { icon: 'plus', title: 'New Invoice', color: 'blue' },
    { icon: 'file-text', title: 'Create Bill', color: 'red' },
    { icon: 'dollar-sign', title: 'Record Payment', color: 'green' },
    { icon: 'upload', title: 'Import Data', color: 'purple' },
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', iconBg: 'bg-blue-100', text: 'text-blue-600' },
    red: { bg: 'bg-red-50', hover: 'hover:bg-red-100', iconBg: 'bg-red-100', text: 'text-red-600' },
    green: { bg: 'bg-green-50', hover: 'hover:bg-green-100', iconBg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', iconBg: 'bg-purple-100', text: 'text-purple-600' }
  };

  return (
    <div className="card bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <button 
            key={index} 
            className={`flex flex-col items-center justify-center p-4 rounded-lg ${colorClasses[action.color]?.bg} ${colorClasses[action.color]?.hover} transition-colors`}
          >
            <div className={`p-3 rounded-full mb-2 ${colorClasses[action.color]?.iconBg}`}>
              <i data-feather={action.icon} className={colorClasses[action.color]?.text}></i>
            </div>
            <span className="text-sm font-medium">{action.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const FinancialSummary = () => {
  return (
    <div className="card bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Financial Summary</h3>
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Assets</span>
          <span className="font-medium">$100,000.00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Liabilities</span>
          <span className="font-medium">$50,000.00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Net Worth</span>
          <span className="font-medium">$50,000.00</span>
        </div>
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <span className="text-gray-600">This Month Income</span>
          <span className="font-medium text-green-600">$10,000.00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">This Month Expenses</span>
          <span className="font-medium text-red-600">$4,500.00</span>
        </div>
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <span className="text-gray-600">Net Income</span>
          <span className="font-medium text-blue-600">$5,500.00</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  useEffect(() => {
    // Replace feather icons after component mounts
    feather.replace();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Accounting Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <i data-feather="bell"></i>
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-2">
                JD
              </div>
              <span className="text-sm font-medium">John Doe</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="dashboard-grid mb-8" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
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
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FinancialChart type="income" />
          <FinancialChart type="revenue-expenses" />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentTransactions />
            <QuickActions />
          </div>
          <div className="space-y-6">
            <AccountBalances />
            <FinancialSummary />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;