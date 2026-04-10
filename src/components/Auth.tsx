import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, LogIn } from 'lucide-react';

interface AuthProps {
  onSuccess?: () => void;
}

const Auth = ({ onSuccess }: AuthProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
      setError('Invalid email format');
      setLoading(false);
      return;
    }

    const domain = emailParts[1].split('.')[0];

    if (domain === 'admin' || domain === 'doc') {
      setError('This login is for patients only.');
      setLoading(false);
      return;
    }

    try {
      let authResponse;

      if (isSignUp) {
        authResponse = await supabase.auth.signUp({ email, password });
      } else {
        authResponse = await supabase.auth.signInWithPassword({ email, password });
      }

      if (authResponse.error) throw authResponse.error;

      if (authResponse.data.user) {
        if (onSuccess) onSuccess();
        navigate('/profile');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) return alert("Please enter your email");
  
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
  
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Password reset link sent! Check your email.");
      setShowForgotPassword(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="surface-card w-full max-w-md p-8">
        
        {/* Title */}
        <h2 className="mb-6 text-center text-3xl font-bold text-slate-900">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 text-center text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-colors duration-200 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-colors duration-200 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </>
              )}
            </button>
          </div>

          {/* Forgot Password */}
          {!isSignUp && (
            <p className="mt-3 text-center text-sm text-gray-700">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-semibold text-cyan-700 transition-colors duration-200 hover:text-cyan-900 hover:underline"
              >
                Forgot Password?
              </button>
            </p>
          )}

          {/* Toggle Sign Up / Sign In */}
          <p className="mt-4 text-center text-sm text-gray-700">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-cyan-700 transition-colors duration-200 hover:text-cyan-900 hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="surface-card relative w-96 p-6 text-center">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold text-gray-800">Reset Password</h3>
            <p className="text-gray-600 text-sm mt-1">
              Enter your email and we'll send you a reset link.
            </p>
            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 shadow-sm focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            />

            {/* Send Reset Link Button */}
            <button
              onClick={handlePasswordReset}
              className="btn-primary mt-4 w-full py-2 text-lg"
            >
              Send Reset Link
            </button>
          </div>
        </div>
      )}

    </div>

  );
};

export default Auth;
