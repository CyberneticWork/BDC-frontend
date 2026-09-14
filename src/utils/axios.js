import axiosLib from "axios";
import { getToken } from "../services/TokenService";
import config from '../config';

const root = String(config.apiBaseUrl || "").replace(/\/$/, "");
const apiUrl = root ? `${root}/api` : "/api";

const axios = axiosLib.create({
  baseURL: apiUrl,
  timeout: 30000,
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
    const cyberneticToken =
      sessionStorage.getItem("cybernetic_admin_token") ||
      localStorage.getItem("cybernetic_admin_token");
    if (cyberneticToken) {
      req.headers["X-Cybernetic-Token"] = cyberneticToken;
    }
  }
  return req;
});

export default axios;
