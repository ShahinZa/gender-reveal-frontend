import React from 'react';
import { useNavigate } from 'react-router-dom';

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/10 to-slate-900" />

      <div className="relative z-10 min-h-screen px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="text-white/60 hover:text-white text-sm font-medium flex items-center gap-2 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-white/50 text-sm">Last updated: December 2024</p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">Our Commitment to Your Privacy</h2>
              <p className="text-white/70 leading-relaxed">
                At babyreveal.party, we believe your personal moments should remain personal. We've built our service with privacy as a core principle, not an afterthought. This policy explains exactly what data we collect, how we protect it, and what we do with it.
              </p>
            </section>

            {/* No Tracking */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🚫</span>
                <h2 className="text-xl font-semibold text-white">No Tracking</h2>
              </div>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>We do not use cookies for tracking purposes</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No third-party analytics or tracking scripts</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No advertising networks or pixels</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No behavioral profiling or fingerprinting</span>
                </li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🌐</span>
                <h2 className="text-xl font-semibold text-white">Third-Party Services</h2>
              </div>
              <p className="text-white/70 leading-relaxed mb-4">
                While we do not set any tracking cookies ourselves, we rely on trusted infrastructure providers to deliver our service securely and reliably. These providers may set essential cookies for security and performance purposes:
              </p>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-white font-medium mb-2">Cloudflare</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    We use Cloudflare for DDoS protection, SSL/TLS encryption, and content delivery. Cloudflare may set essential security cookies (such as <code className="text-purple-400 bg-white/5 px-1.5 py-0.5 rounded">__cflb</code> or <code className="text-purple-400 bg-white/5 px-1.5 py-0.5 rounded">__cf_bm</code>) to protect against malicious traffic and ensure service availability. These are strictly functional cookies and are not used for tracking or advertising.
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-white font-medium mb-2">Hosting Providers</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Our hosting infrastructure may collect standard server logs (IP addresses, request timestamps) for security monitoring and abuse prevention. These logs are used solely for operational purposes and are not shared with third parties.
                  </p>
                </div>
              </div>
              <p className="text-white/50 text-sm mt-4">
                We carefully select providers who share our commitment to privacy and only use services that are essential to operating a secure platform.
              </p>
            </section>

            {/* No Data Selling */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔒</span>
                <h2 className="text-xl font-semibold text-white">We Never Sell Your Data</h2>
              </div>
              <p className="text-white/70 leading-relaxed">
                Your data is yours. We will never sell, rent, lease, or share your personal information with third parties for marketing or any other commercial purposes. Period.
              </p>
            </section>

            {/* Data Collection */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📋</span>
                <h2 className="text-xl font-semibold text-white">What We Collect</h2>
              </div>
              <div className="space-y-4 text-white/70">
                <div>
                  <h3 className="text-white font-medium mb-2">Email Address</h3>
                  <p className="leading-relaxed">
                    We collect your email address solely for account creation and authentication purposes. We do not send marketing emails, newsletters, or promotional content. The only emails you'll receive are essential account-related communications (such as password reset requests).
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">Gender Selection</h3>
                  <p className="leading-relaxed">
                    The gender selection you make is encrypted and stored securely until reveal. This data is automatically and permanently deleted 60 days after the reveal.
                  </p>
                </div>
              </div>
            </section>

            {/* Security */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🛡️</span>
                <h2 className="text-xl font-semibold text-white">How We Protect Your Data</h2>
              </div>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-white">Passwords are hashed</strong> using industry-standard algorithms. We cannot see or recover your password.</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-white">Gender data is encrypted</strong> at rest. Only the reveal process can decrypt it.</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-white">All connections use HTTPS</strong> to encrypt data in transit.</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-white">Secure access codes</strong> are randomly generated and unique to each reveal.</span>
                </li>
              </ul>
            </section>

            {/* Data Retention */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🗑️</span>
                <h2 className="text-xl font-semibold text-white">Automatic Data Deletion</h2>
              </div>
              <p className="text-white/70 leading-relaxed mb-4">
                We believe in keeping data only as long as necessary. After your gender reveal:
              </p>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white font-medium text-center">
                  All reveal data is automatically and permanently deleted 60 days after the reveal
                </p>
              </div>
              <p className="text-white/50 text-sm mt-4">
                This includes the encrypted gender selection and associated reveal codes. Account information (email) is retained for continued account access unless you request account deletion.
              </p>
            </section>

            {/* Your Rights */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">✨</span>
                <h2 className="text-xl font-semibold text-white">Your Rights</h2>
              </div>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Request a copy of your data</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Request deletion of your account and all associated data</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Ask questions about our privacy practices</span>
                </li>
              </ul>
            </section>

            {/* Contact */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📧</span>
                <h2 className="text-xl font-semibold text-white">Contact Us</h2>
              </div>
              <p className="text-white/70 leading-relaxed">
                If you have any questions about this Privacy Policy or our practices, please contact us at{' '}
                <a href="mailto:privacy@babyreveal.party" className="text-purple-400 hover:text-purple-300 transition-colors">
                  privacy@babyreveal.party
                </a>
              </p>
            </section>

            {/* Footer note */}
            <p className="text-white/40 text-sm text-center pt-4">
              This privacy policy may be updated from time to time. We will notify users of any material changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
