/**
 * Custom CSS-based confetti animation service
 * Provides a lightweight alternative to canvas-confetti
 */

const confettiColors = [
  '#FF5733', '#33FF57', '#5733FF', '#FFFF33', '#33FFFF',
  '#FF33FF', '#FF7733', '#33FFAA', '#7733FF', '#FFDD33'
];

/**
 * Creates a DOM-based confetti celebration that doesn't rely on canvas-confetti
 */
export const createDOMConfetti = (
  container: HTMLElement,
  options: {
    count?: number,
    duration?: number,
    colors?: string[],
    shapes?: ('square' | 'circle' | 'triangle')[]
  } = {}
) => {
  // Default options
  const {
    count = 100,
    duration = 5000,
    colors = confettiColors,
    shapes = ['square', 'circle', 'triangle']
  } = options;

  // Create a container for the confetti pieces if it doesn't exist
  let confettiContainer = container.querySelector('.confetti-container');
  if (!confettiContainer) {
    confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    container.appendChild(confettiContainer);
  }

  // Generate the confetti elements
  for (let i = 0; i < count; i++) {
    // Create confetti piece
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Randomize size (5-15px)
    const size = 5 + Math.random() * 10;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    
    // Randomize color
    const color = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.setProperty('--confetti-color', color);
    confetti.style.backgroundColor = color;
    
    // Randomize shape
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    if (shape === 'circle') {
      confetti.style.borderRadius = '50%';
    } else if (shape === 'triangle') {
      confetti.style.width = '0';
      confetti.style.height = '0';
      confetti.style.borderLeft = `${size/2}px solid transparent`;
      confetti.style.borderRight = `${size/2}px solid transparent`;
      confetti.style.borderBottom = `${size}px solid ${color}`;
      confetti.style.backgroundColor = 'transparent';
    }
    
    // Randomize position
    confetti.style.left = `${Math.random() * 100}%`;
    
    // Randomize animation duration (within 20% of the base duration)
    const animationDuration = (duration * 0.8) + (Math.random() * duration * 0.4);
    confetti.style.animationDuration = `${animationDuration}ms`;
    
    // Randomize animation delay
    confetti.style.animationDelay = `${Math.random() * 500}ms`;
    
    // Add to container
    confettiContainer.appendChild(confetti);
    
    // Remove the confetti element when animation ends
    setTimeout(() => {
      confetti.remove();
      
      // Remove container if it's empty
      if (confettiContainer && confettiContainer.children.length === 0) {
        confettiContainer.remove();
      }
    }, animationDuration + 500);
  }
};

/**
 * Creates a DOM-based confetti celebration for a specific winner element
 */
export const createWinnerConfetti = (
  winnerElement: HTMLElement,
  options: {
    count?: number,
    duration?: number,
    colors?: string[],
  } = {}
) => {
  // Find the closest relative/absolute positioned ancestor to use as container
  let container = winnerElement.closest('.relative, .absolute') as HTMLElement;
  if (!container) {
    // If no positioned ancestor found, use the winner element as container
    container = winnerElement;
    // Make sure it has positioning for absolute children
    const currentPosition = window.getComputedStyle(container).position;
    if (currentPosition === 'static') {
      container.style.position = 'relative';
    }
  }
  
  // Generate confetti with custom colors if winner has theme colors
  const customColors = options.colors || [
    getComputedStyle(winnerElement).getPropertyValue('--highlight-glow') || 
    getComputedStyle(winnerElement).color
  ];
  
  createDOMConfetti(container, {
    ...options,
    colors: customColors.length ? customColors : undefined
  });
};