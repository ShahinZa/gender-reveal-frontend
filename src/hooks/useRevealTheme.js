import { useMemo } from 'react';
import { THEME_COLORS, INTENSITY_SETTINGS, DEFAULT_PREFERENCES } from '../constants/revealThemes';
import { padColors, generateBalloonPositions, generateParticlePositions } from '../utils/balloonUtils';

/**
 * Custom hook for reveal theme calculations
 * Single Responsibility: Compute theme-related values with memoization
 * Dependency Inversion: Depends on theme constants abstraction
 *
 * @param {Object} options - Hook options
 * @param {Object} options.preferences - User preferences
 * @param {string} options.gender - 'boy' or 'girl'
 * @returns {Object} Computed theme values
 */
const useRevealTheme = ({ preferences, gender }) => {
  const isBoy = gender === 'boy';

  // Memoize theme selection
  const theme = useMemo(() => {
    return THEME_COLORS[preferences?.theme] || THEME_COLORS.classic;
  }, [preferences?.theme]);

  // Memoize intensity settings
  const intensity = useMemo(() => {
    return INTENSITY_SETTINGS[preferences?.animationIntensity] || INTENSITY_SETTINGS.medium;
  }, [preferences?.animationIntensity]);

  // Memoize colors based on gender
  const colors = useMemo(() => {
    const baseColors = isBoy ? theme.boy : theme.girl;
    return padColors(baseColors, 5);
  }, [isBoy, theme]);

  // Memoize background gradients
  const backgrounds = useMemo(() => ({
    main: isBoy ? theme.bgBoy : theme.bgGirl,
    opening: isBoy ? theme.openingBgBoy : theme.openingBgGirl,
    glow: isBoy ? theme.glowBoy : theme.glowGirl,
  }), [isBoy, theme]);

  // Memoize balloon positions (using intensity.balloonCount as seed for variation)
  const balloonPositions = useMemo(() => {
    return generateBalloonPositions({
      count: intensity.balloonCount,
      colorCount: colors.length,
      seed: intensity.balloonCount * 7, // Different seed per intensity
    });
  }, [intensity.balloonCount, colors.length]);

  // Memoize particle positions
  const particlePositions = useMemo(() => {
    return generateParticlePositions(20);
  }, []);

  // Memoize display values
  const displayValues = useMemo(() => ({
    emoji: isBoy
      ? (preferences?.boyEmoji || DEFAULT_PREFERENCES.boyEmoji)
      : (preferences?.girlEmoji || DEFAULT_PREFERENCES.girlEmoji),
    customMessage: preferences?.customMessage || 'Congratulations!',
    babyCount: preferences?.babyCount || 1,
    genderText: isBoy ? 'BOY' : 'GIRL',
    genderTextPlural: isBoy ? 'BOYS' : 'GIRLS',
    celebrationEmojis: isBoy
      ? ['🩵', '⭐', '🩵', '⭐', '🩵']
      : ['🩷', '⭐', '🩷', '⭐', '🩷'],
  }), [isBoy, preferences?.boyEmoji, preferences?.girlEmoji, preferences?.customMessage, preferences?.babyCount]);

  return {
    isBoy,
    theme,
    intensity,
    colors,
    backgrounds,
    balloonPositions,
    particlePositions,
    displayValues,
  };
};

export default useRevealTheme;
