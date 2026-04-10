import { useRef, useEffect } from "react";
import { useWebRTC } from "../hooks/useWebRTC";

export default function DoctorCallInterface({ startCall, remoteStream }: any) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
  
    useEffect(() => {
      if (audioRef.current && remoteStream) {
        audioRef.current.srcObject = remoteStream;
      }
    }, [remoteStream]);
  
    return (
      <div className="p-4 border rounded shadow">
        <h2 className="text-lg font-bold">Doctor's Call Interface</h2>
        <button onClick={startCall} className="bg-blue-500 text-white p-2 rounded mt-2">
          Start Call
        </button>
  
        {/* Audio element with ref */}
        {remoteStream && <audio ref={audioRef} controls autoPlay />}
      </div>
    );
  }
