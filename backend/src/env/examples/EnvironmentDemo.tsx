import React, { useEffect, useState } from 'react';
import { useEnvironment, useStorage } from '../hooks';

/**
 * Example component demonstrating the usage of the environment abstraction layer
 */
const EnvironmentDemo: React.FC = () => {
  const env = useEnvironment();
  const [message, setMessage] = useState<string>('');
  const [settings, setSettings, removeSettings] = useStorage<{
    theme: string;
    animations: boolean;
    soundEffects: boolean;
  }>('settings', {
    defaultValue: {
      theme: 'system',
      animations: true,
      soundEffects: true
    }
  });

  // Example of using the messaging system
  useEffect(() => {
    // Set up a message listener
    const unsubscribe = env.messaging.addMessageListener((message, sender, sendResponse) => {
      console.log('Message received:', message);
      if (message.action === 'ping') {
        sendResponse({ action: 'pong', timestamp: Date.now() });
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [env.messaging]);

  // Example of sending a message
  const sendPing = async () => {
    try {
      const response = await env.messaging.sendMessage({ action: 'ping', data: 'Hello!' });
      setMessage(`Response: ${JSON.stringify(response)}`);
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  // Toggle animations setting
  const toggleAnimations = () => {
    if (settings) {
      setSettings({
        ...settings,
        animations: !settings.animations
      });
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    if (settings) {
      const nextTheme = settings.theme === 'light' ? 'dark' : 
                        settings.theme === 'dark' ? 'system' : 'light';
      setSettings({
        ...settings,
        theme: nextTheme
      });
    }
  };

  // Open side panel (extension only)
  const openSidePanel = async () => {
    try {
      // Get the current tab
      const tabs = await env.extension.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0 && tabs[0].id) {
        // Set side panel options
        await env.extension.sidePanel.setOptions({
          tabId: tabs[0].id,
          path: '/sidepanel.html'
        });
        
        // Open the side panel
        if (tabs[0].windowId) {
          await env.extension.sidePanel.open({
            windowId: tabs[0].windowId
          });
          setMessage('Side panel opened successfully');
        }
      }
    } catch (error) {
      setMessage(`Error opening side panel: ${error}`);
    }
  };

  return (
    <div className="p-4 bg-surface text-foreground">
      <h1 className="text-2xl font-bold mb-4">Environment Demo</h1>
      
      <div className="mb-6 p-4 bg-surface-2 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Environment Info</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Running in: <strong>{env.isExtension ? 'Extension' : 'Web'}</strong></li>
          <li>Mode: <strong>{env.isDev ? 'Development' : 'Production'}</strong></li>
          <li>Browser: <strong>{env.browserName}</strong></li>
          <li>Prefers Dark Mode: <strong>{env.prefersDark ? 'Yes' : 'No'}</strong></li>
          <li>Version: <strong>{env.getVersion()}</strong></li>
        </ul>
      </div>
      
      <div className="mb-6 p-4 bg-surface-2 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Storage Demo</h2>
        {settings && (
          <div className="space-y-2">
            <div>Theme: <strong>{settings.theme}</strong></div>
            <div>Animations: <strong>{settings.animations ? 'Enabled' : 'Disabled'}</strong></div>
            <div>Sound Effects: <strong>{settings.soundEffects ? 'Enabled' : 'Disabled'}</strong></div>
            
            <div className="flex space-x-2 mt-4">
              <button 
                onClick={toggleTheme}
                className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Toggle Theme
              </button>
              <button 
                onClick={toggleAnimations}
                className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Toggle Animations
              </button>
              <button 
                onClick={removeSettings}
                className="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
              >
                Reset Settings
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-6 p-4 bg-surface-2 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Messaging Demo</h2>
        <button 
          onClick={sendPing}
          className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Send Ping
        </button>
        {message && <div className="mt-2">{message}</div>}
      </div>
      
      {env.isExtension && (
        <div className="mb-6 p-4 bg-surface-2 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Extension API Demo</h2>
          <button 
            onClick={openSidePanel}
            className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Open Side Panel
          </button>
          <button 
            onClick={env.utils.openOptionsPage}
            className="ml-2 px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Open Options Page
          </button>
        </div>
      )}
    </div>
  );
};

export default EnvironmentDemo;