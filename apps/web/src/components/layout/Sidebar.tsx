/**
 * Sidebar Navigation Component
 * Desktop: fixed left panel, collapsible (240px ↔ 64px icon-only)
 * Mobile: rendered inside a Sheet drawer (controlled by AppLayout)
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Timer,
  Calendar,
  BarChart3,
  BookOpen,
  User,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// NAV CONFIG
// ============================================================================

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Estudos',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/study-session', label: 'Estudar', icon: Timer },
      { path: '/cronograma', label: 'Cronograma', icon: Calendar },
    ],
  },
  {
    label: 'Desempenho',
    items: [
      { path: '/analise', label: 'Análise', icon: BarChart3 },
    ],
  },
  {
    label: 'Recursos',
    items: [
      { path: '/materiais', label: 'Materiais', icon: BookOpen },
    ],
  },
];

// ============================================================================
// NAV ITEM
// ============================================================================

interface NavItemProps {
  item: NavItem;
  isCollapsed: boolean;
  onClick?: () => void;
}

const SidebarNavItem: React.FC<NavItemProps> = ({ item, isCollapsed, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  const inner = (
    <Link
      to={item.path}
      onClick={onClick}
      aria-disabled={item.disabled}
      className={cn(
        'flex items-center gap-3 rounded-lg text-sm transition-colors duration-150 group',
        isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
        isActive
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        item.disabled && 'pointer-events-none opacity-40',
      )}
    >
      <item.icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive ? 'text-primary' : 'group-hover:text-foreground',
        )}
      />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
          {item.disabled && ' (em breve)'}
        </TooltipContent>
      </Tooltip>
    );
  }

  return inner;
};

// ============================================================================
// SIDEBAR CONTENT (shared between desktop and mobile drawer)
// ============================================================================

interface SidebarContentProps {
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  /** Called when a nav item is clicked in mobile drawer */
  onNavClick?: () => void;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  isCollapsed,
  onToggleCollapse,
  onNavClick,
}) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    onNavClick?.();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col">

        {/* ── Logo + collapse button ── */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-border',
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          {!isCollapsed && (
            <Link to="/dashboard" onClick={onNavClick}>
              <img
                src={theme === 'dark' ? '/assets/logos/logo-dark.png' : '/assets/logos/logo-light.png'}
                alt="Alvo Diário"
                className="h-9 w-auto"
              />
            </Link>
          )}

          {/* Collapse / expand toggle — only on desktop */}
          {onToggleCollapse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapse}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground',
                    'hover:bg-muted hover:text-foreground transition-colors',
                  )}
                  aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? 'Expandir' : 'Recolher'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ── Nav groups ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {/* Group label — hidden when collapsed */}
              {!isCollapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <SidebarNavItem
                      item={item}
                      isCollapsed={isCollapsed}
                      onClick={onNavClick}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Bottom section: user, theme, logout ── */}
        <div className={cn('shrink-0 border-t border-border px-2 py-3 space-y-0.5')}>

          {/* User / Profile */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/profile"
                  onClick={onNavClick}
                  className="flex justify-center rounded-lg px-2 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <User className="h-4 w-4 shrink-0" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                {currentUser?.nome || 'Perfil'}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to="/profile"
              onClick={onNavClick}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="flex-1 truncate font-medium">
                {currentUser?.nome?.split(' ')[0] || 'Perfil'}
              </span>
            </Link>
          )}

          {/* Theme toggle */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className="flex w-full justify-center rounded-lg px-2 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Alternar tema"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
              <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
          )}

          {/* Logout */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex w-full justify-center rounded-lg px-2 py-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
