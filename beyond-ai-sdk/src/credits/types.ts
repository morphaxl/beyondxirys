/**
 * Credit balance information
 */
export interface CreditBalance {
  /**
   * Monthly credit limit
   */
  monthlyLimit: string;
  
  /**
   * Current monthly usage
   */
  monthlyCurrentUsage: string;
  
  /**
   * Total credits used across all time
   */
  totalCreditsUsed: string;
  
  /**
   * Total credits purchased
   */
  totalCreditsPurchased: string;
}

/**
 * API response wrapper for credit balance
 */
export interface CreditBalanceResponse {
  data: CreditBalance;
}

/**
 * Credit purchase request parameters
 */
export interface CreditPurchaseParams {
  /**
   * Amount in USD to purchase credits for
   */
  amount: number;
}

/**
 * Credit purchase response
 */
export interface CreditPurchaseResult {
  /**
   * Whether the purchase was successful
   */
  success: boolean;
  
  /**
   * Transaction ID for the purchase
   */
  transactionId: string;
  
  /**
   * Number of credits purchased
   */
  credits: number;
  
  /**
   * USDC amount in wei (string representation of big number)
   */
  usdcAmount: string;
  
  /**
   * Token type used for payment
   */
  tokenType: string;
}

/**
 * API response wrapper for credit purchase
 */
export interface CreditPurchaseResponse {
  success: boolean;
  transactionId: string;
  credits: number;
  usdcAmount: string;
  tokenType: string;
} 