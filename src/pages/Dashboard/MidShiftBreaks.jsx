import React, { useState, useEffect } from "react";
import { Search, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import axios from "@utils/axios";
import { fetchCompanies } from "@services/ApiDataService";
import Swal from "sweetalert2";
import DatePickerInput from "@components/DatePickerInput";

const MidShiftBreaks = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState([]);

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputReasons, setInputReasons] = useState({});

  useEffect(() => {
    loadCompanies();
    // පේජ් එක ලෝඩ් වෙද්දිම අද දවසට අදාළ දත්ත ටික ගේන්න
    fetchMovements();
  }, []);

  const loadCompanies = async () => {
    try {
      const comps = await fetchCompanies();
      setCompanies(Array.isArray(comps) ? comps : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMovements = async () => {
    if (!date) return;
    setLoading(true);

    console.log("--- API Request එක යවනවා ---");
    console.log("Date:", date, "Company:", companyId, "Search:", search);

    try {
      const res = await axios.get('/attendance/all-movements', {
        params: { date, company_id: companyId, search }
      });

      console.log("--- Backend Response ---", res);
      console.log("--- Movements Data Array ---", res.data.data);

      setMovements(res.data.data);

      const reasonsObj = {};
      res.data.data.forEach(m => {
        reasonsObj[m.out_id] = m.reason || "";
      });
      setInputReasons(reasonsObj);

    } catch (error) {
      console.error("--- API Error ---", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("--- State Movements ---", movements);
  }, [movements]);

  const handleAction = async (outId, actionStatus) => {
    const reason = inputReasons[outId];

    if (actionStatus === "Rejected" && !reason?.trim()) {
      Swal.fire("Reason Required", "Please enter a reason before rejecting.", "warning");
      return;
    }

    try {
      await axios.post('/attendance/movements/status', {
        out_id: outId,
        status: actionStatus,
        reason: reason
      });
      Swal.fire("Success", `Movement ${actionStatus}`, "success");
      fetchMovements();
    } catch (error) {
      Swal.fire("Error", "Failed to update status", "error");
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Clock className="w-8 h-8 text-blue-600" />
          Mid-Shift Breaks Approval
        </h1>
        <p className="text-slate-600">
          Manage and approve intermediate movements of employees during working hours.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
            <DatePickerInput
              value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Company</label>
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl focus:border-blue-500 outline-none">
              <option value="">All Companies</option>
              {companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Search Employee</label>
            <input type="text" placeholder="Name or EMP No" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl focus:border-blue-500 outline-none" />
          </div>
          <div className="flex items-end">
            <button onClick={fetchMovements} className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
              Load Records
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : movements.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-semibold">No mid-shift breaks found for selected filters.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-sm">
                  <th className="p-3 border-b">EMP No</th>
                  <th className="p-3 border-b">Name</th>
                  {/* අ */}
                  <th className="p-3 border-b">Date</th>
                  <th className="p-3 border-b">OUT Time</th>
                  <th className="p-3 border-b">IN Time</th>
                  {/*
                  <th className="p-3 border-b text-center">Duration</th>
                  */}
                  <th className="p-3 border-b">Reason</th>
                  <th className="p-3 border-b text-center">Status</th>
                  <th className="p-3 border-b text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.out_id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{m.emp_no}</td>
                    <td className="p-3 font-medium text-slate-700">{m.emp_name}</td>
                    {/*  */}
                    <td className="p-3 font-medium text-slate-600">{date}</td>
                    <td className="p-3 font-bold text-red-600">{m.out_time}</td>
                    <td className="p-3 font-bold text-green-600">{m.in_time}</td>
                    {/*
                    <td className="p-3 text-center">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-bold">
                        {m.duration_mins} Mins
                      </span>
                    </td>
                    */}
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="Type reason..."
                        value={inputReasons[m.out_id] || ""}
                        onChange={(e) => setInputReasons(prev => ({ ...prev, [m.out_id]: e.target.value }))}
                        className="w-full text-sm border border-gray-300 rounded p-1.5 focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${m.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        m.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleAction(m.out_id, 'Approved')} className="p-1.5 bg-green-50 hover:bg-green-200 text-green-600 rounded">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleAction(m.out_id, 'Rejected')} className="p-1.5 bg-red-50 hover:bg-red-200 text-red-600 rounded">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MidShiftBreaks;