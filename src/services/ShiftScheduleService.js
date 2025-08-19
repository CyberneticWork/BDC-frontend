import axios from "@utils/axios";

const ShiftScheduleService = {
  // Get all shifts
  getAllShifts: async () => {
    try {
      const response = await axios.get('/shifts');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching shifts:', error);
      throw error;
    }
  },

  // Create a new shift
  createShift: async (shiftData) => {
    try {
      const response = await axios.post('/shifts', {
        shift_code: shiftData.code,
        shift_description: shiftData.description,
        start_time: shiftData.startTime,
        end_time: shiftData.endTime,
        midnight_roster: shiftData.midnightRoster,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating shift:', error);
      throw error;
    }
  },

  // Update a shift
  updateShift: async (id, shiftData) => {
    try {
      const response = await axios.put(`/shifts/${id}`, {
        shift_code: shiftData.code,
        shift_description: shiftData.description,
        start_time: shiftData.startTime,
        end_time: shiftData.endTime,
        midnight_roster: shiftData.midnightRoster,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating shift:', error);
      throw error;
    }
  },

  // Delete a shift
  deleteShift: async (id) => {
    try {
      await axios.delete(`/shifts/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting shift:', error);
      throw error;
    }
  }
};

export default ShiftScheduleService;