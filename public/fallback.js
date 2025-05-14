/**
 * SpinPick Fallback Loader
 * This script detects if the React app fails to load and loads a static fallback version
 * Implementation is CSP-compliant to work with Chrome extension security restrictions
 */

(function() {
  // Configuration
  const FALLBACK_TIMEOUT = 5000; // 5 seconds timeout
  const REACT_ROOT_ID = 'root';
  const STATIC_CSS_PATH = '/static-spinner-styles.css';
  const STATIC_JS_PATH = '/static-spinner-script.js';
  
  // Helper to check if React has successfully mounted
  function isReactMounted() {
    const rootElement = document.getElementById(REACT_ROOT_ID);
    return rootElement && rootElement.children.length > 0;
  }
  
  // Function to create fallback UI structure
  function createFallbackUI() {
    // Create container
    const container = document.createElement('div');
    container.className = 'container';
    
    // Create header
    const header = document.createElement('header');
    
    const title = document.createElement('h1');
    title.textContent = 'SpinPick Demo';
    
    const themeSwitcher = document.createElement('div');
    themeSwitcher.className = 'theme-switcher';
    
    const themeButton = document.createElement('button');
    themeButton.id = 'theme-toggle';
    themeButton.textContent = '🌙 Dark Mode';
    
    themeSwitcher.appendChild(themeButton);
    header.appendChild(title);
    header.appendChild(themeSwitcher);
    
    // Create tools card
    const toolsCard = document.createElement('div');
    toolsCard.className = 'card';
    
    const toolsHeader = document.createElement('div');
    toolsHeader.className = 'card-header';
    
    const toolsTitle = document.createElement('h2');
    toolsTitle.className = 'card-title';
    toolsTitle.textContent = 'Randomizer Tools';
    
    const toolsDescription = document.createElement('p');
    toolsDescription.className = 'card-description';
    toolsDescription.textContent = 'Select a randomizer to use';
    
    toolsHeader.appendChild(toolsTitle);
    toolsHeader.appendChild(toolsDescription);
    
    const toolsContent = document.createElement('div');
    toolsContent.className = 'card-content';
    
    const buttons = document.createElement('div');
    buttons.className = 'buttons';
    
    const wheelButton = document.createElement('button');
    wheelButton.className = 'button';
    wheelButton.id = 'show-wheel';
    wheelButton.textContent = 'Spinning Wheel';
    
    const slotsButton = document.createElement('button');
    slotsButton.className = 'button';
    slotsButton.id = 'show-slots';
    slotsButton.textContent = 'Slot Machine';
    
    buttons.appendChild(wheelButton);
    buttons.appendChild(slotsButton);
    
    toolsContent.appendChild(buttons);
    toolsCard.appendChild(toolsHeader);
    toolsCard.appendChild(toolsContent);
    
    // Create wheel component
    const wheelComponent = document.createElement('div');
    wheelComponent.id = 'wheel-component';
    wheelComponent.className = 'card';
    wheelComponent.style.display = 'none';
    
    const wheelHeader = document.createElement('div');
    wheelHeader.className = 'card-header';
    
    const wheelTitle = document.createElement('h2');
    wheelTitle.className = 'card-title';
    wheelTitle.textContent = 'Spinning Wheel';
    
    const wheelDescription = document.createElement('p');
    wheelDescription.className = 'card-description';
    wheelDescription.textContent = 'Spin the wheel to pick a random option';
    
    wheelHeader.appendChild(wheelTitle);
    wheelHeader.appendChild(wheelDescription);
    
    const wheelContent = document.createElement('div');
    wheelContent.className = 'card-content';
    
    const wheelContainer = document.createElement('div');
    wheelContainer.className = 'wheel-container';
    
    const wheel = document.createElement('div');
    wheel.className = 'wheel';
    wheel.id = 'wheel';
    
    const wheelSpinner = document.createElement('div');
    wheelSpinner.className = 'wheel-spinner';
    
    wheelContainer.appendChild(wheel);
    wheelContainer.appendChild(wheelSpinner);
    
    const spinButton = document.createElement('button');
    spinButton.className = 'button spin-button';
    spinButton.id = 'spin-wheel';
    spinButton.textContent = 'Spin the Wheel';
    
    wheelContent.appendChild(wheelContainer);
    wheelContent.appendChild(spinButton);
    
    const wheelFooter = document.createElement('div');
    wheelFooter.className = 'card-footer';
    
    const customizeWheelButton = document.createElement('button');
    customizeWheelButton.className = 'button button-outline';
    customizeWheelButton.id = 'customize-wheel';
    customizeWheelButton.textContent = 'Customize';
    
    const backFromWheelButton = document.createElement('button');
    backFromWheelButton.className = 'button button-ghost';
    backFromWheelButton.id = 'back-from-wheel';
    backFromWheelButton.textContent = 'Back';
    
    wheelFooter.appendChild(customizeWheelButton);
    wheelFooter.appendChild(backFromWheelButton);
    
    wheelComponent.appendChild(wheelHeader);
    wheelComponent.appendChild(wheelContent);
    wheelComponent.appendChild(wheelFooter);
    
    // Create slot machine component
    const slotComponent = document.createElement('div');
    slotComponent.id = 'slot-component';
    slotComponent.className = 'card';
    slotComponent.style.display = 'none';
    
    const slotHeader = document.createElement('div');
    slotHeader.className = 'card-header';
    
    const slotTitle = document.createElement('h2');
    slotTitle.className = 'card-title';
    slotTitle.textContent = 'Slot Machine';
    
    const slotDescription = document.createElement('p');
    slotDescription.className = 'card-description';
    slotDescription.textContent = 'Pull the lever to get a random combination';
    
    slotHeader.appendChild(slotTitle);
    slotHeader.appendChild(slotDescription);
    
    const slotContent = document.createElement('div');
    slotContent.className = 'card-content';
    
    const slotMachine = document.createElement('div');
    slotMachine.className = 'slot-machine';
    
    const slotDisplay = document.createElement('div');
    slotDisplay.className = 'slot-display';
    
    const reel1 = document.createElement('div');
    reel1.className = 'slot-reel';
    reel1.id = 'reel1';
    
    const reel2 = document.createElement('div');
    reel2.className = 'slot-reel';
    reel2.id = 'reel2';
    
    const reel3 = document.createElement('div');
    reel3.className = 'slot-reel';
    reel3.id = 'reel3';
    
    slotDisplay.appendChild(reel1);
    slotDisplay.appendChild(reel2);
    slotDisplay.appendChild(reel3);
    
    const pullLever = document.createElement('button');
    pullLever.className = 'button';
    pullLever.id = 'pull-lever';
    pullLever.textContent = 'Pull Lever';
    
    slotMachine.appendChild(slotDisplay);
    slotMachine.appendChild(pullLever);
    
    slotContent.appendChild(slotMachine);
    
    const slotFooter = document.createElement('div');
    slotFooter.className = 'card-footer';
    
    const customizeSlotsButton = document.createElement('button');
    customizeSlotsButton.className = 'button button-outline';
    customizeSlotsButton.id = 'customize-slots';
    customizeSlotsButton.textContent = 'Customize';
    
    const backFromSlotsButton = document.createElement('button');
    backFromSlotsButton.className = 'button button-ghost';
    backFromSlotsButton.id = 'back-from-slots';
    backFromSlotsButton.textContent = 'Back';
    
    slotFooter.appendChild(customizeSlotsButton);
    slotFooter.appendChild(backFromSlotsButton);
    
    slotComponent.appendChild(slotHeader);
    slotComponent.appendChild(slotContent);
    slotComponent.appendChild(slotFooter);
    
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.className = 'debug-panel';
    
    const debugTitle = document.createElement('h3');
    debugTitle.textContent = 'Debug Info:';
    
    const envInfo = document.createElement('p');
    envInfo.innerHTML = 'Environment: <span id="environment">Development</span>';
    
    const timeInfo = document.createElement('p');
    timeInfo.innerHTML = 'Current time: <span id="current-time"></span>';
    
    const componentsInfo = document.createElement('p');
    componentsInfo.textContent = 'Components: Vanilla JS implementation';
    
    debugPanel.appendChild(debugTitle);
    debugPanel.appendChild(envInfo);
    debugPanel.appendChild(timeInfo);
    debugPanel.appendChild(componentsInfo);
    
    // Assemble all components
    container.appendChild(header);
    container.appendChild(toolsCard);
    container.appendChild(wheelComponent);
    container.appendChild(slotComponent);
    container.appendChild(debugPanel);
    
    return container;
  }
  
  // Function to load fallback UI
  function loadFallbackUI() {
    console.warn('SpinPick: React app failed to load, activating fallback UI');
    
    try {
      // Clear the current body content
      const root = document.getElementById(REACT_ROOT_ID);
      if (root) {
        // Clear root element
        while (root.firstChild) {
          root.removeChild(root.firstChild);
        }
      }
      
      // Load CSS
      if (!document.querySelector('link[href="' + STATIC_CSS_PATH + '"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = STATIC_CSS_PATH;
        document.head.appendChild(cssLink);
      }
      
      // Create the fallback UI structure using DOM API
      const fallbackUI = createFallbackUI();
      
      // Add the fallback UI to the page
      if (root) {
        root.appendChild(fallbackUI);
      } else {
        document.body.innerHTML = '';
        document.body.appendChild(fallbackUI);
      }
      
      // Load JS (will initialize the components)
      const script = document.createElement('script');
      script.src = STATIC_JS_PATH;
      document.body.appendChild(script);
      
      console.info('SpinPick: Fallback UI loaded successfully');
    } catch (err) {
      console.error('SpinPick: Failed to load fallback UI', err);
      
      // Create a simple error message
      const errorContainer = document.createElement('div');
      errorContainer.style.padding = '20px';
      errorContainer.style.textAlign = 'center';
      
      const errorTitle = document.createElement('h2');
      errorTitle.textContent = 'SpinPick Error';
      
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'The application failed to load. Please refresh the page or contact support.';
      
      errorContainer.appendChild(errorTitle);
      errorContainer.appendChild(errorMessage);
      
      document.body.innerHTML = '';
      document.body.appendChild(errorContainer);
    }
  }
  
  // Register a callback for when React successfully loads
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
        event.filename.includes('index')
    )) {
      if (!isReactMounted()) {
        loadFallbackUI();
      }
    }
  }, true); // Use capture phase
})();