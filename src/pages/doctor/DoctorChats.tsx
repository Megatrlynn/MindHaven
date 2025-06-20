import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { DoctorPatientConnection, UserProfile, DoctorPatientChat } from '../../lib/types';
import { MessageSquare, PhoneCall, Video, Check, Clock, UserCircle, X, Send, Loader2, XCircle } from 'lucide-react';
import { io } from "socket.io-client";
import { format } from 'date-fns';

const socket = io(import.meta.env.VITE_SOCKET_SERVER_URL);

interface ExtendedConnection extends DoctorPatientConnection {
  patient_profile: UserProfile;
}

interface ChatMessage extends DoctorPatientChat {
  sender?: {
    name: string;
  };
}

const DoctorChats: React.FC = () => {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [connections, setConnections] = useState<ExtendedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatConnection, setActiveChatConnection] = useState<ExtendedConnection | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  const [connectedPatients, setConnectedPatients] = useState<string[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // const localAudioRef = useRef<HTMLAudioElement | null>(null);
  // const remoteAudioRef = useRef<HTMLAudioElement | null>(null);


  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    const fetchDoctorId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (doctorError) {
          console.error('Error fetching doctor ID:', doctorError);
          return;
        }

        if (doctorData) {
          setDoctorId(doctorData.id);
          console.log('Doctor ID fetched:', doctorData.id);
        }
      } catch (error) {
        console.error('Error in fetchDoctorId:', error);
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        fetchDoctorId();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      if (session?.user) {
        fetchDoctorId();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!doctorId) {
      console.log("Waiting for doctor ID to be fetched...");
      return;
    }

    console.log("Using doctor ID:", doctorId);
    loadConnections();
    fetchConnectedPatients();
    
    socket.emit("register", { userId: doctorId, role: "doctor" });

    socket.on("incoming-call", async ({ offer, from }) => {
      console.log("Received call from:", from);
      await handleOffer(offer, from);
    });

    socket.on("call-answered", async (answer) => {
      console.log("Call answered!");
      await peerConnectionRef.current?.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async (candidate) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
    };
  }, [doctorId]);

  useEffect(() => {
    if (!activeChatConnection) return;
  
    const channel = supabase
      .channel(`doctor-chat-${activeChatConnection.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'doctor_patient_chats',
          filter: `connection_id=eq.${activeChatConnection.id}`,
        },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatConnection]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const fetchConnectedPatients = async () => {
    if (!doctorId) return;

    try {
      const { data, error } = await supabase
        .from("doctor_patient_connections")
        .select("patient_id")
        .eq("doctor_id", doctorId)
        .eq("status", "connected");

      if (error) {
        console.error("Error fetching connected patients:", error);
        return;
      }

      setConnectedPatients(data.map(entry => entry.patient_id));
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const loadConnections = async () => {
    if (!doctorId) return;

    try {
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('doctor_patient_connections')
        .select(`
          *,
          patient_profile:user_profiles(*)
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (connectionsError) throw connectionsError;
      setConnections(connectionsData || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (connectionId: string) => {
    setLoadingChat(true);
    try {
      const { data, error } = await supabase
        .from('doctor_patient_chats')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChatMessages(data || []);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setLoadingChat(false);
    }
  };

  const startChat = async (connection: ExtendedConnection) => {
    setActiveChatConnection(connection);
    await loadChatMessages(connection.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChatConnection || !currentUser) return;
  
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('doctor_patient_chats')
        .insert({
          connection_id: activeChatConnection.id,
          sender_id: currentUser.id,
          message: newMessage.trim(),
          created_at: new Date().toISOString()
        });
  
      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const acceptConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_patient_connections')
        .update({ status: 'connected' })
        .eq('id', connectionId);

      if (error) throw error;
      await loadConnections();
      await fetchConnectedPatients();
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert('Failed to accept connection');
    }
  };

  const calculateAge = (dateOfBirth: string | number | Date) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
  
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
  
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  
    return age;
  };

  const startCall = async (patientId: string) => {
    if (!doctorId) {
      console.error("❌ Doctor ID not available");
      return;
    }
  
    if (!connectedPatients.includes(patientId)) {
      console.error("❌ Cannot call: Patient is not connected!");
      setCallStatus("Call Failed - Patient not connected");
      return;
    }
  
    setIsCalling(true);
    setCallStatus("Connecting...");
    setSelectedPatientId(patientId);
  
    try {
      console.log("🎙️ Requesting microphone access...");
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
      if (!localStream || localStream.getAudioTracks().length === 0) {
        console.error("❌ No audio tracks found!");
        setCallStatus("Microphone Issue - No Audio");
        return;
      }
  
      console.log("🎤 Microphone access granted. Tracks:", localStream.getAudioTracks());
  
      localStreamRef.current = localStream;
  
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = localStream;
        localAudioRef.current.muted = true;
        localAudioRef.current.play().catch((error) => {
          console.warn("🔇 Autoplay blocked. You might need to manually start playback.", error);
        });
      }
  
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnectionRef.current = peerConnection;
  
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
        console.log("📌 Added track:", track.label);
      });
  
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("📡 Sending ICE Candidate:", event.candidate);
          socket.emit("ice-candidate", { 
            targetSocketId: patientId, 
            candidate: event.candidate 
          });
        }
      };
  
      peerConnection.oniceconnectionstatechange = () => {
        console.log("🔄 ICE Connection State:", peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === "connected") {
          console.log("✅ ICE connection established - Call is live!");
          setCallStatus("Connected");
        }
        if (peerConnection.iceConnectionState === "failed") {
          console.error("❌ ICE connection failed");
          setCallStatus("Call Failed - ICE Error");
        }
      };
  
      peerConnection.ontrack = (event) => {
        console.log("🔊 Received remote track:", event.streams[0]);
        setRemoteStream(event.streams[0]);
  
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch((error) => {
            console.error("🔇 Autoplay blocked. Playing manually...", error);
          });
        }
        setCallStatus("Connected");
      };
  
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log("📨 Sending offer:", offer);
  
      socket.emit("call-user", { doctorId, targetUserId: patientId, offer });
    } catch (error) {
      console.error("❌ Error starting call:", error);
      setCallStatus("Call Failed");
    }
  };
  
  socket.on("answer-call", async ({ answer }) => {
    console.log("📩 Received answer from patient!");
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
  });
  
  socket.on("ice-candidate", async (data) => {
    try {
      if (!data || !data.candidate) {
        console.warn("⚠️ Received ICE candidate is missing or invalid:", data);
        return;
      }
  
      console.log("📡 Received ICE candidate:", data);
  
      const candidateData: RTCIceCandidateInit = {
        candidate: typeof data.candidate === "string" ? data.candidate : data.candidate.candidate,
        sdpMid: data.sdpMid ?? null,
        sdpMLineIndex: data.sdpMLineIndex ?? null,
        usernameFragment: data.usernameFragment ?? undefined, 
      };
  
      console.log("🔍 Parsed ICE candidate:", candidateData);
  
      if (!candidateData.candidate || (candidateData.sdpMid === null && candidateData.sdpMLineIndex === null)) {
        console.error("❌ Invalid ICE candidate received (missing sdpMid and sdpMLineIndex)", candidateData);
        return;
      }
  
      const candidate = new RTCIceCandidate(candidateData);
  
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
        console.log("✅ ICE candidate added successfully!");
      } else {
        console.warn("⚠️ PeerConnection not ready. Storing ICE candidate.");
        pendingIceCandidatesRef.current.push(candidateData);
      }
    } catch (error) {
      console.error("❌ Error adding ICE candidate:", error, "Candidate data:", data);
    }
  });  
  
  const handleOffer = async (offer: RTCSessionDescriptionInit, from: string) => {
    try {
      console.log("📞 Incoming call offer...");
  
      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;
  
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;
  
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("📡 Sending ICE Candidate:", event.candidate);
          socket.emit("ice-candidate", {
            targetSocketId: from,
            candidate: event.candidate 
          });
        }
      };
  
      peerConnection.ontrack = (event) => {
        console.log("🔊 Received remote track:", event.streams[0]);
  
        setRemoteStream(event.streams[0]);
  
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch((error) => {
            console.error("🔇 Autoplay blocked. Playing manually...", error);
          });
        }
  
        console.log("✅ Call is now connected!");
        setCallStatus("Connected");
      };
  
      peerConnection.oniceconnectionstatechange = () => {
        console.log("🔄 ICE Connection State:", peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === "connected") {
          console.log("✅ ICE connection established - Call is live!");
          setCallStatus("Connected");
        }
        if (peerConnection.iceConnectionState === "failed") {
          console.error("❌ ICE connection failed");
          setCallStatus("Call Failed - ICE Error");
        }
      };
  
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
  
      console.log("📨 Sending answer back to doctor...");
      socket.emit("answer-call", { targetSocketId: from, answer });
    } catch (error) {
      console.error("❌ Error handling offer:", error);
    }
  };

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]); 
  
  const endCall = () => {
    setIsCalling(false);
    setCallStatus("Call Ended");
    setSelectedPatientId(null);
  
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  
    setRemoteStream(null);
  };  

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Patient Connections</h2>
        <p className="text-gray-600">Manage your patient connections and communications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map((connection) => (
          <div key={connection.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 transition-transform hover:scale-[1.02]">
            <div className="flex items-center mb-5">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center shadow-sm">
                <UserCircle className="w-12 h-12 text-gray-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Patient #{connection.patient_id.slice(0, 8)}
                </h3>
                {connection.patient_profile && (
                  <div className="text-sm text-gray-600">
                    {/* <p>📞 {connection.patient_profile.phone || 'Not specified'}</p> */}
                    {connection.patient_profile.date_of_birth && (
                      <p className="mt-1">🎂 Age: {calculateAge(connection.patient_profile.date_of_birth)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {connection.status === 'pending' ? (
              <div className="mb-4">
                <div className="flex items-center text-yellow-700 mb-2">
                  <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                  <span>Connection Request Pending</span>
                </div>
                <button
                  onClick={() => acceptConnection(connection.id)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition-transform transform hover:scale-105 flex items-center justify-center"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Accept Connection
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center text-green-700 mb-2">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Connected</span>
                </div>

                <button
                  onClick={() => startChat(connection)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center justify-center"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Chat
                </button>

                <button
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center justify-center"
                  onClick={() => startCall(connection.patient_id)}
                  disabled={isCalling}
                >
                  <PhoneCall className="w-5 h-5 mr-2" />
                  Voice Call
                </button>
              </div>
            )}
          </div>
        ))}

        {connections.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No patient connections yet
          </div>
        )}
      </div>

      {isCalling && selectedPatientId && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-5 rounded-lg shadow-lg text-center w-80">
            <h2 className="text-lg font-bold mb-3">{callStatus}</h2>
            {remoteStream ? (
              <audio ref={remoteAudioRef} autoPlay playsInline controls />
            ) : (
              <p className="text-gray-500">Waiting for audio...</p>
            )}

            <button
              className="mt-3 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center w-full"
              onClick={endCall}
            >
              <XCircle className="w-5 h-5 mr-2" />
              End Call
            </button>
          </div>
        </div>
      )}

      {activeChatConnection && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[800px] flex flex-col overflow-hidden">
      <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r text-gray-900">
        <div>
          <h3 className="text-lg font-semibold">
            Chat with Patient #{activeChatConnection.patient_id.slice(0, 8)}
          </h3>
          {activeChatConnection.patient_profile?.date_of_birth && (
            <p className="text-sm opacity-80">
              Age: {calculateAge(activeChatConnection.patient_profile.date_of_birth)}
            </p>
          )}
        </div>
        <button
          onClick={() => setActiveChatConnection(null)}
          className="text-gray-500 hover:text-gray-900 transition duration-300"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50">
        {loadingChat ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isDoctor = msg.sender_id === currentUser?.id;
            const nextMessage = chatMessages[index + 1];
                              
            const showTimestamp = !nextMessage || nextMessage.sender_id !== msg.sender_id;
          
            const messageDate = new Date(msg.created_at);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
          
            let formattedDate;
            if (messageDate.toDateString() === today.toDateString()) {
              formattedDate = `Today, ${format(messageDate, "h:mm a")}`;
            } else if (messageDate.toDateString() === yesterday.toDateString()) {
              formattedDate = `Yesterday, ${format(messageDate, "h:mm a")}`;
            } else {
              formattedDate = format(messageDate, "MMMM d, h:mm a");
            }
            return (
              <div key={msg.id} className={`flex flex-col ${isDoctor ? "items-end" : "items-start"} mb-1`}>
                <div
                  className={`max-w-[75%] rounded-xl p-3 shadow-md ${
                    isDoctor ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
                {showTimestamp && (
                  <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
                )}
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-5 border-t bg-white">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sendingMessage || !newMessage.trim()}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center justify-center shadow-md"
          >
            {sendingMessage ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default DoctorChats;