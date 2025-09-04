// frontend/src/components/forms/FormTextarea.jsx
import React from 'react';

const FormTextarea = ({ 
  label, 
  name, 
  value, 
  onChange, 
  required = false, 
  placeholder = '',
  readOnly = false,
  rows = 3,
  error,
  ...props 
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      readOnly={readOnly}
      rows={rows}
      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
        error 
          ? 'border-red-300 focus:ring-red-500' 
          : 'border-gray-300'
      } ${
        readOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
      }`}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
);

export default FormTextarea;