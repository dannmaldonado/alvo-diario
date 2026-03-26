import { vi } from 'vitest';

export const toast = {
  error: vi.fn(),
  success: vi.fn(),
  loading: vi.fn(),
  custom: vi.fn(),
  dismiss: vi.fn(),
};

export const Toaster = () => null;
