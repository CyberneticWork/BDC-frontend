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

export function logoutCyberneticAdmin({ revoke = true } = {}) {
  const token = getCyberneticToken();
  if (revoke && token) {
    axios
      .post("/cybernetic-admin/logout", null, {
        timeout: 4000,
        headers: { "X-Cybernetic-Token": token },
      })
      .catch(() => {});
  }
  setCyberneticToken(null);
}

export async function loadCyberneticAdmin() {
  const { data } = await axios.get("/cybernetic-admin/me");
  return data;
}
