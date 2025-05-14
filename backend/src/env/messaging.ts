/**
 * Messaging abstraction layer
 * Provides unified communication between components in both web and extension environments
 */
import { isExtensionEnvironment } from './index';

// Create a custom event bus for web environment
const eventBus = new EventTarget();

type MessageHandler<T = any> = (
  message: T,
  sender?: chrome.runtime.MessageSender,
  sendResponse?: (response?: any) => void
) => void | boolean | Promise<any>;

type MessageListener<T = any> = (
  message: T,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => void | boolean | Promise<any>;

/**
 * Send a message to different parts of the application
 * In extension: Uses chrome.runtime.sendMessage
 * In web: Uses custom event system
 */
export const sendMessage = async <T = any, R = any>(message: T): Promise<R> => {
  if (isExtensionEnvironment()) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(response as R);
        }
      });
    });
  } else {
    // In web environment, use the event bus
    return new Promise((resolve) => {
      // Create a unique ID for this message to handle the response
      const messageId = Date.now().toString() + Math.random().toString(36).substring(2);
      const fullMessage = { ...message as object, __messageId: messageId };
      
      // Listen for the response
      const responseHandler = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.__responseId === messageId) {
          eventBus.removeEventListener('response', responseHandler);
          resolve(customEvent.detail.data);
        }
      };
      
      eventBus.addEventListener('response', responseHandler);
      
      // Dispatch the message
      eventBus.dispatchEvent(new CustomEvent('message', { 
        detail: fullMessage 
      }));
      
      // Add a timeout to prevent hanging promises
      setTimeout(() => {
        eventBus.removeEventListener('response', responseHandler);
        resolve({ success: false, error: 'Message timeout' } as unknown as R);
      }, 5000);
    });
  }
};

/**
 * Listen for messages from different parts of the application
 * In extension: Uses chrome.runtime.onMessage
 * In web: Uses custom event system
 */
export const addMessageListener = <T = any>(handler: MessageHandler<T>): (() => void) => {
  if (isExtensionEnvironment()) {
    // Create a wrapper function for the Chrome extension environment
    const chromeHandler: MessageListener = (message, sender, sendResponse) => {
      const result = handler(message, sender, sendResponse);
      
      // If the handler returns a Promise, properly handle the async response
      if (result instanceof Promise) {
        result.then(sendResponse);
        return true; // Tell Chrome we'll call sendResponse asynchronously
      }
      
      return result;
    };
    
    chrome.runtime.onMessage.addListener(chromeHandler);
    
    // Return a function to remove the listener
    return () => {
      chrome.runtime.onMessage.removeListener(chromeHandler);
    };
  } else {
    // For web, use the event bus
    const webHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const message = customEvent.detail;
      const messageId = message.__messageId;
      
      // Create a sendResponse function similar to Chrome's
      const sendResponse = (response: any) => {
        eventBus.dispatchEvent(new CustomEvent('response', {
          detail: {
            __responseId: messageId,
            data: response
          }
        }));
      };
      
      // Call the handler (without sender in web environment)
      const result = handler(message, undefined, sendResponse);
      
      // If the handler returns a promise, handle the async response
      if (result instanceof Promise) {
        result.then(sendResponse);
      }
    };
    
    eventBus.addEventListener('message', webHandler);
    
    // Return a function to remove the listener
    return () => {
      eventBus.removeEventListener('message', webHandler);
    };
  }
};

/**
 * Send a message to a specific tab (extension only, noop in web)
 */
export const sendMessageToTab = async <T = any, R = any>(
  tabId: number, 
  message: T
): Promise<R> => {
  if (isExtensionEnvironment()) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message to tab:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(response as R);
        }
      });
    });
  } else {
    console.log('[DEV] sendMessageToTab called with:', { tabId, message });
    return Promise.resolve({ success: false, error: 'Not supported in web environment' } as unknown as R);
  }
};

export default {
  sendMessage,
  addMessageListener,
  sendMessageToTab
};