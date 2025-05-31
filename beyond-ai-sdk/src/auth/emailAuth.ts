import { httpClient } from '../utils/httpClient';
import { saveTokens, saveUser, clearAll } from '../utils/storage';
import {
  AuthenticateParams,
  AuthResponse,
  ApiResponse,
  RequestVerificationCodeParams
} from './types';

/**
 * Email authentication service
 */
export class EmailAuth {
  /**
   * Request an OTP to be sent to the provided email
   * @param email Email address to receive the OTP
   * @returns Promise resolving to success message
   */
  async requestOtp(email: string): Promise<{ message: string }> {
    try {
      const response = await httpClient.post<ApiResponse<{ message: string }>>(
        '/auth/login/request/otp',
        { email }
      );
      return response.data.response;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message || 'Failed to request OTP');
      }
      throw error;
    }
  }

  /**
   * Verify the provided OTP for the given email
   * @param email Email address used to request the OTP
   * @param otp One time password sent to the email
   * @returns Promise resolving to auth response
   */
  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<ApiResponse<{ data: AuthResponse & { success: boolean } }>>(
        '/auth/login/verify/otp',
        { email, otp }
      );
      
      // Handle the actual API response structure: response.data.response.data
      const responseData = response.data.response.data;
      
      if (!responseData.success) {
        throw new Error('OTP verification failed - invalid response');
      }
      
      const authData: AuthResponse = {
        token: responseData.token,
        userDetails: responseData.userDetails,
        isNewUser: responseData.isNewUser
      };
      
      saveTokens(authData.token.accessToken, authData.token.refreshToken);
      saveUser(authData.userDetails);
      return authData;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message || 'OTP verification failed');
      }
      throw error;
    }
  }

  /**
   * Sign out the current user and clear all stored data
   */
  async signOut(): Promise<void> {
    try {
      await httpClient.post('/auth/signout');
    } catch (error) {
      // Ignore errors when signing out - we still want to clear local data
    } finally {
      clearAll();
    }
  }
}
