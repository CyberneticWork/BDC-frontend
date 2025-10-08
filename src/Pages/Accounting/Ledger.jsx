import React, { useState, useEffect } from "react";
import { getLedger, getChartOfAccounts } from "../../services/AccountingService";
import { useResponsive } from "../../hooks/useResponsive";
import {
  ResponsivePageWrapper,
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableHeaderCell,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableCell,
  ResponsiveButton,
  ResponsiveFormGroup,
  ResponsiveSelect,
  ResponsiveInput,
  ResponsiveLoadingSpinner,
  ResponsiveBadge
} from "../../components/Accounting/ResponsiveAccountingComponents";

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
        <ResponsiveLoadingSpinner size="lg" />
      </div>
    );
  }

  const responsive = useResponsive();

  const actions = (
    <>
      <ResponsiveButton variant="outline" size="sm">
        Export
      </ResponsiveButton>
      <ResponsiveButton variant="primary" size="sm">
        Print
      </ResponsiveButton>
    </>
  );

  return (
    <ResponsivePageWrapper 
      title="General Ledger" 
      subtitle="Detailed debit/credit entries for all accounts"
      actions={actions}
    >
      {/* Filters */}
      <ResponsiveCard className="mb-6">
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Filter Options</h3>
        </div>
        <ResponsiveGrid 
          cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} 
          gap="gap-4 sm:gap-6"
        >
          <ResponsiveFormGroup label="Account Filter">
            <ResponsiveSelect
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.name}>
                  {account.name}
                </option>
              ))}
            </ResponsiveSelect>
          </ResponsiveFormGroup>
          <ResponsiveFormGroup label="From Date">
            <ResponsiveInput
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
          </ResponsiveFormGroup>
          <ResponsiveFormGroup label="To Date">
            <ResponsiveInput
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </ResponsiveFormGroup>
        </ResponsiveGrid>
        {responsive.isMobile && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <ResponsiveButton variant="primary" size="sm" fullWidth>
              Apply Filters
            </ResponsiveButton>
          </div>
        )}
      </ResponsiveCard>

      {/* Ledger Content */}
      <div className="space-y-4 sm:space-y-6">
        {filteredLedgerData.map((accountLedger, index) => {
          const entriesWithBalance = calculateRunningBalance(accountLedger.entries);
          const totalDebits = accountLedger.entries.reduce((sum, entry) => sum + entry.debit, 0);
          const totalCredits = accountLedger.entries.reduce((sum, entry) => sum + entry.credit, 0);
          const netBalance = totalDebits - totalCredits;

          return (
            <ResponsiveCard key={index} className="overflow-hidden" padding="p-0">
              {/* Account Header */}
              <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {accountLedger.account}
                  </h3>
                  {responsive.isMobile ? (
                    /* Mobile Summary - Stacked */
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Debits:</span>
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(totalDebits)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Credits:</span>
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(totalCredits)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium text-gray-600">Net Balance:</span>
                        <span className={`text-sm font-bold ${
                          netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(netBalance)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Desktop Summary - Horizontal */
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
                  )}
                </div>
              </div>

              {/* Entries */}
              {responsive.isMobile ? (
                /* Mobile View - Card Layout */
                <div className="divide-y divide-gray-200">
                  {entriesWithBalance.map((entry, entryIndex) => (
                    <div key={entryIndex} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {entry.description || 'General Entry'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <ResponsiveBadge 
                            variant={entry.runningBalance >= 0 ? 'success' : 'danger'}
                            size="sm"
                          >
                            {formatCurrency(entry.runningBalance)}
                          </ResponsiveBadge>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div className="flex space-x-4">
                          <div>
                            <span className="text-gray-500">Debit: </span>
                            {entry.debit > 0 ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(entry.debit)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-500">Credit: </span>
                            {entry.credit > 0 ? (
                              <span className="text-red-600 font-medium">
                                {formatCurrency(entry.credit)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop View - Table Layout */
                <ResponsiveTable>
                  <ResponsiveTableHeader>
                    <ResponsiveTableHeaderCell>Date</ResponsiveTableHeaderCell>
                    <ResponsiveTableHeaderCell>Description</ResponsiveTableHeaderCell>
                    <ResponsiveTableHeaderCell align="right">Debit</ResponsiveTableHeaderCell>
                    <ResponsiveTableHeaderCell align="right">Credit</ResponsiveTableHeaderCell>
                    <ResponsiveTableHeaderCell align="right">Running Balance</ResponsiveTableHeaderCell>
                  </ResponsiveTableHeader>
                  <ResponsiveTableBody>
                    {entriesWithBalance.map((entry, entryIndex) => (
                      <ResponsiveTableRow key={entryIndex}>
                        <ResponsiveTableCell>
                          {new Date(entry.date).toLocaleDateString()}
                        </ResponsiveTableCell>
                        <ResponsiveTableCell truncate>
                          {entry.description || 'General Entry'}
                        </ResponsiveTableCell>
                        <ResponsiveTableCell align="right">
                          {entry.debit > 0 ? (
                            <span className="text-green-600 font-medium">
                              {formatCurrency(entry.debit)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </ResponsiveTableCell>
                        <ResponsiveTableCell align="right">
                          {entry.credit > 0 ? (
                            <span className="text-red-600 font-medium">
                              {formatCurrency(entry.credit)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </ResponsiveTableCell>
                        <ResponsiveTableCell align="right">
                          <span className={`font-medium ${
                            entry.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(entry.runningBalance)}
                          </span>
                        </ResponsiveTableCell>
                      </ResponsiveTableRow>
                    ))}
                  </ResponsiveTableBody>
                </ResponsiveTable>
              )}
            </ResponsiveCard>
          );
        })}
      </div>

      {/* Summary */}
      <ResponsiveCard className="mt-6 sm:mt-8">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Ledger Summary</h3>
        <ResponsiveGrid 
          cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} 
          gap="gap-4 sm:gap-6"
        >
          <div className={`text-center ${responsive.isMobile ? 'p-4 bg-green-50 rounded-lg' : ''}`}>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(
                filteredLedgerData.reduce((sum, account) => 
                  sum + account.entries.reduce((entrySum, entry) => entrySum + entry.debit, 0), 0
                )
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Debits</div>
          </div>
          <div className={`text-center ${responsive.isMobile ? 'p-4 bg-red-50 rounded-lg' : ''}`}>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {formatCurrency(
                filteredLedgerData.reduce((sum, account) => 
                  sum + account.entries.reduce((entrySum, entry) => entrySum + entry.credit, 0), 0
                )
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Credits</div>
          </div>
          <div className={`text-center ${responsive.isMobile ? 'p-4 bg-blue-50 rounded-lg' : ''}`}>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {formatCurrency(
                filteredLedgerData.reduce((sum, account) => {
                  const debits = account.entries.reduce((entrySum, entry) => entrySum + entry.debit, 0);
                  const credits = account.entries.reduce((entrySum, entry) => entrySum + entry.credit, 0);
                  return sum + (debits - credits);
                }, 0)
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Net Balance</div>
          </div>
        </ResponsiveGrid>
      </ResponsiveCard>
    </ResponsivePageWrapper>
  );
};

export default Ledger;
