import React from 'react';
import './Card.css';

/**
 * Reusable Card Component
 * Single Responsibility: Container rendering
 */
const Card = ({
  children,
  className = '',
  animate = true,
  ...props
}) => {
  const classes = [
    'card',
    animate && 'animate-fadeIn',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Sub-components for composition
Card.Icon = ({ children, className = '' }) => (
  <div className={`card-icon ${className}`}>{children}</div>
);

Card.Title = ({ children, className = '' }) => (
  <h1 className={`card-title ${className}`}>{children}</h1>
);

Card.Subtitle = ({ children, className = '' }) => (
  <p className={`card-subtitle ${className}`}>{children}</p>
);

Card.Body = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>{children}</div>
);

export default Card;
