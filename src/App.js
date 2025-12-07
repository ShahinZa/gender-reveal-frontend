import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import DoctorPage from './pages/DoctorPage';
import RevealPage from './pages/RevealPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import About from './pages/About';
import Disclaimer from './pages/Disclaimer';

/**
 * Root Application Component
 * Sets up routing and providers
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/secret/:code" element={<DoctorPage />} />
          <Route path="/reveal/:code" element={<RevealPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about" element={<About />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
