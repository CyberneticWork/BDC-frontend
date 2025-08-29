import React, { useState, useRef } from "react";
import { X, Loader2, Upload, File, AlertCircle, Clock, Calendar } from "lucide-react";

export const TaskProgressUpdateModal = ({ 
  isOpen, 
  onClose, 
  task, 
  onSubmit, 
  employeeId,
  employeeName
}) => {
  const [progressNote, setProgressNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !task) return null;

  // Get previous updates by this employee
  const getMyPreviousUpdates = () => {
    const myUpdates = task.assigneeUpdates.find(
      au => au.employeeId === parseInt(employeeId)
    )?.updates || [];
    
    return myUpdates;
  };

  const myPreviousUpdates = getMyPreviousUpdates();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!progressNote.trim()) {
      alert("Please add a note about your progress");
      return;
    }

    if (!selectedFile) {
      alert("Please upload a document to support your progress");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create current timestamp
      const now = new Date().toISOString();
      
      // In a real implementation, you'd upload the file to a server here
      await onSubmit({
        note: progressNote,
        employeeId,
        date: now,
        documentName: selectedFile.name,
        documentSize: (selectedFile.size / 1024).toFixed(1) + " KB",
        documentType: selectedFile.type,
      });
      
      setProgressNote("");
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error("Error updating progress:", error);
      alert("Failed to update progress. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate task completion percentage based on timeline
  const getTimelinePercentage = () => {
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    const today = new Date();
    
    const totalDuration = endDate - startDate;
    const elapsedDuration = today - startDate;
    
    if (elapsedDuration <= 0) return 0;
    if (elapsedDuration >= totalDuration) return 100;
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  };

  const timelinePercentage = getTimelinePercentage();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Submit Task Progress</h2>
            <p className="text-gray-600 text-sm mt-1">{task.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-6">
            {/* Task details summary */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {new Date(task.startDate).toLocaleDateString()} — {new Date(task.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      Timeline: {timelinePercentage}% elapsed
                    </span>
                  </div>
                </div>
                
                <div className="col-span-full">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full bg-indigo-500"
                      style={{ width: `${timelinePercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <File className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">{selectedFile.name}</div>
                    <div className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown type'}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSelectedFile(null)}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium mb-1">Drop your file here, or</p>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="text-indigo-600 font-medium hover:text-indigo-700"
                      >
                        browse
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Support for PDF, Word, Excel, and image files up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress Notes
              </label>
              <textarea
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder="Describe your progress, challenges, or achievements..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              ></textarea>
            </div>

            {/* Previous updates */}
            {myPreviousUpdates.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Your Previous Updates
                </h3>
                <div className="space-y-4 max-h-60 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                  {myPreviousUpdates.map((update, idx) => (
                    <div key={idx} className="pb-4 border-b border-gray-200 last:border-0">
                      <div className="flex items-start gap-3">
                        {update.documentName && (
                          <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-2">
                            <File className="w-5 h-5 text-indigo-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          {update.documentName && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-indigo-600">
                                {update.documentName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {update.documentSize}
                              </span>
                            </div>
                          )}
                          <p className="text-sm text-gray-800 mt-1">{update.note}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(update.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                isSubmitting || !selectedFile 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Progress</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};