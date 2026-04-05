import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, UserCheck, CalendarDays, FileText } from "lucide-react";
import Swal from "sweetalert2";
// 🔥 මෙතන අලුත් Function නම දාගන්න
import { getSupervisorLeaves, updateLeaveStatus } from "@services/LeaveMaster"; 

const SupervisorLeaveApproval = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      // සියලුම නිවාඩු ගන්නවා
      const response = await getSupervisorLeaves();
      setLeaves(response.data || response || []);
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load leaves for trainees.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leave) => {
    try {
      setProcessingId(leave.id);
      
      // Approve කරද්දී ඊළඟ ලෙවල් එකට (Pending) යවනවා
      await updateLeaveStatus(leave.id, { status: "Pending" });
      
      Swal.fire({
        icon: "success",
        title: "Forwarded!",
        text: "Leave has been approved and forwarded to HR/Manager.",
        timer: 2000,
        showConfirmButton: false,
      });
      
      fetchLeaves();
    } catch (error) {
      console.error("Approval error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: error.response?.data?.message || "Failed to approve the leave.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (leave) => {
    const { value: reason } = await Swal.fire({
      title: "Reject Leave",
      input: "textarea",
      inputLabel: "Please provide a reason for rejection",
      inputPlaceholder: "Type your reason here...",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Reject Leave",
      inputValidator: (value) => {
        if (!value) {
          return "You need to write a reason!";
        }
      }
    });

    if (reason) {
      try {
        setProcessingId(leave.id);
        
        await updateLeaveStatus(leave.id, { 
          status: "Rejected", 
          rejection_reason: reason 
        });
        
        Swal.fire({
          icon: "success",
          title: "Rejected!",
          text: "Leave request has been rejected.",
          timer: 2000,
          showConfirmButton: false,
        });
        
        fetchLeaves();
      } catch (error) {
        console.error("Rejection error:", error);
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: error.response?.data?.message || "Failed to reject the leave.",
        });
      } finally {
        setProcessingId(null);
      }
    }
  };

  // Status එක අනුව පාට වෙනස් කරන Function එක
  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending_Supervisor":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">Needs Action</span>;
      case "Pending":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">At Manager/HR</span>;
      case "Approved":
      case "HR_Approved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Fully Approved</span>;
      case "Rejected":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <UserCheck className="w-8 h-8 text-blue-600" />
          Supervisor Leave Approval
        </h1>
        <p className="text-slate-600">
          Review and track all leave requests from <span className="font-semibold text-blue-700">Trainee</span> employees.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Trainee Leave History
            <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs ml-2">
              {leaves.length} Total
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Employee</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Leave Info</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Dates</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-600 font-medium">Loading requests...</p>
                    </div>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                      </div>
                      <p className="text-slate-700 font-bold mb-1">No Records Found</p>
                      <p className="text-slate-500 text-sm">
                        There are no leave requests from trainees yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-blue-50/50 transition-colors">
                    {/* Employee Details */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">
                          {leave.employee?.full_name || "N/A"}
                        </span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">
                          {leave.employee?.attendance_employee_no || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Leave Type & Duration */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {leave.leave_type}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          Duration: <span className="text-blue-600">{leave.leave_duration || (leave.is_half_day ? 0.5 : leave.is_short_leave ? 0.25 : 1)} Days</span>
                        </span>
                        {leave.is_half_day ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Half Day - {leave.period || "Morning"}
                          </span>
                        ) : leave.is_short_leave ? (
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Short Leave - {leave.short_leave_slot || "Slot 1"}
                          </span>
                        ) : null}
                        {leave.reason && (
                          <span className="text-xs text-slate-500 truncate max-w-[150px]" title={leave.reason}>
                            "{leave.reason}"
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        {leave.leave_date ? (
                          <span className="font-medium">{leave.leave_date}</span>
                        ) : (
                          <span className="font-medium">
                            {leave.leave_from} <span className="text-slate-400 mx-1">to</span> {leave.leave_to}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {getStatusBadge(leave.status)}
                    </td>

                    {/* Actions - Shows buttons ONLY if status is Pending_Supervisor */}
                    <td className="px-6 py-4">
                      {leave.status === "Pending_Supervisor" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(leave)}
                            disabled={processingId === leave.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          
                          <button
                            onClick={() => handleReject(leave)}
                            disabled={processingId === leave.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-semibold text-slate-400 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" /> Processed
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupervisorLeaveApproval;