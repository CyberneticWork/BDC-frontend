const TOKEN_KEY = "token";

/** Browser keys that hold a signed-in user's data and must not survive logout. */
const SESSION_KEYS = [
  TOKEN_KEY,
  "user",
  "employeeFormData",
  "editEmployeeId",
  "multiStepFormData",
  "multiStepFormStep",
  "multiStepFormModalOpen",
  "processedSalaryData",
];
const SESSION_STORAGE_KEYS = ["hr_work_mode"];

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

export function setToken(newToken) {
  try {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* storage unavailable */
  }
}

/** Always read storage so a logout/login in another tab is never masked by a stale copy. */
export function getToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    if (isTokenExpired(token)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

function jwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/** Milliseconds until the JWT expires, or null when the token carries no expiry. */
export function tokenExpiresInMs(token = localStorage.getItem(TOKEN_KEY)) {
  const exp = Number(jwtPayload(token)?.exp || 0);
  return exp > 0 ? exp * 1000 - Date.now() : null;
}

export function isTokenExpired(token) {
  const left = tokenExpiresInMs(token);
  return left !== null && left <= 0;
}

/** Remove the token and every cached piece of the signed-in user's data. */
export function clearSession() {
  try {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
  try {
    SESSION_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

/** Clear the session and tell the app to return to the login screen. */
export function expireSession(reason = "expired") {
  clearSession();
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason } }));
}
