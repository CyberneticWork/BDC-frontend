import axios from "@utils/axios";

const NoPayService = {
  // Get all no pay records with pagination and filters
  getAllRecords: async (params) => {
    try {
      const response = await axios.get("/no-pay-records", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching no pay records:", error);
      throw error;
    }
  },

  // Get stats 
  getStats: async (params) => {
    try {
      const response = await axios.get("/no-pay-records/stats", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching stats:", error); 
      throw error;
    }
  },

  // Generate no pay records
  generateRecords: async (payload) => {
    try {
      const response = await axios.post("/no-pay-records/generate", payload);
      return response.data;
    } catch (error) {
      console.error("Error generating records:", error);
      throw error;
    }
  },

  // Update record status
  updateStatus: async (id, status) => {
    try {
      const response = await axios.put(`/no-pay-records/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;  
    }
  },

  // Delete a single record
  deleteRecord: async (id) => {
    try {
      const response = await axios.delete(`/no-pay-records/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting record:", error);
      throw error;
    }
  },

  // Bulk update status
  bulkUpdateStatus: async (ids, status) => {
    try {
      const response = await axios.post("/no-pay-records/bulk-update", {
        ids,
        status
      });
      return response.data;
    } catch (error) {
      console.error("Error bulk updating status:", error);
      throw error;
    }
  },

  // Bulk delete records
  bulkDeleteRecords: async (ids) => {
    try {
      const response = await axios.delete("/no-pay-records/bulk-delete", {
        data: { ids }
      });
      return response.data;
    } catch (error) {
      console.error("Error bulk deleting records:", error);
      throw error;
    }
  }
};

export default NoPayService;