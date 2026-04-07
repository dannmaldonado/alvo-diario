/**
 * TanStack Query Client Configuration
 * Centralized query client with sensible defaults for alvo-diario
 *
 * Error handling strategy:
 * - Queries: smart retry (skip 4xx except 408/429), global cache error listener for toasts
 * - Mutations: no retry, global onError toast
 */

import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Determine whether a failed query should be retried.
 * - Never retry client errors (4xx) except timeout (408) and rate-limit (429)
 * - Retry server errors (5xx) and network failures at most once
 */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const status = (error as any)?.status ?? (error as any)?.code;

  // 4xx client errors -- don't retry (user must fix the request)
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return status === 408 || status === 429;
  }

  // Server / network errors -- retry once
  return failureCount < 1;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes stale time for most data
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Smart retry: skip most 4xx, retry 5xx/network once
      retry: shouldRetryQuery,
      // Don't refetch when window regains focus in dev
      refetchOnWindowFocus: import.meta.env.PROD,
    },
    mutations: {
      // Never retry mutations (non-idempotent)
      retry: 0,
      onError: (error: Error) => {
        toast.error(error.message || 'Ocorreu um erro. Tente novamente.');
      },
    },
  },
});

/**
 * Global query cache error listener.
 * Shows a toast for query-level errors that are NOT 401 (handled by api.ts auto-logout).
 */
queryClient.getQueryCache().config.onError = (error: Error) => {
  const status = (error as any)?.status;
  // 401 is handled by the API client (auto-logout redirect)
  if (status === 401) return;
  const message = error.message || 'Algo deu errado ao carregar dados.';
  toast.error(message);
};
