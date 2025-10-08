import React from 'react';

/**
 * ResponsiveContainer - A flexible container component that ensures consistent responsive behavior
 * across all pages and components in the application.
 */
const ResponsiveContainer = ({ 
  children, 
  className = '', 
  maxWidth = 'max-w-7xl',
  padding = 'p-responsive',
  margin = 'mx-auto',
  background = 'bg-white',
  rounded = 'rounded-responsive',
  shadow = 'shadow-lg',
  border = 'border border-gray-200',
  ...props 
}) => {
  return (
    <div 
      className={`
        ${maxWidth} 
        ${margin} 
        ${background} 
        ${rounded} 
        ${shadow} 
        ${border} 
        ${padding} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveGrid - A responsive grid component with consistent breakpoints
 */
export const ResponsiveGrid = ({ 
  children, 
  cols = 'grid-responsive-4',
  gap = 'gap-responsive',
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={`grid ${cols} ${gap} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveCard - A responsive card component for consistent card layouts
 */
export const ResponsiveCard = ({ 
  children, 
  className = '',
  padding = 'p-responsive',
  ...props 
}) => {
  return (
    <ResponsiveContainer 
      className={`hover:shadow-xl transition-all duration-300 ${className}`}
      padding={padding}
      {...props}
    >
      {children}
    </ResponsiveContainer>
  );
};

/**
 * ResponsiveForm - A responsive form wrapper with consistent styling
 */
export const ResponsiveForm = ({ 
  children, 
  className = '',
  onSubmit,
  ...props 
}) => {
  return (
    <ResponsiveContainer 
      as="form"
      className={`space-y-4 sm:space-y-6 ${className}`}
      onSubmit={onSubmit}
      {...props}
    >
      {children}
    </ResponsiveContainer>
  );
};

/**
 * ResponsiveFormGroup - A responsive form group for consistent form field layouts
 */
export const ResponsiveFormGroup = ({ 
  children, 
  className = '',
  label,
  error,
  required = false,
  ...props 
}) => {
  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {label && (
        <label className="block text-sm sm:text-base font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

/**
 * ResponsiveInput - A responsive input field with consistent styling
 */
export const ResponsiveInput = React.forwardRef(({ 
  className = '',
  error = false,
  ...props 
}, ref) => {
  return (
    <input
      ref={ref}
      className={`
        w-full px-3 sm:px-4 py-2 sm:py-3 
        border rounded-lg sm:rounded-xl 
        text-sm sm:text-base
        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
        transition-all duration-200
        ${error ? 'border-red-500' : 'border-gray-300'}
        ${className}
      `}
      {...props}
    />
  );
});

ResponsiveInput.displayName = 'ResponsiveInput';

/**
 * ResponsiveButton - A responsive button with consistent styling
 */
export const ResponsiveButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
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
    sm: 'px-3 py-1.5 text-xs sm:text-sm',
    md: 'px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base',
    lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg'
  };

  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500'
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
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
 * ResponsiveTable - A responsive table wrapper with horizontal scroll
 */
export const ResponsiveTable = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table 
          className={`min-w-full divide-y divide-gray-200 ${className}`}
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  );
};

/**
 * ResponsiveModal - A responsive modal component
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
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                {title}
              </h3>
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

export default ResponsiveContainer;