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


/*
import axios from "@utils/axios";

// mode = "daily" | "monthly"
// daily => date required
// monthly => month + year required
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


//===========================================================================
/*
import axios from "@utils/axios";

// date: YYYY-MM-DD, optional search/company_id/department_id, pagination
export async function getAbsentRecords({ date, page = 1, per_page = 15, search = "", company_id = null, department_id = null } = {}) {
  if (!date) throw new Error("Date is required");
  const params = { date, page, per_page };
  if (search) params.search = search;
  if (company_id) params.company_id = company_id;
  if (department_id) params.department_id = department_id;
  const res = await axios.get("/reports/time-cards/absent", { params });
  return res.data;
}
  */