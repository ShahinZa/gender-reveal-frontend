import confetti from 'canvas-confetti';

/**
 * Confetti Utilities
 * Single Responsibility: Handle all confetti-related effects
 * Open/Closed: Configurable through options parameter
 */

/**
 * Trigger celebration confetti effect
 * @param {Object} options - Confetti configuration
 * @param {string[]} options.colors - Array of color hex codes
 * @param {number} options.particleCount - Base particle count
 */
export const triggerCelebrationConfetti = ({ colors, particleCount }) => {
  // Initial burst
  confetti({
    particleCount,
    spread: 100,
    origin: { y: 0.6 },
    colors,
  });

  // Continuous side bursts
  const duration = 5000;
  const end = Date.now() + duration;

  const frame = () => {
    const sideParticleCount = Math.ceil(particleCount / 50);

    // Left side burst
    confetti({
      particleCount: sideParticleCount,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors,
    });

    // Right side burst
    confetti({
      particleCount: sideParticleCount,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
};

/**
 * Reset/clear all confetti
 */
export const resetConfetti = () => {
  confetti.reset();
};
