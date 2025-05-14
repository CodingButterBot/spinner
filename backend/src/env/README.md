# Environment Abstraction Layer

This module provides a unified interface for environment-specific functionality, allowing code to run seamlessly in both web and extension contexts. This is particularly useful for developing and testing extension functionality in a standard web environment before deploying it as an extension.

## Core Concepts

The environment abstraction layer is built around several key concepts:

1. **Environment Detection**: Determines whether the code is running in a Chrome extension or a regular web context
2. **API Wrappers**: Provides safe implementations of Chrome extension APIs with fallbacks for web environments
3. **Messaging System**: Unified communication between components in both environments
4. **Storage Abstraction**: Consistent storage API that adapts to the current environment
5. **React Hooks**: Convenient React hooks for accessing environment functionality in components

## Getting Started

### Basic Usage

Import the environment utilities:

```typescript
import env from '@/env';

// Check the current environment
if (env.isExtensionEnvironment()) {
  // Running in extension environment
  console.log('Running in extension environment');
} else {
  // Running in web environment
  console.log('Running in web environment');
}

// Use extension APIs safely in any environment
env.extension.storage.local.set({ key: 'value' });
```

### With React

Use the provided React hooks:

```tsx
import { useEnvironment, useStorage } from '@/env/hooks';

function MyComponent() {
  const env = useEnvironment();
  const [settings, setSettings] = useStorage('settings', {
    defaultValue: { theme: 'light' }
  });

  return (
    <div>
      <h1>Running in {env.isExtension ? 'Extension' : 'Web'}</h1>
      <p>Current theme: {settings?.theme}</p>
      <button onClick={() => setSettings({ theme: 'dark' })}>
        Switch to Dark Theme
      </button>
    </div>
  );
}
```

## API Reference

### Core Module

- `isExtensionEnvironment()`: Determines if running in a Chrome extension
- `extension`: Extension API wrappers
  - `sidePanel`: Side panel APIs
  - `contextMenus`: Context menu APIs
  - `runtime`: Runtime APIs
  - `tabs`: Tabs APIs
  - `storage`: Storage APIs (both local and sync)

### Messaging

- `messaging.sendMessage(message)`: Send a message to different parts of the application
- `messaging.addMessageListener(handler)`: Listen for messages from different parts of the application
- `messaging.sendMessageToTab(tabId, message)`: Send a message to a specific tab (extension only)

### Utils

- `utils.getAssetUrl(path)`: Get the base URL for asset loading
- `utils.openOptionsPage()`: Opens the options page
- `utils.getVersion()`: Get the version of the application
- `utils.isDevelopment()`: Check if running in development mode
- `utils.contextLog(message, ...args)`: Log with environment context
- `utils.prefersDarkMode()`: Detect the user's preferred color scheme
- `utils.getBrowserName()`: Get the current browser name

### React Hooks

- `useEnvironment()`: React hook for accessing environment utilities
- `useStorage(key, options)`: React hook for accessing synchronized storage

## Examples

### Opening the Side Panel

```typescript
import env from '@/env';

async function openSidePanel() {
  try {
    // Get the current tab
    const tabs = await env.extension.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0 && tabs[0].id) {
      // Configure which path to load in the side panel
      await env.extension.sidePanel.setOptions({
        tabId: tabs[0].id,
        path: '/sidepanel.html'
      });
      
      // Open the side panel
      await env.extension.sidePanel.open();
      console.log('Side panel opened successfully');
    }
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
}
```

### Using the Storage APIs

```typescript
import env from '@/env';

// Save settings
async function saveSettings(settings) {
  try {
    await env.extension.storage.local.set({ settings });
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Load settings
async function loadSettings() {
  try {
    const result = await env.extension.storage.local.get(['settings']);
    return result.settings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
}
```

### Using the Messaging System

```typescript
import { messaging } from '@/env';

// Send a message
async function sendPing() {
  try {
    const response = await messaging.sendMessage({ action: 'ping', data: 'Hello!' });
    console.log('Received response:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Listen for messages
function setupMessageListener() {
  const unsubscribe = messaging.addMessageListener((message, sender, sendResponse) => {
    console.log('Message received:', message);
    if (message.action === 'ping') {
      sendResponse({ action: 'pong', timestamp: Date.now() });
    }
  });
  
  // Return the unsubscribe function to remove the listener when needed
  return unsubscribe;
}
```

## Development and Testing

During development and testing in a web environment, the abstraction layer provides mock implementations of Chrome extension APIs. These mock implementations log their calls to the console and provide sensible default behaviors.

For example, when `chrome.storage.local.set()` is called in a web environment, the abstraction layer uses `localStorage` to store the data. This allows developers to test extension functionality without having to constantly load the extension into a browser.

## Best Practices

1. **Always use the abstraction layer**: Never use Chrome extension APIs directly
2. **Use the React hooks**: They provide a convenient way to access environment functionality
3. **Handle errors gracefully**: All API calls may fail, especially when crossing environment boundaries
4. **Use the messaging system**: It provides a consistent way to communicate between components
5. **Think environment-first**: Design your code to work in both web and extension environments

## Implementation Details

### Web Environment Simulations

For the web environment, we provide several types of simulations:

- **Storage**: Uses `localStorage` for both local and sync storage
- **Messaging**: Uses a custom event system to simulate extension messaging
- **Side Panel**: Logs calls but doesn't actually do anything
- **Context Menus**: Logs calls but doesn't actually create menu items

### Extension Environment

In the extension environment, we use the real Chrome extension APIs but wrap them in promises to provide a consistent interface. This ensures that your code works the same way in both environments.