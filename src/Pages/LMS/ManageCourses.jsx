import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import LMSService from "../../services/LMSService";

const ManageCourses = ({ onViewCourse }) => {
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

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await LMSService.fetchCourses();
      // API returns pagination with created_at fields; UI expects createdAt, updatedAt already mapped in service
      setCourses(res.data);
    } catch (e) {
      console.error("Failed to load courses", e);
    }
  };

  const handleCreateCourse = async () => {
    if (formData.title && formData.description && formData.duration) {
      try {
        const processedAttachments = await processFiles();
        if (processedAttachments === null) return; // Error occurred

        const courseData = {
          ...formData,
          attachments: [...formData.attachments, ...processedAttachments],
        };

        await LMSService.createCourse(courseData);
        await loadCourses();
        setShowCreateModal(false);
        resetForm();
      } catch (error) {
        setUploadError("Failed to upload files. Please try again.");
      }
    }
  };

  const handleUpdateCourse = async () => {
    if (
      editingCourse &&
      formData.title &&
      formData.description &&
      formData.duration
    ) {
      try {
        const processedAttachments = await processFiles();
        if (processedAttachments === null) return; // Error occurred

        const courseData = {
          ...formData,
          attachments: [...formData.attachments, ...processedAttachments],
        };

        await LMSService.updateCourse(editingCourse.id, courseData);
        await loadCourses();
        setEditingCourse(null);
        resetForm();
      } catch (error) {
        setUploadError("Failed to upload files. Please try again.");
      }
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await LMSService.deleteCourse(courseId);
        await loadCourses();
      } catch (e) {
        console.error("Delete failed", e);
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
      setNewModule({ title: "", content: "", file: null });
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
    const files = Array.from(event.target.files);
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

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(
          `${file.name}: Invalid file type. Only PDF and video files are allowed.`
        );
      } else if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds 50MB limit.`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setUploadError(errors.join("\n"));
    } else {
      setUploadError("");
      setSelectedFiles([...selectedFiles, ...validFiles]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (attachmentId) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((a) => a.id !== attachmentId),
    });
  };

  const processFiles = async () => {
    const processedAttachments = [];
    for (const file of selectedFiles) {
      try {
        // Create attachment object with file for upload
        const attachment = {
          id: Date.now() + Math.random(), // temp ID for UI
          name: file.name,
          type: file.type.includes("pdf") ? "pdf" : "video",
          size: LMSService.formatFileSize(file.size),
          file: file, // Include the actual File object for upload
        };
        processedAttachments.push(attachment);
      } catch (error) {
        setUploadError(error.message);
        return null;
      }
    }
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
    setFormData({
      ...formData,
      modules: formData.modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              file, // keep any existing data
              // Clear existing path if user chooses a new file
              path: file ? undefined : m.path,
            }
          : m
      ),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Manage Courses</h1>
          <p className="text-gray-600 text-lg mt-2">
            Create, edit, and manage your courses
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Course
        </button>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {course.modules.length} modules
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {course.description}
            </p>

            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Clock className="h-4 w-4 mr-1" />
              <span>{course.duration}</span>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>Created: {course.createdAt}</span>
              <span>Updated: {course.updatedAt}</span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onViewCourse(course.id)}
                className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                View
              </button>
              <button
                onClick={() => handleEditCourse(course)}
                className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteCourse(course.id)}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Course
          </button>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter course title"
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
                    placeholder="e.g., 2 hours"
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
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter course description"
                />
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
                        <button
                          onClick={() =>
                            removeModule(module.id || module.tempId)
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                        {!module.file && module.path && (
                          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2">
                            <div className="flex items-center">
                              {module.path.includes(".pdf") ? (
                                <FileText className="h-5 w-5 text-red-500 mr-2" />
                              ) : (
                                <Video className="h-5 w-5 text-blue-500 mr-2" />
                              )}
                              <span className="text-sm text-gray-700">
                                Existing file attached
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => window.open(module.path, "_blank")}
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              View
                            </button>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {module.file || module.path
                              ? "Replace File (optional)"
                              : "Attach File (PDF / Video)"}
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.mp4,.avi,.mov,.wmv"
                            onChange={(e) =>
                              updateModuleFile(
                                module.id || module.tempId,
                                e.target.files[0] || null
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs file:mr-2 file:py-1 file:px-3 file:rounded-l file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
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
                                {module.path.includes(".pdf")
                                  ? "PDF Document"
                                  : "Video File"}
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
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingCourse ? "Update Course" : "Create Course"}
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
