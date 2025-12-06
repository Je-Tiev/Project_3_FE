import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, FileText, Plus, X } from 'lucide-react';
import { apiCall } from '../../utils/api';
import MeetingDetailsPage from './MeetingDetailsPage';

const MeetingsListPage = ({ onCreateMeeting }) => {
  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [editMeeting, setEditMeeting] = useState(null);
  const [toast, setToast] = useState(null); // { message: '', type: 'success'|'error' }
  const [deleteMeetingId, setDeleteMeetingId] = useState(null); // id meeting muốn xóa

  const statusMap = {
    Scheduled: 'not_started',
    Upcoming: 'not_started',
    Ongoing: 'ongoing',
    Completed: 'completed',
    Postponed: 'postponed'
  };

  // Toast helper
  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };

  // Convert ISO sang "YYYY-MM-DDTHH:mm" cho input datetime-local theo giờ Việt Nam
  const toLocalDateTimeInput = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + 7 * 3600 * 1000);
    const pad = (n) => n.toString().padStart(2, '0');
    const YYYY = vnTime.getFullYear();
    const MM = pad(vnTime.getMonth() + 1);
    const DD = pad(vnTime.getDate());
    const HH = pad(vnTime.getHours());
    const mm = pad(vnTime.getMinutes());
    return `${YYYY}-${MM}-${DD}T${HH}:${mm}`;
  };

  // Convert từ input datetime-local sang ISO để gửi API
  const fromLocalDateTimeInput = (localValue) => {
    const localDate = new Date(localValue);
    return localDate.toISOString();
  };

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

  // Load meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await apiCall('/Meetings', { method: 'GET' });
        const formatted = data.map(m => ({
          id: m.meetingId,
          date: formatDate(m.startTime),
          time: formatTime(m.startTime),
          location: m.location || '',
          organizer: m.createdByUserName || '',
          file_rev: m.file_rev,
          file_pre: m.file_pre,
          status: statusMap[m.status] || 'not_started',
          title: m.title || '',
          description: m.description || '',
          startTimeISO: m.startTime,
          endTimeISO: m.endTime
        }));
        setMeetings(formatted);
        setFilteredMeetings(formatted);
      } catch (err) {
        console.error(err);
        showToast("Lỗi tải danh sách meeting!", "error");
      }
    };
    fetchMeetings();
  }, []);

  // Filter meetings
  useEffect(() => {
    const filtered = meetings.filter(m => {
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchRoom = !roomFilter || m.location.toLowerCase().includes(roomFilter.toLowerCase());
      const matchStartDate = !startDateFilter || m.date === startDateFilter;
      return matchStatus && matchRoom && matchStartDate;
    });
    setFilteredMeetings(filtered);
  }, [statusFilter, roomFilter, startDateFilter, meetings]);

  if (selectedMeetingId) {
    return (
      <MeetingDetailsPage 
        meetingId={selectedMeetingId} 
        onBack={() => setSelectedMeetingId(null)} 
      />
    );
  }

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

  const handleSaveEdit = async () => {
    try {
      await apiCall(`/Meetings/${editMeeting.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editMeeting.title,
          description: editMeeting.description,
          startTime: editMeeting.startTimeISO,
          endTime: editMeeting.endTimeISO,
          location: editMeeting.location
        }),
      });
      setMeetings(prev =>
        prev.map(m => m.id === editMeeting.id ? { ...m, ...editMeeting } : m)
      );
      showToast("Cập nhật meeting thành công!", "success");
      setEditMeeting(null);
    } catch (err) {
      console.error(err);
      showToast("Cập nhật meeting thất bại!", "error");
    }
  };

  return (
    <div className="p-6 relative">
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
                  <td className="px-6 py-4 text-sm text-text">{formatDate(meeting.startTimeISO)}</td>
                  <td className="px-6 py-4 text-sm text-text">{formatTime(meeting.startTimeISO)}</td>
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
                      <button
                        className="p-2 text-primary hover:bg-secondary rounded-button"
                        title="View"
                        onClick={() => setSelectedMeetingId(meeting.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        className="p-2 text-primary hover:bg-secondary rounded-button"
                        title="Edit"
                        onClick={() => setEditMeeting(meeting)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        className="p-2 text-red-600 hover:bg-secondary rounded-button"
                        title="Delete"
                        onClick={() => setDeleteMeetingId(meeting.id)}
                      >
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

      {/* Edit Modal */}
      {editMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-800"
              onClick={() => setEditMeeting(null)}
            >
              <X />
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Meeting</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Title</label>
                <input
                  type="text"
                  value={editMeeting.title}
                  onChange={(e) => setEditMeeting({ ...editMeeting, title: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-dark rounded-button"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Description</label>
                <textarea
                  value={editMeeting.description}
                  onChange={(e) => setEditMeeting({ ...editMeeting, description: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-dark rounded-button"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Location</label>
                <input
                  type="text"
                  value={editMeeting.location}
                  onChange={(e) => setEditMeeting({ ...editMeeting, location: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-dark rounded-button"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={toLocalDateTimeInput(editMeeting.startTimeISO)}
                  onChange={(e) => setEditMeeting({
                    ...editMeeting,
                    startTimeISO: fromLocalDateTimeInput(e.target.value)
                  })}
                  className="w-full px-4 py-2 border border-secondary-dark rounded-button"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={toLocalDateTimeInput(editMeeting.endTimeISO)}
                  onChange={(e) => setEditMeeting({
                    ...editMeeting,
                    endTimeISO: fromLocalDateTimeInput(e.target.value)
                  })}
                  className="w-full px-4 py-2 border border-secondary-dark rounded-button"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-button bg-gray-300 hover:bg-gray-400"
                onClick={() => setEditMeeting(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-button bg-primary text-white hover:bg-primary-dark"
                onClick={handleSaveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteMeetingId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Xác nhận xóa</h2>
            <p className="mb-6">Bạn có chắc muốn xóa meeting này không?</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-button bg-gray-300 hover:bg-gray-400"
                onClick={() => setDeleteMeetingId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-button bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  try {
                    await apiCall(`/Meetings/${deleteMeetingId}`, { method: 'DELETE' });
                    setMeetings(prev => prev.filter(m => m.id !== deleteMeetingId));
                    showToast("Xóa meeting thành công!", "success");
                  } catch (err) {
                    console.error(err);
                    showToast("Xóa meeting thất bại!", "error");
                  } finally {
                    setDeleteMeetingId(null);
                  }
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 px-4 py-2 rounded-lg shadow-lg text-white z-50
          ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default MeetingsListPage;
