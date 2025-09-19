import axios from "@utils/axios";

class PMSService {
  // Performance Reviews
  async getPerformanceReviews(filters = {}) {
    try {
      const response = await axios.get('/pms/reviews', { params: filters });
      return response.data;
    } catch (error) {
      console.error("Error fetching performance reviews:", error);
      throw error;
    }
  }

  async getReviewById(id) {
    try {
      const response = await axios.get(`/pms/reviews/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching review details:", error);
      throw error;
    }
  }

  async createReview(reviewData) {
    try {
      const response = await axios.post('/pms/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error("Error creating review:", error);
      throw error;
    }
  }

  async updateReview(id, reviewData) {
    try {
      const response = await axios.put(`/pms/reviews/${id}`, reviewData);
      return response.data;
    } catch (error) {
      console.error("Error updating review:", error);
      throw error;
    }
  }

  async deleteReview(id) {
    try {
      const response = await axios.delete(`/pms/reviews/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting review:", error);
      throw error;
    }
  }

  // Dashboard Statistics
  async getDashboardStats() {
    try {
      const response = await axios.get('/pms/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error("Error fetching PMS dashboard stats:", error);
      throw error;
    }
  }

  async getRecentReviews() {
    try {
      const response = await axios.get('/pms/dashboard/recent-reviews');
      return response.data;
    } catch (error) {
      console.error("Error fetching recent reviews:", error);
      throw error;
    }
  }

  async getUpcomingDeadlines() {
    try {
      const response = await axios.get('/pms/dashboard/upcoming-deadlines');
      return response.data;
    } catch (error) {
      console.error("Error fetching upcoming deadlines:", error);
      throw error;
    }
  }

  async getKpiPerformance() {
    try {
      const response = await axios.get('/pms/dashboard/KPIs');
      return response.data;
    } catch (error) {
      console.error("Error fetching KPI performance:", error);
      throw error;
    }
  }

  // Goals & OKRs
  async getGoals(filters = {}) {
    try {
      const response = await axios.get('/pms/goals', { params: filters });
      return response.data;
    } catch (error) {
      console.error("Error fetching goals:", error);
      throw error;
    }
  }

  // KPIs
  async getKpis(filters = {}) {
    try {
      const response = await axios.get('/pms/kpis', { params: filters });
      return response.data;
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      throw error;
    }
  }

  // 360 Feedback
  async get360Feedback(filters = {}) {
    try {
      const response = await axios.get('/pms/feedback', { params: filters });
      return response.data;
    } catch (error) {
      console.error("Error fetching 360 feedback:", error);
      throw error;
    }
  }

  // Competencies
  async getCompetencies() {
    try {
      const response = await axios.get('/pms/competencies');
      return response.data;
    } catch (error) {
      console.error("Error fetching competencies:", error);
      throw error;
    }
  }

  // --- Add these methods so KPIs.jsx can call them ---
  async getKpiTasks() {
    try {
      const response = await axios.get('/kpi-tasks');
      return response.data;
    } catch (error) {
      console.error("Error fetching KPI task names:", error);
      throw error;
    }
  }

  async getCreatorRoles() {
    try {
      const response = await axios.get('/creator-roles');
      return response.data;
    } catch (error) {
      console.error("Error fetching creator roles:", error);
      throw error;
    }
  }

  async getCompanies() {
    try {
      const response = await axios.get('/pms/companies');
      return response.data;
    } catch (error) {
      console.error("Error fetching companies:", error);
      throw error;
    }
  }

  async getDepartmentsByCompany(companyId) {
    try {
      const response = await axios.get(`/pms/departments/${companyId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching departments for company:", error);
      throw error;
    }
  }

  // Fetch employees by company, optional department and search term
  async getEmployeesByCompany(companyId = null, departmentId = null, search = "") {
    try {
      const params = {};
      if (companyId) params.company_id = companyId;
      if (departmentId) params.department_id = departmentId;
      if (search) params.search = search;
      
      const response = await axios.get('/pms/employees-by-company', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching employees by company:", error);
      throw error;
    }
  }

  // Get all employees (not company specific)
  async getAllEmployees(search = "") {
    try {
      const params = {};
      if (search) params.search = search;
      
      const response = await axios.get('/employees', { params }); // Use general employees endpoint
      return response.data;
    } catch (error) {
      console.error("Error fetching all employees:", error);
      throw error;
    }
  }

  // NEW: Create KPI task assignment
  async createKpiTaskAssignment(data) {
    try {
      const response = await axios.post('/pms/kpi-task-assignments', data);
      return response.data;
    } catch (error) {
      console.error("Error creating KPI task assignment:", error);
      throw error;
    }
  }

  // NEW: Fetch KPI task assignments
  async getKpiTaskAssignments() {
    try {
      const response = await axios.get('/pms/kpi-task-assignments');
      return response.data;
    } catch (error) {
      console.error("Error fetching KPI task assignments:", error);
      throw error;
    }
  }

  // NEW: Update KPI task assignment
  async updateKpiTaskAssignment(id, data) {
    try {
      const response = await axios.put(`/pms/kpi-task-assignments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating KPI task assignment:", error);
      throw error;
    }
  }

  // NEW: Delete KPI task assignment (use DELETE to match backend)
  async deleteKpiTaskAssignment(id) {
    try {
      const response = await axios.delete(`/pms/kpi-task-assignments/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting KPI task assignment:", error);
      throw error;
    }
  }

  // NEW: Fetch KPI task assignments for a specific employee
  async getEmployeeKpiTaskAssignments(employeeId) {
    try {
      const response = await axios.get(`/pms/employee-kpi-task-assignments/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching employee KPI task assignments:", error);
      throw error;
    }
  }

  // Submit task progress with file upload
  async submitTaskProgress(formData) {
    try {
      console.log("PMSService: Submitting task progress...");
      const response = await axios.post('/pms/task-progress-submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error submitting task progress:", error);
      
      // Log detailed error information for debugging
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        console.error("Response headers:", error.response.headers);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }
      
      throw error;
    }
  }

  // Get task progress submissions for an assignment
  async getTaskProgressSubmissions(assignmentId) {
    try {
      const response = await axios.get(`/pms/task-progress-submissions/assignment/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching task progress submissions:", error);
      throw error;
    }
  }

  // Get employee task progress submissions
  async getEmployeeTaskProgressSubmissions(employeeId) {
    try {
      const response = await axios.get(`/pms/task-progress-submissions/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching employee task progress submissions:", error);
      throw error;
    }
  }

  // NEW: Performance Reviews from database
  async getPerformanceReviewsFromDB(filters = {}) {
    try {
      const response = await axios.get('/pms/performance-reviews', { params: filters });
      return response.data; // { data:[], meta:{} }
    } catch (error) {
      console.error("Error fetching performance reviews from database:", error);
      throw error;
    }
  }

  async getPerformanceReviewDetails(assignmentId) {
    try {
      const response = await axios.get(`/pms/performance-reviews/${assignmentId}/details`);
      return response.data;
    } catch (error) {
      console.error("Error fetching performance review details:", error);
      throw error;
    }
  }

  async getAssignmentDocuments(assignmentId) {
    try {
      const response = await axios.get(`/pms/performance-reviews/${assignmentId}/documents`);
      return response.data;
    } catch (error) {
      console.error("Error fetching assignment documents:", error);
      throw error;
    }
  }

  // NEW: Update Performance Review
  async updatePerformanceReview(assignmentId, reviewData) {
    try {
      const response = await axios.put(`/pms/performance-reviews/${assignmentId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error("Error updating performance review:", error);
      throw error;
    }
  }

  // Calculate employee performance evaluation
  async calculateEmployeePerformance(data) {
    try {
      const response = await axios.post('/pms/employee-performance/calculate', data);
      return response.data;
    } catch (error) {
      console.error("Error calculating employee performance:", error);
      throw error;
    }
  }

  // Save employee performance evaluation
  async saveEmployeePerformance(data) {
    try {
      const response = await axios.post('/pms/employee-performance/save', data);
      return response.data;
    } catch (error) {
      console.error("Error saving employee performance:", error);
      throw error;
    }
  }

  // Get employee performance evaluations
  async getEmployeePerformanceEvaluations(employeeId = null) {
    try {
      const params = employeeId ? { employee_id: employeeId } : {};
      const response = await axios.get('/pms/employee-performance', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching employee performance evaluations:", error);
      throw error;
    }
  }
  // --- end added methods ---
}

// Change the export to export an instance instead of the class
export default new PMSService();
