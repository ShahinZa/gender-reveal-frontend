import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Shared site footer (used on Home, Dashboard, etc.).
 */
const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="px-6 py-8 border-t border-white/5">
      <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-white/25 text-xs">Made with ❤️ in Canada</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/about')}
            className="text-white/25 hover:text-white/50 text-xs transition-colors"
          >
            About Us
          </button>
          <button
            onClick={() => navigate('/privacy')}
            className="text-white/25 hover:text-white/50 text-xs transition-colors"
          >
            Privacy
          </button>
          <button
            onClick={() => navigate('/disclaimer')}
            className="text-white/25 hover:text-white/50 text-xs transition-colors"
          >
            Terms
          </button>
          <a
            href="https://buymeacoffee.com/babyreveal.party"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/25 hover:text-amber-300/80 text-xs transition-colors inline-flex items-center gap-1"
          >
            <span aria-hidden="true">☕</span>
            Support us
          </a>
        </div>
        <span className="text-white/25 text-xs">
          &copy; {new Date().getFullYear()} babyreveal.party
        </span>
      </div>
    </footer>
  );
};

export default Footer;
