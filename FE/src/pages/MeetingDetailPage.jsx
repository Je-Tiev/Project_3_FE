import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Users,
  ArrowLeft,
  Video,
  Mic,
  MicOff,
  VideoOff
} from 'lucide-react';

const MeetingDetailPage = () => {
  const { meetingId } = useParams(); // đổi từ `id` → `meetingId` cho thống nhất với App.js
  const navigate = useNavigate();
  const { meetings, currentUser } = useApp();
  const [meeting, setMeeting] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // So sánh id dưới dạng string để tránh mismatch
    const foundMeeting = meetings.find(m => `${m.id}` === `${meetingId}`);
    if (foundMeeting) {
      setMeeting(foundMeeting);
    } else {
      navigate('/'); // nếu không tìm thấy → về Home
    }
  }, [meetingId, meetings, navigate]);

  const handleSaveNotes = () => {
    alert('Đã lưu ghi chú!');
  };

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin cuộc họp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')} // về trang chủ User
                className="hover:bg-red-700 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-xl font-bold">{meeting.title}</h1>
                <p className="text-sm text-red-100">
                  {meeting.dayOfWeek}, {meeting.date} - {meeting.time}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">{currentUser?.fullName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
              <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
                <div className="text-center text-white">
                  <Video size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Khu vực video cuộc họp</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Video conference sẽ được tích hợp ở đây
                  </p>
                </div>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                  <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`p-4 rounded-full transition-colors ${
                      isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                  </button>
                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-4 rounded-full transition-colors ${
                      isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                  </button>
                  <button 
                    onClick={() => navigate('/')} // rời cuộc họp → về Home
                    className="px-6 py-4 bg-red-600 hover:bg-red-700 rounded-full font-semibold transition-colors"
                  >
                    Rời cuộc họp
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <FileText className="mr-2" size={20} />
                  Ghi chú cuộc họp
                </h2>
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm"
                >
                  Lưu ghi chú
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập ghi chú của bạn về cuộc họp..."
                className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Thông tin cuộc họp</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="text-red-600 mr-3 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Ngày</p>
                    <p className="font-semibold">{meeting.dayOfWeek}, {meeting.date}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="text-red-600 mr-3 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Thời gian</p>
                    <p className="font-semibold">{meeting.session} - {meeting.time}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="text-red-600 mr-3 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Địa điểm</p>
                    <p className="font-semibold">{meeting.location}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <User className="text-red-600 mr-3 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Lãnh đạo chủ trì</p>
                    <p className="font-semibold">{meeting.organizer || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Users className="text-red-600 mr-3 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Vai trò của bạn</p>
                    <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold mt-1">
                      {meeting.roles && meeting.roles[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Tài liệu</h2>
              <div className="space-y-3">
                {meeting.file_rev && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Tài liệu được phát</p>
                    <p className="text-sm">{meeting.file_rev}</p>
                  </div>
                )}
                {meeting.file_pre && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Tài liệu chuẩn bị</p>
                    <p className="text-sm">{meeting.file_pre}</p>
                  </div>
                )}
                {!meeting.file_rev && !meeting.file_pre && (
                  <p className="text-sm text-gray-500 text-center py-4">Chưa có tài liệu</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Trạng thái</h2>
              <div className="text-center">
                {meeting.approved ? (
                  <span className="inline-block bg-green-500 text-white px-6 py-3 rounded-full font-semibold">
                    ĐÃ HỌP
                  </span>
                ) : (
                  <span className="inline-block bg-red-500 text-white px-6 py-3 rounded-full font-semibold">
                    Chưa bắt đầu
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailPage;
