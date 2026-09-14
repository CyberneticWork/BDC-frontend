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
  // Always send the Cybernetic Admin token when present. Create/edit company
  // uses POST/PUT /companies (not /cybernetic-admin), which still requires it.
  const cyberneticToken =
    sessionStorage.getItem("cybernetic_admin_token") ||
    localStorage.getItem("cybernetic_admin_token");
  if (cyberneticToken) {
    req.headers["X-Cybernetic-Token"] = cyberneticToken;
  }
  return req;
});

export default axios;
