/**
 * DirectusAuth - Authentication provider for SpinPick using Directus
 * Handles user authentication and license validation
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createDirectus, rest, authentication, AuthenticationData } from '@directus/sdk';
import { apiService } from './api';

// Define the context state
interface DirectusAuthState {
  isAuthenticated: boolean;
  authenticating: boolean;
  error: string | null;
  user: User | null;
  licenseValid: boolean;
  licenseExpiration: Date | null;
}

// Define user interface
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  theme_preference?: 'light' | 'dark' | 'system';
}

// Define the context actions/methods
interface DirectusAuthActions {
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  validateLicense: () => Promise<boolean>;
  getDirectusUrl: () => string;
  isDirectusAvailable: boolean;
}

// Create the context with default values
const DirectusAuthContext = createContext<DirectusAuthState & DirectusAuthActions>({
  isAuthenticated: false,
  authenticating: false,
  error: null,
  user: null,
  licenseValid: false,
  licenseExpiration: null,
  login: async () => {
    throw new Error('DirectusAuthContext not initialized');
  },
  logout: () => {},
  validateLicense: async () => false,
  getDirectusUrl: () => '',
  isDirectusAvailable: false
});

// DirectusAuthProvider component
export const DirectusAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for Directus client and authentication
  const [state, setState] = useState<DirectusAuthState>({
    isAuthenticated: false,
    authenticating: false,
    error: null,
    user: null,
    licenseValid: false,
    licenseExpiration: null
  });

  // Client state
  const [directusClient, setDirectusClient] = useState<any>(null);
  const [directusUrl, setDirectusUrl] = useState<string>(
    import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8082'
  );
  const [isDirectusAvailable, setIsDirectusAvailable] = useState<boolean>(false);

  // Initialize client and check availability
  useEffect(() => {
    const initClient = async () => {
      try {
        // Create the Directus client
        const client = createDirectus(directusUrl)
          .with(rest())
          .with(authentication());

        setDirectusClient(client);

        // Check if Directus is available by pinging the server
        try {
          const response = await fetch(`${directusUrl}/server/ping`);
          setIsDirectusAvailable(response.ok);
          
          // If not available, show warning but don't block the app (will block features later)
          if (!response.ok) {
            console.warn('Directus server not available - some features will be disabled');
          }
        } catch (error) {
          console.warn('Directus server not available:', error);
          setIsDirectusAvailable(false);
        }

        // Try to restore session from storage
        const token = localStorage.getItem('directus_token');
        const refreshToken = localStorage.getItem('directus_refresh_token');
        const user = localStorage.getItem('directus_user');
        const licenseValid = localStorage.getItem('directus_license_valid');
        const licenseExpiration = localStorage.getItem('directus_license_expiration');

        if (token && refreshToken && user) {
          try {
            const userData = JSON.parse(user);
            setState(prev => ({ 
              ...prev, 
              isAuthenticated: true,
              user: userData,
              licenseValid: licenseValid === 'true',
              licenseExpiration: licenseExpiration ? new Date(licenseExpiration) : null
            }));
            
            // Validate the license
            validateLicense();
          } catch (error) {
            console.error('Failed to restore Directus session:', error);
            clearAuthStorage();
          }
        }
      } catch (error) {
        console.error('Failed to initialize Directus client:', error);
      }
    };

    initClient();
  }, [directusUrl]);

  // Clear storage helper
  const clearAuthStorage = () => {
    localStorage.removeItem('directus_token');
    localStorage.removeItem('directus_refresh_token');
    localStorage.removeItem('directus_user');
    localStorage.removeItem('directus_license_valid');
    localStorage.removeItem('directus_license_expiration');
  };

  // Login function
  const login = async (email: string, password: string): Promise<User> => {
    if (!directusClient || !isDirectusAvailable) {
      throw new Error('Directus is not available. Please check your internet connection and try again.');
    }

    setState(prev => ({ ...prev, authenticating: true, error: null }));

    try {
      // Use SDK authentication if Directus is available
      const loginResult = await directusClient.login(email, password);
      const token = loginResult.access_token;
      const refreshToken = loginResult.refresh_token;

      // Fetch user info
      const userResponse = await fetch(`${directusUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user data');
      }

      const userData = await userResponse.json();
      const user: User = {
        id: userData.data.id,
        email: userData.data.email,
        first_name: userData.data.first_name,
        last_name: userData.data.last_name,
        avatar: userData.data.avatar,
        theme_preference: userData.data.theme_preference || 'dark'
      };

      // Store authentication data
      localStorage.setItem('directus_token', token);
      localStorage.setItem('directus_refresh_token', refreshToken);
      localStorage.setItem('directus_user', JSON.stringify(user));
      
      // Update API service user ID
      apiService.setUserId(user.id);

      // After login, validate license
      const licenseValid = await validateLicense();

      // Update state
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: true, 
        authenticating: false,
        user,
        licenseValid: licenseValid,
      }));

      return user;
    } catch (error) {
      console.error('Directus login failed:', error);
      setState(prev => ({ 
        ...prev, 
        authenticating: false, 
        error: error instanceof Error ? error.message : 'Login failed'
      }));
      throw error;
    }
  };

  // License validation function - checks if user has a valid subscription
  const validateLicense = async (): Promise<boolean> => {
    if (!state.isAuthenticated || !directusClient || !isDirectusAvailable) {
      setState(prev => ({ ...prev, licenseValid: false, licenseExpiration: null }));
      return false;
    }

    try {
      // We'll call a custom endpoint to check license validity
      // This is a hypothetical endpoint that you'd need to implement
      const response = await fetch(`${directusUrl}/items/licenses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('directus_token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to validate license');
      }

      const licenseData = await response.json();
      
      // Check if user has any valid license
      const validLicense = licenseData.data.some((license: any) => {
        const expirationDate = new Date(license.expiration_date);
        return expirationDate > new Date() && license.status === 'active';
      });

      // Find the latest expiration date
      let latestExpiration = null;
      if (validLicense && licenseData.data.length > 0) {
        const sortedLicenses = [...licenseData.data].sort((a: any, b: any) => {
          return new Date(b.expiration_date).getTime() - new Date(a.expiration_date).getTime();
        });
        
        latestExpiration = new Date(sortedLicenses[0].expiration_date);
      }

      // Save license status to localStorage
      localStorage.setItem('directus_license_valid', validLicense.toString());
      if (latestExpiration) {
        localStorage.setItem('directus_license_expiration', latestExpiration.toISOString());
      } else {
        localStorage.removeItem('directus_license_expiration');
      }
      
      // Update state
      setState(prev => ({ 
        ...prev, 
        licenseValid: validLicense,
        licenseExpiration: latestExpiration
      }));

      return validLicense;
    } catch (error) {
      console.error('Failed to validate license:', error);
      
      // In case of error, we'll be lenient and allow usage if they've authenticated
      // You might want to change this behavior based on your business rules
      setState(prev => ({ ...prev, licenseValid: true }));
      return true;
    }
  };

  // Logout function
  const logout = () => {
    if (directusClient && isDirectusAvailable) {
      directusClient.logout().catch(error => {
        console.error('Error during Directus logout:', error);
      });
    }

    // Clear storage
    clearAuthStorage();
    
    // Also logout from auth service
    apiService.clearUserId();

    // Reset state
    setState({
      isAuthenticated: false,
      authenticating: false,
      error: null,
      user: null,
      licenseValid: false,
      licenseExpiration: null
    });
  };

  const getDirectusUrl = () => directusUrl;

  // Combined context value
  const contextValue: DirectusAuthState & DirectusAuthActions = {
    ...state,
    login,
    logout,
    validateLicense,
    getDirectusUrl,
    isDirectusAvailable
  };

  return (
    <DirectusAuthContext.Provider value={contextValue}>
      {children}
    </DirectusAuthContext.Provider>
  );
};

// Custom hook for using the Directus auth context
export const useDirectusAuth = () => {
  const context = useContext(DirectusAuthContext);
  if (context === undefined) {
    throw new Error('useDirectusAuth must be used within a DirectusAuthProvider');
  }
  return context;
};

export default DirectusAuthContext;