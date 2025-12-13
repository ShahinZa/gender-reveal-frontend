import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { genderService, authService } from '../api';
import { useCountdown, useAudio, useHeartReactions } from '../hooks';
import { Button, Card, Spinner, Alert } from '../components/common';
import HeartReactions from '../components/HeartReactions';
import { THEME_COLORS, INTENSITY_SETTINGS, DEFAULT_PREFERENCES } from '../constants/revealThemes';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'https://gender-production.up.railway.app';

function RevealPage() {
  const { code } = useParams();
  const navigate = useNavigate();

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

  const { playDrumroll, playCelebration, stopAudio } = useAudio();

  // Heart reactions hook
  const { hearts, sendHeart, spawnHeart } = useHeartReactions({
    socketRef,
    roomCode: code,
    cooldownMs: 250,
    heartDuration: 2000,
  });

  // Keep spawnHeart ref updated for WebSocket listener
  spawnHeartRef.current = spawnHeart;

  // Memoized confetti trigger - defined early as it's used by multiple callbacks
  const triggerConfetti = useCallback((revealedGender, withSound = true) => {
    const theme = THEME_COLORS[preferences.theme] || THEME_COLORS.classic;
    const intensity = INTENSITY_SETTINGS[preferences.animationIntensity] || INTENSITY_SETTINGS.medium;
    const colors = revealedGender === 'boy' ? theme.boy : theme.girl;

    if (withSound && preferences.soundEnabled) {
      const customCelebrationAudio = preferences.customAudio?.celebration?.data || null;
      playCelebration(customCelebrationAudio);
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
  }, [preferences.theme, preferences.animationIntensity, preferences.soundEnabled, preferences.customAudio?.celebration?.data, playCelebration]);

  // Countdown complete handler
  const onCountdownComplete = useCallback(() => {
    setStep('opening');
    if (preferences.soundEnabled) {
      const customCelebrationAudio = preferences.customAudio?.celebration?.data || null;
      playCelebration(customCelebrationAudio);
    }
    setTimeout(() => {
      setStep('reveal');
      triggerConfetti(gender, false);
    }, 1200);
  }, [gender, preferences.soundEnabled, preferences.customAudio?.celebration?.data, playCelebration, triggerConfetti]);

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
        const customCountdownAudio = preferences.customAudio?.countdown?.data || null;
        playDrumroll(customCountdownAudio, countdownDuration - elapsed);
      }
      startCountdown(Math.ceil(countdownDuration - elapsed));
    } else if (elapsed < countdownDuration + 2) {
      // In opening animation phase
      setGender(revealedGender);
      setStep('opening');
      if (preferences.soundEnabled) {
        const customCelebrationAudio = preferences.customAudio?.celebration?.data || null;
        playCelebration(customCelebrationAudio);
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
          handleRevealStarted({
            gender: data.gender,
            revealStartedAt: data.revealStartedAt,
            serverTime: data.serverTime,
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1000);
  }, [code, handleRevealStarted]);

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

  // Initialize on mount and cleanup on unmount
  useEffect(() => {
    checkStatus();

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
  }, [code, stopAudio, disconnectWebSocket]);

  const checkStatus = async () => {
    try {
      const data = await genderService.getStatusByCode(code);

      if (data.isDoctor) {
        setError('This is not a reveal link');
        setStep('error');
        return;
      }

      // Store preferences from API response
      if (data.preferences) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences });
      }

      // Check if this is the host (owner of the reveal)
      setIsHost(data.isHost || false);

      // Debug: Log host detection result
      if (data.preferences?.syncedReveal) {
        console.log('Synced reveal mode:', { isHost: data.isHost, syncedReveal: true });
      }

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
      const data = await genderService.revealGender(code);
      setGender(data.gender);
      setStep('countdown');
      if (preferences.soundEnabled) {
        const customCountdownAudio = preferences.customAudio?.countdown?.data || null;
        playDrumroll(customCountdownAudio, preferences.countdownDuration);
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
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <Card className="text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Not Yet!</h1>
            <p className="text-white/60 mb-6">
              The big secret is still being kept. Check back soon!
            </p>
            <Button variant="secondary" fullWidth onClick={checkStatus}>
              Check Now
            </Button>
          </Card>
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
    const isSynced = preferences.syncedReveal;
    const showHostView = !isSynced || isHost;

    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
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
            {isSynced && isHost && (
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
    const isBoy = gender === 'boy';
    const theme = THEME_COLORS[preferences.theme] || THEME_COLORS.classic;
    const intensity = INTENSITY_SETTINGS[preferences.animationIntensity] || INTENSITY_SETTINGS.medium;

    // Use theme colors for balloons (pad to 5 colors if needed)
    const themeColors = isBoy ? theme.boy : theme.girl;
    const colors = [...themeColors];
    while (colors.length < 5) {
      colors.push(themeColors[colors.length % themeColors.length]);
    }

    // Generate balloon positions based on intensity
    const balloonCount = intensity.balloonCount;
    const balloonPositions = Array.from({ length: balloonCount }, (_, i) => ({
      left: `${(i / balloonCount) * 100 + Math.random() * 3}%`,
      delay: (i % 5) * 0.03 + Math.random() * 0.05,
      size: 65 + Math.random() * 65,
      color: i % colors.length,
      speed: 0.9 + Math.random() * 0.5,
      wobble: 10 + Math.random() * 15,
      rotate: -12 + Math.random() * 24,
    }));

    const openingBg = isBoy ? theme.openingBgBoy : theme.openingBgGirl;

    return (
      <div className={`min-h-screen w-full fixed inset-0 overflow-hidden bg-gradient-to-b ${openingBg}`}>
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className={`absolute w-2 h-2 rounded-full ${isBoy ? 'bg-blue-200' : 'bg-pink-200'}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 1 + Math.random(),
                repeat: Infinity,
                delay: Math.random() * 0.5,
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
                      <stop offset="40%" stopColor={colors[pos.color]} stopOpacity="1" />
                      <stop offset="100%" stopColor={colors[pos.color]} stopOpacity="0.9" />
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
                  <path d="M36,74 Q40,78 44,74 L42,76 Q40,80 38,76 Z" fill={colors[pos.color]} />
                  {/* Curvy string */}
                  <motion.path
                    d="M40,78 Q44,88 38,98 Q34,108 40,118"
                    stroke={colors[pos.color]}
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
    const isBoy = gender === 'boy';
    const theme = THEME_COLORS[preferences.theme] || THEME_COLORS.classic;
    const bgGradient = isBoy ? theme.bgBoy : theme.bgGirl;
    const glowClass = isBoy ? theme.glowBoy : theme.glowGirl;
    const customMessage = preferences.customMessage || 'Congratulations!';

    return (
      <div className={`min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br ${bgGradient}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-20 left-10 w-72 h-72 ${glowClass} rounded-full blur-3xl animate-pulse`} />
          <div className={`absolute bottom-20 right-10 w-96 h-96 ${glowClass} rounded-full blur-3xl animate-pulse`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[600px] ${glowClass} rounded-full blur-3xl`} style={{ opacity: 0.5 }} />
        </div>

        <div className="relative z-10 text-center">
          <p className="text-2xl md:text-3xl font-medium mb-4 animate-float-up text-white/80">
            {preferences.babyCount === 1 ? "It's a" : `It's ${preferences.babyCount === 2 ? 'Twin' : 'Triplet'}`}
          </p>

          <div className={`mb-6 animate-burst-in flex justify-center ${preferences.babyCount > 1 ? 'gap-2 md:gap-4' : ''}`}>
            {Array.from({ length: preferences.babyCount || 1 }).map((_, i) => (
              <span
                key={i}
                className={preferences.babyCount > 1 ? 'text-7xl md:text-9xl' : 'text-9xl md:text-[12rem]'}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {isBoy ? (preferences.boyEmoji || '👦') : (preferences.girlEmoji || '👧')}
              </span>
            ))}
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-8 text-shadow-lg animate-float-up text-white"
              style={{ animationDelay: '0.2s' }}>
            {isBoy
              ? (preferences.babyCount === 1 ? 'BOY!' : 'BOYS!')
              : (preferences.babyCount === 1 ? 'GIRL!' : 'GIRLS!')}
          </h1>

          {/* Celebration emojis */}
          <div className="flex justify-center gap-4 mb-8">
            {(isBoy
              ? ['🩵', '⭐', '🩵', '⭐', '🩵']
              : ['🩷', '⭐', '🩷', '⭐', '🩷']
            ).map((emoji, i) => (
              <span
                key={i}
                className="text-4xl md:text-5xl animate-sparkle"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                {emoji}
              </span>
            ))}
          </div>

          <p className="text-3xl md:text-4xl font-script mb-12 animate-float-up text-white/90"
             style={{ animationDelay: '0.4s' }}>
            {customMessage}
          </p>

          <button
            className="py-4 px-8 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 animate-float-up bg-white/20 hover:bg-white/30 text-white border border-white/30"
            style={{ animationDelay: '0.6s' }}
            onClick={() => triggerConfetti(gender)}
          >
            More Confetti!
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default RevealPage;
