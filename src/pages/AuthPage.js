import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl);
    }
  }, [isAuthenticated, navigate, redirectUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await register(email, password);
      } else {
        await login(email, password);
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="p-8">
          {/* Back Button */}
          <button
            className="absolute top-6 left-6 text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm"
            onClick={() => navigate('/')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2 mt-8">
            {mode === 'register' ? 'Create Account' : 'Welcome Back'}
          </h1>

          {/* Subtitle */}
          <p className="text-white/60 text-center mb-8">
            {mode === 'register'
              ? 'Start your gender reveal journey'
              : 'Sign in to your account'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {mode === 'register' && (
              <Input
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            )}

            {error && <Alert variant="error">{error}</Alert>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-white text-slate-900 font-semibold py-4 px-8 rounded-full hover:bg-white/90 transition-all duration-200 shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                mode === 'register' ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Privacy Note - only show on register */}
          {mode === 'register' && (
            <p className="text-white/30 text-[11px] text-center mt-5">
              We only use your email for login. Nothing else.
              <br />
              Password recovery is not supported.
              <br />
              By signing up, you agree to our{' '}
              <span
                onClick={() => navigate('/privacy')}
                className="underline cursor-pointer hover:text-white/50"
              >
                Privacy Policy
              </span>
              {' '}and{' '}
              <span
                onClick={() => navigate('/disclaimer')}
                className="underline cursor-pointer hover:text-white/50"
              >
                Terms of Service
              </span>.
            </p>
          )}

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-white/50 text-sm">
              {mode === 'register'
                ? 'Already have an account?'
                : "Don't have an account?"}
            </p>
            <button
              className="text-purple-400 hover:text-purple-300 font-medium mt-1 transition-colors"
              onClick={toggleMode}
            >
              {mode === 'register' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AuthPage;
