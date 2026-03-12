import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Home from "./pages/Home.jsx";
import AppRoutes from "./routes.jsx";
import "./app.css";
import { BrowserRouter } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./contexts/AuthContext";
import { LeaveProvider } from "./contexts/LeaveContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LeaveProvider>
          <ScrollToTop />
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} />
        </LeaveProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
