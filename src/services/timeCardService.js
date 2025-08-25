import axios from "@utils/axios";

const timeCardService = {
  // ...existing methods...

  async fetchEmployeeByNic(nic) {
    try {
      const response = await axios.get(`/employees/by-nic/${nic}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching employee by NIC:", error);
      return null;
    }
  },

  markAbsentees: async (date) => {
    const response = await axios.post('/attendance/mark-absentees', { date });
    return response.data;
  },

  // Add these methods:
  updateTimeCard: async (id, data) => {
    const response = await axios.put(`/time-cards/${id}`, data);
    return response.data;
  },

  deleteTimeCard: async (id) => {
    const response = await axios.delete(`/time-cards/${id}`);
    return response.data;
  },

  async searchEmployeeTimeCards(search) {
    const res = await axios.get(`/time-cards/search-employee?q=${encodeURIComponent(search)}`);
    return res.data;
  },

  async importExcel(formData) {
    const response = await axios.post('/attendance/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async fetchCompanies() {
    const res = await axios.get('/companies');
    return res.data;
  },
async fetchTodayStats() {
    const response = await axios.get('/dashboard/stats/today');
    return response.data;
},
  async fetchAbsentees({ date, search = "" }) {
    const response = await axios.get('/attendance/absentees', {
      params: { date, search }
    });
    return response.data;
  },


  downloadTemplate: async () => {
    const url = '/attendance-template';
    try {
      const response = await axios.get(url, { responseType: 'blob' });
      if (response.status !== 200 || !response.data) {
        throw new Error('Download failed');
      }
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', 'attendance_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      // Rethrow for the UI to handle
      throw new Error(
        error.response && error.response.status === 404
          ? 'Template not found (404)'
          : 'Download failed'
      );
    }
  },

};

export default timeCardService;