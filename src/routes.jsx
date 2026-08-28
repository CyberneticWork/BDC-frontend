import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import OTPLogin from "./pages/Auth/OTPLogin.jsx";
import EmployeePortal from "./pages/EmployeePortal/EmployeePortal.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/otp-login" element={<OTPLogin />} />
      <Route path="/employee-portal" element={<EmployeePortal />} />
      <Route path="/employee-login" element={<Navigate to="/otp-login" replace />} />
      <Route path="/dashboard/*" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
