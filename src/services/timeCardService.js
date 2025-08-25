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

  // Add this method to process the data client-side
  async importExcelData(data) {
    const formData = new FormData();
    if (data.company_id !== undefined) formData.append('company_id', data.company_id);
    if (data.from_date !== undefined) formData.append('from_date', data.from_date);
    if (data.to_date !== undefined) formData.append('to_date', data.to_date);
    formData.append('records', JSON.stringify(data.records || []));
    if (data.file) formData.append('file', data.file, data.file.name || 'import.xlsx');

    // Debug log: show records payload being sent
    try {
      console.log('importExcelData - records JSON:', JSON.parse(formData.get('records')));
    } catch (e) {
      console.log('importExcelData - records (raw):', formData.get('records'));
    }
    // Optionally log FormData keys
    for (const key of formData.keys()) {
      console.log('FormData key:', key);
    }

    try {
      const response = await axios.post('/attendance/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async fetchCompanies() {
    const res = await axios.get('/companies');
    return res.data;
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