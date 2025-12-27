import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import MeetingDetailsPage from './pages/admin/MeetingDetailsPage';
import AdminLayout from './pages/admin/AdminLayout';
import MeetingPreJoinPage from './pages/MeetingPreJoinPage';
import MeetingDocumentsPage from './pages/MeetingDocumentsPage';

const AppContent = () => {
  const { isAuthenticated, currentUser } = useApp();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const hasToken = !!localStorage.getItem('token');
    const hasUser = !!localStorage.getItem('currentUser');
    
    const checkAuth = () => {
      if (hasToken && hasUser) {
        if (isAuthenticated) {
          setAuthChecked(true);
        } else {
          setTimeout(() => setAuthChecked(true), 200);
        }
      } else {
        setAuthChecked(true);
      }
    };
    
    setTimeout(checkAuth, 150);
  }, [isAuthenticated, currentUser]);

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (currentUser?.role === 'Admin') {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/admin/meeting/:meetingId" element={<MeetingDetailsPage />} />
        
        <Route path="/meeting/:meetingId/prejoin" element={<MeetingPreJoinPage />} />
        <Route path="/meeting/:meetingId/documents" element={<MeetingDocumentsPage />} />
        <Route path="/meeting/:meetingId" element={<MeetingDetailPage />} />
        
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/home" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      
      <Route path="/meeting/:meetingId/prejoin" element={<MeetingPreJoinPage />} />
      <Route path="/meeting/:meetingId/documents" element={<MeetingDocumentsPage />} />
      <Route path="/meeting/:meetingId" element={<MeetingDetailPage />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;