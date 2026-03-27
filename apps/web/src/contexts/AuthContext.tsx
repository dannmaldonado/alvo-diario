/**
 * Authentication Context
 * Manages user authentication state and provides auth methods to the application
 * Integrates with AuthService for all PocketBase operations
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/services/auth.service';
import { User } from '@/types';
import { APIError } from '@/types';

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
 * Authentication Provider Component
 * Manages auth state and provides auth methods to child components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setCurrentUser(null);
      } finally {
        setInitialLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await AuthService.login({ email, password });
      setCurrentUser(response.record);
      return { success: true, user: response.record };
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'Login failed';
      console.error('Login error:', error);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Sign up with email, password, and user info
   */
  const signup = async (email: string, password: string, passwordConfirm: string, nome: string) => {
    try {
      const userData = {
        email,
        password,
        passwordConfirm,
        nome,
        nivel_atual: 'Iniciante',
        pontos_totais: 0,
        streak_atual: 0,
        meta_diaria_horas: 4,
      };

      const newUser = await AuthService.signup(userData as any);
      setCurrentUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'Signup failed';
      console.error('Signup error:', error);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout current user
   */
  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  /**
   * Update current user profile
   */
  const updateUser = async (updates: Partial<User>) => {
    if (!currentUser) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const updated = await AuthService.updateUser(updates as any);
      setCurrentUser(updated);
      return { success: true, user: updated };
    } catch (error) {
      const errorMessage = error instanceof APIError ? error.message : 'Update failed';
      console.error('Update user error:', error);
      return { success: false, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    signup,
    logout,
    updateUser,
    initialLoading,
  };

  // Show loading screen while initializing
  if (initialLoading) {
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
