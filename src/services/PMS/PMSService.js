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
  async getEmployeesByCompany(companyId, departmentId = null, search = "") {
    try {
      const params = { company_id: companyId };
      if (departmentId) params.department_id = departmentId;
      if (search) params.search = search;
      const response = await axios.get('/pms/employees-by-company', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching employees by company:", error);
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
  // --- end added methods ---
}

// Change the export to export an instance instead of the class
export default new PMSService();
