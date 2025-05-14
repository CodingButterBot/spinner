/**
 * @file Chrome extension service worker
 * @description Background script that handles extension functionality even when the UI is not open
 * @module serviceWorker
 */

/**
 * @typedef {Object} Settings
 * @property {string} theme - Theme preference ('light', 'dark', or 'system')
 * @property {boolean} autoOpenSidePanel - Whether to automatically open side panel
 * @property {boolean} soundEffects - Whether sound effects are enabled
 * @property {boolean} animations - Whether animations are enabled
 */

/**
 * Handles extension installation or update
 * Sets default settings and opens options page on install
 * Also creates the context menu item for opening the side panel
 *
 * @param {chrome.runtime.InstalledDetails} details - Installation details
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('SpinPick extension installed:', details);

  // Set default settings
  chrome.storage.sync.get(['theme', 'autoOpenSidePanel', 'soundEffects', 'animations'], (result) => {
    if (result.theme === undefined) {
      chrome.storage.sync.set({ theme: 'system' });
    }

    if (result.autoOpenSidePanel === undefined) {
      chrome.storage.sync.set({ autoOpenSidePanel: false });
    }

    if (result.soundEffects === undefined) {
      chrome.storage.sync.set({ soundEffects: true });
    }

    if (result.animations === undefined) {
      chrome.storage.sync.set({ animations: true });
    }
  });

  // Create context menu item for opening the side panel
  chrome.contextMenus.create({
    id: 'open-spinpick-sidepanel',
    title: 'Open SpinPick',
    contexts: ['all']
  });

  // Open options page on install
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});

/**
 * Message handler for communication between extension components
 * 
 * @param {Object} message - Message object
 * @param {string} message.action - Action to perform
 * @param {string} [message.path] - Path for sidepanel
 * @param {Object} [message.settings] - Settings to save
 * @param {chrome.runtime.MessageSender} sender - Message sender
 * @param {Function} sendResponse - Function to send response
 * @returns {boolean} - Whether the response will be sent asynchronously
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  if (message.action === 'openSidePanel' && sender.tab && sender.tab.id) {
    chrome.sidePanel.setOptions({
      tabId: sender.tab.id,
      path: message.path || 'sidepanel.html'
    });
    if (sender.tab.windowId) {
      chrome.sidePanel.open({windowId: sender.tab.windowId});
    } else {
      chrome.windows.getCurrent(window => {
        if (window && window.id) {
          chrome.sidePanel.open({windowId: window.id});
        }
      });
    }
    sendResponse({ success: true });
  }
  
  if (message.action === 'getSettings') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse({ settings });
    });
    return true; // Required for async sendResponse
  }
  
  if (message.action === 'saveSettings') {
    chrome.storage.sync.set(message.settings, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async sendResponse
  }
});

/**
 * Handles keyboard shortcuts defined in the manifest
 *
 * @param {string} command - The command shortcut that was activated
 */
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);

  if (command === 'open-wheel' || command === 'open-slot') {
    const path = command === 'open-wheel' ? 'sidepanel.html#wheel' : 'sidepanel.html#slot';

    // Get the current active tab and window
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        chrome.sidePanel.setOptions({
          tabId: tabs[0].id,
          path: path
        });

        chrome.windows.getCurrent(window => {
          if (window && window.id) {
            chrome.sidePanel.open({windowId: window.id});
          }
        });
      }
    });
  }
});

/**
 * Handle context menu clicks
 *
 * @param {Object} info - Information about the context menu click
 * @param {Object} tab - Information about the current tab
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-spinpick-sidepanel' && tab && tab.id && tab.windowId) {
    chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidepanel.html'
    });
    chrome.sidePanel.open({windowId: tab.windowId});
  }
});

/**
 * Keeps the service worker alive when needed 
 * Checks if keepAlive is enabled in local storage
 */
const keepAlive = () => {
  const interval = 20000; // 20 seconds
  let lastPing = Date.now();
  
  // Check if we need to stay alive
  chrome.storage.local.get(['keepAlive'], (result) => {
    if (result.keepAlive) {
      setInterval(() => {
        const now = Date.now();
        if (now - lastPing >= interval) {
          lastPing = now;
          console.log('Keeping service worker alive');
          // Perform any background tasks that need to run periodically
        }
      }, interval);
    }
  });
};

keepAlive();

/**
 * Listens for extension updates
 * 
 * @param {chrome.runtime.OnUpdateAvailableDetails} details - Update details
 */
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log('Update available:', details);
  // Optionally notify the user about the update
});

// Export empty object to satisfy module requirements
export {};