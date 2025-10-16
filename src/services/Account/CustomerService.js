import axios from "../utils/axios";

const unwrap = (res) => res?.data?.data ?? res?.data;

const fromApi = (c) => ({
  id: c.id,
  customerName: c.name,
  email: c.email,
  phoneNumber: c.phone ?? '',
  brNumberNic: c.br_number_nic ?? '',
  address: c.address ?? '',
  city: c.city ?? '',
  customerCategory: c.customer_category_id ?? c.category?.id ?? null,
  customerType: c.customer_type_id ?? c.type?.id ?? null,
  customerCategoryName: c.category?.name ?? '',
  customerTypeName: c.type?.name ?? '',
});

const toApi = (data) => ({
  name: data.customerName,
  email: data.email,
  phone: data.phoneNumber || null,
  br_number_nic: data.brNumberNic || null,
  address: data.address || null,
  city: data.city || null,
  customer_category_id: data.customerCategory || null,
  customer_type_id: data.customerType || null,
});

// Customers
export const getCustomers = async () => {
  try {
    const response = await axios.get(`/customers`);
    const data = unwrap(response);
    return Array.isArray(data) ? data.map(fromApi) : [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error.response?.data?.errors || error.message;
  }
};

export const createCustomer = async (form) => {
  try {
    const response = await axios.post(`/customers`, toApi(form));
    const data = unwrap(response);
    return fromApi(data);
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error.response?.data?.errors || error.message;
  }
};

export const updateCustomer = async (id, form) => {
  try {
    const response = await axios.put(`/customers/${id}`, toApi(form));
    const data = unwrap(response);
    return fromApi(data);
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error.response?.data?.errors || error.message;
  }
};

export const deleteCustomer = async (id) => {
  try {
    const response = await axios.delete(`/customers/${id}`);
    return unwrap(response);
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error.response?.data?.errors || error.message;
  }
};

// Categories
export const getCustomerCategories = async () => {
  try {
    const response = await axios.get(`/customer-categories`);
    return unwrap(response); // [{id,name}]
  } catch (error) {
    console.error('Error fetching customer categories:', error);
    throw error.response?.data?.errors || error.message;
  }
};

export const addCustomerCategory = async (name, description = null) => {
  try {
    const response = await axios.post(`/customer-categories`, { name, description });
    const cat = unwrap(response);
    return { id: cat.id, name: cat.name };
  } catch (error) {
    console.error('Error creating customer category:', error);
    throw error.response?.data?.errors || error.message;
  }
};

// Types
export const getCustomerTypes = async () => {
  try {
    const response = await axios.get(`/customer-types`);
    return unwrap(response); // [{id,name}]
  } catch (error) {
    console.error('Error fetching customer types:', error);
    throw error.response?.data?.errors || error.message;
  }
};

export const addCustomerType = async (name, description = null) => {
  try {
    const response = await axios.post(`/customer-types`, { name, description });
    const t = unwrap(response);
    return { id: t.id, name: t.name };
  } catch (error) {
    console.error('Error creating customer type:', error);
    throw error.response?.data?.errors || error.message;
  }
};

export default {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerCategories,
  addCustomerCategory,
  getCustomerTypes,
  addCustomerType,
};