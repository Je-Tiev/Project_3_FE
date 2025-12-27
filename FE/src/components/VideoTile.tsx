import React, { useEffect, useRef, useState } from "react";
import { Video, Mic, X, User, VideoOff, MicOff } from "lucide-react";

export type VideoTileProps = {
  connectionId: string;
  fullName?: string;
  stream?: MediaStream | null;
  isLocal?: boolean;
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

  useEffect(() => {
    const el = videoRef.current;

    if (!el || !stream) return;

    // Gán stream vào video
    el.srcObject = stream;

    // ✅ FIXED: Safe play with error handling
    const playPromise = el.play();
    
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Ignore AbortError - normal when component unmounts
        if (error.name !== 'AbortError') {
          console.warn("Video play failed:", error.name);
        }
      });
    }

    // ✅ ADDED: Cleanup on unmount
    return () => {
      if (el) {
        el.pause();
        el.srcObject = null;
      }
    };
  }, [stream, camEnabled]);

  return (
    <div
      className={`relative flex flex-col bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800 transition-all duration-300 ${
        pinned ? "ring-2 ring-indigo-500 scale-[1.02] z-10" : ""
      }`}
    >
      {/* Video Area */}
      <div className="relative w-full h-full min-h-[200px] flex bg-black">
        {stream && camEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={`w-full h-full object-cover ${
              isLocal && !isScreenSharing ? "scale-x-[-1]" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-400 gap-3 animate-in fade-in">
            <div className="p-4 rounded-full bg-gray-700/50 shadow-inner">
              <User size={48} />
            </div>
            <p className="text-sm font-medium">Camera is off</p>
          </div>
        )}

        {/* Screen Share Badge */}
        {isScreenSharing && (
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-blue-600/90 backdrop-blur-sm text-white rounded text-xs font-semibold shadow-sm">
            Screen Share
          </div>
        )}

        {/* Top Right Actions */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity p-1 rounded-lg bg-black/20 backdrop-blur-sm group-hover:opacity-100">
          {onPin && (
            <button
              onClick={() => onPin(connectionId)}
              className={`p-1.5 rounded hover:bg-white/20 text-white ${
                pinned ? "text-indigo-400" : ""
              }`}
              title={pinned ? "Unpin" : "Pin"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="17" x2="12" y2="22"></line>
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
              </svg>
            </button>
          )}
          {!isLocal && onRemove && (
            <button
              onClick={() => onRemove(connectionId)}
              className="p-1.5 rounded hover:bg-red-500/80 text-white hover:text-white"
              title="Remove User"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm drop-shadow-md">
              {fullName} {isLocal && "(Bạn)"}
            </span>
            <span className="text-[10px] text-gray-300 flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  micEnabled ? "bg-green-500" : "bg-red-500"
                }`}
              />
              {micEnabled ? "Mic on" : "Mic off"}
            </span>
          </div>

          {/* Control Buttons */}
          {(onToggleMic || onToggleCam) && (
            <div className="flex gap-2">
              {onToggleMic && (
                <button
                  onClick={() => onToggleMic(connectionId, !micEnabled)}
                  className={`p-2 rounded-full transition-colors ${
                    micEnabled
                      ? "bg-gray-600/50 hover:bg-gray-500/50 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {micEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                </button>
              )}
              {onToggleCam && (
                <button
                  onClick={() => onToggleCam(connectionId, !camEnabled)}
                  className={`p-2 rounded-full transition-colors ${
                    camEnabled
                      ? "bg-gray-600/50 hover:bg-gray-500/50 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {camEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}