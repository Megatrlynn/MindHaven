import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Doctor } from '../../lib/types';
import { Loader2, Camera } from 'lucide-react';

const DoctorProfile = () => {
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [formData, setFormData] = useState({
    profile_picture: "",
    name: "",
    phone: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
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
        current_password: '',  
        new_password: '',
        confirm_password: ''
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
      const updates: any = {
        name: formData.name,
        phone: formData.phone,
        profile_picture: formData.profile_picture,
        updated_at: new Date().toISOString(),
      };
  
      if (formData.current_password && formData.new_password && formData.confirm_password) {
        if (formData.new_password !== formData.confirm_password) {
          alert('New password and confirmation do not match.');
          setSaving(false);
          return;
        }
  
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user?.email) {
          alert('Unable to verify your account. Please re-login.');
          setSaving(false);
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email, 
          password: formData.current_password,
        });
  
        if (signInError) {
          alert('Current password is incorrect.');
          setSaving(false);
          return;
        }
  
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.new_password,
        });
  
        if (passwordError) throw passwordError;
      }
  
      const { error } = await supabase.from('doctors').update(updates).eq('id', profile.id);
      if (error) throw error;
  
      await loadProfile();
      alert('Profile updated successfully.');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
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
    <div className="flex justify-center items-center min-h-[500px] bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Edit
            </button>
          )}
        </div>
  
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={
                formData.profile_picture ||
                "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop"
              }
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover shadow-md"
            />
            {isEditing && (
              <div className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-md cursor-pointer">
                <Camera className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
  
          {!isEditing ? (
            <div className="mt-4 text-center">
              <h3 className="text-xl font-semibold text-gray-900">{formData.name || "Your Name"}</h3>
              <p className="text-gray-600 mt-1">📞 {formData.phone || "No phone number"}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full mt-6">
              <div className="mb-4">
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
  
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
  
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
  
              {/* Password Update Section */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  className="text-blue-600 text-sm underline"
                >
                  {showPasswordFields ? "Cancel Password Update" : "Change Password"}
                </button>
  
                {showPasswordFields && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow-sm">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={formData.current_password}
                        onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={formData.new_password}
                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={formData.confirm_password}
                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
  
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setShowPasswordFields(false);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                >
                  {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
  
};

export default DoctorProfile;