import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

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
            <div className="text-6xl mb-8">
              👶
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Share the joy with a
              <span className="block mt-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent leading-normal">
                magical reveal
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/60 mb-10 max-w-lg mx-auto leading-relaxed">
              A secure, encrypted way to keep your baby's gender a surprise until the perfect moment.
            </p>

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
              {!isAuthenticated && (
                <p className="text-white/30 text-xs text-center mt-6">
                  Always free, no hidden costs
                </p>
              )}
            </div>

            {/* How it works - minimal */}
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
        </div>

        {/* Footer */}
        <footer className="px-6 py-6 text-center">
          <p className="text-white/30 text-sm mb-2">
            Made with care for families everywhere
          </p>
          <button
            onClick={() => navigate('/privacy')}
            className="text-white/30 hover:text-white/50 text-xs transition-colors"
          >
            Privacy Policy
          </button>
        </footer>
      </div>
    </div>
  );
}

export default Home;
