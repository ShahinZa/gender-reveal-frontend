import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import DoctorPage from './pages/DoctorPage';
import RevealPage from './pages/RevealPage';
import PrivacyPolicy from './pages/PrivacyPolicy';

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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
