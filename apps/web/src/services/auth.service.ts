/**
 * Authentication Service
 * Handles user login, signup, logout, and profile management
 */

import { apiCall, pb, onAuthStateChange, clearAuth } from './api';
import { User, AuthResponse, LoginInput, SignupInput, UpdateUserInput } from '@/types';
import { AuthenticationError } from '@/types';

export const AuthService = {
  /**
   * Login with email and password
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    return apiCall(
      async () => {
        const authData = await pb
          .collection('users')
          .authWithPassword(input.email, input.password);

        return {
          token: pb.authStore.token,
          record: authData.record as unknown as User,
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
        // Create user account
        const newUser = await pb.collection('users').create({
          email: input.email,
          password: input.password,
          passwordConfirm: input.passwordConfirm || input.password,
          nome: input.nome,
        });

        // Auto-login after signup
        await pb.collection('users').authWithPassword(input.email, input.password);

        return newUser as unknown as User;
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
    if (!pb.authStore.isValid) {
      return null;
    }

    return apiCall(
      async () => {
        const user = pb.authStore.model as unknown as User;
        return user;
      },
      'AuthService.getCurrentUser'
    );
  },

  /**
   * Update user profile
   */
  async updateUser(updates: UpdateUserInput): Promise<User> {
    if (!pb.authStore.model?.id) {
      throw new AuthenticationError('Not authenticated');
    }

    return apiCall(
      async () => {
        const updated = await pb
          .collection('users')
          .update(pb.authStore.model!.id, updates);

        return updated as unknown as User;
      },
      'AuthService.updateUser'
    );
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChange(() => {
      const user = pb.authStore.isValid ? (pb.authStore.model as unknown as User) : null;
      callback(user);
    });
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return pb.authStore.isValid;
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    return apiCall(
      async () => {
        await pb.collection('users').requestPasswordReset(email);
      },
      'AuthService.requestPasswordReset'
    );
  },

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(
    resetToken: string,
    password: string,
    passwordConfirm: string
  ): Promise<void> {
    return apiCall(
      async () => {
        await pb.collection('users').confirmPasswordReset(resetToken, password, passwordConfirm);
      },
      'AuthService.confirmPasswordReset'
    );
  },
};
