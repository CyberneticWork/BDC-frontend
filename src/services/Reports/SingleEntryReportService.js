import axios from "@utils/axios";

export async function getSingleEntryRecords({ date, page = 1, per_page = 15, search = "" } = {}) {
  if (!date) throw new Error("Date is required");
  const params = { date, page, per_page };
  if (search) params.search = search;
  const res = await axios.get("/reports/time-cards/single-entry", { params });
  return res.data;
}