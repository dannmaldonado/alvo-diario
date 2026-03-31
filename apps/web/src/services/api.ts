/**
 * API Service Layer
 * Centralized HTTP wrapper with error handling
 */

import { logError } from '@/utils/errors';

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  'http://localhost:3001';

/**
 * HTTP API Client
 */
export const apiClient = {
  async request<T>(
    method: string,
    path: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      };

      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        ...options
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      logError(`API Error (${method} ${path})`, error);
      throw error;
    }
  },

  get: <T = any>(path: string, options?: RequestInit) =>
    apiClient.request<T>('GET', path, undefined, options),

  post: <T = any>(path: string, data: any, options?: RequestInit) =>
    apiClient.request<T>('POST', path, data, options),

  patch: <T = any>(path: string, data: any, options?: RequestInit) =>
    apiClient.request<T>('PATCH', path, data, options),

  delete: <T = any>(path: string, options?: RequestInit) =>
    apiClient.request<T>('DELETE', path, undefined, options)
};

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

/**
 * Get current auth token
 */
export function getAuthToken(): string {
  return localStorage.getItem('auth_token') || '';
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (token: string | null, user: any) => void
): () => void {
  // Simple implementation using storage events
  const handler = () => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    callback(token, user ? JSON.parse(user) : null);
  };

  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('storage', handler);
  };
}

/**
 * Clear authentication (logout)
 */
export function clearAuth(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

/**
 * Wrapper for API calls with error handling
 */
export async function apiCall<T>(
  fn: () => Promise<T>,
  errorContext?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logError(`API Error (${errorContext})`, error);
    throw error;
  }
}

/**
 * Type-safe API call wrapper
 */
export async function apiCallTyped<T>(
  fn: () => Promise<T>,
  errorContext: string
): Promise<T> {
  return apiCall(fn, errorContext);
}

export default apiClient;
