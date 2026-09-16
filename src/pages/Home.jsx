import React, { useState, useEffect } from "react";
import Dashboard from "./Dashboard/Dashboard";
import LoginPage from "./Login/LoginPage";
import { loadUser, logout } from "../services/AuthService";
import { getToken, setToken } from "../services/TokenService";
import {
  setUser as storeUser,
  clearUser,
  isEmployeeUser,
  homePathForUser,
} from "../services/UserService";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";

function Home() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!getToken());
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthUser, clearAuth } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!getToken()) {
        clearUser();
        setUser(null);
        setChecking(false);
        return;
      }
      try {
        const userData = await loadUser();
        if (cancelled) return;
        setUser(userData);
        storeUser(userData);
        setAuthUser(userData);
        const dest = homePathForUser(userData);
        if (location.pathname !== dest && !(dest === "/dashboard" && location.pathname.startsWith("/dashboard"))) {
          navigate(dest, { replace: true });
        }
      } catch {
        if (cancelled) return;
        setToken(null);
        setUser(null);
        clearUser();
        clearAuth();
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuthSuccess = (userData) => {
    if (!userData) return;
    setUser(userData);
    storeUser(userData);
    setAuthUser(userData);
    navigate(homePathForUser(userData, location.state?.from), { replace: true });
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("employeeFormData");
    } catch {
      /* ignore */
    }
    clearUser();
    setUser(null);
    clearAuth();
    navigate("/", { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500 text-sm">
        Opening your session…
      </div>
    );
  }

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
