import axios from "@utils/axios";

// Service for interacting with Discount Level API endpoints
// Backend routes (Laravel):
// GET    /discount-levels
// GET    /discount-levels/{id}
// POST   /discount-levels
// PUT    /discount-levels/{id}
// DELETE /discount-levels/{id}

const fetchDiscountLevels = async (params = {}) => {
  try {
    const response = await axios.get(`/discount-levels`, { params });
    // backend often returns { data: [...] } but normalize to an array (or empty array)
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.error("Error fetching discount levels:", error);
    // Throw so callers (components) can surface errors instead of silently receiving an empty list.
    // UI code already handles errors in a try/catch and will set an error state.
    throw error.response?.data ?? error;
  }
};

const getDiscountLevel = async (id) => {
  try {
    const response = await axios.get(`/discount-levels/${id}`);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error(`Error fetching discount level ${id}:`, error);
    return null;
  }
};

const createDiscountLevel = async (payload) => {
  try {
    const response = await axios.post(`/discount-levels`, payload);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error("Error creating discount level:", error);
    // bubble up the error payload where callers can show validation messages
    throw error.response?.data ?? error;
  }
};

const updateDiscountLevel = async (id, payload) => {
  try {
    const response = await axios.put(`/discount-levels/${id}`, payload);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error(`Error updating discount level ${id}:`, error);
    throw error.response?.data ?? error;
  }
};

const deleteDiscountLevel = async (id) => {
  try {
    const response = await axios.delete(`/discount-levels/${id}`);
    // delete returns 204 No Content in backend; return true on success
    return response.status === 204 ? true : response.data;
  } catch (error) {
    console.error(`Error deleting discount level ${id}:`, error);
    throw error.response?.data ?? error;
  }
};

// Compatibility wrappers used by components in the project
const getAll = async (params = {}) => {
  return await fetchDiscountLevels(params);
};

const get = async (id) => {
  return await getDiscountLevel(id);
};

const create = async (payload) => {
  return await createDiscountLevel(payload);
};

const update = async (id, payload) => {
  return await updateDiscountLevel(id, payload);
};

const remove = async (id) => {
  return await deleteDiscountLevel(id);
};

const service = {
  // original descriptive names
  fetchDiscountLevels,
  getDiscountLevel,
  createDiscountLevel,
  updateDiscountLevel,
  deleteDiscountLevel,
  // compatibility names expected by UI
  getAll,
  get,
  create,
  update,
  remove,
};

// Named exports for direct imports
export {
  fetchDiscountLevels,
  getDiscountLevel,
  createDiscountLevel,
  updateDiscountLevel,
  deleteDiscountLevel,
  getAll,
  get,
  create,
  update,
  remove,
};

export default service;

// CommonJS interop (some tooling may `require` modules)
try {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.module &&
    globalThis.module.exports
  ) {
    globalThis.module.exports = service;
  }
} catch {
  // ignore in strict ESM environments
}
