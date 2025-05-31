/**
 * Configuration module for the Beyond SDK
 */

/**
 * Configuration interface for Beyond SDK initialization
 */
interface BeyondConfig {
  /**
   * Base URL for the Beyond API
   */
  apiUrl: string;
  
  /**
   * Optional prefix for storage keys (default: 'beyond_')
   */
  storagePrefix?: string;
  
  /**
   * Enable debug mode for verbose logging (default: false)
   */
  debug?: boolean;
}

/**
 * Configuration class to manage SDK settings
 */
export class Config {
  apiUrl: string;
  storagePrefix: string;
  debug: boolean;

  constructor(config: BeyondConfig) {
    this.apiUrl = config.apiUrl;
    this.storagePrefix = config.storagePrefix || 'beyond_';
    this.debug = config.debug || false;
  }
}

/**
 * Global configuration instance
 */
export let config: Config;

/**
 * Initialize the SDK with the provided configuration
 * @param userConfig Configuration object for the SDK
 */
export function initialize(userConfig: BeyondConfig): void {
  config = new Config(userConfig);
    
  if (config.debug) {
    console.log('Beyond SDK initialized with config:', config);
  }
}
