import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import Header from '../components/Header';
import AdminCreateMeeting from '../components/AdminCreateMeeting';
import SearchBar from '../components/SearchBar';
import MeetingTabs from '../components/MeetingTabs';
import MeetingTable from '../components/MeetingTable';

const HomePage = () => {
  const { isAuthenticated, currentUser } = useApp();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.hash = '/login';
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Phòng họp không giấy Đại học Bách khoa Hà Nội" />
      
      <div className="max-w-7xl mx-auto p-6">
        {currentUser?.role === 'admin' && <AdminCreateMeeting />}
        <SearchBar />
        <MeetingTabs />
        <MeetingTable />

        <div className="mt-6 text-center text-sm text-gray-600">
          Bản quyền thuộc về: Trường Công nghệ Thông tin và Truyền thông - Đại học Bách Khoa Hà Nội
        </div>
      </div>
    </div>
  );
};

export default HomePage;
