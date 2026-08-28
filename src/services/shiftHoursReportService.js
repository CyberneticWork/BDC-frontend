import axios from "@utils/axios";

const shiftHoursReportService = {
  fetch: async (params) => {
    const res = await axios.get("/reports/shift-hours", { params });
    return res.data;
  },
};

export default shiftHoursReportService;
