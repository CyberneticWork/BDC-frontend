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
  X,
} from "lucide-react";
import LMSService from "../../services/LMSService";
import { useAuth } from "../../contexts/AuthContext";
import CertificateModal from "../../components/CertificateModal";
import Swal from "sweetalert2";

const CourseDetail = ({ courseId, onBack, onTakeExam }) => {
  const [course, setCourse] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showExamCertificate, setShowExamCertificate] = useState(false);
  const [examCertificateData, setExamCertificateData] = useState(null);
  const [relatedExams, setRelatedExams] = useState([]);
  const [courseProgress, setCourseProgress] = useState(null);
  const [passedExams, setPassedExams] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const [courseData, examsResponse, progress] = await Promise.all([
          LMSService.getCourseById(courseId),
          LMSService.getExams({ course_id: courseId }),
          LMSService.getUserProgress(),
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
        // Check which exams have been passed
        if (examsResponse.data && examsResponse.data.length > 0) {
          await checkPassedExams(examsResponse.data);
        }
        // Set course-specific progress from API if available
        const cp = progress.enrolledCourses?.find(
          (c) => c.id === parseInt(courseId)
        );
        if (cp) setCourseProgress(cp);
      } catch (e) {
        console.error("Failed to load course", e);
      }
    };
    load();
  }, [courseId]);

  const checkPassedExams = async (examsList) => {
    const passedStatus = {};
    for (const exam of examsList) {
      try {
        const hasPassed = await LMSService.hasUserPassedExam(exam.id);
        passedStatus[exam.id] = hasPassed;
      } catch (error) {
        console.error(`Failed to check exam status for ${exam.id}:`, error);
        passedStatus[exam.id] = false;
      }
    }
    setPassedExams(passedStatus);
  };
  const displayName = user?.name || user?.fullName || "Participant";
  const handleModuleComplete = async (moduleId) => {
    try {
      if (!courseProgress) {
        Swal.fire({
          icon: "info",
          title: "Enrollment Required",
          html: "You are currently not enrolled in this course, so progress cannot be recorded.<br/><br/>",
          confirmButtonColor: "#3B82F6",
        });
        return;
      }
      // Call the API to update module progress
      await LMSService.updateModuleProgress(courseId, moduleId, true);

      // Get updated progress data from API
      const progressData = await LMSService.getUserProgress();
      const updatedCourseData = progressData.enrolledCourses?.find(
        (c) => c.id === parseInt(courseId)
      );
      if (updatedCourseData) setCourseProgress(updatedCourseData);

      // Get fresh course data with updated modules
      const updatedCourse = await LMSService.getCourseById(courseId);

      // Update local state with properly merged data
      setCourse((prev) => {
        if (!updatedCourse) return prev;

        // Start with the course data from getCourseById (which has the module structure)
        let mergedCourse = { ...updatedCourse };

        // If we have progress data, use it to update completion status and module completion
        if (updatedCourseData) {
          mergedCourse.completed = updatedCourseData.completed || false;

          // Update module completion status if available from progress data
          if (
            updatedCourseData.modules &&
            updatedCourseData.modules.length > 0
          ) {
            mergedCourse.modules = updatedCourse.modules?.map((module) => {
              const progressModule = updatedCourseData.modules.find(
                (pm) => pm.id === module.id
              );
              return progressModule
                ? { ...module, completed: progressModule.completed }
                : module;
            });
          } else {
            // If no detailed module data from progress, at least mark the current module as completed
            mergedCourse.modules = updatedCourse.modules?.map((module) =>
              module.id === moduleId ? { ...module, completed: true } : module
            );
          }
        } else {
          // Fallback: just mark the current module as completed
          mergedCourse.modules = updatedCourse.modules?.map((module) =>
            module.id === moduleId ? { ...module, completed: true } : module
          );
        }

        return mergedCourse;
      });

      // Auto-advance to next module if available
      if (updatedCourse) {
        const currentIndex = updatedCourse.modules.findIndex(
          (m) => m.id === moduleId
        );
        if (
          currentIndex > -1 &&
          currentIndex < updatedCourse.modules.length - 1 &&
          !updatedCourse.modules[currentIndex + 1].completed
        ) {
          setCurrentModule(updatedCourse.modules[currentIndex + 1]);
        }
      }
    } catch (error) {
      console.error("Failed to mark module as complete:", error);

      const status = error?.response?.status;
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;

      let friendly = "Failed to update module progress.";
      if (status === 404) {
        friendly =
          "Your enrollment or the requested resource was not found. If you're viewing as an admin and are not enrolled, you cannot mark modules as complete.";
      } else if (status === 403) {
        friendly =
          "You do not have permission to update progress for this course.";
      } else if (status === 401) {
        friendly =
          "You are not authenticated or your session expired. Please sign in again.";
      } else if (serverMsg) {
        friendly = serverMsg;
      }

      const details = [
        status ? `Status: ${status}` : null,
        serverMsg && serverMsg !== friendly ? `Server: ${serverMsg}` : null,
      ]
        .filter(Boolean)
        .join("<br/>");

      Swal.fire({
        icon: "error",
        title: "Cannot Mark as Complete",
        html: `${friendly}${
          details
            ? `<br/><br/><small class="text-gray-500">${details}</small>`
            : ""
        }`,
        confirmButtonColor: "#EF4444",
      });
    }
  };

  const handleModuleSelect = (module) => {
    setCurrentModule(module);
  };

  // Handle printing certificate in a new window
  const handlePrintCertificate = () => {
    const certEl = document.getElementById("course-certificate");
    if (!certEl) return window.print();
    const win = window.open("", "PRINT", "height=800,width=1000");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html><head><title>Course Certificate</title><link rel="stylesheet" href="/app.css" />`
    );
    win.document.write(`<style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:40px; background:#f8fafc; }
      .cert-container { background:white; border:10px solid #1d4ed8; padding:40px; position:relative; }
      .cert-inner { border:4px solid #93c5fd; padding:40px; text-align:center; }
      h1 { font-size:42px; margin:0 0 10px; letter-spacing:2px; }
      h2 { font-size:26px; margin:10px 0 5px; }
      .name { font-size:32px; font-weight:600; margin:15px 0; }
      .meta { margin-top:30px; display:flex; justify-content:space-between; font-size:14px; }
      .signature { margin-top:50px; display:flex; justify-content:space-between; }
      .sig-line { border-top:1px solid #0f172a; width:220px; padding-top:6px; font-size:12px; text-transform:uppercase; letter-spacing:1px; }
    </style></head><body>`);
    win.document.write(certEl.outerHTML);
    win.document.write("</body></html>");
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  const handleViewExamCertificate = async (examId) => {
    try {
      // Get the exam data
      const exam = relatedExams.find((e) => e.id === examId);

      // Get certificate data from the service
      const certificate = await LMSService.getExamCertificate(examId);
      if (!certificate) {
        throw new Error("Certificate not available");
      }

      // Set certificate data and show modal
      setExamCertificateData({
        ...certificate,
        examTitle: certificate.examTitle || exam?.title,
        examDescription: certificate.examDescription || exam?.description,
        passingScore:
          certificate.passingScore || exam?.passing_score || exam?.passingScore,
        userName: user?.name || user?.fullName || "User",
      });
      setShowExamCertificate(true);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      Swal.fire({
        icon: "error",
        title: "Certificate Unavailable",
        text: "Unable to load the certificate. Please try again later.",
        confirmButtonColor: "#EF4444",
      });
    }
  };

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <motion.div
        s  className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-gray-600 text-lg">Loading course...</p>
      </div>
    );
  }

  const completedModules =
    courseProgress?.completed_modules ??
    (course.modules || []).filter((m) => m.completed).length;
  const totalModules =
    courseProgress?.total_modules ?? (course.modules?.length || 0);
  const progressPercentage =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const isCourseCompleted = !!(
    courseProgress?.completed || progressPercentage === 100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          {/* <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Courses
          </button> */}
          {isCourseCompleted && (
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
          <span>
            {course.duration}
            {course.duration ? " hours" : ""}
          </span>
          <span className="mx-2">•</span>
          <span>{totalModules} modules</span>
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
                  {isCourseCompleted ? (
                    <button
                      onClick={() => setShowCertificate(true)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      View Certificate
                    </button>
                  ) : currentModule.completed ? (
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
                      {exam.totalQuestions ??
                        exam.total_questions ??
                        (Array.isArray(exam.questions)
                          ? exam.questions.length
                          : "0")}{" "}
                      questions
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
                {(() => {
                  // Check if exam status is still loading
                  if (passedExams[exam.id] === undefined) {
                    return (
                      <button
                        disabled
                        className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded-lg font-medium flex items-center justify-center text-sm"
                      >
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                        Checking status...
                      </button>
                    );
                  }

                  // If exam is passed, show View Certificate button
                  if (passedExams[exam.id]) {
                    return (
                      <button
                        onClick={() => handleViewExamCertificate(exam.id)}
                        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center text-sm"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        View Certificate
                      </button>
                    );
                  }

                  // Otherwise, show Take Exam button
                  return (
                    <button
                      onClick={() => onTakeExam(exam.id)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center text-sm"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Take Exam
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate Modals */}
      <>
        {/* Certificate Modal */}
        {showCertificate && (
          <CertificateModal
            selectedCertificate={{
              course_title: course.title,
              issued_date: new Date().toISOString().split("T")[0],
              course_id: courseId,
              id: courseId,
              type: "course",
            }}
            onClose={() => setShowCertificate(false)}
            displayName={displayName}
            certificateType="course"
          />
        )}

        {/* Exam Certificate Modal */}
        {showExamCertificate && examCertificateData && (
          <CertificateModal
            selectedCertificate={examCertificateData}
            onClose={() => {
              setShowExamCertificate(false);
              setExamCertificateData(null);
            }}
            displayName={examCertificateData.userName}
            certificateType="exam"
          />
        )}
      </>
    </div>
  );
};

export default CourseDetail;
