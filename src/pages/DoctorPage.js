import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { genderService } from '../api';
import { Button, Card, Spinner, Alert } from '../components/common';
import './DoctorPage.css';

/**
 * Doctor Page
 * Allows radiologist to select baby's gender
 */
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
        setError('This is not a doctor link');
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
      <div className="doctor-container">
        <Spinner size="large" color="blue" />
      </div>
    );
  }

  // Already locked
  if (step === 'locked') {
    return (
      <div className="doctor-container">
        <Card>
          <Card.Icon>🔒</Card.Icon>
          <Card.Title>Already Selected</Card.Title>
          <Card.Subtitle>
            The gender has already been selected and locked.
            It cannot be changed.
          </Card.Subtitle>
          <Button variant="secondary" fullWidth onClick={() => window.close()}>
            Close This Page
          </Button>
        </Card>
      </div>
    );
  }

  // Error
  if (step === 'error') {
    return (
      <div className="doctor-container">
        <Card>
          <Card.Icon>⚠️</Card.Icon>
          <Card.Title>Error</Card.Title>
          <Alert variant="error">{error}</Alert>
          <Button variant="secondary" fullWidth onClick={handleBack}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // Gender Selection
  if (step === 'select') {
    return (
      <div className="doctor-container">
        <Card>
          <Card.Icon>👶</Card.Icon>
          <Card.Title>Select Gender</Card.Title>
          {userInfo?.userEmail && (
            <Card.Subtitle>For: {userInfo.userEmail}</Card.Subtitle>
          )}

          <div className="gender-buttons">
            <button
              className="gender-button boy"
              onClick={() => handleGenderSelect('boy')}
            >
              <span className="gender-icon">👦</span>
              <span className="gender-label">Boy</span>
            </button>

            <button
              className="gender-button girl"
              onClick={() => handleGenderSelect('girl')}
            >
              <span className="gender-icon">👧</span>
              <span className="gender-label">Girl</span>
            </button>
          </div>

          <p className="warning-text">
            This selection will be permanently locked
          </p>
        </Card>
      </div>
    );
  }

  // Confirmation
  if (step === 'confirm') {
    return (
      <div className="doctor-container">
        <Card>
          <Card.Title>Confirm Selection</Card.Title>

          <div className={`selected-preview ${selectedGender}`}>
            <span className="preview-icon">
              {selectedGender === 'boy' ? '👦' : '👧'}
            </span>
            <span className="preview-text">
              {selectedGender === 'boy' ? 'BOY' : 'GIRL'}
            </span>
          </div>

          <p className="confirm-text">
            Are you sure? This cannot be undone.
          </p>

          <div className="confirm-buttons">
            <Button variant="secondary" onClick={handleBack} disabled={loading}>
              Back
            </Button>
            <Button variant="success" onClick={handleConfirm} loading={loading}>
              Confirm
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Success
  if (step === 'success') {
    return (
      <div className="doctor-container">
        <Card>
          <div className="success-icon">✓</div>
          <Card.Title>Saved!</Card.Title>
          <Card.Subtitle>
            The gender has been securely encrypted and saved.
            The parents will discover the surprise at their reveal party!
          </Card.Subtitle>
          <Button variant="secondary" fullWidth onClick={() => window.close()}>
            Close This Page
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}

export default DoctorPage;
