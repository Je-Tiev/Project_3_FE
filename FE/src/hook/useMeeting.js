import { useEffect, useRef, useState, useCallback } from "react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
} from "@microsoft/signalr";

// Improved WebRTC + SignalR hook compatible with MeetingHub backend
// - Listens to the correct events: UserJoined, UserLeft, ExistingParticipants, JoinedRoom, ReceiveSignal, ReceiveMessage
// - Uses meetingId where backend expects meetingId (SendMessage, JoinRoom)
// - Handles reconnect lifecycle: re-join after automatic reconnect
// - Defensive logging and error handling

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export function useMeetingWithWebRTC(meetingId) {
  const connectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // connectionId -> { pc, stream }
  const joinedRef = useRef(false);
  const isUnmountingRef = useRef(false);

  const [status, setStatus] = useState("idle");
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);

  // ---------- WebRTC helpers ----------
  const createPeerConnection = useCallback((connectionId, stream) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Attach local tracks if present
    if (stream)
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

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
        try {
          connectionRef.current.invoke("SendSignal", connectionId, {
            type: "ice",
            candidate: evt.candidate,
          });
        } catch (e) {
          console.warn("Failed to send ICE candidate", e);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      // optional: cleanup when disconnected
      const state = pc.connectionState;
      if (
        state === "failed" ||
        state === "disconnected" ||
        state === "closed"
      ) {
        // nothing immediate here, OnUserLeft will cleanup
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
        // signal.sdp should be an RTCSessionDescriptionInit-like object
        await pc.setRemoteDescription(signal.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        connectionRef.current?.invoke("SendSignal", fromConnectionId, {
          type: "answer",
          sdp: pc.localDescription,
        });
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(signal.sdp);
      } else if (signal.type === "ice" && signal.candidate) {
        await pc.addIceCandidate(signal.candidate);
      }
    } catch (e) {
      console.warn("handleSignal error", e);
    }
  }, []);

  const handleExistingParticipants = useCallback(
    async (existingParticipants) => {
      console.log(
        "[DEBUG] ExistingParticipants received:",
        existingParticipants
      );
      // existingParticipants: [{ connectionId, userId, fullName }, ...]
      const localStream = localStreamRef.current;
      // Ensure local stream present before creating offers
      if (!localStream) {
        setParticipants(existingParticipants);
        return;
      }

      for (const p of existingParticipants) {
        if (!peersRef.current.has(p.connectionId)) {
          const pc = createPeerConnection(p.connectionId, localStream);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            // Send offer to target participant
            connectionRef.current?.invoke("SendSignal", p.connectionId, {
              type: "offer",
              sdp: pc.localDescription,
            });
          } catch (e) {
            console.warn("Failed to offer to", p.connectionId, e);
          }
        }
      }
      setParticipants(existingParticipants);
    },
    [createPeerConnection]
  );

  // ---------- Media ----------
  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    localStreamRef.current = stream;
    setIsMicOn(!!stream.getAudioTracks()[0]?.enabled);
    setIsVideoOn(!!stream.getVideoTracks()[0]?.enabled);
    return stream;
  }, []);

  const cleanup = useCallback(async () => {
    isUnmountingRef.current = true;

    if (localStreamRef.current)
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    peersRef.current.forEach(({ pc }) => pc.close());
    peersRef.current.clear();
    setRemoteStreams({});

    if (
      connectionRef.current &&
      connectionRef.current.state === HubConnectionState.Connected
    ) {
      try {
        await connectionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    connectionRef.current = null;
    joinedRef.current = false;

    setParticipants([]);
    setRoomName(null);
    setIsMicOn(false);
    setIsVideoOn(false);
    setStatus("idle");
  }, []);

  // ---------- Join room (calls backend JoinRoom(meetingId)) ----------
  const joinRoom = useCallback(
    async (id) => {
      console.log("[DEBUG] joinRoom called with id:", id);
      console.log(
        "[DEBUG] connectionRef.current:",
        connectionRef.current?.state
      );
      console.log("[DEBUG] joinedRef.current:", joinedRef.current);
      if (
        !connectionRef.current ||
        connectionRef.current.state !== HubConnectionState.Connected
      )
        return;
      if (isUnmountingRef.current || joinedRef.current) return;

      await ensureLocalMedia();
      console.log("[DEBUG] Local media ready:", !!localStreamRef.current);
      try {
        console.log("[DEBUG] Invoking JoinRoom with meetingId=", id);
        //1. Gọi lên Server để join room
        await connectionRef.current.invoke("JoinRoom", Number(id));
        //2. Đánh dấu đã join
        joinedRef.current = true;
        //3. Cập nhật trạng thái
        setStatus("joined");
      } catch (err) {
        // HubException message sẽ có trong err.message
        console.error("[DEBUG] JoinRoom failed", err.message || err);
        setError(err.message || "Không thể tham gia phòng");
      }
    },
    [ensureLocalMedia]
  );

  // ---------- Register SignalR events (matching backend MeetingHub) ----------
  const registerSignalREvents = useCallback(
    (connection) => {
      // Clean previous handlers
      connection.off("JoinedRoom");
      connection.off("ExistingParticipants");
      connection.off("ReceiveSignal");
      connection.off("UserJoined");
      connection.off("UserLeft");
      connection.off("ReceiveMessage");

      connection.on("JoinedRoom", (roomInfo) => {
        // roomInfo: { roomName, meetingId, message }
        console.log("[DEBUG] Received JoinedRoom event:", roomInfo);
        setRoomName(roomInfo?.roomName || null);
        setStatus("joined");
      });

      connection.on("ExistingParticipants", handleExistingParticipants);

      connection.on("ReceiveSignal", (fromConnectionId, signal) => {
        console.log("[DEBUG] ReceiveSignal from", fromConnectionId, signal);
        // Backend sends: (fromConnectionId, signal)
        handleSignal(fromConnectionId, signal);
      });

      connection.on("UserJoined", (p) => {
        console.log("[DEBUG] UserJoined event:", p);
        // p: { userId, connectionId, fullName }
        setParticipants((prev) => {
          // avoid duplicates
          if (prev.some((x) => x.connectionId === p.connectionId)) return prev;
          return [...prev, p];
        });

        // If we have local stream, initiate outgoing offer to the new participant
        const localStream = localStreamRef.current;
        if (localStream) {
          if (!peersRef.current.has(p.connectionId)) {
            const pc = createPeerConnection(p.connectionId, localStream);
            pc.createOffer()
              .then((offer) => pc.setLocalDescription(offer))
              .then(() =>
                connectionRef.current?.invoke("SendSignal", p.connectionId, {
                  type: "offer",
                  sdp: pc.localDescription,
                })
              )
              .catch((err) => console.warn("Offer to new user failed", err));
          }
        }
      });

      connection.on("UserLeft", (p) => {
        setParticipants((prev) =>
          prev.filter((x) => x.connectionId !== p.connectionId)
        );
        const entry = peersRef.current.get(p.connectionId);
        if (entry) entry.pc.close();
        peersRef.current.delete(p.connectionId);
        setRemoteStreams((prev) => {
          const copy = { ...prev };
          delete copy[p.connectionId];
          return copy;
        });
      });

      connection.on("ReceiveMessage", (msg) =>
        setMessages((prev) => [...prev, msg])
      );

      // Handle reconnect lifecycle
      connection.onreconnecting((err) => {
        console.warn("SignalR reconnecting", err);
        setStatus("reconnecting");
      });

      connection.onreconnected((newUrl) => {
        console.info("SignalR reconnected to", newUrl);
        setStatus("connected");
        // re-join the room after reconnect
        if (meetingId) {
          joinedRef.current = false; // allow join again
          joinRoom(meetingId).catch(console.warn);
        }
      });
    },
    [
      createPeerConnection,
      handleExistingParticipants,
      handleSignal,
      joinRoom,
      meetingId,
    ]
  );

  // ---------- Main effect: create SignalR connection when meetingId available ----------
  useEffect(() => {
    if (!meetingId) return;
    if (connectionRef.current) return; // already connected

    isUnmountingRef.current = false;
    setStatus("connecting");

    const connection = new HubConnectionBuilder()
      .withUrl("http://localhost:5075/meetinghub", {
        accessTokenFactory: () => localStorage.getItem("token"),
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;
    registerSignalREvents(connection);

    connection
      .start()
      .then(() => {
        if (isUnmountingRef.current) return;
        setStatus("connected");
        // join using meetingId (backend expects meetingId int)
        joinRoom(meetingId).catch(console.error);
      })
      .catch((err) => {
        console.error(err);
        setError("Không thể kết nối server");
        setStatus("error");
      });

    const handleUnload = () => {
      isUnmountingRef.current = true;
      cleanup();
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      cleanup();
    };
  }, [meetingId, registerSignalREvents, joinRoom, cleanup]);

  // ---------- Actions ----------
  // const toggleCamera = async () => {
  //   if (!localStreamRef.current) return;
  //   const newState = !isVideoOn;
  //   const vt = localStreamRef.current.getVideoTracks()[0];
  //   if (vt) vt.enabled = newState;
  //   // backend ToggleMedia expects roomName
  //   connectionRef.current?.invoke("ToggleMedia", roomName, "video", newState).catch(console.warn);
  //   setIsVideoOn(newState);
  // };
  const toggleCamera = async () => {
    console.log(
      "[DEBUG] toggleCamera called, roomName:",
      roomName,
      "isVideoOn:",
      isVideoOn
    );
    if (!localStreamRef.current || !roomName) return; // <- thêm điều kiện roomName
    const newState = !isVideoOn;
    const vt = localStreamRef.current.getVideoTracks()[0];
    if (vt) vt.enabled = newState;
    try {
      await connectionRef.current.invoke(
        "ToggleMedia",
        roomName,
        "video",
        newState
      );
      console.log("[DEBUG] ToggleCamera success:", newState);
    } catch (e) {
      console.warn("ToggleCamera failed", e);
    }
    setIsVideoOn(newState);
  };

  const toggleMicrophone = async () => {
    console.log(
      "[DEBUG] toggleMicrophone called, roomName:",
      roomName,
      "isMicOn:",
      isMicOn
    );
    if (!localStreamRef.current || !roomName) return; // <- thêm điều kiện roomName
    const newState = !isMicOn;
    const at = localStreamRef.current.getAudioTracks()[0];
    if (at) at.enabled = newState;
    try {
      await connectionRef.current.invoke(
        "ToggleMedia",
        roomName,
        "microphone",
        newState
      );
    } catch (e) {
      console.warn("ToggleMicrophone failed", e);
    }
    setIsMicOn(newState);
  };

  // const toggleMicrophone = async () => {
  //   if (!localStreamRef.current) return;
  //   const newState = !isMicOn;
  //   const at = localStreamRef.current.getAudioTracks()[0];
  //   if (at) at.enabled = newState;
  //   connectionRef.current?.invoke("ToggleMedia", roomName, "microphone", newState).catch(console.warn);
  //   setIsMicOn(newState);
  // };

  // IMPORTANT: backend SendMessage expects meetingId (int)
  const sendMessage = async (text) =>
    connectionRef.current
      ?.invoke("SendMessage", meetingId, text)
      .catch(console.warn);
  const startScreenShare = async () =>
    connectionRef.current
      ?.invoke("StartScreenShare", meetingId)
      .catch(console.warn);
  const stopScreenShare = async () =>
    connectionRef.current
      ?.invoke("StopScreenShare", meetingId)
      .catch(console.warn);

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
    toggleCamera,
    toggleMicrophone,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    ensureLocalMedia,
  };
}
