/**
 * React hook for accessing synchronized storage across environments
 */
import { useState, useEffect, useCallback } from 'react';
import { extension } from '../index';

/**
 * Options for the useStorage hook
 */
interface UseStorageOptions {
  /** Use sync storage instead of local storage (in extension environment) */
  useSync?: boolean;
  /** Default value to use if the key is not found */
  defaultValue?: any;
}

/**
 * Hook for using either chrome.storage or localStorage depending on the environment
 * Provides a synchronized state that updates when storage changes
 * 
 * @param key - The storage key to use
 * @param options - Options for the storage hook
 * @returns [value, setValue, removeValue] - A tuple with the current value, a setter, and a removal function
 */
export function useStorage<T>(
  key: string, 
  options: UseStorageOptions = {}
): [T | undefined, (value: T) => Promise<void>, () => Promise<void>] {
  const { useSync = false, defaultValue = undefined } = options;
  const [value, setValue] = useState<T | undefined>(defaultValue);
  const [initialized, setInitialized] = useState(false);

  // Get the storage API to use
  const storage = useSync ? extension.storage.sync : extension.storage.local;

  // Load the initial value from storage
  useEffect(() => {
    const loadValue = async () => {
      try {
        const result = await storage.get<Record<string, T>>([key]);
        setValue(result[key] !== undefined ? result[key] : defaultValue);
      } catch (error) {
        console.error('Failed to load value from storage:', error);
        setValue(defaultValue);
      }
      setInitialized(true);
    };

    loadValue();
  }, [key, defaultValue, storage]);

  // Update the storage when the value changes
  const updateValue = useCallback(async (newValue: T) => {
    setValue(newValue);
    try {
      await storage.set({ [key]: newValue });
    } catch (error) {
      console.error('Failed to update value in storage:', error);
    }
  }, [key, storage]);

  // Remove the value from storage
  const removeValue = useCallback(async () => {
    setValue(undefined);
    try {
      await storage.remove(key);
    } catch (error) {
      console.error('Failed to remove value from storage:', error);
    }
  }, [key, storage]);

  // Listen for storage changes (in extension environment)
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
        const storageArea = useSync ? 'sync' : 'local';
        if (areaName === storageArea && changes[key]) {
          setValue(changes[key].newValue);
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
    
    // No cleanup needed for web environment
    return undefined;
  }, [key, useSync]);

  return [value, updateValue, removeValue];
}

export default useStorage;