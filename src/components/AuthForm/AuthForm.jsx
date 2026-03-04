import React from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ErrorMessage from '../ErrorMessage/ErrorMessage';

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
  toggleConfirmPassword 
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}
      
      {!isLogin && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="name"
              name="name"
              type="text"
              required={!isLogin}
              value={formData.name || ''}
              onChange={onChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>
          )}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email || ''}
            onChange={onChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            placeholder="Enter your email"
          />
        </div>
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password || ''}
            onChange={onChange}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
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
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required={!isLogin}
              value={formData.confirmPassword || ''}
              onChange={onChange}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={toggleConfirmPassword}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-medium"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {isLogin ? 'Signing In...' : 'Creating Account...'}
          </>
        ) : (
          <>
            {isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </div>
  );
};

export default AuthForm;
