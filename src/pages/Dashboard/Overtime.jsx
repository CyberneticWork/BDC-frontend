import React, { useState, useEffect } from "react";
import { Clock, Search, ChevronLeft, ChevronRight, FileSpreadsheet, Edit, X, Save } from "lucide-react";
import { fetchTimeCards, approveOt } from "@services/OverTimeService";
import { fetchCompanies } from "@services/ApiDataService";
import Swal from "sweetalert2";
import * as XLSX from "xlsx"; 
import axios from "@utils/axios";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);
  if (currentPage <= 3) end = Math.min(5, totalPages);
  if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex justify-center items-center gap-1 mt-4 mb-4">
      <button
        className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
          currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
        }`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
            page === currentPage ? "bg-blue-600 text-white shadow" : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
          }`}
          onClick={() => onPageChange(page)}
          disabled={page === currentPage}
        >
          {page}
        </button>
      ))}
      <button
        className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
          currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
        }`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

const Overtime = () => {
  const [timeData, setTimeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false); 

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchEmpId, setSearchEmpId] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ 
    id: null, empName: "",
    morning_ot_h: 0, morning_ot_m: 0, 
    evening_ot_h: 0, evening_ot_m: 0, 
    holiday_shift_h: 0, holiday_shift_m: 0, 
    holiday_outside_h: 0, holiday_outside_m: 0 
  });

  const formatDecimalHours = (val) => {
    if (val === null || val === undefined || val === "") return "0h 00m";
    const num = parseFloat(val);
    if (isNaN(num)) return "0h 00m";
    const abs = Math.abs(num);
    let hours = Math.floor(abs);
    let minutes = Math.round((abs - hours) * 60);
    if (minutes === 60) { hours += 1; minutes = 0; }
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return "0.00";
    const num = parseFloat(val);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    fetchOvertimeData();
    (async () => {
      try {
        const comps = await fetchCompanies();
        setCompanies(Array.isArray(comps) ? comps : []);
      } catch (err) { console.error("Failed to load companies:", err); }
    })();
  }, []);

  useEffect(() => {
    let data = [...timeData];
    if (selectedCompany) data = data.filter((r) => r.company_id?.toString() === selectedCompany?.toString() || r.company_name === selectedCompany);
    if (selectedDate) data = data.filter((r) => (r.date || "").slice(0, 10) === selectedDate);
    if (selectedMonth) data = data.filter((r) => (r.date || "").slice(0, 7) === selectedMonth);
    if (searchEmpId.trim() !== "") {
      const searchStr = searchEmpId.toLowerCase().trim();
      data = data.filter((r) => (r.employee_no || "").toString().toLowerCase().includes(searchStr));
    }
    setFilteredData(data);
  }, [timeData, selectedCompany, selectedDate, selectedMonth, searchEmpId]);

  const fetchOvertimeData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTimeCards();
      const finalData = Array.isArray(data) ? data : (data?.data || []);
      setTimeData(finalData);
      setFilteredData(finalData);
    } catch (error) { setError("Failed to load overtime data"); }
    finally { setIsLoading(false); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await approveOt(id, newStatus);
      fetchOvertimeData();
    } catch (error) { console.error("Error approving overtime:", error); }
  };

  const openEditModal = (row) => {
    const toTime = (val) => {
      const n = parseFloat(val || 0);
      let h = Math.floor(n);
      let m = Math.round((n - h) * 60);
      if (m >= 60) { h += 1; m = 0; }
      return { h: h.toString(), m: m.toString() };
    };

    const m = toTime(row.morning_ot);
    const e = toTime(row.evening_ot ?? row.afternoon_ot);
    const hs = toTime(row.holiday_shift_hours ?? row.holiday_ot_hours ?? 0);
    const ho = toTime(row.holiday_outside_hours ?? 0);

    setEditData({
      id: row.id, empName: row.employee_name || "-",
      morning_ot_h: m.h, morning_ot_m: m.m,
      evening_ot_h: e.h, evening_ot_m: e.m,
      holiday_shift_h: hs.h, holiday_shift_m: hs.m,
      holiday_outside_h: ho.h, holiday_outside_m: ho.m,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const toDec = (h, m) => (parseInt(h || 0) + (parseInt(m || 0) / 60)).toFixed(2);
      await axios.put(`/overtime/${editData.id}`, {
        morning_ot: toDec(editData.morning_ot_h, editData.morning_ot_m),
        evening_ot: toDec(editData.evening_ot_h, editData.evening_ot_m),
        holiday_shift_hours: toDec(editData.holiday_shift_h, editData.holiday_shift_m),
        holiday_outside_hours: toDec(editData.holiday_outside_h, editData.holiday_outside_m),
      });
      Swal.fire({ icon: "success", title: "OT Updated!", timer: 1500, showConfirmButton: false });
      setIsEditModalOpen(false);
      fetchOvertimeData();
    } catch (error) { Swal.fire({ icon: "error", title: "Failed", text: "Update Error" }); }
    finally { setIsLoading(false); }
  };

  const handleExportExcel = () => {
    setExporting(true);
    try {
      const exportData = filteredData.map((row, index) => {
        const totalHolAmt = (parseFloat(row.holiday_shift_amount || 0) + parseFloat(row.holiday_outside_amount || 0) + parseFloat(row.holiday_ot_amount || 0));
        return {
          "No.": index + 1,
          "EMP No": row.employee_no || "-",
          "Name": row.employee_name || "-",
          "Date": row.date || "-",
          "IN Time": row.in_time || "-",
          "OUT Time": row.out_time || "-",
          "Morning OT": formatDecimalHours(row.morning_ot),
          "Evening OT": formatDecimalHours(row.evening_ot),
          "Holiday OT (Shift)": formatDecimalHours(row.holiday_shift_hours ?? row.holiday_ot_hours),
          "Holiday OT (Outside)": formatDecimalHours(row.holiday_outside_hours),
          "Total Amt": totalHolAmt > 0 ? totalHolAmt.toFixed(2) : parseFloat(row.total_ot_amount || 0).toFixed(2),
          "Status": row.status || "Pending",
        };
      });
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Overtime");
      XLSX.writeFile(wb, `OT_Report_${selectedMonth || "Summary"}.xlsx`);
    } finally { setExporting(false); }
  };

  const currentRows = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  return (
    <div className="min-h-screen p-4 bg-gray-50/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-md"><Clock className="text-white w-6 h-6" /></div>
            <h1 className="text-2xl font-bold text-gray-800">OT Management</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search EMP..." value={searchEmpId} onChange={(e)=>setSearchEmpId(e.target.value)} className="pl-9 pr-3 py-2 border rounded-md text-sm w-36 outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <select value={selectedCompany} onChange={(e)=>setSelectedCompany(e.target.value)} className="px-3 py-2 border rounded-md text-sm outline-none">
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="month" value={selectedMonth} onChange={(e)=>setSelectedMonth(e.target.value)} className="px-3 py-2 border rounded-md text-sm outline-none" />
            <button onClick={handleExportExcel} disabled={exporting} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-2 hover:bg-green-700 transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-4 text-left">EMP No</th>
                    <th className="px-4 py-4 text-left">Employee Name</th>
                    <th className="px-4 py-4 text-left">Date</th>
                    <th className="px-4 py-4 text-left text-blue-600">IN / OUT Time</th>
                    <th className="px-4 py-4 text-left">Morning OT</th>
                    <th className="px-4 py-4 text-left">Evening OT</th>
                    <th className="px-4 py-4 text-left">Holiday (Shift)</th>
                    <th className="px-4 py-4 text-left">Holiday (Out)</th>
                    <th className="px-4 py-4 text-left">Total Amt</th>
                    <th className="px-4 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {currentRows.map((row) => {
                    const totalHolAmt = (parseFloat(row.holiday_shift_amount || 0) + parseFloat(row.holiday_outside_amount || 0) + parseFloat(row.holiday_ot_amount || 0));
                    return (
                      <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 py-4 font-semibold text-gray-700">{row.employee_no}</td>
                        <td className="px-4 py-4 text-gray-600">{row.employee_name}</td>
                        <td className="px-4 py-4 text-gray-500">{row.date?.slice(0, 10)}</td>
                        {/* 🔥 In / Out Time පෙන්වන කොටස */}
                        <td className="px-4 py-4 font-bold text-blue-700 whitespace-nowrap bg-blue-50/30">
                          <div className="flex flex-col">
                            <span>{row.in_time || "--:--"} (IN)</span>
                            <span>{row.out_time || "--:--"} (OUT)</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-700">{formatDecimalHours(row.morning_ot)}</div>
                          <div className="text-[10px] text-gray-400">Rs. {formatCurrency(row.morning_ot_amount)}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-700">{formatDecimalHours(row.evening_ot ?? row.afternoon_ot)}</div>
                          <div className="text-[10px] text-gray-400">Rs. {formatCurrency(row.evening_ot_amount)}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-orange-600">{formatDecimalHours(row.holiday_shift_hours ?? row.holiday_ot_hours)}</div>
                          <div className="text-[10px] text-gray-400">Rs. {formatCurrency(row.holiday_shift_amount ?? row.holiday_ot_amount)}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-orange-600">{formatDecimalHours(row.holiday_outside_hours)}</div>
                          <div className="text-[10px] text-gray-400">Rs. {formatCurrency(row.holiday_outside_amount)}</div>
                        </td>
                       <td className="px-4 py-4 font-bold text-blue-600">
  Rs. {formatCurrency(
    // Holiday සල්ලි තිබේ නම් එම එකතුව පමණක් පෙන්වයි
    (parseFloat(row.holiday_shift_amount || 0) + parseFloat(row.holiday_outside_amount || 0) > 0)
      ? (parseFloat(row.holiday_shift_amount || 0) + parseFloat(row.holiday_outside_amount || 0))
      : row.total_ot_amount
  )}
</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEditModal(row)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md"><Edit size={14} /></button>
                            <select value={row.status || "pending"} onChange={(e) => handleStatusChange(row.id, e.target.value)} className={`text-[10px] px-1.5 py-1 rounded border font-bold outline-none ${row.status === "approved" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                              <option value="pending">Pending</option>
                              <option value="approved">Approve</option>
                              <option value="rejected">Reject</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p)=>setCurrentPage(p)} />
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-800">Edit OT Hours</h2>
              <button onClick={()=>setIsEditModalOpen(false)}><X size={18} className="text-gray-400 hover:text-red-500"/></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <p className="text-xs text-blue-600 font-bold mb-2">Adjusting: {editData.empName}</p>
              <div className="grid grid-cols-2 gap-3">
                <TimeField label="Morning" h={editData.morning_ot_h} m={editData.morning_ot_m} onH={(v)=>setEditData({...editData, morning_ot_h:v})} onM={(v)=>setEditData({...editData, morning_ot_m:v})} />
                <TimeField label="Evening" h={editData.evening_ot_h} m={editData.evening_ot_m} onH={(v)=>setEditData({...editData, evening_ot_h:v})} onM={(v)=>setEditData({...editData, evening_ot_m:v})} />
                <TimeField label="Holiday(S)" h={editData.holiday_shift_h} m={editData.holiday_shift_m} onH={(v)=>setEditData({...editData, holiday_shift_h:v})} onM={(v)=>setEditData({...editData, holiday_shift_m:v})} />
                <TimeField label="Holiday(O)" h={editData.holiday_outside_h} m={editData.holiday_outside_m} onH={(v)=>setEditData({...editData, holiday_outside_h:v})} onM={(v)=>setEditData({...editData, holiday_outside_m:v})} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={()=>setIsEditModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-100 hover:bg-blue-700 transition-all">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TimeField = ({ label, h, m, onH, onM }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
    <div className="flex gap-1">
      <div className="relative flex-1">
        <input type="number" value={h} onChange={(e)=>onH(e.target.value)} className="w-full pl-2 pr-4 py-1.5 border rounded text-sm outline-none focus:border-blue-500" />
        <span className="absolute right-1 top-1.5 text-[9px] text-gray-300 font-bold">H</span>
      </div>
      <div className="relative flex-1">
        <input type="number" value={m} onChange={(e)=>onM(e.target.value)} className="w-full pl-2 pr-5 py-1.5 border rounded text-sm outline-none focus:border-blue-500" />
        <span className="absolute right-1 top-1.5 text-[9px] text-gray-300 font-bold">M</span>
      </div>
    </div>
  </div>
);

export default Overtime;




/*
import React, { useState, useEffect } from "react";
import { Clock, Search, ChevronLeft, ChevronRight, FileSpreadsheet, Edit, X, Save } from "lucide-react";
import { fetchTimeCards, approveOt } from "@services/OverTimeService";
import { fetchCompanies } from "@services/ApiDataService";
import Swal from "sweetalert2";
import * as XLSX from "xlsx"; 
import axios from "axios"; // API Update 

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  if (currentPage <= 3) end = Math.min(5, totalPages);
  if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex justify-center items-center gap-1 mt-4 mb-4">
      <button
        className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
          currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
        }`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {start > 1 && (
        <>
          <button className="px-3 py-1 rounded-lg font-medium bg-white text-blue-700 hover:bg-blue-50 border border-blue-200" onClick={() => onPageChange(1)}>1</button>
          {start > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
            page === currentPage ? "bg-blue-600 text-white shadow" : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
          }`}
          onClick={() => onPageChange(page)}
          disabled={page === currentPage}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <button className="px-3 py-1 rounded-lg font-medium bg-white text-blue-700 hover:bg-blue-50 border border-blue-200" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button
        className={`px-3 py-1 rounded-lg font-medium transition-all duration-150 ${
          currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
        }`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

const Overtime = () => {
  const [timeData, setTimeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false); 

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(9);

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchEmpId, setSearchEmpId] = useState("");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ id: null, morning_ot: 0, evening_ot: 0, holiday_ot_hours: 0, empName: "" });

  const formatDecimalHours = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    const num = parseFloat(val);
    if (isNaN(num)) return "-";

    const sign = num < 0 ? "-" : "";
    const abs = Math.abs(num);

    let hours = Math.floor(abs);
    let minutes = Math.round((abs - hours) * 60);

    if (minutes === 60) {
      hours += 1;
      minutes = 0;
    }

    return `${sign}${hours}h ${String(minutes).padStart(2, "0")}m`;
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return "-";
    const num = parseFloat(val);
    if (isNaN(num)) return "-";
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const computeTotalOt = (row) => {
    const a = parseFloat(row.morning_ot || 0) || 0;
    const b = parseFloat(row.evening_ot || row.afternoon_ot || 0) || 0;
    const c = parseFloat(row.morning_ot_special || 0) || 0;
    const d = parseFloat(row.evening_ot_special || 0) || 0;
    return formatDecimalHours(a + b + c + d);
  };

  useEffect(() => {
    fetchOvertimeData();
    (async () => {
      try {
        const comps = await fetchCompanies();
        setCompanies(Array.isArray(comps) ? comps : []);
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    })();
  }, []);

  useEffect(() => {
    let data = [...timeData];

    if (selectedCompany) {
      data = data.filter((r) => r.company_id?.toString() === selectedCompany?.toString() || r.company_name === selectedCompany);
    }
    if (selectedDate) {
      data = data.filter((r) => (r.date || "").slice(0, 10) === selectedDate);
    }
    if (selectedMonth) {
      data = data.filter((r) => (r.date || "").slice(0, 7) === selectedMonth);
    }
    if (searchEmpId.trim() !== "") {
      const searchStr = searchEmpId.toLowerCase().trim();
      data = data.filter((r) => (r.employee_no || r.employee_id || "").toString().toLowerCase().includes(searchStr));
    }

    setFilteredData(data);
  }, [timeData, selectedCompany, selectedDate, selectedMonth, searchEmpId]);

  useEffect(() => { setCurrentPage(1); }, [filteredData.length]);

  const fetchOvertimeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTimeCards();
      if (Array.isArray(data)) {
        setTimeData(data); setFilteredData(data);
      } else if (data && Array.isArray(data.data)) {
        setTimeData(data.data); setFilteredData(data.data);
      } else {
        setError("Data received in unexpected format");
        setTimeData([]); setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load overtime data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id, sts) => {
    try {
      await approveOt(id, sts);
      fetchOvertimeData();
    } catch (error) {
      console.error("Error approving overtime:", error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setTimeData((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    try {
      await handleApprove(id, newStatus);
    } catch (err) {
      console.error("Failed to change status:", err);
      fetchOvertimeData();
    }
  };

  // ==================== EDIT OT LOGIC ====================
 // දශම අගයක් (උදා: 1.5) පැය සහ මිනිත්තු බවට පත් කරන Helper Function එක
  const decimalToTime = (decimalVal) => {
    const num = parseFloat(decimalVal || 0);
    let h = Math.floor(num);
    let m = Math.round((num - h) * 60);
    if (m >= 60) { h += 1; m = 0; }
    return { h: h.toString(), m: m.toString() };
  };

  const openEditModal = (row) => {
    const m_ot = decimalToTime(row.morning_ot);
    const e_ot = decimalToTime(row.evening_ot ?? row.afternoon_ot);
    const h_ot = decimalToTime(row.holiday_ot_hours);

    setEditData({
      id: row.id,
      empName: row.employee_name || "-",
      // Hours සහ Minutes වෙනම State එකේ තියාගන්නවා
      morning_ot_h: m_ot.h, morning_ot_m: m_ot.m,
      evening_ot_h: e_ot.h, evening_ot_m: e_ot.m,
      holiday_ot_h: h_ot.h, holiday_ot_m: h_ot.m,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // පැය සහ මිනිත්තු ආපහු දශම අගයකට පත් කරන Helper Function එක (Backend එකට යවන්න)
      const toDecimal = (h, m) => {
        const hours = parseInt(h || 0);
        const mins = parseInt(m || 0);
        return (hours + (mins / 60)).toFixed(2);
      };

      await axios.put(`/overtime/${editData.id}`, {
        morning_ot: toDecimal(editData.morning_ot_h, editData.morning_ot_m),
        evening_ot: toDecimal(editData.evening_ot_h, editData.evening_ot_m),
        holiday_ot_hours: toDecimal(editData.holiday_ot_h, editData.holiday_ot_m),
      });

      Swal.fire({ icon: "success", title: "OT Updated!", timer: 1500, showConfirmButton: false });
      setIsEditModalOpen(false);
      fetchOvertimeData(); // Refresh Data
    } catch (error) {
      console.error("Error updating OT:", error);
      Swal.fire({ icon: "error", title: "Update Failed", text: "Something went wrong!" });
    } finally {
      setIsLoading(false);
    }
  };
  // ========================================================

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      Swal.fire({ icon: "info", title: "No Data", text: "There is no data to export.", confirmButtonColor: "#3b82f6" });
      return;
    }
    setExporting(true);
    try {
      const exportData = filteredData.map((row, index) => ({
        "No.": index + 1,
        "EMP No": row.employee_no || row.employee_id || "-",
        "Name": row.employee_name || "-",
        "Date": row.date || "-",
        "Shift Start": row.shift_start || "-",
        "IN Time": row.in_time || "-",
        "Shift End": row.shift_end || "-",
        "OUT Time": row.out_time || "-",
        "Working Hours": formatDecimalHours(row.working_hours),
        "Morning OT": formatDecimalHours(row.morning_ot),
        "Evening OT": formatDecimalHours(row.evening_ot ?? row.afternoon_ot),
        "Holiday OT": formatDecimalHours(row.holiday_ot_hours),
        "Total OT": row.total_ot ? formatDecimalHours(row.total_ot) : computeTotalOt(row),
        "Special OT": formatDecimalHours((parseFloat(row.morning_ot_special || 0) || 0) + (parseFloat(row.evening_ot_special || 0) || 0)),
        "Total OT Amount": formatCurrency(parseFloat(row.holiday_ot_amount || 0) > 0 ? row.holiday_ot_amount : row.total_ot_amount),
        "Status": row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "Pending",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Overtime Report");
      let fileName = "Overtime_Report";
      if (selectedMonth) fileName += `_${selectedMonth}`;
      else if (selectedDate) fileName += `_${selectedDate}`;
      fileName += ".xlsx";
      XLSX.writeFile(wb, fileName);

      Swal.fire({ icon: "success", title: "Exported Successfully", timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error("Export error:", error);
      Swal.fire({ icon: "error", title: "Export Failed", text: "Failed to generate Excel file.", confirmButtonColor: "#3b82f6" });
    } finally {
      setExporting(false);
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-800 to-blue-600 bg-clip-text text-transparent">
                  Overtime Management System
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Emp ID..."
                  value={searchEmpId}
                  onChange={(e) => setSearchEmpId(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm w-32 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id || c} value={c.id ?? c.name}>{c.name ?? c}</option>
                ))}
              </select>

              <input type="month" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDate(""); }} className="px-3 py-2 border rounded-md text-sm" />
              <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedMonth(""); }} className="px-3 py-2 border rounded-md text-sm" />

              <button onClick={() => { setSelectedCompany(""); setSelectedDate(""); setSelectedMonth(""); setSearchEmpId(""); }} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm">Clear</button>

              <button onClick={handleExportExcel} disabled={exporting || filteredData.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

          {isLoading ? (
            <div className="flex justify-center h-64"><div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
          ) : (
            <div className="bg-white/80 rounded-2xl shadow-xl border overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">EMP No</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">IN/OUT</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Morning OT</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Evening OT</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Holiday OT</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total Amount</th>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {currentRows.length === 0 ? (
                      <tr><td colSpan="9" className="text-center py-8">No records found</td></tr>
                    ) : (
                      currentRows.map((row) => (
                        <tr key={row.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-semibold">{row.employee_no || "-"}</td>
                          <td className="px-4 py-4 text-sm">{row.employee_name || "-"}</td>
                          <td className="px-4 py-4 text-sm">{row.date || "-"}</td>
                          <td className="px-4 py-4 text-xs text-gray-600">
                            {row.in_time || "-"} - {row.out_time || "-"}
                          </td>
                          
                          <td className="px-4 py-4">
                            <div className="text-sm text-orange-600 font-medium">{formatDecimalHours(row.morning_ot)}</div>
                            <div className="text-xs text-green-600 font-semibold mt-0.5">
                              Rs. {formatCurrency(row.morning_ot_amount)}
                            </div>
                          </td>
                          
                          
                          <td className="px-4 py-4">
                            <div className="text-sm text-orange-600 font-medium">{formatDecimalHours(row.evening_ot ?? row.afternoon_ot)}</div>
                            <div className="text-xs text-green-600 font-semibold mt-0.5">
                              Rs. {formatCurrency(row.evening_ot_amount)}
                            </div>
                          </td>

                          
                          <td className="px-4 py-4">
                            <div className="text-sm text-orange-600 font-medium">{formatDecimalHours(row.holiday_ot_hours)}</div>
                            <div className="text-xs text-green-600 font-semibold mt-0.5">
                              Rs. {formatCurrency(row.holiday_ot_amount)}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-green-600">
                            {formatCurrency(parseFloat(row.holiday_ot_amount || 0) > 0 ? row.holiday_ot_amount : row.total_ot_amount)}
                          </td>
                          <td className="px-4 py-4 flex items-center justify-center gap-3">
                           
                            <button onClick={() => openEditModal(row)} className="text-blue-500 hover:text-blue-700 bg-blue-100 p-1.5 rounded-md">
                              <Edit size={16} />
                            </button>

                            
                            <select
                              value={row.status || "pending"}
                              onChange={(e) => handleStatusChange(row.id, e.target.value)}
                              className={`text-xs px-2 py-1 rounded-md border font-semibold outline-none ${
                                row.status === "approved" ? "bg-green-100 text-green-800" : row.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approve</option>
                              <option value="rejected">Reject</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      </div>

      
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Edit Overtime Hours</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-red-500"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div className="text-sm font-medium text-gray-600 mb-2">Employee: <span className="text-black">{editData.empName}</span></div>
              
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Morning OT</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input type="number" min="0" required
                      value={editData.morning_ot_h}
                      onChange={(e) => setEditData({ ...editData, morning_ot_h: e.target.value })}
                      className="w-full pl-3 pr-10 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-sm font-medium">h</span>
                  </div>
                  <div className="relative flex-1">
                    <input type="number" min="0" max="59" required
                      value={editData.morning_ot_m}
                      onChange={(e) => setEditData({ ...editData, morning_ot_m: e.target.value })}
                      className="w-full pl-3 pr-11 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-sm font-medium">min</span>
                  </div>
                </div>
              </div>

             
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evening OT</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input type="number" min="0" required
                      value={editData.evening_ot_h}
                      onChange={(e) => setEditData({ ...editData, evening_ot_h: e.target.value })}
                      className="w-full pl-3 pr-10 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-sm font-medium">h</span>
                  </div>
                  <div className="relative flex-1">
                    <input type="number" min="0" max="59" required
                      value={editData.evening_ot_m}
                      onChange={(e) => setEditData({ ...editData, evening_ot_m: e.target.value })}
                      className="w-full pl-3 pr-11 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-sm font-medium">min</span>
                  </div>
                </div>
              </div>

              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Holiday OT</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input type="number" min="0" required
                      value={editData.holiday_ot_h}
                      onChange={(e) => setEditData({ ...editData, holiday_ot_h: e.target.value })}
                      className="w-full pl-3 pr-10 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-sm font-medium">h</span>
                  </div>
                  <div className="relative flex-1">
                    <input type="number" min="0" max="59" required
                      value={editData.holiday_ot_m}
                      onChange={(e) => setEditData({ ...editData, holiday_ot_m: e.target.value })}
                      className="w-full pl-3 pr-11 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-sm font-medium">min</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overtime;


*/