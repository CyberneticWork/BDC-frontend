import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Calendar, DollarSign, Zap, Droplets, Flame, Wifi, Phone, Tv, Trash2 as TrashIcon, Building } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);
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
    
    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
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

  const getUtilityIcon = (type) => {
    switch (type) {
      case 'Electricity': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'Water': return <Droplets className="h-4 w-4 text-blue-500" />;
      case 'Gas': return <Flame className="h-4 w-4 text-orange-500" />;
      case 'Internet': return <Wifi className="h-4 w-4 text-purple-500" />;
      case 'Phone': return <Phone className="h-4 w-4 text-green-500" />;
      case 'Cable TV': return <Tv className="h-4 w-4 text-indigo-500" />;
      case 'Waste Management': return <TrashIcon className="h-4 w-4 text-gray-500" />;
      case 'Sewage': return <Droplets className="h-4 w-4 text-brown-500" />;
      default: return <Building className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Utility Bills</h1>
          <p className="text-sm text-gray-600 mt-1">Manage utility bills and payments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <Plus className="h-4 w-4" />
          Create Utility Bill
        </button>
      </div>

      {/* Utility Bills List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isMobile ? (
            /* Mobile Card View */
            <div className="divide-y divide-gray-200">
              {utilityBills.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Zap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No utility bills found.</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first utility bill to get started.</p>
                </div>
              ) : (
                utilityBills.map((bill) => (
                  <div key={bill.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getUtilityIcon(bill.utilityType)}
                          <h3 className="text-sm font-semibold text-gray-900">
                            {bill.billNumber}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <span className="truncate">{bill.provider}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(bill)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit Bill"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Pay Bill"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Bill"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>Bill: {bill.billDate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <span>Due: {bill.dueDate}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUtilityTypeColor(bill.utilityType)}`}>
                            {bill.utilityType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span>${bill.totalAmount?.toFixed(2)}</span>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                            {bill.status}
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
                      Bill No.
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bill Date
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
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
                  {utilityBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bill.billNumber}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.provider}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUtilityTypeColor(bill.utilityType)}`}>
                          {bill.utilityType}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.billDate}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.dueDate}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${bill.totalAmount?.toFixed(2)}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(bill)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            Pay
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

      {/* Utility Bill Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {editingBill ? 'Edit Utility Bill' : 'Create Utility Bill'}
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
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider*
                </label>
                <select
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            {/* Service Period */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Period From
                </label>
                <input
                  type="date"
                  name="servicePeriodFrom"
                  value={formData.servicePeriodFrom}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            {/* Meter Readings */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm md:text-base"
                />
              </div>
            </div>

            {/* Billing Details */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
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

            {/* Amount Breakdown */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.baseAmount}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm md:text-base"
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
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
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