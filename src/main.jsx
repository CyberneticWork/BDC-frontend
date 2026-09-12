import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./routes.jsx";
import "./app.css";
import { BrowserRouter } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./contexts/AuthContext";
import { BrandingProvider } from "./contexts/BrandingContext";
import { LeaveProvider } from "./contexts/LeaveContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BrandingProvider>
        <LeaveProvider>
          <ScrollToTop />
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
          <ToastContainer position="top-right" autoClose={3000} />
        </LeaveProvider>
        </BrandingProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
