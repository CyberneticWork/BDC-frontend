import React, { useState, useEffect } from "react";
import { Building2, Users, Shield } from "lucide-react";
import Dashboard from "./Dashboard/Dashboard";
import LoginPage from "./Login/LoginPage";
import { loadUser, logout } from "../services/AuthService";
import {
  getUser,
  setUser as storeUser,
  clearUser,
  isEmployeeUser,
  homePathForUser,
} from "../services/UserService";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";

// Home Page (Landing + Auth)
function Home() {
  const [user, setUser] = useState(getUser() || null);
  const navigate = useNavigate(); // << added
  const location = useLocation();
  const { setAuthUser, clearAuth } = useAuth();

  // Try to load user on mount (if token exists)
  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await loadUser();
        setUser(userData);
        storeUser(userData);
        navigate(homePathForUser(userData), { replace: true });
      } catch {
        setUser(null);
        clearUser();
      }
    }
    if (!user) {
      fetchUser();
    } else {
      const dest = homePathForUser(user);
      if (location.pathname !== dest && !(dest === "/dashboard" && location.pathname.startsWith("/dashboard"))) {
        navigate(dest, { replace: true });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuthSuccess = async () => {
    try {
      const userData = await loadUser();
      setUser(userData);
      storeUser(userData);
      setAuthUser(userData);
      navigate(homePathForUser(userData, location.state?.from), { replace: true });
    } catch {
      setUser(null);
      clearUser();
      clearAuth();
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); // Clear token on backend and localStorage
      localStorage.removeItem("employeeFormData");
    } catch (e) {
      // Optionally handle error
    }
    clearUser(); // Clear user from localStorage
    setUser(null); // Update state to trigger re-render
    clearAuth(); // Clear user and permissions in context
    navigate("/", { replace: true }); // << navigate back to home/login
  };

  if (user) {
    if (isEmployeeUser(user)) {
      return <Navigate to="/employee-portal" replace />;
    }
    return (
      <ErrorBoundary>
        <Dashboard user={user} onLogout={handleLogout} />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100">
      <div className="flex min-h-screen">
        <LoginPage onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
}

export default Home;
