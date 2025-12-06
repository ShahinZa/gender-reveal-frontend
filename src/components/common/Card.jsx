import React from 'react';

const Card = ({
  children,
  className = '',
  animate = true,
  variant = 'default',
  ...props
}) => {
  const baseClasses = 'bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8';
  const animateClass = animate ? 'animate-fade-in' : '';

  return (
    <div
      className={`${baseClasses} ${animateClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Icon = ({ children, className = '' }) => (
  <div className={`text-6xl mb-4 text-center ${className}`}>
    {children}
  </div>
);

Card.Title = ({ children, className = '' }) => (
  <h1 className={`text-2xl md:text-3xl font-bold text-white text-center mb-2 ${className}`}>
    {children}
  </h1>
);

Card.Subtitle = ({ children, className = '' }) => (
  <p className={`text-white/70 text-center mb-6 ${className}`}>
    {children}
  </p>
);

Card.Body = ({ children, className = '' }) => (
  <div className={`${className}`}>
    {children}
  </div>
);

export default Card;
