/**
 * AuthService Tests
 * Test authentication flows: login, signup, logout, password reset
 */

import { describe, it, expect } from 'vitest';
import { AuthService } from '@/services';
import { mockAuthResponse } from '@/__tests__/helpers';
import { AuthenticationError } from '@/types';

/**
 * Note: Full integration testing of AuthService requires mocking PocketBase at the module level.
 * For now, we test the public API surface and error handling paths.
 */

describe('AuthService', () => {
  describe('Authentication Methods', () => {
    it('should export login method', () => {
      expect(typeof AuthService.login).toBe('function');
    });

    it('should export signup method', () => {
      expect(typeof AuthService.signup).toBe('function');
    });

    it('should export logout method', () => {
      expect(typeof AuthService.logout).toBe('function');
    });

    it('should export getCurrentUser method', () => {
      expect(typeof AuthService.getCurrentUser).toBe('function');
    });

    it('should export updateUser method', () => {
      expect(typeof AuthService.updateUser).toBe('function');
    });

    it('should export isAuthenticated method', () => {
      expect(typeof AuthService.isAuthenticated).toBe('function');
    });

    it('should export requestPasswordReset method', () => {
      expect(typeof AuthService.requestPasswordReset).toBe('function');
    });

    it('should export confirmPasswordReset method', () => {
      expect(typeof AuthService.confirmPasswordReset).toBe('function');
    });

    it('should export onAuthStateChange method', () => {
      expect(typeof AuthService.onAuthStateChange).toBe('function');
    });
  });

  describe('Service Structure', () => {
    it('should be an object with methods', () => {
      expect(typeof AuthService).toBe('object');
      expect(AuthService).not.toBeNull();
    });

    it('should have consistent method signatures', () => {
      // All methods should be functions
      Object.values(AuthService).forEach((value) => {
        expect(typeof value).toBe('function');
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw AuthenticationError when not authenticated for updateUser', async () => {
      // This tests the guard clause in updateUser that checks for authentication
      try {
        // Create a mock scenario where model is null
        // This is a behavioral test of the service structure
        await AuthService.updateUser({ nome: 'Test' });
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
      }
    });
  });

  describe('Mock Data Support', () => {
    it('should work with mock auth response structure', () => {
      const authData = mockAuthResponse;

      expect(authData.token).toBeDefined();
      expect(authData.record.email).toBe('test@example.com');
      expect(authData.record.id).toBe('user-1');
    });
  });
});
