import React, { useState, useEffect } from "react";
import { fetchLoans } from "@services/LoanService";
import {
  Search,
  FileText,
  Download,
  Filter,
  ChevronDown,
  Eye,
  Briefcase,
  Calendar,
  DollarSign,
  Percent,
} from "lucide-react";
import Swal from "sweetalert2";

const ViewLoans = () => {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [showDetails, setShowDetails] = useState(null);

  // Format currency as LKR
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getScheduleRows = (loan) => {
  if (!loan) return [];
  const s = loan.schedule;

  // sometimes schedule comes as JSON string
  if (typeof s === "string") {
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(s) ? s : [];
};


  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Fetch loans data
  useEffect(() => {
    const loadLoans = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLoans();
        setLoans(data);
        setFilteredLoans(data);
      } catch (err) {
        setError("Failed to load loan data. Please try again later.");
        console.error("Error loading loans:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLoans();
  }, []);

  // Filter loans based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredLoans(loans);
      return;
    }

    const filtered = loans.filter((loan) => {
      const term = searchTerm.toLowerCase();
      if (searchFilter === "all") {
        return (
          loan.loan_id.toLowerCase().includes(term) ||
          loan.employee_id.toString().toLowerCase().includes(term)
        );
      } else if (searchFilter === "loan_id") {
        return loan.loan_id.toLowerCase().includes(term);
      } else if (searchFilter === "employee_id") {
        return loan.employee_id.toString().toLowerCase().includes(term);
      }
      return true;
    });

    setFilteredLoans(filtered);
  }, [searchTerm, searchFilter, loans]);

  // Show loan details modal
  const showLoanDetails = (loan) => {
    setShowDetails(loan);
  };

  // Export loans to CSV
  const exportToCSV = () => {
    if (filteredLoans.length === 0) return;

    const headers = [
      "Loan ID",
      "Employee ID",
      "Amount",
      "Interest Rate",
      "Installment",
      "Start Date",
      "With Interest",
    ];
    const csvData = filteredLoans.map((loan) => [
      loan.loan_id,
      loan.employee_id,
      loan.loan_amount,
      loan.interest_rate_per_annum + "%",
      loan.installment_amount,
      loan.start_from,
      loan.with_interest ? "Yes" : "No",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `loans_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSearchFilter("all");
  };

  // Calculate statistics
  const totalLoans = filteredLoans.length;
  const totalAmount = filteredLoans.reduce(
    (sum, loan) => sum + parseFloat(loan.loan_amount || 0),
    0
  );
  const withInterestCount = filteredLoans.filter(
    (loan) => loan.with_interest
  ).length;
  const withoutInterestCount = filteredLoans.filter(
    (loan) => !loan.with_interest
  ).length;

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 py-4 sm:py-8"> 
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 px-4 sm:px-8 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center">
              Employee Loans Management
            </h1>
            <p className="text-blue-200 text-center mt-2 text-sm sm:text-base">
              View and manage employee loan information
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Loans
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {totalLoans}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Amount
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    With Interest
                  </p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {withInterestCount}
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <Percent className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    No Interest
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {withoutInterestCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="px-4 sm:px-6 lg:px-8 pb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Filter Loans
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative flex-1 md:col-span-2">
                  <Search className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by loan ID, employee ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <select
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full md:w-auto p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="all">All Fields</option>
                    <option value="loan_id">Loan ID</option>
                    <option value="employee_id">Employee ID</option>
                  </select>

                  <button
                    onClick={resetFilters}
                    className="w-full md:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Reset Filters
                  </button>

                  <button
                    onClick={exportToCSV}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow"
                    disabled={filteredLoans.length === 0}
                  >
                    <Download size={16} strokeWidth={2} />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loans Table */}
          <div className="px-4 sm:px-6 lg:px-8 pb-8">
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-800 to-indigo-900 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Loan Records
                </h3>
              </div>

              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="ml-3 text-lg text-gray-600">
                      Loading loans...
                    </p>
                  </div>
                ) : error ? (
                  <div className="text-center py-16">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                      <svg
                        className="h-8 w-8 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      {error}
                    </h3>
                  </div>
                ) : filteredLoans.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
                      <svg
                        className="h-8 w-8 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6a2 2 0 012-2h2v6z"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No loans found
                    </h3>
                    <p className="mt-2 text-gray-500">
                      {searchTerm
                        ? "Try adjusting your search filters"
                        : "There are no loans in the system yet"}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Loan ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Employee ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Loan Amount
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Interest Rate
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Installment
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Start Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLoans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {loan.loan_id.slice(-2)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {loan.loan_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {loan.employee_id}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-mono">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(loan.loan_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                parseFloat(loan.interest_rate_per_annum) > 0
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {loan.interest_rate_per_annum}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-mono font-bold text-green-600">
                              {formatCurrency(loan.installment_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <div className="text-sm text-gray-900">
                                {formatDate(loan.start_from)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => showLoanDetails(loan)}
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/*<div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">*/}

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Loan Details</h3>
              <button
                onClick={() => setShowDetails(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-bold text-gray-900">
                      {showDetails.loan_id}
                    </h4>
                    <p className="text-gray-500">
                      Employee ID: {showDetails.employee_id}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    showDetails.with_interest
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {showDetails.with_interest ? "With Interest" : "No Interest"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                    Loan Amount
                  </h5>
                  <p className="text-lg font-medium text-gray-900 font-mono">
                    {formatCurrency(showDetails.loan_amount)}
                  </p>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                    Interest Rate
                  </h5>
                  <p className="text-lg font-medium text-gray-900">
                    {showDetails.interest_rate_per_annum}%
                  </p>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                    Installment Amount
                  </h5>
                  <p className="text-lg font-medium text-green-600 font-mono">
                    {formatCurrency(showDetails.installment_amount)}
                  </p>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                    Start Date
                  </h5>
                  <p className="text-lg font-medium text-gray-900">
                    {formatDate(showDetails.start_from)}
                  </p>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                    Created At
                  </h5>
                  <p className="text-lg font-medium text-gray-900">
                    {formatDate(showDetails.created_at)}
                  </p>
                </div>

                {/* <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">
                    Updated At
                  </h5>
                  <p className="text-lg font-medium text-gray-900">
                    {formatDate(showDetails.updated_at)}
                  </p>
                </div> */}
              </div>

              {/* Repayment Schedule */}
{(() => {
  const rows = getScheduleRows(showDetails);

  if (!rows.length) {
    return (
      <div className="mt-8 text-sm text-gray-500">
        No repayment schedule available for this loan.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h4 className="text-lg font-bold text-gray-900 mb-3">
        Repayment Schedule
      </h4>

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Due Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Outstanding
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Capital
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Interest
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Installment
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Balance
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, idx) => {
              const no = row.no ?? row.installment_no ?? idx + 1;
              const dueDate = row.dueDate ?? row.due_date ?? "N/A";

              const outstanding =
                row.capitalOutstanding ?? row.capital_outstanding ?? 0;
              const capital =
                row.capitalRepayment ?? row.capital_repayment ?? 0;
              const interest =
                row.interestPayment ?? row.interest_payment ?? 0;
              const installment =
                row.installmentAmount ?? row.installment_amount ?? 0;
              const balance = row.dueBalance ?? row.due_balance ?? 0;

              return (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{no}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{dueDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right font-mono">
                    {formatCurrency(outstanding)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right font-mono">
                    {formatCurrency(capital)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right font-mono">
                    {formatCurrency(interest)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right font-mono font-bold">
                    {formatCurrency(installment)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right font-mono">
                    {formatCurrency(balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
})()}


            </div>

            <div className="flex justify-end p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowDetails(null)}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewLoans;
