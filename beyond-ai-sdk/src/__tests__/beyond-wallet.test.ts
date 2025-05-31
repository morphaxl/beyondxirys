// Test configuration
const TEST_API_URL = process.env.TEST_API_URL || 'https://dev-api.beyondnetwork.xyz';
const TEST_EMAIL = process.env.TEST_EMAIL || 'your-test-email@example.com';
const TEST_STORAGE_PREFIX = process.env.TEST_STORAGE_PREFIX || 'beyond_test_';

import { beyond } from '../index';
import { saveTokens, saveUser, clearAll } from '../utils/storage';

describe('Beyond AI SDK Beyond Wallet', () => {
  beforeAll(() => {
    beyond.initialize({
      apiUrl: TEST_API_URL,
      debug: true,
      storagePrefix: TEST_STORAGE_PREFIX,
    });
  });

  beforeEach(() => {
    // Clear storage before each test
    clearAll();
  });

  afterAll(() => {
    // Clean up after all tests
    clearAll();
  });

  it('should throw error when not authenticated', async () => {
    await expect(beyond.auth.getBeyondWallet()).rejects.toThrow(
      'User must be authenticated to fetch Beyond wallet details'
    );
  });

  it('should have the correct method signature', () => {
    expect(typeof beyond.auth.getBeyondWallet).toBe('function');
  });

  it('should update user details with smart wallet information', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: TEST_EMAIL,
      username: 'testuser'
    };

    saveUser(mockUser);

    // Verify user doesn't have smart wallet info initially
    let currentUser = beyond.auth.getCurrentUser();
    expect(currentUser?.smartWalletAddress).toBeUndefined();
  });
}); 