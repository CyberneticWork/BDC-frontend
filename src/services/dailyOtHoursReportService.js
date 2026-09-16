import axios from "@utils/axios";

const dailyOtHoursReportService = {
  fetch: async (params) => {
    const res = await axios.get("/reports/daily-ot-hours", { params });
    return res.data;
  },
};

export default dailyOtHoursReportService;
