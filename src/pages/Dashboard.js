import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { user, status, logout, isAuthenticated, loading, refreshStatus } = useAuth();
  const [copied, setCopied] = useState(null);

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

  const copyLink = (type) => {
    const code = type === 'doctor' ? user.doctorCode : user.revealCode;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/${type}/${code}`;
    copyToClipboard(link, type);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-content animate-fadeIn">
        <header className="dashboard-header">
          <div className="user-info">
            <span className="user-email">{user.email}</span>
          </div>
          <button className="logout-button" onClick={logout}>
            Sign Out
          </button>
        </header>

        <div className="welcome-section">
          <h1>Your Gender Reveal</h1>
          <p className="welcome-text">Share the codes below to start your journey</p>
        </div>

        {/* Status Card */}
        <div className="status-card">
          <div className={`status-indicator ${status?.isSet ? (status?.isRevealed ? 'revealed' : 'set') : 'waiting'}`}>
            <span className="status-icon">
              {status?.isRevealed ? '🎉' : status?.isSet ? '✓' : '⏳'}
            </span>
            <div className="status-info">
              <span className="status-label">Status</span>
              <span className="status-text">
                {status?.isRevealed
                  ? 'Revealed!'
                  : status?.isSet
                    ? 'Ready to reveal'
                    : 'Waiting for doctor'}
              </span>
            </div>
          </div>
        </div>

        {/* Code Cards */}
        <div className="codes-section">
          <div className={`code-card doctor ${status?.isSet ? 'disabled' : ''}`}>
            <div className="code-header">
              <span className="code-icon">🩺</span>
              <span className="code-title">Doctor Code</span>
            </div>
            <p className="code-description">
              Give this link to your radiologist
            </p>
            <div className="code-display">
              <span className="code-value">{user.doctorCode}</span>
            </div>
            <button
              className="copy-button"
              onClick={() => copyLink('doctor')}
              disabled={status?.isSet}
            >
              {copied === 'doctor' ? 'Copied!' : 'Copy Link'}
            </button>
            {status?.isSet && (
              <span className="code-locked">Locked after selection</span>
            )}
          </div>

          <div className="code-card reveal">
            <div className="code-header">
              <span className="code-icon">🎁</span>
              <span className="code-title">Reveal Code</span>
            </div>
            <p className="code-description">
              Use this at your reveal party
            </p>
            <div className="code-display">
              <span className="code-value">{user.revealCode}</span>
            </div>
            <button
              className="copy-button"
              onClick={() => copyLink('reveal')}
            >
              {copied === 'reveal' ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        {status?.isSet && !status?.isRevealed && (
          <div className="action-section">
            <button
              className="reveal-button"
              onClick={() => navigate(`/reveal/${user.revealCode}`)}
            >
              Go to Reveal Page
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions">
          <h3>How to use</h3>
          <ol>
            <li>Copy the <strong>Doctor Link</strong> and share with your radiologist</li>
            <li>They will select the gender (it's encrypted - you won't see it!)</li>
            <li>At your party, open the <strong>Reveal Link</strong> and cast to TV</li>
            <li>Enjoy the surprise!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
