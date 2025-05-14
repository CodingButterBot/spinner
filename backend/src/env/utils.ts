/**
 * Environment utilities
 * Helper functions for environment-specific functionality
 */
import { isExtensionEnvironment } from './index';

/**
 * Get the base URL for asset loading
 * In extension: chrome.runtime.getURL
 * In web: Relative to the current page
 */
export const getAssetUrl = (path: string): string => {
  if (isExtensionEnvironment() && chrome.runtime) {
    return chrome.runtime.getURL(path);
  }
  // For web, just use the path as-is (assuming assets are in the public directory)
  return `/${path.replace(/^\//, '')}`;
};

/**
 * Opens the options page
 * In extension: chrome.runtime.openOptionsPage
 * In web: Navigate to the options page URL
 */
export const openOptionsPage = (): void => {
  if (isExtensionEnvironment() && chrome.runtime) {
    chrome.runtime.openOptionsPage();
  } else {
    // In web, navigate to the options page directly
    window.location.href = '/options.html';
  }
};

/**
 * Get the version of the application
 * In extension: Reads from chrome.runtime.getManifest
 * In web: Returns a mock version or reads from environment variable
 */
export const getVersion = (): string => {
  if (isExtensionEnvironment() && chrome.runtime) {
    const manifest = chrome.runtime.getManifest();
    return manifest.version;
  }
  
  // For web environment, either use an environment variable or return a default
  return process.env.APP_VERSION || '0.0.0-dev';
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  // In extension, check for development conditions
  if (isExtensionEnvironment()) {
    // Check if loaded as an unpacked extension
    return !!(chrome.runtime.getManifest().key === undefined);
  }
  
  // In web environment, check environment variables
  return process.env.NODE_ENV === 'development';
};

/**
 * Log with environment context
 * Adds '[Extension]' or '[Web]' prefix to help with debugging
 */
export const contextLog = (message: string, ...args: any[]): void => {
  const prefix = isExtensionEnvironment() ? '[Extension]' : '[Web]';
  console.log(`${prefix} ${message}`, ...args);
};

/**
 * Detect the user's preferred color scheme
 * Uses window.matchMedia in both environments
 */
export const prefersDarkMode = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Get the browser name
 * Useful for browser-specific behavior
 */
export const getBrowserName = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) {
    return 'chrome';
  } else if (userAgent.includes('Firefox')) {
    return 'firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'safari';
  } else if (userAgent.includes('Edg')) {
    return 'edge';
  } else if (userAgent.includes('OPR') || userAgent.includes('Opera')) {
    return 'opera';
  }
  
  return 'unknown';
};

export default {
  getAssetUrl,
  openOptionsPage,
  getVersion,
  isDevelopment,
  contextLog,
  prefersDarkMode,
  getBrowserName
};