import React from 'react';

const FormSelect = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options, 
  required = false,
  placeholder = 'Select an option...',
  error 
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      required={required}
      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
      }`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(option => (
        <option key={option.value || option} value={option.value || option}>
          {option.label || option}
        </option>
      ))}
    </select>
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
);

export default FormSelect;