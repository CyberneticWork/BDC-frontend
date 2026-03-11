import { useState, useEffect } from "react";
import {
  Loader2,
  DollarSign,
  FileText,
  Minus,
  Download,
} from "lucide-react";
import {
  fetchSalaryDataAPI,
} from "@services/SalaryService";
import jsPDF from "jspdf";
import "jspdf-autotable";

const SalaryPage = ({ employeeProfile }) => {
  const [salaryData, setSalaryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch salary data
  const fetchSalaryData = async () => {
    setIsLoading(true);

    try {
      const response = await fetchSalaryDataAPI();
      setSalaryData(response);
    } catch (error) {
      console.error("Error fetching salary data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchSalaryData();
  }, []);

  // Listen for salary updates
  useEffect(() => {
    const handleSalaryUpdate = () => {
      fetchSalaryData();
    };
    window.addEventListener('salaryUpdated', handleSalaryUpdate);
    return () => window.removeEventListener('salaryUpdated', handleSalaryUpdate);
  }, []);

  // Export to PDF
  const exportToPDF = () => {
    if (!latestRecord) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text("SALARY SLIP", pageWidth / 2, 20, { align: "center" });

    // Employee Info
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Employee: ${latestRecord.full_name}`, 14, 35);
    doc.text(`Employee ID: ${latestRecord.employee_no}`, 14, 42);
    doc.text(`Company: ${latestRecord.company_name}`, 14, 49);
    doc.text(`Department: ${latestRecord.department_name}`, 14, 56);
    doc.text(`Period: ${latestRecord.month}/${latestRecord.year}`, 14, 63);
    doc.text(`Status: ${latestRecord.status}`, 14, 70);

    // Earnings Table
    const earningsData = [
      ["Basic Salary", `Rs. ${parseFloat(latestRecord.basic_salary).toLocaleString()}`],
    ];
    if (latestRecord.salary_breakdown?.br_allowance > 0) {
      earningsData.push(["BR Allowance", `Rs. ${parseFloat(latestRecord.salary_breakdown.br_allowance).toLocaleString()}`]);
    }
    if (latestRecord.salary_breakdown?.ot_morning_fees > 0) {
      earningsData.push(["Morning OT", `Rs. ${parseFloat(latestRecord.salary_breakdown.ot_morning_fees).toLocaleString()}`]);
    }
    if (latestRecord.salary_breakdown?.ot_night_fees > 0) {
      earningsData.push(["Evening OT", `Rs. ${parseFloat(latestRecord.salary_breakdown.ot_night_fees).toLocaleString()}`]);
    }
    if (latestRecord.salary_breakdown?.total_allowances > 0) {
      earningsData.push(["Other Allowances", `Rs. ${parseFloat(latestRecord.salary_breakdown.total_allowances).toLocaleString()}`]);
    }
    earningsData.push(["Gross Salary", `Rs. ${parseFloat(latestRecord.salary_breakdown?.gross_salary || 0).toLocaleString()}`]);

    doc.autoTable({
      startY: 80,
      head: [["Earnings", "Amount"]],
      body: earningsData,
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    // Deductions Table
    const deductionsData = [];
    if (latestRecord.salary_breakdown?.epf_employee_deduction > 0) {
      deductionsData.push(["EPF (8%)", `Rs. ${parseFloat(latestRecord.salary_breakdown.epf_employee_deduction).toLocaleString()}`]);
    }
    if (latestRecord.salary_breakdown?.no_pay_deduction > 0) {
      deductionsData.push(["No Pay Deduction", `Rs. ${parseFloat(latestRecord.salary_breakdown.no_pay_deduction).toLocaleString()}`]);
    }
    if (latestRecord.salary_breakdown?.loan_installment > 0) {
      deductionsData.push(["Loan Installment", `Rs. ${parseFloat(latestRecord.salary_breakdown.loan_installment).toLocaleString()}`]);
    }
    if (latestRecord.salary_breakdown?.total_fixed_deductions > 0) {
      deductionsData.push(["Other Deductions", `Rs. ${parseFloat(latestRecord.salary_breakdown.total_fixed_deductions).toLocaleString()}`]);
    }
    if (latestRecord.salary_breakdown?.stamp > 0) {
      deductionsData.push(["Stamp Duty", `Rs. ${parseFloat(latestRecord.salary_breakdown.stamp).toLocaleString()}`]);
    }
    deductionsData.push(["Total Deductions", `Rs. ${parseFloat(latestRecord.salary_breakdown?.total_deductions || 0).toLocaleString()}`]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Deductions", "Amount"]],
      body: deductionsData,
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68] },
    });

    // Net Salary
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text(`Net Salary: Rs. ${parseFloat(latestRecord.salary_breakdown?.net_salary || 0).toLocaleString()}`, 14, doc.lastAutoTable.finalY + 20);

    doc.save(`Salary_Slip_${latestRecord.employee_no}_${latestRecord.month}_${latestRecord.year}.pdf`);
  };

  // Get the latest salary record for the logged-in employee
  const latestRecord = salaryData && salaryData.length > 0 && employeeProfile?.attendance_employee_no
    ? salaryData.find(item => item.employee_no === employeeProfile.attendance_employee_no)
    : null;

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header Card */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <h1 className="text-3xl font-bold">My Salary Slip</h1>
        <p className="text-blue-100 mt-2">View your latest salary details</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
        </div>
      )}

      {/* Salary Slip Card */}
      {!isLoading && latestRecord && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header Section with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{latestRecord.full_name}</h2>
                  <p className="text-blue-100">Employee ID: {latestRecord.employee_no}</p>
                  <p className="text-blue-100">{latestRecord.company_name}</p>
                  <p className="text-blue-100">{latestRecord.department_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm">Period</p>
                  <p className="text-xl font-bold">{latestRecord.month}/{latestRecord.year}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    latestRecord.status === "processed" ? "bg-green-400 text-green-900" : "bg-yellow-400 text-yellow-900"
                  }`}>
                    {latestRecord.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Salary Details */}
            <div className="p-8">
              {/* Earnings Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <DollarSign className="mr-2 text-green-600" size={20} />
                  Earnings
                </h3>
                <div className="bg-green-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Basic Salary</span>
                    <span className="font-semibold text-gray-900">
                      {parseFloat(latestRecord.basic_salary).toLocaleString("en-LK", {
                        style: "currency",
                        currency: "LKR",
                      })}
                    </span>
                  </div>
                  {latestRecord.salary_breakdown?.br_allowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">BR Allowance</span>
                      <span className="font-semibold text-gray-900">
                        {parseFloat(latestRecord.salary_breakdown.br_allowance).toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  )}
                  {latestRecord.salary_breakdown?.ot_morning_fees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Morning OT</span>
                      <span className="font-semibold text-gray-900">
                        {parseFloat(latestRecord.salary_breakdown.ot_morning_fees).toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  )}
                  {latestRecord.salary_breakdown?.ot_night_fees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Evening OT</span>
                      <span className="font-semibold text-gray-900">
                        {parseFloat(latestRecord.salary_breakdown.ot_night_fees).toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  )}
                  {latestRecord.salary_breakdown?.total_allowances > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Other Allowances</span>
                      <span className="font-semibold text-gray-900">
                        {parseFloat(latestRecord.salary_breakdown.total_allowances).toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-green-200 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">Gross Salary</span>
                      <span className="font-bold text-green-700 text-lg">
                        {parseFloat(latestRecord.salary_breakdown?.gross_salary || 0).toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Minus className="mr-2 text-red-600" size={20} />
                  Deductions
                </h3>
                <div className="bg-red-50 rounded-lg p-4 space-y-3">
                  {latestRecord.salary_breakdown?.epf_employee_deduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">EPF (8%)</span>
                      <span className="font-semibold text-gray-900">
                        {parseFloat(latestRecord.salary_breakdown.epf_employee_deduction).toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  )}
                  {latestRecord.salary_breakdown?.no_pay_deduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">No Pay Deduction</span>
                      <span className="font-semibold text-gray-900">
                        {parseFloat(latestRecord.salary_breakdown.no_pay_deduction).toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  )}
                  {latestRecord.salary_breakdown?.loan_installment > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Loan Installment</span>
                      <span className="font-semibold text-gray-900">
                        {parseFloat(latestRecord.salary_breakdown.loan_installment).toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  )}
                  {latestRecord.salary_breakdown?.total_fixed_deductions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Other Deductions</span>
                      <span className="font-semibold text-gray-900">
                        {parseFloat(latestRecord.salary_breakdown.total_fixed_deductions).toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  )}
                  {latestRecord.salary_breakdown?.stamp > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Stamp Duty</span>
                      <span className="font-semibold text-gray-900">
                        {parseFloat(latestRecord.salary_breakdown.stamp).toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-red-200 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">Total Deductions</span>
                      <span className="font-bold text-red-700 text-lg">
                        {parseFloat(latestRecord.salary_breakdown?.total_deductions || 0).toLocaleString("en-LK", {
                          style: "currency",
                          currency: "LKR",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary Section */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Net Salary</p>
                    <p className="text-4xl font-bold">
                      {parseFloat(latestRecord.salary_breakdown?.net_salary || 0).toLocaleString("en-LK", {
                        style: "currency",
                        currency: "LKR",
                      })}
                    </p>
                  </div>
                  <FileText size={48} className="text-blue-200 opacity-50" />
                </div>
              </div>

              {/* Download PDF Button */}
              <div className="mt-6">
                <button
                  onClick={exportToPDF}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Salary Slip (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !latestRecord && (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-2xl mx-auto">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <FileText size={64} className="mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Salary Records Found
          </h3>
          <p className="text-gray-600">
            Your salary slip will appear here once it's processed by the admin.
          </p>
        </div>
      )}
    </div>
  );
};

export default SalaryPage;
