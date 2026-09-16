import React from "react";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import ErrorMessage from "../ErrorMessage/ErrorMessage";

const fieldClass =
  "w-full pl-11 pr-4 py-3.5 rounded-xl border border-teal-100/80 bg-white/90 text-[var(--brand-ink)] placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200";

const AuthForm = ({
  isLogin,
  formData,
  onChange,
  onSubmit,
  loading,
  error,
  errors = {},
  showPassword,
  togglePassword,
  showConfirmPassword,
  toggleConfirmPassword,
}) => {
  return (
    <div className="space-y-5">
      {error && <ErrorMessage message={error} />}

      {!isLogin && (
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-5 w-5 text-teal-600/70" />
            <input
              id="name"
              name="name"
              type="text"
              required={!isLogin}
              value={formData.name || ""}
              onChange={onChange}
              className={fieldClass}
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>}
        </div>
      )}

      <div>
        <label htmlFor="identifier" className="block text-sm font-semibold text-slate-700 mb-2">
          Email or NIC
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-teal-600/70" />
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            minLength={3}
            maxLength={190}
            value={formData.identifier || ""}
            onChange={onChange}
            className={fieldClass}
            placeholder="Enter your email or NIC"
          />
        </div>
        {errors.identifier && (
          <p className="text-red-600 text-sm mt-1">{errors.identifier[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-teal-600/70" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={8}
            maxLength={255}
            value={formData.password || ""}
            onChange={onChange}
            className={`${fieldClass} pr-12`}
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-teal-700"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-600 text-sm mt-1">{errors.password[0]}</p>
        )}
      </div>

      {!isLogin && (
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-teal-600/70" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required={!isLogin}
              value={formData.confirmPassword || ""}
              onChange={onChange}
              className={`${fieldClass} pr-12`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={toggleConfirmPassword}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-teal-700"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm mt-1">{errors.confirmPassword[0]}</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-white shadow-lg shadow-teal-700/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:-translate-y-0.5"
        style={{
          background:
            "linear-gradient(120deg, var(--brand-teal) 0%, var(--brand-deep) 55%, var(--brand-coral) 140%)",
        }}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {isLogin ? "Signing In..." : "Creating Account..."}
          </>
        ) : (
          <>
            {isLogin ? "Sign In to Dashboard" : "Create Account"}
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </div>
  );
};

export default AuthForm;
