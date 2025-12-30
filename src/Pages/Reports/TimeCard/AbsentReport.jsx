import React, { useState, useEffect } from "react";
import { getAbsentRecords } from "@services/Reports/AbsentReportService";
import { Calendar, Search, Building2, Layers, FileSpreadsheet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, UserX } from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
// Load companies and departments (consistent with other pages)
import { fetchCompanies, fetchDepartmentsById } from "@services/ApiDataService";

const AbsentReport = () => {
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  // REPLACED: IDs as strings controlled by dropdowns
  const [companyId, setCompanyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  // Load companies on mount
  useEffect(() => {
    let mounted = true;
    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const comps = await fetchCompanies();
        if (!mounted) return;
        setCompanies(Array.isArray(comps) ? comps : []);
      } catch (err) {
        console.error("Failed to load companies:", err);
        Swal.fire({ icon: "error", title: "Error", text: "Failed to load companies" });
        setCompanies([]);
      } finally {
        if (mounted) setIsLoadingCompanies(false);
      }
    };
    loadCompanies();
    return () => { mounted = false; };
  }, []);

  // Load departments when company changes
  useEffect(() => {
    let mounted = true;
    const loadDepartments = async () => {
      if (!companyId) {
        setDepartments([]);
        setDepartmentId("");
        return;
      }
      setIsLoadingDepartments(true);
      try {
        const deps = await fetchDepartmentsById(companyId);
        if (!mounted) return;
        setDepartments(Array.isArray(deps) ? deps : []);
        // Reset department if no longer valid
        if (departmentId && !deps.some(d => String(d.id) === String(departmentId))) {
          setDepartmentId("");
        }
      } catch (err) {
        console.error("Failed to load departments:", err);
        setDepartments([]);
      } finally {
        if (mounted) setIsLoadingDepartments(false);
      }
    };
    loadDepartments();
    return () => { mounted = false; };
  }, [companyId]);

  const fetchReport = async (page = 1) => {
    if (!date) {
      Swal.fire({ icon: "warning", title: "Date Required", text: "Please select a date", confirmButtonColor: "#3b82f6" });
      return;
    }
    try {
      setLoading(true);
      const res = await getAbsentRecords({
        date,
        page,
        per_page: perPage,
        search,
        company_id: companyId || null,
        department_id: departmentId || null,
      });
      setData(res.data || []);
      setMeta({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed to Fetch", text: e.message, confirmButtonColor: "#3b82f6" });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!date) {
      Swal.fire({ icon: "warning", title: "Date Required", text: "Please select a date first", confirmButtonColor: "#3b82f6" });
      return;
    }
    if (data.length === 0) {
      Swal.fire({ icon: "info", title: "No Data", text: "Generate the report first to export", confirmButtonColor: "#3b82f6" });
      return;
    }

    try {
      setExporting(true);

      let allData = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const res = await getAbsentRecords({
          date,
          page: currentPage,
          per_page: 100,
          search,
          company_id: companyId || null,
          department_id: departmentId || null,
        });
        allData = allData.concat(res.data || []);
        lastPage = res.last_page || 1;
        currentPage++;
      } while (currentPage <= lastPage);

      if (allData.length === 0) {
        Swal.fire({ icon: "info", title: "No Records", text: "No data available to export", confirmButtonColor: "#3b82f6" });
        return;
      }

      const exportData = allData.map((r, idx) => ({
        "No.": idx + 1,
        "EMP No": r.empNo || "-",
        "Name": r.name || "-",
        "Company": r.company || "-",
        "Department": r.department || "-",
        "Sub Department": r.sub_department || "-",
        "Date": r.date || "-",
        "Status": r.status || "Absent",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Absent Report");

      const maxWidth = exportData.reduce((w, r) => {
        Object.keys(r).forEach((key) => {
          const len = String(r[key]).length;
          w[key] = Math.max(w[key] || 10, len);
        });
        return w;
      }, {});
      ws["!cols"] = Object.keys(maxWidth).map((key) => ({ wch: maxWidth[key] + 2 }));

      XLSX.writeFile(wb, `Absent_Report_${date}.xlsx`);

      Swal.fire({ icon: "success", title: "Exported Successfully", text: `${allData.length} records exported`, timer: 2000, showConfirmButton: false });
    } catch (e) {
      console.error("Export error:", e);
      Swal.fire({ icon: "error", title: "Export Failed", text: e.response?.data?.message || e.message || "Failed to export data", confirmButtonColor: "#3b82f6" });
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

  // Add this helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-red-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <UserX className="w-8 h-8 text-red-600" />
          Absent Report
        </h1>
        <p className="text-slate-600">Employees rostered on the selected date without attendance and not on approved leave</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" /> Select Date
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
              <Search className="w-4 h-4 inline mr-1" /> Search Employee
            </label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, NIC or EMP No" className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none" />
          </div>

          {/* Company dropdown */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-1" /> Company (optional)
            </label>
            <div className="relative">
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none appearance-none"
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {isLoadingCompanies && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* Department dropdown */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Layers className="w-4 h-4 inline mr-1" /> Department (optional)
            </label>
            <div className="relative">
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={!companyId || isLoadingDepartments}
                className={`w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none appearance-none ${
                  !companyId ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {isLoadingDepartments && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button onClick={() => fetchReport(1)} disabled={loading} className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 font-semibold">
              {loading ? <><div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Loading...</> : "Generate"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-red-50 border-b border-slate-200">
          <div className="text-sm font-semibold text-slate-700">
            Showing <span className="text-red-600">{((meta.current_page - 1) * perPage) + 1}</span> to <span className="text-red-600">{Math.min(meta.current_page * perPage, meta.total)}</span> of <span className="text-red-600">{meta.total || 0}</span> records
          </div>
          <button onClick={exportToExcel} disabled={exporting || data.length === 0} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 font-semibold text-sm">
            {exporting ? <><div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Exporting...</> : <><FileSpreadsheet className="w-4 h-4" />Export to Excel</>}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-red-50 border-b-2 border-slate-200">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">EMP No</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Employee Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Company</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Department</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Sub Department</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-600 font-medium">Loading report...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <UserX className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium mb-1">No absent records found</p>
                      <p className="text-slate-500 text-sm">Select a date and click Generate to view the report</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((r) => (
                  <tr key={r.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{r.empNo || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium">{r.name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.company || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.department || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.sub_department || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.date || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        {r.status || "Absent"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta.last_page > 1 && !loading && (
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-red-50 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <button onClick={() => goToPage(1)} disabled={meta.current_page === 1} className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition-all shadow-sm" title="First Page">
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button onClick={() => goToPage(meta.current_page - 1)} disabled={meta.current_page === 1} className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition-all shadow-sm" title="Previous Page">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {renderPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-3 py-2 text-slate-400">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${
                      meta.current_page === page
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => goToPage(meta.current_page + 1)} disabled={meta.current_page === meta.last_page} className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition-all shadow-sm" title="Next Page">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => goToPage(meta.last_page)} disabled={meta.current_page === meta.last_page} className="p-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition-all shadow-sm" title="Last Page">
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsentReport;