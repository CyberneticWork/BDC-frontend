import React, { useState } from "react";
import { 
  FileSpreadsheet, Building2, Download, 
  FileText, FileBarChart, Loader2, FileCheck, Wallet, CreditCard, Scissors, Gift, Clock, Banknote, X
} from "lucide-react";
import Swal from "sweetalert2";
import ReportService from "../../services/ReportService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const NOTES_ARRAY = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showCoinageModal, setShowCoinageModal] = useState(false);
  const [coinageFormat, setCoinageFormat] = useState("pdf");
  const [editableCoinage, setEditableCoinage] = useState([]);

  const months = [
    { value: "01", label: "January" }, { value: "02", label: "February" },
    { value: "03", label: "March" }, { value: "04", label: "April" },
    { value: "05", label: "May" }, { value: "06", label: "June" },
    { value: "07", label: "July" }, { value: "08", label: "August" },
    { value: "09", label: "September" }, { value: "10", label: "October" },
    { value: "11", label: "November" }, { value: "12", label: "December" },
  ];
  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  const handleFetchData = async () => {
    try {
      setIsLoading(true);
      const data = await ReportService.getMonthlyReportData(selectedMonth, selectedYear);
      setReportData(data);
      if(data.length === 0) Swal.fire("No Data", "No salaries processed for this month.", "info");
      else Swal.fire({ icon: "success", title: "Data Loaded", text: `Ready to generate reports for ${data.length} employees.`, timer: 1500, showConfirmButton: false });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      Swal.fire("Error", `Failed: ${JSON.stringify(errorMsg)}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const generateMasterData = () => {
    const uniqueAllowances = new Set(); const uniqueBonuses = new Set(); const uniqueDeductions = new Set();
    reportData.forEach(e => {
       (e.raw_allowances || []).forEach(a => uniqueAllowances.add(a.name));
       (e.raw_bonuses || []).forEach(b => uniqueBonuses.add(b.name));
       (e.raw_deductions || []).forEach(d => uniqueDeductions.add(d.name));
    });
    const allowHeaders = Array.from(uniqueAllowances); const bonusHeaders = Array.from(uniqueBonuses); const dedHeaders = Array.from(uniqueDeductions);
    const headers = ["Emp No", "Name", "Basic Salary", ...allowHeaders, ...bonusHeaders, "Gross Salary", "EPF 8%", "No Pay", "Loan Deductions", ...dedHeaders, "Total Deductions", "Net Pay", "Employer EPF 12%", "ETF 3%"];
    let rows = []; let totals = new Array(headers.length).fill(0);

    reportData.forEach(e => {
      let row = [e.emp_no, e.name, e.basic_salary.toFixed(2)]; totals[2] += e.basic_salary;
      allowHeaders.forEach((h, i) => { let amt = ((e.raw_allowances || []).find(a => a.name === h) || {}).amount || 0; row.push(parseFloat(amt).toFixed(2)); totals[3 + i] += parseFloat(amt); });
      let bonusOffset = 3 + allowHeaders.length;
      bonusHeaders.forEach((h, i) => { let amt = ((e.raw_bonuses || []).find(b => b.name === h) || {}).amount || 0; row.push(parseFloat(amt).toFixed(2)); totals[bonusOffset + i] += parseFloat(amt); });
      let grossIdx = bonusOffset + bonusHeaders.length;
      row.push(e.gross_salary.toFixed(2)); totals[grossIdx] += e.gross_salary;
      let epf8 = e.epf_8 || 0; let noPay = e.no_pay_amount || 0; let loan = (e.loan_installment || 0) + (e.loan_interest || 0);
      row.push(epf8.toFixed(2)); totals[grossIdx + 1] += epf8; row.push(noPay.toFixed(2)); totals[grossIdx + 2] += noPay; row.push(loan.toFixed(2)); totals[grossIdx + 3] += loan;
      let dedOffset = grossIdx + 4;
      dedHeaders.forEach((h, i) => { let amt = ((e.raw_deductions || []).find(d => d.name === h) || {}).amount || 0; row.push(parseFloat(amt).toFixed(2)); totals[dedOffset + i] += parseFloat(amt); });
      let totDedIdx = dedOffset + dedHeaders.length;
      row.push(e.total_deductions.toFixed(2)); totals[totDedIdx] += e.total_deductions;
      let netIdx = totDedIdx + 1;
      row.push(e.net_salary.toFixed(2)); totals[netIdx] += e.net_salary;
      let epf12 = e.epf_12 || 0; let etf3 = e.etf_3 || 0;
      row.push(epf12.toFixed(2)); totals[netIdx + 1] += epf12; row.push(etf3.toFixed(2)); totals[netIdx + 2] += etf3;
      rows.push(row);
    });

    let footer = ["", "TOTAL"];
    for (let i = 2; i < totals.length; i++) { footer.push(totals[i].toFixed(2)); }
    return { headers, rows, footer };
  };

  // 🔥 මෙතනින් තමයි හරියටම Bank Amount එක ගන්නේ
  const generateBankData = () => {
    let rows = []; let totalAmount = 0;
    reportData.forEach(e => {
      let amount = e.bank_amount || 0;
      if (amount > 0) { 
        rows.push([e.emp_no, e.name, e.bank, e.branch, e.account, amount.toFixed(2)]); 
        totalAmount += amount; 
      }
    });
    return { headers: ["Emp No", "Name", "Bank", "Branch", "Account No", "Bank Net Amount"], rows, footer: ["", "", "", "", "TOTAL AMOUNT", totalAmount.toFixed(2)] };
  };

  const generateEPFData = () => {
    let rows = []; let tBase = 0, tEmp8 = 0, tEmp12 = 0, tEpf20 = 0, tEtf3 = 0;
    reportData.forEach(e => {
      if (e.enable_epf_etf === 1 && (e.epf_8 + e.epf_12) > 0) {
        let totalEpf = e.epf_8 + e.epf_12;
        rows.push([e.emp_no, e.name, e.epf_base.toFixed(2), e.epf_12.toFixed(2), e.epf_8.toFixed(2), totalEpf.toFixed(2), e.etf_3.toFixed(2)]);
        tBase += e.epf_base; tEmp12 += e.epf_12; tEmp8 += e.epf_8; tEpf20 += totalEpf; tEtf3 += e.etf_3;
      }
    });
    return { headers: ["Member No", "Name", "Salary for EPF", "Employer 12%", "Employee 8%", "Total EPF 20%", "ETF 3%"], rows, footer: ["", "TOTAL", tBase.toFixed(2), tEmp12.toFixed(2), tEmp8.toFixed(2), tEpf20.toFixed(2), tEtf3.toFixed(2)] };
  };

  const generateAllowancesOnlyData = () => {
    const uniqueNames = new Set();
    reportData.forEach(e => { (e.raw_allowances || []).forEach(a => uniqueNames.add(a.name)); });
    const dynamicHeaders = Array.from(uniqueNames);
    let rows = []; let columnTotals = new Array(dynamicHeaders.length).fill(0); let tTotal = 0;
    reportData.forEach(e => {
      let row = [e.emp_no, e.name]; let empTotalAdditions = 0;
      dynamicHeaders.forEach((headerName, index) => {
        let item = (e.raw_allowances || []).find(a => a.name === headerName);
        let amount = item ? parseFloat(item.amount) : 0;
        row.push(amount.toFixed(2)); columnTotals[index] += amount; empTotalAdditions += amount;
      });
      if(empTotalAdditions > 0) { row.push(empTotalAdditions.toFixed(2)); tTotal += empTotalAdditions; rows.push(row); }
    });
    if (dynamicHeaders.length === 0) return { headers: ["Emp No", "Name", "No Allowances"], rows: [], footer: [] };
    return { headers: ["Emp No", "Name", ...dynamicHeaders, "Total Allowances"], rows, footer: ["", "TOTAL", ...columnTotals.map(t => t.toFixed(2)), tTotal.toFixed(2)] };
  };

  const generateBonusesOnlyData = () => {
    const uniqueNames = new Set();
    reportData.forEach(e => { (e.raw_bonuses || []).forEach(b => uniqueNames.add(b.name)); });
    const dynamicHeaders = Array.from(uniqueNames);
    let rows = []; let columnTotals = new Array(dynamicHeaders.length).fill(0); let tTotal = 0;
    reportData.forEach(e => {
      let row = [e.emp_no, e.name]; let empTotalBonuses = 0;
      dynamicHeaders.forEach((headerName, index) => {
        let item = (e.raw_bonuses || []).find(b => b.name === headerName);
        let amount = item ? parseFloat(item.amount) : 0;
        row.push(amount.toFixed(2)); columnTotals[index] += amount; empTotalBonuses += amount;
      });
      if (empTotalBonuses > 0) { row.push(empTotalBonuses.toFixed(2)); rows.push(row); tTotal += empTotalBonuses; }
    });
    if (dynamicHeaders.length === 0) return { headers: ["Emp No", "Name", "No Bonuses Found"], rows: [], footer: [] };
    return { headers: ["Emp No", "Name", ...dynamicHeaders, "Total Bonuses"], rows, footer: ["", "TOTAL", ...columnTotals.map(t => t.toFixed(2)), tTotal.toFixed(2)] };
  };

  const generateDynamicDeductionsData = () => {
    const uniqueNames = new Set();
    reportData.forEach(e => { (e.raw_deductions || []).forEach(d => uniqueNames.add(d.name)); });
    const dynamicHeaders = Array.from(uniqueNames);
    let rows = []; let columnTotals = new Array(dynamicHeaders.length).fill(0); let tTotal = 0;
    reportData.forEach(e => {
      let row = [e.emp_no, e.name]; let empTotalDeds = 0;
      dynamicHeaders.forEach((headerName, index) => {
        let item = (e.raw_deductions || []).find(d => d.name === headerName);
        let amount = item ? parseFloat(item.amount) : 0;
        row.push(amount.toFixed(2)); columnTotals[index] += amount; empTotalDeds += amount;
      });
      if (empTotalDeds > 0) { row.push(empTotalDeds.toFixed(2)); rows.push(row); tTotal += empTotalDeds; }
    });
    if (dynamicHeaders.length === 0) return { headers: ["Emp No", "Name", "No Custom Deductions"], rows: [], footer: [] };
    return { headers: ["Emp No", "Name", ...dynamicHeaders, "Total Custom Deductions"], rows, footer: ["", "TOTAL", ...columnTotals.map(t => t.toFixed(2)), tTotal.toFixed(2)] };
  };

  const generateLoanData = () => {
    let rows = []; let tAmount = 0, tInst = 0, tInt = 0, tDed = 0, tOut = 0;
    reportData.forEach(e => {
      if (e.loan_amount > 0) {
        let totDed = e.loan_installment + e.loan_interest; let outStanding = Math.max(0, e.loan_amount - e.loan_installment);
        rows.push([e.emp_no, e.name, e.loan_amount.toFixed(2), e.loan_installment.toFixed(2), e.loan_interest.toFixed(2), totDed.toFixed(2), outStanding.toFixed(2)]);
        tAmount += e.loan_amount; tInst += e.loan_installment; tInt += e.loan_interest; tDed += totDed; tOut += outStanding;
      }
    });
    return { headers: ["Emp No", "Name", "Loan Amount", "Installment", "Interest", "Total Deduction", "Balance Outstanding"], rows, footer: ["", "TOTAL", tAmount.toFixed(2), tInst.toFixed(2), tInt.toFixed(2), tDed.toFixed(2), tOut.toFixed(2)] };
  };

  const generateNoPayData = () => {
    let rows = []; let tDays = 0, tAmount = 0;
    reportData.forEach(e => {
      if (e.no_pay_amount > 0 || e.no_pay_days > 0) {
        rows.push([e.emp_no, e.name, e.no_pay_days.toString(), e.no_pay_amount.toFixed(2)]);
        tDays += e.no_pay_days; tAmount += e.no_pay_amount;
      }
    });
    return { headers: ["Emp No", "Name", "No Pay Days", "Deduction Amount"], rows, footer: ["", "TOTAL", tDays.toString(), tAmount.toFixed(2)] };
  };

  const generateOTData = () => {
    let rows = []; let tMornHrs = 0, tMornFees = 0, tNightHrs = 0, tNightFees = 0, tHolHrs = 0, tHolFees = 0, tTotFees = 0;
    reportData.forEach(e => {
      let totFees = (e.ot_morning_fees || 0) + (e.ot_night_fees || 0) + (e.holiday_ot_fees || 0);
      if (totFees > 0) {
        rows.push([e.emp_no, e.name, (e.ot_morning_hours || 0).toFixed(2), (e.ot_morning_fees || 0).toFixed(2), (e.ot_night_hours || 0).toFixed(2), (e.ot_night_fees || 0).toFixed(2), (e.holiday_ot_hours || 0).toFixed(2), (e.holiday_ot_fees || 0).toFixed(2), totFees.toFixed(2)]);
        tMornHrs += (e.ot_morning_hours || 0); tMornFees += (e.ot_morning_fees || 0); tNightHrs += (e.ot_night_hours || 0); tNightFees += (e.ot_night_fees || 0); tHolHrs += (e.holiday_ot_hours || 0); tHolFees += (e.holiday_ot_fees || 0); tTotFees += totFees;
      }
    });
    const headers = ["Emp No", "Name", "Morning OT (Hrs)", "Morning OT (Rs)", "Night OT (Hrs)", "Night OT (Rs)", "Holiday OT (Hrs)", "Holiday OT (Rs)", "Total OT (Rs)"];
    const footer = ["", "TOTAL", tMornHrs.toFixed(2), tMornFees.toFixed(2), tNightHrs.toFixed(2), tNightFees.toFixed(2), tHolHrs.toFixed(2), tHolFees.toFixed(2), tTotFees.toFixed(2)];
    if (rows.length === 0) return { headers: ["Emp No", "Name", "No Overtime Recorded"], rows: [], footer: [] };
    return { headers, rows, footer };
  };

  const openCoinageEditor = (format) => {
    if (reportData.length === 0) return Swal.fire("Warning", "Please load data first!", "warning");
    let initialData = [];
    reportData.forEach(e => {
      let amount = Math.round(e.cash_amount || 0);
      if (amount > 0) {
        if (e.saved_coinage) {
          initialData.push({ process_id: e.process_id, emp_no: e.emp_no, name: e.name, amount: amount, notes: e.saved_coinage });
        } else {
          let counts = {}; let temp = amount;
          NOTES_ARRAY.forEach(note => { counts[note] = Math.floor(temp / note); temp = temp % note; });
          initialData.push({ process_id: e.process_id, emp_no: e.emp_no, name: e.name, amount: amount, notes: counts });
        }
      }
    });
    if (initialData.length === 0) return Swal.fire("Empty", "No cash payments recorded for this month.", "info");
    setEditableCoinage(initialData); setCoinageFormat(format); setShowCoinageModal(true);
  };

  const handleNoteChange = (empIndex, noteValue, newCount) => {
    const updated = [...editableCoinage];
    updated[empIndex].notes[noteValue] = parseInt(newCount) || 0;
    setEditableCoinage(updated);
  };

  const processAndDownloadCoinage = async () => {
    try {
      await ReportService.saveCoinageData(editableCoinage);
      let rows = []; let noteTotals = new Array(NOTES_ARRAY.length).fill(0); let totalCash = 0;
      editableCoinage.forEach(emp => {
        let row = [emp.emp_no, emp.name, emp.amount.toFixed(2)];
        totalCash += emp.amount;
        NOTES_ARRAY.forEach((note, index) => {
          let count = emp.notes[note] || 0;
          row.push(count.toString());
          noteTotals[index] += count;
        });
        rows.push(row);
      });
      const headers = ["Emp No", "Name", "Cash Amount", ...NOTES_ARRAY.map(n => `Rs. ${n}`)];
      const footer = ["", "TOTAL", totalCash.toFixed(2), ...noteTotals.map(n => n.toString())];
      const dataFunc = () => ({ headers, rows, footer });

      if (coinageFormat === 'csv') downloadCSV(dataFunc, "Cash_Coinage_Summary");
      else downloadPDF(dataFunc, "Cash Coinage Summary", "Cash_Coinage_Summary");
      setShowCoinageModal(false);
      handleFetchData();
    } catch (error) {
      Swal.fire("Error", "Failed to save coinage data. Please try again.", "error");
    }
  };

  const downloadCSV = (dataFunc, filename) => {
    if (reportData.length === 0) return Swal.fire("Warning", "Please load data first!", "warning");
    const { headers, rows, footer } = dataFunc();
    if (rows.length === 0) return Swal.fire("Empty", "No data available for this report.", "info");
    let csvContent = "\uFEFF" + headers.join(",") + "\n";
    rows.forEach(r => { csvContent += r.map(v => `"${v}"`).join(",") + "\n"; });
    if (footer && footer.length > 0) csvContent += footer.map(v => `"${v}"`).join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); 
    link.setAttribute("download", `${filename}_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  const downloadPDF = (dataFunc, title, filename) => {
    if (reportData.length === 0) return Swal.fire("Warning", "Please load data first!", "warning");
    const { headers, rows, footer } = dataFunc();
    if (rows.length === 0) return Swal.fire("Empty", "No data available for this report.", "info");
    const isWideTable = headers.length > 9;
    const doc = new jsPDF("landscape", "mm", isWideTable ? "a3" : "a4");
    doc.setFontSize(isWideTable ? 18 : 16);
    doc.text(`${title} - ${selectedMonth}/${selectedYear}`, 14, 15);
    autoTable(doc, {
      startY: 25, head: [headers], body: rows, foot: footer.length > 0 ? [footer] : [],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      styles: { fontSize: isWideTable ? 7 : 9, cellPadding: 2 }
    });
    doc.save(`${filename}_${selectedYear}_${selectedMonth}.pdf`);
  };

  const reportCards = [
    { id: 1, title: "Full Master Payroll", desc: "Complete summary with all additions & deductions.", icon: <FileBarChart className="w-6 h-6 text-indigo-600" />, func: generateMasterData, file: "Full_Master_Payroll" },
    { id: 2, title: "Bank Transfer File", desc: "Exact Bank Net Amount sent to accounts.", icon: <Building2 className="w-6 h-6 text-green-600" />, func: generateBankData, file: "Bank_Transfer" },
    { id: 3, title: "Schedule 06: EPF & ETF", desc: "8%, 12% and 3% contributions.", icon: <FileText className="w-6 h-6 text-blue-600" />, func: generateEPFData, file: "EPF_ETF_Sch06" },
    { id: 4, title: "Overtime Summary", desc: "Morning, Night, and Holiday OT breakdown.", icon: <Clock className="w-6 h-6 text-sky-600" />, func: generateOTData, file: "Overtime_Summary" },
    { id: 5, title: "Dynamic Allowances", desc: "Breakdown of all allowances only.", icon: <Wallet className="w-6 h-6 text-purple-600" />, func: generateAllowancesOnlyData, file: "Allowances_Report" },
    { id: 6, title: "Dynamic Bonuses", desc: "Breakdown of bonuses only.", icon: <Gift className="w-6 h-6 text-teal-600" />, func: generateBonusesOnlyData, file: "Bonuses_Report" },
    { id: 7, title: "Custom Deductions", desc: "Dynamic breakdown of custom deductions.", icon: <Scissors className="w-6 h-6 text-pink-600" />, func: generateDynamicDeductionsData, file: "Custom_Deductions" },
    { id: 8, title: "Staff Loans", desc: "Loan installments, interest and balance.", icon: <CreditCard className="w-6 h-6 text-orange-600" />, func: generateLoanData, file: "Staff_Loans" },
    { id: 9, title: "No Pay Details", desc: "Deductions based on absent days.", icon: <FileCheck className="w-6 h-6 text-red-600" />, func: generateNoPayData, file: "NoPay_Details" },
    { id: 10, title: "Cash Coinage Summary", desc: "Interactive Note breakdown for cash payouts.", icon: <Banknote className="w-6 h-6 text-emerald-600" />, isCoinage: true }
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto relative">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileSpreadsheet className="text-blue-600"/> Payroll Documents & Schedules</h1>
            <p className="text-gray-500 text-sm mt-1">Load data first, then download Excel or PDF with Totals.</p>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-32 px-3 py-2 border rounded-lg bg-gray-50 outline-none">
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-24 px-3 py-2 border rounded-lg bg-gray-50 outline-none">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={handleFetchData} disabled={isLoading} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-70">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} Load Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {reportCards.map((card) => (
            <div key={card.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-gray-50 rounded-xl">{card.icon}</div>
                  <h3 className="text-md font-bold text-gray-800 leading-tight">{card.title}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-5">{card.desc}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => card.isCoinage ? openCoinageEditor('csv') : downloadCSV(card.func, card.file)} className="flex-1 py-2 text-xs font-semibold bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200">
                  Excel
                </button>
                <button onClick={() => card.isCoinage ? openCoinageEditor('pdf') : downloadPDF(card.func, card.title, card.file)} className="flex-1 py-2 text-xs font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200">
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCoinageModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Banknote className="text-emerald-600"/> Edit Coinage Breakdown</h2>
                <p className="text-xs text-gray-500 mt-1">Adjust the note counts manually. Check the 'Row Total' to ensure it matches the 'Cash Amount'.</p>
              </div>
              <button onClick={() => setShowCoinageModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-gray-100 text-gray-700 sticky top-0">
                  <tr>
                    <th className="p-3">Emp No</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Cash Amount</th>
                    {NOTES_ARRAY.map(n => <th key={n} className="p-3 text-center">Rs.{n}</th>)}
                    <th className="p-3 text-right">Row Total</th>
                  </tr>
                </thead>
                <tbody>
                  {editableCoinage.map((emp, empIdx) => {
                    let rowSum = NOTES_ARRAY.reduce((sum, note) => sum + (note * (emp.notes[note] || 0)), 0);
                    let isMismatch = rowSum !== emp.amount;
                    return (
                      <tr key={empIdx} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{emp.emp_no}</td>
                        <td className="p-3">{emp.name}</td>
                        <td className="p-3 font-bold text-gray-700">{emp.amount.toFixed(2)}</td>
                        {NOTES_ARRAY.map(note => (
                          <td key={note} className="p-2">
                            <input 
                              type="number" min="0" 
                              value={emp.notes[note] === 0 ? '' : emp.notes[note]} 
                              placeholder="0"
                              onChange={(e) => handleNoteChange(empIdx, note, e.target.value)}
                              className="w-14 p-1.5 border rounded text-center focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                            />
                          </td>
                        ))}
                        <td className={`p-3 text-right font-bold ${isMismatch ? 'text-red-500 bg-red-50' : 'text-emerald-600'}`}>{rowSum.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowCoinageModal(false)} className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={processAndDownloadCoinage} className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                <Download size={18}/> Export & Save Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;




/*
import React, { useState } from "react";
import { 
  FileSpreadsheet, Building2, Download, 
  FileText, FileBarChart, Loader2, FileCheck, Wallet, CreditCard, Scissors, Gift, Clock
} from "lucide-react";
import Swal from "sweetalert2";
import ReportService from "../../services/ReportService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const months = [
    { value: "01", label: "January" }, { value: "02", label: "February" },
    { value: "03", label: "March" }, { value: "04", label: "April" },
    { value: "05", label: "May" }, { value: "06", label: "June" },
    { value: "07", label: "July" }, { value: "08", label: "August" },
    { value: "09", label: "September" }, { value: "10", label: "October" },
    { value: "11", label: "November" }, { value: "12", label: "December" },
  ];
  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  const handleFetchData = async () => {
    try {
      setIsLoading(true);
      const data = await ReportService.getMonthlyReportData(selectedMonth, selectedYear);
      setReportData(data);
      if(data.length === 0) Swal.fire("No Data", "No salaries processed for this month.", "info");
      else Swal.fire({ icon: "success", title: "Data Loaded", text: `Ready to generate reports for ${data.length} employees.`, timer: 1500, showConfirmButton: false });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      Swal.fire("Error", `Failed: ${JSON.stringify(errorMsg)}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
 
  // =========================================================

  const generateMasterData = () => {
    const uniqueAllowances = new Set();
    const uniqueBonuses = new Set();
    const uniqueDeductions = new Set();

    reportData.forEach(e => {
       (e.raw_allowances || []).forEach(a => uniqueAllowances.add(a.name));
       (e.raw_bonuses || []).forEach(b => uniqueBonuses.add(b.name));
       (e.raw_deductions || []).forEach(d => uniqueDeductions.add(d.name));
    });

    const allowHeaders = Array.from(uniqueAllowances);
    const bonusHeaders = Array.from(uniqueBonuses);
    const dedHeaders = Array.from(uniqueDeductions);

    const headers = [
      "Emp No", "Name", "Basic Salary",
      ...allowHeaders, ...bonusHeaders, "Gross Salary",
      "EPF 8%", "No Pay", "Loan Deductions", ...dedHeaders, "Total Deductions",
      "Net Pay", "Employer EPF 12%", "ETF 3%"
    ];

    let rows = []; let totals = new Array(headers.length).fill(0);

    reportData.forEach(e => {
      let row = [e.emp_no, e.name, e.basic_salary.toFixed(2)]; totals[2] += e.basic_salary;

      allowHeaders.forEach((h, i) => {
        let amt = ((e.raw_allowances || []).find(a => a.name === h) || {}).amount || 0;
        row.push(parseFloat(amt).toFixed(2)); totals[3 + i] += parseFloat(amt);
      });

      let bonusOffset = 3 + allowHeaders.length;
      bonusHeaders.forEach((h, i) => {
        let amt = ((e.raw_bonuses || []).find(b => b.name === h) || {}).amount || 0;
        row.push(parseFloat(amt).toFixed(2)); totals[bonusOffset + i] += parseFloat(amt);
      });

      let grossIdx = bonusOffset + bonusHeaders.length;
      row.push(e.gross_salary.toFixed(2)); totals[grossIdx] += e.gross_salary;

      let epf8 = e.epf_8 || 0; let noPay = e.no_pay_amount || 0; let loan = (e.loan_installment || 0) + (e.loan_interest || 0);
      row.push(epf8.toFixed(2)); totals[grossIdx + 1] += epf8;
      row.push(noPay.toFixed(2)); totals[grossIdx + 2] += noPay;
      row.push(loan.toFixed(2)); totals[grossIdx + 3] += loan;

      let dedOffset = grossIdx + 4;
      dedHeaders.forEach((h, i) => {
        let amt = ((e.raw_deductions || []).find(d => d.name === h) || {}).amount || 0;
        row.push(parseFloat(amt).toFixed(2)); totals[dedOffset + i] += parseFloat(amt);
      });

      let totDedIdx = dedOffset + dedHeaders.length;
      row.push(e.total_deductions.toFixed(2)); totals[totDedIdx] += e.total_deductions;

      let netIdx = totDedIdx + 1;
      row.push(e.net_salary.toFixed(2)); totals[netIdx] += e.net_salary;

      let epf12 = e.epf_12 || 0; let etf3 = e.etf_3 || 0;
      row.push(epf12.toFixed(2)); totals[netIdx + 1] += epf12;
      row.push(etf3.toFixed(2)); totals[netIdx + 2] += etf3;

      rows.push(row);
    });

    let footer = ["", "TOTAL"];
    for (let i = 2; i < totals.length; i++) { footer.push(totals[i].toFixed(2)); }
    return { headers, rows, footer };
  };

  const generateBankData = () => {
    let rows = []; let totalAmount = 0;
    reportData.forEach(e => {
      let allowSum = 0;
      (e.raw_allowances || []).forEach(a => { allowSum += parseFloat(a.amount) || 0; });
      let amount = e.basic_salary + allowSum;
      if (amount > 0) { rows.push([e.emp_no, e.name, e.bank, e.branch, e.account, amount.toFixed(2)]); totalAmount += amount; }
    });
    return { headers: ["Emp No", "Name", "Bank", "Branch", "Account No", "Amount (Basic + Allowances)"], rows, footer: ["", "", "", "", "TOTAL AMOUNT", totalAmount.toFixed(2)] };
  };

  const generateEPFData = () => {
    let rows = []; let tBase = 0, tEmp8 = 0, tEmp12 = 0, tEpf20 = 0, tEtf3 = 0;
    reportData.forEach(e => {
      if (e.enable_epf_etf === 1 && (e.epf_8 + e.epf_12) > 0) {
        let totalEpf = e.epf_8 + e.epf_12;
        rows.push([e.emp_no, e.name, e.epf_base.toFixed(2), e.epf_12.toFixed(2), e.epf_8.toFixed(2), totalEpf.toFixed(2), e.etf_3.toFixed(2)]);
        tBase += e.epf_base; tEmp12 += e.epf_12; tEmp8 += e.epf_8; tEpf20 += totalEpf; tEtf3 += e.etf_3;
      }
    });
    return { headers: ["Member No", "Name", "Salary for EPF", "Employer 12%", "Employee 8%", "Total EPF 20%", "ETF 3%"], rows, footer: ["", "TOTAL", tBase.toFixed(2), tEmp12.toFixed(2), tEmp8.toFixed(2), tEpf20.toFixed(2), tEtf3.toFixed(2)] };
  };

  //  Allowances Report 
  const generateAllowancesOnlyData = () => {
    const uniqueNames = new Set();
    reportData.forEach(e => { (e.raw_allowances || []).forEach(a => uniqueNames.add(a.name)); });
    const dynamicHeaders = Array.from(uniqueNames);
    let rows = []; let columnTotals = new Array(dynamicHeaders.length).fill(0); let tTotal = 0;

    reportData.forEach(e => {
      let row = [e.emp_no, e.name];
      let empTotalAdditions = 0;
      dynamicHeaders.forEach((headerName, index) => {
        let item = (e.raw_allowances || []).find(a => a.name === headerName);
        let amount = item ? parseFloat(item.amount) : 0;
        row.push(amount.toFixed(2)); columnTotals[index] += amount; empTotalAdditions += amount;
      });
      // Allowance
      if(empTotalAdditions > 0) {
        row.push(empTotalAdditions.toFixed(2)); tTotal += empTotalAdditions; rows.push(row);
      }
    });

    if (dynamicHeaders.length === 0) return { headers: ["Emp No", "Name", "No Allowances"], rows: [], footer: [] };
    return { headers: ["Emp No", "Name", ...dynamicHeaders, "Total Allowances"], rows, footer: ["", "TOTAL", ...columnTotals.map(t => t.toFixed(2)), tTotal.toFixed(2)] };
  };

  const generateBonusesOnlyData = () => {
    const uniqueNames = new Set();
    reportData.forEach(e => { (e.raw_bonuses || []).forEach(b => uniqueNames.add(b.name)); });
    const dynamicHeaders = Array.from(uniqueNames);
    let rows = []; let columnTotals = new Array(dynamicHeaders.length).fill(0); let tTotal = 0;

    reportData.forEach(e => {
      let row = [e.emp_no, e.name]; let empTotalBonuses = 0;
      dynamicHeaders.forEach((headerName, index) => {
        let item = (e.raw_bonuses || []).find(b => b.name === headerName);
        let amount = item ? parseFloat(item.amount) : 0;
        row.push(amount.toFixed(2)); columnTotals[index] += amount; empTotalBonuses += amount;
      });
      if (empTotalBonuses > 0) { row.push(empTotalBonuses.toFixed(2)); rows.push(row); tTotal += empTotalBonuses; }
    });

    if (dynamicHeaders.length === 0) return { headers: ["Emp No", "Name", "No Bonuses Found"], rows: [], footer: [] };
    return { headers: ["Emp No", "Name", ...dynamicHeaders, "Total Bonuses"], rows, footer: ["", "TOTAL", ...columnTotals.map(t => t.toFixed(2)), tTotal.toFixed(2)] };
  };

  const generateDynamicDeductionsData = () => {
    const uniqueNames = new Set();
    reportData.forEach(e => { (e.raw_deductions || []).forEach(d => uniqueNames.add(d.name)); });
    const dynamicHeaders = Array.from(uniqueNames);
    let rows = []; let columnTotals = new Array(dynamicHeaders.length).fill(0); let tTotal = 0;

    reportData.forEach(e => {
      let row = [e.emp_no, e.name]; let empTotalDeds = 0;
      dynamicHeaders.forEach((headerName, index) => {
        let item = (e.raw_deductions || []).find(d => d.name === headerName);
        let amount = item ? parseFloat(item.amount) : 0;
        row.push(amount.toFixed(2)); columnTotals[index] += amount; empTotalDeds += amount;
      });
      if (empTotalDeds > 0) { row.push(empTotalDeds.toFixed(2)); rows.push(row); tTotal += empTotalDeds; }
    });
    if (dynamicHeaders.length === 0) return { headers: ["Emp No", "Name", "No Custom Deductions"], rows: [], footer: [] };
    return { headers: ["Emp No", "Name", ...dynamicHeaders, "Total Custom Deductions"], rows, footer: ["", "TOTAL", ...columnTotals.map(t => t.toFixed(2)), tTotal.toFixed(2)] };
  };

  const generateLoanData = () => {
    let rows = []; let tAmount = 0, tInst = 0, tInt = 0, tDed = 0, tOut = 0;
    reportData.forEach(e => {
      if (e.loan_amount > 0) {
        let totDed = e.loan_installment + e.loan_interest; let outStanding = Math.max(0, e.loan_amount - e.loan_installment);
        rows.push([e.emp_no, e.name, e.loan_amount.toFixed(2), e.loan_installment.toFixed(2), e.loan_interest.toFixed(2), totDed.toFixed(2), outStanding.toFixed(2)]);
        tAmount += e.loan_amount; tInst += e.loan_installment; tInt += e.loan_interest; tDed += totDed; tOut += outStanding;
      }
    });
    return { headers: ["Emp No", "Name", "Loan Amount", "Installment", "Interest", "Total Deduction", "Balance Outstanding"], rows, footer: ["", "TOTAL", tAmount.toFixed(2), tInst.toFixed(2), tInt.toFixed(2), tDed.toFixed(2), tOut.toFixed(2)] };
  };

  const generateNoPayData = () => {
    let rows = []; let tDays = 0, tAmount = 0;
    reportData.forEach(e => {
      if (e.no_pay_amount > 0 || e.no_pay_days > 0) {
        rows.push([e.emp_no, e.name, e.no_pay_days.toString(), e.no_pay_amount.toFixed(2)]);
        tDays += e.no_pay_days; tAmount += e.no_pay_amount;
      }
    });
    return { headers: ["Emp No", "Name", "No Pay Days", "Deduction Amount"], rows, footer: ["", "TOTAL", tDays.toString(), tAmount.toFixed(2)] };
  };

  //  OT Report 
  const generateOTData = () => {
    let rows = [];
    let tMornHrs = 0, tMornFees = 0, tNightHrs = 0, tNightFees = 0, tHolHrs = 0, tHolFees = 0, tTotFees = 0;

    reportData.forEach(e => {
      let totFees = (e.ot_morning_fees || 0) + (e.ot_night_fees || 0) + (e.holiday_ot_fees || 0);
      
      if (totFees > 0) {
        rows.push([
          e.emp_no, e.name,
          (e.ot_morning_hours || 0).toFixed(2), (e.ot_morning_fees || 0).toFixed(2),
          (e.ot_night_hours || 0).toFixed(2), (e.ot_night_fees || 0).toFixed(2),
          (e.holiday_ot_hours || 0).toFixed(2), (e.holiday_ot_fees || 0).toFixed(2),
          totFees.toFixed(2)
        ]);
        tMornHrs += (e.ot_morning_hours || 0); tMornFees += (e.ot_morning_fees || 0);
        tNightHrs += (e.ot_night_hours || 0); tNightFees += (e.ot_night_fees || 0);
        tHolHrs += (e.holiday_ot_hours || 0); tHolFees += (e.holiday_ot_fees || 0);
        tTotFees += totFees;
      }
    });

    const headers = ["Emp No", "Name", "Morning OT (Hrs)", "Morning OT (Rs)", "Night OT (Hrs)", "Night OT (Rs)", "Holiday OT (Hrs)", "Holiday OT (Rs)", "Total OT (Rs)"];
    const footer = ["", "TOTAL", tMornHrs.toFixed(2), tMornFees.toFixed(2), tNightHrs.toFixed(2), tNightFees.toFixed(2), tHolHrs.toFixed(2), tHolFees.toFixed(2), tTotFees.toFixed(2)];
    
    if (rows.length === 0) return { headers: ["Emp No", "Name", "No Overtime Recorded"], rows: [], footer: [] };
    return { headers, rows, footer };
  };

  // =========================================================
  // Export Functions
  // =========================================================
  const downloadCSV = (dataFunc, filename) => {
    if (reportData.length === 0) return Swal.fire("Warning", "Please load data first!", "warning");
    const { headers, rows, footer } = dataFunc();
    if (rows.length === 0) return Swal.fire("Empty", "No data available for this report.", "info");

    let csvContent = "\uFEFF" + headers.join(",") + "\n";
    rows.forEach(r => { csvContent += r.map(v => `"${v}"`).join(",") + "\n"; });
    if (footer && footer.length > 0) csvContent += footer.map(v => `"${v}"`).join(",") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); 
    link.setAttribute("download", `${filename}_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  const downloadPDF = (dataFunc, title, filename) => {
    if (reportData.length === 0) return Swal.fire("Warning", "Please load data first!", "warning");
    const { headers, rows, footer } = dataFunc();
    if (rows.length === 0) return Swal.fire("Empty", "No data available for this report.", "info");
    
    const isWideTable = headers.length > 9;
    const doc = new jsPDF("landscape", "mm", isWideTable ? "a3" : "a4");
    
    doc.setFontSize(isWideTable ? 18 : 16);
    doc.text(`${title} - ${selectedMonth}/${selectedYear}`, 14, 15);
    
    autoTable(doc, {
      startY: 25, head: [headers], body: rows, foot: footer.length > 0 ? [footer] : [],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      styles: { fontSize: isWideTable ? 7 : 9, cellPadding: 2 }
    });
    doc.save(`${filename}_${selectedYear}_${selectedMonth}.pdf`);
  };

  // --- Reports List ---
  const reportCards = [
    { id: 1, title: "Full Master Payroll", desc: "Complete summary with all additions & deductions.", icon: <FileBarChart className="w-6 h-6 text-indigo-600" />, func: generateMasterData, file: "Full_Master_Payroll" },
    { id: 2, title: "Bank Transfer File", desc: "Basic Salary + Allowances sent to bank.", icon: <Building2 className="w-6 h-6 text-green-600" />, func: generateBankData, file: "Bank_Transfer" },
    { id: 3, title: "Schedule 06: EPF & ETF", desc: "8%, 12% and 3% contributions.", icon: <FileText className="w-6 h-6 text-blue-600" />, func: generateEPFData, file: "EPF_ETF_Sch06" },
    { id: 4, title: "Overtime Summary", desc: "Morning, Night, and Holiday OT breakdown.", icon: <Clock className="w-6 h-6 text-sky-600" />, func: generateOTData, file: "Overtime_Summary" },
    { id: 5, title: "Dynamic Allowances", desc: "Breakdown of all allowances only.", icon: <Wallet className="w-6 h-6 text-purple-600" />, func: generateAllowancesOnlyData, file: "Allowances_Report" },
    { id: 6, title: "Dynamic Bonuses", desc: "Breakdown of bonuses only.", icon: <Gift className="w-6 h-6 text-teal-600" />, func: generateBonusesOnlyData, file: "Bonuses_Report" },
    { id: 7, title: "Custom Deductions", desc: "Dynamic breakdown of custom deductions.", icon: <Scissors className="w-6 h-6 text-pink-600" />, func: generateDynamicDeductionsData, file: "Custom_Deductions" },
    { id: 8, title: "Staff Loans", desc: "Loan installments, interest and balance.", icon: <CreditCard className="w-6 h-6 text-orange-600" />, func: generateLoanData, file: "Staff_Loans" },
    { id: 9, title: "No Pay Details", desc: "Deductions based on absent days.", icon: <FileCheck className="w-6 h-6 text-red-600" />, func: generateNoPayData, file: "NoPay_Details" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileSpreadsheet className="text-blue-600"/> Payroll Documents & Schedules</h1>
            <p className="text-gray-500 text-sm mt-1">Load data first, then download Excel or PDF with Totals.</p>
          </div>
          
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-32 px-3 py-2 border rounded-lg bg-gray-50 outline-none">
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-24 px-3 py-2 border rounded-lg bg-gray-50 outline-none">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={handleFetchData} disabled={isLoading} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-70">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} Load Data
            </button>
          </div>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {reportCards.map((card) => (
            <div key={card.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-gray-50 rounded-xl">{card.icon}</div>
                  <h3 className="text-md font-bold text-gray-800 leading-tight">{card.title}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-5">{card.desc}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => downloadCSV(card.func, card.file)} className="flex-1 py-2 text-xs font-semibold bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200">
                  Excel
                </button>
                <button onClick={() => downloadPDF(card.func, card.title, card.file)} className="flex-1 py-2 text-xs font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200">
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Reports;
*/