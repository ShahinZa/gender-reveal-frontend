import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Alert } from '../components/common';

function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, isAuthenticated } = useAuth();

  const [mode, setMode] = useState(searchParams.get('mode') === 'login' ? 'login' : 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get redirect URL from query params
  const requestedRedirect = searchParams.get('redirect');
  const redirectUrl = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//') && !requestedRedirect.includes('\\') ? requestedRedirect : '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl);
    }
  }, [isAuthenticated, navigate, redirectUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate(redirectUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <main className="min-h-viewport flex items-center justify-center px-5 py-8" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(88,28,135,0.16), transparent 65%), #0f172a' }}>
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center min-h-11 text-sm text-white/60 hover:text-white mb-5">← babyreveal.party</Link>
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-6 sm:p-7">
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            {mode === 'register' ? 'Create your free reveal' : 'Welcome back'}
          </h1>

          {/* Subtitle */}
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            {mode === 'register'
              ? 'Get your private links, then send one to someone who knows the answer.'
              : 'Sign in to your account'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              name="email"
              autoCapitalize="none"
              spellCheck={false}
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              hint={mode === 'register' ? 'At least 6 characters. Save it somewhere safe.' : undefined}
            />

            {mode === 'register' && (
              <Input
                type="password"
                label="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                error={
                  confirmPassword.length > 0 && confirmPassword !== password
                    ? 'Passwords do not match.'
                    : undefined
                }
              />
            )}

            {error && <Alert variant="error">{error}</Alert>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-white text-slate-900 font-semibold py-3.5 px-8 rounded-xl hover:bg-white/90 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                mode === 'register' ? 'Create my reveal' : 'Sign in'
              )}
            </button>
          </form>

          {/* Privacy Note - only show on register */}
          {mode === 'register' && (
            <p className="text-white/50 text-xs mt-4 leading-relaxed">
              No payment details needed. Please save your password; password reset isn’t available yet.
              <br />
              By signing up, you agree to our{' '}
              <Link to="/privacy" className="underline hover:text-white">
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link to="/disclaimer" className="underline hover:text-white">
                Terms of Service
              </Link>.
            </p>
          )}

          {/* Toggle Mode */}
          <div className="mt-4 text-center">
            <p className="text-white/50 text-sm">
              {mode === 'register'
                ? 'Already have an account?'
                : "Don't have an account?"}
            </p>
            <button
              className="text-purple-400 hover:text-purple-300 font-medium mt-1 transition-colors"
              onClick={toggleMode}
              disabled={loading}
            >
              {mode === 'register' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AuthPage;
