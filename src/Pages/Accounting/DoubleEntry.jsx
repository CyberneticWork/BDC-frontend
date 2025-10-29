import React, { useState, useEffect } from "react";
import { Plus, Trash2, FileText, Edit2 } from "lucide-react";
import { getAccountList } from "../../services/Account/AccountService";

const DoubleEntry = () => {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    debitAccount: "",
    creditAccount: "",
    amount: "",
    reference: "",
    remarks: "",
  });
  const [trialBalance, setTrialBalance] = useState({
    totalDebits: 0,
    totalCredits: 0,
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch accounts from database
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const list = await getAccountList();
        // Ensure openingBalance is a number
        const formattedAccounts = list.map(account => ({
          ...account,
          openingBalance: parseFloat(account.openingBalance) || 0
        }));
        setAccounts(formattedAccounts);
      } catch (err) {
        console.error("Failed to load accounts:", err);
        alert("Could not load accounts. Using fallback.");
        // Fallback mock data with proper number values
        setAccounts([
          { id: 1, accountNumber: "1001", accountName: "Cash On Hand", accountType: "ASSETS", openingBalance: 10000 },
          { id: 2, accountNumber: "1002", accountName: "Accounts Receivable", accountType: "ASSETS", openingBalance: 5000 },
          { id: 3, accountNumber: "4001", accountName: "Sales Revenue", accountType: "INCOME", openingBalance: 0 },
          { id: 4, accountNumber: "2001", accountName: "Accounts Payable", accountType: "LIABILITIES", openingBalance: 3000 },
          { id: 5, accountNumber: "5001", accountName: "Rent Expense", accountType: "EXPENSES", openingBalance: 2000 },
          { id: 6, accountNumber: "3001", accountName: "Owner's Capital", accountType: "EQUITY", openingBalance: 15000 },
        ]);
      }
    };
    fetchAccounts();
  }, []);

  // Update trial balance
  useEffect(() => {
    const totalDebits = entries.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalCredits = totalDebits; // Always equal in double entry
    setTrialBalance({ totalDebits, totalCredits });
  }, [entries]);

  // Find account by name
  const findAccount = (name) => accounts.find((a) => a.accountName === name) || {};

  // Get account balance type (debit/credit)
  const getAccountBalanceType = (accountType) => {
    switch (accountType) {
      case "ASSETS":
      case "EXPENSES":
        return "DEBIT";
      case "LIABILITIES":
      case "EQUITY":
      case "INCOME":
        return "CREDIT";
      default:
        return "DEBIT";
    }
  };

  // Calculate opening balances for display - FIXED VERSION
  const getOpeningBalanceDisplay = (account) => {
    const balanceType = getAccountBalanceType(account.accountType);
    // Ensure openingBalance is a number, default to 0 if invalid
    const openingBalance = parseFloat(account.openingBalance) || 0;

    return {
      debit: balanceType === "DEBIT" ? openingBalance.toFixed(2) : "-",
      credit: balanceType === "CREDIT" ? openingBalance.toFixed(2) : "-"
    };
  };

  // Calculate total opening balances - FIXED VERSION
  const calculateTotalOpeningBalances = () => {
    let totalDebit = 0;
    let totalCredit = 0;

    accounts.forEach(account => {
      const balanceType = getAccountBalanceType(account.accountType);
      // Ensure openingBalance is a number, default to 0 if invalid
      const openingBalance = parseFloat(account.openingBalance) || 0;

      if (balanceType === "DEBIT") {
        totalDebit += openingBalance;
      } else {
        totalCredit += openingBalance;
      }
    });

    return { totalDebit, totalCredit };
  };

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.description || !formData.debitAccount || !formData.creditAccount || !formData.amount) {
      alert("Please fill all required fields.");
      return;
    }
    if (formData.debitAccount === formData.creditAccount) {
      alert("Debit and Credit accounts cannot be the same.");
      return;
    }

    const debitAcc = findAccount(formData.debitAccount);
    const creditAcc = findAccount(formData.creditAccount);

    // Validate account types for debit/credit rules
    const debitBalanceType = getAccountBalanceType(debitAcc.accountType);
    const creditBalanceType = getAccountBalanceType(creditAcc.accountType);

    if (debitBalanceType !== "DEBIT") {
      alert(`Invalid debit account: ${debitAcc.accountName} is a ${creditBalanceType} balance account`);
      return;
    }

    if (creditBalanceType !== "CREDIT") {
      alert(`Invalid credit account: ${creditAcc.accountName} is a ${debitBalanceType} balance account`);
      return;
    }

    const newEntry = {
      id: editingId || Date.now(),
      ...formData,
      amount: parseFloat(formData.amount) || 0,
    };

    if (editingId) {
      setEntries(entries.map((e) => (e.id === editingId ? newEntry : e)));
      setEditingId(null);
    } else {
      setEntries([...entries, newEntry]);
    }

    // Reset form
    setFormData({
      date: "",
      description: "",
      debitAccount: "",
      creditAccount: "",
      amount: "",
      reference: "",
      remarks: "",
    });
  };

  // Edit entry
  const handleEdit = (entry) => {
    setFormData({
      date: entry.date,
      description: entry.description,
      debitAccount: entry.debitAccount,
      creditAccount: entry.creditAccount,
      amount: entry.amount ? entry.amount.toString() : "",
      reference: entry.reference || "",
      remarks: entry.remarks || "",
    });
    setEditingId(entry.id);
  };

  // Delete entry
  const handleDelete = (id) => {
    if (window.confirm("Delete this journal entry?")) {
      setEntries(entries.filter((e) => e.id !== id));
    }
  };

  const openingBalances = calculateTotalOpeningBalances();

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Double Entry Journal</h1>
        <p className="text-gray-600">Record transactions with debits and credits.</p>
      </div>

      {/* Form */}
      {/* <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              type="text"
              placeholder="e.g., Cash sale"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debit Account *</label>
            <select
              value={formData.debitAccount}
              onChange={(e) => setFormData({ ...formData, debitAccount: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">Select Debit Account</option>
              {accounts
                .filter(acc => getAccountBalanceType(acc.accountType) === "DEBIT")
                .map((acc) => (
                  <option key={acc.id} value={acc.accountName}>
                    [{acc.accountNumber}] {acc.accountName} ({acc.accountType})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Account *</label>
            <select
              value={formData.creditAccount}
              onChange={(e) => setFormData({ ...formData, creditAccount: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">Select Credit Account</option>
              {accounts
                .filter(acc => getAccountBalanceType(acc.accountType) === "CREDIT")
                .map((acc) => (
                  <option key={acc.id} value={acc.accountName}>
                    [{acc.accountNumber}] {acc.accountName} ({acc.accountType})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference (optional)</label>
            <input
              type="text"
              placeholder="VCH-1025"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
            <textarea
              placeholder="Additional notes..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={2}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {editingId ? "Update Entry" : "Add Entry"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  date: "",
                  description: "",
                  debitAccount: "",
                  creditAccount: "",
                  amount: "",
                  reference: "",
                  remarks: "",
                });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form> */}

      {/* Opening Balances Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-900">Double Entry Table</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Account Num</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Account Name</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Account Type</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Debit (Rs)</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Credit (Rs)</th>
                {/* <th className="px-4 py-2 text-left font-medium text-gray-500">Remarks</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Actions</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p>No accounts found.</p>
                  </td>
                </tr>
              ) : (
                accounts.map((account) => {
                  const balanceDisplay = getOpeningBalanceDisplay(account);
                  return (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">
                        {account.created_at ? account.created_at.split('T')[0] : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{account.accountNumber}</td>
                      <td className="px-4 py-3">{account.accountName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${account.accountType === "ASSETS" ? "bg-blue-100 text-blue-800" :
                            account.accountType === "LIABILITIES" ? "bg-orange-100 text-orange-800" :
                              account.accountType === "EQUITY" ? "bg-purple-100 text-purple-800" :
                                account.accountType === "INCOME" ? "bg-green-100 text-green-800" :
                                  "bg-red-100 text-red-800"
                          }`}>
                          {account.accountType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">
                        {balanceDisplay.debit}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-700">
                        {balanceDisplay.credit}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right">Total:</td>
                <td className="px-4 py-3 text-right text-green-700">
                  Rs. {openingBalances.totalDebit.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-red-700">
                  Rs. {openingBalances.totalCredit.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Journal Entries Table - Double Entry Format */}
      {/* <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Journal Entries</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Account Num</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Account Name</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Account Type</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Description</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Debit (Rs)</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Credit (Rs)</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Ref</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Remarks</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p>No journal entries yet. Add your first transaction.</p>
                  </td>
                </tr>
              ) : (
                entries.flatMap((entry) => {
                  const debitAcc = findAccount(entry.debitAccount);
                  const creditAcc = findAccount(entry.creditAccount);
                  const amount = (parseFloat(entry.amount) || 0).toFixed(2);

                  return [
                    // Debit Row
                    <tr key={`${entry.id}-debit`} className="bg-green-50/30">
                      <td className="px-4 py-3">{entry.date}</td>
                      <td className="px-4 py-3 font-mono text-xs">{debitAcc.accountNumber || "-"}</td>
                      <td className="px-4 py-3">{debitAcc.accountName || entry.debitAccount}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          {debitAcc.accountType || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{entry.description}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">{amount}</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-xs">{entry.reference || "-"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{entry.remarks || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          <Edit2 className="h-4 w-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>,
                    // Credit Row
                    <tr key={`${entry.id}-credit`} className="bg-red-50/30">
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 font-mono text-xs">{creditAcc.accountNumber || "-"}</td>
                      <td className="px-4 py-3">{creditAcc.accountName || entry.creditAccount}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          {creditAcc.accountType || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right font-medium text-red-700">{amount}</td>
                      <td className="px-4 py-3 text-xs"></td>
                      <td className="px-4 py-3 text-xs text-gray-600"></td>
                      <td className="px-4 py-3 text-right"></td>
                    </tr>,
                  ];
                })
              )}
            </tbody>
          </table>
        </div>
      </div> */}

      {/* Trial Balance */}
      {/* <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Trial Balance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-green-700">Total Debits:</span>{" "}
            <span className="font-mono">Rs. {trialBalance.totalDebits.toFixed(2)}</span>
          </div>
          <div>
            <span className="font-medium text-red-700">Total Credits:</span>{" "}
            <span className="font-mono">Rs. {trialBalance.totalCredits.toFixed(2)}</span>
          </div>
          <div className="font-medium">
            {trialBalance.totalDebits === trialBalance.totalCredits ? (
              <span className="text-green-600">Balanced</span>
            ) : (
              <span className="text-red-600">Unbalanced</span>
            )}
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default DoubleEntry;