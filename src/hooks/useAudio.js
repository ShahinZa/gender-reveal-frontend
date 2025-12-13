import { useRef, useCallback } from 'react';

/**
 * Custom hook for audio effects with preloading support
 * Preload audio URLs early so playback starts instantly when needed
 */
const useAudio = () => {
  const drumrollRef = useRef(null);
  const celebrationRef = useRef(null);
  const drumrollTimerRef = useRef(null);

  // Track preloaded URLs to avoid duplicate loading
  const preloadedDrumrollUrl = useRef(null);
  const preloadedCelebrationUrl = useRef(null);

  /**
   * Preload drumroll audio for instant playback later
   * Call this early (e.g., when page loads with preferences)
   * @param {string|null} audioUrl - URL to preload (null uses default)
   */
  const preloadDrumroll = useCallback((audioUrl = null) => {
    const src = audioUrl || '/drumroll.mp3';

    // Skip if already preloaded with same URL
    if (preloadedDrumrollUrl.current === src && drumrollRef.current) {
      return;
    }

    try {
      // Clean up previous
      if (drumrollRef.current) {
        drumrollRef.current.pause();
        drumrollRef.current = null;
      }

      // Create and preload
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.8;
      audio.src = src;
      audio.load(); // Start loading immediately

      drumrollRef.current = audio;
      preloadedDrumrollUrl.current = src;
    } catch (error) {
      console.log('Audio preload not supported');
    }
  }, []);

  /**
   * Preload celebration audio for instant playback later
   * @param {string|null} audioUrl - URL to preload (null uses default)
   */
  const preloadCelebration = useCallback((audioUrl = null) => {
    const src = audioUrl || '/celebration.mp3';

    // Skip if already preloaded with same URL
    if (preloadedCelebrationUrl.current === src && celebrationRef.current) {
      return;
    }

    try {
      // Clean up previous
      if (celebrationRef.current) {
        celebrationRef.current.pause();
        celebrationRef.current = null;
      }

      // Create and preload
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.8;
      audio.src = src;
      audio.load(); // Start loading immediately

      celebrationRef.current = audio;
      preloadedCelebrationUrl.current = src;
    } catch (error) {
      console.log('Audio preload not supported');
    }
  }, []);

  /**
   * Play drumroll/countdown sound
   * @param {string|null} audioUrl - URL to play (uses preloaded if matches, otherwise loads new)
   * @param {number|null} durationSeconds - Optional duration in seconds (auto-stops after this)
   */
  const playDrumroll = useCallback((audioUrl = null, durationSeconds = null) => {
    try {
      // Clear any existing timer
      if (drumrollTimerRef.current) {
        clearTimeout(drumrollTimerRef.current);
        drumrollTimerRef.current = null;
      }

      const src = audioUrl || '/drumroll.mp3';

      // Check if we can reuse preloaded audio
      if (drumrollRef.current && preloadedDrumrollUrl.current === src) {
        // Reuse preloaded - just reset and play
        drumrollRef.current.currentTime = 0;
      } else {
        // Different URL or not preloaded - create new
        if (drumrollRef.current) {
          drumrollRef.current.pause();
        }
        drumrollRef.current = new Audio(src);
        drumrollRef.current.volume = 0.8;
        preloadedDrumrollUrl.current = src;
      }

      drumrollRef.current.play().catch(() => {
        console.log('Audio autoplay blocked');
      });

      // Auto-stop after countdown duration
      if (durationSeconds) {
        const stopAfterMs = durationSeconds * 1000;
        drumrollTimerRef.current = setTimeout(() => {
          if (drumrollRef.current) {
            drumrollRef.current.pause();
            drumrollRef.current = null;
            preloadedDrumrollUrl.current = null;
          }
        }, stopAfterMs);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  /**
   * Play celebration sound
   * @param {string|null} audioUrl - URL to play (uses preloaded if matches)
   */
  const playCelebration = useCallback((audioUrl = null) => {
    try {
      // Stop drumroll if playing
      if (drumrollRef.current) {
        drumrollRef.current.pause();
        drumrollRef.current = null;
        preloadedDrumrollUrl.current = null;
      }

      const src = audioUrl || '/celebration.mp3';

      // Check if we can reuse preloaded audio
      if (celebrationRef.current && preloadedCelebrationUrl.current === src) {
        // Reuse preloaded - just reset and play
        celebrationRef.current.currentTime = 0;
      } else {
        // Different URL or not preloaded - create new
        if (celebrationRef.current) {
          celebrationRef.current.pause();
        }
        celebrationRef.current = new Audio(src);
        celebrationRef.current.volume = 0.8;
        preloadedCelebrationUrl.current = src;
      }

      celebrationRef.current.play().catch(() => {
        console.log('Audio autoplay blocked');
      });
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const stopAudio = useCallback(() => {
    // Clear drumroll timer
    if (drumrollTimerRef.current) {
      clearTimeout(drumrollTimerRef.current);
      drumrollTimerRef.current = null;
    }
    if (drumrollRef.current) {
      drumrollRef.current.pause();
      drumrollRef.current.currentTime = 0;
      drumrollRef.current = null;
      preloadedDrumrollUrl.current = null;
    }
    if (celebrationRef.current) {
      celebrationRef.current.pause();
      celebrationRef.current.currentTime = 0;
      celebrationRef.current = null;
      preloadedCelebrationUrl.current = null;
    }
  }, []);

  return {
    preloadDrumroll,
    preloadCelebration,
    playDrumroll,
    playCelebration,
    stopAudio,
  };
};

export default useAudio;
