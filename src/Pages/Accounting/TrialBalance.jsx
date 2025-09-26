import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

const TrialBalance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [searchTerm, setSearchTerm] = useState("");
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [accounts, setAccounts] = useState([
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
  ]);

  const [filteredAccounts, setFilteredAccounts] = useState(accounts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(
        (account) =>
          account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.code.includes(searchTerm) ||
          account.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (!showZeroBalances) {
      filtered = filtered.filter((account) => account.balance !== 0);
    }

    setFilteredAccounts(filtered);
  }, [searchTerm, showZeroBalances, accounts]);

  const calculateTotals = () => {
    const totalDebits = filteredAccounts.reduce((sum, account) => sum + account.debit, 0);
    const totalCredits = filteredAccounts.reduce((sum, account) => sum + account.credit, 0);
    const isBalanced = totalDebits === totalCredits;
    
    return {
      totalDebits,
      totalCredits,
      isBalanced,
      difference: Math.abs(totalDebits - totalCredits)
    };
  };

  const groupAccountsByType = () => {
    const grouped = {};
    filteredAccounts.forEach(account => {
      if (!grouped[account.type]) {
        grouped[account.type] = [];
      }
      grouped[account.type].push(account);
    });
    return grouped;
  };

  const totals = calculateTotals();
  const groupedAccounts = groupAccountsByType();
  const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const exportToCSV = () => {
    const headers = ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit', 'Balance'];
    const csvContent = [
      headers.join(','),
      ...filteredAccounts.map(account => 
        [account.code, account.name, account.type, account.debit, account.credit, account.balance].join(',')
      ),
      '',  // Empty row
      'Summary,,,,,',
      `Total Debits,,,${totals.totalDebits},,`,
      `Total Credits,,,,${totals.totalCredits},`,
      `Difference,,,,,${totals.difference}`,
      `Balanced,,,,,${totals.isBalanced ? 'Yes' : 'No'}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
              <p className="text-gray-600 mt-1">Check that total debits equal total credits</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Debits</p>
                <p className="text-2xl font-bold text-blue-600">${totals.totalDebits.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-green-600">${totals.totalCredits.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Difference</p>
                <p className={`text-2xl font-bold ${totals.difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totals.difference.toLocaleString()}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${totals.difference === 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className={`text-lg font-bold ${totals.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.isBalanced ? 'Balanced' : 'Out of Balance'}
                </p>
              </div>
              {totals.isBalanced ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="current">Current Period</option>
                <option value="previous">Previous Period</option>
                <option value="ytd">Year to Date</option>
                <option value="custom">Custom Range</option>
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showZeroBalances}
                  onChange={(e) => setShowZeroBalances(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Show zero balances</span>
              </label>
            </div>
          </div>
        </div>

        {/* Trial Balance Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Account Balances</h3>
          </div>
          
          {accountTypes.map(type => {
            const typeAccounts = groupedAccounts[type] || [];
            if (typeAccounts.length === 0) return null;
            
            const typeTotal = typeAccounts.reduce((sum, account) => {
              return type === 'Asset' || type === 'Expense' 
                ? sum + account.debit - account.credit
                : sum + account.credit - account.debit;
            }, 0);

            return (
              <div key={type} className="border-b border-gray-100 last:border-b-0">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">{type}s</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {typeAccounts.map((account) => (
                        <tr key={account.code} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {account.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {account.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {account.debit > 0 ? `$${account.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {account.credit > 0 ? `$${account.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                            account.balance > 0 ? 'text-blue-600' : account.balance < 0 ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            ${Math.abs(account.balance).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          
          {/* Totals */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">TOTALS</span>
              <div className="flex gap-8">
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">${totals.totalDebits.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Total Debits</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">${totals.totalCredits.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Total Credits</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    totals.isBalanced ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {totals.isBalanced ? 'BALANCED' : `OUT BY $${totals.difference.toLocaleString()}`}
                  </div>
                  <div className="text-sm text-gray-500">Status</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Alert */}
        {!totals.isBalanced && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-medium text-red-800">Trial Balance is Out of Balance</h4>
                <p className="text-sm text-red-700 mt-1">
                  There is a difference of ${totals.difference.toLocaleString()} between total debits and credits. 
                  Please review your account balances and journal entries.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialBalance;
