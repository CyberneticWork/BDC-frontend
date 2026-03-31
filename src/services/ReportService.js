import axios from "@utils/axios";

const getMonthlyReportData = async (month, year) => {
  try {
    const response = await axios.get(`/reports/monthly-data`, {
      params: { month, year }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching report data:", error);
    throw error;
  }
};

export default { getMonthlyReportData };