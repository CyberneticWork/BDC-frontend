import axios from "@utils/axios";

const monthlyHoursReportService = {
  fetch: async (params) => {
    const res = await axios.get("/reports/monthly-hours", { params });
    return res.data;
  },
};

export default monthlyHoursReportService;
