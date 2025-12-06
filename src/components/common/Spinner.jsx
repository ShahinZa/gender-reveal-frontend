import React from 'react';

const sizeClasses = {
  small: 'w-5 h-5 border-2',
  medium: 'w-8 h-8 border-3',
  large: 'w-12 h-12 border-4',
};

const colorClasses = {
  primary: 'border-purple-400/30 border-t-purple-400',
  white: 'border-white/30 border-t-white',
  blue: 'border-blue-400/30 border-t-blue-400',
  pink: 'border-pink-400/30 border-t-pink-400',
};

const Spinner = ({ size = 'medium', color = 'white', className = '' }) => {
  const classes = [
    'rounded-full animate-spin',
    sizeClasses[size] || sizeClasses.medium,
    colorClasses[color] || colorClasses.white,
    className,
  ].filter(Boolean).join(' ');

  return <div className={classes} />;
};

export default Spinner;
