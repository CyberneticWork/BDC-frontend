import React, { useState, useEffect } from 'react';
import SupplierService from '../../services/Account/SupplierService';
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
} from '../../components/Accounting/ResponsiveAccountingComponents';

const Supplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
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
        try {
          await SupplierService.remove(supplierId);
          await loadData();
          await Swal.fire({ icon: 'success', title: 'Deleted', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        } catch (err) {
          console.error('Delete failed', err);
          Swal.fire({ icon: 'error', title: 'Delete failed', text: err?.response?.data?.message || 'Failed to delete supplier' });
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
          {isMobile ? (
            /* Mobile Card View */
            <div className="divide-y divide-gray-200">
              {suppliers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No suppliers found.</p>
                  <p className="text-xs text-gray-400 mt-1">Add your first supplier to get started.</p>
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
                        >
                          <Trash2 className="h-4 w-4" />
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
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <CreditCard className="h-3 w-3 text-green-500" />
                          <span>Credit: ${supplier.creditValue?.toFixed(2)}</span>
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier Name
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NIC
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Value
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Period
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {supplier.supplierName}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.phoneNumber}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.email}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.nic}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {supplier.address1}
                        {supplier.address2 && `, ${supplier.address2}`}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${supplier.creditValue?.toFixed(2)}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.creditPeriod} days
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <span onClick={() => handleDelete(supplier.id)}>Delete</span>
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
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
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
                  Supplier Name*
                </label>
                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter supplier name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
                {errors.supplierName && <p className="text-sm text-red-600 mt-1">{errors.supplierName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number*
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter phone number"
                  onKeyDown={(e) => {
                    // prevent typing non digits (but allow ctrl/cmd/meta keys)
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') e.preventDefault();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
                {errors.phoneNumber && <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIC*
                </label>
                <input
                  type="text"
                  name="nic"
                  value={formData.nic}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter NIC number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
                {errors.nic && <p className="text-sm text-red-600 mt-1">{errors.nic}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Address Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address 1*
              </label>
              <input
                type="text"
                name="address1"
                value={formData.address1}
                onChange={handleInputChange}
                required
                placeholder="Enter primary address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              />
              {errors.address1 && <p className="text-sm text-red-600 mt-1">{errors.address1}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address 2
              </label>
              <input
                type="text"
                name="address2"
                value={formData.address2}
                onChange={handleInputChange}
                placeholder="Enter secondary address (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              />
              {errors.address2 && <p className="text-sm text-red-600 mt-1">{errors.address2}</p>}
            </div>

            {/* Credit Information */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Value
                </label>
                <input
                  type="number"
                  name="creditValue"
                  value={formData.creditValue}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  onKeyDown={(e) => { if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') e.preventDefault(); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
                {errors.creditValue && <p className="text-sm text-red-600 mt-1">{errors.creditValue}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Period (Days)
                </label>
                <input
                  type="number"
                  name="creditPeriod"
                  value={formData.creditPeriod}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="30"
                  onKeyDown={(e) => { if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') e.preventDefault(); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
                {errors.creditPeriod && <p className="text-sm text-red-600 mt-1">{errors.creditPeriod}</p>}
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
                {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}
    </ResponsivePageWrapper>
  );
};

export default Supplier;

