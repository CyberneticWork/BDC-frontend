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
        formData.documents.forEach((doc, index) => {
          if (doc.file) {
            submissionData.append(`documents[${index}]`, doc.file);
          }
        });
      }

      const response = await axios.post("/employees", submissionData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        // The server responded with a status code outside 2xx
        throw error;
      } else if (error.request) {
        // The request was made but no response received
        throw new Error("No response from server");
      } else {
        // Something happened in setting up the request
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
        formData.documents.forEach((doc, index) => {
          if (doc.file) {
            submissionData.append(`documents[${index}]`, doc.file);
          }
        });
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
      if (error.response) {
        // The server responded with a status code outside 2xx
        throw error;
      } else if (error.request) {
        // The request was made but no response received
        throw new Error("No response from server");
      } else {
        // Something happened in setting up the request
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
      return response.data;
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
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
};

export default employeeService;
