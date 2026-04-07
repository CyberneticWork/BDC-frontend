import React, { useState, useEffect } from "react";
import axios from "@utils/axios";
import timeCardService from "@services/timeCardService";
import { getProcessedSalaries } from "@services/SalaryProcessService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Search, Users, Briefcase, RefreshCw,
  ChevronDown, ChevronUp, Clock, DollarSign, Eye, Calculator, Download,
} from "lucide-react";

const formatLKR = (val) =>
  val != null
    ? new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 2 }).format(val)
    : "—";

const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

/* ── Weekly Salary Calculator ─────────────────────────────────────── */
const WeeklySalaryView = ({ employees }) => {
  const [selectedEmp, setSelectedEmp]   = useState("");
  const [fromDate, setFromDate]         = useState(() => getWeekRange(0).from);
  const [toDate, setToDate]             = useState(() => getWeekRange(0).to);
  const [activeQuick, setActiveQuick]   = useState("this_week");
  const [isLoading, setIsLoading]       = useState(false);
  const [result, setResult]             = useState(null);
  const [weekBreakdown, setWeekBreakdown] = useState([]);

  const applyQuick = (key) => {
    setActiveQuick(key);
    const today = new Date().toISOString().split("T")[0];
    if (key === "this_week")  { const r = getWeekRange(0);  setFromDate(r.from); setToDate(r.to); }
    if (key === "last_week")  { const r = getWeekRange(-1); setFromDate(r.from); setToDate(r.to); }
    if (key === "2_weeks")    { const r = getWeekRange(-1); setFromDate(r.from); setToDate(getWeekRange(0).to); }
    if (key === "this_month") {
      const d = new Date();
      setFromDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]);
      setToDate(today);
    }
  };

  const quickBtns = [
    { key: "this_week",  label: "This Week" },
    { key: "last_week",  label: "Last Week" },
    { key: "2_weeks",    label: "Last 2 Weeks" },
    { key: "this_month", label: "This Month" },
  ];

  const calcWeek = (allRecords, wFrom, wTo, comp, perDayRate, otRatePerHour) => {
    const parseHours = (wh) => {
      if (!wh) return 0;
      if (String(wh).includes(":")) { const [h, m] = String(wh).split(":").map(Number); return h + (m || 0) / 60; }
      return parseFloat(wh) || 0;
    };
    const rangeRecs = allRecords.filter(r => { const d = r.date || r.actual_date; return d && d >= wFrom && d <= wTo; });
    const byDate = {};
    rangeRecs.forEach(r => {
      const d = r.date || r.actual_date;
      if (!byDate[d]) byDate[d] = { in: null, out: null, working_hours: null, status: null };
      if (r.entry?.toLowerCase().includes("in"))  byDate[d].in  = r.time || "—";
      if (r.entry?.toLowerCase().includes("out")) byDate[d].out = r.time || "—";
      if (r.working_hours) byDate[d].working_hours = r.working_hours;
      if (r.status)        byDate[d].status = r.status;
    });
    const workedDays = Object.values(byDate).filter(d => d.in !== null).length;
    const basicEarned = round2(perDayRate * workedDays);
    let totalOTHours = 0;
    const dailyRows = [];
    Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).forEach(([date, d]) => {
      const hrs = parseHours(d.working_hours);
      const otHrs = Math.max(0, round2(hrs - 8));
      totalOTHours = round2(totalOTHours + otHrs);
      dailyRows.push({ date, in: d.in, out: d.out, working_hours: d.working_hours || "—", status: d.status, otHrs });
    });
    const otAmount    = round2(totalOTHours * otRatePerHour);
    const grossSalary = round2(basicEarned + otAmount);
    const epfDeduction = comp?.enable_epf_etf ? round2(basicEarned * 0.08) : 0;
    const netSalary   = round2(grossSalary - epfDeduction);
    return { wFrom, wTo, workedDays, basicEarned, totalOTHours, otAmount, grossSalary, epfDeduction, netSalary, dailyRows };
  };

  const calculate = async () => {
    if (!selectedEmp) return;
    setIsLoading(true);
    setResult(null);
    setWeekBreakdown([]);
    try {
      const emp = employees.find(e => e.attendance_employee_no === selectedEmp);
      if (!emp) throw new Error("Employee not found");
      const comp          = emp.compensation;
      const basicMonthly  = parseFloat(comp?.basic_salary || 0);
      const perDayRate    = round2(basicMonthly);
      const otRatePerHour = parseFloat(comp?.ot_morning_rate || 0);

      const data = await timeCardService.searchEmployeeTimeCards(selectedEmp);
      const arr  = Array.isArray(data) ? data : [];

      // Split date range into ISO weeks (Mon-Sun)
      const weeks = [];
      let cur = new Date(fromDate);
      const end = new Date(toDate);
      while (cur <= end) {
        const wMon = new Date(cur);
        const wSun = new Date(cur);
        wSun.setDate(wMon.getDate() + 6);
        const wFrom = wMon.toISOString().split("T")[0];
        const wTo   = (wSun > end ? end : wSun).toISOString().split("T")[0];
        weeks.push(calcWeek(arr, wFrom, wTo, comp, perDayRate, otRatePerHour));
        cur.setDate(cur.getDate() + 7);
      }

      // Combined totals
      const workedDays   = weeks.reduce((s, w) => s + w.workedDays,   0);
      const basicEarned  = round2(weeks.reduce((s, w) => s + w.basicEarned,  0));
      const totalOTHours = round2(weeks.reduce((s, w) => s + w.totalOTHours, 0));
      const otAmount     = round2(weeks.reduce((s, w) => s + w.otAmount,     0));
      const grossSalary  = round2(weeks.reduce((s, w) => s + w.grossSalary,  0));
      const epfDeduction = round2(weeks.reduce((s, w) => s + w.epfDeduction, 0));
      const netSalary    = round2(weeks.reduce((s, w) => s + w.netSalary,    0));
      const dailyRows    = weeks.flatMap(w => w.dailyRows).sort((a, b) => a.date.localeCompare(b.date));

      setWeekBreakdown(weeks.length > 1 ? weeks : []);
      setResult({ emp, fromDate, toDate, workedDays, basicMonthly, perDayRate, basicEarned, totalOTHours, otRatePerHour, otAmount, epfDeduction, grossSalary, netSalary, dailyRows, comp });
    } catch (err) {
      console.error("Weekly salary calc error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const statusBadge = (s) => {
    const c = { "Present":"bg-green-100 text-green-700", "Late Coming":"bg-yellow-100 text-yellow-700", "Absent":"bg-red-100 text-red-700", "Early Going":"bg-orange-100 text-orange-700" };
    return s ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c[s] || "bg-gray-100 text-gray-600"}`}>{s}</span> : null;
  };

  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const r = result;
    const empName = r.emp.full_name;
    const empNo   = r.emp.attendance_employee_no;
    const dept    = r.emp.organizationAssignment?.department?.name || "—";
    const period  = `${r.fromDate} to ${r.toDate}`;

    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LABOR SALARY SHEET", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Employee : ${empName} (${empNo})`, 14, 25);
    doc.text(`Department : ${dept}`, 14, 31);
    doc.text(`Period : ${period}`, 14, 37);
    doc.text(`Daily Rate : ${formatLKR(r.perDayRate)}`, 14, 43);
    doc.line(14, 47, 196, 47);

    let y = 52;

    // Week breakdown table (if multiple weeks)
    if (weekBreakdown.length > 1) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Week-by-Week Breakdown", 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Week", "Period", "Worked Days", "Basic Earned", "OT Hrs", "OT Amount", "Gross", "Net"]],
        body: [
          ...weekBreakdown.map((w, i) => [
            `Week ${i + 1}`,
            `${w.wFrom} → ${w.wTo}`,
            w.workedDays,
            formatLKR(w.basicEarned),
            w.totalOTHours || "—",
            w.otAmount > 0 ? formatLKR(w.otAmount) : "—",
            formatLKR(w.grossSalary),
            formatLKR(w.netSalary),
          ]),
          [
            { content: "TOTAL", styles: { fontStyle: "bold" } },
            "",
            { content: weekBreakdown.reduce((s,w)=>s+w.workedDays,0), styles: { fontStyle: "bold" } },
            { content: formatLKR(weekBreakdown.reduce((s,w)=>s+w.basicEarned,0)), styles: { fontStyle: "bold" } },
            { content: round2(weekBreakdown.reduce((s,w)=>s+w.totalOTHours,0)), styles: { fontStyle: "bold" } },
            { content: formatLKR(weekBreakdown.reduce((s,w)=>s+w.otAmount,0)), styles: { fontStyle: "bold" } },
            { content: formatLKR(weekBreakdown.reduce((s,w)=>s+w.grossSalary,0)), styles: { fontStyle: "bold" } },
            { content: formatLKR(weekBreakdown.reduce((s,w)=>s+w.netSalary,0)), styles: { fontStyle: "bold", textColor: [22,163,74] } },
          ],
        ],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Daily attendance table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Daily Attendance", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Date", "IN", "OUT", "Working Hrs", "OT Hrs", "Day Salary", "OT Amount", "Status"]],
      body: r.dailyRows.map(row => {
        const worked = row.in !== null;
        const otAmt  = round2(row.otHrs * r.otRatePerHour);
        return [
          new Date(row.date).toLocaleDateString("en-LK", { weekday: "short", month: "short", day: "numeric" }),
          row.in  || "—",
          row.out || "—",
          row.working_hours,
          row.otHrs > 0 ? row.otHrs : "—",
          worked ? formatLKR(r.perDayRate) : "No Pay",
          otAmt > 0 ? formatLKR(otAmt) : "—",
          row.status || "—",
        ];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.section === "body" && data.cell.raw === "No Pay")
          data.cell.styles.textColor = [220, 38, 38];
      },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Salary summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Salary Calculation Summary", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Description", "Amount"]],
      body: [
        ["Daily Salary (Rate)",                                    formatLKR(r.basicMonthly)],
        [`Basic Earned (${r.workedDays} days × ${formatLKR(r.perDayRate)})`, formatLKR(r.basicEarned)],
        [`OT (${r.totalOTHours} hrs × ${formatLKR(r.otRatePerHour)}/hr)`,    formatLKR(r.otAmount)],
        ["Gross Salary",                                           formatLKR(r.grossSalary)],
        ...(r.epfDeduction > 0 ? [["EPF Deduction (8%)", `- ${formatLKR(r.epfDeduction)}`]] : []),
        [{ content: "NET SALARY", styles: { fontStyle: "bold", fontSize: 10 } },
         { content: formatLKR(r.netSalary), styles: { fontStyle: "bold", fontSize: 10, textColor: [22,163,74] } }],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [31, 41, 55] },
      columnStyles: { 1: { halign: "right" } },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text(`Generated on ${new Date().toLocaleDateString("en-LK")}`, 14, doc.internal.pageSize.height - 8);
      doc.text(`Page ${i} of ${pageCount}`, 196, doc.internal.pageSize.height - 8, { align: "right" });
    }

    doc.save(`salary_sheet_${empNo}_${r.fromDate}_${r.toDate}.pdf`);
  };

  return (
    <div>
      {/* Quick buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quickBtns.map(b => (
          <button key={b.key} onClick={() => applyQuick(b.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              activeQuick === b.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-blue-50"
            }`}>{b.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Employee</label>
          <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Select Employee --</option>
            {employees.map(e => (
              <option key={e.id} value={e.attendance_employee_no}>{e.full_name} ({e.attendance_employee_no})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">From</label>
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setActiveQuick(""); }}
            className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">To</label>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setActiveQuick(""); }}
            className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={calculate} disabled={!selectedEmp || isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-semibold">
          <Calculator className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-5">
          {/* Employee info + period */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white">
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <p className="text-lg font-bold">{result.emp.full_name}</p>
                <p className="text-blue-200 text-sm">{result.emp.attendance_employee_no} &bull; {result.emp.organizationAssignment?.department?.name || "—"}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-right">
                  <p className="text-xs text-blue-200">Period</p>
                  <p className="font-semibold">{result.fromDate} → {result.toDate}</p>
                </div>
                <button onClick={downloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg text-sm font-semibold transition-all">
                  <Download className="h-4 w-4" />
                  PDF
                </button>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Worked Days",    value: `${result.workedDays} days`,       color: "text-blue-700",   bg: "bg-blue-50" },
              { label: "Per Day Rate",   value: formatLKR(result.perDayRate),      color: "text-gray-700",   bg: "bg-gray-50" },
              { label: "Total OT Hrs",   value: `${result.totalOTHours} hrs`,      color: "text-purple-700", bg: "bg-purple-50" },
              { label: "Net Salary",     value: formatLKR(result.netSalary),       color: "text-green-700",  bg: "bg-green-50" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Daily attendance breakdown */}
          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b">
              <p className="text-sm font-bold text-gray-700">Daily Attendance Breakdown</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left   text-xs font-bold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">IN</th>
                    <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">OUT</th>
                    <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Working Hrs</th>
                    <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">OT Hrs</th>
                    <th className="px-4 py-2 text-right  text-xs font-bold text-gray-500 uppercase">Day Salary</th>
                    <th className="px-4 py-2 text-right  text-xs font-bold text-purple-600 uppercase">OT Amount</th>
                    <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.dailyRows.map((row, i) => {
                    const worked = row.in !== null;
                    const daySalary = worked ? result.perDayRate : 0;
                    const otAmt    = round2(row.otHrs * result.otRatePerHour);
                    return (
                      <tr key={i} className={worked ? "hover:bg-gray-50" : "bg-red-50"}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">
                          {new Date(row.date).toLocaleDateString("en-LK", { weekday: "short", month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {row.in ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">{row.in}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {row.out ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">{row.out}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-gray-700">{row.working_hours}</td>
                        <td className="px-4 py-2.5 text-center font-mono text-purple-700">{row.otHrs > 0 ? row.otHrs : "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{worked ? formatLKR(daySalary) : <span className="text-red-400">No Pay</span>}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-purple-700">{otAmt > 0 ? formatLKR(otAmt) : "—"}</td>
                        <td className="px-4 py-2.5 text-center">{statusBadge(row.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Week-by-week breakdown (only when multiple weeks) */}
          {weekBreakdown.length > 1 && (
            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-indigo-50 border-b">
                <p className="text-sm font-bold text-indigo-700">Week-by-Week Breakdown</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left   text-xs font-bold text-gray-500 uppercase">Week</th>
                      <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Worked Days</th>
                      <th className="px-4 py-2 text-right  text-xs font-bold text-gray-500 uppercase">Basic Earned</th>
                      <th className="px-4 py-2 text-center text-xs font-bold text-purple-600 uppercase">OT Hrs</th>
                      <th className="px-4 py-2 text-right  text-xs font-bold text-purple-600 uppercase">OT Amount</th>
                      <th className="px-4 py-2 text-right  text-xs font-bold text-gray-500 uppercase">Gross</th>
                      <th className="px-4 py-2 text-right  text-xs font-bold text-green-600 uppercase">Net</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weekBreakdown.map((w, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-xs text-gray-600">
                          <span className="font-semibold text-indigo-700">Week {i + 1}</span>
                          <br />
                          <span className="text-gray-400">{w.wFrom} → {w.wTo}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-semibold text-blue-700">{w.workedDays}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{formatLKR(w.basicEarned)}</td>
                        <td className="px-4 py-2.5 text-center font-mono text-purple-700">{w.totalOTHours > 0 ? w.totalOTHours : "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-purple-700">{w.otAmount > 0 ? formatLKR(w.otAmount) : "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatLKR(w.grossSalary)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-green-700">{formatLKR(w.netSalary)}</td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-green-50 font-bold">
                      <td className="px-4 py-3 text-sm text-gray-800">Total ({weekBreakdown.reduce((s,w)=>s+w.workedDays,0)} days)</td>
                      <td className="px-4 py-3 text-center text-blue-700">{weekBreakdown.reduce((s,w)=>s+w.workedDays,0)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatLKR(weekBreakdown.reduce((s,w)=>s+w.basicEarned,0))}</td>
                      <td className="px-4 py-3 text-center font-mono text-purple-700">{round2(weekBreakdown.reduce((s,w)=>s+w.totalOTHours,0))}</td>
                      <td className="px-4 py-3 text-right font-mono text-purple-700">{formatLKR(weekBreakdown.reduce((s,w)=>s+w.otAmount,0))}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatLKR(weekBreakdown.reduce((s,w)=>s+w.grossSalary,0))}</td>
                      <td className="px-4 py-3 text-right font-mono text-green-700 text-base">{formatLKR(weekBreakdown.reduce((s,w)=>s+w.netSalary,0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Salary Calculation Summary */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-700 mb-4">Salary Calculation Summary</p>
            <div className="space-y-2">
              {[
                ["Daily Salary",                           formatLKR(result.basicMonthly),   "text-gray-700"],
                [`Per Day Rate`,                           formatLKR(result.perDayRate),      "text-gray-700"],
                [`Basic Earned (${result.workedDays} days × ${formatLKR(result.perDayRate)})`, formatLKR(result.basicEarned), "text-gray-800"],
                [`OT (${result.totalOTHours} hrs × ${formatLKR(result.otRatePerHour)}/hr)`,    formatLKR(result.otAmount),    "text-purple-700"],
              ].map(([label, val, color], i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">{label}</span>
                  <span className={`font-mono font-semibold ${color}`}>{val}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Gross Salary</span>
                <span className="font-mono font-bold text-gray-900">{formatLKR(result.grossSalary)}</span>
              </div>
              {result.epfDeduction > 0 && (
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">EPF Deduction (8%)</span>
                  <span className="font-mono font-semibold text-red-600">- {formatLKR(result.epfDeduction)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2 pt-2">
                <span className="text-base font-bold text-gray-900">Net Salary</span>
                <span className="text-xl font-bold text-green-700 font-mono">{formatLKR(result.netSalary)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !isLoading && (
        <div className="text-center py-16 bg-white rounded-xl shadow border border-gray-100">
          <Calculator className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Select employee & period, then click Calculate</p>
          <p className="text-gray-400 text-sm mt-1">Salary is calculated based on attendance records</p>
        </div>
      )}
    </div>
  );
};

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
const getWeekRange = (offset = 0) => {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7) + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { from: fmt(monday), to: fmt(sunday) };
};

const AttendanceView = ({ employees }) => {
  const [selectedEmp, setSelectedEmp] = useState("");
  const [viewMode, setViewMode] = useState("weekly"); // "daily" | "weekly" | "monthly"
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeQuick, setActiveQuick] = useState("");
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const applyQuick = (key) => {
    setActiveQuick(key);
    const today = new Date().toISOString().split("T")[0];
    if (key === "today") {
      setFromDate(today); setToDate(today);
    } else if (key === "this_week") {
      const r = getWeekRange(0); setFromDate(r.from); setToDate(r.to);
    } else if (key === "last_week") {
      const r = getWeekRange(-1); setFromDate(r.from); setToDate(r.to);
    } else if (key === "this_month") {
      const d = new Date();
      const first = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
      setFromDate(first); setToDate(today);
    } else if (key === "last_month") {
      const d = new Date();
      const first = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split("T")[0];
      const last = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split("T")[0];
      setFromDate(first); setToDate(last);
    }
  };

  const quickBtns = [
    { key: "today", label: "Today" },
    { key: "this_week", label: "This Week" },
    { key: "last_week", label: "Last Week" },
    { key: "this_month", label: "This Month" },
    { key: "last_month", label: "Last Month" },
  ];

  const isInRecord  = (r) => r.inOut === "IN"  || ["IN", "Late Coming"].includes(r.status);
  const isOutRecord = (r) => r.inOut === "OUT" || ["OUT", "Early OUT"].includes(r.status);

  // Weekly summary — group by ISO week
  const weeklySummary = (() => {
    const weeks = {};
    records.forEach(r => {
      const d = r.actual_date || r.date;
      if (!d) return;
      const date = new Date(d);
      const day = date.getDay();
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((day + 6) % 7));
      const wKey = monday.toISOString().split("T")[0];
      if (!weeks[wKey]) weeks[wKey] = { wFrom: wKey, days: {} };
      if (!weeks[wKey].days[d]) weeks[wKey].days[d] = { date: d, in: null, out: null, working_hours: null, status: null };
      if (isInRecord(r))  { weeks[wKey].days[d].in = r.time; weeks[wKey].days[d].status = r.status; }
      if (isOutRecord(r)) { weeks[wKey].days[d].out = r.time; weeks[wKey].days[d].working_hours = r.working_hours; }
    });
    return Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b)).map(([wKey, w]) => ({
      wFrom: wKey,
      wTo: (() => { const d = new Date(wKey); d.setDate(d.getDate() + 6); return d.toISOString().split("T")[0]; })(),
      days: Object.values(w.days).sort((a, b) => a.date.localeCompare(b.date)),
      workedDays: Object.values(w.days).filter(d => d.in).length,
    }));
  })();

  // Monthly summary grouped by date
  const monthlySummary = Object.entries(
    records.reduce((acc, r) => {
      const d = r.actual_date || r.date || "Unknown";
      if (!acc[d]) acc[d] = { date: d, in: null, out: null, working_hours: null, status: null };
      if (isInRecord(r))  { acc[d].in = r.time; acc[d].status = r.status; }
      if (isOutRecord(r)) { acc[d].out = r.time; acc[d].working_hours = r.working_hours; }
      return acc;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b));

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
  }, [selectedEmp, fromDate, toDate]);

  const entryBadge = (inOut, entry, status) => {
    const isIn = isInRecord({ inOut, entry, status });
    const label = inOut || status || entry;
    if (!label) return <span className="text-gray-400 text-xs">—</span>;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${isIn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
        {label}
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

  // group by date — actual_date (night shift) or date
  const grouped = records.reduce((acc, r) => {
    const d = r.actual_date || r.date || "Unknown";
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {});

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setViewMode("weekly")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            viewMode === "weekly" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-blue-50"
          }`}>Weekly View</button>
        <button onClick={() => setViewMode("daily")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            viewMode === "daily" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-blue-50"
          }`}>Daily Records</button>
        <button onClick={() => setViewMode("monthly")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            viewMode === "monthly" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-blue-50"
          }`}>Monthly Summary</button>
      </div>

      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quickBtns.map((b) => (
          <button
            key={b.key}
            onClick={() => applyQuick(b.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              activeQuick === b.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

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
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setActiveQuick(""); }}
            className="p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">To Date</label>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setActiveQuick(""); }}
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
        ) : viewMode === "weekly" ? (
          <div className="space-y-4 p-4">
            {weeklySummary.length === 0 ? (
              <div className="text-center py-10 text-gray-400">No records found for selected range</div>
            ) : weeklySummary.map((week, wi) => (
              <div key={week.wFrom} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-indigo-50 px-4 py-2.5 flex justify-between items-center">
                  <span className="text-sm font-bold text-indigo-700">Week {wi + 1} &nbsp;·&nbsp; {week.wFrom} → {week.wTo}</span>
                  <span className="text-xs font-semibold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">{week.workedDays} days worked</span>
                </div>
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">IN</th>
                      <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">OUT</th>
                      <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Working Hrs</th>
                      <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {week.days.map(row => (
                      <tr key={row.date} className={row.in ? "hover:bg-gray-50" : "bg-red-50"}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">
                          {new Date(row.date).toLocaleDateString("en-LK", { weekday: "short", month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {row.in ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">{row.in}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {row.out ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">{row.out}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-gray-700">{row.working_hours || "—"}</td>
                        <td className="px-4 py-2.5 text-center">{statusBadge(row.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : viewMode === "monthly" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">IN Time</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">OUT Time</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Working Hours</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlySummary.map(([date, row]) => (
                  <tr key={date} className={row.in ? "hover:bg-gray-50" : "bg-red-50"}>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {new Date(date).toLocaleDateString("en-LK", { weekday: "short", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {row.in ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">{row.in}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {row.out ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">{row.out}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-3 text-center font-mono text-gray-700">{row.working_hours || "—"}</td>
                    <td className="px-6 py-3 text-center">{statusBadge(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                        <td className="px-6 py-3 text-sm text-gray-600">{r.actual_date || r.date || "—"}</td>
                        <td className="px-6 py-3 text-center">{entryBadge(r.inOut, r.entry, r.status)}</td>
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

/* ── Salary View ────────────────────────────────────────────────────── */
const MONTHS = [
  { v: "01", l: "January" },  { v: "02", l: "February" }, { v: "03", l: "March" },
  { v: "04", l: "April" },    { v: "05", l: "May" },       { v: "06", l: "June" },
  { v: "07", l: "July" },     { v: "08", l: "August" },   { v: "09", l: "September" },
  { v: "10", l: "October" },  { v: "11", l: "November" }, { v: "12", l: "December" },
];

const SalaryView = ({ employees }) => {
  const now = new Date();
  const [month, setMonth]       = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear]         = useState(String(now.getFullYear()));
  const [selectedEmp, setSelectedEmp] = useState("");
  const [records, setRecords]   = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [detail, setDetail]     = useState(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const params = { month, year };
      if (selectedEmp) params.employee_no = selectedEmp;
      const data = await getProcessedSalaries(params);
      const raw = Array.isArray(data) ? data : (data?.data || []);
      const laborNos = new Set(employees.map(e => e.attendance_employee_no));
      const filtered = raw.filter(r => laborNos.has(r.employee_no || r.emp_no));
      setRecords(filtered.map(r => ({
        ...r,
        salary_breakdown: typeof r.salary_breakdown === "string" ? JSON.parse(r.salary_breakdown) : (r.salary_breakdown || {}),
        allowances:       typeof r.allowances  === "string" ? JSON.parse(r.allowances)  : (r.allowances  || []),
        deductions:       typeof r.deductions  === "string" ? JSON.parse(r.deductions)  : (r.deductions  || []),
      })));
    } catch (err) {
      console.error("Salary load error:", err);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const totalNet   = records.reduce((s, r) => s + parseFloat(r.salary_breakdown?.net_salary   || 0), 0);
  const totalBasic = records.reduce((s, r) => s + parseFloat(r.basic_salary || 0), 0);
  const totalOT    = records.reduce((s, r) => s + parseFloat(r.ot_morning || 0) + parseFloat(r.ot_evening || 0), 0);

  const statusColor = s => ({ processed:"bg-blue-100 text-blue-700", issued:"bg-green-100 text-green-700", pending:"bg-yellow-100 text-yellow-700", hold:"bg-red-100 text-red-700" }[s] || "bg-gray-100 text-gray-600");

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Month</label>
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
          <input type="number" value={year} onChange={e => setYear(e.target.value)}
            className="w-24 p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Employee (optional)</label>
          <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Labor Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.attendance_employee_no}>{e.full_name} ({e.attendance_employee_no})</option>
            ))}
          </select>
        </div>
        <button onClick={load} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Loading..." : "Load"}
        </button>
      </div>

      {/* Summary cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Employees",   value: records.length,        color: "text-blue-700" },
            { label: "Total Basic", value: formatLKR(totalBasic), color: "text-gray-700" },
            { label: "Total OT",    value: formatLKR(totalOT),    color: "text-purple-700" },
            { label: "Total Net",   value: formatLKR(totalNet),   color: "text-green-700" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow border border-gray-100">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No salary records found</p>
            <p className="text-gray-400 text-sm mt-1">Select month / year and click Load</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left   text-xs font-bold text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-right  text-xs font-bold text-gray-500 uppercase">Basic</th>
                  <th className="px-4 py-3 text-right  text-xs font-bold text-gray-500 uppercase">OT Morning</th>
                  <th className="px-4 py-3 text-right  text-xs font-bold text-gray-500 uppercase">OT Night</th>
                  <th className="px-4 py-3 text-right  text-xs font-bold text-gray-500 uppercase">Allowances</th>
                  <th className="px-4 py-3 text-right  text-xs font-bold text-gray-500 uppercase">Deductions</th>
                  <th className="px-4 py-3 text-right  text-xs font-bold text-gray-500 uppercase">Gross</th>
                  <th className="px-4 py-3 text-right  text-xs font-bold text-green-600 uppercase">Net</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map(r => {
                  const sb = r.salary_breakdown;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{r.full_name}</p>
                        <p className="text-xs text-gray-400">{r.employee_no}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatLKR(r.basic_salary)}</td>
                      <td className="px-4 py-3 text-right font-mono text-purple-700">{formatLKR(r.ot_morning)}</td>
                      <td className="px-4 py-3 text-right font-mono text-purple-700">{formatLKR(r.ot_evening)}</td>
                      <td className="px-4 py-3 text-right font-mono text-blue-700">{formatLKR(sb?.total_allowances)}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-600">{formatLKR(sb?.total_deductions)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{formatLKR(sb?.gross_salary)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-green-700">{formatLKR(sb?.net_salary)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setDetail(r)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{detail.full_name}</h3>
                <p className="text-xs text-gray-400">{detail.employee_no} &bull; {MONTHS.find(m => m.v === detail.month)?.l || detail.month} {detail.year}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Earnings */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Earnings</p>
                <div className="space-y-1.5">
                  {[
                    ["Basic Salary",  detail.basic_salary],
                    ["OT Morning",    detail.ot_morning],
                    ["OT Night",      detail.ot_evening],
                    ["BR Allowance",  detail.salary_breakdown?.br_allowance],
                    ...(detail.allowances || []).map(a => [a.name || "Allowance", a.amount]),
                  ].map(([label, val], i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-mono font-semibold text-gray-800">{formatLKR(val)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t pt-1.5 mt-1">
                    <span>Gross Salary</span>
                    <span className="font-mono">{formatLKR(detail.salary_breakdown?.gross_salary)}</span>
                  </div>
                </div>
              </div>
              {/* Deductions */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Deductions</p>
                <div className="space-y-1.5">
                  {[
                    ["EPF (8%)",         detail.salary_breakdown?.epf_employee_deduction],
                    ["No Pay",           detail.salary_breakdown?.no_pay_deduction],
                    ["Loan Installment", detail.salary_breakdown?.loan_installment],
                    ["Stamp",            detail.salary_breakdown?.stamp],
                    ...(detail.deductions || []).map(d => [d.name || "Deduction", d.amount]),
                  ].map(([label, val], i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-mono font-semibold text-red-600">{formatLKR(val)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t pt-1.5 mt-1">
                    <span>Total Deductions</span>
                    <span className="font-mono text-red-600">{formatLKR(detail.salary_breakdown?.total_deductions)}</span>
                  </div>
                </div>
              </div>
              {/* Net */}
              <div className="bg-green-50 rounded-xl p-4 flex justify-between items-center">
                <span className="text-base font-bold text-gray-800">Net Salary</span>
                <span className="text-xl font-bold text-green-700 font-mono">{formatLKR(detail.salary_breakdown?.net_salary)}</span>
              </div>
              {/* EPF/ETF employer */}
              {detail.enable_epf_etf && (
                <div className="bg-blue-50 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-1">Employer Contributions</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">EPF Employer (12%)</span>
                    <span className="font-mono">{formatLKR(detail.salary_breakdown?.epf_employer_contribution)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ETF (3%)</span>
                    <span className="font-mono">{formatLKR(detail.salary_breakdown?.etf_employer_contribution)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 text-right rounded-b-2xl">
              <button onClick={() => setDetail(null)}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Component ────────────────────────────────────────────────── */
const LaborManagement = () => {
  const [view, setView] = useState("list"); // "list" | "attendance" | "salary"
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
    { id: "list",           label: "Employee List",        icon: Users },
    { id: "attendance",     label: "Attendance (IN / OUT)", icon: Clock },
    { id: "weeklySalary",   label: "Weekly Salary",         icon: Calculator },
    { id: "salary",         label: "Salary View",           icon: DollarSign },
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
        {view === "attendance" && <AttendanceView employees={employees} />}

        {/* ── WEEKLY SALARY VIEW ── */}
        {view === "weeklySalary" && <WeeklySalaryView employees={employees} />}

        {/* ── SALARY VIEW ── */}
        {view === "salary" && <SalaryView employees={employees} />}

      </div>
    </div>
  );
};

export default LaborManagement;
