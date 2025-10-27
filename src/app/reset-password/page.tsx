'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('Reset Password Page Loaded. URL:', window.location.href);
    console.log('Raw Hash:', window.location.hash);
    
    const handleReset = async () => {
      try {
        // Parse hash manually
        const hash = window.location.hash.replace('#', '');
        console.log('Parsed Hash:', hash);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);

        // Check existing session first
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial Session:', session);

        if (!accessToken && !session) {
          setError('No access token found in URL and no active session. Please use a valid reset link.');
          setLoading(false);
          return;
        }

        // If token exists, try setting session
        if (accessToken) {
          console.log('Attempting to set session with access_token');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (sessionError) {
            console.error('Session Error:', sessionError);
            throw sessionError;
          }
        }

        // Verify session after setting (or if already present)
        const { data: { session: updatedSession } } = await supabase.auth.getSession();
        console.log('Session after set:', updatedSession);

        if (!updatedSession) {
          setError('Failed to establish session. Link may be invalid or expired.');
          setLoading(false);
          return;
        }

        // Verify user
        const { error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('User Error:', userError);
          throw userError;
        }

        setLoading(false);
      } catch (error: any) {
        console.error('Reset Error:', error);
        setError(error?.message || 'Failed to validate reset link');
        setLoading(false);
      }
    };
    handleReset();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('Update Password Error:', error);
        throw error;
      }
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => router.push('/'), 2000);
    } catch (error: any) {
      console.error('Submit Error:', error);
      setError(error?.message || 'Failed to update password');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="new-password" className="block text-gray-700 mb-2">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {message && <p className="text-green-500 mb-4">{message}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}