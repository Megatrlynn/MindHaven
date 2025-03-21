import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Video, PhoneCall, Bot, Loader2, UserPlus, Clock, Send, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getAIResponse } from '../lib/ai';
import { Doctor, DoctorPatientConnection, DoctorPatientChat } from '../lib/types';
import Auth from '../components/Auth';

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

const Chat = () => {
  const [activeTab, setActiveTab] = useState<'ai' | 'doctor'>('ai');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState(null);
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

  useEffect(() => {
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

    // Subscribe to AI chat updates
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

    // Subscribe to doctor chat updates
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
  
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      alert('Please sign in to use the AI chat feature');
      setIsLoading(false);
      return;
    }
  
    try {
      const aiResponse = await getAIResponse(message);
  
      if (!aiResponse || aiResponse.startsWith("Error")) {
        throw new Error("AI response failed. Please try again.");
      }
  
      const { error } = await supabase
        .from('ai_chats')
        .insert({
          user_id: user.id,
          message: message,
          response: aiResponse.trim(),
        });
  
      if (error) throw error;
      setMessage('');
    } catch (error) {
      console.error("Chat Error:", error);
      alert(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Auth onSuccess={loadChatHistory} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            <div className="py-8">
              <Bot className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-center">AI Therapy Support</h2>
              <p className="text-gray-600 mb-4 text-center">
                Share your thoughts and feelings in a safe space. Get supportive guidance and coping strategies.
              </p>
              
              <div className="max-w-2xl mx-auto mb-8 max-h-[600px] overflow-y-auto">
                {chatHistory.map((chat) => (
                  <div key={chat.id} className="mb-6 border-b pb-4">
                    <div className="bg-gray-50 p-3 rounded-lg mb-2">
                      <p className="font-medium text-gray-700">You:</p>
                      <p className="text-gray-600">{chat.message}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium text-blue-700">AI Support:</p>
                      <p className="text-gray-600 whitespace-pre-line">{chat.response}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(chat.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} /> {/* Scroll to this element */}
              </div>

              <div className="max-w-2xl mx-auto">
                <textarea
                  className="w-full p-3 border rounded-lg mb-4"
                  placeholder="Share your thoughts, feelings, or ask any question. I'm here to help..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center"
                  onClick={handleSendMessage}
                  disabled={isLoading || !message.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </div>
            </div>
          ) : activeDoctorChat ? (
            <div className="py-4">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setActiveDoctorChat(null)}
                  className="mr-4 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold">Chat with Dr. {activeDoctorChat.doctorName}</h2>
              </div>

              <div className="max-h-[600px] overflow-y-auto mb-4 space-y-4">
                {doctorChatLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  doctorChatMessages.map((msg) => {
                    const isCurrentUser = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">
                            {isCurrentUser ? 'You' : `Dr. ${msg.connection.doctor.name}`}
                          </p>
                          <p>{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => {
                  const connection = connections.find(conn => conn.doctor_id === doctor.id);
                  const isPending = connection?.status === 'pending';
                  const isConnected = connection?.status === 'connected';

                  return (
                    <div key={doctor.id} className="bg-white rounded-lg shadow p-6 border">
                      <div className="flex items-center mb-4">
                        <img
                          src={doctor.profile_picture || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop'}
                          alt={doctor.name}
                          className="w-16 h-16 rounded-full object-cover mr-4"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                          <p className="text-sm text-gray-600">{doctor.profession}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span> {doctor.phone || 'Not available'}
                        </p>
                      </div>
                      {isPending ? (
                        <div className="flex items-center justify-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                          <Clock className="w-5 h-5 mr-2" />
                          Connection Pending
                        </div>
                      ) : isConnected ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 rounded-lg mb-2">
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Connected
                          </div>
                          <button
                            onClick={() => startDoctorChat(doctor.id, connection.id, doctor.name)}
                            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Start Chat
                          </button>
                          <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <PhoneCall className="w-5 h-5 mr-2" />
                            Voice Call
                          </button>
                          <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <Video className="w-5 h-5 mr-2" />
                            Video Call
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => connectWithDoctor(doctor.id)}
                          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <UserPlus className="w-5 h-5 mr-2" />
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