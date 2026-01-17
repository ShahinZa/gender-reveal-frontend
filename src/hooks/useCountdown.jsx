import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for countdown functionality
 * Used in reveal animation
 */
const useCountdown = (initialCount = 5, onComplete) => {
  const [count, setCount] = useState(initialCount);
  const [isRunning, setIsRunning] = useState(false);
  const countdownDuration = useRef(initialCount);

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

  const start = useCallback((duration) => {
    const startCount = duration ?? countdownDuration.current;
    setCount(startCount);
    setIsRunning(true);
  }, []);

  const reset = useCallback(() => {
    setCount(countdownDuration.current);
    setIsRunning(false);
  }, []);

  const setDuration = useCallback((duration) => {
    countdownDuration.current = duration;
  }, []);

  return {
    count,
    isRunning,
    start,
    reset,
    setDuration,
  };
};

export default useCountdown;
