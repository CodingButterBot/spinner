import React, { useState, useEffect } from 'react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { authService, User } from '@/services/auth';
import { themeService, ThemeData } from '@/services/theme';
import { Input } from '@/components/ui/input';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ImportButton } from '@/components/csv/ImportButton';
import { contestantService } from '@/services/contestants';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export default function Options() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  const [settings, setSettings] = useState({
    general: {
      autoOpenSidepanel: false,
      soundEffects: true,
      animations: true
    },
    randomizer: {
      saveHistory: true,
      celebrationEffects: true,
      defaultView: 'wheel',
      showWinnerTicketInput: true,
      defaultTicketColumn: 'ticket_number',
      defaultNameColumn: 'name'
    },
    advanced: {
      spinDuration: 3,
      spinIterations: 20,
      debugMode: false
    }
  });

  const [availableThemes, setAvailableThemes] = useState<Record<string, ThemeData>>({});
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [isDirty, setIsDirty] = useState(false);
  
  // Authentication page component
  interface AuthenticationPageProps {
    onLoginSuccess: () => void;
  }

  function AuthenticationPage({ onLoginSuccess }: AuthenticationPageProps) {
    const [activeTab, setActiveTab] = useState<string>('login');

    const handleLoginSuccess = (data: any) => {
      onLoginSuccess();
    };

    const handleError = (error: string) => {
      console.error(error);
    };

    return (
      <div className="min-h-screen p-8 bg-background text-foreground flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>SpinPick Account</CardTitle>
                <CardDescription>Login or register to access SpinPick</CardDescription>
              </div>
              <ThemeSwitcher />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm
                  onSuccess={handleLoginSuccess}
                  onError={handleError}
                />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm
                  onSuccess={handleLoginSuccess}
                  onError={handleError}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is already authenticated on mount (auto-login)
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔐 Options Auto-login: Checking authentication status...');
      try {
        // Check if user is authenticated
        const isAuthenticated = authService.isAuthenticated();
        console.log('🔐 Options Auto-login: Authentication status:', isAuthenticated);

        if (isAuthenticated) {
          // Get user from auth service
          const user = authService.getUser();
          console.log('🔐 Options Auto-login: User found:', user?.email);

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          // If authenticated, load user's theme and settings
          if (user) {
            console.log('🔐 Options Auto-login: Loading user preferences and settings...');

            // Load and apply themes
            await themeService.loadCustomThemes();
            const currentTheme = themeService.getCurrentTheme();
            themeService.applyTheme(currentTheme);
            console.log('🔐 Options Auto-login: Applied theme:', currentTheme);

            // Get all available themes
            const themes = themeService.getAllThemes();
            setAvailableThemes(themes);
            setSelectedTheme(currentTheme);
            console.log('🔐 Options Auto-login: Loaded available themes:', Object.keys(themes).length);

            // Load user settings from storage
            loadSavedSettings();
          }
        } else {
          console.log('🔐 Options Auto-login: User not authenticated, showing login page');
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
            console.warn('🔐 Options Auto-login: Found stored credentials but authentication failed. Storage might be corrupted.');
            // Optionally clear corrupted storage
            // authService.logout();
          }
        }
      } catch (error) {
        console.error('🔐 Options Auto-login: Auth check failed:', error);
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
  
  const loadSavedSettings = () => {
    const savedSettings = localStorage.getItem('spinpick_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  };
  
  const saveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('spinpick_settings', JSON.stringify(settings));
    setIsDirty(false);
    
    // Show a brief save confirmation
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
      saveButton.textContent = 'Saved!';
      setTimeout(() => {
        if (saveButton) saveButton.textContent = 'Save Settings';
      }, 1500);
    }
  };
  
  const updateGeneralSetting = (key: keyof typeof settings.general, value: any) => {
    setSettings(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [key]: value
      }
    }));
    setIsDirty(true);
  };
  
  const updateRandomizerSetting = (key: keyof typeof settings.randomizer, value: any) => {
    setSettings(prev => ({
      ...prev,
      randomizer: {
        ...prev.randomizer,
        [key]: value
      }
    }));
    setIsDirty(true);
  };
  
  const updateAdvancedSetting = (key: keyof typeof settings.advanced, value: any) => {
    setSettings(prev => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        [key]: value
      }
    }));
    setIsDirty(true);
  };

  const changeTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    themeService.applyTheme(themeId);
    setIsDirty(true);
  };
  
  if (authState.isLoading) {
    return (
      <div className="min-h-screen p-8 bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 w-4 bg-primary rounded-full"></div>
          <div className="h-4 w-4 bg-primary rounded-full"></div>
          <div className="h-4 w-4 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }
  
  if (!authState.isAuthenticated) {
    return <AuthenticationPage onLoginSuccess={() => checkAuth()} />;
  }
  
  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SpinPick Options</h1>
          <div className="flex items-center space-x-4">
            <p className="text-sm">
              Logged in as: <span className="font-medium">{authState.user?.firstName || authState.user?.email}</span>
            </p>
            <ThemeSwitcher />
          </div>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="randomizer">Randomizer</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure your SpinPick experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-open-sidepanel">Auto-open side panel</Label>
                  <Switch 
                    id="auto-open-sidepanel"
                    checked={settings.general.autoOpenSidepanel}
                    onCheckedChange={(checked) => updateGeneralSetting('autoOpenSidepanel', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound-effects">Sound effects</Label>
                  <Switch 
                    id="sound-effects" 
                    checked={settings.general.soundEffects}
                    onCheckedChange={(checked) => updateGeneralSetting('soundEffects', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="animations">Animations</Label>
                  <Switch 
                    id="animations" 
                    checked={settings.general.animations}
                    onCheckedChange={(checked) => updateGeneralSetting('animations', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="randomizer">
            <Card>
              <CardHeader>
                <CardTitle>Randomizer Settings</CardTitle>
                <CardDescription>Default settings for randomizers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="save-history">Save result history</Label>
                  <Switch
                    id="save-history"
                    checked={settings.randomizer.saveHistory}
                    onCheckedChange={(checked) => updateRandomizerSetting('saveHistory', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label htmlFor="confetti">Celebration effects</Label>
                  <Switch
                    id="confetti"
                    checked={settings.randomizer.celebrationEffects}
                    onCheckedChange={(checked) => updateRandomizerSetting('celebrationEffects', checked)}
                  />
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <Label htmlFor="default-view">Default view</Label>
                  <Select
                    defaultValue={settings.randomizer.defaultView}
                    onValueChange={(value) => updateRandomizerSetting('defaultView', value)}
                  >
                    <SelectTrigger id="default-view">
                      <SelectValue placeholder="Select a view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wheel">Spinning Wheel</SelectItem>
                      <SelectItem value="slot">Slot Machine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Spinner Configuration</h3>

                  <div className="space-y-2">
                    <Label htmlFor="winner-ticket-input">Display Winner Ticket Input</Label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Show input field for winner ticket number</span>
                      <Switch
                        id="winner-ticket-input"
                        checked={settings.randomizer.showWinnerTicketInput}
                        onCheckedChange={(checked) => updateRandomizerSetting('showWinnerTicketInput', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-ticket-column">Default Ticket Number Column</Label>
                    <Select
                      value={settings.randomizer.defaultTicketColumn}
                      onValueChange={(value) => updateRandomizerSetting('defaultTicketColumn', value)}
                    >
                      <SelectTrigger id="default-ticket-column">
                        <SelectValue placeholder="Select CSV column for ticket numbers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ticket_number">Ticket Number</SelectItem>
                        <SelectItem value="id">ID</SelectItem>
                        <SelectItem value="entry_id">Entry ID</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Column to use for ticket numbers from imported CSV</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-name-column">Default Contestant Name Column</Label>
                    <Select
                      value={settings.randomizer.defaultNameColumn}
                      onValueChange={(value) => updateRandomizerSetting('defaultNameColumn', value)}
                    >
                      <SelectTrigger id="default-name-column">
                        <SelectValue placeholder="Select CSV column for contestant names" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="contestant_name">Contestant Name</SelectItem>
                        <SelectItem value="full_name">Full Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Column to use for contestant names from imported CSV</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Import Contestant Data</Label>
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-muted-foreground">Import contestants from a CSV file</p>
                      <ImportButton
                        userId={authState.user?.id || ''}
                        onImportComplete={(data) => {
                          console.log('CSV import complete:', data);

                          // Store the imported data in the contestant service
                          const count = contestantService.updateFromCSV(data);

                          // Show a brief success message
                          const importButton = document.getElementById('csv-import-button');
                          if (importButton) {
                            importButton.textContent = `Imported ${count} Contestants`;
                            setTimeout(() => {
                              if (importButton) importButton.textContent = 'Import Contestants';
                            }, 2000);
                          }
                        }}
                        id="csv-import-button"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of SpinPick</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="theme-select">Theme</Label>
                  <Select 
                    defaultValue={selectedTheme}
                    onValueChange={changeTheme}
                  >
                    <SelectTrigger id="theme-select">
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(availableThemes).map(themeId => (
                        <SelectItem key={themeId} value={themeId}>
                          {themeId.charAt(0).toUpperCase() + themeId.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-20 rounded-md flex items-center justify-center bg-primary text-primary-foreground">
                    Primary
                  </div>
                  <div className="h-20 rounded-md flex items-center justify-center bg-secondary text-secondary-foreground">
                    Secondary
                  </div>
                  <div className="h-20 rounded-md flex items-center justify-center bg-accent text-accent-foreground">
                    Accent
                  </div>
                  <div className="h-20 rounded-md flex items-center justify-center bg-muted text-muted-foreground">
                    Muted
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Profile Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="account-first-name">First Name</Label>
                      <Input
                        id="account-first-name"
                        defaultValue={authState.user?.first_name || ''}
                        placeholder="First Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account-last-name">Last Name</Label>
                      <Input
                        id="account-last-name"
                        defaultValue={authState.user?.last_name || ''}
                        placeholder="Last Name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account-email">Email Address</Label>
                    <Input
                      id="account-email"
                      type="email"
                      defaultValue={authState.user?.email || ''}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
                  </div>

                  <Button>Update Profile</Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Password</h3>

                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <Button>Change Password</Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Actions</h3>

                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={() => authService.logout()}>
                      Sign Out
                    </Button>

                    <Button variant="destructive">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Customization for power users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="spin-duration">Spin Duration: {settings.advanced.spinDuration}s</Label>
                  </div>
                  <Slider
                    id="spin-duration"
                    min={1}
                    max={10}
                    step={0.1}
                    defaultValue={[settings.advanced.spinDuration]}
                    onValueChange={(value) => updateAdvancedSetting('spinDuration', value[0])}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="spin-iterations">Spin Iterations: {settings.advanced.spinIterations}</Label>
                  </div>
                  <Slider
                    id="spin-iterations"
                    min={5}
                    max={50}
                    step={1}
                    defaultValue={[settings.advanced.spinIterations]}
                    onValueChange={(value) => updateAdvancedSetting('spinIterations', value[0])}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label htmlFor="debug-mode">Debug Mode</Label>
                  <Switch
                    id="debug-mode"
                    checked={settings.advanced.debugMode}
                    onCheckedChange={(checked) => updateAdvancedSetting('debugMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => window.close()}>
            Close
          </Button>
          <Button 
            id="save-button"
            onClick={saveSettings}
            disabled={!isDirty}
            className={isDirty ? 'animate-pulse' : ''}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}