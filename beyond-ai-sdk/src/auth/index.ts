import { EmailAuth } from './emailAuth';
import {
  RequestOtpParams,
  VerifyOtpParams,
  AuthResponse,
  UserDetails,
  TokenResponse,
  ApiResponse,
  BeyondAuthOptions,
  BeyondWallet,
  BeyondWalletResponse
} from './types';
import { isAuthenticated, getUser, saveUser, getAccessToken } from '../utils/storage';
import { httpClient } from '../utils/httpClient';

/**
 * Authentication service
 */
export class Auth {
  /**
   * Email authentication provider
   */
  public email: EmailAuth;

  constructor() {
    this.email = new EmailAuth();
  }

  /**
   * Check if a user is authenticated
   * @returns Boolean indicating if the user is authenticated
   */
  isAuthenticated(): boolean {
    return isAuthenticated();
  }

  /**
   * Get the current user details
   * @returns User details or null if not authenticated
   */
  getCurrentUser<T extends UserDetails = UserDetails>(): T | null {
    return getUser<T>();
  }

  /**
   * Fetch Beyond wallet details for the authenticated user
   * @returns Promise resolving to Beyond wallet with Address
   */
  async getBeyondWallet(): Promise<BeyondWallet> {
    if (!this.isAuthenticated()) {
      throw new Error('User must be authenticated to fetch Beyond wallet details');
    }

    try {
      const token = getAccessToken();
      const response = await httpClient.get<ApiResponse<BeyondWalletResponse>>('/auth/smartwallet', {
        headers: {
          'authorization': token // API expects token directly, not "Bearer {token}"
        }
      });
      const smartWalletAddress = response.data.response.smartWalletDetails.smartWalletAddress;
      
      // Update user details with smart wallet information
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          smartWalletAddress: smartWalletAddress
        };
        saveUser(updatedUser);
      }
      
      return { Address: smartWalletAddress };
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message || 'Failed to fetch Beyond wallet details');
      }
      throw error;
    }
  }
}

export {
  RequestOtpParams,
  VerifyOtpParams,
  AuthResponse,
  UserDetails,
  TokenResponse,
  ApiResponse,
  BeyondAuthOptions,
  BeyondWallet,
  BeyondWalletResponse
};
