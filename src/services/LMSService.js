import axios from "../utils/axios";
import config from "../config";

// Helper to convert snake_case API response to camelCase used in UI
const mapCourse = (c) => ({
  id: c.id,
  title: c.title,
  description: c.description,
  duration: c.duration,
  createdBy: c.created_by,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
  modules: (c.modules || []).map((m) => ({
    id: m.id,
    courseId: m.course_id,
    title: m.title,
    content: m.content,
    path: m.path
      ? m.path.startsWith("http")
        ? m.path
        : m.path.startsWith("/storage/")
        ? `${config.apiBaseUrl}${m.path}`
        : `${config.apiBaseUrl}/storage/modules/${m.path}`
      : null,
    completed: m.completed,
  })),
  attachments: (c.attachments || []).map((a) => ({
    id: a.id,
    courseId: a.course_id,
    name: a.name,
    type: a.type,
    url: a.url.startsWith("http")
      ? a.url
      : a.url.startsWith("/storage/")
      ? `${config.apiBaseUrl}${a.url}`
      : `${config.apiBaseUrl}/storage/attachments/${a.url}`,
    size: a.size,
  })),
});

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const LMSService = {
  // Add formatFileSize as a method
  formatFileSize,
  // Simulated current user (replace with AuthContext integration later)
  currentUser: { id: 1, name: "Current User" },

  // Local cache of courses for client-side progress & enrollment simulation
  _coursesCache: [],
  _userProgress: {
    totalCourses: 0,
    completedCourses: 0,
    totalModules: 0,
    completedModules: 0,
    certificatesEarned: 0,
  },

  // ---- Courses API ----
  async fetchCourses({ page = 1, perPage = 10 } = {}) {
    const res = await axios.get("/courses", {
      params: { page, per_page: perPage },
    });
    // Paginated response: res.data has data[]
    const payload = res.data;
    const data = (payload.data || []).map(mapCourse);
    // Cache for dashboard usage
    this._coursesCache = data.map((c) => ({
      ...c,
      enrolled: c.enrolled || false,
      completed: c.completed || false,
      certificate: c.certificate || null,
    }));
    this._recalculateUserProgress();
    return { ...payload, data: this._coursesCache };
  },

  async getCourseById(id) {
    const res = await axios.get(`/courses/${id}`);
    return mapCourse(res.data);
  },

  async createCourse(courseData) {
    try {
      console.log("Creating course with data:", courseData);
      const formData = this._prepareCourseFormData(courseData);
      console.log("Prepared FormData for course creation");

      const res = await axios.post("/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Course creation response:", res.data);
      return mapCourse(res.data.course ?? res.data);
    } catch (error) {
      console.error("Course creation failed:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      throw error;
    }
  },

  async updateCourse(id, courseData) {
    try {
      console.log("Updating course with ID:", id, "Data:", courseData);
      const formData = this._prepareCourseFormData(courseData);
      console.log("Prepared FormData for course update");

      const res = await axios.post(`/courses/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        params: { _method: "PUT" }, // Laravel expects PUT but we use POST with _method
      });

      console.log("Course update response:", res.data);
      return mapCourse(res.data.course ?? res.data);
    } catch (error) {
      console.error("Course update failed:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      throw error;
    }
  },

  async deleteCourse(id) {
    await axios.delete(`/courses/${id}`);
    // Remove from cache if present
    this._coursesCache = this._coursesCache.filter(
      (c) => c.id !== parseInt(id)
    );
    this._recalculateUserProgress();
    return true;
  },

  // ---- Enrollment API ----
  async enrollInCourse(courseId, userId = null) {
    try {
      const url = `/courses/${courseId}/enroll`;
      console.log("Making enrollment API call to:", url);
      console.log("Full URL:", axios.defaults.baseURL + url);

      // Check if token exists
      const token = localStorage.getItem("token");
      console.log("Auth token exists:", !!token);
      console.log(
        "Auth token value:",
        token ? token.substring(0, 20) + "..." : "null"
      );

      // If userId is provided, send it in the request body as a workaround
      const requestData = userId ? { user_id: userId } : {};
      console.log("Request data:", requestData);

      const response = await axios.post(url, requestData);
      console.log("Enrollment API response:", response);
      return response.data;
    } catch (error) {
      console.error("Enrollment failed:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      throw error;
    }
  },

  async checkEnrollment(courseId) {
    try {
      const response = await axios.get(`/courses/${courseId}/enrollment`);
      return response.data;
    } catch (error) {
      console.error("Check enrollment failed:", error);
      throw error;
    }
  },

  async getEnrollments() {
    try {
      const response = await axios.get("/enrollments");
      return response.data;
    } catch (error) {
      console.error("Get enrollments failed:", error);
      throw error;
    }
  },

  async unenrollFromCourse(courseId) {
    try {
      const response = await axios.delete(`/courses/${courseId}/enroll`);
      return response.data;
    } catch (error) {
      console.error("Unenrollment failed:", error);
      throw error;
    }
  },

  // Simulated client-side attachment creation (until real upload endpoint exists)
  createAttachmentFromFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const videoExts = ["mp4", "avi", "mov", "wmv"]; // accepted
    const type =
      ext === "pdf" ? "pdf" : videoExts.includes(ext) ? "video" : null;
    if (!type)
      throw new Error(
        "Invalid file type. Only PDF and video files are allowed."
      );
    return {
      tempId: Date.now() + Math.random(),
      name: file.name,
      type,
      url: `/files/${file.name}`, // placeholder until backend upload exists
      size: formatFileSize(file.size),
    };
  },

  // ---- Client-side enrollment & progress (placeholder until backend endpoints exist) ----
  // Note: Real API methods are now implemented above, these simulated methods are kept for fallback only

  getCourses() {
    return this._coursesCache;
  },

  // enrollInCourse method removed - using real API method above

  getEnrolledCourses() {
    return this._coursesCache.filter((c) => c.enrolled);
  },

  getCourseCreator(courseId) {
    const course = this._coursesCache.find((c) => c.id === parseInt(courseId));
    if (!course) return null;
    return { id: course.createdBy, name: `User ${course.createdBy}` };
  },

  async getUserProgress() {
    try {
      console.log("Fetching user progress from API...");
      const response = await axios.get("/user/progress");
      const data = response.data;

      console.log("User progress API response:", data);

      // Update cache with API data
      this._userProgress = {
        totalCourses: data.totalCourses || 0,
        completedCourses: data.completedCourses || 0,
        totalModules: data.totalModules || 0,
        completedModules: data.completedModules || 0,
        certificatesEarned: data.certificatesEarned || 0,
      };

      // Update courses cache with enrolled courses from API
      this._coursesCache = (data.enrolledCourses || []).map((course) => ({
        ...course,
        enrolled: true,
        completed: course.completed || false,
        certificate: course.completed
          ? { id: course.id, title: course.title }
          : null,
      }));

      // Fetch exam certificates
      const examCertificates = await this._getExamCertificates();

      // Combine course and exam certificates
      const allCertificates = [
        ...(data.certificates || []),
        ...examCertificates,
      ];

      return {
        ...this._userProgress,
        enrolledCourses: data.enrolledCourses || [],
        certificates: allCertificates,
        certificatesEarned: allCertificates.length, // Update to include both course and exam certificates
      };
    } catch (error) {
      console.error("Failed to fetch user progress from API:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);

      // Fallback to client-side calculation
      this._recalculateUserProgress();
      const enrolledCourses = this.getEnrolledCourses();
      const examCertificates = await this._getExamCertificates();

      return {
        ...this._userProgress,
        enrolledCourses: enrolledCourses,
        certificates: examCertificates, // Include exam certificates in fallback
        certificatesEarned:
          this._userProgress.certificatesEarned + examCertificates.length, // Include exam certificates in count
      };
    }
  },

  // Helper method to get exam certificates
  async _getExamCertificates() {
    try {
      // Get all exams
      const examsResponse = await this.getExams();
      const exams = examsResponse.data || [];

      // Get exam results to find passed exams
      const resultsResponse = await this.getExamResults();
      const results = resultsResponse.data || [];

      // Filter passed exams and create certificate objects
      const examCertificates = [];

      for (const result of results) {
        if (result.passed) {
          const exam = exams.find((e) => e.id === result.exam_id);
          if (exam) {
            examCertificates.push({
              id: `exam-${result.exam_id}`,
              // Add fields that CertificateModal expects when certificateType === 'exam'
              examId: result.exam_id,
              examTitle: exam.title,
              examDescription: exam.description,
              issueDate: result.submitted_at || result.created_at,
              passingScore: exam.passing_score || exam.passingScore,

              // Keep existing fields for current list rendering and backward compatibility
              type: "exam",
              course_title: exam.title,
              exam_title: exam.title,
              issued_date: result.submitted_at || result.created_at,
              score: result.score,
              passing_score: exam.passing_score || exam.passingScore,
              certificate_url: null, // Exam certificates might not have URLs
            });
          }
        }
      }

      return examCertificates;
    } catch (error) {
      console.error("Failed to fetch exam certificates:", error);
      return [];
    }
  },

  async _recalculateUserProgress() {
    const enrolled = this._coursesCache.filter((c) => c.enrolled);
    const completedCourses = enrolled.filter((c) => c.completed);
    const allModules = enrolled.flatMap((c) => c.modules || []);

    // Get exam certificates count
    let examCertificatesCount = 0;
    try {
      const examCertificates = await this._getExamCertificates();
      examCertificatesCount = examCertificates.length;
    } catch (error) {
      console.warn(
        "Could not fetch exam certificates for progress calculation:",
        error
      );
    }

    const completedModules = allModules.filter((m) => m.completed);
    this._userProgress = {
      totalCourses: enrolled.length,
      completedCourses: completedCourses.length,
      totalModules: allModules.length,
      completedModules: completedModules.length,
      certificatesEarned: completedCourses.length + examCertificatesCount, // Include both course and exam certificates
    };
  },

  // Helper method to prepare FormData for course creation/updates
  _prepareCourseFormData(courseData) {
    const formData = new FormData();
    formData.append("title", courseData.title);
    formData.append("description", courseData.description);
    formData.append("duration", courseData.duration);

    // Add modules with files
    if (courseData.modules && courseData.modules.length > 0) {
      courseData.modules.forEach((module, index) => {
        formData.append(`modules[${index}][title]`, module.title);
        formData.append(`modules[${index}][content]`, module.content || "");
        // Preserve existing module id so backend can decide to update instead of recreating
        if (module.id && !module.tempId) {
          formData.append(`modules[${index}][id]`, module.id);
        }

        // Add module file if exists
        if (module.file) {
          formData.append(`modules[${index}][file]`, module.file);
          // Send original filename so backend can preserve it if desired
          try {
            formData.append(
              `modules[${index}][original_file_name]`,
              module.file.name
            );
          } catch (e) {
            // ignore
          }
        }
      });
    }

    // Add attachments (only new files with 'file' property)
    if (courseData.attachments && courseData.attachments.length > 0) {
      courseData.attachments.forEach((attachment, index) => {
        if (attachment.file) {
          // Only upload new files
          formData.append(`attachments[${index}]`, attachment.file);
          // Provide original filename for backend
          try {
            formData.append(
              `attachments_original_names[${index}]`,
              attachment.file.name
            );
          } catch (e) {
            // ignore
          }
        }
      });
    }

    return formData;
  },

  // ---- Exams API ----

  // Get all exams with optional params
  async getExams(params = {}) {
    const response = await axios.get("/exams", { params });
    const payload = response.data;

    // Normalize exams array whether API returns { data: [...] } or an array
    const examsArray = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : [];

    const mapped = examsArray.map((e) => ({
      ...e,
      totalQuestions:
        e.totalQuestions ??
        e.total_questions ??
        (Array.isArray(e.questions)
          ? e.questions.length
          : e.questions_count ?? null),
    }));

    if (Array.isArray(payload)) {
      return { data: mapped };
    }

    return { ...payload, data: mapped };
  },

  // Get specific exam by ID
  async getExam(id) {
    const response = await axios.get(`/exams/${id}`);
    return response.data;
  },

  // Create new exam
  async createExam(examData) {
    const response = await axios.post("/exams", examData);
    return response.data;
  },

  // Update exam
  async updateExam(id, examData) {
    const response = await axios.put(`/exams/${id}`, examData);
    return response.data;
  },

  // Delete exam
  async deleteExam(id) {
    const response = await axios.delete(`/exams/${id}`);
    return response.data;
  },

  // Submit exam answers
  async submitExam(id, answers) {
    const response = await axios.post(`/exams/${id}/submit`, { answers });
    return response.data;
  },

  // Get exam results
  async getExamResults(params = {}) {
    const response = await axios.get("/exam-results", { params });
    return response.data;
  },

  // Check if a user has passed a specific exam
  async hasUserPassedExam(examId) {
    try {
      // Get exam results for the specific exam
      const response = await axios.get("/exam-results", {
        params: { exam_id: examId },
      });

      // Check if there's any result with passing score
      const results = response.data.data || [];

      // Find the exam record with matching ID that has a passing score
      const passedExam = results.find(
        (result) => result.exam_id == examId && result.passed
      );

      return !!passedExam;
    } catch (error) {
      console.error(`Failed to check if user passed exam ${examId}:`, error);
      return false;
    }
  },

  // Get user certificate for a specific exam
  async getExamCertificate(examId) {
    try {
      // Get exam results for the specific exam to get certificate data
      const response = await axios.get("/exam-results", {
        params: { exam_id: examId },
      });

      // Find the passing result
      const results = response.data.data || [];
      const passedResult = results.find(
        (result) => result.exam_id == examId && result.passed
      );

      if (!passedResult) return null;

      // Try to resolve exam metadata (title, description, passing score)
      let examData = null;
      try {
        examData = await this.getExam(examId);
      } catch (e) {
        // Fallback to embedded exam object in the result (if provided)
        examData = passedResult.exam || null;
      }

      const examTitle = examData?.title || `Exam #${examId}`;
      const examDescription = examData?.description;
      const passingScore =
        examData?.passing_score || examData?.passingScore || undefined;

      return {
        examId: passedResult.exam_id,
        score: passedResult.score,
        issueDate: passedResult.submitted_at || new Date().toISOString(),
        certificateId: `CERT-${String(examId).padStart(4, "0")}-${String(
          passedResult.score
        ).padStart(2, "0")}`,
        examTitle,
        examDescription,
        passingScore,
      };
    } catch (error) {
      console.error(`Failed to get certificate for exam ${examId}:`, error);
      return null;
    }
  },

  // Test API connectivity
  async testApiConnection() {
    try {
      console.log("Testing API connection...");
      const response = await axios.get("/courses");
      console.log("API connection test successful:", response.status);
      return { status: "success", message: "API is accessible" };
    } catch (error) {
      console.error("API connection test failed:", error);
      throw error;
    }
  },

  // Update module progress
  async updateModuleProgress(courseId, moduleId, completed) {
    try {
      console.log(
        `Updating module progress: course ${courseId}, module ${moduleId}, completed: ${completed}`
      );
      const response = await axios.post(
        `/courses/${courseId}/modules/${moduleId}/progress`,
        {
          completed: completed,
        }
      );
      console.log("Module progress update response:", response.data);

      // Progress data is updated via API response, no need to refresh here
      // The frontend components will re-fetch progress data when needed

      return response.data;
    } catch (error) {
      console.error("Failed to update module progress:", error);
      throw error;
    }
  },

  // Get user certificates
  async getUserCertificates() {
    try {
      const progressData = await this.getUserProgress();
      return progressData.certificates || [];
    } catch (error) {
      console.error("Failed to fetch user certificates:", error);
      return [];
    }
  },

  // ---- Admin LMS Stats & Progress (User Stats) ----
  // High-level LMS stats
  async getLmsStats() {
    const res = await axios.get("/admin/lms/stats");
    return res.data;
  },

  // Course progress for all users (Laravel-style pagination)
  async getAllUsersCourseProgress({
    page = 1,
    perPage = 15,
    search,
    courseId,
    userId,
  } = {}) {
    const params = { page, per_page: perPage };
    if (search) params.search = search;
    if (courseId) params.course_id = courseId;
    if (userId) params.user_id = userId;
    const res = await axios.get("/admin/lms/users/course-progress", { params });
    return res.data; // { current_page, data, total, ... }
  },

  // Exam progress for all users (manual pagination shape)
  async getAllUsersExamProgress({
    page = 1,
    perPage = 15,
    search,
    examId,
    userId,
  } = {}) {
    const params = { page, per_page: perPage };
    if (search) params.search = search;
    if (examId) params.exam_id = examId;
    if (userId) params.user_id = userId;
    const res = await axios.get("/admin/lms/users/exam-progress", { params });
    return res.data; // { current_page, data, total, ... }
  },

  // Course progress for a single user
  async getUserCourseProgress(userId, { page = 1, perPage = 15 } = {}) {
    const params = { page, per_page: perPage };
    const res = await axios.get(`/admin/lms/users/${userId}/course-progress`, {
      params,
    });
    return res.data;
  },

  // Exam progress for a single user
  async getUserExamProgress(userId, { page = 1, perPage = 15 } = {}) {
    const params = { page, per_page: perPage };
    const res = await axios.get(`/admin/lms/users/${userId}/exam-progress`, {
      params,
    });
    return res.data;
  },

  removeAttachment: (attachmentId) => {
    return axios.delete(`/attachments/${attachmentId}`);
  },
};

export default LMSService;
