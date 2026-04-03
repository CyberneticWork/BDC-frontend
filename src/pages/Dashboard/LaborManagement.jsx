import React, { useState, useEffect } from "react";
import axios from "@utils/axios";
import timeCardService from "@services/timeCardService";
import {
  Search, Users, Briefcase, RefreshCw,
  ChevronDown, ChevronUp, Clock, ArrowLeftRight,
} from "lucide-react";

const formatLKR = (val) =>
  val != null
    ? new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 2 }).format(val)
    : "—";

/* ── Salary Dropdown (inside employee row) ─────────────────────────── */
const SalaryDropdown = ({ comp }) => {
  if (!comp) return <p className="text-gray-400 text-sm">No salary data available.</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
        <p className="text-xs text-gray-500 mb-1">Basic Salary</p>
        <p className="text-base font-bold text-green-700">{formatLKR(comp.basic_salary)}</p>
      </div>
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <p className="text-xs text-gray-500 mb-1">EPF / ETF</p>
        <p className="text-base font-semibold text-blue-700">{comp.enable_epf_etf ? "Enabled" : "Disabled"}</p>
      </div>
      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
        <p className="text-xs text-gray-500 mb-1">OT Active</p>
        <p className="text-base font-semibold text-purple-700">{comp.ot_active ? "Yes" : "No"}</p>
      </div>
      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
        <p className="text-xs text-gray-500 mb-1">OT Morning Rate</p>
        <p className="text-base font-semibold text-yellow-700">{formatLKR(comp.ot_morning_rate)}</p>
      </div>
      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
        <p className="text-xs text-gray-500 mb-1">OT Night Rate</p>
        <p className="text-base font-semibold text-yellow-700">{formatLKR(comp.ot_night_rate)}</p>
      </div>
      <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
        <p className="text-xs text-gray-500 mb-1">Special OT Morning</p>
        <p className="text-base font-semibold text-orange-700">{formatLKR(comp.ot_morning_rate_special)}</p>
      </div>
      <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
        <p className="text-xs text-gray-500 mb-1">Special OT Night</p>
        <p className="text-base font-semibold text-orange-700">{formatLKR(comp.ot_night_rate_special)}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Bank</p>
        <p className="text-sm font-semibold text-gray-700">{comp.bank_name || "—"}</p>
        <p className="text-xs text-gray-400">{comp.bank_account_no || ""}</p>
      </div>
    </div>
  );
};

/* ── Attendance View ───────────────────────────────────────────────── */
const AttendanceView = ({ employees }) => {
  const [selectedEmp, setSelectedEmp] = useState("");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    if (!selectedEmp) return;
    setIsLoading(true);
    try {
      const data = await timeCardService.searchEmployeeTimeCards(selectedEmp);
      const arr = Array.isArray(data) ? data : [];
      // filter by date range
      const filtered = arr.filter((r) => {
        const d = r.date || r.actual_date;
        if (!d) return true;
        return d >= fromDate && d <= toDate;
      });
      // sort by date desc then time
      filtered.sort((a, b) => {
        const da = (a.date || a.actual_date || "");
        const db = (b.date || b.actual_date || "");
        if (da !== db) return db.localeCompare(da);
        return (a.time || "").localeCompare(b.time || "");
      });
      setRecords(filtered);
    } catch (err) {
      console.error("Error loading attendance:", err);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmp) load();
  }, [selectedEmp]);

  const entryBadge = (entry) => {
    if (!entry) return <span className="text-gray-400 text-xs">—</span>;
    const isIn = entry.toLowerCase().includes("in");
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${isIn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
        {entry}
      </span>
    );
  };

  const statusBadge = (status) => {
    if (!status) return null;
    const colors = {
      "Present": "bg-green-100 text-green-700",
      "Late Coming": "bg-yellow-100 text-yellow-700",
      "Absent": "bg-red-100 text-red-700",
      "Early Going": "bg-orange-100 text-orange-700",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  // group by date to show IN/OUT pairs
  const grouped = records.reduce((acc, r) => {
    const d = r.date || r.actual_date || "Unknown";
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {});

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Employee</label>
          <select
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">-- Select Employee --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.attendance_employee_no}>
                {e.full_name} ({e.attendance_employee_no})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">From Date</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">To Date</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <button
          onClick={load}
          disabled={!selectedEmp || isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Loading..." : "Load"}
        </button>
      </div>

      {/* Stats */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Records", value: records.length, color: "text-blue-700" },
            { label: "IN Records", value: records.filter(r => r.entry?.toLowerCase().includes("in")).length, color: "text-green-700" },
            { label: "OUT Records", value: records.filter(r => r.entry?.toLowerCase().includes("out")).length, color: "text-red-700" },
            { label: "Days", value: Object.keys(grouped).length, color: "text-purple-700" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow border border-gray-100">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        {!selectedEmp ? (
          <div className="text-center py-16">
            <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Select an employee to view attendance</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No attendance records found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting the date range</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Entry</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Working Hours</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(grouped).map(([date, rows]) => (
                  <React.Fragment key={date}>
                    {/* Date group header */}
                    <tr className="bg-blue-50">
                      <td colSpan="5" className="px-6 py-2 text-xs font-bold text-blue-700">
                        {new Date(date).toLocaleDateString("en-LK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </td>
                    </tr>
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-600">{r.date || r.actual_date || "—"}</td>
                        <td className="px-6 py-3 text-center">{entryBadge(r.entry)}</td>
                        <td className="px-6 py-3 text-center text-sm font-mono font-semibold text-gray-800">
                          {r.time || (r.fingerprint_clock ? r.fingerprint_clock.split(" ")[1]?.slice(0, 5) : "—")}
                        </td>
                        <td className="px-6 py-3 text-center text-sm text-gray-600">{r.working_hours || "—"}</td>
                        <td className="px-6 py-3 text-center">{statusBadge(r.status)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Component ────────────────────────────────────────────────── */
const LaborManagement = () => {
  const [view, setView] = useState("list"); // "list" | "attendance"
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => setExpandedRow((prev) => (prev === id ? null : id));

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/employees/by-employment-type/Daily Wages Salary");
      const data = Array.isArray(res.data) ? res.data : [];
      setEmployees(data);
      setFiltered(data);
    } catch (err) {
      console.error("Error loading labor employees:", err);
      setEmployees([]);
      setFiltered([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      employees.filter(
        (e) =>
          e.full_name?.toLowerCase().includes(term) ||
          e.attendance_employee_no?.toLowerCase().includes(term) ||
          e.organizationAssignment?.department?.name?.toLowerCase().includes(term)
      )
    );
  }, [search, employees]);

  const tabs = [
    { id: "list", label: "Employee List", icon: Users },
    { id: "attendance", label: "Attendance (IN / OUT)", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-1">
            <Briefcase className="h-7 w-7" />
            <h1 className="text-2xl font-bold">Labor Management</h1>
          </div>
          <p className="text-blue-200 text-sm">Daily Wages Salary Employees</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                view === t.id
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 shadow border border-gray-100">
                <p className="text-sm text-gray-500">Total Daily Wage Workers</p>
                <p className="text-3xl font-bold text-blue-700">{employees.length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow border border-gray-100">
                <p className="text-sm text-gray-500">Filtered Results</p>
                <p className="text-3xl font-bold text-indigo-700">{filtered.length}</p>
              </div>
            </div>

            {/* Search + Refresh */}
            <div className="bg-white rounded-xl shadow border border-gray-100 p-4 mb-6 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, employee no, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button onClick={load} className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700" title="Refresh">
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No daily wage employees found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Emp No</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Full Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Designation</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Company</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Basic Salary</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filtered.map((emp) => (
                        <React.Fragment key={emp.id}>
                          <tr className="hover:bg-blue-50 cursor-pointer" onClick={() => toggleRow(emp.id)}>
                            <td className="px-6 py-4 text-sm font-mono font-medium text-blue-700">{emp.attendance_employee_no}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.full_name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.organizationAssignment?.department?.name || "—"}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.organizationAssignment?.designation?.name || "—"}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.organizationAssignment?.company?.name || "—"}</td>
                            <td className="px-6 py-4 text-right text-sm font-mono font-semibold text-green-700">{formatLKR(emp.compensation?.basic_salary)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {emp.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {expandedRow === emp.id
                                ? <ChevronUp className="h-4 w-4 text-blue-500 mx-auto" />
                                : <ChevronDown className="h-4 w-4 text-gray-400 mx-auto" />}
                            </td>
                          </tr>
                          {expandedRow === emp.id && (
                            <tr className="bg-blue-50">
                              <td colSpan="8" className="px-6 py-4">
                                <p className="text-xs font-bold text-blue-700 uppercase mb-3">Salary Details — {emp.full_name}</p>
                                <SalaryDropdown comp={emp.compensation} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── ATTENDANCE VIEW ── */}
        {view === "attendance" && (
          <AttendanceView employees={employees} />
        )}

      </div>
    </div>
  );
};

export default LaborManagement;
