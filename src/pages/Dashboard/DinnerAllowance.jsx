import React, { useState, useEffect } from "react";
import { Search, Check, X, DollarSign, Download, FileText } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@utils/axios"; // Adjust path as needed
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // නිවැරදි කළ Import එක
import DatePickerInput from "../../../src/components/DatePickerInput";

const DinnerAllowance = () => {
  const [activeTab, setActiveTab] = useState("daily"); // 'daily' or 'monthly'

  // Daily State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dailyData, setDailyData] = useState([]);
  const [defaultAmount, setDefaultAmount] = useState(500); // රෑ කෑමට සාමාන්‍ය ගාණ

  // Monthly State
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);

  const [loading, setLoading] = useState(false);

  const monthsList = [
    { value: 1, label: "January" }, { value: 2, label: "February" },
    { value: 3, label: "March" }, { value: 4, label: "April" },
    { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" },
    { value: 9, label: "September" }, { value: 10, label: "October" },
    { value: 11, label: "November" }, { value: 12, label: "December" },
  ];

  // Load Daily Data
  const fetchDailyData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/dinner-allowance/daily?date=${date}`);
      setDailyData(response.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to fetch daily data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load Monthly Data
  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/dinner-allowance/monthly?month=${month}&year=${year}`);
      setMonthlyData(response.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to fetch monthly data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "daily") {
      fetchDailyData();
    } else {
      fetchMonthlyData();
    }
  }, [date, month, year, activeTab]);

  // Handle Approve / Reject
  const handleProcess = async (employee_id, action) => {
    try {
      await axios.post('/dinner-allowance/process', {
        employee_id: employee_id,
        date: date,
        status: action, // 'Approved' or 'Rejected'
        amount: defaultAmount
      });

      Swal.fire({
        icon: 'success',
        title: `${action}!`,
        timer: 1500,
        showConfirmButton: false
      });
      fetchDailyData(); // Refresh list
    } catch (error) {
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

  // Calculations
  const dailyTotalBill = dailyData
    .filter(item => item.approval_status === 'Approved')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const monthlyTotalCost = monthlyData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  // ==========================================
  // 1. EXCEL EXPORT FUNCTIONS
  // ==========================================
  const exportDailyExcel = () => {
    const approvedData = dailyData.filter(item => item.approval_status === 'Approved');
    if (approvedData.length === 0) {
      Swal.fire("No Data", "There are no approved records to export for this date.", "info");
      return;
    }

    const exportData = approvedData.map((emp, index) => ({
      "No.": index + 1,
      "Emp No": emp.emp_no,
      "Employee Name": emp.full_name,
      "In Time": emp.in_time || "-",
      "Out Time": emp.out_time || "-",
      "Amount (Rs)": Number(emp.amount || defaultAmount).toFixed(2),
      "Status": "Approved"
    }));

    exportData.push({
      "No.": "", "Emp No": "", "Employee Name": "", "In Time": "",
      "Out Time": "TOTAL BILL:", "Amount (Rs)": dailyTotalBill.toFixed(2), "Status": ""
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Dinner Allowances");
    XLSX.writeFile(wb, `Daily_Dinner_Allowance_${date}.xlsx`);
  };

  const exportMonthlyExcel = () => {
    if (monthlyData.length === 0) {
      Swal.fire("No Data", "There are no records to export for this month.", "info");
      return;
    }

    const exportData = monthlyData.map((emp, index) => ({
      "No.": index + 1,
      "Emp No": emp.emp_no,
      "Employee Name": emp.full_name,
      "Approved Days": emp.total_days,
      "Total Amount (Rs)": Number(emp.total_amount).toFixed(2)
    }));

    exportData.push({
      "No.": "", "Emp No": "", "Employee Name": "TOTAL MONTHLY COST:",
      "Approved Days": "", "Total Amount (Rs)": monthlyTotalCost.toFixed(2)
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Dinner Allowance");
    XLSX.writeFile(wb, `Monthly_Dinner_Allowance_${year}_${month}.xlsx`);
  };


  // ==========================================
  // 2. PDF EXPORT FUNCTIONS (FIXED)
  // ==========================================
  const exportDailyPDF = () => {
    const approvedData = dailyData.filter(item => item.approval_status === 'Approved');
    if (approvedData.length === 0) {
      Swal.fire("No Data", "There are no approved records to export for this date.", "info");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Daily Dinner Allowances - ${date}`, 14, 15);

    const tableColumn = ["No.", "Emp No", "Name", "In Time", "Out Time", "Amount (Rs)"];
    const tableRows = [];

    approvedData.forEach((emp, index) => {
      tableRows.push([
        index + 1,
        emp.emp_no,
        emp.full_name,
        emp.in_time || "-",
        emp.out_time || "-",
        Number(emp.amount || defaultAmount).toFixed(2)
      ]);
    });

    // Total Row
    tableRows.push(["", "", "", "", "TOTAL BILL:", dailyTotalBill.toFixed(2)]);

    // නිවැරදි autoTable භාවිතය
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
    });

    doc.save(`Daily_Dinner_Allowance_${date}.pdf`);
  };

  const exportMonthlyPDF = () => {
    if (monthlyData.length === 0) {
      Swal.fire("No Data", "There are no records to export for this month.", "info");
      return;
    }

    const doc = new jsPDF();
    const monthName = monthsList.find(m => m.value == month)?.label || month;

    doc.setFontSize(14);
    doc.text(`Monthly Dinner Allowances - ${monthName} ${year}`, 14, 15);

    const tableColumn = ["No.", "Emp No", "Employee Name", "Approved Days", "Total Amount (Rs)"];
    const tableRows = [];

    monthlyData.forEach((emp, index) => {
      tableRows.push([
        index + 1,
        emp.emp_no,
        emp.full_name,
        emp.total_days,
        Number(emp.total_amount).toFixed(2)
      ]);
    });

    // Total Row
    tableRows.push(["", "", "TOTAL MONTHLY COST:", "", monthlyTotalCost.toFixed(2)]);

    // නිවැරදි autoTable භාවිතය
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });

    doc.save(`Monthly_Dinner_Allowance_${year}_${month}.pdf`);
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="text-orange-500" /> Dinner Allowances (After 7:30 PM)
          </h1>
          <p className="text-gray-500">Manage daily dinner payments and view monthly summaries.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          className={`pb-3 px-4 font-semibold ${activeTab === 'daily' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('daily')}
        >
          Daily Approvals
        </button>
        <button
          className={`pb-3 px-4 font-semibold ${activeTab === 'monthly' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly Summary
        </button>
      </div>

      {/* --- DAILY TAB --- */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex flex-wrap gap-4 mb-6 items-end justify-between">
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <DatePickerInput
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowance Amount (Rs)</label>
                <input
                  type="number"
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-32 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button onClick={fetchDailyData} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Check Eligible List
              </button>
            </div>

            {/* Daily Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={exportDailyExcel}
                className="bg-green-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={18} /> Excel
              </button>
              <button
                onClick={exportDailyPDF}
                className="bg-red-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FileText size={18} /> PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">Emp No</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">In Time</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Out Time</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
                ) : dailyData.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-gray-500">No employees left after 7:30 PM on this date.</td></tr>
                ) : (
                  dailyData.map((emp, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{emp.emp_no}</td>
                      <td className="px-4 py-3">{emp.full_name}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{emp.in_time || '-'}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">{emp.out_time || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.approval_status === 'Approved' ? 'bg-green-100 text-green-800' :
                          emp.approval_status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {emp.approval_status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button
                          onClick={() => handleProcess(emp.employee_id, 'Approved')}
                          className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-100 border border-green-200" title="Approve"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleProcess(emp.employee_id, 'Rejected')}
                          className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 border border-red-200" title="Reject"
                        >
                          <X size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Daily Summary */}
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex justify-between items-center">
            <span className="font-bold text-gray-700">Total Approved Bill for {date} :</span>
            <span className="text-2xl font-extrabold text-orange-600">Rs. {dailyTotalBill.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* --- MONTHLY TAB --- */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex flex-wrap gap-4 mb-6 items-end justify-between">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2">
                  {monthsList.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 w-24" />
              </div>
              <button onClick={fetchMonthlyData} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Generate
              </button>
            </div>

            {/* Monthly Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={exportMonthlyExcel}
                className="bg-green-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={18} /> Excel
              </button>
              <button
                onClick={exportMonthlyPDF}
                className="bg-red-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FileText size={18} /> PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">Emp No</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Employee Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Approved Days</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Total Amount (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-8">Loading...</td></tr>
                ) : monthlyData.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-8 text-gray-500">No dinner allowances found for this month.</td></tr>
                ) : (
                  monthlyData.map((emp, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{emp.emp_no}</td>
                      <td className="px-4 py-3">{emp.full_name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">{emp.total_days} Days</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-700">{Number(emp.total_amount).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Monthly Summary */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
            <span className="font-bold text-gray-700">Total Dinner Cost for {monthsList.find(m => m.value == month)?.label} {year} :</span>
            <span className="text-2xl font-extrabold text-blue-700">Rs. {monthlyTotalCost.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DinnerAllowance;