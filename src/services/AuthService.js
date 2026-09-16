import axios from "../utils/axios";
import { getToken, setToken } from "./TokenService";

export async function login(credentials) {
  const { data } = await axios.post("/login", credentials);
  setToken(data.token || data.access_token || null);
}

export async function register(registerInfo) {
  const { data } = await axios.post("/register", registerInfo);
  setToken(data.token || data.access_token || null);
}

export async function loadUser() {
  if (!getToken()) {
    throw new Error("No session token");
  }
  const { data: user } = await axios.get("/user");

  return user;
}

export async function logout() {
  const token = getToken();
  try {
    if (token) {
      await axios.get("/logout", { timeout: 4000 });
    }
  } catch {
    // Local session is cleared even if the API is already expired.
  }
  setToken(null);
}
