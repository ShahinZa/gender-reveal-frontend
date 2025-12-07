import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { genderService } from '../api';
import { Card, Spinner, Alert } from '../components/common';

function DoctorPage() {
  const { code } = useParams();

  const [step, setStep] = useState('loading');
  const [selectedGender, setSelectedGender] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    checkStatus();
  }, [code]);

  const checkStatus = async () => {
    try {
      const data = await genderService.getStatusByCode(code);

      if (!data.isDoctor) {
        setError('This is not a valid selection link');
        setStep('error');
        return;
      }

      if (data.isSet) {
        setStep('locked');
      } else {
        setUserInfo(data);
        setStep('select');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired link');
      setStep('error');
    }
  };

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      await genderService.setGender(code, selectedGender);
      setStep('success');
    } catch (err) {
      setError(err.message || 'Failed to save');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('select');
      setSelectedGender(null);
    } else if (step === 'error') {
      checkStatus();
    }
  };

  // Loading
  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="large" color="white" />
      </div>
    );
  }

  // Already locked
  if (step === 'locked') {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-amber-900/10 to-slate-900" />

        <div className="relative z-10 w-full max-w-md text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Already Done</h1>
          <p className="text-white/50 mb-8">
            The gender was already picked. It can't be changed.
          </p>
          <p className="text-white/30 text-sm">You can close this page</p>
        </div>
      </div>
    );
  }

  // Error
  if (step === 'error') {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-900/10 to-slate-900" />

        <div className="relative z-10 w-full max-w-md">
          <Card className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-white mb-4">Something went wrong</h1>
            <Alert variant="error">{error}</Alert>
            <button
              onClick={handleBack}
              className="mt-4 w-full py-3 rounded-full font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
            >
              Try Again
            </button>
          </Card>
        </div>
      </div>
    );
  }

  // Gender Selection
  if (step === 'select') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[300px] bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-lg text-center">
          {/* Header */}
          <div className="mb-10">
            <p className="text-white/50 text-sm mb-2">You're the secret keeper</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Tap the gender</h1>
            {userInfo?.userEmail && (
              <p className="text-white/40 text-sm">
                For {userInfo.userEmail}
              </p>
            )}
          </div>

          {/* Gender Buttons */}
          <div className="grid grid-cols-2 gap-5 mb-8">
            <button
              className="group relative p-8 rounded-3xl bg-blue-500/10 border-2 border-blue-400/20 hover:border-blue-400/50 hover:bg-blue-500/20 transition-all duration-300 hover:scale-[1.02]"
              onClick={() => handleGenderSelect('boy')}
            >
              <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">👦</div>
              <div className="text-white font-semibold text-xl">Boy</div>
              <div className="absolute inset-0 rounded-3xl bg-blue-400/0 group-hover:bg-blue-400/5 transition-all" />
            </button>

            <button
              className="group relative p-8 rounded-3xl bg-pink-500/10 border-2 border-pink-400/20 hover:border-pink-400/50 hover:bg-pink-500/20 transition-all duration-300 hover:scale-[1.02]"
              onClick={() => handleGenderSelect('girl')}
            >
              <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">👧</div>
              <div className="text-white font-semibold text-xl">Girl</div>
              <div className="absolute inset-0 rounded-3xl bg-pink-400/0 group-hover:bg-pink-400/5 transition-all" />
            </button>
          </div>

          {/* Note */}
          <p className="text-white/40 text-sm">
            It stays hidden until the reveal
          </p>
        </div>
      </div>
    );
  }

  // Confirmation
  if (step === 'confirm') {
    const isBoy = selectedGender === 'boy';

    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 py-12">
        <div className={`absolute inset-0 bg-gradient-to-b from-slate-900 ${isBoy ? 'via-blue-900/20' : 'via-pink-900/20'} to-slate-900`} />

        <div className="relative z-10 w-full max-w-md text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">Is this correct?</h1>

          <div className={`p-10 rounded-3xl mb-8 ${
            isBoy
              ? 'bg-blue-500/10 border-2 border-blue-400/30'
              : 'bg-pink-500/10 border-2 border-pink-400/30'
          }`}>
            <div className="text-8xl mb-4">{isBoy ? '👦' : '👧'}</div>
            <div className={`text-3xl font-bold ${isBoy ? 'text-blue-300' : 'text-pink-300'}`}>
              {isBoy ? 'BOY' : 'GIRL'}
            </div>
          </div>

          <p className="text-white/50 mb-8">
            You can't change it after this
          </p>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex-1 py-3.5 rounded-full font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 py-3.5 rounded-full font-semibold transition-all disabled:opacity-50 ${
                isBoy
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Yes, lock it'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (step === 'success') {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-emerald-900/20 to-slate-900" />

        <div className="relative z-10 w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Done!</h1>

          <p className="text-white/50 mb-8 leading-relaxed">
            The secret is locked. No one can see it until the reveal.
          </p>

          <p className="text-white/30 text-sm">You can close this page now</p>
        </div>
      </div>
    );
  }

  return null;
}

export default DoctorPage;
