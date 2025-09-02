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

// Home Page (Landing + Auth)
function Home() {
  const [user, setUser] = useState(getUser());
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
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100">
      <div className="flex min-h-screen">
        {/* Left Branding Section */}
        {/* <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 flex flex-col justify-center px-12">
            <div className="mb-8">
              <Building2 className="h-16 w-16 mb-6" />
              <h1 className="text-4xl font-bold mb-4">HRM System</h1>
              <p className="text-xl text-indigo-100 leading-relaxed">
                Streamline your human resources management with our
                comprehensive platform.
              </p>
            </div> */}

        {/* <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Employee Management</h3>
                  <p className="text-indigo-100 text-sm">
                    Manage your workforce efficiently
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Secure & Reliable</h3>
                  <p className="text-indigo-100 text-sm">
                    Enterprise-grade security
                  </p>
                </div>
              </div>
            </div> */}
        {/* </div>
        </div> */}

        {/* Right Authentication Section (now LoginPage) */}
        <LoginPage onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
}

export default Home;
