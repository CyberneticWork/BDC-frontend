import React, { useState } from "react";
import { getAttendanceRecords } from "@services/Reports/AttendanceReportService";
import { Calendar, Search, FileSpreadsheet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users } from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

const AttendanceReport = () => {
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchReport = async (page = 1) => {
    if (!date) {
      Swal.fire({ 
        icon: "warning", 
        title: "Date Required", 
        text: "Please select a date to generate the report",
        confirmButtonColor: "#3b82f6"
      });
      return;
    }
    try {
      setLoading(true);
      const res = await getAttendanceRecords({ date, page, per_page: perPage, search });
      setData(res.data || []);
      setMeta({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
      });
    } catch (e) {
      Swal.fire({ 
        icon: "error", 
        title: "Failed to Fetch Report", 
        text: e.message,
        confirmButtonColor: "#3b82f6"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!date) {
      Swal.fire({ 
        icon: "warning", 
        title: "Date Required", 
        text: "Please select a date first",
        confirmButtonColor: "#3b82f6"
      });
      return;
    }
    if (data.length === 0) {
      Swal.fire({ 
        icon: "info", 
        title: "No Data", 
        text: "Generate the report first to export",
        confirmButtonColor: "#3b82f6"
      });
      return;
    }

    try {
      setExporting(true);
      
      // Fetch all records by looping through pages (max per_page = 100)
      let allData = [];
      let currentPage = 1;
      let lastPage = 1;
      
      do {
        const res = await getAttendanceRecords({ 
          date, 
          page: currentPage, 
          per_page: 100, 
          search 
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
          confirmButtonColor: "#3b82f6"
        });
        return;
      }

      // Format data for Excel
      const exportData = allData.map((r, idx) => ({
        "No.": idx + 1,
        "EMP No": r.empNo || "-",
        "Name": r.name || "-",
        "Company": r.company || "-",
        "Department": r.department || "-",
        "Sub Department": r.sub_department || "-",
        "Date": r.date || "-",
        "IN Time": r.in_time || "-",
        "OUT Time": r.out_time || "-",
        "Status": r.status || "-",
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

      // Auto-size columns
      const maxWidth = exportData.reduce((w, r) => {
        Object.keys(r).forEach((key) => {
          const len = String(r[key]).length;
          w[key] = Math.max(w[key] || 10, len);
        });
        return w;
      }, {});
      ws["!cols"] = Object.keys(maxWidth).map((key) => ({ wch: maxWidth[key] + 2 }));

      // Save file
      XLSX.writeFile(wb, `Attendance_Report_${date}.xlsx`);

      Swal.fire({
        icon: "success",
        title: "Exported Successfully",
        text: `${allData.length} records exported`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error("Export error:", e);
      Swal.fire({ 
        icon: "error", 
        title: "Export Failed", 
        text: e.response?.data?.message || e.message || "Failed to export data",
        confirmButtonColor: "#3b82f6"
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
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    let start = Math.max(2, current_page - 1);
    let end = Math.min(last_page - 1, current_page + 1);
    
    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push('...');
    }
    
    // Add pages around current
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (end < last_page - 1) {
      pages.push('...');
    }
    
    // Always show last page if there's more than one page
    if (last_page > 1) {
      pages.push(last_page);
    }
    
    return pages;
  };

  // Add this helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // NEW: Clear Filters
  const clearFilters = () => {
    setDate("");
    setSearch("");
    setPerPage(15);
    setData([]);
    setMeta({ current_page: 1, last_page: 1, total: 0 });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Users className="w-8 h-8 text-blue-600" />
          Attendance Report
        </h1>
        <p className="text-slate-600">View employees who marked attendance (IN/OUT/Early OUT) for a specific date</p>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option key={n} value={n}>{n} records</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchReport(1)}
              disabled={loading}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading...
                </>
              ) : (
                "Generate"
              )}
            </button>
            {/* NEW: Clear Filters button */}
            <button
              type="button"
              onClick={clearFilters}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl border border-gray-300 hover:bg-gray-200 transition-all font-semibold"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="text-sm font-semibold text-slate-700">
              Showing <span className="text-blue-600">{((meta.current_page - 1) * perPage) + 1}</span> to{" "}
              <span className="text-blue-600">{Math.min(meta.current_page * perPage, meta.total)}</span> of{" "}
              <span className="text-blue-600">{meta.total || 0}</span> records
            </div>
          </div>
          
          <button
            onClick={exportToExcel}
            disabled={exporting || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
          >
            {exporting ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exporting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                Export to Excel
              </>
            )}
          </button>
        </div>

        {/* Table */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-600 font-medium">Loading report...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium mb-1">No attendance records found</p>
                      <p className="text-slate-500 text-sm">Select a date and click Generate to view the report</p>
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
                    <td className="px-6 py-4 text-sm text-slate-600">{r.date || "-"}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-700">{r.in_time || "-"}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-700">{r.out_time || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {r.status || "Present"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        {meta.last_page > 1 && !loading && (
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(1)}
                disabled={meta.current_page === 1}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(meta.current_page - 1)}
                disabled={meta.current_page === 1}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {renderPageNumbers().map((page, idx) => (
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-3 py-2 text-slate-400">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm
                      ${meta.current_page === page
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(meta.last_page)}
                disabled={meta.current_page === meta.last_page}
                className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                title="Last Page"
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