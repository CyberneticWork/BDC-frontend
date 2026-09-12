import axiosLib from "axios";
import { getToken } from "../services/TokenService";
import config from '../config';

const apiUrl = config.apiBaseUrl+ '/api';

const axios = axiosLib.create({
  baseURL: apiUrl, 
  headers: {
    Accept: "application/json",
  },
});

axios.interceptors.request.use((req) => {
  const token = getToken();
  if (token !== null) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  const url = String(req.url || "");
  const isCyberneticAdmin = url.includes("cybernetic-admin");
  const wantsAllCompanies = ["1", 1, true, "true"].includes(req.params?.all);
  if (isCyberneticAdmin || wantsAllCompanies) {
    const cyberneticToken = localStorage.getItem("cybernetic_admin_token");
    if (cyberneticToken) {
      req.headers["X-Cybernetic-Token"] = cyberneticToken;
    }
  }
  return req;
});

export default axios;
