import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
const Home = lazy(() => import('./pages/Home'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DoctorPage = lazy(() => import('./pages/DoctorPage'));
const RevealPage = lazy(() => import('./pages/RevealPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const About = lazy(() => import('./pages/About'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));

/**
 * Root Application Component
 * Sets up routing and providers
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div role="status" className="min-h-viewport flex items-center justify-center text-white/70">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/secret/:code" element={<DoctorPage />} />
          <Route path="/reveal/:code" element={<RevealPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about" element={<About />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="*" element={<div className="min-h-viewport flex items-center justify-center px-5 text-center"><div><h1 className="text-3xl font-semibold mb-3">This page isn’t here</h1><p className="text-white/60 mb-6">Check your link or head back to your reveal.</p><a className="btn-primary inline-block" href="/">Back to home</a></div></div>} />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
