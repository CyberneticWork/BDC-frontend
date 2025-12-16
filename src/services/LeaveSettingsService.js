import axios from "@utils/axios";

// Fetch all leave settings
export const getAllLeaveSettings = async () => {
  try {
    const response = await axios.get("/leave-settings");
    return response.data;
  } catch (error) {
    console.error("Error fetching leave settings:", error);
    throw error;
  }
};

// Get leave settings by ID
export const getLeaveSettingsById = async (id) => {
  try {
    const response = await axios.get(`/leave-settings/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching leave settings:", error);
    throw error;
  }
};

// Get leave settings by employee type
export const getLeaveSettingsByType = async (employeeType) => {
  try {
    const response = await axios.get(`/leave-settings/type/${employeeType}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching leave settings by type:", error);
    throw error;
  }
};

// Create new leave settings
export const createLeaveSettings = async (data) => {
  try {
    const response = await axios.post("/leave-settings", data);
    return response.data;
  } catch (error) {
    console.error("Error creating leave settings:", error);
    throw error;
  }
};

// Update leave settings
export const updateLeaveSettings = async (id, data) => {
  try {
    const response = await axios.put(`/leave-settings/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating leave settings:", error);
    throw error;
  }
};

// Delete leave settings
export const deleteLeaveSettings = async (id) => {
  try {
    const response = await axios.delete(`/leave-settings/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting leave settings:", error);
    throw error;
  }
};

// Get active leave settings summary
export const getActiveLeaveSettings = async () => {
  try {
    const response = await axios.get("/leave-settings/active/summary");
    return response.data;
  } catch (error) {
    console.error("Error fetching active leave settings:", error);
    throw error;
  }
};

export default {
  getAllLeaveSettings,
  getLeaveSettingsById,
  getLeaveSettingsByType,
  createLeaveSettings,
  updateLeaveSettings,
  deleteLeaveSettings,
  getActiveLeaveSettings,
};
