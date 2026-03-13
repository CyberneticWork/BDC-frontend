import React from "react";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const EmployeeSalaryCard = ({ employee, empId, isSelected, onSelect }) => {
  const allowances = Array.isArray(employee.allowances) ? employee.allowances : [];
  const bonuses = Array.isArray(employee.bonuses) ? employee.bonuses : [];
  const deductions = Array.isArray(employee.deductions) ? employee.deductions : [];
  const breakdown =
    employee.salary_breakdown && typeof employee.salary_breakdown === "object"
      ? employee.salary_breakdown
      : {};

  const totalAllowances = allowances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  const totalBonuses = bonuses.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

  const gross = Number(breakdown.gross_salary || 0);
  const net = Number(breakdown.net_salary || 0);
  const totalDeductionBreakdown = Number(breakdown.total_deductions || 0);

  const otMorning = Number(breakdown.ot_morning_fees || 0);
  const otNight = Number(breakdown.ot_night_fees || 0);
  const holidayOt = Number(breakdown.holiday_ot_fees || 0);

  const lateCountForPolicy = Number(breakdown.late_count_for_policy || 0);
  const approvedLeaveLateCount = Number(breakdown.approved_leave_late_count || 0);
  const noDeductionLateCount = Number(breakdown.no_deduction_late_count || 0);
  const shortLeaveCount = Number(breakdown.short_leave_count || 0);
  const halfDayCount = Number(breakdown.half_day_count || 0);
  const deductibleLateCount = Number(breakdown.deductible_late_count || 0);
  const lateDeductionAmount = Number(breakdown.late_deduction_amount || 0);
  const lateDates = Array.isArray(breakdown.late_dates) ? breakdown.late_dates : [];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {employee.emp_no} • {employee.full_name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                BR: {employee.br_status}
              </span>
              {employee.enable_epf_etf ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                  EPF/ETF
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-100">
                  Non-EPF
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              {employee.company_name} • {employee.department_name}
              {employee.sub_department_name ? ` (${employee.sub_department_name})` : ""}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              Basic:{" "}
              <span className="font-semibold text-gray-800">
                {Number(employee.basic_salary || 0).toLocaleString()}
              </span>
              {employee.increment_active ? (
                <span className="ml-2">
                  • Increment: {employee.increment_value} (eff. {employee.increment_effected_date})
                </span>
              ) : (
                <span className="ml-2">• No increment</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 min-w-[320px]">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-[11px] text-gray-500">Gross</div>
            <div className="text-sm font-bold">{gross.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-[11px] text-gray-500">Allowances</div>
            <div className="text-sm font-bold">{totalAllowances.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-blue-50 p-3">
            <div className="text-[11px] text-blue-600">Bonuses</div>
            <div className="text-sm font-bold text-blue-700">{totalBonuses.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-red-50 p-3">
            <div className="text-[11px] text-red-600">Late Deduction</div>
            <div className="text-sm font-bold text-red-700">{lateDeductionAmount.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-[11px] text-gray-500">Deductions</div>
            <div className="text-sm font-bold text-red-600">{totalDeductionBreakdown.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-3">
            <div className="text-[11px] text-green-700">Net Salary</div>
            <div className="text-sm font-extrabold text-green-700">{net.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <details className="border-t border-gray-200">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
          View details (Allowances / Bonuses / Deductions / OT / Breakdown)
        </summary>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-gray-800">Allowances</div>
              <div className="text-sm font-bold text-gray-900">{totalAllowances.toLocaleString()}</div>
            </div>
            {allowances.length > 0 ? (
              <div className="space-y-2">
                {allowances.map((a, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {a.name || a.allowance_name || "Allowance"}{" "}
                      <span className="text-xs text-gray-400">({a.code || a.allowance_code || "-"})</span>
                    </span>
                    <span className="font-semibold">{Number(a.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No allowances</div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-gray-800">Bonuses</div>
              <div className="text-sm font-bold text-gray-900">{totalBonuses.toLocaleString()}</div>
            </div>
            {bonuses.length > 0 ? (
              <div className="space-y-2">
                {bonuses.map((b, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {b.name || b.bonus_name || "Bonus"}{" "}
                      <span className="text-xs text-gray-400">({b.code || b.bonus_code || "-"})</span>
                    </span>
                    <span className="font-semibold">{Number(b.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No bonuses</div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-gray-800">Deductions</div>
              <div className="text-sm font-bold text-red-600">{totalDeductionBreakdown.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">EPF (Employee 8%)</span>
                <span className="font-semibold text-red-600">
                  {Number(breakdown.epf_employee_deduction || 0).toLocaleString()}
                </span>
              </div>
              {deductions.map((d, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {d.name || d.deduction_name || "Deduction"}{" "}
                    <span className="text-xs text-gray-400">({d.code || d.deduction_code || "-"})</span>
                  </span>
                  <span className="font-semibold text-red-600">{Number(d.amount || 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="text-red-600">{totalDeductionBreakdown.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="text-sm font-bold text-gray-800 mb-3">OT & Breakdown</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500">OT Morning</div>
                <div className="text-sm font-bold">{otMorning.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500">OT Night</div>
                <div className="text-sm font-bold">{otNight.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500">Holiday OT</div>
                <div className="text-sm font-bold">{holidayOt.toLocaleString()}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Adj. Basic</span>
                <span className="font-semibold">{Number(breakdown.adjusted_basic || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Per Day</span>
                <span className="font-semibold">{Number(breakdown.per_day_salary || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No Pay Deduction</span>
                <span className="font-semibold text-red-600">{Number(breakdown.no_pay_deduction || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Late Deduction</span>
                <span className="font-semibold text-red-600">{lateDeductionAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Loan</span>
                <span className="font-semibold text-red-600">{Number(breakdown.loan_installment || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stamp</span>
                <span className="font-semibold text-red-600">{Number(breakdown.stamp || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 p-4 bg-red-50 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-red-800">Late Attendance Details</div>
              <div className="text-sm font-bold text-red-700">{lateDeductionAmount.toLocaleString()}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
              <div className="rounded-xl border border-red-100 bg-white p-3">
                <div className="text-[11px] text-gray-500">Late Count</div>
                <div className="text-sm font-bold">{lateCountForPolicy}</div>
              </div>
              <div className="rounded-xl border border-red-100 bg-white p-3">
                <div className="text-[11px] text-gray-500">Approved Leave Late</div>
                <div className="text-sm font-bold text-green-700">{approvedLeaveLateCount}</div>
              </div>
              <div className="rounded-xl border border-red-100 bg-white p-3">
                <div className="text-[11px] text-gray-500">No Deduction</div>
                <div className="text-sm font-bold text-blue-700">{noDeductionLateCount}</div>
              </div>
              <div className="rounded-xl border border-red-100 bg-white p-3">
                <div className="text-[11px] text-gray-500">Short Leave</div>
                <div className="text-sm font-bold text-orange-700">{shortLeaveCount}</div>
              </div>
              <div className="rounded-xl border border-red-100 bg-white p-3">
                <div className="text-[11px] text-gray-500">Half Day</div>
                <div className="text-sm font-bold text-red-700">{halfDayCount}</div>
              </div>
              <div className="rounded-xl border border-red-100 bg-white p-3">
                <div className="text-[11px] text-gray-500">Deductible</div>
                <div className="text-sm font-bold text-red-700">{deductibleLateCount}</div>
              </div>
            </div>

            {lateDates.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-red-100 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">In Time</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Late Min</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Policy</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Leave</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Deduction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lateDates.map((late, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-3 py-2">{late.date || "-"}</td>
                        <td className="px-3 py-2">{late.in_time || "-"}</td>
                        <td className="px-3 py-2">{late.late_minutes ?? 0}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                              late.policy_action === "No Deduction"
                                ? "bg-blue-100 text-blue-700"
                                : late.policy_action === "Short Leave"
                                ? "bg-orange-100 text-orange-700"
                                : late.policy_action === "Half Day"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {late.policy_action || "-"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {late.has_approved_leave ? (
                            <div className="space-y-1">
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                Approved
                              </span>
                              <div className="text-xs text-gray-500">
                                {late.leave_type || "-"}
                                {late.is_half_day_leave ? " • Half Day" : ""}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-semibold text-red-600">
                          {Number(late.salary_deduction || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No late records for this period</div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
};

export default EmployeeSalaryCard;