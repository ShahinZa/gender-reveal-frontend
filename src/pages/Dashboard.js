import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const navigate = useNavigate();
  const { user, status, logout, isAuthenticated, loading, refreshStatus } = useAuth();
  const [copied, setCopied] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showQR, setShowQR] = useState(null);

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
    }
  }, [isAuthenticated]);

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
            <div className="flex items-center gap-3">
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

          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Your Gender Reveal</h1>
            <p className="text-white/60">Here are your two links</p>
          </div>

          {/* Status Card */}
          <div className={`bg-gradient-to-r ${statusConfig.bgClass} backdrop-blur-xl rounded-2xl border ${statusConfig.borderClass} p-6 mb-8`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{statusConfig.icon}</div>
                <div>
                  <p className="text-white/60 text-sm">Status</p>
                  <p className="text-white font-semibold text-lg">{statusConfig.text}</p>
                </div>
              </div>
              {!status?.isSet && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 rounded-full hover:bg-white/10 transition-all disabled:opacity-50"
                  title="Check for updates"
                >
                  <svg
                    className={`w-5 h-5 text-white/60 ${refreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
            </div>
            {status?.isRevealed && (
              <p className="text-white/50 text-sm mt-4 pt-4 border-t border-white/10">
                Reveal data will be automatically deleted after 60 days for your privacy.
              </p>
            )}
          </div>

          {/* Code Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Secret Keeper Code */}
            <div className={`bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 ${status?.isSet ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🤫</span>
                <h3 className="text-white font-semibold text-lg">The Secret Keeper</h3>
              </div>
              <p className="text-white/60 text-sm mb-4">
                For whoever knows the gender
              </p>
              <div
                className={`bg-black/20 rounded-xl px-4 py-3 mb-4 text-center transition-all ${
                  !status?.isSet ? 'cursor-pointer hover:bg-black/30' : ''
                }`}
                onClick={() => !status?.isSet && copyLink('doctor')}
              >
                <code className="text-white/90 font-mono text-lg tracking-wider">
                  {user.doctorCode}
                </code>
              </div>
              <div className="flex gap-2">
                <button
                  className={`flex-1 py-3.5 rounded-full font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    status?.isSet
                      ? 'bg-white/5 text-white/40 cursor-not-allowed'
                      : 'bg-white text-slate-900 hover:bg-white/90 shadow-lg shadow-white/10'
                  }`}
                  onClick={() => copyLink('doctor')}
                  disabled={status?.isSet}
                >
                  {copied === 'doctor' ? (
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
                <button
                  className={`p-3.5 rounded-full transition-all duration-200 ${
                    status?.isSet
                      ? 'bg-white/5 text-white/40 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  onClick={() => !status?.isSet && setShowQR('doctor')}
                  disabled={status?.isSet}
                  title="Show QR Code"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </button>
              </div>
              {status?.isSet && (
                <p className="text-amber-400/80 text-xs text-center mt-3 flex items-center justify-center gap-1">
                  <span>🔒</span> Locked after selection
                </p>
              )}
            </div>

            {/* Reveal Code */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎁</span>
                <h3 className="text-white font-semibold text-lg">The Big Reveal</h3>
              </div>
              <p className="text-white/60 text-sm mb-4">
                Open this at your party
              </p>
              <div
                className="bg-black/20 rounded-xl px-4 py-3 mb-4 text-center cursor-pointer hover:bg-black/30 transition-all"
                onClick={() => copyLink('reveal')}
              >
                <code className="text-white/90 font-mono text-lg tracking-wider">
                  {user.revealCode}
                </code>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-3.5 rounded-full font-semibold bg-white text-slate-900 hover:bg-white/90 transition-all duration-200 shadow-lg shadow-white/10 flex items-center justify-center gap-2"
                  onClick={() => copyLink('reveal')}
                >
                  {copied === 'reveal' ? (
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
                <button
                  className="p-3.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
                  onClick={() => setShowQR('reveal')}
                  title="Show QR Code"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action */}
          {status?.isSet ? (
            <div className="mb-8">
              <button
                className="w-full py-4 rounded-full font-semibold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 hover:shadow-xl hover:shadow-amber-400/30 transition-all text-lg hover:scale-[1.02]"
                onClick={() => navigate(`/reveal/${user.revealCode}`)}
              >
                Open The Big Reveal
              </button>
            </div>
          ) : (
            <div className="mb-8">
              <button
                className="w-full py-4 rounded-full font-semibold bg-white text-slate-900 hover:bg-white/90 hover:shadow-xl hover:shadow-white/20 transition-all text-sm md:text-lg hover:scale-[1.02]"
                onClick={() => window.open(`${window.location.origin}/secret/${user.doctorCode}`, '_blank')}
              >
                Tap Here & Hand to Whoever Knows the Gender
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">How it works</h3>
            <ol className="space-y-4">
              <li className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</span>
                <p className="text-white/70 text-sm">Send the <span className="text-white font-medium">Secret Keeper</span> link to someone who knows. Or tap the button above and hand them your phone.</p>
              </li>
              <li className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</span>
                <p className="text-white/70 text-sm">They tap Boy or Girl. Done — it's locked and hidden.</p>
              </li>
              <li className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</span>
                <p className="text-white/70 text-sm">At your party, open <span className="text-white font-medium">The Big Reveal</span> together!</p>
              </li>
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
    </div>
  );
}

export default Dashboard;
