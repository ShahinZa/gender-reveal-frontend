import React from 'react';
import { useNavigate } from 'react-router-dom';

function Disclaimer() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/10 to-slate-900" />

      <div className="relative z-10 min-h-screen px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Terms of Service & Disclaimer</h1>
            <p className="text-white/50 text-sm">Last updated: December 2025</p>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Agreement */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white mb-4">Agreement to Terms</h2>
              <p className="text-white/70 leading-relaxed">
                By creating an account or using babyreveal.party, you confirm that you are at least 18 years of age and agree to be legally bound by these terms. If you do not agree, do not use this service.
              </p>
            </section>

            {/* Service Disclaimer */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white mb-4">Disclaimer of Warranties</h2>
              <p className="text-white/70 leading-relaxed">
                This service is provided "as is" and "as available" without any warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement. We do not warrant that the service will be uninterrupted, error-free, or secure.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white mb-4">Limitation of Liability</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                To the maximum extent permitted by law, babyreveal.party and its creators shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, emotional distress, loss of enjoyment, or any damages arising from service interruptions, errors, or the inability to use the service.
              </p>
              <p className="text-white/70 leading-relaxed">
                Our total aggregate liability for any claims arising from or related to this service is limited to zero dollars ($0.00), as this is a free service.
              </p>
            </section>

            {/* Assumption of Risk */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white mb-4">Assumption of Risk</h2>
              <p className="text-white/70 leading-relaxed">
                You expressly understand and agree that your use of this service is at your sole risk. You are solely responsible for any consequences arising from your use of the service, including the timing and circumstances of your gender reveal event.
              </p>
            </section>

            {/* Indemnification */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white mb-4">Indemnification</h2>
              <p className="text-white/70 leading-relaxed">
                You agree to indemnify, defend, and hold harmless babyreveal.party and its creators from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the service or violation of these terms.
              </p>
            </section>

            {/* Service Changes */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white mb-4">Service Availability</h2>
              <p className="text-white/70 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue the service at any time without prior notice. We make no guarantees regarding uptime, data retention, or service continuity.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white mb-4">Dispute Resolution</h2>
              <p className="text-white/70 leading-relaxed">
                Any disputes arising from or relating to this service shall be resolved on an individual basis. You waive any right to participate in a class action lawsuit or class-wide arbitration against babyreveal.party or its creators.
              </p>
            </section>

            {/* Severability */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white mb-4">Severability</h2>
              <p className="text-white/70 leading-relaxed">
                If any provision of these terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            {/* Footer note */}
            <p className="text-white/40 text-sm text-center pt-4">
              These terms may be updated from time to time. Continued use of the service constitutes acceptance of any changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Disclaimer;
