import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (amount) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);

const fmtNum = (n) => Number(n || 0).toFixed(2);

const escapeCsv = (val) => {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

const scopeLabel = (filter) => {
  if (filter?.scope === "employee") {
    return `Employee ${filter?.employee_no || filter?.employee_id || ""}`;
  }
  if (filter?.scope === "filtered") {
    return `Filtered (Company: ${filter?.company_id || "All"}, Dept: ${filter?.department_id || "All"})`;
  }
  return filter?.active_only ? "All Active Employees" : "All Employees";
};

const kvRows = (obj, skipEmpty = true) =>
  Object.entries(obj || {})
    .filter(([, v]) => !skipEmpty || (v !== null && v !== undefined && v !== ""))
    .map(([k, v]) => [k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), String(v ?? "—")]);

function appendEmployeeDetailCsv(lines, emp) {
  lines.push("");
  lines.push(`EMPLOYEE,${escapeCsv(emp.employee_no)} — ${escapeCsv(emp.personal?.full_name)}`);
  lines.push("SECTION,FIELD,VALUE");

  kvRows(emp.personal).forEach(([f, v]) => lines.push(["Personal", f, v].map(escapeCsv).join(",")));
  kvRows(emp.contact).forEach(([f, v]) => lines.push(["Contact", f, v].map(escapeCsv).join(",")));
  kvRows(emp.organization).forEach(([f, v]) => lines.push(["Organization", f, v].map(escapeCsv).join(",")));
  kvRows(emp.compensation).forEach(([f, v]) => lines.push(["Compensation", f, v].map(escapeCsv).join(",")));

  if (emp.family?.spouse) {
    kvRows(emp.family.spouse).forEach(([f, v]) => lines.push(["Spouse", f, v].map(escapeCsv).join(",")));
  }
  (emp.family?.children || []).forEach((child, i) => {
    kvRows(child).forEach(([f, v]) => lines.push([`Child ${i + 1}`, f, v].map(escapeCsv).join(",")));
  });

  lines.push("");
  lines.push(`Allowances — ${emp.employee_no}`);
  lines.push(["Type", "Code", "Name", "Amount", "Period"].map(escapeCsv).join(","));
  (emp.allowances || []).forEach((a) => {
    lines.push([
      a.type,
      a.code,
      a.name,
      fmtNum(a.amount),
      a.month && a.year ? `${a.month}/${a.year}` : a.date || "—",
    ].map(escapeCsv).join(","));
  });

  lines.push("");
  lines.push(`Deductions — ${emp.employee_no}`);
  lines.push(["Type", "Code", "Name", "Amount", "Period"].map(escapeCsv).join(","));
  (emp.deductions || []).forEach((d) => {
    lines.push([
      d.type,
      d.code,
      d.name,
      fmtNum(d.amount),
      d.month && d.year ? `${d.month}/${d.year}` : d.date || "—",
    ].map(escapeCsv).join(","));
  });

  lines.push("");
  lines.push(`Bonuses — ${emp.employee_no}`);
  lines.push(["Type", "Code", "Name", "Amount", "Period"].map(escapeCsv).join(","));
  (emp.bonuses || []).forEach((b) => {
    lines.push([
      b.type,
      b.code,
      b.name,
      fmtNum(b.amount),
      b.month && b.year ? `${b.month}/${b.year}` : b.date || "—",
    ].map(escapeCsv).join(","));
  });

  lines.push("");
  lines.push(`Loans — ${emp.employee_no}`);
  lines.push(["Loan ID", "Amount", "Rate%", "Installment", "Remaining", "Outstanding", "Deduct From", "Start", "Status"].map(escapeCsv).join(","));
  (emp.loans || []).forEach((l) => {
    lines.push([
      l.loan_id,
      fmtNum(l.loan_amount),
      l.interest_rate,
      fmtNum(l.installment_amount),
      l.installments_remaining,
      fmtNum(l.outstanding_estimate),
      l.deduct_from,
      l.start_from,
      l.status,
    ].map(escapeCsv).join(","));
  });
}

export function exportEmployeeReportCSV(report, filenamePrefix = "employee_report") {
  const lines = [];
  const date = report.report_date || new Date().toISOString().slice(0, 10);
  const s = report.summary || {};

  lines.push("EMPLOYEE DETAILS REPORT");
  lines.push(`Generated,${date}`);
  lines.push(`Scope,${scopeLabel(report.filter)}`);
  lines.push("");

  lines.push("WORKFORCE SUMMARY");
  lines.push("Metric,Value");
  lines.push(`Total Employees,${s.total_employees ?? 0}`);
  lines.push(`Active / Inactive,${s.active_employees ?? 0} / ${s.inactive_employees ?? 0}`);
  lines.push(`Total Basic Salary,${fmtNum(s.total_basic_salary)}`);
  lines.push(`Total Monthly Bonus,${fmtNum(s.total_monthly_bonus)}`);
  lines.push(`Total Allowances,${fmtNum(s.total_allowances)}`);
  lines.push(`Total Deductions,${fmtNum(s.total_deductions)}`);
  lines.push(`Total Bonuses,${fmtNum(s.total_bonuses)}`);
  lines.push(`Active Loans,${s.total_active_loans ?? 0}`);
  lines.push(`Loan Outstanding (Est.),${fmtNum(s.total_loan_outstanding)}`);
  lines.push("");

  if (s.by_company && Object.keys(s.by_company).length) {
    lines.push("BY COMPANY");
    lines.push("Company,Headcount");
    Object.entries(s.by_company).forEach(([c, n]) => lines.push([c, n].map(escapeCsv).join(",")));
    lines.push("");
  }

  lines.push("EMPLOYEE ROSTER");
  lines.push([
    "Emp No", "Name", "NIC", "EPF", "Company", "Department", "Designation",
    "Basic Salary", "Monthly Bonus", "Allowances", "Deductions", "Bonuses",
    "Active Loans", "Status",
  ].map(escapeCsv).join(","));

  (report.employees || []).forEach((emp) => {
    const pt = emp.payroll_totals || {};
    lines.push([
      emp.employee_no,
      emp.personal?.full_name,
      emp.personal?.nic,
      emp.personal?.epf_no,
      emp.organization?.company,
      emp.organization?.department,
      emp.organization?.designation,
      fmtNum(pt.basic_salary),
      fmtNum(pt.monthly_bonus),
      fmtNum(pt.total_allowances),
      fmtNum(pt.total_deductions),
      fmtNum(pt.total_bonuses),
      pt.active_loan_count ?? 0,
      emp.status,
    ].map(escapeCsv).join(","));
  });

  const isSingle = report.filter?.scope === "employee";
  if (isSingle && report.employees?.[0]) {
    appendEmployeeDetailCsv(lines, report.employees[0]);
  } else if (!isSingle) {
    lines.push("");
    lines.push("CONSOLIDATED ALLOWANCES");
    lines.push(["Emp No", "Name", "Type", "Code", "Name", "Amount"].map(escapeCsv).join(","));
    (report.employees || []).forEach((emp) => {
      (emp.allowances || []).forEach((a) => {
        lines.push([emp.employee_no, emp.personal?.full_name, a.type, a.code, a.name, fmtNum(a.amount)].map(escapeCsv).join(","));
      });
    });

    lines.push("");
    lines.push("CONSOLIDATED DEDUCTIONS");
    lines.push(["Emp No", "Name", "Type", "Code", "Name", "Amount"].map(escapeCsv).join(","));
    (report.employees || []).forEach((emp) => {
      (emp.deductions || []).forEach((d) => {
        lines.push([emp.employee_no, emp.personal?.full_name, d.type, d.code, d.name, fmtNum(d.amount)].map(escapeCsv).join(","));
      });
    });
  }

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

function addSectionTable(doc, title, rows, startY) {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, startY);
  autoTable(doc, {
    startY: startY + 4,
    head: [["Field", "Value"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" } },
  });
  return doc.lastAutoTable.finalY + 6;
}

function addEmployeeDetailPages(doc, emp) {
  doc.addPage("portrait");
  let y = 14;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Employee Profile — ${emp.personal?.full_name || emp.employee_no}`, 14, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${emp.employee_no}  |  ${emp.organization?.company || "—"}  |  ${emp.organization?.department || "—"}  |  ${emp.status}`,
    14,
    y
  );
  y += 8;

  y = addSectionTable(doc, "Personal Information", kvRows(emp.personal), y);
  y = addSectionTable(doc, "Contact & Address", kvRows(emp.contact), y);

  if (y > 240) {
    doc.addPage("portrait");
    y = 14;
  }
  y = addSectionTable(doc, "Organization", kvRows(emp.organization), y);
  y = addSectionTable(doc, "Compensation & Bank", kvRows(emp.compensation), y);

  if (emp.family?.spouse || (emp.family?.children || []).length) {
    if (y > 220) {
      doc.addPage("portrait");
      y = 14;
    }
    const familyRows = [];
    if (emp.family.spouse) {
      kvRows(emp.family.spouse).forEach(([f, v]) => familyRows.push([`Spouse — ${f}`, v]));
    }
    (emp.family.children || []).forEach((c, i) => {
      kvRows(c).forEach(([f, v]) => familyRows.push([`Child ${i + 1} — ${f}`, v]));
    });
    y = addSectionTable(doc, "Family", familyRows, y);
  }

  const addListTable = (title, head, body) => {
    if (y > 230) {
      doc.addPage("portrait");
      y = 14;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [head],
      body,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 1.5 },
    });
    y = doc.lastAutoTable.finalY + 6;
  };

  addListTable(
    "Allowances",
    ["Type", "Code", "Name", "Amount"],
    (emp.allowances || []).map((a) => [a.type, a.code || "—", a.name || "—", fmtNum(a.amount)])
  );

  addListTable(
    "Deductions",
    ["Type", "Code", "Name", "Amount"],
    (emp.deductions || []).map((d) => [d.type, d.code || "—", d.name || "—", fmtNum(d.amount)])
  );

  addListTable(
    "Bonuses",
    ["Type", "Code", "Name", "Amount"],
    (emp.bonuses || []).map((b) => [b.type, b.code || "—", b.name || "—", fmtNum(b.amount)])
  );

  if ((emp.loans || []).length) {
    addListTable(
      "Loans",
      ["Loan ID", "Amount", "Installment", "Remaining", "Outstanding", "Status"],
      (emp.loans || []).map((l) => [
        l.loan_id,
        fmtNum(l.loan_amount),
        fmtNum(l.installment_amount),
        l.installments_remaining,
        fmtNum(l.outstanding_estimate),
        l.status,
      ])
    );
  }

  const pt = emp.payroll_totals || {};
  addSectionTable(doc, "Payroll Summary", [
    ["Basic Salary", fmt(pt.basic_salary)],
    ["Monthly Bonus", fmt(pt.monthly_bonus)],
    ["Total Allowances", fmt(pt.total_allowances)],
    ["Total Deductions", fmt(pt.total_deductions)],
    ["Total Bonuses", fmt(pt.total_bonuses)],
    ["Active Loans", String(pt.active_loan_count ?? 0)],
    ["Loan Outstanding (Est.)", fmt(pt.loan_outstanding)],
  ], y);
}

export function exportEmployeeReportPDF(report, filenamePrefix = "employee_report") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const date = report.report_date || new Date().toISOString().slice(0, 10);
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Details Report", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Report Date: ${date}  |  Scope: ${scopeLabel(report.filter)}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  const s = report.summary || {};
  autoTable(doc, {
    startY: y,
    head: [["Workforce Summary", ""]],
    body: [
      ["Total Employees", String(s.total_employees ?? 0)],
      ["Active / Inactive", `${s.active_employees ?? 0} / ${s.inactive_employees ?? 0}`],
      ["Total Basic Salary", fmt(s.total_basic_salary)],
      ["Total Monthly Bonus", fmt(s.total_monthly_bonus)],
      ["Allowances / Deductions / Bonuses", `${fmt(s.total_allowances)} / ${fmt(s.total_deductions)} / ${fmt(s.total_bonuses)}`],
      ["Active Loans / Outstanding", `${s.total_active_loans ?? 0} / ${fmt(s.total_loan_outstanding)}`],
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
      "Emp No", "Name", "Company", "Department", "Designation",
      "Basic", "Bonus", "Allowances", "Deductions", "Loans", "Status",
    ]],
    body: (report.employees || []).map((emp) => {
      const pt = emp.payroll_totals || {};
      return [
        emp.employee_no,
        emp.personal?.full_name,
        emp.organization?.company || "—",
        emp.organization?.department || "—",
        emp.organization?.designation || "—",
        fmtNum(pt.basic_salary),
        fmtNum(pt.monthly_bonus),
        fmtNum(pt.total_allowances),
        fmtNum(pt.total_deductions),
        pt.active_loan_count ?? 0,
        emp.status,
      ];
    }),
    theme: "striped",
    headStyles: { fillColor: [30, 64, 175], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
  });

  const isSingle = report.filter?.scope === "employee";
  if (isSingle && report.employees?.[0]) {
    addEmployeeDetailPages(doc, report.employees[0]);
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} of ${totalPages}  —  HR Employee Report  —  ${date}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" }
    );
  }

  doc.save(`${filenamePrefix}_${date}.pdf`);
}
