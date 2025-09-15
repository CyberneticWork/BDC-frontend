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
          console.warn('Could not fetch user enrollments:', error);
        }

        // Mark enrolled courses
        const coursesWithEnrollment = coursesResponse.data.map(course => ({
          ...course,
          enrolled: userEnrollments.some(enrollment => enrollment.course_id === course.id)
        }));

        setCourses(coursesWithEnrollment);
        setExams(examsResponse.data || []);
        setEnrolledCourses(coursesWithEnrollment.filter(c => c.enrolled));
        setUserProgress(LMSService.getUserProgress());
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
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      setEnrollingCourseId(courseId);
      console.log('Attempting to enroll in course:', courseId);
      console.log('Current user:', user);
      console.log('User ID:', user?.id);

      // For now, let's try with a simple test - send user_id in the request body
      const response = await LMSService.enrollInCourse(courseId, user?.id);
      console.log('Enrollment API response:', response);

      // Update the course as enrolled in the local state
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.id === courseId
            ? { ...course, enrolled: true }
            : course
        )
      );

      // Update enrolled courses list
      setEnrolledCourses(prevEnrolled => [
        ...prevEnrolled,
        courses.find(c => c.id === courseId)
      ]);

      // Update user progress
      setUserProgress(LMSService.getUserProgress());

      // Show success message (you might want to add a toast notification here)
      alert('Successfully enrolled in the course!');
    } catch (error) {
      console.error('Enrollment failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to enroll in the course. Please try again.');
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
                        width: `${
                          (course.modules.filter((m) => m.completed).length /
                            course.modules.length) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {course.modules.filter((m) => m.completed).length} of{" "}
                    {course.modules.length} modules completed
                  </p>
                  <button
                    onClick={() => onViewCourse(course.id)}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center mt-2"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Continue Course
                  </button>
                  {course.completed && (
                    <div className="flex items-center text-green-600 text-sm font-medium justify-center">
                      <Award className="h-4 w-4 mr-1" />
                      Certificate Earned
                    </div>
                  )}
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

              <button
                onClick={() => onTakeExam(exam.id)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                <Target className="h-4 w-4 mr-2" />
                Take Exam
              </button>
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
    </div>
  );
};

export default LMSDashboard;
