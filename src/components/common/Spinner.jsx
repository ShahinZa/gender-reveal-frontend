import React from 'react';
import './Spinner.css';

/**
 * Reusable Spinner Component
 * Single Responsibility: Loading indicator
 */
const Spinner = ({ size = 'medium', color = 'primary', className = '' }) => {
  const classes = [
    'spinner',
    `spinner-${size}`,
    `spinner-${color}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes} />;
};

export default Spinner;
