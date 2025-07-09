import React from "react";
import { DollarSign, Calendar, Building2, CreditCard, AlertCircle, User } from "lucide-react";
import { useEmployeeForm } from '@contexts/EmployeeFormContext';

const CompensationManagement = ({ onNext, onPrevious, activeCategory }) => {
  const { formData, updateFormData } = useEmployeeForm();

  const handleInputChange = (field, value) => {
    updateFormData('compensation', { [field]: value });
  };

  const handleToggleChange = (field) => {
    updateFormData('compensation', { [field]: !formData.compensation[field] });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-green-600" />
            Compensation Management
          </h2>
        </div>
        <form>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Salary Information */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Salary Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Basic Salary <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={formData.compensation.basicSalary}
                        onChange={(e) =>
                          handleInputChange("basicSalary", e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter basic salary"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Increment Value
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={formData.compensation.incrementValue}
                        onChange={(e) =>
                          handleInputChange("incrementValue", e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter increment"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Increment Effective From
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.compensation.incrementEffectiveFrom}
                        onChange={(e) =>
                          handleInputChange(
                            "incrementEffectiveFrom",
                            e.target.value
                          )
                        }
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Settings */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-600" />
                  Employment Settings
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <label
                      htmlFor="secondaryEmp"
                      className="text-sm font-medium text-gray-700"
                    >
                      Secondary Employment
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      style={{
                        backgroundColor: formData.compensation.secondaryEmp
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                      onClick={() => handleToggleChange("secondaryEmp")}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.compensation.secondaryEmp
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <label
                      htmlFor="enableEpfEtf"
                      className="text-sm font-medium text-gray-700"
                    >
                      Enable EPF/ETF
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      style={{
                        backgroundColor: formData.compensation.enableEpfEtf
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                      onClick={() => handleToggleChange("enableEpfEtf")}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.compensation.enableEpfEtf
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <label
                      htmlFor="otActive"
                      className="text-sm font-medium text-gray-700"
                    >
                      OT Active
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      style={{
                        backgroundColor: formData.compensation.otActive
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                      onClick={() => handleToggleChange("otActive")}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.compensation.otActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <label
                      htmlFor="incrementActive"
                      className="text-sm font-medium text-gray-700"
                    >
                      Increment Active
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      style={{
                        backgroundColor: formData.compensation.incrementActive
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                      onClick={() => handleToggleChange("incrementActive")}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.compensation.incrementActive
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <label
                      htmlFor="nopayActive"
                      className="text-sm font-medium text-gray-700"
                    >
                      No-pay Active
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      style={{
                        backgroundColor: formData.compensation.nopayActive
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                      onClick={() => handleToggleChange("nopayActive")}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.compensation.nopayActive
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <label
                      htmlFor="earlyDeduction"
                      className="text-sm font-medium text-gray-700"
                    >
                      Early Deduction
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      style={{
                        backgroundColor: formData.compensation.earlyDeduction
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                      onClick={() => handleToggleChange("earlyDeduction")}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.compensation.earlyDeduction
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* OT Settings */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                  Overtime Settings
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <label
                      htmlFor="morningOt"
                      className="text-sm font-medium text-gray-700"
                    >
                      Morning OT
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      style={{
                        backgroundColor: formData.compensation.morningOt
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                      onClick={() => handleToggleChange("morningOt")}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.compensation.morningOt ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <label
                      htmlFor="eveningOt"
                      className="text-sm font-medium text-gray-700"
                    >
                      Evening OT
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      style={{
                        backgroundColor: formData.compensation.eveningOt
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                      onClick={() => handleToggleChange("eveningOt")}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.compensation.eveningOt ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Bank Information */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  Bank Information
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <select
                        value={formData.compensation.bankName}
                        onChange={(e) =>
                          handleInputChange("bankName", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="1/1/1900">Select Bank</option>
                        <option value="bank1">Bank of Ceylon</option>
                        <option value="bank2">Commercial Bank</option>
                        <option value="bank3">Peoples Bank</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch Name
                      </label>
                      <select
                        value={formData.compensation.branchName}
                        onChange={(e) =>
                          handleInputChange("branchName", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="1/1/1900">Select Branch</option>
                        <option value="branch1">Main Branch</option>
                        <option value="branch2">City Branch</option>
                        <option value="branch3">Regional Branch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Code
                      </label>
                      <input
                        type="text"
                        value={formData.compensation.bankCode}
                        onChange={(e) =>
                          handleInputChange("bankCode", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter bank code"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch Code
                      </label>
                      <input
                        type="text"
                        value={formData.compensation.branchCode}
                        onChange={(e) =>
                          handleInputChange("branchCode", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter branch code"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Account Number
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.compensation.bankAccountNo}
                        onChange={(e) =>
                          handleInputChange("bankAccountNo", e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter account number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Budgetary Relief Allowances */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Budgetary Relief Allowances
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        Budgetary Relief Allowance 2015
                      </h3>
                      <p className="text-sm text-gray-600">
                        BR1 Relief allowance for 2015
                      </p>
                    </div>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      style={{
                        backgroundColor: formData.compensation.budgetaryReliefAllowance2015
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                      onClick={() =>
                        handleToggleChange("budgetaryReliefAllowance2015")
                      }
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.compensation.budgetaryReliefAllowance2015
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        Budgetary Relief Allowance 2016
                      </h3>
                      <p className="text-sm text-gray-600">
                        BR2 Relief allowance for 2016
                      </p>
                    </div>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      style={{
                        backgroundColor: formData.compensation.budgetaryReliefAllowance2016
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                      onClick={() =>
                        handleToggleChange("budgetaryReliefAllowance2016")
                      }
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.compensation.budgetaryReliefAllowance2016
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Employment Basic */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Primary Employment Basic
                </h2>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        Primary Employment Basic
                      </h3>
                  
                    </div>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      style={{
                        backgroundColor: formData.compensation.primaryEmploymentBasic
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                      onClick={() =>
                        handleToggleChange("primaryEmploymentBasic")
                      }
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.compensation.primaryEmploymentBasic
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </div>
                  </div>
              </div>

              {/* Comments */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Comments
                </h2>

                <textarea
                  value={formData.compensation.comments}
                  onChange={(e) =>
                    handleInputChange("comments", e.target.value)
                  }
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Add any additional comments or notes..."
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onPrevious}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onNext}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompensationManagement;