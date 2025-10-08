import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Calendar, FileText, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { 
  getJournalEntries, 
  addJournalEntry, 
  getAccountList 
} from '../../services/AccountingService';
import { getResponsive } from '../../utils/ResponsiveUtils';
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
  ResponsiveTextarea,
  ResponsiveModal,
  ResponsiveLoadingSpinner,
  ResponsiveBadge,
  ResponsiveAlert
} from '../../components/Accounting/ResponsiveAccountingComponents';

const JournalEntry = () => {
  const responsive = getResponsive();
  const [journalEntries, setJournalEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
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
    
    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
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

  const actions = (
    <ResponsiveButton 
      variant="primary" 
      size="md" 
      onClick={() => setShowForm(true)}
    >
      + Create Journal Entry
    </ResponsiveButton>
  );

  return (
    <ResponsivePageWrapper 
      title="Journal Entries" 
      subtitle="Manage general ledger journal entries"
      actions={actions}
    >

      {/* Journal Entries List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isMobile ? (
            /* Mobile Card View */
            <div className="divide-y divide-gray-200">
              {journalEntries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No journal entries found.</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first journal entry to get started.</p>
                </div>
              ) : (
                journalEntries.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <h3 className="text-sm font-semibold text-gray-900">
                            {entry.entryNumber}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Calendar className="h-3 w-3" />
                          <span>{entry.entryDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit Entry"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Post Entry"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {entry.description}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <DollarSign className="h-3 w-3 text-green-500" />
                          <span>${entry.totalAmount?.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.reference && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Ref: {entry.reference}
                            </span>
                          )}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entry No.
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {journalEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.entryNumber}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.entryDate}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.reference || '-'}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${entry.totalAmount?.toFixed(2)}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            Post
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Journal Entry Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {editingEntry ? 'Edit Journal Entry' : 'Create Journal Entry'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              />
            </div>

            {/* Journal Entry Lines */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-base md:text-lg font-medium text-gray-800">Journal Entry Lines</h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="w-full sm:w-auto bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Line
                </button>
              </div>

              {isMobile ? (
                /* Mobile Card View for Entry Lines */
                <div className="space-y-4">
                  {entryLines.map((line, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium text-gray-700">Line {index + 1}</h4>
                        {entryLines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            className="bg-red-600 text-white p-1 rounded text-xs hover:bg-red-700"
                            title="Remove Line"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Account*
                          </label>
                          <select
                            value={line.account}
                            onChange={(e) => handleLineChange(index, 'account', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          >
                            <option value="">Select Account</option>
                            {accounts.map((account) => (
                              <option key={account.id} value={account.accountName}>
                                {account.accountName}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                            placeholder="Line description"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Debit
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={line.debit}
                              onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Credit
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={line.credit}
                              onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop Table View for Entry Lines */
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
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
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
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 border-r">
                            <input
                              type="number"
                              step="0.01"
                              value={line.debit}
                              onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 border-r">
                            <input
                              type="number"
                              step="0.01"
                              value={line.credit}
                              onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
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
              )}

              {/* Totals */}
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center md:text-left">
                    <span className="text-sm font-medium text-gray-700">Total Debits: </span>
                    <span className="text-sm font-semibold">${totalDebits.toFixed(2)}</span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-sm font-medium text-gray-700">Total Credits: </span>
                    <span className="text-sm font-semibold">${totalCredits.toFixed(2)}</span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-sm font-medium text-gray-700">Balance: </span>
                    <span className={`text-sm font-semibold flex items-center justify-center md:justify-start gap-1 ${isBalanced() ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(totalDebits - totalCredits).toFixed(2)}
                      {isBalanced() ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isBalanced()}
                className={`w-full sm:w-auto px-6 py-2 rounded-md text-white text-sm md:text-base ${
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
    </ResponsivePageWrapper>
  );
};

export default JournalEntry;