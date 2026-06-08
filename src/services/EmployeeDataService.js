import axios from "@utils/axios";

const employeeService = {
  // Submit employee data with file uploads
  async submitEmployee(formData) {
    try {
      // Create FormData for file uploads
      const submissionData = new FormData();

      // Append profile picture if exists
      if (formData.personal.profilePicture) {
        submissionData.append(
          "profile_picture",
          formData.personal.profilePicture
        );
      }

      // Append all other form data as JSON
      submissionData.append(
        "personal",
        JSON.stringify({
          ...formData.personal,
          profilePicture: undefined, // Remove the file object from JSON data
        })
      );

      submissionData.append("address", JSON.stringify(formData.address));
      submissionData.append(
        "compensation",
        JSON.stringify(formData.compensation)
      );
      submissionData.append(
        "organization",
        JSON.stringify(formData.organization)
      );

      // Append documents if any
      if (formData.documents && formData.documents.length > 0) {
        const documentsMeta = [];
        formData.documents.forEach((doc, index) => {
          if (doc.file) {
            submissionData.append(`documents[${index}]`, doc.file);
            documentsMeta.push({ type: doc.type || 'unknown' });
          }
        });
        submissionData.append('documents', JSON.stringify(documentsMeta));
      }

      const response = await axios.post("/employees", submissionData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Submit error:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        throw error;
      } else if (error.request) {
        console.error("No response received:", error.request);
        throw new Error("No response from server");
      } else {
        console.error("Error message:", error.message);
        throw new Error("Error setting up request");
      }
    }
  },

  async updateEmployee(id, formData) {
    try {
      // Create FormData for file uploads
      const submissionData = new FormData();

      // Append profile picture if exists
      if (formData.personal.profilePicture) {
        submissionData.append(
          "profile_picture",
          formData.personal.profilePicture
        );
      }

      // Append all other form data as JSON
      submissionData.append(
        "personal",
        JSON.stringify({
          ...formData.personal,
          profilePicture: undefined, // Remove the file object from JSON data
        })
      );

      submissionData.append("address", JSON.stringify(formData.address));
      submissionData.append(
        "compensation",
        JSON.stringify(formData.compensation)
      );
      submissionData.append(
        "organization",
        JSON.stringify(formData.organization)
      );

      // Append documents if any
      if (formData.documents && formData.documents.length > 0) {
        const documentsMeta = [];
        formData.documents.forEach((doc, index) => {
          if (doc.file) {
            submissionData.append(`documents[${index}]`, doc.file);
            documentsMeta.push({ type: doc.type || 'unknown' });
          }
        });
        submissionData.append('documents', JSON.stringify(documentsMeta));
      }

      const response = await axios.post(
        "/employes/post/update",
        submissionData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Update response:", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error("Update error:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        throw error;
      } else if (error.request) {
        console.error("No response received:", error.request);
        throw new Error("No response from server");
      } else {
        console.error("Error message:", error.message);
        throw new Error("Error setting up request");
      }
    }
  },

  async searchEmployees(searchTerm) {
    try {
      const response = await axios.get(`/emp/search`, {
        params: { search: searchTerm },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  },

  async searchByAttendanceNo(searchTerm) {
    try {
      const response = await axios.get(`/emp/search/empno?attendance_no=${searchTerm}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  },

  async fetchEmployees() {
    try {
      const response = await axios.get(`/employees`);
      return response.data;
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  },

  async fetchEmployeesForTable(page = 1, perPage = 10, search = "") {
    try {
      const response = await axios.get(
        `/emp/table?page=${page}&per_page=${perPage}&search=${search}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  },

  async fetchEmployeeById(id) {
    try {
      const response = await axios.get(`/employees/${id}`);
      return response.data.data; // Return the actual employee data from the wrapper
    } catch (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }
  },

  async getEmployeeDetails(id) {
    try {
      const response = await axios.get(`/employees/${id}`);
      return response.data.data; // Returns employee object with all relationships
    } catch (error) {
      console.error("Error fetching employee details:", error);
      throw error;
    }
  },

  async deleteEmployeeById(id) {
    try {
      const response = await axios.delete(`/employees/${id}`);
      return true;
    } catch (error) {
      console.error("Error delete employees:", error);
      return [];
    }
  },

  async exportEmployees(employeeId = null) {
    try {
      const params = employeeId ? { employee_id: employeeId } : {};
      const response = await axios.get("/employees/export/data", { params });
      return response.data;
    } catch (error) {
      console.error("Error exporting employees:", error);
      throw error;
    }
  },
};

export default employeeService;
