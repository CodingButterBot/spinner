/**
 * Environment abstraction layer
 * Provides a unified interface for environment-specific functionality
 * 
 * This module serves as a compatibility layer between web and extension environments,
 * allowing code to run seamlessly in both contexts.
 */

// Import environment modules
import * as messaging from './messaging';
import * as utils from './utils';

// Re-export modules
export { messaging, utils };

/**
 * Determines if the code is running in a Chrome extension environment
 */
export const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' && chrome.runtime !== undefined;
};

/**
 * Extension API wrappers with fallbacks for web environment
 * These provide safe implementations of Chrome extension APIs that
 * either call the real API in an extension context or provide
 * mock implementations in a web context.
 */
export const extension = {
  // SidePanel API
  sidePanel: {
    setOptions: async (options: { tabId?: number; path: string }): Promise<void> => {
      if (isExtensionEnvironment()) {
        return chrome.sidePanel.setOptions(options);
      }
      utils.contextLog('sidePanel.setOptions called with:', options);
      return Promise.resolve();
    },
    
    open: async (options?: { windowId?: number }): Promise<void> => {
      if (isExtensionEnvironment()) {
        return chrome.sidePanel.open(options);
      }
      utils.contextLog('sidePanel.open called with:', options);
      return Promise.resolve();
    }
  },
  
  // Context Menu API
  contextMenus: {
    create: (properties: chrome.contextMenus.CreateProperties): number | string => {
      if (isExtensionEnvironment()) {
        return chrome.contextMenus.create(properties);
      }
      utils.contextLog('contextMenus.create called with:', properties);
      return 'dev-menu-item';
    },
    
    onClicked: {
      addListener: (callback: (info: any, tab?: chrome.tabs.Tab) => void): void => {
        if (isExtensionEnvironment()) {
          chrome.contextMenus.onClicked.addListener(callback);
          return;
        }
        utils.contextLog('contextMenus.onClicked.addListener registered');
      }
    }
  },
  
  // Runtime API
  runtime: {
    getURL: (path: string): string => {
      if (isExtensionEnvironment()) {
        return chrome.runtime.getURL(path);
      }
      // For development, just return the path relative to the dev server
      return path;
    },
    
    getManifest: (): chrome.runtime.Manifest => {
      if (isExtensionEnvironment()) {
        return chrome.runtime.getManifest();
      }
      // Return a mock manifest for development
      return {
        name: 'SpinPick (Dev)',
        version: '0.0.0-dev',
        manifest_version: 3,
        description: 'Development version of SpinPick'
      } as chrome.runtime.Manifest;
    },
    
    onInstalled: {
      addListener: (callback: (details: chrome.runtime.InstalledDetails) => void): void => {
        if (isExtensionEnvironment()) {
          chrome.runtime.onInstalled.addListener(callback);
          return;
        }
        utils.contextLog('runtime.onInstalled.addListener registered');
        // In dev, trigger the callback immediately to simulate installation
        setTimeout(() => {
          callback({ reason: 'install' } as chrome.runtime.InstalledDetails);
        }, 100);
      }
    }
  },
  
  // Tabs API
  tabs: {
    query: async (queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> => {
      if (isExtensionEnvironment()) {
        return new Promise((resolve) => {
          chrome.tabs.query(queryInfo, (tabs) => {
            resolve(tabs);
          });
        });
      }
      // Return a mock tab for development
      utils.contextLog('tabs.query called with:', queryInfo);
      return Promise.resolve([{
        id: 1,
        index: 0,
        windowId: 1,
        highlighted: true,
        active: true,
        pinned: false,
        url: window.location.href,
        title: document.title
      } as chrome.tabs.Tab]);
    },
    
    sendMessage: async <T = any, R = any>(tabId: number, message: T): Promise<R> => {
      if (isExtensionEnvironment()) {
        return new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response as R);
            }
          });
        });
      }
      utils.contextLog('tabs.sendMessage called with:', { tabId, message });
      return Promise.resolve({ success: false, error: 'Not in extension environment' } as unknown as R);
    }
  },
  
  // Storage API
  storage: {
    local: {
      get: async <T = any>(keys?: string | string[] | null): Promise<T> => {
        if (isExtensionEnvironment()) {
          return new Promise((resolve) => {
            chrome.storage.local.get(keys, (result) => {
              resolve(result as T);
            });
          });
        }
        
        // Use localStorage as fallback in development
        if (!keys) {
          // Return all items
          return Object.entries(localStorage).reduce((acc, [key, value]) => {
            try {
              (acc as any)[key] = JSON.parse(value);
            } catch {
              (acc as any)[key] = value;
            }
            return acc;
          }, {} as T);
        }
        
        if (typeof keys === 'string') {
          const value = localStorage.getItem(keys);
          return ({ [keys]: value ? JSON.parse(value) : null } as T);
        }
        
        // Handle array of keys
        return keys.reduce((acc, key) => {
          const value = localStorage.getItem(key);
          (acc as any)[key] = value ? JSON.parse(value) : null;
          return acc;
        }, {} as T);
      },
      
      set: async (items: { [key: string]: any }): Promise<void> => {
        if (isExtensionEnvironment()) {
          return new Promise((resolve) => {
            chrome.storage.local.set(items, () => {
              resolve();
            });
          });
        }
        
        // Use localStorage in development
        Object.entries(items).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        
        return Promise.resolve();
      },
      
      remove: async (keys: string | string[]): Promise<void> => {
        if (isExtensionEnvironment()) {
          return new Promise((resolve) => {
            chrome.storage.local.remove(keys, () => {
              resolve();
            });
          });
        }
        
        // Use localStorage in development
        if (typeof keys === 'string') {
          localStorage.removeItem(keys);
        } else {
          keys.forEach(key => localStorage.removeItem(key));
        }
        
        return Promise.resolve();
      }
    },
    
    // Add sync storage support
    sync: {
      get: async <T = any>(keys?: string | string[] | null): Promise<T> => {
        if (isExtensionEnvironment()) {
          return new Promise((resolve) => {
            chrome.storage.sync.get(keys, (result) => {
              resolve(result as T);
            });
          });
        }
        
        // In web, just use the local storage implementation
        return extension.storage.local.get<T>(keys);
      },
      
      set: async (items: { [key: string]: any }): Promise<void> => {
        if (isExtensionEnvironment()) {
          return new Promise((resolve) => {
            chrome.storage.sync.set(items, () => {
              resolve();
            });
          });
        }
        
        // In web, just use the local storage implementation
        return extension.storage.local.set(items);
      },
      
      remove: async (keys: string | string[]): Promise<void> => {
        if (isExtensionEnvironment()) {
          return new Promise((resolve) => {
            chrome.storage.sync.remove(keys, () => {
              resolve();
            });
          });
        }
        
        // In web, just use the local storage implementation
        return extension.storage.local.remove(keys);
      }
    }
  }
};

// Export a default object with all environment utilities
export default {
  isExtensionEnvironment,
  extension,
  messaging,
  utils
};