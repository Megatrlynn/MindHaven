import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { KeyRound, Loader2 } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('No reset token found. Please request a new password reset link.');
      return;
    }

    const verifyToken = async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        });

        if (error) {
          setError('Invalid or expired reset token. Please request a new password reset link.');
        }
      } catch (err) {
        setError('Error verifying reset token. Please try again.');
      }
    };

    verifyToken();
  }, [searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!newPassword) {
      setError("Please enter a new password.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      alert('Password successfully reset! Please log in with your new password.');
      navigate('/login');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 shadow-xl">
            <KeyRound className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900 drop-shadow-md">
            Reset your password
            </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/40">
            {error && (
                <div className="mb-4 rounded-md bg-red-100 p-4">
                <div className="text-sm text-red-700">{error}</div>
                </div>
            )}

            <form className="space-y-6" onSubmit={handlePasswordReset}>
                <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    New Password
                </label>
                <div className="mt-1">
                    <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 bg-white shadow-sm placeholder-gray-400 text-gray-900 transition-all duration-300"
                    placeholder="Enter your new password"
                    />
                </div>
                </div>

                <div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow-lg transition-all duration-300 hover:bg-blue-700 active:scale-95 disabled:bg-blue-300"
                >
                    {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Resetting Password...
                    </>
                    ) : (
                    'Reset Password'
                    )}
                </button>
                </div>
            </form>
            </div>
        </div>
    </div>

  );
};

export default ResetPassword;