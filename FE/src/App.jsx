import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import MeetingDetailsPage from './pages/admin/MeetingDetailsPage';
import AdminLayout from './pages/admin/AdminLayout';
import MeetingPreJoinPage from './pages/MeetingPreJoinPage';
import MeetingDocumentsPage from './pages/MeetingDocumentsPage';

const AppContent = () => {
  const { isAuthenticated, currentUser } = useApp();

  // Nếu chưa đăng nhập → chỉ vào được /login
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Nếu là Admin
  if (currentUser?.role === 'Admin') {
    return (
      <Routes>
        {/* Admin layout */}
        <Route path="/admin/*" element={<AdminLayout />} />

        {/* Chi tiết meeting trong admin */}
        <Route path="/admin/meeting/:meetingId" element={<MeetingDetailsPage />} />

        {/* Admin vẫn được join meeting như user */}
        <Route path="/meeting/:meetingId" element={<MeetingDetailPage />} />

        {/* Các route khác → về admin */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }


  // Nếu là User
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Chi tiết meeting user */}
      <Route path="/meeting/:meetingId" element={<MeetingDetailPage />} />

      {/* Sai link → về trang chủ */}
      <Route path="*" element={<Navigate to="/" replace />} />

      <Route path="/meeting/:meetingId/documents" element={<MeetingDocumentsPage />} />\
      <Route path="/meeting/:meetingId/prejoin" element={<MeetingPreJoinPage />} />
      <Route path="/meeting/:meetingId" element={<MeetingDetailPage />} />

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
