import React, { useState, useEffect } from "react";
import { login, loadUser } from "../../services/AuthService";
import Login from "./Login";
import { setUser } from "../../services/UserService";
import { Shield, Users, Info, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

function LoginPage({ onSuccess }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handles login form submission
  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      await login(credentials);
      const user = await loadUser();
      setUser(user);
      if (onSuccess) onSuccess();
      return {}; // success: no errors
    } catch (err) {
      // Capture validation errors if they exist
      const validationErrors = err?.response?.data?.errors;
      if (validationErrors) {
        return { errors: validationErrors };
      }

      // Otherwise set a global error
      setError(
        err?.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
      return {};
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
      {/* Left Section - Branding (visible on all screens now) */}
      <motion.div
        className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white lg:w-1/2 p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Background decorative elements */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-blue-500 opacity-20"></div>
        <div className="absolute top-1/4 -right-16 w-40 h-40 rounded-full bg-indigo-400 opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full bg-white opacity-10"></div>

        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-8"
          >
            <img
              src="./logo.png"
              alt="HRM System Logo"
              className="h-16 w-auto"
            />
          </motion.div>
          <motion.h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            HRM System
          </motion.h1>
          <motion.p
            className="text-lg lg:text-xl text-blue-100 mb-8 max-w-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            Streamline your human resources management with our comprehensive
            platform.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
          className="relative z-10 space-y-6 mt-auto"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-4"
          >
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Employee Management</h3>
              <p className="text-blue-100">Manage your workforce efficiently</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center gap-4"
          >
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Secure & Reliable</h3>
              <p className="text-blue-100">Enterprise-grade security</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="pt-8 text-sm text-blue-100 border-t border-blue-400/30 mt-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4" />
              <span>info@cybernetic.lk</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>+94 70 250 5007</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Right Section - Login Form */}
      <motion.div
        className="flex-1 flex flex-col justify-between p-8 lg:p-12 bg-gray-50"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
      >
        <motion.div
          className="max-w-md w-full mx-auto mt-auto mb-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="bg-white py-8 px-8 rounded-2xl shadow-xl border border-gray-100">
            <motion.div
              className="mb-8 text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back
              </h2>
              <p className="text-gray-600">Please sign in to your account</p>
            </motion.div>

            {error && (
              <motion.div
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-md"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="font-medium">Login Error</p>
                <p>{error}</p>
              </motion.div>
            )}

            <Login onSuccess={handleLogin} loading={loading} />

            <motion.div
              className="mt-6 text-center text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <p>Need help? Contact your system administrator</p>
            </motion.div>
          </div>

          <motion.div
            className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.5 }}
          >
            <div className="bg-blue-100 rounded-full p-2 mr-3">
              <Info size={18} className="text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-700">
                Forgot your password? Please contact the IT department to reset
                your credentials.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <p>&copy; {currentYear} Cybernetic IT Deparment. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a
              href="#"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="#"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Terms of Service
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="#"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Help
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
