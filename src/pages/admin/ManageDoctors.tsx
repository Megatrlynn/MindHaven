import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Doctor } from '../../lib/types';
import { Pencil, Trash2, Plus, Loader2, X, Search, Stethoscope, Phone, UserRound } from 'lucide-react';

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    profession: '',
    phone: '',
    profile_picture: '',
  });
  const apiBaseUrl = (import.meta.env.VITE_SOCKET_SERVER_URL || 'https://mindhaven-lwo0.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      alert('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const query = searchQuery.toLowerCase();
    return (
      (doctor.name || '').toLowerCase().includes(query) ||
      (doctor.profession || '').toLowerCase().includes(query) ||
      (doctor.phone || '').toLowerCase().includes(query)
    );
  });  
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingDoctor) {
        const { error } = await supabase
          .from('doctors')
          .update({
            name: formData.name,
            profession: formData.profession,
            phone: formData.phone,
            profile_picture: formData.profile_picture,
          })
          .eq('id', editingDoctor.id);

        if (error) throw error;
      } else {
        const emailDomain = formData.email.split('@')[1]?.split('.')[0];
        if (emailDomain !== 'doc') {
          throw new Error('Doctor email must use the format: example@doc.com');
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Your admin session has expired. Please sign in again.');
        }

        const response = await fetch(`${apiBaseUrl}/admin/create-doctor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            profession: formData.profession,
            phone: formData.phone,
            profile_picture: formData.profile_picture,
          }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || 'Failed to create therapist account');
        }
      }

      setIsModalOpen(false);
      loadDoctors();
    } catch (error: any) {
      console.error('Error saving doctor:', error);
      setError(error.message || 'Failed to save doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doctorId: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Your admin session has expired. Please sign in again.');
      }

      const doctor = doctors.find((entry) => entry.id === doctorId);
      if (!doctor?.user_id) {
        throw new Error('Could not determine therapist account to delete');
      }

      const response = await fetch(`${apiBaseUrl}/admin/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: doctor.user_id }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to delete therapist account');
      }

      loadDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete doctor');
    }
  };

  const openModal = (doctor?: Doctor) => {
    setError(null);
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        email: '',
        password: '',
        name: doctor.name,
        profession: doctor.profession,
        phone: doctor.phone || '',
        profile_picture: doctor.profile_picture || '',
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        profession: '',
        phone: '',
        profile_picture: '',
      });
    }
    setIsModalOpen(true);
  };

  const therapistProfessions = [
    "Clinical Psychologist",
    "Counseling Psychologist",
    "Marriage and Family Therapist",
    "Licensed Clinical Social Worker",
    "Psychiatrist",
    "Addiction Counselor",
    "Child Psychologist",
    "School Counselor",
    "Rehabilitation Counselor",
    "Art Therapist",
    "Music Therapist",
    "Behavioral Therapist",
    "Trauma Therapist",
    "Grief Counselor",
    "Sex Therapist",
    "Occupational Therapist",
  ];
  
  if (loading && doctors.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--mh-text)]">Therapists Management</h2>
          <p className="mt-1 text-sm text-[var(--mh-text-muted)]">Add, update, and curate verified therapist profiles.</p>
        </div>

        <button
          onClick={() => openModal()}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add Therapist
        </button>
      </div>

      <div className="mb-4">
        <label className="relative block max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mh-text-muted)]" />
          <input
            type="text"
            placeholder="Search by name, profession, or phone"
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
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--mh-text-muted)]">
                Profession
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--mh-text-muted)]">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--mh-text-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-[var(--mh-surface)]">
            {filteredDoctors.map((doctor) => (
              <tr key={doctor.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {doctor.profile_picture && (
                      <img
                        className="h-10 w-10 rounded-full mr-3"
                        src={doctor.profile_picture}
                        alt={doctor.name}
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-[var(--mh-text)]">
                        {doctor.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--mh-text-muted)]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mh-surface-soft)] px-2 py-1 text-xs font-medium text-[var(--mh-text-muted)]">
                    <Stethoscope className="h-3 w-3" />
                    {doctor.profession}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--mh-text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-[var(--mh-text-muted)]" />
                    {doctor.phone || '-'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <button
                    onClick={() => openModal(doctor)}
                    className="mr-4 text-cyan-700 hover:text-cyan-900"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doctor.id)}
                    className="text-rose-700 hover:text-rose-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--mh-text)] inline-flex items-center gap-2">
                <UserRound className="h-5 w-5 text-cyan-700" />
                {editingDoctor ? 'Edit Therapist' : 'Add New Therapist'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--mh-text-muted)] hover:text-[var(--mh-text-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {!editingDoctor && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--mh-text-muted)]">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full rounded-lg border border-[var(--mh-border)] px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                      placeholder="example@doc.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--mh-text-muted)]">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full rounded-lg border border-[var(--mh-border)] px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--mh-text-muted)]">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--mh-border)] px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--mh-text-muted)]">
                  Profession
                </label>
                <select
                  required
                  value={formData.profession}
                  onChange={(e) =>
                    setFormData({ ...formData, profession: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--mh-border)] px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                >
                  <option value="" disabled>
                    Select a profession
                  </option>
                  {therapistProfessions.map((profession) => (
                    <option key={profession} value={profession}>
                      {profession}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--mh-text-muted)]">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--mh-border)] px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[var(--mh-text-muted)]">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={formData.profile_picture}
                  onChange={(e) =>
                    setFormData({ ...formData, profile_picture: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--mh-border)] px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 pt-1">
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
                  className="btn-primary disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Save Profile'
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

export default ManageDoctors;

