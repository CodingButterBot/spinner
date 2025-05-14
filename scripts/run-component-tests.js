#!/usr/bin/env node

import { execa } from 'execa';
import { checkServerRunning } from './dev-status.js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runComponentTests() {
  console.log('🧪 Running component tests...');

  // Ensure dev server is running for proper environment setup
  const isServerRunning = await checkServerRunning();
  if (!isServerRunning) {
    console.log('⚠️ Dev server is not running. Starting dev server...');
    try {
      // Start dev server in detached mode
      await execa('npm', ['run', 'dev'], { detached: true, stdio: 'ignore' });
      // Wait a moment for server to initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Dev server started');
    } catch (error) {
      console.error('❌ Failed to start dev server:', error);
      process.exit(1);
    }
  }

  // Determine args for Vitest (pass through any args provided to this script)
  const args = ['run', 'tests/components'];
  if (process.argv.includes('--watch')) {
    args[0] = 'watch';
  }
  if (process.argv.includes('--ui')) {
    args.push('--ui');
  }
  if (process.argv.includes('--coverage')) {
    args.push('--coverage');
  }

  try {
    // Run Vitest with appropriate args
    await execa('npx', ['vitest', ...args], { stdio: 'inherit' });
    console.log('✅ Component tests completed successfully');
  } catch (error) {
    console.error('❌ Component tests failed:', error);
    process.exit(1);
  }
}

runComponentTests().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});