import React from 'react';
import { useApp } from '../contexts/AppContext';

const MeetingTabs = () => {
  const { activeTab, setActiveTab } = useApp();

  const tabs = [
    { key: 'not_started', label: 'CUỘC HỌP CHƯA DIỄN RA', color: 'red' },
    { key: 'ongoing', label: 'CUỘC HỌP ĐANG DIỄN RA', color: 'blue' },
    { key: 'postponed', label: 'CUỘC HỌP BỊ HOÃN', color: 'orange' },
    { key: 'completed', label: 'CUỘC HỌP KẾT THÚC', color: 'green' }
  ];

  const getTabClasses = (tab) => {
    const baseClasses = 'flex-1 px-6 py-4 font-bold text-sm transition-colors';
    if (activeTab === tab.key) {
      return `${baseClasses} text-${tab.color}-600 border-b-4 border-${tab.color}-600 bg-${tab.color}-50`;
    }
    return `${baseClasses} text-gray-600 hover:bg-gray-50`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={getTabClasses(tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MeetingTabs;