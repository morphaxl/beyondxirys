import { Auth } from './auth';
import { Credits } from './credits';
import { Chat } from './chat';
import * as storage from './utils/storage';
import { config, initialize, Config } from './config';

/**
 * Main Beyond SDK class that provides access to all services
 */
export class Beyond {
  /**
   * Authentication service
   */
  public auth: Auth;
  
  /**
   * Credits service
   */
  public credits: Credits;
  
  /**
   * Chat completions service
   */
  public chat: Chat;
  
  /**
   * Storage utilities
   */
  public storage: typeof storage;

  constructor() {
    this.auth = new Auth();
    this.credits = new Credits();
    this.chat = new Chat();
    this.storage = storage;
  }

  /**
   * Initialize the Beyond SDK
   * @param config Configuration options
   */
  initialize(config: Parameters<typeof initialize>[0]): void {
    initialize(config);
  }

  /**
   * Get current SDK configuration
   * @returns Current configuration or undefined if not initialized
   */
  getConfig(): Config | undefined {
    return config;
  }
}

// Create singleton instance
const beyond = new Beyond();

export { beyond };
export default beyond;
