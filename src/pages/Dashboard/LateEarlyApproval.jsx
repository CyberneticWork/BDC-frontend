import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, RefreshCw, Search, Clock } from "lucide-react";
import Swal from "sweetalert2";
import { fetchCompanies, fetchDepartments } from "@services/ApiDataService";
import attendanceExceptionService from "@services/attendanceExceptionService";
import DatePickerInput from "@components/DatePickerInput";

const LateEarlyApproval = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState({
    from_date: "",
    to_date: "",
    company_id: "",
    department_id: "",
    status: "",
    approval_status: "Pending",
    search: "",
  });

  const loadMeta = async () => {
    try {
      const [c, d] = await Promise.all([fetchCompanies(), fetchDepartments()]);
      setCompanies(Array.isArray(c) ? c : c?.data || []);
      setDepartments(Array.isArray(d) ? d : d?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v != null)
      );
      const data = await attendanceExceptionService.list(params);
      setRows(data);
      setSelectedIds(new Set());
    } catch (e) {
      Swal.fire({ icon: "error", title: "Load failed", text: e.response?.data?.message || e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
    loadData();
  }, []);

  const approveOne = async (id, approval_status) => {
    try {
      await attendanceExceptionService.updateStatus(id, approval_status);
      Swal.fire({ icon: "success", title: approval_status, timer: 1200, showConfirmButton: false });
      loadData();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Update failed", text: e.response?.data?.message || e.message });
    }
  };

  const bulkUpdate = async (approval_status) => {
    if (selectedIds.size === 0) return;
    const result = await Swal.fire({
      title: `${approval_status} selected?`,
      text: `${selectedIds.size} record(s)`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${approval_status}`,
    });
    if (!result.isConfirmed) return;
    try {
      await attendanceExceptionService.bulkUpdateStatus(Array.from(selectedIds), approval_status);
      loadData();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Bulk update failed", text: e.response?.data?.message || e.message });
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-amber-500 rounded-lg">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Late Coming / Early Out Approval</h1>
          <p className="text-gray-600 text-sm">Approve or reject late arrivals and early departures</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border p-4 mb-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <DatePickerInput
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.from_date}
          onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
          placeholder="From"
        />
        <DatePickerInput
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.to_date}
          onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
          placeholder="To"
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
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Late &amp; Early</option>
          <option value="Late Coming">Late Coming</option>
          <option value="Early OUT">Early OUT</option>
        </select>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.approval_status}
          onChange={(e) => setFilters({ ...filters, approval_status: e.target.value })}
        >
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Active">Active</option>
        </select>
        <div className="flex gap-2">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1"
            placeholder="Search emp..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <button onClick={loadData} className="px-3 py-2 bg-blue-600 text-white rounded-lg">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-3 flex gap-2">
          <button onClick={() => bulkUpdate("Approved")} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Approve ({selectedIds.size})
          </button>
          <button onClick={() => bulkUpdate("Rejected")} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
            <XCircle className="w-4 h-4" /> Reject ({selectedIds.size})
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left"><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} /></th>
              <th className="p-3 text-left">Emp No</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Approval</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="8" className="p-8 text-center text-gray-500">No records found</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="p-3"><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                  <td className="p-3 font-mono">{r.emp_no}</td>
                  <td className="p-3">{r.employee_name}</td>
                  <td className="p-3">{r.date}</td>
                  <td className="p-3 font-mono">{r.time}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.status === "Late Coming" ? "bg-orange-100 text-orange-800" : "bg-purple-100 text-purple-800"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">{r.approval_status}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => approveOne(r.id, "Approved")} className="text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-50 text-xs font-semibold">Approve</button>
                      <button onClick={() => approveOne(r.id, "Rejected")} className="text-red-700 border border-red-200 px-2 py-1 rounded hover:bg-red-50 text-xs font-semibold">Reject</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-end">
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
    </div>
  );
};

export default LateEarlyApproval;
