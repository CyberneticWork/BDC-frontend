import React, { useState, useEffect } from "react";
import { getLedger, getChartOfAccounts } from "../../services/AccountingService";

const Ledger = () => {
  const [ledgerData, setLedgerData] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    try {
      const ledger = getLedger();
      const chartOfAccounts = getChartOfAccounts();
      setLedgerData(ledger);
      setAccounts(chartOfAccounts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching ledger data:", error);
      setLoading(false);
    }
  };

  const filteredLedgerData = selectedAccount
    ? ledgerData.filter(item => item.account === selectedAccount)
    : ledgerData;

  const calculateRunningBalance = (entries) => {
    let runningBalance = 0;
    return entries.map(entry => {
      runningBalance += entry.debit - entry.credit;
      return { ...entry, runningBalance };
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
          <p className="text-gray-600 mt-1">Detailed debit/credit entries for all accounts</p>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Filter
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Accounts</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.name}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Ledger Content */}
        <div className="space-y-6">
          {filteredLedgerData.map((accountLedger, index) => {
            const entriesWithBalance = calculateRunningBalance(accountLedger.entries);
            const totalDebits = accountLedger.entries.reduce((sum, entry) => sum + entry.debit, 0);
            const totalCredits = accountLedger.entries.reduce((sum, entry) => sum + entry.credit, 0);
            const netBalance = totalDebits - totalCredits;

            return (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Account Header */}
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {accountLedger.account}
                    </h3>
                    <div className="flex space-x-6 text-sm">
                      <div>
                        <span className="text-gray-600">Total Debits: </span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(totalDebits)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Credits: </span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(totalCredits)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Net Balance: </span>
                        <span className={`font-medium ${
                          netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(netBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Entries Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Debit
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credit
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Running Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {entriesWithBalance.map((entry, entryIndex) => (
                        <tr key={entryIndex} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {entry.description || 'General Entry'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {entry.debit > 0 ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(entry.debit)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {entry.credit > 0 ? (
                              <span className="text-red-600 font-medium">
                                {formatCurrency(entry.credit)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={`font-medium ${
                              entry.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(entry.runningBalance)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ledger Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  filteredLedgerData.reduce((sum, account) => 
                    sum + account.entries.reduce((entrySum, entry) => entrySum + entry.debit, 0), 0
                  )
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Debits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  filteredLedgerData.reduce((sum, account) => 
                    sum + account.entries.reduce((entrySum, entry) => entrySum + entry.credit, 0), 0
                  )
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Credits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(
                  filteredLedgerData.reduce((sum, account) => {
                    const debits = account.entries.reduce((entrySum, entry) => entrySum + entry.debit, 0);
                    const credits = account.entries.reduce((entrySum, entry) => entrySum + entry.credit, 0);
                    return sum + (debits - credits);
                  }, 0)
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">Net Balance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ledger;
