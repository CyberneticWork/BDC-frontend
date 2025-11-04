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
        // New OT fields
        morning_ot_start: shiftData.morningOtStart,
        morning_ot_end: shiftData.morningOtEnd,
        morning_ot_rate: shiftData.morningOtRate,
        morning_ot_max_minutes: shiftData.morningOtMaxMinutes,
        night_ot_start: shiftData.nightOtStart,
        night_ot_end: shiftData.nightOtEnd,
        night_normal_ot_max_minutes: shiftData.nightNormalOtMaxMinutes,
        night_normal_ot_rate: shiftData.nightNormalOtRate,
        night_special_ot_rate: shiftData.nightSpecialOtRate,
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
        // New OT fields
        morning_ot_start: shiftData.morningOtStart,
        morning_ot_end: shiftData.morningOtEnd,
        morning_ot_rate: shiftData.morningOtRate,
        morning_ot_max_minutes: shiftData.morningOtMaxMinutes,
        night_ot_start: shiftData.nightOtStart,
        night_ot_end: shiftData.nightOtEnd,
        night_normal_ot_max_minutes: shiftData.nightNormalOtMaxMinutes,
        night_normal_ot_rate: shiftData.nightNormalOtRate,
        night_special_ot_rate: shiftData.nightSpecialOtRate,
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