import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export function useWebRTC() {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    peerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    peerRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    socket.on("ice-candidate", (candidate) => {
      peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      peerRef.current?.close();
    };
  }, []);

  async function startCall() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => peerRef.current?.addTrack(track, stream));

    const offer = await peerRef.current?.createOffer();
    await peerRef.current?.setLocalDescription(offer);
    
    socket.emit("offer", offer);
  }

  socket.on("offer", async (offer) => {
    await peerRef.current?.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerRef.current?.createAnswer();
    await peerRef.current?.setLocalDescription(answer);
    
    socket.emit("answer", answer);
  });

  socket.on("answer", async (answer) => {
    await peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
  });

  return { startCall, remoteStream };
}
