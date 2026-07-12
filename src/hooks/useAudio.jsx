import { useRef, useCallback, useState } from 'react';

// Global state (persists across renders and component instances)
let audioContext = null;
let audioUnlocked = false;

// Global preload tracking - tracks current target URL and completion
const preloadState = {
  drumroll: { url: null, targetUrl: null, done: false },
  celebration: { url: null, targetUrl: null, done: false },
};

/**
 * Get auth token for API requests
 */
const getAuthToken = () => localStorage.getItem('token');

/**
 * Fetch audio with auth header for API URLs
 * Custom audio from /api/audio/{code}/{type} requires auth token
 */
const fetchAudio = async (url) => {
  const isApiUrl = url.includes('/api/');
  const token = getAuthToken();

  const headers = {};
  if (isApiUrl && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, { headers });
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

  const ensureElement = useCallback((ref, fallbackSrc) => {
    if (!ref.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.volume = 0.8;
      audio.src = fallbackSrc;
      ref.current = audio;
    }
    return ref.current;
  }, []);

  // Mobile browsers only allow play() calls that trace back to a user
  // gesture, and the reveal plays audio from timer/socket callbacks.
  // Call this from inside a tap handler: a muted play/pause blesses the
  // real elements so the later audible play() is allowed.
  const primeAudioPlayback = useCallback((countdownUrl, celebrationUrl) => {
    [
      [drumrollRef, countdownUrl || '/drumroll.mp3'],
      [celebrationRef, celebrationUrl || '/celebration.mp3'],
    ].forEach(([ref, src]) => {
      try {
        const el = ensureElement(ref, src);
        if (el.dataset.primed === 'true') return;
        el.muted = true;
        const p = el.play();
        if (p && p.then) {
          p.then(() => {
            el.pause();
            el.currentTime = 0;
            el.muted = false;
            el.dataset.primed = 'true';
          }).catch(() => {
            el.muted = false;
          });
        }
      } catch {
        // Audio not supported
      }
    });
  }, [ensureElement]);

  const preloadDrumroll = useCallback(async (audioUrl) => {
    if (!audioUrl) return;

    // If this exact URL is already loaded successfully, skip
    if (preloadState.drumroll.done && preloadState.drumroll.url === audioUrl) {
      console.log('Drumroll already loaded for URL:', audioUrl);
      return;
    }

    // Update target URL - this is what we WANT to have loaded
    // If a different URL was loading, this new URL takes priority
    preloadState.drumroll.targetUrl = audioUrl;

    console.log('Preloading drumroll:', audioUrl);
    setDrumrollStatus('loading');

    try {
      const response = await fetchAudio(audioUrl);
      console.log('Drumroll response:', response.status, response.headers.get('content-type'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('audio')) {
        throw new Error(`Invalid type: ${contentType}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Empty response');

      // Check if this URL is still the target (not superseded by a newer request)
      if (preloadState.drumroll.targetUrl !== audioUrl) {
        console.log('Drumroll preload superseded by newer request, discarding:', audioUrl);
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      // Reuse the existing element: replacing it would lose the
      // user-gesture blessing granted by primeAudioPlayback on mobile
      const audio = drumrollRef.current || new Audio();
      audio.volume = 0.8;
      audio.src = blobUrl;

      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', () => reject(new Error('Decode failed')), { once: true });
        audio.load();
      });

      // Double-check target URL hasn't changed during audio load
      if (preloadState.drumroll.targetUrl !== audioUrl) {
        console.log('Drumroll preload superseded during load, discarding:', audioUrl);
        URL.revokeObjectURL(blobUrl);
        return;
      }

      drumrollRef.current = audio;
      preloadState.drumroll.url = audioUrl;
      preloadState.drumroll.done = true;
      setDrumrollStatus('ready');
      console.log('Drumroll preload complete:', audioUrl);
    } catch (error) {
      console.log('Drumroll preload failed:', error.message);
      // Only set error if this is still the target URL
      if (preloadState.drumroll.targetUrl === audioUrl) {
        setDrumrollStatus('error');
      }
    }
  }, []);

  const preloadCelebration = useCallback(async (audioUrl) => {
    if (!audioUrl) return;

    // If this exact URL is already loaded successfully, skip
    if (preloadState.celebration.done && preloadState.celebration.url === audioUrl) {
      console.log('Celebration already loaded for URL:', audioUrl);
      return;
    }

    // Update target URL - this is what we WANT to have loaded
    // If a different URL was loading, this new URL takes priority
    preloadState.celebration.targetUrl = audioUrl;

    console.log('Preloading celebration:', audioUrl);
    setCelebrationStatus('loading');

    try {
      const response = await fetchAudio(audioUrl);
      console.log('Celebration response:', response.status, response.headers.get('content-type'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('audio')) {
        throw new Error(`Invalid type: ${contentType}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Empty response');

      // Check if this URL is still the target (not superseded by a newer request)
      if (preloadState.celebration.targetUrl !== audioUrl) {
        console.log('Celebration preload superseded by newer request, discarding:', audioUrl);
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      // Reuse the existing element: replacing it would lose the
      // user-gesture blessing granted by primeAudioPlayback on mobile
      const audio = celebrationRef.current || new Audio();
      audio.volume = 0.8;
      audio.src = blobUrl;

      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', () => reject(new Error('Decode failed')), { once: true });
        audio.load();
      });

      // Double-check target URL hasn't changed during audio load
      if (preloadState.celebration.targetUrl !== audioUrl) {
        console.log('Celebration preload superseded during load, discarding:', audioUrl);
        URL.revokeObjectURL(blobUrl);
        return;
      }

      celebrationRef.current = audio;
      preloadState.celebration.url = audioUrl;
      preloadState.celebration.done = true;
      setCelebrationStatus('ready');
      console.log('Celebration preload complete:', audioUrl);
    } catch (error) {
      console.log('Celebration preload failed:', error.message);
      // Only set error if this is still the target URL
      if (preloadState.celebration.targetUrl === audioUrl) {
        setCelebrationStatus('error');
      }
    }
  }, []);

  const playDrumroll = useCallback((audioUrl, durationSeconds = null) => {
    try {
      if (drumrollTimerRef.current) {
        clearTimeout(drumrollTimerRef.current);
        drumrollTimerRef.current = null;
      }

      ensureElement(drumrollRef, audioUrl || '/drumroll.mp3');

      drumrollRef.current.currentTime = 0;

      if (!audioUnlocked) {
        console.log('Audio play skipped: not unlocked');
        return;
      }

      drumrollRef.current.play().catch((err) => {
        console.log('Audio play failed, retrying:', err.message);
        setTimeout(() => {
          drumrollRef.current?.play().catch((e) => console.log('Audio retry failed:', e.message));
        }, 150);
      });

      if (durationSeconds) {
        drumrollTimerRef.current = setTimeout(() => {
          if (drumrollRef.current) drumrollRef.current.pause();
        }, durationSeconds * 1000);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  }, [ensureElement]);

  const playCelebration = useCallback((audioUrl) => {
    try {
      if (drumrollRef.current) drumrollRef.current.pause();

      ensureElement(celebrationRef, audioUrl || '/celebration.mp3');

      celebrationRef.current.currentTime = 0;

      if (!audioUnlocked) {
        console.log('Celebration play skipped: not unlocked');
        return;
      }

      celebrationRef.current.play().catch((err) => {
        console.log('Celebration play failed, retrying:', err.message);
        setTimeout(() => {
          celebrationRef.current?.play().catch((e) => console.log('Celebration retry failed:', e.message));
        }, 150);
      });
    } catch (error) {
      console.log('Audio not supported');
    }
  }, [ensureElement]);

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
    primeAudioPlayback,
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
