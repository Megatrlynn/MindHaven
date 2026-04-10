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
    <div className="flex min-h-screen flex-col justify-center bg-slate-100 px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 shadow-sm">
        <KeyRound className="h-6 w-6 text-cyan-700" />
            </div>
        <h2 className="mt-6 text-center text-4xl font-extrabold text-slate-900">
            Reset your password
            </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="surface-card rounded-2xl p-8">
            {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-100 p-4">
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
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-colors duration-200 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    placeholder="Enter your new password"
                    />
                </div>
                </div>

                <div>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full px-4 py-3 text-lg disabled:cursor-not-allowed disabled:opacity-60"
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