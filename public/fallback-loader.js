/**
 * SpinPick Fallback Loader
 * This script detects if the React app fails to load and loads a static fallback version
 * Implementation is CSP-compliant for Chrome extensions
 */

(function() {
  // Configuration
  const FALLBACK_TIMEOUT = 5000; // 5 seconds timeout
  const REACT_ROOT_ID = 'root';
  
  // Helper to check if React has successfully mounted
  function isReactMounted() {
    const rootElement = document.getElementById(REACT_ROOT_ID);
    return rootElement && rootElement.children.length > 0;
  }
  
  // Simple fallback UI that doesn't rely on external files
  function createBasicFallbackUI() {
    const container = document.createElement('div');
    container.style.maxWidth = '800px';
    container.style.margin = '0 auto';
    container.style.padding = '20px';
    container.style.backgroundColor = '#1f2937';
    container.style.color = '#f9fafb';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    const header = document.createElement('h1');
    header.textContent = 'SpinPick';
    header.style.marginBottom = '20px';
    
    const card = document.createElement('div');
    card.style.backgroundColor = '#374151';
    card.style.borderRadius = '8px';
    card.style.padding = '20px';
    card.style.marginBottom = '20px';
    card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    
    const title = document.createElement('h2');
    title.textContent = 'Extension Error';
    title.style.marginTop = '0';
    title.style.marginBottom = '10px';
    title.style.color = '#f9fafb';
    
    const description = document.createElement('p');
    description.textContent = 'The React application failed to load. We recommend trying the following:';
    description.style.marginBottom = '20px';
    description.style.color = '#d1d5db';
    
    const list = document.createElement('ul');
    list.style.marginBottom = '20px';
    list.style.paddingLeft = '20px';
    
    const items = [
      'Refresh the page',
      'Restart the browser',
      'Reload the extension',
      'Check the console for specific errors'
    ];
    
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.marginBottom = '8px';
      li.style.color = '#d1d5db';
      list.appendChild(li);
    });
    
    const button = document.createElement('button');
    button.textContent = 'Reload Page';
    button.style.backgroundColor = '#3b82f6';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.padding = '8px 16px';
    button.style.cursor = 'pointer';
    button.style.fontWeight = 'bold';
    button.onclick = () => window.location.reload();
    
    const footer = document.createElement('div');
    footer.style.marginTop = '40px';
    footer.style.padding = '12px';
    footer.style.backgroundColor = '#fef3c7';
    footer.style.color = '#92400e';
    footer.style.borderRadius = '4px';
    footer.style.fontSize = '12px';
    
    const footerTitle = document.createElement('h3');
    footerTitle.textContent = 'Debug Info:';
    footerTitle.style.marginTop = '0';
    footerTitle.style.marginBottom = '8px';
    
    const envInfo = document.createElement('p');
    envInfo.textContent = 'Environment: Development';
    envInfo.style.margin = '4px 0';
    
    const uaInfo = document.createElement('p');
    uaInfo.textContent = 'User Agent: ' + navigator.userAgent;
    uaInfo.style.margin = '4px 0';
    
    const timeInfo = document.createElement('p');
    timeInfo.textContent = 'Time: ' + new Date().toLocaleTimeString();
    timeInfo.style.margin = '4px 0';
    
    footer.appendChild(footerTitle);
    footer.appendChild(envInfo);
    footer.appendChild(uaInfo);
    footer.appendChild(timeInfo);
    
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(list);
    card.appendChild(button);
    
    container.appendChild(header);
    container.appendChild(card);
    container.appendChild(footer);
    
    return container;
  }
  
  // Load simple fallback UI
  function loadFallbackUI() {
    console.warn('SpinPick: React app failed to load, activating fallback UI');
    
    try {
      // Get the root element
      const root = document.getElementById(REACT_ROOT_ID);
      
      // Clear existing content
      if (root) {
        while (root.firstChild) {
          root.removeChild(root.firstChild);
        }
        
        // Add the simple fallback UI
        root.appendChild(createBasicFallbackUI());
      } else {
        // If no root element, clear body and add fallback
        document.body.innerHTML = '';
        document.body.appendChild(createBasicFallbackUI());
      }
      
      console.info('SpinPick: Fallback UI loaded successfully');
    } catch (err) {
      console.error('SpinPick: Failed to load fallback UI', err);
      
      // Create a simple error message as last resort
      const errorContainer = document.createElement('div');
      errorContainer.style.padding = '20px';
      errorContainer.style.textAlign = 'center';
      errorContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      errorContainer.style.backgroundColor = '#1f2937';
      errorContainer.style.color = '#f9fafb';
      errorContainer.style.minHeight = '100vh';
      
      const errorTitle = document.createElement('h2');
      errorTitle.textContent = 'SpinPick Error';
      errorTitle.style.marginTop = '40px';
      
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'The application failed to load. Please refresh the page or contact support.';
      
      const refreshButton = document.createElement('button');
      refreshButton.textContent = 'Refresh Page';
      refreshButton.style.backgroundColor = '#3b82f6';
      refreshButton.style.color = 'white';
      refreshButton.style.border = 'none';
      refreshButton.style.borderRadius = '4px';
      refreshButton.style.padding = '8px 16px';
      refreshButton.style.marginTop = '20px';
      refreshButton.style.cursor = 'pointer';
      refreshButton.onclick = () => window.location.reload();
      
      errorContainer.appendChild(errorTitle);
      errorContainer.appendChild(errorMessage);
      errorContainer.appendChild(refreshButton);
      
      document.body.innerHTML = '';
      document.body.appendChild(errorContainer);
    }
  }
  
  // Register a callback for when the page loads
  window.addEventListener('load', function() {
    setTimeout(function() {
      // If React hasn't loaded after the timeout, load the fallback
      if (!isReactMounted()) {
        loadFallbackUI();
      }
    }, FALLBACK_TIMEOUT);
  });
  
  // Also check for React load errors
  window.addEventListener('error', function(event) {
    // Only trigger for script errors that might be React-related
    if (event.filename && (
        event.filename.includes('react') || 
        event.filename.includes('main') || 
        event.filename.includes('index') ||
        event.filename.includes('vendor')
    )) {
      if (!isReactMounted()) {
        loadFallbackUI();
      }
    }
  }, true); // Use capture phase
})();