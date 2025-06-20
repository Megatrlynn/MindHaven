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
  const [questions, setQuestions] = useState<
    { id: number; question: string; created_at: string; answer?: string }[]
  >([]);
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    loadReview();
    loadQuestions();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || null);

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

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };

    getUserId();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("username, name, phone, date_of_birth, profile_picture")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      const requiredFields = [
        { key: "username", label: "Username" },
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "date_of_birth", label: "Date of Birth" },
        { key: "profile_picture", label: "Profile Picture" },
      ];

      const missing = requiredFields
        .filter(field => !(data as Record<string, any>)?.[field.key])
        .map(field => field.label);

      setMissingFields(missing);
    };

    if (userId) fetchProfile();
  }, [userId]);

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
    if (!newQuestion.trim() || isSubmitting) return;
  
    setIsSubmitting(true);
  
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newQuestionObj = {
        id: Date.now(),
        question: newQuestion.trim(),
        created_at: new Date().toISOString(),
      };
      
      setQuestions(prev => [newQuestionObj, ...prev]);
      setNewQuestion(''); 
    } catch (error) {
      console.error("❌ Error submitting question:", error);
      alert("Failed to submit question");
    } finally {
      setIsSubmitting(false); 
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Section */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        
          <>
            {missingFields.length > 0 && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md shadow-md animate-pulse mb-4">
                <p className="font-semibold mb-1">⚠️ Some of your profile details are missing!</p>
                <p>
                  Please update the following fields to complete your profile:{" "}
                  <span className="font-medium">{missingFields.join(", ")}</span>
                </p>
              </div>
            )}

            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md shadow mb-4">
              <p className="font-medium">🔒 Your personal information is private</p>
              <p className="text-sm">
                Your details will never be shared unless you explicitly choose to do so.
              </p>
            </div>
          </>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">My Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={formData.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg">
                  <Camera className="w-5 h-5 text-gray-600" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-lg font-medium text-gray-700 mb-2">Profile Picture URL</label>
                <input
                  type="url"
                  value={formData.profile_picture}
                  onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl ${profile?.username ? 'bg-gray-100' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                  disabled={!!profile?.username}
                  placeholder={profile?.username ? undefined : 'Choose a username'}
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={userEmail || ''}
                  disabled
                  className="w-full px-4 py-3 border rounded-xl bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl ${profile?.date_of_birth ? 'bg-gray-100' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                  disabled={!!profile?.date_of_birth}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Change Password Section */}
            <div className="border-t pt-8">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Change Password</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-6 mt-8">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center space-x-6">
              <img
                src={profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{profile?.name || 'No name set'}</h2>
                <p className="text-gray-600">@{profile?.username || 'Username not set'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-medium text-gray-600">Email</label>
                <p className="mt-2">{userEmail}</p>
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-600">Phone</label>
                <p className="mt-2">{profile?.phone || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-600">Age</label>
                <p className="mt-2">{profile?.date_of_birth ? `${calculateAge(profile.date_of_birth)} years old` : 'Not set'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Section */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-semibold mb-6">Rate & Review</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex space-x-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                  className="text-3xl focus:outline-none"
                >
                  {star <= reviewData.rating ? (
                    <Star className="w-10 h-10 text-yellow-400 fill-current" />
                  ) : (
                    <StarOff className="w-10 h-10 text-gray-300" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Review</label>
            <textarea
              value={reviewData.review_text}
              onChange={(e) => setReviewData({ ...reviewData, review_text: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={5}
              placeholder="Share your experience with MedConnect..."
            />
          </div>

          <button
            onClick={handleReviewSubmit}
            disabled={savingReview || !reviewData.rating || !reviewData.review_text.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center"
          >
            {savingReview ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Saving...
              </>
            ) : (
              review ? 'Update Review' : 'Submit Review'
            )}
          </button>
        </div>
      </div>

      {/* Questions Section */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
            <button
              onClick={handleQuestionSubmit}
              disabled={isSubmitting || !newQuestion.trim()}
              className={`px-4 py-2 text-white rounded-xl flex items-center transition-all
                ${isSubmitting ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Ask
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="border rounded-2xl p-4">
                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium">{question.question}</p>
                    {question.answer ? (
                      <div className="mt-2 bg-blue-50 p-3 rounded-lg">
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