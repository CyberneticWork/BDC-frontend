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
} from "lucide-react";
import LMSService from "../../services/LMSService";

const ExamManagement = ({ onTakeExam }) => {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
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

  useEffect(() => {
    loadExams();
    loadCourses();
  }, []);

  const loadExams = () => {
    setExams(LMSService.getMyExams());
  };

  const loadCourses = () => {
    setCourses(LMSService.getCourses());
  };

  const handleCreateExam = () => {
    if (formData.title && formData.description && formData.duration) {
      const examData = {
        ...formData,
        courseId: formData.courseId ? parseInt(formData.courseId) : null,
        totalQuestions: formData.questions.length,
      };
      LMSService.createExam(examData);
      loadExams();
      setShowCreateModal(false);
      resetForm();
    }
  };

  const handleUpdateExam = () => {
    if (
      editingExam &&
      formData.title &&
      formData.description &&
      formData.duration
    ) {
      const examData = {
        ...formData,
        courseId: formData.courseId ? parseInt(formData.courseId) : null,
        totalQuestions: formData.questions.length,
      };
      LMSService.updateExam(editingExam.id, examData);
      loadExams();
      setEditingExam(null);
      resetForm();
    }
  };

  const handleDeleteExam = (examId) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      LMSService.deleteExam(examId);
      loadExams();
    }
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      description: exam.description,
      courseId: exam.courseId || "",
      duration: exam.duration,
      passingScore: exam.passingScore,
      questions: [...exam.questions],
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
  };

  const addQuestion = () => {
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
    }
  };

  const removeQuestion = (questionId) => {
    setFormData({
      ...formData,
      modules: formData.questions.filter((q) => q.id !== questionId),
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-600 text-lg mt-2">
            Create, edit, and manage exams for your courses
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Exam
        </button>
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
                    {exam.totalQuestions} questions
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
                <span>{exam.duration}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Target className="h-4 w-4 mr-1" />
                <span>Passing: {exam.passingScore}%</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <BookOpen className="h-4 w-4 mr-1" />
                <span>{getCourseTitle(exam.courseId)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>Created: {exam.createdAt}</span>
              <span>Updated: {exam.updatedAt}</span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onTakeExam && onTakeExam(exam.id)}
                className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Take Exam
              </button>
              <button
                onClick={() => handleEditExam(exam)}
                className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteExam(exam.id)}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Exam
          </button>
        </div>
      )}

      {/* Create/Edit Exam Modal */}
      {(showCreateModal || editingExam) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter exam title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration *
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 30 minutes"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter exam description"
                />
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
                    onClick={() => setShowQuestionModal(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Question
                  </button>
                </div>

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
                        <button
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {question.question}
                      </p>
                      <div className="text-xs text-gray-500">
                        Options: {question.options.length} | Correct:{" "}
                        {question.options[question.correctAnswer]}
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
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingExam ? "Update Exam" : "Create Exam"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Question</h3>
              <button
                onClick={() => setShowQuestionModal(false)}
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
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your question"
                />
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
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
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
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    addQuestion();
                    setShowQuestionModal(false);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
