import { useRef, useCallback, useState } from 'react';

// Global state (persists across renders and component instances)
let audioContext = null;
let audioUnlocked = false;

// Global preload tracking - prevents ALL duplicate calls
const preloadState = {
  drumroll: { url: null, done: false },
  celebration: { url: null, done: false },
};

const useAudio = () => {
  const drumrollRef = useRef(null);
  const celebrationRef = useRef(null);
  const drumrollTimerRef = useRef(null);

  const [drumrollStatus, setDrumrollStatus] = useState('idle');
  const [celebrationStatus, setCelebrationStatus] = useState('idle');
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(audioUnlocked);

  const unlockAudio = useCallback(() => {
    if (audioUnlocked) return true;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume();

      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);

      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
      silentAudio.volume = 0;
      silentAudio.play().catch(() => {});

      audioUnlocked = true;
      setIsAudioUnlocked(true);
      console.log('Audio unlocked successfully');
      return true;
    } catch (error) {
      console.log('Audio unlock failed:', error.message);
      return false;
    }
  }, []);

  const preloadDrumroll = useCallback(async (audioUrl) => {
    if (!audioUrl) return;

    // Global duplicate check - once done for a URL, never retry
    if (preloadState.drumroll.done && preloadState.drumroll.url === audioUrl) {
      return;
    }

    // Mark as done IMMEDIATELY to prevent any concurrent calls
    preloadState.drumroll.url = audioUrl;
    preloadState.drumroll.done = true;

    console.log('Preloading drumroll:', audioUrl);
    setDrumrollStatus('loading');

    try {
      const response = await fetch(audioUrl);
      console.log('Drumroll response:', response.status, response.headers.get('content-type'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('audio')) {
        throw new Error(`Invalid type: ${contentType}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Empty response');

      const blobUrl = URL.createObjectURL(blob);
      const audio = new Audio();
      audio.volume = 0.8;
      audio.src = blobUrl;

      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', () => reject(new Error('Decode failed')), { once: true });
        audio.load();
      });

      drumrollRef.current = audio;
      setDrumrollStatus('ready');
    } catch (error) {
      console.log('Drumroll preload failed:', error.message);
      setDrumrollStatus('error');
    }
  }, []);

  const preloadCelebration = useCallback(async (audioUrl) => {
    if (!audioUrl) return;

    // Global duplicate check - once done for a URL, never retry
    if (preloadState.celebration.done && preloadState.celebration.url === audioUrl) {
      return;
    }

    // Mark as done IMMEDIATELY to prevent any concurrent calls
    preloadState.celebration.url = audioUrl;
    preloadState.celebration.done = true;

    console.log('Preloading celebration:', audioUrl);
    setCelebrationStatus('loading');

    try {
      const response = await fetch(audioUrl);
      console.log('Celebration response:', response.status, response.headers.get('content-type'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('audio')) {
        throw new Error(`Invalid type: ${contentType}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Empty response');

      const blobUrl = URL.createObjectURL(blob);
      const audio = new Audio();
      audio.volume = 0.8;
      audio.src = blobUrl;

      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', () => reject(new Error('Decode failed')), { once: true });
        audio.load();
      });

      celebrationRef.current = audio;
      setCelebrationStatus('ready');
    } catch (error) {
      console.log('Celebration preload failed:', error.message);
      setCelebrationStatus('error');
    }
  }, []);

  const playDrumroll = useCallback((audioUrl, durationSeconds = null) => {
    try {
      if (drumrollTimerRef.current) {
        clearTimeout(drumrollTimerRef.current);
        drumrollTimerRef.current = null;
      }

      if (!drumrollRef.current) {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.volume = 0.8;
        audio.src = audioUrl || '/drumroll.mp3';
        drumrollRef.current = audio;
      }

      drumrollRef.current.currentTime = 0;

      if (!audioUnlocked) {
        console.log('Audio play skipped: not unlocked');
        return;
      }

      drumrollRef.current.play().catch((err) => {
        console.log('Audio play failed:', err.message);
      });

      if (durationSeconds) {
        drumrollTimerRef.current = setTimeout(() => {
          if (drumrollRef.current) drumrollRef.current.pause();
        }, durationSeconds * 1000);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const playCelebration = useCallback((audioUrl) => {
    try {
      if (drumrollRef.current) drumrollRef.current.pause();

      if (!celebrationRef.current) {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.volume = 0.8;
        audio.src = audioUrl || '/celebration.mp3';
        celebrationRef.current = audio;
      }

      celebrationRef.current.currentTime = 0;

      if (!audioUnlocked) {
        console.log('Celebration play skipped: not unlocked');
        return;
      }

      celebrationRef.current.play().catch((err) => {
        console.log('Celebration play failed:', err.message);
      });
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (drumrollTimerRef.current) {
      clearTimeout(drumrollTimerRef.current);
      drumrollTimerRef.current = null;
    }
    if (drumrollRef.current) {
      drumrollRef.current.pause();
      drumrollRef.current.currentTime = 0;
    }
    if (celebrationRef.current) {
      celebrationRef.current.pause();
      celebrationRef.current.currentTime = 0;
    }
  }, []);

  const getAudioStatus = useCallback(() => {
    if (drumrollStatus === 'idle' && celebrationStatus === 'idle') return 'idle';
    if (drumrollStatus === 'loading' || celebrationStatus === 'loading') return 'loading';
    return 'ready';
  }, [drumrollStatus, celebrationStatus]);

  return {
    unlockAudio,
    isAudioUnlocked,
    preloadDrumroll,
    preloadCelebration,
    playDrumroll,
    playCelebration,
    stopAudio,
    audioStatus: getAudioStatus(),
    drumrollStatus,
    celebrationStatus,
  };
};

export default useAudio;
