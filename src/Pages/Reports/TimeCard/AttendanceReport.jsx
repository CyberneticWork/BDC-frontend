import React, { useState } from "react";
import {
  getAttendanceRecords,
  getMonthlyAttendanceRecords,
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
  CheckCircle,
  XCircle,
  Clock,
  FileDown,
} from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const AttendanceReport = ({ employeeProfile }) => {
  const [reportType, setReportType] = useState("date"); // date | month
  const [date, setDate] = useState("");
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, earlyOut: 0, total: 0 });

  // Auto-fill employee number and generate report if logged in as employee
  React.useEffect(() => {
    if (employeeProfile?.attendance_employee_no) {
      const today = getTodayDate();
      const currentMonth = today.slice(0, 7); // YYYY-MM format
      
      setReportType("month");
      setMonth(currentMonth);
      setSearch(employeeProfile.attendance_employee_no);
      
      setTimeout(() => {
        fetchMonthlyReportWithParams(1, currentMonth, employeeProfile.attendance_employee_no);
      }, 500);
    }
  }, [employeeProfile]);

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

    await fetchReportWithParams(page, date, search);
  };

  const fetchReportWithParams = async (page, dateParam, searchParam) => {
    try {
      setLoading(true);

      const res =
        reportType === "date"
          ? await getAttendanceRecords({
              date: dateParam,
              page,
              per_page: perPage,
              search: searchParam,
            })
          : await getMonthlyAttendanceRecords({
              month,
              page,
              per_page: perPage,
              search: searchParam,
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

  const fetchMonthlyReportWithParams = async (page, monthParam, searchParam) => {
    try {
      setLoading(true);

      const res = await getMonthlyAttendanceRecords({
        month: monthParam,
        page,
        per_page: perPage,
        search: searchParam,
      });

      setData(res.data || []);
      setMeta({
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
        total: res.total || 0,
      });
      
      // Calculate summary from all data
      calculateSummary(res.data || []);
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

  const calculateSummary = (records) => {
    const present = records.filter(r => r.status === 'Present' || !r.status).length;
    const absent = records.filter(r => r.status === 'Absent' || r.status === 'NPL').length;
    const late = records.filter(r => r.in_label && r.in_label.includes('Late')).length;
    const earlyOut = records.filter(r => r.out_label && r.out_label.includes('Early')).length;
    
    setSummary({ present, absent, late, earlyOut, total: records.length });
  };

  const exportToPDF = async () => {
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
      setExportingPDF(true);

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

      // Calculate summary for PDF
      const pdfSummary = {
        present: allData.filter(r => r.status === 'Present' || !r.status).length,
        absent: allData.filter(r => r.status === 'Absent' || r.status === 'NPL').length,
        late: allData.filter(r => r.in_label && r.in_label.includes('Late')).length,
        earlyOut: allData.filter(r => r.out_label && r.out_label.includes('Early')).length,
        total: allData.length
      };

      const doc = new jsPDF("landscape");
      
      // Header with gradient effect (simulated with blue color)
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 297, 35, 'F');
      
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("Attendance Report", 14, 15);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const reportInfo = reportType === "date" ? `Date: ${date}` : `Month: ${month}`;
      doc.text(reportInfo, 14, 23);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 29);

      // Summary Section
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.setFont(undefined, 'bold');
      doc.text("Summary", 14, 45);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Summary boxes
      const summaryY = 50;
      const boxWidth = 50;
      const boxHeight = 20;
      const spacing = 5;
      
      // Total Records - Blue
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(14, summaryY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("Total Records", 17, summaryY + 7);
      doc.setFontSize(14);
      doc.text(String(pdfSummary.total), 17, summaryY + 15);
      
      // Present - Green
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(14 + boxWidth + spacing, summaryY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(10);
      doc.text("Present", 17 + boxWidth + spacing, summaryY + 7);
      doc.setFontSize(14);
      doc.text(String(pdfSummary.present), 17 + boxWidth + spacing, summaryY + 15);
      
      // Absent - Red
      doc.setFillColor(239, 68, 68);
      doc.roundedRect(14 + (boxWidth + spacing) * 2, summaryY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(10);
      doc.text("Absent", 17 + (boxWidth + spacing) * 2, summaryY + 7);
      doc.setFontSize(14);
      doc.text(String(pdfSummary.absent), 17 + (boxWidth + spacing) * 2, summaryY + 15);
      
      // Late - Yellow
      doc.setFillColor(234, 179, 8);
      doc.roundedRect(14 + (boxWidth + spacing) * 3, summaryY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(10);
      doc.text("Late", 17 + (boxWidth + spacing) * 3, summaryY + 7);
      doc.setFontSize(14);
      doc.text(String(pdfSummary.late), 17 + (boxWidth + spacing) * 3, summaryY + 15);
      
      // Early Out - Orange
      doc.setFillColor(249, 115, 22);
      doc.roundedRect(14 + (boxWidth + spacing) * 4, summaryY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(10);
      doc.text("Early Out", 17 + (boxWidth + spacing) * 4, summaryY + 7);
      doc.setFontSize(14);
      doc.text(String(pdfSummary.earlyOut), 17 + (boxWidth + spacing) * 4, summaryY + 15);

      // Attendance Records Table
      const tableData = allData.map((r, idx) => [
        idx + 1,
        r.empNo || "-",
        r.name || "-",
        r.company || "-",
        r.department || "-",
        r.sub_department || "-",
        r.date_label ? `${r.date || "-"}\n(${r.date_label})` : (r.date || "-"),
        r.in_label ? `${r.in_time || "-"}\n(${r.in_label})` : (r.in_time || "-"),
        r.out_label ? `${r.out_time || "-"}\n(${r.out_label})` : (r.out_time || "-"),
        r.status || "Present",
      ]);

      doc.autoTable({
        startY: summaryY + boxHeight + 10,
        head: [[
          "No.",
          "EMP No",
          "Name",
          "Company",
          "Department",
          "Sub Dept",
          "Date",
          "IN Time",
          "OUT Time",
          "Status",
        ]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 20 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 },
          7: { cellWidth: 25 },
          8: { cellWidth: 25 },
          9: { cellWidth: 20, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });

      doc.save(
        reportType === "date"
          ? `Attendance_Report_${date}.pdf`
          : `Attendance_Report_${month}.pdf`
      );

      Swal.fire({
        icon: "success",
        title: "Exported Successfully",
        text: `${allData.length} records exported to PDF`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: e.response?.data?.message || e.message || "Failed to export PDF",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setExportingPDF(false);
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

      /*
      const exportData = allData.map((r, idx) =>
        reportType === "date"
          ? {
              "No.": idx + 1,
              "EMP No": r.empNo || "-",
              Name: r.name || "-",
              Company: r.company || "-",
              Department: r.department || "-",
              "Sub Department": r.sub_department || "-",
              Date: r.date || "-",
              "IN Time": r.in_label
                ? `${r.in_time || "-"} (${r.in_label})`
                : r.in_time || "-",
              "OUT Time": r.out_label
                ? `${r.out_time || "-"} (${r.out_label})`
                : r.out_time || "-",
              Status: r.status || "Present",
            }
          : {
              "No.": idx + 1,
              "EMP No": r.empNo || "-",
              Name: r.name || "-",
              Company: r.company || "-",
              Department: r.department || "-",
              "Sub Department": r.sub_department || "-",
              Month: r.month || "-",
              "Present Dates":
                r.present_dates?.map((d) => new Date(d).getDate()).join(", ") || "-",
              "Present Count": r.present_count ?? 0,
            }
              */

            const exportData = allData.map((r, idx) => ({
  "No.": idx + 1,
  "EMP No": r.empNo || "-",
  "Name": r.name || "-",
  "Company": r.company || "-",
  "Department": r.department || "-",
  "Sub Department": r.sub_department || "-",
  //"Date": r.date || "-",
  "Date": r.date_label ? `${r.date || "-"} (${r.date_label})` : (r.date || "-"),
  "IN Time": r.in_label ? `${r.in_time || "-"} (${r.in_label})` : (r.in_time || "-"),
  "OUT Time": r.out_label ? `${r.out_time || "-"} (${r.out_label})` : (r.out_time || "-"),
  "Status": r.status || "Present",
})
      );

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

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Users className="w-8 h-8 text-white" />
          Attendance Report
        </h1>
        <p className="text-blue-100">
          Daily and monthly attendance reporting
        </p>
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

      {/* Summary Cards */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Total Records</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total}</p>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Present</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{summary.present}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Absent</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{summary.absent}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Late</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{summary.late}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Early Out</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{summary.earlyOut}</p>
              </div>
              <Clock className="h-10 w-10 text-orange-500" />
            </div>
          </div>
        </div>
      )}

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

          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              disabled={exporting || data.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
            >
              {exporting ? "Exporting..." : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Excel
                </>
              )}
            </button>
            
            <button
              onClick={exportToPDF}
              disabled={exportingPDF || data.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl shadow hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
            >
              {exportingPDF ? "Exporting..." : (
                <>
                  <FileDown className="w-4 h-4" />
                  Export PDF
                </>
              )}
            </button>
          </div>
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
    {/*<td className="px-6 py-4 text-sm text-slate-600">{r.date || "-"}</td>*/}

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
  </tr>
)))}
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
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Users className="w-8 h-8 text-blue-600" />
          Attendance Report
        </h1>
        <p className="text-slate-600">View employees who marked attendance (IN/OUT/Early OUT) for a specific date</p>
      </div>

     
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

      
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
       
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
*/