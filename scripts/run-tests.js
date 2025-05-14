/**
 * Test runner script for SpinPick
 * Ensures dev server is running before running tests
 */

import { exec, spawn } from 'child_process';
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
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightCyan: '\x1b[96m',
};

// Parse command line arguments
const args = process.argv.slice(2);
const isUiMode = args.includes('--ui');
const isDebugMode = args.includes('--debug');
const isHeadlessMode = args.includes('--headless');
const isWatchMode = args.includes('--watch');
const pattern = args.find(arg => !arg.startsWith('--'));

/**
 * Checks if the dev server is running
 * @returns {Promise<boolean>}
 */
async function isDevServerRunning() {
  return new Promise((resolve) => {
    exec('pgrep -f vite', (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Checks if the dev server is ready by checking the log file
 * @returns {Promise<boolean>}
 */
async function isDevServerReady() {
  if (!fs.existsSync(logFile)) {
    return false;
  }
  
  const log = fs.readFileSync(logFile, 'utf8');
  return log.includes('Local:') && log.includes('ready in');
}

/**
 * Starts the dev server
 * @returns {Promise<void>}
 */
async function startDevServer() {
  console.log(`${colors.yellow}Starting dev server...${colors.reset}`);
  
  return new Promise((resolve, reject) => {
    // Start the dev server using the npm script
    const devProcess = spawn('npm', ['run', 'dev'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    });
    
    // Check if the server is ready
    const checkReady = () => {
      isDevServerReady().then(ready => {
        if (ready) {
          console.log(`${colors.green}Dev server is ready!${colors.reset}`);
          resolve();
        } else {
          setTimeout(checkReady, 500);
        }
      });
    };
    
    // Start checking after a short delay
    setTimeout(checkReady, 1000);
    
    // Handle errors
    devProcess.on('error', (error) => {
      console.error(`${colors.red}Failed to start dev server:${colors.reset}`, error);
      reject(error);
    });
  });
}

/**
 * Runs the Playwright tests
 * @returns {Promise<void>}
 */
async function runTests() {
  console.log(`${colors.cyan}Running tests...${colors.reset}`);
  
  // Build the command args
  const testArgs = ['test'];

  if (isUiMode) {
    testArgs.push('--ui');
  } else if (isDebugMode) {
    testArgs.push('--debug');
  }

  if (isWatchMode) {
    testArgs.push('--watch');
  }

  if (isHeadlessMode) {
    testArgs.push('--headed=false');
  } else {
    testArgs.push('--headed');
  }

  if (pattern) {
    testArgs.push(pattern);
  }
  
  return new Promise((resolve, reject) => {
    // Run the tests
    const testProcess = spawn('npx', ['playwright'].concat(testArgs), {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.brightGreen}Tests completed successfully!${colors.reset}`);
        resolve();
      } else {
        console.error(`${colors.red}Tests failed with code ${code}${colors.reset}`);
        reject(new Error(`Tests failed with code ${code}`));
      }
    });
    
    testProcess.on('error', (error) => {
      console.error(`${colors.red}Failed to run tests:${colors.reset}`, error);
      reject(error);
    });
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(`${colors.brightCyan}SpinPick Test Runner${colors.reset}`);
    
    // Check if dev server is running
    const serverRunning = await isDevServerRunning();
    if (!serverRunning) {
      await startDevServer();
    } else {
      // Check if it's ready
      const serverReady = await isDevServerReady();
      if (!serverReady) {
        console.log(`${colors.yellow}Dev server is running but not ready. Waiting...${colors.reset}`);
        // Wait for server to be ready
        await new Promise(resolve => {
          const checkReady = () => {
            isDevServerReady().then(ready => {
              if (ready) {
                console.log(`${colors.green}Dev server is ready!${colors.reset}`);
                resolve();
              } else {
                setTimeout(checkReady, 500);
              }
            });
          };
          checkReady();
        });
      } else {
        console.log(`${colors.green}Dev server is already running and ready!${colors.reset}`);
      }
    }
    
    // Run the tests
    await runTests();
    
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the main function
main();