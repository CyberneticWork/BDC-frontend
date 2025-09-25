import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Clock,
  Target,
  CheckCircle,
  X,
  AlertCircle,
  BookOpen,
  PlusCircle,
  Save,
  Award,
  ArrowLeft,
  Printer,
} from "lucide-react";
import LMSService from "../../services/LMSService";
import { useAuth } from "../../contexts/AuthContext";
import CertificateModal from "../../components/CertificateModal";
import Swal from "sweetalert2";

const ExamManagement = ({ onTakeExam }) => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [passedExams, setPassedExams] = useState({});
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [currentCertificate, setCurrentCertificate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentExamForQuestions, setCurrentExamForQuestions] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    duration: "",
    passingScore: 70,
    questions: [],
  });
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  });
  const [questionModalMode, setQuestionModalMode] = useState("add"); // 'add' | 'edit'
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load exams and courses on component mount
  useEffect(() => {
    loadExams();
    loadCourses();
  }, []);

  const validateForm = () => {
    const errors = {};

    // Validate exam title
    if (!formData.title.trim()) {
      errors.title = "Exam title is required";
    }

    // Validate description
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    // Validate duration
    if (!formData.duration.trim()) {
      errors.duration = "Duration is required";
    }

    // Validate questions
    if (formData.questions.length === 0) {
      errors.questions = "At least one question is required";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Show validation error
      Swal.fire({
        icon: "warning",
        title: "Please Fill Required Fields",
        text: "Some required fields are missing. Please check the form and try again.",
        confirmButtonColor: "#F59E0B",
      });
    }

    return Object.keys(errors).length === 0;
  };

  const validateQuestion = () => {
    const errors = {};

    // Validate question text
    if (!newQuestion.question.trim()) {
      errors.question = "Question text is required";
    }

    // Validate all options are filled
    const emptyOptions = newQuestion.options.filter((opt) => !opt.trim());
    if (emptyOptions.length > 0) {
      errors.options = "All option fields must be filled";
    }

    return errors;
  };

  const isExamOwner = (exam) => {
    // Admin users can edit/delete any exam
    if (user && user.role === "admin") {
      return true;
    }
    // Regular users can only edit/delete their own exams
    return user && exam.created_by === user.id;
  };

  // Check which exams the user has passed
  const checkPassedExams = async (examsList) => {
    const passedStatus = {};

    // Process exams in parallel for better performance
    await Promise.all(
      examsList.map(async (exam) => {
        const hasPassed = await LMSService.hasUserPassedExam(exam.id);
        passedStatus[exam.id] = hasPassed;
      })
    );

    setPassedExams(passedStatus);
  };

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await LMSService.getExams();
      const examsList = response.data || [];
      setExams(examsList);

      // Check which exams the user has passed
      await checkPassedExams(examsList);
    } catch (err) {
      setError("Failed to load exams");
      console.error("Error loading exams:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to Load Exams",
        text: "Unable to load exams. Please try again later.",
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await LMSService.fetchCourses();
      setCourses(response.data || []);
    } catch (err) {
      console.error("Error loading courses:", err);
      // Fallback to cached courses if API fails
      setCourses(LMSService.getCourses());

      // Show error message
      Swal.fire({
        icon: "warning",
        title: "Courses Loading Issue",
        text: "Unable to load courses from server. Using cached data if available.",
        confirmButtonColor: "#F59E0B",
        timer: 4000,
        timerProgressBar: true,
      });
    }
  };

  const handleCreateExam = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFieldErrors({}); // Clear any previous field errors
      // Transform questions to match backend field names
      const transformedQuestions = formData.questions.map((question) => ({
        question: question.question,
        options: question.options,
        correct_answer:
          typeof question.correct_answer === "number"
            ? question.correct_answer
            : question.correctAnswer,
        explanation: question.explanation,
      }));
      const examData = {
        title: formData.title,
        description: formData.description,
        course_id: formData.courseId ? parseInt(formData.courseId) : null,
        duration: formData.duration,
        passing_score: formData.passingScore,
        total_questions: formData.questions.length,
        questions: transformedQuestions,
      };
      await LMSService.createExam(examData);
      await loadExams();
      setShowCreateModal(false);
      resetForm();

      // Success message
      Swal.fire({
        icon: "success",
        title: "Exam Created Successfully!",
        text: "Your exam has been created and is now available.",
        confirmButtonColor: "#10B981",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      setError("Failed to create exam");
      console.error("Error creating exam:", err);

      // Error message
      Swal.fire({
        icon: "error",
        title: "Failed to Create Exam",
        text:
          err.response?.data?.message ||
          "An error occurred while creating the exam. Please try again.",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExam = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFieldErrors({}); // Clear any previous field errors
      // Transform questions to match backend field names
      const transformedQuestions = formData.questions.map((question) => ({
        question: question.question,
        options: question.options,
        correct_answer:
          typeof question.correct_answer === "number"
            ? question.correct_answer
            : question.correctAnswer,
        explanation: question.explanation,
      }));
      const examData = {
        title: formData.title,
        description: formData.description,
        course_id: formData.courseId ? parseInt(formData.courseId) : null,
        duration: formData.duration,
        passing_score: formData.passingScore,
        total_questions: formData.questions.length,
        questions: transformedQuestions,
      };
      await LMSService.updateExam(editingExam.id, examData);
      await loadExams();
      setEditingExam(null);
      resetForm();

      // Success message
      Swal.fire({
        icon: "success",
        title: "Exam Updated Successfully!",
        text: "Your exam has been updated successfully.",
        confirmButtonColor: "#10B981",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      setError("Failed to update exam");
      console.error("Error updating exam:", err);

      // Error message
      Swal.fire({
        icon: "error",
        title: "Failed to Update Exam",
        text:
          err.response?.data?.message ||
          "An error occurred while updating the exam. Please try again.",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this! This will permanently delete the exam and all its questions.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        setError(null);
        await LMSService.deleteExam(examId);
        await loadExams();

        // Success message
        Swal.fire({
          icon: "success",
          title: "Exam Deleted!",
          text: "The exam has been deleted successfully.",
          confirmButtonColor: "#10B981",
          timer: 3000,
          timerProgressBar: true,
        });
      } catch (err) {
        setError("Failed to delete exam");
        console.error("Error deleting exam:", err);

        // Error message
        Swal.fire({
          icon: "error",
          title: "Failed to Delete Exam",
          text:
            err.response?.data?.message ||
            "An error occurred while deleting the exam. Please try again.",
          confirmButtonColor: "#EF4444",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      description: exam.description,
      courseId: exam.course_id || exam.courseId || "",
      duration: exam.duration,
      passingScore: exam.passing_score || exam.passingScore,
      questions: [...(exam.questions || [])],
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      courseId: "",
      duration: "",
      passingScore: 70,
      questions: [],
    });
    setNewQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    });
    setFieldErrors({});
  };

  const addQuestion = () => {
    const questionErrors = validateQuestion();
    if (Object.keys(questionErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...questionErrors }));

      // Show validation error
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please fill in all required fields for the question.",
        confirmButtonColor: "#F59E0B",
      });
      return;
    }

    if (
      newQuestion.question &&
      newQuestion.options.every((opt) => opt.trim())
    ) {
      const question = {
        ...newQuestion,
        id: Date.now(),
      };
      setFormData({
        ...formData,
        questions: [...formData.questions, question],
      });
      setNewQuestion({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
      });
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.question;
        delete newErrors.options;
        return newErrors;
      });

      // Success message
      Swal.fire({
        icon: "success",
        title: "Question Added!",
        text: "Question has been added to the exam.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }
  };

  const removeQuestion = (questionId) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((q) => q.id !== questionId),
    });
  };

  const updateQuestion = (questionId, field, value) => {
    setFormData({
      ...formData,
      questions: formData.questions.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    });
  };

  const updateQuestionOption = (questionId, optionIndex, value) => {
    setFormData({
      ...formData,
      questions: formData.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      ),
    });
  };

  const getCourseTitle = (courseId) => {
    if (!courseId) return "Standalone Exam";
    const course = courses.find((c) => c.id === courseId);
    return course ? course.title : "Unknown Course";
  };

  const openAddQuestionModal = () => {
    setQuestionModalMode("add");
    setEditingQuestion(null);
    setNewQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    });
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (question) => {
    setQuestionModalMode("edit");
    setEditingQuestion(question);
    setNewQuestion({
      question: question.question || "",
      options: [...(question.options || ["", "", "", ""])],
      correctAnswer:
        typeof question.correct_answer === "number"
          ? question.correct_answer
          : question.correctAnswer || 0,
      explanation: question.explanation || "",
    });
    setShowQuestionModal(true);
  };

  const saveQuestionChanges = () => {
    // validation reuse
    const questionErrors = validateQuestion();
    if (Object.keys(questionErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...questionErrors }));
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please complete required fields",
        confirmButtonColor: "#F59E0B",
      });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === editingQuestion.id
          ? {
              ...q,
              question: newQuestion.question,
              options: newQuestion.options,
              correct_answer: newQuestion.correctAnswer,
              explanation: newQuestion.explanation,
            }
          : q
      ),
    }));
    setShowQuestionModal(false);
    setEditingQuestion(null);
    Swal.fire({
      icon: "success",
      title: "Question Updated!",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1800,
    });
  };

  // Handle viewing certificate for a passed exam
  const handleViewCertificate = async (examId) => {
    try {
      // Get the exam data
      const exam = exams.find((e) => e.id === examId);
      // exam may be absent in edge cases; don't hard-fail here

      // Get certificate data from the service
      const certificate = await LMSService.getExamCertificate(examId);
      if (!certificate) {
        throw new Error("Certificate not available");
      }

      // Set certificate data and show modal
      setCurrentCertificate({
        ...certificate,
        // Prefer title coming from certificate; fallback to local exam list
        examTitle: certificate.examTitle || exam?.title,
        examDescription: certificate.examDescription || exam?.description,
        passingScore:
          certificate.passingScore || exam?.passing_score || exam?.passingScore,
        userName: user?.name || user?.fullName || "User",
      });
      setShowCertificateModal(true);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      Swal.fire({
        icon: "error",
        title: "Certificate Error",
        text: "Failed to retrieve your certificate. Please try again later.",
        confirmButtonColor: "#3B82F6",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Exam</h1>
          <p className="text-gray-600 text-lg mt-2">
            Create, edit, and manage exams for your courses
          </p>
        </div>
        {user && user.role !== "user" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Exam
          </button>
        )}
      </div>

      {/* Exams List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {exam.total_questions || exam.totalQuestions} questions
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {exam.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  {exam.duration}
                  {exam.duration ? " minutes" : ""}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Target className="h-4 w-4 mr-1" />
                <span>Passing: {exam.passing_score || exam.passingScore}%</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <BookOpen className="h-4 w-4 mr-1" />
                <span>{getCourseTitle(exam.course_id || exam.courseId)}</span>
              </div>
            </div>

            {/* <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>Created: {exam.created_at || exam.createdAt}</span>
              <span>Updated: {exam.updated_at || exam.updatedAt}</span>
            </div> */}

            <div className="flex space-x-2">
              {(() => {
                const statusKnown = Object.prototype.hasOwnProperty.call(
                  passedExams,
                  exam.id
                );

                if (!statusKnown) {
                  return (
                    <button
                      disabled
                      className="flex-1 bg-gray-200 text-gray-600 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center cursor-wait"
                    >
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Checking status...
                    </button>
                  );
                }

                if (passedExams[exam.id]) {
                  return (
                    <button
                      onClick={() => handleViewCertificate(exam.id)}
                      className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <Award className="h-4 w-4 mr-1" />
                      View Certificate
                    </button>
                  );
                }

                return (
                  <button
                    onClick={() => onTakeExam && onTakeExam(exam.id)}
                    className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Take Exam
                  </button>
                );
              })()}
              {isExamOwner(exam) && (
                <button
                  onClick={() => handleEditExam(exam)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
              )}
              {isExamOwner(exam) && (
                <button
                  onClick={() => handleDeleteExam(exam.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {exams.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No exams created yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by creating your first exam
          </p>
          {/* <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Exam
          </button> */}
        </div>
      )}

      {/* Create/Edit Exam Modal */}
      {(showCreateModal || editingExam) && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingExam ? "Edit Exam" : "Create New Exam"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingExam(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      // Clear error when user starts typing
                      if (fieldErrors.title) {
                        setFieldErrors((prev) => ({ ...prev, title: "" }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.title ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter exam title"
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.title}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setFormData({ ...formData, duration: value });
                    }}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-", "."].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.duration
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="e.g., 30 minutes"
                  />
                  {fieldErrors.duration && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.duration}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    // Clear error when user starts typing
                    if (fieldErrors.description) {
                      setFieldErrors((prev) => ({ ...prev, description: "" }));
                    }
                  }}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.description
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter exam description"
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Course (Optional)
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData({ ...formData, courseId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a course (optional)</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passingScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        passingScore: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Questions ({formData.questions.length})
                  </h4>
                  <button
                    onClick={openAddQuestionModal}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Question
                  </button>
                </div>
                {fieldErrors.questions && (
                  <p className="mb-4 text-sm text-red-600">
                    {fieldErrors.questions}
                  </p>
                )}

                {/* Existing Questions */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {formData.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="bg-gray-50 border border-gray-200 p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-medium text-gray-900">
                          Question {index + 1}
                        </h6>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditQuestionModal(question)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeQuestion(question.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {question.question}
                      </p>
                      <div className="text-xs text-gray-500">
                        Options: {question.options.length} | Correct:{" "}
                        {
                          question.options[
                            (typeof question.correct_answer === "number"
                              ? question.correct_answer
                              : question.correctAnswer) || 0
                          ]
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingExam(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingExam ? handleUpdateExam : handleCreateExam}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingExam ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingExam ? "Update Exam" : "Create Exam"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {questionModalMode === "edit"
                  ? "Edit Question"
                  : "Add Question"}
              </h3>
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  setEditingQuestion(null);
                  setFieldErrors((prev) => {
                    const ne = { ...prev };
                    delete ne.question;
                    delete ne.options;
                    return ne;
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question *
                </label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) => {
                    setNewQuestion({
                      ...newQuestion,
                      question: e.target.value,
                    });
                    // Clear error when user starts typing
                    if (fieldErrors.question) {
                      setFieldErrors((prev) => ({ ...prev, question: "" }));
                    }
                  }}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.question ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your question"
                />
                {fieldErrors.question && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.question}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options *
                </label>
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={newQuestion.correctAnswer === index}
                      onChange={() =>
                        setNewQuestion({ ...newQuestion, correctAnswer: index })
                      }
                      className="mr-2"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOptions });
                        // Clear options error when user starts typing
                        if (fieldErrors.options) {
                          setFieldErrors((prev) => ({ ...prev, options: "" }));
                        }
                      }}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        fieldErrors.options
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
                {fieldErrors.options && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.options}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Explanation
                </label>
                <textarea
                  value={newQuestion.explanation}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      explanation: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain why this is the correct answer"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  onClick={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                    setFieldErrors((prev) => {
                      const ne = { ...prev };
                      delete ne.question;
                      delete ne.options;
                      return ne;
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {questionModalMode === "edit" ? (
                  <button
                    onClick={saveQuestionChanges}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    Save Changes
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      addQuestion();
                      setShowQuestionModal(false);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    Add Question
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && currentCertificate && (
        <CertificateModal
          selectedCertificate={currentCertificate}
          onClose={() => {
            setShowCertificateModal(false);
            setCurrentCertificate(null);
          }}
          displayName={
            currentCertificate?.userName ||
            user?.name ||
            user?.fullName ||
            "User"
          }
          certificateType="exam"
        />
      )}
    </div>
  );
};

export default ExamManagement;
