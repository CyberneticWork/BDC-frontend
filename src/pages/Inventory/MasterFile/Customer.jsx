import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Menu, Phone, Mail, MapPin } from 'lucide-react';
import {
  getCustomers,
  addCustomerCategory,
  getCustomerTypes,
  addCustomerType,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerCategories
} from '@services/Account/CustomerService';

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [customerCategories, setCustomerCategories] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newType, setNewType] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    customerCategory: '',
    customerType: '',
    customerName: '',
    phoneNumber: '',
    brNumberNic: '',
    email: '',
    address: '',
    city: '',
  });

  useEffect(() => {
    // Load initial data from service
    loadCustomers();
    loadCustomerCategories();
    loadCustomerTypes();
    
    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Error loading customers: ' + (error.message || 'Unknown error'));
    }
  };

  const loadCustomerCategories = async () => {
    try {
      const data = await getCustomerCategories();
      setCustomerCategories(data);
    } catch (error) {
      console.error('Error loading customer categories:', error);
      alert('Error loading customer categories: ' + (error.message || 'Unknown error'));
    }
  };

  const loadCustomerTypes = async () => {
    try {
      const data = await getCustomerTypes();
      setCustomerTypes(data);
    } catch (error) {
      console.error('Error loading customer types:', error);
      alert('Error loading customer types: ' + (error.message || 'Unknown error'));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form with data:', formData);
    try {
      if (editingCustomer) {
        // Update existing customer
        const updatedCustomer = await updateCustomer(editingCustomer.id, formData);
        setCustomers(prev => prev.map(customer => 
          customer.id === editingCustomer.id ? updatedCustomer : customer
        ));
        setEditingCustomer(null);
        alert('Customer updated successfully!');
        // refresh list from server to ensure canonical data
        await loadCustomers();
      } else {
        // Create new customer
        const newCustomer = await addCustomer(formData);
        // reload from server so related objects and server-generated fields are present
        await loadCustomers();
        alert('Customer created successfully!');
      }
      setFormData({
        customerCategory: '',
        customerType: '',
        customerName: '',
        phoneNumber: '',
        brNumberNic: '',
        email: '',
        address: '',
        city: ''
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEdit = (customer) => {
  setEditingCustomer(customer);
  setFormData({
    customerCategory: customer.customer_category?.id || customer.customerCategory?.id || '',
    customerType: customer.customer_type?.id || customer.customerType?.id || '',
    customerName: customer.customerName || customer.name || '',
    phoneNumber: customer.phoneNumber || customer.phone || '',
    brNumberNic: customer.brNumberNic || customer.br_number_nic || '',
    email: customer.email || '',
    address: customer.address || '',
    city: customer.city || ''
  });
  setShowCreateForm(true);
};

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        // reload from server to ensure consistent state
        await loadCustomers();
        alert('Customer deleted successfully!');
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      if (newCategory.trim()) {
        const categoryExists = customerCategories.some(cat => 
          cat.name.toLowerCase() === newCategory.trim().toLowerCase()
        );
        
        if (categoryExists) {
          alert('This category already exists!');
          return;
        }

        const newCat = await addCustomerCategory(newCategory.trim());
        // refresh categories from server so ids/shape match backend
        await loadCustomerCategories();
        setNewCategory('');
        setShowCategoryModal(false);
        alert('Customer Category added successfully!');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    try {
      if (newType.trim()) {
        const typeExists = customerTypes.some(type => 
          type.name.toLowerCase() === newType.trim().toLowerCase()
        );
        
        if (typeExists) {
          alert('This type already exists!');
          return;
        }

        const newTypeData = await addCustomerType(newType.trim());
        // refresh types from server so ids/shape match backend
        await loadCustomerTypes();
        setNewType('');
        setShowTypeModal(false);
        alert('Customer Type added successfully!');
      }
    } catch (error) {
      console.error('Error adding type:', error);
      alert('Error adding type: ' + (error.message || 'Unknown error'));
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phoneNumber?.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Customer Management</h1>
        <p className="text-sm md:text-base text-gray-600">Manage your customer information</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm md:text-base"
          >
            <Plus className="h-4 w-4" />
            Create Customer
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm md:text-base"
          >
            <Plus className="h-4 w-4" />
            Customer Category
          </button>
          <button
            onClick={() => setShowTypeModal(true)}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm md:text-base"
          >
            <Plus className="h-4 w-4" />
            Customer Type
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isMobile ? (
          /* Mobile Card View */
          <div className="divide-y divide-gray-200">
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No customers found
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {customer.customerName ?? customer.name ?? ''}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {customer.brNumberNic ?? customer.br_number_nic ?? ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button 
                        onClick={() => handleEdit(customer)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="bg-gray-100 px-2 py-1 rounded">
                        {customer.customer_category?.name ?? customer.customerCategory?.name ?? ''}
                      </div>
                      <div className="bg-gray-100 px-2 py-1 rounded">
                        {customer.customer_type?.name ?? customer.customerType?.name ?? ''}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone className="h-3 w-3" />
                      <span>{customer.phoneNumber ?? customer.phone ?? ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{customer.email ?? ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>{customer.city ?? ''}</span>
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
                    Customer Name
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 md:px-6 py-4 text-center text-gray-500">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.customerName ?? customer.name ?? ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.brNumberNic ?? customer.br_number_nic ?? ''}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.customer_category?.name ?? customer.customerCategory?.name ?? ''}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.customer_type?.name ?? customer.customerType?.name ?? ''}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.phoneNumber ?? customer.phone ?? ''}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.email ?? ''}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.city ?? ''}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEdit(customer)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(customer.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Customer Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                  {editingCustomer ? 'Edit Customer' : 'Create New Customer'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCustomer(null);
                    setFormData({
                      customerCategory: '',
                      customerType: '',
                      customerName: '',
                      phoneNumber: '',
                      brNumberNic: '',
                      email: '',
                      address: '',
                      city: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Category *
                  </label>
                  <select
                    name="customerCategory"
                    value={formData.customerCategory}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
                  >
                    <option value="">Select Category</option>
                    {customerCategories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Type *
                  </label>
                  <select
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
                  >
                    <option value="">Select Type</option>
                    {customerTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BR Number/NIC
                  </label>
                  <input
                    type="text"
                    name="brNumberNic"
                    value={formData.brNumberNic}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCustomer(null);
                    setFormData({
                      customerCategory: '',
                      customerType: '',
                      customerName: '',
                      phoneNumber: '',
                      brNumberNic: '',
                      email: '',
                      address: '',
                      city: ''
                    });
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base"
                >
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="bg-white border-b border-gray-200 p-4 md:p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Add Customer Category</h2>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategory('');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategory('');
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="bg-white border-b border-gray-200 p-4 md:p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Add Customer Type</h2>
                <button
                  onClick={() => {
                    setShowTypeModal(false);
                    setNewType('');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddType} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type Name *
                </label>
                <input
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="Enter type name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTypeModal(false);
                    setNewType('');
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm md:text-base"
                >
                  Add Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;