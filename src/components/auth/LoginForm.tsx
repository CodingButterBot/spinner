import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { authService } from '@/services/auth';

interface LoginFormProps {
  onSuccess: (data: any) => void;
  onError?: (error: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For development, pre-populate with demo credentials
  useEffect(() => {
    if (typeof import.meta.env !== 'undefined' && import.meta.env.MODE === 'development') {
      setEmail('admin@example.com');
      setPassword('password');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log('Login form submitted:', { email, password: password ? '***' : '' });

    try {
      // Use the authService instead of direct login function
      const user = await authService.login({
        email,
        password,
        rememberMe
      });

      console.log('Login succeeded, user:', user);
      onSuccess({ user, isAuthenticated: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      console.error('Login error:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="rememberMe"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
          disabled={isLoading}
        />
        <Label
          htmlFor="rememberMe"
          className="text-sm font-normal cursor-pointer"
        >
          Remember me
        </Label>
      </div>

      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>

      {/* Demo login helpers */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Demo accounts:</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEmail('admin@example.com');
              setPassword('password');
            }}
          >
            Demo Admin
          </Button>
        </div>
      </div>

      {/* Debug login info - only visible in development */}
      {typeof import.meta.env !== 'undefined' && import.meta.env.MODE === 'development' && (
        <div className="mt-4 p-2 border border-yellow-300 bg-yellow-50 rounded text-xs">
          <p className="font-semibold text-yellow-800">Static Login Info:</p>
          <p>Email: admin@example.com</p>
          <p>Password: password</p>
          <p className="mt-1 text-yellow-700">
            This is a static demo with localStorage-based authentication.
          </p>
        </div>
      )}
    </form>
  );
}