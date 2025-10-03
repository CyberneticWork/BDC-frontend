import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Calendar, DollarSign, CreditCard, FileText, Zap, Droplets, Flame, Wifi, Phone, Receipt } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);
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
    
    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
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

  const getUtilityIcon = (type) => {
    switch (type) {
      case 'Electricity': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'Water': return <Droplets className="h-4 w-4 text-blue-500" />;
      case 'Gas': return <Flame className="h-4 w-4 text-orange-500" />;
      case 'Internet': return <Wifi className="h-4 w-4 text-purple-500" />;
      case 'Phone': return <Phone className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Utility Bill Payments</h1>
          <p className="text-sm text-gray-600 mt-1">Manage utility bill payments and transactions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <Plus className="h-4 w-4" />
          Pay Utility Bill
        </button>
      </div>

      {/* Payments List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isMobile ? (
            /* Mobile Card View */
            <div className="divide-y divide-gray-200">
              {payments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No utility bill payments found.</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first payment to get started.</p>
                </div>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-blue-500" />
                          <h3 className="text-sm font-semibold text-gray-900">
                            {payment.paymentId}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <span className="truncate">{payment.provider}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(payment)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit Payment"
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
                          title="Delete Payment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{payment.paymentDate}</span>
                        </div>
                        {payment.utilityBill && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <FileText className="h-3 w-3" />
                            <span>{payment.utilityBill}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {getUtilityIcon(payment.utilityType)}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUtilityTypeColor(payment.utilityType)}`}>
                              {payment.utilityType}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {getPaymentMethodIcon(payment.paymentMethod)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span>${payment.totalPayment?.toFixed(2)}</span>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
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
                      Payment ID
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bill No.
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
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.paymentId}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.provider}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUtilityTypeColor(payment.utilityType)}`}>
                          {payment.utilityType}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.utilityBill || '-'}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentDate}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${payment.totalPayment?.toFixed(2)}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(payment)}
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

      {/* Payment Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {editingPayment ? 'Edit Utility Bill Payment' : 'Pay Utility Bill'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bill Selection */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utility Bill*
                </label>
                <select
                  name="utilityBill"
                  value={formData.utilityBill}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>
            </div>

            {/* Bill Details (Auto-filled) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider
                </label>
                <input
                  type="text"
                  value={formData.provider}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm md:text-base"
                />
              </div>
            </div>

            {/* Payment Details */}
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

            {/* Amount Details */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold text-sm md:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
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
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
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