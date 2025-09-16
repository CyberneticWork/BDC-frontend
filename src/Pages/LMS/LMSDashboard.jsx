import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Play,
  Settings,
  FileText,
  Target,
  X,
  Printer,
  ArrowLeft,
} from "lucide-react";
import LMSService from "../../services/LMSService";
import { useAuth } from "../../contexts/AuthContext";

const LMSDashboard = ({
  onViewCourse,
  onViewProgress,
  onViewManageCourses,
  onTakeExam,
  onManageExams,
}) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);

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

  const refreshDashboardData = async () => {
    try {
      setLoading(true);

      // Refresh courses
      const coursesResponse = await LMSService.fetchCourses();
      let userEnrollments = [];
      try {
        const enrollmentsResponse = await LMSService.getEnrollments();
        userEnrollments = enrollmentsResponse.data || [];
      } catch (error) {
        console.warn("Could not fetch user enrollments:", error);
      }

      const coursesWithEnrollment = coursesResponse.data.map((course) => ({
        ...course,
        enrolled: userEnrollments.some(
          (enrollment) => enrollment.course_id === course.id
        ),
      }));

      setCourses(coursesWithEnrollment);

      // Refresh user progress
      try {
        const progressData = await LMSService.getUserProgress();
        setUserProgress(progressData);
        setEnrolledCourses(
          progressData.enrolledCourses ||
            coursesWithEnrollment.filter((c) => c.enrolled)
        );
      } catch (progressError) {
        console.warn("Could not refresh user progress:", progressError);
        setEnrolledCourses(coursesWithEnrollment.filter((c) => c.enrolled));
        setUserProgress(LMSService.getUserProgress());
      }

      // Refresh exams
      const examsResponse = await LMSService.getExams();
      const examsList = examsResponse.data || [];
      setExams(examsList);

      // Check which exams the user has passed
      await checkPassedExams(examsList);
    } catch (error) {
      console.error("Failed to refresh dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [coursesResponse, examsResponse] = await Promise.all([
          LMSService.fetchCourses(),
          LMSService.getExams(),
        ]);

        // Get user's enrollments to mark enrolled courses
        let userEnrollments = [];
        try {
          const enrollmentsResponse = await LMSService.getEnrollments();
          userEnrollments = enrollmentsResponse.data || [];
        } catch (error) {
          console.warn("Could not fetch user enrollments:", error);
        }

        // Mark enrolled courses
        const coursesWithEnrollment = coursesResponse.data.map((course) => ({
          ...course,
          enrolled: userEnrollments.some(
            (enrollment) => enrollment.course_id === course.id
          ),
        }));

        setCourses(coursesWithEnrollment);
        const examsList = examsResponse.data || [];
        setExams(examsList);

        // Check which exams the user has passed
        await checkPassedExams(examsList);

        // Get updated user progress from API
        try {
          const progressData = await LMSService.getUserProgress();
          setUserProgress(progressData);
          setEnrolledCourses(
            progressData.enrolledCourses ||
              coursesWithEnrollment.filter((c) => c.enrolled)
          );
        } catch (progressError) {
          console.warn("Could not fetch user progress:", progressError);
          // Fallback to local calculation
          setEnrolledCourses(coursesWithEnrollment.filter((c) => c.enrolled));
          setUserProgress(LMSService.getUserProgress());
        }
      } catch (e) {
        console.error("Failed to load dashboard data", e);
        // Fallback to cached data
        setCourses(LMSService.getCourses());
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    init();

    // Refresh data when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Dashboard became visible, refreshing data...");
        refreshDashboardData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Handle viewing certificate for a passed exam
  const handleViewCertificate = async (examId) => {
    try {
      // Get the exam data
      const exam = exams.find((e) => e.id === examId);
      if (!exam) {
        throw new Error("Exam not found");
      }

      // Get certificate data from the service
      const certificate = await LMSService.getExamCertificate(examId);
      if (!certificate) {
        throw new Error("Certificate not available");
      }

      // Set certificate data and show modal
      setCurrentCertificate({
        ...certificate,
        examTitle: exam.title,
        examDescription: exam.description,
        passingScore: exam.passing_score || exam.passingScore,
        userName: user?.name || user?.fullName || "User",
      });
      setShowCertificateModal(true);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      alert("Failed to retrieve your certificate. Please try again later.");
    }
  };

  // Handle printing certificate
  const handlePrintCertificate = () => {
    const certEl = document.getElementById("exam-certificate");
    if (!certEl) return;

    const win = window.open("", "PRINT", "height=800,width=1000");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Exam Certificate</title>
        <link rel="stylesheet" href="/app.css" />
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:40px; background:#f8fafc; }
          .cert-container { background:white; border:10px solid #1d4ed8; padding:40px; position:relative; }
          .cert-inner { border:4px solid #93c5fd; padding:40px; text-align:center; }
          h1 { font-size:42px; margin:0 0 10px; letter-spacing:2px; }
          h2 { font-size:26px; margin:10px 0 5px; }
          .name { font-size:32px; font-weight:600; margin:15px 0; }
          .meta { margin-top:30px; display:flex; justify-content:space-between; font-size:14px; }
          .signature { margin-top:50px; display:flex; justify-content:space-between; }
          .sig-line { border-top:1px solid #0f172a; width:220px; padding-top:6px; font-size:12px; text-transform:uppercase; letter-spacing:1px; }
        </style>
      </head>
      <body>
    `);
    win.document.write(certEl.outerHTML);
    win.document.write("</body></html>");
    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  const handleEnroll = async (courseId) => {
    try {
      setEnrollingCourseId(courseId);
      console.log("Attempting to enroll in course:", courseId);
      console.log("Current user:", user);
      console.log("User ID:", user?.id);

      // For now, let's try with a simple test - send user_id in the request body
      const response = await LMSService.enrollInCourse(courseId, user?.id);
      console.log("Enrollment API response:", response);

      // Update the course as enrolled in the local state
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === courseId ? { ...course, enrolled: true } : course
        )
      );

      // Update enrolled courses list
      setEnrolledCourses((prevEnrolled) => [
        ...prevEnrolled,
        courses.find((c) => c.id === courseId),
      ]);

      // Refresh all dashboard data after enrollment
      await refreshDashboardData();

      // Show success message (you might want to add a toast notification here)
      alert("Successfully enrolled in the course!");
    } catch (error) {
      console.error("Enrollment failed:", error);
      console.error("Error details:", error.response?.data || error.message);
      alert("Failed to enroll in the course. Please try again.");
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const progressPercentage =
    (userProgress.totalModules || 0) > 0
      ? Math.round(
          ((userProgress.completedModules || 0) /
            (userProgress.totalModules || 1)) *
            100
        )
      : 0;

  // Track which exams the user has passed
  const [passedExams, setPassedExams] = useState({});
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [currentCertificate, setCurrentCertificate] = useState(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Learning Management System
          </h1>
          <p className="text-gray-600 text-lg">
            Enhance your skills with our comprehensive training courses
          </p>
        </div>
        <div className="flex space-x-4">
          {user && user.role !== "user" && (
            <button
              onClick={onManageExams}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center"
            >
              <FileText className="h-5 w-5 mr-2" />
              Manage Exams
            </button>
          )}
          {user && user.role !== "user" && (
            <button
              onClick={onViewManageCourses}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center"
            >
              <Settings className="h-5 w-5 mr-2" />
              Manage Courses
            </button>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Enrolled Courses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {userProgress.totalCourses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Completed Courses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {userProgress.completedCourses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Certificates Earned
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {userProgress.certificatesEarned}
              </p>
            </div>
          </div>
        </div>

        <div
          className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 cursor-pointer hover:shadow-2xl transition-all duration-300"
          onClick={onViewProgress}
        >
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Overall Progress
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {progressPercentage}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {userProgress.totalModules > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Learning Progress
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {userProgress.completedModules} of {userProgress.totalModules}{" "}
            modules completed
          </p>
        </div>
      )}

      {/* Available Courses */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Available Courses
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                <h4 className="text-lg font-semibold text-gray-900">
                  {course.title}
                </h4>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {course.description}
              </p>

              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Clock className="h-4 w-4 mr-1" />
                <span>{course.duration}</span>
                <span className="mx-2">•</span>
                <span>{course.modules.length} modules</span>
              </div>

              <div className="text-xs text-gray-400 mb-4">
                Created by:{" "}
                {LMSService.getCourseCreator(course.id)?.name || "Unknown"}
              </div>

              {course.enrolled ? (
                <div className="space-y-2">
                  <div className="text-sm text-green-600 font-medium">
                    Enrolled
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: (() => {
                          // Use enrolled course data if available, otherwise calculate from course modules
                          const enrolledCourse = enrolledCourses.find(
                            (ec) => ec.id === course.id
                          );
                          if (
                            enrolledCourse &&
                            enrolledCourse.completed_modules !== undefined
                          ) {
                            return enrolledCourse.total_modules > 0
                              ? `${
                                  (enrolledCourse.completed_modules /
                                    enrolledCourse.total_modules) *
                                  100
                                }%`
                              : "0%";
                          } else {
                            // Fallback to course modules calculation
                            return course.modules && course.modules.length > 0
                              ? `${
                                  (course.modules.filter((m) => m.completed)
                                    .length /
                                    course.modules.length) *
                                  100
                                }%`
                              : "0%";
                          }
                        })(),
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {(() => {
                      // Use enrolled course data if available
                      const enrolledCourse = enrolledCourses.find(
                        (ec) => ec.id === course.id
                      );
                      if (
                        enrolledCourse &&
                        enrolledCourse.completed_modules !== undefined
                      ) {
                        return `${enrolledCourse.completed_modules} of ${enrolledCourse.total_modules} modules completed`;
                      } else {
                        // Fallback to course modules calculation
                        const completed =
                          course.modules?.filter((m) => m.completed).length ||
                          0;
                        const total = course.modules?.length || 0;
                        return `${completed} of ${total} modules completed`;
                      }
                    })()}
                  </p>
                  <button
                    onClick={() => onViewCourse(course.id)}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center mt-2"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Continue Course
                  </button>
                  {(() => {
                    // Check completion status from enrolled course data
                    const enrolledCourse = enrolledCourses.find(
                      (ec) => ec.id === course.id
                    );
                    const isCompleted =
                      enrolledCourse?.completed || course.completed;
                    return isCompleted ? (
                      <div className="flex items-center text-green-600 text-sm font-medium justify-center">
                        <Award className="h-4 w-4 mr-1" />
                        Certificate Earned
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                <button
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrollingCourseId === course.id}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  {enrollingCourseId === course.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Enroll Now
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Available Exams */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Available Exams
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <Target className="h-8 w-8 text-green-600 mr-3" />
                <h4 className="text-lg font-semibold text-gray-900">
                  {exam.title}
                </h4>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {exam.description}
              </p>

              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Clock className="h-4 w-4 mr-1" />
                <span>{exam.duration}</span>
                <span className="mx-2">•</span>
                <span>{exam.totalQuestions} questions</span>
              </div>

              <div className="text-xs text-gray-400 mb-4">
                Passing Score: {exam.passingScore}%
                {exam.courseId && (
                  <span className="ml-2">
                    • Related to:{" "}
                    {courses.find((c) => c.id === exam.courseId)?.title ||
                      "Unknown Course"}
                  </span>
                )}
              </div>

              {passedExams[exam.id] ? (
                <button
                  onClick={() => handleViewCertificate(exam.id)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  <Award className="h-4 w-4 mr-2" />
                  View Certificate
                </button>
              ) : (
                <button
                  onClick={() => onTakeExam(exam.id)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Take Exam
                </button>
              )}
            </div>
          ))}
        </div>

        {exams.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No exams available yet</p>
            {user && user.role !== "user" && (
              <button
                onClick={onManageExams}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Manage Exams
              </button>
            )}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {showCertificateModal && currentCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-3xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Award className="h-6 w-6 text-yellow-500 mr-2" />
                Certificate of Achievement
              </h3>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              id="exam-certificate"
              className="cert-container ring-1 ring-blue-200 rounded-xl p-8 bg-white"
            >
              <div className="cert-inner">
                <h1 className="text-4xl font-extrabold tracking-wide text-blue-700 mb-2">
                  Certificate
                </h1>
                <p className="uppercase tracking-widest text-sm text-gray-500 mb-6">
                  Of Achievement
                </p>
                <p className="text-gray-600 text-sm">This is to certify that</p>
                <div className="name text-3xl font-bold text-gray-800 my-4">
                  {currentCertificate.userName}
                </div>
                <p className="text-gray-600 mb-4">
                  has successfully passed the examination
                </p>
                <h2 className="text-2xl font-semibold text-blue-700 mb-2">
                  {currentCertificate.examTitle}
                </h2>
                <p className="text-gray-600 mb-6">
                  with a score of{" "}
                  <span className="font-semibold text-green-600">
                    {currentCertificate.score}%
                  </span>{" "}
                  (Required: {currentCertificate.passingScore}%)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-8">
                  <div className="p-3 rounded bg-blue-50">
                    <div className="text-xs uppercase text-gray-500 mb-1">
                      Date Issued
                    </div>
                    <div className="font-medium text-gray-800">
                      {new Date(
                        currentCertificate.issueDate
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="p-3 rounded bg-blue-50">
                    <div className="text-xs uppercase text-gray-500 mb-1">
                      Exam ID
                    </div>
                    <div className="font-medium text-gray-800">
                      {currentCertificate.examId}
                    </div>
                  </div>
                  <div className="p-3 rounded bg-blue-50">
                    <div className="text-xs uppercase text-gray-500 mb-1">
                      Certificate Code
                    </div>
                    <div className="font-medium text-gray-800">
                      {currentCertificate.certificateId}
                    </div>
                  </div>
                </div>
                <div className="signature mt-12 flex justify-between">
                  <div className="text-center">
                    <div className="w-48 h-12 mb-2 mx-auto bg-gradient-to-r from-blue-200 to-indigo-200 rounded" />
                    <div className="text-xs uppercase tracking-wider text-gray-600">
                      Authorized Signature
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-48 h-12 mb-2 mx-auto bg-gradient-to-r from-green-200 to-emerald-200 rounded" />
                    <div className="text-xs uppercase tracking-wider text-gray-600">
                      Exam Coordinator
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handlePrintCertificate}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print / Download Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LMSDashboard;
