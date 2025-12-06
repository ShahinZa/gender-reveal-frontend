import { useRef, useCallback } from 'react';

/**
 * Custom hook for audio effects
 * Provides drumroll and cleanup functionality
 */
const useAudio = () => {
  const audioContextRef = useRef(null);

  const playDrumroll = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;

      const playBeat = (time, volume) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.15);
      };

      const startTime = ctx.currentTime;
      for (let i = 0; i < 60; i++) {
        playBeat(startTime + i * 0.08, 0.1 + (i / 60) * 0.3);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  return {
    playDrumroll,
    stopAudio,
  };
};

export default useAudio;
