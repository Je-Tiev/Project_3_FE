// useMeetingWithWebRTC.js
import { useEffect, useRef, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  // nếu có TURN server thêm ở đây
];

export function useMeetingWithWebRTC(meetingId) {
  const connectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // connectionId -> { pc, stream, dataChannel? }
  const [status, setStatus] = useState("idle"); // idle | connecting | joined | error
  const [participants, setParticipants] = useState([]); // { connectionId, userId, fullName }
  const [remoteStreams, setRemoteStreams] = useState({}); // connectionId -> MediaStream
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  // =====================
  // 1) khởi tạo SignalR và events
  // =====================
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl("http://localhost:5075/meetinghub", {
        accessTokenFactory: () => localStorage.getItem("token"),
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;
    setStatus("connecting");

    registerSignalREvents(connection);

    connection
      .start()
      .then(() => {
        console.log("SignalR connected");
        // trước khi invoke JoinRoom, đảm bảo đã có local media (tốt hơn UX)
        setStatus("connected");
        joinRoom(meetingId);
      })
      .catch((err) => {
        console.error("SignalR connect error", err);
        setError("Không thể kết nối server");
        setStatus("error");
      });

    window.addEventListener("beforeunload", cleanup);
    return () => {
      cleanup();
      window.removeEventListener("beforeunload", cleanup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  // =====================
  // cleanup
  // =====================
  const cleanup = async () => {
    try {
      // stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      // close peerConnections
      peersRef.current.forEach(({ pc }) => {
        try { pc.close(); } catch (e) {}
      });
      peersRef.current.clear();
      setRemoteStreams({});

      if (connectionRef.current) {
        try { await connectionRef.current.stop(); } catch (e) {}
        connectionRef.current = null;
      }
    } catch (e) {
      console.warn("cleanup error", e);
    }
  };

  // =====================
  // Join room
  // =====================
  const joinRoom = async (meetingId) => {
    try {
        // 💡 KHẮC PHỤC 1: Kiểm tra trạng thái kết nối trước khi gọi invoke
        if (connectionRef.current.state !== 'Connected') {
            console.warn("SignalR not connected. Retrying joinRoom later or connection failed.");
            setStatus("error"); // Có thể coi là lỗi nếu không connected
            return;
        }

        await ensureLocalMedia(); // lấy camera/micro
        // 💡 KHẮC PHỤC 2: Thêm meetingId vào dependency của useEffect để hàm joinRoom luôn được cập nhật.
        await connectionRef.current.invoke("JoinRoom", meetingId); 
        console.log("JoinRoom invoked for meetingId", meetingId);
    } catch (err) {
        console.error("JoinRoom error:", err);
        setError(err.toString());
        setStatus("error");
    }
};

  // =====================
  // đảm bảo có local media
  // =====================
  const ensureLocalMedia = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      return stream;
    } catch (e) {
      console.error("getUserMedia error", e);
      // fallback: chỉ audio?
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        return stream;
      } catch (err) {
        throw new Error("Không thể truy cập micro/camera: " + err.message);
      }
    }
  };

  // =====================
  // Tạo RTCPeerConnection
  // =====================
  function createPeerConnection(targetConnectionId, isInitiator = false) {
    if (peersRef.current.has(targetConnectionId)) return peersRef.current.get(targetConnectionId);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // remote stream
    const remoteStream = new MediaStream();
    pc.ontrack = (ev) => {
      // Thêm track vào remote stream
      ev.streams?.[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
      // update state
      setRemoteStreams((prev) => ({ ...prev, [targetConnectionId]: remoteStream }));
    };

    // ICE candidates -> gửi cho peer qua SignalR
    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        const payload = {
          kind: "ice",
          candidate: ev.candidate,
        };
        try {
          connectionRef.current.invoke("SendSignal", targetConnectionId, payload);
        } catch (e) { console.warn("SendSignal ice error", e); }
      }
    };

    // add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try { pc.addTrack(track, localStreamRef.current); } catch (e) {}
      });
    }

    // optional: data channel for messages / file transfer
    let dataChannel = null;
    if (isInitiator) {
      dataChannel = pc.createDataChannel("chat");
      dataChannel.onmessage = (ev) => {
        console.log("DataChannel message:", ev.data);
      };
    } else {
      pc.ondatachannel = (ev) => {
        dataChannel = ev.channel;
        dataChannel.onmessage = (ev2) => {
          console.log("DataChannel message:", ev2.data);
        };
      };
    }

    const peerRecord = { pc, dataChannel, stream: remoteStream };
    peersRef.current.set(targetConnectionId, peerRecord);
    return peerRecord;
  }

  // =====================
  // Xử lý signaling message nhận từ server
  // format signal: { kind: 'offer'|'answer'|'ice', sdp?, candidate? }
  // =====================
  async function handleSignal(fromConnectionId, signal) {
    const kind = signal?.kind;
    if (!kind) return;

    if (kind === "offer") {
      // nhận offer -> tạo peer nếu chưa có, setRemoteDescription, tạo answer
      const { pc } = createPeerConnection(fromConnectionId, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // gửi answer về cho sender
        const payload = { kind: "answer", sdp: pc.localDescription };
        await connectionRef.current.invoke("SendSignal", fromConnectionId, payload);
      } catch (e) {
        console.error("handle offer error", e);
      }
    } else if (kind === "answer") {
      // nhận answer -> setRemoteDescription
      const record = peersRef.current.get(fromConnectionId);
      if (record && record.pc) {
        try {
          await record.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } catch (e) {
          console.error("setRemoteDescription(answer) error", e);
        }
      } else {
        console.warn("No peer for answer from", fromConnectionId);
      }
    } else if (kind === "ice") {
      // nhận ICE candidate
      const record = peersRef.current.get(fromConnectionId);
      if (record && record.pc) {
        try {
          await record.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.warn("addIceCandidate error", e);
        }
      } else {
        console.warn("No peer for ice from", fromConnectionId);
      }
    } else {
      console.warn("Unknown signal kind", kind);
    }
  }

  // =====================
  // Khi được server trả danh sách ExistingParticipants
  // => mình sẽ tạo PeerConnection + tạo Offer gửi tới từng existing participant
  // =====================
  async function handleExistingParticipants(list) {
    console.log("ExistingParticipants", list);
    setParticipants(list);

    for (const p of list) {
      const targetId = p.connectionId;
      // NẾU đã có peer skip
      if (peersRef.current.has(targetId)) continue;

      // create pc as initiator
      const { pc } = createPeerConnection(targetId, true);

      try {
        // create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // gửi offer qua SignalR
        const payload = { kind: "offer", sdp: pc.localDescription };
        await connectionRef.current.invoke("SendSignal", targetId, payload);
      } catch (e) {
        console.error("createOffer error for", targetId, e);
      }
    }
  }

  // =====================
  // Xử lý events từ SignalR
  // =====================
  const registerSignalREvents = (connection) => {
    connection.on("UserJoined", (user) => {
      console.log("UserJoined", user);
      // thêm user vào participants (UI)
      setParticipants((prev) => [...prev, user]);
      // **Không** tạo offer tại đây (newcomer sẽ tạo offer khi join)
      // Nếu muốn existing participant tạo offer thay vì newcomer, swap logic
    });

    connection.on("UserLeft", (user) => {
      console.log("UserLeft", user);
      setParticipants((prev) => prev.filter((p) => p.connectionId !== user.connectionId));
      // cleanup peer
      const rec = peersRef.current.get(user.connectionId);
      if (rec) {
        try { rec.pc.close(); } catch (e) {}
        peersRef.current.delete(user.connectionId);
        setRemoteStreams((prev) => {
          const copy = { ...prev };
          delete copy[user.connectionId];
          return copy;
        });
      }
    });

    connection.on("ExistingParticipants", (users) => {
      handleExistingParticipants(users);
    });

    connection.on("JoinedRoom", (roomInfo) => {
      console.log("JoinedRoom", roomInfo);
      setStatus("joined");
    });

    connection.on("ReceiveSignal", async (fromConnectionId, signal) => {
      await handleSignal(fromConnectionId, signal);
    });

    connection.on("ReceiveBroadcastSignal", async (fromConnectionId, signal) => {
      // BroadcastSignal (dùng để share screen or other broadcast)
      // tùy cách bạn mã hóa, có thể giống offer/answer/ice or custom
      await handleSignal(fromConnectionId, signal);
    });

    connection.on("ReceiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    connection.on("UserMediaChanged", (data) => {
      // update participant media states if UI muốn
      setParticipants((prev) =>
        prev.map((u) => (u.connectionId === data.connectionId ? { ...u, [data.type]: data.enabled } : u))
      );
    });

    connection.on("ScreenShareStarted", (data) => {
      console.log("ScreenShareStarted", data);
    });

    connection.on("ScreenShareStopped", (data) => {
      console.log("ScreenShareStopped", data);
    });
  };

  // =====================
  // Thao tác local: toggle camera/micro, start/stop screenshare
  // =====================
  async function toggleCamera(enabled) {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) videoTrack.enabled = enabled;
    
    // 💡 KHẮC PHỤC: Kiểm tra trạng thái kết nối
    if (connectionRef.current && connectionRef.current.state === 'Connected') { 
        const roomName = await _getRoomName(); 
        if (roomName) {
            await connectionRef.current.invoke("ToggleMedia", roomName, "video", enabled);
        }
    }
}
  

  async function toggleMicrophone(enabled) {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) audioTrack.enabled = enabled;
    const roomName = await _getRoomName();
    if (roomName) {
      await connectionRef.current.invoke("ToggleMedia", roomName, "microphone", enabled);
    }
  }

  // start screenshare (broadcast) - use getDisplayMedia and add track to each pc or broadcast via SFU
  async function startScreenShare() {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      // add track to all peer connections
      peersRef.current.forEach(({ pc }) => {
        screen.getTracks().forEach((track) => pc.addTrack(track, screen));
      });
      // Optional: notify server to broadcast a signal so clients can show UI
      await connectionRef.current.invoke("StartScreenShare", meetingId);
      // when screen track ends, notify stop and remove track
      screen.getTracks().forEach((t) => {
        t.onended = async () => {
          peersRef.current.forEach(({ pc }) => {
            try {
              // remove sender(s) associated with this track
              pc.getSenders().forEach((s) => {
                if (s.track === t) pc.removeTrack(s);
              });
            } catch (e) {}
          });
          await connectionRef.current.invoke("StopScreenShare", meetingId);
        };
      });
    } catch (e) {
      console.error("startScreenShare error", e);
    }
  }

  // helper lấy roomName (backend trả trong JoinedRoom) — trong hook này bạn có thể lưu khi nhận JoinedRoom
  async function _getRoomName() {
    // nếu bạn lưu roomName vào state khi nhận JoinedRoom thì trả từ đó
    // ví dụ roomNameRef.current
    return null;
  }

  // =====================
  // send chat
  // =====================
  async function sendMessage(text) {
    if (!connectionRef.current) return;
    await connectionRef.current.invoke("SendMessage", meetingId, text);
  }

  // =====================
  // public API hook trả về
  // =====================
  return {
    status,
    participants,
    remoteStreams, // object: connectionId -> MediaStream (use for <video srcObject={...}>)
    messages,
    error,

    // actions
    sendMessage,
    toggleCamera,
    toggleMicrophone,
    startScreenShare,
    stopScreenShare: async () => { await connectionRef.current.invoke("StopScreenShare", meetingId); },
  };
}
