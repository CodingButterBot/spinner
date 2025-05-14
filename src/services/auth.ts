/**
 * Authentication service for SpinPick - Static Version
 * This version works without requiring Directus or any backend server
 */

import { apiService } from './api';

// Types
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  theme_preference?: 'light' | 'dark' | 'system';
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData extends LoginCredentials {
  first_name?: string;
  last_name?: string;
}

// Demo admin user for static testing
const DEMO_ADMIN_USER: User = {
  id: '1',
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'User',
  theme_preference: 'dark'
};

// Demo password for static testing (never do this in production!)
const DEMO_PASSWORD = 'password';

/**
 * Authentication service for SpinPick - Static Demo Version
 */
class AuthService {
  private user: User | null = null;
  private authToken: string | null = null;

  constructor() {
    // Try to load user and token from localStorage on initialization
    this.loadFromStorage();

    // Initialize users in localStorage if not present
    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify([DEMO_ADMIN_USER]));
    }
  }

  /**
   * Load user and token from storage (localStorage or sessionStorage)
   */
  private loadFromStorage() {
    try {
      // Try localStorage first
      let storedUser = localStorage.getItem('user');
      let storedToken = localStorage.getItem('authToken');
      let storageType = 'localStorage';

      // If not found in localStorage, try sessionStorage
      if (!storedUser || !storedToken) {
        storedUser = sessionStorage.getItem('user');
        storedToken = sessionStorage.getItem('authToken');
        storageType = 'sessionStorage';
      }

      if (storedUser && storedToken) {
        try {
          this.user = JSON.parse(storedUser);
          this.authToken = storedToken;

          // Set the user ID in the API service
          if (this.user) {
            apiService.setUserId(this.user.id);
          }

          console.log(`Successfully loaded auth from ${storageType}:`, { user: this.user, token: this.authToken });
        } catch (jsonError) {
          console.error('Failed to parse user JSON from storage:', jsonError);
          this.clearStorage();
        }
      } else {
        console.log('No auth data found in storage');
      }
    } catch (error) {
      console.error('Failed to load auth from storage:', error);
      this.clearStorage();
    }
  }

  /**
   * Save user and token to storage (localStorage or sessionStorage)
   * @param rememberMe - Whether to save to localStorage (true) or sessionStorage (false)
   */
  private saveToStorage(rememberMe: boolean = true) {
    if (this.user && this.authToken) {
      try {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(this.user));
        storage.setItem('authToken', this.authToken);

        // Set the user ID in the API service
        apiService.setUserId(this.user.id);

        console.log(`Auth data saved to ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
      } catch (error) {
        console.error(`Failed to save auth data to ${rememberMe ? 'localStorage' : 'sessionStorage'}:`, error);
      }
    } else {
      console.warn('Attempted to save auth data, but user or token is missing', { user: this.user, token: this.authToken });
    }
  }

  /**
   * Clear user and token from both localStorage and sessionStorage
   */
  private clearStorage() {
    // Clear from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');

    // Clear from sessionStorage too
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('authToken');

    apiService.clearUserId();
  }

  /**
   * Get users from localStorage
   * @returns Array of users
   */
  private getUsers(): User[] {
    try {
      const users = localStorage.getItem('users');
      return users ? JSON.parse(users) : [DEMO_ADMIN_USER];
    } catch (error) {
      console.error('Failed to get users from localStorage:', error);
      return [DEMO_ADMIN_USER];
    }
  }

  /**
   * Save users to localStorage
   * @param users - Array of users to save
   */
  private saveUsers(users: User[]) {
    localStorage.setItem('users', JSON.stringify(users));
  }

  /**
   * Generate a fake auth token
   * @returns Fake auth token
   */
  private generateToken(): string {
    return `fake-token-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get the current user
   * @returns Current user or null if not authenticated
   */
  getUser(): User | null {
    return this.user;
  }

  /**
   * Get the authentication token
   * @returns Auth token or null if not authenticated
   */
  getToken(): string | null {
    return this.authToken;
  }

  /**
   * Check if user is authenticated
   * @returns True if user is authenticated
   */
  isAuthenticated(): boolean {
    const authenticated = !!this.authToken && !!this.user;
    console.log('Authentication check:', { authenticated, user: this.user, token: this.authToken });
    return authenticated;
  }

  /**
   * Login with email and password
   * @param credentials - Login credentials (email, password, and rememberMe flag)
   * @returns Promise with user data
   */
  async login(credentials: LoginCredentials): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Extract rememberMe flag, default to true if not provided
    const { email, password, rememberMe = true } = credentials;

    console.log('Login attempt:', email, 'Remember me:', rememberMe);

    // For demo, allow login with admin demo account even with mismatched case
    if (email.toLowerCase() === DEMO_ADMIN_USER.email.toLowerCase() &&
        password === DEMO_PASSWORD) {
      console.log('Admin login successful');
      this.user = { ...DEMO_ADMIN_USER }; // Create a fresh copy
      this.authToken = this.generateToken();
      this.saveToStorage(rememberMe);
      return this.user;
    }

    // Check if user exists
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.error('Login failed: User not found');
      throw new Error('Login failed. User not found.');
    }

    // In a real app, we would check password hash
    // For demo, we just check if password is 'password'
    if (password !== DEMO_PASSWORD) {
      console.error('Login failed: Incorrect password');
      throw new Error('Login failed. Incorrect password.');
    }

    this.user = { ...user }; // Create a fresh copy
    this.authToken = this.generateToken();
    this.saveToStorage(rememberMe);
    console.log('Login successful:', { user: this.user, token: this.authToken, rememberMe });

    return this.user;
  }

  /**
   * Register a new user
   * @param data - Registration data
   * @returns Promise with user data
   */
  async register(data: RegisterData): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = this.getUsers();

    // Check if email is already in use
    if (users.some(u => u.email === data.email)) {
      throw new Error('Registration failed. Email already in use.');
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email: data.email,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      theme_preference: 'dark'
    };

    // Save to storage
    this.saveUsers([...users, newUser]);

    // Login with new user
    return this.login({
      email: data.email,
      password: data.password
    });
  }

  /**
   * Update user profile
   * @param data - User data to update
   * @returns Promise with updated user
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    if (!this.user) {
      throw new Error('Not authenticated');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Update user data
    const updatedUser = {
      ...this.user,
      ...data
    };

    // Update in users array
    const users = this.getUsers();
    const updatedUsers = users.map(u =>
      u.id === updatedUser.id ? updatedUser : u
    );

    // Save to storage
    this.saveUsers(updatedUsers);

    // Update current user
    this.user = updatedUser;
    this.saveToStorage();

    return this.user;
  }

  /**
   * Logout the current user
   */
  logout(): void {
    // Clear user and token
    this.user = null;
    this.authToken = null;
    this.clearStorage();
  }

  /**
   * Reset password (demo implementation)
   * @param email - User email
   * @returns Promise with success status
   */
  async resetPassword(email: string): Promise<{ success: boolean }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = this.getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error('Password reset failed. User not found.');
    }

    // In a real app, we would send an email
    // For demo, we just return success
    return { success: true };
  }

  /**
   * Set theme preference
   * @param theme - Theme preference (light, dark, or system)
   * @returns Promise with updated user
   */
  async setThemePreference(theme: 'light' | 'dark' | 'system'): Promise<User> {
    return this.updateProfile({ theme_preference: theme });
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;