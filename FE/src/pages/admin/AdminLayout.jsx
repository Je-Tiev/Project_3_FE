import React, { useState } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import DashboardPage from './DashboardPage';
import CreateMeetingForm from '../../components/admin/CreateMeetingForm';
import MeetingsListPage from './MeetingsListPage';
import UsersPage from './UsersPage';
import SettingsPage from './SettingsPage';

const AdminLayout = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateMeeting = () => {
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
  };

  const renderContent = () => {
    if (showCreateForm) {
      return (
        <div className="p-6">
          <button
            onClick={handleCloseForm}
            className="mb-4 text-text-light hover:text-text flex items-center gap-2 transition-colors"
          >
            ← Quay lại Dashboard
          </button>
          <CreateMeetingForm onClose={handleCloseForm} onSave={handleCloseForm} />
        </div>
      );
    }

    switch (activeMenu) {
      case 'dashboard':
        return (
          <DashboardPage
            onCreateMeeting={handleCreateMeeting}
            onViewAllMeetings={() => setActiveMenu('meetings')}
          />
        );
      case 'meetings':
        return (
          <MeetingsListPage
            onCreateMeeting={handleCreateMeeting}
          />
          );
      case 'rooms':
        return <RoomsPage />;
      case 'users':
        return <UsersPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onCreateMeeting={handleCreateMeeting} />;
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="flex-1 ml-64">
        <AdminHeader onCreateMeeting={handleCreateMeeting} />
        <div className="mt-16 overflow-y-auto h-[calc(100vh-4rem)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;

