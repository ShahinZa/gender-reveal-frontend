import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { genderService } from '../api';
import { useCountdown, useAudio } from '../hooks';
import { Button, Card, Spinner, Alert } from '../components/common';

function RevealPage() {
  const { code } = useParams();

  const [step, setStep] = useState('loading');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState(null);

  const { playDrumroll, playCelebration, stopAudio } = useAudio();

  const onCountdownComplete = useCallback(() => {
    setStep('opening');
    setTimeout(() => {
      setStep('reveal');
      triggerConfetti(gender);
    }, 1200);
  }, [gender]);

  const { count, start: startCountdown } = useCountdown(5, onCountdownComplete);

  useEffect(() => {
    checkStatus();
    return () => stopAudio();
  }, [code, stopAudio]);

  const checkStatus = async () => {
    try {
      const data = await genderService.getStatusByCode(code);

      if (data.isDoctor) {
        setError('This is not a reveal link');
        setStep('error');
        return;
      }

      if (!data.isSet) {
        setStep('not-ready');
      } else {
        setStep('ready');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired link');
      setStep('error');
    }
  };

  const startReveal = async () => {
    setLoading(true);

    try {
      const data = await genderService.revealGender(code);
      setGender(data.gender);
      setStep('countdown');
      playDrumroll();
      startCountdown();
    } catch (err) {
      setError(err.message || 'Failed to reveal');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = (revealedGender, withSound = true) => {
    const colors = revealedGender === 'boy'
      ? ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb']
      : ['#f9a8d4', '#f472b6', '#ec4899', '#db2777'];

    if (withSound) {
      playCelebration();
    }

    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors
    });

    const duration = 5000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors
      });
      confetti({
        particleCount: 3,
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
  };

  // Loading
  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="large" color="white" />
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
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Not Ready Yet</h1>
            <p className="text-white/60 mb-6">
              The doctor hasn't selected the gender yet. Please check back later.
            </p>
            <Button variant="secondary" fullWidth onClick={checkStatus}>
              Refresh
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
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="stars" />

        <div className="relative z-10 text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 text-shadow-lg">Ready?</h1>
          <p className="text-white/70 text-xl mb-12">
            The moment you've been waiting for...
          </p>

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
            Get ready for the moment you've been waiting for
          </p>
        </div>
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

    // Color palettes for depth and variety
    const colors = isBoy
      ? ['#3b82f6', '#60a5fa', '#2563eb', '#1d4ed8', '#93c5fd']
      : ['#ec4899', '#f472b6', '#db2777', '#be185d', '#fbcfe8'];

    const balloonPositions = [
      // First wave
      { left: '2%', delay: 0, size: 65, color: 0, speed: 1.3, wobble: 12, rotate: -8 },
      { left: '7%', delay: 0.08, size: 90, color: 1, speed: 1.15, wobble: 16, rotate: 6 },
      { left: '12%', delay: 0.02, size: 75, color: 2, speed: 1.25, wobble: 14, rotate: -10 },
      { left: '17%', delay: 0.12, size: 110, color: 0, speed: 1.0, wobble: 20, rotate: 8 },
      { left: '22%', delay: 0.05, size: 68, color: 3, speed: 1.35, wobble: 11, rotate: -5 },
      { left: '27%', delay: 0.15, size: 95, color: 1, speed: 1.08, wobble: 17, rotate: 10 },
      { left: '32%', delay: 0.03, size: 125, color: 0, speed: 0.95, wobble: 22, rotate: -3 },
      { left: '37%', delay: 0.1, size: 78, color: 2, speed: 1.22, wobble: 13, rotate: 7 },
      { left: '42%', delay: 0.06, size: 100, color: 4, speed: 1.1, wobble: 18, rotate: -12 },
      { left: '47%', delay: 0.14, size: 70, color: 3, speed: 1.3, wobble: 10, rotate: 5 },
      { left: '52%', delay: 0.01, size: 130, color: 0, speed: 0.92, wobble: 24, rotate: -4 },
      { left: '57%', delay: 0.09, size: 82, color: 1, speed: 1.18, wobble: 15, rotate: 9 },
      { left: '62%', delay: 0.04, size: 105, color: 2, speed: 1.05, wobble: 19, rotate: -8 },
      { left: '67%', delay: 0.16, size: 72, color: 4, speed: 1.28, wobble: 12, rotate: 6 },
      { left: '72%', delay: 0.07, size: 115, color: 0, speed: 1.02, wobble: 21, rotate: -6 },
      { left: '77%', delay: 0.11, size: 66, color: 3, speed: 1.32, wobble: 10, rotate: 11 },
      { left: '82%', delay: 0.03, size: 98, color: 1, speed: 1.12, wobble: 16, rotate: -9 },
      { left: '87%', delay: 0.13, size: 85, color: 2, speed: 1.2, wobble: 14, rotate: 4 },
      { left: '92%', delay: 0.06, size: 108, color: 0, speed: 1.06, wobble: 18, rotate: -7 },
      { left: '97%', delay: 0.1, size: 74, color: 4, speed: 1.26, wobble: 13, rotate: 8 },
    ];

    return (
      <div className={`min-h-screen w-full fixed inset-0 overflow-hidden ${
        isBoy
          ? 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-900'
          : 'bg-gradient-to-b from-pink-400 via-pink-600 to-pink-900'
      }`}>
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

    return (
      <div className={`min-h-screen relative overflow-hidden flex items-center justify-center ${
        isBoy ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900' : 'bg-gradient-to-br from-pink-900 via-pink-800 to-rose-900'
      }`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-20 left-10 w-72 h-72 ${isBoy ? 'bg-blue-400/30' : 'bg-pink-400/30'} rounded-full blur-3xl animate-pulse`} />
          <div className={`absolute bottom-20 right-10 w-96 h-96 ${isBoy ? 'bg-cyan-400/30' : 'bg-rose-400/30'} rounded-full blur-3xl animate-pulse`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${isBoy ? 'bg-blue-500/20' : 'bg-pink-500/20'} rounded-full blur-3xl`} />
        </div>

        <div className="relative z-10 text-center">
          <p className={`text-2xl md:text-3xl font-medium mb-4 animate-float-up ${isBoy ? 'text-blue-200' : 'text-pink-200'}`}>
            It's a
          </p>

          <div className="text-9xl md:text-[12rem] mb-6 animate-burst-in">
            {isBoy ? '👦' : '👧'}
          </div>

          <h1 className={`text-6xl md:text-8xl font-bold mb-8 text-shadow-lg animate-float-up ${
            isBoy ? 'text-blue-100' : 'text-pink-100'
          }`} style={{ animationDelay: '0.2s' }}>
            {isBoy ? 'BOY!' : 'GIRL!'}
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

          <p className={`text-3xl md:text-4xl font-script mb-12 animate-float-up ${isBoy ? 'text-blue-200' : 'text-pink-200'}`}
             style={{ animationDelay: '0.4s' }}>
            Congratulations!
          </p>

          <button
            className={`py-4 px-8 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 animate-float-up ${
              isBoy
                ? 'bg-blue-500/30 hover:bg-blue-500/50 text-blue-100 border border-blue-400/30'
                : 'bg-pink-500/30 hover:bg-pink-500/50 text-pink-100 border border-pink-400/30'
            }`}
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
