import React, { useState, useEffect } from "react";
import { fetchEmployeeLoans } from "@services/LoanService";
import { Eye, Loader2, FileText } from "lucide-react";

const EmployeeLoanView = ({ employeeProfile }) => {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(null);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 2 }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" });
  };

  const getScheduleRows = (loan) => {
    const s = loan?.schedule;
    if (typeof s === "string") { try { return JSON.parse(s) || []; } catch { return []; } }
    return Array.isArray(s) ? s : [];
  };

  useEffect(() => {
    const load = async () => {
      const empNo = employeeProfile?.attendance_employee_no;
      if (!empNo) { setIsLoading(false); return; }
      setIsLoading(true);
      const data = await fetchEmployeeLoans(empNo);
      setLoans(Array.isArray(data) ? data : []);
      setIsLoading(false);
    };
    load();
  }, [employeeProfile]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">My Loans</h1>
        <p className="text-blue-100">View your loan details and repayment schedule</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-100">
          <p className="text-sm text-gray-500">Total Loans</p>
          <p className="text-2xl font-bold text-gray-800">{loans.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-100">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(loans.reduce((s, l) => s + parseFloat(l.loan_amount || 0), 0))}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-100">
          <p className="text-sm text-gray-500">Active Loans</p>
          <p className="text-2xl font-bold text-green-600">
            {loans.filter(l => l.status === 'active').length}
          </p>
        </div>
      </div>

      {loans.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No loans found</h3>
          <p className="text-sm text-gray-500 mt-1">Your loan records will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan ID</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Interest</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Installment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{loan.loan_id}</td>
                    <td className="px-6 py-4 text-right text-sm font-mono">{formatCurrency(loan.loan_amount)}</td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${loan.with_interest ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                        {loan.with_interest ? `${loan.interest_rate_per_annum}%` : 'No Interest'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-green-600">{formatCurrency(loan.installment_amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(loan.start_from)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${loan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setShowDetails(loan)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Loan Details</h3>
              <button onClick={() => setShowDetails(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6">
              <div className="flex justify-between mb-6">
                <div>
                  <h4 className="text-xl font-bold text-blue-900">{showDetails.loan_id}</h4>
                  <p className="text-sm text-gray-500 mt-1">Deduct From: <span className="font-semibold capitalize">{showDetails.deduct_from || 'N/A'}</span></p>
                </div>
                <span className={`px-4 py-1 rounded-full h-fit text-sm font-bold ${showDetails.with_interest ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                  {showDetails.with_interest ? "With Interest" : "No Interest"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl mb-6">
                <div><p className="text-xs text-gray-500">Loan Amount</p><p className="font-bold">{formatCurrency(showDetails.loan_amount)}</p></div>
                <div><p className="text-xs text-gray-500">Installment</p><p className="font-bold text-green-600">{formatCurrency(showDetails.installment_amount)}</p></div>
                <div><p className="text-xs text-gray-500">Interest Rate</p><p className="font-bold">{showDetails.interest_rate_per_annum}%</p></div>
                <div><p className="text-xs text-gray-500">Start Date</p><p className="font-bold">{formatDate(showDetails.start_from)}</p></div>
                <div><p className="text-xs text-gray-500">Total Installments</p><p className="font-bold">{showDetails.installment_count}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><p className="font-bold capitalize">{showDetails.status}</p></div>
              </div>

              {/* Repayment Schedule */}
              {getScheduleRows(showDetails).length > 0 && (
                <>
                  <h4 className="font-bold mb-3 text-gray-800">Repayment Schedule</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">No</th>
                          <th className="p-2 text-left">Due Date</th>
                          <th className="p-2 text-right">Capital</th>
                          <th className="p-2 text-right">Interest</th>
                          <th className="p-2 text-right">Installment</th>
                          <th className="p-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getScheduleRows(showDetails).map((row, idx) => (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="p-2">{row.no || idx + 1}</td>
                            <td className="p-2">{row.dueDate || row.due_date}</td>
                            <td className="p-2 text-right">{formatCurrency(row.capitalRepayment || row.capital_repayment)}</td>
                            <td className="p-2 text-right">{formatCurrency(row.interestPayment || row.interest_payment)}</td>
                            <td className="p-2 text-right font-bold">{formatCurrency(row.installmentAmount || row.installment_amount)}</td>
                            <td className="p-2 text-right">{formatCurrency(row.dueBalance || row.due_balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button onClick={() => setShowDetails(null)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLoanView;
