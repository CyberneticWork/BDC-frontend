import React, { useState, useEffect } from "react";
import { X, Calendar, User, FileText, Phone, Building2, Clock } from "lucide-react";
import { useLeave } from "@src/contexts/LeaveContext";
import { createLeave } from "@src/services/LeaveMaster";
import { toast } from "react-toastify";

const LeaveApplicationForm = ({ isOpen, onClose, employeeProfile }) => {
  const { leaveData, updateLeaveData, loadEmployeeToLeaveForm, resetLeaveForm } = useLeave();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && employeeProfile) {
      loadEmployeeToLeaveForm(employeeProfile);
    }
  }, [isOpen, employeeProfile, loadEmployeeToLeaveForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        employee_id: leaveData.employee_id,
        leave_type: leaveData.leave_type,
        from_date: leaveData.from_date,
        to_date: leaveData.to_date,
        reason: leaveData.reason,
        contact_during_leave: leaveData.contact_during_leave,
        status: "pending",
      };

      await createLeave(submitData);
      toast.success("Leave application submitted successfully!");
      resetLeaveForm();
      onClose();
    } catch (error) {
      console.error("Error submitting leave:", error);
      toast.error(error.response?.data?.message || "Failed to submit leave application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Leave Application</h2>
            <p className="text-blue-100 text-sm mt-1">Submit your leave request</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employee Details - Auto Filled */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Employee Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name
                </label>
                <input
                  type="text"
                  value={leaveData.employee_name}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee No
                </label>
                <input
                  type="text"
                  value={leaveData.employee_no}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Department
                </label>
                <input
                  type="text"
                  value={leaveData.department}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Leave Details
            </h3>

            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                value={leaveData.leave_type}
                onChange={(e) => updateLeaveData({ leave_type: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Leave Type</option>
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="short">Short Leave</option>
                <option value="half_day">Half Day</option>
                <option value="no_pay">No Pay Leave</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  From Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={leaveData.from_date}
                  onChange={(e) => updateLeaveData({ from_date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  To Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={leaveData.to_date}
                  onChange={(e) => updateLeaveData({ to_date: e.target.value })}
                  required
                  min={leaveData.from_date}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Contact During Leave */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Contact During Leave
              </label>
              <input
                type="text"
                value={leaveData.contact_during_leave}
                onChange={(e) => updateLeaveData({ contact_during_leave: e.target.value })}
                placeholder="Phone number or email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={leaveData.reason}
                onChange={(e) => updateLeaveData({ reason: e.target.value })}
                required
                rows="4"
                placeholder="Please provide a reason for your leave..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                  Submitting...
                </span>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveApplicationForm;
