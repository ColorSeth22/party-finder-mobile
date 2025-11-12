import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, LoginCredentials, RegisterCredentials } from '../types';

const TOKEN_KEY = '@partyfinder_token';
const USER_KEY = '@partyfinder_user';

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
  apiBaseUrl?: string;
};

export function AuthProvider({ children, apiBaseUrl = '' }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load token and user from AsyncStorage on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error loading auth data:', err);
        // Clear invalid data
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!apiBaseUrl) {
        throw new Error(
          'API base URL is not configured. Set EXPO_PUBLIC_API_BASE_URL in your build environment.'
        );
      }

      const url = `${apiBaseUrl.replace(/\/$/, '')}/api/auth/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      // Safer parsing with content-type detection
      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      let rawText: string | null = null;
      try {
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          rawText = await res.text();
        }
      } catch {
        try {
          rawText = await res.text();
        } catch {}
      }

      if (!res.ok) {
        const snippet = rawText ? ` (body: ${rawText.slice(0, 200)})` : '';
        const msg = data?.error || `Login failed: HTTP ${res.status}${snippet}`;
        console.warn('Login request failed', {
          url,
          status: res.status,
          contentType,
          bodyPreview: rawText?.slice(0, 200),
        });
        throw new Error(msg);
      }

      // Store token and user
      const token = data?.token;
      const user = data?.user;
      if (!token || !user) {
        throw new Error('Invalid server response (missing token or user)');
      }
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      setToken(token);
      setUser(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!apiBaseUrl) {
        throw new Error(
          'API base URL is not configured. Set EXPO_PUBLIC_API_BASE_URL in your build environment.'
        );
      }

      const url = `${apiBaseUrl.replace(/\/$/, '')}/api/auth/register`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      let rawText: string | null = null;
      try {
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          rawText = await res.text();
        }
      } catch {
        try {
          rawText = await res.text();
        } catch {}
      }

      if (!res.ok) {
        const snippet = rawText ? ` (body: ${rawText.slice(0, 200)})` : '';
        const msg = data?.error || `Registration failed: HTTP ${res.status}${snippet}`;
        console.warn('Register request failed', {
          url,
          status: res.status,
          contentType,
          bodyPreview: rawText?.slice(0, 200),
        });
        throw new Error(msg);
      }

      // Store token and user
      const token = data?.token;
      const user = data?.user;
      if (!token || !user) {
        throw new Error('Invalid server response (missing token or user)');
      }
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      setToken(token);
      setUser(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
