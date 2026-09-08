import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import RevealSettings from '../components/RevealSettings';
import authService from '../api/authService';
import Footer from '../components/Footer';
import useDialog from '../hooks/useDialog';

function Dashboard() {
  const navigate = useNavigate();
  const { user, status, logout, isAuthenticated, loading, refreshStatus, authError, retryAuth } = useAuth();
  const [copied, setCopied] = useState(null);
  const [copying, setCopying] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [statusError, setStatusError] = useState('');
  const copyTimer = useRef(null);
  const qrRef = useRef(null);
  const closeQR = useCallback(() => setShowQR(null), []);
  useDialog(qrRef, !!showQR, closeQR);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

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
    setStatusError('');
    try { await refreshStatus(); } catch (error) { setStatusError(error.message); }
    finally { setRefreshing(false); }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated && !authError) {
      navigate('/auth');
    }
  }, [isAuthenticated, loading, navigate, authError]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshStatus().catch(error => setStatusError(error.message));
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

  const copyToClipboard = async (text, type) => {
    if (copying) return;
    setCopying(type);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setFeedback(type === 'doctor' ? 'Link copied. Paste it into a message to your secret keeper.' : 'Reveal link copied. Paste it into a message to your guests.');
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 3000);
    } catch { setFeedback('Copying is unavailable in this browser. Select and copy the link shown in the QR panel.'); setShowQR(type); }
    finally { setCopying(null); }
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

  const openPreview = async (event, gender) => {
    event.preventDefault();
    const tab = window.open('about:blank', '_blank');
    if (!tab) { setFeedback('Allow pop-ups to open your preview.'); return; }
    tab.opener = null;
    if (await revealSettingsRef.current?.flush()) {
      tab.location.href = `/reveal/${user.revealCode}?preview=true&gender=${gender}`;
    } else {
      tab.close();
      setFeedback('Your settings haven’t saved yet. Retry the save below before opening your preview.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-viewport flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (authError && !user) return <div className="min-h-viewport flex items-center justify-center p-5"><div className="max-w-sm text-center"><h1 className="text-2xl font-semibold mb-3">Let’s reconnect</h1><p role="alert" className="text-white/70 mb-6">{authError} Your sign-in is saved.</p><button onClick={retryAuth} className="btn-primary">Try again</button></div></div>;
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
    <div className="min-h-viewport relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 min-h-viewport px-4 py-6 md:py-12">
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
                  : "Your reveal is created. Now let’s save the secret."}
            </p>
          </div>

          {feedback && <p role="status" className="rounded-xl bg-purple-500/10 border border-purple-400/20 px-4 py-3 mb-5 text-sm text-purple-100">{feedback}</p>}
          {statusError && <div role="alert" className="rounded-xl border border-amber-400/25 px-4 py-3 mb-5 text-sm text-amber-100">Status couldn’t refresh: {statusError} <button className="underline ml-2 min-h-11" onClick={handleRefresh}>Try again</button></div>}
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
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-white font-bold text-xl md:text-2xl mb-1.5">You&apos;ve revealed!</h2>
              <p className="text-white/65 text-sm mb-5">
                Hope it was absolutely magical. Congratulations!
              </p>

              {/* Missed someone? compact share */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  onClick={() => copyLink('reveal')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-white/90 transition-all"
                >
                  {copied === 'reveal' ? (
                    <>
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      Share reveal link
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowQR('reveal')}
                  className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                  title="Show QR code"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                </button>
              </div>
              <p className="text-white/45 text-xs max-w-xs mx-auto leading-relaxed">
                Missed someone? Your reveal link stays live for 60 days, then the saved gender result is deleted. Your account remains available.
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
                onClick={async () => { if (await revealSettingsRef.current?.flush()) navigate(`/reveal/${user.revealCode}`); else setFeedback('Your settings haven’t saved yet. Retry the save below before opening your reveal.'); }}
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
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      Share reveal link
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
              <h2 className="text-white font-bold text-xl md:text-2xl mb-2">Send this to your secret keeper</h2>
              <p className="text-white/55 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                Copy your private link and send it to your doctor, a friend, or anyone who already knows the answer.
                They pick <span className="text-white font-medium">Boy</span> or{' '}
                <span className="text-white font-medium">Girl</span>, and it stays secret until your big reveal.
              </p>
              <div className="flex flex-col items-stretch gap-4 w-full max-w-md mx-auto">
              <button
                type="button"
                disabled={copying === 'doctor'}
                className="w-full min-h-14 flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-white/80 bg-white text-slate-900 font-semibold shadow-sm hover:bg-purple-50 active:bg-purple-100 transition-colors disabled:cursor-wait"
                onClick={() => copyLink('doctor')}
              >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 shrink-0 text-purple-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {copied === 'doctor' ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>}
                  </svg>
                  <span className="text-sm sm:text-base leading-snug">{copying === 'doctor' ? 'Copying…' : copied === 'doctor' ? 'Link copied' : 'Copy Secret Keeper link'}</span>
              </button>
              <div>
                <p className="text-white/45 text-xs text-center mb-2.5">
                  {copied === 'doctor' ? 'Now paste it into a message to your secret keeper.' : 'Only send this link to the person saving the answer. Your guests get a different link.'}
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => window.open(getLink('doctor'), '_blank', 'noopener,noreferrer')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 text-xs font-medium transition-all"
                >
                  <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2.5" strokeWidth="2" /><path d="M12 18h.01" strokeWidth="2" strokeLinecap="round" /></svg>
                  Open for someone beside me
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
                <span>Waiting on their pick? Their answer stays hidden. You can</span>
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

          {/* Guest invitation */}
          <div className="mb-4">
            <h3 className="text-white font-semibold text-base">For your guests</h3>
            <p className="text-white/45 text-sm">Share this reveal link with family and friends. They don’t need an account.</p>
          </div>

          {/* Code Cards */}
          <div className="grid gap-2.5 mb-8">
            {/* Reveal Code */}
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-2.5 pl-3">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 gap-y-2">
                <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112-2h.01L12 8zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </span>
                <div className="flex-1 sm:flex-none sm:w-40 min-w-0">
                  <p className="text-white font-medium text-sm leading-tight truncate">Guest reveal link</p>
                  <p className="text-white/40 text-[11px] leading-tight truncate">Open together at your party</p>
                </div>
                <div className="w-full sm:w-auto sm:flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
                  <button
                    className="flex-1 min-h-11 px-3 py-2 rounded-lg text-sm font-semibold bg-white text-slate-900 hover:bg-white/90 flex items-center justify-center gap-2 transition-colors"
                    onClick={() => copyLink('reveal')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {copied === 'reveal' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      )}
                    </svg>
                    <span>{copied === 'reveal' ? 'Link copied' : 'Copy guest link'}</span>
                  </button>
                  <button
                    className="min-w-11 min-h-11 p-3 rounded-lg bg-white/10 text-white hover:bg-white/20 flex-shrink-0 transition-colors"
                    onClick={() => setShowQR('reveal')}
                    aria-label="Show guest QR code"
                    title="Show QR Code"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </button>
                  <button
                    className={`min-w-11 min-h-11 p-3 rounded-lg flex-shrink-0 transition-colors ${
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
              </div>

              {/* Reveal mode + password footer */}
              <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2.5">
                {/* Reveal mode toggle (drives the single source of truth in RevealSettings) */}
                <button
                  role="switch"
                  aria-label="Reveal together with guests"
                  aria-checked={syncedReveal}
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

                {passwordError && <p role="alert" className="text-red-200 text-sm">{passwordError}</p>}
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
                        aria-label="Set reveal password"
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
                        setPasswordSaving(true);
                        setPasswordError('');
                        authService.setRevealPassword(null, false).then((res) => {
                          if (res.success) {
                            setPasswordEnabled(false);
                            setShowPasswordSection(false);
                            setPasswordInput('');
                          }
                        }).catch(error => setPasswordError(error.message)).finally(() => setPasswordSaving(false));
                      }}
                      disabled={passwordSaving}
                      className="text-white/50 hover:text-white/80 text-xs font-medium flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-5 mb-6">
            <h2 className="font-semibold mb-2">Try it before the big day</h2>
            <p className="text-white/60 text-sm mb-4">See a sample reveal. It won’t show or change your real answer.</p>
            <div className="flex gap-3"><a className="flex-1 text-center rounded-xl border border-blue-400/25 bg-blue-500/10 text-blue-200 py-3 text-sm" href={`/reveal/${user.revealCode}?preview=true&gender=boy`} onClick={event => openPreview(event, 'boy')} target="_blank" rel="noreferrer">Boy preview</a><a className="flex-1 text-center rounded-xl border border-pink-400/25 bg-pink-500/10 text-pink-200 py-3 text-sm" href={`/reveal/${user.revealCode}?preview=true&gender=girl`} onClick={event => openPreview(event, 'girl')} target="_blank" rel="noreferrer">Girl preview</a></div>
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

        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowQR(null)}
        >
          <div
            ref={qrRef} role="dialog" aria-modal="true" aria-label="Share link with QR code" className="bg-slate-900 rounded-3xl border border-white/10 p-5 sm:p-8 max-w-sm w-full shadow-2xl max-h-[90svh] overflow-y-auto"
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
                  size={184}
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
