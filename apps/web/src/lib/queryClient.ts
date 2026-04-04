/**
 * TanStack Query Client Configuration
 * Centralized query client with sensible defaults for alvo-diario
 */

import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes stale time for most data
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Don't refetch when window regains focus in dev
      refetchOnWindowFocus: import.meta.env.PROD,
    },
    mutations: {
      onError: (error: Error) => {
        toast.error(error.message || 'Ocorreu um erro. Tente novamente.');
      },
    },
  },
});
