import React, { useEffect, useRef, useState } from "react";
import { Video, Mic, X, ImageIcon, User } from "lucide-react";

export type VideoTileProps = {
  connectionId: string;
  fullName?: string;
  stream?: MediaStream | null;
  isLocal?: boolean; // nếu là local preview
  camEnabled?: boolean;
  micEnabled?: boolean;
  isScreenSharing?: boolean;
  pinned?: boolean;
  onToggleCam?: (connectionId: string, enabled: boolean) => void;
  onToggleMic?: (connectionId: string, enabled: boolean) => void;
  onPin?: (connectionId: string) => void;
  onRemove?: (connectionId: string) => void;
};

export default function VideoTile({
  connectionId,
  fullName = "User",
  stream = null,
  isLocal = false,
  camEnabled = true,
  micEnabled = true,
  isScreenSharing = false,
  pinned = false,
  onToggleCam,
  onToggleMic,
  onPin,
  onRemove,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // attach stream
    if (stream) {
      if (el.srcObject !== stream) el.srcObject = stream;
      const play = async () => {
        try {
          await el.play();
          setIsVideoPlaying(true);
        } catch (e) {
          // autoplay might be blocked; still attached
          setIsVideoPlaying(false);
        }
      };
      play();
    } else {
      // no stream -> clear
      try {
        el.pause();
      } catch (_) {}
      el.srcObject = null;
      setIsVideoPlaying(false);
    }
  }, [stream]);

  return (
    <div className={`relative flex flex-col bg-black rounded-2xl overflow-hidden shadow-md ${pinned ? "ring-4 ring-indigo-300" : ""}`}>
      {/* video area */}
      <div className="relative w-full flex-1 bg-gray-900 min-h-[120px]">
        {stream && camEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={`w-full h-full object-cover bg-black`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-gray-800 border border-gray-700">
                <User size={36} />
              </div>
              <div className="text-sm">Camera đã tắt</div>
            </div>
          </div>
        )}

        {/* top-left badge: screen share */}
        {isScreenSharing && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-black rounded-md text-xs font-medium">Screen</div>
        )}

        {/* top-right actions */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <button
            onClick={() => onPin?.(connectionId)}
            title={pinned ? "Unpin" : "Pin"}
            className="p-1 rounded-md bg-black/50 hover:bg-black/30 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 3-4 5-9 5s-9-2-9-5 4-5 9-5 9 2 9 5z"></path><path d="M12 15v7"></path></svg>
          </button>
          <button
            onClick={() => onRemove?.(connectionId)}
            title="Remove / Kick"
            className="p-1 rounded-md bg-black/50 hover:bg-black/30 text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* bottom overlay: name + mic/cam */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-white text-sm font-semibold truncate max-w-[140px]">{fullName}</span>
                <span className="text-gray-300 text-xs">{isLocal ? "You" : connectionId}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleMic?.(connectionId, !micEnabled)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm ${micEnabled ? "bg-white/10 text-white" : "bg-red-600 text-white"}`}
                title={micEnabled ? "Mute" : "Unmute"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v11"></path><path d="M5 10v1a7 7 0 0 0 14 0v-1"></path><path d="M8.5 19a9 9 0 0 0 7 0"></path></svg>
              </button>

              <button
                onClick={() => onToggleCam?.(connectionId, !camEnabled)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm ${camEnabled ? "bg-white/10 text-white" : "bg-gray-700 text-gray-200"}`}
                title={camEnabled ? "Turn camera off" : "Turn camera on"}
              >
                <Video size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* footer: small meta */}
      <div className="px-3 py-2 bg-gray-900 text-xs text-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${micEnabled ? "bg-green-400" : "bg-red-500"}`}></div>
          <div>{micEnabled ? "Mic on" : "Mic off"}</div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-gray-400">{isLocal ? "Local" : "Remote"}</div>
        </div>
      </div>
    </div>
  );
}
