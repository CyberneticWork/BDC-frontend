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