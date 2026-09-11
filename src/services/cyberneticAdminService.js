import axios from "@utils/axios";

const TOKEN_KEY = "cybernetic_admin_token";

export function getCyberneticToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setCyberneticToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function loginCyberneticAdmin(password) {
  const { data } = await axios.post("/cybernetic-admin/login", { password });
  setCyberneticToken(data.token);
  return data;
}

export function logoutCyberneticAdmin() {
  setCyberneticToken(null);
}

export async function loadCyberneticAdmin() {
  const { data } = await axios.get("/cybernetic-admin/me");
  return data;
}
