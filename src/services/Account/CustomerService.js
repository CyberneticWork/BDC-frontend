import axios from "@utils/axios";

// Helper function to extract response data
const unwrap = (response) => {
  return response.data;
};

// Customers
export const getCustomers = async () => {
  try {
    const response = await axios.get(`/customers`);
    const data = unwrap(response);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error.response?.data?.errors || error.message;
  }
};

export const addCustomer = async (form) => {
  const payload = {
    name: form.customerName,
    email: form.email,
    phone: form.phoneNumber,
    address: form.address,
    city: form.city,
    customer_type_id: form.customerType,
    customer_category_id: form.customerCategory,
  }
  try {
    const response = await axios.post(`/customers`, payload);
    const data = unwrap(response);
    return data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error.response?.data?.errors || error.message;
  }
};

export const updateCustomer = async (id, form) => {
  try {
    const response = await axios.put(`/customers/${id}`, form);
    const data = unwrap(response);
    return data;
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
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerCategories,
  addCustomerCategory,
  getCustomerTypes,
  addCustomerType,
};