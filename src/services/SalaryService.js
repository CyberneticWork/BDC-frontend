import axios from "@utils/axios";
import { getUser } from "@services/UserService";

// Helper to get user audit information
const getUserAuditInfo = () => {
  const currentUser = getUser?.() || null;
  return currentUser?.id 
    ? { 
        user_id: currentUser.id,
        user_name: currentUser.name || currentUser.username || 'Unknown'
      } 
    : {};
};

export const fetchSalaryDataAPI = async (params = {}) => {
  try {
    const response = await axios.get(`/salary`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching salary data:", error.response?.data?.message || error.message);
    throw error;
  }
};

export const updateSalaryAPI = async (id, data) => {
  try {
    // Attach current logged-in user info for audit
    const userInfo = getUserAuditInfo();
    const payload = {
      ...data,
      ...userInfo
    };

    const response = await axios.put(`/salary/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating salary record:", error.response?.data?.message || error.message);
    // Log validation errors if present
    if (error.response?.data?.errors) {
      console.error("Validation errors:", error.response.data.errors);
    }
    throw error;
  }
};

export const deleteSalaryRecordAPI = async (id) => {
  try {
    // Also include user info for delete operations
    const userInfo = getUserAuditInfo();
    const response = await axios.delete(`/salary/${id}`, { 
      data: userInfo  // This sends the data in the request body for DELETE
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting salary record:", error.response?.data?.message || error.message);
    throw error;
  }
};

export const fetchSalaryCSV = async (params = {}) => {
  try {
    const response = await axios.get(`/salary/process/csv`, {
      responseType: "blob", // Important for handling CSV files
      params
    });
    return response.data;
  } catch (error) {
    console.error("Error downloading salary CSV:", error.response?.data?.message || error.message);
    throw error;
  }
};

// Add a new function to get a single salary record by ID
export const fetchSalaryRecordByIdAPI = async (id) => {
  try {
    const response = await axios.get(`/salary/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching salary record ${id}:`, error.response?.data?.message || error.message);
    throw error;
  }
};
