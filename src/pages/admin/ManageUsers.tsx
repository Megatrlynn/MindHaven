import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../lib/types';
import { Pencil, Trash2, Loader2, X, AlertCircle, Search, UserRound } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    date_of_birth: '',
  });
  const apiBaseUrl = (import.meta.env.VITE_SOCKET_SERVER_URL || 'https://mindhaven-lwo0.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const [{ data: profiles, error: profilesError }, { data: admins, error: adminsError }, { data: doctors, error: doctorsError }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('admins').select('user_id'),
        supabase.from('doctors').select('user_id'),
      ]);

      if (profilesError) throw profilesError;
      if (adminsError) throw adminsError;
      if (doctorsError) throw doctorsError;

      const excludedUserIds = new Set<string>([
        ...(admins || []).map((row) => row.user_id).filter(Boolean),
        ...(doctors || []).map((row) => row.user_id).filter(Boolean),
      ]);

      const patientProfiles = (profiles || []).filter(
        (profile) => profile.user_id && !excludedUserIds.has(profile.user_id)
      );

      setUsers(patientProfiles);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(query) ||
      (user.username || '').toLowerCase().includes(query)
    );
  }); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    setError(null);

    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          username: formData.username,
          name: formData.name,
          date_of_birth: formData.date_of_birth,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      setIsModalOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      name: user.name || '',
      date_of_birth: user.date_of_birth || '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm('Are you sure you want to delete this user? This will remove the auth account too.')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Your admin session has expired. Please sign in again.');
      }

      const response = await fetch(`${apiBaseUrl}/admin/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: user.user_id }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to delete user account');
      }

      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Failed to delete user');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--mh-text)]">Users Management</h2>
        <p className="mt-1 text-sm text-[var(--mh-text-muted)]">Review and maintain patient profile records.</p>
      </div>

      <div className="mb-4">
        <label className="relative block max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mh-text-muted)]" />
          <input
            type="text"
            placeholder="Search by name or username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--mh-border)] bg-[var(--mh-surface)] py-2 pl-10 pr-3 text-sm text-[var(--mh-text)] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />
        </label>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-[var(--mh-surface-soft)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--mh-text-muted)]">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--mh-text-muted)]">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--mh-text-muted)]">
                DOB
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--mh-text-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-[var(--mh-surface)]">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--mh-text-muted)]">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="h-8 w-8 rounded-full" />
                  ) : (
                    <UserRound className="h-4 w-4 text-[var(--mh-text-muted)]" />
                  )}
                  <span className="ml-2">{user.username || '-'}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--mh-text-muted)]">
                  {user.name || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--mh-text-muted)]">
                  {user.date_of_birth || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openModal(user)}
                      className="text-cyan-700 hover:text-cyan-900"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-rose-700 hover:text-rose-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-[var(--mh-text)]">
                <UserRound className="h-5 w-5 text-cyan-700" />
                Edit User Profile
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--mh-text-muted)] hover:text-[var(--mh-text-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-center rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--mh-text-muted)] mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full rounded-lg border border-[var(--mh-border)] px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--mh-text-muted)] mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-[var(--mh-border)] px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--mh-text-muted)] mb-1">
                  Date Of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full rounded-lg border border-[var(--mh-border)] px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;

