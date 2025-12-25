import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { useMeetingWithWebRTC } from "../hook/useMeeting";
import VideoTile from "../components/VideoTile";
import { Mic, MicOff, Video, VideoOff, Share2, PhoneOff, FileText, Download, Eye, File } from "lucide-react";
import { apiCall } from '../utils/api';

export default function MeetingDetailPage() {
  const { meetingId } = useParams();
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLeaveMessage, setShowLeaveMessage] = useState(false);
  const [joining, setJoining] = useState(true);
  const [joinError, setJoinError] = useState(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5075/api';

  // ✅ ONLY INIT WEBRTC AFTER SUCCESSFUL JOIN
  const {
    status,
    participants,
    remoteStreams,
    toggleCamera,
    toggleMicrophone,
    startScreenShare,
    stopScreenShare,
    error,
    localStream,
    isMicOn,
    isVideoOn,
    isScreenSharing,
  } = useMeetingWithWebRTC(
    meetingId,
    location.state?.initialVideoOn ?? true,
    location.state?.initialMicOn ?? true,
    {
      camera: location.state?.selectedCamera,
      microphone: location.state?.selectedMicrophone
    }
  );


  useEffect(() => {
    const hasPreJoinState = location.state?.initialMicOn !== undefined;
    
    if (!hasPreJoinState) {
      console.log('⚠️ No prejoin state, redirecting to prejoin...');
      navigate(`/meeting/${meetingId}/prejoin`, { replace: true });
    }
  }, [meetingId, location.state, navigate]);

  // Join meeting via API
  useEffect(() => {
  const joinMeeting = async () => {
    const hasPreJoinState = location.state?.initialMicOn !== undefined;
    
    if (!hasPreJoinState) {
      console.log('⚠️ No prejoin state, skipping join...');
      return;
    }

    setJoining(true);
    try {
      console.log('🔑 Calling /Meetings/join API...');
      const response = await apiCall(`/Meetings/join/${meetingId}`, {
        method: 'GET'
      });
      
      console.log('Join API successful:', response);
      setJoining(false);  // ← Set false TRONG try block
    } catch (err) {
      console.error('Join API failed:', err);
      setJoinError(err.message || 'Bạn không có quyền tham gia cuộc họp này');
      setJoining(false);
    }
  };

  joinMeeting();
}, [meetingId, location.state]);

  //Fetch documents
  useEffect(() => {
    if (!joining && !joinError) {
      fetchDocuments();
    }
  }, [joining, joinError]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const response = await apiCall(
        `/Document/GetDocumentsByMeeting/meeting/${meetingId}`,
        { method: 'GET' }
      );
      setDocuments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading documents:', error);
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
      console.error('Error viewing document:', error);
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
      console.error('Error downloading:', error);
      alert('Không thể tải file!');
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    const iconClass = "w-5 h-5";
    if (['pdf'].includes(ext)) return <File className={`${iconClass} text-red-600`} />;
    if (['doc', 'docx'].includes(ext)) return <File className={`${iconClass} text-blue-600`} />;
    if (['xls', 'xlsx'].includes(ext)) return <File className={`${iconClass} text-green-600`} />;
    if (['ppt', 'pptx'].includes(ext)) return <File className={`${iconClass} text-orange-600`} />;
    return <FileText className={`${iconClass} text-gray-600`} />;
  };

  const handleLeaveMeeting = () => {
    setShowLeaveMessage(true);
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  // LOADING STATE
  if (joining) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Đang tham gia cuộc họp...</p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (joinError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <PhoneOff size={64} className="mx-auto text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Không thể tham gia cuộc họp</h1>
          <p className="text-red-400 mb-6">{joinError}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }



  if (status === "connecting" || status === "reconnecting") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Đang kết nối...</p>
        </div>
      </div>
    );
  }

  if (status === "error" || error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-red-500">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-4">Lỗi kết nối</h2>
          <p className="mb-6">{error || "Không thể kết nối đến máy chủ"}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 relative">
      {/* VIDEO GRID */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        <VideoTile
          connectionId="local"
          fullName={currentUser?.fullName}
          stream={localStream}
          isLocal={true}
          isScreenSharing={isScreenSharing}
          camEnabled={isVideoOn}
          micEnabled={isMicOn}
          onToggleCam={toggleCamera}
          onToggleMic={toggleMicrophone}
        />

        {participants.map((p) => (
          <VideoTile
            key={p.connectionId}
            connectionId={p.connectionId}
            fullName={p.fullName}
            stream={remoteStreams[p.connectionId]}
            camEnabled={p.isVideoEnabled !== false}
            micEnabled={p.isMicEnabled !== false}
          />
        ))}
      </div>

      {/* CONTROL BAR */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 z-50">
        <button
          onClick={toggleMicrophone}
          className={`p-3 rounded-full ${
            isMicOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-400"
          }`}
          title={isMicOn ? "Tắt micro" : "Bật micro"}
        >
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full ${
            isVideoOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-400"
          }`}
        >
          {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={`p-4 rounded-full transition-all ${
            isScreenSharing
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-200"
          }`}
          title={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
        >
          <Share2 size={24} />
        </button>

        <button
          onClick={() => setShowDocuments(!showDocuments)}
          className={`p-4 rounded-full transition-all ${
            showDocuments
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-200"
          }`}
          title="Tài liệu"
        >
          <FileText size={24} />
        </button>

        <button
          className="p-4 rounded-full bg-red-600/20 hover:bg-red-600 
                     text-red-500 hover:text-white border border-red-600/50 
                     transition-all ml-4"
          onClick={handleLeaveMeeting}
          title="Rời cuộc họp"
        >
          <PhoneOff size={24} />
        </button>
      </div>

      {/* DOCUMENTS SIDEBAR */}
      {showDocuments && (
        <>
          <div className="fixed top-0 right-0 h-full w-96 bg-gray-800 shadow-2xl z-40 overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center">
                <FileText className="mr-2" size={20} />
                Tài liệu
              </h2>
              <button
                onClick={() => setShowDocuments(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              {loadingDocs ? (
                <p className="text-sm text-gray-400 text-center py-4">Đang tải...</p>
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc.documentId} className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getFileIcon(doc.fileName)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.fileName}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-2">
                        <button
                          onClick={() => handleViewDocument(doc.documentId, doc.fileName)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                          title="Xem"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc.documentId, doc.fileName)}
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg"
                          title="Tải"
                        >
                          <Download size={16} />
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
          <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowDocuments(false)}
          />
        </>
      )}
    </div>
  );
}