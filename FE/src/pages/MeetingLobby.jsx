import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Settings,
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { apiCall } from '../utils/api';

const MeetingLobby = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  
  // Meeting info
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Media states
  const [localStream, setLocalStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  
  // Devices
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  
  // Refs
  const videoRef = useRef(null);
  
  // ✅ FIX: Fetch meeting directly from API
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true);
        console.log('📖 Fetching meeting:', meetingId);
        
        const data = await apiCall(`/Meetings/${meetingId}`, { method: 'GET' });
        
        console.log('✅ Meeting loaded:', data);
        
        setMeeting({
          meetingId: data.meetingId,
          title: data.title,
          description: data.description,
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location,
          status: data.status,
          createdByUserName: data.createdByUserName
        });
        setError(null);
      } catch (err) {
        console.error('❌ Error fetching meeting:', err);
        setError('Không tìm thấy cuộc họp hoặc bạn không có quyền truy cập.');
      } finally {
        setLoading(false);
      }
    };
    
    if (meetingId) {
      fetchMeeting();
    }
  }, [meetingId]);
  
  // Get available devices
  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      
      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);
      
      // Set default devices
      if (audioInputs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
      if (videoInputs.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
      
      console.log('🎤 Audio devices:', audioInputs.length);
      console.log('📹 Video devices:', videoInputs.length);
    } catch (error) {
      console.error('❌ Error getting devices:', error);
    }
  };
  
  // Get media stream
  const getMediaStream = async () => {
    try {
      const constraints = {
        audio: selectedAudioDevice 
          ? { deviceId: { exact: selectedAudioDevice } }
          : true,
        video: selectedVideoDevice
          ? { 
              deviceId: { exact: selectedVideoDevice },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop old stream if exists
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      setLocalStream(stream);
      
console.log('📹 Stream obtained:', stream);
console.log('📹 Video tracks:', stream.getVideoTracks());
console.log('📹 Audio tracks:', stream.getAudioTracks());
console.log('📹 Video ref:', videoRef.current);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      console.log('✅ Media stream obtained');
    } catch (error) {
      console.error('❌ Error getting media stream:', error);
      setError('Không thể truy cập camera/microphone. Vui lòng cấp quyền trong trình duyệt.');
    }
  };
  
  // Initialize media on mount
  useEffect(() => {
    getDevices();
    getMediaStream();
    
    return () => {
      // Cleanup stream when leaving lobby
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        console.log('🧹 Lobby: Stopped preview stream');
      }
    };
  }, []);
  
  // Update stream when device changes
  useEffect(() => {
    if (selectedAudioDevice || selectedVideoDevice) {
      getMediaStream();
    }
  }, [selectedAudioDevice, selectedVideoDevice]);
  
  // Toggle microphone
  const handleToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };
  
  // Toggle camera
  const handleToggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };
  
  // Join meeting
  const handleJoinMeeting = () => {
    // Stop preview stream before navigating
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      console.log('🚀 Joining meeting, stopped preview stream');
    }
    
    // Save preferences to localStorage for useMeetingWithWebRTC hook
    localStorage.setItem('meetingPreferences', JSON.stringify({
      micEnabled: isMicOn,
      videoEnabled: isVideoOn,
      audioDeviceId: selectedAudioDevice,
      videoDeviceId: selectedVideoDevice,
      timestamp: Date.now()
    }));
    
    console.log('💾 Saved preferences:', { isMicOn, isVideoOn, selectedAudioDevice, selectedVideoDevice });
    
    // Navigate to meeting room
    navigate(`/meeting/${meetingId}`);
  };
  
  // Go back
  const handleBack = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    navigate(-1);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Đang tải thông tin cuộc họp...</p>
        </div>
      </div>
    );
  }
  
  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md">
          <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Lỗi</h2>
          <p className="text-gray-300 mb-6 text-center">{error || 'Không tìm thấy cuộc họp'}</p>
          <button
            onClick={handleBack}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">
              {meeting.title || 'Cuộc họp'}
            </h1>
            {meeting.startTime && (
              <p className="text-sm text-gray-400">
                {new Date(meeting.startTime).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
          
          <div className="w-24"></div> {/* Spacer */}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Video Preview - Left/Center */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
              {/* Video */}
              <div className="relative aspect-video bg-gray-900">
                {isVideoOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-5xl font-bold text-white">
                          {currentUser?.fullName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-lg">Camera đã tắt</p>
                    </div>
                  </div>
                )}
                
                {/* User info overlay */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-white font-medium">{currentUser?.fullName}</p>
                  <p className="text-gray-300 text-sm">{currentUser?.username}</p>
                </div>
                
                {/* Status indicators */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {!isMicOn && (
                    <div className="bg-red-600 p-2 rounded-full shadow-lg">
                      <MicOff className="w-5 h-5 text-white" />
                    </div>
                  )}
                  {!isVideoOn && (
                    <div className="bg-red-600 p-2 rounded-full shadow-lg">
                      <VideoOff className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Controls */}
              <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4 border-t border-gray-700">
                {/* Mic button */}
                <button
                  onClick={handleToggleMic}
                  className={`p-4 rounded-full transition-all ${
                    isMicOn 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={isMicOn ? 'Tắt mic' : 'Bật mic'}
                >
                  {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>
                
                {/* Camera button */}
                <button
                  onClick={handleToggleCamera}
                  className={`p-4 rounded-full transition-all ${
                    isVideoOn 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={isVideoOn ? 'Tắt camera' : 'Bật camera'}
                >
                  {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Panel */}
          <div className="space-y-6">
            
            {/* Device Settings */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Cài đặt thiết bị
              </h3>
              
              {/* Microphone select */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  🎤 Microphone
                </label>
                <div className="relative">
                  <select
                    value={selectedAudioDevice}
                    onChange={(e) => setSelectedAudioDevice(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                  >
                    {audioDevices.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${index + 1}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              {/* Camera select */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  📹 Camera
                </label>
                <div className="relative">
                  <select
                    value={selectedVideoDevice}
                    onChange={(e) => setSelectedVideoDevice(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                  >
                    {videoDevices.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              {/* Device info */}
              <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-gray-300">
                <p className="flex items-center justify-between mb-1">
                  <span>Thiết bị audio:</span>
                  <span className="font-medium text-white">{audioDevices.length}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Thiết bị video:</span>
                  <span className="font-medium text-white">{videoDevices.length}</span>
                </p>
              </div>
            </div>
            
            {/* Meeting Info */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Thông tin cuộc họp</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400">Chủ đề:</p>
                  <p className="text-white font-medium">{meeting.title}</p>
                </div>
                
                {meeting.description && (
                  <div>
                    <p className="text-gray-400">Mô tả:</p>
                    <p className="text-white">{meeting.description}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-gray-400">Thời gian:</p>
                  <p className="text-white">
                    {new Date(meeting.startTime).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                
                {meeting.location && (
                  <div>
                    <p className="text-gray-400">Địa điểm:</p>
                    <p className="text-white">{meeting.location}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-gray-400">Vai trò của bạn:</p>
                  <p className="text-white">
                    {currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin' 
                      ? '🌟 Host (Chủ trì)' 
                      : '👤 Participant (Dự họp)'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Join Button */}
            <button
              onClick={handleJoinMeeting}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6" />
              <span>Tham gia cuộc họp</span>
            </button>
            
            {/* Tips */}
            <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4">
              <p className="text-blue-200 text-sm">
                💡 <strong>Mẹo:</strong> Hãy kiểm tra camera và mic trước khi vào. 
                Các thiết lập sẽ được lưu và áp dụng khi tham gia cuộc họp.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default MeetingLobby;




















