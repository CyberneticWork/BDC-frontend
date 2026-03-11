import React, { useState, useEffect } from "react";
import { Building2, Users, Shield } from "lucide-react";
import Dashboard from "./Dashboard/Dashboard";
import LoginPage from "./Login/LoginPage";
import { loadUser, logout } from "../services/AuthService";
import {
  getUser,
  setUser as storeUser,
  clearUser,
} from "../services/UserService";
import { useNavigate, useLocation } from "react-router-dom"; // << added
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
        navigate("/dashboard", { replace: true }); // <-- redirect when found
      } catch {
        setUser(null);
        clearUser();
      }
    }
    // Only fetch if not already in localStorage
    if (!user) {
      fetchUser();
    } else {
      // only navigate to /dashboard if we're not already on a dashboard route
      // this prevents clobbering deep links like /dashboard/leaveApproval on refresh
      if (!location.pathname.startsWith("/dashboard")) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuthSuccess = async () => {
    try {
      const userData = await loadUser();
      setUser(userData);
      storeUser(userData);
      // also update AuthContext so permissions recalc without a full refresh
      setAuthUser(userData);
      // After successful login, navigate to previous attempted path if any,
      // otherwise go to /dashboard
      const dest = (location.state && location.state.from) || "/dashboard";
      navigate(dest);
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
    // keep the same Dashboard render so props are preserved
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
