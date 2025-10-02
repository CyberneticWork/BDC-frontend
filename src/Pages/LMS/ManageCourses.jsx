import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Clock,
  Users,
  Save,
  X,
  AlertCircle,
  Upload,
  FileText,
  Video,
  Paperclip,
  Play,
} from "lucide-react";
import LMSService from "../../services/LMSService";
import UserManagementService from "../../services/UserManagementService";
import { useAuth } from "../../contexts/AuthContext";
import Swal from "sweetalert2";

const ManageCourses = ({ onViewCourse }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    modules: [],
    attachments: [],
  });
  const [newModule, setNewModule] = useState({
    title: "",
    content: "",
    file: null,
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const attachmentsInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [creatorNames, setCreatorNames] = useState({}); // id -> name cache

  const isCourseOwner = (course) => {
    return !!(user && course && course.createdBy === user.id);
  };

  const validateForm = () => {
    const errors = {};

    // Validate course title
    if (!formData.title.trim()) {
      errors.title = "Course title is required";
    }

    // Validate description
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    // Validate duration
    if (!formData.duration.trim()) {
      errors.duration = "Duration is required";
    }

    // Validate modules
    if (formData.modules.length === 0) {
      errors.modules = "At least one module is required";
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

  useEffect(() => {
    loadCourses();
  }, []);

  // Ensure we have names for all course creators; cache results
  const ensureCreatorNames = async (coursesList) => {
    try {
      const uniqueIds = Array.from(
        new Set((coursesList || []).map((c) => c.createdBy).filter(Boolean))
      );
      const missingIds = uniqueIds.filter((id) => !(id in creatorNames));
      if (missingIds.length === 0) return;

      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const u = await UserManagementService.getUserById(id);
            const name = u?.name || u?.fullName || u?.username || `User ${id}`;
            return [id, name];
          } catch (e) {
            console.warn("Failed to load creator name for id", id, e);
            return [id, `User ${id}`];
          }
        })
      );

      setCreatorNames((prev) => {
        const next = { ...prev };
        results.forEach(([id, name]) => (next[id] = name));
        return next;
      });
    } catch (e) {
      console.warn("ensureCreatorNames failed", e);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      setEnrollingCourseId(courseId);
      await LMSService.enrollInCourse(courseId, user?.id);
      await loadCourses();
      Swal.fire({
        icon: "success",
        title: "Enrolled",
        text: "Successfully enrolled in the course!",
        confirmButtonColor: "#10B981",
      });
    } catch (error) {
      console.error("Enrollment failed:", error);
      Swal.fire({
        icon: "error",
        title: "Enrollment Failed",
        text: "Failed to enroll in the course. Please try again.",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      const res = await LMSService.fetchCourses();

      // Merge enrollment status from API
      let userEnrollments = [];
      try {
        const enrollmentsResponse = await LMSService.getEnrollments();
        userEnrollments = enrollmentsResponse.data || [];
      } catch (err) {
        console.warn("Could not fetch user enrollments:", err);
      }

      const coursesWithEnrollment = res.data.map((course) => ({
        ...course,
        enrolled: userEnrollments.some((en) => en.course_id === course.id),
      }));

      setCourses(coursesWithEnrollment);
      // Preload creator names for display
      ensureCreatorNames(coursesWithEnrollment);
      // Load detailed user progress (completed/total modules per course)
      try {
        const progressData = await LMSService.getUserProgress();
        setEnrolledCourses(
          progressData.enrolledCourses ||
            coursesWithEnrollment.filter((c) => c.enrolled)
        );
      } catch (progressError) {
        console.warn("Could not fetch user progress:", progressError);
        setEnrolledCourses(coursesWithEnrollment.filter((c) => c.enrolled));
      }
    } catch (e) {
      console.error("Failed to load courses", e);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFieldErrors({}); // Clear any previous field errors

      console.log("Starting course creation process...");
      const processedAttachments = await processFiles();
      console.log("Processed attachments:", processedAttachments);

      if (processedAttachments === null) {
        console.error("File processing failed");
        return; // Error occurred
      }

      const courseData = {
        ...formData,
        attachments: [...formData.attachments, ...processedAttachments],
      };

      console.log("Final course data being sent:", courseData);
      await LMSService.createCourse(courseData);
      console.log("Course created successfully");

      await loadCourses();
      setShowCreateModal(false);
      resetForm();

      // Success message
      Swal.fire({
        icon: "success",
        title: "Course Created Successfully!",
        text: "Your course has been created and is now available.",
        confirmButtonColor: "#10B981",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      setError("Failed to create course");
      console.error("Course creation error:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);

      // Error message
      Swal.fire({
        icon: "error",
        title: "Failed to Create Course",
        text:
          error.response?.data?.message ||
          "An error occurred while creating the course. Please try again.",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    if (!editingCourse) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFieldErrors({}); // Clear any previous field errors

      console.log("Starting course update process...");
      const processedAttachments = await processFiles();
      console.log("Processed attachments for update:", processedAttachments);

      if (processedAttachments === null) {
        console.error("File processing failed for update");
        return; // Error occurred
      }

      const courseData = {
        ...formData,
        attachments: [...formData.attachments, ...processedAttachments],
      };

      console.log("Final course update data:", courseData);
      await LMSService.updateCourse(editingCourse.id, courseData);
      console.log("Course updated successfully");

      await loadCourses();
      setEditingCourse(null);
      resetForm();

      // Success message
      Swal.fire({
        icon: "success",
        title: "Course Updated Successfully!",
        text: "Your course has been updated successfully.",
        confirmButtonColor: "#10B981",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      setError("Failed to update course");
      console.error("Course update error:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);

      // Error message
      Swal.fire({
        icon: "error",
        title: "Failed to Update Course",
        text:
          error.response?.data?.message ||
          "An error occurred while updating the course. Please try again.",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this! All associated data will be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await LMSService.deleteCourse(courseId);
        await loadCourses();

        Swal.fire({
          icon: "success",
          title: "Course Deleted!",
          text: "The course has been deleted successfully.",
          confirmButtonColor: "#10B981",
          timer: 2000,
          timerProgressBar: true,
        });
      } catch (error) {
        console.error("Delete failed", error);
        Swal.fire({
          icon: "error",
          title: "Failed to Delete Course",
          text: "An error occurred while deleting the course. Please try again.",
          confirmButtonColor: "#EF4444",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      duration: course.duration,
      modules: [...course.modules],
      attachments: course.attachments || [],
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      duration: "",
      modules: [],
      attachments: [],
    });
    setNewModule({ title: "", content: "", file: null });
    setSelectedFiles([]);
    setUploadError("");
    setError(null);
    setFieldErrors({});
  };

  const addModule = () => {
    if (newModule.title && newModule.content) {
      const module = {
        tempId: `temp-${Date.now()}`, // Unique for UI
        ...newModule,
        completed: false,
      };
      setFormData({
        ...formData,
        modules: [...formData.modules, module],
      });
      setNewModule({ title: "", content: "", file: null }); // <-- This resets the file field
      // Reset the file input element visually (if needed)
      const fileInput = document.getElementById("new-module-file-input");
      if (fileInput) fileInput.value = "";
    }
  };

  const removeModule = (moduleId) => {
    setFormData({
      ...formData,
      modules: formData.modules.filter((m) => (m.id || m.tempId) !== moduleId),
    });
  };

  // File handling functions
  const handleFileSelect = (event) => {
    console.log("File selection triggered");
    const files = Array.from(event.target.files);
    console.log(
      "Selected files:",
      files.map((f) => ({ name: f.name, type: f.type, size: f.size }))
    );

    const allowedTypes = [
      "application/pdf",
      "video/mp4",
      "video/avi",
      "video/quicktime",
      "video/x-ms-wmv",
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

    const validFiles = [];
    const errors = [];
    const existingKeys = new Set(
      (selectedFiles || []).map((f) => `${f.name}|${f.size}`)
    );

    files.forEach((file) => {
      console.log("Validating file:", file.name);
      const key = `${file.name}|${file.size}`;
      if (existingKeys.has(key)) {
        // Skip duplicates already selected
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        errors.push(
          `${file.name}: Invalid file type. Only PDF and video files are allowed.`
        );
      } else if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds 50MB limit.`);
      } else {
        console.log("File is valid:", file.name);
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      console.error("File validation errors:", errors);
      setUploadError(errors.join("\n"));
    } else {
      console.log("All files valid, setting selected files");
      setUploadError("");
      setSelectedFiles([...(selectedFiles || []), ...validFiles]);
    }

    // Reset the input so selecting the same file again will trigger onChange
    try {
      if (attachmentsInputRef.current) attachmentsInputRef.current.value = "";
      if (event && event.target) event.target.value = "";
    } catch {}
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const testApiConnection = async () => {
    try {
      console.log("Testing API connection from ManageCourses...");
      const result = await LMSService.testApiConnection();
      Swal.fire({
        icon: "success",
        title: "API Connection",
        text: `API connection successful: ${result.message}`,
        confirmButtonColor: "#10B981",
      });
    } catch (error) {
      console.error("API connection test failed:", error);
      Swal.fire({
        icon: "error",
        title: "API Connection Failed",
        text: "API connection failed. Check console for details.",
        confirmButtonColor: "#EF4444",
      });
    }
  };

  const processFiles = async () => {
    console.log("Processing files:", selectedFiles);
    const processedAttachments = [];

    for (const file of selectedFiles) {
      try {
        console.log(
          "Processing file:",
          file.name,
          "Type:",
          file.type,
          "Size:",
          file.size
        );
        // Create attachment object with file for upload
        const attachment = {
          id: Date.now() + Math.random(), // temp ID for UI
          name: file.name,
          type: file.type.includes("pdf") ? "pdf" : "video",
          size: LMSService.formatFileSize(file.size),
          file: file, // Include the actual File object for upload
        };
        console.log("Created attachment object:", attachment);
        processedAttachments.push(attachment);
      } catch (error) {
        console.error("Error processing file:", file.name, error);
        setUploadError(`Error processing file ${file.name}: ${error.message}`);
        return null;
      }
    }

    console.log("Processed attachments:", processedAttachments);
    return processedAttachments;
  };

  const updateModule = (moduleId, field, value) => {
    setFormData({
      ...formData,
      modules: formData.modules.map((m) =>
        (m.id || m.tempId) === moduleId ? { ...m, [field]: value } : m
      ),
    });
  };

  // Set or replace a file for a specific module
  const updateModuleFile = (moduleId, file) => {
    console.log(
      "updateModuleFile called with moduleId:",
      moduleId,
      "file:",
      file
    );
    setFormData({
      ...formData,
      modules: formData.modules.map((m) => {
        console.log("checking module:", m.id || m.tempId, "vs", moduleId);
        if ((m.id || m.tempId) === moduleId) {
          console.log("updating module file to:", file);
          return {
            ...m,
            file, // keep any existing data
            // Clear existing path if user chooses a new file
            path: file ? undefined : m.path,
          };
        }
        return m;
      }),
    });
  };

  const removeExistingAttachment = async (attachmentId) => {
    try {
      await LMSService.removeAttachment(attachmentId); // Add this method to LMSService.js
      setFormData({
        ...formData,
        attachments: formData.attachments.filter((a) => a.id !== attachmentId),
      });
    } catch (err) {
      setUploadError("Failed to remove attachment.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 text-lg mt-2">
            Create, edit, and manage your courses
          </p>
        </div>
        {user && user.role !== "user" && (
          <div className="flex space-x-4">
            {/* <button
              onClick={testApiConnection}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center"
            >
              Test API
            </button> */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Course
            </button>
          </div>
        )}
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesLoading && (
          <div className="col-span-full flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading courses...</p>
            </div>
          </div>
        )}
        {!coursesLoading &&
          courses.map((course) => (
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
                <span>
                  {course.duration}
                  {course.duration ? " hours" : ""}
                </span>
                <span className="mx-2">•</span>
                <span>{course.modules.length} modules</span>
              </div>

              <div className="text-xs text-gray-400 mb-4">
                Created by:{" "}
                {creatorNames[course.createdBy] ??
                  `User ${course.createdBy ?? "Unknown"}`}
              </div>

              <div className="flex space-x-2">
                {user && user.role === "user" ? (
                  // For regular users, show enroll/continue functionality
                  course.enrolled ? (
                    <div className="w-full space-y-2">
                      <div className="text-sm text-green-600 font-medium">
                        Enrolled
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: (() => {
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
                                return course.modules &&
                                  course.modules.length > 0
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
                          const enrolledCourse = enrolledCourses.find(
                            (ec) => ec.id === course.id
                          );
                          if (
                            enrolledCourse &&
                            enrolledCourse.completed_modules !== undefined
                          ) {
                            return `${enrolledCourse.completed_modules} of ${enrolledCourse.total_modules} modules completed`;
                          } else {
                            const completed =
                              course.modules?.filter((m) => m.completed)
                                .length || 0;
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
                  )
                ) : (
                  // For admin/HR users, show management buttons
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewCourse(course.id)}
                      className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() =>
                        isCourseOwner(course) && handleEditCourse(course)
                      }
                      disabled={!isCourseOwner(course)}
                      className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        isCourseOwner(course) && handleDeleteCourse(course.id)
                      }
                      disabled={!isCourseOwner(course)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No courses created yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by creating your first course
          </p>
          {user && user.role !== "user" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Course
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Course Modal */}
      {(showCreateModal || editingCourse) && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingCourse ? "Edit Course" : "Create New Course"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCourse(null);
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
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.title ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter course title"
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
                    placeholder="e.g., 2 (hours)"
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.description
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter course description"
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              {/* Modules Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Modules
                </h4>

                {/* Add Module Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h5 className="font-medium text-gray-900 mb-3">
                    Add New Module
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={newModule.title}
                      onChange={(e) =>
                        setNewModule({ ...newModule, title: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Module title"
                    />
                    <textarea
                      value={newModule.content}
                      onChange={(e) =>
                        setNewModule({ ...newModule, content: e.target.value })
                      }
                      rows={2}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Module content"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Module File (PDF/Video - Optional)
                    </label>
                    <input
                      id="new-module-file-input" // <-- Add this id
                      type="file"
                      accept=".pdf,.mp4,.avi,.mov,.wmv"
                      onChange={(e) =>
                        setNewModule({
                          ...newModule,
                          file: e.target.files[0] || null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {newModule.file && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {newModule.file.name} (
                        {(newModule.file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  <button
                    onClick={addModule}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Add Module
                  </button>
                </div>

                {/* Existing Modules */}
                <div className="space-y-3">
                  {formData.modules.map((module, index) => (
                    <div
                      key={module.id || module.tempId}
                      className="bg-white border border-gray-200 p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-medium text-gray-900">
                          Module {index + 1}: {module.title}
                        </h6>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              removeModule(module.id || module.tempId)
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={module.content}
                        onChange={(e) =>
                          updateModule(
                            module.id || module.tempId,
                            "content",
                            e.target.value
                          )
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Module content"
                      />
                      {/* Module File Upload / Existing File Display */}
                      <div className="mt-3 space-y-2">
                        {module.file && (
                          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <div className="flex items-center">
                              {module.file.type?.includes("pdf") ? (
                                <FileText className="h-5 w-5 text-red-500 mr-2" />
                              ) : (
                                <Video className="h-5 w-5 text-blue-500 mr-2" />
                              )}
                              <span className="text-sm text-gray-700">
                                {module.file.name} (
                                {(module.file.size / 1024 / 1024).toFixed(2)}{" "}
                                MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                updateModuleFile(
                                  module.id || module.tempId,
                                  null
                                )
                              }
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {/* module-level duration removed — modules should not have duration */}
                      </div>
                      {module.path && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {module.path.includes(".pdf") ? (
                                <FileText className="h-5 w-5 text-red-500 mr-2" />
                              ) : (
                                <Video className="h-5 w-5 text-blue-500 mr-2" />
                              )}
                              <span className="text-sm text-gray-700">
                                Existing file:{" "}
                                {module.path
                                  ? decodeURIComponent(
                                      module.path.split("/").pop()
                                    )
                                  : "Attached file"}
                              </span>
                            </div>
                            <button
                              onClick={() => window.open(module.path, "_blank")}
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              View File
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {fieldErrors.modules && (
                  <p className="mt-2 text-sm text-red-600">
                    {fieldErrors.modules}
                  </p>
                )}
              </div>

              {/* Attachments Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Attachments (Optional)
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Upload PDF documents or video files to enhance your course
                  content.
                </p>

                {/* File Upload */}
                <div className="mb-4">
                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-1">
                        Click to upload files
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, MP4, AVI, MOV, WMV (max 50MB each)
                      </p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.mp4,.avi,.mov,.wmv"
                        onChange={handleFileSelect}
                        ref={attachmentsInputRef}
                        className="hidden"
                      />
                    </div>
                  </label>
                </div>

                {/* Upload Error */}
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <div className="text-red-700 text-sm whitespace-pre-line">
                        {uploadError}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-900 mb-3">
                      Files to Upload:
                    </h5>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3"
                        >
                          <div className="flex items-center">
                            {file.type === "application/pdf" ? (
                              <FileText className="h-5 w-5 text-red-500 mr-3" />
                            ) : (
                              <Video className="h-5 w-5 text-blue-500 mr-3" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeSelectedFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Attachments */}
                {formData.attachments && formData.attachments.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">
                      Existing Attachments:
                    </h5>
                    <div className="space-y-2">
                      {formData.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
                        >
                          <div className="flex items-center">
                            {attachment.type === "pdf" ? (
                              <FileText className="h-5 w-5 text-red-500 mr-3" />
                            ) : (
                              <Video className="h-5 w-5 text-blue-500 mr-3" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attachment.size}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              removeExistingAttachment(attachment.id)
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCourse(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    editingCourse ? handleUpdateCourse : handleCreateCourse
                  }
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingCourse ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingCourse ? "Update Course" : "Create Course"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
