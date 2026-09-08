import { useState, useEffect, useCallback, useRef } from 'react';

export default function useCountdown(initialCount = 5, onComplete) {
  const [count, setCount] = useState(initialCount);
  const [isRunning, setIsRunning] = useState(false);
  const timer = useRef(null);
  const deadline = useRef(0);
  const duration = useRef(initialCount);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const clear = useCallback(() => { clearInterval(timer.current); timer.current = null; }, []);
  useEffect(() => clear, [clear]);
  const start = useCallback(value => {
    clear();
    const seconds = Math.max(0, Number(value ?? duration.current));
    if (!Number.isFinite(seconds)) return;
    deadline.current = Date.now() + seconds * 1000;
    setCount(Math.ceil(seconds));
    setIsRunning(true);
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setCount(remaining);
      if (remaining === 0) { clear(); setIsRunning(false); callback.current?.(); }
    };
    timer.current = setInterval(tick, 100);
    tick();
  }, [clear]);
  const reset = useCallback(() => { clear(); setIsRunning(false); setCount(duration.current); }, [clear]);
  const setDuration = useCallback(value => { duration.current = value; }, []);
  return { count, isRunning, start, reset, setDuration };
}
