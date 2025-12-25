import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiCall } from '../utils/api';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Settings,
  ArrowLeft,
  CheckCircle,
  FileText,
  Download,
  Eye,
  File
} from 'lucide-react';

export default function MeetingPreJoinPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [devices, setDevices] = useState({ cameras: [], microphones: [] });
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [mediaError, setMediaError] = useState(null);
  
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5075/api';

  const videoRef = useRef(null);
  const localStreamRef = useRef(null);  // ← USE REF instead of state!

  //  Fetch meeting từ API (fix reload issue)
  useEffect(() => {
    const fetchMeeting = async () => {
      setLoading(true);
      try {
        const response = await apiCall(`/Meetings/${meetingId}`, {
          method: 'GET'
        });
        
        if (response) {
          const startDate = new Date(response.startTime);
          const dayOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][startDate.getDay()];
          
          setMeeting({
            id: response.meetingId,
            title: response.title,
            location: response.location || '',
            date: startDate.toLocaleDateString('vi-VN'),
            dayOfWeek: dayOfWeek,
            session: startDate.getHours() < 12 ? 'Buổi sáng' : 'Buổi chiều',
            time: startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          });
        } else {
          setError('Không tìm thấy cuộc họp');
        }
      } catch (err) {
        console.error('Error fetching meeting:', err);
        setError('Không thể tải thông tin cuộc họp');
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId]);

  useEffect(() => {
    if (meeting) {
      fetchDocuments(meetingId);
    }
  }, [meeting, meetingId]);

  const fetchDocuments = async (meetingId) => {
    setLoadingDocs(true);
    try {
      const response = await apiCall(
        `/Document/GetDocumentsByMeeting/meeting/${meetingId}`,
        { method: 'GET' }
      );
      const docs = Array.isArray(response) ? response : [];
      setDocuments(docs);
    } catch (error) {
      console.error('Lỗi tải documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleViewDocument = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/Document/DownloadDocument/${documentId}/download`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Không thể tải file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Lỗi xem file:', error);
      alert('Không thể xem file!');
    }
  };

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/Document/DownloadDocument/${documentId}/download`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Không thể tải file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi download:', error);
      alert('Không thể tải file!');
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    const iconClass = "w-4 h-4";
    if (['pdf'].includes(ext)) return <File className={`${iconClass} text-red-500`} />;
    if (['doc', 'docx'].includes(ext)) return <File className={`${iconClass} text-blue-500`} />;
    if (['xls', 'xlsx'].includes(ext)) return <File className={`${iconClass} text-green-500`} />;
    if (['ppt', 'pptx'].includes(ext)) return <File className={`${iconClass} text-orange-500`} />;
    return <FileText className={`${iconClass} text-gray-400`} />;
  };

  // Get media devices
  useEffect(() => {
    getMediaDevices();
  }, []);

  // Init media when device changes
  useEffect(() => {
    if (selectedCamera || selectedMicrophone) {
      initMedia();
    }
  }, [selectedCamera, selectedMicrophone]);

  //CRITICAL: Cleanup when component unmounts
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up PreJoin media...');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log(`Stopping ${track.kind} track`);
          track.stop();
        });
        localStreamRef.current = null;
      }
    };
  }, []);

  const getMediaDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const cameras = deviceList.filter(d => d.kind === 'videoinput');
      const microphones = deviceList.filter(d => d.kind === 'audioinput');
      
      setDevices({ cameras, microphones });
      
      if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
      if (microphones.length > 0) setSelectedMicrophone(microphones[0].deviceId);
    } catch (err) {
      console.error('Error getting devices:', err);
    }
  };

  const initMedia = async () => {
    try {
      // Stop previous stream first
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: selectedCamera ? { deviceId: selectedCamera } : true,
        audio: selectedMicrophone ? { deviceId: selectedMicrophone } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      localStreamRef.current = stream;  // ← Save to ref
      setMediaError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Set initial states
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      if (videoTrack) videoTrack.enabled = isVideoOn;
      if (audioTrack) audioTrack.enabled = isMicOn;

    } catch (err) {
      console.error('Error accessing media:', err);
      setMediaError('Không thể truy cập camera/microphone. Vui lòng cấp quyền!');
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const handleJoinMeeting = () => {
    // CRITICAL: Stop all tracks before joining
    console.log('🚪 Joining meeting, stopping PreJoin tracks...');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`⏹️ Stopping ${track.kind} track`);
        track.stop();
      });
      localStreamRef.current = null;
    }
    
    navigate(`/meeting/${meetingId}`, {
      state: {
        initialMicOn: isMicOn,
        initialVideoOn: isVideoOn,
        selectedCamera,
        selectedMicrophone
      }
    });
  };

  const handleGoBack = () => {
    //  CRITICAL: Stop all tracks before going back
    console.log('⬅️ Going back, stopping tracks...');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`⏹️ Stopping ${track.kind} track`);
        track.stop();
      });
      localStreamRef.current = null;
    }
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Đang tải thông tin cuộc họp...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-red-500 mb-4 text-lg">{error || 'Không tìm thấy cuộc họp'}</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGoBack}  
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold">{meeting.title}</h1>
              <p className="text-sm text-gray-400">
                {meeting.dayOfWeek}, {meeting.date} - {meeting.time}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {currentUser?.fullName}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Video Preview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Sẵn sàng tham gia?</h2>
            
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
              {mediaError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <VideoOff size={48} className="mx-auto mb-4 text-red-500" />
                    <p className="text-sm text-gray-400">{mediaError}</p>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
                  />
                  {!isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl font-bold">
                            {currentUser?.fullName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">Camera đã tắt</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded text-sm">
                    {currentUser?.fullName}
                  </div>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={toggleMic}
                className={`p-4 rounded-full transition-colors ${
                  isMicOn 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                title={isMicOn ? 'Tắt mic' : 'Bật mic'}
              >
                {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-4 rounded-full transition-colors ${
                  isVideoOn 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                title={isVideoOn ? 'Tắt camera' : 'Bật camera'}
              >
                {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
              </button>
            </div>
          </div>

          {/* Settings & Info */}
          <div className="space-y-6">
            
            {/* Device Settings */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center">
                <Settings className="mr-2" size={20} />
                Cài đặt thiết bị
              </h3>

              {/* Camera Select */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Camera</label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {devices.cameras.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Microphone Select */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Microphone</label>
                <select
                  value={selectedMicrophone}
                  onChange={(e) => setSelectedMicrophone(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {devices.microphones.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Meeting Info */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-3">
              <h3 className="text-lg font-bold mb-4">Thông tin cuộc họp</h3>
              
              <div className="flex items-start space-x-3">
                <CheckCircle size={20} className="text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Địa điểm</p>
                  <p className="font-medium">{meeting.location}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle size={20} className="text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Thời gian</p>
                  <p className="font-medium">{meeting.session} - {meeting.time}</p>
                </div>
              </div>
            </div>
            
{/* ✅ THÊM DOCUMENTS SECTION */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-3">
              <h3 className="text-lg font-bold flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="mr-2" size={20} />
                  Tài liệu cuộc họp
                </span>
                {loadingDocs && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {loadingDocs ? (
                  <p className="text-sm text-gray-400 text-center py-4">Đang tải...</p>
                ) : documents.length > 0 ? (
                  documents.map((doc) => (
                    <div
                      key={doc.documentId}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(doc.fileName)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {doc.fileName}
                            </p>
                            {doc.visibility && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                doc.visibility === 'Chung'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-purple-500/20 text-purple-300'
                              }`}>
                                {doc.visibility}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => handleViewDocument(doc.documentId, doc.fileName)}
                            className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="Xem"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc.documentId, doc.fileName)}
                            className="p-1.5 text-green-400 hover:bg-green-500/20 rounded transition-colors"
                            title="Tải"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Chưa có tài liệu</p>
                )}
              </div>
            </div>


            {/* Join Button */}
            <button
              onClick={handleJoinMeeting}
              disabled={!!mediaError}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Video size={24} />
              <span>Tham gia cuộc họp</span>
            </button>

            <p className="text-xs text-center text-gray-400">
              Bạn có thể thay đổi cài đặt này trong cuộc họp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}