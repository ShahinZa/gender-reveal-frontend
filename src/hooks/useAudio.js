import { useRef, useCallback } from 'react';

/**
 * Custom hook for audio effects
 * Uses real MP3 files for drumroll and celebration sounds
 */
const useAudio = () => {
  const drumrollRef = useRef(null);
  const celebrationRef = useRef(null);

  const playDrumroll = useCallback(() => {
    try {
      // Stop any existing audio
      if (drumrollRef.current) {
        drumrollRef.current.pause();
        drumrollRef.current.currentTime = 0;
      }

      // Play drumroll MP3
      drumrollRef.current = new Audio('/drumroll.mp3');
      drumrollRef.current.volume = 0.8;
      drumrollRef.current.play().catch(() => {
        console.log('Audio autoplay blocked');
      });
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const stopAudio = useCallback(() => {
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

  const playCelebration = useCallback(() => {
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

      // Play celebration MP3
      celebrationRef.current = new Audio('/celebration.mp3');
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
