import axios from "../axios";

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
      const response = await axios.get('/pms/dashboard/kpi-performance');
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
}

export default new PMSService();
