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
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { getTrialBalanceAccounts } from '../../services/AccountingService';

const TrialBalance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [searchTerm, setSearchTerm] = useState("");
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [accounts, setAccounts] = useState(getTrialBalanceAccounts());
  const [expandedSections, setExpandedSections] = useState({});
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

  const toggleSection = (type) => {
    setExpandedSections(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

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

  const MobileAccountCard = ({ account }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-2">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-sm font-medium text-gray-900">{account.name}</div>
          <div className="text-xs text-gray-500">{account.code}</div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${
            account.balance > 0 ? 'text-blue-600' : account.balance < 0 ? 'text-green-600' : 'text-gray-900'
          }`}>
            ${Math.abs(account.balance).toLocaleString()}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Debit:</span>
          <span>{account.debit > 0 ? `$${account.debit.toLocaleString()}` : '-'}</span>
        </div>
        <div className="flex justify-between">
          <span>Credit:</span>
          <span>{account.credit > 0 ? `$${account.credit.toLocaleString()}` : '-'}</span>
        </div>
      </div>
    </div>
  );

  const MobileSectionHeader = ({ type, count, total, isExpanded, onToggle }) => (
    <div 
      className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer"
      onClick={onToggle}
    >
      <div>
        <h4 className="font-medium text-gray-900">{type}s</h4>
        <p className="text-xs text-gray-500">{count} accounts • ${Math.abs(total).toLocaleString()}</p>
      </div>
      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Trial Balance</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Check that total debits equal total credits</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Debits</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600">${totals.totalDebits.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">${totals.totalCredits.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Difference</p>
                <p className={`text-lg md:text-2xl font-bold ${totals.difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totals.difference.toLocaleString()}
                </p>
              </div>
              <DollarSign className={`h-6 w-6 md:h-8 md:w-8 ${totals.difference === 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Status</p>
                <p className={`text-sm md:text-lg font-bold ${totals.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.isBalanced ? 'Balanced' : 'Out of Balance'}
                </p>
              </div>
              {totals.isBalanced ? (
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
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

        {/* Trial Balance Table/Cards */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Account Balances</h3>
          </div>
          
          {window.innerWidth < 768 ? (
            // Mobile Card View
            <div>
              {accountTypes.map(type => {
                const typeAccounts = groupedAccounts[type] || [];
                if (typeAccounts.length === 0) return null;
                
                const typeTotal = typeAccounts.reduce((sum, account) => {
                  return type === 'Asset' || type === 'Expense' 
                    ? sum + account.debit - account.credit
                    : sum + account.credit - account.debit;
                }, 0);

                const isExpanded = expandedSections[type];

                return (
                  <div key={type} className="border-b border-gray-100 last:border-b-0">
                    <MobileSectionHeader
                      type={type}
                      count={typeAccounts.length}
                      total={typeTotal}
                      isExpanded={isExpanded}
                      onToggle={() => toggleSection(type)}
                    />
                    {isExpanded && (
                      <div className="p-4 space-y-2">
                        {typeAccounts.map((account) => (
                          <MobileAccountCard key={account.code} account={account} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Desktop Table View
            <>
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
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Code</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                            <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                            <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                            <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {typeAccounts.map((account) => (
                            <tr key={account.code} className="hover:bg-gray-50">
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {account.code}
                              </td>
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {account.name}
                              </td>
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {account.debit > 0 ? `$${account.debit.toLocaleString()}` : '-'}
                              </td>
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {account.credit > 0 ? `$${account.credit.toLocaleString()}` : '-'}
                              </td>
                              <td className={`px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
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
            </>
          )}
          
          {/* Totals */}
          <div className="bg-gray-50 px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <span className="text-base md:text-lg font-semibold text-gray-900">TOTALS</span>
              <div className="flex flex-col sm:flex-row gap-4 md:gap-8">
                <div className="text-center sm:text-right">
                  <div className="text-base md:text-lg font-bold text-blue-600">${totals.totalDebits.toLocaleString()}</div>
                  <div className="text-xs md:text-sm text-gray-500">Total Debits</div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-base md:text-lg font-bold text-green-600">${totals.totalCredits.toLocaleString()}</div>
                  <div className="text-xs md:text-sm text-gray-500">Total Credits</div>
                </div>
                <div className="text-center sm:text-right">
                  <div className={`text-base md:text-lg font-bold ${
                    totals.isBalanced ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {totals.isBalanced ? 'BALANCED' : `OUT BY $${totals.difference.toLocaleString()}`}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">Status</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Alert */}
        {!totals.isBalanced && (
          <div className="mt-4 md:mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 text-sm md:text-base">Trial Balance is Out of Balance</h4>
                <p className="text-xs md:text-sm text-red-700 mt-1">
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