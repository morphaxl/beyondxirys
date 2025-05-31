import { Credits } from '../credits/index';
import { httpClient } from '../utils/httpClient';
import { getAccessToken } from '../utils/storage';
import { AxiosResponse } from 'axios';

// Mock the dependencies
jest.mock('../utils/httpClient');
jest.mock('../utils/storage');

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;
const mockedGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;

describe('Credits', () => {
  let credits: Credits;

  beforeEach(() => {
    credits = new Credits();
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should fetch credit balance successfully', async () => {
      // Mock access token
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      // Mock API response - fixed structure to match actual implementation
      const mockResponse: AxiosResponse = {
        data: {
          response: {
            data: {
              monthlyLimit: "10.00000000",
              monthlyCurrentUsage: "0.79520000",
              totalCreditsUsed: "0.79520000",
              totalCreditsPurchased: "21.05000000"
            }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const result = await credits.getBalance();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/auth/credits/balance', {
        headers: {
          'authorization': 'mock-access-token'
        }
      });

      expect(result).toEqual({
        monthlyLimit: "10.00000000",
        monthlyCurrentUsage: "0.79520000",
        totalCreditsUsed: "0.79520000",
        totalCreditsPurchased: "21.05000000"
      });
    });

    it('should throw error when user is not authenticated', async () => {
      // Mock no access token
      mockedGetAccessToken.mockReturnValue(null);

      await expect(credits.getBalance()).rejects.toThrow(
        'User must be authenticated to fetch credit balance'
      );

      expect(mockedHttpClient.get).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      // Mock access token
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      // Mock API error - fixed structure
      const mockError = {
        response: {
          data: {
            error: {
              message: 'Insufficient permissions'
            }
          }
        }
      };

      mockedHttpClient.get.mockRejectedValue(mockError);

      await expect(credits.getBalance()).rejects.toThrow('Insufficient permissions');
    });

    it('should handle generic errors', async () => {
      // Mock access token
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      // Mock generic error
      const mockError = new Error('Network error');
      mockedHttpClient.get.mockRejectedValue(mockError);

      await expect(credits.getBalance()).rejects.toThrow('Network error');
    });
  });

  describe('purchaseCredits', () => {
    it('should purchase credits successfully', async () => {
      // Mock access token
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      // Mock API response - matches actual API structure
      const mockResponse: AxiosResponse = {
        data: {
          response: {
            data: {
              success: true,
              transactionId: "15e765c2-e088-4763-a731-8fb85e6311f3",
              credits: 100,
              usdcAmount: "1000000000000000000",
              tokenType: "USDC"
            }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      mockedHttpClient.post.mockResolvedValue(mockResponse);

      const result = await credits.purchaseCredits({ amount: 1 });

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/credits/purchase', { amount: 1 }, {
        headers: {
          'authorization': 'mock-access-token',
          'Content-Type': 'application/json'
        }
      });

      expect(result).toEqual({
        success: true,
        transactionId: "15e765c2-e088-4763-a731-8fb85e6311f3",
        credits: 100,
        usdcAmount: "1000000000000000000",
        tokenType: "USDC"
      });
    });

    it('should throw error when user is not authenticated', async () => {
      // Mock no access token
      mockedGetAccessToken.mockReturnValue(null);

      await expect(credits.purchaseCredits({ amount: 1 })).rejects.toThrow(
        'User must be authenticated to purchase credits'
      );

      expect(mockedHttpClient.post).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      // Mock access token
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      // Mock API error
      const mockError = {
        response: {
          data: {
            error: {
              message: 'Session key is not active'
            }
          }
        }
      };

      mockedHttpClient.post.mockRejectedValue(mockError);

      await expect(credits.purchaseCredits({ amount: 1 })).rejects.toThrow('Session key is not active');
    });

    it('should handle generic errors', async () => {
      // Mock access token
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      // Mock generic error
      const mockError = new Error('Network error');
      mockedHttpClient.post.mockRejectedValue(mockError);

      await expect(credits.purchaseCredits({ amount: 1 })).rejects.toThrow('Network error');
    });
  });
}); 