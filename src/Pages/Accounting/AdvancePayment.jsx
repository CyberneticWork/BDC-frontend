import React, { useState, useEffect } from 'react';
import { 
  getAdvancePayments, 
  addAdvancePayment, 
  getSuppliers, 
  getAccountList 
} from '../../services/AccountingService';
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
  ResponsiveInput,
  ResponsiveSelect,
  ResponsiveTextarea,
  ResponsiveLoadingSpinner,
  ResponsiveBadge
} from '../../components/Accounting/ResponsiveAccountingComponents';

const AdvancePayment = () => {
  const responsive = useResponsive();
  const [advancePayments, setAdvancePayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier: '',
    paymentMethod: 'Cash',
    referenceNumber: '',
    paymentDate: '',
    amount: '',
    purpose: '',
    description: '',
    account: '',
    status: 'Active'
  });

  const paymentMethods = ['Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Online Transfer'];
  const purposes = [
    'Purchase Order Advance',
    'Service Contract Advance',
    'Material Purchase',
    'Equipment Purchase',
    'Project Advance',
    'Travel Advance',
    'Other'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAdvancePayments(getAdvancePayments());
    setSuppliers(getSuppliers());
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
    
    setLoading(true);
    
    const paymentData = {
      ...formData,
      amount: parseFloat(formData.amount),
      remainingAmount: parseFloat(formData.amount)
    };

    if (editingPayment) {
      // Update existing advance payment logic would go here
      console.log('Update advance payment:', paymentData);
    } else {
      addAdvancePayment(paymentData);
    }

    setTimeout(() => {
      resetForm();
      loadData();
      setLoading(false);
    }, 500);
  };

  const resetForm = () => {
    setFormData({
      supplier: '',
      paymentMethod: 'Cash',
      referenceNumber: '',
      paymentDate: '',
      amount: '',
      purpose: '',
      description: '',
      account: '',
      status: 'Active'
    });
    setShowForm(false);
    setEditingPayment(null);
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      supplier: payment.supplier,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber || '',
      paymentDate: payment.paymentDate,
      amount: payment.amount.toString(),
      purpose: payment.purpose || '',
      description: payment.description || '',
      account: payment.account || '',
      status: payment.status
    });
    setShowForm(true);
  };

  const actions = (
    <ResponsiveButton 
      variant="primary" 
      size={responsive.isMobile ? 'sm' : 'md'}
      onClick={() => setShowForm(true)}
    >
      + New Advance Payment
    </ResponsiveButton>
  );

  return (
    <ResponsivePageWrapper 
      title="Advance Payments" 
      subtitle="Manage advance payments to suppliers and vendors"
      actions={actions}
    >
      {/* Advance Payments List */}
      {!showForm && (
        <ResponsiveCard>
          {responsive.isMobile ? (
            /* Mobile View - Card Layout */
            <div className="space-y-4">
              {advancePayments.map((payment) => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {payment.supplier}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {payment.advanceId}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <ResponsiveBadge 
                        variant={payment.status === 'Active' ? 'success' : 
                                payment.status === 'Partially Adjusted' ? 'warning' :
                                payment.status === 'Fully Adjusted' ? 'info' : 'danger'}
                        size="sm"
                      >
                        {payment.status}
                      </ResponsiveBadge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium">{payment.paymentDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Purpose:</span>
                      <p className="font-medium truncate">{payment.purpose}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <p className="font-medium text-green-600">${payment.amount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Remaining:</span>
                      <p className="font-medium text-blue-600">${payment.remainingAmount?.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <ResponsiveBadge 
                      variant={payment.paymentMethod === 'Cash' ? 'success' :
                              payment.paymentMethod === 'Check' ? 'info' :
                              payment.paymentMethod === 'Bank Transfer' ? 'default' :
                              payment.paymentMethod === 'Credit Card' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {payment.paymentMethod}
                    </ResponsiveBadge>
                    <div className="flex space-x-2">
                      <ResponsiveButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(payment)}
                      >
                        Edit
                      </ResponsiveButton>
                      <ResponsiveButton
                        variant="success"
                        size="sm"
                      >
                        Adjust
                      </ResponsiveButton>
                    </div>
                  </div>
                </div>
              ))}
              
              {advancePayments.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No advance payments found.</p>
                  <ResponsiveButton
                    variant="primary"
                    size="sm"
                    onClick={() => setShowForm(true)}
                    className="mt-4"
                  >
                    Create First Payment
                  </ResponsiveButton>
                </div>
              )}
            </div>
          ) : (
            /* Desktop View - Table Layout */
            <ResponsiveTable>
              <ResponsiveTableHeader>
                <ResponsiveTableHeaderCell>Advance ID</ResponsiveTableHeaderCell>
                <ResponsiveTableHeaderCell>Supplier</ResponsiveTableHeaderCell>
                <ResponsiveTableHeaderCell>Date</ResponsiveTableHeaderCell>
                <ResponsiveTableHeaderCell>Purpose</ResponsiveTableHeaderCell>
                <ResponsiveTableHeaderCell>Method</ResponsiveTableHeaderCell>
                <ResponsiveTableHeaderCell align="right">Amount</ResponsiveTableHeaderCell>
                <ResponsiveTableHeaderCell align="right">Remaining</ResponsiveTableHeaderCell>
                <ResponsiveTableHeaderCell>Status</ResponsiveTableHeaderCell>
                <ResponsiveTableHeaderCell>Actions</ResponsiveTableHeaderCell>
              </ResponsiveTableHeader>
              <ResponsiveTableBody>
                {advancePayments.map((payment) => (
                  <ResponsiveTableRow key={payment.id}>
                    <ResponsiveTableCell>
                      <span className="font-medium">{payment.advanceId}</span>
                    </ResponsiveTableCell>
                    <ResponsiveTableCell truncate>
                      {payment.supplier}
                    </ResponsiveTableCell>
                    <ResponsiveTableCell>
                      {payment.paymentDate}
                    </ResponsiveTableCell>
                    <ResponsiveTableCell truncate>
                      {payment.purpose}
                    </ResponsiveTableCell>
                    <ResponsiveTableCell>
                      <ResponsiveBadge 
                        variant={payment.paymentMethod === 'Cash' ? 'success' :
                                payment.paymentMethod === 'Check' ? 'info' :
                                payment.paymentMethod === 'Bank Transfer' ? 'default' :
                                payment.paymentMethod === 'Credit Card' ? 'warning' : 'default'}
                        size="sm"
                      >
                        {payment.paymentMethod}
                      </ResponsiveBadge>
                    </ResponsiveTableCell>
                    <ResponsiveTableCell align="right">
                      <span className="font-medium text-green-600">
                        ${payment.amount?.toFixed(2)}
                      </span>
                    </ResponsiveTableCell>
                    <ResponsiveTableCell align="right">
                      <span className="font-medium text-blue-600">
                        ${payment.remainingAmount?.toFixed(2)}
                      </span>
                    </ResponsiveTableCell>
                    <ResponsiveTableCell>
                      <ResponsiveBadge 
                        variant={payment.status === 'Active' ? 'success' : 
                                payment.status === 'Partially Adjusted' ? 'warning' :
                                payment.status === 'Fully Adjusted' ? 'info' : 'danger'}
                        size="sm"
                      >
                        {payment.status}
                      </ResponsiveBadge>
                    </ResponsiveTableCell>
                    <ResponsiveTableCell>
                      <div className="flex items-center space-x-2">
                        <ResponsiveButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(payment)}
                        >
                          Edit
                        </ResponsiveButton>
                        <ResponsiveButton
                          variant="success"
                          size="sm"
                        >
                          Adjust
                        </ResponsiveButton>
                        <ResponsiveButton
                          variant="danger"
                          size="sm"
                        >
                          Cancel
                        </ResponsiveButton>
                      </div>
                    </ResponsiveTableCell>
                  </ResponsiveTableRow>
                ))}
              </ResponsiveTableBody>
            </ResponsiveTable>
          )}
        </ResponsiveCard>
      )}

      {/* Advance Payment Form */}
      {showForm && (
        <ResponsiveCard>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              {editingPayment ? 'Edit Advance Payment' : 'New Advance Payment'}
            </h2>
            <ResponsiveButton
              variant="secondary"
              size={responsive.isMobile ? 'sm' : 'md'}
              onClick={resetForm}
            >
              ✕ {responsive.isMobile ? '' : 'Cancel'}
            </ResponsiveButton>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <ResponsiveGrid 
              cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} 
              gap="gap-4 sm:gap-6"
            >
              <ResponsiveFormGroup label="Supplier" required>
                <ResponsiveSelect
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </ResponsiveSelect>
              </ResponsiveFormGroup>

              <ResponsiveFormGroup label="Payment Date" required>
                <ResponsiveInput
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  required
                />
              </ResponsiveFormGroup>
            </ResponsiveGrid>

            <ResponsiveGrid 
              cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} 
              gap="gap-4 sm:gap-6"
            >
              <ResponsiveFormGroup label="Purpose" required>
                <ResponsiveSelect
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Purpose</option>
                  {purposes.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </ResponsiveSelect>
              </ResponsiveFormGroup>

              <ResponsiveFormGroup label="Payment Method" required>
                <ResponsiveSelect
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </ResponsiveSelect>
              </ResponsiveFormGroup>
            </ResponsiveGrid>

            <ResponsiveGrid 
              cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} 
              gap="gap-4 sm:gap-6"
            >
              <ResponsiveFormGroup label="Amount" required>
                <ResponsiveInput
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
              </ResponsiveFormGroup>

              <ResponsiveFormGroup label="Reference Number">
                <ResponsiveInput
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleInputChange}
                  placeholder="Check number, transaction ID, etc."
                />
              </ResponsiveFormGroup>
            </ResponsiveGrid>

            <ResponsiveGrid 
              cols={responsive.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} 
              gap="gap-4 sm:gap-6"
            >
              <ResponsiveFormGroup label="Account">
                <ResponsiveSelect
                  name="account"
                  value={formData.account}
                  onChange={handleInputChange}
                >
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.accountName}>
                      {account.accountName}
                    </option>
                  ))}
                </ResponsiveSelect>
              </ResponsiveFormGroup>

              <ResponsiveFormGroup label="Status">
                <ResponsiveSelect
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Partially Adjusted">Partially Adjusted</option>
                  <option value="Fully Adjusted">Fully Adjusted</option>
                  <option value="Cancelled">Cancelled</option>
                </ResponsiveSelect>
              </ResponsiveFormGroup>
            </ResponsiveGrid>

            <ResponsiveFormGroup label="Description">
              <ResponsiveTextarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Additional notes about the advance payment..."
              />
            </ResponsiveFormGroup>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
              <ResponsiveButton
                type="button"
                variant="secondary"
                size={responsive.isMobile ? 'md' : 'md'}
                onClick={resetForm}
                fullWidth={responsive.isMobile}
              >
                Cancel
              </ResponsiveButton>
              <ResponsiveButton
                type="submit"
                variant="primary"
                size={responsive.isMobile ? 'md' : 'md'}
                loading={loading}
                disabled={loading}
                fullWidth={responsive.isMobile}
              >
                {editingPayment ? 'Update Advance Payment' : 'Create Advance Payment'}
              </ResponsiveButton>
            </div>
          </form>
        </ResponsiveCard>
      )}
    </ResponsivePageWrapper>
  );
};

export default AdvancePayment;