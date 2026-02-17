import axios from "@utils/axios";

const ShiftOvertimeRateService = {
  // Get all shift overtime rates
  list: async () => {
    try {
      const response = await axios.get("/shift-overtime-rates");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching shift overtime rates:", error);
      throw error;
    }
  },

  // Create new shift overtime rate
  create: async (data) => {
    try {
      const response = await axios.post("/shift-overtime-rates", data);
      return response.data.data;
    } catch (error) {
      console.error("Error creating shift overtime rate:", error);
      throw error;
    }
  },

  // Update existing shift overtime rate
  update: async (id, data) => {
    try {
      const response = await axios.put(`/shift-overtime-rates/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error("Error updating shift overtime rate:", error);
      throw error;
    }
  },

  // Delete shift overtime rate
  delete: async (id) => {
    try {
      await axios.delete(`/shift-overtime-rates/${id}`);
    } catch (error) {
      console.error("Error deleting shift overtime rate:", error);
      throw error;
    }
  },

  // Get shifts dropdown
  getShiftsDropdown: async () => {
    try {
      const response = await axios.get(
        "/shift-overtime-rates/shifts/dropdown"
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching shifts dropdown:", error);
      throw error;
    }
  },

  // Get by shift ID
  getByShiftId: async (shiftId) => {
    try {
      const response = await axios.get(
        `/shift-overtime-rates/by-shift/${shiftId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching shift overtime rate by shift ID:", error);
      throw error;
    }
  },

  // Calculate rates
  calculateRates: async (shiftId, data) => {
    try {
      const response = await axios.post(
        `/shift-overtime-rates/${shiftId}/calculate`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error("Error calculating rates:", error);
      throw error;
    }
  },
};

export default ShiftOvertimeRateService;