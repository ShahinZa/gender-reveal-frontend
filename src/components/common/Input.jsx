import React from 'react';

const Input = ({
  label,
  error,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-white/80 text-sm font-medium mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`
          w-full bg-white/5 backdrop-blur border rounded-xl px-4 py-3.5 text-white
          placeholder-white/40 transition-all duration-300
          focus:bg-white/10 focus:ring-2 focus:ring-purple-400/20 focus:outline-none
          ${error
            ? 'border-red-400/50 focus:border-red-400/70'
            : 'border-white/20 focus:border-purple-400/50'
          }
        `}
        {...props}
      />
      {error && (
        <span className="text-red-400 text-sm mt-1.5 block">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
