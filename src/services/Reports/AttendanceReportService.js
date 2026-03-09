import axios from "@utils/axios";

export async function getAttendanceRecords({
  date,
  page = 1,
  per_page = 15,
  search = "",
} = {}) {
  if (!date) throw new Error("Date is required");

  const params = { date, page, per_page };
  if (search) params.search = search;

  const res = await axios.get("/reports/time-cards/attendance", { params });
  return res.data;
}

export async function getMonthlyAttendanceRecords({
  month,
  page = 1,
  per_page = 15,
  search = "",
} = {}) {
  if (!month) throw new Error("Month is required");

  const params = { month, page, per_page };
  if (search) params.search = search;

  const res = await axios.get("/reports/time-cards/attendance/monthly", { params });
  return res.data;
}


/*
import axios from "@utils/axios";

export async function getAttendanceRecords({ date, page = 1, per_page = 15, search = "" } = {}) {
  if (!date) throw new Error("Date is required");
  const params = { date, page, per_page };
  if (search) params.search = search;
  const res = await axios.get("/reports/time-cards/attendance", { params });
  return res.data;
}
  */