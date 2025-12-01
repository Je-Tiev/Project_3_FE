import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { apiCall } from '../../utils/api';
import { useApp } from '../../contexts/AppContext';
import SummaryCards from '../../components/admin/SummaryCards';
import MeetingsChart from '../../components/admin/MeetingsChart';
import ParticipationChart from '../../components/admin/ParticipationChart';
import MeetingDetailsPage from './MeetingDetailsPage';
import { useNavigate } from "react-router-dom";

const DashboardPage = ({ onCreateMeeting, onViewAllMeetings }) => {
  const { meetings } = useApp();
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

  const formatDate = (iso) => {
    if (!iso) return "";
    const dateObj = new Date(iso);
    return dateObj.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const dateObj = new Date(iso);
    return dateObj.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false, 
      timeZone: 'Asia/Ho_Chi_Minh' 
    });
  };

  const getStatusBadge = (status) => {
  const config = {
    not_started: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Upcoming' },
    ongoing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Ongoing' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
    postponed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Postponed' }
  };

  const c = config[status] || config.not_started;

  return (
    <span className={`px-4 py-1 rounded-full text-sm font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};


  useEffect(() => {
    const fetchRecentMeetings = async () => {
      try {
        const data = await apiCall('/Meetings', { method: 'GET' });
        const today = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        const filtered = data
          .map(m => ({
            id: m.meetingId,
            title: m.title,
            date: formatDate(m.startTime),
            time: formatTime(m.startTime),
            location: m.location,
            host: m.createdByUserName,
            status: m.status
          }))
          .filter(m => m.date === today);

        setRecentMeetings(filtered);
      } catch (err) {
        console.error('Lỗi tải cuộc họp:', err);
      }
    };

    fetchRecentMeetings();
  }, []);

  if (selectedMeetingId) {
    return (
      <MeetingDetailsPage 
        meetingId={selectedMeetingId} 
        onBack={() => setSelectedMeetingId(null)} 
      />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Dashboard</h1>
        <button
          onClick={onCreateMeeting}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> Create New Meeting
        </button>
      </div>

      {/* Summary Cards */}
      <SummaryCards meetings={meetings} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <MeetingsChart meetings={meetings} />
        <ParticipationChart />
      </div>

      {/* Recent Meetings Header */}
      <div className="flex justify-between items-center mt-6 mb-2">
        <h2 className="text-xl font-semibold text-text">Today Meetings</h2>
        <button
          onClick={onViewAllMeetings}
          className="text-primary font-semibold hover:underline"
        >
          View All
        </button>
      </div>

      {/* Recent Meetings Table */}
      <div className="bg-white border border-secondary-dark rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Host</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {recentMeetings.length > 0 ? (
              recentMeetings.map((m, index) => (
                <tr
                  key={m.id}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-secondary'} cursor-pointer hover:bg-primary/10 transition-colors`}
                  onClick={() => setSelectedMeetingId(m.id)}
                >
                  <td className="px-6 py-4 text-text">{m.date}</td>
                  <td className="px-6 py-4 text-text">{m.time}</td>
                  <td className="px-6 py-4 text-text">{m.title}</td>
                  <td className="px-6 py-4 text-text">{m.location}</td>
                  <td className="px-6 py-4 text-text">{m.host}</td>
                  <td className="px-6 py-4 text-text">{getStatusBadge(m.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-text-light">
                  No meetings for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage;
