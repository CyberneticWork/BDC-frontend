import React, { useState } from "react";
import { motion } from "framer-motion";
import AuthForm from "../../components/AuthForm/AuthForm";

// Login Page Component
const Login = ({ onSuccess, loading: parentLoading }) => {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // field-level errors
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  };

  const handleSubmit = async () => {
    const identifier = String(formData.identifier || "").trim();
    const password = String(formData.password || "");
    const nextErrors = {};
    if (identifier.length < 3) {
      nextErrors.identifier = ["Enter your email or NIC."];
    }
    if (password.length < 8) {
      nextErrors.password = ["Enter a valid password."];
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    if (onSuccess) {
      await onSuccess({ identifier, password });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.08 }}
    >
      <AuthForm
        isLogin={true}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        loading={loading || parentLoading}
        errors={errors}
        showPassword={showPassword}
        togglePassword={() => setShowPassword(!showPassword)}
      />
    </motion.div>
  );
};

export default Login;
