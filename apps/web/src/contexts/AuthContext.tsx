/**
 * Authentication Context
 * Manages user authentication state and provides auth methods to the application.
 *
 * Key design decisions:
 * - Session restore reads from localStorage first (no API call on mount)
 * - TanStack Query wraps user state for cache integration
 * - 401 auto-logout is handled at the api.ts layer, not here
 * - Logout redirects to "/" via window.location (AuthProvider sits outside Router)
 */

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { AuthService } from '@/services/auth.service';
import { User, APIError } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  initialLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  signup: (
    email: string,
    password: string,
    passwordConfirm: string,
    nome: string
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<{ success: boolean; user?: User; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Hook to access authentication context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Restore user from localStorage without an API call.
 * Returns null if no stored session exists.
 */
function restoreUserFromStorage(): User | null {
  try {
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
      return JSON.parse(userJson) as User;
    }
  } catch {
    // Corrupted storage — clear it
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
  return null;
}

/**
 * Authentication Provider Component
 * Manages auth state and provides auth methods to child components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Use localStorage as source-of-truth for user session.
  // No API call on mount — trust the stored token until explicitly logged out.
  // This prevents 401 errors when page reloads if token is temporarily unavailable.
  const [currentUser, setCurrentUser] = React.useState<User | null>(restoreUserFromStorage());
  const [initialLoading, setInitialLoading] = React.useState(false);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await AuthService.login({ email, password });
      // AuthService.login already saves to localStorage
      setCurrentUser(response.record);
      return { success: true, user: response.record };
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'Login failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Sign up with email, password, and user info
   */
  const signup = useCallback(async (
    email: string,
    password: string,
    _passwordConfirm: string,
    nome: string
  ) => {
    try {
      const newUser = await AuthService.signup({ email, password, nome });
      // AuthService.signup already saves token + user to localStorage
      setCurrentUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'Signup failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Logout current user — clears state and redirects to home
   */
  const logout = useCallback(() => {
    AuthService.logout();
    setCurrentUser(null);
    window.location.href = '/';
  }, []);

  /**
   * Update current user profile
   */
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const updated = await AuthService.updateUser(updates as any);
      setCurrentUser(updated);
      return { success: true, user: updated };
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'Update failed';
      return { success: false, error: errorMessage };
    }
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    signup,
    logout,
    updateUser,
    initialLoading,
  };

  // When initialData is provided, isLoading is false on first render,
  // so no loading screen flash. Only show loader if there is truly no
  // cached data and the query is fetching for the first time.
  if (initialLoading && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
