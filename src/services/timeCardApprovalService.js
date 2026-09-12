import axios from "@utils/axios";

const timeCardApprovalService = {
  async listPending(params = {}) {
    const response = await axios.get("/time-cards/pending-approvals", { params });
    return response.data?.data || [];
  },

  async updateStatus(id, approval_status, reason) {
    const response = await axios.put(`/time-cards/${id}/approval`, {
      approval_status,
      reason,
    });
    return response.data;
  },

  async bulkUpdateStatus(ids, approval_status, reason) {
    const response = await axios.post("/time-cards/bulk-approval", {
      ids,
      approval_status,
      reason,
    });
    return response.data;
  },

  async audit(params = {}) {
    const response = await axios.get("/reports/time-cards/audit", { params });
    return response.data;
  },

  async deleted(params = {}) {
    const response = await axios.get("/reports/time-cards/deleted", { params });
    return response.data;
  },
};

export default timeCardApprovalService;
