/**
 * Validators Tests
 * Test email, password, and name validation functions
 */

import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, isValidName } from '@/utils/validators';

describe('Validators', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('john.doe@company.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@domain.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user @domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject emails without domain', () => {
      expect(isValidEmail('user@domain')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should accept passwords with 8 or more characters', () => {
      expect(isValidPassword('password')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
      expect(isValidPassword('MyP@ssw0rd')).toBe(true);
    });

    it('should reject passwords with less than 8 characters', () => {
      expect(isValidPassword('pass')).toBe(false);
      expect(isValidPassword('12345')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });

    it('should accept exactly 8 character passwords', () => {
      expect(isValidPassword('12345678')).toBe(true);
    });
  });

  describe('isValidName', () => {
    it('should accept names with 2 or more characters', () => {
      expect(isValidName('Jo')).toBe(true);
      expect(isValidName('John Doe')).toBe(true);
      expect(isValidName('José')).toBe(true);
    });

    it('should reject names with less than 2 characters', () => {
      expect(isValidName('J')).toBe(false);
      expect(isValidName('')).toBe(false);
    });

    it('should trim whitespace', () => {
      expect(isValidName('  Jo  ')).toBe(true);
      expect(isValidName('   ')).toBe(false);
    });

    it('should accept names with numbers and special characters', () => {
      expect(isValidName('John123')).toBe(true);
      expect(isValidName('Jean-Paul')).toBe(true);
    });
  });
});
