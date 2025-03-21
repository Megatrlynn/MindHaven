import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Review, Question } from '../lib/types';
import { Camera, Loader2, Star, StarOff, Send, MessageCircle } from 'lucide-react';
import { differenceInYears, parseISO } from 'date-fns';

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    phone: '',
    dateOfBirth: '',
    profile_picture: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [reviewData, setReviewData] = useState({
    rating: 0,
    review_text: '',
  });
  const [newQuestion, setNewQuestion] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    loadProfile();
    loadReview();
    loadQuestions();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        username: data.username || '',
        name: data.name || '',
        phone: data.phone || '',
        dateOfBirth: data.date_of_birth || '',
        profile_picture: data.profile_picture || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setReview(data);
        setReviewData({
          rating: data.rating,
          review_text: data.review_text,
        });
      }
    } catch (error) {
      console.error('Error loading review:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null;
    return differenceInYears(new Date(), parseISO(dateOfBirth));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      if (formData.currentPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (passwordError) throw passwordError;
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          username: formData.username || null,
          name: formData.name,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth || null,
          profile_picture: formData.profile_picture,
        })
        .eq('user_id', profile.user_id);

      if (profileError) throw profileError;

      setIsEditing(false);
      await loadProfile();

      if (formData.newPassword) {
        await supabase.auth.signOut();
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewData.rating || !reviewData.review_text.trim()) {
      alert('Please provide both a rating and review text');
      return;
    }

    setSavingReview(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('reviews')
        .upsert({
          user_id: user.id,
          rating: reviewData.rating,
          review_text: reviewData.review_text.trim(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      await loadReview();
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Failed to save review');
    } finally {
      setSavingReview(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!newQuestion.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('questions')
        .insert({
          user_id: user.id,
          question: newQuestion.trim(),
        });

      if (error) throw error;
      setNewQuestion('');
      await loadQuestions();
    } catch (error) {
      console.error('Error submitting question:', error);
      alert('Failed to submit question');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center">
              <div className="relative">
                <img
                  src={formData.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-lg">
                  <Camera className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <div className="ml-6 flex-1">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    profile?.username
                      ? 'bg-gray-50'
                      : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  disabled={!!profile?.username}
                  placeholder={profile?.username ? undefined : 'Choose a username'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userEmail || ''}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    profile?.date_of_birth
                      ? 'bg-gray-50'
                      : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  disabled={!!profile?.date_of_birth}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
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
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center">
              <img
                src={profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <div className="ml-6">
                <h2 className="text-xl font-semibold text-gray-900">{profile?.name || 'No name set'}</h2>
                <p className="text-gray-600">@{profile?.username || 'Username not set'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1">{userEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="mt-1">{profile?.phone || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Age</label>
                <p className="mt-1">
                  {profile?.date_of_birth 
                    ? `${calculateAge(profile.date_of_birth)} years old`
                    : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Rate & Review</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                  className="text-2xl focus:outline-none"
                >
                  {star <= reviewData.rating ? (
                    <Star className="w-8 h-8 text-yellow-400 fill-current" />
                  ) : (
                    <StarOff className="w-8 h-8 text-gray-300" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
            <textarea
              value={reviewData.review_text}
              onChange={(e) => setReviewData({ ...reviewData, review_text: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Share your experience with MedConnect..."
            />
          </div>
          <button
            onClick={handleReviewSubmit}
            disabled={savingReview || !reviewData.rating || !reviewData.review_text.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center"
          >
            {savingReview ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              review ? 'Update Review' : 'Submit Review'
            )}
          </button>
        </div>
      </div>

      {/* Questions Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleQuestionSubmit}
              disabled={!newQuestion.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
            >
              <Send className="w-5 h-5 mr-2" />
              Ask
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium">{question.question}</p>
                    {question.answer ? (
                      <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">{question.answer}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-yellow-600">Awaiting answer...</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(question.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;