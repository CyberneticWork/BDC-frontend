import axios from "@utils/axios";

const hikvisionService = {
  listDevices: async () => {
    const res = await axios.get("/hikvision/devices");
    return res.data?.data ?? [];
  },

  createDevice: async (payload) => {
    const res = await axios.post("/hikvision/devices", payload);
    return res.data;
  },

  updateDevice: async (id, payload) => {
    const res = await axios.put(`/hikvision/devices/${id}`, payload);
    return res.data;
  },

  deleteDevice: async (id) => {
    const res = await axios.delete(`/hikvision/devices/${id}`);
    return res.data;
  },

  testConnection: async (id) => {
    const res = await axios.post(`/hikvision/devices/${id}/test`);
    return res.data;
  },

  syncNow: async (id, payload = {}) => {
    const res = await axios.post(`/hikvision/devices/${id}/sync`, payload);
    return res.data;
  },

  configureWebhook: async (id) => {
    const res = await axios.post(`/hikvision/devices/${id}/configure-webhook`);
    return res.data;
  },

  getEventLogs: async (id, limit = 20) => {
    const res = await axios.get(`/hikvision/devices/${id}/logs`, { params: { limit } });
    return res.data?.data ?? [];
  },

  importExcel: async (formData) => {
    const res = await axios.post("/attendance/import-hikvision-excel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default hikvisionService;
