import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Calendar, FileText, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { 
  getJournalEntries, 
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getNextEntryNumber
} from '@services/Account/JournalentryService';
import { getAccountList } from '../../services/Account/AccountService';
import { useResponsive } from '../../hooks/useResponsive';
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
import AccountList from './AccountList';

const JournalEntry = () => {
  const responsive = useResponsive();
  const [journalEntries, setJournalEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nextEntryNumber, setNextEntryNumber] = useState('Loading...');
  const [formData, setFormData] = useState({
    entry_date: '',
    memo: '',
    account_type: '',
    account_name: '',
    debit: 0,
    credit: 0
  });

  const [entryLines, setEntryLines] = useState([
    { account: '', name: '', description: '', debit: '', credit: '' },
    { account: '', name: '', description: '', debit: '', credit: '' }
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesData, accountsData] = await Promise.all([
        getJournalEntries({ per_page: 100 }),
        getAccountList()
      ]);
      
      // Handle both paginated and non-paginated responses
      setJournalEntries(entriesData.data || entriesData);
      setAccounts(accountsData.data || accountsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Account type helpers
  const ACCOUNT_TYPES = ['EQUITY', 'EXPENSE', 'LIABILITIES', 'INCOME', 'ASSETS'];
  const normalizeType = (t) => t?.toString().trim().toUpperCase().replace(/S$/, '') || '';
  const getAccountType = (acc) => normalizeType(
    acc?.accountType ?? acc?.type ?? acc?.category ?? acc?.account_category ?? acc?.group ?? acc?.accountGroup
  );

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
    // Clear account name when account type changes
    if (field === 'account') {
      updatedLines[index].name = '';
    }
    
    setEntryLines(updatedLines);
  };

  const addLine = () => {
    setEntryLines(prev => [...prev, { account: '', name: '', description: '', debit: '', credit: '' }]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isBalanced()) {
      alert('Journal entry is not balanced. Total debits must equal total credits.');
      return;
    }

    // Validate that at least one line is filled
    const validLines = entryLines.filter(line => line.account && line.name && (line.debit || line.credit));
    if (validLines.length === 0) {
      alert('Please add at least one journal entry line with account and amount.');
      return;
    }

    setLoading(true);
    try {
      // Process all entry lines - each line becomes a separate journal entry
      for (const line of validLines) {
        const payload = {
          entry_date: formData.entry_date,
          memo: formData.memo,
          account_type: line.account,
          account_name: line.name,
          debit: parseFloat(line.debit) || 0,
          credit: parseFloat(line.credit) || 0
        };

        if (editingEntry) {
          await updateJournalEntry(editingEntry.id, payload);
        } else {
          await createJournalEntry(payload);
        }
      }

      alert(editingEntry ? 'Journal entry updated successfully' : 'Journal entry created successfully');
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save journal entry';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      entry_date: '',
      memo: '',
      account_type: '',
      account_name: '',
      debit: 0,
      credit: 0
    });
    setEntryLines([
      { account: '', name: '', description: '', debit: '', credit: '' },
      { account: '', name: '', description: '', debit: '', credit: '' }
    ]);
    setShowForm(false);
    setEditingEntry(null);
    setNextEntryNumber('Loading...');
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setNextEntryNumber(entry.entry_number); // Set to existing entry number
    setFormData({
      entry_date: entry.entry_date,
      memo: entry.memo || '',
      account_type: entry.account_type || '',
      account_name: entry.account_name || '',
      debit: parseFloat(entry.debit) || 0,
      credit: parseFloat(entry.credit) || 0
    });
    // Convert single entry to line format
    setEntryLines([
      { 
        account: entry.account_type || '', 
        name: entry.account_name || '', 
        description: '', 
        debit: entry.debit || '', 
        credit: entry.credit || '' 
      },
      { account: '', name: '', description: '', debit: '', credit: '' }
    ]);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteJournalEntry(id);
      alert('Journal entry deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      alert('Failed to delete journal entry');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextEntryNumber = async () => {
    try {
      const data = await getNextEntryNumber();
      setNextEntryNumber(data.entry_number);
    } catch (error) {
      console.error('Error fetching next entry number:', error);
      setNextEntryNumber('Error');
    }
  };

  const handleCreateNew = async () => {
    setShowForm(true);
    if (!editingEntry) {
      await fetchNextEntryNumber();
    }
  };

  const { totalDebits, totalCredits } = calculateTotals();

  const actions = (
    <ResponsiveButton 
      variant="primary" 
      size="md" 
      onClick={handleCreateNew}
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
                            {entry.entry_number}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(entry.entry_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit Entry"
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Entry"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {entry.memo}
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-semibold">{entry.account_type}</span> - {entry.account_name}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm">
                          <div>
                            <span className="text-xs text-gray-500">Debit: </span>
                            <span className="font-medium">${parseFloat(entry.debit || 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Credit: </span>
                            <span className="font-medium">${parseFloat(entry.credit || 0).toFixed(2)}</span>
                          </div>
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
                      Memo
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Type
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {journalEntries.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        No journal entries found. Create your first entry!
                      </td>
                    </tr>
                  ) : (
                    journalEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.entry_number}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {entry.memo}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.account_type}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm text-gray-900">
                          {entry.account_name}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ${parseFloat(entry.debit || 0).toFixed(2)}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ${parseFloat(entry.credit || 0).toFixed(2)}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-indigo-600 hover:text-indigo-900"
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
              {/* Entry Number - Auto-generated by backend, always show */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Number {!editingEntry && <span className="text-xs text-gray-500">(Auto-generated)</span>}
                </label>
                <input
                  type="text"
                  value={editingEntry ? editingEntry.entry_number : nextEntryNumber}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm md:text-base font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Date*
                </label>
                <input
                  type="date"
                  name="entry_date"
                  value={formData.entry_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Memo*
              </label>
              <input
                type="text"
                name="memo"
                value={formData.memo}
                onChange={handleInputChange}
                required
                maxLength={255}
                placeholder="Brief description of the transaction..."
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
                            Account Type*
                          </label>
                          <select
                            value={line.account}
                            onChange={(e) => handleLineChange(index, 'account', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          >
                            <option value="">Select Account Type</option>
                            {ACCOUNT_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Account Name*
                          </label>
                          <select
                            value={line.name}
                            onChange={(e) => handleLineChange(index, 'name', e.target.value)}
                            disabled={!line.account}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <option value="">{line.account ? 'Select Account Name' : 'Select Account Type first'}</option>
                            {accounts
                              .filter((a) => normalizeType(line.account) && getAccountType(a) === normalizeType(line.account))
                              .map((a) => (
                                <option key={a.id ?? a.accountName} value={a.accountName}>{a.accountName}</option>
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
                      Account Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                          Account Name
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
                              <option value="">Select Account Type</option>
                              {ACCOUNT_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 border-r">
                            <select
                              value={line.name}
                              onChange={(e) => handleLineChange(index, 'name', e.target.value)}
                              disabled={!line.account}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              <option value="">{line.account ? 'Select Account Name' : 'Select Account Type first'}</option>
                              {accounts
                                .filter((a) => normalizeType(line.account) && getAccountType(a) === normalizeType(line.account))
                                .map((a) => (
                                  <option key={a.id ?? a.accountName} value={a.accountName}>{a.accountName}</option>
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
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm md:text-base disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isBalanced() || loading}
                className={`w-full sm:w-auto px-6 py-2 rounded-md text-white text-sm md:text-base ${
                  isBalanced() && !loading
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Create Entry'}
              </button>
            </div>
          </form>
        </div>
      )}
    </ResponsivePageWrapper>
  );
};

export default JournalEntry;