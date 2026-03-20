import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, DollarSign, UserCheck, CreditCard, Building2, Briefcase, BarChart3, CheckCircle, XCircle, AlertCircle, Edit } from 'lucide-react';
import { getLeavesByEmployee } from '@src/services/LeaveMaster';
import { fetchSalaryDataAPI } from '@src/services/SalaryService';

const EmployeeDashboard = ({ 
  employeeProfile, 
  attendanceRecords, 
  isLoadingAttendance, 
  lateCount,
  setActiveItem 
}) => {
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0, late: 0, total: 0 });
  const [otSummary, setOtSummary] = useState({ totalHours: 0, totalAmount: 0 });
  const [loanSummary, setLoanSummary] = useState({ loanAmount: 0, monthlyDeduction: 0, balance: 0 });
  const [showSalarySlip, setShowSalarySlip] = useState(false);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [latestSalaryRecord, setLatestSalaryRecord] = useState(null);

  useEffect(() => {
    if (employeeProfile?.id) {
      fetchLeaveRecords();
      calculateOtSummary();
      calculateLoanSummary();
      fetchLatestSalaryRecord();
    }
  }, [employeeProfile?.id, employeeProfile?.loans]);

  useEffect(() => {
    if (attendanceRecords.length > 0) {
      calculateAttendanceSummary(attendanceRecords);
    }
  }, [attendanceRecords]);

  const fetchLatestSalaryRecord = async () => {
    try {
      const response = await fetchSalaryDataAPI();
      if (response && Array.isArray(response)) {
        const empRecords = response.filter(
          r => r.employee_no === employeeProfile?.attendance_employee_no
        );
        if (empRecords.length > 0) {
          empRecords.sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return b.month - a.month;
          });
          setLatestSalaryRecord(empRecords[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching salary record:', error);
    }
  };

  const fetchLeaveRecords = async () => {
    try {
      const data = await getLeavesByEmployee(employeeProfile.id);
      if (data && Array.isArray(data)) {
        setLeaveRecords(data);
      }
    } catch (error) {
      console.error('Error fetching leave records:', error);
    }
  };

  const calculateAttendanceSummary = (records) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    // unique dates ගන්නවා - IN/OUT records same day count වෙන එක avoid කරන්න
    const uniqueDates = [...new Set(monthRecords.map(r => r.date))];
    const absentDates = [...new Set(monthRecords.filter(r => r.status === 'Absent' || r.status === 'NPL' || r.status === 'No Pay Leave').map(r => r.date))];
    const presentDates = uniqueDates.filter(d => !absentDates.includes(d));
    const lateDates = [...new Set(monthRecords.filter(r => r.status === 'Late Coming').map(r => r.date))];

    setAttendanceSummary({ present: presentDates.length, absent: absentDates.length, late: lateDates.length, total: uniqueDates.length });
  };

  const calculateOtSummary = () => {
    if (employeeProfile?.overtimes && Array.isArray(employeeProfile.overtimes)) {
      const totalHours = employeeProfile.overtimes.reduce((sum, ot) => sum + (parseFloat(ot.ot_hours) || 0), 0);
      const totalAmount = employeeProfile.overtimes.reduce((sum, ot) => sum + (parseFloat(ot.total_ot_amount) || 0), 0);
      setOtSummary({ totalHours: totalHours.toFixed(2), totalAmount: totalAmount.toFixed(2) });
    }
  };

  const calculateLoanSummary = () => {
    if (employeeProfile?.loans && Array.isArray(employeeProfile.loans) && employeeProfile.loans.length > 0) {
      const activeLoan = employeeProfile.loans.find(loan => loan.status === 'active' || loan.status === 'Active');
      if (activeLoan) {
        const loanAmount = parseFloat(activeLoan.loan_amount) || 0;
        const monthlyDeduction = parseFloat(activeLoan.monthly_deduction) || 0;
        const balance = parseFloat(activeLoan.balance) || 0;
        setLoanSummary({ loanAmount, monthlyDeduction, balance });
      } else {
        setLoanSummary({ loanAmount: 0, monthlyDeduction: 0, balance: 0 });
      }
    } else {
      setLoanSummary({ loanAmount: 0, monthlyDeduction: 0, balance: 0 });
    }
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-6">
      {/* Quick Actions - Moved to Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setActiveItem('myProfile')}
          className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all text-left transform hover:-translate-y-1"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl group-hover:scale-110 transition-transform shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">My Profile</h3>
              <p className="text-sm text-gray-600">View & edit details</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveItem('leaveMaster')}
          className="group bg-gradient-to-br from-green-500 to-green-600 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all text-left transform hover:scale-105"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl group-hover:bg-white/30 transition-colors shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-1">Apply Leave</h3>
              <p className="text-sm text-green-100">Request time off</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveItem('attendanceReport')}
          className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:border-indigo-500 hover:shadow-2xl transition-all text-left transform hover:-translate-y-1"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl group-hover:scale-110 transition-transform shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">My Attendance</h3>
              <p className="text-sm text-gray-600">View report</p>
            </div>
          </div>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{attendanceSummary.present}</p>
          <p className="text-sm text-gray-600 mt-2">Present Days</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{lateCount}</p>
          <p className="text-sm text-gray-600 mt-2">Late Days</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{otSummary.totalHours}</p>
          <p className="text-sm text-gray-600 mt-2">OT Hours</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">Rs. 0.00</div>
          <p className="text-sm text-gray-600 mt-2">Loan Balance</p>
        </div>
      </div>

      {/* Profile & Salary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        {employeeProfile && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              Employee Profile
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name</span>
                <span className="text-sm font-medium text-gray-900">{employeeProfile.name_with_initials || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Department</span>
                <span className="text-sm font-medium text-gray-900">{employeeProfile.organization_assignment?.department?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Employee ID</span>
                <span className="text-sm font-medium text-gray-900">{employeeProfile.attendance_employee_no || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Salary Card */}
        {employeeProfile && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              Current Salary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Basic Salary</span>
                <span className="text-sm font-medium text-gray-900">Rs. {(parseFloat(employeeProfile.compensation?.basic_salary) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Allowances</span>
                <span className="text-sm font-medium text-green-600">+ Rs. {parseFloat(latestSalaryRecord?.salary_breakdown?.total_allowances || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Deductions</span>
                <span className="text-sm font-medium text-red-600">- Rs. {parseFloat(latestSalaryRecord?.salary_breakdown?.total_deductions || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">Net Salary</span>
                <span className="text-base font-bold text-green-600">
                  Rs. {latestSalaryRecord ? parseFloat(latestSalaryRecord.salary_breakdown?.net_salary || 0).toLocaleString() : (parseFloat(employeeProfile.compensation?.basic_salary || 0)).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowSalarySlip(true)}
                className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View Salary Slip
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leave Records */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-600" />
          My Leave Requests
        </h3>
        {leaveRecords.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No leave records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Duration</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRecords.slice(0, 5).map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-sm">
                      {leave.leave_date || `${leave.leave_from} to ${leave.leave_to}`}
                    </td>
                    <td className="px-4 py-2 border text-sm">{leave.leave_type}</td>
                    <td className="px-4 py-2 border text-sm">
                      {leave.is_short_leave ? 'Short Leave' : leave.is_half_day ? 'Half Day' : `${leave.leave_duration} day(s)`}
                    </td>
                    <td className="px-4 py-2 border text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        leave.status === 'Approved' || leave.status === 'HR_Approved'
                          ? 'bg-green-100 text-green-800'
                          : leave.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          onClick={() => setActiveItem('leaveMaster')}
          className="w-full mt-4 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          View All / Apply Leave
        </button>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 gap-6">
        {/* Attendance Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Monthly Attendance Summary
          </h3>
          {isLoadingAttendance ? (
            <div className="py-8 text-center">
              <div className="inline-block w-6 h-6 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{attendanceSummary.present}</p>
                  <p className="text-xs text-gray-600 mt-1">Present</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{attendanceSummary.absent}</p>
                  <p className="text-xs text-gray-600 mt-1">Absent</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{attendanceSummary.late}</p>
                  <p className="text-xs text-gray-600 mt-1">Late</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Days</span>
                  <span className="text-lg font-bold text-gray-900">{attendanceSummary.total}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveItem('attendanceReport')}
                className="w-full mt-4 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View Full Report
              </button>
            </>
          )}
        </div>
      </div>

      {/* Salary Slip Modal */}
      {showSalarySlip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white flex justify-between items-center sticky top-0 rounded-t-2xl">
              <div>
                <h2 className="text-3xl font-bold">Salary Slip</h2>
                <p className="text-blue-100 text-sm mt-1">Monthly Salary Record</p>
              </div>
              <button
                onClick={() => setShowSalarySlip(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {/* Employee Header Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Employee Name</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{employeeProfile?.name_with_initials || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Employee ID</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{employeeProfile?.attendance_employee_no || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Department</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{employeeProfile?.organization_assignment?.department?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Month/Year</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">03/2026</p>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown Section */}
              <div className="grid grid-cols-2 gap-6">
                {/* Earnings */}
                <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-green-500 rounded"></div>
                    <h3 className="font-bold text-gray-900 text-lg">Earnings</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-700 text-sm">Basic Salary</span>
                      <span className="font-semibold text-gray-900">Rs. {(employeeProfile?.compensation?.basic_salary || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-700 text-sm">BR Allowance</span>
                      <span className="font-semibold text-gray-900">Rs. 0.00</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-700 text-sm">Other Allowances</span>
                      <span className="font-semibold text-green-600">Rs. {parseFloat(latestSalaryRecord?.salary_breakdown?.total_allowances || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 bg-green-50 px-3 py-2 rounded-lg">
                      <span className="font-bold text-gray-900">Total Earnings</span>
                      <span className="font-bold text-green-600 text-lg">Rs. {parseFloat(latestSalaryRecord?.salary_breakdown?.gross_salary || employeeProfile?.compensation?.basic_salary || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-red-500 rounded"></div>
                    <h3 className="font-bold text-gray-900 text-lg">Deductions</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-700 text-sm">EPF (8%)</span>
                      <span className="font-semibold text-gray-900">Rs. {parseFloat(latestSalaryRecord?.salary_breakdown?.epf_employee_deduction || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-700 text-sm">Loan Installment</span>
                      <span className="font-semibold text-gray-900">Rs. {parseFloat(latestSalaryRecord?.salary_breakdown?.loan_installment || loanSummary.monthlyDeduction || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-700 text-sm">Stamp Duty</span>
                      <span className="font-semibold text-gray-900">Rs. {parseFloat(latestSalaryRecord?.salary_breakdown?.stamp || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-700 text-sm">Other Deductions</span>
                      <span className="font-semibold text-gray-900">Rs. {parseFloat(latestSalaryRecord?.salary_breakdown?.total_fixed_deductions || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 bg-red-50 px-3 py-2 rounded-lg">
                      <span className="font-bold text-gray-900">Total Deductions</span>
                      <span className="font-bold text-red-600 text-lg">Rs. {parseFloat(latestSalaryRecord?.salary_breakdown?.total_deductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary Summary */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide">Net Salary</p>
                    <p className="text-blue-100 text-sm mt-1">Amount to be credited</p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-bold">Rs. {parseFloat(latestSalaryRecord?.salary_breakdown?.net_salary || employeeProfile?.compensation?.basic_salary || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">No Pay Days</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Probation Deduction</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">Rs. 0.00</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Loan Balance</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">Rs. {loanSummary.balance.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">Pending</p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-200 pt-6 flex justify-between items-center">
                <p className="text-xs text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
                  >
                    Print
                  </button>
                  <button
                    onClick={() => setShowSalarySlip(false)}
                    className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;