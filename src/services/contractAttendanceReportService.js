import axios from "@utils/axios";

const contractAttendanceReportService = {
  fetch: async (params) => {
    const res = await axios.get("/reports/contract-attendance", { params });
    return res.data;
  },
};

export default contractAttendanceReportService;
