import React, { useState, useEffect } from 'react';
import { 
  getUtilityBillPayments, 
  addUtilityBillPayment, 
  getUtilityBills, 
  getAccountList 
} from '../../services/AccountingService';

const UtilityBillPayment = () => {
  const [payments, setPayments] = useState([]);
  const [utilityBills, setUtilityBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    utilityBill: '',
    provider: '',
    utilityType: '',
    billAmount: '',
    paymentMethod: 'Cash',
    referenceNumber: '',
    paymentDate: '',
    amountPaid: '',
    discountAmount: '',
    penaltyAmount: '',
    totalPayment: '',
    account: '',
    status: 'Completed'
  });

  const paymentMethods = ['Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Online Transfer', 'Wire Transfer'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Calculate total payment when amounts change
    const baseAmount = parseFloat(formData.amountPaid) || 0;
    const discount = parseFloat(formData.discountAmount) || 0;
    const penalty = parseFloat(formData.penaltyAmount) || 0;
    const total = baseAmount - discount + penalty;
    
    setFormData(prev => ({
      ...prev,
      totalPayment: total.toFixed(2)
    }));
  }, [formData.amountPaid, formData.discountAmount, formData.penaltyAmount]);

  const loadData = () => {
    setPayments(getUtilityBillPayments());
    setUtilityBills(getUtilityBills());
    setAccounts(getAccountList());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-fill bill details when utility bill is selected
    if (name === 'utilityBill') {
      const selectedBill = utilityBills.find(bill => bill.billNumber === value);
      if (selectedBill) {
        setFormData(prev => ({
          ...prev,
          provider: selectedBill.provider,
          utilityType: selectedBill.utilityType,
          billAmount: selectedBill.totalAmount?.toString() || '',
          amountPaid: selectedBill.totalAmount?.toString() || ''
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const paymentData = {
      ...formData,
      billAmount: parseFloat(formData.billAmount) || 0,
      amountPaid: parseFloat(formData.amountPaid) || 0,
      discountAmount: parseFloat(formData.discountAmount) || 0,
      penaltyAmount: parseFloat(formData.penaltyAmount) || 0,
      totalPayment: parseFloat(formData.totalPayment) || 0
    };

    if (editingPayment) {
      // Update existing payment logic would go here
      console.log('Update utility bill payment:', paymentData);
    } else {
      addUtilityBillPayment(paymentData);
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      utilityBill: '',
      provider: '',
      utilityType: '',
      billAmount: '',
      paymentMethod: 'Cash',
      referenceNumber: '',
      paymentDate: '',
      amountPaid: '',
      discountAmount: '',
      penaltyAmount: '',
      totalPayment: '',
      account: '',
      status: 'Completed'
    });
    setShowForm(false);
    setEditingPayment(null);
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      utilityBill: payment.utilityBill || '',
      provider: payment.provider,
      utilityType: payment.utilityType || '',
      billAmount: payment.billAmount?.toString() || '',
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber || '',
      paymentDate: payment.paymentDate,
      amountPaid: payment.amountPaid?.toString() || '',
      discountAmount: payment.discountAmount?.toString() || '',
      penaltyAmount: payment.penaltyAmount?.toString() || '',
      totalPayment: payment.totalPayment?.toString() || '',
      account: payment.account || '',
      status: payment.status
    });
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
        <h1 className="text-2xl font-bold text-gray-800">Utility Bill Payments</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Pay Utility Bill
        </button>
      </div>

      {/* Payments List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
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
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.paymentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUtilityTypeColor(payment.utilityType)}`}>
                        {payment.utilityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.utilityBill || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${payment.totalPayment?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(payment)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button className="text-green-600 hover:text-green-900 mr-4">
                        Receipt
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

      {/* Payment Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingPayment ? 'Edit Utility Bill Payment' : 'Pay Utility Bill'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bill Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utility Bill*
                </label>
                <select
                  name="utilityBill"
                  value={formData.utilityBill}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Utility Bill</option>
                  {utilityBills
                    .filter(bill => bill.status === 'Pending' || bill.status === 'Overdue')
                    .map((bill) => (
                    <option key={bill.id} value={bill.billNumber}>
                      {bill.billNumber} - {bill.provider} ({bill.utilityType}) - ${bill.totalAmount?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date*
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Bill Details (Auto-filled) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider
                </label>
                <input
                  type="text"
                  value={formData.provider}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utility Type
                </label>
                <input
                  type="text"
                  value={formData.utilityType}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.billAmount}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method*
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Reference Number
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleInputChange}
                  placeholder="Check number, transaction ID, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Amount Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid*
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amountPaid"
                  value={formData.amountPaid}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="discountAmount"
                  value={formData.discountAmount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Penalty Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="penaltyAmount"
                  value={formData.penaltyAmount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Payment
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalPayment}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
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
                {editingPayment ? 'Update Payment' : 'Make Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UtilityBillPayment;