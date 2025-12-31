import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { useMeetingWithWebRTC } from "../hook/useMeeting";
import VideoTile from "../components/VideoTile";
import { BarChart2, Mic, MicOff, Video, VideoOff, Share2, PhoneOff, FileText, Download, Eye, File, ChevronLeft, ChevronRight} from "lucide-react";
import PollsPanel from "../components/PollsPanel";
import PollNotification from '../components/PollNotification';
import { apiCall } from "../utils/api";

export default function MeetingDetailPage() {
  const { meetingId } = useParams();
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [pinnedId, setPinnedId] = useState(null);
  const [joining, setJoining] = useState(true);
  const [joinError, setJoinError] = useState(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [pollNotification, setPollNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5075/api";

  // ===== WEBRTC =====
  const {
    status,
    participants,
    remoteStreams,
    screenShareStreams, 
    localStream,
    screenShareStream, 
    toggleCamera,
    toggleMicrophone,
    startScreenShare,
    stopScreenShare,
    error,
    isMicOn,
    isVideoOn,
    isScreenSharing,
    sharerId
  } = useMeetingWithWebRTC(
    meetingId,
    location.state?.initialVideoOn ?? true,
    location.state?.initialMicOn ?? true,
  );

  const uniqueRemoteParticipants = participants.filter(p => {
    const isMeByName = p.fullName === currentUser?.fullName;
    // Nếu participant không có remote stream và không share màn hình -> khả năng cao là bóng ma của chính mình
    const hasNoStream = !remoteStreams[p.connectionId] && !p.isScreenSharing; 
    
    return !isMeByName && !hasNoStream;
});
  // ===== PARTICIPANTS =====
  const allParticipants = [
    {
      connectionId: "local",
      fullName: currentUser?.fullName ,
      stream: localStream,
      isLocal: true,
      isScreenSharing: isScreenSharing,
      screenStream: screenShareStream,
      isVideoEnabled: isVideoOn,
      isMicEnabled: isMicOn,
    },
    ...uniqueRemoteParticipants.map(p => ({
      connectionId: p.connectionId,
      fullName: p.fullName || `User_${p.connectionId}`, // Fallback tên nếu thiếu
      stream: remoteStreams[p.connectionId], 
      screenStream: screenShareStreams[p.connectionId], 
      isScreenSharing: p.isScreenSharing || (sharerId === p.connectionId),
      isVideoEnabled: p.isVideoEnabled !== false,
      isMicEnabled: p.isMicEnabled !== false,
      isLocal: false
    }))
  ];

  // ===== LAYOUT LOGIC =====
  const PAGE_SIZE = 8;
  const screenSharingUser = allParticipants.find(
  p => p.isScreenSharing === true
);


  const mainParticipantId =
    screenSharingUser?.connectionId ||
    pinnedId ||
    null;

  const isTwoPeople =
    allParticipants.length === 2 && !mainParticipantId;

  const showGrid =
    !mainParticipantId && allParticipants.length > 2 && allParticipants.length <= 8;
  const showPaged = !mainParticipantId && allParticipants.length > 8;
  const totalPages = Math.ceil(allParticipants.length / PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(0);
  }, [allParticipants.length, mainParticipantId]);

  useEffect(() => {
    if (location.state?.initialMicOn === undefined) {
      navigate(`/meeting/${meetingId}/prejoin`, { replace: true });
    }
  }, [meetingId, location.state, navigate]);

  useEffect(() => {
    const joinMeeting = async () => {
      setJoining(true);
      try {
        await apiCall(`/Meetings/join/${meetingId}`, { method: "GET" });
        setJoining(false);
      } catch (err) {
        setJoinError(err.message || "Bạn không có quyền tham gia cuộc họp này");
        setJoining(false);
      }
    };
    joinMeeting();
  }, [meetingId]);

  // ===== DOCUMENTS =====
  useEffect(() => {
    if (!joining && !joinError) fetchDocuments();
  }, [joining, joinError]);

  const visibleParticipants = showPaged
    ? allParticipants.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
    : allParticipants;


  function getLayout(count) {
      if (count <= 1) return { containerClass: "grid-cols-1", areas: null }; // Full màn hình
      if (count <= 2) return { containerClass: "grid-cols-2", areas: null };
      if (count <= 4) return { containerClass: "grid-cols-2 md:grid-cols-2", areas: null };
      if (count <= 6) return { containerClass: "grid-cols-3", areas: null };
      return { containerClass: "grid-cols-4", areas: null };
    }
  const layout = getLayout(visibleParticipants.length);
  const nextPage = () => {
      if (currentPage < totalPages - 1) setCurrentPage(c => c + 1);
    };

    const prevPage = () => {
      if (currentPage > 0) setCurrentPage(c => c - 1);
    };
  // ===== VIDEO PROPS =====
  function getVideoProps(id, isMainScreen = false) {
    const p = allParticipants.find(x => x.connectionId === id);
    if (!p) return {};

    let streamToRender = p.stream;
    let isMirror = p.isLocal; 

    const isSharingMode = isMainScreen && p.isScreenSharing;

    if (isSharingMode) {
        streamToRender = p.screenStream; // Ưu tiên lấy stream màn hình
        isMirror = false; 
    
        if (!streamToRender) console.log("⏳ Đang đợi stream màn hình của:", id);
    }

      return {
        connectionId: p.connectionId,
        fullName: p.fullName,
        stream: streamToRender,
        isLocal: p.isLocal,
        camEnabled: isSharingMode ? true : p.isVideoEnabled, // Icon Cam tắt/bật dựa theo Cam
        micEnabled: p.isMicEnabled,
        isMirror: isMirror,
        isScreenShare: isSharingMode, // Cờ để component VideoTile chỉnh object-fit
        onToggleCam: p.isLocal ? toggleCamera : undefined,
        onToggleMic: p.isLocal ? toggleMicrophone : undefined,
        onPin: () => setPinnedId(p.connectionId)
      };
    }
  
    const fetchDocuments = async () => {
        setLoadingDocs(true);
        try {
          const res = await apiCall(`/Document/GetDocumentsByMeeting/meeting/${meetingId}`);
          setDocuments(Array.isArray(res) ? res : []);
        } finally {
          setLoadingDocs(false);
        }
      };

  // ===== STATES =====
  if (joining) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p>Đang tham gia cuộc họp...</p>
      </div>
    );
  }

  if (joinError || status === "error" || error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <button onClick={() => navigate("/")}>Về trang chủ</button>
      </div>
    );
  }

  // ================== RENDER ==================
 return (
  <div className="h-screen bg-black text-white relative overflow-hidden flex flex-col">

    <div className="flex-1 flex overflow-hidden p-2 relative">
        
        {/* CASE 1: CÓ NGƯỜI SHARE (Hoặc Pin) */}
        {mainParticipantId ? (
          <>
            {/* MAIN VIEW */}
            <div className="flex-1 bg-gray-900 relative flex items-center justify-center">
               <VideoTile 
                  {...getVideoProps(mainParticipantId, true)} // True = Ưu tiên lấy ScreenStream
                  large 
                  pinned 
               />
            </div>

            {/* SIDEBAR (Luôn hiện Camera của mọi người) */}
            <div className="w-64 bg-black flex flex-col gap-2 p-2 overflow-y-auto border-l border-gray-800">
              {allParticipants.map(p => (
                 <div key={p.connectionId} className="h-36 w-full shrink-0">
                    <VideoTile 
                        {...getVideoProps(p.connectionId, false)} // False = Luôn lấy Camera
                        small 
                    />
                 </div>
              ))}
            </div>
          </>
        ) : isTwoPeople ? (
          /* CASE 2: 2 NGƯỜI (Không ai share) */
          <div className="relative w-full h-full">
             <VideoTile {...getVideoProps(allParticipants.find(p => !p.isLocal).connectionId)} large />
             <div className="absolute bottom-4 right-4 w-48 h-32 z-20 border-2 border-gray-700 rounded-xl overflow-hidden shadow-2xl">
                <VideoTile {...getVideoProps("local")} floating />
             </div>
          </div>
        ) : (
          /* CASE 3: GRID VIEW (Nhiều người, không ai share) */
          <>
           <div
              className={`w-full h-full grid gap-2 auto-rows-fr ${visibleParticipants.length === 1 ? "grid-cols-1" : layout.containerClass}`}
              style={layout.areas ? { gridTemplateAreas: layout.areas.map(r => `"${r}"`).join(" ") } : undefined}
            >
            {visibleParticipants.map((p) => (
                <div key={p.connectionId} className="w-full h-full">
                  <VideoTile {...getVideoProps(p.connectionId)} />
                </div>
              ))}
            </div>

            {showPaged && (
              <>
                {/* Nút lùi */}
                <button 
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white shadow-lg z-20 transition-all ${
                    currentPage === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
                  }`}
                >
                  <ChevronLeft size={24} />
                </button>

                {/* Nút tiến */}
                <button 
                  onClick={nextPage}
                  disabled={currentPage === totalPages - 1}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white shadow-lg z-20 transition-all ${
                    currentPage === totalPages - 1 ? "opacity-0 pointer-events-none" : "opacity-100"
                  }`}
                >
                  <ChevronRight size={24} />

                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-xs text-gray-300 z-10">
                  Trang {currentPage + 1} / {totalPages}
                </div>
              </>
            )}
          </>

        )}
      </div>

    {/* ===== CONTROL BAR ===== */}
    <div className="
      fixed bottom-4 left-1/2 -translate-x-1/2
      bg-gray-800 px-6 py-3 rounded-full
      flex gap-4 z-50
    ">
      <button onClick={toggleMicrophone}>
        {isMicOn ? <Mic /> : <MicOff />}
      </button>
      <button onClick={toggleCamera}>
        {isVideoOn ? <Video /> : <VideoOff />}
      </button>
      <button onClick={isScreenSharing ? stopScreenShare : startScreenShare}>
        <Share2 />
      </button>
      <button onClick={() => setShowPolls(!showPolls)}>
        <BarChart2 />
      </button>
      <button onClick={() => navigate("/")}>
        <PhoneOff />
      </button>
    </div>

    {showPolls && (
      <PollsPanel
        meetingId={meetingId}
        onClose={() => setShowPolls(false)}
      />
    )}
  </div>
);
}