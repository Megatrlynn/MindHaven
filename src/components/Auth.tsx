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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br">
      <div className="max-w-md w-full bg-white/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/40">
        
        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-center shadow-md">
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 bg-white shadow-sm transition-all duration-300 placeholder-gray-400 text-gray-900"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 bg-white shadow-sm transition-all duration-300 placeholder-gray-400 text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 rounded-lg shadow-lg bg-blue-600 text-white font-semibold text-lg transition-all duration-300 hover:bg-blue-700 active:scale-95 disabled:bg-blue-300"
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
                className="text-blue-600 font-semibold hover:underline hover:text-blue-800 transition-all duration-300"
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
              className="text-blue-600 font-semibold hover:underline hover:text-blue-800 transition-all duration-300"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-96 text-center relative">
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
              className="w-full mt-4 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 text-gray-900 shadow-sm"
            />

            {/* Send Reset Link Button */}
            <button
              onClick={handlePasswordReset}
              className="w-full mt-4 py-2 rounded-lg shadow-lg bg-blue-600 text-white font-semibold text-lg transition-all duration-300 hover:bg-blue-700 active:scale-95"
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
