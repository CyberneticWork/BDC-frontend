import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Calendar, CreditCard, User, DollarSign, FileText } from 'lucide-react';
import { 
  getDeposits, 
  addDeposit, 
  getCustomers, 
  getAccountList 
} from '../../services/AccountingService';

const MakeDeposit = () => {
  const [deposits, setDeposits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    depositType: 'Customer Payment',
    depositMethod: 'Cash',
    referenceNumber: '',
    depositDate: '',
    amount: '',
    description: '',
    account: '',
    status: 'Pending'
  });

  const [depositItems, setDepositItems] = useState([{
    description: '',
    amount: 0
  }]);

  const depositTypes = [
    'Customer Payment',
    'Loan Receipt',
    'Interest Income',
    'Dividend Income',
    'Sale of Assets',
    'Refund Received',
    'Other Income'
  ];

  const depositMethods = ['Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Online Transfer', 'Wire Transfer'];

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
    setDeposits(getDeposits());
    setCustomers(getCustomers());
    setAccounts(getAccountList());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...depositItems];
    updatedItems[index][field] = value;
    setDepositItems(updatedItems);
    
    // Update total amount
    const totalAmount = updatedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setFormData(prev => ({
      ...prev,
      amount: totalAmount.toFixed(2)
    }));
  };

  const addDepositItem = () => {
    setDepositItems(prev => [...prev, {
      description: '',
      amount: 0
    }]);
  };

  const removeDepositItem = (index) => {
    if (depositItems.length > 1) {
      const updatedItems = depositItems.filter((_, i) => i !== index);
      setDepositItems(updatedItems);
      
      // Update total amount
      const totalAmount = updatedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      setFormData(prev => ({
        ...prev,
        amount: totalAmount.toFixed(2)
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const depositData = {
      ...formData,
      amount: parseFloat(formData.amount),
      items: depositItems
    };

    if (editingDeposit) {
      // Update existing deposit logic would go here
      console.log('Update deposit:', depositData);
    } else {
      addDeposit(depositData);
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      depositType: 'Customer Payment',
      depositMethod: 'Cash',
      referenceNumber: '',
      depositDate: '',
      amount: '',
      description: '',
      account: '',
      status: 'Pending'
    });
    setDepositItems([{
      description: '',
      amount: 0
    }]);
    setShowForm(false);
    setEditingDeposit(null);
  };

  const handleEdit = (deposit) => {
    setEditingDeposit(deposit);
    setFormData({
      customer: deposit.customer || '',
      depositType: deposit.depositType,
      depositMethod: deposit.depositMethod,
      referenceNumber: deposit.referenceNumber || '',
      depositDate: deposit.depositDate,
      amount: deposit.amount.toString(),
      description: deposit.description || '',
      account: deposit.account || '',
      status: deposit.status
    });
    setDepositItems(deposit.items || [{
      description: '',
      amount: 0
    }]);
    setShowForm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Failed': return 'text-red-600 bg-red-100';
      case 'Cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDepositTypeColor = (type) => {
    switch (type) {
      case 'Customer Payment': return 'text-blue-600 bg-blue-100';
      case 'Loan Receipt': return 'text-purple-600 bg-purple-100';
      case 'Interest Income': return 'text-green-600 bg-green-100';
      case 'Dividend Income': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDepositMethodIcon = (method) => {
    switch (method) {
      case 'Cash': return '💵';
      case 'Check': return '📝';
      case 'Bank Transfer': return '🏦';
      case 'Credit Card': return '💳';
      case 'Online Transfer': return '🌐';
      case 'Wire Transfer': return '📤';
      default: return '💰';
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Make Deposit</h1>
          <p className="text-sm text-gray-600 mt-1">Manage deposits and income transactions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <Plus className="h-4 w-4" />
          Make New Deposit
        </button>
      </div>

      {/* Deposits List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isMobile ? (
            /* Mobile Card View */
            <div className="divide-y divide-gray-200">
              {deposits.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No deposits found.</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first deposit to get started.</p>
                </div>
              ) : (
                deposits.map((deposit) => (
                  <div key={deposit.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-green-500" />
                          <h3 className="text-sm font-semibold text-gray-900">
                            {deposit.depositId}
                          </h3>
                        </div>
                        {deposit.customer && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                            <User className="h-3 w-3" />
                            <span className="truncate">{deposit.customer}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(deposit)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit Deposit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Deposit"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{deposit.depositDate}</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDepositTypeColor(deposit.depositType)}`}>
                          {deposit.depositType}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600">
                            {getDepositMethodIcon(deposit.depositMethod)}
                          </span>
                          <span className="text-xs text-gray-600">
                            {deposit.depositMethod}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span>${deposit.amount?.toFixed(2)}</span>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(deposit.status)}`}>
                            {deposit.status}
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
                      Deposit ID
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer/Source
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
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
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {deposit.depositId}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {deposit.customer || 'N/A'}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDepositTypeColor(deposit.depositType)}`}>
                          {deposit.depositType}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {deposit.depositDate}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {deposit.depositMethod}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${deposit.amount?.toFixed(2)}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(deposit.status)}`}>
                          {deposit.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(deposit)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
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

      {/* Deposit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {editingDeposit ? 'Edit Deposit' : 'Make New Deposit'}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer/Source
                </label>
                <select
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  <option value="">Select Customer (Optional)</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.customerName}>
                      {customer.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Type*
                </label>
                <select
                  name="depositType"
                  value={formData.depositType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  {depositTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Method*
                </label>
                <select
                  name="depositMethod"
                  value={formData.depositMethod}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  {depositMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Date*
                </label>
                <input
                  type="date"
                  name="depositDate"
                  value={formData.depositDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleInputChange}
                  placeholder="Check number, transaction ID, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
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

            {/* Deposit Items */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-base md:text-lg font-medium text-gray-800">Deposit Items</h3>
                <button
                  type="button"
                  onClick={addDepositItem}
                  className="w-full sm:w-auto bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              {depositItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded p-4 mb-4 space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Deposit item description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    {depositItems.length > 1 && (
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeDepositItem(index)}
                          className="bg-red-600 text-white p-2 rounded hover:bg-red-700 flex-shrink-0"
                          title="Remove Item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total and Status */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold text-sm md:text-base"
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
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Additional notes about the deposit..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              />
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
                {editingDeposit ? 'Update Deposit' : 'Make Deposit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MakeDeposit;