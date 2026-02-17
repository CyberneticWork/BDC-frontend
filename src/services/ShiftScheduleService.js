import axios from "@utils/axios";

// Ensure time strings match backend expected format 'H:i' (e.g., '09:30')
const toHM = (t) => {
  if (!t) return null;
  const s = String(t);
  // Accept 'HH:MM' or 'HH:MM:SS' -> trim to first 5 chars
  if (s.length >= 5 && s.includes(":")) return s.slice(0, 5);
  return s;
};

const ShiftScheduleService = {
  // Get all shifts
  getAllShifts: async () => {
    try {
      const response = await axios.get("/shifts");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching shifts:", error);
      throw error;
    }
  },

  // Create a new shift
  createShift: async (shiftData) => {
    try {
      const response = await axios.post("/shifts", {
        shift_code: shiftData.code,
        shift_description: shiftData.description,
        start_time: toHM(shiftData.startTime),
        end_time: toHM(shiftData.endTime),
        midnight_roster: shiftData.midnightRoster,
        // New OT fields
        morning_ot_start: toHM(shiftData.morningOtStart),
        morning_ot_end: toHM(shiftData.morningOtEnd),
        night_ot_start: shiftData.nightOtStart,
        night_ot_end: toHM(shiftData.nightOtEnd),
      });
      return response.data.data;
    } catch (error) {
      console.error("Error creating shift:", error);
      throw error;
    }
  },

  // Update a shift
  updateShift: async (id, shiftData) => {
    try {
      const response = await axios.put(`/shifts/${id}`, {
        shift_code: shiftData.code,
        shift_description: shiftData.description,
        start_time: toHM(shiftData.startTime),
        end_time: toHM(shiftData.endTime),
        midnight_roster: shiftData.midnightRoster,
        // New OT fields
        morning_ot_start: toHM(shiftData.morningOtStart),
        morning_ot_end: toHM(shiftData.morningOtEnd),
        night_ot_start: toHM(shiftData.nightOtStart),
        night_ot_end: toHM(shiftData.nightOtEnd),
      });
      return response.data.data;
    } catch (error) {
      console.error("Error updating shift:", error);
      throw error;
    }
  },

  // Delete a shift
  deleteShift: async (id) => {
    try {
      await axios.delete(`/shifts/${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting shift:", error);
      throw error;
    }
  },
};

export default ShiftScheduleService;
