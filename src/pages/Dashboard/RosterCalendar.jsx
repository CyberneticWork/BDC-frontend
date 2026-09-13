import React, { useEffect, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import Swal from "sweetalert2";
import { fetchCompanies, fetchDepartments } from "@services/ApiDataService";
import axios from "@utils/axios";

const weekdayLetter = (isoDate) => {
  const letters = ["S", "M", "T", "W", "T", "F", "S"];
  return letters[new Date(`${isoDate}T00:00:00`).getDay()];
};

const RosterCalendar = () => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [rows, setRows] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    month: currentMonth,
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
      const res = await axios.get("/rosters/calendar", { params });
      setRows(res.data?.data || []);
      setDates(res.data?.dates || []);
    } catch (e) {
      Swal.fire({ icon: "error", title: "Load failed", text: e.response?.data?.message || e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-indigo-700 rounded-lg">
          <CalendarDays className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roster Calendar</h1>
          <p className="text-gray-600 text-sm">
            Employees down the page, dates across. Multiple roster codes on the same day (R1 + R3) and overnight shifts (R4) are shown together.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border p-4 mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <input
          type="month"
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: e.target.value })}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.company_id}
          onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_code ? `${c.company_code} - ${c.name}` : c.name}
            </option>
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
          placeholder="Search employee..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <button onClick={loadData} className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">
          <Search className="w-4 h-4" /> View
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-auto max-h-[75vh]">
        <table className="min-w-max text-xs">
          <thead className="bg-slate-800 text-white sticky top-0 z-20">
            <tr>
              <th className="p-2 text-left sticky left-0 bg-slate-800 z-30 min-w-[72px]">Emp No</th>
              <th className="p-2 text-left sticky left-[72px] bg-slate-800 z-30 min-w-[160px]">Employee</th>
              {dates.map((iso) => (
                <th key={iso} className="p-1 text-center min-w-[70px] leading-tight">
                  <div>{iso.slice(-2)}</div>
                  <div className="text-[10px] font-normal text-slate-300">{weekdayLetter(iso)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={dates.length + 2} className="p-6 text-center text-gray-500">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={dates.length + 2} className="p-6 text-center text-gray-500">No roster rows for this month.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.employee_id} className="border-t align-top">
                <td className="p-2 sticky left-0 bg-white z-10 font-medium">{r.emp_no}</td>
                <td className="p-2 sticky left-[72px] bg-white z-10 whitespace-nowrap">{r.employee_name}</td>
                {dates.map((iso) => {
                  const cells = r.days?.[iso] || [];
                  return (
                    <td key={iso} className="p-1 text-center">
                      {cells.map((s, i) => (
                        <div
                          key={`${iso}-${i}`}
                          className={`rounded px-1 py-0.5 mb-0.5 font-semibold ${s.crosses_midnight ? "bg-amber-100 text-amber-900" : "bg-sky-50 text-sky-800"}`}
                          title={`${s.start_time || ""}–${s.end_time || ""}${s.crosses_midnight ? " (next day)" : ""}`}
                        >
                          {s.shift_code}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RosterCalendar;
