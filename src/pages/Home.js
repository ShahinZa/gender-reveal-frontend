import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="stars"></div>
      <div className="content animate-fadeIn">
        <div className="baby-icon animate-float">
          <span role="img" aria-label="baby">👶</span>
        </div>

        <h1 className="title script-font">Baby Gender Reveal</h1>
        <p className="subtitle">Create magical moments for your special day</p>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">🔐</span>
            <span>Secure & Encrypted</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🎉</span>
            <span>Beautiful Animations</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📱</span>
            <span>Cast to TV</span>
          </div>
        </div>

        <div className="button-container">
          {isAuthenticated ? (
            <button
              className="nav-button primary-btn"
              onClick={() => navigate('/dashboard')}
            >
              <span className="btn-icon">🏠</span>
              <span className="btn-text">Go to Dashboard</span>
              <span className="btn-subtitle">Manage your reveal</span>
            </button>
          ) : (
            <>
              <button
                className="nav-button primary-btn"
                onClick={() => navigate('/auth')}
              >
                <span className="btn-icon">✨</span>
                <span className="btn-text">Get Started</span>
                <span className="btn-subtitle">Create your reveal</span>
              </button>

              <button
                className="nav-button secondary-btn"
                onClick={() => navigate('/auth?mode=login')}
              >
                <span className="btn-icon">👤</span>
                <span className="btn-text">Sign In</span>
                <span className="btn-subtitle">Already have an account</span>
              </button>
            </>
          )}
        </div>

        <div className="how-it-works">
          <h3>How it works</h3>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <span className="step-text">Register & get your unique codes</span>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <span className="step-text">Give doctor code to radiologist</span>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <span className="step-text">Use reveal code at your party!</span>
            </div>
          </div>
        </div>

        <footer className="footer">
          <p>Made with ❤️ for families everywhere</p>
        </footer>
      </div>
    </div>
  );
}

export default Home;
