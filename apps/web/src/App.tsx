/**
 * Main Application Component
 * Sets up authentication, routing, and global providers.
 *
 * Route structure:
 *  /              → HomePage   (no layout)
 *  /login         → LoginPage  (no layout)
 *  /signup        → SignupPage (no layout)
 *  /*             → ProtectedLayout (AppLayout + sidebar) → each page
 */

import React, { useEffect, Suspense } from 'react';
import { Route, Routes, BrowserRouter as Router, Outlet, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ScrollToTop from '@/components/ScrollToTop';
import AppLayout from '@/components/layout/AppLayout';
import { setupGlobalErrorHandler } from '@/utils/errorHandler';
import { Skeleton } from '@/components/ui/skeleton';

// Pages — eager loaded (entry / public pages)
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';

// Pages — lazy loaded (authenticated app pages)
const DashboardPage        = React.lazy(() => import('@/pages/DashboardPage'));
const CronogramaPage       = React.lazy(() => import('@/pages/CronogramaPage'));
const StudySessionPage     = React.lazy(() => import('@/pages/StudySessionPage'));
const ProfilePage          = React.lazy(() => import('@/pages/ProfilePage'));
const ProgressAnalysisPage = React.lazy(() => import('@/pages/ProgressAnalysisPage'));
const MateriaisPage        = React.lazy(() => import('@/pages/MateriaisPage'));
const RevisaoPage        = React.lazy(() => import('@/pages/RevisaoPage'));
const NotFound             = React.lazy(() => import('@/pages/NotFound'));

// ============================================================================
// PAGE LOADER — Suspense fallback
// ============================================================================

const PageLoader: React.FC = () => (
  <div className="p-8 max-w-7xl mx-auto">
    <Skeleton className="h-10 w-56 mb-8" />
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Skeleton className="h-56 md:col-span-2 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  </div>
);

// ============================================================================
// PROTECTED LAYOUT — Auth guard + AppLayout wrapper
// ============================================================================

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, initialLoading } = useAuth();

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground text-sm">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
};

// ============================================================================
// APP
// ============================================================================

const App: React.FC = () => {
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Router>
              <ScrollToTop />

              <Routes>
                {/* ── Public routes (no sidebar) ── */}
                <Route path="/"       element={<HomePage />} />
                <Route path="/login"  element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* ── Protected routes (sidebar layout) ── */}
                <Route element={<ProtectedLayout />}>
                  <Route path="/dashboard"    element={<DashboardPage />} />
                  <Route path="/cronograma"   element={<CronogramaPage />} />
                  <Route path="/study-session" element={<StudySessionPage />} />
                  <Route path="/analise"      element={<ProgressAnalysisPage />} />
                  <Route path="/profile"      element={<ProfilePage />} />
                  <Route path="/materiais"    element={<MateriaisPage />} />
                  <Route path="/revisao"      element={<RevisaoPage />} />
                </Route>

                {/* ── 404 ── */}
                <Route path="*" element={
                  <Suspense fallback={<PageLoader />}>
                    <NotFound />
                  </Suspense>
                } />
              </Routes>

              <Toaster position="top-right" richColors />
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
