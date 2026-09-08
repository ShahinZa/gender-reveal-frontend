import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useCountdown, useAudio } from '../hooks';
import { BoyGirlIcon } from '../components/GenderIcons';
import Footer from '../components/Footer';
import useDialog from '../hooks/useDialog';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  // Demo state
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState('idle'); // idle, countdown, opening, reveal
  const [demoGender, setDemoGender] = useState(null);
  const demoActiveRef = useRef(false);
  const openingTimeoutRef = useRef(null);
  const confettiFrameRef = useRef(null);
  useEffect(() => () => { demoActiveRef.current = false; clearTimeout(openingTimeoutRef.current); cancelAnimationFrame(confettiFrameRef.current); confetti.reset(); }, []);

  const { unlockAudio, primeAudioPlayback, playDrumroll, playCelebration, stopAudio } = useAudio();

  const onDemoCountdownComplete = useCallback(() => {
    // Check if demo is still active before proceeding
    if (!demoActiveRef.current) return;

    setDemoStep('opening');
    openingTimeoutRef.current = setTimeout(() => {
      // Check again before reveal
      if (!demoActiveRef.current) return;
      setDemoStep('reveal');
      triggerDemoConfetti(demoGender);
    }, 1200);
  }, [demoGender]);

  const { count, start: startCountdown, reset: resetCountdown } = useCountdown(5, onDemoCountdownComplete);

  const triggerDemoConfetti = (gender, withSound = true) => {
    const colors = gender === 'boy'
      ? ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb']
      : ['#f9a8d4', '#f472b6', '#ec4899', '#db2777'];

    if (withSound) {
      playCelebration('/celebration.mp3');
    }

    confetti({
      disableForReducedMotion: true,
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 },
      colors
    });

    cancelAnimationFrame(confettiFrameRef.current);
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      if (!demoActiveRef.current) return;
      confetti({
        disableForReducedMotion: true,
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors
      });
      if (!demoActiveRef.current) return;
      confetti({
        disableForReducedMotion: true,
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors
      });
      if (Date.now() < end) {
        confettiFrameRef.current = requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const startDemo = (gender) => {
    // Unlock audio on user gesture (required for mobile browsers)
    unlockAudio();
    primeAudioPlayback('/drumroll.mp3', '/celebration.mp3');
    demoActiveRef.current = true;
    setDemoGender(gender);
    setDemoActive(true);
    setDemoStep('countdown');
    playDrumroll('/drumroll.mp3', 5);
    startCountdown();
  };

  const closeDemo = () => {
    // Mark demo as inactive to cancel pending callbacks
    demoActiveRef.current = false;
    // Clear pending timeout
    if (openingTimeoutRef.current) {
      clearTimeout(openingTimeoutRef.current);
      openingTimeoutRef.current = null;
    }
    // Reset countdown
    resetCountdown();
    // Reset state
    setDemoActive(false);
    setDemoStep('idle');
    setDemoGender(null);
    stopAudio();
    cancelAnimationFrame(confettiFrameRef.current);
    confetti.reset();
  };

  if (loading) {
    return (
      <div className="min-h-viewport flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-viewport relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900" />

      {/* Subtle accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />

      {/* Main Content */}
      <div className="relative z-10 min-h-viewport flex flex-col">
        <nav aria-label="Main navigation" className="mx-auto w-full max-w-6xl flex justify-between items-center px-5 py-5 sm:px-8">
          <a href="/" className="text-white/90 font-semibold tracking-tight">babyreveal<span className="text-pink-300">.party</span></a>
          <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth?mode=login')} className="min-h-11 px-4 rounded-full border border-white/15 text-sm text-white/80 hover:bg-white/10">
            {isAuthenticated ? 'My reveal' : 'Sign in'}
          </button>
        </nav>

        <main className="flex-1">
          <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-14 md:pt-16 md:pb-20 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-medium text-purple-200 border border-purple-400/25 bg-purple-500/10 rounded-full px-3 py-2 mb-6"><span className="w-1.5 h-1.5 rounded-full bg-pink-300" /> A little secret. A moment for everyone.</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.12] tracking-tight mb-6">Keep the secret.<span className="block mt-2 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">Share the surprise.</span></h1>
              <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-lg">A free online gender reveal. Someone you trust saves the answer in secret. You and your loved ones discover it with a countdown and a shower of confetti.</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')} className="bg-white text-slate-900 rounded-full py-4 px-6 font-semibold hover:bg-white/90 shadow-lg shadow-purple-500/10">{isAuthenticated ? 'Open my reveal' : 'Create my free reveal'} <span aria-hidden="true">↗</span></button>
                <a href="#try-reveal" className="rounded-full py-4 px-6 border border-white/20 text-white/85 hover:bg-white/5 text-center">Try a demo first <span aria-hidden="true">↓</span></a>
              </div>
              <p className="text-white/50 text-xs leading-relaxed mt-4">No payment needed · Your guests don’t need an account</p>
            </div>
            <div id="try-reveal" className="scroll-mt-6 relative rounded-3xl border border-purple-300/20 bg-gradient-to-br from-purple-500/10 via-white/[0.04] to-blue-500/10 p-6 sm:p-8 text-center shadow-2xl shadow-purple-950/20">
              <p className="text-purple-200/80 text-xs font-semibold uppercase tracking-[0.18em] mb-6">See the moment for yourself</p>
              <div className="flex justify-center mb-5"><BoyGirlIcon size={100} /></div>
              <h2 className="text-2xl font-semibold mb-2">A small preview of the big reveal</h2>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">Pick a demo below. You’ll see the countdown, balloons, and celebration.</p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button onClick={() => startDemo('boy')} className="min-h-20 rounded-2xl border border-blue-400/30 bg-blue-500/10 hover:bg-blue-500/20 py-4 px-3 text-blue-200 font-medium"><span aria-hidden="true" className="block text-3xl mb-2">👦</span>Try boy demo</button>
                <button onClick={() => startDemo('girl')} className="min-h-20 rounded-2xl border border-pink-400/30 bg-pink-500/10 hover:bg-pink-500/20 py-4 px-3 text-pink-200 font-medium"><span aria-hidden="true" className="block text-3xl mb-2">👧</span>Try girl demo</button>
              </div>
              <p className="text-white/45 text-xs mt-4">Just a demo. It won’t create or reveal your own surprise.</p>
            </div>
          </section>

          <section aria-labelledby="how-heading" className="border-y border-white/10 bg-white/[0.02]">
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
              <p className="text-purple-300 text-xs uppercase tracking-[0.18em] font-semibold mb-3">From secret to celebration</p>
              <h2 id="how-heading" className="text-2xl sm:text-3xl font-semibold mb-3">Three steps. One unforgettable moment.</h2>
              <p className="text-white/60 mb-8">You don’t need to know the answer. That’s the whole idea.</p>
              <ol className="grid md:grid-cols-3 gap-5">
                {[
                  ['Create your reveal', 'Sign up for free. Your dashboard gives you two different links: one to save the secret, one to reveal it.'],
                  ['Send the Secret Keeper link', 'Copy it and send it to your doctor, a friend, or anyone who knows the answer. They choose Boy or Girl and confirm. It stays hidden from you.'],
                  ['Gather everyone. Reveal!', 'Open your Reveal link at the party. Share it with family joining remotely, choose how everyone watches, and enjoy the countdown together.'],
                ].map(([title, description], i) => <li key={title} className="rounded-2xl border border-white/10 bg-slate-900/40 p-6"><span className="inline-flex w-8 h-8 rounded-full bg-purple-500/15 border border-purple-400/25 text-purple-200 items-center justify-center text-sm mb-5">{i + 1}</span><h3 className="font-semibold text-lg mb-3">{title}</h3><p className="text-white/60 text-sm leading-relaxed">{description}</p></li>)}
              </ol>
            </div>
          </section>

          <section className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16" aria-labelledby="questions-heading">
            <h2 id="questions-heading" className="text-2xl sm:text-3xl font-semibold mb-7">A few things you might be wondering</h2>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {[
                ['Will I accidentally see the answer?', 'Your dashboard only shows whether the answer has been saved. Send the Secret Keeper link to the person who knows, and use the separate Reveal link when you’re ready. A demo never changes your real reveal.'],
                ['Do I need to send an ultrasound or a medical report?', 'No. Someone who already knows the answer opens the Secret Keeper link, selects Boy or Girl, and confirms. There are no documents to upload.'],
                ['Can family join from another place?', 'Yes. Share your Reveal link. In “Everyone reveals together” mode, you start the countdown as the signed-in host and guests watch along. In “Reveal at your own pace” mode, each guest starts their own countdown.'],
                ['Is it really free?', 'Yes. Creating a reveal, themes, countdowns, custom music, and guest links are free. No payment details are required.'],
                ['Can the answer be changed?', 'The Secret Keeper confirms the choice before it locks. Once confirmed, it cannot be changed, so ask them to double-check.'],
              ].map(([question, answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer font-medium text-white/90 min-h-6">{question}</summary><p className="mt-3 text-white/60 text-sm leading-relaxed max-w-2xl">{answer}</p></details>)}
            </div>
            <div className="text-center mt-12"><h2 className="text-2xl font-semibold mb-3">Your surprise starts here.</h2><p className="text-white/60 text-sm mb-6">Create your reveal. We’ll guide you through the next step.</p><button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')} className="bg-white text-slate-900 rounded-full py-4 px-7 font-semibold hover:bg-white/90">{isAuthenticated ? 'Open my reveal' : 'Create my free reveal'}</button></div>
          </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Demo Overlay */}
      <AnimatePresence>
        {demoActive && (
          <DemoOverlay
            step={demoStep}
            gender={demoGender}
            count={count}
            onClose={closeDemo}
            onMoreConfetti={() => triggerDemoConfetti(demoGender)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Demo Overlay Component
function DemoOverlay({ step, gender, count, onClose, onMoreConfetti }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const close = useCallback(() => closeRef.current(), []);
  useDialog(dialogRef, true, close);
  const isBoy = gender === 'boy';

  // Balloon colors
  const colors = isBoy
    ? ['#3b82f6', '#60a5fa', '#2563eb', '#1d4ed8', '#93c5fd']
    : ['#ec4899', '#f472b6', '#db2777', '#be185d', '#fbcfe8'];

  const balloonPositions = [
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
    <motion.div
      ref={dialogRef} role="dialog" aria-modal="true" aria-label="Reveal demo" className="fixed inset-0 z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Close button */}
      <button
        aria-label="Close demo"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white/60 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Demo badge */}
      <div className="absolute top-4 left-4 z-50 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium px-3 py-1.5 rounded-full">
        Demo Mode
      </div>

      {/* Countdown */}
      {step === 'countdown' && (
        <div className="min-h-viewport relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10 text-center">
            <motion.div
              className="text-[12rem] md:text-[16rem] font-bold text-white drop-shadow-2xl"
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {count}
            </motion.div>
          </div>
        </div>
      )}

      {/* Opening animation - flying balloons */}
      {step === 'opening' && (
        <div className={`min-h-viewport w-full fixed inset-0 overflow-hidden ${
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
                      <radialGradient id={`demo-grad-${i}`} cx="35%" cy="30%" r="60%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                        <stop offset="40%" stopColor={colors[pos.color]} stopOpacity="1" />
                        <stop offset="100%" stopColor={colors[pos.color]} stopOpacity="0.9" />
                      </radialGradient>
                      <linearGradient id={`demo-shine-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                        <stop offset="50%" stopColor="white" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <ellipse cx="40" cy="38" rx="34" ry="38" fill={`url(#demo-grad-${i})`} />
                    <ellipse cx="28" cy="26" rx="12" ry="16" fill={`url(#demo-shine-${i})`} />
                    <ellipse cx="24" cy="22" rx="4" ry="5" fill="white" opacity="0.7" />
                    <path d="M36,74 Q40,78 44,74 L42,76 Q40,80 38,76 Z" fill={colors[pos.color]} />
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
        </div>
      )}

      {/* Final reveal */}
      {step === 'reveal' && (
        <div className={`min-h-viewport relative overflow-hidden flex items-center justify-center ${
          isBoy ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900' : 'bg-gradient-to-br from-pink-900 via-pink-800 to-rose-900'
        }`}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute top-20 left-10 w-72 h-72 ${isBoy ? 'bg-blue-400/30' : 'bg-pink-400/30'} rounded-full blur-3xl animate-pulse`} />
            <div className={`absolute bottom-20 right-10 w-96 h-96 ${isBoy ? 'bg-cyan-400/30' : 'bg-rose-400/30'} rounded-full blur-3xl animate-pulse`} />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[600px] ${isBoy ? 'bg-blue-500/20' : 'bg-pink-500/20'} rounded-full blur-3xl`} />
          </div>

          <div className="relative z-10 text-center px-4 py-20">
            <motion.p
              className={`text-2xl md:text-3xl font-medium mb-4 ${isBoy ? 'text-blue-200' : 'text-pink-200'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              It's a
            </motion.p>

            <motion.div
              className="text-9xl md:text-[12rem] mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {isBoy ? '👦' : '👧'}
            </motion.div>

            <motion.h1
              className={`text-6xl md:text-8xl font-bold mb-8 ${isBoy ? 'text-blue-100' : 'text-pink-100'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isBoy ? 'BOY!' : 'GIRL!'}
            </motion.h1>

            {/* Celebration emojis */}
            <div className="flex justify-center gap-4 mb-8">
              {(isBoy
                ? ['🩵', '⭐', '🩵', '⭐', '🩵']
                : ['🩷', '⭐', '🩷', '⭐', '🩷']
              ).map((emoji, i) => (
                <motion.span
                  key={i}
                  className="text-4xl md:text-5xl"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>

            <motion.p
              className={`text-3xl md:text-4xl font-script mb-12 ${isBoy ? 'text-blue-200' : 'text-pink-200'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Congratulations!
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <button
                className={`py-4 px-8 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 ${
                  isBoy
                    ? 'bg-blue-500/30 hover:bg-blue-500/50 text-blue-100 border border-blue-400/30'
                    : 'bg-pink-500/30 hover:bg-pink-500/50 text-pink-100 border border-pink-400/30'
                }`}
                onClick={onMoreConfetti}
              >
                More Confetti!
              </button>
              <button
                className="py-4 px-8 rounded-full font-semibold text-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all duration-300 hover:scale-105"
                onClick={onClose}
              >
                Close Demo
              </button>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Home;
