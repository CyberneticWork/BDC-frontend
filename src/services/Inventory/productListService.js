import axios from "../../utils/axios";

// Fetch all inventory product details
const fetchAllInventoryDetails = async (params = {}) => {
  try {
    const response = await axios.get("/products/inventory/details", { params });
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error("Error fetching product lists details:", error);
    return [];
  }
};

const fetchProductLists = async (params = {}) => {
  try {
    const response = await axios.get("/products", { params });
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error("Error fetching product lists:", error);
    return [];
  }
};

const createProductList = async (payload) => {
  try {
    const response = await axios.post("/products", payload);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error("Error creating product list:", error);
    // bubble up the error payload where callers can show validation messages
    throw error.response?.data ?? error;
  }
};

const updateProductList = async (id, payload) => {
  try {
    const response = await axios.put(`/products/${id}`, payload);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error(`Error updating product list ${id}:`, error);
    throw error.response?.data ?? error;
  }
};

const deleteProductList = async (id) => {
  try {
    const response = await axios.delete(`/products/${id}`);
    // delete returns 204 No Content in backend; return true on success
    return response.status === 204 ? true : response.data;
  } catch (error) {
    console.error(`Error deleting product list ${id}:`, error);
    throw error.response?.data ?? error;
  }
};

// Compatibility wrappers used by components in the project
const getAll = async (params = {}) => {
  return await fetchProductLists(params);
};
const create = async (payload) => {
  return await createProductList(payload);
};
const update = async (id, payload) => {
  return await updateProductList(id, payload);
};
const remove = async (id) => {
  return await deleteProductList(id);
};
const getInventoryDetails = async (params = {}) => {
  return await fetchAllInventoryDetails(params);
};
export { getAll, create, update, remove, getInventoryDetails };
