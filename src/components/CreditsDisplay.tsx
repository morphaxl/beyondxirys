import React, { useState, useEffect } from "react";
import { getBeyondSdk } from "../utils/beyondSdk";
import './CreditsDisplay.css';

interface CreditBalance {
  monthlyLimit: string;
  monthlyCurrentUsage: string;
  totalCreditsUsed: string;
  totalCreditsPurchased: string;
}

const CreditsDisplay: React.FC = () => {
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError(err.message || "Failed to fetch credits");
    } finally {
      setLoading(false);
    }
  };

  const getRemainingCredits = () => {
    if (!credits) return 0;
    return (
      parseFloat(credits.monthlyLimit) - parseFloat(credits.monthlyCurrentUsage)
    );
  };

  if (loading) {
    return (
      <div className="credits-display">
        <span>⏳</span>
        <span>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="credits-display">
        <span>⚠️</span>
        <span>Error</span>
      </div>
    );
  }

  return (
    <div className="credits-display">
      <span>✨</span>
      <span className="credits-count">{getRemainingCredits().toFixed(0)}</span>
      <span>Beyond Credits</span>
    </div>
  );
};

export default CreditsDisplay;
