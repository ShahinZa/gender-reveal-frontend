import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for countdown functionality
 * Used in reveal animation
 */
const useCountdown = (initialCount = 5, onComplete) => {
  const [count, setCount] = useState(initialCount);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    if (count === 0) {
      setIsRunning(false);
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, isRunning, onComplete]);

  const start = useCallback(() => {
    setCount(initialCount);
    setIsRunning(true);
  }, [initialCount]);

  const reset = useCallback(() => {
    setCount(initialCount);
    setIsRunning(false);
  }, [initialCount]);

  return {
    count,
    isRunning,
    start,
    reset,
  };
};

export default useCountdown;
