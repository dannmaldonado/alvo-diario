
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';

// Pages
import HomePage from '@/pages/HomePage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import CronogramaPage from '@/pages/CronogramaPage.jsx';
import StudySessionPage from '@/pages/StudySessionPage.jsx';
import ProfilePage from '@/pages/ProfilePage.jsx';
import ProgressAnalysisPage from '@/pages/ProgressAnalysisPage.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
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
  );
}

export default App;
