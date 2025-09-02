import React, { createContext, useContext, useState, useEffect } from "react";
import { loadUser } from "../services/AuthService";
import { permissions } from "../config/permissions"; // Or fetch from API

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await loadUser();
        setUser(userData);
        setUserPermissions(permissions[userData.role] || {}); // Map role to permissions
      } catch (error) {
        setUser(null);
        setUserPermissions({});
      }
    };
    fetchUser();
  }, []);

  // Keep permissions in sync if user's role changes (e.g., after re-login)
  useEffect(() => {
    if (user && user.role) {
      setUserPermissions(permissions[user.role] || {});
    } else {
      setUserPermissions({});
    }
  }, [user?.role]);

  // Allow app code to push a new user into context after login/register
  const setAuthUser = (newUser) => {
    setUser(newUser);
    const role = newUser?.role;
    setUserPermissions(role ? permissions[role] || {} : {});
  };

  // Clear auth state on logout
  const clearAuth = () => {
    setUser(null);
    setUserPermissions({});
  };

  const hasPermission = (module, action) => {
    return userPermissions[module]?.[action] || false;
  };

  return (
    <AuthContext.Provider
      value={{ user, userPermissions, hasPermission, setAuthUser, clearAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
