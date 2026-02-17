import React, { useState, useEffect } from 'react';
import SupplierService from '@services/Account/SupplierService';
import Swal from 'sweetalert2';
import { Plus, X, Edit, Trash2, Phone, Mail, MapPin, CreditCard, Calendar } from 'lucide-react';
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
} from '@components/Accounting/ResponsiveAccountingComponents';

const Supplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    supplierName: '',
    phoneNumber: '',
    nic: '',
    email: '',
    address1: '',
    address2: '',
    creditValue: '',
    creditPeriod: ''
  });
  const [errors, setErrors] = useState({});

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
      const fetchedSuppliers = await SupplierService.list();

      // Normalize backend snake_case to frontend camelCase for UI consistency
      const mapped = (fetchedSuppliers || []).map((s) => ({
        // keep id and timestamps if present
        id: s.id,
        supplierName: s.supplier_name ?? s.supplierName ?? '',
        phoneNumber: s.phone_number ?? s.phoneNumber ?? '',
        nic: s.nic ?? '',
        email: s.email ?? '',
        address1: s.address1 ?? '',
        address2: s.address2 ?? '',
        creditValue: s.credit_value != null ? Number(s.credit_value) : (s.creditValue != null ? Number(s.creditValue) : 0),
        creditPeriod: s.credit_period != null ? Number(s.credit_period) : (s.creditPeriod != null ? Number(s.creditPeriod) : 0),
        // keep raw object for any future needs
        _raw: s,
      }));

      setSuppliers(mapped);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      alert("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    // sanitize phone number to digits only
    if (name === 'phoneNumber') {
      newValue = value.replace(/\D/g, '');
    }

    // sanitize creditValue to allow digits and single dot
    if (name === 'creditValue') {
      // remove invalid chars
      newValue = value.replace(/[^0-9.]/g, '');
      // allow only one dot
      const parts = newValue.split('.');
      if (parts.length > 2) newValue = parts[0] + '.' + parts.slice(1).join('');
    }

    // sanitize creditPeriod to digits only
    if (name === 'creditPeriod') {
      newValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // clear field error when user types
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const supplierData = {
      ...formData,
      creditValue: formData.creditValue === '' ? 0 : parseFloat(formData.creditValue),
      creditPeriod: formData.creditPeriod === '' ? 0 : parseInt(formData.creditPeriod, 10)
    };

    // Client-side validation per-field
    const fieldErrors = {};
    if (!supplierData.supplierName || supplierData.supplierName.trim() === '') fieldErrors.supplierName = 'Supplier Name is required';
    if (!supplierData.phoneNumber || supplierData.phoneNumber.trim() === '') fieldErrors.phoneNumber = 'Phone Number is required';
    // ensure phone number contains only digits and length check (min 7)
    if (supplierData.phoneNumber && !/^\d{7,15}$/.test(supplierData.phoneNumber)) fieldErrors.phoneNumber = 'Phone number must be digits only (7-15 digits)';
    if (!supplierData.nic || supplierData.nic.trim() === '') fieldErrors.nic = 'NIC is required';
    if (!supplierData.address1 || supplierData.address1.trim() === '') fieldErrors.address1 = 'Address 1 is required';
    if (supplierData.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(supplierData.email)) fieldErrors.email = 'Email is invalid';

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      // focus first error field
      const firstField = Object.keys(fieldErrors)[0];
      const el = document.querySelector(`[name="${firstField}"]`);
      if (el) el.focus();
      return;
    }

    (async () => {
      setSaving(true);
      try {
        // Map frontend camelCase fields to backend expected snake_case keys
        const payload = {
          supplier_name: supplierData.supplierName,
          phone_number: supplierData.phoneNumber,
          nic: supplierData.nic,
          email: supplierData.email,
          address1: supplierData.address1,
          address2: supplierData.address2,
          credit_value: supplierData.creditValue,
          credit_period: supplierData.creditPeriod,
        };

        if (editingSupplier) {
          await SupplierService.update(editingSupplier.id, payload);
          await Swal.fire({ icon: 'success', title: 'Supplier updated', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
        } else {
          await SupplierService.create(payload);
          await Swal.fire({ icon: 'success', title: 'Supplier added', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
        }
        await loadData();
        resetForm();
      } catch (err) {
        console.error('Save supplier failed', err);
        Swal.fire({ icon: 'error', title: 'Save failed', text: err?.response?.data?.message || 'Failed to save supplier' });
      } finally {
        setSaving(false);
      }
    })();
  };

  const resetForm = () => {
    setFormData({
      supplierName: '',
      phoneNumber: '',
      nic: '',
      email: '',
      address1: '',
      address2: '',
      creditValue: '',
      creditPeriod: ''
    });
    setErrors({});
    setShowForm(false);
    setEditingSupplier(null);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      supplierName: supplier.supplierName || '',
      phoneNumber: supplier.phoneNumber || '',
      nic: supplier.nic || '',
      email: supplier.email || '',
      address1: supplier.address1 || '',
      address2: supplier.address2 || '',
      creditValue: supplier.creditValue != null ? String(supplier.creditValue) : '',
      creditPeriod: supplier.creditPeriod != null ? String(supplier.creditPeriod) : ''
    });
    setShowForm(true);
  };

  const handleDelete = (supplierId) => {
    (async () => {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'This will delete the supplier.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
      });

      if (result.isConfirmed) {
        setDeletingId(supplierId);
        try {
          await SupplierService.remove(supplierId);
          await loadData();
          await Swal.fire({ icon: 'success', title: 'Deleted', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        } catch (err) {
          console.error('Delete failed', err);
          Swal.fire({ icon: 'error', title: 'Delete failed', text: err?.response?.data?.message || 'Failed to delete supplier' });
        } finally {
          setDeletingId(null);
        }
      }
    })();
  };

  const actions = (
    <ResponsiveButton
      variant="primary"
      size="md"
      onClick={() => setShowForm(true)}
    >
      + Add Supplier
    </ResponsiveButton>
  );

  return (
    <ResponsivePageWrapper
      title="Suppliers"
      subtitle="Manage supplier information and credit details"
      actions={actions}
    >

      {/* Suppliers List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <ResponsiveLoadingSpinner size="lg" />
            </div>
          ) : isMobile ? (
            /* Mobile Card View */
            <div className="divide-y divide-gray-200">
              {suppliers.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-base font-medium text-gray-700">No suppliers found</p>
                  <p className="text-sm text-gray-500 mt-2">Add your first supplier to get started.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    + Add Supplier
                  </button>
                </div>
              ) : (
                suppliers.map((supplier) => (
                  <div key={supplier.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-blue-500" />
                          <h3 className="text-sm font-semibold text-gray-900">
                            {supplier.supplierName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Phone className="h-3 w-3" />
                          <span>{supplier.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Mail className="h-3 w-3" />
                          <span>{supplier.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit Supplier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Supplier"
                          onClick={() => handleDelete(supplier.id)}
                          disabled={deletingId === supplier.id}
                        >
                          {deletingId === supplier.id ? (
                            <ResponsiveLoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-gray-600">
                        <strong>NIC:</strong> {supplier.nic}
                      </div>
                      <div className="text-xs text-gray-600">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {supplier.address1}
                        {supplier.address2 && `, ${supplier.address2}`}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                          <CreditCard className="h-3 w-3 text-green-500" />
                          <span>Credit: {Number(supplier.creditValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {supplier.creditPeriod} days
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
              <table className="min-w-full w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Supplier Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      NIC
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Credit Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Credit Period
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {supplier.supplierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {supplier.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {supplier.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {supplier.nic}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                        {supplier.address1}
                        {supplier.address2 && `, ${supplier.address2}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {Number(supplier.creditValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {supplier.creditPeriod} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            disabled={deletingId === supplier.id}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === supplier.id ? (
                              <ResponsiveLoadingSpinner size="sm" />
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </>
                            )}
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

      {/* Supplier Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 md:p-8">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </h2>
            <button
              onClick={resetForm}
              disabled={saving}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Close form"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                  placeholder="Enter supplier name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {errors.supplierName && <p className="text-sm text-red-600 mt-1">{errors.supplierName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                  placeholder="Enter phone number"
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') e.preventDefault();
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {errors.phoneNumber && <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NIC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nic"
                  value={formData.nic}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                  placeholder="Enter NIC number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {errors.nic && <p className="text-sm text-red-600 mt-1">{errors.nic}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={saving}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                Address Information
              </h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address1"
                  value={formData.address1}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                  placeholder="Enter primary address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {errors.address1 && <p className="text-sm text-red-600 mt-1">{errors.address1}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address Line 2 <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="address2"
                  value={formData.address2}
                  onChange={handleInputChange}
                  disabled={saving}
                  placeholder="Enter secondary address (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {errors.address2 && <p className="text-sm text-red-600 mt-1">{errors.address2}</p>}
              </div>
            </div>

            {/* Credit Information */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-600" />
                Credit Information
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Credit Value <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    name="creditValue"
                    value={formData.creditValue}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    disabled={saving}
                    placeholder="0.00"
                    onKeyDown={(e) => { if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') e.preventDefault(); }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.creditValue && <p className="text-sm text-red-600 mt-1">{errors.creditValue}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Credit Period (Days) <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    name="creditPeriod"
                    value={formData.creditPeriod}
                    onChange={handleInputChange}
                    min="0"
                    disabled={saving}
                    placeholder="30"
                    onKeyDown={(e) => { if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') e.preventDefault(); }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.creditPeriod && <p className="text-sm text-red-600 mt-1">{errors.creditPeriod}</p>}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    supplierName: '',
                    phoneNumber: '',
                    nic: '',
                    email: '',
                    address1: '',
                    address2: '',
                    creditValue: '',
                    creditPeriod: ''
                  });
                  setErrors({});
                }}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Form
              </button>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <ResponsiveLoadingSpinner size="sm" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    editingSupplier ? 'Update Supplier' : 'Add Supplier'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </ResponsivePageWrapper>
  );
};

export default Supplier;

