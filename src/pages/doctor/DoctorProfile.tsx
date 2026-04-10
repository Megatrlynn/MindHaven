import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Doctor } from '../../lib/types';
import { Loader2, Camera, UserRound, Phone, Mail, Edit3, KeyRound, Save, XCircle } from 'lucide-react';

const DoctorProfile = () => {
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);
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
      if (!user) {
        setLoading(false);
        return;
      }
  
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
  
      if (error) throw error;
      if (!data) {
        setProfileMissing(true);
        return;
      }

      setProfileMissing(false);
      
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
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-700"></div>
      </div>
    );
  }

  if (profileMissing) {
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <h2 className="text-lg font-semibold">Therapist profile unavailable</h2>
          <p className="mt-2 text-sm">
            No therapist profile is linked to this account yet. Please contact an admin to set up your therapist profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 px-4 py-6 md:px-6 md:py-8">
      <div className="surface-card mx-auto w-full max-w-4xl overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
                <UserRound className="h-3.5 w-3.5" />
                Therapist Profile
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">My Profile</h2>
              <p className="mt-1 text-sm text-slate-600">Update your public therapist details and credentials.</p>
            </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
          <div className="border-b border-slate-200 bg-white p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
            <img
              src={
                formData.profile_picture ||
                "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop"
              }
              alt="Profile"
              className="h-32 w-32 rounded-full object-cover shadow-md"
            />
            {isEditing && (
              <div className="absolute bottom-1 right-1 cursor-pointer rounded-full bg-white p-2 shadow-md">
                <Camera className="h-5 w-5 text-slate-600" />
              </div>
            )}
          </div>
            
          {!isEditing ? (
            <div className="mt-4 text-center">
              <h3 className="text-xl font-semibold text-slate-900">{formData.name || 'Your Name'}</h3>
              <p className="mt-1 inline-flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4 text-cyan-700" />
                {formData.phone || 'No phone number'}
              </p>
            </div>
          ) : null}
          </div>
          </div>

          <div className="bg-slate-50 p-6">
            {!isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="surface-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{formData.name || 'Your Name'}</p>
                </div>
                <div className="surface-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{formData.phone || 'No phone number'}</p>
                </div>
                <div className="surface-card p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile Picture URL</p>
                  <p className="mt-2 break-all text-sm text-slate-600">{formData.profile_picture || 'Not set'}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Profile Picture URL</label>
                    <input
                      type="url"
                      value={formData.profile_picture}
                      onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    />
                  </div>
                </div>

                <div className="surface-card border-slate-200 bg-white p-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-900"
                  >
                    <KeyRound className="h-4 w-4" />
                    {showPasswordFields ? 'Hide password update' : 'Change password'}
                  </button>

                  {showPasswordFields && (
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
                        <input
                          type="password"
                          value={formData.current_password}
                          onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
                        <input
                          type="password"
                          value={formData.new_password}
                          onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</label>
                        <input
                          type="password"
                          value={formData.confirm_password}
                          onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setShowPasswordFields(false);
                    }}
                    className="btn-subtle"
                  >
                    <XCircle className="h-4 w-4" />
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default DoctorProfile;