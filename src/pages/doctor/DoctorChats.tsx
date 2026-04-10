import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { DoctorPatientConnection, UserProfile, DoctorPatientChat } from '../../lib/types';
import { MessageSquare, PhoneCall, Video, Check, Clock, UserCircle, X, Send, Loader2, XCircle, Phone, CalendarDays, Search, MessageCircle } from 'lucide-react';
import { io } from "socket.io-client";
import { format } from 'date-fns';

const socket = io(import.meta.env.VITE_SOCKET_SERVER_URL || "https://mindhaven-lwo0.onrender.com");

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
  const [doctorSetupError, setDoctorSetupError] = useState<string | null>(null);
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

  const [callEndMessage, setCallEndMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctorId = async (user: User) => {
      setDoctorSetupError(null);

      try {
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (doctorError) {
          console.error('Error fetching doctor ID:', doctorError);
          setDoctorSetupError('Unable to load therapist profile. Please try again.');
          setLoading(false);
          return;
        }

        if (!doctorData) {
          setDoctorId(null);
          setDoctorSetupError('No therapist profile is linked to this account yet. Please contact an admin to set up your therapist profile.');
          setLoading(false);
          return;
        }

        setDoctorId(doctorData.id);
      } catch (error) {
        console.error('Error in fetchDoctorId:', error);
        setDoctorSetupError('Unable to load therapist profile. Please try again.');
        setLoading(false);
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        fetchDoctorId(user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      if (session?.user) {
        fetchDoctorId(session.user);
      } else {
        setDoctorId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!doctorId) {
      return;
    }

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

    socket.on("call-declined", () => {
      console.log("📴 Call declined by patient");
      setIsCalling(false);
      setCallStatus("Patient declined the call");
      setCallEndMessage("Patient declined the call");
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      setRemoteStream(null);
      setTimeout(() => {
        setCallEndMessage(null);
        setCallStatus("Connecting...");
      }, 3000); // Clear message after 3 seconds
    });

    socket.on("end-call", () => {
      console.log("🔚 Call ended by patient");
      setIsCalling(false);
      setCallStatus("Patient ended the call");
      setCallEndMessage("Patient ended the call");
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      setRemoteStream(null);
      setTimeout(() => {
        setCallEndMessage(null);
        setCallStatus("Connecting...");
      }, 3000); // Clear message after 3 seconds
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-declined");
      socket.off("end-call");
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
          const nextMessage = payload.new as ChatMessage;
          setChatMessages((prev) => (
            prev.some((message) => message.id === nextMessage.id)
              ? prev
              : [...prev, nextMessage]
          ));
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
      const { data, error } = await supabase
        .from('doctor_patient_chats')
        .insert({
          connection_id: activeChatConnection.id,
          sender_id: currentUser.id,
          message: newMessage.trim(),
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();
  
      if (error) throw error;
      setNewMessage('');
      if (data) {
        setChatMessages((prev) => (
          prev.some((message) => message.id === data.id)
            ? prev
            : [...prev, data as ChatMessage]
        ));
      }
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

  useEffect(() => {
    const handleAnswerCall = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("📩 Received answer from patient!");
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async (data: any) => {
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
    };

    socket.on("answer-call", handleAnswerCall);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("answer-call", handleAnswerCall);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, []);
  
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
    
    // Notify the patient that the call ended
    if (selectedPatientId) {
      socket.emit("end-call", { targetSocketId: selectedPatientId });
    }
  };  

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (doctorSetupError) {
    return (
      <div className="p-6 md:p-8">
        <div className="surface-card border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="text-lg font-semibold">Therapist profile unavailable</h2>
          <p className="mt-2 text-sm">{doctorSetupError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {callEndMessage && (
        <div className="fixed top-4 right-4 bg-amber-100 text-amber-900 px-4 py-3 rounded-lg shadow-lg border border-amber-300 z-[60]">
          <p className="font-medium">{callEndMessage}</p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
            <MessageSquare className="h-3.5 w-3.5" />
            Communications Center
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Patient Connections</h2>
          <p className="mt-1 text-sm text-slate-600">Accept requests, start chats, and place voice calls from one workspace.</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          <Phone className="h-4 w-4 text-cyan-700" />
          {connectedPatients.length} connected patients
        </div>
      </div>

      <div className="mb-4">
        <label className="relative block max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search connections"
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-800 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {connections.map((connection) => (
          <div key={connection.id} className="surface-card p-6 transition-transform hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center mb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 shadow-sm">
                <UserCircle className="h-12 w-12 text-slate-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Patient #{connection.patient_id.slice(0, 8)}
                </h3>
                {connection.patient_profile && (
                  <div className="text-sm text-slate-600">
                    <p className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4 text-cyan-700" />
                      {connection.patient_profile.phone || 'Not specified'}
                    </p>
                    {connection.patient_profile.date_of_birth && (
                      <p className="mt-1 inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-cyan-700" />
                        Age: {calculateAge(connection.patient_profile.date_of_birth)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {connection.status === 'pending' ? (
              <div className="mb-4">
                <div className="mb-2 flex items-center text-amber-700">
                  <Clock className="mr-2 h-5 w-5 text-amber-500" />
                  <span>Connection Request Pending</span>
                </div>
                <button
                  onClick={() => acceptConnection(connection.id)}
                  className="btn-primary w-full justify-center bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="mr-2 h-5 w-5" />
                  Accept Connection
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mb-2 flex items-center text-emerald-700">
                  <Check className="mr-2 h-5 w-5 text-emerald-500" />
                  <span>Connected</span>
                </div>

                <button
                  onClick={() => startChat(connection)}
                  className="btn-primary w-full justify-center"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Chat
                </button>

                <button
                  className="btn-primary w-full justify-center"
                  onClick={() => startCall(connection.patient_id)}
                  disabled={isCalling}
                >
                  <PhoneCall className="mr-2 h-5 w-5" />
                  Voice Call
                </button>
              </div>
            )}
          </div>
        ))}

        {connections.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-500">
            No patient connections yet
          </div>
        )}
      </div>

      {isCalling && selectedPatientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-sm p-5 text-center">
            <h2 className="mb-3 text-lg font-bold text-slate-900">{callStatus}</h2>
            {remoteStream ? (
              <audio ref={remoteAudioRef} autoPlay playsInline controls />
            ) : (
              <p className="text-slate-500">Waiting for audio...</p>
            )}

            <button
              className="btn-primary mt-3 w-full justify-center bg-rose-600 hover:bg-rose-700"
              onClick={endCall}
            >
              <XCircle className="mr-2 h-5 w-5" />
              End Call
            </button>
          </div>
        </div>
      )}

      {activeChatConnection && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div className="surface-card flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-5 text-slate-900">
        <div>
          <h3 className="text-lg font-semibold">
            Chat with Patient #{activeChatConnection.patient_id.slice(0, 8)}
          </h3>
          {activeChatConnection.patient_profile?.date_of_birth && (
            <p className="text-sm text-slate-500">
              Age: {calculateAge(activeChatConnection.patient_profile.date_of_birth)}
            </p>
          )}
        </div>
        <button
          onClick={() => setActiveChatConnection(null)}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-5 space-y-5">
        {loadingChat ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-700" />
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
                    isDoctor ? "bg-cyan-700 text-white" : "bg-white text-slate-800 border border-slate-200"}`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
                {showTimestamp && (
                  <p className="mt-1 text-xs text-slate-400">{formattedDate}</p>
                )}
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-slate-200 bg-white p-5">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow rounded-lg border border-slate-300 p-3 shadow-sm transition focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
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
            className="btn-primary h-12 w-12 rounded-lg p-0 disabled:opacity-60"
          >
            {sendingMessage ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Send className="h-6 w-6" />
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