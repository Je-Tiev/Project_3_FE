import { useEffect, useRef, useState, useCallback } from "react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
} from "@microsoft/signalr";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" }, //Dự phòng
 // { urls: "stun:52.221.241.199:3478" },
  //{
    //urls: "turn:52.221.241.199:3478",
    //username: "test",
    //credential: "123456",
  //},
];

export function useMeetingWithWebRTC(
  meetingId,
  defaultCamOn = true,
  defaultMicOn = true
) {
  const connectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // connectionId -> { pc, stream }
  const joinedRef = useRef(false);

  const screenStreamRef = useRef(null); 
  const [screenShareStreams, setScreenShareStreams] = useState({});
  const [screenShareStream, setScreenShareStream] = useState(null);

  const [status, setStatus] = useState("idle");
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [sharerId, setSharerId] = useState(null);

  const [isMicOn, setIsMicOn] = useState(defaultMicOn);
  const [isVideoOn, setIsVideoOn] = useState(defaultCamOn);
  const [isScreenSharing, setIsScreenSharing] = useState(false); // State share màn hình

  // ---------- WebRTC helpers ----------
  const createPeerConnection = useCallback((connectionId, stream) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    pc.ontrack = (event) => {
      const incomingStream = event.streams[0];
      const remoteStream = new MediaStream();
      if (event.streams?.length) {
        event.streams.forEach((s) =>
          s.getTracks().forEach((t) => remoteStream.addTrack(t))
        );
      } else if (event.track) {
        remoteStream.addTrack(event.track);
      }
      setRemoteStreams((prev) => {
         if (!prev[connectionId]) {
          return { ...prev, [connectionId]: incomingStream };
        }
        
        // Nếu stream ID mới khác stream ID cũ -> Đây là Screen Share Stream
        if (prev[connectionId].id !== incomingStream.id) {
           console.log("📺 Nhận được Screen Stream từ:", connectionId);
           setScreenShareStreams(prevSSR => ({
             ...prevSSR,
             [connectionId]: incomingStream
           }));
           return prev; // Không thay đổi remoteStreams gốc (Camera)
        }
        return prev;
      });

    };

    pc.onicecandidate = (evt) => {
      if (
        evt.candidate &&
        connectionRef.current?.state === HubConnectionState.Connected
      ) {
        connectionRef.current
          .invoke("SendSignal", connectionId, {
            type: "ice",
            candidate: evt.candidate,
          })
          .catch((e) => console.warn("Ice Error", e));
      }
    };

    peersRef.current.set(connectionId, { pc, stream });
    return pc;
  }, []);

  const handleSignal = useCallback(async (fromConnectionId, signal) => {
    const peerEntry = peersRef.current.get(fromConnectionId);
    if (!peerEntry) return;
    const pc = peerEntry.pc;

    try {
      if (signal.type === "offer") {
        if (
          pc.signalingState !== "stable" &&
          pc.signalingState !== "have-remote-offer"
        ) {
          // Nếu đang bận đàm phán việc khác (ví dụ mình cũng đang gửi offer),
          // ta cần cơ chế "Polite Peer". Nhưng đơn giản nhất là:
          // Nếu mình là người cũ (đang chờ), mình nhận offer vô tư.
          console.warn(
            "Nhận Offer khi đang không stable, có thể gây lỗi glare"
          );
          // Vẫn tiếp tục xử lý để xem có cứu được không, hoặc return nếu muốn chặt chẽ
        }
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        connectionRef.current?.invoke("SendSignal", fromConnectionId, {
          type: "answer",
          sdp: pc.localDescription,
        });
      } else if (signal.type === "answer") {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else {
          console.warn(
            `Bỏ qua Answer vì trạng thái hiện tại là: ${pc.signalingState}`
          );
        }
      } else if (signal.type === "ice" && signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (err) {
          console.warn(
            "Lỗi addIceCandidate (có thể do chưa set remote description):",
            err
          );
          // Có thể queue lại candidate để add sau nếu cần thiết
        }
      }
    } catch (e) {
      console.warn("Signal Error", e);
    }
  }, []);

  // ---------- Media ----------
  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack) {
        if (!defaultCamOn) {
          videoTrack.stop();
          stream.removeTrack(videoTrack);
        } else {
          videoTrack.enabled = true;
        }
      }

      if (audioTrack) {
        audioTrack.enabled = defaultMicOn;
      }

      localStreamRef.current = stream;
      setIsMicOn(defaultMicOn);
      setIsVideoOn(defaultCamOn);

      return stream;
    } catch (err) {
      console.error("Error getting media:", err);
      setError("Không thể truy cập Camera/Mic");
      return null;
    }
  }, [defaultCamOn, defaultMicOn]);

  // ---------- Join Room ----------
  const joinRoom = useCallback(
    async (id) => {
      if (
        !connectionRef.current ||
        connectionRef.current.state !== HubConnectionState.Connected
      )
        return;
      if (joinedRef.current) return;

      await ensureLocalMedia();

      try {
        await connectionRef.current.invoke("JoinRoom", Number(id));
        joinedRef.current = true;
        setStatus("joined");
      } catch (err) {
        setError("Không thể tham gia phòng");
      }
    },
    [ensureLocalMedia]
  );

  // ---------- Register Events ----------
  const registerSignalREvents = useCallback(
    (connection) => {
      // Clear các event cũ để tránh duplicate
      connection.off("JoinedRoom");
      connection.off("ExistingParticipants");
      connection.off("UserJoined");
      connection.off("UserLeft");
      connection.off("ReceiveSignal");
      connection.off("ScreenShareStarted");
      connection.off("ScreenShareStopped");

      // 1. Xử lý sự kiện START Share từ Server
      connection.on("ScreenShareStarted", (data) => {
        setSharerId(data.connectionId); // Lấy ID từ object
        console.log("📺 [SignalR] User STARTED sharing:", data.connectionId);
        
        setParticipants((prev) => prev.map((p) => ({ 
            ...p, 
            isScreenSharing: p.connectionId == data.connectionId 
        })));
      });

      // 2. Xử lý sự kiện STOP Share từ Server
      connection.on("ScreenShareStopped", (data) => {
        console.log("🛑 [SignalR] User STOPPED sharing:", data.connectionId);
        setSharerId(null);
        
        setScreenShareStreams(prev => {
            const copy = { ...prev };
            delete copy[data.connectionId];
            return copy;
        });
        setParticipants((prev) => prev.map((p) => ({ ...p, isScreenSharing: false })));
      });

      connection.on("JoinedRoom", (info) => {
        setRoomName(info?.roomName);
        setStatus("joined");
      });

      connection.on("ExistingParticipants", async (users) => {
        console.log("👥 Existing participants:", users);
        setParticipants(users);
        const localStream = localStreamRef.current;
        if (!localStream) return;
        
        for (const u of users) {
          if (!peersRef.current.has(u.connectionId)) {
            const pc = createPeerConnection(u.connectionId, localStream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            connectionRef.current?.invoke("SendSignal", u.connectionId, {
              type: "offer",
              sdp: pc.localDescription,
            });
          }
        }
      });

      connection.on("UserJoined", (u) => {
        console.log("👤 User joined:", u);
        setParticipants((prev) => [...prev, u]);
        const localStream = localStreamRef.current;
        if (localStream && !peersRef.current.has(u.connectionId)) {
          createPeerConnection(u.connectionId, localStream);
        }
      });

      connection.on("UserLeft", (u) => {
        setParticipants((prev) => prev.filter((p) => p.connectionId !== u.connectionId));
        if (peersRef.current.has(u.connectionId)) {
          peersRef.current.get(u.connectionId).pc.close();
          peersRef.current.delete(u.connectionId);
        }
        setRemoteStreams((prev) => {
          const copy = { ...prev };
          delete copy[u.connectionId];
          return copy;
        });
      });

      connection.on("ReceiveSignal", (from, signal) => handleSignal(from, signal));
    },
    [createPeerConnection, handleSignal]
  );
  

// ---------- Setup Connection ----------
useEffect(() => {
  if (!meetingId) return;

  const connection = new HubConnectionBuilder()
    //.withUrl("https://52.221.241.199.nip.io/meetinghub", {
    .withUrl("http://localhost:5075/meetinghub", {
      accessTokenFactory: () => localStorage.getItem("token"),
      transport: HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .build();

  connectionRef.current = connection;
  window.meetingHubConnection = connection;
  
  registerSignalREvents(connection);

  connection
    .start()
    .then(() => joinRoom(meetingId))
    .catch((err) => {
      console.error(err);
      setError("Lỗi kết nối Server");
    });

  return () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    window.meetingHubConnection = null;
    connection.stop();
  };
}, [meetingId, joinRoom, registerSignalREvents]);


  // // ---------- Setup Connection ----------
  // useEffect(() => {
  //   if (!meetingId) return;
  //   // NẾU DÙNG TRÊN LOCAL
  //   // const connection = new HubConnectionBuilder()
  //   //   .withUrl("http://localhost:5075/meetinghub", {
  //   //     accessTokenFactory: () => localStorage.getItem("token"),
  //   //     transport: HttpTransportType.WebSockets,
  //   //   })
  //   //   .withAutomaticReconnect()
  //   //   .build();

  //   // NẾU DÙNG TRÊN SERVER
  //   const connection = new HubConnectionBuilder()
  //     .withUrl("https://52.221.241.199.nip.io/meetinghub", {
  //       accessTokenFactory: () => localStorage.getItem("token"),
  //       transport: HttpTransportType.WebSockets,
  //     })
  //     .withAutomaticReconnect()
  //     .build();

  //   connectionRef.current = connection;
  // // ✅ ADD: Expose connection globally for polls
  // window.meetingHubConnection = connection;
  // console.log("🌐 SignalR connection exposed globally");

  //   registerSignalREvents(connection);

  //   connection
  //     .start()
  //     .then(() => joinRoom(meetingId))
  //     .catch((err) => {
  //       console.error(err);
  //       setError("Lỗi kết nối Server");
  //     });

  //   return () => {
  //     if (localStreamRef.current) {
  //       localStreamRef.current.getTracks().forEach((t) => t.stop());
  //     }
  //      window.meetingHubConnection = null;
  //     connection.stop();
  //   };
  // }, [meetingId, joinRoom, registerSignalREvents]);

  // ---------- ACTIONS: CAM & MIC ----------
  const toggleCamera = async () => {
    if (!roomName) return;
    try {
      if (isVideoOn) {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (videoTrack) { videoTrack.stop(); localStreamRef.current.removeTrack(videoTrack); }
        setIsVideoOn(false);
        await connectionRef.current.invoke("ToggleMedia", roomName, "video", false);
      } else {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (localStreamRef.current) localStreamRef.current.addTrack(newVideoTrack);
        
        peersRef.current.forEach(({ pc }) => {
            const sender = pc.getSenders().find(s => s.track?.kind === "video" || s.track === null);
            if (sender) sender.replaceTrack(newVideoTrack).catch(console.error);
            else pc.addTrack(newVideoTrack, localStreamRef.current);
        });
        setIsVideoOn(true);
        await connectionRef.current.invoke("ToggleMedia", roomName, "video", true);
      }
    } catch (err) { console.error(err); }
  };

  const toggleMicrophone = async () => {
    if (!localStreamRef.current || !roomName) return;
    const newState = !isMicOn;
    localStreamRef.current.getAudioTracks()[0].enabled = newState;
    setIsMicOn(newState);
    await connectionRef.current.invoke("ToggleMedia", roomName, "microphone", newState);
  };

  // 2. Stop Screen Share
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = stream.getVideoTracks()[0];

      screenTrack.onended = () => stopScreenShare();
      screenStreamRef.current = stream;

      setScreenShareStream(stream); 
      setSharerId("local");
      setIsScreenSharing(true);
 
      for (const [peerId, { pc }] of peersRef.current) {
        // Add track vào PC hiện tại (Tạo ra dòng dữ liệu thứ 2 song song camera)
        pc.addTrack(screenTrack, stream);
        
        // QUAN TRỌNG: Phải Đàm phán lại (Renegotiation) để bên kia nhận được track mới
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        connectionRef.current?.invoke("SendSignal", peerId, {
           type: "offer",
           sdp: pc.localDescription
        });
      }

      if (meetingId && connectionRef.current) {
         try {
            await connectionRef.current.invoke("StartScreenShare", Number(meetingId));
          } catch (serverErr) {
            console.error("Server từ chối share:", serverErr);
            // Nếu server từ chối, phải tắt ngay share local
            stopScreenShare(); 
            alert(serverErr.message || "Không thể chia sẻ màn hình lúc này.");
          }
      }
      
    } catch (err) {
      console.warn("Huỷ chia sẻ màn hình:", err);
    }
  }, [meetingId, roomName]); // Cần dependency meetingId

  // 4. STOP SHARE (Đã sửa cho khớp Backend)
  const stopScreenShare = useCallback(async () => {
    const stream = screenStreamRef.current;
    if (!stream) return;

    // 1. Stop tracks
    stream.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setScreenShareStream(null);
    setSharerId(null);
    setIsScreenSharing(false);

    for (const [peerId, { pc }] of peersRef.current) {
      const senders = pc.getSenders();
      // Tìm sender đang gửi track của screen stream
      const sender = senders.find(s => s.track === null && (s.track.kind === 'video' && s.track.readyState === 'ended'));
      
      if (sender) {
        pc.removeTrack(sender);
        
        // Đàm phán lại để bên kia biết là đã tắt share
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        connectionRef.current?.invoke("SendSignal", peerId, {
           type: "offer",
           sdp: pc.localDescription
        });
      }
    }
    
    // SỬA QUAN TRỌNG: Gửi Number(meetingId) thay vì roomName
    if (meetingId && connectionRef.current) {
        connectionRef.current.invoke("StopScreenShare", Number(meetingId))
            .catch(err => console.error("Lỗi gửi StopScreenShare:", err));
    }
  }, [meetingId, roomName]);

  // ---------- RETURN ----------
  return {
    status,
    participants,
    remoteStreams,
    messages,
    error,
    localStream: localStreamRef.current,
    roomName,
    isMicOn,
    isVideoOn,
    isScreenSharing,
    toggleCamera,
    toggleMicrophone,
    startScreenShare,
    stopScreenShare,
    screenShareStreams,
    screenShareStream,
    sharerId,
    sendMessage: (text) =>
      connectionRef.current?.invoke("SendMessage", Number(meetingId), text),
  };
}
