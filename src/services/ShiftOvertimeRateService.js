import axios from "@utils/axios";

const ShiftOvertimeRateService = {
  // List for dropdown
  getShiftsDropdown: async () => {
    const res = await axios.get("/shift-overtime-rates/shifts/dropdown");
    return res.data?.data ?? [];
  },

  // Get existing rate by shift id (returns 404 if not created yet)
  getByShiftId: async (shiftId) => {
    try {
      const res = await axios.get(`/shift-overtime-rates/by-shift/${shiftId}`);
      return res.data?.data ?? null;
    } catch (err) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  // Create
  create: async (payload) => {
    const res = await axios.post("/shift-overtime-rates", payload);
    return res.data?.data;
  },

  // Update
  update: async (id, payload) => {
    const res = await axios.put(`/shift-overtime-rates/${id}`, payload);
    return res.data?.data;
  },

  // Delete (soft delete)
  delete: async (id) => {
    const res = await axios.delete(`/shift-overtime-rates/${id}`);
    return res.data;
  },

  // Optional: list everything
  list: async () => {
    const res = await axios.get("/shift-overtime-rates");
    return res.data?.data ?? [];
  },
};

export default ShiftOvertimeRateService;