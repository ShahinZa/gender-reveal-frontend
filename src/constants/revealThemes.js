/**
 * Theme colors and settings for reveal customization
 */

export const THEME_COLORS = {
  classic: {
    boy: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb'],
    girl: ['#f9a8d4', '#f472b6', '#ec4899', '#db2777'],
    bgBoy: 'from-blue-900 via-blue-800 to-cyan-900',
    bgGirl: 'from-pink-900 via-pink-800 to-rose-900',
    openingBgBoy: 'from-blue-500 via-blue-600 to-blue-900',
    openingBgGirl: 'from-pink-400 via-pink-600 to-pink-900',
    glowBoy: 'bg-blue-400/30',
    glowGirl: 'bg-pink-400/30',
    label: 'Classic',
  },
  purple: {
    boy: ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed'],
    girl: ['#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7'],
    bgBoy: 'from-violet-900 via-purple-800 to-indigo-900',
    bgGirl: 'from-fuchsia-900 via-purple-800 to-pink-900',
    openingBgBoy: 'from-violet-500 via-purple-600 to-indigo-900',
    openingBgGirl: 'from-fuchsia-400 via-purple-600 to-pink-900',
    glowBoy: 'bg-violet-400/30',
    glowGirl: 'bg-fuchsia-400/30',
    label: 'Purple',
  },
  gold: {
    boy: ['#fde68a', '#fcd34d', '#fbbf24', '#f59e0b'],
    girl: ['#fecaca', '#fca5a5', '#f87171', '#ef4444'],
    bgBoy: 'from-amber-900 via-yellow-800 to-orange-900',
    bgGirl: 'from-rose-900 via-red-800 to-orange-900',
    openingBgBoy: 'from-amber-500 via-yellow-600 to-orange-900',
    openingBgGirl: 'from-rose-400 via-red-600 to-orange-900',
    glowBoy: 'bg-amber-400/30',
    glowGirl: 'bg-rose-400/30',
    label: 'Gold',
  },
  rainbow: {
    boy: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
    girl: ['#ec4899', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
    bgBoy: 'from-indigo-900 via-purple-800 to-pink-900',
    bgGirl: 'from-pink-900 via-purple-800 to-indigo-900',
    openingBgBoy: 'from-indigo-500 via-purple-600 to-pink-800',
    openingBgGirl: 'from-pink-500 via-purple-600 to-indigo-800',
    glowBoy: 'bg-indigo-400/30',
    glowGirl: 'bg-pink-400/30',
    label: 'Rainbow',
  },
};

export const INTENSITY_SETTINGS = {
  low: {
    particleCount: 75,
    balloonCount: 10,
    label: 'Low',
    description: 'Subtle animations',
  },
  medium: {
    particleCount: 150,
    balloonCount: 20,
    label: 'Medium',
    description: 'Balanced experience',
  },
  high: {
    particleCount: 300,
    balloonCount: 35,
    label: 'High',
    description: 'Maximum celebration',
  },
};

export const COUNTDOWN_OPTIONS = [
  { value: 3, label: '3 seconds' },
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
];

export const BABY_COUNT_OPTIONS = [
  { value: 1, label: 'Single', icon: '👶' },
  { value: 2, label: 'Twins', icon: '👶👶' },
  { value: 3, label: 'Triplets', icon: '👶👶👶' },
];

// Skin tone modifiers
export const SKIN_TONES = [
  { id: 'default', modifier: '', label: 'Default' },
  { id: 'light', modifier: '🏻', label: 'Light' },
  { id: 'medium-light', modifier: '🏼', label: 'Medium Light' },
  { id: 'medium', modifier: '🏽', label: 'Medium' },
  { id: 'medium-dark', modifier: '🏾', label: 'Medium Dark' },
  { id: 'dark', modifier: '🏿', label: 'Dark' },
];

// Base emojis - human emojis support skin tones, objects/animals don't
export const EMOJI_OPTIONS = {
  boy: [
    { base: '👦', supportsSkinTone: true },
    { base: '👶', supportsSkinTone: true },
    { base: '🧒', supportsSkinTone: true },
    { base: '👼', supportsSkinTone: true },
    { base: '🤴', supportsSkinTone: true },
    { base: '🦁', supportsSkinTone: false },
    { base: '🚀', supportsSkinTone: false },
    { base: '⚽', supportsSkinTone: false },
  ],
  girl: [
    { base: '👧', supportsSkinTone: true },
    { base: '👶', supportsSkinTone: true },
    { base: '🧒', supportsSkinTone: true },
    { base: '👼', supportsSkinTone: true },
    { base: '👸', supportsSkinTone: true },
    { base: '🦋', supportsSkinTone: false },
    { base: '🌸', supportsSkinTone: false },
    { base: '🎀', supportsSkinTone: false },
  ],
};

// Helper to apply skin tone to emoji
export const applySkintone = (baseEmoji, skinToneModifier) => {
  if (!skinToneModifier) return baseEmoji;
  return baseEmoji + skinToneModifier;
};

export const DEFAULT_PREFERENCES = {
  theme: 'classic',
  countdownDuration: 5,
  animationIntensity: 'medium',
  soundEnabled: true,
  customMessage: '',
  boyEmoji: '👦',
  girlEmoji: '👧',
  skinTone: '',
  babyCount: 1,
  syncedReveal: false, // When true, all viewers see reveal simultaneously
};
