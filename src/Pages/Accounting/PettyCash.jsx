import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Calendar, DollarSign, User, FileText, CheckCircle, Clock, XCircle, TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';
import { 
  getPettyCashTransactions, 
  addPettyCashTransaction, 
  getPettyCashBalance,
  getAccountList 
} from '../../services/AccountingService';

const PettyCash = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: 'Expense',
    description: '',
    category: 'Office Supplies',
    amount: '',
    date: '',
    receivedBy: '',
    approvedBy: '',
    account: '',
    receipt: '',
    status: 'Approved'
  });

  const transactionTypes = ['Expense', 'Replenishment', 'Return'];
  const expenseCategories = [
    'Office Supplies',
    'Travel & Transportation',
    'Meals & Entertainment',
    'Utilities',
    'Postage & Shipping',
    'Repairs & Maintenance',
    'Miscellaneous',
    'Emergency Expenses'
  ];

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
    setTransactions(getPettyCashTransactions());
    setAccounts(getAccountList());
    setCurrentBalance(getPettyCashBalance());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (editingTransaction) {
      // Update existing transaction logic would go here
      console.log('Update petty cash transaction:', transactionData);
    } else {
      addPettyCashTransaction(transactionData);
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      transactionType: 'Expense',
      description: '',
      category: 'Office Supplies',
      amount: '',
      date: '',
      receivedBy: '',
      approvedBy: '',
      account: '',
      receipt: '',
      status: 'Approved'
    });
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transactionType: transaction.transactionType,
      description: transaction.description,
      category: transaction.category || 'Office Supplies',
      amount: transaction.amount.toString(),
      date: transaction.date,
      receivedBy: transaction.receivedBy || '',
      approvedBy: transaction.approvedBy || '',
      account: transaction.account || '',
      receipt: transaction.receipt || '',
      status: transaction.status
    });
    setShowForm(true);
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'Expense': return 'text-red-600 bg-red-100';
      case 'Replenishment': return 'text-green-600 bg-green-100';
      case 'Return': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'Expense': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'Replenishment': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'Return': return <DollarSign className="h-4 w-4 text-blue-500" />;
      default: return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="h-3 w-3" />;
      case 'Pending': return <Clock className="h-3 w-3" />;
      case 'Rejected': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Calculate summary
  const totalExpenses = transactions
    .filter(t => t.transactionType === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalReplenishments = transactions
    .filter(t => t.transactionType === 'Replenishment')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Petty Cash Management</h1>
          <p className="text-sm text-gray-600 mt-1">Track and manage petty cash transactions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      {!showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Current Balance</p>
                <p className="text-lg font-semibold text-gray-900">${currentBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Expenses</p>
                <p className="text-lg font-semibold text-red-600">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Replenishments</p>
                <p className="text-lg font-semibold text-green-600">${totalReplenishments.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Transactions</p>
                <p className="text-lg font-semibold text-purple-600">{transactions.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isMobile ? (
            /* Mobile Card View */
            <div className="divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No petty cash transactions found.</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first transaction to get started.</p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTransactionTypeIcon(transaction.transactionType)}
                          <h3 className="text-sm font-semibold text-gray-900">
                            {transaction.description}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Calendar className="h-3 w-3" />
                          <span>{transaction.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit Transaction"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900 p-1"
                          title="View Receipt"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.transactionType)}`}>
                            {transaction.transactionType}
                          </span>
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {transaction.category}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          {transaction.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          {transaction.receivedBy && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{transaction.receivedBy}</span>
                            </div>
                          )}
                          {transaction.receipt && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>#{transaction.receipt}</span>
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${
                          transaction.transactionType === 'Expense' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          <DollarSign className="h-3 w-3" />
                          <span>
                            {transaction.transactionType === 'Expense' ? '-' : '+'}${transaction.amount?.toFixed(2)}
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
                      Date
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received By
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
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.date}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.transactionType)}`}>
                          {transaction.transactionType}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {transaction.description}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.category}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={transaction.transactionType === 'Expense' ? 'text-red-600' : 'text-green-600'}>
                          {transaction.transactionType === 'Expense' ? '-' : '+'}${transaction.amount?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.receivedBy || '-'}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            Receipt
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

      {/* Transaction Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {editingTransaction ? 'Edit Transaction' : 'Add Petty Cash Transaction'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type*
                </label>
                <select
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  {transactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date*
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount*
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category*
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  {expenseCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account
                </label>
                <select
                  name="account"
                  value={formData.account}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.accountName}>
                      {account.accountName}
                    </option>
                  ))}
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
                placeholder="Detailed description of the transaction..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received By
                </label>
                <input
                  type="text"
                  name="receivedBy"
                  value={formData.receivedBy}
                  onChange={handleInputChange}
                  placeholder="Name of person who received the cash"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approved By
                </label>
                <input
                  type="text"
                  name="approvedBy"
                  value={formData.approvedBy}
                  onChange={handleInputChange}
                  placeholder="Name of person who approved the transaction"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Number
                </label>
                <input
                  type="text"
                  name="receipt"
                  value={formData.receipt}
                  onChange={handleInputChange}
                  placeholder="Receipt or voucher number"
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
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
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
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm md:text-base"
              >
                {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PettyCash;