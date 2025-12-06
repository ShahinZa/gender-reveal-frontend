import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { genderService } from '../api';
import { useCountdown, useAudio } from '../hooks';
import { Button, Card, Spinner, Alert } from '../components/common';
import './RevealPage.css';

/**
 * Reveal Page
 * Beautiful gender reveal with animations
 */
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
    }, 2000);
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

    // Play celebration sound
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
      <div className="reveal-container">
        <Spinner size="large" />
      </div>
    );
  }

  // Not ready
  if (step === 'not-ready') {
    return (
      <div className="reveal-container">
        <Card>
          <Card.Icon>⏳</Card.Icon>
          <Card.Title>Not Ready Yet</Card.Title>
          <Card.Subtitle>
            The doctor hasn't selected the gender yet.
            Please check back later.
          </Card.Subtitle>
          <Button variant="secondary" fullWidth onClick={checkStatus}>
            Refresh
          </Button>
        </Card>
      </div>
    );
  }

  // Error
  if (step === 'error') {
    return (
      <div className="reveal-container">
        <Card>
          <Card.Icon>⚠️</Card.Icon>
          <Card.Title>Error</Card.Title>
          <Alert variant="error">{error}</Alert>
          <Button variant="secondary" fullWidth onClick={checkStatus}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // Ready
  if (step === 'ready') {
    return (
      <div className="reveal-container ready-bg">
        <div className="ready-content animate-fadeIn">
          <h1 className="ready-title">Ready?</h1>
          <p className="ready-subtitle">
            The moment you've been waiting for...
          </p>

          <div className="gift-box animate-float">🎁</div>

          <Button
            size="large"
            className="open-button animate-pulse"
            onClick={startReveal}
            loading={loading}
          >
            Open the Box
          </Button>

          <p className="tip">Cast to TV for the best experience</p>
        </div>
      </div>
    );
  }

  // Countdown
  if (step === 'countdown') {
    return (
      <div className="reveal-container countdown-bg">
        <div className="countdown-content">
          <div className="countdown-number">{count}</div>
        </div>
      </div>
    );
  }

  // Opening animation
  if (step === 'opening') {
    return (
      <div className="reveal-container opening-bg">
        <div className="box-animation">
          <div className="box">
            <div className="box-lid"></div>
            <div className="box-body"></div>
            <div className={`balloons ${gender}`}>
              <span>🎈</span>
              <span>🎈</span>
              <span>🎈</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Final reveal
  if (step === 'reveal') {
    return (
      <div className={`reveal-container final-bg ${gender}`}>
        <div className="final-content animate-fadeIn">
          <p className="its-a">It's a</p>
          <div className="reveal-icon">
            {gender === 'boy' ? '👦' : '👧'}
          </div>
          <h1 className="reveal-text">
            {gender === 'boy' ? 'BOY!' : 'GIRL!'}
          </h1>

          <div className="celebration">
            {['🎉', '✨', '💖', '🎊', '⭐'].map((emoji, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>{emoji}</span>
            ))}
          </div>

          <p className="congrats">Congratulations!</p>

          <Button
            variant="ghost"
            className="again-button"
            onClick={() => triggerConfetti(gender)}
          >
            🎊 More Confetti!
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

export default RevealPage;
