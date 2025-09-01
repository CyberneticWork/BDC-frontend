import axios from "../utils/axios";

const UserManagementService = {
  getAllUsers: async () => {
    const response = await axios.get("/users");
    return response.data;
  },

  getUserById: async (id) => {
    const response = await axios.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await axios.post("/users", userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await axios.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await axios.delete(`/users/${id}`);
    return response.data;
  },
};

export default UserManagementService;
