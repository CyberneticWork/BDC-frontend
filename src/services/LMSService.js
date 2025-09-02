const LMSService = {
  // Current user (in a real app, this would come from auth context)
  currentUser: { id: 1, name: "Current User", role: "admin" },

  // Dummy courses data
  courses: [
    {
      id: 1,
      title: "Introduction to HR Management",
      description:
        "Learn the basics of human resource management including recruitment, employee relations, and compliance.",
      duration: "2 hours",
      attachments: [
        {
          id: 1,
          name: "HR_Management_Guide.pdf",
          type: "pdf",
          url: "/files/hr_guide.pdf",
          size: "2.5 MB",
        },
      ],
      modules: [
        {
          id: 1,
          title: "Recruitment Process",
          content:
            "Understanding the recruitment lifecycle from job posting to onboarding.",
          completed: false,
        },
        {
          id: 2,
          title: "Employee Relations",
          content:
            "Building positive workplace relationships and conflict resolution.",
          completed: false,
        },
        {
          id: 3,
          title: "Compliance and Legal",
          content: "Understanding labor laws and workplace regulations.",
          completed: false,
        },
      ],
      enrolled: false,
      completed: false,
      certificate: null,
      createdBy: 1,
      createdAt: "2025-09-01",
      updatedAt: "2025-09-01",
    },
    {
      id: 2,
      title: "Leadership and Team Management",
      description:
        "Develop essential leadership skills and learn how to effectively manage teams.",
      duration: "3 hours",
      attachments: [
        {
          id: 2,
          name: "Leadership_Video.mp4",
          type: "video",
          url: "/files/leadership.mp4",
          size: "45 MB",
        },
        {
          id: 3,
          name: "Team_Management_PDF.pdf",
          type: "pdf",
          url: "/files/team_management.pdf",
          size: "1.8 MB",
        },
      ],
      modules: [
        {
          id: 4,
          title: "Leadership Styles",
          content: "Different approaches to leadership and when to use them.",
          completed: false,
        },
        {
          id: 5,
          title: "Team Building",
          content: "Strategies for building cohesive and productive teams.",
          completed: false,
        },
        {
          id: 6,
          title: "Performance Management",
          content:
            "Setting goals, providing feedback, and managing performance.",
          completed: false,
        },
        {
          id: 7,
          title: "Conflict Resolution",
          content: "Techniques for resolving workplace conflicts effectively.",
          completed: false,
        },
      ],
      enrolled: false,
      completed: false,
      certificate: null,
      createdBy: 2,
      createdAt: "2025-09-01",
      updatedAt: "2025-09-01",
    },
    {
      id: 3,
      title: "Workplace Safety and Health",
      description:
        "Essential training on workplace safety protocols and health standards.",
      duration: "1.5 hours",
      attachments: [],
      modules: [
        {
          id: 8,
          title: "Safety Protocols",
          content: "Understanding and implementing workplace safety measures.",
          completed: false,
        },
        {
          id: 9,
          title: "Emergency Procedures",
          content:
            "What to do in case of emergencies and evacuation procedures.",
          completed: false,
        },
        {
          id: 10,
          title: "Health and Wellness",
          content:
            "Promoting employee health and preventing workplace injuries.",
          completed: false,
        },
      ],
      enrolled: false,
      completed: false,
      certificate: null,
      createdBy: 1,
      createdAt: "2025-09-01",
      updatedAt: "2025-09-01",
    },
  ],

  // User progress data
  userProgress: {
    totalCourses: 0,
    completedCourses: 0,
    totalModules: 0,
    completedModules: 0,
    certificatesEarned: 0,
  },

  // Get all courses
  getCourses() {
    return this.courses;
  },

  // Get course by ID
  getCourseById(id) {
    return this.courses.find((course) => course.id === parseInt(id));
  },

  // Enroll in a course
  enrollInCourse(courseId) {
    const course = this.getCourseById(courseId);
    if (course) {
      course.enrolled = true;
      this.updateUserProgress();
    }
    return course;
  },

  // Mark module as completed
  completeModule(courseId, moduleId) {
    const course = this.getCourseById(courseId);
    if (course) {
      const module = course.modules.find((m) => m.id === parseInt(moduleId));
      if (module) {
        module.completed = true;
        this.checkCourseCompletion(course);
        this.updateUserProgress();
      }
    }
    return course;
  },

  // Check if course is completed
  checkCourseCompletion(course) {
    const allModulesCompleted = course.modules.every(
      (module) => module.completed
    );
    if (allModulesCompleted && !course.completed) {
      course.completed = true;
      course.certificate = {
        id: `CERT-${course.id}`,
        title: course.title,
        issuedDate: new Date().toISOString().split("T")[0],
        completionDate: new Date().toISOString().split("T")[0],
      };
    }
  },

  // Update user progress
  updateUserProgress() {
    const enrolledCourses = this.courses.filter((c) => c.enrolled);
    const completedCourses = enrolledCourses.filter((c) => c.completed);
    const allModules = enrolledCourses.flatMap((c) => c.modules);
    const completedModules = allModules.filter((m) => m.completed);

    this.userProgress = {
      totalCourses: enrolledCourses.length,
      completedCourses: completedCourses.length,
      totalModules: allModules.length,
      completedModules: completedModules.length,
      certificatesEarned: completedCourses.length,
    };
  },

  // Get user progress
  getUserProgress() {
    this.updateUserProgress();
    return this.userProgress;
  },

  // Get user's enrolled courses
  getEnrolledCourses() {
    return this.courses.filter((course) => course.enrolled);
  },

  // Get user's certificates
  getCertificates() {
    return this.courses
      .filter((course) => course.certificate)
      .map((course) => course.certificate);
  },

  // Course Management Methods
  // Get courses created by current user
  getMyCourses() {
    return this.courses.filter(
      (course) => course.createdBy === this.currentUser.id
    );
  },

  // Create a new course
  createCourse(courseData) {
    const newCourse = {
      id: Math.max(...this.courses.map((c) => c.id)) + 1,
      ...courseData,
      modules: courseData.modules || [],
      attachments: courseData.attachments || [],
      enrolled: false,
      completed: false,
      certificate: null,
      createdBy: this.currentUser.id,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    this.courses.push(newCourse);
    return newCourse;
  },

  // Update a course (only if user owns it)
  updateCourse(courseId, courseData) {
    const course = this.courses.find((c) => c.id === parseInt(courseId));
    if (course && course.createdBy === this.currentUser.id) {
      Object.assign(course, courseData, {
        updatedAt: new Date().toISOString().split("T")[0],
      });
      return course;
    }
    return null;
  },

  // Delete a course (only if user owns it)
  deleteCourse(courseId) {
    const courseIndex = this.courses.findIndex(
      (c) => c.id === parseInt(courseId)
    );
    if (
      courseIndex !== -1 &&
      this.courses[courseIndex].createdBy === this.currentUser.id
    ) {
      this.courses.splice(courseIndex, 1);
      return true;
    }
    return false;
  },

  // Check if user can edit a course
  canEditCourse(courseId) {
    const course = this.courses.find((c) => c.id === parseInt(courseId));
    return course && course.createdBy === this.currentUser.id;
  },

  // Get course creator info
  getCourseCreator(courseId) {
    const course = this.courses.find((c) => c.id === parseInt(courseId));
    return course
      ? { id: course.createdBy, name: `User ${course.createdBy}` }
      : null;
  },

  // File/Attachment Management Methods
  // Upload a file (simulated - in real app would upload to server)
  uploadFile(file) {
    // Simulate file upload
    const allowedTypes = ["pdf", "mp4", "avi", "mov", "wmv"];
    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(
        "Invalid file type. Only PDF and video files are allowed."
      );
    }

    // Simulate successful upload
    const attachment = {
      id: Date.now(),
      name: file.name,
      type: fileExtension === "pdf" ? "pdf" : "video",
      url: `/files/${file.name}`, // Simulated URL
      size: this.formatFileSize(file.size),
      uploadedAt: new Date().toISOString(),
    };

    return attachment;
  },

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  // Add attachment to course
  addAttachmentToCourse(courseId, attachment) {
    const course = this.courses.find((c) => c.id === parseInt(courseId));
    if (course && course.createdBy === this.currentUser.id) {
      if (!course.attachments) {
        course.attachments = [];
      }
      course.attachments.push(attachment);
      course.updatedAt = new Date().toISOString().split("T")[0];
      return true;
    }
    return false;
  },

  // Remove attachment from course
  removeAttachmentFromCourse(courseId, attachmentId) {
    const course = this.courses.find((c) => c.id === parseInt(courseId));
    if (course && course.createdBy === this.currentUser.id) {
      course.attachments = course.attachments.filter(
        (a) => a.id !== parseInt(attachmentId)
      );
      course.updatedAt = new Date().toISOString().split("T")[0];
      return true;
    }
    return false;
  },

  // Get course attachments
  getCourseAttachments(courseId) {
    const course = this.courses.find((c) => c.id === parseInt(courseId));
    return course ? course.attachments || [] : [];
  },
};

export default LMSService;
