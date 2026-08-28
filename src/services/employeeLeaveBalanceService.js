import axios from "@utils/axios";

const employeeLeaveBalanceService = {
  async list(params = {}) {
    const res = await axios.get("/employee-leave-balances", { params });
    return res.data;
  },

  async leaveTypes() {
    const res = await axios.get("/employee-leave-balances/leave-types");
    return res.data;
  },

  async searchEmployees(search = "") {
    const res = await axios.get("/employee-leave-balances/employees", {
      params: search ? { search } : {},
    });
    return res.data;
  },

  async create(payload) {
    const res = await axios.post("/employee-leave-balances", payload);
    return res.data;
  },

  async update(id, payload) {
    const res = await axios.put(`/employee-leave-balances/${id}`, payload);
    return res.data;
  },

  async remove(id) {
    const res = await axios.delete(`/employee-leave-balances/${id}`);
    return res.data;
  },
};

export default employeeLeaveBalanceService;
