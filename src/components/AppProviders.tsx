/**
 * AppProviders - Global providers wrapper for all SpinPick pages
 * Includes DirectusAuthProvider and any other global context providers
 */

import React, { ReactNode } from 'react';
import { DirectusAuthProvider } from '../services/directus-auth';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Global providers wrapper component for the application
 * Wraps children with all required context providers
 */
const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <DirectusAuthProvider>
      {children}
    </DirectusAuthProvider>
  );
};

export default AppProviders;