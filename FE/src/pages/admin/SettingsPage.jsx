import React, { useState } from 'react';
import { Save } from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: 'Admin Name',
    email: 'admin@example.com',
    position: 'System Administrator'
  });

  const tabs = [
    { key: 'profile', label: 'Personal Profile' },
    { key: 'roles', label: 'Role Management' },
    { key: 'system', label: 'System Configuration' }
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-text mb-6">Settings</h1>

      {/* Tabs */}
      <div className="bg-white border border-secondary-dark rounded-lg mb-6">
        <div className="flex border-b border-secondary-dark">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-4 font-semibold text-sm transition-colors ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-light hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-dark rounded-button text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-dark rounded-button text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Position</label>
                <input
                  type="text"
                  value={profile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-dark rounded-button text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div>
              <p className="text-text-light">Role management interface will be implemented here...</p>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-text mb-2">System Logo</label>
                <input
                  type="file"
                  className="w-full px-4 py-2 border border-secondary-dark rounded-button text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Primary Color</label>
                <input
                  type="color"
                  defaultValue="#d32f2f"
                  className="w-full h-12 border border-secondary-dark rounded-button"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Timezone</label>
                <select className="w-full px-4 py-2 border border-secondary-dark rounded-button text-text focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Asia/Ho_Chi_Minh</option>
                  <option>UTC</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button font-semibold flex items-center gap-2 transition-colors">
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;

