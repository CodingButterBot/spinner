import { mergeConfig } from 'vite';
import { defineConfig } from 'vite';
import baseConfig from './vite.config.base';

// Production-specific configuration with advanced obfuscation
export default mergeConfig(
  baseConfig,
  defineConfig({
    mode: 'production',
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          // Remove console logs but don't affect console functionality
          drop_console: true,
          drop_debugger: true,
          // Only remove our own console logs, not affect browser functionality
          pure_funcs: ['console.log', 'console.debug', 'console.info'],
        },
        mangle: {
          // Mangle property names
          properties: {
            regex: /^_/,  // Only mangle properties that start with underscore
          },
        },
        format: {
          comments: false,
        },
        // Advanced obfuscation
        ecma: 2020,
        toplevel: true,
        module: true,
        safari10: false,
      },
      rollupOptions: {
        output: {
          // Chunk size optimization
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Group node_modules into larger chunks by package
              const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
              if (match) {
                return `vendor-${match[1].replace('@', '')}`;
              }
            }
            return undefined;
          },
        },
      },
      sourcemap: false,
      // Ensure clean output
      emptyOutDir: true,
      // Target modern browsers only
      target: 'es2020',
    },
    // Additional obfuscation via custom plugin
    plugins: [
      {
        name: 'advanced-obfuscation',
        enforce: 'post',
        apply: 'build',
        generateBundle(_, bundle) {
          // Additional obfuscation for sensitive code
          Object.keys(bundle).forEach((key) => {
            const asset = bundle[key];
            
            if (
              asset.type === 'chunk' && 
              asset.code && 
              // Only obfuscate non-vendor code
              !key.includes('vendor') &&
              // Specifically target auth and license validation code
              (key.includes('directus-auth') || key.includes('license'))
            ) {
              // Add fake code to confuse reverse engineering
              asset.code = asset.code
                // Add fake functions that look like they do something important
                .replace(
                  /export const/g, 
                  `function _f${Math.random().toString(36).substring(2, 8)}(){return Math.random()<.5}\nexport const`
                )
                // Add fake error messages
                .replace(
                  /throw new Error\("([^"]+)"\)/g,
                  (match, errorMsg) => {
                    // Create decoy error message array
                    const decoyErrors = [
                      "Invalid configuration",
                      "Connection failed",
                      "Authentication required",
                      "License expired",
                      "License validation failed"
                    ];
                    // Add decoy error handling
                    return `if(_f${Math.random().toString(36).substring(2, 8)}())throw new Error("${decoyErrors[Math.floor(Math.random() * decoyErrors.length)]}");throw new Error("${errorMsg}")`;
                  }
                );
            }
          });
        },
      },
    ],
  })
);