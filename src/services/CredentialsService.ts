
/**
 * CredentialsService - Handles secure storage and retrieval of API credentials
 * This service abstracts away the details of how credentials are stored and retrieved
 */

interface ApiCredentials {
  useApi: boolean;
  apiKey: string | null;
  apiSecret: string | null;
  apiStatus: 'not_configured' | 'partial' | 'configured';
}

class CredentialsService {
  // Session storage is slightly more secure than localStorage as it's cleared when the browser is closed
  // In a production environment, this would use a more secure solution like HTTP-only cookies or a backend service
  private static STORAGE_KEYS = {
    USE_API: 'bybit_use_api',
    API_KEY: 'bybit_api_key',
    API_SECRET: 'bybit_api_secret_temp'
  };

  /**
   * Get the current API credentials
   */
  static getCredentials(): ApiCredentials {
    const useApi = localStorage.getItem(this.STORAGE_KEYS.USE_API) === 'true';
    const apiKey = localStorage.getItem(this.STORAGE_KEYS.API_KEY);
    const apiSecret = localStorage.getItem(this.STORAGE_KEYS.API_SECRET);
    
    let apiStatus: ApiCredentials['apiStatus'] = 'not_configured';
    if (useApi && apiKey && apiSecret) {
      apiStatus = 'configured';
    } else if (useApi && apiKey) {
      apiStatus = 'partial';
    }
    
    return {
      useApi,
      apiKey,
      apiSecret,
      apiStatus
    };
  }

  /**
   * Set API credentials
   */
  static setCredentials(credentials: {
    useApi?: boolean;
    apiKey?: string;
    apiSecret?: string;
  }): ApiCredentials {
    // Only update values that are provided
    if (credentials.useApi !== undefined) {
      localStorage.setItem(this.STORAGE_KEYS.USE_API, credentials.useApi.toString());
    }
    
    if (credentials.apiKey !== undefined) {
      localStorage.setItem(this.STORAGE_KEYS.API_KEY, credentials.apiKey);
    }
    
    if (credentials.apiSecret !== undefined) {
      localStorage.setItem(this.STORAGE_KEYS.API_SECRET, credentials.apiSecret);
    }
    
    // Dispatch an event to notify listeners that credentials have changed
    window.dispatchEvent(new CustomEvent('bybit_credentials_changed'));
    
    // Return the updated credentials
    return this.getCredentials();
  }

  /**
   * Clear API credentials
   */
  static clearCredentials(): void {
    localStorage.removeItem(this.STORAGE_KEYS.USE_API);
    localStorage.removeItem(this.STORAGE_KEYS.API_KEY);
    localStorage.removeItem(this.STORAGE_KEYS.API_SECRET);
    
    // Dispatch an event to notify listeners that credentials have changed
    window.dispatchEvent(new CustomEvent('bybit_credentials_changed'));
  }

  /**
   * Check if API is configured for use
   */
  static isApiConfigured(): boolean {
    const { useApi, apiKey, apiSecret } = this.getCredentials();
    return useApi && !!apiKey && !!apiSecret;
  }

  /**
   * Get a human-readable status of the API configuration
   */
  static getApiStatusText(): string {
    const { apiStatus } = this.getCredentials();
    
    switch (apiStatus) {
      case 'configured':
        return 'API Key configured';
      case 'partial':
        return 'API Key saved (Secret needed)';
      case 'not_configured':
      default:
        return 'Not connected';
    }
  }
}

export { CredentialsService, type ApiCredentials };
