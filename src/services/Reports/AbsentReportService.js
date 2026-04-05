import axios from "@utils/axios";

export async function getAbsentRecords({
  mode = "daily",
  date = "",
  month = "",
  year = "",
  page = 1,
  per_page = 15,
  search = "",
  company_id = null,
  department_id = null,
  employee_category = "", // 🔥 1. අලුතින් එකතු කළා
} = {}) {
  const params = { mode, page, per_page };

  if (mode === "daily") {
    if (!date) throw new Error("Date is required");
    params.date = date;
  }

  if (mode === "monthly") {
    if (!month || !year) throw new Error("Month and year are required");
    params.month = month;
    params.year = year;
  }

  if (search) params.search = search;
  if (company_id) params.company_id = company_id;
  if (department_id) params.department_id = department_id;
  if (employee_category) params.employee_category = employee_category; //  add new

  const res = await axios.get("/reports/time-cards/absent", { params });
  return res.data;
}



/*
import axios from "@utils/axios";

export async function getAbsentRecords({
  mode = "daily",
  date = "",
  month = "",
  year = "",
  page = 1,
  per_page = 15,
  search = "",
  company_id = null,
  department_id = null,
} = {}) {
  const params = { mode, page, per_page };

  if (mode === "daily") {
    if (!date) throw new Error("Date is required");
    params.date = date;
  }

  if (mode === "monthly") {
    if (!month || !year) throw new Error("Month and year are required");
    params.month = month;
    params.year = year;
  }

  if (search) params.search = search;
  if (company_id) params.company_id = company_id;
  if (department_id) params.department_id = department_id;

  const res = await axios.get("/reports/time-cards/absent", { params });
  return res.data;
}
*/
