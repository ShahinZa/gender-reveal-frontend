import React from 'react';

const variantClasses = {
  error: 'bg-red-500/20 border-red-400/30 text-red-200',
  success: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200',
  warning: 'bg-amber-500/20 border-amber-400/30 text-amber-200',
  info: 'bg-blue-500/20 border-blue-400/30 text-blue-200',
};

const iconMap = {
  error: '⚠️',
  success: '✓',
  warning: '⚡',
  info: 'ℹ️',
};

const Alert = ({
  children,
  variant = 'error',
  className = '',
  showIcon = true,
  ...props
}) => {
  const classes = [
    'flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm my-4',
    variantClasses[variant] || variantClasses.error,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert" {...props}>
      {showIcon && (
        <span className="text-lg flex-shrink-0">{iconMap[variant]}</span>
      )}
      <span className="text-sm">{children}</span>
    </div>
  );
};

export default Alert;
