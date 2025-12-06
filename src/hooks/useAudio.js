import { useRef, useCallback } from 'react';

/**
 * Custom hook for audio effects
 * Creates exciting, happy countdown with celebration vibes
 */
const useAudio = () => {
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);

  const playDrumroll = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;

      // Happy major chord frequencies (C major: C, E, G)
      const chordFreqs = [261.63, 329.63, 392.00, 523.25];

      // Play exciting arpeggio pattern
      let noteIndex = 0;
      const totalNotes = 25;

      const playNote = () => {
        if (!audioContextRef.current || noteIndex >= totalNotes) return;

        const now = ctx.currentTime;
        const progress = noteIndex / totalNotes;
        const freq = chordFreqs[noteIndex % chordFreqs.length] * (1 + progress * 0.5);

        // Bright, happy bell-like tone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.value = freq;
        osc2.type = 'triangle';
        osc2.frequency.value = freq * 2;

        gain.gain.setValueAtTime(0.25 + progress * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);

        // Add sparkle sounds
        if (noteIndex % 3 === 0) {
          const sparkle = ctx.createOscillator();
          const sparkleGain = ctx.createGain();
          sparkle.type = 'sine';
          sparkle.frequency.setValueAtTime(1200 + Math.random() * 800, now);
          sparkle.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
          sparkleGain.gain.setValueAtTime(0.1, now);
          sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          sparkle.connect(sparkleGain);
          sparkleGain.connect(ctx.destination);
          sparkle.start(now);
          sparkle.stop(now + 0.15);
        }

        // Fun percussion
        const perc = ctx.createOscillator();
        const percGain = ctx.createGain();
        perc.type = 'square';
        perc.frequency.setValueAtTime(800, now);
        perc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        percGain.gain.setValueAtTime(0.1, now);
        percGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        perc.connect(percGain);
        percGain.connect(ctx.destination);
        perc.start(now);
        perc.stop(now + 0.08);

        noteIndex++;

        // Speed up as excitement builds
        const nextInterval = Math.max(100, 250 - progress * 180);
        intervalRef.current = setTimeout(playNote, nextInterval);
      };

      playNote();

      // Grand finale flourish
      setTimeout(() => {
        if (!audioContextRef.current) return;
        const now = ctx.currentTime;

        // Rising celebration sweep
        [0, 0.1, 0.2, 0.3].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400 + i * 150, now + delay);
          osc.frequency.exponentialRampToValueAtTime(800 + i * 200, now + delay + 0.4);
          gain.gain.setValueAtTime(0.2, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.5);
        });

        // Triumphant chord
        setTimeout(() => {
          if (!audioContextRef.current) return;
          const t = ctx.currentTime;
          [523.25, 659.25, 783.99, 1046.50].forEach((f) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.8);
          });
        }, 400);

      }, 4200);

    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
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
