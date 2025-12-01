import React, { useState } from 'react';
import { Download } from 'lucide-react';

const ReportsPage = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [roomFilter, setRoomFilter] = useState('all');
  const [hostFilter, setHostFilter] = useState('all');

  // Mock chart data
  const monthlyMeetings = [12, 15, 18, 14, 16, 20, 17];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const maxValue = Math.max(...monthlyMeetings);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Reports</h1>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button font-semibold flex items-center gap-2 transition-colors">
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-secondary-dark rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-dark rounded-button text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Meeting Room</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-dark rounded-button text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Rooms</option>
              <option value="room1">Conference Room A</option>
              <option value="room2">Meeting Room 3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Host</label>
            <select
              value={hostFilter}
              onChange={(e) => setHostFilter(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-dark rounded-button text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Hosts</option>
              <option value="host1">John Doe</option>
              <option value="host2">Jane Smith</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Meetings by Month */}
        <div className="bg-white border border-secondary-dark rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text mb-4">Number of Meetings by Month</h2>
          <div className="flex items-end justify-between h-64 gap-2">
            {monthlyMeetings.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-primary rounded-t transition-all hover:bg-primary-dark cursor-pointer"
                    style={{ height: `${(value / maxValue) * 100}%`, minHeight: '20px' }}
                    title={`${value} meetings`}
                  />
                </div>
                <span className="text-xs text-text-light mt-2">{months[index]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Participation Rate */}
        <div className="bg-white border border-secondary-dark rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text mb-4">Participation Rate</h2>
          <div className="flex flex-col items-center justify-center h-64">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle cx="64" cy="64" r="45" stroke="#e0e0e0" strokeWidth="10" fill="none" />
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="#d32f2f"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - 0.82)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-text">82%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Utilization */}
      <div className="bg-white border border-secondary-dark rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-text mb-4">Room Utilization Frequency</h2>
        <div className="space-y-4">
          {['Conference Room A', 'Meeting Room 3', 'Boardroom'].map((room, index) => (
            <div key={index} className="flex items-center gap-4">
              <span className="w-48 text-sm text-text font-medium">{room}</span>
              <div className="flex-1 bg-secondary rounded-full h-4 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${60 + index * 15}%` }}
                />
              </div>
              <span className="w-16 text-sm text-text-light text-right">{60 + index * 15}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

