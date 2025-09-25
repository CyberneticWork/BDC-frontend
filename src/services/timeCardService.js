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

  // Updated to match the new backend update method
  updateTimeCard: async (id, data) => {
    try {
      const response = await axios.put(`/time-cards/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating time card:", error);
      throw error;
    }
  },

  // Updated to match the new backend destroy method
  deleteTimeCard: async (id) => {
    try {
      const response = await axios.delete(`/time-cards/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting time card:", error);
      throw error;
    }
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

  // Add this method to process the data client-side
  async importExcelData(data) {
    // client-side guard: require from_date & to_date
    if (!data || !data.from_date || !data.to_date) {
      throw new Error('Both From Date and To Date are required for import.');
    }

    const formData = new FormData();

    // Add basic fields (ensure strings)
    formData.append('from_date', String(data.from_date));
    formData.append('to_date', String(data.to_date));
    if (data.company_id !== undefined && data.company_id !== '') {
      formData.append('company_id', String(data.company_id));
    }

    // If you're sending parsed records, include them
    if (data.records) {
      formData.append('records', JSON.stringify(data.records));
    }

    // Preserve original filename when appending the file
    if (data.file) {
      const fileName = data.file.name || 'import.xlsx';
      formData.append('file', data.file, fileName);
      formData.append('file_type', data.file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      formData.append('file_ext', fileName.split('.').pop().toLowerCase());
    }

    try {
      const response = await axios.post('/attendance/import-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Excel import error:', error.response?.data || error.message);
      throw error;
    }
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
      
      // IMPORTANT: Explicitly set the MIME type instead of relying on response headers
      // This fixes the Linux server issue
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
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