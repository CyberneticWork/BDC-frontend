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
    const formData = this._prepareCourseFormData(courseData);
    const res = await axios.post("/courses", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return mapCourse(res.data.course ?? res.data);
  },

  async updateCourse(id, courseData) {
    const formData = this._prepareCourseFormData(courseData);
    const res = await axios.post(`/courses/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      params: { _method: "PUT" }, // Laravel expects PUT but we use POST with _method
    });
    return mapCourse(res.data.course ?? res.data);
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
      console.log('Making enrollment API call to:', url);
      console.log('Full URL:', axios.defaults.baseURL + url);

      // Check if token exists
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      console.log('Auth token value:', token ? token.substring(0, 20) + '...' : 'null');

      // If userId is provided, send it in the request body as a workaround
      const requestData = userId ? { user_id: userId } : {};
      console.log('Request data:', requestData);

      const response = await axios.post(url, requestData);
      console.log('Enrollment API response:', response);
      return response.data;
    } catch (error) {
      console.error('Enrollment failed:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      throw error;
    }
  },

  async checkEnrollment(courseId) {
    try {
      const response = await axios.get(`/courses/${courseId}/enrollment`);
      return response.data;
    } catch (error) {
      console.error('Check enrollment failed:', error);
      throw error;
    }
  },

  async getEnrollments() {
    try {
      const response = await axios.get('/enrollments');
      return response.data;
    } catch (error) {
      console.error('Get enrollments failed:', error);
      throw error;
    }
  },

  async unenrollFromCourse(courseId) {
    try {
      const response = await axios.delete(`/courses/${courseId}/enroll`);
      return response.data;
    } catch (error) {
      console.error('Unenrollment failed:', error);
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

  getUserProgress() {
    this._recalculateUserProgress();
    return this._userProgress;
  },

  _recalculateUserProgress() {
    const enrolled = this._coursesCache.filter((c) => c.enrolled);
    const completedCourses = enrolled.filter((c) => c.completed);
    const allModules = enrolled.flatMap((c) => c.modules || []);
    const completedModules = allModules.filter((m) => m.completed);
    this._userProgress = {
      totalCourses: enrolled.length,
      completedCourses: completedCourses.length,
      totalModules: allModules.length,
      completedModules: completedModules.length,
      certificatesEarned: completedCourses.length, // placeholder
    };
  },

  // ---- Exams API ----

  // Get all exams with optional params
  async getExams(params = {}) {
    const response = await axios.get("/exams", { params });
    return response.data;
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
};

export default LMSService;
