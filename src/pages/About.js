import React from 'react';
import { useNavigate } from 'react-router-dom';

function About() {
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">About Us</h1>
            <p className="text-white/50 text-sm">The story behind babyreveal.party</p>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Our Story */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">👋</span>
                <h2 className="text-xl font-semibold text-white">Our Story</h2>
              </div>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>
                  Hi! We're a husband and wife team, both PhD students in science — Computer Science and Biochemistry.
                </p>
                <p>
                  When we were expecting, we wanted to do a gender reveal but realized that traditional reveals with confetti, balloons, and other single-use items aren't exactly eco-friendly.
                </p>
                <p>
                  So we built a simple digital solution for ourselves — a way to keep the surprise and share the magical moment without the environmental footprint.
                </p>
              </div>
            </section>

            {/* Why Free */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🎁</span>
                <h2 className="text-xl font-semibold text-white">Why Free?</h2>
              </div>
              <p className="text-white/70 leading-relaxed">
                Our family and friends loved the idea, and we thought — why not share it with everyone? This is our small gift to expecting parents around the world. No catch, no hidden fees, just a simple tool to make your special moment a little more magical and a lot more sustainable.
              </p>
            </section>

            {/* Eco-Friendly */}
            <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🌱</span>
                <h2 className="text-xl font-semibold text-white">Eco-Friendly Celebrations</h2>
              </div>
              <p className="text-white/70 leading-relaxed">
                Traditional gender reveals often involve single-use plastics, balloons that harm wildlife, and confetti that takes years to decompose. Our digital alternative gives you all the excitement of a reveal — the countdown, the suspense, the celebration — without leaving a trace on the planet.
              </p>
            </section>

            {/* Thank You */}
            <section className="bg-gradient-to-r from-pink-500/10 to-blue-500/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8 text-center">
              <p className="text-2xl mb-3">❤️</p>
              <p className="text-white/80 leading-relaxed">
                Thank you for being part of our journey. We hope this little app brings joy to your growing family!
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
