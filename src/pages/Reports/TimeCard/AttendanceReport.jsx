import React, { useState, useEffect } from "react";
import {
  getAttendanceRecords,
  getMonthlyAttendanceRecords,
  updateAttendanceApprovalStatus,
} from "@services/Reports/AttendanceReportService";
import { fetchCompanies, fetchDepartmentsById } from "@services/ApiDataService"; //  import 
import {
  Calendar,
  Search,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  Building2,
  Filter,
} from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

const AttendanceReport = ({ employeeProfile }) => {
  const [reportType, setReportType] = useState("month");
  const [date, setDate] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // --- අලුතින් එකතු කළ Filter States ---
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isHolidayWorked, setIsHolidayWorked] = useState(false);

  // employeeProfile auto-fill
  useEffect(() => {
    if (employeeProfile?.attendance_employee_no) {
      setSearch(employeeProfile.attendance_employee_no);
    }
    if (employeeProfile?.organization_assignment?.company?.id) {
      const companyId = String(employeeProfile.organization_assignment.company.id);
      setSelectedCompany(companyId);
      // company departments load කරන්නම්
      fetchDepartmentsById(companyId).then(depts => {
        setDepartments(depts || []);
        if (employeeProfile?.organization_assignment?.department?.id) {
          setSelectedDepartment(String(employeeProfile.organization_assignment.department.id));
        }
      }).catch(() => {});
    }
  }, [employeeProfile]);

  // Component එක Load වෙද්දී Companies ටික ගෙන්න ගන්නවා
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await fetchCompanies();
        setCompanies(data || []);
      } catch (error) {
        console.error("Failed to load companies:", error);
      }
    };
    loadCompanies();
  }, []);

  // Company එක වෙනස් වෙද්දී අදාල Departments ටික ගෙන්න ගන්නවා
  const handleCompanyChange = async (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    setSelectedDepartment("");
    if (companyId) {
      try {
        const depts = await fetchDepartmentsById(companyId);
        setDepartments(depts || []);
      } catch (error) {
        console.error("Failed to load departments:", error);
      }
    } else {
      setDepartments([]);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const monthVal = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${monthVal}-${day}`;
  };

  const fetchReport = async (page = 1) => {
    if (reportType === "date" && !date) {
      Swal.fire({
        icon: "warning",
        title: "Date Required",
        text: "Please select a date to generate the report",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (reportType === "month" && !month) {
      Swal.fire({
        icon: "warning",
        title: "Month Required",
        text: "Please select a month to generate the report",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      setLoading(true);

      // Backend එකට යවන අලුත් Parameters
      const apiParams = {
        page,
        per_page: perPage,
        search,
        company_id: selectedCompany || undefined,
        department_id: selectedDepartment || undefined,
        holiday_worked: isHolidayWorked ? 1 : 0,
      };

      const res =
        reportType === "date"
          ? await getAttendanceRecords({ ...apiParams, date })
          : await getMonthlyAttendanceRecords({ ...apiParams, month });

      setData(res.data || []);
      setMeta({
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
        total: res.total || 0,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Failed to Fetch Report",
        text: e.response?.data?.message || e.message,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalStatusChange = async (row, newStatus) => {
    const oldStatus = row.approval_status || "Pending";

    try {
      setStatusUpdatingId(row.id);

      setData((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, approval_status: newStatus } : item
        )
      );

      await updateAttendanceApprovalStatus({
        employeeId: row.employee_id,
        date: row.date,
        approval_status: newStatus,
      });

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Approval status updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      setData((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, approval_status: oldStatus } : item
        )
      );

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: e.response?.data?.message || e.message,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const exportToExcel = async () => {
    if (reportType === "date" && !date) {
      Swal.fire({
        icon: "warning",
        title: "Date Required",
        text: "Please select a date first",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (reportType === "month" && !month) {
      Swal.fire({
        icon: "warning",
        title: "Month Required",
        text: "Please select a month first",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (data.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Data",
        text: "Generate the report first to export",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      setExporting(true);

      let allData = [];
      let currentPage = 1;
      let lastPage = 1;

      const apiParams = {
        per_page: 100,
        search,
        company_id: selectedCompany || undefined,
        department_id: selectedDepartment || undefined,
        holiday_worked: isHolidayWorked ? 1 : 0,
      };

      do {
        const res =
          reportType === "date"
            ? await getAttendanceRecords({ ...apiParams, date, page: currentPage })
            : await getMonthlyAttendanceRecords({ ...apiParams, month, page: currentPage });

        allData = allData.concat(res.data || []);
        lastPage = res.last_page || 1;
        currentPage++;
      } while (currentPage <= lastPage);

      if (allData.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No Records",
          text: "No data available to export",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      const exportData = allData.map((r, idx) => ({
        "No.": idx + 1,
        "EMP No": r.empNo || "-",
        Name: r.name || "-",
        Company: r.company || "-",
        Department: r.department || "-",
        "Sub Department": r.sub_department || "-",
        Date: r.date_label ? `${r.date || "-"} (${r.date_label})` : r.date || "-",
        "IN Time": r.in_label
          ? `${r.in_time || "-"} (${r.in_label})`
          : r.in_time || "-",
        "OUT Time": r.out_label
          ? `${r.out_time || "-"} (${r.out_label})`
          : r.out_time || "-",
        Status: r.status || "Present",
        "Late Day No": r.late_day_number || "-",
        "Late Action": r.is_grace_period_late ? "Pending" : r.late_policy_action || "-",
        "Monthly Late Count": r.monthly_late_count ?? "-",
        Approval: r.is_grace_period_late ? r.approval_status || "Pending" : "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

      const maxWidth = exportData.reduce((w, r) => {
        Object.keys(r).forEach((key) => {
          const len = String(r[key]).length;
          w[key] = Math.max(w[key] || 10, len);
        });
        return w;
      }, {});

      ws["!cols"] = Object.keys(maxWidth).map((key) => ({
        wch: maxWidth[key] + 2,
      }));

      XLSX.writeFile(
        wb,
        reportType === "date"
          ? `Attendance_Report_${date}.xlsx`
          : `Attendance_Report_${month}.xlsx`
      );

      Swal.fire({
        icon: "success",
        title: "Exported Successfully",
        text: `${allData.length} records exported`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: e.response?.data?.message || e.message || "Failed to export data",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setExporting(false);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= meta.last_page) {
      fetchReport(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const { current_page, last_page } = meta;

    pages.push(1);

    let start = Math.max(2, current_page - 1);
    let end = Math.min(last_page - 1, current_page + 1);

    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < last_page - 1) pages.push("...");
    if (last_page > 1) pages.push(last_page);

    return pages;
  };

  const clearFilters = () => {
    setDate("");
    setMonth("");
    setSearch("");
    setPerPage(15);
    setSelectedCompany("");
    setSelectedDepartment("");
    setDepartments([]);
    setIsHolidayWorked(false);
    setData([]);
    setMeta({ current_page: 1, last_page: 1, total: 0 });
  };

  const getApprovalSelectClass = (status) => {
    switch (status) {
      case "Active":
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      case "Rejected":
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-300";
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-300";
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Users className="w-8 h-8 text-blue-600" />
          Attendance Report
        </h1>
        <p className="text-slate-600">Daily and monthly attendance reporting</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200">
        {/* Top Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white"
            >
              <option value="date">By Date</option>
              <option value="month">By Month</option>
            </select>
          </div>

          {reportType === "date" ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={getTodayDate()}
                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                max={getTodayDate().slice(0, 7)}
                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Search Employee</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, NIC or EMP No"
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Records Per Page</label>
            <select
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              {[10, 15, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n} records</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Company</label>
            <select
              value={selectedCompany}
              onChange={handleCompanyChange}
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={!selectedCompany}
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center h-full pb-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isHolidayWorked}
                onChange={(e) => setIsHolidayWorked(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-slate-700">Holiday Worked Only</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchReport(1)}
              disabled={loading}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? "Loading..." : "Generate"}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl border border-gray-300 hover:bg-gray-200 transition-all font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <div className="text-sm font-semibold text-slate-700">
            Showing{" "}
            <span className="text-blue-600">
              {meta.total === 0 ? 0 : (meta.current_page - 1) * perPage + 1}
            </span>{" "}
            to{" "}
            <span className="text-blue-600">
              {Math.min(meta.current_page * perPage, meta.total)}
            </span>{" "}
            of <span className="text-blue-600">{meta.total || 0}</span> records
          </div>

          <button
            onClick={exportToExcel}
            disabled={exporting || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
          >
            {exporting ? (
              "Exporting..."
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                Export to Excel
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-200">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">EMP No</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Employee Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Company</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Department</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Sub Department</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">IN Time</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">OUT Time</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider"> BEFORE 30 mins LATE Approval</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-600 font-medium">Loading report...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium mb-1">No attendance records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{r.empNo || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium">{r.name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.company || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.department || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.sub_department || "-"}</td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{r.date || "-"}</div>
                      {r.date_label && (
                        <div className="mt-1 text-xs font-semibold text-purple-600">
                          {r.date_label}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-slate-700">{r.in_time || "-"}</div>
                      {r.in_label && (
                        <div className="mt-1 text-xs font-semibold text-orange-600">
                          {r.in_label}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-slate-700">{r.out_time || "-"}</div>
                      {r.out_label && (
                        <div className="mt-1 text-xs font-semibold text-yellow-600">
                          {r.out_label}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {r.status || "Present"}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      {r.is_grace_period_late ? (
                        <select
                          value={r.approval_status || "Pending"}
                          disabled={statusUpdatingId === r.id}
                          onChange={(e) => handleApprovalStatusChange(r, e.target.value)}
                          className={`px-3 py-2 rounded-lg border text-sm font-semibold outline-none min-w-[130px] disabled:opacity-60 ${getApprovalSelectClass(
                            r.approval_status || "Pending"
                          )}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Active">Active</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta.last_page > 1 && !loading && (
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(1)}
                disabled={meta.current_page === 1}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(meta.current_page - 1)}
                disabled={meta.current_page === 1}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {renderPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-3 py-2 text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${
                      meta.current_page === page
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(meta.last_page)}
                disabled={meta.current_page === meta.last_page}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReport;





/*
import React, { useState } from "react";
import {
  getAttendanceRecords,
  getMonthlyAttendanceRecords,
  updateAttendanceApprovalStatus,
} from "@services/Reports/AttendanceReportService";
import {
  Calendar,
  Search,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
} from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

const AttendanceReport = () => {
  const [reportType, setReportType] = useState("date");
  const [date, setDate] = useState("");
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const monthVal = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${monthVal}-${day}`;
  };

  const fetchReport = async (page = 1) => {
    if (reportType === "date" && !date) {
      Swal.fire({
        icon: "warning",
        title: "Date Required",
        text: "Please select a date to generate the report",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (reportType === "month" && !month) {
      Swal.fire({
        icon: "warning",
        title: "Month Required",
        text: "Please select a month to generate the report",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      setLoading(true);

      const res =
        reportType === "date"
          ? await getAttendanceRecords({
              date,
              page,
              per_page: perPage,
              search,
            })
          : await getMonthlyAttendanceRecords({
              month,
              page,
              per_page: perPage,
              search,
            });

      setData(res.data || []);
      setMeta({
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
        total: res.total || 0,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Failed to Fetch Report",
        text: e.response?.data?.message || e.message,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalStatusChange = async (row, newStatus) => {
    const oldStatus = row.approval_status || "Pending";

    try {
      setStatusUpdatingId(row.id);

      setData((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, approval_status: newStatus } : item
        )
      );

      await updateAttendanceApprovalStatus({
        employeeId: row.employee_id,
        date: row.date,
        approval_status: newStatus,
      });

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Approval status updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      setData((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, approval_status: oldStatus } : item
        )
      );

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: e.response?.data?.message || e.message,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const exportToExcel = async () => {
    if (reportType === "date" && !date) {
      Swal.fire({
        icon: "warning",
        title: "Date Required",
        text: "Please select a date first",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (reportType === "month" && !month) {
      Swal.fire({
        icon: "warning",
        title: "Month Required",
        text: "Please select a month first",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (data.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Data",
        text: "Generate the report first to export",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      setExporting(true);

      let allData = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const res =
          reportType === "date"
            ? await getAttendanceRecords({
                date,
                page: currentPage,
                per_page: 100,
                search,
              })
            : await getMonthlyAttendanceRecords({
                month,
                page: currentPage,
                per_page: 100,
                search,
              });

        allData = allData.concat(res.data || []);
        lastPage = res.last_page || 1;
        currentPage++;
      } while (currentPage <= lastPage);

      if (allData.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No Records",
          text: "No data available to export",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      const exportData = allData.map((r, idx) => ({
        "No.": idx + 1,
        "EMP No": r.empNo || "-",
        Name: r.name || "-",
        Company: r.company || "-",
        Department: r.department || "-",
        "Sub Department": r.sub_department || "-",
        Date: r.date_label ? `${r.date || "-"} (${r.date_label})` : r.date || "-",
        "IN Time": r.in_label
          ? `${r.in_time || "-"} (${r.in_label})`
          : r.in_time || "-",
        "OUT Time": r.out_label
          ? `${r.out_time || "-"} (${r.out_label})`
          : r.out_time || "-",
        Status: r.status || "Present",
        "Late Day No": r.late_day_number || "-",
        "Late Action": r.is_grace_period_late ? "Pending" : (r.late_policy_action || "-"),
        "Monthly Late Count": r.monthly_late_count ?? "-",
        // Excel එකෙත් 30 min අයට විතරක් Approval පෙන්නනවා
        Approval: r.is_grace_period_late ? (r.approval_status || "Pending") : "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

      const maxWidth = exportData.reduce((w, r) => {
        Object.keys(r).forEach((key) => {
          const len = String(r[key]).length;
          w[key] = Math.max(w[key] || 10, len);
        });
        return w;
      }, {});

      ws["!cols"] = Object.keys(maxWidth).map((key) => ({
        wch: maxWidth[key] + 2,
      }));

      XLSX.writeFile(
        wb,
        reportType === "date"
          ? `Attendance_Report_${date}.xlsx`
          : `Attendance_Report_${month}.xlsx`
      );

      Swal.fire({
        icon: "success",
        title: "Exported Successfully",
        text: `${allData.length} records exported`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: e.response?.data?.message || e.message || "Failed to export data",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setExporting(false);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= meta.last_page) {
      fetchReport(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const { current_page, last_page } = meta;

    pages.push(1);

    let start = Math.max(2, current_page - 1);
    let end = Math.min(last_page - 1, current_page + 1);

    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < last_page - 1) pages.push("...");
    if (last_page > 1) pages.push(last_page);

    return pages;
  };

  const clearFilters = () => {
    setDate("");
    setMonth("");
    setSearch("");
    setPerPage(15);
    setData([]);
    setMeta({ current_page: 1, last_page: 1, total: 0 });
  };

  const getApprovalSelectClass = (status) => {
    switch (status) {
      case "Active":
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      case "Rejected":
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-300";
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-300";
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Users className="w-8 h-8 text-blue-600" />
          Attendance Report
        </h1>
        <p className="text-slate-600">Daily and monthly attendance reporting</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white"
            >
              <option value="date">By Date</option>
              <option value="month">By Month</option>
            </select>
          </div>

          {reportType === "date" ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Select Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={getTodayDate()}
                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Select Month
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                max={getTodayDate().slice(0, 7)}
                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search Employee
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, NIC or EMP No"
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Records Per Page
            </label>
            <select
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              {[10, 15, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} records
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchReport(1)}
              disabled={loading}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? "Loading..." : "Generate"}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl border border-gray-300 hover:bg-gray-200 transition-all font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <div className="text-sm font-semibold text-slate-700">
            Showing{" "}
            <span className="text-blue-600">
              {meta.total === 0 ? 0 : (meta.current_page - 1) * perPage + 1}
            </span>{" "}
            to{" "}
            <span className="text-blue-600">
              {Math.min(meta.current_page * perPage, meta.total)}
            </span>{" "}
            of <span className="text-blue-600">{meta.total || 0}</span> records
          </div>

          <button
            onClick={exportToExcel}
            disabled={exporting || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
          >
            {exporting ? (
              "Exporting..."
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                Export to Excel
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-200">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">EMP No</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Employee Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Company</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Department</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Sub Department</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">IN Time</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">OUT Time</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
             
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider"> BEFore 30 minits LATE Approval</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={19} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-600 font-medium">Loading report...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={19} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium mb-1">No attendance records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{r.empNo || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium">{r.name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.company || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.department || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.sub_department || "-"}</td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{r.date || "-"}</div>
                      {r.date_label && (
                        <div className="mt-1 text-xs font-semibold text-purple-600">
                          {r.date_label}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-slate-700">{r.in_time || "-"}</div>
                      {r.in_label && (
                        <div className="mt-1 text-xs font-semibold text-orange-600">
                          {r.in_label}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-slate-700">{r.out_time || "-"}</div>
                      {r.out_label && (
                        <div className="mt-1 text-xs font-semibold text-yellow-600">
                          {r.out_label}
                        </div>
                      )}
                    </td>


                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {r.status || "Present"}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      {r.is_grace_period_late ? (
                        <select
                          value={r.approval_status || "Pending"}
                          disabled={statusUpdatingId === r.id}
                          onChange={(e) => handleApprovalStatusChange(r, e.target.value)}
                          className={`px-3 py-2 rounded-lg border text-sm font-semibold outline-none min-w-[130px] disabled:opacity-60 ${getApprovalSelectClass(
                            r.approval_status || "Pending"
                          )}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Active">Active</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta.last_page > 1 && !loading && (
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(1)}
                disabled={meta.current_page === 1}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(meta.current_page - 1)}
                disabled={meta.current_page === 1}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {renderPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-3 py-2 text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${
                      meta.current_page === page
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(meta.last_page)}
                disabled={meta.current_page === meta.last_page}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReport;
*/



