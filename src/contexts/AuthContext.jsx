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

  const hasPermission = (module, action) => {
    return userPermissions[module]?.[action] || false;
  };

  return (
    <AuthContext.Provider value={{ user, userPermissions, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
