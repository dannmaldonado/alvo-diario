/**
 * AppLayout — layout wrapper for all authenticated pages.
 *
 * Desktop (lg+):
 *   Fixed sidebar on the left (240px expanded / 64px collapsed).
 *   Content area has matching left margin, transitions smoothly.
 *
 * Mobile (<lg):
 *   Minimal top bar (logo + hamburger).
 *   Sidebar renders inside a Sheet drawer sliding from the left.
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { SidebarContent } from '@/components/layout/Sidebar';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

// ============================================================================
// SIDEBAR WIDTH CONSTANTS
// ============================================================================

const SIDEBAR_EXPANDED_W = 'w-60';  // 240px
const SIDEBAR_COLLAPSED_W = 'w-16'; // 64px
const CONTENT_EXPANDED_ML = 'lg:ml-60';
const CONTENT_COLLAPSED_ML = 'lg:ml-16';

// ============================================================================
// LOCAL STORAGE KEY
// ============================================================================

const STORAGE_KEY = 'sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

// ============================================================================
// APP LAYOUT
// ============================================================================

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Desktop Sidebar (fixed, hidden on mobile) ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col',
          'bg-card border-r border-border',
          'transition-all duration-200 ease-in-out',
          isCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W,
        )}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* ── Mobile Drawer (Sheet) ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-60 bg-card border-r border-border"
        >
          {/* Override Sheet's default close button via SidebarContent's own nav */}
          <SidebarContent
            isCollapsed={false}
            onNavClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ── Content Area ── */}
      <div
        className={cn(
          'flex flex-1 flex-col min-w-0',
          'transition-all duration-200 ease-in-out',
          isCollapsed ? CONTENT_COLLAPSED_ML : CONTENT_EXPANDED_ML,
        )}
      >
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/dashboard">
            <img
              src={theme === 'dark' ? '/assets/logos/logo-dark.png' : '/assets/logos/logo-light.png'}
              alt="Alvo Diário"
              className="h-8 w-auto"
            />
          </Link>

          {/* Spacer to balance hamburger on left */}
          <div className="w-8" />
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
