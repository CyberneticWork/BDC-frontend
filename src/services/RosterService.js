import axios from "@utils/axios";

const getAllRosters = async () => {
  try {
    const response = await axios.get(`/rosters`);
    return response.data;
  } catch (error) {
    console.error("Error fetching rosters:", error);
    throw error;
  }
};


const getEmployeesForRoster = async (params) => {
  try {
    const response = await axios.get("/emp/search", { params }); 
    return response.data;
  } catch (error) {
    console.error("Error fetching employees for roster:", error);
    throw error;
  }
};



const createRoster = async (rosterData) => {
  try {
    const response = await axios.post(`/rosters`, rosterData);
    return response.data.data;
  } catch (error) {
    console.error("Error creating roster:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error response status:", error.response?.status);
    console.error("Error response message:", error.response?.data?.message);
    throw error.response?.data?.errors || error.response?.data?.message || error.message;
  }
};

const updateRoster = async (id, rosterData) => {
  try {
    const response = await axios.put(`/rosters/${id}`, rosterData);
    return response.data.data;
  } catch (error) {
    console.error("Error updating roster:", error);
    throw error.response?.data?.errors || error.message;
  }
};

const deleteRoster = async (id) => {
  try {
    const response = await axios.delete(`/rosters/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting roster:", error);
    throw error.response?.data || error.message;
  }
};

const cancelRoster = async (id, cancelReason = "") => {
  const response = await axios.post(`/rosters/${id}/cancel`, {
    cancel_reason: cancelReason || null,
  });
  return response.data;
};

const bulkCancelRosters = async (rosterIds, cancelReason = "") => {
  const response = await axios.post(`/rosters/bulk-cancel`, {
    ids: rosterIds,
    cancel_reason: cancelReason || null,
  });
  return response.data;
};

const searchRosters = async (searchParams) => {
  try {
    console.log('Sending search request with params:', searchParams); // Debug log
    const response = await axios.get("/roster/search", {
      params: searchParams,
    });
    console.log('Search API response:', response.data); // Debug log
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Error searching rosters:", error);
    console.error("Error response:", error.response?.data); // Debug log
    throw error;
  }
};

// Add function to get trashed rosters if needed
const getTrashedRosters = async () => {
  try {
    const response = await axios.get(`/rosters/trashed`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching trashed rosters:", error);
    throw error;
  }
};

// Add function to restore roster if needed
const restoreRoster = async (id) => {
  try {
    const response = await axios.post(`/rosters/${id}/restore`);
    return response.data;
  } catch (error) {
    console.error("Error restoring roster:", error);
    throw error;
  }
};

const bulkDeleteRosters = async (rosterIds) => {
  try {
    const response = await axios.delete(`/rosters/bulk-delete`, {
      data: { ids: rosterIds }
    });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting rosters:", error);
    throw error.response?.data || error.message;
  }
};

export default {
  getAllRosters,
  createRoster,
  updateRoster,
  searchRosters,
  deleteRoster,
  cancelRoster,
  bulkCancelRosters,
  bulkDeleteRosters,
  getTrashedRosters,
  restoreRoster,
  getEmployeesForRoster, //new
};
