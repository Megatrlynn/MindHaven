import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, PhoneCall, Bot, Loader2, UserPlus, Clock, Send, ArrowLeft, XCircle, CheckCircle, Check, ShieldCheck, Sparkles, MessageSquareText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getAIResponse } from '../lib/ai';
import { User } from '@supabase/supabase-js';
import { Doctor, DoctorPatientConnection, DoctorPatientChat } from '../lib/types';
import Auth from '../components/Auth';
import { io } from "socket.io-client";
import { format } from "date-fns";

const socket = io(import.meta.env.VITE_SOCKET_SERVER_URL || "https://mindhaven-lwo0.onrender.com");

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  created_at: string;
}

interface DoctorChatMessage extends DoctorPatientChat {
  doctor?: {
    name: string;
  };
  connection?: {
    doctor: Doctor;
  };
}

const Chat: React.FC = () => { 
  const [activeTab, setActiveTab] = useState<'ai' | 'doctor'>('ai');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [connections, setConnections] = useState<DoctorPatientConnection[]>([]);
  const [activeDoctorChat, setActiveDoctorChat] = useState<{
    doctorId: string;
    connectionId: string;
    doctorName: string;
  } | null>(null);
  const [doctorChatMessages, setDoctorChatMessages] = useState<DoctorChatMessage[]>([]);
  const [doctorChatLoading, setDoctorChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);

  const [incomingCall, setIncomingCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const [callerSocketId, setCallerSocketId] = useState<string | null>(null);
  const [storedOffer, setStoredOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [callStatus, setCallStatus] = useState("Waiting for call...");
  const [doctorId, setDoctorId] = useState<string[] | null>(null);
  const [isPatientConnected, setIsPatientConnected] = useState(false); 

  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const [patientId, setPatientId] = useState<string[] | null>(null);

  const [doctorName, setDoctorName] = useState("");
  const isPatientConnectedRef = useRef(false);

  const [callEndMessage, setCallEndMessage] = useState<string | null>(null);

  //const patientId = getPatientId(); // This should return a valid patient ID

  useEffect(() => {
    const fetchPatientIds = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      try {
        const { data, error } = await supabase
          .from('doctor_patient_connections')
          .select('patient_id')
          .eq('patient_id', user.id); 
  
        if (error) {
          console.error('Error fetching patient IDs:', error);
          return;
        }
  
        if (data?.length) {
          const patientIds = data.map(row => row.patient_id);
          const uniquePatientIds = Array.from(new Set(patientIds)); 
          setPatientId(uniquePatientIds); 
          console.log('Unique Patient IDs fetched:', uniquePatientIds);
        }
      } catch (error) {
        console.error('Error in fetchPatientIds:', error);
      }
    };
  
    fetchPatientIds();
  }, []);  

  useEffect(() => {
    const fetchConnectedDoctors = async () => {
      if (!doctorId) return; 
  
      try {
        const { data, error } = await supabase
          .from("doctors")
          .select("id, name") 
          .in("id", doctorId); 
  
        if (error) throw error;
  
        if (data?.length) {
          const callingDoctor = data.find((doc) => doc.id === callerSocketId);
  
          if (callingDoctor) {
            setDoctorName(callingDoctor.name); 
          }
        }
      } catch (err) {
        console.error("âŒ Error fetching doctors:", err);
      }
    };
  
    fetchConnectedDoctors();
  }, [doctorId, callerSocketId]);

  useEffect(() => {
    console.log("UserID ID in useEffect:", user); 
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadChatHistory();
        loadDoctors();
        loadConnections();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null); 
      setLoading(false); 
      if (session?.user) {
        socket.emit("register", { userId: session.user.id, role: "patient" });
        loadChatHistory(); 
        loadDoctors();
        loadConnections();
      } else {
        setChatHistory([]);
        setDoctors([]); 
        setConnections([]); 
      }
    });

    const aiChatChannel = supabase
      .channel('ai-chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_chats',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log(payload.new);
          setChatHistory((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(aiChatChannel);
    };

    // const aiChatChannel = supabase
    //   .channel('ai-chat-updates')
    //   .on('postgres_changes', {
    //     event: 'INSERT',
    //     schema: 'public',
    //     table: 'ai_chats',
    //     filter: `user_id=eq.${user?.id}`,
    //   }, (payload) => {
    //     // Log the payload to verify the structure
    //     console.log('New message payload:', payload);

    //     // Make sure payload.new has the correct structure
    //     if (payload.new) {
    //       setChatHistory((prev) => [
    //         ...prev,
    //         payload.new as ChatMessage, // Ensuring the new data matches the interface
    //       ]);
    //     }
    //   })
    //   .subscribe();

    // return () => {
    //   subscription.unsubscribe();
    // };
    
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    socket.emit("register", { userId: user.id, role: "patient" });

    const handleIncomingCall = ({ offer, from, targetPatientId }: {
      offer: RTCSessionDescriptionInit;
      from: string;
      targetPatientId: string;
    }) => {
      if (targetPatientId !== user.id) {
        return;
      }

      console.log("ðŸ“ž Incoming call for patient:", targetPatientId);
      console.log("ðŸ“ž Incoming call from:", from, "Offer received:", offer);

      setStoredOffer(offer);
      setCallerSocketId(from);
      setIncomingCall(true);
    };

    const handleCallDeclined = () => {
      console.log("ðŸ“´ Call declined by therapist");
      setIncomingCall(false);
      setIsCallActive(false);
      setIsConnected(false);
      setCallEndMessage("Therapist declined the call");
      setTimeout(() => setCallEndMessage(null), 3000); // Clear message after 3 seconds
    };

    const handleEndCall = () => {
      console.log("ðŸ”š Call ended by therapist");
      setIsCallActive(false);
      setIsConnected(false);
      setCallEndMessage("Therapist ended the call");
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      setRemoteStream(null);
      setTimeout(() => setCallEndMessage(null), 3000); // Clear message after 3 seconds
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-declined", handleCallDeclined);
    socket.on("end-call", handleEndCall);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-declined", handleCallDeclined);
      socket.off("end-call", handleEndCall);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!activeDoctorChat) return;

    const doctorChatChannel = supabase
      .channel(`doctor-chat-${activeDoctorChat.connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'doctor_patient_chats',
          filter: `connection_id=eq.${activeDoctorChat.connectionId}`,
        },
        (payload) => {
          const nextMessage = payload.new as DoctorChatMessage;
          setDoctorChatMessages((prev) => (
            prev.some((message) => message.id === nextMessage.id)
              ? prev
              : [...prev, nextMessage]
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(doctorChatChannel);
    };
  }, [activeDoctorChat]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, doctorChatMessages]);

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const loadConnections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('doctor_patient_connections')
        .select('*')
        .eq('patient_id', user.id);
      
      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const connectWithDoctor = async (doctorId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('doctor_patient_connections')
        .insert({
          doctor_id: doctorId,
          patient_id: user.id,
          status: 'pending'
        });

      if (error) throw error;
      
      await loadConnections();
    } catch (error) {
      console.error('Error connecting with doctor:', error);
      alert('Failed to connect with doctor');
    }
  };

  const loadDoctorChatMessages = async (connectionId: string) => {
    setDoctorChatLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctor_patient_chats')
        .select(`
          *,
          connection:doctor_patient_connections(
            doctor:doctors(*)
          )
        `)
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setDoctorChatMessages(data || []);
    } catch (error) {
      console.error('Error loading doctor chat messages:', error);
    } finally {
      setDoctorChatLoading(false);
    }
  };

  const startDoctorChat = async (doctorId: string, connectionId: string, doctorName: string) => {
    setActiveDoctorChat({ doctorId, connectionId, doctorName });
    await loadDoctorChatMessages(connectionId);
  };

  const sendDoctorMessage = async () => {
    if (!message.trim() || !activeDoctorChat || !user) return;

    try {
      const { data, error } = await supabase
        .from('doctor_patient_chats')
        .insert({
          connection_id: activeDoctorChat.connectionId,
          sender_id: user.id,
          message: message.trim()
        })
        .select('*')
        .single();

      if (error) throw error;
      setMessage('');
      if (data) {
        setDoctorChatMessages((prev) => (
          prev.some((message) => message.id === data.id)
            ? prev
            : [...prev, data as DoctorChatMessage]
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const loadChatHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
  
    const { data, error } = await supabase
      .from("ai_chats")
      .select("*")
      .order("created_at", { ascending: true });
  
    if (error) {
      console.error("Error loading chat history:", error);
      return;
    }
  
    setChatHistory(data || []);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
  
    setIsLoading(true);
  
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
  
    if (authError || !user) {
      alert("Please sign in to use the AI chat feature");
      setIsLoading(false);
      return;
    }
  
    try {
      const aiResponse = await getAIResponse(message, user.id); // âœ… PASS user.id here
  
      if (!aiResponse || aiResponse.startsWith("Error")) {
        throw new Error("AI response failed. Please try again.");
      }
  
      const { data, error } = await supabase.from("ai_chats").insert({
        user_id: user.id,
        message: message,
        response: aiResponse.trim(),
      }).select('*').single();
  
      if (error) throw error;
      
      // âœ… Immediately add to UI state without waiting for realtime
      if (data) {
        setChatHistory((prev) => [...prev, data as ChatMessage]);
      }
  
      setMessage("");
    } catch (error) {
      console.error("Chat Error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };  

  useEffect(() => {
    if (!patientId || patientId.length === 0) {
      console.log("â³ Waiting for patient IDs to be fetched...");
      return;
    }
  
    console.log("âœ… Using patient IDs:", patientId);
  
    const fetchConnectionData = async () => {
      try {
        const { data, error } = await supabase
          .from("doctor_patient_connections")
          .select("doctor_id, status")
          .in("patient_id", patientId);
  
        if (error) throw error;
  
        if (data?.length) {
          console.log("ðŸ”„ Fetched connection data:", data);
  
          const connectedDoctors = data
            .filter((entry) => entry.status === "connected")
            .map((entry) => entry.doctor_id);
  
          if (connectedDoctors.length > 0) {
            setDoctorId(connectedDoctors);
            setIsPatientConnected(true); 
            isPatientConnectedRef.current = true;
            console.log("âœ… Patient connected to doctors:", connectedDoctors);
          } else {
            setIsPatientConnected(false); 
            isPatientConnectedRef.current = false;
          }
  
        }
      } catch (err) {
        console.error("âŒ Error fetching connection data:", err);
      }
    };
  
    fetchConnectionData();
  
    socket.on("call-answered", async (answer) => {
      console.log("âœ… Call connected! Setting remote description...");
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
        setIsConnected(true);
        setIsCallActive(true);
        setCallStatus("Connected");
      } else {
        console.error("âŒ PeerConnection is missing when setting remote description!");
      }
    });
  
    socket.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          console.warn("âš ï¸ Storing ICE candidate as PeerConnection is not ready.");
          pendingIceCandidatesRef.current.push(candidate);
        }
      } catch (error) {
        console.error("âŒ Error adding ICE candidate:", error);
      }
    });
  
    return () => {
      socket.off("call-answered");
      socket.off("ice-candidate");
  
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [patientId, isPatientConnected]); 

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((error) => {
        console.error("ðŸ”‡ Autoplay blocked, retrying...", error);
        setTimeout(() => remoteAudioRef.current?.play(), 500);
      });
    }
  }, [remoteStream]);

  const acceptCall = async () => {
    console.log("ðŸ” Checking call data before accepting...");
    if (!incomingCall || !storedOffer || !callerSocketId) {
      console.error("âŒ No incoming call detected or missing required data.");
      return;
    }
  
    console.log(`âœ… Accepting call from: ${callerSocketId}`);
    setIncomingCall(false);
    setCallStatus("Connecting...");
  
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;
  
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null; 
      }
  
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
  
      peerConnectionRef.current = peerConnection;
  
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("ðŸ“¡ Sending ICE candidate:", event.candidate);
          socket.emit("ice-candidate", {
            targetSocketId: callerSocketId,
            candidate: event.candidate 
          });
        } else {
          console.log("âš ï¸ ICE candidate gathering complete");
        }
      };
  
      peerConnection.oniceconnectionstatechange = () => {
        console.log("ðŸ”„ ICE Connection State:", peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === "connected") {
          console.log("âœ… ICE connection established - Call is live!");
          setCallStatus("Connected");
        }
        if (peerConnection.iceConnectionState === "failed") {
          console.error("âŒ ICE connection failed");
          setCallStatus("Call Failed - ICE Error");
        }
      };
  
      peerConnection.ontrack = (event) => {
        console.log("ðŸ”Š Received remote track:", event.streams[0]);
        setRemoteStream(event.streams[0]);
      
        setTimeout(() => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
      
            remoteAudioRef.current.play()
              .then(() => {
                console.log("âœ… Audio playback started successfully");
              })
              .catch((error) => {
                console.error("ðŸ”‡ Autoplay blocked. Waiting for user interaction...", error);
      
                document.addEventListener("click", () => {
                  if (remoteAudioRef.current) {
                    remoteAudioRef.current.play().catch(err => console.error("ðŸ”‡ Still blocked", err));
                  }
                }, { once: true });
              });
          } else {
            console.warn("âš ï¸ remoteAudioRef not available yet!");
          }
        }, 500); 
      };      
  
      await peerConnection.setRemoteDescription(new RTCSessionDescription(storedOffer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
  
      socket.emit("answer-call", { targetSocketId: callerSocketId, answer });
  
      setIsConnected(true);
      setIsCallActive(true);
      setCallStatus("Connected");
    } catch (error) {
      console.error("âŒ Error accepting call:", error);
      setCallStatus("Call Failed");
      setIsCallActive(false);
      setIsConnected(false);
    }
  };  
  
  const declineCall = () => {
    console.log("ðŸ“´ Declining call...");
    setIncomingCall(false);
    setIsConnected(false);
    setIsCallActive(false);
    if (callerSocketId) {
      socket.emit("call-declined", { targetSocketId: callerSocketId });
    }
  };
  
  const endCall = () => {
    console.log("ðŸ”š Ending call...");
    setIsConnected(false);
    setIsCallActive(false);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setRemoteStream(null);
    if (callerSocketId) {
      socket.emit("end-call", { targetSocketId: callerSocketId });
    }
  };
  
  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="content-shell py-12">
        <Auth onSuccess={loadChatHistory} />
      </div>
    );
  }
  
  // if (!user) {
  //   return (
  //     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  //       <Auth onSuccess={loadChatHistory} />
  //     </div>
  //   );
  // }

  return (
    <div className="content-shell py-8 lg:py-10 space-y-6">
      {callEndMessage && (
        <div className="fixed right-4 top-4 z-[60] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-lg dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">{callEndMessage}</p>
        </div>
      )}

      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-md p-6 text-center shadow-2xl animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
              <PhoneCall className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[var(--mh-text)]">Incoming call</h2>
            <p className="mt-2 text-sm text-[var(--mh-text-muted)]">{doctorName ? `${doctorName} is calling...` : 'Your therapist is calling...'}</p>

            <div className="mt-6 flex gap-3">
              <button
                className="btn-primary flex-1 justify-center bg-emerald-600 hover:bg-emerald-700"
                onClick={acceptCall}
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                Accept
              </button>
              <button
                className="btn-subtle flex-1 justify-center bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-200 dark:hover:bg-rose-900"
                onClick={declineCall}
              >
                <XCircle className="w-6 h-6 mr-2" />
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {isCallActive && isConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-md p-6 text-center shadow-2xl animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
              <PhoneCall className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[var(--mh-text)]">{callStatus}</h2>

            <div className="mt-4">
              {remoteStream ? (
                <audio ref={remoteAudioRef} autoPlay playsInline controls className="w-full rounded-lg" />
              ) : (
                <p className="text-sm italic text-[var(--mh-text-muted)]">Waiting for audio...</p>
              )}
            </div>

            <button
              className="btn-primary mt-5 w-full justify-center bg-rose-600 hover:bg-rose-700"
              onClick={endCall}
            >
              <XCircle className="w-6 h-6 mr-2" />
              End Call
            </button>
          </div>
        </div>
      )}

      <div className="surface-card overflow-hidden">
        <div className="border-b border-[var(--mh-border)] bg-[var(--mh-surface-soft)] px-6 py-6 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Patient workspace
              </p>
              <h1 className="mt-3 text-3xl font-bold text-[var(--mh-text)]">Support chat</h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--mh-text-muted)]">
                Chat with the AI assistant or continue a secure conversation with your connected therapist.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--mh-border)] bg-[var(--mh-surface)] px-3 py-2 text-xs font-semibold text-[var(--mh-text-muted)]">
                <Sparkles className="h-3.5 w-3.5 text-cyan-700" />
                AI support available
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--mh-border)] bg-[var(--mh-surface)] px-3 py-2 text-xs font-semibold text-[var(--mh-text-muted)]">
                <MessageSquareText className="h-3.5 w-3.5 text-cyan-700" />
                {connections.length} therapist links
              </span>
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--mh-border)] bg-[var(--mh-surface)] px-6 py-4 md:px-8">
          <div className="flex flex-wrap gap-3">
            <button
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'ai'
                  ? 'bg-cyan-100 text-cyan-900'
                  : 'border border-[var(--mh-border)] text-[var(--mh-text-muted)] hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-900 dark:hover:border-cyan-700 dark:hover:bg-cyan-950 dark:hover:text-cyan-200'
              }`}
              onClick={() => {
                setActiveTab('ai');
                setActiveDoctorChat(null);
              }}
            >
              <Bot className="h-4 w-4" />
              AI Support
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'doctor'
                  ? 'bg-cyan-100 text-cyan-900'
                  : 'border border-[var(--mh-border)] text-[var(--mh-text-muted)] hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-900 dark:hover:border-cyan-700 dark:hover:bg-cyan-950 dark:hover:text-cyan-200'
              }`}
              onClick={() => {
                setActiveTab('doctor');
                setActiveDoctorChat(null);
              }}
            >
              <MessageSquare className="h-4 w-4" />
              Chat with Therapist
            </button>
          </div>
        </div>

        <div className="px-4 py-6 md:px-6 lg:px-8">
          {activeTab === 'ai' ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-[var(--mh-border)] bg-[var(--mh-surface-soft)] px-6 py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                  <Bot className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-[var(--mh-text)]">AI therapy support</h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--mh-text-muted)]">
                  Share your thoughts in a safe space. Receive supportive guidance and coping strategies.
                </p>
              </div>
            
              <div className="mx-auto max-h-[620px] max-w-4xl space-y-5 overflow-y-auto rounded-3xl border border-[var(--mh-border)] bg-[var(--mh-surface)] p-5 shadow-sm md:p-6">
              {chatHistory.map((chat, index) => {
                const nextChat = chatHistory[index + 1];

                const showTimestamp = !nextChat || nextChat;

                const messageDate = new Date(chat.created_at);
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
                  <div key={chat.id} className="space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl bg-cyan-700 p-4 text-white shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">You</p>
                        <p className="mt-1 text-sm leading-6">{chat.message}</p>
                      </div>
                    </div>

                    <div className="flex justify-start mt-2">
                      <div className="max-w-[80%] rounded-2xl border border-[var(--mh-border)] bg-[var(--mh-surface-soft)] p-4 text-[var(--mh-text)] shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">AI Support</p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-6">{chat.response}</p>
                      </div>
                    </div>

                    {showTimestamp && (
                      <p className="text-center text-xs text-[var(--mh-text-muted)]">{formattedDate}</p>
                    )}
                  </div>
                )}
              )}
                <div ref={chatEndRef} />
              </div>
            
              <div className="mx-auto max-w-4xl">
                <div className="surface-card border-[var(--mh-border)] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <textarea
                    className="min-h-[96px] flex-1 rounded-2xl border border-[var(--mh-border)] bg-[var(--mh-surface)] px-4 py-3 text-[var(--mh-text)] shadow-sm placeholder:text-[var(--mh-text-muted)] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:placeholder:text-[var(--mh-text-muted)] dark:focus:border-cyan-500 dark:focus:ring-cyan-900"
                    placeholder="Type your message..."
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    className="btn-primary min-w-[150px] justify-center disabled:opacity-60"
                    onClick={handleSendMessage}
                    disabled={isLoading || !message.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              </div>
            </div>
            </div>
            
          ) : activeDoctorChat ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveDoctorChat(null)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--mh-border)] bg-[var(--mh-surface)] text-[var(--mh-text-muted)] transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-900 dark:hover:border-cyan-700 dark:hover:bg-cyan-950 dark:hover:text-cyan-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mh-text-muted)]">Therapist chat</p>
                  <h2 className="mt-1 text-2xl font-bold text-[var(--mh-text)]">Dr. {activeDoctorChat?.doctorName}</h2>
                </div>
              </div>

              <div className="mx-auto max-h-[620px] max-w-4xl space-y-4 overflow-y-auto rounded-3xl border border-[var(--mh-border)] bg-[var(--mh-surface)] p-5 shadow-sm md:p-6">
                {doctorChatLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-700" />
                  </div>
                ) : (
                  doctorChatMessages.map((msg, index) => {
                    const isCurrentUser = msg.sender_id === user?.id;
                    const nextMessage = doctorChatMessages[index + 1];
                  
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
                      <div key={msg.id} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} mb-1`}>
                        <div
                          className={`max-w-[78%] rounded-2xl p-4 shadow-sm ${
                            isCurrentUser ? 'bg-cyan-700 text-white' : 'border border-[var(--mh-border)] bg-[var(--mh-surface-soft)] text-[var(--mh-text)]'
                          }`}
                        >
                          <p className="text-sm leading-6">{msg.message}</p>
                        </div>
                  
                        {showTimestamp && (
                          <p className="mt-1 text-xs text-[var(--mh-text-muted)]">{formattedDate}</p>
                        )}
                      </div>
                    );
                  })          
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="surface-card border-[var(--mh-border)] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-2xl border border-[var(--mh-border)] bg-[var(--mh-surface)] px-4 py-3 text-[var(--mh-text)] shadow-sm placeholder:text-[var(--mh-text-muted)] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:placeholder:text-[var(--mh-text-muted)] dark:focus:border-cyan-500 dark:focus:ring-cyan-900"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendDoctorMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendDoctorMessage}
                    disabled={!message.trim()}
                    className="btn-primary justify-center disabled:opacity-60"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl border border-[var(--mh-border)] bg-[var(--mh-surface-soft)] px-6 py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-[var(--mh-text)]">Connect with a therapist</h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--mh-text-muted)]">
                  Choose a therapist to start your support journey and open a secure chat when the connection is approved.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {doctors.map((doctor) => {
                  const connection = connections.find(conn => conn.doctor_id === doctor.id);
                  const isPending = connection?.status === 'pending';
                  const isConnected = connection?.status === 'connected';

                  return (
                    <div key={doctor.id} className="surface-card p-5">
                      <div className="flex items-center gap-4">
                        <img
                          src={doctor.profile_picture || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop'}
                          alt={doctor.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-semibold text-[var(--mh-text)]">{doctor.name}</h3>
                          <p className="truncate text-sm text-[var(--mh-text-muted)]">{doctor.profession}</p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl border border-[var(--mh-border)] bg-[var(--mh-surface-soft)] p-4">
                        <p className="text-sm text-[var(--mh-text-muted)]">
                          <span className="font-semibold text-[var(--mh-text)]">Phone:</span> {doctor.phone || 'Not available'}
                        </p>
                      </div>
                      {isPending ? (
                        <div className="mt-4 inline-flex items-center justify-center rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">
                          <Clock className="mr-2 h-4 w-4" />
                          Connection Pending
                        </div>
                      ) : isConnected ? (
                        <div className="mt-4 space-y-4">
                          <div className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                            <Check className="mr-2 h-4 w-4" />
                            Connected
                          </div>

                          <button
                            onClick={() => startDoctorChat(doctor.id, connection.id, doctor.name)}
                            className="btn-primary w-full justify-center"
                          >
                            <MessageSquare className="h-5 w-5" />
                            Start Chat
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => connectWithDoctor(doctor.id)}
                          className="btn-primary mt-4 w-full justify-center"
                        >
                          <UserPlus className="h-5 w-5" />
                          Connect
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
