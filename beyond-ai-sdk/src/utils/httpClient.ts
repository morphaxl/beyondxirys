import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../config';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './storage';

/**
 * HTTP client for making API requests to the Beyond service
 */
class HttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create();
    this.setupInterceptors();
  }

  /**
   * Configure axios interceptors for request/response handling
   */
  private setupInterceptors(): void {
    // Request interceptor for adding auth token and setting baseURL
    this.client.interceptors.request.use(
      (requestConfig) => {
        // Use the initialized config to set the baseURL dynamically
        if (config?.apiUrl) {
          requestConfig.baseURL = config.apiUrl;
        } else {
          console.error('Beyond SDK not initialized. Please call beyond.initialize() before making API calls.');
        }

        const token = getAccessToken();
        if (token) {
          // Only set Authorization header if not already present in request config
          const existingAuth = requestConfig.headers?.['authorization'] || requestConfig.headers?.['Authorization'];
          if (!existingAuth) {
          // Set Authorization header in a type-safe way
          requestConfig.headers = {
            ...(requestConfig.headers || {}),
            Authorization: `Bearer ${token}`
          } as any;
          }
        }
        return requestConfig;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
          
        // If error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            // Try to refresh the token
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
              // No refresh token, user needs to login again
              clearTokens();
              return Promise.reject(error);
            }

            // Make sure we have config.apiUrl
            if (!config?.apiUrl) {
              console.error('Beyond SDK not initialized. Please call beyond.initialize() before making API calls.');
              return Promise.reject(error);
            }

            const response = await axios.post(`${config.apiUrl}/token/refresh`, {
              refreshToken,
            });

            if (response.data?.response) {
              const { accessToken, refreshToken: newRefreshToken } = response.data.response;
                
              // Save the new tokens
              saveTokens(accessToken, newRefreshToken);
                
              // Update the authorization header for the original request
              // Update Authorization header for retry
              originalRequest.headers = {
                ...(originalRequest.headers || {}),
                Authorization: `Bearer ${accessToken}`
              } as any;
                
              // Retry the original request
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // If refresh token is invalid, clear tokens and ask user to login again
            clearTokens();
            return Promise.reject(refreshError);
          }
        }
          
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if the SDK has been initialized
   */
  private checkInitialized(): boolean {
    return !!config?.apiUrl;
  }

  /**
   * Make a GET request
   * @param url Endpoint URL
   * @param config Additional axios config
   * @returns Promise with the response
   */
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    if (!this.checkInitialized()) {
      throw new Error('Beyond SDK not initialized. Please call beyond.initialize() before making API calls.');
    }
    return this.client.get<T>(url, config);
  }

  /**
   * Make a POST request
   * @param url Endpoint URL
   * @param data Request payload
   * @param config Additional axios config
   * @returns Promise with the response
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    if (!this.checkInitialized()) {
      throw new Error('Beyond SDK not initialized. Please call beyond.initialize() before making API calls.');
    }
    return this.client.post<T>(url, data, config);
  }

  /**
   * Make a PUT request
   * @param url Endpoint URL
   * @param data Request payload
   * @param config Additional axios config
   * @returns Promise with the response
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    if (!this.checkInitialized()) {
      throw new Error('Beyond SDK not initialized. Please call beyond.initialize() before making API calls.');
    }
    return this.client.put<T>(url, data, config);
  }

  /**
   * Make a DELETE request
   * @param url Endpoint URL
   * @param config Additional axios config
   * @returns Promise with the response
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    if (!this.checkInitialized()) {
      throw new Error('Beyond SDK not initialized. Please call beyond.initialize() before making API calls.');
    }
    return this.client.delete<T>(url, config);
  }
}

export const httpClient = new HttpClient();
