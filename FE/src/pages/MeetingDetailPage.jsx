import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { useMeetingWithWebRTC } from "../hook/useMeeting";
import VideoTile from "../components/VideoTile";
import { BarChart2, Mic, MicOff, Video, VideoOff, Share2, PhoneOff, FileText, Download, Eye, File } from "lucide-react";
import PollsPanel from "../components/PollsPanel";
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

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5075/api";

  // ===== WEBRTC =====
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
    isScreenSharing
  } = useMeetingWithWebRTC(
    meetingId,
    location.state?.initialVideoOn ?? true,
    location.state?.initialMicOn ?? true,
    {
      camera: location.state?.selectedCamera,
      microphone: location.state?.selectedMicrophone
    }
  );

  // ===== PARTICIPANTS =====
  const allParticipants = [
    {
      connectionId: "local",
      fullName: currentUser?.fullName,
      isLocal: true,
      isScreenSharing
    },
    ...participants
  ];

  // ===== LAYOUT LOGIC =====
  const screenSharingUser = allParticipants.find(p => p.isScreenSharing);
  const mainParticipantId =
    screenSharingUser?.connectionId ||
    pinnedId ||
    null;

  const isTwoPeople =
    allParticipants.length === 2 && !mainParticipantId;

  const showGrid =
    !mainParticipantId && allParticipants.length > 2 && allParticipants.length <= 8;

  const showPaged =
    !mainParticipantId && allParticipants.length > 8;

  // ===== VIDEO PROPS =====
  function getVideoProps(id) {
    if (id === "local") {
      return {
        connectionId: "local",
        fullName: currentUser?.fullName,
        stream: localStream,
        isLocal: true,
        camEnabled: isVideoOn,
        micEnabled: isMicOn,
        onToggleCam: toggleCamera,
        onToggleMic: toggleMicrophone
      };
    }

    const p = participants.find(x => x.connectionId === id);
    if (!p) return {};

    return {
      connectionId: p.connectionId,
      fullName: p.fullName,
      stream: remoteStreams[p.connectionId],
      camEnabled: p.isVideoEnabled !== false,
      micEnabled: p.isMicEnabled !== false
    };
  }

  // ===== JOIN MEETING =====
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
  <div className="h-screen bg-black text-white relative overflow-hidden">

    {/* ===== VIDEO AREA ===== */}
    <div className="w-full h-full flex">

      {/* ================= SCREEN SHARE MODE ================= */}
      {screenSharingUser ? (
        <>
          {/* ===== MAIN SCREEN (LEFT) ===== */}
          <div className="flex-1 bg-black relative">
            <VideoTile
              {...getVideoProps(screenSharingUser.connectionId)}
              large
              pinned
              isScreenShare
            />
          </div>

          {/* ===== SIDEBAR PARTICIPANTS (RIGHT) ===== */}
          <div className="w-72 bg-gray-900 flex flex-col gap-2 p-2 overflow-y-auto">
            {allParticipants
              .filter(p => p.connectionId !== screenSharingUser.connectionId)
              .map(p => (
                <div key={p.connectionId} className="h-40">
                  <VideoTile
                    {...getVideoProps(p.connectionId)}
                    small
                  />
                </div>
              ))}
          </div>
        </>
      ) : (
        /* ================= NORMAL MODE ================= */
        <>
          {mainParticipantId ? (
            <VideoTile
              {...getVideoProps(mainParticipantId)}
              large
              pinned
            />
          ) : isTwoPeople ? (
            <div className="relative w-full h-full">
              <VideoTile
                {...getVideoProps(
                  allParticipants.find(p => p.connectionId !== "local").connectionId
                )}
                large
              />
              <div className="absolute bottom-4 right-4 w-48 h-32 z-20">
                <VideoTile {...getVideoProps("local")} floating />
              </div>
            </div>
          ) : showGrid ? (
            <div
              className={`grid gap-2 w-full h-full ${
                allParticipants.length <= 4 ? "grid-cols-2" : "grid-cols-4"
              }`}
            >
              {allParticipants.map(p => (
                <VideoTile
                  key={p.connectionId}
                  {...getVideoProps(p.connectionId)}
                  onPin={setPinnedId}
                />
              ))}
            </div>
          ) : showPaged ? (
            <div className="w-full h-full overflow-hidden">
              <div className="flex h-full overflow-x-auto snap-x snap-mandatory">
                {allParticipants.map(p => (
                  <div
                    key={p.connectionId}
                    className="w-1/4 h-1/2 flex-shrink-0 snap-start"
                  >
                    <VideoTile
                      {...getVideoProps(p.connectionId)}
                      onPin={setPinnedId}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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