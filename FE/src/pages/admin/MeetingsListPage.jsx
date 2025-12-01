import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, FileText, Plus } from 'lucide-react';
import { apiCall } from '../../utils/api';
import { useApp } from '../../contexts/AppContext';
import MeetingDetailsPage from './MeetingDetailsPage';

const MeetingsListPage = ({ onCreateMeeting }) => {
  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

  // Map status từ API → UI
  const statusMap = {
    Scheduled: 'not_started',
    Upcoming: 'not_started',
    Ongoing: 'ongoing',
    Completed: 'completed',
    Postponed: 'postponed'
  };

  // Format ngày dd/mm/yyyy theo giờ Việt Nam
const formatDate = (iso) => {
  if (!iso) return "";
  const dateObj = new Date(iso);
  return dateObj.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
};

// Format giờ HH:mm theo giờ Việt Nam
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

  // Load meetings từ API
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await apiCall('/Meetings', { method: 'GET' });

        const formatted = data.map(m => ({
          id: m.meetingId, // FIX: dùng meetingId
          date: formatDate(m.startTime),
          time: formatTime(m.startTime),
          location: m.location || '',
          organizer: m.createdByUserName || '',
          file_rev: m.file_rev,
          file_pre: m.file_pre,
          status: statusMap[m.status] || 'not_started',
          title: m.title || '',
          description: m.description || ''
        }));

        setMeetings(formatted);
        setFilteredMeetings(formatted);
      } catch (err) {
        console.error('Lỗi tải danh sách meeting:', err);
      }
    };

    fetchMeetings();
  }, []);

  // Lọc meetings
  useEffect(() => {
    const filtered = meetings.filter(m => {
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchRoom = !roomFilter || m.location.toLowerCase().includes(roomFilter.toLowerCase());
      const matchStartDate = !startDateFilter || m.date === startDateFilter;
      return matchStatus && matchRoom && matchStartDate;
    });

    setFilteredMeetings(filtered);
  }, [statusFilter, roomFilter, startDateFilter, meetings]);


  // Nếu click vào meeting → chuyển sang trang chi tiết
  if (selectedMeetingId) {
    return (
      <MeetingDetailsPage 
        meetingId={selectedMeetingId} 
        onBack={() => setSelectedMeetingId(null)} 
      />
    );
  }

  // Hiển thị badge status
  const getStatusBadge = (status) => {
    const config = {
      not_started: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Upcoming' },
      ongoing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Ongoing' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      postponed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Postponed' }
    };

    const c = config[status] || config.not_started;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Meetings List</h1>
        <button
         onClick={onCreateMeeting}
         className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button font-semibold flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Create New Meeting
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-secondary-dark rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-dark rounded-button text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="not_started">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="postponed">Postponed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Room</label>
            <input
              type="text"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              placeholder="Filter by room"
              className="w-full px-4 py-2 border border-secondary-dark rounded-button text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Start Date</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-dark rounded-button text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-secondary-dark rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Room</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Host</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Documents</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-secondary-dark">
              {filteredMeetings.map((meeting, index) => (
                <tr
                  key={meeting.id}
                  onClick={() => setSelectedMeetingId(meeting.id)}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-secondary'} cursor-pointer hover:bg-primary/10 transition-colors`}
                >
                  <td className="px-6 py-4 text-sm text-text">{meeting.date}</td>
                  <td className="px-6 py-4 text-sm text-text">{meeting.time}</td>
                  <td className="px-6 py-4 text-sm text-text">{meeting.location || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-text">{meeting.organizer || 'N/A'}</td>

                  <td className="px-6 py-4 text-sm">
                    {meeting.file_rev || meeting.file_pre ? (
                      <span className="text-primary flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {[meeting.file_rev, meeting.file_pre].filter(Boolean).length} files
                      </span>
                    ) : (
                      <span className="text-text-light">No documents</span>
                    )}
                  </td>

                  <td className="px-6 py-4">{getStatusBadge(meeting.status)}</td>

                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-primary hover:bg-secondary rounded-button" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-primary hover:bg-secondary rounded-button" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-secondary rounded-button" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredMeetings.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-text-light">
                    No meetings found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
};

export default MeetingsListPage;
