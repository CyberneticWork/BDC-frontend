import React from 'react';
import { getResponsive } from '../../utils/ResponsiveUtils';

/**
 * ResponsivePageWrapper - Consistent page wrapper for all Accounting pages
 */
export const ResponsivePageWrapper = ({ 
  children, 
  title, 
  subtitle,
  actions,
  className = '' 
}) => {
  const responsive = getResponsive();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${className}`}>
        {children}
      </main>
    </div>
  );
};

/**
 * ResponsiveCard - Reusable card component
 */
export const ResponsiveCard = ({ 
  children, 
  className = '', 
  padding = 'p-4 sm:p-6',
  hover = true 
}) => {
  return (
    <div className={`
      bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200
      ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
      ${padding} ${className}
    `}>
      {children}
    </div>
  );
};

/**
 * ResponsiveGrid - Flexible grid layout
 */
export const ResponsiveGrid = ({ 
  children, 
  cols = 'grid-cols-1', 
  gap = 'gap-4 sm:gap-6',
  className = '' 
}) => {
  return (
    <div className={`grid ${cols} ${gap} ${className}`}>
      {children}
    </div>
  );
};

/**
 * ResponsiveTable - Mobile-optimized table wrapper
 */
export const ResponsiveTable = ({ 
  children, 
  className = '',
  stickyHeader = false 
}) => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className={`overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg sm:rounded-xl ${className}`}>
          <table className={`min-w-full divide-y divide-gray-200 ${stickyHeader ? 'sticky-header' : ''}`}>
            {children}
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * ResponsiveTableHeader - Mobile-optimized table header
 */
export const ResponsiveTableHeader = ({ children, className = '' }) => {
  return (
    <thead className={`bg-gray-50 ${className}`}>
      <tr>
        {children}
      </tr>
    </thead>
  );
};

/**
 * ResponsiveTableHeaderCell - Mobile-optimized table header cell
 */
export const ResponsiveTableHeaderCell = ({ 
  children, 
  className = '',
  align = 'left',
  sortable = false 
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <th className={`
      px-3 sm:px-6 py-3 sm:py-4 
      text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider
      ${alignClasses[align]}
      ${sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
      ${className}
    `}>
      {children}
    </th>
  );
};

/**
 * ResponsiveTableBody - Mobile-optimized table body
 */
export const ResponsiveTableBody = ({ children, className = '' }) => {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
      {children}
    </tbody>
  );
};

/**
 * ResponsiveTableRow - Mobile-optimized table row
 */
export const ResponsiveTableRow = ({ 
  children, 
  className = '',
  clickable = false,
  onClick 
}) => {
  return (
    <tr 
      className={`
        hover:bg-gray-50 transition-colors duration-150
        ${clickable ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

/**
 * ResponsiveTableCell - Mobile-optimized table cell
 */
export const ResponsiveTableCell = ({ 
  children, 
  className = '',
  align = 'left',
  truncate = false 
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <td className={`
      px-3 sm:px-6 py-3 sm:py-4 
      text-xs sm:text-sm text-gray-900
      ${alignClasses[align]}
      ${truncate ? 'truncate max-w-0' : 'whitespace-nowrap'}
      ${className}
    `}>
      {children}
    </td>
  );
};

/**
 * ResponsiveButton - Flexible button component
 */
export const ResponsiveButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  loading = false,
  disabled = false,
  ...props 
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg sm:rounded-xl
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const sizeClasses = {
    sm: 'px-3 py-1.5 sm:py-2 text-xs sm:text-sm',
    md: 'px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base',
    lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

/**
 * ResponsiveFormGroup - Form field wrapper
 */
export const ResponsiveFormGroup = ({ 
  children, 
  label,
  error,
  required = false,
  className = '' 
}) => {
  return (
    <div className={`space-y-1 sm:space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm sm:text-base font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs sm:text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * ResponsiveInput - Form input component
 */
export const ResponsiveInput = ({ 
  className = '',
  error = false,
  ...props 
}) => {
  return (
    <input
      className={`
        w-full px-3 sm:px-4 py-2 sm:py-3 
        border rounded-lg sm:rounded-xl 
        text-sm sm:text-base
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        transition-all duration-200
        ${error ? 'border-red-500' : 'border-gray-300'}
        ${className}
      `}
      {...props}
    />
  );
};

/**
 * ResponsiveSelect - Form select component
 */
export const ResponsiveSelect = ({ 
  children,
  className = '',
  error = false,
  ...props 
}) => {
  return (
    <select
      className={`
        w-full px-3 sm:px-4 py-2 sm:py-3 
        border rounded-lg sm:rounded-xl 
        text-sm sm:text-base
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        transition-all duration-200
        ${error ? 'border-red-500' : 'border-gray-300'}
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  );
};

/**
 * ResponsiveTextarea - Form textarea component
 */
export const ResponsiveTextarea = ({ 
  className = '',
  error = false,
  rows = 4,
  ...props 
}) => {
  return (
    <textarea
      rows={rows}
      className={`
        w-full px-3 sm:px-4 py-2 sm:py-3 
        border rounded-lg sm:rounded-xl 
        text-sm sm:text-base
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        transition-all duration-200 resize-vertical
        ${error ? 'border-red-500' : 'border-gray-300'}
        ${className}
      `}
      {...props}
    />
  );
};

/**
 * ResponsiveModal - Modal component
 */
export const ResponsiveModal = ({ 
  children, 
  isOpen, 
  onClose, 
  title,
  className = '',
  size = 'md',
  ...props 
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg sm:max-w-xl lg:max-w-2xl',
    lg: 'max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div 
          className={`
            inline-block align-bottom bg-white rounded-lg sm:rounded-xl 
            text-left overflow-hidden shadow-xl transform transition-all 
            sm:my-8 sm:align-middle w-full
            ${sizeClasses[size]}
            ${className}
          `}
          {...props}
        >
          {title && (
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ResponsiveLoadingSpinner - Loading component
 */
export const ResponsiveLoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8 sm:h-12 sm:w-12',
    lg: 'h-12 w-12 sm:h-16 sm:w-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};

/**
 * ResponsiveBadge - Badge component
 */
export const ResponsiveBadge = ({ 
  children,
  variant = 'default',
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2 sm:px-3 py-1 text-xs sm:text-sm',
    lg: 'px-3 sm:px-4 py-1 sm:py-2 text-sm sm:text-base'
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
};

/**
 * ResponsiveAlert - Alert component
 */
export const ResponsiveAlert = ({ 
  children,
  variant = 'info',
  title,
  className = '',
  onClose 
}) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`
      border rounded-lg sm:rounded-xl p-4 sm:p-6
      ${variantClasses[variant]}
      ${className}
    `}>
      <div className="flex items-start">
        <div className="flex-1">
          {title && (
            <h4 className="text-sm sm:text-base font-medium mb-1">{title}</h4>
          )}
          <div className="text-sm sm:text-base">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-current opacity-50 hover:opacity-100 focus:outline-none"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};