import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Search, ClipboardCheck } from "lucide-react";
import Swal from "sweetalert2";
import { fetchCompanies, fetchDepartments } from "@services/ApiDataService";
import timeCardApprovalService from "@services/timeCardApprovalService";
import DatePickerInput from "@components/DatePickerInput";
import { useAuth } from "../../contexts/AuthContext";

const TimeCardApproval = () => {
  const { hasPermission } = useAuth();
  const canApprove = hasPermission("timeCardApproval", "approve");
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
      const data = await timeCardApprovalService.listPending(params);
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
    if (!canApprove) return;
    try {
      await timeCardApprovalService.updateStatus(id, approval_status);
      Swal.fire({ icon: "success", title: approval_status, timer: 1200, showConfirmButton: false });
      loadData();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Update failed", text: e.response?.data?.message || e.message });
    }
  };

  const bulkUpdate = async (approval_status) => {
    if (!canApprove || selectedIds.size === 0) return;
    const result = await Swal.fire({
      title: `${approval_status} selected?`,
      text: `${selectedIds.size} record(s)`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${approval_status}`,
    });
    if (!result.isConfirmed) return;
    try {
      await timeCardApprovalService.bulkUpdateStatus(Array.from(selectedIds), approval_status);
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
        <div className="p-2 bg-indigo-600 rounded-lg">
          <ClipboardCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Card Approval</h1>
          <p className="text-gray-600 text-sm">
            System-added IN/OUT and single entries wait here until an authorized user approves them.
          </p>
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
          value={filters.department_id}
          onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.approval_status}
          onChange={(e) => setFilters({ ...filters, approval_status: e.target.value })}
        >
          <option value="Pending">Pending</option>
          <option value="Active">Approved</option>
          <option value="Rejected">Rejected</option>
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

      {canApprove && selectedIds.size > 0 && (
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
              <th className="p-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => setSelectedIds(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                />
              </th>
              <th className="p-3 text-left">Emp No</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Source</th>
              <th className="p-3 text-left">Approval</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-6 text-center text-gray-500">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="p-6 text-center text-gray-500">No records</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3"><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                <td className="p-3">{r.emp_no}</td>
                <td className="p-3">{r.employee_name}</td>
                <td className="p-3">{r.date}</td>
                <td className="p-3">{r.time}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3 capitalize">{r.entry_source || "manual"}</td>
                <td className="p-3">{r.approval_status}</td>
                <td className="p-3 text-center">
                  {canApprove && r.approval_status === "Pending" && (
                    <div className="flex justify-center gap-2">
                      <button onClick={() => approveOne(r.id, "Approved")} className="text-green-700 hover:underline">Approve</button>
                      <button onClick={() => approveOne(r.id, "Rejected")} className="text-red-700 hover:underline">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeCardApproval;
