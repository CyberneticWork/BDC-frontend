import React from 'react';
import { User, Calendar, Clock, DollarSign, UserCheck, CreditCard, Building2, Briefcase, BarChart3 } from 'lucide-react';

const EmployeeDashboard = ({ 
  employeeProfile, 
  attendanceRecords, 
  isLoadingAttendance, 
  lateCount,
  setActiveItem 
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">18</p>
          <p className="text-sm text-gray-600 mt-1">Present Days</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{lateCount}</p>
          <p className="text-sm text-gray-600 mt-1">Late Days</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-600 mt-1">OT Hours</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">Rs. 0</p>
          <p className="text-sm text-gray-600 mt-1">Loan Balance</p>
        </div>
      </div>

      {/* Profile & Salary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        {employeeProfile && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Current Salary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Basic Salary</span>
                <span className="text-sm font-medium text-gray-900">Rs. {employeeProfile.salary_details?.basic_salary?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Allowances</span>
                <span className="text-sm font-medium text-green-600">+ Rs. {(employeeProfile.salary_details?.allowances || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Deductions</span>
                <span className="text-sm font-medium text-red-600">- Rs. {(employeeProfile.salary_details?.deductions || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">Net Salary</span>
                <span className="text-base font-bold text-green-600">
                  Rs. {(
                    (employeeProfile.salary_details?.basic_salary || 0) +
                    (employeeProfile.salary_details?.allowances || 0) -
                    (employeeProfile.salary_details?.deductions || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendance & Leave Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Records */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Recent Attendance
          </h3>
          <div className="overflow-x-auto">
            {isLoadingAttendance ? (
              <div className="py-8 text-center">
                <div className="inline-block w-6 h-6 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.slice(0, 5).map((record, index) => {
                      const isLate = record.late_status === 'Late';
                      const isNPL = record.status === 'NPL' || record.status === 'No Pay Leave';
                      
                      return (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="px-3 py-2 text-sm text-gray-900">{record.date}</td>
                          <td className="px-3 py-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isNPL ? 'bg-red-100 text-red-800' :
                              isLate ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {isNPL ? 'NPL' : isLate ? 'Late' : 'Present'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="2" className="px-3 py-8 text-center text-gray-500 text-sm">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Leave Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Leave Summary
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
              <p className="text-2xl font-bold text-purple-600">0</p>
              <p className="text-xs text-gray-600 mt-1">Short Leave</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
              <p className="text-2xl font-bold text-orange-600">0</p>
              <p className="text-xs text-gray-600 mt-1">Half Day</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
              <p className="text-2xl font-bold text-red-600">0</p>
              <p className="text-xs text-gray-600 mt-1">NPL</p>
            </div>
          </div>
        </div>
      </div>

      {/* OT, Loan, Bonus, Paysheet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OT Records */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            OT Records
          </h3>
          <div className="bg-blue-50 rounded-lg p-4 mb-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Payment</p>
                <p className="text-xl font-bold text-green-600">Rs. 0</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">Season: June - November</p>
        </div>

        {/* Loan Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            Loan Management
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Loan Amount</span>
              <span className="text-sm font-bold text-purple-600">Rs. 0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Monthly Deduction</span>
              <span className="text-sm font-semibold text-red-600">Rs. 0</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700">Balance</span>
              <span className="text-lg font-bold text-orange-600">Rs. 0</span>
            </div>
          </div>
        </div>

        {/* Bonus Records */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            Bonus Records
          </h3>
          <div className="text-center py-6 text-gray-500 text-sm">
            No bonus records available
          </div>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveItem('myProfile')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">My Profile</h3>
              <p className="text-xs text-gray-600">View details</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveItem('leaveMaster')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Apply Leave</h3>
              <p className="text-xs text-gray-600">Request time off</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveItem('SalaryPage')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Salary Slip</h3>
              <p className="text-xs text-gray-600">View payslip</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
