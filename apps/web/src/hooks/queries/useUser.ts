/**
 * TanStack Query hooks for User operations
 * Note: Auth state itself is managed by AuthContext.
 * These hooks are for server-state invalidation and cross-query coordination.
 */

export const userKeys = {
  all: ['user'] as const,
  current: () => [...userKeys.all, 'current'] as const,
};
