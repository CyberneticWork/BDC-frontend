import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Play,
  Award,
  Clock,
  FileText,
  Video,
  Download,
  BookOpen,
  Target,
} from "lucide-react";
import LMSService from "../../services/LMSService";

const CourseDetail = ({ courseId, onBack }) => {
  const [course, setCourse] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [relatedExams, setRelatedExams] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [courseData, examsResponse] = await Promise.all([
          LMSService.getCourseById(courseId),
          LMSService.getExams({ course_id: courseId }),
        ]);
        setCourse(courseData);
        if (
          courseData &&
          Array.isArray(courseData.modules) &&
          courseData.modules.length > 0
        ) {
          setCurrentModule(courseData.modules[0]);
        }
        // Load related exams
        setRelatedExams(examsResponse.data || []);
      } catch (e) {
        console.error("Failed to load course", e);
      }
    };
    load();
  }, [courseId]);

  const handleModuleComplete = async (moduleId) => {
    // completeModule was part of old dummy logic; now just mark locally if course loaded
    setCourse((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        modules: prev.modules.map((m) =>
          m.id === moduleId ? { ...m, completed: true } : m
        ),
      };
      return updated;
    });
    try {
      const updatedCourse = await LMSService.getCourseById(courseId); // refresh from API (if API supports completion later)
      if (updatedCourse) {
        setCourse(updatedCourse);
        const currentIndex = updatedCourse.modules.findIndex(
          (m) => m.id === moduleId
        );
        if (
          currentIndex > -1 &&
          currentIndex < updatedCourse.modules.length - 1
        ) {
          setCurrentModule(updatedCourse.modules[currentIndex + 1]);
        }
      }
    } catch (e) {
      // fallback to local progression only
    }
  };

  const handleModuleSelect = (module) => {
    setCurrentModule(module);
  };

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <motion.div
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-gray-600 text-lg">Loading course...</p>
      </div>
    );
  }

  const completedModules = (course.modules || []).filter(
    (m) => m.completed
  ).length;
  const progressPercentage =
    course.modules && course.modules.length > 0
      ? Math.round((completedModules / course.modules.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Courses
          </button>
          {course.completed && (
            <button
              onClick={() => setShowCertificate(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center"
            >
              <Award className="h-4 w-4 mr-2" />
              View Certificate
            </button>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {course.title}
        </h1>
        <p className="text-gray-600 mb-4">{course.description}</p>

        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Clock className="h-4 w-4 mr-1" />
          <span>{course.duration}</span>
          <span className="mx-2">•</span>
          <span>{course.modules.length} modules</span>
          <span className="mx-2">•</span>
          <span>{completedModules} completed</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {progressPercentage}% complete
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules List */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Course Modules
            </h3>
            <div className="space-y-3">
              {(course.modules || []).map((module, index) => (
                <div
                  key={module.id}
                  onClick={() => handleModuleSelect(module)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    currentModule?.id === module.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {module.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center">
                          <span className="text-xs text-gray-500">
                            {index + 1}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {module.title}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Module Content */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            {currentModule ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {currentModule.title}
                  </h3>
                  {currentModule.completed ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Completed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleModuleComplete(currentModule.id)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </button>
                  )}
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {currentModule.content}
                  </p>
                </div>

                {/* Module File */}
                {currentModule.path && (
                  <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-600" />
                      Module Resource
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {currentModule.path.includes(".pdf") ? (
                          <FileText className="h-8 w-8 text-red-500 mr-3" />
                        ) : (
                          <Video className="h-8 w-8 text-blue-500 mr-3" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {currentModule.path.includes(".pdf")
                              ? "PDF Document"
                              : "Video File"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Click to open in new tab
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          window.open(currentModule.path, "_blank")
                        }
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center text-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {currentModule.path.includes(".pdf")
                          ? "View PDF"
                          : "Watch Video"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Dummy content sections */}
                <div className="mt-8 space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Key Learning Points
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>Understanding the fundamental concepts</li>
                      <li>Practical application in real-world scenarios</li>
                      <li>Best practices and common pitfalls</li>
                      <li>Tools and resources for further learning</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Additional Resources
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Reference documentation and guides</li>
                      <li>• Video tutorials and demonstrations</li>
                      <li>• Practice exercises and quizzes</li>
                      <li>• Community forums and discussion groups</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Module
                </h3>
                <p className="text-gray-600">
                  Choose a module from the list to start learning
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Attachments */}
      {course.attachments && course.attachments.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Course Attachments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center mb-3">
                  {attachment.type === "pdf" ? (
                    <FileText className="h-8 w-8 text-red-500 mr-3" />
                  ) : (
                    <Video className="h-8 w-8 text-blue-500 mr-3" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {attachment.name}
                    </h4>
                    <p className="text-xs text-gray-500">{attachment.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Opens the file in a new tab for viewing
                    window.open(attachment.url, "_blank");
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {attachment.type === "pdf" ? "View PDF" : "Watch Video"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Exams */}
      {relatedExams.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Related Exams
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedExams.map((exam) => (
              <div
                key={exam.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center mb-3">
                  <Target className="h-8 w-8 text-blue-600 mr-3" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {exam.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {exam.totalQuestions} questions
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {exam.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Duration: {exam.duration}</span>
                  <span>Passing: {exam.passingScore}%</span>
                </div>
                <button
                  onClick={() => {
                    // In a real app, this would navigate to take exam
                    alert(`Take exam: ${exam.title}`);
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center text-sm"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Take Exam
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificate && course.certificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="text-center">
              <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Certificate of Completion
              </h3>
              <p className="text-gray-600 mb-6">
                Congratulations on completing this course!
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {course.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Certificate ID: {course.certificate.id}
                </p>
                <p className="text-sm text-gray-600">
                  Completed on: {course.certificate.completionDate}
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCertificate(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // In a real app, this would download/print the certificate
                    alert(
                      "Certificate download feature would be implemented here"
                    );
                    setShowCertificate(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
