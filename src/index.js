import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Easter egg for curious developers 🥚
console.log(
  '%c👶 Welcome, Developer! 👶',
  'font-size: 24px; font-weight: bold; color: #ec4899; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);'
);
console.log(
  '%cYou found the secret! 🎉',
  'font-size: 16px; color: #a855f7; font-weight: bold;'
);
console.log(
  '%cLooking for a gender reveal? We got you covered! 💝',
  'font-size: 14px; color: #60a5fa;'
);
console.log(
  '%c🎈 Features:\n' +
  '  • End-to-end encrypted gender reveals\n' +
  '  • Zero waste, 100% digital\n' +
  '  • Real-time synced celebrations\n' +
  '  • Custom confetti & animations',
  'font-size: 12px; color: #10b981; line-height: 1.8;'
);
console.log(
  '%cBuilt with ❤️ using React • Node.js • MongoDB • Socket.IO',
  'font-size: 11px; color: #8b5cf6; font-style: italic;'
);
console.log(
  '%c💼 Interested in the tech stack or want to contribute?',
  'font-size: 12px; color: #f59e0b; font-weight: bold;'
);
console.log(
  '%cReach out: privacy@babyreveal.party',
  'font-size: 12px; color: #ec4899;'
);
console.log(
  '%c🚀 Happy revealing!',
  'font-size: 14px; color: #a855f7; font-weight: bold;'
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
