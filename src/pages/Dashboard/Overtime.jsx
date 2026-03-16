import React, { useState, useEffect } from "react";
import { Clock, Search, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { fetchTimeCards, approveOt } from "@services/OverTimeService";
import { fetchCompanies } from "@services/ApiDataService";
import Swal from "sweetalert2";
import * as XLSX from "xlsx"; // අලුතින් එකතු කළා

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  if (currentPage <= 3) end = Math.min(5, totalPages);
  if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex justify-center items-center gap-1 mt-4 mb-4">
      <button
        className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
        }`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {start > 1 && (
        <>
          <button
            className="px-3 py-1 rounded-lg font-medium bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {start > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
            page === currentPage
              ? "bg-blue-600 text-white shadow"
              : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
          }`}
          onClick={() => onPageChange(page)}
          disabled={page === currentPage}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <button
            className="px-3 py-1 rounded-lg font-medium bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
        }`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

const Overtime = () => {
  const [timeData, setTimeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false); // අලුතින් එකතු කළා

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(9);

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchEmpId, setSearchEmpId] = useState("");

  const formatDecimalHours = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    const num = parseFloat(val);
    if (isNaN(num)) return "-";

    const sign = num < 0 ? "-" : "";
    const abs = Math.abs(num);

    let hours = Math.floor(abs);
    let minutes = Math.round((abs - hours) * 60);

    if (minutes === 60) {
      hours += 1;
      minutes = 0;
    }

    return `${sign}${hours}h ${String(minutes).padStart(2, "0")}m`;
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return "-";
    const num = parseFloat(val);
    if (isNaN(num)) return "-";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const computeTotalOt = (row) => {
    const a = parseFloat(row.morning_ot || 0) || 0;
    const b = parseFloat(row.evening_ot || row.afternoon_ot || 0) || 0;
    const c = parseFloat(row.morning_ot_special || 0) || 0;
    const d = parseFloat(row.evening_ot_special || 0) || 0;
    return formatDecimalHours(a + b + c + d);
  };

  useEffect(() => {
    fetchOvertimeData();
    (async () => {
      try {
        const comps = await fetchCompanies();
        setCompanies(Array.isArray(comps) ? comps : []);
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    })();
  }, []);

  useEffect(() => {
    let data = [...timeData];

    if (selectedCompany) {
      data = data.filter(
        (r) =>
          r.company_id?.toString() === selectedCompany?.toString() ||
          r.company_name === selectedCompany
      );
    }

    if (selectedDate) {
      data = data.filter((r) => (r.date || "").slice(0, 10) === selectedDate);
    }

    if (selectedMonth) {
      data = data.filter((r) => {
        const rowDate = r.date || "";
        return rowDate.slice(0, 7) === selectedMonth;
      });
    }

    if (searchEmpId.trim() !== "") {
      const searchStr = searchEmpId.toLowerCase().trim();
      data = data.filter((r) => {
        const empNo = (r.employee_no || r.employee_id || "").toString().toLowerCase();
        return empNo.includes(searchStr);
      });
    }

    setFilteredData(data);
  }, [timeData, selectedCompany, selectedDate, selectedMonth, searchEmpId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length]);

  const fetchOvertimeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTimeCards();

      if (Array.isArray(data)) {
        setTimeData(data);
        setFilteredData(data);
      } else if (data && Array.isArray(data.data)) {
        setTimeData(data.data);
        setFilteredData(data.data);
      } else {
        setError("Data received in unexpected format");
        setTimeData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load overtime data");
      setTimeData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id, sts) => {
    try {
      await approveOt(id, sts);
      fetchOvertimeData();
    } catch (error) {
      console.error("Error approving overtime:", error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setTimeData((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));

    try {
      await handleApprove(id, newStatus);
    } catch (err) {
      console.error("Failed to change status:", err);
      fetchOvertimeData();
    }
  };

  // ==========================================
  // Excel Export Logic අලුතින් එකතු කළා
  // ==========================================
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Data",
        text: "There is no data to export.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setExporting(true);
    try {
      const exportData = filteredData.map((row, index) => ({
        "No.": index + 1,
        "EMP No": row.employee_no || row.employee_id || "-",
        "Name": row.employee_name || "-",
        "Date": row.date || "-",
        "Shift Start": row.shift_start || "-",
        "IN Time": row.in_time || "-",
        "Shift End": row.shift_end || "-",
        "OUT Time": row.out_time || "-",
        "Working Hours": formatDecimalHours(row.working_hours),
        "Morning OT": formatDecimalHours(row.morning_ot),
        "Evening OT": formatDecimalHours(row.evening_ot ?? row.afternoon_ot),
        "Holiday OT": formatDecimalHours(row.holiday_ot_hours),
        "Total OT": row.total_ot ? formatDecimalHours(row.total_ot) : computeTotalOt(row),
        "Special OT": formatDecimalHours(
          (parseFloat(row.morning_ot_special || 0) || 0) +
          (parseFloat(row.evening_ot_special || 0) || 0)
        ),
        "Total OT Amount": formatCurrency(
          parseFloat(row.holiday_ot_amount || 0) > 0
            ? row.holiday_ot_amount
            : row.total_ot_amount
        ),
        "Status": row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "Pending",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Overtime Report");

      // Auto size columns
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

      let fileName = "Overtime_Report";
      if (selectedMonth) fileName += `_${selectedMonth}`;
      else if (selectedDate) fileName += `_${selectedDate}`;
      fileName += ".xlsx";

      XLSX.writeFile(wb, fileName);

      Swal.fire({
        icon: "success",
        title: "Exported Successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Export error:", error);
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: "Failed to generate Excel file.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setExporting(false);
    }
  };
  // ==========================================

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const handleCompanyChange = (e) => setSelectedCompany(e.target.value);
  
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedMonth(""); 
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setSelectedDate(""); 
  };

  const handleClearFilters = () => {
    setSelectedCompany("");
    setSelectedDate("");
    setSelectedMonth("");
    setSearchEmpId("");
    setFilteredData(timeData);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-800 to-blue-600 bg-clip-text text-transparent">
                  Overtime Management System
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and approve employee overtime hours efficiently
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Emp ID..."
                  value={searchEmpId}
                  onChange={(e) => setSearchEmpId(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm bg-white w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedCompany}
                onChange={handleCompanyChange}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id || c} value={c.id ?? c.name}>
                    {c.name ?? c}
                  </option>
                ))}
              </select>

              <input
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                title="Filter by Month"
                className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <span className="text-sm text-gray-500 font-medium">OR</span>

              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                title="Filter by Specific Date"
                className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition"
              >
                Clear
              </button>

              {/* අලුත් Export to Excel Button එක */}
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exporting || filteredData.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md text-sm font-medium hover:from-green-700 hover:to-green-800 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {exporting ? (
                  "Exporting..."
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" /> Export
                  </>
                )}
              </button>

            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">EMP No</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Shift start</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">IN Time</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Shift End</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">OUT Time</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Working Hours</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Morning OT</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Evening OT</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Holiday OT</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total OT</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Special OT</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total OT Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Approve OT</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white/50 divide-y divide-gray-100">
                    {currentRows.length === 0 ? (
                      <tr>
                        <td colSpan="15" className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center space-y-2">
                            <Search className="h-8 w-8 text-gray-300" />
                            <span className="text-sm text-gray-500">No matching records found</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentRows.map((row) => (
                        <tr
                          key={row.id}
                          className="transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {row.employee_no || row.employee_id || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.employee_name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {row.date || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {row.shift_start || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {row.in_time || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                            {row.shift_end || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span>{row.out_time || "-"}</span>
                              {row.out_time &&
                                (row.is_cross_day ||
                                  (row.actual_date && row.date && row.actual_date !== row.date)) && (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                    Cross-day
                                  </span>
                                )}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                            {formatDecimalHours(row.working_hours)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {formatDecimalHours(row.morning_ot)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {formatDecimalHours(row.evening_ot ?? row.afternoon_ot)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {formatDecimalHours(row.holiday_ot_hours)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                            {row.total_ot ? formatDecimalHours(row.total_ot) : computeTotalOt(row)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                            {formatDecimalHours(
                              (parseFloat(row.morning_ot_special || 0) || 0) +
                              (parseFloat(row.evening_ot_special || 0) || 0)
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            {formatCurrency(
                              parseFloat(row.holiday_ot_amount || 0) > 0
                                ? row.holiday_ot_amount
                                : row.total_ot_amount
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium ${
                                  row.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : row.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {row.status
                                  ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
                                  : "Pending"}
                              </span>

                              <select
                                value={row.status || "pending"}
                                onChange={(e) => handleStatusChange(row.id, e.target.value)}
                                className="ml-1 px-2 py-1 border border-gray-200 rounded-md text-sm bg-white focus:outline-none"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approve</option>
                                <option value="rejected">Reject</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredData.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstRow + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(indexOfLastRow, filteredData.length)}
                      </span>{" "}
                      of <span className="font-medium">{filteredData.length}</span> records
                    </div>

                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overtime;






/*
import React, { useState, useEffect } from "react";
import { Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchTimeCards, approveOt } from "@services/OverTimeService";
import { fetchCompanies } from "@services/ApiDataService";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  if (currentPage <= 3) end = Math.min(5, totalPages);
  if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex justify-center items-center gap-1 mt-4 mb-4">
      <button
        className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
        }`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {start > 1 && (
        <>
          <button
            className="px-3 py-1 rounded-lg font-medium bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {start > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
            page === currentPage
              ? "bg-blue-600 text-white shadow"
              : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
          }`}
          onClick={() => onPageChange(page)}
          disabled={page === currentPage}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <button
            className="px-3 py-1 rounded-lg font-medium bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
        }`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

const Overtime = () => {
  const [timeData, setTimeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(9);

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  
  // අලුත් state දෙක (Month සහ Employee ID)
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchEmpId, setSearchEmpId] = useState("");

  const formatDecimalHours = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    const num = parseFloat(val);
    if (isNaN(num)) return "-";

    const sign = num < 0 ? "-" : "";
    const abs = Math.abs(num);

    let hours = Math.floor(abs);
    let minutes = Math.round((abs - hours) * 60);

    if (minutes === 60) {
      hours += 1;
      minutes = 0;
    }

    return `${sign}${hours}h ${String(minutes).padStart(2, "0")}m`;
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return "-";
    const num = parseFloat(val);
    if (isNaN(num)) return "-";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const computeTotalOt = (row) => {
    const a = parseFloat(row.morning_ot || 0) || 0;
    const b = parseFloat(row.evening_ot || row.afternoon_ot || 0) || 0;
    const c = parseFloat(row.morning_ot_special || 0) || 0;
    const d = parseFloat(row.evening_ot_special || 0) || 0;
    return formatDecimalHours(a + b + c + d);
  };

  useEffect(() => {
    fetchOvertimeData();
    (async () => {
      try {
        const comps = await fetchCompanies();
        setCompanies(Array.isArray(comps) ? comps : []);
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    })();
  }, []);

  // Filter Logic එක Update කරලා තියෙනවා (Date, Month, Company, Emp ID)
  useEffect(() => {
    let data = [...timeData];

    // 1. Company Filter
    if (selectedCompany) {
      data = data.filter(
        (r) =>
          r.company_id?.toString() === selectedCompany?.toString() ||
          r.company_name === selectedCompany
      );
    }

    // 2. Specific Date Filter
    if (selectedDate) {
      data = data.filter((r) => (r.date || "").slice(0, 10) === selectedDate);
    }

    // 3. Month Filter (YYYY-MM)
    if (selectedMonth) {
      data = data.filter((r) => {
        const rowDate = r.date || "";
        return rowDate.slice(0, 7) === selectedMonth;
      });
    }

    // 4. Employee ID Filter
    if (searchEmpId.trim() !== "") {
      const searchStr = searchEmpId.toLowerCase().trim();
      data = data.filter((r) => {
        const empNo = (r.employee_no || r.employee_id || "").toString().toLowerCase();
        return empNo.includes(searchStr);
      });
    }

    setFilteredData(data);
  }, [timeData, selectedCompany, selectedDate, selectedMonth, searchEmpId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length]);

  const fetchOvertimeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTimeCards();

      if (Array.isArray(data)) {
        setTimeData(data);
        setFilteredData(data);
      } else if (data && Array.isArray(data.data)) {
        setTimeData(data.data);
        setFilteredData(data.data);
      } else {
        setError("Data received in unexpected format");
        setTimeData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load overtime data");
      setTimeData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id, sts) => {
    try {
      await approveOt(id, sts);
      fetchOvertimeData();
    } catch (error) {
      console.error("Error approving overtime:", error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setTimeData((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));

    try {
      await handleApprove(id, newStatus);
    } catch (err) {
      console.error("Failed to change status:", err);
      fetchOvertimeData();
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const handleCompanyChange = (e) => setSelectedCompany(e.target.value);
  
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedMonth(""); // Date එකක් තේරුවොත් Month එක හිස් කරනවා පටලැවෙන්නෙ නැති වෙන්න
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setSelectedDate(""); // Month එකක් තේරුවොත් Date එක හිස් කරනවා
  };

  const handleClearFilters = () => {
    setSelectedCompany("");
    setSelectedDate("");
    setSelectedMonth("");
    setSearchEmpId("");
    setFilteredData(timeData);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-800 to-blue-600 bg-clip-text text-transparent">
                  Overtime Management System
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and approve employee overtime hours efficiently
                </p>
              </div>
            </div>

           
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Emp ID..."
                  value={searchEmpId}
                  onChange={(e) => setSearchEmpId(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm bg-white w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedCompany}
                onChange={handleCompanyChange}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id || c} value={c.id ?? c.name}>
                    {c.name ?? c}
                  </option>
                ))}
              </select>

              <input
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                title="Filter by Month"
                className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <span className="text-sm text-gray-500 font-medium">OR</span>

              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                title="Filter by Specific Date"
                className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
              >
                Clear
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">EMP No</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Shift start</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">IN Time</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Shift End</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">OUT Time</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Working Hours</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Morning OT</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Evening OT</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Holiday OT</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total OT</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Special OT</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total OT Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Approve OT</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white/50 divide-y divide-gray-100">
                    {currentRows.length === 0 ? (
                      <tr>
                        <td colSpan="15" className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center space-y-2">
                            <Search className="h-8 w-8 text-gray-300" />
                            <span className="text-sm text-gray-500">No matching records found</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentRows.map((row) => (
                        <tr
                          key={row.id}
                          className="transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {row.employee_no || row.employee_id || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.employee_name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {row.date || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {row.shift_start || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {row.in_time || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                            {row.shift_end || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span>{row.out_time || "-"}</span>
                              {row.out_time &&
                                (row.is_cross_day ||
                                  (row.actual_date && row.date && row.actual_date !== row.date)) && (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                    Cross-day
                                  </span>
                                )}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                            {formatDecimalHours(row.working_hours)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {formatDecimalHours(row.morning_ot)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {formatDecimalHours(row.evening_ot ?? row.afternoon_ot)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {formatDecimalHours(row.holiday_ot_hours)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                            {row.total_ot ? formatDecimalHours(row.total_ot) : computeTotalOt(row)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                            {formatDecimalHours(
                              (parseFloat(row.morning_ot_special || 0) || 0) +
                              (parseFloat(row.evening_ot_special || 0) || 0)
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            {formatCurrency(
                              parseFloat(row.holiday_ot_amount || 0) > 0
                                ? row.holiday_ot_amount
                                : row.total_ot_amount
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium ${
                                  row.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : row.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {row.status
                                  ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
                                  : "Pending"}
                              </span>

                              <select
                                value={row.status || "pending"}
                                onChange={(e) => handleStatusChange(row.id, e.target.value)}
                                className="ml-1 px-2 py-1 border border-gray-200 rounded-md text-sm bg-white focus:outline-none"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approve</option>
                                <option value="rejected">Reject</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredData.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstRow + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(indexOfLastRow, filteredData.length)}
                      </span>{" "}
                      of <span className="font-medium">{filteredData.length}</span> records
                    </div>

                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overtime;

*/

