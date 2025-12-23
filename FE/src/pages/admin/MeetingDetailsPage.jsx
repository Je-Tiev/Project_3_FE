import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Vote, StickyNote, Download, Eye, Trash2, FileIcon } from 'lucide-react';
import { apiCall, API_BASE_URL } from '../../utils/api';
import { useNavigate } from "react-router-dom";
import { useApp } from '../../contexts/AppContext';

const MeetingDetailsPage = ({ meetingId, onBack }) => {
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('agenda');
  const navigate = useNavigate();
  const { currentUser } = useApp();

  // Load chi tiết meeting
  useEffect(() => {
    if (!meetingId) return;
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
    if (!meetingId) return;
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

  // Load tài liệu
  const fetchDocuments = async () => {
    try {
      const data = await apiCall(`/Document/GetDocumentsByMeeting/meeting/${meetingId}`, { method: 'GET' });
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải tài liệu:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'documents' && meetingId) {
      fetchDocuments();
    }
  }, [activeTab, meetingId]);


  const handleFileAction = async (docId, fileName, action = 'view') => {
    try {
      // Lấy token từ localStorage (giống cách apiCall hoạt động)
      const token = localStorage.getItem('token'); 
      
      const response = await fetch(`${API_BASE_URL}/Document/DownloadDocument/${docId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Không thể truy cập tập tin");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      if (action === 'download') {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } else {
        // Mở trong tab mới để xem
        window.open(url, '_blank');
      }

      // Giải phóng bộ nhớ sau khi xử lý
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("Lỗi xử lý file:", err);
      alert("Lỗi: " + err.message);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;
    try {
      await apiCall(`/Document/DeleteDocument/${docId}`, { method: 'DELETE' });
      // Cập nhật state bằng cách kiểm tra cả documentId và id (đề phòng API trả về khác nhau)
      setDocuments(prev => prev.filter(d => (d.documentId || d.id) !== docId));
    } catch (err) {
      alert("Xóa tài liệu thất bại: " + err.message);
    }
  };

  const handleDeleteParticipant = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người này khỏi cuộc họp?")) return;
    try {
      await apiCall(`/Participant/meeting/${meetingId}/user/${userId}`, { method: 'DELETE' });
      setParticipants(prev => prev.filter(p => p.id !== userId));
    } catch (err) {
      alert("Xóa người tham gia thất bại: " + err.message);
    }
  };

  // --- RENDER ---

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="text-text-light hover:text-text transition-colors">← Back</button>
          )}
          <h1 className="text-3xl font-bold text-text">{meeting.title || 'Meeting Details'}</h1>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-button font-semibold transition-colors">
          Join Meeting
        </button>
      </div>

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
             </div>
          )}

          {activeTab === 'participants' && (
            <div className="bg-white border border-secondary-dark rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-light uppercase">Role</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-text-light uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-dark">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/50">
                      <td className="px-6 py-4 text-sm text-text font-medium">{p.name}</td>
                      <td className="px-6 py-4 text-sm text-text">{p.role}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteParticipant(p.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.length > 0 ? documents.map((doc) => {
                const docId = doc.documentId || doc.id;
                return (
                  <div key={docId} className="bg-secondary border border-secondary-dark rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-semibold text-text text-sm truncate max-w-[200px]">{doc.fileName}</p>
                        <p className="text-xs text-text-light">Visibility: {doc.visibility || 'Chung'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleFileAction(docId, doc.fileName, 'download')}
                        className="text-primary hover:text-primary-dark"
                        title="Tải về"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleFileAction(docId, doc.fileName, 'view')}
                        className="text-primary hover:text-primary-dark"
                        title="Xem tài liệu"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteDocument(docId)}
                        className="text-red-500 hover:text-red-700"
                        title="Xóa"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <p className="col-span-full text-text-light text-center py-8">No documents found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailsPage;