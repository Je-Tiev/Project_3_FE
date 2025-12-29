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

  const [status, setStatus] = useState("idle");
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [roomName, setRoomName] = useState(null);

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
      const remoteStream = new MediaStream();
      if (event.streams?.length) {
        event.streams.forEach((s) =>
          s.getTracks().forEach((t) => remoteStream.addTrack(t))
        );
      } else if (event.track) {
        remoteStream.addTrack(event.track);
      }
      setRemoteStreams((prev) => ({ ...prev, [connectionId]: remoteStream }));
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
      connection.off("JoinedRoom");
      connection.off("ExistingParticipants");
      connection.off("UserJoined");
      connection.off("UserLeft");
      connection.off("ReceiveSignal");
      connection.off("ReceiveMessage");
      connection.off("PollCreated");
      connection.off("VoteUpdated");
      connection.off("PollClosed");

      connection.on("JoinedRoom", (info) => {
        setRoomName(info?.roomName);
        setStatus("joined");
      });
      // Nếu mình là người mới => mình gửi offer
      connection.on("ExistingParticipants", async (users) => {
        setParticipants(users);
        const localStream = localStreamRef.current;
        if (!localStream) {
          return;
        }
        for (const u of users) {
          if (!peersRef.current.has(u.connectionId)) {
            const pc = createPeerConnection(u.connectionId, localStream);
            // Chủ động gửi offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            connectionRef.current?.invoke("SendSignal", u.connectionId, {
              type: "offer",
              sdp: pc.localDescription,
            });
          }
        }
      });
      // Nếu người khác mới vào => họ gửi offer
      connection.on("UserJoined", (u) => {
        setParticipants((prev) => [...prev, u]);
        const localStream = localStreamRef.current;

        if (localStream && !peersRef.current.has(u.connectionId)) {
          // chỉ cần tạo peer connection, chờ họ gửi offer, không cần gọi createOffer
          createPeerConnection(u.connectionId, localStream);
        }
      });

      connection.on("UserLeft", (u) => {
        setParticipants((prev) =>
          prev.filter((p) => p.connectionId !== u.connectionId)
        );
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

      connection.on("ReceiveSignal", (from, signal) =>
        handleSignal(from, signal)
      );
      connection.on("ReceiveMessage", (msg) =>
        setMessages((prev) => [...prev, msg])
      );
      connection.on("PollCreated", (poll) => {
        console.log("📊 [SignalR] Poll created:", poll);
      });

      connection.on("VoteUpdated", (pollUpdate) => {
        console.log("🗳️ [SignalR] Vote updated:", pollUpdate);
      });

      connection.on("PollClosed", (pollId) => {
        console.log("🔒 [SignalR] Poll closed:", pollId);
      });

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
        // TẮT CAM
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          localStreamRef.current.removeTrack(videoTrack);
        }
        setIsVideoOn(false);
        await connectionRef.current.invoke(
          "ToggleMedia",
          roomName,
          "video",
          false
        );
      } else {
        // BẬT CAM
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const newVideoTrack = newStream.getVideoTracks()[0];

        if (localStreamRef.current) {
          localStreamRef.current.addTrack(newVideoTrack);
        }

        peersRef.current.forEach(({ pc }) => {
          const senders = pc.getSenders();
          const videoSender = senders.find(
            (s) => s.track?.kind === "video" || s.track === null
          );
          if (videoSender) {
            videoSender
              .replaceTrack(newVideoTrack)
              .catch((err) => console.error("Replace track failed", err));
          } else {
            pc.addTrack(newVideoTrack, localStreamRef.current);
          }
        });

        setIsVideoOn(true);
        await connectionRef.current.invoke(
          "ToggleMedia",
          roomName,
          "video",
          true
        );
      }
    } catch (err) {
      console.error("Lỗi toggle camera:", err);
      setIsVideoOn(false);
    }
  };

  const toggleMicrophone = async () => {
    if (!localStreamRef.current || !roomName) return;
    const newState = !isMicOn;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = newState;
    }
    setIsMicOn(newState);
    await connectionRef.current
      .invoke("ToggleMedia", roomName, "microphone", newState)
      .catch(console.warn);
  };

  // ---------- ACTIONS: SHARE SCREEN (Đã chuyển vào trong) ----------

  // 3. Dừng chia sẻ
  const stopScreenShare = useCallback(async () => {
    // 1. Tắt track màn hình hiện tại
    const screenTrack = localStreamRef.current?.getVideoTracks()[0];
    if (screenTrack) {
      screenTrack.stop();
    }

    setIsScreenSharing(false);

    // 2. Bật lại Camera (Nếu muốn tự động bật lại cam sau khi tắt share)
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      const camTrack = camStream.getVideoTracks()[0];

      if (localStreamRef.current) {
        // Xóa track cũ (screen)
        const oldTracks = localStreamRef.current.getVideoTracks();
        oldTracks.forEach((t) => localStreamRef.current.removeTrack(t));
        // Thêm track mới (cam)
        localStreamRef.current.addTrack(camTrack);
      }

      peersRef.current.forEach(({ pc }) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(camTrack).catch(console.warn);
      });

      setIsVideoOn(true);
      // Báo server bật lại video
      if (roomName) {
        connectionRef.current?.invoke("ToggleMedia", roomName, "video", true);
      }
    } catch (e) {
      console.error("Không thể bật lại camera sau khi tắt share", e);
      setIsVideoOn(false);
    }
  }, [roomName]); // Thêm dependency roomName nếu dùng trong invoke

  // 4. Bắt đầu chia sẻ màn hình
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const screenTrack = stream.getVideoTracks()[0];

      // Xử lý khi user bấm nút "Stop sharing" của trình duyệt
      screenTrack.onended = () => {
        stopScreenShare();
      };

      // Thay thế track Camera hiện tại bằng track Màn hình
      if (localStreamRef.current) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop(); // Tắt cam vật lý
          localStreamRef.current.removeTrack(oldVideoTrack);
        }
        localStreamRef.current.addTrack(screenTrack);
      }

      // Cập nhật cho Peer
      peersRef.current.forEach(({ pc }) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track?.kind === "video" || s.track === null);
        if (sender) {
          sender.replaceTrack(screenTrack).catch(console.error);
        }
      });

      setIsScreenSharing(true);
      // Khi share screen, coi như video đang on (để hiện hình)
      setIsVideoOn(true);
    } catch (err) {
      console.warn("Huỷ chia sẻ màn hình:", err);
    }
  }, [stopScreenShare]);

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
    sendMessage: (text) =>
      connectionRef.current?.invoke("SendMessage", Number(meetingId), text),
  };
}
