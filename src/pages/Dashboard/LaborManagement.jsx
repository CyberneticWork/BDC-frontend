import React, { useState, useEffect } from "react";
import axios from "@utils/axios";
import { Search, Users, Briefcase, RefreshCw } from "lucide-react";

const LaborManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
          <button
            onClick={load}
            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Refresh"
          >
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
              <p className="text-gray-400 text-sm mt-1">
                {search ? "Try a different search term" : "No employees with 'Daily Wages Salary' employment type"}
              </p>
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
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono font-medium text-blue-700">
                        {emp.attendance_employee_no}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.full_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {emp.organizationAssignment?.department?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {emp.organizationAssignment?.designation?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {emp.organizationAssignment?.company?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {emp.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaborManagement;
