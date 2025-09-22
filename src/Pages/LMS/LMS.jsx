import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Award,
  TrendingUp,
  ArrowLeft,
  Settings,
  FileText,
} from "lucide-react";
import LMSDashboard from "./LMSDashboard";
import CourseDetail from "./CourseDetail";
import Progress from "./Progress";
import ManageCourses from "./ManageCourses";
import ExamManagement from "./ExamManagement";
import TakeExam from "./TakeExam";

const LMS = ({ initialView }) => {
  const [currentView, setCurrentView] = useState(initialView || "dashboard"); // 'dashboard', 'course', 'progress', 'manage', 'exams', 'takeExam'
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);

  // Update currentView when initialView prop changes
  useEffect(() => {
    if (initialView) {
      setCurrentView(initialView);
    }
  }, [initialView]);

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

  const handleViewExams = () => {
    setCurrentView("exams");
    setSelectedExamId(null);
  };

  const handleTakeExam = (examId) => {
    setSelectedExamId(examId);
    setCurrentView("takeExam");
  };

  const handleManageExams = () => {
    setCurrentView("exams");
    setSelectedExamId(null);
  };

  const renderView = () => {
    switch (currentView) {
      case "course":
        return (
          <CourseDetail
            courseId={selectedCourseId}
            onBack={handleBackToDashboard}
            onTakeExam={handleTakeExam}
          />
        );
      case "progress":
        return <Progress />;
      case "manage":
        return <ManageCourses onViewCourse={handleViewCourse} />;
      case "exams":
        return <ExamManagement onTakeExam={handleTakeExam} />;
      case "takeExam":
        return <TakeExam examId={selectedExamId} onBack={handleViewExams} />;
      default:
        return (
          <LMSDashboard
            onViewCourse={handleViewCourse}
            onViewProgress={handleViewProgress}
            onViewManageCourses={handleViewManageCourses}
            onTakeExam={handleTakeExam}
            onManageExams={handleManageExams}
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
                Courses
              </button>
              <button
                onClick={handleViewExams}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  currentView === "exams" || currentView === "takeExam"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exams
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
