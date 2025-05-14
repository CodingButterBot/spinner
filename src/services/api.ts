/**
 * API service for SpinPick - Static Version
 * This version works without a backend API server
 */

// Types
export type ThemeData = {
  name: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
};

export type SpinResult = {
  result: string | string[];
  type: 'wheel' | 'slot';
};

// Default theme data for static use
const DEFAULT_THEMES = [
  {
    name: 'Blue Wave',
    primary_color: '#3b82f6',
    secondary_color: '#8b5cf6',
    background_color: '#1f2937',
    text_color: '#f9fafb'
  },
  {
    name: 'Forest Green',
    primary_color: '#10b981',
    secondary_color: '#34d399',
    background_color: '#064e3b',
    text_color: '#ecfdf5'
  },
  {
    name: 'Crimson Tide',
    primary_color: '#ef4444',
    secondary_color: '#f87171',
    background_color: '#7f1d1d',
    text_color: '#fef2f2'
  }
];

/**
 * SpinPick API client - Static demo version
 * Uses localStorage to simulate a backend
 */
class ApiService {
  // User ID is managed by the auth system
  private userId: string | null = null;

  constructor() {
    // Initialize local storage with default data if not already present
    if (!localStorage.getItem('spinpick_themes')) {
      localStorage.setItem('spinpick_themes', JSON.stringify(DEFAULT_THEMES));
    }

    if (!localStorage.getItem('spinpick_results')) {
      localStorage.setItem('spinpick_results', JSON.stringify([]));
    }

    if (!localStorage.getItem('spinpick_csv_mappings')) {
      localStorage.setItem('spinpick_csv_mappings', JSON.stringify([]));
    }
  }

  /**
   * Set the current user ID
   * @param userId - User ID for requests
   */
  setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('userId', userId);
  }

  /**
   * Get the current user ID
   * @returns User ID or null if not set
   */
  getUserId(): string | null {
    if (!this.userId) {
      this.userId = localStorage.getItem('userId');
    }
    return this.userId;
  }

  /**
   * Clear the stored user ID (logout)
   */
  clearUserId() {
    this.userId = null;
    localStorage.removeItem('userId');
  }

  /**
   * Get user themes - Static implementation using localStorage
   * @returns Promise with user themes
   */
  async getUserThemes(): Promise<ThemeData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const themes = localStorage.getItem('spinpick_themes');
      return themes ? JSON.parse(themes) : DEFAULT_THEMES;
    } catch (error) {
      console.error('Failed to get themes from localStorage:', error);
      return DEFAULT_THEMES;
    }
  }

  /**
   * Create a new theme for the current user
   * @param theme - Theme data
   * @returns Promise with the created theme
   */
  async createTheme(theme: ThemeData): Promise<ThemeData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const themes = await this.getUserThemes();
      const updatedThemes = [...themes, theme];
      localStorage.setItem('spinpick_themes', JSON.stringify(updatedThemes));
      return theme;
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
      throw new Error('Failed to save theme');
    }
  }

  /**
   * Get spin results for the current user
   * @returns Promise with user's spin results
   */
  async getSpinResults(): Promise<SpinResult[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const results = localStorage.getItem('spinpick_results');
      return results ? JSON.parse(results) : [];
    } catch (error) {
      console.error('Failed to get results from localStorage:', error);
      return [];
    }
  }

  /**
   * Save a spin result for the current user
   * @param result - Spin result data object
   * @returns Promise with the saved result
   */
  async saveSpinResult(result: { type: 'wheel' | 'slot', result: string | string[], user?: string }): Promise<SpinResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const results = await this.getSpinResults();
      const newResult = { ...result, timestamp: new Date().toISOString() };
      const updatedResults = [...results, newResult];
      localStorage.setItem('spinpick_results', JSON.stringify(updatedResults));
      return newResult as SpinResult;
    } catch (error) {
      console.error('Failed to save result to localStorage:', error);
      throw new Error('Failed to save result');
    }
  }

  /**
   * Generic data fetch method for accessing API resources
   * @param url - API endpoint path
   * @returns Promise with the requested data
   */
  async get<T>(url: string): Promise<T> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Parse URL to determine what resource is being requested
      if (url.startsWith('/csv/mappings/')) {
        const userId = url.split('/').pop();
        const key = `spinpick_csv_mappings_${userId}`;
        const mappings = localStorage.getItem(key);
        return mappings ? JSON.parse(mappings) : [];
      }

      // Fall back to localStorage with key matching the URL path
      const storageKey = `spinpick${url.replace(/\//g, '_')}`;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to get data from ${url}:`, error);
      throw new Error(`API request failed: ${url}`);
    }
  }

  /**
   * Generic data post method for creating API resources
   * @param url - API endpoint path
   * @param data - Data to save
   * @returns Promise with the created data
   */
  async post<T>(url: string, data: any): Promise<T> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Parse URL to determine what resource is being created/updated
      if (url === '/csv/mappings') {
        const { userId, mappingData } = data;
        const key = `spinpick_csv_mappings_${userId}`;
        const existingMappings = localStorage.getItem(key);
        const mappings = existingMappings ? JSON.parse(existingMappings) : [];
        const updatedMappings = [...mappings, mappingData];
        localStorage.setItem(key, JSON.stringify(updatedMappings));
        return mappingData as unknown as T;
      }

      if (url === '/csv/imports') {
        // Import handling would go here if needed
        return data as unknown as T;
      }

      // Fall back to storing in localStorage with key matching the URL path
      const storageKey = `spinpick${url.replace(/\//g, '_')}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      return data as unknown as T;
    } catch (error) {
      console.error(`Failed to post data to ${url}:`, error);
      throw new Error(`API request failed: ${url}`);
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;