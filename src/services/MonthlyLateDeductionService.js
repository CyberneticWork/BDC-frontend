import axios from "@utils/axios";

const MonthlyLateDeductionService = {
  async getRules() {
    const { data } = await axios.get("/monthly-late-deductions/rules");
    return data;
  },

  async preview({ month, year, company_id, search }) {
    const { data } = await axios.get("/monthly-late-deductions/preview", {
      params: {
        month,
        year,
        company_id: company_id || undefined,
        search: search || undefined,
      },
    });
    return data;
  },

  async apply({ month, year, company_id, employee_ids }) {
    const { data } = await axios.post("/monthly-late-deductions/apply", {
      month,
      year,
      company_id: company_id || undefined,
      employee_ids: employee_ids?.length ? employee_ids : undefined,
    });
    return data;
  },

  async employeeDetail(employeeId, { month, year }) {
    const { data } = await axios.get(
      `/monthly-late-deductions/employees/${employeeId}`,
      { params: { month, year } }
    );
    return data;
  },
};

export default MonthlyLateDeductionService;
