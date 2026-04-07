/**
 * API Service Layer
 * Centralized HTTP wrapper with error handling
 */
/* eslint-disable no-undef */

import { logError } from '@/utils/errors';

// Em produção, a API está no mesmo servidor (URL relativa)
// Em desenvolvimento, aponta para localhost:3001
const API_BASE_URL =
  import.meta.env.PROD
    ? ''
    : (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';

/**
 * Map HTTP status codes to user-friendly Portuguese messages.
 */
function getErrorMessage(status: number, data: any): string {
  if (status === 429) return 'Muitas tentativas. Tente novamente em alguns minutos.';
  if (status === 400) {
    // Surface validation details when the backend provides them
    if (Array.isArray(data?.details) && data.details.length > 0) {
      return data.details.join(', ');
    }
    return data?.error || 'Dados inválidos. Verifique os campos.';
  }
  if (status === 404) return data?.error || 'Recurso não encontrado.';
  if (status === 409) return data?.error || 'Conflito ao salvar. Tente novamente.';
  if (status >= 500) return 'Erro do servidor. Tente novamente mais tarde.';
  return data?.error || 'Erro desconhecido.';
}

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
        // 401 interceptor: auto-logout on expired/invalid token
        // Skip for login endpoint (401 there means bad credentials, not expired session)
        if (response.status === 401 && !path.includes('/auth/login')) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw Object.assign(
            new Error('Sessão expirada. Faça login novamente.'),
            { status: 401 }
          );
        }

        const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        const message = getErrorMessage(response.status, body);
        throw Object.assign(new Error(message), {
          status: response.status,
          details: body.details ?? body.errors ?? undefined,
        });
      }

      return response.json();
    } catch (error) {
      // Wrap raw network failures (e.g. offline, DNS, CORS) in a user-friendly message
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        const networkError = Object.assign(
          new Error('Sem conexão com o servidor. Verifique sua internet.'),
          { status: 0 }
        );
        logError(`API Error (${method} ${path})`, networkError);
        throw networkError;
      }
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
