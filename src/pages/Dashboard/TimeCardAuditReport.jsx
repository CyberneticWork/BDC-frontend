import React, { useEffect, useState } from "react";
import { FileSpreadsheet, Search, ClipboardList } from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { fetchCompanies, fetchDepartments } from "@services/ApiDataService";
import timeCardApprovalService from "@services/timeCardApprovalService";

const formatValues = (values) => {
  if (!values || typeof values !== "object") return "";
  const parts = [];
  if (values.date) parts.push(`Date ${values.date}`);
  if (values.time) parts.push(`Time ${values.time}`);
  if (values.status) parts.push(values.status);
  if (values.approval_status) parts.push(`Status ${values.approval_status}`);
  return parts.join(" | ");
};

const TimeCardAuditReport = ({ defaultAction = "" }) => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    month: currentMonth,
    action: defaultAction,
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
    if (!filters.month) {
      Swal.fire({ icon: "warning", title: "Select month" });
      return;
    }
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v != null)
      );
      const data = defaultAction === "deleted"
        ? await timeCardApprovalService.deleted(params)
        : await timeCardApprovalService.audit(params);
      setRows(data.data || []);
    } catch (e) {
      Swal.fire({ icon: "error", title: "Load failed", text: e.response?.data?.message || e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportExcel = () => {
    if (!rows.length) return;
    const sheetRows = rows.map((r) => ({
      Month: filters.month,
      "Emp No": r.emp_no,
      Name: r.employee_name,
      Company: r.company,
      Department: r.department,
      "Entry Date": r.entry_date,
      Action: r.action,
      Source: r.source,
      Reason: r.reason,
      Before: formatValues(r.old_values),
      After: formatValues(r.new_values),
      User: r.user_name,
      "Changed At": r.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, defaultAction === "deleted" ? "Deleted" : "Audit");
    XLSX.writeFile(wb, `${defaultAction === "deleted" ? "deleted-time-cards" : "time-card-audit"}-${filters.month}.xlsx`);
  };

  const title = defaultAction === "deleted" ? "Deleted Time Card Report" : "Time Card Audit Report";
  const subtitle = defaultAction === "deleted"
    ? "Entries deleted from Time Card, with the reason captured at delete time."
    : "Corrections, adjustments, deletes, and approvals for the selected month.";

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 text-sm">{subtitle}</p>
          </div>
        </div>
        <button onClick={exportExcel} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border p-4 mb-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <input
          type="month"
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: e.target.value })}
        />
        {defaultAction !== "deleted" && (
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">All actions</option>
            <option value="created">Created</option>
            <option value="adjusted">Adjusted / corrected</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
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
          placeholder="Search emp..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <button onClick={loadData} className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">
          <Search className="w-4 h-4" /> Search
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Emp No</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Entry Date</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Before</th>
              <th className="p-3 text-left">After</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">When</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-6 text-center text-gray-500">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="p-6 text-center text-gray-500">No audit rows for this month</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3">{r.emp_no}</td>
                <td className="p-3">{r.employee_name}</td>
                <td className="p-3">{r.entry_date}</td>
                <td className="p-3 capitalize">{r.action}</td>
                <td className="p-3">{r.reason || "-"}</td>
                <td className="p-3 text-xs text-gray-600">{formatValues(r.old_values) || "-"}</td>
                <td className="p-3 text-xs text-gray-600">{formatValues(r.new_values) || "-"}</td>
                <td className="p-3">{r.user_name || "-"}</td>
                <td className="p-3 whitespace-nowrap">{r.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeCardAuditReport;
