import React from 'react';
import { Search, User } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const AdminHeader = ({ onCreateMeeting }) => {
  const { currentUser, logout } = useApp();
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <div className="h-16 bg-white border-b border-secondary-dark flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">GM</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings, rooms..."
            className="w-full pl-10 pr-4 py-2 bg-secondary text-text border border-secondary-dark rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-light">{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="text-text font-medium">{currentUser?.fullName || 'Admin Name'}</span>
        <button
          onClick={() => {
            logout();
            window.location.hash = '/login';
          }}
          className="px-4 py-2 text-text hover:bg-secondary rounded-button text-sm font-medium transition-colors"
        >
          Logout
        </button>
        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center border-2 border-secondary-dark">
          <User className="w-5 h-5 text-text" />
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;

