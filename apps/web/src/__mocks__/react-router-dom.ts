import { vi } from 'vitest';
import React from 'react';

export const useNavigate = vi.fn();
export const useLocation = vi.fn(() => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
}));
export const useParams = vi.fn();
export const useSearchParams = vi.fn(() => [new URLSearchParams(), vi.fn()]);

export const Link = ({ children, to }: any) => React.createElement('a', { href: to }, children);
export const Routes = ({ children }: any) => children;
export const Route = () => null;
export const BrowserRouter = ({ children }: any) => children;
export const Navigate = ({ to }: any) => null;
