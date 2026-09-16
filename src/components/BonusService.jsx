import axios from "@utils/axios";

const API = axios;

const BonusService = {
  async getAllBonuses() {
    const res = await API.get("/bonuses");
    // Laravel often returns: { data: [...] } OR just [...]
    return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  },

  async getBonusesByCompanyOrDepartment(companyId, departmentId) {
    const res = await API.get("/bonuses/by-company-or-department", {
      params: { company_id: companyId, department_id: departmentId },
    });
    return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  },
};

export default BonusService;