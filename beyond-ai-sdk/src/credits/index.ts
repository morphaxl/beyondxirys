import { httpClient } from '../utils/httpClient';
import { getAccessToken } from '../utils/storage';
import { ApiResponse } from '../auth/types';
import { 
  CreditBalance, 
  CreditBalanceResponse, 
  CreditPurchaseParams, 
  CreditPurchaseResult, 
  CreditPurchaseResponse 
} from './types';

/**
 * Credits service for managing user credit information
 */
export class Credits {
  /**
   * Get the current user's credit balance and usage information
   * @returns Promise resolving to credit balance details
   */
  async getBalance(): Promise<CreditBalance> {
    const token = getAccessToken();
    if (!token) {
      throw new Error('User must be authenticated to fetch credit balance');
    }

    try {
      const response = await httpClient.get<ApiResponse<CreditBalanceResponse>>('/auth/credits/balance', {
        headers: {
          'authorization': token // API expects token directly, not "Bearer {token}"
        }
      });
      
      return response.data.response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message || 'Failed to fetch credit balance');
      }
      throw error;
    }
  }

  /**
   * Purchase credits using USD amount
   * @param params Purchase parameters containing the USD amount
   * @returns Promise resolving to purchase result details
   */
  async purchaseCredits(params: CreditPurchaseParams): Promise<CreditPurchaseResult> {
    const token = getAccessToken();
    if (!token) {
      throw new Error('User must be authenticated to purchase credits');
    }

    try {
      const response = await httpClient.post<ApiResponse<{ data: CreditPurchaseResult }>>('/auth/credits/purchase', params, {
        headers: {
          'authorization': token, // API expects token directly, not "Bearer {token}"
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message || 'Failed to purchase credits');
      }
      throw error;
    }
  }
}

export { 
  CreditBalance, 
  CreditBalanceResponse, 
  CreditPurchaseParams, 
  CreditPurchaseResult, 
  CreditPurchaseResponse 
}; 