import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * HeartReactions Component
 * Displays floating hearts animation and heart button for reactions
 * Follows Single Responsibility Principle - only handles heart UI
 */

// Floating heart animation component
const FloatingHeart = ({ heart }) => (
  <motion.div
    initial={{
      opacity: 1,
      y: 0,
      x: 0,
      scale: heart.scale,
      rotate: heart.rotation,
    }}
    animate={{
      opacity: [1, 1, 0.8, 0],
      y: -350,
      x: heart.drift,
      scale: heart.scale * 1.2,
      rotate: heart.rotation + (heart.drift > 0 ? 15 : -15),
    }}
    transition={{
      duration: 2,
      ease: 'easeOut',
      opacity: { times: [0, 0.7, 0.9, 1] },
    }}
    className="absolute bottom-24 pointer-events-none"
    style={{
      left: `${heart.x}%`,
      color: heart.color,
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
    }}
  >
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  </motion.div>
);

// Container for all floating hearts
const FloatingHeartsContainer = ({ hearts }) => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
    <AnimatePresence>
      {hearts.map(heart => (
        <FloatingHeart key={heart.id} heart={heart} />
      ))}
    </AnimatePresence>
  </div>
);

// Heart button with pulse animation
const HeartButton = ({ onPress }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState([]);

  const handleClick = useCallback(() => {
    const sent = onPress();
    if (sent !== false) {
      // Trigger press animation
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);

      // Add ripple effect
      const rippleId = Date.now();
      setRipples(prev => [...prev, rippleId]);
      setTimeout(() => {
        setRipples(prev => prev.filter(id => id !== rippleId));
      }, 600);
    }
  }, [onPress]);

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map(id => (
          <motion.div
            key={id}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-red-400/30"
          />
        ))}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        onClick={handleClick}
        animate={{
          scale: isPressed ? 0.85 : 1,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className="relative w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-lg shadow-black/10 overflow-hidden group"
        aria-label="Send heart reaction"
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Heart icon */}
        <motion.svg
          animate={{
            scale: isPressed ? 1.3 : 1,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className="w-7 h-7 text-red-400 group-hover:text-red-300 transition-colors relative z-10"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </motion.svg>

        {/* Mini heart burst on click */}
        <AnimatePresence>
          {isPressed && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
                  animate={{
                    scale: 0.5,
                    opacity: 0,
                    x: (i - 1) * 20,
                    y: -30 - i * 10,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute text-red-400"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Subtle hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white/30 whitespace-nowrap"
      >
        tap to react
      </motion.p>
    </div>
  );
};

// Main exported component
const HeartReactions = ({ hearts, onSendHeart, enabled = true }) => {
  if (!enabled) return null;

  return (
    <>
      <FloatingHeartsContainer hearts={hearts} />
      <HeartButton onPress={onSendHeart} />
    </>
  );
};

export default HeartReactions;
