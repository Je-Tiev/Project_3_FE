import React from 'react';
import { LayoutDashboard, Users, DoorOpen, Settings, FileText, BarChart3 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const { logout } = useApp();

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'meetings', label: 'Meetings', icon: Users },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleLogout = () => {
    logout();
    window.location.hash = '/login';
  };

  return (
    <div className="w-64 bg-secondary h-screen fixed left-0 top-0 flex flex-col border-r border-secondary-dark">
      {/* Logo */}
      <div className="p-6 border-b border-secondary-dark">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">GM</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-text">GovMeet</h1>
            <p className="text-xs text-text-light">Management System</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveMenu(item.key)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-primary text-white font-semibold'
                  : 'text-text hover:bg-secondary-dark'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>


    </div>
  );
};

export default Sidebar;

