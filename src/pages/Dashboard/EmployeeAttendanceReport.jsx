import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import timeCardService from '@src/services/timeCardService';


const EmployeeAttendanceReport = ({ employeeProfile }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, total: 0 });

  const [employeeCategory, setEmployeeCategory] = useState("");

  useEffect(() => {
    if (employeeProfile?.attendance_employee_no) {
      fetchAttendanceRecords();
    }
  }, [employeeProfile, selectedMonth, selectedYear]);

  const fetchAttendanceRecords = async () => {
    setIsLoading(true);
    try {
      const response = await timeCardService.searchEmployeeTimeCards(employeeProfile.attendance_employee_no);
      if (response && Array.isArray(response)) {
        const filtered = response.filter(record => {
          const d = record.date || record.actual_date;
          if (!d) return false;
          const recordDate = new Date(d);
          return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
        });
        // Group by date - IN/OUT records same date ekama group karanawa
        const grouped = {};
        filtered.forEach(record => {
          const dateKey = record.actual_date || record.date;
          if (!grouped[dateKey]) {
            grouped[dateKey] = { date: dateKey, checkIn: null, checkOut: null, status: null, isLate: false };
          }
          const s = record.status;
          if (s === 'IN' || s === 'Late Coming') {
            grouped[dateKey].checkIn = record.time;
            grouped[dateKey].status = s;
            if (s === 'Late Coming') grouped[dateKey].isLate = true;
          } else if (s === 'OUT' || s === 'Early OUT') {
            grouped[dateKey].checkOut = record.time;
            if (!grouped[dateKey].status) grouped[dateKey].status = s;
          } else if (s === 'NPL' || s === 'No Pay Leave' || s === 'Absent') {
            grouped[dateKey].status = s;
          }
        });
        const groupedRecords = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
        setAttendanceRecords(groupedRecords);
        calculateSummary(groupedRecords);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSummary = (records) => {
    const absent = records.filter(r => r.status === 'NPL' || r.status === 'No Pay Leave' || r.status === 'Absent').length;
    const present = records.length - absent;
    const late = records.filter(r => r.isLate).length;
    setSummary({ present, absent, late, total: records.length });
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const getStatusColor = (status) => {
    if (status === 'NPL' || status === 'No Pay Leave' || status === 'Absent') return 'bg-red-50 text-red-700';
    if (status === 'Late Coming') return 'bg-yellow-50 text-yellow-700';
    return 'bg-green-50 text-green-700';
  };

  const getStatusLabel = (record) => {
    if (record.status === 'NPL' || record.status === 'No Pay Leave' || record.status === 'Absent') return 'Absent';
    return 'Present';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Attendance Report</h1>
        </div>
        <p className="text-blue-100">View your complete attendance records</p>
      </div>

      {/* Employee Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Employee Name</p>
            <p className="text-lg font-bold text-gray-900">{employeeProfile?.name_with_initials || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Employee ID</p>
            <p className="text-lg font-bold text-gray-900">{employeeProfile?.attendance_employee_no || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Department</p>
            <p className="text-lg font-bold text-gray-900">{employeeProfile?.organization_assignment?.department?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Designation</p>
            <p className="text-lg font-bold text-gray-900">{employeeProfile?.organization_assignment?.designation?.name || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.present}</p>
          <p className="text-sm text-gray-600 mt-2">Present Days</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.absent}</p>
          <p className="text-sm text-gray-600 mt-2">Absent Days</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.late}</p>
          <p className="text-sm text-gray-600 mt-2">Late Days</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
          <p className="text-sm text-gray-600 mt-2">Total Days</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Attendance Records - {months[selectedMonth]} {selectedYear}</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : attendanceRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Day</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Late Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check In</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check Out</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record, index) => {
                  const recordDate = new Date(record.date);
                  const dayName = recordDate.toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{recordDate.toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{dayName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                          {getStatusLabel(record)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${record.isLate ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'}`}>
                          {record.isLate ? 'Late' : 'On Time'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.checkIn || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.checkOut || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No attendance records found for {months[selectedMonth]} {selectedYear}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAttendanceReport;
