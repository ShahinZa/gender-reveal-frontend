import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for Instagram-style heart reactions
 * Follows Single Responsibility Principle - only handles heart reaction logic
 *
 * @param {Object} options - Configuration options
 * @param {React.RefObject} options.socketRef - Reference to WebSocket connection
 * @param {string} options.roomCode - Room code for broadcasting
 * @param {number} options.cooldownMs - Cooldown between hearts (default: 250ms)
 * @param {number} options.heartDuration - How long hearts stay visible (default: 2000ms)
 */
const useHeartReactions = ({ socketRef, roomCode, cooldownMs = 250, heartDuration = 2000 }) => {
  const [hearts, setHearts] = useState([]);
  const heartIdRef = useRef(0);
  const lastHeartTimeRef = useRef(0);

  // Spawn a single heart with randomized properties
  const spawnHeart = useCallback(() => {
    const id = heartIdRef.current++;
    const heart = {
      id,
      // Randomize horizontal position (70-90% from left, near the button)
      x: 75 + Math.random() * 15,
      // Random color from red/pink palette
      color: ['#ff6b6b', '#ff8787', '#ee5a5a', '#ff4757', '#ff6348', '#fc5c65'][
        Math.floor(Math.random() * 6)
      ],
      // Random scale for variety
      scale: 0.7 + Math.random() * 0.5,
      // Random rotation for natural feel
      rotation: -15 + Math.random() * 30,
      // Random horizontal drift
      drift: -20 + Math.random() * 40,
    };

    setHearts(prev => [...prev, heart]);

    // Auto-remove after animation completes
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, heartDuration);
  }, [heartDuration]);

  // Send heart via WebSocket (rate limited)
  const sendHeart = useCallback(() => {
    const now = Date.now();
    if (now - lastHeartTimeRef.current < cooldownMs) return false;
    lastHeartTimeRef.current = now;

    // Show heart immediately for sender
    spawnHeart();

    // Broadcast to others via WebSocket
    if (socketRef?.current?.connected) {
      socketRef.current.emit('send-heart', roomCode);
    }

    return true;
  }, [socketRef, roomCode, cooldownMs, spawnHeart]);

  // Clear all hearts (useful for cleanup)
  const clearHearts = useCallback(() => {
    setHearts([]);
  }, []);

  return {
    hearts,
    sendHeart,
    spawnHeart,
    clearHearts,
    heartCount: hearts.length,
  };
};

export default useHeartReactions;
