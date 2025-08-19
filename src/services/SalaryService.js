import axios from "@utils/axios";

export const fetchSalaryDataAPI = async () => {
  try {
    const response = await axios.get(`/salary`);
    return response.data;
  } catch (error) {
    console.error("Error fetching salary data:", error);
    throw error;
  }
};

export const updateSalaryAPI = async (id, data) => {
  try {
    const response = await axios.put(`/salary/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error fetching salary data:", error);
    throw error;
  }
};

export const deleteSalaryRecordAPI = async (id) => {
  try {
    const response = await axios.delete(`/salary/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching salary data:", error);
    throw error;
  }
};

export const fetchSalaryCSV = async () => {
  try {
    const response = await axios.get(`/salary/process/csv`, {
      responseType: "blob", // Important for handling CSV files
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching salary data:", error);
    throw error;
  }
};
