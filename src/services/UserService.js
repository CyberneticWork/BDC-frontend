let user = null;

export function setUser(newUser) {
  user = newUser;
  if (newUser) {
    localStorage.setItem("user", JSON.stringify(newUser));
  } else {
    localStorage.removeItem("user");
  }
}

export function getUser() {
  if (user) return user;
  const stored = localStorage.getItem("user");
  if (stored) {
    user = JSON.parse(stored);
    return user;
  }
  return null;
}

export function clearUser() {
  user = null;
  localStorage.removeItem("user");
}

export function isEmployeeUser(u = getUser()) {
  const role = String(u?.role || "").toLowerCase();
  if (role === "employee") return true;
  if (u?.portal_only) return true;
  if (u?.employee_id && !["admin", "hr", "supervisor"].includes(role)) return true;
  return false;
}

export function homePathForUser(u, from) {
  if (isEmployeeUser(u)) return "/employee-portal";
  if (from && from !== "/" && !String(from).startsWith("/employee-portal")) {
    return from;
  }
  return "/dashboard";
}