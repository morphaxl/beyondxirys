import React, { useState } from 'react';
import { getBeyondSdk } from '../utils/beyondSdk';
import './AuthForm.css';

interface AuthFormProps {
  onAuthSuccess: (email: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState(() => sessionStorage.getItem('auth_email') || '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>(() => (sessionStorage.getItem('auth_step') as 'email' | 'otp') || 'email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const beyond = await getBeyondSdk();
      await beyond.auth.email.requestOtp(email);
      setStep('otp');
      sessionStorage.setItem('auth_email', email);
      sessionStorage.setItem('auth_step', 'otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const beyond = await getBeyondSdk();
      const authResult = await beyond.auth.email.verifyOtp(email, otp);
      localStorage.setItem('beyond_auth_token', JSON.stringify(authResult));
      localStorage.setItem('beyond_user_email', email);
      sessionStorage.removeItem('auth_email');
      sessionStorage.removeItem('auth_step');
      onAuthSuccess(email);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
    sessionStorage.removeItem('auth_email');
    sessionStorage.removeItem('auth_step');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src="/logo.svg" alt="Beyond Gyan Logo" className="auth-logo" />
        <h1 className="auth-title">Beyond Gyan</h1>
        <p className="auth-subtitle">Sign in to start your smart bookmarking journey</p>

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              disabled={loading}
              className="auth-input"
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={loading || !email} className="auth-button">
              {loading ? 'Sending...' : 'Send Passcode'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <p className="otp-hint">Check your email ({email}) for the 6-digit code</p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              className="auth-input"
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={loading || otp.length !== 6} className="auth-button">
              {loading ? 'Verifying...' : 'Verify Passcode'}
            </button>
            <button type="button" onClick={handleBackToEmail} className="auth-button secondary">
              Back to Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthForm; 