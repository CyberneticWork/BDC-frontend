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

  _prepareCourseFormData(formData) {
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("duration", formData.duration);

    // Add modules as JSON
    if (formData.modules && formData.modules.length > 0) {
      formData.modules.forEach((module, index) => {
        data.append(`modules[${index}][title]`, module.title);
        data.append(`modules[${index}][content]`, module.content || "");
      });
    }

    // Add attachments (only new files with 'file' property)
    if (formData.attachments && formData.attachments.length > 0) {
      formData.attachments.forEach((attachment, index) => {
        if (attachment.file) {
          // Only upload new files
          data.append(`attachments[${index}]`, attachment.file);
        }
      });
    }

    return data;
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
  getCourses() {
    return this._coursesCache;
  },

  enrollInCourse(courseId) {
    const course = this._coursesCache.find((c) => c.id === parseInt(courseId));
    if (course) {
      course.enrolled = true;
      this._recalculateUserProgress();
    }
    return course;
  },

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

  // ---- (Existing exam dummy logic kept for now; can be migrated to API later) ----

  // Exam Management
  exams: [
    {
      id: 1,
      title: "HR Management Fundamentals Quiz",
      description: "Test your knowledge of basic HR management concepts",
      courseId: 1, // Related to course ID 1
      duration: "30 minutes",
      totalQuestions: 4, // Updated to match actual number of questions
      passingScore: 70,
      questions: [
        {
          id: 1,
          question: "What is the first step in the recruitment process?",
          options: [
            "Job posting",
            "Interview scheduling",
            "Resume screening",
            "Reference checking",
          ],
          correctAnswer: 2,
          explanation:
            "Resume screening is typically the first step after receiving applications",
        },
        {
          id: 2,
          question: "Which of the following is NOT a key HR function?",
          options: [
            "Recruitment",
            "Employee relations",
            "Financial planning",
            "Training and development",
          ],
          correctAnswer: 2,
          explanation:
            "Financial planning is typically handled by the finance department",
        },
        {
          id: 3,
          question: "What is the primary purpose of performance appraisals?",
          options: [
            "To determine salary increases only",
            "To identify training needs and provide feedback",
            "To decide on promotions exclusively",
            "To document employee misconduct",
          ],
          correctAnswer: 1,
          explanation:
            "Performance appraisals help identify development needs and provide constructive feedback",
        },
        {
          id: 4,
          question:
            "Which employment law protects against workplace discrimination?",
          options: [
            "FLSA (Fair Labor Standards Act)",
            "Title VII of the Civil Rights Act",
            "OSHA (Occupational Safety and Health Act)",
            "ERISA (Employee Retirement Income Security Act)",
          ],
          correctAnswer: 1,
          explanation:
            "Title VII prohibits employment discrimination based on race, color, religion, sex, or national origin",
        },
      ],
      createdBy: 1,
      createdAt: "2025-09-01",
      updatedAt: "2025-09-01",
    },
    {
      id: 2,
      title: "Leadership Assessment",
      description:
        "Evaluate your leadership skills and management capabilities",
      courseId: null, // Standalone exam
      duration: "45 minutes",
      totalQuestions: 1, // Fixed: matches actual number of questions
      passingScore: 75,
      questions: [
        {
          id: 3,
          question: "What leadership style focuses on team consensus?",
          options: [
            "Autocratic",
            "Democratic",
            "Laissez-faire",
            "Transactional",
          ],
          correctAnswer: 1,
          explanation:
            "Democratic leadership involves team participation in decision making",
        },
      ],
      createdBy: 1,
      createdAt: "2025-09-02",
      updatedAt: "2025-09-02",
    },
  ],

  // Get all exams
  getExams() {
    return this.exams;
  },

  // Get exam by ID
  getExamById(examId) {
    return this.exams.find((exam) => exam.id === parseInt(examId));
  },

  // Get exams created by current user
  getMyExams() {
    return this.exams.filter((exam) => exam.createdBy === this.currentUser.id);
  },

  // Get exams related to a specific course
  getExamsByCourse(courseId) {
    return this.exams.filter((exam) => exam.courseId === parseInt(courseId));
  },

  // Get standalone exams (not related to any course)
  getStandaloneExams() {
    return this.exams.filter((exam) => exam.courseId === null);
  },

  // Create a new exam
  createExam(examData) {
    const newExam = {
      id: Math.max(...this.exams.map((e) => e.id)) + 1,
      ...examData,
      questions: examData.questions || [],
      createdBy: this.currentUser.id,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    this.exams.push(newExam);
    return newExam;
  },

  // Update an exam (only if user owns it)
  updateExam(examId, examData) {
    const exam = this.exams.find((e) => e.id === parseInt(examId));
    if (exam && exam.createdBy === this.currentUser.id) {
      Object.assign(exam, examData, {
        updatedAt: new Date().toISOString().split("T")[0],
      });
      return exam;
    }
    return null;
  },

  // Delete an exam (only if user owns it)
  deleteExam(examId) {
    const examIndex = this.exams.findIndex((e) => e.id === parseInt(examId));
    if (
      examIndex !== -1 &&
      this.exams[examIndex].createdBy === this.currentUser.id
    ) {
      this.exams.splice(examIndex, 1);
      return true;
    }
    return false;
  },

  // Check if user can edit an exam
  canEditExam(examId) {
    const exam = this.exams.find((e) => e.id === parseInt(examId));
    return exam && exam.createdBy === this.currentUser.id;
  },

  // Add question to exam
  addQuestionToExam(examId, question) {
    const exam = this.exams.find((e) => e.id === parseInt(examId));
    if (exam && exam.createdBy === this.currentUser.id) {
      if (!exam.questions) {
        exam.questions = [];
      }
      const newQuestion = {
        id: Date.now(),
        ...question,
      };
      exam.questions.push(newQuestion);
      exam.totalQuestions = exam.questions.length;
      exam.updatedAt = new Date().toISOString().split("T")[0];
      return newQuestion;
    }
    return null;
  },

  // Remove question from exam
  removeQuestionFromExam(examId, questionId) {
    const exam = this.exams.find((e) => e.id === parseInt(examId));
    if (exam && exam.createdBy === this.currentUser.id) {
      exam.questions = exam.questions.filter(
        (q) => q.id !== parseInt(questionId)
      );
      exam.totalQuestions = exam.questions.length;
      exam.updatedAt = new Date().toISOString().split("T")[0];
      return true;
    }
    return false;
  },

  // Update question in exam
  updateQuestionInExam(examId, questionId, questionData) {
    const exam = this.exams.find((e) => e.id === parseInt(examId));
    if (exam && exam.createdBy === this.currentUser.id) {
      const question = exam.questions.find(
        (q) => q.id === parseInt(questionId)
      );
      if (question) {
        Object.assign(question, questionData);
        exam.updatedAt = new Date().toISOString().split("T")[0];
        return question;
      }
    }
    return null;
  },

  // Get exam questions
  getExamQuestions(examId) {
    const exam = this.exams.find((e) => e.id === parseInt(examId));
    return exam ? exam.questions || [] : [];
  },

  // Submit exam and calculate score
  submitExam(examId, userAnswers) {
    const exam = this.exams.find((e) => e.id === parseInt(examId));
    if (!exam) return null;

    let correctAnswers = 0;
    const results = exam.questions.map((question, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      };
    });

    const score = Math.round((correctAnswers / exam.questions.length) * 100);
    const passed = score >= exam.passingScore;

    return {
      examId: exam.id,
      score,
      passed,
      correctAnswers,
      totalQuestions: exam.questions.length,
      results,
      submittedAt: new Date().toISOString(),
    };
  },
};

export default LMSService;
