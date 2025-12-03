import React from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { useMeetingWithWebRTC } from "../hook/useMeeting";
import VideoTile from "../components/VideoTile";
import { Mic, MicOff, Video, VideoOff, Share2, PhoneOff } from "lucide-react";

export default function MeetingDetailPage() {
  const { meetingId } = useParams(); // lấy từ URL
  const { currentUser } = useApp();

  const {
    status,
    participants,
    remoteStreams,
    messages,
    toggleCamera,
    toggleMicrophone,
    startScreenShare,
    stopScreenShare,
    error,
    localStream,
    isMicOn,
    isVideoOn,
    isScreenSharing,
  } = useMeetingWithWebRTC(meetingId);

  if (status === "connecting" || status === "reconnecting")
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        Connecting...
      </div>
    );
  if (status === "error" || error)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-red-500">
        {error || "Error joining room"}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* VIDEO GRID */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {/* Local */}
        <VideoTile
          connectionId="local"
          fullName={currentUser?.fullName}
          stream={localStream}
          isLocal={true}
          isScreenSharing={isScreenSharing}
          camEnabled={isVideoOn}
          micEnabled={isMicOn}
          onToggleCam={() => toggleCamera()}
          onToggleMic={() => toggleMicrophone()}
        />

        {/* Remote */}
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
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
        {/* MIC */}
        <button
          onClick={toggleMicrophone}
          className={`p-3 rounded-full ${
            isMicOn
              ? "bg-red-500 hover:bg-red-400"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          title={isMicOn ? "Tắt micro" : "Bật micro"}
        >
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        {/* CAMERA */}
        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full ${
            isVideoOn
              ? "bg-red-500 hover:bg-red-400"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        {/* SHARE SCREEN */}
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
        {/* LEAVE MEETING */}
        <button
          className="p-4 rounded-full bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 transition-all ml-4"
          onClick={() => window.close() /* Hoặc navigate về Home */}
          title="Rời cuộc họp"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
