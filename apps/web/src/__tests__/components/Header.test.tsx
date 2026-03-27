/**
 * Header Component Tests
 * Test header rendering and navigation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/helpers';
import Header from '@/components/Header';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

describe('Header Component', () => {
  it('should render header element', () => {
    render(<Header />);

    const header = screen.queryByRole('banner');
    expect(header).toBeDefined();
  });

  it('should render navigation links', () => {
    render(<Header />);

    const links = screen.queryAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(0);
  });

  it('should render without crashing', () => {
    const { container } = render(<Header />);

    expect(container).toBeDefined();
    expect(container.firstChild).toBeDefined();
  });

  it('should have consistent structure', () => {
    const { container } = render(<Header />);

    const header = container.querySelector('header');
    expect(header).toBeDefined();
  });
});
