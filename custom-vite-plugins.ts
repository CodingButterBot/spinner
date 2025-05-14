import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * A plugin that strips development-specific icons from production builds
 */
export function stripDevIcons(isDev: boolean): Plugin {
  return {
    name: 'strip-dev-icons',
    apply: 'build',
    enforce: 'post',
    closeBundle: () => {
      if (isDev) return; // Only run in production mode

      const publicDir = path.resolve(__dirname, 'public');
      const devIcons = fs.readdirSync(publicDir)
        .filter(file => file.startsWith('dev-icon'));

      // Check if we're in Chrome or Firefox build
      const distDir = fs.existsSync(path.resolve(__dirname, 'dist_chrome'))
        ? path.resolve(__dirname, 'dist_chrome')
        : path.resolve(__dirname, 'dist_firefox');

      // Remove dev icons from the build
      devIcons.forEach(icon => {
        const iconPath = path.resolve(distDir, icon);
        if (fs.existsSync(iconPath)) {
          fs.unlinkSync(iconPath);
          console.log(`Removed development icon: ${icon}`);
        }
      });
    }
  };
}

/**
 * A plugin that supports internationalization for Chrome extensions
 */
export function crxI18n(options: { localize: boolean, src: string }): Plugin {
  return {
    name: 'crx-i18n',
    apply: 'build',
    enforce: 'post',
    closeBundle: () => {
      if (!options.localize) return; // Skip if localization is disabled

      const localesDir = path.resolve(__dirname, options.src);
      if (!fs.existsSync(localesDir)) {
        console.warn(`Locales directory not found: ${localesDir}`);
        return;
      }

      // Check if we're in Chrome or Firefox build
      const distDir = fs.existsSync(path.resolve(__dirname, 'dist_chrome'))
        ? path.resolve(__dirname, 'dist_chrome')
        : path.resolve(__dirname, 'dist_firefox');

      // Create _locales directory in the build
      const distLocalesDir = path.resolve(distDir, '_locales');
      if (!fs.existsSync(distLocalesDir)) {
        fs.mkdirSync(distLocalesDir, { recursive: true });
      }

      // Copy locale files
      const locales = fs.readdirSync(localesDir);
      locales.forEach(locale => {
        const srcLocaleDir = path.resolve(localesDir, locale);
        const destLocaleDir = path.resolve(distLocalesDir, locale);

        if (fs.statSync(srcLocaleDir).isDirectory()) {
          if (!fs.existsSync(destLocaleDir)) {
            fs.mkdirSync(destLocaleDir, { recursive: true });
          }

          // Copy messages.json
          const messagesFile = path.resolve(srcLocaleDir, 'messages.json');
          if (fs.existsSync(messagesFile)) {
            fs.copyFileSync(
              messagesFile,
              path.resolve(destLocaleDir, 'messages.json')
            );
            console.log(`Copied locale: ${locale}`);
          }
        }
      });
    }
  };
}