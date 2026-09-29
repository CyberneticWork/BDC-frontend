import axios from "../utils/axios";
import { clearSession, getToken, setToken } from "./TokenService";

export async function login(credentials) {
  clearSession();
  const { data } = await axios.post("/login", credentials);
  const token = data.token || data.access_token || null;
  if (!token) {
    throw new Error("Login did not return a session token.");
  }
  setToken(token);
}

export async function register(registerInfo) {
  clearSession();
  const { data } = await axios.post("/register", registerInfo);
  setToken(data.token || data.access_token || null);
}

/** Verifies the stored token with the API; clears it when the API rejects it. */
export async function loadUser() {
  if (!getToken()) {
    throw new Error("No session token");
  }
  try {
    const { data: user } = await axios.get("/user");
    if (!user || typeof user !== "object" || Array.isArray(user)) {
      throw new Error("Invalid session");
    }
    return user;
  } catch (err) {
    clearSession();
    throw err;
  }
}

export async function logout() {
  const token = getToken();
  try {
    if (token) {
      await axios.post("/logout", null, { timeout: 4000 });
    }
  } catch {
    // Local session is cleared even if the API is already expired.
  }
  clearSession();
}
