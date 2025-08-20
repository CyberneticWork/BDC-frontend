import axios from "@utils/axios";

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
    const response = await axios.put(`/salary/${id}`, data);
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
    const response = await axios.delete(`/salary/${id}`);
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
