import React from 'react';
import './Alert.css';

/**
 * Reusable Alert Component
 * Single Responsibility: Status messages
 */
const Alert = ({
  children,
  variant = 'error',
  className = '',
  ...props
}) => {
  const classes = [
    'alert',
    `alert-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="alert" {...props}>
      {children}
    </div>
  );
};

export default Alert;
