import React, { useRef } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { useMeetingWithWebRTC } from "../hook/useMeeting";
import VideoTile from "../components/VideoTile";
import { Mic, MicOff, Video, VideoOff, Share2 } from "lucide-react";

export default function MeetingDetailPage() {
  const { meetingId } = useParams();
  const { currentUser } = useApp();

  const {
    status,
    participants,
    remoteStreams,
    messages,
    toggleCamera,
    toggleMicrophone,
    startScreenShare,
    localStream,
    isMicOn,
    isVideoOn,
  } = useMeetingWithWebRTC(meetingId);

  if (status === "connecting") return <div>Đang kết nối...</div>;
  if (status === "error") return <div>Không thể tham gia cuộc họp</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">

      {/* VIDEO GRID */}
      <div className="grid gap-4"
           style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        
        {/* Local */}
        <VideoTile
          connectionId="local"
          fullName={currentUser?.fullName}
          stream={localStream}
          isLocal={true}
          camEnabled={isVideoOn}
          micEnabled={isMicOn}
        />

        {/* Remote */}
        {participants.map(p => (
          <VideoTile
            key={p.connectionId}
            connectionId={p.connectionId}
            fullName={p.fullName}
            stream={remoteStreams[p.connectionId]}
            camEnabled={p.video !== false}
            micEnabled={p.microphone !== false}
          />
        ))}

      </div>

      {/* CONTROL BAR */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
        
        {/* MIC */}
        <button 
          onClick={() => toggleMicrophone()}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
        >
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        {/* CAMERA */}
        <button 
          onClick={() => toggleCamera()}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
        >
          {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        {/* SHARE SCREEN */}
        <button 
          onClick={startScreenShare}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
        >
          <Share2 size={24} />
        </button>

      </div>
    </div>
  );
}
