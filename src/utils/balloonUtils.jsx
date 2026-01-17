/**
 * Balloon Utilities
 * Single Responsibility: Generate balloon configurations for animations
 */

/**
 * Seeded random number generator for consistent positions
 * @param {number} seed - Seed value
 * @returns {function} Random number generator function
 */
const seededRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
};

/**
 * Generate balloon positions for animation
 * Uses seeded random for consistent positions across re-renders
 *
 * @param {Object} options - Configuration options
 * @param {number} options.count - Number of balloons
 * @param {number} options.colorCount - Number of available colors
 * @param {number} [options.seed=42] - Random seed for consistent generation
 * @returns {Array} Array of balloon position configurations
 */
export const generateBalloonPositions = ({ count, colorCount, seed = 42 }) => {
  const random = seededRandom(seed);

  return Array.from({ length: count }, (_, i) => ({
    left: `${(i / count) * 100 + random() * 3}%`,
    delay: (i % 5) * 0.03 + random() * 0.05,
    size: 65 + random() * 65,
    colorIndex: i % colorCount,
    speed: 0.9 + random() * 0.5,
    wobble: 10 + random() * 15,
    rotate: -12 + random() * 24,
  }));
};

/**
 * Generate sparkle particle positions
 * @param {number} count - Number of particles
 * @param {number} [seed=123] - Random seed
 * @returns {Array} Array of particle configurations
 */
export const generateParticlePositions = (count, seed = 123) => {
  const random = seededRandom(seed);

  return Array.from({ length: count }, () => ({
    left: `${random() * 100}%`,
    top: `${random() * 100}%`,
    duration: 1 + random(),
    delay: random() * 0.5,
  }));
};

/**
 * Pad colors array to minimum length
 * @param {string[]} colors - Original colors array
 * @param {number} minLength - Minimum length required
 * @returns {string[]} Padded colors array
 */
export const padColors = (colors, minLength = 5) => {
  const result = [...colors];
  while (result.length < minLength) {
    result.push(colors[result.length % colors.length]);
  }
  return result;
};
