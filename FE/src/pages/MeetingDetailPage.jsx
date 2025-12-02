import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { Video, Mic, MicOff, VideoOff, Share2 } from 'lucide-react';

const MeetingDetailPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { meetings, currentUser } = useApp();

  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const connectionRef = useRef(null);
  const peerConnections = useRef({});

  /** ==================== GET MEETING ==================== */
  useEffect(() => {
    const found = meetings.find(m => `${m.id}` === `${meetingId}`);
    if (found) setMeeting(found);
    else navigate('/');
  }, [meetingId, meetings, navigate]);

  /** ==================== GET LOCAL MEDIA ==================== */
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("getUserMedia error:", err);
      }
    };
    getMedia();
  }, []);

  /** ==================== SIGNALR CONNECTION ==================== */
  useEffect(() => {
    if (!currentUser || !localStream) return;
    const token = localStorage.getItem("token");
    const connection = new HubConnectionBuilder()
      .withUrl("http://localhost:5075/meetinghub", { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => connection.invoke("JoinRoom", meetingId))
      .catch(console.error);

    connection.on("ExistingParticipants", users => {
      setParticipants(users);
      users.forEach(u => initPeerConnection(u.connectionId, true)); // tạo offer
    });

    connection.on("UserJoined", user => {
      setParticipants(prev => [...prev, user]);
      initPeerConnection(user.connectionId, true); // gửi offer tới người mới
    });

    connection.on("ReceiveSignal", handleSignal);

    connectionRef.current = connection;

    return () => connection.stop();
  }, [currentUser, meetingId, localStream]);

  /** ==================== INIT PEER CONNECTION ==================== */
  const initPeerConnection = async (connId, isOfferer = false) => {
    if (peerConnections.current[connId]) return;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    // Add local tracks
    localStream?.getTracks().forEach(track => pc.addTrack(track, localStream));

    // On remote track
    pc.ontrack = event => {
      setRemoteStreams(prev => ({ ...prev, [connId]: event.streams[0] }));
    };

    // ICE candidate
    pc.onicecandidate = event => {
      if (event.candidate) {
        connectionRef.current.invoke("SendSignal", connId, { candidate: event.candidate });
      }
    };

    peerConnections.current[connId] = pc;

    if (isOfferer) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        connectionRef.current.invoke("SendSignal", connId, { sdp: pc.localDescription });
      } catch (err) {
        console.error(err);
      }
    }
  };

  /** ==================== HANDLE SIGNAL ==================== */
  const handleSignal = async (fromId, signal) => {
    if (!peerConnections.current[fromId]) await initPeerConnection(fromId, false);
    const pc = peerConnections.current[fromId];
    if (!pc) return;

    if (signal.sdp) {
      const desc = new RTCSessionDescription(signal.sdp);
      if (desc.type === "offer") {
        await pc.setRemoteDescription(desc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        connectionRef.current.invoke("SendSignal", fromId, { sdp: pc.localDescription });
      } else if (desc.type === "answer") {
        await pc.setRemoteDescription(desc);
      }
    } else if (signal.candidate) {
      try { await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)); }
      catch (err) { console.error(err); }
    }
  };

  /** ==================== TOGGLE CAMERA/MIC ==================== */
  const toggleMic = () => {
    localStream.getAudioTracks().forEach(t => t.enabled = !isMicOn);
    setIsMicOn(prev => !prev);
  };
  const toggleVideo = () => {
    localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOn);
    setIsVideoOn(prev => !prev);
  };

  /** ==================== SHARE SCREEN ==================== */
  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      Object.values(peerConnections.current).forEach(pc => {
        screenStream.getTracks().forEach(track => pc.addTrack(track, screenStream));
      });
    } catch (err) { console.error(err); }
  };

  if (!meeting) return <div>Đang tải...</div>;

  /** ==================== UI ==================== */
  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="relative bg-gray-800 aspect-video rounded-lg overflow-hidden mb-4 flex justify-center items-center">
        {/* Local Video */}
        <video ref={localVideoRef} autoPlay muted playsInline className="absolute top-0 left-0 w-full h-full object-cover" />

        {/* Remote Videos */}
        {Object.entries(remoteStreams).map(([id, stream]) => (
          <video
            key={id}
            ref={el => { if (el) el.srcObject = stream; remoteVideoRefs.current[id] = el; }}
            autoPlay
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        ))}

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
          <button onClick={toggleMic} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600">
            {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
          <button onClick={toggleVideo} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600">
            {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
          <button onClick={shareScreen} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600">
            <Share2 size={24} />
          </button>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold">
            Rời cuộc họp
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailPage;
