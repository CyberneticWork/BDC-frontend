import React, { useEffect, useState } from "react";
import { FileSpreadsheet, Search, Clock3 } from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { fetchCompanies, fetchDepartments } from "@services/ApiDataService";
import contractAttendanceReportService from "@services/contractAttendanceReportService";
import DatePickerInput from "@components/DatePickerInput";

const todayIso = () => new Date().toISOString().slice(0, 10);

const hoursCell = (value) => {
  const n = Number(value || 0);
  if (!n) return "";
  return n.toFixed(2);
};

const ContractAttendanceReport = () => {
  const today = todayIso();
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    from_date: today,
    to_date: today,
    company_id: "",
    department_id: "",
    search: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [c, d] = await Promise.all([fetchCompanies(), fetchDepartments()]);
        setCompanies(Array.isArray(c) ? c : c?.data || []);
        setDepartments(Array.isArray(d) ? d : d?.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const loadData = async () => {
    if (!filters.from_date || !filters.to_date) {
      Swal.fire({ icon: "warning", title: "Select dates", text: "From date and To date are required." });
      return;
    }
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v != null)
      );
      const data = await contractAttendanceReportService.fetch(params);
      setRows(data.data || []);
      setTotals(data.totals || null);
    } catch (e) {
      Swal.fire({ icon: "error", title: "Load failed", text: e.response?.data?.message || e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportExcel = () => {
    if (!rows.length) {
      Swal.fire({ icon: "info", title: "No data", text: "Load the report before downloading." });
      return;
    }
    const sheetRows = rows.map((r) => ({
      "Emp No": r.emp_no,
      Name: r.employee_name,
      Company: r.company,
      Department: r.department,
      Type: r.employment_type || "",
      Date: r.date,
      IN: r.in_time || "",
      OUT: r.out_time || "",
      "Working Hours": hoursCell(r.working_hours),
    }));
    sheetRows.push({
      "Emp No": "",
      Name: "TOTAL",
      Company: "",
      Department: "",
      Type: "",
      Date: "",
      IN: "",
      OUT: "",
      "Working Hours": hoursCell(totals?.working_hours),
    });
    const ws = XLSX.utils.json_to_sheet(sheetRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contract Attendance");
    XLSX.writeFile(wb, `contract-attendance-${filters.from_date}_to_${filters.to_date}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock3 className="w-6 h-6 text-indigo-600" /> Contract Time Attendance Report
        </h1>
        <p className="text-gray-600 text-sm">
          Check-in, check-out, and working hours for contract employees only.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow border p-4 mb-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <DatePickerInput
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.from_date}
          onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
        />
        <DatePickerInput
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.to_date}
          onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.company_id}
          onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.department_id}
          onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Search employee"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
          >
            <Search className="w-4 h-4" /> Load
          </button>
          <button onClick={exportExcel} className="px-3 py-2 bg-green-600 text-white rounded-lg">
            <FileSpreadsheet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">Contract employees</p>
            <p className="text-xl font-bold text-slate-800">{totals.employees || 0}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">Punch records</p>
            <p className="text-xl font-bold text-slate-800">{totals.records || 0}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">Total working hours</p>
            <p className="text-xl font-bold text-emerald-700 font-mono">
              {totals.working_hours_label || hoursCell(totals.working_hours) || "0:00"}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading contract attendance…</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left">Emp No</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">IN</th>
                <th className="p-3 text-left">OUT</th>
                <th className="p-3 text-right">Working Hours</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-semibold">{r.emp_no}</td>
                    <td className="p-3">{r.employee_name}</td>
                    <td className="p-3">{r.department || "—"}</td>
                    <td className="p-3 whitespace-nowrap">{r.date}</td>
                    <td className="p-3 font-mono text-emerald-800">{r.in_time || "—"}</td>
                    <td className="p-3 font-mono text-rose-800">{r.out_time || "—"}</td>
                    <td className="p-3 text-right font-mono font-bold text-indigo-800">
                      {r.working_hours_label || hoursCell(r.working_hours) || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-slate-500">
                    No contract attendance found for this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ContractAttendanceReport;
