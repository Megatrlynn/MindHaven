import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Doctor } from '../../lib/types';
import { Loader2, Camera } from 'lucide-react';

const DoctorProfile = () => {
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    profile_picture: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        profile_picture: data.profile_picture || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          name: formData.name,
          phone: formData.phone,
          profile_picture: formData.profile_picture,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
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
        <h2 className="text-xl font-semibold text-gray-900">My Profile</h2>
        <p className="text-gray-600">Update your profile information</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-6">
          <div className="flex items-center">
            <div className="relative">
              <img
                src={formData.profile_picture || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop'}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-lg">
                <Camera className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture URL
              </label>
              <input
                type="url"
                value={formData.profile_picture}
                onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
};

export default DoctorProfile;