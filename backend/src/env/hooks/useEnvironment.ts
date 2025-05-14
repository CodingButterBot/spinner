/**
 * React hook for accessing environment utilities
 * Provides a convenient way to use the environment abstraction layer in React components
 */
import { useState, useEffect } from 'react';
import { isExtensionEnvironment, extension, messaging, utils } from '../index';

/**
 * Environment hook that provides environment-specific functionality to React components
 */
export function useEnvironment() {
  const [isExtension, setIsExtension] = useState<boolean>(isExtensionEnvironment());
  const [isDev, setIsDev] = useState<boolean>(utils.isDevelopment());
  const [browserName, setBrowserName] = useState<string>(utils.getBrowserName());
  const [prefersDark, setPrefersDark] = useState<boolean>(utils.prefersDarkMode());

  useEffect(() => {
    // Update the dark mode preference when it changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersDark(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return {
    // Environment detection
    isExtension,
    isDev,
    browserName,
    prefersDark,
    
    // Extension API wrappers
    extension,
    
    // Messaging utilities
    messaging,
    
    // Utility functions
    utils,
    
    // Convenience methods
    getAssetUrl: utils.getAssetUrl,
    openOptionsPage: utils.openOptionsPage,
    getVersion: utils.getVersion
  };
}

export default useEnvironment;