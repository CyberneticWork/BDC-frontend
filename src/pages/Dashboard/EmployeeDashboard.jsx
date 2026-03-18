import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, DollarSign, UserCheck, CreditCard, Building2, Briefcase, BarChart3, CheckCircle, XCircle, AlertCircle, Edit } from 'lucide-react';
import { getLeavesByEmployee } from '@src/services/LeaveMaster';

const EmployeeDashboard = ({ 
  employeeProfile, 
  attendanceRecords, 
  isLoadingAttendance, 
  lateCount,
  setActiveItem 
}) => {
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0, late: 0, total: 0 });
  const [leaveSummary, setLeaveSummary] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(false);
  const [otSummary, setOtSummary] = useState({ totalHours: 0, totalAmount: 0 });
  const [loanSummary, setLoanSummary] = useState({ loanAmount: 0, monthlyDeduction: 0, balance: 0 });
  const [showSalarySlip, setShowSalarySlip] = useState(false);

  useEffect(() => {
    if (employeeProfile?.id) {
      fetchLeaveRecords();
      calculateOtSummary();
      calculateLoanSummary();
    }
  }, [employeeProfile?.id, employeeProfile?.loans]);

  useEffect(() => {
    if (attendanceRecords.length > 0) {
      calculateAttendanceSummary(attendanceRecords);
    }
  }, [attendanceRecords]);

  const fetchLeaveRecords = async () => {
    setIsLoadingLeaves(true);
    try {
      const data = await getLeavesByEmployee(employeeProfile.id);
      if (data && Array.isArray(data)) {
        calculateLeaveSummary(data);
      }
    } catch (error) {
      console.error('Error fetching leave records:', error);
    } finally {
      setIsLoadingLeaves(false);
    }
  };

  const calculateLeaveSummary = (leaves) => {
    const pending = leaves.filter(l => l.status === 'pending').length;
    const approved = leaves.filter(l => l.status === 'approved' || l.status === 'hr-approved').length;
    const rejected = leaves.filter(l => l.status === 'rejected').length;
    setLeaveSummary({ pending, approved, rejected, total: leaves.length });
  };

  const calculateAttendanceSummary = (records) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    const present = monthRecords.filter(r => r.status !== 'NPL' && r.status !== 'No Pay Leave').length;
    const absent = monthRecords.filter(r => r.status === 'NPL' || r.status === 'No Pay Leave').length;
    const late = monthRecords.filter(r => r.late_status === 'Late').length;
    
    setAttendanceSummary({ present, absent, late, total: monthRecords.length });
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
          <p className="text-3xl font-bold text-gray-900">Rs. {loanSummary.balance.toLocaleString()}</p>
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
                <span className="text-sm font-medium text-green-600">+ Rs. 500.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Deductions</span>
                <span className="text-sm font-medium text-red-600">- Rs. 1,000.00</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">Net Salary</span>
                <span className="text-base font-bold text-green-600">
                  Rs. {(parseFloat(employeeProfile.compensation?.basic_salary || 0) + 500 - 1000).toLocaleString()}
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

      {/* Attendance & Leave Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Leave Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            My Leave Requests
          </h3>
          {isLoadingLeaves ? (
            <div className="py-8 text-center">
              <div className="inline-block w-6 h-6 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{leaveSummary.pending}</p>
                  <p className="text-xs text-gray-600 mt-1">Pending</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{leaveSummary.approved}</p>
                  <p className="text-xs text-gray-600 mt-1">Approved</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{leaveSummary.rejected}</p>
                  <p className="text-xs text-gray-600 mt-1">Rejected</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="text-lg font-bold text-gray-900">{leaveSummary.total}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* OT, Loan, Bonus, Paysheet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            Loan Management
          </h3>
          {employeeProfile?.loans && employeeProfile.loans.length > 0 ? (
            <div className="space-y-3">
              {employeeProfile.loans.map((loan, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600 uppercase">{loan.loan_type || 'Loan'}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      loan.status === 'active' || loan.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {loan.status || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Loan Amount</span>
                    <span className="text-sm font-bold text-purple-600">Rs. {parseFloat(loan.loan_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monthly Deduction</span>
                    <span className="text-sm font-semibold text-red-600">Rs. {parseFloat(loan.monthly_deduction || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Balance</span>
                    <span className="text-lg font-bold text-orange-600">Rs. {parseFloat(loan.balance || 0).toLocaleString()}</span>
                  </div>
                  {index < employeeProfile.loans.length - 1 && <div className="border-t border-gray-200 mt-3 pt-3"></div>}
                </div>
              ))}
              <button
                onClick={() => setActiveItem('loanManagement')}
                className="w-full mt-4 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View Details
              </button>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">
              No active loans
            </div>
          )}
        </div>

        {/* Paysheet History */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Paysheet History
          </h3>
          <div className="text-center py-4 text-gray-500 text-sm mb-3">
            No paysheet records
          </div>
          <button className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Download PDF
          </button>
        </div>
      </div>

      {/* Salary Slip Modal */}
      {showSalarySlip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-none shadow-2xl w-screen h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white flex justify-between items-center sticky top-0">
              <h2 className="text-2xl font-bold">Salary Record</h2>
              <button
                onClick={() => setShowSalarySlip(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {/* Employee & Basic Info */}
              <div className="grid grid-cols-2 gap-6 pb-6 border-b-2 border-gray-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Employee Name</p>
                  <p className="text-lg font-bold text-gray-900">{employeeProfile?.name_with_initials || 'N/A'}</p>
                  <p className="text-sm text-gray-500 mt-1">{employeeProfile?.organization_assignment?.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Employee ID</p>
                  <p className="text-lg font-bold text-gray-900">{employeeProfile?.attendance_employee_no || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Basic Salary</p>
                  <p className="text-lg font-bold text-blue-600">Rs. {(employeeProfile?.compensation?.basic_salary || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="text-lg font-bold text-yellow-600">Pending</p>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="grid grid-cols-2 gap-6">
                {/* Earnings */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Earnings</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Basic Salary</span>
                      <span className="font-semibold text-gray-900">Rs. {(employeeProfile?.compensation?.basic_salary || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">BR Allowance</span>
                      <span className="font-semibold text-gray-900">Rs. 0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Other Allowances</span>
                      <span className="font-semibold text-green-600">Rs. 500.00</span>
                    </div>
                    <div className="border-t border-green-300 pt-3 flex justify-between">
                      <span className="font-bold text-gray-900">Total Earnings</span>
                      <span className="font-bold text-green-600">Rs. {(parseFloat(employeeProfile?.compensation?.basic_salary || 0) + 500).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Deductions</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">EPF (8%)</span>
                      <span className="font-semibold text-gray-900">Rs. {(((employeeProfile?.compensation?.basic_salary || 0) * 8) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Loan Installment</span>
                      <span className="font-semibold text-gray-900">Rs. {loanSummary.monthlyDeduction.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Stamp Duty</span>
                      <span className="font-semibold text-gray-900">Rs. 25.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Other Deductions</span>
                      <span className="font-semibold text-gray-900">Rs. 1,000.00</span>
                    </div>
                    <div className="border-t border-red-300 pt-3 flex justify-between">
                      <span className="font-bold text-gray-900">Total Deductions</span>
                      <span className="font-bold text-red-600">Rs. {((((employeeProfile?.compensation?.basic_salary || 0) * 8) / 100) + loanSummary.monthlyDeduction + 25 + 1000).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg p-6 border-2 border-blue-500">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Net Salary</span>
                  <span className="text-3xl font-bold text-blue-600">Rs. {(parseFloat(employeeProfile?.compensation?.basic_salary || 0) + 500 - (parseFloat(employeeProfile?.compensation?.basic_salary || 0) * 8) / 100 - parseFloat(loanSummary.monthlyDeduction || 0) - 25 - 1000).toLocaleString()}</span>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">No Pay Days</p>
                  <p className="font-bold text-gray-900">0</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Probation Deduction</p>
                  <p className="font-bold text-gray-900">Rs. 0.00</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Loan Balance</p>
                  <p className="font-bold text-gray-900">Rs. {loanSummary.balance.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Month/Year</p>
                  <p className="font-bold text-gray-900">03/2026</p>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowSalarySlip(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
