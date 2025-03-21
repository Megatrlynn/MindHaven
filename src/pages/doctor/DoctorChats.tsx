import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { DoctorPatientConnection, UserProfile, DoctorPatientChat } from '../../lib/types';
import { MessageSquare, PhoneCall, Video, Check, Clock, UserCircle, X, Send, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

interface ExtendedConnection extends DoctorPatientConnection {
  patient_profile: UserProfile;
}

interface ChatMessage extends DoctorPatientChat {
  sender?: {
    name: string;
  };
}

const DoctorChats = () => {
  const [connections, setConnections] = useState<ExtendedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatConnection, setActiveChatConnection] = useState<ExtendedConnection | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        loadConnections();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      if (session?.user) {
        loadConnections();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
          setChatMessages((prev) => [...prev, payload.new as ChatMessage]); // Explicitly cast payload.new
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

  const loadConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError) throw doctorError;

      setCurrentDoctorId(doctorData.id);

      const { data: connectionsData, error: connectionsError } = await supabase
        .from('doctor_patient_connections')
        .select(`
          *,
          patient_profile:user_profiles(*)
        `)
        .eq('doctor_id', doctorData.id)
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
      setChatMessages(data || []); // Load initial messages
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setLoadingChat(false);
    }
  };

  // Real-time listener for new messages
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
          const newMessage = payload.new as ChatMessage; // 👈 Explicit type assertion
          setChatMessages((prev) => [...prev, newMessage]); // Append new message in real time
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Cleanup on unmount
    };
  }, [activeChatConnection]);

  const startChat = async (connection: ExtendedConnection) => {
    setActiveChatConnection(connection);
    await loadChatMessages(connection.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChatConnection || !currentUser) return;
  
    setSendingMessage(true);
    try {
      // const newChatMessage: ChatMessage = {
      //   id: uuidv4(), // Generate a new unique ID for the message
      //   connection_id: activeChatConnection.id,
      //   sender_id: currentUser.id,
      //   message: newMessage.trim(),
      //   created_at: new Date().toISOString(),
      // };
  
      // Only insert the message to the database
      const { data, error } = await supabase
        .from('doctor_patient_chats')
        .insert({
          connection_id: activeChatConnection.id,
          sender_id: currentUser.id,
          message: newMessage.trim(),
          created_at: new Date().toISOString()
        })
        // .select()
        // .single(); // Get the newly created record
  
      if (error) throw error;
  
      // Add the real message from the database to the chat state
      if (data) {
        setChatMessages((prev) => [...prev, data]); // Add the new message to the chat state
      }
  
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
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert('Failed to accept connection');
    }
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
          <div key={connection.id} className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <UserCircle className="w-10 h-10 text-gray-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Patient #{connection.patient_id.slice(0, 8)}
                </h3>
                {connection.patient_profile && (
                  <div>
                    <p className="text-sm text-gray-600">
                      Age: {connection.patient_profile.age || 'Not specified'}
                    </p>
                    {connection.patient_profile.medical_history && (
                      <p className="text-sm text-gray-600 mt-1">
                        History: {connection.patient_profile.medical_history.slice(0, 50)}
                        {connection.patient_profile.medical_history.length > 50 ? '...' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {connection.status === 'pending' ? (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="text-yellow-700">Connection Request Pending</span>
                </div>
                <button
                  onClick={() => acceptConnection(connection.id)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Accept Connection
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center mb-2">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-green-700">Connected</span>
                </div>
                <button 
                  onClick={() => startChat(connection)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Chat
                </button>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 mr-2" />
                  Voice Call
                </button>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center">
                  <Video className="w-5 h-5 mr-2" />
                  Video Call
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

      {/* Chat Modal */}
      {activeChatConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  Chat with Patient #{activeChatConnection.patient_id.slice(0, 8)}
                </h3>
                {activeChatConnection.patient_profile?.age && (
                  <p className="text-sm text-gray-600">
                    Age: {activeChatConnection.patient_profile.age}
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveChatConnection(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingChat ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isDoctor = msg.sender_id === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isDoctor ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isDoctor ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">{isDoctor ? "You" : "Patient"}</p>
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
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