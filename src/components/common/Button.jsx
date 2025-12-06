import React from 'react';

const variantClasses = {
  primary: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 hover:shadow-lg hover:shadow-purple-500/30',
  secondary: 'bg-white/10 backdrop-blur text-white border border-white/20 hover:bg-white/20 hover:border-white/30',
  success: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-500/30',
  danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 hover:shadow-lg hover:shadow-red-500/30',
  ghost: 'bg-transparent text-white/80 hover:bg-white/10 hover:text-white',
};

const sizeClasses = {
  small: 'py-2 px-4 text-sm rounded-xl',
  medium: 'py-3 px-6 text-base rounded-xl',
  large: 'py-4 px-8 text-lg rounded-2xl',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.medium,
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
