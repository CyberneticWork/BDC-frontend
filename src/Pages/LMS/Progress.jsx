import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Target,
} from "lucide-react";
import LMSService from "../../services/LMSService";

const Progress = () => {
  const [userProgress, setUserProgress] = useState({});
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    setUserProgress(LMSService.getUserProgress());
    setEnrolledCourses(LMSService.getEnrolledCourses());
    setCertificates(LMSService.getCertificates());
  }, []);

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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Learning Progress
        </h1>
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
              const courseProgress =
                (course.modules.filter((m) => m.completed).length /
                  course.modules.length) *
                100;
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
                        {course.modules.length} modules
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {Math.round(courseProgress)}%
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
                      {course.modules.filter((m) => m.completed).length} of{" "}
                      {course.modules.length} modules completed
                    </span>
                    {course.completed && (
                      <div className="flex items-center text-green-600 text-sm font-medium">
                        <Award className="h-4 w-4 mr-1" />
                        Certificate Earned
                      </div>
                    )}
                  </div>

                  {/* Module Progress */}
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
                      {certificate.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Certificate ID: {certificate.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Completed on: {certificate.completionDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    <span>Issued on: {certificate.issuedDate}</span>
                  </div>
                </div>

                <button className="mt-4 w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200">
                  Download Certificate
                </button>
              </div>
            ))}
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
