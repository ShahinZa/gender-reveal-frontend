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

  const playCelebration = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();

      // Party popper / explosion sound
      const createPop = (time, pitch = 1) => {
        // Noise burst for pop
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000 * pitch;
        noiseFilter.Q.value = 0.5;

        noiseGain.gain.setValueAtTime(0.4, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(time);

        // Tonal pop
        const pop = ctx.createOscillator();
        const popGain = ctx.createGain();
        pop.type = 'sine';
        pop.frequency.setValueAtTime(600 * pitch, time);
        pop.frequency.exponentialRampToValueAtTime(100, time + 0.1);
        popGain.gain.setValueAtTime(0.3, time);
        popGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        pop.connect(popGain);
        popGain.connect(ctx.destination);
        pop.start(time);
        pop.stop(time + 0.1);
      };

      // Fanfare / celebration melody
      const playFanfare = (startTime) => {
        const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
        const durations = [0.15, 0.15, 0.15, 0.3, 0.15, 0.4];

        let time = startTime;
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'square';
          osc.frequency.value = freq;
          osc2.type = 'sine';
          osc2.frequency.value = freq;

          gain.gain.setValueAtTime(0.15, time);
          gain.gain.setValueAtTime(0.15, time + durations[i] * 0.8);
          gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);

          osc.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc.start(time);
          osc2.start(time);
          osc.stop(time + durations[i]);
          osc2.stop(time + durations[i]);

          time += durations[i];
        });
      };

      // Sparkle / twinkle sounds
      const playSparkles = (startTime) => {
        for (let i = 0; i < 15; i++) {
          const time = startTime + i * 0.1 + Math.random() * 0.05;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(2000 + Math.random() * 2000, time);
          osc.frequency.exponentialRampToValueAtTime(1000 + Math.random() * 1000, time + 0.1);

          gain.gain.setValueAtTime(0.08, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + 0.15);
        }
      };

      // Cheering crowd simulation
      const playCrowd = (startTime) => {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          const envelope = Math.sin(Math.PI * i / bufferSize);
          data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
        }

        const crowd = ctx.createBufferSource();
        crowd.buffer = buffer;

        const crowdFilter = ctx.createBiquadFilter();
        crowdFilter.type = 'bandpass';
        crowdFilter.frequency.value = 800;
        crowdFilter.Q.value = 0.3;

        const crowdGain = ctx.createGain();
        crowdGain.gain.setValueAtTime(0.2, startTime);
        crowdGain.gain.linearRampToValueAtTime(0.3, startTime + 0.5);
        crowdGain.gain.linearRampToValueAtTime(0.1, startTime + 1.5);
        crowdGain.gain.exponentialRampToValueAtTime(0.01, startTime + 2);

        crowd.connect(crowdFilter);
        crowdFilter.connect(crowdGain);
        crowdGain.connect(ctx.destination);
        crowd.start(startTime);
      };

      const now = ctx.currentTime;

      // Multiple pops at different times
      createPop(now, 1);
      createPop(now + 0.1, 1.2);
      createPop(now + 0.2, 0.8);
      createPop(now + 0.35, 1.1);

      // Fanfare after pops
      playFanfare(now + 0.3);

      // Sparkles throughout
      playSparkles(now + 0.2);

      // Crowd cheering
      playCrowd(now + 0.1);

      // Close context after sounds finish
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 3000);

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
