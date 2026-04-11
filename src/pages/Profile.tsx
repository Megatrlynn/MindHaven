import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Review } from '../lib/types';
import { Camera, Loader2, Star, StarOff, Send, MessageCircle, UserRound, Mail, Phone, CalendarDays, Sparkles, ShieldCheck, MessageSquareText, Clock3, CheckCircle2, XCircle, Edit3, Save, KeyRound, Activity } from 'lucide-react';
import { differenceInYears, parseISO } from 'date-fns';

interface PatientConnection {
  id: string;
  doctor_id: string;
  patient_id: string;
  status: 'pending' | 'connected';
  created_at: string;
  updated_at: string;
  doctor?: {
    id: string;
    name: string;
    profession: string;
    phone: string | null;
    profile_picture: string | null;
  } | null;
}

const PROFILE_REQUIREMENTS = [
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Full name' },
  { key: 'phone', label: 'Phone number' },
  { key: 'date_of_birth', label: 'Date of birth' },
] as const;

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [connections, setConnections] = useState<PatientConnection[]>([]);
  const [questions, setQuestions] = useState<
    { id: string; question: string; created_at: string; answer?: string | null; status?: 'pending' | 'answered' }[]
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
  const [questionToast, setQuestionToast] = useState<string | null>(null);
  const questionToastTimerRef = useRef<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProfile();
    loadReview();
    loadConnections();
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

  const loadConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('doctor_patient_connections')
        .select(`
          id,
          doctor_id,
          patient_id,
          status,
          created_at,
          updated_at,
          doctor:doctors(id, name, profession, phone, profile_picture)
        `)
        .eq('patient_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
        const normalizedConnections = (data || []).map((entry: any) => ({
          ...entry,
          doctor: Array.isArray(entry.doctor) ? entry.doctor[0] ?? null : entry.doctor ?? null,
        }));

        setConnections(normalizedConnections as PatientConnection[]);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null;
    return differenceInYears(new Date(), parseISO(dateOfBirth));
  };

  const profileFields = [profile?.username, profile?.name, profile?.phone, profile?.date_of_birth, profile?.profile_picture].filter(Boolean).length;
  const profileCompletion = Math.round((profileFields / 5) * 100);
  const connectedTherapists = connections.filter((connection) => connection.status === 'connected').length;
  const pendingTherapists = connections.filter((connection) => connection.status === 'pending').length;

  const missingProfileItems = PROFILE_REQUIREMENTS.filter(({ key }) => {
    const value = profile?.[key as keyof UserProfile];
    return typeof value === 'string' ? value.trim().length === 0 : !value;
  });
  const isProfileComplete = missingProfileItems.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const missingInForm: string[] = [];

      if (!formData.username.trim()) missingInForm.push('Username');
      if (!formData.name.trim()) missingInForm.push('Full name');
      if (!formData.phone.trim()) missingInForm.push('Phone number');
      if (!formData.dateOfBirth) missingInForm.push('Date of birth');

      if (missingInForm.length > 0) {
        throw new Error(`Please complete: ${missingInForm.join(', ')}`);
      }

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

      window.dispatchEvent(new Event('patient-profile-updated'));

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
    if (!isProfileComplete) {
      alert('Complete your profile first to unlock reviews.');
      return;
    }

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
    if (!isProfileComplete) {
      alert('Complete your profile first to unlock questions.');
      return;
    }

    if (!newQuestion.trim() || isSubmitting) return;
  
    setIsSubmitting(true);
  
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be signed in to ask a question.');
      }

      const questionText = newQuestion.trim();

      const { error } = await supabase
        .from('questions')
        .insert({
          user_id: user.id,
          question: questionText,
          status: 'pending',
        });

      if (error) throw error;

      setNewQuestion('');
      await loadQuestions();
      setQuestionToast('Question submitted successfully. It is now awaiting an answer.');

      if (questionToastTimerRef.current) {
        window.clearTimeout(questionToastTimerRef.current);
      }

      questionToastTimerRef.current = window.setTimeout(() => {
        setQuestionToast(null);
      }, 3000);
    } catch (error) {
      console.error("❌ Error submitting question:", error);
      alert("Failed to submit question");
    } finally {
      setIsSubmitting(false); 
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-cyan-700"></div>
      </div>
    );
  }

  return (
    <div className="content-shell py-8 lg:py-10 space-y-6">
      {questionToast && (
        <div className="fixed right-4 top-24 z-[80] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-lg dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          {questionToast}
        </div>
      )}

      <div className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-6 md:px-8 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200">
                <UserRound className="h-3.5 w-3.5" />
                Patient Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">My Profile</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Review your profile details, manage your account, share feedback, and keep track of your questions in one place.
              </p>
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

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Profile completeness</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{profileCompletion}%</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{profileFields}/5 fields completed</p>
                </div>
                <Sparkles className="h-8 w-8 text-cyan-700" />
              </div>
            </div>

            <div className="surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Connected therapists</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{connectedTherapists}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Active care connections</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>
            </div>

            <div className="surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pending requests</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingTherapists}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Waiting for therapist approval</p>
                </div>
                <Clock3 className="h-8 w-8 text-amber-600" />
              </div>
            </div>

            <div className="surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Questions asked</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{questions.length}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Messages in your support queue</p>
                </div>
                <MessageSquareText className="h-8 w-8 text-cyan-700" />
              </div>
            </div>
          </div>

          {!isProfileComplete && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Complete your profile to unlock Chat, Reviews, and Questions.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {missingProfileItems.map((item) => (
                  <li
                    key={item.key}
                    className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-200"
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-primary mt-4"
              >
                <Edit3 className="h-4 w-4" />
                Complete Profile Now
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
          <div className="border-b border-slate-200 bg-white px-6 py-6 lg:border-b-0 lg:border-r md:px-8 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img
                  src={profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=320&h=320&fit=crop'}
                  alt="Profile"
                  className="h-36 w-36 rounded-full object-cover shadow-lg"
                />
                <div className="absolute bottom-2 right-2 rounded-full border border-slate-200 bg-white p-2 shadow-md dark:border-slate-700 dark:bg-slate-900">
                  <Camera className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </div>
              </div>

              <div className="mt-5">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{profile?.name || 'No name set'}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">@{profile?.username || 'Username not set'}</p>
              </div>

              <div className="mt-5 grid w-full gap-3 text-left">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <Mail className="h-4 w-4 text-cyan-700" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</span>
                  </div>
                  <p className="mt-2 break-all text-sm font-medium text-slate-900 dark:text-slate-100">{userEmail || 'Not available'}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <Phone className="h-4 w-4 text-cyan-700" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Phone</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{profile?.phone || 'Not set'}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <CalendarDays className="h-4 w-4 text-cyan-700" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Age</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {profile?.date_of_birth ? `${calculateAge(profile.date_of_birth)} years old` : 'Not set'}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-left dark:border-cyan-900 dark:bg-cyan-950">
                <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-200">
                  <Activity className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Care status</p>
                </div>
                <p className="mt-2 text-sm text-cyan-950 dark:text-cyan-100">
                  {connectedTherapists > 0
                    ? 'You are connected with therapists and can continue your care journey from the chat workspace.'
                    : 'Connect with a therapist to begin guided support and secure chat.'}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {connections.map((connection) => (
                <div key={connection.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <img
                      src={connection.doctor?.profile_picture || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop'}
                      alt={connection.doctor?.name || 'Therapist'}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{connection.doctor?.name || 'Therapist'}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{connection.doctor?.profession || 'Therapist'}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        connection.status === 'connected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {connection.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 bg-slate-50 px-6 py-6 md:px-8 dark:bg-slate-900">
            <div className="surface-card overflow-hidden p-6">
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 dark:border-cyan-900 dark:bg-cyan-950/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="h-5 w-5 text-cyan-700" />
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Rate & Review</h3>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Share how your experience has been so far.</p>
                  </div>
                  <div className="rounded-xl border border-cyan-200 bg-white px-4 py-2 text-center dark:border-cyan-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Current rating</p>
                    <p className="mt-1 text-lg font-bold text-cyan-800">{reviewData.rating || 0}/5</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">Select your rating</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                        className={`flex items-center justify-center rounded-xl border p-3 transition ${
                          star <= reviewData.rating
                            ? 'border-amber-300 bg-amber-50 text-amber-500'
                            : 'border-slate-200 bg-white text-slate-300 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-cyan-700 dark:hover:bg-cyan-950 dark:hover:text-cyan-300'
                        }`}
                      >
                        {star <= reviewData.rating ? (
                          <Star className="h-6 w-6 fill-current" />
                        ) : (
                          <StarOff className="h-6 w-6" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">Your review</label>
                  <textarea
                    value={reviewData.review_text}
                    onChange={(e) => setReviewData({ ...reviewData, review_text: e.target.value })}
                    className="min-h-[150px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-900"
                    rows={5}
                    placeholder="Describe how MindHaven has helped you and what could be improved..."
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Helpful feedback helps us improve care quality.</p>
                </div>

                <button
                  onClick={handleReviewSubmit}
                  disabled={!isProfileComplete || savingReview || !reviewData.rating || !reviewData.review_text.trim()}
                  className="btn-primary disabled:opacity-60"
                >
                  {savingReview ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {savingReview ? 'Saving...' : review ? 'Update Review' : 'Submit Review'}
                </button>

                {!isProfileComplete && (
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Complete your profile first to submit or update a review.
                  </p>
                )}
              </div>
            </div>

            <div className="surface-card overflow-hidden p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Questions</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Ask follow-up questions and track answers in one feed.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    <MessageCircle className="h-3.5 w-3.5 text-cyan-700" />
                    {questions.length} total
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 dark:border-cyan-900 dark:bg-cyan-950/40">
                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-900"
                    disabled={!isProfileComplete || isSubmitting}
                  />
                  <button
                    onClick={handleQuestionSubmit}
                    disabled={!isProfileComplete || isSubmitting || !newQuestion.trim()}
                    className="btn-primary disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                    {isSubmitting ? 'Submitting...' : 'Ask'}
                  </button>
                </div>

                {!isProfileComplete && (
                  <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-300">
                    Complete your profile first to ask questions.
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-4">
                {questions.length > 0 ? questions.map((question) => (
                  <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-cyan-100 p-2 text-cyan-700">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{question.question}</p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                              question.answer ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {question.answer ? 'Answered' : 'Pending'}
                          </span>
                        </div>
                        {question.answer ? (
                          <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/50 p-3 dark:border-cyan-900 dark:bg-cyan-950/30">
                            <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{question.answer}</p>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-300">Awaiting answer...</p>
                        )}
                        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">{new Date(question.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    No questions yet. Submit your first support question above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4 rounded-t-3xl border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-900">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit profile</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Update the details visible on your patient profile.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close profile editor"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-6 overflow-y-auto p-6">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <Edit3 className="h-3.5 w-3.5" />
                    Protected account fields are locked after first save
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Profile Picture URL</label>
                    <input
                      type="url"
                      value={formData.profile_picture}
                      onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-900"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 ${profile?.username ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : 'focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:border-cyan-500 dark:focus:ring-cyan-900'}`}
                      disabled={!!profile?.username}
                      placeholder={profile?.username ? undefined : 'Choose a username'}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <input
                      type="email"
                      value={userEmail || ''}
                      disabled
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${profile?.date_of_birth ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : 'focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:border-cyan-500 dark:focus:ring-cyan-900'}`}
                      disabled={!!profile?.date_of_birth}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-cyan-700" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Change password</h3>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Leave blank if you do not want to update your password.</p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-subtle"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;