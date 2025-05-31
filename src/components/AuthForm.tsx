import React, { useState } from 'react';
import { getBeyondSdk } from '../utils/beyondSdk';

interface AuthFormProps {
  onAuthSuccess: (email: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get initialized Beyond SDK
      const beyond = await getBeyondSdk();
      
      await beyond.auth.email.requestOtp(email);
      setStep('otp');
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
      // Get initialized Beyond SDK
      const beyond = await getBeyondSdk();
      
      const authResult = await beyond.auth.email.verifyOtp(email, otp);
      console.log('Authentication successful:', authResult);
      
      // Store auth info
      localStorage.setItem('beyond_auth_token', JSON.stringify(authResult));
      localStorage.setItem('beyond_user_email', email);
      
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
  };

  return (
    <div className="auth-form">
      <div className="auth-card">
        <h1>Beyond Gyan</h1>
        <p>Sign in to start chatting with AI and managing documents</p>

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
            
            {error && <div className="error">{error}</div>}
            
            <button type="submit" disabled={loading || !email}>
              {loading ? 'Sending...' : 'Send Passcode'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <p className="otp-hint">Check your email ({email}) for the 6-digit code</p>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="000000"
                maxLength={6}
                disabled={loading}
              />
            </div>
            
            {error && <div className="error">{error}</div>}
            
            <button type="submit" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            
            <button type="button" onClick={handleBackToEmail} className="back-button">
              Back to Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthForm; 