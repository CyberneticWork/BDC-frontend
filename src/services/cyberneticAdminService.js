import axios from "@utils/axios";

const TOKEN_KEY = "cybernetic_admin_token";

export function getCyberneticToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setCyberneticToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // storage unavailable
  }
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
