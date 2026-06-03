import React from "react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const EmployeeSalaryCard = ({ employee, empId, isSelected, onSelect, onDownload }) => {
  // =========================================================================
  // වෙනස් කළ කොටස: String එකක් ආවත් හරියටම Parse කරලා Object එකක් කරගන්නවා
  // =========================================================================
  let allowances = [];
  let bonuses = [];
  let deductions = [];
  let breakdown = {};

  try { allowances = typeof employee.allowances === 'string' ? JSON.parse(employee.allowances) : (employee.allowances || []); } catch (e) { }
  try { bonuses = typeof employee.bonuses === 'string' ? JSON.parse(employee.bonuses) : (employee.bonuses || []); } catch (e) { }
  try { deductions = typeof employee.deductions === 'string' ? JSON.parse(employee.deductions) : (employee.deductions || []); } catch (e) { }
  try { breakdown = typeof employee.salary_breakdown === 'string' ? JSON.parse(employee.salary_breakdown) : (employee.salary_breakdown || {}); } catch (e) { }
  // =========================================================================

  const totalAllowances = allowances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  const totalBonuses = bonuses.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  const totalCustomDeductions = deductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  const gross = Number(breakdown.gross_salary || 0);
  const net = Number(breakdown.net_salary || 0);

  // Late & No-Pay Split
  const fullDayNoPay = Number(breakdown.full_day_nopay_deduction || 0);
  const saturdayNoPay = Number(breakdown.saturday_nopay_deduction || 0);
  const earlyOutNoPay = Number(breakdown.early_out_nopay_deduction || 0);
  const majorLateNoPay = Number(breakdown.major_late_deduction || 0);
  const shortLeaveLate = Number(breakdown.short_leave_deduction || 0);
  const halfDayLate = Number(breakdown.half_day_deduction || 0);
  const totalLatePenalty = shortLeaveLate + halfDayLate + majorLateNoPay + saturdayNoPay;

  // Capital 'Basic' 
  // Database (employee.loan_deduct_from) 
  const rawLoanTarget = employee.loan_deduct_from || breakdown.loan_deduct_from || 'bonus';
  const loanTarget = String(rawLoanTarget).toLowerCase().trim();

  const loanPrincipal = Number(breakdown.loan_principal || breakdown.loan_installment || 0);
  const loanInterest = Number(breakdown.loan_interest || 0);


  const totalDeductions = Number(breakdown.total_deductions || 0);

  const otMorning = Number(breakdown.ot_morning_fees || 0);
  const otNight = Number(breakdown.ot_night_fees || 0);
  const holidayOt = Number(breakdown.holiday_ot_fees || 0);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4">
      <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {employee.emp_no || employee.employee_no} • {employee.full_name}
              </span>
              {(employee.compensation && employee.compensation.enable_epf_etf) ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">EPF/ETF</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-100">Non-EPF</span>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              {employee.company_name} • {employee.department_name}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              Basic: <span className="font-semibold text-gray-800">{Number(employee.basic_salary || 0).toLocaleString()}</span>
            </div>

            {employee.compensation?.bank_name && (
              <div className="text-[10px] text-gray-400 mt-1">
                Bank: {employee.compensation.bank_name} | Acc: {employee.compensation.bank_account_no}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 min-w-[320px] flex-1">
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
            <div className="text-[11px] text-red-600">Late/Leave Penalty</div>
            <div className="text-sm font-bold text-red-700">{totalLatePenalty.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-[11px] text-gray-500">Total Deductions</div>
            <div className="text-sm font-bold text-red-600">{totalDeductions.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-3">
            <div className="text-[11px] text-green-700">Net Salary</div>
            <div className="text-sm font-extrabold text-green-700">{net.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-4 lg:mt-0 flex items-center justify-end">
          <button
            onClick={() => onDownload(employee)}
            className="flex items-center justify-center gap-2 p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors shadow-sm"
            title="Download 4 Payslips"
          >
            <Download size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      <details className="border-t border-gray-200">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
          View details (Allowances / Bonuses / Deductions / OT / Breakdown)
        </summary>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-gray-800">Basic Deductions (EPF & No Pay)</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">EPF Employee (8%)</span>
                <span className="font-semibold text-red-600">{Number(breakdown.epf_employee_deduction || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Full Day No-Pay (Weekdays)</span>
                <span className="font-semibold text-red-600">{fullDayNoPay.toLocaleString()}</span>
              </div>

              {Number(breakdown.probation_deduction) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="text-gray-600">Probation Leave Deduction</span>
                  <span className="font-semibold text-red-600">{formatMoney(breakdown.probation_deduction)}</span>
                </div>
              )}

              {Number(breakdown.stamp_duty) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="text-gray-600">Stamp Duty</span>
                  <span className="font-semibold text-red-600">{formatMoney(breakdown.stamp_duty)}</span>
                </div>
              )}

              {loanTarget === 'basic' && loanPrincipal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Installment (Principal)</span>
                  <span className="font-semibold text-red-600">{loanPrincipal.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-gray-800">Bonus Deductions (Late, Penalties & Custom)</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Major Late (More than 30m)</span>
                <span className="font-semibold text-red-600">{majorLateNoPay.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Short Leave Penalty (Late)</span>
                <span className="font-semibold text-red-600">{shortLeaveLate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Half Day Penalty (Late)</span>
                <span className="font-semibold text-red-600">{halfDayLate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Early Out No-Pay</span>
                <span className="font-semibold text-red-600">{earlyOutNoPay.toLocaleString()}</span>
              </div>

              {saturdayNoPay > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday No-Pay Deduction</span>
                  <span className="font-semibold text-red-600">{saturdayNoPay.toLocaleString()}</span>
                </div>
              )}

              {deductions.map((d, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-600">{d.name} <span className="text-[10px] text-gray-400">({d.category || 'General'})</span></span>
                  <span className="font-semibold text-red-600">{Number(d.amount).toLocaleString()}</span>
                </div>
              ))}

              {loanInterest > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Interest</span>
                  <span className="font-semibold text-red-600">{loanInterest.toLocaleString()}</span>
                </div>
              )}
              {loanTarget === 'bonus' && loanPrincipal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Installment (Principal)</span>
                  <span className="font-semibold text-red-600">{loanPrincipal.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 lg:col-span-2">
            <div className="text-sm font-bold text-gray-800 mb-3">OT Breakdown & Additions</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500">OT Morning ({breakdown.ot_morning_hours || 0} hrs)</div>
                <div className="text-sm font-bold">{otMorning.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500">OT Night ({breakdown.ot_night_hours || 0} hrs)</div>
                <div className="text-sm font-bold">{otNight.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500">Holiday OT ({breakdown.holiday_ot_hours || 0} hrs)</div>
                <div className="text-sm font-bold">{holidayOt.toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-xs font-bold text-gray-700 mb-1 border-b pb-1">Allowances</div>
                {allowances.map((a, i) => (
                  <div key={i} className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">{a.name} <span className="text-[9px] text-gray-400">({a.category || 'General'})</span></span>
                    <span className="font-medium">{Number(a.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-700 mb-1 border-b pb-1">Bonuses</div>
                {bonuses.map((b, i) => (
                  <div key={i} className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">{b.name} <span className="text-[9px] text-gray-400">({b.category || 'General'})</span></span>
                    <span className="font-medium">{Number(b.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </details>
    </div>
  );
};

export default EmployeeSalaryCard;


/*
import React from "react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const EmployeeSalaryCard = ({ employee, empId, isSelected, onSelect, onDownload }) => {
  const allowances = Array.isArray(employee.allowances) ? employee.allowances : [];
  const bonuses = Array.isArray(employee.bonuses) ? employee.bonuses : [];
  const deductions = Array.isArray(employee.deductions) ? employee.deductions : [];
  const breakdown =
    employee.salary_breakdown && typeof employee.salary_breakdown === "object"
      ? employee.salary_breakdown
      : {};

  const totalAllowances = allowances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  const totalBonuses = bonuses.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  const totalCustomDeductions = deductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  const gross = Number(breakdown.gross_salary || 0);
  const net = Number(breakdown.net_salary || 0);
  
  // Late & No-Pay Spilt
  const fullDayNoPay = Number(breakdown.full_day_nopay_deduction || 0);
  const earlyOutNoPay = Number(breakdown.early_out_nopay_deduction || 0);
  const majorLateNoPay = Number(breakdown.major_late_deduction || 0);
  const shortLeaveLate = Number(breakdown.short_leave_deduction || 0);
  const halfDayLate = Number(breakdown.half_day_deduction || 0);
  const totalLatePenalty = shortLeaveLate + halfDayLate + majorLateNoPay;

  const loanTarget = breakdown.loan_deduct_from || 'bonus';
  const loanPrincipal = Number(breakdown.loan_principal || 0);
  const loanInterest = Number(breakdown.loan_interest || 0);

  const totalDeductions = Number(breakdown.total_deductions || 0);

  const otMorning = Number(breakdown.ot_morning_fees || 0);
  const otNight = Number(breakdown.ot_night_fees || 0);
  const holidayOt = Number(breakdown.holiday_ot_fees || 0);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4">
      <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {employee.emp_no || employee.employee_no} • {employee.full_name}
              </span>
              {employee.enable_epf_etf ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">EPF/ETF</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-100">Non-EPF</span>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              {employee.company_name} • {employee.department_name}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              Basic: <span className="font-semibold text-gray-800">{Number(employee.basic_salary || 0).toLocaleString()}</span>
            </div>
            
           
            {employee.compensation?.bank_name && (
                <div className="text-[10px] text-gray-400 mt-1">
                  Bank: {employee.compensation.bank_name} | Acc: {employee.compensation.bank_account_no}
                </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 min-w-[320px] flex-1">
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
            <div className="text-[11px] text-red-600">Late/Leave Penalty</div>
            <div className="text-sm font-bold text-red-700">{totalLatePenalty.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-[11px] text-gray-500">Total Deductions</div>
            <div className="text-sm font-bold text-red-600">{totalDeductions.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-3">
            <div className="text-[11px] text-green-700">Net Salary</div>
            <div className="text-sm font-extrabold text-green-700">{net.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-4 lg:mt-0 flex items-center justify-end">
             <button
                onClick={() => onDownload(employee)}
                className="flex items-center justify-center gap-2 p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors shadow-sm"
                title="Download 4 Payslips"
             >
                <Download size={20} strokeWidth={2} />
             </button>
        </div>
      </div>

      <details className="border-t border-gray-200">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
          View details (Allowances / Bonuses / Deductions / OT / Breakdown)
        </summary>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-gray-800">Basic Deductions (EPF & No Pay)</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">EPF Employee (8%)</span>
                <span className="font-semibold text-red-600">{Number(breakdown.epf_employee_deduction || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Full Day No-Pay</span>
                <span className="font-semibold text-red-600">{fullDayNoPay.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Early Out No-Pay</span>
                <span className="font-semibold text-red-600">{earlyOutNoPay.toLocaleString()}</span>
              </div>

            {Number(breakdown.probation_deduction) > 0 && (
  <div className="flex justify-between text-sm text-gray-600">
    <span className="text-gray-600">Probation Leave Deduction</span>
    <span className="font-semibold text-red-600">{formatMoney(breakdown.probation_deduction)}</span>
  </div>
)}

{Number(breakdown.stamp_duty) > 0 && (
  <div className="flex justify-between text-sm text-gray-600">
    <span className="text-gray-600">Stamp Duty</span>
    <span className="font-semibold text-red-600">{formatMoney(breakdown.stamp_duty)}</span>
  </div>
)}

              {loanTarget === 'basic' && loanPrincipal > 0 && (
                <div className="flex justify-between">
                    <span className="text-gray-600">Loan Installment (Principal)</span>
                    <span className="font-semibold text-red-600">{loanPrincipal.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-gray-800">Bonus Deductions (Late, Penalties & Custom)</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Major Latemore than 30m</span>
                <span className="font-semibold text-red-600">{majorLateNoPay.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Short Leave Penalty (Late)</span>
                <span className="font-semibold text-red-600">{shortLeaveLate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Half Day Penalty (Late)</span>
                <span className="font-semibold text-red-600">{halfDayLate.toLocaleString()}</span>
              </div>
              
             
              {deductions.map((d, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-600">{d.name} <span className="text-[10px] text-gray-400">({d.category || 'General'})</span></span>
                  <span className="font-semibold text-red-600">{Number(d.amount).toLocaleString()}</span>
                </div>
              ))}

              {loanInterest > 0 && (
                <div className="flex justify-between">
                    <span className="text-gray-600">Loan Interest</span>
                    <span className="font-semibold text-red-600">{loanInterest.toLocaleString()}</span>
                </div>
              )}
              {loanTarget === 'bonus' && loanPrincipal > 0 && (
                <div className="flex justify-between">
                    <span className="text-gray-600">Loan Installment (Principal)</span>
                    <span className="font-semibold text-red-600">{loanPrincipal.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 lg:col-span-2">
            <div className="text-sm font-bold text-gray-800 mb-3">OT Breakdown & Additions</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500">OT Morning ({breakdown.ot_morning_hours || 0} hrs)</div>
                <div className="text-sm font-bold">{otMorning.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500">OT Night ({breakdown.ot_night_hours || 0} hrs)</div>
                <div className="text-sm font-bold">{otNight.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500">Holiday OT ({breakdown.holiday_ot_hours || 0} hrs)</div>
                <div className="text-sm font-bold">{holidayOt.toLocaleString()}</div>
              </div>
            </div>

           
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-xs font-bold text-gray-700 mb-1 border-b pb-1">Allowances</div>
                {allowances.map((a, i) => (
                  <div key={i} className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">{a.name} <span className="text-[9px] text-gray-400">({a.category || 'General'})</span></span>
                    <span className="font-medium">{Number(a.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-700 mb-1 border-b pb-1">Bonuses</div>
                {bonuses.map((b, i) => (
                  <div key={i} className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">{b.name} <span className="text-[9px] text-gray-400">({b.category || 'General'})</span></span>
                    <span className="font-medium">{Number(b.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </details>
    </div>
  );
};

export default EmployeeSalaryCard;

*/
