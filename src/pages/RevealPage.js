import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { genderService, authService } from '../api';
import { useCountdown, useAudio, useHeartReactions, useRevealTheme } from '../hooks';
import { Button, Card, Spinner, Alert } from '../components/common';
import HeartReactions from '../components/HeartReactions';
import { THEME_COLORS, INTENSITY_SETTINGS, DEFAULT_PREFERENCES } from '../constants/revealThemes';

/**
 * PreviewBadge Component - Shows preview mode indicator
 * Single Responsibility: Display preview mode badge
 * Note: No close button needed - users can simply close the browser tab
 */
const PreviewBadge = ({ isPreviewMode }) => {
  if (!isPreviewMode) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full border border-white/20 shadow-lg">
      <span className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Preview Mode
      </span>
    </div>
  );
};

const SOCKET_URL = process.env.REACT_APP_API_URL || 'https://hidden-simonette-baby-reveal-patry-b1dd6946.koyeb.app';
const API_URL = process.env.REACT_APP_API_URL || 'https://hidden-simonette-baby-reveal-patry-b1dd6946.koyeb.app';

/**
 * Build full audio URL from relative path
 * @param {string|null} relativePath - e.g. "/api/audio/CODE/countdown"
 * @returns {string|null} Full URL or null
 */
const buildAudioUrl = (relativePath) => {
  if (!relativePath) return null;
  return `${API_URL}${relativePath}`;
};

function RevealPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Preview mode detection
  const isPreviewMode = searchParams.get('preview') === 'true';
  const previewGender = searchParams.get('gender');

  const [step, setStep] = useState('loading');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  // Password protection state
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // Synced reveal state
  const [viewerCount, setViewerCount] = useState(1);
  const [isHost, setIsHost] = useState(false);
  const socketRef = useRef(null);
  const pollingRef = useRef(null); // Fallback polling
  const spawnHeartRef = useRef(null); // Ref to hold latest spawnHeart function
  const handleRevealStartedRef = useRef(null); // Ref to hold latest handler

  const { preloadDrumroll, preloadCelebration, playDrumroll, playCelebration, stopAudio, audioStatus } = useAudio();

  // Heart reactions hook
  const { hearts, sendHeart, spawnHeart } = useHeartReactions({
    socketRef,
    roomCode: code,
    cooldownMs: 250,
    heartDuration: 2000,
  });

  // Theme hook - must be called unconditionally (React hooks rule)
  const revealTheme = useRevealTheme({ preferences, gender: gender || 'boy' });

  // Keep spawnHeart ref updated for WebSocket listener
  spawnHeartRef.current = spawnHeart;

  // Preload audio when preferences are loaded (instant playback when user clicks reveal)
  useEffect(() => {
    if (preferences.soundEnabled) {
      const countdownUrl = buildAudioUrl(preferences.customAudio?.countdown?.url);
      const celebrationUrl = buildAudioUrl(preferences.customAudio?.celebration?.url);
      preloadDrumroll(countdownUrl);
      preloadCelebration(celebrationUrl);
    }
  }, [preferences.soundEnabled, preferences.customAudio, preloadDrumroll, preloadCelebration]);

  // Memoized confetti trigger - defined early as it's used by multiple callbacks
  const triggerConfetti = useCallback((revealedGender, withSound = true) => {
    const theme = THEME_COLORS[preferences.theme] || THEME_COLORS.classic;
    const intensity = INTENSITY_SETTINGS[preferences.animationIntensity] || INTENSITY_SETTINGS.medium;
    const colors = revealedGender === 'boy' ? theme.boy : theme.girl;

    if (withSound && preferences.soundEnabled) {
      const celebrationUrl = buildAudioUrl(preferences.customAudio?.celebration?.url);
      playCelebration(celebrationUrl);
    }

    confetti({
      particleCount: intensity.particleCount,
      spread: 100,
      origin: { y: 0.6 },
      colors
    });

    const duration = 5000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: Math.ceil(intensity.particleCount / 50),
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors
      });
      confetti({
        particleCount: Math.ceil(intensity.particleCount / 50),
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [preferences.theme, preferences.animationIntensity, preferences.soundEnabled, preferences.customAudio?.celebration?.url, playCelebration]);

  // Countdown complete handler
  const onCountdownComplete = useCallback(() => {
    setStep('opening');
    if (preferences.soundEnabled) {
      const celebrationUrl = buildAudioUrl(preferences.customAudio?.celebration?.url);
      playCelebration(celebrationUrl);
    }
    setTimeout(() => {
      setStep('reveal');
      triggerConfetti(gender, false);
    }, 1200);
  }, [gender, preferences.soundEnabled, preferences.customAudio?.celebration?.url, playCelebration, triggerConfetti]);

  const { count, start: startCountdown } = useCountdown(5, onCountdownComplete);

  // Handle reveal started event (from WebSocket or polling)
  const handleRevealStarted = useCallback((data) => {
    const { gender: revealedGender, revealStartedAt, serverTime } = data;
    const countdownDuration = preferences?.countdownDuration || 5;

    // Calculate elapsed time using server time
    const serverTimestamp = serverTime ? new Date(serverTime).getTime() : Date.now();
    const startTime = new Date(revealStartedAt).getTime();
    const elapsed = (serverTimestamp - startTime) / 1000;

    if (elapsed < countdownDuration) {
      // Still in countdown phase - join the countdown
      setGender(revealedGender);
      setStep('countdown');
      if (preferences.soundEnabled) {
        const countdownUrl = buildAudioUrl(preferences.customAudio?.countdown?.url);
        playDrumroll(countdownUrl, countdownDuration - elapsed);
      }
      startCountdown(Math.ceil(countdownDuration - elapsed));
    } else if (elapsed < countdownDuration + 2) {
      // In opening animation phase
      setGender(revealedGender);
      setStep('opening');
      if (preferences.soundEnabled) {
        const celebrationUrl = buildAudioUrl(preferences.customAudio?.celebration?.url);
        playCelebration(celebrationUrl);
      }
      setTimeout(() => {
        setStep('reveal');
        triggerConfetti(revealedGender, false);
      }, Math.max(0, (countdownDuration + 1.2 - elapsed) * 1000));
    } else {
      // Already revealed - show final state
      setGender(revealedGender);
      setStep('reveal');
      triggerConfetti(revealedGender);
    }
  }, [preferences, playDrumroll, playCelebration, startCountdown, triggerConfetti]);

  // Keep ref updated so socket listener always uses latest preferences
  handleRevealStartedRef.current = handleRevealStarted;

  // Disconnect WebSocket and cleanup
  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-reveal', code);
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [code]);

  // Fallback polling if WebSocket fails (defined before connectWebSocket as it's called by it)
  const startFallbackPolling = useCallback(() => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const data = await genderService.getStatusByCode(code);
        if (data.viewerCount) setViewerCount(data.viewerCount);
        if (data.revealStartedAt) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          // Use ref to always get latest handler with current preferences
          handleRevealStartedRef.current?.({
            gender: data.gender,
            revealStartedAt: data.revealStartedAt,
            serverTime: data.serverTime,
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1000);
  }, [code]);

  // Connect to WebSocket for real-time synced reveal
  const connectWebSocket = useCallback(() => {
    // Prevent multiple connections - check if socket exists (connected or connecting)
    if (socketRef.current) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    // Store ref immediately to prevent duplicate connections
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-reveal', code);
    });

    socket.on('viewer-count', (count) => {
      setViewerCount(count);
    });

    socket.on('reveal-started', (data) => {
      handleRevealStartedRef.current?.(data);
    });

    // Listen for hearts from other users
    socket.on('heart-received', () => {
      spawnHeartRef.current?.();
    });

    socket.on('connect_error', () => {
      // Fall back to polling if WebSocket fails
      startFallbackPolling();
    });
  }, [code, startFallbackPolling]);

  // Initialize preview mode
  const initPreviewMode = useCallback(async () => {
    if (!previewGender || (previewGender !== 'boy' && previewGender !== 'girl')) {
      setError('Invalid preview gender. Use ?preview=true&gender=boy or ?preview=true&gender=girl');
      setStep('error');
      return;
    }

    try {
      // Use public status endpoint to get preferences (same as normal reveal)
      const data = await genderService.getStatusByCode(code);

      if (data.isDoctor) {
        setError('Cannot preview a doctor link');
        setStep('error');
        return;
      }

      const userPrefs = { ...DEFAULT_PREFERENCES, ...(data.preferences || {}) };

      // Set UI immediately - audio URLs are already in preferences
      setPreferences(userPrefs);
      setGender(previewGender);
      setIsHost(data.isHost || false);
      setStep('ready');
    } catch (err) {
      setError(err.message || 'Invalid or expired link');
      setStep('error');
    }
  }, [previewGender, code]);

  // Initialize on mount and cleanup on unmount
  useEffect(() => {
    if (isPreviewMode) {
      initPreviewMode();
    } else {
      checkStatus();
    }

    // Handle page refresh/close - ensure socket disconnects
    const handleBeforeUnload = () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-reveal', code);
        socketRef.current.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopAudio();
      disconnectWebSocket();
    };
  }, [code, stopAudio, disconnectWebSocket, isPreviewMode, initPreviewMode]);

  const checkStatus = async () => {
    try {
      const data = await genderService.getStatusByCode(code);

      if (data.isDoctor) {
        setError('This is not a reveal link');
        setStep('error');
        return;
      }

      // Store preferences from API response (includes audio URLs)
      let userPrefs = { ...DEFAULT_PREFERENCES };
      if (data.preferences) {
        userPrefs = { ...userPrefs, ...data.preferences };
      }

      // Set preferences immediately - audio URLs are included, browser will fetch when played
      setPreferences(userPrefs);

      // Check if this is the host (owner of the reveal)
      setIsHost(data.isHost || false);

      // Update viewer count if available
      if (data.viewerCount) {
        setViewerCount(data.viewerCount);
      }

      if (!data.isSet) {
        setStep('not-ready');
      } else {
        // Check if reveal already started (for synced mode)
        if (data.revealStartedAt) {
          // Reveal already in progress or completed
          setGender(data.gender);
          setStep('reveal');
          triggerConfetti(data.gender);
          // Still connect WebSocket for heart reactions in synced mode
          if (data.preferences?.syncedReveal) {
            connectWebSocket();
          }
          return;
        }

        // Check if password is required
        try {
          const pwCheck = await authService.checkRevealPassword(code);
          if (pwCheck.passwordRequired) {
            setPasswordRequired(true);
            setStep('password');
          } else {
            setStep('ready');
            // Connect WebSocket for synced reveal (host needs it for viewer count, guest needs it for reveal event)
            if (data.preferences?.syncedReveal) {
              connectWebSocket();
            }
          }
        } catch {
          // If check fails, proceed without password
          setStep('ready');
          if (data.preferences?.syncedReveal) {
            connectWebSocket();
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired link');
      setStep('error');
    }
  };

  const verifyPassword = async () => {
    if (!passwordInput) {
      setPasswordError('Please enter the password');
      return;
    }
    setPasswordError('');
    setVerifyingPassword(true);
    try {
      const result = await authService.verifyRevealPassword(code, passwordInput);
      if (result.valid) {
        setStep('ready');
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (err) {
      setPasswordError(err.message || 'Invalid password');
    } finally {
      setVerifyingPassword(false);
    }
  };

  const startReveal = async () => {
    setLoading(true);

    try {
      // In preview mode, skip API call - gender is already set
      if (!isPreviewMode) {
        const data = await genderService.revealGender(code);
        setGender(data.gender);
      }

      setStep('countdown');
      if (preferences.soundEnabled) {
        const countdownUrl = buildAudioUrl(preferences.customAudio?.countdown?.url);
        playDrumroll(countdownUrl, preferences.countdownDuration);
      }
      startCountdown(preferences.countdownDuration);
    } catch (err) {
      setError(err.message || 'Failed to reveal');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // Loading
  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="large" color="white" />
      </div>
    );
  }

  // Password required
  if (step === 'password') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <Card className="text-center">
            <div className="mb-4 flex justify-center">
              <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Password Protected</h1>
            <p className="text-white/60 mb-6">
              Enter the password to view the reveal
            </p>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-center text-lg focus:outline-none focus:border-white/40"
                autoFocus
              />

              {passwordError && (
                <Alert variant="error">{passwordError}</Alert>
              )}

              <Button
                variant="primary"
                fullWidth
                onClick={verifyPassword}
                disabled={verifyingPassword}
              >
                {verifyingPassword ? 'Verifying...' : 'Continue'}
              </Button>
            </div>

            <p className="text-white/40 text-sm mt-6">
              Ask the parents for the password
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Not ready
  if (step === 'not-ready') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
        {/* Background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <motion.div
            className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Gift icon with glow and float animation */}
            <div className="relative inline-block mb-6">
              {/* Glow ring behind gift */}
              <motion.div
                className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              {/* Floating gift */}
              <motion.div
                className="relative text-7xl"
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                🎁
              </motion.div>

              {/* Small decorative sparkles */}
              {[...Array(4)].map((_, i) => {
                const positions = [
                  { top: '-10px', right: '-5px' },
                  { top: '5px', left: '-10px' },
                  { bottom: '0px', right: '-8px' },
                  { bottom: '-5px', left: '0px' },
                ];
                return (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={positions[i]}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: 'easeInOut',
                    }}
                  >
                    <svg className="w-3 h-3 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
                    </svg>
                  </motion.div>
                );
              })}
            </div>

            {/* Heading */}
            <motion.h1
              className="text-2xl md:text-3xl font-bold text-white mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Not Yet!
            </motion.h1>

            {/* Subtext */}
            <motion.p
              className="text-white/60 mb-2 text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              The big secret is still being kept.
            </motion.p>
            <motion.p
              className="text-white/40 mb-8 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Check back soon for the reveal!
            </motion.p>

            {/* Enhanced button */}
            <motion.button
              className="w-full py-3 px-6 rounded-xl font-medium text-base text-white bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/30 hover:border-amber-400/50 hover:from-amber-500/30 hover:via-orange-500/30 hover:to-amber-500/30 transition-all duration-300 flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={checkStatus}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Check Now
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Error
  if (step === 'error') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <Card className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Error</h1>
            <Alert variant="error">{error}</Alert>
            <Button variant="secondary" fullWidth onClick={checkStatus} className="mt-4">
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Ready
  if (step === 'ready') {
    const isSynced = preferences.syncedReveal && !isPreviewMode;
    const showHostView = !isSynced || isHost;

    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
        <PreviewBadge isPreviewMode={isPreviewMode} />

        {/* Heart reactions for synced mode */}
        <HeartReactions hearts={hearts} onSendHeart={sendHeart} enabled={isSynced} />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="stars" />

        {showHostView ? (
          // Host view - can trigger the reveal
          <div className="relative z-10 text-center animate-fade-in">
            {/* Host badge for synced mode */}
            {isSynced && isHost && !isPreviewMode && (
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-3 py-1.5 mb-6">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-amber-300 text-sm font-medium">You are the host</span>
              </div>
            )}

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 text-shadow-lg">Ready?</h1>
            <p className="text-white/70 text-xl mb-8">
              The moment you've been waiting for...
            </p>

            {/* Viewer count for synced mode - subtract 1 to exclude host */}
            {isSynced && viewerCount > 1 && (
              <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 rounded-full px-4 py-2 mb-8">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(viewerCount - 1, 5))].map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-purple-900 flex items-center justify-center text-xs text-white font-bold">
                      {i === 4 && viewerCount - 1 > 5 ? `+${viewerCount - 5}` : ''}
                    </div>
                  ))}
                </div>
                <span className="text-purple-300 text-sm font-medium">
                  {viewerCount - 1} {viewerCount - 1 === 1 ? 'guest is' : 'guests are'} watching
                </span>
              </div>
            )}

            <div className="text-8xl md:text-9xl mb-12 animate-float">🎁</div>

            <button
              className="group relative bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 font-bold py-6 px-12 rounded-full text-2xl hover:shadow-2xl hover:shadow-amber-400/40 transition-all duration-300 hover:scale-105 disabled:opacity-50"
              onClick={startReveal}
              disabled={loading}
            >
              {loading ? (
                <span className="inline-block w-8 h-8 border-4 border-amber-950/30 border-t-amber-950 rounded-full animate-spin" />
              ) : (
                'Reveal Now'
              )}
            </button>

            {/* Audio preload status indicator - subtle, non-blocking */}
            {preferences.soundEnabled && audioStatus !== 'idle' && (
              <div className="flex items-center justify-center gap-1.5 mt-4" title={audioStatus === 'loading' ? 'Loading audio...' : 'Audio ready'}>
                <svg className="w-3 h-3 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    audioStatus === 'loading'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-green-400'
                  }`}
                />
              </div>
            )}

            <p className="text-white/50 text-sm mt-8">
              {isSynced
                ? 'Everyone watching will see the reveal at the same time'
                : 'Get ready for the moment you\'ve been waiting for'}
            </p>
          </div>
        ) : (
          // Guest view - waiting for host to start
          <div className="relative z-10 text-center animate-fade-in max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Get ready...
            </h1>

            <p className="text-white/60 text-lg mb-8">
              The big moment is coming! Stay on this page — the reveal will start automatically.
            </p>

            {viewerCount > 1 && (
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/70 text-sm">
                  Watching with {viewerCount - 1} {viewerCount - 1 === 1 ? 'other' : 'others'}
                </span>
              </div>
            )}

            <div className="text-7xl mb-8 animate-float">🎁</div>

            <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>

            {/* Host login prompt */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/40 text-sm mb-3">Are you the host?</p>
              <button
                onClick={() => navigate(`/auth?redirect=/reveal/${code}`)}
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login to control the reveal
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Countdown
  if (step === 'countdown') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <PreviewBadge isPreviewMode={isPreviewMode} />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-dark-800 to-dark-900" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 text-center">
          <div className="text-[12rem] md:text-[16rem] font-bold text-white animate-pulse drop-shadow-2xl">
            {count}
          </div>
        </div>
      </div>
    );
  }

  // Opening animation - flying balloons
  if (step === 'opening') {
    const { isBoy, colors, backgrounds, balloonPositions, particlePositions } = revealTheme;

    return (
      <div className={`min-h-screen w-full fixed inset-0 overflow-hidden bg-gradient-to-b ${backgrounds.opening}`}>
        <PreviewBadge isPreviewMode={isPreviewMode} />

        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particlePositions.map((pos, i) => (
            <motion.div
              key={`particle-${i}`}
              className={`absolute w-2 h-2 rounded-full ${isBoy ? 'bg-blue-200' : 'bg-pink-200'}`}
              style={{
                left: pos.left,
                top: pos.top,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: pos.duration,
                repeat: Infinity,
                delay: pos.delay,
              }}
            />
          ))}
        </div>

        {/* Flying balloons */}
        {balloonPositions.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: pos.left,
              bottom: `-${pos.size * 1.5}px`,
              zIndex: Math.floor(pos.size / 20),
            }}
            initial={{ y: 0, opacity: 0, scale: 0.5 }}
            animate={{
              y: '-120vh',
              opacity: [0, 1, 1, 1, 0.8],
              scale: 1,
            }}
            transition={{
              duration: pos.speed,
              delay: pos.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
              opacity: { duration: pos.speed, times: [0, 0.1, 0.5, 0.9, 1] },
              scale: { duration: 0.3, delay: pos.delay },
            }}
          >
            <motion.div
              animate={{
                x: [0, pos.wobble, -pos.wobble, pos.wobble * 0.5, 0],
                rotate: [0, pos.rotate, -pos.rotate, pos.rotate * 0.5, 0],
              }}
              transition={{
                duration: pos.speed,
                delay: pos.delay,
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: 'center bottom' }}
            >
              <motion.div
                animate={{ scale: [1, 1.03, 1, 0.98, 1] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <svg
                  width={pos.size}
                  height={pos.size * 1.4}
                  viewBox="0 0 80 110"
                  style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
                >
                  <defs>
                    <radialGradient id={`grad-${i}`} cx="35%" cy="30%" r="60%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                      <stop offset="40%" stopColor={colors[pos.colorIndex]} stopOpacity="1" />
                      <stop offset="100%" stopColor={colors[pos.colorIndex]} stopOpacity="0.9" />
                    </radialGradient>
                    <linearGradient id={`shine-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                      <stop offset="50%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Balloon body */}
                  <ellipse cx="40" cy="38" rx="34" ry="38" fill={`url(#grad-${i})`} />
                  {/* Shine highlight */}
                  <ellipse cx="28" cy="26" rx="12" ry="16" fill={`url(#shine-${i})`} />
                  {/* Small highlight dot */}
                  <ellipse cx="24" cy="22" rx="4" ry="5" fill="white" opacity="0.7" />
                  {/* Balloon knot */}
                  <path d="M36,74 Q40,78 44,74 L42,76 Q40,80 38,76 Z" fill={colors[pos.colorIndex]} />
                  {/* Curvy string */}
                  <motion.path
                    d="M40,78 Q44,88 38,98 Q34,108 40,118"
                    stroke={colors[pos.colorIndex]}
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.6"
                    animate={{ d: [
                      "M40,78 Q44,88 38,98 Q34,108 40,118",
                      "M40,78 Q36,88 42,98 Q46,108 40,118",
                      "M40,78 Q44,88 38,98 Q34,108 40,118",
                    ]}}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        ))}

        {/* Center glow burst */}
        <motion.div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full ${
            isBoy ? 'bg-blue-300/40' : 'bg-pink-300/40'
          }`}
          style={{ filter: 'blur(60px)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 2.5, 2], opacity: [0, 0.8, 0.6] }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Secondary glow rings */}
        <motion.div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-4 ${
            isBoy ? 'border-blue-200/30' : 'border-pink-200/30'
          }`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 3], opacity: [0.8, 0] }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <motion.div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 ${
            isBoy ? 'border-blue-100/40' : 'border-pink-100/40'
          }`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 4], opacity: [0.6, 0] }}
          transition={{ duration: 1.4, delay: 0.1, ease: 'easeOut' }}
        />
      </div>
    );
  }

  // Final reveal
  if (step === 'reveal') {
    const { isBoy, backgrounds, displayValues } = revealTheme;
    const isSynced = preferences.syncedReveal && !isPreviewMode;

    return (
      <div className={`min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br ${backgrounds.main}`}>
        <PreviewBadge isPreviewMode={isPreviewMode} />

        {/* Heart reactions for synced mode */}
        <HeartReactions hearts={hearts} onSendHeart={sendHeart} enabled={isSynced} />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-20 left-10 w-72 h-72 ${backgrounds.glow} rounded-full blur-3xl animate-pulse`} />
          <div className={`absolute bottom-20 right-10 w-96 h-96 ${backgrounds.glow} rounded-full blur-3xl animate-pulse`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[600px] ${backgrounds.glow} rounded-full blur-3xl`} style={{ opacity: 0.5 }} />
        </div>

        <div className="relative z-10 text-center">
          <p className="text-2xl md:text-3xl font-medium mb-8 animate-float-up text-white/80">
            {displayValues.babyCount === 1 ? "It's a" : `It's ${displayValues.babyCount === 2 ? 'Twin' : 'Triplet'}`}
          </p>

          {/* Main emoji with sparkles */}
          <div className="relative mb-6">
            {/* Sparkle particles around emoji */}
            {[...Array(12)].map((_, i) => {
              const positions = [
                { top: '5%', left: '15%' },
                { top: '0%', left: '50%' },
                { top: '5%', right: '15%' },
                { top: '25%', left: '0%' },
                { top: '25%', right: '0%' },
                { top: '50%', left: '-5%' },
                { top: '50%', right: '-5%' },
                { top: '75%', left: '5%' },
                { top: '75%', right: '5%' },
                { bottom: '5%', left: '20%' },
                { bottom: '0%', left: '50%' },
                { bottom: '5%', right: '20%' },
              ];
              const delays = [0.3, 0.5, 0.4, 0.7, 0.6, 0.9, 0.8, 1.1, 1.0, 1.3, 1.2, 1.4];
              const sizes = [8, 10, 7, 6, 7, 9, 8, 6, 7, 8, 9, 7];
              return (
                <motion.div
                  key={`emoji-sparkle-${i}`}
                  className="absolute pointer-events-none z-10"
                  style={positions[i]}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1, 1, 0],
                    rotate: [0, 180],
                  }}
                  transition={{
                    duration: 0.8,
                    delay: delays[i],
                    repeat: Infinity,
                    repeatDelay: 2.5 + (i % 4) * 0.4,
                    ease: 'easeOut',
                  }}
                >
                  <svg width={sizes[i] * 2} height={sizes[i] * 2} viewBox="0 0 24 24" className={isBoy ? 'text-blue-200' : 'text-pink-200'}>
                    <path
                      fill="currentColor"
                      d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"
                    />
                  </svg>
                </motion.div>
              );
            })}

            {/* Emoji container */}
            <div className={`animate-burst-in flex justify-center ${displayValues.babyCount > 1 ? 'gap-2 md:gap-4' : ''}`}>
              {Array.from({ length: displayValues.babyCount }).map((_, i) => (
                <motion.span
                  key={i}
                  className={displayValues.babyCount > 1 ? 'text-7xl md:text-9xl' : 'text-9xl md:text-[12rem]'}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.1 + i * 0.1,
                    type: 'spring',
                    stiffness: 200,
                    damping: 12,
                  }}
                >
                  {displayValues.emoji}
                </motion.span>
              ))}
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-8 text-shadow-lg animate-float-up text-white"
              style={{ animationDelay: '0.2s' }}>
            {displayValues.babyCount === 1 ? displayValues.genderText : displayValues.genderTextPlural}!
          </h1>

          {/* Celebration divider - premium animation with sparkles */}
          <div className="flex items-center justify-center gap-2 mb-8 relative">
            {/* Left side - flowing orbs emanating outward */}
            <div className="flex items-center gap-1.5">
              {[...Array(4)].map((_, i) => {
                const sizes = [3, 4, 5, 6]; // Grow towards center
                const opacity = 0.8; // Consistent opacity
                const delays = [0.9, 0.75, 0.6, 0.45]; // Appear from center outward
                const idx = 3 - i; // Reverse index for left side
                return (
                  <motion.div
                    key={`left-orb-${i}`}
                    className="relative"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: delays[idx],
                      type: 'spring',
                      stiffness: 300,
                      damping: 15,
                    }}
                  >
                    {/* Outer glow */}
                    <motion.div
                      className={`absolute inset-0 rounded-full blur-sm ${isBoy ? 'bg-blue-400' : 'bg-pink-400'}`}
                      style={{ opacity: opacity * 0.5 }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [opacity * 0.3, opacity * 0.6, opacity * 0.3],
                      }}
                      transition={{
                        duration: 2 + idx * 0.3,
                        delay: 1.2 + idx * 0.15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    {/* Core orb */}
                    <motion.div
                      className={`rounded-full ${isBoy ? 'bg-blue-300' : 'bg-pink-300'}`}
                      style={{
                        width: sizes[idx] * 2,
                        height: sizes[idx] * 2,
                        opacity: opacity,
                      }}
                      animate={{
                        scale: [1, 1.15, 1],
                      }}
                      transition={{
                        duration: 2.5 + idx * 0.2,
                        delay: 1.3 + idx * 0.1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* Hearts container with sparkles */}
            <div className="relative flex items-center gap-3 px-2">
              {/* Sparkle particles - positioned around hearts */}
              {[...Array(8)].map((_, i) => {
                const positions = [
                  { top: '-8px', left: '10%' },
                  { top: '-4px', right: '15%' },
                  { bottom: '-6px', left: '25%' },
                  { top: '50%', left: '-8px' },
                  { top: '50%', right: '-8px' },
                  { bottom: '-8px', right: '20%' },
                  { top: '-10px', left: '50%' },
                  { bottom: '-10px', left: '45%' },
                ];
                const delays = [1.5, 2.1, 1.8, 2.4, 2.7, 1.9, 2.2, 2.5];
                const sizes = [4, 3, 5, 3, 4, 3, 4, 3];
                return (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="absolute pointer-events-none"
                    style={positions[i]}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1, 1, 0],
                      rotate: [0, 180],
                    }}
                    transition={{
                      duration: 0.7,
                      delay: delays[i],
                      repeat: Infinity,
                      repeatDelay: 2 + (i % 3) * 0.5,
                      ease: 'easeOut',
                    }}
                  >
                    {/* 4-point star sparkle */}
                    <svg width={sizes[i] * 2} height={sizes[i] * 2} viewBox="0 0 24 24" className={isBoy ? 'text-blue-200' : 'text-pink-200'}>
                      <path
                        fill="currentColor"
                        d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"
                      />
                    </svg>
                  </motion.div>
                );
              })}

              {/* Hearts with wave float animation */}
              {displayValues.celebrationEmojis.map((emoji, i) => (
                <motion.div
                  key={i}
                  className="relative"
                  initial={{ opacity: 0, scale: 0, y: 30, rotate: -20 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    rotate: 0,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 0.5 + i * 0.1,
                    type: 'spring',
                    stiffness: 260,
                    damping: 15,
                  }}
                >
                  {/* Outer glow ring */}
                  <motion.div
                    className={`absolute -inset-2 rounded-full blur-xl ${isBoy ? 'bg-blue-400/20' : 'bg-pink-400/20'}`}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 3,
                      delay: 1.2 + i * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  {/* Inner glow */}
                  <motion.div
                    className={`absolute -inset-1 rounded-full blur-md ${isBoy ? 'bg-blue-300/30' : 'bg-pink-300/30'}`}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 2.5,
                      delay: 1 + i * 0.3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  {/* Heart with coordinated wave motion */}
                  <motion.span
                    className="relative text-2xl md:text-3xl block"
                    animate={{
                      y: [0, -6, 0, -3, 0],
                      scale: [1, 1.1, 1, 1.05, 1],
                      rotate: [0, 3, 0, -2, 0],
                    }}
                    transition={{
                      duration: 4,
                      delay: 1.2 + i * 0.25,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {emoji}
                  </motion.span>
                </motion.div>
              ))}
            </div>

            {/* Right side - flowing orbs emanating outward (mirrored: small to big) */}
            <div className="flex items-center gap-1.5">
              {[...Array(4)].map((_, i) => {
                const sizes = [3, 4, 5, 6]; // Grow away from center (mirrored)
                const opacity = 0.8; // Consistent opacity
                const delays = [0.45, 0.6, 0.75, 0.9]; // Appear from center outward
                return (
                  <motion.div
                    key={`right-orb-${i}`}
                    className="relative"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: delays[i],
                      type: 'spring',
                      stiffness: 300,
                      damping: 15,
                    }}
                  >
                    {/* Outer glow */}
                    <motion.div
                      className={`absolute inset-0 rounded-full blur-sm ${isBoy ? 'bg-blue-400' : 'bg-pink-400'}`}
                      style={{ opacity: opacity * 0.5 }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [opacity * 0.3, opacity * 0.6, opacity * 0.3],
                      }}
                      transition={{
                        duration: 2 + i * 0.3,
                        delay: 1.2 + i * 0.15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    {/* Core orb */}
                    <motion.div
                      className={`rounded-full ${isBoy ? 'bg-blue-300' : 'bg-pink-300'}`}
                      style={{
                        width: sizes[i] * 2,
                        height: sizes[i] * 2,
                        opacity: opacity,
                      }}
                      animate={{
                        scale: [1, 1.15, 1],
                      }}
                      transition={{
                        duration: 2.5 + i * 0.2,
                        delay: 1.3 + i * 0.1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          <p className="text-3xl md:text-4xl font-script mb-12 animate-float-up text-white/90"
             style={{ animationDelay: '0.4s' }}>
            {displayValues.customMessage}
          </p>

          {/* Confetti Button */}
          <button
            className={`relative group py-3 px-6 rounded-full font-medium text-base text-white transition-all duration-300 hover:scale-105 active:scale-98 ${
              isBoy
                ? 'bg-gradient-to-r from-blue-500/30 via-blue-400/40 to-blue-500/30 border border-blue-300/30 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:border-blue-300/50'
                : 'bg-gradient-to-r from-pink-500/30 via-pink-400/40 to-pink-500/30 border border-pink-300/30 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:border-pink-300/50'
            }`}
            onClick={() => triggerConfetti(gender)}
          >
            <span className="flex items-center gap-2">
              {/* Sparkles SVG icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                <path d="M5 2L5.88 4.12L8 5L5.88 5.88L5 8L4.12 5.88L2 5L4.12 4.12L5 2Z" opacity="0.6" />
                <path d="M19 16L19.88 18.12L22 19L19.88 19.88L19 22L18.12 19.88L16 19L18.12 18.12L19 16Z" opacity="0.6" />
              </svg>
              More Confetti!
            </span>
          </button>
        </div>

        {/* Live viewer count - fixed bottom left (matching heart button style on right) */}
        {isSynced && viewerCount > 1 && (
          <div className="fixed bottom-8 left-8 z-40">
            <div className="relative w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex flex-col items-center justify-center shadow-lg shadow-black/10">
              {/* Subtle green glow ring */}
              <div className="absolute inset-0 rounded-full border border-green-400/30" />

              {/* Count number */}
              <span className="text-white font-bold text-xl leading-none">{viewerCount}</span>

              {/* Live indicator with inline dot */}
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-green-400/80 text-[8px] font-semibold tracking-wide">LIVE</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default RevealPage;
