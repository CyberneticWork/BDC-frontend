import axios from "@utils/axios";

const ResignationService = {
  // Get all resignations with optional filtering
  getAllResignations: async (params = {}) => {
    try {
      const response = await axios.get('/resignations', { params });
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Create a new resignation with validation checks
  createResignation: async (resignationData) => {
    try {
      // Client-side file size validation
      if (resignationData.documents && resignationData.documents.length > 0) {
        const oversizedFiles = resignationData.documents.filter(
          file => file.size > 5 * 1024 * 1024 // 5MB in bytes
        );
        
        if (oversizedFiles.length > 0) {
          const errorFiles = oversizedFiles.map(f => f.name).join(', ');
          throw {
            response: {
              data: {
                errors: {
                  documents: [`The following files exceed 5MB limit: ${errorFiles}`]
                }
              }
            }
          };
        }
      }

      const formData = new FormData();
      
      // Append basic fields
      formData.append('employee_id', resignationData.employee_id);
      formData.append('resigning_date', resignationData.resigning_date);
      formData.append('last_working_day', resignationData.last_working_day);
      formData.append('resignation_reason', resignationData.resignation_reason);
      
      // Append documents if any
      if (resignationData.documents && resignationData.documents.length > 0) {
        resignationData.documents.forEach((file, index) => {
          formData.append(`documents[${index}]`, file);
        });
      }
      
      const response = await axios.post('/resignations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      // Handle duplicate resignation error
      if (error.response && error.response.data && 
          error.response.data.message === 'This employee already has a pending resignation request') {
        throw {
          response: {
            data: {
              errors: {
                employee_id: ['This employee already has a pending resignation request']
              }
            }
          }
        };
      }
      
      // Handle file size errors from server
      if (error.response && error.response.data && 
          error.response.data.errors && 
          error.response.data.errors.documents) {
        throw {
          response: {
            data: {
              errors: {
                documents: error.response.data.errors.documents
              }
            }
          }
        };
      }
      
      throw error.response ? error.response.data : error;
    }
  },

  // Get a single resignation by ID
  getResignationById: async (id) => {
    try {
      const response = await axios.get(`/resignations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Update resignation status
  updateResignationStatus: async (id, statusData) => {
    try {
      const response = await axios.put(`/resignations/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Upload additional documents with validation
  uploadDocuments: async (id, documents) => {
    try {
      // Client-side file size validation
      const oversizedFiles = documents.filter(
        file => file.size > 5 * 1024 * 1024 // 5MB in bytes
      );
      
      if (oversizedFiles.length > 0) {
        const errorFiles = oversizedFiles.map(f => f.name).join(', ');
        throw {
          response: {
            data: {
              errors: {
                documents: [`The following files exceed 5MB limit: ${errorFiles}`]
              }
            }
          }
        };
      }

      const formData = new FormData();
      documents.forEach((file, index) => {
        formData.append(`documents[${index}]`, file);
      });
      
      const response = await axios.post(
        `/resignations/${id}/documents`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      // Handle file size errors from server
      if (error.response && error.response.data && 
          error.response.data.errors && 
          error.response.data.errors.documents) {
        throw {
          response: {
            data: {
              errors: {
                documents: error.response.data.errors.documents
              }
            }
          }
        };
      }
      
      throw error.response ? error.response.data : error;
    }
  },

  // Delete a document
  deleteDocument: async (resignationId, documentId) => {
    try {
      await axios.delete(`/resignations/${resignationId}/documents/${documentId}`);
      return true;
    } catch (error) {
      throw error.response.data;
    }
  }
};

const EmployeeService = {
  getAllEmployees: async () => {
    try {
      const response = await axios.get('/employees');
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  getActiveEmployees: async () => {
    try {
      const response = await axios.get('/employees/active');
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  }
};

export default ResignationService;
export { EmployeeService };