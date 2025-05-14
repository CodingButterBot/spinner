/**
 * @file Chrome extension service worker
 * @description Background script that handles extension functionality even when the UI is not open
 * @module serviceWorker
 */
import { extension } from '../env';

/**
 * @typedef {Object} Settings
 * @property {string} theme - Theme preference ('light', 'dark', or 'system')
 * @property {boolean} autoOpenSidePanel - Whether to automatically open side panel
 * @property {boolean} soundEffects - Whether sound effects are enabled
 * @property {boolean} animations - Whether animations are enabled
 */

/**
 * Initializes the extension
 * Creates context menu and sets up event handlers
 */
function initializeExtension() {
  // Create context menu item for opening the side panel
  extension.contextMenus.create({
    id: 'open-spinpick-sidepanel',
    title: 'Open SpinPick',
    contexts: ['all']
  });

  // Set up event handlers
  setupEventListeners();
}

/**
 * Sets up all event listeners for the extension
 */
function setupEventListeners() {
  // Handle extension installation or update
  extension.runtime.onInstalled.addListener(handleInstallation);
  
  // Handle context menu clicks
  extension.contextMenus.onClicked.addListener(handleContextMenuClick);
}

/**
 * Handles extension installation or update
 * Sets default settings and opens options page on install
 *
 * @param {chrome.runtime.InstalledDetails} details - Installation details
 */
async function handleInstallation(details: chrome.runtime.InstalledDetails) {
  console.log('SpinPick extension installed:', details);

  // Set default settings
  const currentSettings = await extension.storage.local.get([
    'theme', 
    'autoOpenSidePanel', 
    'soundEffects', 
    'animations'
  ]) as any;
  
  const defaults: Record<string, any> = {};
  
  if (currentSettings.theme === undefined) {
    defaults.theme = 'system';
  }

  if (currentSettings.autoOpenSidePanel === undefined) {
    defaults.autoOpenSidePanel = false;
  }

  if (currentSettings.soundEffects === undefined) {
    defaults.soundEffects = true;
  }

  if (currentSettings.animations === undefined) {
    defaults.animations = true;
  }
  
  // Save any missing default settings
  if (Object.keys(defaults).length > 0) {
    await extension.storage.local.set(defaults);
  }

  // Open options page on install
  if (details.reason === 'install') {
    // In the future we can add a method to the env abstraction for this
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.openOptionsPage();
    }
  }
}

/**
 * Handle context menu clicks
 *
 * @param {Object} info - Information about the context menu click
 * @param {Object} tab - Information about the current tab
 */
async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData, 
  tab?: chrome.tabs.Tab
) {
  if (info.menuItemId === 'open-spinpick-sidepanel' && tab && tab.id && tab.windowId) {
    await extension.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidepanel.html'
    });
    
    await extension.sidePanel.open({
      windowId: tab.windowId
    });
  }
}

// Initialize the extension
initializeExtension();

// Export empty object to satisfy module requirements
export {};