/**
 * Error Handling Tests
 * Test error conversion and user-friendly messages
 */

import { describe, it, expect } from 'vitest';
import {
  handleAPIError,
  getUserFriendlyMessage,
  ERROR_MESSAGES,
} from '@/utils/errors';
import {
  APIError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from '@/types';

describe('Error Handlers', () => {
  describe('handleAPIError', () => {
    it('should convert 401 status to AuthenticationError', () => {
      const pbError = {
        status: 401,
        message: 'Unauthorized',
      };

      const result = handleAPIError(pbError);

      expect(result).toBeInstanceOf(AuthenticationError);
      expect(result.status).toBe(401);
    });

    it('should convert 404 status to NotFoundError', () => {
      const pbError = {
        status: 404,
        message: 'User not found',
      };

      const result = handleAPIError(pbError);

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.status).toBe(404);
    });

    it('should handle validation errors with email field', () => {
      const pbError = {
        status: 400,
        data: {
          email: 'Email already exists',
        },
      };

      const result = handleAPIError(pbError);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.field).toBe('email');
    });

    it('should return generic APIError for unknown errors', () => {
      const pbError = {
        status: 500,
        message: 'Internal server error',
      };

      const result = handleAPIError(pbError);

      expect(result).toBeInstanceOf(APIError);
      expect(result.status).toBe(500);
    });

    it('should handle errors with no status', () => {
      const pbError = new Error('Network error');

      const result = handleAPIError(pbError);

      expect(result).toBeInstanceOf(APIError);
      expect(result.status).toBe(500);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return friendly message for known errors', () => {
      const error = new AuthenticationError('Invalid credentials');

      const message = getUserFriendlyMessage(error);

      // AuthenticationError should have AUTH_ERROR code
      expect(message).toBe(ERROR_MESSAGES.AUTH_ERROR);
    });

    it('should return error message if code not in map', () => {
      const error = new APIError(400, 'Custom error message', undefined, 'CUSTOM_CODE');

      const message = getUserFriendlyMessage(error);

      expect(message).toBe('Custom error message');
    });

    it('should handle ValidationError with code mapping', () => {
      const error = new ValidationError('email', 'Email field error');

      const message = getUserFriendlyMessage(error);

      // ValidationError uses the VALIDATION_ERROR code from ERROR_MESSAGES
      expect(message).toBe(ERROR_MESSAGES.VALIDATION_ERROR);
    });

    it('should return message for errors with matching code', () => {
      const error = new APIError(401, 'Session expired', undefined, 'SESSION_EXPIRED');

      const message = getUserFriendlyMessage(error);

      expect(message).toBe(ERROR_MESSAGES.SESSION_EXPIRED);
    });
  });

  describe('Error Classes', () => {
    it('should create APIError with correct properties', () => {
      const error = new APIError(400, 'Bad request', 'field_name', 'BAD_REQUEST');

      expect(error.status).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.field).toBe('field_name');
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.name).toBe('APIError');
    });

    it('should create ValidationError with field', () => {
      const error = new ValidationError('email', 'Invalid email');

      expect(error.field).toBe('email');
      expect(error.status).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create AuthenticationError without field', () => {
      const error = new AuthenticationError('Login failed');

      expect(error.status).toBe(401);
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.field).toBeUndefined();
    });

    it('should create NotFoundError with resource name', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have required message keys', () => {
      expect(ERROR_MESSAGES.INVALID_CREDENTIALS).toBeDefined();
      expect(ERROR_MESSAGES.USER_NOT_FOUND).toBeDefined();
      expect(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS).toBeDefined();
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.UNKNOWN_ERROR).toBeDefined();
    });

    it('should have Portuguese messages', () => {
      expect(ERROR_MESSAGES.INVALID_CREDENTIALS).toContain('senha');
      expect(ERROR_MESSAGES.NETWORK_ERROR).toContain('conexão');
    });
  });
});
