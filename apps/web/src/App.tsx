/**
 * Main Application Component
 * Sets up authentication, routing, and global providers
 */

import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from '@/components/ScrollToTop';
import Header from '@/components/Header';
import { setupGlobalErrorHandler } from '@/utils/errorHandler';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import CronogramaPage from '@/pages/CronogramaPage';
import StudySessionPage from '@/pages/StudySessionPage';
import ProfilePage from '@/pages/ProfilePage';
import ProgressAnalysisPage from '@/pages/ProgressAnalysisPage';

const App: React.FC = () => {
  // Setup global error handler on mount
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Header />
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cronograma"
              element={
                <ProtectedRoute>
                  <CronogramaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/study-session"
              element={
                <ProtectedRoute>
                  <StudySessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analise"
              element={
                <ProtectedRoute>
                  <ProgressAnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all Route */}
            <Route path="*" element={<HomePage />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
