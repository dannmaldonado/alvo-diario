/**
 * Main Application Component
 * Sets up authentication, routing, and global providers
 */

import React, { useEffect, Suspense } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from '@/components/ScrollToTop';
import Header from '@/components/Header';
import { setupGlobalErrorHandler } from '@/utils/errorHandler';
import { Skeleton } from '@/components/ui/skeleton';

// Pages - Eager loaded (entry pages)
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';

// Pages - Lazy loaded (app pages)
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const CronogramaPage = React.lazy(() => import('@/pages/CronogramaPage'));
const StudySessionPage = React.lazy(() => import('@/pages/StudySessionPage'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'));
const ProgressAnalysisPage = React.lazy(() => import('@/pages/ProgressAnalysisPage'));

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Skeleton className="h-12 w-64 mb-8" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Skeleton className="h-64 md:col-span-2 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  // Setup global error handler on mount
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <Router>
          <Header />
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Routes - with lazy loading */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <DashboardPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cronograma"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <CronogramaPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/study-session"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <StudySessionPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analise"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <ProgressAnalysisPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <ProfilePage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Catch-all Route */}
            <Route path="*" element={<HomePage />} />
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
