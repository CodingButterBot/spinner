import React, { useState, useEffect } from 'react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/improved-button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import { authService, User } from '@/services/auth';
import { themeService } from '@/services/theme';
import { SimpleButtons } from '@/components/ui/simple-buttons';
import { FaSignOutAlt, FaCog, FaColumns } from 'react-icons/fa';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export default function Popup() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Check if user is already authenticated on mount (auto-login)
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔐 Auto-login: Checking authentication status...');
      try {
        // Check if user is authenticated
        const isAuthenticated = authService.isAuthenticated();
        console.log('🔐 Auto-login: Authentication status:', isAuthenticated);

        if (isAuthenticated) {
          // Get user from auth service
          const user = authService.getUser();
          console.log('🔐 Auto-login: User found:', user?.email);

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          // If authenticated, load user's theme
          if (user) {
            console.log('🔐 Auto-login: Loading user theme preferences...');
            await themeService.loadCustomThemes();
            // Apply the current theme
            const currentTheme = themeService.getCurrentTheme();
            themeService.applyTheme(currentTheme);
            console.log('🔐 Auto-login: Applied theme:', currentTheme);
          }
        } else {
          console.log('🔐 Auto-login: User not authenticated, showing login form');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });

          // Check if we have stored credentials that failed to load
          const hasLocalStorage = localStorage.getItem('authToken') !== null;
          const hasSessionStorage = sessionStorage.getItem('authToken') !== null;

          if (hasLocalStorage || hasSessionStorage) {
            console.warn('🔐 Auto-login: Found stored credentials but authentication failed. Storage might be corrupted.');
            // Optionally clear corrupted storage
            // authService.logout();
          }
        }
      } catch (error) {
        console.error('🔐 Auto-login: Auth check failed:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication check failed'
        });
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = async (authData: any) => {
    setAuthState({
      user: authData.user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });

    // Apply user's theme
    await themeService.loadCustomThemes();
    themeService.applyTheme(themeService.getCurrentTheme());
  };

  const handleLogout = async () => {
    authService.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  };
  
  // Helper function to open sidepanel
  const openSidePanel = () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        // Open the sidepanel
        chrome.windows.getCurrent(window => {
          if (window && window.id) {
            chrome.sidePanel.open({windowId: window.id});
          }
        });
      }
    });
  };
  
  return (
    <div className="min-h-[400px] min-w-[300px] p-4 bg-background text-foreground">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">SpinPick</h1>
        <ThemeSwitcher />
      </div>
      
      {authState.isLoading ? (
        <Card>
          <CardContent className="py-8 flex justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {!authState.isAuthenticated ? (
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Sign in to access your randomizers</CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm
                  onSuccess={handleLoginSuccess}
                  onError={(error) => console.error(error)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Randomizer Tools</CardTitle>
                <CardDescription>Welcome back, {authState.user?.firstName || 'User'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" leftIcon={<FaColumns />} onClick={openSidePanel}>
                  Open Side Panel
                </Button>

                <SimpleButtons />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" leftIcon={<FaCog />} onClick={() => chrome.runtime.openOptionsPage()}>
                  Options
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<FaSignOutAlt />} onClick={handleLogout}>
                  Logout
                </Button>
              </CardFooter>
            </Card>
          )}
        </>
      )}
    </div>
  );
}