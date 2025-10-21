import React, { useState, useEffect } from "react";
import { Plus, Trash2, FileText, Edit2 } from "lucide-react";

const DoubleEntry = () => {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    debitAccount: "",
    creditAccount: "",
    amount: "",
    reference: "",
    remarks: "",
  });
  const [accounts, setAccounts] = useState([]);
  const [trialBalance, setTrialBalance] = useState({
    totalDebits: 0,
    totalCredits: 0,
  });
  const [editingId, setEditingId] = useState(null);

  // 🧾 Fetch accounts (you’ll later replace this with backend call)
  useEffect(() => {
    // Example: fetch from Express API — GET /api/accounts
    // fetch("/api/accounts")
    //   .then((res) => res.json())
    //   .then((data) => setAccounts(data));

    // Mock data for now
    setAccounts([
      { id: 1, accountName: "Cash On Hand", type: "ASSETS" },
      { id: 2, accountName: "Accounts Receivable", type: "ASSETS" },
      { id: 3, accountName: "Sales Revenue", type: "INCOME" },
      { id: 4, accountName: "Accounts Payable", type: "LIABILITIES" },
      { id: 5, accountName: "Rent Expense", type: "EXPENSES" },
    ]);
  }, []);

  // 🧮 Update Trial Balance
  useEffect(() => {
    let totalDebits = 0;
    let totalCredits = 0;
    entries.forEach((entry) => {
      totalDebits += parseFloat(entry.amount || 0);
      totalCredits += parseFloat(entry.amount || 0);
    });
    setTrialBalance({ totalDebits, totalCredits });
  }, [entries]);

  // 📝 Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.debitAccount || !formData.creditAccount || !formData.amount) {
      alert("Please fill all required fields.");
      return;
    }
    if (formData.debitAccount === formData.creditAccount) {
      alert("Debit and Credit accounts cannot be the same.");
      return;
    }

    const newEntry = {
      id: editingId || Date.now(),
      ...formData,
      amount: parseFloat(formData.amount),
    };

    if (editingId) {
      setEntries(
        entries.map((entry) =>
          entry.id === editingId ? newEntry : entry
        )
      );
      setEditingId(null);
    } else {
      setEntries([...entries, newEntry]);
    }

    // 🔹 (Later) Post to backend:
    // await fetch("/api/journal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newEntry) });

    // Clear form
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

  // 🗑️ Delete entry
  const handleDelete = (id) => {
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  // ✏️ Edit entry
  const handleEdit = (entry) => {
    setFormData({
      date: entry.date,
      description: entry.description,
      debitAccount: entry.debitAccount,
      creditAccount: entry.creditAccount,
      amount: entry.amount.toString(),
      reference: entry.reference || "",
      remarks: entry.remarks || "",
    });
    setEditingId(entry.id);
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Double Entry Journal
        </h1>
        <p className="text-gray-600">
          Record accounting transactions using debits and credits.
        </p>
      </div>

      {/* Form */}
      {/* <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-lg shadow mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="Transaction description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Debit Account
            </label>
            <select
              value={formData.debitAccount}
              onChange={(e) =>
                setFormData({ ...formData, debitAccount: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">Select Debit Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.accountName}>
                  {acc.accountName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credit Account
            </label>
            <select
              value={formData.creditAccount}
              onChange={(e) =>
                setFormData({ ...formData, creditAccount: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">Select Credit Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.accountName}>
                  {acc.accountName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Rs)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference / Voucher No. (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., VCH-1025"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks (optional)
            </label>
            <textarea
              placeholder="Extra comments"
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={2}
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />{" "}
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
            className="mt-4 ml-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel Edit
          </button>
        )}
      </form> */}

      {/* Journal Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Journal Entries
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Date
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Description
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Debit Account
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Credit Account
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Amount (Rs)
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Reference / Voucher No.
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Remarks
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-6 text-gray-500 text-sm"
                  >
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    No journal entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3">{entry.date}</td>
                    <td className="px-4 py-3">{entry.description}</td>
                    <td className="px-4 py-3">{entry.debitAccount}</td>
                    <td className="px-4 py-3">{entry.creditAccount}</td>
                    <td className="px-4 py-3">{entry.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">{entry.reference || "-"}</td>
                    <td className="px-4 py-3">{entry.remarks || "-"}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trial Balance Summary */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Trial Balance
        </h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-medium">Total Debits:</span>{" "}
            Rs.{trialBalance.totalDebits.toFixed(2)}
          </div>
          <div>
            <span className="font-medium">Total Credits:</span>{" "}
            Rs.{trialBalance.totalCredits.toFixed(2)}
          </div>
          <div
            className={`font-medium ${
              trialBalance.totalDebits === trialBalance.totalCredits
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {trialBalance.totalDebits === trialBalance.totalCredits
              ? "Balanced ✅"
              : "Unbalanced ⚠️"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoubleEntry;
