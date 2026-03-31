/**
 * Authentication Service
 * Handles user login, signup, logout, and profile management
 */

import { apiCall, apiClient, onAuthStateChange, clearAuth } from './api';
import { User, AuthResponse, LoginInput, SignupInput, UpdateUserInput } from '@/types';
import { AuthenticationError } from '@/types';

export const AuthService = {
  /**
   * Login with email and password
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    return apiCall(
      async () => {
        const response = await apiClient.post<{ user: User; token: string }>(
          '/api/auth/login',
          {
            email: input.email,
            password: input.password
          }
        );

        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        return {
          token: response.token,
          record: response.user
        };
      },
      'AuthService.login'
    );
  },

  /**
   * Create new user account
   */
  async signup(input: SignupInput): Promise<User> {
    return apiCall(
      async () => {
        const response = await apiClient.post<{ user: User; token: string }>(
          '/api/auth/signup',
          {
            email: input.email,
            password: input.password,
            passwordConfirm: input.passwordConfirm || input.password,
            nome: input.nome
          }
        );

        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        return response.user;
      },
      'AuthService.signup'
    );
  },

  /**
   * Logout current user
   */
  logout(): void {
    clearAuth();
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    return apiCall(
      async () => {
        const user = await apiClient.get<User>('/api/auth/me');
        return user;
      },
      'AuthService.getCurrentUser'
    );
  },

  /**
   * Update user profile
   */
  async updateUser(updates: UpdateUserInput): Promise<User> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new AuthenticationError('Not authenticated');
    }

    return apiCall(
      async () => {
        const updated = await apiClient.patch<User>('/api/auth/me', updates);
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      },
      'AuthService.updateUser'
    );
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChange((token) => {
      const user = token ? (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) : null;
      callback(user);
    });
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
};
