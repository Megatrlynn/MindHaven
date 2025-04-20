import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login = () => {
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
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-4xl font-extrabold text-gray-900 drop-shadow-md">
          {loading ? "Signing In..." : "Admin/Therapist Login"}
        </h2>
        <p className="mt-2 text-center text-lg text-gray-600">
          Access your dashboard to manage your related data
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/40">
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg shadow-md">
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 bg-white shadow-sm transition-all duration-300 placeholder-gray-400 text-gray-900"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 bg-white shadow-sm transition-all duration-300 placeholder-gray-400 text-gray-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 rounded-lg shadow-lg bg-blue-600 text-white font-semibold text-lg transition-all duration-300 hover:bg-blue-700 active:scale-95 disabled:bg-blue-300"
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
              <span className="px-4 bg-white text-gray-500 shadow-md rounded-full py-1">
                Other login options
              </span>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-700">Are you a patient?</p>
              <Link 
                to="/patient-login" 
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium transition-all duration-300 hover:underline"
              >
                Go to Patient Login
              </Link>
            </div>
          </div>

          {/* Email Format Guide */}
          <div className="mt-8">
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 shadow-md rounded-full py-1">
                Email format guide
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="text-center text-sm text-gray-700 bg-gray-100 p-3 rounded-lg shadow">
                <code className="font-semibold text-gray-800">username@admin.com</code>
                <p className="mt-1">For admins</p>
              </div>
              <div className="text-center text-sm text-gray-700 bg-gray-100 p-3 rounded-lg shadow">
                <code className="font-semibold text-gray-800">username@doc.com</code>
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