import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useCountdown, useAudio } from '../hooks';
import { BoyGirlIcon } from '../components/GenderIcons';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  // Demo state
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState('idle'); // idle, countdown, opening, reveal
  const [demoGender, setDemoGender] = useState(null);
  const demoActiveRef = useRef(false);
  const openingTimeoutRef = useRef(null);

  const { playDrumroll, playCelebration, stopAudio } = useAudio();

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

  const startDemo = (gender) => {
    demoActiveRef.current = true;
    setDemoGender(gender);
    setDemoActive(true);
    setDemoStep('countdown');
    playDrumroll();
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
    // Clear any running confetti
    confetti.reset();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900" />

      {/* Subtle accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="flex justify-between items-center px-6 py-4 md:px-12 md:py-6">
          <div className="text-white/90 font-semibold text-lg">
            babyreveal.party
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          )}
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-2xl text-center">
            {/* Icon */}
            <div className="mb-8 flex justify-center">
              <BoyGirlIcon size={88} />
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              All the magic.
              <span className="block mt-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent leading-normal">
                None of the risk.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/60 mb-8 max-w-lg mx-auto leading-relaxed">
              The modern gender reveal. Safe, stunning, and shareable with everyone you love.
            </p>

            {/* Why Digital - Enhanced Feature Grid */}
            <div className="mb-12 max-w-3xl mx-auto">
              <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-6">
                Why families choose digital
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Encrypted */}
                <div className="group relative bg-gradient-to-br from-white/[0.07] to-white/[0.03] backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-purple-400/30 transition-all duration-300 hover:scale-[1.02] text-center">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 mx-auto">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-white font-semibold text-sm mb-1">Encrypted</h2>
                  <p className="text-white/50 text-xs leading-relaxed">Secret stays hidden until you're ready</p>
                </div>

                {/* Eco-friendly */}
                <div className="group relative bg-gradient-to-br from-white/[0.07] to-white/[0.03] backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-emerald-400/30 transition-all duration-300 hover:scale-[1.02] text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 mx-auto">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h2 className="text-white font-semibold text-sm mb-1">Zero waste</h2>
                  <p className="text-white/50 text-xs leading-relaxed">No balloons, plastic, or cleanup needed</p>
                </div>

                {/* Safe */}
                <div className="group relative bg-gradient-to-br from-white/[0.07] to-white/[0.03] backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-orange-400/30 transition-all duration-300 hover:scale-[1.02] text-center">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 mx-auto">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-white font-semibold text-sm mb-1">100% safe</h2>
                  <p className="text-white/50 text-xs leading-relaxed">No pyrotechnics, smoke, or fire hazards</p>
                </div>

                {/* Share anywhere */}
                <div className="group relative bg-gradient-to-br from-white/[0.07] to-white/[0.03] backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-blue-400/30 transition-all duration-300 hover:scale-[1.02] text-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 mx-auto">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-white font-semibold text-sm mb-1">Include everyone</h2>
                  <p className="text-white/50 text-xs leading-relaxed">Family abroad joins live via link</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mb-16">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <button
                    className="bg-white text-slate-900 font-semibold py-4 px-8 rounded-full hover:bg-white/90 transition-all duration-200 shadow-lg shadow-white/10"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      className="bg-white text-slate-900 font-semibold py-4 px-8 rounded-full hover:bg-white/90 transition-all duration-200 shadow-lg shadow-white/10"
                      onClick={() => navigate('/auth')}
                    >
                      Get Started Free
                    </button>
                    <button
                      className="text-white/80 font-medium py-4 px-8 rounded-full border border-white/20 hover:bg-white/5 hover:border-white/30 transition-all duration-200"
                      onClick={() => navigate('/auth?mode=login')}
                    >
                      I have an account
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Our Promise */}
            <div className="mb-16 max-w-2xl mx-auto">
              <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-6">
                Our promise to you
              </p>
              <div className="relative rounded-2xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 border border-emerald-400/20">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-2xl" />
                <div className="relative px-6 py-5 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
                  {/* Free Forever */}
                  <div className="group/free relative cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover/free:bg-emerald-500/30 transition-colors duration-300">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm flex items-center gap-1.5">
                          100% Free Forever
                          <svg className="w-3.5 h-3.5 text-white/30 group-hover/free:text-emerald-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </p>
                        <p className="text-white/40 text-xs">No hidden costs</p>
                      </div>
                    </div>
                    {/* Hover Popover */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-72 opacity-0 invisible group-hover/free:opacity-100 group-hover/free:visible transition-all duration-300 z-50 pointer-events-none group-hover/free:pointer-events-auto">
                      <div className="relative bg-slate-800/95 backdrop-blur-xl rounded-xl p-4 border border-emerald-500/20 shadow-xl shadow-black/20">
                        {/* Arrow */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800/95 border-l border-t border-emerald-500/20 rotate-45" />
                        <p className="text-white/80 text-sm leading-relaxed relative">
                          We built this for our own gender reveal and loved it so much, we decided to share it with the world. Completely free, forever.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px h-10 bg-white/10" />

                  {/* Privacy */}
                  <div className="group/privacy relative cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover/privacy:bg-emerald-500/30 transition-colors duration-300">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm flex items-center gap-1.5">
                          Private by Design
                          <svg className="w-3.5 h-3.5 text-white/30 group-hover/privacy:text-emerald-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </p>
                        <p className="text-white/40 text-xs">No tracking or data sales</p>
                      </div>
                    </div>
                    {/* Hover Popover */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-72 opacity-0 invisible group-hover/privacy:opacity-100 group-hover/privacy:visible transition-all duration-300 z-50 pointer-events-none group-hover/privacy:pointer-events-auto">
                      <div className="relative bg-slate-800/95 backdrop-blur-xl rounded-xl p-4 border border-emerald-500/20 shadow-xl shadow-black/20">
                        {/* Arrow */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800/95 border-l border-t border-emerald-500/20 rotate-45" />
                        <p className="text-white/80 text-sm leading-relaxed relative">
                          Built by a Computer Science PhD researcher who genuinely cares about privacy. Your moments are yours alone. Never tracked, analyzed, or sold.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="mb-16">
              <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-8">
                How it works
              </p>
              <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 font-medium text-sm">
                    1
                  </div>
                  <h3 className="text-white font-medium">Sign up</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Create an account and get two links.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 font-medium text-sm">
                  2
                </div>
                <h3 className="text-white font-medium">Someone picks</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Send a link or hand your phone to whoever knows the gender. They tap Boy or Girl.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 font-medium text-sm">
                  3
                </div>
                <h3 className="text-white font-medium">Reveal together</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Open your Reveal link at the party. Find out together!
                </p>
              </div>
              </div>
            </div>

            {/* Demo Section */}
            <div className="mt-20 pt-12 border-t border-white/10">
              <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-6">
                Try it now
              </p>

              <div className="flex gap-4 justify-center items-center mb-8">
                <button
                  onClick={() => startDemo('boy')}
                  className="group w-28 h-28 rounded-2xl bg-blue-500/10 border border-blue-400/20 hover:border-blue-400/50 hover:bg-blue-500/20 transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">👦</span>
                  <span className="text-blue-300 text-sm font-medium">Boy</span>
                </button>

                <button
                  onClick={() => startDemo('girl')}
                  className="group w-28 h-28 rounded-2xl bg-pink-500/10 border border-pink-400/20 hover:border-pink-400/50 hover:bg-pink-500/20 transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">👧</span>
                  <span className="text-pink-300 text-sm font-medium">Girl</span>
                </button>
              </div>

              <p className="text-center text-white/40 text-sm mb-2">
                Customize themes, emojis, sounds & more after signup
              </p>
              <p className="text-center text-white/30 text-xs">
                Supports twins & triplets
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/5">
          <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-white/25 text-xs">Made with ❤️ in Canada</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/about')}
                className="text-white/25 hover:text-white/50 text-xs transition-colors"
              >
                About Us
              </button>
              <button
                onClick={() => navigate('/privacy')}
                className="text-white/25 hover:text-white/50 text-xs transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => navigate('/disclaimer')}
                className="text-white/25 hover:text-white/50 text-xs transition-colors"
              >
                Terms
              </button>
            </div>
            <span className="text-white/25 text-xs">&copy; 2025 babyreveal.party</span>
          </div>
        </footer>
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
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Close button */}
      <button
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
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
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
        <div className={`min-h-screen relative overflow-hidden flex items-center justify-center ${
          isBoy ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900' : 'bg-gradient-to-br from-pink-900 via-pink-800 to-rose-900'
        }`}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute top-20 left-10 w-72 h-72 ${isBoy ? 'bg-blue-400/30' : 'bg-pink-400/30'} rounded-full blur-3xl animate-pulse`} />
            <div className={`absolute bottom-20 right-10 w-96 h-96 ${isBoy ? 'bg-cyan-400/30' : 'bg-rose-400/30'} rounded-full blur-3xl animate-pulse`} />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[600px] ${isBoy ? 'bg-blue-500/20' : 'bg-pink-500/20'} rounded-full blur-3xl`} />
          </div>

          <div className="relative z-10 text-center">
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
