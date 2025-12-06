import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Alert } from '../components/common';
import './AuthPage.css';

/**
 * Authentication Page
 * Handles both login and registration
 */
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

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

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
      navigate('/dashboard');
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
    <div className="auth-container">
      <Card>
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>

        <Card.Icon>{mode === 'register' ? '✨' : '👋'}</Card.Icon>
        <Card.Title>{mode === 'register' ? 'Create Account' : 'Welcome Back'}</Card.Title>
        <Card.Subtitle>
          {mode === 'register'
            ? 'Start your gender reveal journey'
            : 'Sign in to your account'}
        </Card.Subtitle>

        <form onSubmit={handleSubmit}>
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

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {mode === 'register' ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            {mode === 'register'
              ? 'Already have an account?'
              : "Don't have an account?"}
          </p>
          <button className="toggle-button" onClick={toggleMode}>
            {mode === 'register' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </Card>
    </div>
  );
}

export default AuthPage;
