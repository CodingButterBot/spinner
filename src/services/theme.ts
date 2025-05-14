/**
 * Theme service for SpinPick
 * Manages themes with Directus integration
 */

import { apiService, ThemeData } from './api';
import { authService } from './auth';

// Default themes
const DEFAULT_LIGHT_THEME = {
  name: 'Default Light',
  primary_color: '#3b82f6',
  secondary_color: '#8b5cf6',
  background_color: '#ffffff',
  text_color: '#1f2937'
};

const DEFAULT_DARK_THEME = {
  name: 'Default Dark',
  primary_color: '#60a5fa',
  secondary_color: '#a78bfa',
  background_color: '#1f2937',
  text_color: '#f9fafb'
};

/**
 * ThemeService handles theme management for the SpinPick application
 */
class ThemeService {
  private currentTheme: string = 'system';
  private customThemes: ThemeData[] = [];
  private themesLoaded: boolean = false;
  
  constructor() {
    this.loadThemePreference();
  }
  
  /**
   * Load theme preference from localStorage
   */
  private loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.currentTheme = savedTheme;
      this.applyTheme(savedTheme);
    } else {
      // Default to dark theme
      this.currentTheme = 'dark';
      this.applyTheme('dark');
    }
  }
  
  /**
   * Apply a theme to the document
   * @param theme - Theme to apply (light, dark, system, or custom theme name)
   */
  applyTheme(theme: string) {
    // Remove any existing theme classes
    document.documentElement.classList.remove('light', 'dark');
    
    // Apply the selected theme
    if (theme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else if (theme === 'light' || theme === 'dark') {
      document.documentElement.classList.add(theme);
    } else {
      // Handle custom theme by name
      const customTheme = this.getCustomThemeByName(theme);
      if (customTheme) {
        // Apply the base theme (light or dark)
        const baseTheme = this.isLightTheme(customTheme) ? 'light' : 'dark';
        document.documentElement.classList.add(baseTheme);
        
        // Apply custom CSS variables
        this.applyCustomThemeColors(customTheme);
      } else {
        // Fallback to light theme if custom theme not found
        document.documentElement.classList.add('light');
      }
    }
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
    this.currentTheme = theme;
    
    // If user is authenticated, save theme preference to their profile
    if (authService.isAuthenticated()) {
      authService.setThemePreference(theme as any).catch(error => {
        console.error('Failed to save theme preference to profile:', error);
      });
    }
  }
  
  /**
   * Get current theme
   * @returns Current theme name
   */
  getCurrentTheme(): string {
    return this.currentTheme;
  }
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    
    if (currentTheme === 'light' || currentTheme === 'system' && !this.isCurrentSystemDark()) {
      this.applyTheme('dark');
    } else {
      this.applyTheme('light');
    }
  }
  
  /**
   * Check if current system theme is dark
   * @returns True if system theme is dark
   */
  isCurrentSystemDark(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  /**
   * Check if a theme is light based on background color
   * @param theme - Theme to check
   * @returns True if theme is light
   */
  isLightTheme(theme: ThemeData): boolean {
    // Convert hex to RGB and check brightness
    const hex = theme.background_color || '#ffffff';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Calculate brightness using the formula (0.299*R + 0.587*G + 0.114*B)
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Theme is light if brightness is > 0.5
    return brightness > 0.5;
  }
  
  /**
   * Apply custom theme colors as CSS variables
   * @param theme - Custom theme to apply
   */
  private applyCustomThemeColors(theme: ThemeData) {
    const root = document.documentElement;
    
    if (theme.primary_color) {
      root.style.setProperty('--primary', theme.primary_color);
    }
    
    if (theme.secondary_color) {
      root.style.setProperty('--secondary', theme.secondary_color);
    }
    
    if (theme.background_color) {
      root.style.setProperty('--background', theme.background_color);
    }
    
    if (theme.text_color) {
      root.style.setProperty('--foreground', theme.text_color);
    }
  }
  
  /**
   * Get custom theme by name
   * @param name - Theme name
   * @returns Custom theme or null if not found
   */
  getCustomThemeByName(name: string): ThemeData | null {
    return this.customThemes.find(theme => theme.name === name) || null;
  }
  
  /**
   * Load custom themes from Directus
   * @returns Promise with custom themes
   */
  async loadCustomThemes(): Promise<ThemeData[]> {
    try {
      if (!authService.isAuthenticated()) {
        this.customThemes = [];
        this.themesLoaded = true;
        return [];
      }
      
      const themes = await apiService.getUserThemes();
      this.customThemes = themes;
      this.themesLoaded = true;
      return themes;
    } catch (error) {
      console.error('Failed to load custom themes:', error);
      this.customThemes = [];
      this.themesLoaded = true;
      return [];
    }
  }
  
  /**
   * Save a custom theme
   * @param theme - Theme data to save
   * @returns Promise with saved theme
   */
  async saveCustomTheme(theme: ThemeData): Promise<ThemeData> {
    if (!authService.isAuthenticated()) {
      throw new Error('User must be authenticated to save themes');
    }
    
    try {
      const savedTheme = await apiService.createTheme(theme);
      
      // Refresh the themes list
      await this.loadCustomThemes();
      
      return savedTheme;
    } catch (error) {
      console.error('Failed to save custom theme:', error);
      throw new Error('Failed to save theme. Please try again.');
    }
  }
  
  /**
   * Get all available themes (default and custom)
   * @returns Array of theme options for selection
   */
  async getAllThemes(): Promise<Array<{ value: string, label: string, isCustom?: boolean }>> {
    // Ensure custom themes are loaded
    if (!this.themesLoaded) {
      await this.loadCustomThemes();
    }
    
    // Standard themes
    const standardThemes = [
      { value: 'light', label: 'Light Theme' },
      { value: 'dark', label: 'Dark Theme' },
      { value: 'system', label: 'System Theme' }
    ];
    
    // Custom themes
    const customThemeOptions = this.customThemes.map(theme => ({
      value: theme.name,
      label: theme.name,
      isCustom: true
    }));
    
    return [...standardThemes, ...customThemeOptions];
  }
  
  /**
   * Get default themes
   * @returns Object with default light and dark themes
   */
  getDefaultThemes() {
    return {
      light: DEFAULT_LIGHT_THEME,
      dark: DEFAULT_DARK_THEME
    };
  }
}

// Export singleton instance
export const themeService = new ThemeService();
export default themeService;