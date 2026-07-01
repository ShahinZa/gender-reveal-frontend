import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import RevealSettings from '../components/RevealSettings';
import authService from '../api/authService';
import Footer from '../components/Footer';

function Dashboard() {
  const navigate = useNavigate();
  const { user, status, logout, isAuthenticated, loading, refreshStatus } = useAuth();
  const [copied, setCopied] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showQR, setShowQR] = useState(null);

  // Password protection state
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Reveal preferences state
  const [syncedReveal, setSyncedReveal] = useState(false);
  const revealSettingsRef = useRef(null);

  // Handle preference changes from RevealSettings
  const handlePreferencesChange = (newPrefs) => {
    if (typeof newPrefs.syncedReveal !== 'undefined') {
      setSyncedReveal(newPrefs.syncedReveal);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshStatus();
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshStatus();
      // Load password protection status
      authService.getRevealPasswordStatus().then((data) => {
        if (data.success) {
          setPasswordEnabled(data.enabled);
          setShowPasswordSection(data.enabled);
        }
      }).catch(() => {});
      // Load preferences for synced reveal indicator
      authService.getPreferences().then((data) => {
        if (data.preferences) {
          setSyncedReveal(data.preferences.syncedReveal || false);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handlePasswordSave = async () => {
    if (showPasswordSection && passwordInput.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      return;
    }
    setPasswordError('');
    setPasswordSaving(true);
    try {
      const result = await authService.setRevealPassword(
        showPasswordSection ? passwordInput : null,
        showPasswordSection
      );
      if (result.success) {
        setPasswordEnabled(result.enabled);
        if (!result.enabled) {
          setPasswordInput('');
        }
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to save');
    } finally {
      setPasswordSaving(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getLink = (type) => {
    const code = type === 'doctor' ? user.doctorCode : user.revealCode;
    const baseUrl = window.location.origin;
    const path = type === 'doctor' ? 'secret' : 'reveal';
    return `${baseUrl}/${path}/${code}`;
  };

  const copyLink = (type) => {
    copyToClipboard(getLink(type), type);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const getStatusConfig = () => {
    if (status?.isRevealed) {
      return {
        icon: '🎉',
        text: 'Revealed!',
        bgClass: 'from-pink-500/20 to-purple-500/20',
        borderClass: 'border-pink-400/30',
      };
    }
    if (status?.isSet) {
      return {
        icon: '✓',
        text: 'Ready to reveal',
        bgClass: 'from-emerald-500/20 to-teal-500/20',
        borderClass: 'border-emerald-400/30',
      };
    }
    return {
      icon: '⏳',
      text: 'Waiting for selection',
      bgClass: 'from-amber-500/20 to-orange-500/20',
      borderClass: 'border-amber-400/30',
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 min-h-screen px-4 py-6 md:py-12">
        <div className="max-w-2xl mx-auto animate-fade-in">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/'); }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <span className="text-white/70 text-sm hidden sm:block">{user.email}</span>
            </div>
            <button
              className="text-white/60 hover:text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/10 transition-all"
              onClick={() => { logout(); navigate('/'); }}
            >
              Sign Out
            </button>
          </header>

          {/* Welcome + guided next step */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Your Gender Reveal</h1>
            <p className="text-white/60">
              {status?.isRevealed
                ? 'Congratulations! The big moment has happened. 🎉'
                : status?.isSet
                  ? "The gender's locked in and hidden. Reveal it at your party!"
                  : "You're almost set. Just one quick step to go."}
            </p>
          </div>

          {/* Progress stepper */}
          <div className="flex items-center justify-center mb-8">
            {[
              { n: 1, label: 'Share link', done: !!status?.isSet, active: !status?.isSet },
              { n: 2, label: 'Gender set', done: !!status?.isSet, active: false },
              { n: 3, label: 'Reveal', done: !!status?.isRevealed, active: !!status?.isSet && !status?.isRevealed },
            ].map((step, i) => (
              <React.Fragment key={step.n}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step.done
                        ? 'bg-emerald-500 text-white'
                        : step.active
                          ? 'bg-white text-slate-900 ring-4 ring-white/20'
                          : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {step.done ? '✓' : step.n}
                  </div>
                  <span className={`text-[11px] ${step.active || step.done ? 'text-white/80' : 'text-white/40'}`}>
                    {step.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`h-0.5 flex-1 max-w-[64px] mx-2 mb-5 rounded-full ${step.done ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next-step guidance card */}
          {status?.isRevealed ? (
            <div className="bg-gradient-to-br from-pink-500/15 to-purple-500/15 backdrop-blur-xl rounded-2xl border border-pink-400/25 p-6 mb-8 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-white font-bold text-xl mb-2">You&apos;ve revealed!</h2>
              <p className="text-white/60 text-sm">
                Hope it was magical. Your reveal data is automatically deleted 60 days after the reveal date for your privacy.
              </p>
            </div>
          ) : status?.isSet ? (
            <div className="bg-gradient-to-br from-emerald-500/[0.12] to-teal-500/[0.08] backdrop-blur-xl rounded-3xl border border-emerald-400/25 p-6 md:p-8 mb-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-300/90 mb-2">
                Step 3
              </span>
              <h2 className="text-white font-bold text-xl md:text-2xl mb-2">The gender is locked in</h2>
              <p className="text-white/55 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                It&apos;s hidden and safe. When everyone is together at your party, open The Big Reveal for the confetti moment.
              </p>
              <button
                className="w-full py-4 rounded-2xl font-semibold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 hover:shadow-xl hover:shadow-amber-400/30 transition-all text-lg hover:scale-[1.01] mb-3"
                onClick={() => navigate(`/reveal/${user.revealCode}`)}
              >
                Open The Big Reveal
              </button>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => copyLink('reveal')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 text-xs font-medium transition-all"
                >
                  {copied === 'reveal' ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Copy reveal link
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowQR('reveal')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 text-xs font-medium transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  QR code
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-white/[0.12] to-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/15 p-6 md:p-8 mb-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-pink-500/15 border border-pink-400/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.15em] text-pink-300/90 mb-2">
                Step 1
              </span>
              <h2 className="text-white font-bold text-xl md:text-2xl mb-2">Get the gender locked in</h2>
              <p className="text-white/55 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                Tap the button below, then hand your phone to whoever knows (your doctor, nurse, or a friend).
                They pick <span className="text-white font-medium">Boy</span> or{' '}
                <span className="text-white font-medium">Girl</span>, and it stays secret until your big reveal.
              </p>
              <div className="inline-flex flex-col items-stretch gap-4 max-w-full">
              <button
                className="group relative py-4 px-6 rounded-2xl font-bold bg-gradient-to-r from-slate-100 via-white to-slate-100 text-slate-900 shadow-lg shadow-black/20 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] overflow-hidden"
                onClick={() => window.open(`${window.location.origin}/secret/${user.doctorCode}`, '_blank')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                <span className="relative flex items-center justify-center gap-2.5">
                  <svg
                    className="w-5 h-5 text-pink-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="14" height="20" x="5" y="2" rx="2.5" />
                    <path d="M12 18h.01" />
                  </svg>
                  <span className="text-base">Open &amp; hand it over</span>
                  <svg
                    className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </button>
              <div>
                <p className="text-white/45 text-xs text-center mb-2.5">
                  Not in the same room? Share the link or QR code instead.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => copyLink('doctor')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 text-xs font-medium transition-all"
                >
                  {copied === 'doctor' ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Copy link
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowQR('doctor')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 text-xs font-medium transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  QR code
                </button>
                </div>
              </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-xs text-white/45">
                <span>Waiting on their pick? This page updates on its own, or</span>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1 text-white/75 hover:text-white font-medium transition-colors disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  {refreshing ? 'checking…' : 'check now'}
                </button>
              </div>
            </div>
          )}

          {/* Your two links */}
          <div className="mb-4">
            <h3 className="text-white font-semibold text-base">Your two links</h3>
            <p className="text-white/45 text-sm">Both stay here the whole time. Share whichever you need.</p>
          </div>

          {/* Code Cards */}
          <div className="grid gap-2.5 mb-8">
            {/* Secret Keeper Code */}
            <div className={`flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-2xl p-2.5 pl-3 ${status?.isSet ? 'opacity-60' : ''}`}>
              <span className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-400/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </span>
              <div className="w-32 sm:w-40 flex-shrink-0 min-w-0">
                <p className="text-white font-medium text-sm leading-tight truncate">The Secret Keeper</p>
                <p className="text-white/40 text-[11px] leading-tight truncate">{status?.isSet ? 'Locked · Step 1' : 'For whoever knows · Step 1'}</p>
              </div>
              <div
                className={`flex-1 min-w-0 text-center bg-black/25 rounded-lg px-3 py-2 transition-all ${!status?.isSet ? 'cursor-pointer hover:bg-black/35' : ''}`}
                onClick={() => !status?.isSet && copyLink('doctor')}
              >
                <code className="text-white/90 font-mono text-sm tracking-wider">{user.doctorCode}</code>
              </div>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 flex-shrink-0 transition-all ${
                  status?.isSet ? 'bg-white/5 text-white/40 cursor-not-allowed' : 'bg-white text-slate-900 hover:bg-white/90'
                }`}
                onClick={() => copyLink('doctor')}
                disabled={status?.isSet}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {copied === 'doctor' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  )}
                </svg>
                <span className="hidden sm:inline">{copied === 'doctor' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                className={`p-2 rounded-lg flex-shrink-0 transition-all ${status?.isSet ? 'bg-white/5 text-white/40 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'}`}
                onClick={() => !status?.isSet && setShowQR('doctor')}
                disabled={status?.isSet}
                title="Show QR Code"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>
            </div>

            {/* Step 2 (they pick) */}
            <div className="flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-2xl p-2.5 pl-3">
              <span className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-400/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {status?.isSet ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm leading-tight">They pick the gender</p>
                <p className="text-white/40 text-[11px] leading-tight">{status?.isSet ? 'Locked in and hidden · Step 2' : 'Locks in automatically once they choose · Step 2'}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${status?.isSet ? 'text-emerald-300 bg-emerald-500/10' : 'text-amber-300 bg-amber-500/10'}`}>
                {status?.isSet ? 'Locked' : 'Waiting'}
              </span>
            </div>

            {/* Reveal Code */}
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-2.5 pl-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112-2h.01L12 8zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </span>
                <div className="w-32 sm:w-40 flex-shrink-0 min-w-0">
                  <p className="text-white font-medium text-sm leading-tight truncate">The Big Reveal</p>
                  <p className="text-white/40 text-[11px] leading-tight truncate">At your party · Step 3</p>
                </div>
                <div
                  className="flex-1 min-w-0 text-center bg-black/25 rounded-lg px-3 py-2 cursor-pointer hover:bg-black/35 transition-all"
                  onClick={() => copyLink('reveal')}
                >
                  <code className="text-white/90 font-mono text-sm tracking-wider">{user.revealCode}</code>
                </div>
                <button
                  className="px-3 py-2 rounded-lg text-sm font-semibold bg-white text-slate-900 hover:bg-white/90 flex items-center gap-1.5 flex-shrink-0 transition-all"
                  onClick={() => copyLink('reveal')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {copied === 'reveal' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    )}
                  </svg>
                  <span className="hidden sm:inline">{copied === 'reveal' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 flex-shrink-0 transition-all"
                  onClick={() => setShowQR('reveal')}
                  title="Show QR Code"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </button>
                <button
                  className={`p-2 rounded-lg flex-shrink-0 transition-all ${
                    passwordEnabled
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : showPasswordSection
                        ? 'bg-white/15 text-white'
                        : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                  onClick={() => !passwordEnabled && setShowPasswordSection(!showPasswordSection)}
                  title={passwordEnabled ? 'Password protected' : 'Password protect this reveal'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </button>
              </div>

              {/* Reveal mode + password footer */}
              <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2.5">
                {/* Reveal mode toggle (drives the single source of truth in RevealSettings) */}
                <button
                  onClick={() => revealSettingsRef.current?.setSyncedReveal(!syncedReveal)}
                  className={`w-full flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl border transition-all ${
                    syncedReveal ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <svg className={`w-4 h-4 flex-shrink-0 ${syncedReveal ? 'text-purple-300' : 'text-white/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {syncedReveal ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      )}
                    </svg>
                    <div className="text-left min-w-0">
                      <p className={`text-sm font-medium leading-tight ${syncedReveal ? 'text-white' : 'text-white/75'}`}>
                        {syncedReveal ? 'Everyone reveals together' : 'Reveal at your own pace'}
                      </p>
                      <p className={`text-[11px] leading-tight mt-0.5 ${syncedReveal ? 'text-purple-300/70' : 'text-white/40'}`}>
                        {syncedReveal ? 'All viewers see it live at the same moment' : 'Each guest controls their own reveal moment'}
                      </p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${syncedReveal ? 'bg-purple-500' : 'bg-white/20'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${syncedReveal ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </button>

                {/* Password (expands from the lock button) */}
                {showPasswordSection && !passwordEnabled && (
                  <div className="animate-fade-in">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs mb-2">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Guests will enter this to open the reveal.
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Set a password (4+ characters)"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && passwordInput.length >= 4 && handlePasswordSave()}
                        className="flex-1 min-w-0 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/15"
                        autoFocus
                      />
                      <button
                        onClick={handlePasswordSave}
                        disabled={passwordSaving || passwordInput.length < 4}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-slate-900 hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {passwordSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setShowPasswordSection(false); setPasswordInput(''); }}
                        className="px-2 text-white/40 hover:text-white/70 text-sm flex-shrink-0"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
                {passwordEnabled && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
                    <span className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Password protected
                    </span>
                    <button
                      onClick={() => {
                        authService.setRevealPassword(null, false).then((res) => {
                          if (res.success) {
                            setPasswordEnabled(false);
                            setPasswordInput('');
                          }
                        });
                      }}
                      className="text-white/50 hover:text-white/80 text-xs font-medium flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reveal Settings - Below code cards for better flow */}
          <div className="mb-8">
            <RevealSettings
              ref={revealSettingsRef}
              isGenderSet={status?.isSet}
              revealCode={user?.revealCode}
              onPreferencesChange={handlePreferencesChange}
            />
          </div>

          {/* Primary action now lives in the guided next-step card at the top */}

          {/* How it works / live progress */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-1">How it works</h3>
            <p className="text-white/50 text-sm mb-5">
              Three steps from setup to the big moment. Completed steps are checked off.
            </p>
            <ol>
              {[
                {
                  title: 'Share the Secret Keeper link',
                  desc: 'Send it to whoever knows the gender, or hand them your phone.',
                  done: !!status?.isSet,
                  active: !status?.isSet,
                },
                {
                  title: 'They tap Boy or Girl',
                  desc: "It locks in and stays hidden, even from you, until the reveal.",
                  done: !!status?.isSet,
                  active: false,
                },
                {
                  title: 'Open The Big Reveal at your party',
                  desc: 'A countdown, confetti, and the big moment together.',
                  done: !!status?.isRevealed,
                  active: !!status?.isSet && !status?.isRevealed,
                },
              ].map((step, i, arr) => (
                <li key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all ${
                        step.done
                          ? 'bg-emerald-500 text-white'
                          : step.active
                            ? 'bg-white text-slate-900 ring-4 ring-white/10'
                            : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {step.done ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </span>
                    {i < arr.length - 1 && (
                      <span className={`w-0.5 flex-1 min-h-[18px] my-1 rounded-full ${step.done ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
                    )}
                  </div>
                  <div className={`pb-5 ${step.done ? 'opacity-55' : ''}`}>
                    <p className="text-white font-medium text-sm flex items-center gap-2">
                      {step.title}
                      {step.done && (
                        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Done</span>
                      )}
                      {step.active && (
                        <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">You are here</span>
                      )}
                    </p>
                    <p className="text-white/55 text-sm mt-0.5">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowQR(null)}
        >
          <div
            className="bg-slate-900 rounded-3xl border border-white/10 p-8 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{showQR === 'doctor' ? '🤫' : '🎁'}</span>
                <h3 className="text-white font-semibold text-xl">
                  {showQR === 'doctor' ? 'The Secret Keeper' : 'The Big Reveal'}
                </h3>
              </div>
              <p className="text-white/50 text-sm mb-6">
                Scan to open on another device
              </p>

              <div className="bg-white rounded-2xl p-4 inline-block mb-6">
                <QRCodeSVG
                  value={getLink(showQR)}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="text-white/40 text-xs mb-6 font-mono break-all px-2">
                {getLink(showQR)}
              </p>

              <div className="flex gap-3">
                <button
                  className="flex-1 py-3 rounded-xl font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                  onClick={() => setShowQR(null)}
                >
                  Close
                </button>
                <button
                  className="flex-1 py-3 rounded-xl font-medium bg-white text-slate-900 hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                  onClick={() => copyLink(showQR)}
                >
                  {copied === showQR ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Dashboard;
