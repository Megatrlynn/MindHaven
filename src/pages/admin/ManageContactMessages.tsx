import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Eye, EyeOff, Trash2, ChevronDown, X } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  created_at: string;
}

const ManageContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'read' | 'responded'>('all');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: 'new' | 'read' | 'responded') => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus } : m));
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessages(messages.filter(m => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const filteredMessages = filterStatus === 'all' 
    ? messages 
    : messages.filter(m => m.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'read':
        return 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'responded':
        return 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      default:
        return 'bg-[var(--mh-surface-soft)] text-[var(--mh-text-muted)] border-[var(--mh-border)]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--mh-text)]  mb-4">Contact Messages</h2>
        
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'new', 'read', 'responded'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === status
                  ? 'bg-cyan-500 text-white'
                    : 'bg-[var(--mh-surface-soft)] text-[var(--mh-text-muted)] hover:bg-[var(--mh-surface)]'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({filteredMessages.filter(m => status === 'all' || m.status === status).length})
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Messages List */}
        <div className="md:col-span-1">
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="py-8 text-center text-[var(--mh-text-muted)]">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No messages</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedMessage?.id === msg.id
                      ? 'bg-cyan-50 dark:bg-cyan-950 border-cyan-300 dark:border-cyan-700'
                      : 'bg-[var(--mh-surface)] border-[var(--mh-border)] hover:bg-[var(--mh-surface-soft)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="truncate text-sm font-semibold text-[var(--mh-text)]">{msg.name}</p>
                    <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(msg.status)}`}>
                      {msg.status}
                    </span>
                  </div>
                  <p className="truncate text-xs text-[var(--mh-text-muted)]">{msg.email}</p>
                  <p className="mt-1 truncate text-xs text-[var(--mh-text-muted)]">{msg.subject}</p>
                  <p className="mt-1 text-xs text-[var(--mh-text-muted)]">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Details */}
        <div className="md:col-span-2">
          {selectedMessage ? (
            <div className="rounded-lg border border-[var(--mh-border)] bg-[var(--mh-surface)] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[var(--mh-text)]">{selectedMessage.name}</h3>
                  <p className="text-sm text-[var(--mh-text-muted)]">{selectedMessage.email}</p>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="rounded p-1 hover:bg-[var(--mh-surface-soft)]"
                >
                  <X className="h-5 w-5 text-[var(--mh-text-muted)]" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(selectedMessage.status)}`}>
                    {selectedMessage.status}
                  </span>
                  <p className="text-xs text-[var(--mh-text-muted)]">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-[var(--mh-text-muted)]">Subject:</p>
                <p className="text-[var(--mh-text)]">{selectedMessage.subject}</p>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-[var(--mh-text-muted)]">Message:</p>
                <div className="rounded-lg border border-[var(--mh-border)] bg-[var(--mh-surface-soft)] p-4">
                  <p className="whitespace-pre-wrap text-[var(--mh-text-muted)]">{selectedMessage.message}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {selectedMessage.status !== 'new' && (
                  <button
                    onClick={() => updateStatus(selectedMessage.id, 'new')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-sm font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    Mark as New
                  </button>
                )}
                {selectedMessage.status !== 'read' && (
                  <button
                    onClick={() => updateStatus(selectedMessage.id, 'read')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900 text-sm font-medium"
                  >
                    <EyeOff className="h-4 w-4" />
                    Mark as Read
                  </button>
                )}
                {selectedMessage.status !== 'responded' && (
                  <button
                    onClick={() => updateStatus(selectedMessage.id, 'responded')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 text-sm font-medium"
                  >
                    <ChevronDown className="h-4 w-4" />
                    Mark as Responded
                  </button>
                )}
                <button
                  onClick={() => deleteMessage(selectedMessage.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 text-sm font-medium ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--mh-border)] bg-[var(--mh-surface)] p-8 text-center">
              <Mail className="mx-auto mb-3 h-12 w-12 text-[var(--mh-text-muted)]" />
              <p className="text-[var(--mh-text-muted)]">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageContactMessages;


