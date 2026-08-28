import axios from "@utils/axios";

const attendanceExceptionService = {
  list: async (params = {}) => {
    const res = await axios.get("/attendance/exceptions", { params });
    return res.data?.data ?? [];
  },

  updateStatus: async (id, approval_status, reason = null) => {
    const res = await axios.put(`/attendance/exceptions/${id}`, {
      approval_status,
      reason,
    });
    return res.data;
  },

  bulkUpdateStatus: async (ids, approval_status, reason = null) => {
    const res = await axios.post("/attendance/exceptions/bulk-status", {
      ids,
      approval_status,
      reason,
    });
    return res.data;
  },
};

export default attendanceExceptionService;
