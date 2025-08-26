import React, { useState, useEffect } from "react";
import { createLoan, fetchEmployeeNameByNo } from "@services/LoanService";
import Swal from "sweetalert2";
import employeeService from "@services/EmployeeDataService"; // Make sure this service exists

const EmployeeLoan = () => {
  const [loanId, setLoanId] = useState("");
  const [interestType, setInterestType] = useState("withInterest");
  const [employeeNo, setEmployeeNo] = useState("");
  const [employeeIdd, setEmployeeIdd] = useState("");
  const [startDate, setStartDate] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [loanDetails, setLoanDetails] = useState([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [employeeName, setEmployeeName] = useState("");

  // Add these after other useState declarations
  const [calculationType, setCalculationType] = useState("byAmount"); // byAmount or byCount
  const [installmentCount, setInstallmentCount] = useState("");

  // Format currency as LKR
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const showSuccessMessage = (title, text) => {
    Swal.fire({
      position: "center",
      icon: "success",
      title: title,
      text: text,
      showConfirmButton: true,
      confirmButtonColor: "#3085d6",
      timer: 3000,
      customClass: {
        popup: "rounded-xl shadow-2xl",
        title: "text-2xl font-bold text-gray-800",
        confirmButton: "px-6 py-2 rounded-lg font-medium",
      },
    });
  };

  const showErrorMessage = (title, text) => {
    Swal.fire({
      position: "center",
      icon: "error",
      title: title,
      text: text,
      showConfirmButton: true,
      confirmButtonColor: "#d33",
      customClass: {
        popup: "rounded-xl shadow-2xl",
        title: "text-2xl font-bold text-gray-800",
        confirmButton: "px-6 py-2 rounded-lg font-medium",
      },
    });
  };

  const handleSaveLoan = async () => {
    try {
      if (!isCalculated || loanDetails.length === 0) {
        showErrorMessage(
          "Calculation Required",
          "Please calculate the loan before saving"
        );
        return;
      }

      const payload = {
        loan_id: loanId,
        employee_id: employeeIdd,
        loan_amount: parseFloat(loanAmount),
        interest_rate_per_annum:
          interestType === "withInterest" ? parseFloat(interestRate) : 0,
        installment_amount: parseFloat(installmentAmount),
        start_from: startDate,
        with_interest: interestType === "withInterest",
        installment_count: loanDetails.length, // Add this line to include installment count
      };

      await createLoan(payload);

      showSuccessMessage(
        "Loan Saved!",
        "Employee loan has been successfully saved"
      );

      // Reset form after successful save
      resetForm();
    } catch (error) {
      console.error("Error saving loan:", error);
      showErrorMessage(
        "Save Failed",
        error.response?.data?.message ||
          "Failed to save loan. Please try again."
      );
    }
  };

  const resetForm = () => {
    setEmployeeNo("");
    setStartDate("");
    setLoanAmount("");
    setInterestRate("");
    setInstallmentAmount("");
    setLoanDetails([]);
    setIsCalculated(false);
    setInstallmentCount("");
    setCalculationType("byAmount");
  };

  // Auto-generate Loan ID
  useEffect(() => {
    if (employeeNo && startDate) {
      const date = new Date(startDate);
      const yyyymmdd = `${date.getFullYear()}${String(
        date.getMonth() + 1
      ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
      const random = Math.floor(1000 + Math.random() * 9000);
      setLoanId(`LN-${employeeNo}-${yyyymmdd}-${random}`);
    } else {
      setLoanId("");
    }
  }, [employeeNo, startDate]);

  // Fetch employee name when employeeNo changes
  useEffect(() => {
    const fetchName = async () => {
      if (employeeNo) {
        const res = await fetchEmployeeNameByNo(employeeNo);
        setEmployeeName(res.full_name);
        setEmployeeIdd(res.id);
      } else {
        setEmployeeName("");
        setEmployeeIdd("");
      }
    };
    fetchName();
  }, [employeeNo]);

  const calculateLoan = () => {
    // Validation
    if (
      !employeeNo ||
      !startDate ||
      !loanAmount ||
      (calculationType === "byAmount" && !installmentAmount) ||
      (calculationType === "byCount" && !installmentCount) ||
      (interestType === "withInterest" && !interestRate)
    ) {
      showErrorMessage(
        "Missing Information",
        "Please fill all required fields"
      );
      return;
    }

    const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

    const principal = parseFloat(loanAmount);
    const ratePercent =
      interestType === "withInterest" ? parseFloat(interestRate) : 0;

    if (isNaN(principal) || principal <= 0) {
      showErrorMessage("Invalid Amount", "Please enter a valid loan amount");
      return;
    }
    if (
      interestType === "withInterest" &&
      (isNaN(ratePercent) || ratePercent < 0)
    ) {
      showErrorMessage("Invalid Rate", "Please enter a valid interest rate");
      return;
    }

    // Flat interest model
    const totalInterest = round2(principal * (ratePercent / 100));
    const totalRepayable = round2(principal + totalInterest);

    let numberOfInstallments;
    let installmentAmt;

    if (calculationType === "byCount") {
      numberOfInstallments = parseInt(installmentCount, 10);
      if (!numberOfInstallments || numberOfInstallments <= 0) {
        showErrorMessage(
          "Invalid Count",
          "Installment count must be a positive integer"
        );
        return;
      }
      const baseInstallment = totalRepayable / numberOfInstallments;
      installmentAmt = round2(baseInstallment);
      setInstallmentAmount(installmentAmt.toFixed(2));
    } else {
      installmentAmt = parseFloat(installmentAmount);
      if (isNaN(installmentAmt) || installmentAmt <= 0) {
        showErrorMessage(
          "Invalid Installment",
          "Installment amount must be greater than 0"
        );
        return;
      }
      numberOfInstallments = Math.ceil(totalRepayable / installmentAmt);
      setInstallmentCount(numberOfInstallments.toString());
    }

    // Build schedule with evenly distributed interest; last row adjusts for rounding
    const details = [];
    let principalRemaining = principal;
    let sumInstallments = 0;
    let sumInterest = 0;

    const baseInterestPerInst =
      numberOfInstallments > 0 ? totalInterest / numberOfInstallments : 0;

    for (let i = 1; i <= numberOfInstallments; i++) {
      // Installment amount for this row
      let thisInstallment;
      if (calculationType === "byCount") {
        // Equal installments, adjust last for rounding
        if (i < numberOfInstallments) {
          thisInstallment = round2(totalRepayable / numberOfInstallments);
        } else {
          thisInstallment = round2(totalRepayable - sumInstallments);
        }
      } else {
        // By fixed amount, last one is the remainder
        if (i < numberOfInstallments) {
          thisInstallment = round2(installmentAmt);
        } else {
          thisInstallment = round2(totalRepayable - sumInstallments);
        }
      }

      // Interest for this row (evenly distributed), adjust last for rounding
      let thisInterest;
      if (i < numberOfInstallments) {
        thisInterest = round2(baseInterestPerInst);
      } else {
        thisInterest = round2(totalInterest - sumInterest);
      }

      // Principal portion
      let thisPrincipal = round2(thisInstallment - thisInterest);
      if (thisPrincipal < 0) {
        // Guard against tiny rounding issues
        thisInterest = thisInstallment;
        thisPrincipal = 0;
      }

      principalRemaining = round2(principalRemaining - thisPrincipal);
      if (principalRemaining < 0.01) principalRemaining = 0;

      details.push({
        no: i,
        dueDate: calculateDueDate(startDate, i),
        days: 30,
        capitalOutstanding: principalRemaining,
        capitalRepayment: thisPrincipal,
        interestPayment: thisInterest,
        installmentAmount: thisInstallment,
        dueBalance: principalRemaining,
      });

      sumInstallments = round2(sumInstallments + thisInstallment);
      sumInterest = round2(sumInterest + thisInterest);
    }

    setLoanDetails(details);
    setIsCalculated(true);

    Swal.fire({
      position: "center",
      icon: "success",
      title: "Loan Calculated",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const calculateDueDate = (startDate, installmentNo) => {
    if (!startDate) return "N/A";
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + installmentNo);
    return date.toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const showInstallmentDetails = (detail) => {
    Swal.fire({
      title: `<span class="text-xl font-bold text-blue-600">Installment #${detail.no}</span>`,
      html: `
        <div class="text-left space-y-3">
          <div class="flex justify-between border-b pb-2">
            <span class="font-semibold text-gray-700">Due Date:</span>
            <span class="font-medium">${detail.dueDate}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="font-semibold text-gray-700">Capital Outstanding:</span>
            <span class="font-mono font-bold">${formatCurrency(
              detail.capitalOutstanding
            )}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="font-semibold text-gray-700">Capital Repayment:</span>
            <span class="font-mono text-green-600">${formatCurrency(
              detail.capitalRepayment
            )}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="font-semibold text-gray-700">Interest Payment:</span>
            <span class="font-mono text-purple-600">${formatCurrency(
              detail.interestPayment
            )}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="font-semibold text-gray-700">Total Installment:</span>
            <span class="font-mono font-bold text-blue-600">${formatCurrency(
              detail.installmentAmount
            )}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold text-gray-700">Remaining Balance:</span>
            <span class="font-mono">${formatCurrency(detail.dueBalance)}</span>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "Close",
      confirmButtonColor: "#3085d6",
      customClass: {
        popup: "rounded-xl shadow-2xl",
        title: "mb-4",
        confirmButton: "px-6 py-2 rounded-lg font-medium mt-4",
      },
      background: "#f9fafb",
      width: "500px",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center border-b border-gray-200 pb-4">
            Employee Wise Loan Calculator
          </h1>

          {/* Loan ID Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-blue-800 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              Loan Information
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loan ID
                </label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-400"
                  value={loanId}
                  readOnly
                  placeholder="Auto-generated Loan ID"
                />
              </div>
            </div>
          </div>

          {/* Interest Type Selection */}
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-green-800 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
              Interest Type
            </h2>
            <div className="flex space-x-6">
              <label className="inline-flex items-center cursor-pointer group">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  checked={interestType === "withInterest"}
                  onChange={() => setInterestType("withInterest")}
                />
                <span className="ml-3 text-lg font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  With Interest
                </span>
              </label>
              <label className="inline-flex items-center cursor-pointer group">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  checked={interestType === "withoutInterest"}
                  onChange={() => setInterestType("withoutInterest")}
                />
                <span className="ml-3 text-lg font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  Without Interest
                </span>
              </label>
            </div>
          </div>

          {/* Employee and Loan Details */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-purple-800 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              Loan Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Employee Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee Number
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-400"
                  value={employeeNo}
                  onChange={(e) => setEmployeeNo(e.target.value)}
                  placeholder="Enter Employee No."
                  required
                />
              </div>
              {/* Employee Name (read-only, right side of Employee Number) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee Name
                </label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                  value={employeeName}
                  readOnly
                  placeholder="Employee name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-400"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loan Amount (LKR)
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-400"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="Enter Amount"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Interest Rate (%)
                  {interestType === "withInterest" && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <input
                  type="number"
                  className={`w-full p-3 border-2 rounded-lg transition-all duration-200 ${
                    interestType === "withoutInterest"
                      ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-400"
                  }`}
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="Enter Rate"
                  disabled={interestType === "withoutInterest"}
                  required={interestType === "withInterest"}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Calculation Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      value="byAmount"
                      checked={calculationType === "byAmount"}
                      onChange={(e) => {
                        setCalculationType(e.target.value);
                        setInstallmentCount("");
                        setInstallmentAmount("");
                      }}
                    />
                    <span className="ml-2">By Installment Amount</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      value="byCount"
                      checked={calculationType === "byCount"}
                      onChange={(e) => {
                        setCalculationType(e.target.value);
                        setInstallmentCount("");
                        setInstallmentAmount("");
                      }}
                    />
                    <span className="ml-2">By Installment Count</span>
                  </label>
                </div>
              </div>
              {calculationType === "byAmount" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Installment Amount (LKR)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    value={installmentAmount}
                    onChange={(e) => setInstallmentAmount(e.target.value)}
                    placeholder="Enter Amount per Installment"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Installments
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(e.target.value)}
                    placeholder="Enter Number of Installments"
                    required
                    min="1"
                    step="1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mb-8">
            <button
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
              onClick={calculateLoan}
            >
              <svg
                className="w-5 h-5 inline-block mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              Calculate
            </button>
            <button
              className={`px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg transform transition-all duration-200 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-300 ${
                !isCalculated
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-green-700 hover:to-green-800 hover:scale-105"
              }`}
              onClick={handleSaveLoan}
              disabled={!isCalculated}
            >
              Save Loan
            </button>
          </div>

          {/* Loan Details Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm0-4h5V8H4v2zm7 8a7 7 0 100-14 7 7 0 000 14zm1-11a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662V13a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 10.766 14 9.991 14 9c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 6.092V5a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Loan Repayment Schedule
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <th className="py-4 px-6 text-left font-semibold">No</th>
                    <th className="py-4 px-6 text-left font-semibold">
                      Due Date
                    </th>
                    <th className="py-4 px-6 text-left font-semibold">Days</th>
                    <th className="py-4 px-6 text-right font-semibold">
                      Outstanding
                    </th>
                    <th className="py-4 px-6 text-right font-semibold">
                      Capital Repayment
                    </th>
                    <th className="py-4 px-6 text-right font-semibold">
                      Interest
                    </th>
                    <th className="py-4 px-6 text-right font-semibold">
                      Installment
                    </th>
                    <th className="py-4 px-6 text-right font-semibold">
                      Balance
                    </th>
                    <th className="py-4 px-6 text-center font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isCalculated && loanDetails.length > 0 ? (
                    loanDetails.map((detail, index) => (
                      <tr
                        key={index}
                        className={`transition-colors hover:bg-blue-50 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="py-4 px-6 border-b border-gray-200">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
                            {detail.no}
                          </span>
                        </td>
                        <td className="py-4 px-6 border-b border-gray-200 font-medium text-gray-700">
                          {detail.dueDate}
                        </td>
                        <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-600">
                          {detail.days}
                        </td>
                        <td className="py-4 px-6 border-b border-gray-200 text-right font-mono text-gray-700">
                          {formatCurrency(detail.capitalOutstanding)}
                        </td>
                        <td className="py-4 px-6 border-b border-gray-200 text-right font-mono text-gray-700">
                          {formatCurrency(detail.capitalRepayment)}
                        </td>
                        <td className="py-4 px-6 border-b border-gray-200 text-right font-mono text-gray-700">
                          {formatCurrency(detail.interestPayment)}
                        </td>
                        <td className="py-4 px-6 border-b border-gray-200 text-right font-mono font-bold text-blue-600">
                          {formatCurrency(detail.installmentAmount)}
                        </td>
                        <td className="py-4 px-6 border-b border-gray-200 text-right font-mono text-gray-700">
                          {formatCurrency(detail.dueBalance)}
                        </td>
                        <td className="py-4 px-6 border-b border-gray-200 text-center">
                          <button
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-medium shadow-md"
                            onClick={() => showInstallmentDetails(detail)}
                          >
                            <svg
                              className="w-4 h-4 inline-block mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-16 text-center">
                        <div className="flex flex-col items-center space-y-4">
                          <svg
                            className="w-16 h-16 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          <div className="text-gray-500">
                            <p className="text-lg font-medium mb-1">
                              {isCalculated
                                ? "No loan details available"
                                : "Ready to Calculate"}
                            </p>
                            <p className="text-sm">
                              {isCalculated
                                ? "Please check your input values"
                                : "Enter loan details and click Calculate to view schedule"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLoan;
