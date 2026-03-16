import axios from "axios";

const API = axios.create({
  //baseURL: import.meta.env.VITE_API_BASE_URL,
  baseURL: "http://127.0.0.1:8000/api",
  // withCredentials: true, // needed only if you use cookie auth
});

// If you use Sanctum token:
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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