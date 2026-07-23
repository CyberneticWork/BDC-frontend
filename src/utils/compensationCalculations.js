export function calculateCompensationSummary({
  basicSalary = 0,
  monthlyBonus = 0,
  sportsFundPercentage = 0,
  staffFundAmount = 0,
} = {}) {
  const basic = Number(basicSalary) || 0;
  const bonus = Number(monthlyBonus) || 0;
  const pct = Number(sportsFundPercentage) || 0;
  const staff = Number(staffFundAmount) || 0;

  const totalSalary = +(basic + bonus).toFixed(2);
  const sportsFundAmount = +(totalSalary * (pct / 100)).toFixed(2);
  const remainingTotalSalary = +(totalSalary - sportsFundAmount - staff).toFixed(2);

  return {
    totalSalary,
    sportsFundAmount,
    staffFundAmount: staff,
    remainingTotalSalary,
  };
}

export function formatMoneyLKR(value) {
  return (Number(value) || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
