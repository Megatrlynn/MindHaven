import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePageSEO } from '../hooks/usePageSEO';

const Login = () => {
  usePageSEO({
    title: 'Admin and Therapist Login | MindHaven',
    description: 'Sign in as an administrator or therapist to manage care, users, and platform operations in MindHaven.',
    path: '/login',
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    const domain = parts[1].split('.')[0];
    return domain === 'admin' || domain === 'doc';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Invalid email format. Use user@admin.com or user@doc.com');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const domain = email.split('@')[1].split('.')[0];
        if (domain === 'admin') {
          navigate('/admin');
        } else if (domain === 'doc') {
          navigate('/doctor');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-100 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-4xl font-extrabold text-slate-900">
          {loading ? "Signing In..." : "Admin/Therapist Login"}
        </h2>
        <p className="mt-2 text-center text-lg text-slate-600">
          Access your dashboard to manage your related data
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="surface-card p-8">
          
          {error && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-4 text-red-700">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
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
                  placeholder="user@admin.com or user@doc.com"
                />
              </div>
            </div>

            {/* Password Input */}
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

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Other Login Options */}
          <div className="mt-8">
            <div className="relative flex justify-center text-sm">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-1 text-slate-500 shadow-sm">
                Other login options
              </span>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-700">Are you a patient?</p>
              <Link 
                to="/patient-login" 
                className="mt-2 font-medium text-cyan-700 transition-colors duration-200 hover:text-cyan-900 hover:underline"
              >
                Go to Patient Login
              </Link>
            </div>
          </div>

          {/* Email Format Guide */}
          <div className="mt-8">
            <div className="relative flex justify-center text-sm">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-1 text-slate-500 shadow-sm">
                Email format guide
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-700 shadow-sm">
                <code className="font-semibold text-slate-800">username@admin.com</code>
                <p className="mt-1">For admins</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-700 shadow-sm">
                <code className="font-semibold text-slate-800">username@doc.com</code>
                <p className="mt-1">For therapists</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

  );
};

export default Login;