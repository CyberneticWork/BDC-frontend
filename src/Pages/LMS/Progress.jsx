import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Target,
  X,
  Download,
} from "lucide-react";
import LMSService from "../../services/LMSService";
import { useAuth } from "../../contexts/AuthContext";

const Progress = () => {
  const [userProgress, setUserProgress] = useState({});
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        const progressData = await LMSService.getUserProgress();

        setUserProgress(progressData);
        setEnrolledCourses(progressData.enrolledCourses || []);
        setCertificates(progressData.certificates || []);
      } catch (err) {
        console.error("Error fetching progress:", err);
        setError("Failed to load progress data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  const displayName = user?.name || user?.fullName || "Participant";

  // Handle showing certificate modal
  const handleShowCertificate = (certificate) => {
    setSelectedCertificate(certificate);
  };

  // Handle printing certificate in a new window
  const handlePrintCertificate = () => {
    const certEl = document.getElementById("progress-certificate");
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

  const overallProgress =
    userProgress.totalModules > 0
      ? Math.round(
          (userProgress.completedModules / userProgress.totalModules) * 100
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-between items-center mb-4">
          <div></div>
          <h1 className="flex-1 text-4xl font-bold text-gray-900">
            Learning Progress
          </h1>
          
        </div>
        <p className="text-gray-600 text-lg">
          Track your learning journey and achievements
        </p>
      </div>

      {/* Overall Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <p className="text-sm font-medium text-gray-600">Certificates</p>
              <p className="text-2xl font-bold text-gray-900">
                {userProgress.certificatesEarned}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Overall Progress
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {overallProgress}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Overall Learning Progress
        </h3>
        <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-white text-sm font-medium"
            style={{ width: `${overallProgress}%` }}
          >
            {overallProgress}%
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{userProgress.completedModules} modules completed</span>
          <span>{userProgress.totalModules} total modules</span>
        </div>
      </div>

      {/* Course Progress */}
      {enrolledCourses.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Course Progress
          </h3>
          <div className="space-y-6">
            {enrolledCourses.map((course) => {
              const courseProgress = course.progress_percentage || 0;
              return (
                <div
                  key={course.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {course.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {course.total_modules || 0} modules
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {courseProgress}%
                      </div>
                      <div className="text-sm text-gray-600">complete</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${courseProgress}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {course.completed_modules || 0} of{" "}
                      {course.total_modules || 0} modules completed
                    </span>
                    {course.completed && (
                      <div className="flex items-center text-green-600 text-sm font-medium">
                        <Award className="h-4 w-4 mr-1" />
                        Certificate Earned
                      </div>
                    )}
                  </div>

                  {/* Module Progress - Note: API might not include detailed module data */}
                  {course.modules && course.modules.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {course.modules.map((module) => (
                        <div
                          key={module.id}
                          className="flex items-center text-sm"
                        >
                          {module.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-gray-300 mr-2"></div>
                          )}
                          <span
                            className={
                              module.completed
                                ? "text-green-600"
                                : "text-gray-600"
                            }
                          >
                            {module.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Earned Certificates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-yellow-50 to-orange-50"
              >
                <div className="flex items-center mb-4">
                  <Award className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {certificate.course_title ||
                        `Certificate ${certificate.id}`}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Certificate ID: {certificate.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Issued on: {certificate.issued_date}</span>
                  </div>
                  {certificate.certificate_url && (
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      <span>Certificate Available</span>
                    </div>
                  )}
                </div>

                {certificate.issued_date ? (
                  <button
                    onClick={() => handleShowCertificate(certificate)}
                    className="mt-4 w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    View Certificate
                  </button>
                ) : (
                  <button
                    disabled
                    className="mt-4 w-full bg-gray-300 text-gray-500 font-medium py-2 px-4 rounded-lg cursor-not-allowed flex items-center justify-center"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Certificate Pending
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl w-full mx-4">
            <div className="relative">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="absolute right-0 top-0 text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>

              <div
                id="progress-certificate"
                className="cert-container ring-1 ring-blue-200 rounded-xl p-8 bg-white"
              >
                <div className="cert-inner">
                  <h1 className="text-4xl font-extrabold tracking-wide text-blue-700 mb-2">
                    Certificate
                  </h1>
                  <p className="uppercase tracking-widest text-sm text-gray-500 mb-6">
                    Of Course Completion
                  </p>
                  <p className="text-gray-600 text-sm">
                    This is to certify that
                  </p>
                  <div className="name text-3xl font-bold text-gray-800 my-4">
                    {displayName}
                  </div>
                  <p className="text-gray-600 mb-4">
                    has successfully completed the course
                  </p>
                  <h2 className="text-2xl font-semibold text-blue-700 mb-2">
                    {selectedCertificate.course_title}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-8">
                    <div className="p-3 rounded bg-blue-50">
                      <div className="text-xs uppercase text-gray-500 mb-1">
                        Date Issued
                      </div>
                      <div className="font-medium text-gray-800">
                        {selectedCertificate.issued_date}
                      </div>
                    </div>
                    <div className="p-3 rounded bg-blue-50">
                      <div className="text-xs uppercase text-gray-500 mb-1">
                        Course ID
                      </div>
                      <div className="font-medium text-gray-800">
                        {selectedCertificate.course_id}
                      </div>
                    </div>
                    <div className="p-3 rounded bg-blue-50">
                      <div className="text-xs uppercase text-gray-500 mb-1">
                        Certificate Code
                      </div>
                      <div className="font-medium text-gray-800">
                        CERT-
                        {String(selectedCertificate.course_id).padStart(4, "0")}
                        -{selectedCertificate.id}
                      </div>
                    </div>
                  </div>
                  <div className="signature mt-12 flex justify-between">
                    <div className="text-center">
                      <div className="w-48 h-12 mb-2 mx-auto bg-gradient-to-r from-blue-200 to-indigo-200 rounded" />
                      <div className="text-xs uppercase tracking-wider text-gray-600">
                        Course Instructor
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-48 h-12 mb-2 mx-auto bg-gradient-to-r from-green-200 to-emerald-200 rounded" />
                      <div className="text-xs uppercase tracking-wider text-gray-600">
                        Learning Coordinator
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handlePrintCertificate}
                  className="flex items-center px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Print / Download Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {enrolledCourses.length === 0 && (
        <div className="bg-white p-12 rounded-2xl shadow-xl border border-gray-200 text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Courses Enrolled
          </h3>
          <p className="text-gray-600">
            Start your learning journey by enrolling in a course from the LMS
            Dashboard.
          </p>
        </div>
      )}
    </div>
  );
};

export default Progress;
