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
  async getPMSDashboardStats() {
    try {
      const response = await axios.get('/pms/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error("Error fetching PMS dashboard stats:", error);
      throw error;
    }
  }

  async getRecentPerformanceReviews(limit = 5) {
    try {
      const response = await axios.get('/pms/performance-reviews', { 
        params: { per_page: limit, recent: true } 
      });
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

  /**
   * Get KPI performance stats for dashboard cards.
   * params: { start_date?: 'YYYY-MM-DD', end_date?: 'YYYY-MM-DD' }
   * returns: { onTarget, needAttention, totalInWindow, startDate, endDate }
   */
  async getKpiPerformance(params = {}) {
    try {
      const res = await axios.get('/pms/dashboard/KPIs', { params });
      // backend returns { data: { onTarget, needAttention, ... } }
      return res.data?.data ?? res.data;
    } catch (err) {
      console.error('PMSService.getKpiPerformance error', err?.response?.data ?? err);
      throw err;
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

  // KPI Tasks CRUD operations
  async createKpiTask(taskData) {
    try {
      const response = await axios.post('/kpi-tasks', taskData);
      return response.data;
    } catch (error) {
      console.error("Error creating KPI task:", error);
      throw error;
    }
  }

  async updateKpiTask(id, taskData) {
    try {
      const response = await axios.put(`/kpi-tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      console.error("Error updating KPI task:", error);
      throw error;
    }
  }

  async deleteKpiTask(id) {
    try {
      const response = await axios.delete(`/kpi-tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting KPI task:", error);
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

  // Create a new creator role
  async createCreatorRole(roleData) {
    try {
      const response = await axios.post('/creator-roles', roleData);
      return response.data;
    } catch (error) {
      console.error("Error creating creator role:", error);
      throw error;
    }
  }

  // Update an existing creator role
  async updateCreatorRole(id, roleData) {
    try {
      const response = await axios.put(`/creator-roles/${id}`, roleData);
      return response.data;
    } catch (error) {
      console.error("Error updating creator role:", error);
      throw error;
    }
  }

  // Delete a creator role
  async deleteCreatorRole(id) {
    try {
      const response = await axios.delete(`/creator-roles/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting creator role:", error);
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
      console.log('Making performance reviews request with filters:', filters);
      const response = await axios.get('/pms/performance-reviews', { params: filters });
      console.log('Performance reviews response:', response.data);
      return response.data; // { data:[], meta:{} }
    } catch (error) {
      console.error("Error fetching performance reviews from database:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
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

  // Get assignment documents
  async getAssignmentDocuments(assignmentId) {
    try {
      const response = await axios.get(`/pms/performance-reviews/${assignmentId}/documents`);
      return response.data;
    } catch (error) {
      console.error("Error fetching assignment documents:", error);
      throw error;
    }
  }

  // Fetch single employee by DB id
  async getEmployeeById(employeeId) {
    try {
      const response = await axios.get(`/employees/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching employee ${employeeId}:`, error?.response?.data ?? error);
      throw error;
    }
  }
  
  // Submit practical feedback (simplified)
  async submitPracticalFeedback(assignmentId, payload) {
    try {
      const response = await axios.post(`/pms/performance-reviews/${assignmentId}/practical-feedback`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error submitting practical feedback for assignment ${assignmentId}:`, error?.response?.data ?? error);
      throw error;
    }
  }

  // Get feedback history
  async getPracticalFeedbackHistory(params = {}) {
    try {
      const response = await axios.get('/pms/practical-feedback/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback history:', error);
      throw error;
    }
  }

  // Get feedback statistics
  async getFeedbackStats() {
    try {
      const response = await axios.get('/pms/practical-feedback/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      throw error;
    }
  }

  // NEW: Update Performance Review
  async updatePerformanceReview(assignmentId, reviewData) {
    try {
      console.log('PMSService sending data:', reviewData); // Debug log
      
      const response = await axios.put(`/pms/performance-reviews/${assignmentId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error("Error updating performance review:", error);
      console.error("Error response data:", error.response?.data); // More detailed logging
      throw error;
    }
  }

  // Calculate employee performance
  async calculateEmployeePerformance(data) {
    try {
      const response = await axios.post('/pms/employee-performance/calculate', data);
      return response.data;
    } catch (error) {
      console.error("Error calculating employee performance:", error);
      throw error;
    }
  }

  // Save employee performance evaluation (updated endpoint)
  async saveEmployeePerformance(data) {
    try {
      const response = await axios.post('/performance-evaluations', data);
      return response.data;
    } catch (error) {
      console.error("Error saving employee performance:", error);
      throw error;
    }
  }

  // Alternative approach - use the existing PMS endpoint
  async saveEmployeePerformanceBulk(evaluationsData) {
    try {
      const response = await axios.post('/performance-evaluations/bulk', {
        evaluations: evaluationsData
      });
      
      // Handle both successful and partial success responses
      if (response.status === 201 || response.status === 207) {
        return response;
      }
      
      return response;
    } catch (error) {
      console.error("Error saving employee performance in bulk:", error);
      throw error;
    }
  }

  // Get performance evaluations for a specific employee
  async getEmployeePerformanceEvaluations(employeeId = null) {
    try {
      const url = employeeId 
        ? `/performance-evaluations/employee/${employeeId}` 
        : '/performance-evaluations';
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching employee performance evaluations:", error);
      throw error;
    }
  }

  // Get performance evaluation statistics
  async getPerformanceEvaluationStats() {
    try {
      const response = await axios.get('/performance-evaluations/stats/overview');
      return response.data;
    } catch (error) {
      console.error("Error fetching performance evaluation stats:", error);
      throw error;
    }
  }

  // Restore a soft deleted evaluation
  async restorePerformanceEvaluation(id) {
    try {
      const response = await axios.post(`/performance-evaluations/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error("Error restoring performance evaluation:", error);
      throw error;
    }
  }

  // Get KPI tasks that need approval
  async getKpiTasksForApproval() {
    try {
      // Reuse the assignments endpoint and derive an approval_status so the UI continues to work
      const res = await axios.get('/pms/kpi-task-assignments-for-approval');
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);

      const mapped = raw.map(item => {
        const status = (item.approval_status ?? item.status ?? "").toString().toLowerCase();
        // Default mapping: treat active assignments as pending approval unless explicit approval_status provided
        const approval_status = item.approval_status
          ? item.approval_status
          : (status === "active" ? "pending" : (status || "pending"));

        return {
          ...item,
          approval_status,
        };
      });

      return mapped;
    } catch (error) {
      console.error("PMSService.getKpiTasksForApproval error", error?.response?.data ?? error);
      throw error;
    }
  }

  // Approve a KPI assignment (calls backend)
  async approveKpiTask(id) {
    try {
      const res = await axios.post(`/pms/kpi-tasks/${id}/approve`);
      return res.data;
    } catch (error) {
      console.error(`Error approving KPI task ${id}:`, error?.response?.data ?? error);
      throw error;
    }
  }

  // Reject a KPI assignment with an optional reason
  async rejectKpiTask(id, reason = null) {
    try {
      const payload = reason ? { reason } : {};
      const res = await axios.post(`/pms/kpi-tasks/${id}/reject`, payload);
      return res.data;
    } catch (error) {
      console.error(`Error rejecting KPI task ${id}:`, error?.response?.data ?? error);
      throw error;
    }
  }

  // Get KPI weight templates
  async getKpiWeights() {
    try {
      const response = await axios.get('/pms/kpi-weights');
      return response.data;
    } catch (error) {
      console.error("Error fetching KPI weights:", error);
      throw error;
    }
  }

  // KPI Weights CRUD operations
  async createKpiWeight(weightData) {
    try {
      const response = await axios.post('/pms/kpi-weights', weightData);
      return response.data;
    } catch (error) {
      console.error("Error creating KPI weight:", error);
      throw error;
    }
  }

  async updateKpiWeight(id, weightData) {
    try {
      const response = await axios.put(`/pms/kpi-weights/${id}`, weightData);
      return response.data;
    } catch (error) {
      console.error("Error updating KPI weight:", error);
      throw error;
    }
  }

  async deleteKpiWeight(id, force = false) {
    try {
      const url = `/pms/kpi-weights/${id}`;
      const params = force ? { force: true } : {};
      const response = await axios.delete(url, { params });
      return response.data;
    } catch (error) {
      console.error('Error deleting KPI weight:', error);
      throw error;
    }
  }

  // Calculate performance appraisal
  async calculatePerformanceAppraisal(data) {
    try {
      const response = await axios.post('/pms/performance-appraisal/calculate', data);
      return response.data;
    } catch (error) {
      console.error("Error calculating performance appraisal:", error);
      throw error;
    }
  }

  // Save performance appraisal
  async savePerformanceAppraisal(data) {
    try {
      const response = await axios.post('/pms/performance-appraisal/save', data);
      return response.data;
    } catch (error) {
      console.error("Error saving performance appraisal:", error);
      throw error;
    }
  }

  // Get performance appraisals
  async getPerformanceAppraisals(employeeId = null) {
    try {
      const params = employeeId ? { employee_id: employeeId } : {};
      const response = await axios.get('/pms/performance-appraisals', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching performance appraisals:", error);
      throw error;
    }
  }

  // Get saved performance evaluations with pagination and search
  async getSavedPerformanceEvaluations(params = {}) {
    try {
      const response = await axios.get('/performance-evaluations', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching saved performance evaluations:", error);
      throw error;
    }
  }

  // Get a single performance evaluation by ID
  async getPerformanceEvaluationById(id) {
    try {
      const response = await axios.get(`/performance-evaluations/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching performance evaluation:", error);
      throw error;
    }
  }

  // Delete a performance evaluation (soft delete)
  async deletePerformanceEvaluation(id) {
    try {
      const response = await axios.delete(`/performance-evaluations/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting performance evaluation:", error);
      throw error;
    }
  }

  // Bulk save performance appraisals
  async savePerformanceAppraisalsBulk(appraisalsData) {
    try {
      const response = await axios.post('/performance-appraisals/bulk', {
        appraisals: appraisalsData
      });
      
      // Handle both successful and partial success responses
      if (response.status === 201 || response.status === 207) {
        return response;
      }
      
      return response;
    } catch (error) {
      console.error("Error saving performance appraisals in bulk:", error);
      throw error;
    }
  }

  // Get saved performance appraisals with pagination and search
  async getSavedPerformanceAppraisals(params = {}) {
    try {
      const response = await axios.get('/performance-appraisals', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching saved performance appraisals:", error);
      throw error;
    }
  }

  // Get a single performance appraisal by ID
  async getPerformanceAppraisalById(id) {
    try {
      const response = await axios.get(`/performance-appraisals/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching performance appraisal:", error);
      throw error;
    }
  }

  // Delete a performance appraisal (soft delete)
  async deletePerformanceAppraisal(id) {
    try {
      const response = await axios.delete(`/performance-appraisals/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting performance appraisal:", error);
      throw error;
    }
  }

  // Restore a soft deleted appraisal
  async restorePerformanceAppraisal(id) {
    try {
      const response = await axios.post(`/performance-appraisals/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error("Error restoring performance appraisal:", error);
      throw error;
    }
  }

  // Get performance appraisal statistics
  async getPerformanceAppraisalStats() {
    try {
      const response = await axios.get('/performance-appraisals/stats/overview');
      return response.data;
    } catch (error) {
      console.error("Error fetching performance appraisal stats:", error);
      throw error;
    }
  }

  // Add this new method
  async checkAssigneeWeights(data) {
    try {
      const response = await axios.post('/pms/kpi-task-assignments/check-weights', data);
      return response.data;
    } catch (error) {
      console.error("Error checking assignee weights:", error);
      throw error;
    }
  }
}

export default new PMSService();
