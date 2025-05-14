/**
 * Usage example for the environment abstraction layer
 */
import { isExtensionEnvironment, extension } from './index';

// Example function that works in both environments
export async function initializeApp() {
  console.log(`Running in ${isExtensionEnvironment() ? 'extension' : 'web'} environment`);
  
  // Register context menu (only works in extension, safely ignored in web)
  extension.contextMenus.create({
    id: 'open-sidepanel',
    title: 'Open SpinPick',
    contexts: ['all']
  });
  
  // Add context menu click listener
  extension.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'open-sidepanel' && tab?.id) {
      openSidePanel(tab.id);
    }
  });
  
  // Set up other extension events
  extension.runtime.onInstalled.addListener((details) => {
    console.log(`Extension installed: ${details.reason}`);
    saveDefaultSettings();
  });
}

// Example of opening side panel that works in both environments
export async function openSidePanel(tabId: number) {
  try {
    // Configure which path to load in the side panel
    await extension.sidePanel.setOptions({
      tabId,
      path: '/sidepanel.html'
    });
    
    // Open the side panel
    await extension.sidePanel.open();
    console.log('Side panel opened successfully');
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
}

// Example of using storage that works in both environments
export async function saveDefaultSettings() {
  try {
    await extension.storage.local.set({
      theme: 'light',
      animations: true,
      recentSpins: []
    });
    console.log('Default settings saved');
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Example of reading from storage that works in both environments
export async function loadUserSettings() {
  try {
    const settings = await extension.storage.local.get(['theme', 'animations']);
    console.log('User settings loaded:', settings);
    return settings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { theme: 'light', animations: true }; // Default fallback
  }
}