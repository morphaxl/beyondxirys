import { beyond } from '@Beyond-Network-AI/beyond-ai';

let isInitialized = false;

/**
 * Initialize the Beyond SDK with proper configuration
 */
export async function initializeBeyondSdk(): Promise<void> {
  if (isInitialized) {
    return; // Already initialized
  }

  try {
    // Initialize SDK with dev environment configuration
    beyond.initialize({
      apiUrl: 'https://dev-api.beyondnetwork.xyz',
      debug: true,
      storagePrefix: 'beyond_'
    });

    isInitialized = true;
    console.log('✅ Beyond SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Beyond SDK:', error);
    throw error;
  }
}

/**
 * Get the Beyond SDK instance (ensures it's initialized)
 */
export async function getBeyondSdk() {
  if (!isInitialized) {
    await initializeBeyondSdk();
  }
  return beyond;
}

/**
 * Check if SDK is initialized
 */
export function isSdkInitialized(): boolean {
  return isInitialized;
}

/**
 * Reset initialization state (for testing/debugging)
 */
export function resetSdkInitialization(): void {
  isInitialized = false;
}

export { beyond }; 