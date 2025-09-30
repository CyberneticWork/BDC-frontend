import React, { useState, useEffect } from 'react';
import { 
  getJournalEntries, 
  addJournalEntry, 
  getAccountList 
} from '../../services/AccountingService';

const JournalEntry = () => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    entryNumber: '',
    entryDate: '',
    description: '',
    reference: '',
    status: 'Draft'
  });

  const [entryLines, setEntryLines] = useState([
    { account: '', description: '', debit: '', credit: '' },
    { account: '', description: '', debit: '', credit: '' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setJournalEntries(getJournalEntries());
    setAccounts(getAccountList());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...entryLines];
    updatedLines[index][field] = value;
    
    // Ensure only debit or credit is filled, not both
    if (field === 'debit' && value) {
      updatedLines[index].credit = '';
    } else if (field === 'credit' && value) {
      updatedLines[index].debit = '';
    }
    
    setEntryLines(updatedLines);
  };

  const addLine = () => {
    setEntryLines(prev => [...prev, { account: '', description: '', debit: '', credit: '' }]);
  };

  const removeLine = (index) => {
    if (entryLines.length > 2) {
      setEntryLines(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const totalDebits = entryLines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredits = entryLines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    return { totalDebits, totalCredits };
  };

  const isBalanced = () => {
    const { totalDebits, totalCredits } = calculateTotals();
    return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for small rounding differences
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isBalanced()) {
      alert('Journal entry is not balanced. Total debits must equal total credits.');
      return;
    }

    const { totalDebits } = calculateTotals();
    
    const entryData = {
      ...formData,
      lines: entryLines.filter(line => line.account && (line.debit || line.credit)),
      totalAmount: totalDebits
    };

    if (editingEntry) {
      // Update existing entry logic would go here
      console.log('Update journal entry:', entryData);
    } else {
      addJournalEntry(entryData);
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      entryNumber: '',
      entryDate: '',
      description: '',
      reference: '',
      status: 'Draft'
    });
    setEntryLines([
      { account: '', description: '', debit: '', credit: '' },
      { account: '', description: '', debit: '', credit: '' }
    ]);
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      entryNumber: entry.entryNumber,
      entryDate: entry.entryDate,
      description: entry.description || '',
      reference: entry.reference || '',
      status: entry.status
    });
    setEntryLines(entry.lines || [
      { account: '', description: '', debit: '', credit: '' },
      { account: '', description: '', debit: '', credit: '' }
    ]);
    setShowForm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Posted': return 'text-green-600 bg-green-100';
      case 'Draft': return 'text-yellow-600 bg-yellow-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const { totalDebits, totalCredits } = calculateTotals();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Journal Entries</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Journal Entry
        </button>
      </div>

      {/* Journal Entries List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {journalEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.entryNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.entryDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${entry.totalAmount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button className="text-green-600 hover:text-green-900 mr-4">
                        Post
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Journal Entry Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingEntry ? 'Edit Journal Entry' : 'Create Journal Entry'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Number*
                </label>
                <input
                  type="text"
                  name="entryNumber"
                  value={formData.entryNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="JE-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Date*
                </label>
                <input
                  type="date"
                  name="entryDate"
                  value={formData.entryDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  placeholder="Reference number or document"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Posted">Posted</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description*
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="Description of the journal entry..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Journal Entry Lines */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">Journal Entry Lines</h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  + Add Line
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                        Account
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                        Debit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                        Credit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entryLines.map((line, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 border-r">
                          <select
                            value={line.account}
                            onChange={(e) => handleLineChange(index, 'account', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select Account</option>
                            {accounts.map((account) => (
                              <option key={account.id} value={account.accountName}>
                                {account.accountName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 border-r">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                            placeholder="Line description"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 border-r">
                          <input
                            type="number"
                            step="0.01"
                            value={line.debit}
                            onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 border-r">
                          <input
                            type="number"
                            step="0.01"
                            value={line.credit}
                            onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {entryLines.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Total Debits: </span>
                    <span className="text-sm font-semibold">${totalDebits.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Total Credits: </span>
                    <span className="text-sm font-semibold">${totalCredits.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Difference: </span>
                    <span className={`text-sm font-semibold ${isBalanced() ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(totalDebits - totalCredits).toFixed(2)}
                      {isBalanced() ? ' ✓' : ' ✗'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isBalanced()}
                className={`px-6 py-2 rounded-md text-white ${
                  isBalanced() 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {editingEntry ? 'Update Entry' : 'Create Entry'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default JournalEntry;