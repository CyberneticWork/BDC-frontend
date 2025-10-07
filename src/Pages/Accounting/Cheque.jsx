import React, { useState, useEffect } from 'react';
import { 
  getCheques, 
  addCheque, 
  getSuppliers,
  getCustomers, 
  getAccountList 
} from '../../services/AccountingService';

const Cheque = () => {
  const [cheques, setCheques] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCheque, setEditingCheque] = useState(null);
  const [formData, setFormData] = useState({
    chequeNumber: '',
    chequeType: 'Outgoing',
    payeeName: '',
    payeeType: 'Supplier',
    bankAccount: '',
    issueDate: '',
    postDate: '',
    amount: '',
    amountInWords: '',
    description: '',
    reference: '',
    status: 'Issued'
  });

  const chequeTypes = ['Outgoing', 'Incoming'];
  const payeeTypes = ['Supplier', 'Customer', 'Employee', 'Other'];
  const chequeStatuses = ['Issued', 'Presented', 'Cleared', 'Cancelled', 'Bounced', 'Stale'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCheques(getCheques());
    setSuppliers(getSuppliers());
    setCustomers(getCustomers());
    setAccounts(getAccountList());
  };

  const convertAmountToWords = (amount) => {
    // Basic implementation - in a real app, you'd use a proper number-to-words library
    const num = parseFloat(amount);
    if (isNaN(num)) return '';
    
    if (num === 0) return 'Zero dollars only';
    
    // Simple conversion for demonstration
    const dollars = Math.floor(num);
    const cents = Math.round((num - dollars) * 100);
    
    let result = `${dollars} dollars`;
    if (cents > 0) {
      result += ` and ${cents} cents`;
    }
    result += ' only';
    
    return result;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-convert amount to words
    if (name === 'amount') {
      setFormData(prev => ({
        ...prev,
        amountInWords: convertAmountToWords(value)
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const chequeData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (editingCheque) {
      // Update existing cheque logic would go here
      console.log('Update cheque:', chequeData);
    } else {
      addCheque(chequeData);
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      chequeNumber: '',
      chequeType: 'Outgoing',
      payeeName: '',
      payeeType: 'Supplier',
      bankAccount: '',
      issueDate: '',
      postDate: '',
      amount: '',
      amountInWords: '',
      description: '',
      reference: '',
      status: 'Issued'
    });
    setShowForm(false);
    setEditingCheque(null);
  };

  const handleEdit = (cheque) => {
    setEditingCheque(cheque);
    setFormData({
      chequeNumber: cheque.chequeNumber,
      chequeType: cheque.chequeType,
      payeeName: cheque.payeeName,
      payeeType: cheque.payeeType || 'Supplier',
      bankAccount: cheque.bankAccount || '',
      issueDate: cheque.issueDate,
      postDate: cheque.postDate || '',
      amount: cheque.amount.toString(),
      amountInWords: cheque.amountInWords || '',
      description: cheque.description || '',
      reference: cheque.reference || '',
      status: cheque.status
    });
    setShowForm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Cleared': return 'text-green-600 bg-green-100';
      case 'Issued': return 'text-blue-600 bg-blue-100';
      case 'Presented': return 'text-yellow-600 bg-yellow-100';
      case 'Cancelled': return 'text-gray-600 bg-gray-100';
      case 'Bounced': return 'text-red-600 bg-red-100';
      case 'Stale': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getChequeTypeColor = (type) => {
    switch (type) {
      case 'Outgoing': return 'text-red-600 bg-red-100';
      case 'Incoming': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPayeeOptions = () => {
    switch (formData.payeeType) {
      case 'Supplier':
        return suppliers.map(s => ({ id: s.id, name: s.name }));
      case 'Customer':
        return customers.map(c => ({ id: c.id, name: c.customerName }));
      case 'Employee':
        return []; // Would be loaded from employee service
      default:
        return [];
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cheque Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Cheque
        </button>
      </div>

      {/* Cheques List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cheque No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post Date
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
                {cheques.map((cheque) => (
                  <tr key={cheque.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cheque.chequeNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChequeTypeColor(cheque.chequeType)}`}>
                        {cheque.chequeType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cheque.payeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cheque.issueDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cheque.postDate || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${cheque.amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cheque.status)}`}>
                        {cheque.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(cheque)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button className="text-green-600 hover:text-green-900 mr-4">
                        Print
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cheque Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingCheque ? 'Edit Cheque' : 'Create Cheque'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cheque Number*
                </label>
                <input
                  type="text"
                  name="chequeNumber"
                  value={formData.chequeNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="CHQ001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cheque Type*
                </label>
                <select
                  name="chequeType"
                  value={formData.chequeType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {chequeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payee Type*
                </label>
                <select
                  name="payeeType"
                  value={formData.payeeType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {payeeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payee Name*
                </label>
                {formData.payeeType === 'Other' ? (
                  <input
                    type="text"
                    name="payeeName"
                    value={formData.payeeName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter payee name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <select
                    name="payeeName"
                    value={formData.payeeName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select {formData.payeeType}</option>
                    {getPayeeOptions().map((option) => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account
                </label>
                <select
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Bank Account</option>
                  {accounts
                    .filter(account => account.accountSubCategory === 'Current Assets')
                    .map((account) => (
                    <option key={account.id} value={account.accountName}>
                      {account.accountName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date*
                </label>
                <input
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Date
                </label>
                <input
                  type="date"
                  name="postDate"
                  value={formData.postDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  placeholder="Invoice number, bill reference, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount in Words
              </label>
              <input
                type="text"
                name="amountInWords"
                value={formData.amountInWords}
                onChange={handleInputChange}
                placeholder="Amount will be auto-converted to words"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                readOnly
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Purpose of payment..."
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
                  {chequeStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
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
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingCheque ? 'Update Cheque' : 'Create Cheque'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Cheque;