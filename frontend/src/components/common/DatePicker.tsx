import React from 'react';
import { Calendar, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
  showClearButton?: boolean;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  min,
  max,
  className = '',
  showClearButton = true,
  disabled = false,
}) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <Calendar className="w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
        </div>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent 
                     hover:border-gray-300 transition-all duration-200
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-gray-900 font-medium
                     [&::-webkit-calendar-picker-indicator]:cursor-pointer
                     [&::-webkit-calendar-picker-indicator]:opacity-0
                     [&::-webkit-calendar-picker-indicator]:absolute
                     [&::-webkit-calendar-picker-indicator]:right-3
                     [&::-webkit-calendar-picker-indicator]:w-5
                     [&::-webkit-calendar-picker-indicator]:h-5"
        />
        {showClearButton && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 
                       transition-colors bg-white rounded-full p-0.5 hover:bg-gray-100"
            title="Limpiar fecha"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  className = '',
  disabled = false,
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <svg className="w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent 
                     hover:border-gray-300 transition-all duration-200
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-gray-900 font-medium
                     [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        />
      </div>
    </div>
  );
};
