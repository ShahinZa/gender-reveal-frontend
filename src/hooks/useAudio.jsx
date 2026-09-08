import { useRef, useCallback, useEffect, useState } from 'react';

// Keep media elements per page. Sharing preload flags across pages skipped
// loading audio into the new page's elements, especially after a preview.
export default function useAudio() {
  const elements = useRef({});
  const unlocked = useRef(false);
  const timers = useRef(new Set());
  const context = useRef(null);
  const [isAudioUnlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState({ countdown: 'idle', celebration: 'idle' });

  const ensure = useCallback((type, url) => {
    const src = url || (type === 'countdown' ? '/drumroll.mp3' : '/celebration.mp3');
    let audio = elements.current[type];
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.8;
      elements.current[type] = audio;
      audio.addEventListener('canplay', () => elements.current[type] === audio && setStatus(prev => ({ ...prev, [type]: audio.dataset.fallback === 'true' ? 'fallback' : 'ready' })));
      audio.addEventListener('error', () => {
        if (elements.current[type] !== audio) return;
        const fallback = type === 'countdown' ? '/drumroll.mp3' : '/celebration.mp3';
        if (audio.dataset.source !== fallback && audio.dataset.fallback !== 'true') {
          audio.dataset.fallback = 'true';
          audio.src = fallback;
          audio.load();
          if (audio.dataset.playing === 'true') audio.play().catch(() => setStatus(prev => ({ ...prev, [type]: 'error' })));
        } else setStatus(prev => ({ ...prev, [type]: 'error' }));
      });
    }
    if (audio.dataset.source !== src) {
      audio.dataset.source = src;
      audio.dataset.fallback = 'false';
      audio.src = src;
      setStatus(prev => ({ ...prev, [type]: 'loading' }));
      audio.load();
    }
    return audio;
  }, []);

  const unlockAudio = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        context.current ||= new AudioContextClass();
        context.current.resume().catch(() => {});
      }
      unlocked.current = true;
      setUnlocked(true);
      return true;
    } catch { return false; }
  }, []);

  // Prime the actual elements on a gesture, before any request or timer.
  const primeAudioPlayback = useCallback((countdownUrl, celebrationUrl) => {
    for (const [type, url] of [['countdown', countdownUrl], ['celebration', celebrationUrl]]) {
      const audio = ensure(type, url);
      if (audio.dataset.primed === 'true' || audio.dataset.playing === 'true') continue;
      audio.muted = true;
      audio.play().then(() => {
        // A slow play promise must not pause the real countdown that started
        // while priming was pending.
        if (audio.dataset.playing !== 'true') { audio.pause(); audio.currentTime = 0; }
        audio.muted = false;
        audio.dataset.primed = 'true';
      }).catch(() => { audio.muted = false; });
    }
  }, [ensure]);

  const play = useCallback((type, url, duration) => {
    const audio = ensure(type, url);
    audio.dataset.playing = 'true';
    audio.muted = false;
    audio.currentTime = 0;
    if (type === 'countdown') {
      // Fit the built-in drumroll to 3/5/10 seconds. Custom songs retain their
      // speed and loop until the countdown ends.
      const adjustRate = () => {
        audio.playbackRate = audio.dataset.source === '/drumroll.mp3' && duration && Number.isFinite(audio.duration) ? Math.min(4, Math.max(0.25, audio.duration / duration)) : 1;
      };
      adjustRate();
      audio.addEventListener('loadedmetadata', adjustRate, { once: true });
      audio.loop = true;
    }
    if (!unlocked.current) return;
    audio.play().catch(() => setStatus(prev => ({ ...prev, [type]: 'error' })));
    if (duration) {
      const timer = setTimeout(() => { audio.pause(); audio.dataset.playing = 'false'; timers.current.delete(timer); }, duration * 1000 + 100);
      timers.current.add(timer);
    }
  }, [ensure]);
  const playDrumroll = useCallback((url, duration) => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current.clear();
    play('countdown', url, duration);
  }, [play]);
  const playCelebration = useCallback(url => {
    if (elements.current.countdown) { elements.current.countdown.pause(); elements.current.countdown.dataset.playing = 'false'; }
    play('celebration', url);
  }, [play]);
  const stopAudio = useCallback(() => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current.clear();
    for (const audio of Object.values(elements.current)) { audio.dataset.playing = 'false'; audio.pause(); audio.currentTime = 0; }
  }, []);
  useEffect(() => () => {
    stopAudio();
    for (const audio of Object.values(elements.current)) { audio.removeAttribute('src'); audio.load(); }
    elements.current = {};
    context.current?.close().catch(() => {});
    context.current = null;
  }, [stopAudio]);
  const preloadDrumroll = useCallback(url => ensure('countdown', url), [ensure]);
  const preloadCelebration = useCallback(url => ensure('celebration', url), [ensure]);
  const values = Object.values(status);
  const audioStatus = values.includes('error') ? 'error' : values.includes('loading') ? 'loading' : values.includes('fallback') ? 'fallback' : values.every(value => value === 'idle') ? 'idle' : 'ready';
  return { unlockAudio, isAudioUnlocked, primeAudioPlayback, preloadDrumroll, preloadCelebration, playDrumroll, playCelebration, stopAudio, audioStatus };
}
