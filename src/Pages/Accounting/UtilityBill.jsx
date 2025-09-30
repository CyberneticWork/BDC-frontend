import React, { useState, useEffect } from 'react';
import { 
  getUtilityBills, 
  addUtilityBill, 
  getUtilityProviders, 
  getAccountList 
} from '../../services/AccountingService';

const UtilityBill = () => {
  const [utilityBills, setUtilityBills] = useState([]);
  const [providers, setProviders] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [formData, setFormData] = useState({
    provider: '',
    utilityType: 'Electricity',
    billNumber: '',
    billDate: '',
    dueDate: '',
    servicePeriodFrom: '',
    servicePeriodTo: '',
    previousReading: '',
    currentReading: '',
    unitsConsumed: '',
    ratePerUnit: '',
    baseAmount: '',
    taxes: '',
    totalAmount: '',
    account: '',
    status: 'Pending'
  });

  const utilityTypes = [
    'Electricity',
    'Water',
    'Gas',
    'Internet',
    'Phone',
    'Cable TV',
    'Waste Management',
    'Sewage',
    'Other'
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Calculate units consumed when readings change
    if (formData.previousReading && formData.currentReading) {
      const units = parseFloat(formData.currentReading) - parseFloat(formData.previousReading);
      setFormData(prev => ({
        ...prev,
        unitsConsumed: units.toString()
      }));
    }
  }, [formData.previousReading, formData.currentReading]);

  useEffect(() => {
    // Calculate base amount when units and rate change
    if (formData.unitsConsumed && formData.ratePerUnit) {
      const baseAmount = parseFloat(formData.unitsConsumed) * parseFloat(formData.ratePerUnit);
      const taxes = baseAmount * 0.1; // 10% tax
      const totalAmount = baseAmount + taxes;
      
      setFormData(prev => ({
        ...prev,
        baseAmount: baseAmount.toFixed(2),
        taxes: taxes.toFixed(2),
        totalAmount: totalAmount.toFixed(2)
      }));
    }
  }, [formData.unitsConsumed, formData.ratePerUnit]);

  const loadData = () => {
    setUtilityBills(getUtilityBills());
    setProviders(getUtilityProviders());
    setAccounts(getAccountList());
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
    
    const billData = {
      ...formData,
      previousReading: parseFloat(formData.previousReading) || 0,
      currentReading: parseFloat(formData.currentReading) || 0,
      unitsConsumed: parseFloat(formData.unitsConsumed) || 0,
      ratePerUnit: parseFloat(formData.ratePerUnit) || 0,
      baseAmount: parseFloat(formData.baseAmount) || 0,
      taxes: parseFloat(formData.taxes) || 0,
      totalAmount: parseFloat(formData.totalAmount) || 0
    };

    if (editingBill) {
      // Update existing bill logic would go here
      console.log('Update utility bill:', billData);
    } else {
      addUtilityBill(billData);
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      provider: '',
      utilityType: 'Electricity',
      billNumber: '',
      billDate: '',
      dueDate: '',
      servicePeriodFrom: '',
      servicePeriodTo: '',
      previousReading: '',
      currentReading: '',
      unitsConsumed: '',
      ratePerUnit: '',
      baseAmount: '',
      taxes: '',
      totalAmount: '',
      account: '',
      status: 'Pending'
    });
    setShowForm(false);
    setEditingBill(null);
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setFormData({
      provider: bill.provider,
      utilityType: bill.utilityType,
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      dueDate: bill.dueDate,
      servicePeriodFrom: bill.servicePeriodFrom || '',
      servicePeriodTo: bill.servicePeriodTo || '',
      previousReading: bill.previousReading?.toString() || '',
      currentReading: bill.currentReading?.toString() || '',
      unitsConsumed: bill.unitsConsumed?.toString() || '',
      ratePerUnit: bill.ratePerUnit?.toString() || '',
      baseAmount: bill.baseAmount?.toString() || '',
      taxes: bill.taxes?.toString() || '',
      totalAmount: bill.totalAmount?.toString() || '',
      account: bill.account || '',
      status: bill.status
    });
    setShowForm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Overdue': return 'text-red-600 bg-red-100';
      case 'Cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUtilityTypeColor = (type) => {
    switch (type) {
      case 'Electricity': return 'text-yellow-600 bg-yellow-100';
      case 'Water': return 'text-blue-600 bg-blue-100';
      case 'Gas': return 'text-orange-600 bg-orange-100';
      case 'Internet': return 'text-purple-600 bg-purple-100';
      case 'Phone': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Utility Bills</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Utility Bill
        </button>
      </div>

      {/* Utility Bills List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
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
                {utilityBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bill.billNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUtilityTypeColor(bill.utilityType)}`}>
                        {bill.utilityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.billDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.dueDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${bill.totalAmount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(bill)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button className="text-green-600 hover:text-green-900 mr-4">
                        Pay
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

      {/* Utility Bill Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingBill ? 'Edit Utility Bill' : 'Create Utility Bill'}
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
                  Provider*
                </label>
                <select
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.name}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utility Type*
                </label>
                <select
                  name="utilityType"
                  value={formData.utilityType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {utilityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill Number*
                </label>
                <input
                  type="text"
                  name="billNumber"
                  value={formData.billNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill Date*
                </label>
                <input
                  type="date"
                  name="billDate"
                  value={formData.billDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date*
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Service Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Period From
                </label>
                <input
                  type="date"
                  name="servicePeriodFrom"
                  value={formData.servicePeriodFrom}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Period To
                </label>
                <input
                  type="date"
                  name="servicePeriodTo"
                  value={formData.servicePeriodTo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Meter Readings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Reading
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="previousReading"
                  value={formData.previousReading}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Reading
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="currentReading"
                  value={formData.currentReading}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units Consumed
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="unitsConsumed"
                  value={formData.unitsConsumed}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>

            {/* Billing Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate per Unit
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="ratePerUnit"
                  value={formData.ratePerUnit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Amount Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.baseAmount}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxes
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.taxes}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold"
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
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
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
                {editingBill ? 'Update Bill' : 'Create Bill'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UtilityBill;