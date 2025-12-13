import { useRef, useCallback, useState } from 'react';

/**
 * Custom hook for audio effects with preloading support
 * Preload audio URLs early so playback starts instantly when needed
 * Exposes loading status for UI indicators
 */
const useAudio = () => {
  const drumrollRef = useRef(null);
  const celebrationRef = useRef(null);
  const drumrollTimerRef = useRef(null);

  // Track preloaded URLs to avoid duplicate loading
  const preloadedDrumrollUrl = useRef(null);
  const preloadedCelebrationUrl = useRef(null);

  // Track loading status for UI indicator
  const [drumrollStatus, setDrumrollStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'
  const [celebrationStatus, setCelebrationStatus] = useState('idle');

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

      setDrumrollStatus('loading');

      // Create and preload
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.8;

      // Track when ready to play
      audio.addEventListener('canplaythrough', () => {
        setDrumrollStatus('ready');
      }, { once: true });

      audio.addEventListener('error', () => {
        setDrumrollStatus('error');
      }, { once: true });

      audio.src = src;
      audio.load(); // Start loading immediately

      drumrollRef.current = audio;
      preloadedDrumrollUrl.current = src;
    } catch (error) {
      console.log('Audio preload not supported');
      setDrumrollStatus('error');
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

      setCelebrationStatus('loading');

      // Create and preload
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.8;

      // Track when ready to play
      audio.addEventListener('canplaythrough', () => {
        setCelebrationStatus('ready');
      }, { once: true });

      audio.addEventListener('error', () => {
        setCelebrationStatus('error');
      }, { once: true });

      audio.src = src;
      audio.load(); // Start loading immediately

      celebrationRef.current = audio;
      preloadedCelebrationUrl.current = src;
    } catch (error) {
      console.log('Audio preload not supported');
      setCelebrationStatus('error');
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

  // Computed status for UI indicator
  // 'idle' = no audio to load, 'loading' = fetching, 'ready' = all ready, 'error' = failed
  const getAudioStatus = useCallback(() => {
    // If both are idle, no custom audio is being loaded
    if (drumrollStatus === 'idle' && celebrationStatus === 'idle') {
      return 'idle';
    }
    // If any is loading, show loading
    if (drumrollStatus === 'loading' || celebrationStatus === 'loading') {
      return 'loading';
    }
    // If all non-idle are ready (or error which we treat as ready - will fallback)
    return 'ready';
  }, [drumrollStatus, celebrationStatus]);

  return {
    preloadDrumroll,
    preloadCelebration,
    playDrumroll,
    playCelebration,
    stopAudio,
    // Audio status for UI indicator
    audioStatus: getAudioStatus(),
    drumrollStatus,
    celebrationStatus,
  };
};

export default useAudio;
