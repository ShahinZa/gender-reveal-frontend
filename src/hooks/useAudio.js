import { useRef, useCallback } from 'react';

/**
 * Custom hook for audio effects
 * Supports custom audio data (base64) or defaults to built-in MP3 files
 */
const useAudio = () => {
  const drumrollRef = useRef(null);
  const celebrationRef = useRef(null);
  const drumrollTimerRef = useRef(null);

  /**
   * Play drumroll/countdown sound
   * @param {string|null} customAudioData - Optional base64 encoded audio data
   * @param {number|null} durationSeconds - Optional duration in seconds (auto-stops after this)
   */
  const playDrumroll = useCallback((customAudioData = null, durationSeconds = null) => {
    try {
      // Clear any existing timer
      if (drumrollTimerRef.current) {
        clearTimeout(drumrollTimerRef.current);
        drumrollTimerRef.current = null;
      }

      // Stop any existing audio
      if (drumrollRef.current) {
        drumrollRef.current.pause();
        drumrollRef.current.currentTime = 0;
      }

      // Use custom audio if provided, otherwise default
      const audioSrc = customAudioData || '/drumroll.mp3';
      drumrollRef.current = new Audio(audioSrc);
      drumrollRef.current.volume = 0.8;
      drumrollRef.current.play().catch(() => {
        console.log('Audio autoplay blocked');
      });

      // Auto-stop after countdown duration (matches when celebration starts)
      if (durationSeconds) {
        const stopAfterMs = durationSeconds * 1000;
        drumrollTimerRef.current = setTimeout(() => {
          if (drumrollRef.current) {
            drumrollRef.current.pause();
            drumrollRef.current = null;
          }
        }, stopAfterMs);
      }
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
    }
    if (celebrationRef.current) {
      celebrationRef.current.pause();
      celebrationRef.current.currentTime = 0;
      celebrationRef.current = null;
    }
  }, []);

  /**
   * Play celebration sound
   * @param {string|null} customAudioData - Optional base64 encoded audio data
   */
  const playCelebration = useCallback((customAudioData = null) => {
    try {
      // Stop drumroll if playing
      if (drumrollRef.current) {
        drumrollRef.current.pause();
        drumrollRef.current = null;
      }

      // Stop any existing celebration audio
      if (celebrationRef.current) {
        celebrationRef.current.pause();
        celebrationRef.current.currentTime = 0;
      }

      // Use custom audio if provided, otherwise default
      const audioSrc = customAudioData || '/celebration.mp3';
      celebrationRef.current = new Audio(audioSrc);
      celebrationRef.current.volume = 0.8;
      celebrationRef.current.play().catch(() => {
        console.log('Audio autoplay blocked');
      });
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  return {
    playDrumroll,
    playCelebration,
    stopAudio,
  };
};

export default useAudio;
