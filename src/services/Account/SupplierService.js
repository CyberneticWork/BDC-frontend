import axios from "@utils/axios";

// Get all suppliers
export const list = async () => {
  try {
    const response = await axios.get('/suppliers');
    return response.data;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
};

// Get single supplier
export const get = async (id) => {
  try {
    const response = await axios.get(`/suppliers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching supplier ${id}:`, error);
    throw error;
  }
};

// Create supplier
export const create = async (data) => {
  try {
    // include any user_id or other backend-required fields here if needed
    const response = await axios.post('/suppliers', data);
    return response.data;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
};

// Update supplier
export const update = async (id, data) => {
  try {
    const response = await axios.put(`/suppliers/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating supplier ${id}:`, error);
    throw error;
  }
};

// Delete supplier
export const remove = async (id) => {
  try {
    const response = await axios.delete(`/suppliers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting supplier ${id}:`, error);
    throw error;
  }
};


export default {
  list,
  get,
  create,
  update,
  remove,
};


