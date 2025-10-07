import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Calendar, CreditCard, User, DollarSign, FileText, Printer } from 'lucide-react';
import { 
  getReceipts, 
  addReceipt, 
  getCustomers, 
  getAccountList 
} from '../../services/AccountingService';

const Receipt = () => {
  const [receipts, setReceipts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    receiptType: 'Invoice Payment',
    paymentMethod: 'Cash',
    referenceNumber: '',
    receiptDate: '',
    amount: '',
    description: '',
    account: '',
    invoiceNumber: '',
    status: 'Received'
  });

  const [receiptItems, setReceiptItems] = useState([{
    description: '',
    amount: 0
  }]);

  const receiptTypes = [
    'Invoice Payment',
    'Advance Payment',
    'Loan Payment',
    'Service Payment',
    'Product Sale',
    'Subscription Payment',
    'Refund Payment',
    'Other'
  ];

  const paymentMethods = ['Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Online Transfer', 'Wire Transfer'];

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
    setReceipts(getReceipts());
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
    const updatedItems = [...receiptItems];
    updatedItems[index][field] = value;
    setReceiptItems(updatedItems);
    
    // Update total amount
    const totalAmount = updatedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setFormData(prev => ({
      ...prev,
      amount: totalAmount.toFixed(2)
    }));
  };

  const addReceiptItem = () => {
    setReceiptItems(prev => [...prev, {
      description: '',
      amount: 0
    }]);
  };

  const removeReceiptItem = (index) => {
    if (receiptItems.length > 1) {
      const updatedItems = receiptItems.filter((_, i) => i !== index);
      setReceiptItems(updatedItems);
      
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
    
    const receiptData = {
      ...formData,
      amount: parseFloat(formData.amount),
      items: receiptItems
    };

    if (editingReceipt) {
      // Update existing receipt logic would go here
      console.log('Update receipt:', receiptData);
    } else {
      addReceipt(receiptData);
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      receiptType: 'Invoice Payment',
      paymentMethod: 'Cash',
      referenceNumber: '',
      receiptDate: '',
      amount: '',
      description: '',
      account: '',
      invoiceNumber: '',
      status: 'Received'
    });
    setReceiptItems([{
      description: '',
      amount: 0
    }]);
    setShowForm(false);
    setEditingReceipt(null);
  };

  const handleEdit = (receipt) => {
    setEditingReceipt(receipt);
    setFormData({
      customer: receipt.customer,
      receiptType: receipt.receiptType,
      paymentMethod: receipt.paymentMethod,
      referenceNumber: receipt.referenceNumber || '',
      receiptDate: receipt.receiptDate,
      amount: receipt.amount.toString(),
      description: receipt.description || '',
      account: receipt.account || '',
      invoiceNumber: receipt.invoiceNumber || '',
      status: receipt.status
    });
    setReceiptItems(receipt.items || [{
      description: '',
      amount: 0
    }]);
    setShowForm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Received': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      case 'Refunded': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getReceiptTypeColor = (type) => {
    switch (type) {
      case 'Invoice Payment': return 'text-blue-600 bg-blue-100';
      case 'Advance Payment': return 'text-purple-600 bg-purple-100';
      case 'Service Payment': return 'text-green-600 bg-green-100';
      case 'Product Sale': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentMethodIcon = (method) => {
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Receipts</h1>
          <p className="text-sm text-gray-600 mt-1">Manage customer receipts and payments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <Plus className="h-4 w-4" />
          Create Receipt
        </button>
      </div>

      {/* Receipts List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isMobile ? (
            /* Mobile Card View */
            <div className="divide-y divide-gray-200">
              {receipts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No receipts found.</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first receipt to get started.</p>
                </div>
              ) : (
                receipts.map((receipt) => (
                  <div key={receipt.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-green-500" />
                          <h3 className="text-sm font-semibold text-gray-900">
                            {receipt.receiptId}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <User className="h-3 w-3" />
                          <span className="truncate">{receipt.customer}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(receipt)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit Receipt"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Print Receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Receipt"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{receipt.receiptDate}</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReceiptTypeColor(receipt.receiptType)}`}>
                          {receipt.receiptType}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600">
                            {getPaymentMethodIcon(receipt.paymentMethod)}
                          </span>
                          <span className="text-xs text-gray-600">
                            {receipt.paymentMethod}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span>${receipt.amount?.toFixed(2)}</span>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(receipt.status)}`}>
                            {receipt.status}
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
                      Receipt ID
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
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
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {receipt.receiptId}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.customer}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReceiptTypeColor(receipt.receiptType)}`}>
                          {receipt.receiptType}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.receiptDate}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.paymentMethod}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${receipt.amount?.toFixed(2)}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(receipt.status)}`}>
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(receipt)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            Print
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

      {/* Receipt Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {editingReceipt ? 'Edit Receipt' : 'Create Receipt'}
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
                  Customer*
                </label>
                <select
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.customerName}>
                      {customer.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Type*
                </label>
                <select
                  name="receiptType"
                  value={formData.receiptType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  {receiptTypes.map((type) => (
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
                  Payment Method*
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Date*
                </label>
                <input
                  type="date"
                  name="receiptDate"
                  value={formData.receiptDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  placeholder="Related invoice number (if applicable)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>

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
            </div>

            {/* Receipt Items */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-base md:text-lg font-medium text-gray-800">Receipt Items</h3>
                <button
                  type="button"
                  onClick={addReceiptItem}
                  className="w-full sm:w-auto bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              {receiptItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded p-4 mb-4 space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Receipt item description"
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
                    {receiptItems.length > 1 && (
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeReceiptItem(index)}
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

            {/* Total and Additional Info */}
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
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
                  <option value="Received">Received</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
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
                  placeholder="Additional notes about the receipt..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
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
                {editingReceipt ? 'Update Receipt' : 'Create Receipt'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Receipt;