/**
 * Helper script to show the dev server status
 * Extracts and displays information from the Vite log
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const logFile = path.join(rootDir, '.vite.log');

// Wait for the log file to be created and contain server info
function checkLogFile() {
  try {
    // Check if log file exists
    if (!fs.existsSync(logFile)) {
      console.log('Waiting for dev server to start...');
      setTimeout(checkLogFile, 500);
      return;
    }

    // Read the log file
    const log = fs.readFileSync(logFile, 'utf8');
    
    // Extract the local URL
    const localUrlMatch = log.match(/Local:\s+(http:\/\/localhost:\d+)/);
    if (!localUrlMatch) {
      console.log('Dev server starting...');
      setTimeout(checkLogFile, 500);
      return;
    }

    const localUrl = localUrlMatch[1];
    
    // Check if server is ready
    const isReady = log.includes('ready in');
    
    if (isReady) {
      console.log('\n✅ Dev server running successfully!');
      console.log(`🔗 URL: ${localUrl}`);
      
      // Extract startup time if available
      const timeMatch = log.match(/ready in (\d+)ms/);
      if (timeMatch) {
        console.log(`⏱️  Started in ${timeMatch[1]}ms`);
      }
      
      console.log('\n📝 Log file: .vite.log');
      console.log('🛑 To stop the server: npm run dev:stop\n');
    } else {
      console.log('Dev server starting...');
      setTimeout(checkLogFile, 500);
    }
  } catch (error) {
    console.error('Error checking log file:', error);
  }
}

// Start checking
checkLogFile();