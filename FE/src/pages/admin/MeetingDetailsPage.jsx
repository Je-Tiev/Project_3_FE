import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Vote, StickyNote, Download, Eye, Trash2 } from 'lucide-react';
import { apiCall } from '../../utils/api';
import { useNavigate } from "react-router-dom";

const MeetingDetailsPage = ({ meetingId, onBack }) => {
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [activeTab, setActiveTab] = useState('agenda');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [removingIds, setRemovingIds] = useState([]);
  const navigate = useNavigate();

  const joinMeeting = () => {
    navigate(`/meeting/${meetingId}`);
  };

  // Load chi tiết meeting
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const data = await apiCall(`/Meetings/${meetingId}`, { method: 'GET' });
        setMeeting({
          id: data.meetingId,
          title: data.title,
          description: data.description,
          date: new Date(data.startTime).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
          time: new Date(data.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }),
          location: data.location,
          status: data.status === 'Scheduled' ? 'not_started' : data.status.toLowerCase(),
          organizer: data.createdByUserName, 
          file_rev: data.file_rev,
          file_rev_url: data.file_rev_url,
          file_pre: data.file_pre,
          file_pre_url: data.file_pre_url
        });
      } catch (err) {
        console.error('Lỗi tải thông tin meeting:', err);
      }
    };
    fetchMeeting();
  }, [meetingId]);

  // Load participants
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const data = await apiCall(`/Participant/meeting/${meetingId}`, { method: 'GET' });
        setParticipants(data.map(p => ({
          id: p.userId,
          name: p.fullName,
          email: p.email,
          role: p.fullName === meeting?.organizer ? 'Host' : 'Member',
          attendance: 'Present'
        })));
      } catch (err) {
        console.error('Lỗi tải danh sách participants:', err);
      }
    };
    fetchParticipants();
  }, [meetingId, meeting?.organizer]);

  // Xóa participant
  const deleteParticipant = async () => {
    if (!deleteTarget) return;
    try {
      setRemovingIds(prev => [...prev, deleteTarget.id]);

      setTimeout(async () => {
        await apiCall(`/Participant/meeting/${meetingId}/user/${deleteTarget.id}`, { method: 'DELETE' });
        setParticipants(prev => prev.filter(p => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      }, 300);
    } catch (err) {
      console.error("Lỗi khi xóa participant:", err);
      alert("Failed to remove participant.");
    }
  };

  const isHost = (name) => name === meeting?.organizer;

  if (!meeting) return <p className="text-text-light text-center py-8">Loading meeting...</p>;

  const tabs = [
    { key: 'agenda', label: 'Agenda', icon: Calendar },
    { key: 'participants', label: 'Participants', icon: Users },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'voting', label: 'Voting', icon: Vote },
    { key: 'notes', label: 'Notes', icon: StickyNote }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="text-text-light hover:text-text transition-colors">
              ← Back
            </button>
          )}
          <h1 className="text-3xl font-bold text-text">{meeting.title || 'Meeting Details'}</h1>
        </div>
        <button
          onClick={async () => {
            try {
              const token = localStorage.getItem("token");

              // 1) Gọi API join
              const joinInfo = await apiCall(`/Meetings/join/${meeting.id}`, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              // 2) Lưu joinInfo vào session để MeetingDetailPage fallback nếu refresh
              sessionStorage.setItem(
                `joinInfo_${meeting.id}`,
                JSON.stringify(joinInfo)
              );

              // 3) Điều hướng kèm state
              navigate(`/meeting/${meeting.id}`, {
                state: { joinInfo },
              });
            } catch (err) {
              console.error("Join failed:", err);
              alert(
                err?.message ||
                  "Không thể tham gia cuộc họp. Bạn có thể không có quyền hoặc cuộc họp chưa bắt đầu."
              );
            }
          }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button font-semibold transition-colors"
        >
          Join Meeting
        </button>

      </div>

      {/* Tabs */}
      <div className="bg-white border border-secondary-dark rounded-lg mb-6">
        <div className="flex border-b border-secondary-dark overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors whitespace-nowrap ${
                  isActive ? 'text-primary border-b-2 border-primary' : 'text-text-light hover:text-text'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Agenda */}
          {activeTab === 'agenda' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-light mb-2">Date</label>
                  <p className="text-text font-medium">{meeting.date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-2">Time</label>
                  <p className="text-text font-medium">{meeting.time}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-2">Location/Room</label>
                  <p className="text-text font-medium">{meeting.location || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-2">Host</label>
                  <p className="text-text font-medium">{meeting.organizer || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light mb-2">Description</label>
                <p className="text-text">{meeting.description || 'No description available.'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light mb-2">Status</label>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  meeting.status === 'completed' ? 'bg-green-100 text-green-700' :
                  meeting.status === 'ongoing' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {meeting.status === 'completed' ? 'Completed' :
                   meeting.status === 'ongoing' ? 'Ongoing' : 'Upcoming'}
                </span>
              </div>
            </div>
          )}

          {/* Participants */}
          {activeTab === 'participants' && (
            <div className="space-y-4">
              <div className="bg-white border border-secondary-dark rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Attendance Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-dark">
                    {participants.map((p, index) => (
                      <tr key={p.id} className={index % 2 === 0 ? 'bg-white' : 'bg-secondary'}>
                        <td className="px-6 py-4 text-sm text-text font-medium">{p.name}</td>
                        <td className="px-6 py-4 text-sm text-text">{p.role}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            p.attendance === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>{p.attendance}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {isHost(meeting.organizer) && p.role !== 'Host' && (
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" /> Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meeting.file_rev && (
                  <div className="bg-secondary border border-secondary-dark rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-text">Tài liệu được phát</h3>
                      {meeting.file_rev_url && (
                        <a href={meeting.file_rev_url} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-dark flex items-center gap-1 text-sm">
                          <Eye className="w-4 h-4" /> View
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-text-light">{meeting.file_rev}</p>
                    {meeting.file_rev_url && (
                      <button className="mt-2 text-primary hover:text-primary-dark flex items-center gap-1 text-sm">
                        <Download className="w-4 h-4" /> Download
                      </button>
                    )}
                  </div>
                )}
                {meeting.file_pre && (
                  <div className="bg-secondary border border-secondary-dark rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-text">Tài liệu chuẩn bị</h3>
                      {meeting.file_pre_url && (
                        <a href={meeting.file_pre_url} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-dark flex items-center gap-1 text-sm">
                          <Eye className="w-4 h-4" /> View
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-text-light">{meeting.file_pre}</p>
                    {meeting.file_pre_url && (
                      <button className="mt-2 text-primary hover:text-primary-dark flex items-center gap-1 text-sm">
                        <Download className="w-4 h-4" /> Download
                      </button>
                    )}
                  </div>
                )}
              </div>
              {!meeting.file_rev && !meeting.file_pre && (
                <p className="text-text-light text-center py-8">No documents attached to this meeting.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-2">Remove Participant</h3>
            <p className="text-text-light mb-4">
              Are you sure you want to remove <b>{deleteTarget.name}</b>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-dark"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await apiCall(`/Participant/meeting/${meetingId}/user/${deleteTarget.id}`, { method: 'DELETE' });
                    setParticipants(prev => prev.filter(p => p.id !== deleteTarget.id));
                    setDeleteTarget(null);
                  } catch (err) {
                    console.error(err);
                    alert("Failed to remove participant.");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MeetingDetailsPage;
