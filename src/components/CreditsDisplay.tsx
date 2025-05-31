import React, { useState, useEffect } from 'react';
import { getBeyondSdk } from '../utils/beyondSdk';

interface CreditBalance {
  monthlyLimit: string;
  monthlyCurrentUsage: string;
  totalCreditsUsed: string;
  totalCreditsPurchased: string;
}

const CreditsDisplay: React.FC = () => {
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      // Get initialized Beyond SDK
      const beyond = await getBeyondSdk();
      const creditBalance = await beyond.credits.getBalance();
      setCredits(creditBalance);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingCredits = () => {
    if (!credits) return 0;
    return parseFloat(credits.monthlyLimit) - parseFloat(credits.monthlyCurrentUsage);
  };

  if (loading) {
    return (
      <div className="credits-display">
        <div className="credits-loading">Loading credits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="credits-display">
        <div className="credits-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="credits-display">
      <div className="credits-header">
        <h3>💳 Credits</h3>
      </div>
      <div className="credits-info">
        <div className="credit-item">
          <span className="credit-label">Remaining:</span>
          <span className="credit-value">{getRemainingCredits().toFixed(6)}</span>
        </div>
        <div className="credit-item">
          <span className="credit-label">Monthly Limit:</span>
          <span className="credit-value">{credits?.monthlyLimit}</span>
        </div>
        <div className="credit-item">
          <span className="credit-label">Used This Month:</span>
          <span className="credit-value">{credits?.monthlyCurrentUsage}</span>
        </div>
      </div>
    </div>
  );
};

export default CreditsDisplay; 