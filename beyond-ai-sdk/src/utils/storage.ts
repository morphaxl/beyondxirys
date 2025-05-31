import { config } from '../config';

// Keys for storing tokens
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

/**
 * Get prefixed storage key
 * @param key Base key
 * @returns Prefixed key
 */
const getKey = (key: string): string => `${config?.storagePrefix || 'beyond_'}${key}`;

/**
 * Store access and refresh tokens
 * @param accessToken Access token
 * @param refreshToken Refresh token
 */
export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(getKey(ACCESS_TOKEN_KEY), accessToken);
  localStorage.setItem(getKey(REFRESH_TOKEN_KEY), refreshToken);
}

/**
 * Get the access token
 * @returns Access token or null if not available
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(getKey(ACCESS_TOKEN_KEY));
}

/**
 * Get the refresh token
 * @returns Refresh token or null if not available
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(getKey(REFRESH_TOKEN_KEY));
}

/**
 * Clear both tokens
 */
export function clearTokens(): void {
  localStorage.removeItem(getKey(ACCESS_TOKEN_KEY));
  localStorage.removeItem(getKey(REFRESH_TOKEN_KEY));
}

/**
 * Save user data
 * @param user User object
 */
export function saveUser(user: any): void {
  localStorage.setItem(getKey(USER_KEY), JSON.stringify(user));
}

/**
 * Get user data
 * @returns User object or null if not available
 */
export function getUser<T = any>(): T | null {
  const userData = localStorage.getItem(getKey(USER_KEY));
  return userData ? JSON.parse(userData) : null;
}

/**
 * Clear user data
 */
export function clearUser(): void {
  localStorage.removeItem(getKey(USER_KEY));
}

/**
 * Check if user is authenticated
 * @returns Boolean indicating authentication status
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Clear all storage data
 */
export function clearAll(): void {
  clearTokens();
  clearUser();
}
