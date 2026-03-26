/**
 * API Service Layer
 * Centralized HTTP/PocketBase wrapper with error handling
 */

import PocketBase from 'pocketbase';
import { handlePBError, logError } from '@/utils/errors';
import { APIError } from '@/types';

/**
 * Initialize PocketBase client
 * URL can be configured via environment variable
 */
export const pb = new PocketBase(
  (import.meta.env.VITE_PB_URL as string | undefined) || 'http://localhost:8090'
);

/**
 * Wrapper for API calls with error handling
 * Converts PocketBase errors to standardized APIError instances
 */
export async function apiCall<T>(
  fn: () => Promise<T>,
  errorContext?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logError(`API Error (${errorContext})`, error);
    throw handlePBError(error);
  }
}

/**
 * Type-safe API call wrapper
 * Use this for calls that need explicit typing
 */
export async function apiCallTyped<T>(
  fn: () => Promise<T>,
  errorContext: string
): Promise<T> {
  return apiCall(fn, errorContext);
}

/**
 * Check if PocketBase client is authenticated
 */
export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
  return pb.authStore.model;
}

/**
 * Get current auth token
 */
export function getAuthToken(): string {
  return pb.authStore.token || '';
}

/**
 * Subscribe to auth state changes
 * Returns unsubscribe function
 */
export function onAuthStateChange(
  callback: (token: string, model: any) => void
): () => void {
  return pb.authStore.onChange(callback);
}

/**
 * Clear authentication (logout)
 */
export function clearAuth(): void {
  pb.authStore.clear();
}

/**
 * Refresh authentication token
 */
export async function refreshAuth(): Promise<void> {
  try {
    await pb.collection('users').authRefresh();
  } catch (error) {
    clearAuth();
    throw handlePBError(error);
  }
}

export default pb;
