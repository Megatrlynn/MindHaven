import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Doctor } from '../../lib/types';
import { Pencil, Trash2, Plus, Loader2, X } from 'lucide-react';

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

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) {
          if (authError.message === 'User already registered') {
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(formData.email);
            if (userError) throw userError;
            
            if (!userData?.user?.id) {
              throw new Error('Could not find user with this email');
            }

            const { data: existingDoctor } = await supabase
              .from('doctors')
              .select('id')
              .eq('user_id', userData.user.id)
              .single();

            if (existingDoctor) {
              throw new Error('A doctor profile already exists for this email');
            }

            const { error: profileError } = await supabase
              .from('doctors')
              .insert({
                user_id: userData.user.id,
                name: formData.name,
                profession: formData.profession,
                phone: formData.phone,
                profile_picture: formData.profile_picture,
              });

            if (profileError) throw profileError;
          } else {
            throw authError;
          }
        } else if (authData.user) {
          const { error: profileError } = await supabase
            .from('doctors')
            .insert({
              user_id: authData.user.id,
              name: formData.name,
              profession: formData.profession,
              phone: formData.phone,
              profile_picture: formData.profile_picture,
            });

          if (profileError) throw profileError;
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
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', doctorId);

      if (error) throw error;
      loadDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor');
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
    "Select a profession",
    "Psychotherapist",
    "Psychologist",
  ];
  
  if (loading && doctors.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Manage Therapists</h2>

        <div className="flex-1 w-full md:mr-4">
          <input
            type="text"
            placeholder="🔍 Search by Name, Profession, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ml-4 px-4 py-2 rounded-[100px] border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Therapist
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profession
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
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
                      <div className="text-sm font-medium text-gray-900">
                        {doctor.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {doctor.profession}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {doctor.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openModal(doctor)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doctor.id)}
                    className="text-red-600 hover:text-red-900"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingDoctor ? 'Edit Therapist' : 'Add New Therapist'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {!editingDoctor && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="example@doc.com"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profession
                </label>
                <select
                  required
                  value={formData.profession}
                  onChange={(e) =>
                    setFormData({ ...formData, profession: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
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

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={formData.profile_picture}
                  onChange={(e) =>
                    setFormData({ ...formData, profile_picture: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Save'
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