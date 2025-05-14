/**
 * Helper script to view and monitor the Vite log file
 * Provides a real-time view of the .vite.log file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const logFile = path.join(rootDir, '.vite.log');

// ANSI color codes for formatting
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

// Clear the console
console.clear();
console.log(`${colors.cyan}📋 Vite Dev Server Log Viewer${colors.reset}`);
console.log(`${colors.gray}Monitoring .vite.log file...${colors.reset}\n`);

// Check if log file exists
if (!fs.existsSync(logFile)) {
  console.log(`${colors.yellow}⚠️ Log file does not exist yet.${colors.reset}`);
  console.log(`${colors.yellow}Run 'npm run dev' to start the dev server.${colors.reset}`);
  process.exit(0);
}

// Read the initial content
let lastContent = '';
try {
  lastContent = fs.readFileSync(logFile, 'utf8');
  
  // Colorize the output
  let formattedContent = lastContent
    .replace(/ready in (\d+)ms/g, `${colors.green}ready in $1ms${colors.reset}`)
    .replace(/(http:\/\/localhost:\d+)/g, `${colors.brightCyan}$1${colors.reset}`)
    .replace(/ERROR/g, `${colors.brightRed}ERROR${colors.reset}`)
    .replace(/WARN/g, `${colors.brightYellow}WARN${colors.reset}`)
    .replace(/INFO/g, `${colors.brightGreen}INFO${colors.reset}`);
  
  console.log(formattedContent);
} catch (error) {
  console.error(`${colors.red}Error reading log file:${colors.reset}`, error);
}

// Watch for changes
let fsWait = false;
fs.watch(logFile, (event, filename) => {
  if (filename && event === 'change') {
    if (fsWait) return;
    fsWait = setTimeout(() => {
      fsWait = false;
    }, 100);
    
    try {
      const currentContent = fs.readFileSync(logFile, 'utf8');
      // Only display the new content
      if (currentContent.length > lastContent.length) {
        const newContent = currentContent.substring(lastContent.length);
        
        // Colorize the output
        let formattedContent = newContent
          .replace(/ready in (\d+)ms/g, `${colors.green}ready in $1ms${colors.reset}`)
          .replace(/(http:\/\/localhost:\d+)/g, `${colors.brightCyan}$1${colors.reset}`)
          .replace(/ERROR/g, `${colors.brightRed}ERROR${colors.reset}`)
          .replace(/WARN/g, `${colors.brightYellow}WARN${colors.reset}`)
          .replace(/INFO/g, `${colors.brightGreen}INFO${colors.reset}`);
          
        process.stdout.write(formattedContent);
        lastContent = currentContent;
      }
    } catch (error) {
      console.error(`${colors.red}Error watching log file:${colors.reset}`, error);
    }
  }
});

console.log(`\n${colors.gray}Press Ctrl+C to exit${colors.reset}`);

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n${colors.cyan}Exiting log viewer${colors.reset}`);
  process.exit(0);
});