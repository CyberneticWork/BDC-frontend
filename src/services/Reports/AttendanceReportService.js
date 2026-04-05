import axios from "@utils/axios";

export async function getAttendanceRecords({
  date,
  page = 1,
  per_page = 15,
  search = "",
  company_id = "",
  department_id = "",
  employee_category = "", // 🔥 අලුතින් එකතු කළා
  holiday_worked = false,
} = {}) {
  if (!date) throw new Error("Date is required");

  // Basic parameters
  const params = { date, page, per_page };
  
  // Optional filters
  if (search) params.search = search;
  if (company_id) params.company_id = company_id;
  if (department_id) params.department_id = department_id;
  if (employee_category) params.employee_category = employee_category; // 🔥 අලුතින් එකතු කළා
  if (holiday_worked) params.holiday_worked = holiday_worked ? 1 : 0;

  const res = await axios.get("/reports/time-cards/attendance", { params });
  return res.data;
}

export async function getMonthlyAttendanceRecords({
  month,
  page = 1,
  per_page = 15,
  search = "",
  company_id = "",
  department_id = "",
  employee_category = "", // 🔥 අලුතින් එකතු කළා
  holiday_worked = false,
} = {}) {
  if (!month) throw new Error("Month is required");

  // Basic parameters
  const params = { month, page, per_page };
  
  // Optional filters
  if (search) params.search = search;
  if (company_id) params.company_id = company_id;
  if (department_id) params.department_id = department_id;
  if (employee_category) params.employee_category = employee_category; // 🔥 අලුතින් එකතු කළා
  if (holiday_worked) params.holiday_worked = holiday_worked ? 1 : 0;

  const res = await axios.get("/reports/time-cards/attendance/monthly", {
    params,
  });
  return res.data;
}

export async function updateAttendanceApprovalStatus({
  employeeId,
  date,
  approval_status,
}) {
  if (!employeeId) throw new Error("Employee ID is required");
  if (!date) throw new Error("Date is required");
  if (!approval_status) throw new Error("Approval status is required");

  const res = await axios.put(
    `/reports/time-cards/attendance/${employeeId}/${date}/approval-status`,
    { approval_status }
  );

  return res.data;
}



/*
import axios from "@utils/axios";

export async function getAttendanceRecords({
  date,
  page = 1,
  per_page = 15,
  search = "",
  company_id = "",
  department_id = "",
  holiday_worked = false,
} = {}) {
  if (!date) throw new Error("Date is required");

  // Basic parameters
  const params = { date, page, per_page };
  
  // Optional filters
  if (search) params.search = search;
  if (company_id) params.company_id = company_id;
  if (department_id) params.department_id = department_id;
  if (holiday_worked) params.holiday_worked = holiday_worked ? 1 : 0;

  const res = await axios.get("/reports/time-cards/attendance", { params });
  return res.data;
}

export async function getMonthlyAttendanceRecords({
  month,
  page = 1,
  per_page = 15,
  search = "",
  company_id = "",
  department_id = "",
  holiday_worked = false,
} = {}) {
  if (!month) throw new Error("Month is required");

  // Basic parameters
  const params = { month, page, per_page };
  
  // Optional filters
  if (search) params.search = search;
  if (company_id) params.company_id = company_id;
  if (department_id) params.department_id = department_id;
  if (holiday_worked) params.holiday_worked = holiday_worked ? 1 : 0;

  const res = await axios.get("/reports/time-cards/attendance/monthly", {
    params,
  });
  return res.data;
}

export async function updateAttendanceApprovalStatus({
  employeeId,
  date,
  approval_status,
}) {
  if (!employeeId) throw new Error("Employee ID is required");
  if (!date) throw new Error("Date is required");
  if (!approval_status) throw new Error("Approval status is required");

  const res = await axios.put(
    `/reports/time-cards/attendance/${employeeId}/${date}/approval-status`,
    { approval_status }
  );

  return res.data;
}
*/
