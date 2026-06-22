import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (amount) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);

const fmtNum = (n) => Number(n || 0).toFixed(2);

const escapeCsv = (val) => {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

const statusLabel = (s) => {
  const map = { paid: "Paid", pending: "Pending", overdue: "Overdue" };
  return map[s] || s || "—";
};

export function exportLoanReportCSV(report, filenamePrefix = "loan_report") {
  const lines = [];
  const date = report.report_date || new Date().toISOString().slice(0, 10);

  lines.push("LOAN DETAILS REPORT");
  lines.push(`Generated,${date}`);
  lines.push(`Scope,${report.filter?.scope === "loan" ? `Loan ${report.filter?.loan_id}` : report.filter?.scope === "employee" ? `Employee ${report.filter?.employee_no}` : "All Employees"}`);
  lines.push("");

  lines.push("PORTFOLIO SUMMARY");
  lines.push("Metric,Value");
  const s = report.summary || {};
  lines.push(`Total Loans,${s.total_loans ?? 0}`);
  lines.push(`Active Loans,${s.active_loans ?? 0}`);
  lines.push(`Completed Loans,${s.completed_loans ?? 0}`);
  lines.push(`Total Disbursed,${fmtNum(s.total_disbursed)}`);
  lines.push(`Total Repaid,${fmtNum(s.total_repaid)}`);
  lines.push(`Outstanding Balance,${fmtNum(s.total_outstanding_balance)}`);
  lines.push(`Interest Payable,${fmtNum(s.total_interest_payable)}`);
  lines.push(`Interest Paid,${fmtNum(s.total_interest_paid)}`);
  lines.push(`Installments Paid,${s.installments_paid ?? 0}`);
  lines.push(`Installments Pending,${s.installments_pending ?? 0}`);
  lines.push(`Installments Overdue,${s.installments_overdue ?? 0}`);
  lines.push("");

  lines.push("LOAN SUMMARY");
  lines.push([
    "Loan ID", "Employee No", "Employee Name", "Company", "Department",
    "Loan Amount", "Interest Rate %", "Monthly Installment", "Total Installments",
    "Paid", "Remaining", "Outstanding", "Total Repaid", "Interest Paid",
    "Principal Paid", "Deduct From", "Start Date", "Next Due", "Status",
  ].map(escapeCsv).join(","));

  (report.loans || []).forEach((loan) => {
    lines.push([
      loan.loan_id,
      loan.employee_no,
      loan.employee_name,
      loan.company_name,
      loan.department_name,
      fmtNum(loan.loan_amount),
      loan.interest_rate_per_annum,
      fmtNum(loan.installment_amount),
      loan.installment_count_total,
      loan.installments_paid,
      loan.installments_remaining,
      fmtNum(loan.outstanding_balance),
      fmtNum(loan.total_repaid),
      fmtNum(loan.total_interest_paid),
      fmtNum(loan.total_principal_paid),
      loan.deduct_from_label,
      loan.start_from,
      loan.next_due_date || "—",
      loan.status,
    ].map(escapeCsv).join(","));
  });

  lines.push("");
  lines.push("REPAYMENT SCHEDULE (ALL INSTALLMENTS)");
  lines.push([
    "Loan ID", "Employee No", "Employee Name", "Inst #", "Due Date",
    "Installment", "Principal", "Interest", "Balance After", "Status",
  ].map(escapeCsv).join(","));

  (report.installment_lines || []).forEach((row) => {
    lines.push([
      row.loan_id,
      row.employee_no,
      row.employee_name,
      row.installment_no,
      row.due_date_display || row.due_date,
      fmtNum(row.installment_amount),
      fmtNum(row.principal_deduction),
      fmtNum(row.interest_deduction),
      fmtNum(row.balance_after),
      statusLabel(row.status),
    ].map(escapeCsv).join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenamePrefix}_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportLoanReportPDF(report, filenamePrefix = "loan_report") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const date = report.report_date || new Date().toISOString().slice(0, 10);
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Loan Details Report", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const scope =
    report.filter?.scope === "loan"
      ? `Loan: ${report.filter?.loan_id}`
      : report.filter?.scope === "employee"
        ? `Employee: ${report.filter?.employee_no}`
        : "All Employees";
  doc.text(`Report Date: ${date}  |  Scope: ${scope}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  const s = report.summary || {};
  autoTable(doc, {
    startY: y,
    head: [["Portfolio Summary", ""]],
    body: [
      ["Total Loans", String(s.total_loans ?? 0)],
      ["Active / Completed", `${s.active_loans ?? 0} / ${s.completed_loans ?? 0}`],
      ["Total Disbursed", fmt(s.total_disbursed)],
      ["Total Repaid", fmt(s.total_repaid)],
      ["Outstanding Balance", fmt(s.total_outstanding_balance)],
      ["Interest (Payable / Paid)", `${fmt(s.total_interest_payable)} / ${fmt(s.total_interest_paid)}`],
      ["Installments (Paid / Pending / Overdue)", `${s.installments_paid ?? 0} / ${s.installments_pending ?? 0} / ${s.installments_overdue ?? 0}`],
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 80, fontStyle: "bold" } },
  });

  y = doc.lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [[
      "Loan ID", "Emp No", "Employee", "Amount", "Rate%",
      "Installment", "Paid/Total", "Outstanding", "Repaid", "Next Due", "Status",
    ]],
    body: (report.loans || []).map((loan) => [
      loan.loan_id,
      loan.employee_no,
      loan.employee_name,
      fmtNum(loan.loan_amount),
      `${loan.interest_rate_per_annum}%`,
      fmtNum(loan.installment_amount),
      `${loan.installments_paid}/${loan.installment_count_total}`,
      fmtNum(loan.outstanding_balance),
      fmtNum(loan.total_repaid),
      loan.next_due_date || "—",
      loan.status,
    ]),
    theme: "striped",
    headStyles: { fillColor: [30, 64, 175], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
  });

  (report.loans || []).forEach((loan) => {
    doc.addPage("landscape");
    let sy = 14;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Loan: ${loan.loan_id}`, 14, sy);
    sy += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${loan.employee_name} (${loan.employee_no})  |  ${loan.company_name || "—"}  |  ${loan.department_name || "—"}`,
      14,
      sy
    );
    sy += 6;

    autoTable(doc, {
      startY: sy,
      head: [["Field", "Value"]],
      body: [
        ["Loan Amount", fmt(loan.loan_amount)],
        ["Interest Rate", `${loan.interest_rate_per_annum}% p.a.`],
        ["Monthly Installment", fmt(loan.installment_amount)],
        ["Deduct From", loan.deduct_from_label],
        ["Start Date", loan.start_from_display || loan.start_from],
        ["Installments", `${loan.installments_paid} paid / ${loan.installments_remaining} remaining of ${loan.installment_count_total}`],
        ["Outstanding", fmt(loan.outstanding_balance)],
        ["Total Repaid", fmt(loan.total_repaid)],
        ["Interest Paid / Payable", `${fmt(loan.total_interest_paid)} / ${fmt(loan.total_interest_payable)}`],
        ["Principal Paid / Payable", `${fmt(loan.total_principal_paid)} / ${fmt(loan.total_principal_payable)}`],
        ["Next Due Date", loan.next_due_date || "—"],
        ["Status", loan.status],
      ],
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" } },
    });

    sy = doc.lastAutoTable.finalY + 6;

    autoTable(doc, {
      startY: sy,
      head: [["#", "Due Date", "Installment", "Principal", "Interest", "Balance", "Status"]],
      body: (loan.schedule || []).map((row) => [
        row.installment_no,
        row.due_date_display || row.due_date,
        fmtNum(row.installment_amount),
        fmtNum(row.principal_deduction),
        fmtNum(row.interest_deduction),
        fmtNum(row.balance_after),
        statusLabel(row.status),
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 64, 175], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 1.5 },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 6) {
          const status = (loan.schedule?.[data.row.index]?.status || "").toLowerCase();
          if (status === "paid") data.cell.styles.textColor = [22, 101, 52];
          if (status === "overdue") data.cell.styles.textColor = [185, 28, 28];
          if (status === "pending") data.cell.styles.textColor = [180, 83, 9];
        }
      },
    });
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} of ${totalPages}  —  HR Loan Report  —  ${date}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" }
    );
  }

  doc.save(`${filenamePrefix}_${date}.pdf`);
}
