/**
 * Request and response type definitions for Beyond Authentication
 */

// Request Types
export interface RequestVerificationCodeParams {
  email: string;
}

export interface AuthenticateParams {
  email: string;
  otp: string;
  username?: string; // Optional for new user creation (only required for signup)
}

export interface CheckEmailExistsParams {
  email: string;
}

export interface RequestOtpParams {
  email: string;
}

export interface VerifyOtpParams {
  email: string;
  otp: string;
}

// Response Types
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserDetails {
  id: string;
  email: string;
  username: string;
  ethAddress?: string | null;
  solAddress?: string | null;
  profilePicture?: string | null;
  avatarUri?: string | null;
  smartWalletAddress?: string | null;
  [key: string]: any; // Allow additional fields
}

export interface AuthResponse {
  token: TokenResponse;
  userDetails: UserDetails;
  isNewUser?: boolean;
}

export interface ApiResponse<T> {
  response: T;
  statusCode?: number;
  error?: {
    message: string;
    name?: string;
    [key: string]: any;
  };
}

// Auth provider options
export interface BeyondAuthOptions {
  redirectUrl?: string;
}

// Beyond Wallet Types
export interface BeyondWallet {
  Address: string;
}

export interface BeyondWalletResponse {
  smartWalletDetails: {
    embeddedWalletAddress: string;
    smartWalletAddress: string;
  };
}
