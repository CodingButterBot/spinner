/**
 * Randomizer Theming Service
 * Provides theme utilities for the SpinningWheel and SlotMachine components
 * Supports Tailwind CSS 4.1 features like text shadows and masking
 */

import { themeService } from './theme';

/**
 * Defines a color palette for a randomizer component 
 */
export interface RandomizerTheme {
  /** Name of the theme */
  name: string;
  
  /** Main background for the randomizer */
  background: string;
  
  /** Text color for labels */
  text: string;
  
  /** Border color for the randomizer frame */
  border: string;
  
  /** Color palette for wheel segments or slot items */
  palette: string[];
  
  /** Highlight color for selected items */
  highlight: string;
  
  /** Accent color for buttons and indicators */
  accent: string;
}

/** 
 * Built-in themes for randomizer components
 */
export const BUILT_IN_THEMES: Record<string, RandomizerTheme> = {
  default: {
    name: 'Default',
    background: 'var(--background)',
    text: 'var(--foreground)',
    border: 'var(--border)',
    palette: [
      'var(--primary)',
      'var(--secondary)',
      'var(--primary-light)',
      'var(--secondary-light)',
      'var(--primary-dark)',
      'var(--secondary-dark)'
    ],
    highlight: 'var(--destructive)',
    accent: 'var(--primary)'
  },
  vivid: {
    name: 'Vivid',
    background: 'var(--background)',
    text: 'var(--foreground)',
    border: 'var(--border)',
    palette: [
      '#FF5F5F', // vibrant red
      '#5FBCFF', // bright blue
      '#5FFF8F', // lime green
      '#FF5FF7', // pink
      '#FFDD5F', // yellow
      '#BE5FFF'  // purple
    ],
    highlight: '#FF3838',
    accent: '#3C82F6'
  },
  pastel: {
    name: 'Pastel',
    background: 'var(--background)',
    text: 'var(--foreground)',
    border: 'var(--border)',
    palette: [
      '#FFB6C1', // light pink
      '#B6E6FF', // light blue
      '#B6FFD9', // light green
      '#FFE0B6', // light orange
      '#E0B6FF', // light purple
      '#D9FFB6'  // light yellow-green
    ],
    highlight: '#FFB6C1',
    accent: '#B6E6FF'
  },
  corporate: {
    name: 'Corporate',
    background: 'var(--background)',
    text: 'var(--foreground)',
    border: 'var(--border)',
    palette: [
      '#004D99', // dark blue
      '#006666', // teal
      '#004D00', // dark green
      '#660066', // purple
      '#663300', // brown
      '#666600'  // olive
    ],
    highlight: '#990000',
    accent: '#003366'
  },
  retro: {
    name: 'Retro',
    background: 'var(--background)',
    text: 'var(--foreground)',
    border: 'var(--border)',
    palette: [
      '#FF6E4A', // coral
      '#1A8FFF', // bright blue
      '#FFD300', // yellow
      '#FF4ADE', // pink
      '#1FCE4A', // green
      '#7B4AFF'  // purple
    ],
    highlight: '#FF0000',
    accent: '#FFD300'
  },
  cyberpunk: {
    name: 'Cyberpunk',
    background: 'var(--background)',
    text: 'var(--foreground)',
    border: 'var(--border)',
    palette: [
      '#FF00FF', // magenta
      '#00FFFF', // cyan
      '#FFF200', // bright yellow
      '#0AFF0A', // neon green
      '#FF71CE', // hot pink
      '#01CDFE'  // bright blue
    ],
    highlight: '#FF00FF',
    accent: '#00FFFF'
  },
  monochrome: {
    name: 'Monochrome',
    background: 'var(--background)',
    text: 'var(--foreground)',
    border: 'var(--border)',
    palette: [
      '#111111', // near black
      '#333333', // dark gray
      '#555555', // medium gray
      '#777777', // gray
      '#999999', // light gray
      '#BBBBBB'  // very light gray
    ],
    highlight: '#000000',
    accent: '#444444'
  },
  synthwave: {
    name: 'Synthwave',
    background: 'var(--background)',
    text: 'var(--foreground)',
    border: 'var(--border)',
    palette: [
      '#FF41B4', // pink
      '#7B61FF', // purple
      '#03EDF9', // cyan
      '#FE75FE', // magenta
      '#03E9F4', // teal
      '#FF9933'  // orange
    ],
    highlight: '#FF41B4',
    accent: '#7B61FF'
  }
};

/**
 * User-defined themes storage key
 */
const USER_THEMES_STORAGE_KEY = 'randomizer-user-themes';

/**
 * Gets all available randomizer themes (built-in and user-defined)
 * @returns Array of all randomizer themes
 */
export const getAllRandomizerThemes = (): RandomizerTheme[] => {
  const builtInThemes = Object.values(BUILT_IN_THEMES);
  const userThemes = getUserThemes();
  return [...builtInThemes, ...userThemes];
};

/**
 * Get user-defined themes from localStorage
 * @returns Array of user-defined themes
 */
export const getUserThemes = (): RandomizerTheme[] => {
  try {
    const themesJson = localStorage.getItem(USER_THEMES_STORAGE_KEY);
    if (!themesJson) return [];
    return JSON.parse(themesJson);
  } catch (e) {
    console.error('Error loading user themes:', e);
    return [];
  }
};

/**
 * Save a new user-defined theme
 * @param theme Theme to save
 * @returns Boolean indicating success
 */
export const saveUserTheme = (theme: RandomizerTheme): boolean => {
  try {
    // Make sure theme has a unique name
    const userThemes = getUserThemes();
    
    // Check if theme with this name already exists
    const existingIndex = userThemes.findIndex(t => t.name === theme.name);
    
    // Replace if exists, add if not
    if (existingIndex >= 0) {
      userThemes[existingIndex] = theme;
    } else {
      userThemes.push(theme);
    }
    
    localStorage.setItem(USER_THEMES_STORAGE_KEY, JSON.stringify(userThemes));
    return true;
  } catch (e) {
    console.error('Error saving user theme:', e);
    return false;
  }
};

/**
 * Delete a user-defined theme
 * @param themeName Name of theme to delete
 * @returns Boolean indicating success
 */
export const deleteUserTheme = (themeName: string): boolean => {
  try {
    const userThemes = getUserThemes();
    const filteredThemes = userThemes.filter(theme => theme.name !== themeName);
    
    // Only proceed if we actually found and filtered out a theme
    if (filteredThemes.length < userThemes.length) {
      localStorage.setItem(USER_THEMES_STORAGE_KEY, JSON.stringify(filteredThemes));
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('Error deleting user theme:', e);
    return false;
  }
};

/**
 * Get a theme by name (built-in or user-defined)
 * @param themeName Name of theme to retrieve
 * @returns Theme object or undefined if not found
 */
export const getThemeByName = (themeName: string): RandomizerTheme | undefined => {
  // Check built-in themes first
  if (BUILT_IN_THEMES[themeName]) {
    return BUILT_IN_THEMES[themeName];
  }
  
  // Then check user themes
  const userThemes = getUserThemes();
  return userThemes.find(theme => theme.name === themeName);
};

/**
 * Generate theme list for selection component
 * @returns Array of objects with value and label for each theme
 */
export const getThemeOptions = (): Array<{ value: string, label: string, isCustom?: boolean }> => {
  const builtInOptions = Object.values(BUILT_IN_THEMES).map(theme => ({
    value: theme.name,
    label: theme.name
  }));
  
  const userOptions = getUserThemes().map(theme => ({
    value: theme.name,
    label: `${theme.name} (Custom)`,
    isCustom: true
  }));
  
  return [...builtInOptions, ...userOptions];
};

/**
 * Generate a new custom theme based on the current app theme
 * @returns A new theme object with colors based on current app theme
 */
export const generateThemeFromCurrent = (): RandomizerTheme => {
  const currentTheme = themeService.getCurrentTheme();
  const themeName = `Custom ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
  
  // Get CSS variables from root to generate theme colors
  const root = document.documentElement;
  const getProp = (prop: string) => getComputedStyle(root).getPropertyValue(prop).trim();
  
  return {
    name: themeName,
    background: getProp('--background'),
    text: getProp('--foreground'),
    border: getProp('--border'),
    palette: [
      getProp('--primary'),
      getProp('--secondary'),
      getProp('--accent'),
      '#' + Math.floor(Math.random()*16777215).toString(16), // Random color 1
      '#' + Math.floor(Math.random()*16777215).toString(16), // Random color 2
      '#' + Math.floor(Math.random()*16777215).toString(16)  // Random color 3
    ],
    highlight: getProp('--destructive'),
    accent: getProp('--primary')
  };
};