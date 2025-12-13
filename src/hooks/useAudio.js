import { useRef, useCallback, useState } from 'react';

// Global audio context for unlocking audio playback
let audioContext = null;
let audioUnlocked = false;

/**
 * Custom hook for audio effects with preloading support
 * Preload audio URLs early so playback starts instantly when needed
 * Exposes loading status for UI indicators
 * Handles browser autoplay policy by tracking user interaction
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
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(audioUnlocked);

  /**
   * Unlock audio playback - must be called from a user gesture (click/tap)
   * This creates an AudioContext and plays a silent buffer to unlock browser audio
   * @returns {boolean} true if unlock succeeded
   */
  const unlockAudio = useCallback(() => {
    if (audioUnlocked) {
      console.log('Audio already unlocked');
      return true;
    }

    try {
      // Create AudioContext if needed
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioContext) {
        audioContext = new AudioContextClass();
      }

      // Resume if suspended (required for some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Create and play a silent buffer to fully unlock audio
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);

      // Also play a silent HTML5 Audio element to unlock that path too
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
      silentAudio.volume = 0;
      silentAudio.play().catch(() => {
        // Ignore errors - the AudioContext approach is the primary unlock
      });

      audioUnlocked = true;
      setIsAudioUnlocked(true);
      console.log('Audio unlocked successfully');
      return true;
    } catch (error) {
      console.log('Audio unlock failed:', error.message);
      return false;
    }
  }, []);

  /**
   * Preload drumroll audio for instant playback later
   * Call this early (e.g., when page loads with preferences)
   * @param {string|null} audioUrl - URL to preload (null uses default)
   */
  const preloadDrumroll = useCallback((audioUrl = null) => {
    const src = audioUrl || '/drumroll.mp3';

    // Skip if already preloaded with same URL (and not in error state)
    if (preloadedDrumrollUrl.current === src && drumrollRef.current) {
      return;
    }

    // Skip if already tried and failed with this URL
    if (preloadedDrumrollUrl.current === src && drumrollStatus === 'error') {
      return;
    }

    try {
      // Clean up previous
      if (drumrollRef.current) {
        drumrollRef.current.pause();
        drumrollRef.current.src = ''; // Stop any pending requests
        drumrollRef.current = null;
      }

      setDrumrollStatus('loading');

      // Create and preload
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.8;
      audio.crossOrigin = 'anonymous';

      // Track when ready to play
      audio.addEventListener('canplaythrough', () => {
        setDrumrollStatus('ready');
      }, { once: true });

      // On error, clean up to prevent retry loops
      audio.addEventListener('error', (e) => {
        console.log('Drumroll preload error:', e.target?.error?.message || 'unknown');
        audio.src = ''; // Prevent browser retry
        drumrollRef.current = null;
        setDrumrollStatus('error');
      }, { once: true });

      audio.src = src;
      audio.load();

      drumrollRef.current = audio;
      preloadedDrumrollUrl.current = src;
    } catch (error) {
      console.log('Audio preload not supported:', error.message);
      setDrumrollStatus('error');
    }
  }, [drumrollStatus]);

  /**
   * Preload celebration audio for instant playback later
   * @param {string|null} audioUrl - URL to preload (null uses default)
   */
  const preloadCelebration = useCallback((audioUrl = null) => {
    const src = audioUrl || '/celebration.mp3';

    // Skip if already preloaded with same URL (and not in error state)
    if (preloadedCelebrationUrl.current === src && celebrationRef.current) {
      return;
    }

    // Skip if already tried and failed with this URL
    if (preloadedCelebrationUrl.current === src && celebrationStatus === 'error') {
      return;
    }

    try {
      // Clean up previous
      if (celebrationRef.current) {
        celebrationRef.current.pause();
        celebrationRef.current.src = ''; // Stop any pending requests
        celebrationRef.current = null;
      }

      setCelebrationStatus('loading');

      // Create and preload
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.8;
      audio.crossOrigin = 'anonymous';

      // Track when ready to play
      audio.addEventListener('canplaythrough', () => {
        setCelebrationStatus('ready');
      }, { once: true });

      // On error, clean up to prevent retry loops
      audio.addEventListener('error', (e) => {
        console.log('Celebration preload error:', e.target?.error?.message || 'unknown');
        audio.src = ''; // Prevent browser retry
        celebrationRef.current = null;
        setCelebrationStatus('error');
      }, { once: true });

      audio.src = src;
      audio.load();

      celebrationRef.current = audio;
      preloadedCelebrationUrl.current = src;
    } catch (error) {
      console.log('Audio preload not supported:', error.message);
      setCelebrationStatus('error');
    }
  }, [celebrationStatus]);

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

      // Check if we can reuse preloaded audio (must be ready to play: readyState >= 3)
      if (drumrollRef.current && preloadedDrumrollUrl.current === src && drumrollRef.current.readyState >= 3) {
        // Reuse preloaded - just reset and play
        drumrollRef.current.currentTime = 0;
      } else {
        // Different URL, not preloaded, or not ready - create new
        if (drumrollRef.current) {
          drumrollRef.current.pause();
        }
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.volume = 0.8;
        audio.src = src;
        drumrollRef.current = audio;
        preloadedDrumrollUrl.current = src;
      }

      // Only attempt playback if audio has been unlocked
      if (!audioUnlocked) {
        console.log('Audio play skipped: audio not unlocked (call unlockAudio first)');
        return;
      }

      drumrollRef.current.play().catch((err) => {
        console.log('Audio play failed:', err.message);
        // Don't retry - if it failed, it failed
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

      // Check if we can reuse preloaded audio (must be ready to play: readyState >= 3)
      if (celebrationRef.current && preloadedCelebrationUrl.current === src && celebrationRef.current.readyState >= 3) {
        // Reuse preloaded - just reset and play
        celebrationRef.current.currentTime = 0;
      } else {
        // Different URL, not preloaded, or not ready - create new
        if (celebrationRef.current) {
          celebrationRef.current.pause();
        }
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.volume = 0.8;
        audio.src = src;
        celebrationRef.current = audio;
        preloadedCelebrationUrl.current = src;
      }

      // Only attempt playback if audio has been unlocked
      if (!audioUnlocked) {
        console.log('Celebration play skipped: audio not unlocked (call unlockAudio first)');
        return;
      }

      celebrationRef.current.play().catch((err) => {
        console.log('Celebration play failed:', err.message);
        // Don't retry - if it failed, it failed
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
    // Audio unlock (must be called from user gesture before playback works)
    unlockAudio,
    isAudioUnlocked,
    // Preload functions
    preloadDrumroll,
    preloadCelebration,
    // Playback functions
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
