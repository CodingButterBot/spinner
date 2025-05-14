import { resolve } from 'path';
import { mergeConfig, defineConfig } from 'vite';
import { crx, ManifestV3Export } from '@crxjs/vite-plugin';
import baseConfig, { baseManifest, baseBuildOptions } from './vite.config.base';
import fs from 'fs';
import path from 'path';

const outDir = resolve(__dirname, 'dist_chrome');

// Copy static files function for closeBundle
const copyStaticFiles = () => {
  // Create dirs if they don't exist
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Copy any required static files
  const staticFiles = [
    'theme-init.js',
    'static-spinner.html',
    'static-spinner-script.js',
    'static-spinner-styles.css',
    'fallback-loader.js'
  ];

  staticFiles.forEach(file => {
    try {
      if (fs.existsSync(resolve(__dirname, 'public', file))) {
        fs.copyFileSync(
          resolve(__dirname, 'public', file),
          resolve(outDir, file)
        );
        console.log(`Copied ${file} to ${outDir}`);
      }
    } catch (err) {
      console.error(`Failed to copy ${file}:`, err);
    }
  });
};

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      crx({
        manifest: {
          ...baseManifest,
          background: {
            service_worker: 'src/pages/background/index.ts',
            type: 'module'
          },
          action: {
            default_popup: 'src/pages/popup/index.html',
            default_icon: {
              16: 'icons/icon16.png',
              32: 'icons/icon32.png',
              48: 'icons/icon48.png',
              128: 'icons/icon128.png'
            }
          },
          options_page: 'src/pages/options/index.html',
          side_panel: {
            default_path: 'src/pages/sidepanel/index.html'
          }
        } as ManifestV3Export,
        browser: 'chrome',
        contentScripts: {
          injectCss: true,
        }
      }),
      {
        name: 'copy-static-files',
        closeBundle: copyStaticFiles,
      }
    ],
    build: {
      ...baseBuildOptions,
      outDir,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks: (id) => {
            // Create a separate vendor chunk for node_modules
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            // Create a theme chunk for CSS
            if (id.includes('/themes/') || id.includes('/assets/styles/')) {
              return 'theme';
            }
          }
        }
      }
    }
  })
);