import axios from "@utils/axios";

// Service for interacting with Center API endpoints
// Backend routes (Laravel):
// GET    /centers
// GET    /centers/{id}
// POST   /centers
// PUT    /centers/{id}
// DELETE /centers/{id}
const fetchCenters = async (params = {}) => {
  try {
    const response = await axios.get(`/centers`, { params });
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.error("Error fetching centers:", error);
    throw error;
  }
};

const getCenters = async (id) => {
  try {
    const response = await axios.get(`/centers/${id}`);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error(`Error fetching center ${id}:`, error);
    return null;
  }
};
const createCenter = async (payload) => {
  try {
    const response = await axios.post(`/centers`, payload);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error("Error creating center:", error);
    throw error;
  }
};
const updateCenter = async (id, payload) => {
  try {
    const response = await axios.put(`/centers/${id}`, payload);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error(`Error updating center ${id}:`, error);
    throw error;
  }
};
const deleteCenter = async (id) => {
  try {
    const response = await axios.delete(`/centers/${id}`);
    return response.status === 204 ? true : response.data;
  } catch (error) {
    console.error(`Error deleting center ${id}:`, error);
    throw error;
  }
};
export { fetchCenters, getCenters, createCenter, updateCenter, deleteCenter };
