import axiosLib from "axios";
import { getToken, setToken } from "../services/TokenService";
import config from "../config";

const root = String(config.apiBaseUrl || "").replace(/\/$/, "");
const apiUrl = root ? `${root}/api` : "/api";

const axios = axiosLib.create({
  baseURL: apiUrl,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    Connection: "close",
  },
});

axios.interceptors.request.use((req) => {
  req.headers = req.headers || {};
  req.headers.Connection = "close";
  const token = getToken();
  const cyberneticToken =
    sessionStorage.getItem("cybernetic_admin_token") ||
    localStorage.getItem("cybernetic_admin_token");
  if (cyberneticToken) {
    req.headers["X-Cybernetic-Token"] = cyberneticToken;
  }
  const url = String(req.url || "");
  const companyAdminCall =
    url.includes("/companies") ||
    url.includes("cybernetic-admin") ||
    url.includes("/media/firebase");
  if (cyberneticToken && (companyAdminCall || !token)) {
    req.headers.Authorization = `Bearer ${cyberneticToken}`;
  } else if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      const url = String(err?.config?.url || "");
      const isLogin = url.includes("/login") || url.includes("/send-otp");
      if (!isLogin) {
        setToken(null);
      }
    }
    if (err?.response?.data && typeof err.response.data === "object") {
      const safe = { message: err.response.data.message || "Request failed." };
      if (status === 422 && err.response.data.errors && urlIsLogin(err)) {
        err.response.data = { message: "The provided credentials are incorrect." };
      } else if (status >= 500) {
        err.response.data = { message: "Request failed. Please try again." };
      } else {
        err.response.data = { ...err.response.data, ...safe, trace: undefined, exception: undefined, file: undefined, line: undefined };
      }
    }
    return Promise.reject(err);
  }
);

function urlIsLogin(err) {
  const url = String(err?.config?.url || "");
  return url.includes("/login") || url.includes("/send-otp");
}

export default axios;
