/**
 * Theme initialization script for SpinPick
 * This script handles theme initialization without using inline scripts
 * to comply with Chrome's Content Security Policy
 * Updated for Tailwind CSS 4.1 approach
 */

// Apply theme before React loads to prevent flash of wrong theme
(function() {
  try {
    // Remove dark class if present
    document.documentElement.classList.remove('dark');
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      if (savedTheme === 'system') {
        // For system theme, check media query
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        }
      } else if (savedTheme === 'dark') {
        // For explicit dark theme
        document.documentElement.classList.add('dark');
      }
      // For light theme, we just leave the 'dark' class off
    } else {
      // Set dark as default theme if no saved preference
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  } catch (e) {
    console.error('Failed to apply theme', e);
    // Fallback to dark theme
    document.documentElement.classList.add('dark');
  }
})();