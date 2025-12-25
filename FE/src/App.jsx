import React from 'react';
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

  // Nếu chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
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

<Route path="/meeting/:meetingId/prejoin" element={<MeetingPreJoinPage />} />

        {/* Chi tiết meeting trong admin */}
        <Route path="/admin/meeting/:meetingId" element={<MeetingDetailsPage />} />

{/* {Admin xem tài liệu} */}
<Route path="/meeting/:meetingId/documents" element={<MeetingDocumentsPage />} />

        {/* Admin vẫn được join meeting như user */}
        <Route path="/meeting/:meetingId" element={<MeetingDetailPage />} />

        {/* Các route khác → về admin */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }


  // Nếu là User
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
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
