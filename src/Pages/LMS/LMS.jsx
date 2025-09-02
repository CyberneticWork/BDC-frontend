import React, { useState } from "react";
import { BookOpen, Award, TrendingUp, ArrowLeft, Settings } from "lucide-react";
import LMSDashboard from "./LMSDashboard";
import CourseDetail from "./CourseDetail";
import Progress from "./Progress";
import ManageCourses from "./ManageCourses";

const LMS = () => {
  const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard', 'course', 'progress', 'manage'
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const handleViewCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setCurrentView("course");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedCourseId(null);
  };

  const handleViewProgress = () => {
    setCurrentView("progress");
  };

  const handleViewManageCourses = () => {
    setCurrentView("manage");
  };

  const renderView = () => {
    switch (currentView) {
      case "course":
        return (
          <CourseDetail
            courseId={selectedCourseId}
            onBack={handleBackToDashboard}
          />
        );
      case "progress":
        return <Progress />;
      case "manage":
        return <ManageCourses onViewCourse={handleViewCourse} />;
      default:
        return (
          <LMSDashboard
            onViewCourse={handleViewCourse}
            onViewProgress={handleViewProgress}
            onViewManageCourses={handleViewManageCourses}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header for LMS */}
      {currentView !== "dashboard" && (
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to LMS Dashboard
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-6">
              <button
                onClick={handleViewManageCourses}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  currentView === "manage"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Courses
              </button>
              <button
                onClick={handleViewProgress}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  currentView === "progress"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                My Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">{renderView()}</div>
    </div>
  );
};

export default LMS;
