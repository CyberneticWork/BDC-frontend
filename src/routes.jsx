import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./Pages/Home.jsx";

// Centralized routing for the app. Keep Home as the auth/landing wrapper,
// and expose dashboard routes under /dashboard/* so deep links work.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard/*" element={<Home />} />
      {/* Fallback to home for unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// No DashboardWrapper needed when Home renders Dashboard after auth
