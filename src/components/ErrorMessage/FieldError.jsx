// components/FieldError.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

const FieldError = ({ error, fieldName }) => {
  if (!error) return null;

  // Format the error message
  const displayError = fieldName 
    ? `${fieldName} ${error}` 
    : error;

  return (
    <div className="mt-1 flex items-start text-red-600 text-sm">
      <AlertCircle className="w-4 h-4 mt-0.5 mr-1 flex-shrink-0" />
      <span>{displayError}</span>
    </div>
  );
};

export default FieldError;