import { vi } from 'vitest';

export const mockPB = {
  collection: vi.fn(() => ({
    getFullList: vi.fn(),
    getOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    subscribe: vi.fn(),
    authWithPassword: vi.fn(),
    authRefresh: vi.fn(),
  })),
  authStore: {
    isValid: false,
    token: '',
    model: null,
    onChange: vi.fn(),
    clear: vi.fn(),
  },
  authRefresh: vi.fn(),
};

export default mockPB;
