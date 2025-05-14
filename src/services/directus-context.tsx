/**
 * DirectusContext - Context provider for Directus integration
 * Provides a context and hooks for accessing Directus functionality throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createDirectus, rest, staticToken, authentication, AuthenticationData } from '@directus/sdk';
import { apiService } from './api';
import { authService, User } from './auth';

// Define Directus collection schemas
export interface Theme {
  id?: string | number;
  name: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  user: string;
}

export interface SpinResult {
  id?: string | number;
  result: string;
  timestamp: string;
  type: 'wheel' | 'slot';
  user: string;
}

export interface CSVMapping {
  id?: string | number;
  name: string;
  name_column: string;
  ticket_column: string;
  email_column?: string;
  additional_columns?: Record<string, string>;
  has_header_row: boolean;
  delimiter: string;
  user: string;
  created_at?: string;
  updated_at?: string;
}

export interface CSVImport {
  id?: string | number;
  filename: string;
  mapping_id: string;
  data: any[];
  row_count: number;
  user: string;
  imported_at: string;
}

// Define schema for Directus client
export interface DirectusSchema {
  themes: Theme;
  spin_results: SpinResult;
  csv_mappings: CSVMapping;
  csv_imports: CSVImport;
  users: User;
}

// Define authentication result type
interface DirectusAuthResult {
  access_token: string;
  refresh_token: string;
  expires: number;
}

// Define the context state
interface DirectusContextState {
  client: ReturnType<typeof createDirectus<DirectusSchema>> | null;
  isAuthenticated: boolean;
  authenticating: boolean;
  error: string | null;
  user: User | null;
}

// Define the context actions/methods
interface DirectusContextActions {
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshClient: () => void;
  getThemes: () => Promise<Theme[]>;
  createTheme: (theme: Omit<Theme, 'user'>) => Promise<Theme>;
  getResults: () => Promise<SpinResult[]>;
  saveResult: (result: string, type: 'wheel' | 'slot') => Promise<SpinResult>;
  getMappings: () => Promise<CSVMapping[]>;
  createMapping: (mapping: Omit<CSVMapping, 'user' | 'created_at' | 'updated_at'>) => Promise<CSVMapping>;
  saveCSVImport: (mappingId: string, filename: string, data: any[]) => Promise<CSVImport>;
  getImports: (limit?: number) => Promise<CSVImport[]>;
  isDirectusAvailable: boolean;
}

// Create the context with default values
const DirectusContext = createContext<DirectusContextState & DirectusContextActions>({
  client: null,
  isAuthenticated: false,
  authenticating: false,
  error: null,
  user: null,
  login: async () => {
    throw new Error('DirectusContext not initialized');
  },
  logout: () => {},
  refreshClient: () => {},
  getThemes: async () => [],
  createTheme: async () => {
    throw new Error('DirectusContext not initialized');
  },
  getResults: async () => [],
  saveResult: async () => {
    throw new Error('DirectusContext not initialized');
  },
  getMappings: async () => [],
  createMapping: async () => {
    throw new Error('DirectusContext not initialized');
  },
  saveCSVImport: async () => {
    throw new Error('DirectusContext not initialized');
  },
  getImports: async () => [],
  isDirectusAvailable: false
});

// DirectusProvider component
export const DirectusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for Directus client and authentication
  const [state, setState] = useState<DirectusContextState>({
    client: null,
    isAuthenticated: false,
    authenticating: false,
    error: null,
    user: null
  });

  // URLs and API status
  const [directusUrl] = useState<string>(import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8082');
  const [isDirectusAvailable, setIsDirectusAvailable] = useState<boolean>(false);

  // Initialize client and check API availability
  useEffect(() => {
    const initClient = async () => {
      try {
        // Create the Directus client
        const client = createDirectus<DirectusSchema>(directusUrl)
          .with(rest())
          .with(authentication());

        setState(prev => ({ ...prev, client }));

        // Check if Directus is available by pinging the server
        try {
          const response = await fetch(`${directusUrl}/server/ping`);
          setIsDirectusAvailable(response.ok);
        } catch (error) {
          console.warn('Directus server not available:', error);
          setIsDirectusAvailable(false);
        }

        // Try to restore session from storage
        const token = localStorage.getItem('directus_token');
        const refreshToken = localStorage.getItem('directus_refresh_token');
        const user = localStorage.getItem('directus_user');

        if (token && refreshToken && user) {
          try {
            setState(prev => ({ 
              ...prev, 
              isAuthenticated: true,
              user: JSON.parse(user)
            }));
          } catch (error) {
            console.error('Failed to restore Directus session:', error);
            localStorage.removeItem('directus_token');
            localStorage.removeItem('directus_refresh_token');
            localStorage.removeItem('directus_user');
          }
        }
      } catch (error) {
        console.error('Failed to initialize Directus client:', error);
      }
    };

    initClient();
  }, [directusUrl]);

  // Function to refresh the Directus client
  const refreshClient = () => {
    if (!state.client) return;

    // Recreate the client with current auth state
    const token = localStorage.getItem('directus_token');
    if (token) {
      const newClient = createDirectus<DirectusSchema>(directusUrl)
        .with(rest())
        .with(authentication('json'))
        .with(staticToken(token));

      setState(prev => ({ ...prev, client: newClient }));
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<User> => {
    if (!state.client || !isDirectusAvailable) {
      // Fall back to API service/auth service if Directus is not available
      return authService.login({ email, password });
    }

    setState(prev => ({ ...prev, authenticating: true, error: null }));

    try {
      // Use SDK authentication if Directus is available
      const loginResult = await state.client.login(email, password);
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

      // Update state
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: true, 
        authenticating: false,
        user
      }));

      // Refresh client to use new token
      refreshClient();

      return user;
    } catch (error) {
      console.error('Directus login failed, falling back to local auth:', error);
      
      // Fall back to API service/auth service
      try {
        const user = await authService.login({ email, password });
        setState(prev => ({ 
          ...prev, 
          authenticating: false,
          user
        }));
        return user;
      } catch (authError) {
        setState(prev => ({ 
          ...prev, 
          authenticating: false, 
          error: (authError as Error).message 
        }));
        throw authError;
      }
    }
  };

  // Logout function
  const logout = () => {
    if (state.client && isDirectusAvailable) {
      state.client.logout().catch(error => {
        console.error('Error during Directus logout:', error);
      });
    }

    // Clear stored tokens
    localStorage.removeItem('directus_token');
    localStorage.removeItem('directus_refresh_token');
    localStorage.removeItem('directus_user');

    // Also logout from auth service
    authService.logout();

    // Reset state
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null
    }));
  };

  // Function to get user themes
  const getThemes = async (): Promise<Theme[]> => {
    if (!state.user) return [];

    try {
      if (state.client && isDirectusAvailable && state.isAuthenticated) {
        // Use Directus SDK if available
        const response = await state.client.request.get(`/items/themes?filter={"user":{"_eq":"${state.user.id}"}}`);
        return response.data || [];
      } else {
        // Fall back to API service
        return apiService.getUserThemes();
      }
    } catch (error) {
      console.error('Error getting themes:', error);
      // Fall back to API service
      return apiService.getUserThemes();
    }
  };

  // Function to create a theme
  const createTheme = async (theme: Omit<Theme, 'user'>): Promise<Theme> => {
    if (!state.user) {
      throw new Error('User must be authenticated to create themes');
    }

    try {
      if (state.client && isDirectusAvailable && state.isAuthenticated) {
        // Use Directus SDK if available
        const themeWithUser = { ...theme, user: state.user.id };
        const response = await state.client.request.post('/items/themes', themeWithUser);
        return response.data;
      } else {
        // Fall back to API service
        return apiService.createTheme(theme);
      }
    } catch (error) {
      console.error('Error creating theme:', error);
      // Fall back to API service
      return apiService.createTheme(theme);
    }
  };

  // Function to get spin results
  const getResults = async (): Promise<SpinResult[]> => {
    if (!state.user) return [];

    try {
      if (state.client && isDirectusAvailable && state.isAuthenticated) {
        // Use Directus SDK if available
        const response = await state.client.request.get(`/items/spin_results?filter={"user":{"_eq":"${state.user.id}"}}&sort=-timestamp`);
        return response.data || [];
      } else {
        // Fall back to API service (localStorage)
        const results = localStorage.getItem(`spinpick_results_${state.user.id}`);
        return results ? JSON.parse(results) : [];
      }
    } catch (error) {
      console.error('Error getting results:', error);
      // Fall back to localStorage
      const results = localStorage.getItem(`spinpick_results_${state.user.id}`);
      return results ? JSON.parse(results) : [];
    }
  };

  // Function to save a spin result
  const saveResult = async (result: string, type: 'wheel' | 'slot'): Promise<SpinResult> => {
    if (!state.user) {
      throw new Error('User must be authenticated to save results');
    }

    const resultData: Omit<SpinResult, 'id'> = {
      result,
      type,
      timestamp: new Date().toISOString(),
      user: state.user.id
    };

    try {
      if (state.client && isDirectusAvailable && state.isAuthenticated) {
        // Use Directus SDK if available
        const response = await state.client.request.post('/items/spin_results', resultData);
        return response.data;
      } else {
        // Fall back to localStorage
        const existingResults = await getResults();
        const newResult = { ...resultData, id: Date.now().toString() };
        const updatedResults = [newResult, ...existingResults];
        localStorage.setItem(`spinpick_results_${state.user.id}`, JSON.stringify(updatedResults));
        return newResult;
      }
    } catch (error) {
      console.error('Error saving result:', error);
      // Fall back to localStorage
      const existingResults = await getResults();
      const newResult = { ...resultData, id: Date.now().toString() };
      const updatedResults = [newResult, ...existingResults];
      localStorage.setItem(`spinpick_results_${state.user.id}`, JSON.stringify(updatedResults));
      return newResult;
    }
  };

  // Function to get CSV mappings
  const getMappings = async (): Promise<CSVMapping[]> => {
    if (!state.user) return [];

    try {
      if (state.client && isDirectusAvailable && state.isAuthenticated) {
        // Use Directus SDK if available
        const response = await state.client.request.get(`/items/csv_mappings?filter={"user":{"_eq":"${state.user.id}"}}&sort=-created_at`);
        return response.data || [];
      } else {
        // Fall back to API service
        return apiService.getCSVMappings(state.user.id);
      }
    } catch (error) {
      console.error('Error getting CSV mappings:', error);
      // Fall back to API service
      return apiService.getCSVMappings(state.user.id);
    }
  };

  // Function to create a CSV mapping
  const createMapping = async (mapping: Omit<CSVMapping, 'user' | 'created_at' | 'updated_at'>): Promise<CSVMapping> => {
    if (!state.user) {
      throw new Error('User must be authenticated to create mappings');
    }

    try {
      if (state.client && isDirectusAvailable && state.isAuthenticated) {
        // Use Directus SDK if available
        const mappingWithUser = { ...mapping, user: state.user.id };
        const response = await state.client.request.post('/items/csv_mappings', mappingWithUser);
        return response.data;
      } else {
        // Fall back to API service
        return apiService.createCSVMapping(mapping);
      }
    } catch (error) {
      console.error('Error creating CSV mapping:', error);
      // Fall back to API service
      return apiService.createCSVMapping(mapping);
    }
  };

  // Function to save CSV import
  const saveCSVImport = async (mappingId: string, filename: string, data: any[]): Promise<CSVImport> => {
    if (!state.user) {
      throw new Error('User must be authenticated to save imports');
    }

    const importData: Omit<CSVImport, 'id'> = {
      mapping_id: mappingId,
      filename,
      data,
      row_count: data.length,
      user: state.user.id,
      imported_at: new Date().toISOString()
    };

    try {
      if (state.client && isDirectusAvailable && state.isAuthenticated) {
        // Use Directus SDK if available
        const response = await state.client.request.post('/items/csv_imports', importData);
        return response.data;
      } else {
        // Fall back to localStorage
        const key = `spinpick_csv_imports_${state.user.id}`;
        const existingImports = localStorage.getItem(key);
        const imports = existingImports ? JSON.parse(existingImports) : [];
        const newImport = { ...importData, id: Date.now().toString() };
        const updatedImports = [newImport, ...imports];
        localStorage.setItem(key, JSON.stringify(updatedImports));
        return newImport;
      }
    } catch (error) {
      console.error('Error saving CSV import:', error);
      // Fall back to localStorage
      const key = `spinpick_csv_imports_${state.user.id}`;
      const existingImports = localStorage.getItem(key);
      const imports = existingImports ? JSON.parse(existingImports) : [];
      const newImport = { ...importData, id: Date.now().toString() };
      const updatedImports = [newImport, ...imports];
      localStorage.setItem(key, JSON.stringify(updatedImports));
      return newImport;
    }
  };

  // Function to get CSV imports
  const getImports = async (limit?: number): Promise<CSVImport[]> => {
    if (!state.user) return [];

    try {
      if (state.client && isDirectusAvailable && state.isAuthenticated) {
        // Use Directus SDK if available
        let url = `/items/csv_imports?filter={"user":{"_eq":"${state.user.id}"}}&sort=-imported_at`;
        if (limit) {
          url += `&limit=${limit}`;
        }
        const response = await state.client.request.get(url);
        return response.data || [];
      } else {
        // Fall back to localStorage
        const key = `spinpick_csv_imports_${state.user.id}`;
        const existingImports = localStorage.getItem(key);
        let imports = existingImports ? JSON.parse(existingImports) : [];
        if (limit && imports.length > limit) {
          imports = imports.slice(0, limit);
        }
        return imports;
      }
    } catch (error) {
      console.error('Error getting CSV imports:', error);
      // Fall back to localStorage
      const key = `spinpick_csv_imports_${state.user.id}`;
      const existingImports = localStorage.getItem(key);
      let imports = existingImports ? JSON.parse(existingImports) : [];
      if (limit && imports.length > limit) {
        imports = imports.slice(0, limit);
      }
      return imports;
    }
  };

  // Combined context value
  const contextValue: DirectusContextState & DirectusContextActions = {
    ...state,
    login,
    logout,
    refreshClient,
    getThemes,
    createTheme,
    getResults,
    saveResult,
    getMappings,
    createMapping,
    saveCSVImport,
    getImports,
    isDirectusAvailable
  };

  return (
    <DirectusContext.Provider value={contextValue}>
      {children}
    </DirectusContext.Provider>
  );
};

// Custom hook for using the Directus context
export const useDirectus = () => {
  const context = useContext(DirectusContext);
  if (context === undefined) {
    throw new Error('useDirectus must be used within a DirectusProvider');
  }
  return context;
};

export default DirectusContext;