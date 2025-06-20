import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Video, PhoneCall, Bot, Loader2, UserPlus, Clock, Send, ArrowLeft, XCircle, CheckCircle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getAIResponse } from '../lib/ai';
import { User } from '@supabase/supabase-js';
import { Doctor, DoctorPatientConnection, DoctorPatientChat } from '../lib/types';
import Auth from '../components/Auth';
import { io } from "socket.io-client";
import { format } from "date-fns";

const socket = io(import.meta.env.VITE_SOCKET_SERVER_URL);

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
  connection: {
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

  const [offer, setOffer] = useState(null);

  const [callerSocketId, setCallerSocketId] = useState<string | null>(null);
  const [storedOffer, setStoredOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [callStatus, setCallStatus] = useState("Waiting for call...");
  const [doctorId, setDoctorId] = useState<string[] | null>(null);
  const [isPatientConnected, setIsPatientConnected] = useState(false); 

  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const [patientId, setPatientId] = useState<string[] | null>(null);

  const [doctorName, setDoctorName] = useState("");

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
        console.error("❌ Error fetching doctors:", err);
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
        async (payload) => {
          const { data, error } = await supabase
            .from('doctor_patient_chats')
            .select(`
              *,
              connection:doctor_patient_connections(
                doctor:doctors(*)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            setDoctorChatMessages((prev) => [...prev, data]);
          }
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
      const { error } = await supabase
        .from('doctor_patient_chats')
        .insert({
          connection_id: activeDoctorChat.connectionId,
          sender_id: user.id,
          message: message.trim()
        });

      if (error) throw error;
      setMessage('');
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
      const aiResponse = await getAIResponse(message, user.id); // ✅ PASS user.id here
  
      if (!aiResponse || aiResponse.startsWith("Error")) {
        throw new Error("AI response failed. Please try again.");
      }
  
      const { error } = await supabase.from("ai_chats").insert({
        user_id: user.id,
        message: message,
        response: aiResponse.trim(),
      });
  
      if (error) throw error;
  
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
      console.log("⏳ Waiting for patient IDs to be fetched...");
      return;
    }
  
    console.log("✅ Using patient IDs:", patientId);
  
    const fetchConnectionData = async () => {
      try {
        const { data, error } = await supabase
          .from("doctor_patient_connections")
          .select("doctor_id, status")
          .in("patient_id", patientId);
  
        if (error) throw error;
  
        if (data?.length) {
          console.log("🔄 Fetched connection data:", data);
  
          const connectedDoctors = data
            .filter((entry) => entry.status === "connected")
            .map((entry) => entry.doctor_id);
  
          if (connectedDoctors.length > 0) {
            setDoctorId(connectedDoctors);
            setIsPatientConnected(true); 
            console.log("✅ Patient connected to doctors:", connectedDoctors);
          } else {
            setIsPatientConnected(false); 
          }
  
          patientId.forEach((id) => {
            socket.emit("register", { userId: id, role: "patient" });
          });
  
          socket.on("incoming-call", ({ offer, from, targetPatientId }) => {
            console.log("📞 Incoming call for patient:", targetPatientId);
            console.log("🆔 Current patient ID:", patientId);
            console.log("📞 Incoming call from:", from, "Offer received:", offer);
            console.log("🟢 Checking patient connection:", isPatientConnected);
            console.log("✅ Connected doctors:", connectedDoctors);
          
            const actualPatientId = Array.isArray(patientId) ? patientId[0] : patientId;

            if (targetPatientId !== actualPatientId) {
              console.warn("❌ This call is not for this patient. Ignoring.");
              return;
            }

            if (isPatientConnected) {
              console.log("✅ Incoming call accepted");
          
              setStoredOffer(offer);
              setCallerSocketId(from);
          
              setIncomingCall(true);
            } else {
              console.warn("❌ Doctor is not connected to the patient. Ignoring call.");
            }
          });
          
        }
      } catch (err) {
        console.error("❌ Error fetching connection data:", err);
      }
    };
  
    fetchConnectionData();
  
    socket.on("call-answered", async (answer) => {
      console.log("✅ Call connected! Setting remote description...");
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
        setIsConnected(true);
        setIsCallActive(true);
        setCallStatus("Connected");
      } else {
        console.error("❌ PeerConnection is missing when setting remote description!");
      }
    });
  
    socket.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          console.warn("⚠️ Storing ICE candidate as PeerConnection is not ready.");
          pendingIceCandidatesRef.current.push(candidate);
        }
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    });
  
    return () => {
      socket.off("incoming-call");
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
        console.error("🔇 Autoplay blocked, retrying...", error);
        setTimeout(() => remoteAudioRef.current?.play(), 500);
      });
    }
  }, [remoteStream]);

  const acceptCall = async () => {
    console.log("🔍 Checking call data before accepting...");
    if (!incomingCall || !storedOffer || !callerSocketId) {
      console.error("❌ No incoming call detected or missing required data.");
      return;
    }
  
    console.log(`✅ Accepting call from: ${callerSocketId}`);
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
          console.log("📡 Sending ICE candidate:", event.candidate);
          socket.emit("ice-candidate", {
            targetSocketId: callerSocketId,
            candidate: event.candidate 
          });
        } else {
          console.log("⚠️ ICE candidate gathering complete");
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
      
        setTimeout(() => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
      
            remoteAudioRef.current.play()
              .then(() => {
                console.log("✅ Audio playback started successfully");
              })
              .catch((error) => {
                console.error("🔇 Autoplay blocked. Waiting for user interaction...", error);
      
                document.addEventListener("click", () => {
                  if (remoteAudioRef.current) {
                    remoteAudioRef.current.play().catch(err => console.error("🔇 Still blocked", err));
                  }
                }, { once: true });
              });
          } else {
            console.warn("⚠️ remoteAudioRef not available yet!");
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
      console.error("❌ Error accepting call:", error);
      setCallStatus("Call Failed");
      setIsCallActive(false);
      setIsConnected(false);
    }
  };  
  
  const declineCall = () => {
    console.log("📴 Declining call...");
    setIncomingCall(false);
    setIsConnected(false);
    setIsCallActive(false);
    if (callerSocketId) {
      socket.emit("call-declined", { targetSocketId: callerSocketId });
    }
  };
  
  const endCall = () => {
    console.log("🔚 Ending call...");
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
  
  const [activeProfession, setActiveProfession] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openDoctorModal = (profession: string) => {
    setActiveProfession(profession);
    setModalVisible(true);
  };

  const closeDoctorModal = () => {
    setModalVisible(false);
    setActiveProfession(null);
  };

  // Optional: Format title
  const formatTitle = (title: string) =>
    title.charAt(0).toUpperCase() + title.slice(1);

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {incomingCall && isPatientConnected &&(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl text-center w-96 transform scale-95 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900">📞 Incoming Call</h2>
            <p className="text-gray-600 mt-2">{doctorName ? `${doctorName} is calling...` : "Therapist is calling..."}</p>
            
            <div className="flex justify-between mt-5">
              <button
                className="flex items-center px-5 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-transform transform hover:scale-105"
                onClick={acceptCall}
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                Accept
              </button>
              <button
                className="flex items-center px-5 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-transform transform hover:scale-105"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl text-center w-96 transform scale-95 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900">{callStatus}</h2>

            <div className="mt-4">
              {remoteStream ? (
                <audio ref={remoteAudioRef} autoPlay playsInline controls className="w-full" />
              ) : (
                <p className="text-gray-500 italic">Waiting for audio...</p>
              )}
            </div>

            <button
              className="mt-5 flex items-center justify-center w-full px-5 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-transform transform hover:scale-105"
              onClick={endCall}
            >
              <XCircle className="w-6 h-6 mr-2" />
              End Call
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg mr-2 ${
                activeTab === 'ai'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => {
                setActiveTab('ai');
                setActiveDoctorChat(null);
              }}
            >
              <Bot className="inline-block w-5 h-5 mr-2" />
              AI Support
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'doctor'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => {
                setActiveTab('doctor');
                setActiveDoctorChat(null);
              }}
            >
              <MessageSquare className="inline-block w-5 h-5 mr-2" />
              Chat with Therapist
            </button>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'ai' ? (
            <div className="py-8 px-4 md:px-8">
              <div className="text-center mb-6">
                <Bot className="w-14 h-14 text-blue-500 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-gray-900">AI Therapy Support</h2>
                <p className="text-gray-600 max-w-lg mx-auto">
                  Share your thoughts in a safe space. Receive supportive guidance and coping strategies.
                </p>
              </div>
            
              <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6 border max-h-[600px] overflow-y-auto">
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
                  <div key={chat.id} className="mb-6 flex flex-col">
                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white p-3 rounded-xl max-w-[75%] shadow-md">
                        <p className="font-medium">You</p>
                        <p className="text-sm">{chat.message}</p>
                      </div>
                    </div>

                    <div className="flex justify-start mt-2">
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-xl max-w-[75%] shadow-md">
                        <p className="font-medium text-blue-700">AI Support</p>
                        <p className="text-sm whitespace-pre-line">{chat.response}</p>
                      </div>
                    </div>

                    {showTimestamp && (
                      <p className="text-xs text-gray-400 text-center mt-2">{formattedDate}</p>
                    )}
                  </div>
                )}
              )}
                <div ref={chatEndRef} />
              </div>
            
              <div className="max-w-3xl mx-auto mt-6">
                <div className="flex items-center space-x-3">
                  <textarea
                    className="flex-grow p-3 border rounded-2xl focus:ring focus:ring-blue-300 shadow-sm"
                    placeholder="Type your message..."
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center justify-center shadow-md"
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
            
          ) : activeDoctorChat ? (
            <div className="py-6 px-4 md:px-8">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setActiveDoctorChat(null)}
                  className="mr-4 text-gray-600 hover:text-gray-900 transition"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Chat with Dr. {activeDoctorChat.doctorName}
                </h2>
              </div>

              <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6 border max-h-[600px] overflow-y-auto">
                {doctorChatLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
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
                      <div key={msg.id} className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} mb-1`}>
                        <div
                          className={`max-w-[75%] rounded-xl p-3 shadow-md ${
                            isCurrentUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                          }`}
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

              <div className="max-w-3xl mx-auto mt-6 flex items-center space-x-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-grow p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
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
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center justify-center shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <MessageSquare className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-center">Connect with a Therapist</h2>
              <p className="text-gray-600 mb-8 text-center">
                Choose a therapist to start your mental health journey
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {["psychologist", "psychotherapist"].map((type) => (
                  <div
                    key={type}
                    className="bg-white border border-blue-400 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
                  >
                    <h3 className="text-2xl font-bold text-blue-600 mb-2 text-center">
                      {formatTitle(type)}s
                    </h3>
                    <p className="text-gray-600 text-center mb-4">
                      {" "}
                      {type === "psychologist"
                        ? "Experts in diagnosing and treating mental disorders through evaluation and therapy."
                        : type === "psychotherapist"
                        ? "Specialists trained to help individuals navigate emotional and psychological challenges through talk therapy."
                        : ""}
                    </p>

                    <button
                      onClick={() => openDoctorModal(type)}
                      className="mx-auto block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                      Click to View
                    </button>
                  </div>
                  ))}
                </div>

            </div>
          )}
        </div>
      </div>

      {modalVisible && activeProfession && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
    <div className="bg-white p-8 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
      <button
        onClick={closeDoctorModal}
        className="absolute top-4 right-4 text-gray-600 hover:text-red-500"
      >
        ❌
      </button>
      <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">
        {formatTitle(activeProfession)}s
      </h2>

      {["connected", "pending", "not_connected"].map((status) => {
        const filtered = doctors
          .filter((doc) => doc.profession.toLowerCase() === activeProfession)
          .filter((doc) => {
            const conn = connections.find(c => c.doctor_id === doc.id);
            if (status === "connected") return conn?.status === "connected";
            if (status === "pending") return conn?.status === "pending";
            return !conn;
          });

        if (filtered.length === 0) return null;

        return (
          <div key={status} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              {status === "connected" && "✅ Connected Doctors"}
              {status === "pending" && "⏳ Pending Connections"}
              {status === "not_connected" && "➕ Available to Connect"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((doctor) => {
                const connection = connections.find(conn => conn.doctor_id === doctor.id);
                return (
                  <div
                    key={doctor.id}
                    className="bg-gray-50 border rounded-lg p-4 flex items-center"
                  >
                    <img
                      src={
                        doctor.profile_picture ||
                        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop"
                      }
                      alt={doctor.name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h4 className="text-md font-semibold">{doctor.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{doctor.profession}</p>
                      {connection?.status === "connected" ? (
                        <button
                          onClick={() => {
                            startDoctorChat(doctor.id, connection.id, doctor.name);
                            closeDoctorModal();
                          }}
                          className="px-4 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Chat
                        </button>

                      ) : connection?.status === "pending" ? (
                        <span className="text-yellow-700 text-sm font-medium">
                          Pending...
                        </span>
                      ) : (
                        <button
                          onClick={() => connectWithDoctor(doctor.id)}
                          className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

    </div>
  );
};

export default Chat;