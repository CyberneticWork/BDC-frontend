import React, { useState, useEffect } from "react";
import { login, loadUser } from "../../services/AuthService";
import Login from "./Login";
import { setUser } from "../../services/UserService";
import { Shield, Users, Clock3, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

function LoginPage({ onSuccess }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    document.title = "Sign in · SPM Tax and Management Consultants HR";
  }, []);

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      await login(credentials);
      const user = await loadUser();
      setUser(user);
      if (onSuccess) onSuccess();
      return {};
    } catch (err) {
      const validationErrors = err?.response?.data?.errors;
      if (validationErrors) return { errors: validationErrors };
      setError(
        err?.response?.data?.message ||
          (err?.response?.status === 500
            ? "Login service error. Please try again."
            : "Login failed. Please check your credentials.")
      );
      return {};
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: "People operations",
      text: "Employees, rosters, leave and payroll in one place.",
    },
    {
      icon: Clock3,
      title: "Live attendance",
      text: "Fingerprint sync, time cards and approvals.",
    },
    {
      icon: Shield,
      title: "Secure access",
      text: "Role-based control for HR, supervisors and staff.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Brand plane — first viewport composition */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative lg:w-[52%] min-h-[42vh] lg:min-h-screen px-8 py-10 lg:px-14 lg:py-12 flex flex-col justify-between text-white overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, #062A32 0%, #0B4F5C 42%, #0D9488 78%, #FF6B4A 130%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="anim-float absolute -top-16 -right-10 w-72 h-72 rounded-full bg-teal-300/20 blur-2xl" />
          <div
            className="anim-float absolute bottom-10 -left-20 w-96 h-96 rounded-full bg-coral-400/10 blur-3xl"
            style={{ animationDelay: "1.2s" }}
          />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, white 1px, transparent 1.5px), radial-gradient(circle at 80% 70%, white 1px, transparent 1.5px)",
              backgroundSize: "42px 42px",
            }}
          />
        </div>

        <div className="relative z-10">
          <motion.h1
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.55 }}
            className="font-display mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] max-w-xl"
          >
            SPM Tax and Management Consultants HR
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.42, duration: 0.5 }}
            className="mt-5 max-w-md text-base sm:text-lg text-white/85 leading-relaxed"
          >
            Professional workforce management for attendance, leave, payroll and
            employee self-service.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="relative z-10 mt-10 space-y-4"
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 rounded-2xl bg-white/10 border border-white/15 px-4 py-3 backdrop-blur-md"
            >
              <div className="mt-0.5 rounded-xl bg-white/20 p-2">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="text-sm text-white/80">{f.text}</p>
              </div>
            </div>
          ))}

          <div className="pt-4 flex flex-wrap gap-4 text-sm text-white/75 border-t border-white/15">
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" /> info@cybernetic.lk
            </span>
            <span className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4" /> +94 70 250 5007
            </span>
          </div>
        </motion.div>
      </motion.section>

      {/* Sign-in composition */}
      <motion.section
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.2 }}
        className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16"
      >
        <div className="w-full max-w-md mx-auto">
          <div className="glass-panel rounded-3xl p-8 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              Secure sign-in
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold text-[var(--brand-ink)]">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Enter your credentials to open the management dashboard.
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p className="font-semibold">Login error</p>
                <p>{error}</p>
              </div>
            )}

            <div className="mt-7">
              <Login onSuccess={handleLogin} loading={loading} />
            </div>

            <div className="mt-6 text-center space-y-2">
              <a
                href="/otp-login"
                className="block text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
              >
                Employee OTP login →
              </a>
              <a
                href="/employee-portal"
                className="block text-sm font-semibold text-slate-600 hover:text-teal-800 transition-colors"
              >
                Open employee portal →
              </a>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Need help? Contact your system administrator.
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
            © {currentYear} SPM Tax and Management Consultants HR
          </p>
        </div>
      </motion.section>
    </div>
  );
}

export default LoginPage;
