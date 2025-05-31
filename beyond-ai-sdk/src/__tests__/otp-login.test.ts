// Test configuration (parametrized for CI/local dev)
const TEST_API_URL = process.env.TEST_API_URL || 'https://dev-api.beyondnetwork.xyz';
const TEST_EMAIL = process.env.TEST_EMAIL || 'your-test-email@example.com';
const TEST_OTP = process.env.TEST_OTP || '123456'; // Set this in your CI or before running
const TEST_STORAGE_PREFIX = process.env.TEST_STORAGE_PREFIX || 'beyond_';

import { beyond } from '../index';
import { httpClient } from '../utils/httpClient';
import { saveTokens, saveUser } from '../utils/storage';

describe('Beyond AI SDK OTP Login Flow', () => {
  beforeAll(() => {
    beyond.initialize({
      apiUrl: TEST_API_URL,
      debug: true,
      storagePrefix: TEST_STORAGE_PREFIX,
    });
  });

  it('should request an OTP', async () => {
    const result = await beyond.auth.email.requestOtp(TEST_EMAIL);
    // The API may return { message: ... } or { data: { message: ... } }
    let message;
    if (typeof result === 'object' && result !== null && 'message' in result) {
      message = (result as any).message;
    } else if (typeof result === 'object' && result !== null && 'data' in (result as any) && (result as any).data && typeof (result as any).data === 'object' && 'message' in (result as any).data) {
      message = (result as any).data.message;
    }
    expect(message).toBeDefined();
  });

  // it('should verify the OTP and login', async () => {
  //   // This assumes you have a valid OTP for the test email
  //   const response = await httpClient.post(
  //     '/auth/login/verify/otp',
  //     { email: TEST_EMAIL, otp: TEST_OTP }
  //   );
  //   const responseData = response.data.response.data;
  //   expect(responseData.success).toBe(true);
  //   expect(responseData.token).toBeDefined();
  //   saveTokens(responseData.token.accessToken, responseData.token.refreshToken);
  //   saveUser(responseData.userDetails);
  // });

  it('should sign out', async () => {
    await beyond.auth.email.signOut();
    // Optionally, check that user is signed out
  });
}); 